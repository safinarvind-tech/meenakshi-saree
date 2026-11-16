import { Suspense } from "react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { formatDate, formatINR } from "@/lib/format";
import { Card, Empty, PageHeader, TableSkeleton, td, th } from "@/components/admin/ui";
import { SmallForm } from "@/components/admin/SmallForm";
import { createCoupon, toggleCoupon } from "../settings-actions";

export const metadata = { title: "Coupons" };

export default function CouponsPage() {
  return (
    <>
      <PageHeader title="Coupons" />
      <Suspense fallback={<TableSkeleton />}>
        <Coupons />
      </Suspense>
    </>
  );
}

async function Coupons() {
  await requireAdmin();
  const coupons = await db.coupon.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <div className="space-y-6">
      <Card>
        <h2 className="mb-3 font-serif text-lg">New coupon</h2>
        <SmallForm action={createCoupon} submitLabel="Create coupon" resetOnSuccess>
          <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <input name="code" required placeholder="CODE e.g. DIWALI10" aria-label="Code" className="field col-span-2 py-2 uppercase sm:col-span-1" />
            <select name="type" aria-label="Type" className="field py-2">
              <option value="PERCENT">% off</option>
              <option value="FLAT">₹ off</option>
            </select>
            <input name="value" required placeholder="Value (10 or 500)" aria-label="Value" className="field py-2" />
            <input name="minOrder" placeholder="Min order ₹ (optional)" aria-label="Minimum order" className="field py-2" />
            <input name="maxUses" type="number" min={1} placeholder="Max uses (optional)" aria-label="Maximum uses" className="field py-2" />
            <input name="expiresAt" type="date" aria-label="Expires on" title="Expires on" className="field col-span-2 py-2 sm:col-span-1" />
          </div>
        </SmallForm>
      </Card>
      {coupons.length === 0 ? (
        <Empty>No coupons yet.</Empty>
      ) : (
        <>
        <ul className="divide-y divide-line/60 overflow-hidden rounded-2xl bg-white md:hidden">
          {coupons.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 p-4">
              <span className="min-w-0">
                <span className="block font-medium tracking-wide">{c.code}</span>
                <span className="block text-sm">
                  {c.type === "PERCENT" ? `${c.value}% off` : `${formatINR(c.value)} off`}
                  {c.minOrder ? <span className="text-muted"> · above {formatINR(c.minOrder)}</span> : null}
                </span>
                <span className="block text-xs text-muted">
                  Used {c.usedCount}
                  {c.maxUses ? ` / ${c.maxUses}` : ""} · {c.expiresAt ? `expires ${formatDate(c.expiresAt)}` : "never expires"}
                </span>
              </span>
              <form action={toggleCoupon.bind(null, c.id)} className="shrink-0">
                <button className={`rounded-full px-3 py-1.5 text-xs font-medium ${c.active ? "bg-emerald-100 text-emerald-800" : "bg-stone-200 text-stone-600"}`}>
                  {c.active ? "Active · turn off" : "Off · turn on"}
                </button>
              </form>
            </li>
          ))}
        </ul>
        <div className="hidden overflow-x-auto rounded-2xl bg-white md:block">
          <table className="w-full min-w-[700px] text-sm">
            <thead className="border-b border-line">
              <tr>
                <th className={th}>Code</th>
                <th className={th}>Discount</th>
                <th className={th}>Min order</th>
                <th className={th}>Used</th>
                <th className={th}>Expires</th>
                <th className={th}>Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {coupons.map((c) => (
                <tr key={c.id}>
                  <td className={`${td} font-medium`}>{c.code}</td>
                  <td className={td}>{c.type === "PERCENT" ? `${c.value}% off` : `${formatINR(c.value)} off`}</td>
                  <td className={td}>{c.minOrder ? formatINR(c.minOrder) : "—"}</td>
                  <td className={td}>
                    {c.usedCount}
                    {c.maxUses ? ` / ${c.maxUses}` : ""}
                  </td>
                  <td className={td}>{c.expiresAt ? formatDate(c.expiresAt) : "Never"}</td>
                  <td className={td}>
                    <form action={toggleCoupon.bind(null, c.id)}>
                      <button className={`rounded-full px-3 py-1 text-xs font-medium ${c.active ? "bg-emerald-100 text-emerald-800" : "bg-stone-200 text-stone-600"}`}>
                        {c.active ? "Active · turn off" : "Off · turn on"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
    </div>
  );
}
