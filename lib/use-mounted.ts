"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** True only in the browser after hydration. Use it to show values that come from localStorage (e.g. the cart). */
export function useMounted() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
