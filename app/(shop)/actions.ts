"use server";

import { z } from "zod";
import { db } from "@/lib/db";

export type FormState = { ok?: boolean; message?: string; errors?: Record<string, string> };

const emailSchema = z.object({ email: z.email("Please enter a valid email address.") });

export async function subscribe(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = emailSchema.safeParse({ email: String(formData.get("email") ?? "").trim().toLowerCase() });
  if (!parsed.success) return { message: parsed.error.issues[0].message };
  await db.subscriber.upsert({ where: { email: parsed.data.email }, update: {}, create: { email: parsed.data.email } });
  return { ok: true, message: "Thank you! You'll be the first to see new weaves." };
}

const bookingSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name."),
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s-]/g, "").replace(/^\+?91/, ""))
    .pipe(z.string().regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit mobile number.")),
  date: z.string().min(1, "Please choose a date."),
  slot: z.enum(["Morning (10am – 1pm)", "Afternoon (1pm – 4pm)", "Evening (4pm – 7pm)"]),
  interest: z.string().trim().max(500).optional(),
});

export async function bookVideoCall(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = bookingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) errors[String(issue.path[0])] ??= issue.message;
    return { errors };
  }
  const preferredDate = new Date(`${parsed.data.date}T00:00:00+05:30`);
  const today = new Date(new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }) + "T00:00:00+05:30");
  if (Number.isNaN(preferredDate.getTime()) || preferredDate < today) {
    return { errors: { date: "Please choose today or a future date." } };
  }
  await db.videoCallBooking.create({
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone,
      preferredDate,
      slot: parsed.data.slot,
      interest: parsed.data.interest || null,
    },
  });
  return { ok: true, message: "Your video call is requested. We'll confirm the time on WhatsApp shortly." };
}
