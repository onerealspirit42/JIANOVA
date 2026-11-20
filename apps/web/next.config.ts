import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A self-contained server in .next/standalone for container hosting
  // (CranL's Dockerfile build). The site lives in apps/web of a pnpm
  // workspace, so file tracing starts at the repository root.
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, "../../"),
  cacheComponents: true,
  // The self-hosted font files never change under the same name
  // (scripts/fonts/build-fonts.mjs): browsers may keep them for a year.
  async headers() {
    return [
      {
        source: "/fonts/:file*.woff2",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
  partialPrefetching: true,
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
