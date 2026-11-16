"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AddOn, BlouseOption } from "@/lib/pricing";

export type CartItem = {
  key: string; // productId + options, so the same saree with different options is a separate line
  productId: string;
  slug: string;
  name: string;
  image: string | null;
  unitPrice: number; // paise, display only; the server recalculates at checkout
  blouse: BlouseOption;
  addOns: AddOn[];
  quantity: number;
  maxQuantity: number;
};

type CartState = {
  items: CartItem[];
  add: (item: Omit<CartItem, "key">) => void;
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
};

export const itemKey = (productId: string, blouse: BlouseOption, addOns: AddOn[]) =>
  [productId, blouse, ...[...addOns].sort()].join(":");

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add: (item) =>
        set((state) => {
          const key = itemKey(item.productId, item.blouse, item.addOns);
          const existing = state.items.find((i) => i.key === key);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.key === key ? { ...i, quantity: Math.min(i.quantity + item.quantity, i.maxQuantity) } : i,
              ),
            };
          }
          return { items: [...state.items, { ...item, key }] };
        }),
      setQuantity: (key, quantity) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.key === key ? { ...i, quantity: Math.max(1, Math.min(quantity, i.maxQuantity)) } : i,
          ),
        })),
      remove: (key) => set((state) => ({ items: state.items.filter((i) => i.key !== key) })),
      clear: () => set({ items: [] }),
    }),
    { name: "sm-cart", version: 1 },
  ),
);

export const cartCount = (items: CartItem[]) => items.reduce((n, i) => n + i.quantity, 0);
export const cartSubtotal = (items: CartItem[]) => items.reduce((n, i) => n + i.unitPrice * i.quantity, 0);
