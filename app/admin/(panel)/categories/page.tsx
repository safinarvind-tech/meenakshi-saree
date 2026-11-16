import { Suspense } from "react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { Card, PageHeader, TableSkeleton } from "@/components/admin/ui";
import { SmallForm } from "@/components/admin/SmallForm";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { deleteCategory, saveCategory } from "../settings-actions";

export const metadata = { title: "Categories" };

export default function CategoriesPage() {
  return (
    <>
      <PageHeader title="Categories">Weaves and collections shown in the store menu and filters.</PageHeader>
      <Suspense fallback={<TableSkeleton />}>
        <Categories />
      </Suspense>
    </>
  );
}

function Fields({ c }: { c?: { name: string; slug: string; description: string | null; sortOrder: number } }) {
  return (
    <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-[1fr_1fr_2fr_90px]">
      <label className="block">
        <span className="mb-1 block text-xs text-muted">Name</span>
        <input name="name" defaultValue={c?.name} required placeholder="e.g. Kanchipuram" className="field py-2" />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs text-muted">URL slug</span>
        <input name="slug" defaultValue={c?.slug} placeholder="auto" className="field py-2" />
      </label>
      <label className="col-span-2 block sm:col-span-1">
        <span className="mb-1 block text-xs text-muted">Short description</span>
        <input name="description" defaultValue={c?.description ?? ""} className="field py-2" />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs text-muted">Order</span>
        <input name="sortOrder" type="number" defaultValue={c?.sortOrder ?? 0} className="field py-2" />
      </label>
    </div>
  );
}

async function Categories() {
  await requireAdmin();
  const categories = await db.category.findMany({ orderBy: { sortOrder: "asc" }, include: { _count: { select: { products: true } } } });
  return (
    <div className="space-y-4">
      <Card>
        <h2 className="mb-3 font-serif text-lg">Add category</h2>
        <SmallForm action={saveCategory.bind(null, null)} submitLabel="Add category" resetOnSuccess>
          <Fields />
        </SmallForm>
      </Card>
      {categories.map((c) => (
        <Card key={c.id}>
          <div className="mb-3 flex items-center justify-between gap-3 text-sm text-muted">
            <span className="min-w-0 truncate">
              /shop?category={c.slug} · {c._count.products} products
            </span>
            <form action={deleteCategory.bind(null, c.id)}>
              <ConfirmButton message={`Delete “${c.name}”? Its products will stay, without a category.`} className="text-terra hover:underline">
                Delete
              </ConfirmButton>
            </form>
          </div>
          <SmallForm action={saveCategory.bind(null, c.id)} submitLabel="Save">
            <Fields c={c} />
          </SmallForm>
        </Card>
      ))}
    </div>
  );
}
