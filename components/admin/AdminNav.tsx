"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { CalendarClock, ExternalLink, FolderTree, LayoutDashboard, Package, ShoppingCart, Tag, Users } from "lucide-react";

const ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/coupons", label: "Coupons", icon: Tag },
  { href: "/admin/bookings", label: "Video calls", icon: CalendarClock },
  { href: "/admin/customers", label: "Customers", icon: Users },
];

function Items({ horizontal, pathname }: { horizontal: boolean; pathname?: string }) {
  const active = (href: string) =>
    pathname != null && (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));
  return (
    <nav className={horizontal ? "flex gap-1" : "space-y-1"}>
      {ITEMS.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] transition-colors ${
            active(href) ? "bg-white/15 text-white" : "text-paper/75 hover:bg-white/10 hover:text-white"
          }`}
        >
          <Icon className="size-[18px]" strokeWidth={1.6} />
          {label}
        </Link>
      ))}
      <Link href="/" target="_blank" className="flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] text-paper/75 hover:text-white">
        <ExternalLink className="size-[18px]" strokeWidth={1.6} /> View store
      </Link>
    </nav>
  );
}

function ActiveItems({ horizontal }: { horizontal: boolean }) {
  return <Items horizontal={horizontal} pathname={usePathname()} />;
}

/** The current-page highlight reads the URL, so it streams in inside <Suspense>. */
export function AdminNav({ horizontal = false }: { horizontal?: boolean }) {
  return (
    <Suspense fallback={<Items horizontal={horizontal} />}>
      <ActiveItems horizontal={horizontal} />
    </Suspense>
  );
}
