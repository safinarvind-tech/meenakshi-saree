"use client";

import { useActionState, useEffect, useRef } from "react";

type State = { ok?: boolean; error?: string };

/** Small inline form for admin settings (categories, coupons). Resets after a successful create. */
export function SmallForm({
  action,
  submitLabel,
  resetOnSuccess = false,
  className = "",
  children,
}: {
  action: (prev: State, fd: FormData) => Promise<State>;
  submitLabel: string;
  resetOnSuccess?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok && resetOnSuccess) ref.current?.reset();
  }, [state, resetOnSuccess]);
  return (
    <form ref={ref} action={formAction} className={className}>
      {children}
      <div className="flex items-center gap-3">
        <button className="btn-primary px-5 py-2.5 text-sm" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </button>
        {state.error && <span className="text-sm text-terra">{state.error}</span>}
        {state.ok && !state.error && <span className="text-sm text-emerald-700">Saved.</span>}
      </div>
    </form>
  );
}
