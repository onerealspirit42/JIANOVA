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
  // The rest of public/ keeps its names when it changes, so browsers check
  // back (the kit's scripts and styles on every visit, so they stay in step
  // with the page; pictures after an hour), while the host's edge cache holds
  // them until it is cleared after a deploy (docs/deployment.md). Pictures and
  // scripts then come from the edge, not from a server that may be asleep and
  // slow to answer (a timeout there once left the page without its motion).
  async headers() {
    return [
      {
        source: "/fonts/:file*.woff2",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/assets/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=0, s-maxage=31536000" }],
      },
      {
        source: "/:dir(images|models|brand)/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=3600, s-maxage=31536000" }],
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
