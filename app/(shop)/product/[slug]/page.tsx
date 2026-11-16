import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BadgeCheck, RotateCcw, Truck, Video } from "lucide-react";
import { getProductBySlug, getRelatedProducts } from "@/lib/catalog";
import { formatINR } from "@/lib/format";
import { Gallery } from "@/components/shop/Gallery";
import { AddToBag } from "@/components/shop/AddToBag";
import { ProductCard, ProductGridSkeleton } from "@/components/shop/ProductCard";

export async function generateMetadata({ params }: PageProps<"/product/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Saree not found" };
  const description = product.seoDescription || product.description.slice(0, 160);
  return {
    title: product.seoTitle || product.name,
    description,
    openGraph: { title: product.name, description, images: product.images[0] ? [product.images[0].url] : [] },
  };
}

export default function ProductPage({ params }: PageProps<"/product/[slug]">) {
  return (
    <div className="mx-3 mt-4 sm:mx-6 sm:mt-8 lg:mx-10">
      <Suspense fallback={<ProductSkeleton />}>
        <ProductContent params={params} />
      </Suspense>
    </div>
  );
}

async function ProductContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const details = [
    ["Fabric", product.fabric],
    ["Weave", product.weave],
    ["Zari", product.zariType],
    ["Colour", product.colour],
    ["Occasion", product.occasion],
    ["Length", `${product.lengthMetres} m${product.blouseIncluded ? " (includes blouse piece)" : ""}`],
    ["Silk Mark ID", product.silkMarkId],
    ["SKU", product.sku],
  ].filter((d): d is [string, string] => Boolean(d[1]));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    sku: product.sku,
    image: product.images.map((i) => i.url),
    brand: { "@type": "Brand", name: "Sri Meenakshi Silk House" },
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: (product.price / 100).toFixed(2),
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  return (
    <>
      <nav className="mb-4 truncate text-sm text-muted sm:mb-6" aria-label="Breadcrumb">
        <Link href="/shop" className="hover:text-ink">
          Shop
        </Link>
        {product.category && (
          <>
            {" / "}
            <Link href={`/shop?category=${product.category.slug}`} className="hover:text-ink">
              {product.category.name}
            </Link>
          </>
        )}
        {" / "}
        <span className="text-ink">{product.name}</span>
      </nav>

      <div className="grid gap-6 sm:gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        <Gallery images={product.images} name={product.name} />

        <div>
          {product.badge && <span className="rounded-full bg-olive px-3 py-1.5 text-xs text-white">{product.badge}</span>}
          <h1 className="h-display mt-3 text-[34px] leading-[1.05] sm:mt-4 sm:text-5xl">{product.name}</h1>
          <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 sm:mt-5">
            <span className="text-3xl font-medium">{formatINR(product.price)}</span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <>
                <s className="text-lg text-muted">{formatINR(product.compareAtPrice)}</s>
                <span className="rounded-full bg-terra/10 px-2.5 py-1 text-sm text-terra">
                  {Math.round((1 - product.price / product.compareAtPrice) * 100)}% off
                </span>
              </>
            )}
          </div>
          <p className="mt-1 text-sm text-muted">Inclusive of all taxes</p>

          {product.description && <p className="mt-6 leading-relaxed whitespace-pre-line text-ink/85">{product.description}</p>}

          <div className="mt-8">
            <AddToBag
              product={{
                id: product.id,
                slug: product.slug,
                name: product.name,
                price: product.price,
                stock: product.stock,
                image: product.images[0]?.url ?? null,
              }}
            />
          </div>

          <ul className="mt-8 grid grid-cols-2 gap-3 rounded-[22px] bg-white p-5 text-sm sm:rounded-[var(--radius-card)] sm:p-6 sm:text-[15px]">
            <li className="flex items-center gap-2.5 sm:gap-3">
              <BadgeCheck className="size-5 shrink-0 text-gold" /> Silk Mark certified
            </li>
            <li className="flex items-center gap-2.5 sm:gap-3">
              <Truck className="size-5 shrink-0 text-gold" /> Free shipping above ₹5,000
            </li>
            <li className="flex items-center gap-2.5 sm:gap-3">
              <RotateCcw className="size-5 shrink-0 text-gold" /> 7-day exchange
            </li>
            <li className="flex items-center gap-2.5 sm:gap-3">
              <Video className="size-5 shrink-0 text-gold" />
              <Link href="/video-call" className="underline underline-offset-4">
                See it on video call
              </Link>
            </li>
          </ul>

          {details.length > 0 && (
            <dl className="mt-8 divide-y divide-line border-y border-line">
              {details.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-6 py-3 text-[15px]">
                  <dt className="text-muted">{k}</dt>
                  <dd className="text-right">{v}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>

      <section className="mt-16 sm:mt-24">
        <h2 className="h-display mb-6 text-[34px] sm:mb-8 sm:text-5xl">
          You may also <em className="text-terra">love</em>
        </h2>
        <Suspense fallback={<ProductGridSkeleton />}>
          <Related productId={product.id} categoryId={product.categoryId} />
        </Suspense>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </>
  );
}

async function Related({ productId, categoryId }: { productId: string; categoryId: string | null }) {
  const items = await getRelatedProducts(productId, categoryId);
  if (items.length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
      {items.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}

function ProductSkeleton() {
  return (
    <div className="grid gap-6 sm:gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
      <div className="aspect-[3/4] animate-pulse rounded-[var(--radius-panel)] bg-oat" />
      <div className="space-y-4">
        <div className="h-12 w-3/4 animate-pulse rounded-2xl bg-oat" />
        <div className="h-8 w-1/3 animate-pulse rounded-2xl bg-oat" />
        <div className="h-48 animate-pulse rounded-2xl bg-oat" />
      </div>
    </div>
  );
}
