import Link from "next/link";
import type { OrderStatus, PaymentStatus, ProductStatus } from "@/generated/prisma/client";

export function PageHeader({ title, action, children }: { title: string; action?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-serif text-3xl sm:text-4xl">{title}</h1>
        {children && <div className="mt-1 text-sm text-muted">{children}</div>}
      </div>
      {action}
    </div>
  );
}

export function Card({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <div className={`rounded-2xl bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:p-6 ${className}`}>{children}</div>;
}

const ORDER_COLORS: Record<OrderStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-sky-100 text-sky-800",
  PACKED: "bg-indigo-100 text-indigo-800",
  SHIPPED: "bg-violet-100 text-violet-800",
  DELIVERED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-stone-200 text-stone-600",
  RETURNED: "bg-rose-100 text-rose-800",
};
const PAYMENT_COLORS: Record<PaymentStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  PAID: "bg-emerald-100 text-emerald-800",
  FAILED: "bg-rose-100 text-rose-800",
  REFUNDED: "bg-stone-200 text-stone-600",
};
const PRODUCT_COLORS: Record<ProductStatus, string> = {
  DRAFT: "bg-stone-200 text-stone-700",
  ACTIVE: "bg-emerald-100 text-emerald-800",
  ARCHIVED: "bg-rose-100 text-rose-800",
};

function Badge({ className, children }: { className: string; children: React.ReactNode }) {
  return <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${className}`}>{children}</span>;
}
const nice = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

export const OrderBadge = ({ status }: { status: OrderStatus }) => <Badge className={ORDER_COLORS[status]}>{nice(status)}</Badge>;
export const PaymentBadge = ({ status }: { status: PaymentStatus }) => <Badge className={PAYMENT_COLORS[status]}>{nice(status)}</Badge>;
export const ProductBadge = ({ status }: { status: ProductStatus }) => <Badge className={PRODUCT_COLORS[status]}>{nice(status)}</Badge>;

export function Tabs({ items }: { items: { href: string; label: string; active: boolean; count?: number }[] }) {
  return (
    <div className="mb-5 flex gap-1 overflow-x-auto rounded-2xl bg-white p-1.5">
      {items.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className={`shrink-0 rounded-xl px-4 py-2 text-sm transition-colors ${t.active ? "bg-olive text-white" : "hover:bg-oat"}`}
        >
          {t.label}
          {t.count != null && <span className="ml-1.5 opacity-70">{t.count}</span>}
        </Link>
      ))}
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl bg-white p-12 text-center text-muted">{children}</div>;
}

export function TableSkeleton() {
  return <div className="h-96 animate-pulse rounded-2xl bg-white" />;
}

export const th = "px-4 py-3 text-left text-xs font-medium tracking-wide text-muted uppercase";
export const td = "px-4 py-3 align-middle";
