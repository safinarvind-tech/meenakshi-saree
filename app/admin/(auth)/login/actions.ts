"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createAdminSession, destroyAdminSession } from "@/lib/session";

const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

// Simple in-memory throttle: max 5 failed attempts per email per 15 minutes.
const failures = new Map<string, { count: number; until: number }>();

export async function login(_prev: { error?: string }, formData: FormData): Promise<{ error?: string }> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const now = Date.now();
  const f = failures.get(email);
  if (f && f.count >= 5 && f.until > now) return { error: "Too many attempts. Please wait 15 minutes and try again." };

  const admin = await db.adminUser.findUnique({ where: { email } });
  // Always run bcrypt so response time doesn't reveal whether the email exists.
  const ok = await bcrypt.compare(password, admin?.passwordHash ?? DUMMY_HASH);
  if (!admin || !admin.active || !ok) {
    failures.set(email, { count: (f && f.until > now ? f.count : 0) + 1, until: now + 15 * 60 * 1000 });
    return { error: "Incorrect email or password." };
  }
  failures.delete(email);
  await db.adminUser.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });
  await createAdminSession(admin.id);
  redirect("/admin");
}

export async function logout() {
  await destroyAdminSession();
  redirect("/admin/login");
}
