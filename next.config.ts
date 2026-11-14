import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  experimental: {
    // Enable CSS processing
    optimizePackageImports: ["lucide-react"],
    // Disable instant navigation validation for dynamic client pages
    disableInstantPages: true,
  },
};

export default nextConfig;
