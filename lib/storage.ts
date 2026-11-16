import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";

/**
 * Product photos are stored in one of two places:
 *  - Supabase Storage, when SUPABASE_URL and SUPABASE_SECRET_KEY are set (free hosting such as Render,
 *    whose disk is wiped on every restart);
 *  - the local disk (STORAGE_DIR), otherwise (local development, or a VPS with a persistent volume).
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
  const output = await sharp(input)
    .rotate()
    .resize({ width: 1800, height: 2400, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();
  const name = `${randomUUID()}.webp`;

  if (useSupabase) {
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET}/products/${name}`, {
      method: "POST",
      headers: { ...supabaseHeaders(), "content-type": "image/webp", "cache-control": "31536000" },
      body: new Uint8Array(output),
    });
    if (!res.ok) throw new Error(`Photo upload failed (${res.status}): ${await res.text()}`);
    return `${publicPrefix}products/${name}`;
  }

  const dir = path.join(STORAGE_DIR, "products");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), output);
  return `/media/products/${name}`;
}

/** Delete a stored photo given its URL. Ignores files that are already gone. */
export async function deleteMedia(url: string) {
  if (useSupabase && url.startsWith(publicPrefix)) {
    const objectPath = url.slice(publicPrefix.length);
    await fetch(`${SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET}/${objectPath}`, {
      method: "DELETE",
      headers: supabaseHeaders(),
    }).catch(() => {});
    return;
  }
  if (!url.startsWith("/media/")) return;
  const full = resolveMediaPath(url.slice("/media/".length).split("/"));
  if (full) await unlink(full).catch(() => {});
}

/** Safely map URL segments to a file inside STORAGE_DIR (blocks ../ traversal). */
export function resolveMediaPath(segments: string[]) {
  const full = path.resolve(STORAGE_DIR, ...segments);
  return full.startsWith(STORAGE_DIR + path.sep) ? full : null;
}

/** New Supabase secret keys (sb_secret_…) go in `apikey`; legacy service_role JWTs also need `Authorization`. */
function supabaseHeaders(): Record<string, string> {
  const key = SUPABASE_KEY!;
  return key.startsWith("eyJ") ? { apikey: key, authorization: `Bearer ${key}` } : { apikey: key };
}
