"use client";

import { startTransition, useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import { bookVideoCall, type FormState } from "@/app/(shop)/actions";

const SLOTS = ["Morning (10am – 1pm)", "Afternoon (1pm – 4pm)", "Evening (4pm – 7pm)"];

export function VideoCallForm({ minDate }: { minDate: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(bookVideoCall, {});

  if (state.ok) {
    return (
      <div className="rounded-[var(--radius-card)] bg-white p-6 text-center sm:p-10">
        <CheckCircle2 className="mx-auto size-12 text-olive" strokeWidth={1.4} />
        <p className="mt-4 font-serif text-2xl">{state.message}</p>
      </div>
    );
  }

  const err = (k: string) => state.errors?.[k];
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => action(fd));
      }}
      className="grid gap-4 rounded-[22px] bg-white p-5 sm:grid-cols-2 sm:rounded-[var(--radius-card)] sm:p-8"
    >
      <div>
        <label htmlFor="name" className="label">Your name</label>
        <input id="name" name="name" required className="field" />
        {err("name") && <p className="mt-1.5 text-sm text-terra">{err("name")}</p>}
      </div>
      <div>
        <label htmlFor="phone" className="label">WhatsApp number</label>
        <input id="phone" name="phone" type="tel" inputMode="numeric" required className="field" />
        {err("phone") && <p className="mt-1.5 text-sm text-terra">{err("phone")}</p>}
      </div>
      <div>
        <label htmlFor="date" className="label">Preferred date</label>
        <input id="date" name="date" type="date" min={minDate} required className="field" />
        {err("date") && <p className="mt-1.5 text-sm text-terra">{err("date")}</p>}
      </div>
      <div>
        <label htmlFor="slot" className="label">Time</label>
        <select id="slot" name="slot" className="field">
          {SLOTS.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="interest" className="label">What are you looking for? (optional)</label>
        <textarea id="interest" name="interest" rows={3} placeholder="e.g. Red bridal Kanjivaram around ₹40,000 for a wedding in February" className="field" />
      </div>
      <button className="btn-primary sm:col-span-2" disabled={pending}>
        {pending ? "Booking…" : "Request video call"}
      </button>
    </form>
  );
}
