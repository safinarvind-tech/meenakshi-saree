import { markRazorpayPaid } from "@/lib/orders";
import { verifyWebhookSignature } from "@/lib/razorpay";

type WebhookEvent = {
  event: string;
  payload?: { payment?: { entity?: { id: string; order_id?: string } } };
};

/**
 * Razorpay webhook (set in Razorpay Dashboard → Webhooks, events: payment.captured, order.paid).
 * Confirms payments even if the customer closed the browser before returning to the site.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";
  if (!verifyWebhookSignature(raw, signature)) return new Response("Invalid signature", { status: 401 });

  const event = JSON.parse(raw) as WebhookEvent;
  if (event.event === "payment.captured" || event.event === "order.paid") {
    const payment = event.payload?.payment?.entity;
    if (payment?.order_id) await markRazorpayPaid(payment.order_id, payment.id);
  }
  return Response.json({ ok: true });
}
