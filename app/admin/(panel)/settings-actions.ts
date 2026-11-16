"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { rupeesToPaise, slugify } from "@/lib/format";
import { Prisma } from "@/generated/prisma/client";

type State = { ok?: boolean; error?: string };

// ───── Categories ─────

const categorySchema = z.object({
  name: z.string().trim().min(2, "Category name is too short.").max(60),
  slug: z.string().trim().max(60).optional(),
  description: z.string().trim().max(300).transform((v) => v || null),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
});

export async function saveCategory(categoryId: string | null, _prev: State, formData: FormData): Promise<State> {
  await requireAdmin(["OWNER", "MANAGER"]);
  const parsed = categorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const data = { ...parsed.data, slug: slugify(parsed.data.slug || parsed.data.name) };
  try {
    if (categoryId) await db.category.update({ where: { id: categoryId }, data });
    else await db.category.create({ data });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return { error: "A category with this URL slug already exists." };
    throw e;
  }
  revalidatePath("/admin/categories");
  return { ok: true };
}

export async function deleteCategory(categoryId: string) {
  await requireAdmin(["OWNER", "MANAGER"]);
  await db.category.delete({ where: { id: categoryId } }); // products keep existing, with no category
  revalidatePath("/admin/categories");
}

// ───── Coupons ─────

const couponSchema = z
  .object({
    code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{3,30}$/, "Use 3–30 letters, numbers, - or _."),
    type: z.enum(["PERCENT", "FLAT"]),
    value: z.string().trim().min(1, "Enter a value."),
    minOrder: z.string().trim().default("0"),
    maxUses: z.string().trim().transform((v) => (v ? Number(v) : null)),
    expiresAt: z.string().trim().transform((v) => (v ? new Date(`${v}T23:59:59+05:30`) : null)),
  })
  .transform((d) => ({
    ...d,
    value: d.type === "PERCENT" ? Number(d.value) : rupeesToPaise(d.value),
    minOrder: rupeesToPaise(d.minOrder || "0"),
  }));

export async function createCoupon(_prev: State, formData: FormData): Promise<State> {
  await requireAdmin(["OWNER", "MANAGER"]);
  const parsed = couponSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  if (!Number.isFinite(d.value) || d.value <= 0 || (d.type === "PERCENT" && d.value > 90)) {
    return { error: d.type === "PERCENT" ? "Percentage must be between 1 and 90." : "Enter a valid amount." };
  }
  if (d.maxUses != null && (!Number.isInteger(d.maxUses) || d.maxUses < 1)) return { error: "Max uses must be a whole number." };
  try {
    await db.coupon.create({ data: d });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return { error: "This coupon code already exists." };
    throw e;
  }
  revalidatePath("/admin/coupons");
  return { ok: true };
}

export async function toggleCoupon(couponId: string) {
  await requireAdmin(["OWNER", "MANAGER"]);
  const c = await db.coupon.findUniqueOrThrow({ where: { id: couponId } });
  await db.coupon.update({ where: { id: couponId }, data: { active: !c.active } });
  revalidatePath("/admin/coupons");
}

// ───── Video-call bookings ─────

export async function setBookingStatus(bookingId: string, status: "CONFIRMED" | "COMPLETED" | "CANCELLED") {
  await requireAdmin();
  await db.videoCallBooking.update({ where: { id: bookingId }, data: { status } });
  revalidatePath("/admin/bookings");
}
