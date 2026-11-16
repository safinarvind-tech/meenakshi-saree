import type { Coupon } from "@/generated/prisma/client";

type CouponResult = { discount: number; error?: undefined } | { error: string; discount?: undefined };

/** Returns the discount in paise, or an error message if the coupon can't be used. */
export function evaluateCoupon(coupon: Coupon | null, subtotal: number, now = new Date()): CouponResult {
  if (!coupon || !coupon.active) return { error: "This coupon code is not valid." };
  if (coupon.expiresAt && coupon.expiresAt < now) return { error: "This coupon has expired." };
  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) return { error: "This coupon has been fully used." };
  if (subtotal < coupon.minOrder) {
    return { error: `Add items worth ₹${Math.ceil((coupon.minOrder - subtotal) / 100)} more to use this coupon.` };
  }
  const discount =
    coupon.type === "PERCENT"
      ? Math.floor((subtotal * Math.min(coupon.value, 100)) / 100)
      : Math.min(coupon.value, subtotal);
  return { discount };
}
