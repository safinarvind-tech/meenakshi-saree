"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Menu, MessageCircle, Search, ShoppingBag, X } from "lucide-react";
import { cartCount, useCart } from "@/lib/cart-store";
import { useMounted } from "@/lib/use-mounted";

const LINKS = [
  { href: "/shop", label: "Shop all" },
  { href: "/shop?category=kanchipuram", label: "Kanchipuram" },
  { href: "/shop?category=bridal", label: "Bridal" },
  { href: "/shop?category=soft-silk", label: "Soft silk" },
  { href: "/video-call", label: "Video call" },
  { href: "/our-story", label: "Our story" },
];

type LinksProps = { linkClass: string; activeClass: string; onNavigate?: () => void };

function Links({ linkClass, activeClass, onNavigate, active }: LinksProps & { active?: (href: string) => boolean }) {
  return LINKS.map((l) => (
    <Link key={l.href} href={l.href} onClick={onNavigate} className={`${linkClass} ${active?.(l.href) ? activeClass : ""}`}>
      {l.label}
    </Link>
  ));
}

/** Highlights the current page. Reads search params, so it renders inside <Suspense>. */
function ActiveLinks(props: LinksProps) {
  const pathname = usePathname();
  const category = useSearchParams().get("category");
  const active = (href: string) => {
    const [path, query] = href.split("?");
    return path === pathname && (query ? new URLSearchParams(query).get("category") : null) === category;
  };
  return <Links {...props} active={active} />;
}

function NavLinks(props: LinksProps) {
  return (
    <Suspense fallback={<Links {...props} />}>
      <ActiveLinks {...props} />
    </Suspense>
  );
}

export function Header() {
  const items = useCart((s) => s.items);
  const mounted = useMounted();
  const [open, setOpen] = useState(false);
  const count = mounted ? cartCount(items) : 0;

  // Close the menu with Escape and stop the page behind it from scrolling.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 px-3 pt-[max(12px,env(safe-area-inset-top))] sm:px-6 sm:pt-4 lg:px-10 lg:pt-5">
      <div className="relative z-10 mx-auto flex max-w-[1360px] items-center justify-between gap-2 rounded-full bg-white/95 py-2 pr-2 pl-2.5 shadow-[0_6px_30px_rgba(47,58,38,0.08)] backdrop-blur sm:pl-5">
        <Link href="/" className="flex min-w-0 items-center gap-2.5 sm:gap-3" onClick={() => setOpen(false)}>
          <span className="relative size-10 shrink-0 overflow-hidden rounded-full bg-[#8a0b0e] ring-2 ring-gold/60">
            <Image src="/brand/logo.png" alt="" fill sizes="80px" className="scale-[2] object-cover object-[52%_25%]" priority />
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block font-serif text-[17px] font-medium whitespace-nowrap sm:text-xl">Sri Meenakshi</span>
            <span className="block text-[9px] tracking-[0.18em] whitespace-nowrap text-muted uppercase sm:text-[10px] sm:tracking-[0.2em]">
              Silk House · 1972
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          <NavLinks linkClass="rounded-full px-4 py-2 text-[15px] transition-colors hover:bg-oat" activeClass="bg-oat" />
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Link href="/shop" aria-label="Search sarees" className="hidden size-11 place-items-center rounded-full bg-oat sm:grid">
            <Search className="size-[18px]" strokeWidth={1.6} />
          </Link>
          <Link href="/cart" className="btn-primary relative h-11 w-11 px-0 sm:w-auto sm:px-5" aria-label={`Bag, ${count} items`}>
            <ShoppingBag className="size-[18px]" strokeWidth={1.6} />
            <span className="hidden sm:inline">Bag · {count}</span>
            {count > 0 && (
              <span className="absolute -top-1 -right-1 grid size-5 place-items-center rounded-full bg-terra text-[11px] font-medium text-white sm:hidden">
                {count}
              </span>
            )}
          </Link>
          <button
            type="button"
            className="grid size-11 place-items-center rounded-full bg-oat lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label="Menu"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <>
          <div className="fixed inset-0 bg-ink/30 backdrop-blur-[2px] lg:hidden" onClick={() => setOpen(false)} aria-hidden />
          <nav
            className="absolute inset-x-3 top-full mt-2 flex max-h-[calc(100dvh-100px)] flex-col overflow-y-auto rounded-[28px] bg-white p-3 shadow-xl sm:inset-x-6 lg:hidden"
            aria-label="Mobile"
          >
            <NavLinks linkClass="rounded-2xl px-4 py-3.5 text-[17px] active:bg-oat" activeClass="bg-oat" onNavigate={() => setOpen(false)} />
            <div className="mt-2 grid grid-cols-2 gap-2 border-t border-line pt-3">
              <Link href="/shop" onClick={() => setOpen(false)} className="flex items-center justify-center gap-2 rounded-2xl bg-oat px-4 py-3 text-[15px]">
                <Search className="size-4" strokeWidth={1.6} /> Search
              </Link>
              <Link href="/contact" onClick={() => setOpen(false)} className="flex items-center justify-center gap-2 rounded-2xl bg-oat px-4 py-3 text-[15px]">
                <MessageCircle className="size-4" strokeWidth={1.6} /> Contact
              </Link>
            </div>
          </nav>
        </>
      )}
    </header>
  );
}
