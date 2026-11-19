import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Third-party kit files copied from the taste skill (not our code).
    "public/assets/**",
  ]),
  {
    // Pictures are pre-sized WebP stills with srcset (scripts/stills), styled
    // by the kit's CSS, which targets plain <img> elements.
    rules: { "@next/next/no-img-element": "off" },
  },
]);

export default eslintConfig;
