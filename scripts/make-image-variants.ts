/**
 * Creates the 640px / 1200px copies (see lib/image-variants.ts) for photos that don't have them yet:
 *   - brand photos in public/brand (plus a small logo), and
 *   - every product photo in the database the env points at (disk or Supabase).
 * Safe to run more than once.
 *   npm run images:variants                 (local database + storage)
 *   npm run images:variants:production      (uses .env.production)
 */
import "./load-env";
import { existsSync } from "node:fs";
import { readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { db } from "../lib/db";
import { VARIANT_WIDTHS, variantUrl } from "../lib/image-variants";
import { keyFromUrl, readStored, saveVariants } from "../lib/storage";

const BRAND = path.join(process.cwd(), "public", "brand");

async function brand() {
  let made = 0;
  for (const file of await readdir(BRAND)) {
    if (!/\.(jpe?g|png)$/i.test(file) || file.startsWith("logo")) continue;
    for (const w of VARIANT_WIDTHS) {
      const out = path.join(BRAND, path.basename(variantUrl(`/brand/${file}`, w)));
      if (existsSync(out)) continue;
      await sharp(path.join(BRAND, file)).rotate().resize({ width: w, withoutEnlargement: true }).webp({ quality: 80 }).toFile(out);
      made++;
    }
  }
  const logo = path.join(BRAND, "logo-192.webp");
  if (!existsSync(logo)) {
    await writeFile(logo, await sharp(path.join(BRAND, "logo.png")).resize(192, 192).webp({ quality: 90 }).toBuffer());
    made++;
  }
  console.log(`✓ brand photos: ${made} copies made`);
}

async function products() {
  const images = await db.productImage.findMany({ select: { url: true } });
  let done = 0;
  for (const { url } of images) {
    const key = keyFromUrl(url);
    if (!key) {
      console.log(`  skipped (not in this store's storage): ${url}`);
      continue;
    }
    const small = url.replace(key, variantUrl(key, 640));
    if (small.startsWith("http") && (await fetch(small, { method: "HEAD" })).ok) continue;
    await saveVariants(key, await readStored(url));
    done++;
  }
  console.log(`✓ product photos: ${done} of ${images.length} given copies`);
}

async function main() {
  await brand();
  await products();
  await db.$disconnect();
}

main().catch(async (e) => {
  console.error("✗", e);
  await db.$disconnect();
  process.exit(1);
});
