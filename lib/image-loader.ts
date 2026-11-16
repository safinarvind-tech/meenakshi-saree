"use client";

import { hasVariants, variantUrl } from "./image-variants";

/**
 * next/image loader: serves the pre-made 640px / 1200px copy of a photo instead of resizing on the server.
 * Wider requests get the original (product photos are stored at most 1800px wide).
 */
export default function imageLoader({ src, width }: { src: string; width: number; quality?: number }) {
  if (!hasVariants(src)) return src;
  if (width <= 640) return variantUrl(src, 640);
  if (width <= 1200) return variantUrl(src, 1200);
  return src;
}
