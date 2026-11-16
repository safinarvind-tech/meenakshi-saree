import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Small self-contained server for Docker / VPS deployment.
  output: "standalone",
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  images: {
    // Photos are saved with ready-made 640px/1200px copies (lib/image-variants.ts) and the loader picks one,
    // so the server never resizes images on request. That keeps small hosts (Render free: 0.1 CPU, 512 MB) fast.
    loader: "custom",
    loaderFile: "./lib/image-loader.ts",
  },
  experimental: {
    // Admin uploads several product photos per request.
    serverActions: { bodySizeLimit: "40mb" },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
