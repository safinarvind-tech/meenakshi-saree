import Link from "next/link";
import { Suspense } from "react";
import { AlertTriangle, CalendarClock, IndianRupee, Package, ShoppingCart } from "lucide-react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { releaseAbandonedOrders } from "@/lib/orders";
import { formatDate, formatINR, orderNumber } from "@/lib/format";
import { Card, OrderBadge, PageHeader, TableSkeleton } from "@/components/admin/ui";

export const metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <>
      <PageHeader title="Dashboard" />
      <Suspense fallback={<TableSkeleton />}>
        <Dashboard />
      </Suspense>
    </>
  );
}

async function Dashboard() {
  const admin = await requireAdmin();
  await releaseAbandonedOrders();
  const now = new Date();
  const todayIST = new Date(now.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }) + "T00:00:00+05:30");
  const days30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const live = { status: { notIn: ["CANCELLED" as const] } };

  const [today, month, toProcess, lowStock, bookings, recent] = await Promise.all([
    db.order.aggregate({ where: { ...live, createdAt: { gte: todayIST } }, _count: true, _sum: { total: true } }),
    db.order.aggregate({ where: { ...live, createdAt: { gte: days30 } }, _count: true, _sum: { total: true } }),
    db.order.count({ where: { status: { in: ["PENDING", "CONFIRMED", "PACKED"] } } }),
    db.product.findMany({ where: { status: "ACTIVE", stock: { lte: 1 } }, select: { id: true, name: true, stock: true }, take: 8 }),
    db.videoCallBooking.count({ where: { status: "REQUESTED" } }),
    db.order.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
  ]);

  const stats = [
    { label: "Today's orders", value: String(today._count), sub: formatINR(today._sum.total ?? 0), icon: ShoppingCart, href: "/admin/orders" },
    { label: "Last 30 days", value: formatINR(month._sum.total ?? 0), sub: `${month._count} orders`, icon: IndianRupee, href: "/admin/orders" },
    { label: "To process", value: String(toProcess), sub: "Pending, confirmed, packed", icon: Package, href: "/admin/orders?status=PENDING" },
    { label: "Video calls", value: String(bookings), sub: "Waiting for confirmation", icon: CalendarClock, href: "/admin/bookings" },
  ];

  return (
    <>
      <p className="-mt-4 mb-6 text-muted">Welcome back, {admin.name.split(" ")[0]}.</p>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {stats.map(({ label, value, sub, icon: Icon, href }) => (
          <Link key={label} href={href} className="min-w-0 rounded-2xl bg-white p-4 transition-shadow hover:shadow-md sm:p-5">
            <div className="flex items-center justify-between gap-2 text-[13px] text-muted sm:text-sm">
              {label} <Icon className="size-5 shrink-0 text-gold" strokeWidth={1.6} />
            </div>
            <p className="mt-2 truncate font-serif text-2xl sm:mt-3 sm:text-3xl">{value}</p>
            <p className="mt-1 text-xs text-muted sm:text-sm">{sub}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-xl">Recent orders</h2>
            <Link href="/admin/orders" className="text-sm text-muted hover:text-ink">View all →</Link>
          </div>
          {recent.length === 0 ? (
            <p className="py-8 text-center text-muted">No orders yet. They&apos;ll appear here as soon as customers check out.</p>
          ) : (
            <ul className="divide-y divide-line">
              {recent.map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/orders/${o.id}`} className="flex items-center justify-between gap-4 py-3 text-sm hover:bg-cream/60">
                    <span className="min-w-0">
                      <span className="font-medium">{orderNumber(o.number)}</span> · {o.name}
                      <span className="block text-xs text-muted">{formatDate(o.createdAt)}</span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-3">
                      {formatINR(o.total)} <OrderBadge status={o.status} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <h2 className="mb-4 flex items-center gap-2 font-serif text-xl">
            <AlertTriangle className="size-5 text-terra" strokeWidth={1.6} /> Low stock
          </h2>
          {lowStock.length === 0 ? (
            <p className="text-sm text-muted">All active sarees have stock.</p>
          ) : (
            <ul className="space-y-2.5 text-sm">
              {lowStock.map((p) => (
                <li key={p.id} className="flex justify-between gap-3">
                  <Link href={`/admin/products/${p.id}`} className="hover:underline">{p.name}</Link>
                  <span className={p.stock === 0 ? "text-terra" : "text-muted"}>{p.stock === 0 ? "Sold out" : `${p.stock} left`}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
