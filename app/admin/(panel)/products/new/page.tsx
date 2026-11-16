import Link from "next/link";
import { Suspense } from "react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { PageHeader, TableSkeleton } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/ProductForm";
import { saveProduct } from "../actions";

export const metadata = { title: "Add saree" };

export default function NewProductPage() {
  return (
    <>
      <PageHeader title="Add saree">
        <Link href="/admin/products" className="hover:underline">← All products</Link>
      </PageHeader>
      <Suspense fallback={<TableSkeleton />}>
        <NewProductForm />
      </Suspense>
    </>
  );
}

async function NewProductForm() {
  await requireAdmin(["OWNER", "MANAGER"]);
  const categories = await db.category.findMany({ orderBy: { sortOrder: "asc" } });
  return <ProductForm categories={categories} action={saveProduct.bind(null, null)} />;
}
