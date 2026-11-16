import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { CheckoutForm } from "@/components/shop/CheckoutForm";
import { INDIAN_STATES } from "@/lib/orders";
import { razorpayEnabled } from "@/lib/razorpay";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

// Payment keys are read at request time, so they can be added on the server without a rebuild.
async function CheckoutWithConfig() {
  await connection();
  return <CheckoutForm states={INDIAN_STATES} onlineEnabled={razorpayEnabled()} />;
}

export default function CheckoutPage() {
  return (
    <div className="mx-3 mt-6 sm:mx-6 sm:mt-10 lg:mx-10">
      <h1 className="h-display mb-5 text-[42px] sm:mb-8 sm:text-6xl">Checkout</h1>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-[var(--radius-card)] bg-white" />}>
        <CheckoutWithConfig />
      </Suspense>
    </div>
  );
}
