"use server";

import { db } from "@/lib/db";
import { orderNumber } from "@/lib/format";
import { cancelOrder, cartSchema, checkoutSchema, CheckoutError, createOrder, priceCart } from "@/lib/orders";
import { createRazorpayOrder, razorpayEnabled } from "@/lib/razorpay";

export type CheckoutState = {
  ok?: boolean;
  error?: string;
  errors?: Record<string, string>;
  orderId?: string;
  razorpay?: { keyId: string; orderId: string; amount: number; name: string; phone: string; email?: string };
};

function parseCart(raw: FormDataEntryValue | null) {
  try {
    return cartSchema.safeParse(JSON.parse(String(raw ?? "[]")));
  } catch {
    return cartSchema.safeParse([]);
  }
}

export async function placeOrder(_prev: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const fields = checkoutSchema.safeParse(Object.fromEntries(formData));
  if (!fields.success) {
    const errors: Record<string, string> = {};
    for (const issue of fields.error.issues) errors[String(issue.path[0])] ??= issue.message;
    return { errors, error: "Please check the highlighted fields." };
  }
  const cart = parseCart(formData.get("cart"));
  if (!cart.success) return { error: "Your bag is empty or has an invalid item. Please refresh and try again." };
  if (fields.data.payment === "RAZORPAY" && !razorpayEnabled()) return { error: "Online payment is not available right now. Please choose Cash on Delivery." };

  let order;
  try {
    order = await createOrder(fields.data, cart.data);
  } catch (e) {
    if (e instanceof CheckoutError) return { error: e.message };
    console.error("Checkout failed", e);
    return { error: "Something went wrong while placing your order. Please try again." };
  }

  if (order.paymentMethod === "COD") return { ok: true, orderId: order.id };

  try {
    const rzp = await createRazorpayOrder(order.total, orderNumber(order.number));
    await db.order.update({ where: { id: order.id }, data: { razorpayOrderId: rzp.id } });
    return {
      ok: true,
      orderId: order.id,
      razorpay: {
        keyId: process.env.RAZORPAY_KEY_ID!,
        orderId: rzp.id,
        amount: rzp.amount,
        name: order.name,
        phone: order.phone,
        email: order.email ?? undefined,
      },
    };
  } catch (e) {
    console.error("Razorpay order creation failed", e);
    await cancelOrder(order.id, "Razorpay order could not be created.");
    return { error: "We couldn't start the online payment. Please try again or choose Cash on Delivery." };
  }
}

export type QuoteState = { subtotal?: number; discount?: number; shipping?: number; total?: number; couponError?: string; error?: string };

/** Live price preview for the checkout summary (same rules as the real order). */
export async function quoteCart(cartJson: string, coupon?: string): Promise<QuoteState> {
  const cart = parseCart(cartJson);
  if (!cart.success) return { error: "Your bag is empty." };
  try {
    const q = await priceCart(cart.data, coupon?.trim().toUpperCase() || undefined);
    return { subtotal: q.subtotal, discount: q.discount, shipping: q.shipping, total: q.total, couponError: q.couponError };
  } catch (e) {
    if (e instanceof CheckoutError) return { error: e.message };
    throw e;
  }
}
