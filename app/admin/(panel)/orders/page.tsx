import Link from "next/link";
import { Suspense } from "react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { releaseAbandonedOrders } from "@/lib/orders";
import { formatDate, formatINR, orderNumber } from "@/lib/format";
import { Empty, OrderBadge, PageHeader, PaymentBadge, TableSkeleton, Tabs, td, th } from "@/components/admin/ui";
import type { OrderStatus, Prisma } from "@/generated/prisma/client";

export const metadata = { title: "Orders" };

const STATUSES: OrderStatus[] = ["PENDING", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED"];

export default function OrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  return (
    <>
      <PageHeader title="Orders" />
      <Suspense fallback={<TableSkeleton />}>
        <OrderList searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function OrderList({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  await releaseAbandonedOrders();
  const sp = await searchParams;
  const status = typeof sp.status === "string" && STATUSES.includes(sp.status as OrderStatus) ? (sp.status as OrderStatus) : undefined;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const numberMatch = q.toUpperCase().replace(/^SM0*/, "");

  const where: Prisma.OrderWhereInput = {
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            ...(/^\d+$/.test(numberMatch) ? [{ number: Number(numberMatch) }] : []),
            { phone: { contains: q.replace(/\D/g, "") || q } },
            { name: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };
  const [orders, counts] = await Promise.all([
    db.order.findMany({ where, orderBy: { createdAt: "desc" }, take: 100, include: { _count: { select: { items: true } } } }),
    db.order.groupBy({ by: ["status"], _count: true }),
  ]);
  const count = (s: OrderStatus) => counts.find((c) => c.status === s)?._count ?? 0;

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <Tabs
          items={[
            { href: "/admin/orders", label: "All", active: !status },
            ...STATUSES.map((s) => ({ href: `/admin/orders?status=${s}`, label: s.charAt(0) + s.slice(1).toLowerCase(), active: status === s, count: count(s) })),
          ]}
        />
        <form className="mb-5 w-full sm:w-auto">
          {status && <input type="hidden" name="status" value={status} />}
          <input name="q" defaultValue={q} placeholder="Order no., phone or name" className="field w-full py-2 sm:w-64" />
        </form>
      </div>
      {orders.length === 0 ? (
        <Empty>No orders yet.</Empty>
      ) : (
        <>
        <ul className="divide-y divide-line/60 overflow-hidden rounded-2xl bg-white md:hidden">
          {orders.map((o) => (
            <li key={o.id}>
              <Link href={`/admin/orders/${o.id}`} className="block p-4 active:bg-cream">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium">{orderNumber(o.number)}</span>
                  <OrderBadge status={o.status} />
                </div>
                <div className="mt-1 flex items-center justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate">
                    {o.name} <span className="text-muted">· {o.phone}</span>
                  </span>
                  <span className="shrink-0 font-medium">{formatINR(o.total)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3 text-xs text-muted">
                  <span>
                    {formatDate(o.createdAt)} · {o._count.items} item{o._count.items > 1 ? "s" : ""}
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5">
                    {o.paymentMethod === "COD" ? "COD" : "Online"} <PaymentBadge status={o.paymentStatus} />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
        <div className="hidden overflow-x-auto rounded-2xl bg-white md:block">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="border-b border-line">
              <tr>
                <th className={th}>Order</th>
                <th className={th}>Date</th>
                <th className={th}>Customer</th>
                <th className={th}>Total</th>
                <th className={th}>Payment</th>
                <th className={th}>Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-cream/60">
                  <td className={td}>
                    <Link href={`/admin/orders/${o.id}`} className="font-medium hover:underline">
                      {orderNumber(o.number)}
                    </Link>
                    <span className="block text-xs text-muted">{o._count.items} item{o._count.items > 1 ? "s" : ""}</span>
                  </td>
                  <td className={td}>{formatDate(o.createdAt)}</td>
                  <td className={td}>
                    {o.name}
                    <span className="block text-xs text-muted">{o.phone}</span>
                  </td>
                  <td className={td}>{formatINR(o.total)}</td>
                  <td className={td}>
                    <span className="mr-2 text-xs text-muted">{o.paymentMethod === "COD" ? "COD" : "Online"}</span>
                    <PaymentBadge status={o.paymentStatus} />
                  </td>
                  <td className={td}>
                    <OrderBadge status={o.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
    </>
  );
}
