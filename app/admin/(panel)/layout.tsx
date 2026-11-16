import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminNav } from "@/components/admin/AdminNav";
import { AdminUser } from "@/components/admin/AdminUser";
import { AdminMobileNav } from "@/components/admin/AdminMobileNav";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin" }, robots: { index: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#f4f1ea]">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-olive p-5 text-paper lg:flex">
        <div className="mb-8 px-2">
          <p className="font-serif text-xl">Sri Meenakshi</p>
          <p className="text-[11px] tracking-[0.2em] text-gold-light uppercase">Admin</p>
        </div>
        <AdminNav />
        <div className="mt-auto">
          <Suspense fallback={null}>
            <AdminUser />
          </Suspense>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex items-center gap-3 bg-olive/95 px-4 pt-[max(12px,env(safe-area-inset-top))] pb-3 text-paper backdrop-blur lg:hidden">
          <Link href="/admin" className="flex items-center gap-2.5">
            <Image src="/brand/logo-192.webp" alt="" width={32} height={32} unoptimized className="rounded-full" />
            <span className="font-serif text-lg leading-none">Sri Meenakshi</span>
          </Link>
          <span className="ml-auto rounded-full bg-white/10 px-2.5 py-1 text-[10px] tracking-[0.18em] text-gold-light uppercase">Admin</span>
        </header>
        <div className="mx-auto max-w-7xl px-4 pt-5 pb-[calc(96px+env(safe-area-inset-bottom))] sm:px-8 sm:pt-8 lg:pb-8">{children}</div>
        <AdminMobileNav />
      </div>
    </div>
  );
}
