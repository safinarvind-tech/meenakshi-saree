import { cache } from "react";
import { connection } from "next/server";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

// Every storefront read calls connection() first so it runs at request time
// (fresh stock and prices, and the build never needs a database).

const cardSelect = {
  id: true,
  slug: true,
  name: true,
  price: true,
  compareAtPrice: true,
  badge: true,
  stock: true,
  colour: true,
  colourHex: true,
  images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true, alt: true } },
} satisfies Prisma.ProductSelect;

export type ProductCardData = Prisma.ProductGetPayload<{ select: typeof cardSelect }>;

export async function getCategories() {
  await connection();
  return db.category.findMany({ orderBy: { sortOrder: "asc" } });
}

export async function getNewArrivals(limit = 8) {
  await connection();
  return db.product.findMany({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: cardSelect,
  });
}

export const SORTS = {
  new: { label: "Newest", orderBy: { createdAt: "desc" } },
  "price-asc": { label: "Price: low to high", orderBy: { price: "asc" } },
  "price-desc": { label: "Price: high to low", orderBy: { price: "desc" } },
} as const satisfies Record<string, { label: string; orderBy: Prisma.ProductOrderByWithRelationInput }>;
export type SortKey = keyof typeof SORTS;

export type ShopFilters = {
  category?: string;
  q?: string;
  colour?: string;
  occasion?: string;
  min?: number; // rupees
  max?: number; // rupees
  inStock?: boolean;
  sort?: SortKey;
  page?: number;
};

const PAGE_SIZE = 12;

export async function searchProducts(f: ShopFilters) {
  await connection();
  const where: Prisma.ProductWhereInput = { status: "ACTIVE" };
  if (f.category) where.category = { slug: f.category };
  if (f.colour) where.colour = { contains: f.colour, mode: "insensitive" };
  if (f.occasion) where.occasion = { equals: f.occasion, mode: "insensitive" };
  if (f.inStock) where.stock = { gt: 0 };
  if (f.min != null || f.max != null) {
    where.price = {
      ...(f.min != null ? { gte: f.min * 100 } : {}),
      ...(f.max != null ? { lte: f.max * 100 } : {}),
    };
  }
  if (f.q) {
    where.OR = [
      { name: { contains: f.q, mode: "insensitive" } },
      { description: { contains: f.q, mode: "insensitive" } },
      { colour: { contains: f.q, mode: "insensitive" } },
      { fabric: { contains: f.q, mode: "insensitive" } },
      { weave: { contains: f.q, mode: "insensitive" } },
    ];
  }
  const page = Math.max(1, f.page ?? 1);
  const [items, total] = await Promise.all([
    db.product.findMany({
      where,
      orderBy: SORTS[f.sort ?? "new"].orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: cardSelect,
    }),
    db.product.count({ where }),
  ]);
  return { items, total, page, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

/** Distinct filter values for the shop sidebar. */
export async function getFilterOptions() {
  await connection();
  const [colours, occasions] = await Promise.all([
    db.product.findMany({ where: { status: "ACTIVE", colour: { not: null } }, distinct: ["colour"], select: { colour: true } }),
    db.product.findMany({ where: { status: "ACTIVE", occasion: { not: null } }, distinct: ["occasion"], select: { occasion: true } }),
  ]);
  return {
    colours: colours.map((c) => c.colour!).sort(),
    occasions: occasions.map((o) => o.occasion!).sort(),
  };
}

export const getProductBySlug = cache(async (slug: string) => {
  await connection();
  return db.product.findFirst({
    where: { slug, status: "ACTIVE" },
    include: { images: { orderBy: { sortOrder: "asc" } }, category: true },
  });
});

export async function getRelatedProducts(productId: string, categoryId: string | null, limit = 4) {
  await connection();
  return db.product.findMany({
    where: { status: "ACTIVE", id: { not: productId }, ...(categoryId ? { categoryId } : {}) },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: cardSelect,
  });
}
