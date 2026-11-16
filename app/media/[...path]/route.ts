import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { resolveMediaPath } from "@/lib/storage";

const TYPES: Record<string, string> = {
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".avif": "image/avif",
};

/** Serves uploaded files from STORAGE_DIR (product photos uploaded in the admin). */
export async function GET(_req: Request, ctx: RouteContext<"/media/[...path]">) {
  const { path: segments } = await ctx.params;
  const file = resolveMediaPath(segments);
  const type = file ? TYPES[path.extname(file).toLowerCase()] : undefined;
  if (!file || !type) return new Response("Not found", { status: 404 });
  try {
    const info = await stat(file);
    if (!info.isFile()) return new Response("Not found", { status: 404 });
    const body = await readFile(file);
    return new Response(new Uint8Array(body), {
      headers: {
        "Content-Type": type,
        "Content-Length": String(body.length),
        // File names are random UUIDs, so they never change: cache for a year.
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
