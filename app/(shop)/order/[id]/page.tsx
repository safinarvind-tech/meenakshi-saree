import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { CheckCircle2, Clock } from "lucide-react";
import { db } from "@/lib/db";
import { formatDate, formatINR, orderNumber } from "@/lib/format";

export const metadata: Metadata = { title: "Order confirmation", robots: { index: false } };

export default function OrderPage({ params }: PageProps<"/order/[id]">) {
  return (
    <div className="mx-auto mt-6 max-w-3xl px-3 sm:mt-10 sm:px-4">
      <Suspense fallback={<div className="h-96 animate-pulse rounded-[var(--radius-card)] bg-white" />}>
        <OrderDetails params={params} />
      </Suspense>
    </div>
  );
}

// The order id is a long random id, so only the person who placed the order has the link.
async function OrderDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await connection();
  const order = await db.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) notFound();

  const paid = order.paymentStatus === "PAID";
  const awaitingOnline = order.paymentMethod === "RAZORPAY" && !paid && order.status !== "CANCELLED";

  return (
    <div className="rounded-[var(--radius-panel)] bg-white p-6 sm:p-10">
      <div className="text-center">
        {awaitingOnline ? <Clock className="mx-auto size-12 text-gold" strokeWidth={1.4} /> : <CheckCircle2 className="mx-auto size-12 text-olive" strokeWidth={1.4} />}
        <h1 className="h-display mt-4 text-[34px] sm:text-5xl">
          {order.status === "CANCELLED" ? "Order cancelled" : awaitingOnline ? "Awaiting payment" : <>Thank you, <em className="text-terra">{order.name.split(" ")[0]}</em></>}
        </h1>
        <p className="mt-3 text-muted">
          Order <b className="text-ink">{orderNumber(order.number)}</b> · {formatDate(order.createdAt)}
        </p>
        <p className="mx-auto mt-4 max-w-md leading-relaxed">
          {order.status === "CANCELLED"
            ? "This order was cancelled. If you paid, the amount will be refunded to your original payment method."
            : order.paymentMethod === "COD"
              ? "We'll call you on " + order.phone + " to confirm your order before we ship it."
              : paid
                ? "Your payment was successful. We'll send updates on WhatsApp as your saree is packed and shipped."
                : "We haven't received confirmation of your payment yet. This page will update once it arrives."}
        </p>
      </div>

      <ul className="mt-10 divide-y divide-line border-y border-line">
        {order.items.map((item) => (
          <li key={item.id} className="flex gap-4 py-4">
            <span className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-oat">
              {item.image && <Image src={item.image} alt="" fill sizes="80px" className="object-cover object-top" />}
            </span>
            <div className="flex-1">
              <p className="font-serif text-lg">{item.name}</p>
              <p className="text-sm text-muted">
                {[item.blouseOption, ...item.addOns].filter(Boolean).join(" · ")} · Qty {item.quantity}
              </p>
            </div>
            <span>{formatINR(item.unitPrice * item.quantity)}</span>
          </li>
        ))}
      </ul>

      <dl className="mt-6 ml-auto max-w-xs space-y-2 text-[15px]">
        <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatINR(order.subtotal)}</dd></div>
        {order.discount > 0 && <div className="flex justify-between"><dt className="text-muted">Discount ({order.couponCode})</dt><dd>− {formatINR(order.discount)}</dd></div>}
        <div className="flex justify-between"><dt className="text-muted">Shipping</dt><dd>{order.shippingFee ? formatINR(order.shippingFee) : "Free"}</dd></div>
        <div className="flex justify-between border-t border-line pt-2 text-lg font-medium"><dt>Total</dt><dd>{formatINR(order.total)}</dd></div>
        <div className="flex justify-between text-sm"><dt className="text-muted">Payment</dt><dd>{order.paymentMethod === "COD" ? "Cash on Delivery" : paid ? "Paid online" : "Online (pending)"}</dd></div>
      </dl>

      <div className="mt-8 rounded-2xl bg-cream p-5 text-[15px]">
        <p className="mb-1 font-medium">Delivering to</p>
        <p className="text-muted">
          {order.name}, {order.addressLine1}
          {order.addressLine2 ? `, ${order.addressLine2}` : ""}, {order.city}, {order.state} – {order.pincode}
        </p>
      </div>

      <div className="mt-8 text-center">
        <Link href="/shop" className="btn-primary">
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
