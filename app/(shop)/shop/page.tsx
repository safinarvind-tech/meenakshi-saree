import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";
import { ChevronDown, Search, SlidersHorizontal } from "lucide-react";
import { getCategories, getFilterOptions, searchProducts, SORTS, type ShopFilters, type SortKey } from "@/lib/catalog";
import { ProductCard, ProductGridSkeleton } from "@/components/shop/ProductCard";

export const metadata: Metadata = {
  title: "Shop silk sarees",
  description: "Browse handwoven Kanchipuram, Banarasi, soft silk and bridal sarees with pure zari.",
};

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;
const num = (v: string | undefined) => (v && /^\d+$/.test(v) ? Number(v) : undefined);

function parseFilters(sp: SP): ShopFilters {
  const sort = one(sp.sort);
  return {
    category: one(sp.category),
    q: one(sp.q)?.slice(0, 80),
    colour: one(sp.colour),
    occasion: one(sp.occasion),
    min: num(one(sp.min)),
    max: num(one(sp.max)),
    inStock: one(sp.stock) === "1",
    sort: sort && sort in SORTS ? (sort as SortKey) : "new",
    page: num(one(sp.page)),
  };
}

function hrefWith(f: ShopFilters, changes: Partial<Record<keyof ShopFilters, string | number | undefined>>) {
  const params = new URLSearchParams();
  const merged: Record<string, string | number | boolean | undefined> = { ...f, page: undefined, ...changes };
  for (const [k, v] of Object.entries(merged)) {
    if (v === undefined || v === "" || v === false) continue;
    if (k === "sort" && v === "new") continue;
    params.set(k === "inStock" ? "stock" : k, v === true ? "1" : String(v));
  }
  const qs = params.toString();
  return qs ? `/shop?${qs}` : "/shop";
}

export default function ShopPage({ searchParams }: PageProps<"/shop">) {
  return (
    <div className="mx-3 mt-6 sm:mx-6 sm:mt-10 lg:mx-10">
      <Suspense fallback={<ShopSkeleton />}>
        <ShopContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function ShopContent({ searchParams }: { searchParams: Promise<SP> }) {
  const f = parseFilters(await searchParams);
  const [result, categories, options] = await Promise.all([searchProducts(f), getCategories(), getFilterOptions()]);
  const current = categories.find((c) => c.slug === f.category);
  const activeFilters = [f.colour, f.occasion, f.min, f.max, f.inStock || undefined, f.sort !== "new" ? f.sort : undefined].filter(
    (v) => v !== undefined,
  ).length;

  return (
    <>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:mb-8 sm:gap-5 lg:flex-row lg:items-end">
        <div>
          <h1 className="h-display text-[42px] leading-none sm:text-6xl">
            {current ? current.name : f.q ? <>Results for “{f.q}”</> : <>All <em className="text-terra">sarees</em></>}
          </h1>
          <p className="mt-2 text-[15px] text-muted sm:mt-3 sm:text-base">
            {current?.description ?? "Handwoven silks, sourced directly from weaver families."} · {result.total}{" "}
            {result.total === 1 ? "saree" : "sarees"}
          </p>
        </div>
        <form action="/shop" className="flex w-full max-w-md gap-2" role="search">
          {f.category ? <input type="hidden" name="category" value={f.category} /> : null}
          <label htmlFor="q" className="sr-only">
            Search sarees
          </label>
          <input id="q" name="q" defaultValue={f.q} placeholder="Search colour, weave, fabric…" className="field rounded-full" type="search" enterKeyHint="search" />
          <button className="btn-primary shrink-0 px-4" aria-label="Search">
            <Search className="size-[18px]" />
          </button>
        </form>
      </div>

      {/* Category pills */}
      <nav className="no-scrollbar -mx-3 mb-5 flex gap-2 overflow-x-auto px-3 sm:mx-0 sm:mb-8 sm:flex-wrap sm:gap-2.5 sm:overflow-visible sm:px-0" aria-label="Categories">
        <Pill href={hrefWith(f, { category: undefined })} active={!f.category}>
          All
        </Pill>
        {categories.map((c) => (
          <Pill key={c.id} href={hrefWith(f, { category: c.slug })} active={f.category === c.slug}>
            {c.name}
          </Pill>
        ))}
      </nav>

      <div className="grid gap-5 sm:gap-8 lg:grid-cols-[250px_1fr]">
        {/* Filters (plain GET form, works without JavaScript) */}
        <aside>
          {/* Phones: filters fold away behind a CSS-only toggle (no JavaScript needed) */}
          <input type="checkbox" id="filters-toggle" className="peer sr-only" />
          <label
            htmlFor="filters-toggle"
            className="flex cursor-pointer items-center justify-between rounded-full border border-line bg-white px-5 py-3 text-[15px] peer-checked:[&>svg:last-child]:rotate-180 peer-focus-visible:ring-2 peer-focus-visible:ring-olive lg:hidden"
          >
            <SlidersHorizontal className="size-[18px]" strokeWidth={1.6} />
            <span className="mr-auto ml-3">
              Filters &amp; sort
              {activeFilters > 0 && <span className="ml-2 rounded-full bg-olive px-2 py-0.5 text-xs text-white">{activeFilters}</span>}
            </span>
            <ChevronDown className="size-4 transition-transform" />
          </label>
          <form action="/shop" className="mt-3 hidden space-y-5 rounded-[22px] bg-white p-5 peer-checked:block lg:mt-0 lg:block lg:space-y-6 lg:rounded-[var(--radius-card)] lg:p-6">
            {f.category ? <input type="hidden" name="category" value={f.category} /> : null}
            {f.q ? <input type="hidden" name="q" value={f.q} /> : null}
            <div>
              <label htmlFor="sort" className="label">
                Sort by
              </label>
              <select id="sort" name="sort" defaultValue={f.sort} className="field">
                {Object.entries(SORTS).map(([k, s]) => (
                  <option key={k} value={k}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <fieldset>
              <legend className="label">Price (₹)</legend>
              <div className="flex gap-2">
                <input name="min" inputMode="numeric" placeholder="Min" defaultValue={f.min} className="field" aria-label="Minimum price" />
                <input name="max" inputMode="numeric" placeholder="Max" defaultValue={f.max} className="field" aria-label="Maximum price" />
              </div>
            </fieldset>
            {options.colours.length > 0 && (
              <div>
                <label htmlFor="colour" className="label">
                  Colour
                </label>
                <select id="colour" name="colour" defaultValue={f.colour ?? ""} className="field">
                  <option value="">Any colour</option>
                  {options.colours.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
            )}
            {options.occasions.length > 0 && (
              <div>
                <label htmlFor="occasion" className="label">
                  Occasion
                </label>
                <select id="occasion" name="occasion" defaultValue={f.occasion ?? ""} className="field">
                  <option value="">Any occasion</option>
                  {options.occasions.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </div>
            )}
            <label className="flex items-center gap-2.5 text-[15px]">
              <input type="checkbox" name="stock" value="1" defaultChecked={f.inStock} className="size-4 accent-olive" />
              In stock only
            </label>
            <div className="flex gap-2">
              <button className="btn-primary flex-1">Apply</button>
              <Link href={f.category ? `/shop?category=${f.category}` : "/shop"} className="btn-outline">
                Reset
              </Link>
            </div>
          </form>
        </aside>

        <section>
          {result.items.length === 0 ? (
            <div className="rounded-[var(--radius-card)] bg-white p-12 text-center">
              <p className="font-serif text-2xl">No sarees match these filters.</p>
              <Link href="/shop" className="btn-primary mt-6">
                See all sarees
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
              {result.items.map((p, i) => (
                <ProductCard key={p.id} product={p} priority={i < 3} />
              ))}
            </div>
          )}

          {result.pages > 1 && (
            <nav className="mt-10 flex flex-wrap justify-center gap-2" aria-label="Pagination">
              {Array.from({ length: result.pages }, (_, i) => i + 1).map((n) => (
                <Pill key={n} href={hrefWith(f, { page: n === 1 ? undefined : n })} active={n === result.page}>
                  {n}
                </Pill>
              ))}
            </nav>
          )}
        </section>
      </div>
    </>
  );
}

function Pill({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`shrink-0 rounded-full border px-4 py-2 text-[15px] whitespace-nowrap transition-colors sm:px-5 sm:py-2.5 ${
        active ? "border-ink bg-ink text-white" : "border-line bg-white hover:border-ink"
      }`}
    >
      {children}
    </Link>
  );
}

function ShopSkeleton() {
  return (
    <>
      <div className="mb-8 h-14 w-72 animate-pulse rounded-2xl bg-oat" />
      <div className="grid gap-8 lg:grid-cols-[250px_1fr]">
        <div className="h-96 animate-pulse rounded-[var(--radius-card)] bg-white" />
        <ProductGridSkeleton count={6} />
      </div>
    </>
  );
}
