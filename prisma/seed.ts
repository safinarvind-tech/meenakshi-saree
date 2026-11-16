/**
 * Seed the database with categories, the owner admin account, a sample coupon,
 * and sample sarees (using the placeholder stock photos in design/quiet-luxury/img).
 * Safe to run more than once.
 *
 *   npx prisma db seed
 */
import "../scripts/load-env";
import { readFile } from "node:fs/promises";
import path from "node:path";
import bcrypt from "bcryptjs";
import { db } from "../lib/db";
import { saveImageBuffer } from "../lib/storage";

const CATEGORIES = [
  { name: "Kanchipuram", slug: "kanchipuram", description: "Pure silk Kanjivarams with pure zari, woven in Kanchipuram.", sortOrder: 1 },
  { name: "Bridal", slug: "bridal", description: "Heirloom Kanjivarams for your wedding day.", sortOrder: 2 },
  { name: "Banarasi", slug: "banarasi", description: "Katan silk Banarasis with intricate brocade.", sortOrder: 3 },
  { name: "Soft Silk", slug: "soft-silk", description: "Lightweight silks for everyday elegance.", sortOrder: 4 },
  { name: "Tissue", slug: "tissue", description: "Shimmering tissue silks in gold and silver.", sortOrder: 5 },
];

type Seed = {
  sku: string; name: string; category: string; price: number; compareAt?: number; stock: number;
  colour: string; hex: string; occasion: string; weave: string; badge?: string; images: string[]; featured?: boolean;
};

const ZARI = "Pure silver zari dipped in gold";
const SAREES: Seed[] = [
  { sku: "SM-KJ-001", name: "Arakku Red Korvai Kanjivaram", category: "kanchipuram", price: 28500, compareAt: 32000, stock: 2, colour: "Arakku Red", hex: "#b3121c", occasion: "Wedding", weave: "Korvai, contrast border", badge: "New", images: ["studio-red"], featured: true },
  { sku: "SM-KJ-002", name: "Sunset Korvai Kanjivaram", category: "kanchipuram", price: 24900, stock: 1, colour: "Sunset Orange", hex: "#e06a1e", occasion: "Festive", weave: "Korvai, temple border", badge: "Bestseller", images: ["studio-orange"] },
  { sku: "SM-KJ-003", name: "Manjal Gold Pattu", category: "kanchipuram", price: 16200, stock: 3, colour: "Turmeric Yellow", hex: "#e7a21e", occasion: "Festive", weave: "Zari butta, rettai pet border", images: ["studio-yellow"] },
  { sku: "SM-KJ-004", name: "Rani & Black Temple Silk", category: "kanchipuram", price: 21500, stock: 2, colour: "Rani Pink", hex: "#c2127a", occasion: "Festive", weave: "Temple border", images: ["pink-black"] },
  { sku: "SM-KJ-005", name: "Saffron Swing Kanjivaram", category: "kanchipuram", price: 29900, stock: 1, colour: "Saffron", hex: "#d9641e", occasion: "Festive", weave: "Zari checks, grand pallu", images: ["swing-orange"] },
  { sku: "SM-BR-001", name: "Muhurtham Red Bridal Kanjivaram", category: "bridal", price: 48500, compareAt: 54000, stock: 1, colour: "Kumkum Red", hex: "#a5121b", occasion: "Bridal", weave: "Korvai, grand temple pallu", badge: "Limited", images: ["bride-red"], featured: true },
  { sku: "SM-BR-002", name: "Royal Purple Bridal Silk", category: "bridal", price: 42000, stock: 1, colour: "Royal Purple", hex: "#7b2c8f", occasion: "Bridal", weave: "Brocade, zari border", images: ["purple-bridal"] },
  { sku: "SM-BR-003", name: "Mustard Gold Bridal Kanjivaram", category: "bridal", price: 38500, stock: 1, colour: "Mustard", hex: "#d79a1c", occasion: "Bridal", weave: "Thread and zari motifs", images: ["bride-mustard"] },
  { sku: "SM-BR-004", name: "Rose Zari Bridal Kanjivaram", category: "bridal", price: 44000, stock: 1, colour: "Rose Pink", hex: "#d6336c", occasion: "Bridal", weave: "Zari butta, contrast border", images: ["bride-trees", "bride-garden"] },
  { sku: "SM-BN-001", name: "Peacock Teal Banarasi", category: "banarasi", price: 34900, stock: 2, colour: "Peacock Teal", hex: "#2bb3b1", occasion: "Reception", weave: "Kadhwa brocade", images: ["teal"] },
  { sku: "SM-BN-002", name: "Aubergine Zari Border Silk", category: "banarasi", price: 26400, stock: 2, colour: "Aubergine", hex: "#3b2559", occasion: "Festive", weave: "Zari border, plain body", images: ["purple-onred"] },
  { sku: "SM-SS-001", name: "Blush Rose Brocade Silk", category: "soft-silk", price: 19800, stock: 2, colour: "Blush Pink", hex: "#e7a9c0", occasion: "Festive", weave: "All-over brocade", images: ["pink-1", "pink-2"] },
  { sku: "SM-SS-002", name: "Emerald & Silver Soft Silk", category: "soft-silk", price: 12400, stock: 3, colour: "Emerald Green", hex: "#1e8a55", occasion: "Everyday", weave: "Silver zari border", images: ["green-silver"] },
  { sku: "SM-SS-003", name: "Coral Butta Soft Silk", category: "soft-silk", price: 14800, stock: 2, colour: "Coral", hex: "#e5533d", occasion: "Everyday", weave: "Zari butta", images: ["red-drape", "red-moody"] },
  { sku: "SM-SS-004", name: "Rainbow Organza Silk", category: "soft-silk", price: 9800, stock: 3, colour: "Multicolour", hex: "#6c63c7", occasion: "Everyday", weave: "Printed organza silk", images: ["multicolour"] },
];

const slugify = (s: string) => s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const IMG_DIR = path.join(process.cwd(), "design", "quiet-luxury", "img");

async function main() {
  // Categories
  const cats = new Map<string, string>();
  for (const c of CATEGORIES) {
    const row = await db.category.upsert({ where: { slug: c.slug }, update: {}, create: c });
    cats.set(c.slug, row.id);
  }
  console.log(`✓ ${CATEGORIES.length} categories`);

  // Owner account
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (email && password) {
    if (password.length < 10) throw new Error("ADMIN_PASSWORD must be at least 10 characters");
    const existing = await db.adminUser.findUnique({ where: { email } });
    if (!existing) {
      await db.adminUser.create({
        data: { email, name: process.env.ADMIN_NAME ?? "Store Owner", role: "OWNER", passwordHash: await bcrypt.hash(password, 12) },
      });
      console.log(`✓ owner account created: ${email}`);
    } else {
      console.log(`• owner account already exists: ${email}`);
    }
  } else {
    console.log("! ADMIN_EMAIL / ADMIN_PASSWORD not set — skipped creating the owner account");
  }

  // Sample coupon
  await db.coupon.upsert({
    where: { code: "WELCOME10" },
    update: {},
    create: { code: "WELCOME10", type: "PERCENT", value: 10, minOrder: 5000_00 },
  });
  console.log("✓ coupon WELCOME10 (10% off above ₹5,000)");

  // Sample sarees
  for (const s of SAREES) {
    const description =
      `A handwoven ${s.colour.toLowerCase()} silk saree with ${s.weave.toLowerCase()}, finished with ${ZARI.toLowerCase()}. ` +
      `Woven by master weavers and checked by our family before it reaches you.`;
    const product = await db.product.upsert({
      where: { sku: s.sku },
      update: {},
      create: {
        sku: s.sku,
        slug: slugify(s.name),
        name: s.name,
        description,
        categoryId: cats.get(s.category),
        fabric: s.category === "soft-silk" ? "Soft silk" : "Pure mulberry silk",
        weave: s.weave,
        zariType: ZARI,
        colour: s.colour,
        colourHex: s.hex,
        occasion: s.occasion,
        price: s.price * 100,
        compareAtPrice: s.compareAt ? s.compareAt * 100 : null,
        stock: s.stock,
        status: "ACTIVE",
        badge: s.badge,
        featured: s.featured ?? false,
      },
    });
    const hasImages = await db.productImage.count({ where: { productId: product.id } });
    if (!hasImages) {
      for (const [i, name] of s.images.entries()) {
        const url = await saveImageBuffer(await readFile(path.join(IMG_DIR, `${name}.jpg`)));
        await db.productImage.create({ data: { productId: product.id, url, alt: s.name, sortOrder: i } });
      }
    }
  }
  console.log(`✓ ${SAREES.length} sample sarees`);
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
