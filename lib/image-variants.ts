/**
 * Every photo is stored with smaller copies next to it, made once when it is saved:
 *   bride-trees.jpg        → bride-trees-w640.webp, bride-trees-w1200.webp
 *   products/<id>.webp     → products/<id>-w640.webp, products/<id>-w1200.webp
 * The image loader picks the right copy for the screen, so the server never resizes photos on request
 * (on small hosts like Render's free plan, on-the-fly resizing is slow and can run out of memory).
 */
export const VARIANT_WIDTHS = [640, 1200] as const;

const PHOTO = /^(.+)\.(jpe?g|png|webp)$/i;

/** URL of the copy of `url` that is `width` pixels wide. */
export function variantUrl(url: string, width: (typeof VARIANT_WIDTHS)[number]) {
  const m = url.match(PHOTO);
  return m ? `${m[1]}-w${width}.webp` : url;
}

/** Photos that have smaller copies: brand photos, uploaded product photos (disk or Supabase). */
export function hasVariants(url: string) {
  if (!PHOTO.test(url) || url.includes("?")) return false;
  if (url.startsWith("/brand/")) return !url.startsWith("/brand/logo");
  return url.startsWith("/media/products/") || /^https:\/\/[^/]+\.supabase\.co\/storage\/v1\/object\/public\//.test(url);
}
