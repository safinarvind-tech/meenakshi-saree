"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { rupeesToPaise, slugify } from "@/lib/format";
import { deleteMedia, saveProductImage } from "@/lib/storage";
import { Prisma } from "@/generated/prisma/client";

export type ProductFormState = { error?: string; errors?: Record<string, string>; saved?: boolean };

const optionalText = z.string().trim().max(200).transform((v) => v || null);
const money = z
  .string()
  .trim()
  .regex(/^[\d,]+(\.\d{1,2})?$/, "Enter an amount in rupees, e.g. 28500")
  .transform((v) => rupeesToPaise(v));

const productSchema = z.object({
  name: z.string().trim().min(3, "Name is too short.").max(150),
  slug: z.string().trim().max(160).optional(),
  sku: z.string().trim().min(2, "SKU is required.").max(40),
  categoryId: z.string().trim().transform((v) => v || null),
  price: money,
  compareAtPrice: z.union([z.literal(""), money]).transform((v) => (v === "" ? null : v)),
  stock: z.coerce.number().int().min(0, "Stock can't be negative.").max(100000),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]),
  badge: optionalText,
  description: z.string().trim().max(5000).default(""),
  fabric: optionalText,
  weave: optionalText,
  zariType: optionalText,
  colour: optionalText,
  colourHex: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/).or(z.literal("")).transform((v) => v || null),
  occasion: optionalText,
  lengthMetres: z.coerce.number().min(1).max(12),
  silkMarkId: optionalText,
  seoTitle: optionalText,
  seoDescription: z.string().trim().max(300).transform((v) => v || null),
});

function fieldErrors(error: z.ZodError) {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) errors[String(issue.path[0])] ??= issue.message;
  return errors;
}

async function uploadImages(productId: string, files: File[], startOrder: number) {
  const real = files.filter((f) => f && f.size > 0);
  for (const [i, file] of real.entries()) {
    const url = await saveProductImage(file);
    await db.productImage.create({ data: { productId, url, sortOrder: startOrder + i } });
  }
}

export async function saveProduct(productId: string | null, _prev: ProductFormState, formData: FormData): Promise<ProductFormState> {
  await requireAdmin(["OWNER", "MANAGER"]);
  const parsed = productSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error), error: "Please fix the highlighted fields." };
  const d = parsed.data;
  if (d.compareAtPrice != null && d.compareAtPrice <= d.price) {
    return { errors: { compareAtPrice: "Original price must be higher than the selling price." } };
  }
  const data = {
    ...d,
    slug: slugify(d.slug || d.name),
    blouseIncluded: formData.get("blouseIncluded") === "on",
    featured: formData.get("featured") === "on",
  };
  const files = formData.getAll("images") as File[];

  let id = productId;
  try {
    if (id) {
      await db.product.update({ where: { id }, data });
      const count = await db.productImage.count({ where: { productId: id } });
      await uploadImages(id, files, count);
    } else {
      const created = await db.product.create({ data });
      id = created.id;
      await uploadImages(id, files, 0);
    }
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const target = String(e.meta?.target ?? "");
      return { errors: target.includes("sku") ? { sku: "This SKU is already used." } : { slug: "This URL slug is already used." } };
    }
    if (e instanceof Error && e.message.includes("image")) return { error: e.message };
    throw e;
  }

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}`);
  if (!productId) redirect(`/admin/products/${id}?created=1`);
  return { saved: true };
}

export async function deleteProductImage(imageId: string) {
  await requireAdmin(["OWNER", "MANAGER"]);
  const img = await db.productImage.delete({ where: { id: imageId } });
  await deleteMedia(img.url);
  revalidatePath(`/admin/products/${img.productId}`);
}

/** Move an image to the front so it becomes the main product photo. */
export async function makeCoverImage(imageId: string) {
  await requireAdmin(["OWNER", "MANAGER"]);
  const img = await db.productImage.findUniqueOrThrow({ where: { id: imageId } });
  const all = await db.productImage.findMany({ where: { productId: img.productId }, orderBy: { sortOrder: "asc" } });
  const ordered = [img, ...all.filter((i) => i.id !== img.id)];
  await db.$transaction(ordered.map((i, idx) => db.productImage.update({ where: { id: i.id }, data: { sortOrder: idx } })));
  revalidatePath(`/admin/products/${img.productId}`);
}

export async function deleteProduct(productId: string) {
  await requireAdmin(["OWNER"]);
  const hasOrders = await db.orderItem.count({ where: { productId } });
  if (hasOrders > 0) {
    // Keep order history intact: archive instead of deleting.
    await db.product.update({ where: { id: productId }, data: { status: "ARCHIVED" } });
  } else {
    const images = await db.productImage.findMany({ where: { productId } });
    await db.product.delete({ where: { id: productId } });
    await Promise.all(images.map((i) => deleteMedia(i.url)));
  }
  revalidatePath("/admin/products");
  redirect("/admin/products");
}
