"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { cartSubtotal, useCart } from "@/lib/cart-store";
import { useMounted } from "@/lib/use-mounted";
import { formatINR } from "@/lib/format";
import { ADD_ONS, BLOUSE_OPTIONS, FREE_SHIPPING_ABOVE, shippingFor } from "@/lib/pricing";

export function CartView() {
  const mounted = useMounted();
  const { items, setQuantity, remove } = useCart();

  if (!mounted) return <div className="h-80 animate-pulse rounded-[var(--radius-card)] bg-white" />;

  if (items.length === 0) {
    return (
      <div className="rounded-[var(--radius-card)] bg-white p-12 text-center">
        <p className="h-display text-3xl">Your bag is empty.</p>
        <p className="mt-2 text-muted">Find a saree you&apos;ll treasure for years.</p>
        <Link href="/shop" className="btn-primary mt-6">
          Shop sarees
        </Link>
      </div>
    );
  }

  const subtotal = cartSubtotal(items);
  const shipping = shippingFor(subtotal);
  const toFree = FREE_SHIPPING_ABOVE - subtotal;

  return (
    <div className="grid gap-5 sm:gap-8 lg:grid-cols-[1fr_380px]">
      <ul className="space-y-3 sm:space-y-4">
        {items.map((item) => (
          <li key={item.key} className="flex gap-4 rounded-[var(--radius-card)] bg-white p-3 sm:gap-5">
            <Link href={`/product/${item.slug}`} className="relative h-32 w-24 shrink-0 overflow-hidden rounded-2xl bg-oat sm:h-40 sm:w-32">
              {item.image && <Image src={item.image} alt="" fill sizes="128px" className="object-cover object-top" />}
            </Link>
            <div className="flex min-w-0 flex-1 flex-col py-1 pr-2">
              <div className="flex justify-between gap-3">
                <Link href={`/product/${item.slug}`} className="font-serif text-lg leading-snug hover:underline sm:text-xl">
                  {item.name}
                </Link>
                <button type="button" onClick={() => remove(item.key)} className="h-fit text-muted hover:text-terra" aria-label={`Remove ${item.name}`}>
                  <Trash2 className="size-5" strokeWidth={1.5} />
                </button>
              </div>
              <p className="mt-1 text-sm text-muted">
                {BLOUSE_OPTIONS[item.blouse].label}
                {item.addOns.map((a) => ` · ${ADD_ONS[a].label}`).join("")}
              </p>
              <div className="mt-auto flex items-center justify-between pt-3">
                <div className="flex items-center rounded-full border border-line">
                  <button type="button" className="grid size-9 place-items-center" onClick={() => setQuantity(item.key, item.quantity - 1)} aria-label="Decrease quantity" disabled={item.quantity <= 1}>
                    <Minus className="size-4" />
                  </button>
                  <span className="w-8 text-center" aria-live="polite">
                    {item.quantity}
                  </span>
                  <button type="button" className="grid size-9 place-items-center disabled:opacity-30" onClick={() => setQuantity(item.key, item.quantity + 1)} aria-label="Increase quantity" disabled={item.quantity >= item.maxQuantity}>
                    <Plus className="size-4" />
                  </button>
                </div>
                <span className="text-base font-medium sm:text-lg">{formatINR(item.unitPrice * item.quantity)}</span>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <aside className="h-fit rounded-[var(--radius-card)] bg-white p-5 sm:p-7 lg:sticky lg:top-28">
        <h2 className="font-serif text-2xl">Order summary</h2>
        <dl className="mt-5 space-y-3 text-[15px]">
          <div className="flex justify-between">
            <dt className="text-muted">Subtotal</dt>
            <dd>{formatINR(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Shipping</dt>
            <dd>{shipping === 0 ? "Free" : formatINR(shipping)}</dd>
          </div>
        </dl>
        {toFree > 0 && <p className="mt-4 rounded-2xl bg-oat px-4 py-3 text-sm">Add {formatINR(toFree)} more for free shipping.</p>}
        <div className="mt-5 flex justify-between border-t border-line pt-5 text-lg font-medium">
          <span>Total</span>
          <span>{formatINR(subtotal + shipping)}</span>
        </div>
        <p className="mt-1 text-xs text-muted">Coupons can be applied at checkout.</p>
        <Link href="/checkout" className="btn-primary mt-6 w-full py-4 text-base">
          Checkout
        </Link>
        <Link href="/shop" className="mt-3 block text-center text-sm text-muted hover:text-ink">
          Continue shopping
        </Link>
      </aside>
    </div>
  );
}
