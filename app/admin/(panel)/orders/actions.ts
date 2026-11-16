"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { cancelOrder } from "@/lib/orders";

const updateSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED", "RETURNED"]),
  paymentStatus: z.enum(["PENDING", "PAID", "FAILED", "REFUNDED"]),
  courier: z.string().trim().max(60).transform((v) => v || null),
  trackingNumber: z.string().trim().max(80).transform((v) => v || null),
  adminNote: z.string().trim().max(2000).transform((v) => v || null),
});

export async function updateOrder(orderId: string, _prev: { ok?: boolean; error?: string }, formData: FormData) {
  await requireAdmin();
  const parsed = updateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) return { error: "Order not found." };
  if (order.status === "CANCELLED") return { error: "Cancelled orders can't be changed." };
  if (parsed.data.status === "SHIPPED" && !parsed.data.trackingNumber) {
    return { error: "Add the courier tracking number before marking as shipped." };
  }
  await db.order.update({ where: { id: orderId }, data: parsed.data });
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
  return { ok: true };
}

export async function cancelOrderAction(orderId: string) {
  const admin = await requireAdmin(["OWNER", "MANAGER"]);
  await cancelOrder(orderId, `Cancelled by ${admin.name}.`);
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
}
