import { Suspense } from "react";
import { MessageCircle } from "lucide-react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { Empty, PageHeader, TableSkeleton, td, th } from "@/components/admin/ui";
import { setBookingStatus } from "../settings-actions";

export const metadata = { title: "Video calls" };

const dateOnly = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "Asia/Kolkata" });
const STATUS_STYLE = {
  REQUESTED: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-sky-100 text-sky-800",
  COMPLETED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-stone-200 text-stone-600",
} as const;

export default function BookingsPage() {
  return (
    <>
      <PageHeader title="Video-call bookings" />
      <Suspense fallback={<TableSkeleton />}>
        <Bookings />
      </Suspense>
    </>
  );
}

async function Bookings() {
  await requireAdmin();
  const bookings = await db.videoCallBooking.findMany({ orderBy: [{ preferredDate: "asc" }], take: 200 });
  if (bookings.length === 0) return <Empty>No video-call requests yet.</Empty>;
  return (
    <>
    <ul className="space-y-3 md:hidden">
      {bookings.map((b) => (
        <li key={b.id} className="rounded-2xl bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <span>
              <span className="block font-medium">{b.name}</span>
              <span className="block text-sm text-muted">
                {dateOnly.format(b.preferredDate)} · {b.slot}
              </span>
            </span>
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[b.status]}`}>{b.status.toLowerCase()}</span>
          </div>
          {b.interest && <p className="mt-2 text-sm text-muted">{b.interest}</p>}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <a href={`https://wa.me/91${b.phone}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-2 text-emerald-800">
              <MessageCircle className="size-4" /> WhatsApp
            </a>
            <a href={`tel:+91${b.phone}`} className="rounded-full bg-cream px-3 py-2">Call</a>
            {b.status === "REQUESTED" && (
              <form action={setBookingStatus.bind(null, b.id, "CONFIRMED")}>
                <button className="rounded-full bg-sky-50 px-3 py-2 text-sky-800">Confirm</button>
              </form>
            )}
            {(b.status === "REQUESTED" || b.status === "CONFIRMED") && (
              <>
                <form action={setBookingStatus.bind(null, b.id, "COMPLETED")}>
                  <button className="rounded-full bg-emerald-50 px-3 py-2 text-emerald-800">Done</button>
                </form>
                <form action={setBookingStatus.bind(null, b.id, "CANCELLED")}>
                  <button className="rounded-full px-3 py-2 text-muted">Cancel</button>
                </form>
              </>
            )}
          </div>
        </li>
      ))}
    </ul>
    <div className="hidden overflow-x-auto rounded-2xl bg-white md:block">
      <table className="w-full min-w-[820px] text-sm">
        <thead className="border-b border-line">
          <tr>
            <th className={th}>Date & time</th>
            <th className={th}>Customer</th>
            <th className={th}>Looking for</th>
            <th className={th}>Status</th>
            <th className={th}>Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line/60">
          {bookings.map((b) => (
            <tr key={b.id}>
              <td className={td}>
                {dateOnly.format(b.preferredDate)}
                <span className="block text-xs text-muted">{b.slot}</span>
              </td>
              <td className={td}>
                {b.name}
                <a href={`https://wa.me/91${b.phone}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-olive hover:underline">
                  <MessageCircle className="size-3.5" /> {b.phone}
                </a>
              </td>
              <td className={`${td} max-w-xs text-muted`}>{b.interest ?? "—"}</td>
              <td className={td}>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[b.status]}`}>{b.status.toLowerCase()}</span>
              </td>
              <td className={td}>
                <div className="flex gap-2">
                  {b.status === "REQUESTED" && (
                    <form action={setBookingStatus.bind(null, b.id, "CONFIRMED")}>
                      <button className="text-sky-700 hover:underline">Confirm</button>
                    </form>
                  )}
                  {(b.status === "REQUESTED" || b.status === "CONFIRMED") && (
                    <>
                      <form action={setBookingStatus.bind(null, b.id, "COMPLETED")}>
                        <button className="text-emerald-700 hover:underline">Done</button>
                      </form>
                      <form action={setBookingStatus.bind(null, b.id, "CANCELLED")}>
                        <button className="text-muted hover:underline">Cancel</button>
                      </form>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </>
  );
}
