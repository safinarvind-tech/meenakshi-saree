import Image from "next/image";
import Link from "next/link";
import type { ProductCardData } from "@/lib/catalog";
import { formatINR } from "@/lib/format";

export function ProductCard({ product, priority = false }: { product: ProductCardData; priority?: boolean }) {
  const img = product.images[0];
  const soldOut = product.stock <= 0;
  return (
    <Link href={`/product/${product.slug}`} className="group block min-w-0 rounded-[20px] bg-white p-2 pb-4 transition-shadow sm:rounded-[var(--radius-card)] sm:p-2.5 sm:pb-5 hover:shadow-[0_12px_40px_rgba(47,58,38,0.10)]">
      <div className="relative aspect-[3/4] overflow-hidden rounded-[14px] bg-oat sm:rounded-[20px]">
        {img ? (
          <Image
            src={img.url}
            alt={img.alt || product.name}
            fill
            sizes="(min-width: 1024px) 25vw, 50vw"
            className="object-cover object-[50%_25%] transition-transform duration-500 group-hover:scale-[1.03]"
            priority={priority}
          />
        ) : null}
        {soldOut ? (
          <span className="absolute top-2 left-2 rounded-full bg-ink px-2.5 py-1 text-[11px] text-white sm:top-3 sm:left-3 sm:px-3 sm:py-1.5 sm:text-xs">Sold out</span>
        ) : product.badge ? (
          <span className="absolute top-2 left-2 rounded-full bg-olive px-2.5 py-1 text-[11px] text-white sm:top-3 sm:left-3 sm:px-3 sm:py-1.5 sm:text-xs">{product.badge}</span>
        ) : null}
      </div>
      <h3 className="mx-1.5 mt-3 line-clamp-2 font-serif text-[16px] leading-snug sm:mx-2.5 sm:mt-4 sm:text-[21px]">{product.name}</h3>
      <div className="mx-1.5 mt-1.5 flex items-center justify-between gap-2 sm:mx-2.5 sm:mt-2">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-2">
          <span className="text-[15px] font-medium sm:text-[17px]">{formatINR(product.price)}</span>
          {product.compareAtPrice && product.compareAtPrice > product.price ? (
            <s className="text-xs text-muted sm:text-sm">{formatINR(product.compareAtPrice)}</s>
          ) : null}
        </div>
        {product.colourHex ? (
          <span
            className="size-4 shrink-0 rounded-full border-2 border-white shadow-[0_0_0_1px_var(--color-line)]"
            style={{ background: product.colourHex }}
            title={product.colour ?? undefined}
          />
        ) : null}
      </div>
    </Link>
  );
}

export function ProductGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="rounded-[var(--radius-card)] bg-white p-2.5 pb-5">
          <div className="aspect-[3/4] animate-pulse rounded-[20px] bg-oat" />
          <div className="mx-2.5 mt-4 h-5 w-3/4 animate-pulse rounded bg-oat" />
          <div className="mx-2.5 mt-3 h-4 w-1/3 animate-pulse rounded bg-oat" />
        </div>
      ))}
    </div>
  );
}
