"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Check, ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { ADD_ONS, ADD_ON_KEYS, BLOUSE_KEYS, BLOUSE_OPTIONS, unitPrice, type AddOn, type BlouseOption } from "@/lib/pricing";
import { formatINR } from "@/lib/format";

type Props = {
  product: { id: string; slug: string; name: string; price: number; stock: number; image: string | null };
};

export function AddToBag({ product }: Props) {
  const add = useCart((s) => s.add);
  const [blouse, setBlouse] = useState<BlouseOption>("UNSTITCHED");
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [added, setAdded] = useState(false);
  const soldOut = product.stock <= 0;
  const price = unitPrice(product.price, blouse, addOns);

  // Phones: when the main button scrolls off screen, show a fixed bar at the bottom.
  const mainButton = useRef<HTMLDivElement>(null);
  const [showBar, setShowBar] = useState(false);
  useEffect(() => {
    const el = mainButton.current;
    if (!el) return;
    // A scroll check (not IntersectionObserver) so it also works when the page jumps, e.g. scroll restore on Back.
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setShowBar(el.getBoundingClientRect().bottom < 0));
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  function toggleAddOn(a: AddOn) {
    setAdded(false);
    setAddOns((cur) => (cur.includes(a) ? cur.filter((x) => x !== a) : [...cur, a]));
  }

  function handleAdd() {
    add({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.image,
      unitPrice: price,
      blouse,
      addOns,
      quantity: 1,
      maxQuantity: product.stock,
    });
    setAdded(true);
  }

  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="mb-3 text-sm font-medium tracking-[0.12em] text-muted uppercase">Blouse</legend>
        <div className="grid gap-2">
          {BLOUSE_KEYS.map((k) => (
            <label
              key={k}
              className={`flex cursor-pointer items-center justify-between rounded-2xl border px-4 py-3 transition ${
                blouse === k ? "border-olive bg-white" : "border-line hover:border-ink/40"
              }`}
            >
              <span className="flex items-center gap-3">
                <input
                  type="radio"
                  name="blouse"
                  value={k}
                  checked={blouse === k}
                  onChange={() => {
                    setBlouse(k);
                    setAdded(false);
                  }}
                  className="accent-olive"
                />
                {BLOUSE_OPTIONS[k].label}
              </span>
              <span className="text-sm text-muted">{BLOUSE_OPTIONS[k].price ? `+ ${formatINR(BLOUSE_OPTIONS[k].price)}` : "Included"}</span>
            </label>
          ))}
        </div>
        {blouse === "STITCHED" && (
          <p className="mt-2 text-sm text-muted">We&apos;ll call you on WhatsApp after the order to take your measurements.</p>
        )}
      </fieldset>

      <fieldset>
        <legend className="mb-3 text-sm font-medium tracking-[0.12em] text-muted uppercase">Add-ons</legend>
        <div className="flex flex-wrap gap-2">
          {ADD_ON_KEYS.map((a) => (
            <label
              key={a}
              className={`flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2.5 text-[15px] transition ${
                addOns.includes(a) ? "border-olive bg-white" : "border-line"
              }`}
            >
              <input type="checkbox" checked={addOns.includes(a)} onChange={() => toggleAddOn(a)} className="accent-olive" />
              {ADD_ONS[a].label} <span className="text-muted">+ {formatINR(ADD_ONS[a].price)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div ref={mainButton} className="flex flex-col gap-3 sm:flex-row">
        <button type="button" onClick={handleAdd} disabled={soldOut} className="btn-primary flex-1 py-4 text-base">
          {added ? <Check className="size-5" /> : <ShoppingBag className="size-5" strokeWidth={1.6} />}
          {soldOut ? "Sold out" : added ? "Added to bag" : `Add to bag · ${formatINR(price)}`}
        </button>
        {added && (
          <Link href="/cart" className="btn-terra py-4 text-base">
            View bag & checkout
          </Link>
        )}
      </div>
      {!soldOut && product.stock <= 2 && (
        <p className="text-sm text-terra">Only {product.stock} left. Many of our sarees are one of a kind.</p>
      )}

      {!soldOut && (
        <div
          className={`fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-line bg-cream/95 px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur transition-transform duration-300 lg:hidden ${
            showBar ? "translate-y-0" : "translate-y-full"
          }`}
          aria-hidden={!showBar}
        >
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm text-muted">{product.name}</span>
            <span className="block font-medium">{formatINR(price)}</span>
          </span>
          {added ? (
            <Link href="/cart" tabIndex={showBar ? 0 : -1} className="btn-terra shrink-0 px-5">
              View bag
            </Link>
          ) : (
            <button type="button" onClick={handleAdd} tabIndex={showBar ? 0 : -1} className="btn-primary shrink-0 px-5">
              <ShoppingBag className="size-[18px]" strokeWidth={1.6} /> Add to bag
            </button>
          )}
        </div>
      )}
    </div>
  );
}
