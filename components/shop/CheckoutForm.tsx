"use client";

import Script from "next/script";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Lock } from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { useMounted } from "@/lib/use-mounted";
import { formatINR } from "@/lib/format";
import { placeOrder, quoteCart, type CheckoutState, type QuoteState } from "@/app/(shop)/checkout/actions";

type RazorpayOptions = Record<string, unknown> & { handler: (r: Record<string, string>) => void };
declare global {
  interface Window {
    Razorpay?: new (opts: RazorpayOptions) => { open: () => void; on: (e: string, cb: () => void) => void };
  }
}

export function CheckoutForm({ states, onlineEnabled }: { states: readonly string[]; onlineEnabled: boolean }) {
  const mounted = useMounted();
  const router = useRouter();
  const items = useCart((s) => s.items);
  const clear = useCart((s) => s.clear);
  const [state, setState] = useState<CheckoutState>({});
  const [pending, startSubmit] = useTransition();
  const [quote, setQuote] = useState<QuoteState>({});
  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [quoting, startQuote] = useTransition();
  const [payError, setPayError] = useState<string>();

  const cartJson = useMemo(
    () => JSON.stringify(items.map((i) => ({ productId: i.productId, blouse: i.blouse, addOns: i.addOns, quantity: i.quantity }))),
    [items],
  );

  // Re-price on the server whenever the bag or the applied coupon changes.
  useEffect(() => {
    if (!mounted || items.length === 0) return;
    startQuote(async () => setQuote(await quoteCart(cartJson, appliedCoupon)));
  }, [mounted, cartJson, appliedCoupon, items.length]);

  // After the order is created: go to confirmation (COD) or open Razorpay (online).
  function afterOrder(result: CheckoutState) {
    if (!result.ok || !result.orderId) return;
    const orderId = result.orderId;
    if (!result.razorpay) {
      clear();
      router.push(`/order/${orderId}`);
      return;
    }
    const rz = result.razorpay;
    if (!window.Razorpay) {
      setPayError("The payment window could not load. Please check your connection and try again.");
      return;
    }
    const checkout = new window.Razorpay({
      key: rz.keyId,
      order_id: rz.orderId,
      amount: rz.amount,
      currency: "INR",
      name: "Sri Meenakshi Silk House",
      description: "Silk saree order",
      image: "/brand/logo.png",
      prefill: { name: rz.name, contact: rz.phone, email: rz.email },
      theme: { color: "#2F3A26" },
      handler: async (res) => {
        const r = await fetch("/api/razorpay/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, ...res }),
        });
        if (r.ok) {
          clear();
          router.push(`/order/${orderId}`);
        } else {
          setPayError("We couldn't verify your payment. If money was deducted, it will be confirmed automatically or refunded. Please contact us.");
        }
      },
      modal: { ondismiss: () => setPayError("Payment was cancelled. You can try again; your saree is held for 30 minutes.") },
    });
    checkout.open();
  }

  if (!mounted) return <div className="h-96 animate-pulse rounded-[var(--radius-card)] bg-white" />;

  if (items.length === 0) {
    return (
      <div className="rounded-[var(--radius-card)] bg-white p-12 text-center">
        <p className="h-display text-3xl">Your bag is empty.</p>
        <Link href="/shop" className="btn-primary mt-6">
          Shop sarees
        </Link>
      </div>
    );
  }

  const err = (k: string) => state.errors?.[k];
  const fieldClass = (k: string) => `field ${err(k) ? "border-terra" : ""}`;

  return (
    <form
      // Submit manually so React doesn't reset the typed address if validation fails.
      onSubmit={(e) => {
        e.preventDefault();
        setPayError(undefined);
        const fd = new FormData(e.currentTarget);
        startSubmit(async () => {
          const result = await placeOrder({}, fd);
          setState(result);
          afterOrder(result);
        });
      }}
      className="grid gap-5 sm:gap-8 lg:grid-cols-[1fr_400px]"
    >
      {onlineEnabled && <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />}
      <input type="hidden" name="cart" value={cartJson} />
      <input type="hidden" name="coupon" value={appliedCoupon} />

      <div className="space-y-6">
        <section className="rounded-[var(--radius-card)] bg-white p-6 sm:p-8">
          <h2 className="mb-5 font-serif text-2xl">Contact</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" name="name" error={err("name")}>
              <input id="name" name="name" autoComplete="name" required className={fieldClass("name")} />
            </Field>
            <Field label="Mobile number" name="phone" error={err("phone")}>
              <input id="phone" name="phone" type="tel" inputMode="numeric" autoComplete="tel-national" required placeholder="10-digit mobile" className={fieldClass("phone")} />
            </Field>
            <Field label="Email (for invoice, optional)" name="email" error={err("email")} className="sm:col-span-2">
              <input id="email" name="email" type="email" autoComplete="email" className={fieldClass("email")} />
            </Field>
          </div>
        </section>

        <section className="rounded-[var(--radius-card)] bg-white p-6 sm:p-8">
          <h2 className="mb-5 font-serif text-2xl">Delivery address</h2>
          <div className="grid grid-cols-2 gap-x-3 gap-y-4 sm:gap-4">
            <Field label="House no., building, street" name="line1" error={err("line1")} className="col-span-2">
              <input id="line1" name="line1" autoComplete="address-line1" required className={fieldClass("line1")} />
            </Field>
            <Field label="Area, landmark (optional)" name="line2" className="col-span-2">
              <input id="line2" name="line2" autoComplete="address-line2" className="field" />
            </Field>
            <Field label="PIN code" name="pincode" error={err("pincode")}>
              <input id="pincode" name="pincode" inputMode="numeric" maxLength={6} autoComplete="postal-code" required className={fieldClass("pincode")} />
            </Field>
            <Field label="City" name="city" error={err("city")}>
              <input id="city" name="city" autoComplete="address-level2" required className={fieldClass("city")} />
            </Field>
            <Field label="State" name="state" error={err("state")} className="col-span-2">
              <select id="state" name="state" required defaultValue="" className={fieldClass("state")}>
                <option value="" disabled>
                  Choose state
                </option>
                {states.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="Order note (optional)" name="note" className="col-span-2">
              <textarea id="note" name="note" rows={2} placeholder="Blouse measurements, delivery instructions…" className="field" />
            </Field>
          </div>
        </section>

        <section className="rounded-[var(--radius-card)] bg-white p-6 sm:p-8">
          <h2 className="mb-5 font-serif text-2xl">Payment</h2>
          <div className="grid gap-3">
            {onlineEnabled && (
              <PayOption value="RAZORPAY" defaultChecked title="Pay online" text="UPI, cards, net banking, wallets & EMI via Razorpay" />
            )}
            <PayOption value="COD" defaultChecked={!onlineEnabled} title="Cash on Delivery" text="We'll call you to confirm the order before shipping" />
          </div>
        </section>
      </div>

      <aside className="h-fit space-y-5 rounded-[var(--radius-card)] bg-white p-6 sm:p-7 lg:sticky lg:top-28">
        <h2 className="font-serif text-2xl">Your order</h2>
        <ul className="space-y-4">
          {items.map((i) => (
            <li key={i.key} className="flex gap-3">
              <span className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-oat">
                {i.image && <Image src={i.image} alt="" fill sizes="64px" className="object-cover object-top" />}
                <span className="absolute -top-0 -right-0 grid size-5 place-items-center rounded-bl-lg bg-ink text-[11px] text-white">{i.quantity}</span>
              </span>
              <span className="flex-1 text-sm leading-snug">{i.name}</span>
              <span className="text-sm">{formatINR(i.unitPrice * i.quantity)}</span>
            </li>
          ))}
        </ul>

        <div>
          <label htmlFor="coupon-input" className="label">
            Coupon code
          </label>
          <div className="flex gap-2">
            <input id="coupon-input" value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} className="field uppercase" placeholder="Enter code" />
            <button type="button" className="btn-outline px-4" onClick={() => setAppliedCoupon(coupon.trim())} disabled={!coupon.trim() || quoting}>
              Apply
            </button>
          </div>
          {appliedCoupon && quote.couponError && <p className="mt-2 text-sm text-terra">{quote.couponError}</p>}
          {appliedCoupon && !quote.couponError && quote.discount ? (
            <p className="mt-2 text-sm text-olive">
              “{appliedCoupon}” applied.{" "}
              <button type="button" className="underline" onClick={() => { setAppliedCoupon(""); setCoupon(""); }}>
                Remove
              </button>
            </p>
          ) : null}
        </div>

        <dl className={`space-y-2.5 border-t border-line pt-5 text-[15px] ${quoting ? "opacity-60" : ""}`}>
          <Row label="Subtotal" value={quote.subtotal} />
          {quote.discount ? <Row label="Discount" value={-quote.discount} /> : null}
          <Row label="Shipping" value={quote.shipping} free />
          <div className="flex justify-between border-t border-line pt-3 text-lg font-medium">
            <dt>Total</dt>
            <dd>{quote.total != null ? formatINR(quote.total) : "…"}</dd>
          </div>
        </dl>

        {(state.error || quote.error || payError) && (
          <p className="rounded-2xl bg-terra/10 px-4 py-3 text-sm text-terra" role="alert">
            {payError || state.error || quote.error}
          </p>
        )}

        <button className="btn-primary w-full py-4 text-base" disabled={pending || quoting || Boolean(quote.error)}>
          <Lock className="size-4" /> {pending ? "Placing order…" : "Place order"}
        </button>
        <p className="text-center text-xs text-muted">
          By placing your order you agree to our{" "}
          <Link href="/policies/terms" className="underline">
            terms
          </Link>{" "}
          and{" "}
          <Link href="/policies/returns" className="underline">
            return policy
          </Link>
          .
        </p>
      </aside>
    </form>
  );
}

function Field({ label, name, error, className = "", children }: { label: string; name: string; error?: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <label htmlFor={name} className="label">
        {label}
      </label>
      {children}
      {error && <p className="mt-1.5 text-sm text-terra">{error}</p>}
    </div>
  );
}

function PayOption({ value, title, text, defaultChecked }: { value: string; title: string; text: string; defaultChecked?: boolean }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line p-4 has-checked:border-olive has-checked:bg-cream">
      <input type="radio" name="payment" value={value} defaultChecked={defaultChecked} className="mt-1 accent-olive" />
      <span>
        <span className="block font-medium">{title}</span>
        <span className="text-sm text-muted">{text}</span>
      </span>
    </label>
  );
}

function Row({ label, value, free }: { label: string; value?: number; free?: boolean }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted">{label}</dt>
      <dd>{value == null ? "…" : free && value === 0 ? "Free" : value < 0 ? `− ${formatINR(-value)}` : formatINR(value)}</dd>
    </div>
  );
}
