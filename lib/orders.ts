import { z } from "zod";
import { db } from "@/lib/db";
import { evaluateCoupon } from "@/lib/coupons";
import { ADD_ON_KEYS, ADD_ONS, BLOUSE_KEYS, BLOUSE_OPTIONS, shippingFor, unitPrice } from "@/lib/pricing";
import type { PaymentMethod } from "@/generated/prisma/client";

export const INDIAN_STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh", "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir",
  "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
  "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal",
] as const;

const phone = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s-]/g, "").replace(/^\+?91/, ""))
  .pipe(z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number."));

export const checkoutSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name.").max(80),
  phone,
  email: z.union([z.literal(""), z.email("Enter a valid email address.")]).optional(),
  line1: z.string().trim().min(5, "Enter your house / street address.").max(160),
  line2: z.string().trim().max(160).optional(),
  city: z.string().trim().min(2, "Enter your city.").max(60),
  state: z.enum(INDIAN_STATES, { error: "Choose your state." }),
  pincode: z.string().trim().regex(/^[1-9]\d{5}$/, "Enter a valid 6-digit PIN code."),
  note: z.string().trim().max(500).optional(),
  payment: z.enum(["COD", "RAZORPAY"]),
  coupon: z.string().trim().toUpperCase().max(30).optional(),
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const cartLineSchema = z.object({
  productId: z.string().min(1),
  blouse: z.enum(BLOUSE_KEYS as [string, ...string[]]),
  addOns: z.array(z.enum(ADD_ON_KEYS as [string, ...string[]])).max(ADD_ON_KEYS.length),
  quantity: z.number().int().min(1).max(10),
});
export const cartSchema = z.array(cartLineSchema).min(1, "Your bag is empty.").max(30);
export type CartLine = z.infer<typeof cartLineSchema>;

export class CheckoutError extends Error {}

/** Price the cart from the database (never trust prices sent by the browser). */
export async function priceCart(lines: CartLine[], couponCode?: string) {
  const products = await db.product.findMany({
    where: { id: { in: lines.map((l) => l.productId) }, status: "ACTIVE" },
    include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
  });
  const byId = new Map(products.map((p) => [p.id, p]));
  const priced = lines.map((l) => {
    const p = byId.get(l.productId);
    if (!p) throw new CheckoutError("One of the sarees in your bag is no longer available. Please remove it and try again.");
    const blouse = l.blouse as keyof typeof BLOUSE_OPTIONS;
    const addOns = l.addOns as (keyof typeof ADD_ONS)[];
    return { line: l, product: p, blouse, addOns, unit: unitPrice(p.price, blouse, addOns) };
  });
  const subtotal = priced.reduce((s, x) => s + x.unit * x.line.quantity, 0);

  let discount = 0;
  let coupon = null;
  let couponError: string | undefined;
  if (couponCode) {
    coupon = await db.coupon.findUnique({ where: { code: couponCode } });
    const result = evaluateCoupon(coupon, subtotal);
    if (result.error !== undefined) couponError = result.error;
    else discount = result.discount;
  }
  const shipping = shippingFor(subtotal - discount);
  return { priced, subtotal, discount, shipping, total: subtotal - discount + shipping, coupon: couponError ? null : coupon, couponError };
}

/**
 * Create an order and reserve stock atomically.
 * Stock is decremented with a conditional update, so two people can never buy the last saree.
 */
export async function createOrder(input: CheckoutInput, lines: CartLine[]) {
  const quote = await priceCart(lines, input.coupon || undefined);
  if (input.coupon && quote.couponError) throw new CheckoutError(quote.couponError);

  return db.$transaction(async (tx) => {
    for (const { product, line } of quote.priced) {
      const res = await tx.product.updateMany({
        where: { id: product.id, status: "ACTIVE", stock: { gte: line.quantity } },
        data: { stock: { decrement: line.quantity } },
      });
      if (res.count === 0) throw new CheckoutError(`Sorry, “${product.name}” just sold out. Please remove it from your bag.`);
    }

    if (quote.coupon) {
      const used = await tx.coupon.updateMany({
        where: {
          id: quote.coupon.id,
          ...(quote.coupon.maxUses != null ? { usedCount: { lt: quote.coupon.maxUses } } : {}),
        },
        data: { usedCount: { increment: 1 } },
      });
      if (used.count === 0) throw new CheckoutError("This coupon has just been fully used.");
    }

    const customer = await tx.customer.upsert({
      where: { phone: input.phone },
      update: { name: input.name, ...(input.email ? { email: input.email } : {}) },
      create: { phone: input.phone, name: input.name, email: input.email || null },
    });

    return tx.order.create({
      data: {
        customerId: customer.id,
        name: input.name,
        phone: input.phone,
        email: input.email || null,
        addressLine1: input.line1,
        addressLine2: input.line2 || null,
        city: input.city,
        state: input.state,
        pincode: input.pincode,
        customerNote: input.note || null,
        subtotal: quote.subtotal,
        discount: quote.discount,
        shippingFee: quote.shipping,
        total: quote.total,
        couponCode: quote.coupon?.code ?? null,
        paymentMethod: input.payment as PaymentMethod,
        items: {
          create: quote.priced.map(({ product, line, blouse, addOns, unit }) => ({
            productId: product.id,
            name: product.name,
            sku: product.sku,
            image: product.images[0]?.url ?? null,
            unitPrice: unit,
            quantity: line.quantity,
            blouseOption: BLOUSE_OPTIONS[blouse].label,
            addOns: addOns.map((a) => ADD_ONS[a].label),
          })),
        },
      },
    });
  });
}

/** Cancel an order and put its stock back. Safe to call twice. */
export async function cancelOrder(orderId: string, reason?: string) {
  return db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order || order.status === "CANCELLED") return order;
    for (const item of order.items) {
      if (item.productId) {
        await tx.product.updateMany({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
      }
    }
    if (order.couponCode) {
      await tx.coupon.updateMany({ where: { code: order.couponCode, usedCount: { gt: 0 } }, data: { usedCount: { decrement: 1 } } });
    }
    return tx.order.update({
      where: { id: orderId },
      data: {
        status: "CANCELLED",
        paymentStatus: order.paymentStatus === "PENDING" ? "FAILED" : order.paymentStatus,
        adminNote: [order.adminNote, reason].filter(Boolean).join("\n") || null,
      },
    });
  });
}

/** Mark a Razorpay order as paid (called from checkout verification and from the webhook). Idempotent. */
export async function markRazorpayPaid(razorpayOrderId: string, paymentId: string) {
  const order = await db.order.findUnique({ where: { razorpayOrderId } });
  if (!order) return null;
  if (order.paymentStatus === "PAID") return order;
  const paidAfterCancel = order.status === "CANCELLED";
  return db.order.update({
    where: { id: order.id },
    data: {
      paymentStatus: "PAID",
      razorpayPaymentId: paymentId,
      status: paidAfterCancel ? "CANCELLED" : "CONFIRMED",
      adminNote: paidAfterCancel
        ? [order.adminNote, "⚠ Payment received after the order was auto-cancelled. Check stock, then confirm or refund."].filter(Boolean).join("\n")
        : order.adminNote,
    },
  });
}

/** Online orders that were never paid hold stock. Release them after 30 minutes. */
export async function releaseAbandonedOrders() {
  const cutoff = new Date(Date.now() - 30 * 60 * 1000);
  const stale = await db.order.findMany({
    where: { paymentMethod: "RAZORPAY", paymentStatus: "PENDING", status: "PENDING", createdAt: { lt: cutoff } },
    select: { id: true },
    take: 50,
  });
  for (const o of stale) await cancelOrder(o.id, "Auto-cancelled: online payment not completed within 30 minutes.");
  return stale.length;
}
