import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ExternalLink, Star, Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { PageHeader, TableSkeleton } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/ProductForm";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { deleteProduct, deleteProductImage, makeCoverImage, saveProduct } from "../actions";

export const metadata = { title: "Edit saree" };

export default function EditProductPage({ params, searchParams }: PageProps<"/admin/products/[id]">) {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <EditProduct params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function EditProduct({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requireAdmin();
  const { id } = await params;
  const created = (await searchParams).created === "1";
  const [product, categories] = await Promise.all([
    db.product.findUnique({ where: { id }, include: { images: { orderBy: { sortOrder: "asc" } } } }),
    db.category.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  if (!product) notFound();

  return (
    <>
      <PageHeader
        title={product.name}
        action={
          product.status === "ACTIVE" ? (
            <Link href={`/product/${product.slug}`} target="_blank" className="btn-outline">
              View in store <ExternalLink className="size-4" />
            </Link>
          ) : null
        }
      >
        <Link href="/admin/products" className="hover:underline">← All products</Link>
      </PageHeader>

      {created && <p className="mb-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Product created. Set the status to Active when it&apos;s ready to sell.</p>}

      {product.images.length > 0 && (
        <section className="mb-6 rounded-2xl bg-white p-6">
          <h2 className="mb-4 font-serif text-xl">Current photos</h2>
          <div className="flex flex-wrap gap-4">
            {product.images.map((img, i) => (
              <div key={img.id} className="w-28">
                <div className={`relative h-36 overflow-hidden rounded-xl bg-oat ${i === 0 ? "ring-2 ring-olive" : ""}`}>
                  <Image src={img.url} alt="" fill sizes="112px" className="object-cover object-top" />
                  {i === 0 && <span className="absolute top-1.5 left-1.5 rounded-full bg-olive px-2 py-0.5 text-[10px] text-white">Main</span>}
                </div>
                <div className="mt-2 flex justify-between">
                  {i > 0 ? (
                    <form action={makeCoverImage.bind(null, img.id)}>
                      <button className="flex items-center gap-1 text-xs text-muted hover:text-ink" title="Make main photo">
                        <Star className="size-3.5" /> Main
                      </button>
                    </form>
                  ) : (
                    <span />
                  )}
                  <form action={deleteProductImage.bind(null, img.id)}>
                    <button className="text-muted hover:text-terra" title="Delete photo" aria-label="Delete photo">
                      <Trash2 className="size-4" />
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <ProductForm product={product} categories={categories} action={saveProduct.bind(null, product.id)} />

      {admin.role === "OWNER" && (
        <form action={deleteProduct.bind(null, product.id)} className="mt-10 rounded-2xl border border-terra/30 bg-white p-6">
          <h2 className="font-serif text-xl text-terra">Delete product</h2>
          <p className="mt-1 text-sm text-muted">Products that have orders are archived instead, so your order history stays intact.</p>
          <ConfirmButton message="Delete this product? This cannot be undone." className="btn mt-4 border border-terra text-terra hover:bg-terra hover:text-white">Delete product</ConfirmButton>
        </form>
      )}
    </>
  );
}
