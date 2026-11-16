"use client";

import { useActionState } from "react";
import { subscribe, type FormState } from "@/app/(shop)/actions";

export function NewsletterForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(subscribe, {});
  return (
    <form action={action} className="mt-6 max-w-[420px]">
      <div className="flex rounded-full bg-white/10 p-1.5">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          name="email"
          type="email"
          required
          placeholder="Your email"
          className="min-w-0 flex-1 bg-transparent px-3 text-base sm:px-4 sm:text-[15px] text-paper outline-none placeholder:text-paper/60"
        />
        <button className="btn-light shrink-0 px-4 py-2.5 sm:px-5" disabled={pending}>
          {pending ? "…" : "Subscribe"}
        </button>
      </div>
      {state.message ? (
        <p className={`mt-3 text-sm ${state.ok ? "text-gold-light" : "text-red-200"}`} role="status">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
