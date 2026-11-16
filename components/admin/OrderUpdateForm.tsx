"use client";

import { useActionState } from "react";
import type { Order } from "@/generated/prisma/client";

type Action = (prev: { ok?: boolean; error?: string }, fd: FormData) => Promise<{ ok?: boolean; error?: string }>;

export function OrderUpdateForm({ order, action }: { order: Order; action: Action }) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="status" className="label">Order status</label>
        <select id="status" name="status" defaultValue={order.status} className="field">
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="PACKED">Packed</option>
          <option value="SHIPPED">Shipped</option>
          <option value="DELIVERED">Delivered</option>
          <option value="RETURNED">Returned</option>
        </select>
      </div>
      <div>
        <label htmlFor="paymentStatus" className="label">Payment status</label>
        <select id="paymentStatus" name="paymentStatus" defaultValue={order.paymentStatus} className="field">
          <option value="PENDING">Pending</option>
          <option value="PAID">Paid</option>
          <option value="FAILED">Failed</option>
          <option value="REFUNDED">Refunded</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="courier" className="label">Courier</label>
          <input id="courier" name="courier" defaultValue={order.courier ?? ""} className="field" placeholder="Delhivery" />
        </div>
        <div>
          <label htmlFor="trackingNumber" className="label">Tracking no.</label>
          <input id="trackingNumber" name="trackingNumber" defaultValue={order.trackingNumber ?? ""} className="field" />
        </div>
      </div>
      <div>
        <label htmlFor="adminNote" className="label">Internal note</label>
        <textarea id="adminNote" name="adminNote" rows={3} defaultValue={order.adminNote ?? ""} className="field" />
      </div>
      {state.error && <p className="rounded-xl bg-terra/10 px-3 py-2 text-sm text-terra">{state.error}</p>}
      {state.ok && <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">Order updated.</p>}
      <button className="btn-primary w-full" disabled={pending}>
        {pending ? "Saving…" : "Update order"}
      </button>
    </form>
  );
}
