import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";

/** Root folder for uploaded files. In production, mount a persistent volume here. */
export const STORAGE_DIR = path.resolve(/* turbopackIgnore: true */ process.env.STORAGE_DIR ?? "storage");

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
  const dir = path.join(STORAGE_DIR, "products");
  await mkdir(dir, { recursive: true });
  const name = `${randomUUID()}.webp`;
  await writeFile(path.join(dir, name), output);
  return `/media/products/${name}`;
}

/** Delete a stored file given its /media/... URL. Ignores files that are already gone. */
export async function deleteMedia(url: string) {
  if (!url.startsWith("/media/")) return;
  const full = resolveMediaPath(url.slice("/media/".length).split("/"));
  if (full) await unlink(full).catch(() => {});
}

/** Safely map URL segments to a file inside STORAGE_DIR (blocks ../ traversal). */
export function resolveMediaPath(segments: string[]) {
  const full = path.resolve(STORAGE_DIR, ...segments);
  return full.startsWith(STORAGE_DIR + path.sep) ? full : null;
}
