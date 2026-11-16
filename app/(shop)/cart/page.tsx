import type { Metadata } from "next";
import { CartView } from "@/components/shop/CartView";

export const metadata: Metadata = { title: "Your bag", robots: { index: false } };

export default function CartPage() {
  return (
    <div className="mx-3 mt-6 sm:mx-6 sm:mt-10 lg:mx-10">
      <h1 className="h-display mb-5 text-[42px] sm:mb-8 sm:text-6xl">
        Your <em className="text-terra">bag</em>
      </h1>
      <CartView />
    </div>
  );
}
