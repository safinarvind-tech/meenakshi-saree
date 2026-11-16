import { z } from "zod";
import { db } from "@/lib/db";
import { markRazorpayPaid } from "@/lib/orders";
import { verifyPaymentSignature } from "@/lib/razorpay";

const body = z.object({
  orderId: z.string().min(1),
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

/** Called by the browser after Razorpay Checkout succeeds. The signature proves the payment is genuine. */
export async function POST(req: Request) {
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ ok: false, error: "Invalid request" }, { status: 400 });
  const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data;

  const order = await db.order.findUnique({ where: { id: orderId }, select: { razorpayOrderId: true } });
  if (!order || order.razorpayOrderId !== razorpay_order_id) {
    return Response.json({ ok: false, error: "Order not found" }, { status: 404 });
  }
  if (!verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
    return Response.json({ ok: false, error: "Payment could not be verified" }, { status: 400 });
  }
  await markRazorpayPaid(razorpay_order_id, razorpay_payment_id);
  return Response.json({ ok: true });
}
