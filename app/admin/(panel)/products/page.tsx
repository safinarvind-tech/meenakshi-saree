import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { formatINR } from "@/lib/format";
import { Empty, PageHeader, ProductBadge, TableSkeleton, Tabs, td, th } from "@/components/admin/ui";
import type { Prisma, ProductStatus } from "@/generated/prisma/client";

export const metadata = { title: "Products" };

export default function ProductsPage({ searchParams }: PageProps<"/admin/products">) {
  return (
    <>
      <PageHeader
        title="Products"
        action={
          <Link href="/admin/products/new" className="btn-primary">
            <Plus className="size-4" /> Add saree
          </Link>
        }
      />
      <Suspense fallback={<TableSkeleton />}>
        <ProductList searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function ProductList({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const sp = await searchParams;
  const status = typeof sp.status === "string" && ["DRAFT", "ACTIVE", "ARCHIVED"].includes(sp.status) ? (sp.status as ProductStatus) : undefined;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const lowStock = sp.stock === "low";

  const where: Prisma.ProductWhereInput = {
    ...(status ? { status } : {}),
    ...(lowStock ? { stock: { lte: 1 }, status: "ACTIVE" } : {}),
    ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { sku: { contains: q, mode: "insensitive" } }] } : {}),
  };
  const [products, counts] = await Promise.all([
    db.product.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: 200,
      include: { images: { orderBy: { sortOrder: "asc" }, take: 1 }, category: true },
    }),
    db.product.groupBy({ by: ["status"], _count: true }),
  ]);
  const count = (s: ProductStatus) => counts.find((c) => c.status === s)?._count ?? 0;

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <Tabs
          items={[
            { href: "/admin/products", label: "All", active: !status && !lowStock },
            { href: "/admin/products?status=ACTIVE", label: "Active", active: status === "ACTIVE", count: count("ACTIVE") },
            { href: "/admin/products?status=DRAFT", label: "Drafts", active: status === "DRAFT", count: count("DRAFT") },
            { href: "/admin/products?status=ARCHIVED", label: "Archived", active: status === "ARCHIVED", count: count("ARCHIVED") },
            { href: "/admin/products?stock=low", label: "Low stock", active: lowStock },
          ]}
        />
        <form className="mb-5 flex w-full gap-2 sm:w-auto">
          {status && <input type="hidden" name="status" value={status} />}
          <input name="q" defaultValue={q} placeholder="Search name or SKU" className="field w-full py-2 sm:w-64" />
        </form>
      </div>
      {products.length === 0 ? (
        <Empty>No products found.</Empty>
      ) : (
        <>
        <ul className="divide-y divide-line/60 overflow-hidden rounded-2xl bg-white md:hidden">
          {products.map((p) => (
            <li key={p.id}>
              <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3 p-3 active:bg-cream">
                <span className="relative h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-oat">
                  {p.images[0] && <Image src={p.images[0].url} alt="" fill sizes="48px" className="object-cover object-top" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-medium">{p.name}</span>
                  <span className="block text-xs text-muted">
                    {p.sku}
                    {p.category ? ` · ${p.category.name}` : ""}
                  </span>
                  <span className="mt-1 flex items-center gap-1.5 text-sm">
                    {formatINR(p.price)}
                    <span className={p.stock <= 1 ? "font-medium text-terra" : "text-muted"}>
                      · {p.stock === 0 ? "Sold out" : `${p.stock} in stock`}
                    </span>
                  </span>
                </span>
                <ProductBadge status={p.status} />
              </Link>
            </li>
          ))}
        </ul>
        <div className="hidden overflow-x-auto rounded-2xl bg-white md:block">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-line">
              <tr>
                <th className={th}>Saree</th>
                <th className={th}>Category</th>
                <th className={th}>Price</th>
                <th className={th}>Stock</th>
                <th className={th}>Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-cream/60">
                  <td className={td}>
                    <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3">
                      <span className="relative h-14 w-11 shrink-0 overflow-hidden rounded-lg bg-oat">
                        {p.images[0] && <Image src={p.images[0].url} alt="" fill sizes="44px" className="object-cover object-top" />}
                      </span>
                      <span>
                        <span className="block font-medium hover:underline">{p.name}</span>
                        <span className="text-xs text-muted">{p.sku}</span>
                      </span>
                    </Link>
                  </td>
                  <td className={td}>{p.category?.name ?? "—"}</td>
                  <td className={td}>{formatINR(p.price)}</td>
                  <td className={`${td} ${p.stock <= 1 ? "font-medium text-terra" : ""}`}>{p.stock}</td>
                  <td className={td}>
                    <ProductBadge status={p.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
    </>
  );
}
