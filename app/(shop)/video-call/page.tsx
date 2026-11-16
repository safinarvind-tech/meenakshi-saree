import Image from "next/image";
import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { VideoCallForm } from "@/components/shop/VideoCallForm";

export const metadata: Metadata = {
  title: "Video-call shopping",
  description: "See our silk sarees live on a video call with our family before you buy.",
};

async function FormWithDate() {
  await connection();
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  return <VideoCallForm minDate={today} />;
}

export default function VideoCallPage() {
  return (
    <div className="mx-3 mt-6 grid gap-6 sm:mx-6 sm:mt-8 sm:gap-8 lg:mx-10 lg:grid-cols-2">
      <div className="relative min-h-[420px] overflow-hidden rounded-[var(--radius-panel)]">
        <Image src="/brand/bride-mustard.jpg" alt="" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover object-[50%_20%]" priority />
      </div>
      <div className="py-4">
        <h1 className="h-display text-[42px] leading-[1.02] sm:text-6xl">
          See it live, <em className="text-terra">before you buy.</em>
        </h1>
        <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted">
          Book a free WhatsApp video call. We&apos;ll show you sarees in natural light, compare colours and borders, and help you choose, just like
          visiting our store.
        </p>
        <div className="mt-8">
          <Suspense fallback={<div className="h-80 animate-pulse rounded-[var(--radius-card)] bg-white" />}>
            <FormWithDate />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
