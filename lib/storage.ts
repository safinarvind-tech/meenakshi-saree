import { mkdir, readFile, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { VARIANT_WIDTHS, variantUrl } from "./image-variants";

/**
 * Product photos are stored in one of two places:
 *  - Supabase Storage, when SUPABASE_URL and SUPABASE_SECRET_KEY are set (free hosting such as Render,
 *    whose disk is wiped on every restart);
 *  - the local disk (STORAGE_DIR), otherwise (local development, or a VPS with a persistent volume).
 * Each photo is saved with 640px and 1200px copies next to it (see lib/image-variants.ts).
 */

/** Root folder for uploaded files when using the local disk. In production, mount a persistent volume here. */
export const STORAGE_DIR = path.resolve(/* turbopackIgnore: true */ process.env.STORAGE_DIR ?? "storage");

const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/+$/, "");
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY;
const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || "products";
const useSupabase = Boolean(SUPABASE_URL && SUPABASE_KEY);
const publicPrefix = `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/`;

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const MAX_BYTES = 10 * 1024 * 1024;

/** Resize, convert to WebP and store an uploaded product image. Returns its public URL. */
export async function saveProductImage(file: File) {
  if (!ALLOWED.has(file.type)) throw new Error(`${file.name}: only JPG, PNG, WebP or AVIF images are allowed`);
  if (file.size > MAX_BYTES) throw new Error(`${file.name}: image is larger than 10 MB`);
  const input = Buffer.from(await file.arrayBuffer());
  return saveImageBuffer(input);
}

export async function saveImageBuffer(input: Buffer) {
  const full = await sharp(input)
    .rotate()
    .resize({ width: 1800, height: 2400, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();
  const key = `products/${randomUUID()}.webp`;
  await put(key, full);
  await saveVariants(key, full);
  return urlFor(key);
}

/** Make and store the 640px / 1200px copies of a stored photo (key like "products/<id>.webp"). */
export async function saveVariants(key: string, original: Buffer) {
  for (const w of VARIANT_WIDTHS) {
    const copy = await sharp(original).resize({ width: w, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
    await put(variantUrl(key, w), copy);
  }
}

/** Storage key ("products/<id>.webp") of a photo URL from this store, or null if it is not ours. */
export function keyFromUrl(url: string) {
  if (useSupabase && url.startsWith(publicPrefix)) return url.slice(publicPrefix.length);
  if (url.startsWith("/media/")) return url.slice("/media/".length);
  return null;
}

/** Read a stored photo's bytes (used to backfill copies for older photos). */
export async function readStored(url: string) {
  if (url.startsWith("/media/")) {
    const full = resolveMediaPath(url.slice("/media/".length).split("/"));
    if (!full) throw new Error(`Bad media path: ${url}`);
    return readFile(full);
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not download ${url} (${res.status})`);
  return Buffer.from(await res.arrayBuffer());
}

/** Delete a stored photo and its copies, given its URL. Ignores files that are already gone. */
export async function deleteMedia(url: string) {
  const key = keyFromUrl(url);
  if (!key) return;
  await Promise.all([key, ...VARIANT_WIDTHS.map((w) => variantUrl(key, w))].map(remove));
}

/** Safely map URL segments to a file inside STORAGE_DIR (blocks ../ traversal). */
export function resolveMediaPath(segments: string[]) {
  const full = path.resolve(STORAGE_DIR, ...segments);
  return full.startsWith(STORAGE_DIR + path.sep) ? full : null;
}

function urlFor(key: string) {
  return useSupabase ? publicPrefix + key : `/media/${key}`;
}

async function put(key: string, data: Buffer) {
  if (useSupabase) {
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET}/${key}`, {
      method: "POST",
      headers: { ...supabaseHeaders(), "content-type": "image/webp", "cache-control": "31536000", "x-upsert": "true" },
      body: new Uint8Array(data),
    });
    if (!res.ok) throw new Error(`Photo upload failed (${res.status}): ${await res.text()}`);
    return;
  }
  const full = resolveMediaPath(key.split("/"));
  if (!full) throw new Error(`Bad storage key: ${key}`);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, data);
}

async function remove(key: string) {
  if (useSupabase) {
    await fetch(`${SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET}/${key}`, { method: "DELETE", headers: supabaseHeaders() }).catch(() => {});
    return;
  }
  const full = resolveMediaPath(key.split("/"));
  if (full) await unlink(full).catch(() => {});
}

/** New Supabase secret keys (sb_secret_…) go in `apikey`; legacy service_role JWTs also need `Authorization`. */
function supabaseHeaders(): Record<string, string> {
  const key = SUPABASE_KEY!;
  return key.startsWith("eyJ") ? { apikey: key, authorization: `Bearer ${key}` } : { apikey: key };
}
