import { Suspense } from "react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { formatDate, formatINR } from "@/lib/format";
import { Empty, PageHeader, TableSkeleton, td, th } from "@/components/admin/ui";

export const metadata = { title: "Customers" };

export default function CustomersPage({ searchParams }: PageProps<"/admin/customers">) {
  return (
    <>
      <PageHeader title="Customers" />
      <Suspense fallback={<TableSkeleton />}>
        <Customers searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Customers({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin(["OWNER", "MANAGER"]);
  const q = typeof (await searchParams).q === "string" ? String((await searchParams).q).trim() : "";
  const customers = await db.customer.findMany({
    where: q ? { OR: [{ phone: { contains: q } }, { name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] } : {},
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { orders: { where: { status: { not: "CANCELLED" } }, select: { total: true } } },
  });
  return (
    <>
      <form className="mb-5">
        <input name="q" defaultValue={q} placeholder="Search phone, name or email" className="field w-full py-2 sm:w-72" />
      </form>
      {customers.length === 0 ? (
        <Empty>No customers yet. Customers are created automatically when they place an order.</Empty>
      ) : (
        <>
        <ul className="divide-y divide-line/60 overflow-hidden rounded-2xl bg-white md:hidden">
          {customers.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 p-4">
              <span className="min-w-0">
                <span className="block truncate font-medium">{c.name ?? "—"}</span>
                <a href={`tel:+91${c.phone}`} className="block text-sm text-olive">{c.phone}</a>
                {c.email && <span className="block truncate text-xs text-muted">{c.email}</span>}
              </span>
              <span className="shrink-0 text-right text-sm">
                <span className="block font-medium">{formatINR(c.orders.reduce((s, o) => s + o.total, 0))}</span>
                <span className="block text-xs text-muted">
                  {c.orders.length} order{c.orders.length === 1 ? "" : "s"}
                </span>
                <span className="block text-xs text-muted">since {formatDate(c.createdAt)}</span>
              </span>
            </li>
          ))}
        </ul>
        <div className="hidden overflow-x-auto rounded-2xl bg-white md:block">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-line">
              <tr>
                <th className={th}>Customer</th>
                <th className={th}>Email</th>
                <th className={th}>Orders</th>
                <th className={th}>Total spent</th>
                <th className={th}>Since</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {customers.map((c) => (
                <tr key={c.id}>
                  <td className={td}>
                    {c.name ?? "—"}
                    <span className="block text-xs text-muted">{c.phone}</span>
                  </td>
                  <td className={td}>{c.email ?? "—"}</td>
                  <td className={td}>{c.orders.length}</td>
                  <td className={td}>{formatINR(c.orders.reduce((s, o) => s + o.total, 0))}</td>
                  <td className={td}>{formatDate(c.createdAt)}</td>
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
