"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useState } from "react";
import {
  CalendarClock,
  ExternalLink,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  ShoppingCart,
  Tag,
  Users,
  X,
} from "lucide-react";
import { logout } from "@/app/admin/(auth)/login/actions";

const TABS = [
  { href: "/admin", label: "Home", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/bookings", label: "Calls", icon: CalendarClock },
];
const MORE = [
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/coupons", label: "Coupons", icon: Tag },
  { href: "/admin/customers", label: "Customers", icon: Users },
];

const isActive = (pathname: string | undefined, href: string) =>
  pathname != null && (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

function Bar({ pathname }: { pathname?: string }) {
  const [open, setOpen] = useState(false);
  const moreActive = MORE.some((m) => isActive(pathname, m.href));

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-ink/40 lg:hidden" onClick={() => setOpen(false)} aria-hidden />
      )}
      <div
        className={`fixed inset-x-3 z-50 rounded-3xl bg-white p-2 shadow-2xl transition-all duration-200 lg:hidden ${
          open ? "bottom-[calc(84px+env(safe-area-inset-bottom))] opacity-100" : "pointer-events-none bottom-16 opacity-0"
        }`}
        role="menu"
      >
        {MORE.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 text-[15px] ${
              isActive(pathname, href) ? "bg-oat font-medium" : "active:bg-cream"
            }`}
          >
            <Icon className="size-5 text-olive" strokeWidth={1.6} /> {label}
          </Link>
        ))}
        <Link href="/" target="_blank" className="flex items-center gap-3 rounded-2xl px-4 py-3.5 text-[15px] active:bg-cream">
          <ExternalLink className="size-5 text-olive" strokeWidth={1.6} /> View store
        </Link>
        <form action={logout} className="border-t border-line mt-1 pt-1">
          <button className="flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-[15px] text-terra active:bg-cream">
            <LogOut className="size-5" strokeWidth={1.6} /> Sign out
          </button>
        </form>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-olive pb-[env(safe-area-inset-bottom)] text-paper lg:hidden"
        aria-label="Admin"
      >
        <div className="grid grid-cols-5">
          {TABS.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href) && !open;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`flex flex-col items-center gap-1 py-2.5 text-[11px] ${active ? "text-white" : "text-paper/60"}`}
              >
                <span className={`rounded-full px-4 py-1 transition-colors ${active ? "bg-white/15" : ""}`}>
                  <Icon className="size-5" strokeWidth={1.7} />
                </span>
                {label}
              </Link>
            );
          })}
          <button
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className={`flex flex-col items-center gap-1 py-2.5 text-[11px] ${open || moreActive ? "text-white" : "text-paper/60"}`}
          >
            <span className={`rounded-full px-4 py-1 transition-colors ${open || moreActive ? "bg-white/15" : ""}`}>
              {open ? <X className="size-5" strokeWidth={1.7} /> : <Menu className="size-5" strokeWidth={1.7} />}
            </span>
            More
          </button>
        </div>
      </nav>
    </>
  );
}

function ActiveBar() {
  return <Bar pathname={usePathname()} />;
}

/** Bottom tab bar for the admin on phones and tablets. */
export function AdminMobileNav() {
  return (
    <Suspense fallback={<Bar />}>
      <ActiveBar />
    </Suspense>
  );
}
