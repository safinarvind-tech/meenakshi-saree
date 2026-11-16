"use client";

import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import type { Category, Product } from "@/generated/prisma/client";
import type { ProductFormState } from "@/app/admin/(panel)/products/actions";

type Props = {
  product?: Product;
  categories: Category[];
  action: (prev: ProductFormState, formData: FormData) => Promise<ProductFormState>;
};

const rupees = (paise?: number | null) => (paise == null ? "" : String(paise / 100));

export function ProductForm({ product, categories, action }: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);
  const err = (k: string) => state.errors?.[k];

  // After a successful save, clear the chosen files so they aren't uploaded twice.
  useEffect(() => {
    if (state.saved && fileInput.current) {
      fileInput.current.value = "";
      setPreviews([]);
    }
  }, [state]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => formAction(fd));
      }}
      className="grid gap-6 pb-16 lg:grid-cols-[1fr_340px] lg:pb-0"
    >
      <div className="space-y-6">
        <Section title="Basic details">
          <F label="Saree name" name="name" error={err("name")} className="sm:col-span-2">
            <input id="name" name="name" defaultValue={product?.name} required className="field" placeholder="Arakku Red Korvai Kanjivaram" />
          </F>
          <F label="SKU (your stock code)" name="sku" error={err("sku")}>
            <input id="sku" name="sku" defaultValue={product?.sku} required className="field" placeholder="SM-KJ-0001" />
          </F>
          <F label="URL slug (auto from name if empty)" name="slug" error={err("slug")}>
            <input id="slug" name="slug" defaultValue={product?.slug} className="field" />
          </F>
          <F label="Description" name="description" error={err("description")} className="sm:col-span-2">
            <textarea id="description" name="description" defaultValue={product?.description} rows={5} className="field" />
          </F>
        </Section>

        <Section title="Saree details">
          <F label="Fabric" name="fabric"><input id="fabric" name="fabric" defaultValue={product?.fabric ?? ""} className="field" placeholder="Pure mulberry silk" /></F>
          <F label="Weave / border" name="weave"><input id="weave" name="weave" defaultValue={product?.weave ?? ""} className="field" placeholder="Korvai, temple border" /></F>
          <F label="Zari" name="zariType"><input id="zariType" name="zariType" defaultValue={product?.zariType ?? ""} className="field" placeholder="Pure gold zari" /></F>
          <F label="Occasion" name="occasion"><input id="occasion" name="occasion" defaultValue={product?.occasion ?? ""} className="field" placeholder="Bridal, Festive, Everyday" /></F>
          <F label="Colour name" name="colour"><input id="colour" name="colour" defaultValue={product?.colour ?? ""} className="field" placeholder="Arakku Red" /></F>
          <F label="Swatch colour" name="colourHex" error={err("colourHex")}>
            <input id="colourHex" name="colourHex" type="color" defaultValue={product?.colourHex ?? "#b3121c"} className="h-12 w-full cursor-pointer rounded-2xl border border-line bg-white p-1" />
          </F>
          <F label="Length (metres)" name="lengthMetres" error={err("lengthMetres")}>
            <input id="lengthMetres" name="lengthMetres" type="number" step="0.1" defaultValue={product?.lengthMetres ?? 6.3} className="field" />
          </F>
          <F label="Silk Mark ID" name="silkMarkId"><input id="silkMarkId" name="silkMarkId" defaultValue={product?.silkMarkId ?? ""} className="field" /></F>
          <label className="flex items-center gap-2.5 text-[15px] sm:col-span-2">
            <input type="checkbox" name="blouseIncluded" defaultChecked={product?.blouseIncluded ?? true} className="size-4 accent-olive" />
            Includes blouse piece
          </label>
        </Section>

        <Section title="Photos">
          <div className="sm:col-span-2">
            <input
              ref={fileInput}
              name="images"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              multiple
              onChange={(e) => setPreviews(Array.from(e.target.files ?? []).map((f) => URL.createObjectURL(f)))}
              className="block w-full rounded-2xl border border-dashed border-line bg-cream p-6 text-sm file:mr-4 file:rounded-full file:border-0 file:bg-olive file:px-4 file:py-2 file:text-white"
            />
            <p className="mt-2 text-xs text-muted">JPG, PNG or WebP up to 10 MB each. Portrait photos (3:4) look best. Images are resized and compressed automatically.</p>
            {previews.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {previews.map((src) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={src} src={src} alt="" className="h-28 w-20 rounded-xl object-cover" />
                ))}
              </div>
            )}
          </div>
        </Section>

        <Section title="Search engine (optional)">
          <F label="SEO title" name="seoTitle" className="sm:col-span-2"><input id="seoTitle" name="seoTitle" defaultValue={product?.seoTitle ?? ""} className="field" /></F>
          <F label="SEO description" name="seoDescription" className="sm:col-span-2"><textarea id="seoDescription" name="seoDescription" rows={2} defaultValue={product?.seoDescription ?? ""} className="field" /></F>
        </Section>
      </div>

      <div className="order-first space-y-6 lg:order-none">
        <div className="rounded-2xl bg-white p-5 sm:p-6 lg:sticky lg:top-6">
          <div className="space-y-4">
            <F label="Status" name="status">
              <select id="status" name="status" defaultValue={product?.status ?? "DRAFT"} className="field">
                <option value="DRAFT">Draft (hidden)</option>
                <option value="ACTIVE">Active (visible in store)</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </F>
            <F label="Category" name="categoryId">
              <select id="categoryId" name="categoryId" defaultValue={product?.categoryId ?? ""} className="field">
                <option value="">No category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </F>
            <F label="Selling price (₹)" name="price" error={err("price")}>
              <input id="price" name="price" inputMode="decimal" defaultValue={rupees(product?.price)} required className="field" />
            </F>
            <F label="Original price (₹, optional)" name="compareAtPrice" error={err("compareAtPrice")}>
              <input id="compareAtPrice" name="compareAtPrice" inputMode="decimal" defaultValue={rupees(product?.compareAtPrice)} className="field" />
            </F>
            <F label="Stock" name="stock" error={err("stock")}>
              <input id="stock" name="stock" type="number" min={0} defaultValue={product?.stock ?? 1} className="field" />
            </F>
            <F label="Badge (optional)" name="badge">
              <input id="badge" name="badge" list="badges" defaultValue={product?.badge ?? ""} className="field" />
              <datalist id="badges"><option value="New" /><option value="Bestseller" /><option value="Limited" /><option value="Bridal" /></datalist>
            </F>
            <label className="flex items-center gap-2.5 text-[15px]">
              <input type="checkbox" name="featured" defaultChecked={product?.featured} className="size-4 accent-olive" /> Featured
            </label>
          </div>
          {state.error && <p className="mt-4 rounded-xl bg-terra/10 px-3 py-2 text-sm text-terra" role="alert">{state.error}</p>}
          {state.saved && <p className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800" role="status">Saved.</p>}
          <button className="btn-primary mt-5 hidden w-full lg:flex" disabled={pending}>
            {pending ? "Saving…" : product ? "Save changes" : "Create product"}
          </button>
        </div>
      </div>

      {/* Phones: save bar stays above the bottom tab bar */}
      <div className="fixed inset-x-0 bottom-[calc(62px+env(safe-area-inset-bottom))] z-30 flex items-center gap-3 border-t border-line bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <span className="min-w-0 flex-1 truncate text-sm" role="status">
          {pending ? (
            <span className="text-muted">Saving…</span>
          ) : state.error ? (
            <span className="text-terra">{state.error}</span>
          ) : state.saved ? (
            <span className="text-emerald-700">Saved.</span>
          ) : (
            <span className="text-muted">{product ? product.name : "New saree"}</span>
          )}
        </span>
        <button className="btn-primary shrink-0 px-6 py-2.5" disabled={pending}>
          {pending ? "Saving…" : product ? "Save" : "Create"}
        </button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-white p-5 sm:p-6">
      <h2 className="mb-4 font-serif text-xl">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function F({ label, name, error, className = "", children }: { label: string; name: string; error?: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <label htmlFor={name} className="label">{label}</label>
      {children}
      {error && <p className="mt-1.5 text-sm text-terra">{error}</p>}
    </div>
  );
}
