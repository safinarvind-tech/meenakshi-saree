import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { MessageCircle, Phone } from "lucide-react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { formatDate, formatINR, orderNumber } from "@/lib/format";
import { Card, OrderBadge, PageHeader, PaymentBadge, TableSkeleton } from "@/components/admin/ui";
import { OrderUpdateForm } from "@/components/admin/OrderUpdateForm";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { cancelOrderAction, updateOrder } from "../actions";

export const metadata = { title: "Order" };

export default function OrderDetailPage({ params }: PageProps<"/admin/orders/[id]">) {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <OrderDetail params={params} />
    </Suspense>
  );
}

async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;
  const order = await db.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) notFound();
  const waNumber = `91${order.phone}`;

  return (
    <>
      <PageHeader title={`Order ${orderNumber(order.number)}`}>
        <Link href="/admin/orders" className="hover:underline">← All orders</Link> · {formatDate(order.createdAt)}
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <OrderBadge status={order.status} />
              <PaymentBadge status={order.paymentStatus} />
              <span className="text-sm text-muted">{order.paymentMethod === "COD" ? "Cash on Delivery" : `Razorpay ${order.razorpayPaymentId ?? ""}`}</span>
            </div>
            <ul className="divide-y divide-line">
              {order.items.map((item) => (
                <li key={item.id} className="flex gap-4 py-3">
                  <span className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-oat">
                    {item.image && <Image src={item.image} alt="" fill sizes="64px" className="object-cover object-top" />}
                  </span>
                  <div className="flex-1 text-sm">
                    {item.productId ? (
                      <Link href={`/admin/products/${item.productId}`} className="font-medium hover:underline">{item.name}</Link>
                    ) : (
                      <span className="font-medium">{item.name}</span>
                    )}
                    <p className="text-muted">SKU {item.sku}</p>
                    <p className="text-muted">{[item.blouseOption, ...item.addOns].filter(Boolean).join(" · ")}</p>
                  </div>
                  <div className="text-right text-sm">
                    <p>{formatINR(item.unitPrice)} × {item.quantity}</p>
                    <p className="font-medium">{formatINR(item.unitPrice * item.quantity)}</p>
                  </div>
                </li>
              ))}
            </ul>
            <dl className="mt-4 ml-auto max-w-xs space-y-1.5 border-t border-line pt-4 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatINR(order.subtotal)}</dd></div>
              {order.discount > 0 && <div className="flex justify-between"><dt className="text-muted">Discount ({order.couponCode})</dt><dd>− {formatINR(order.discount)}</dd></div>}
              <div className="flex justify-between"><dt className="text-muted">Shipping</dt><dd>{formatINR(order.shippingFee)}</dd></div>
              <div className="flex justify-between text-base font-medium"><dt>Total</dt><dd>{formatINR(order.total)}</dd></div>
            </dl>
          </Card>

          <div className="grid gap-6 sm:grid-cols-2">
            <Card>
              <h2 className="mb-3 font-serif text-lg">Customer</h2>
              <p className="font-medium">{order.name}</p>
              <p className="text-sm text-muted">{order.phone}</p>
              {order.email && <p className="text-sm text-muted">{order.email}</p>}
              <div className="mt-4 flex gap-2">
                <a href={`tel:+${waNumber}`} className="btn-outline px-4 py-2 text-sm"><Phone className="size-4" /> Call</a>
                <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noreferrer" className="btn-outline px-4 py-2 text-sm"><MessageCircle className="size-4" /> WhatsApp</a>
              </div>
            </Card>
            <Card>
              <h2 className="mb-3 font-serif text-lg">Ship to</h2>
              <p className="text-sm leading-relaxed">
                {order.name}<br />
                {order.addressLine1}<br />
                {order.addressLine2 && <>{order.addressLine2}<br /></>}
                {order.city}, {order.state} – {order.pincode}<br />
                Phone: {order.phone}
              </p>
            </Card>
          </div>

          {order.customerNote && (
            <Card>
              <h2 className="mb-2 font-serif text-lg">Customer note</h2>
              <p className="text-sm whitespace-pre-line">{order.customerNote}</p>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            {order.status === "CANCELLED" ? (
              <>
                <p className="font-medium">This order is cancelled.</p>
                {order.adminNote && <p className="mt-2 text-sm whitespace-pre-line text-muted">{order.adminNote}</p>}
              </>
            ) : (
              <OrderUpdateForm order={order} action={updateOrder.bind(null, order.id)} />
            )}
          </Card>
          {order.status !== "CANCELLED" && admin.role !== "STAFF" && (
            <Card>
              <h2 className="font-serif text-lg">Cancel order</h2>
              <p className="mt-1 text-sm text-muted">Puts the stock back. Refund online payments from the Razorpay dashboard.</p>
              <form action={cancelOrderAction.bind(null, order.id)}>
                <ConfirmButton message="Cancel this order and put the stock back?" className="btn mt-4 w-full border border-terra text-terra hover:bg-terra hover:text-white">Cancel order</ConfirmButton>
              </form>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
