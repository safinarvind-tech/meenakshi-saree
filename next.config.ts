import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Small self-contained server for Docker / VPS deployment.
  output: "standalone",
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  images: {
    // Only optimise our own brand assets and uploaded product media.
    localPatterns: [
      { pathname: "/brand/**", search: "" },
      { pathname: "/media/**", search: "" },
    ],
    // Product photos stored in Supabase Storage (free hosting setup).
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**", search: "" }],
    formats: ["image/avif", "image/webp"],
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
