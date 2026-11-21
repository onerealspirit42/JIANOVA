#!/usr/bin/env node
/**
 * Self-hosts the site's typefaces with stable addresses, so each page can
 * preload the faces it shows first (layout.tsx) and text does not jump when
 * they arrive.
 *
 *   node scripts/fonts/build-fonts.mjs
 *
 * Copies the WOFF2 files from the @fontsource packages into public/fonts/
 * (with their SIL Open Font License files) and writes public/assets/fonts.css:
 * the @font-face rules, plus "fallback" faces for the two Latin families,
 * sized to the real faces' metrics (the technique next/font uses), so the
 * fallback takes the same room while the real face loads.
 */
import { createRequire } from "node:module";
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const app = join(dirname(fileURLToPath(import.meta.url)), "../..");
// fontkit as next/font bundles it: a function from a font file's bytes to its metrics.
const fontkitModule = require("next/dist/compiled/@next/font/dist/fontkit").default;
const fontFromBuffer = fontkitModule.default || fontkitModule;
const { getFallbackMetricsFromFontFile } = require(
  "next/dist/compiled/@next/font/dist/local/get-fallback-metrics-from-font-file",
);

const LATIN =
  "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD";
const LATIN_EXT =
  "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF";

/**
 * The Arabic subset's characters (Google Fonts' range; fontsource gives the Arabic subsets none).
 * With it, a Latin page never fetches an Arabic face, and the Arabic faces can stand before the
 * Latin "Fallback" faces in each stack, so Arabic letters never reach a fallback face: Safari
 * draws them from the local font under it (Times New Roman and Arial have Arabic letters) at the
 * fallback's adjusted size, smaller and cut at the edges.
 */
const ARABIC =
  "U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0897-08E1,U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE70-FE74,U+FE76-FEFC,U+102E0-102FB,U+10E60-10E7E,U+10EC2-10EC4,U+10EFC-10EFF,U+1EE00-1EEF1";

/** family, fontsource package, weights, subsets (with their ranges), fallback category */
const FAMILIES = [
  { family: "Instrument Serif", pkg: "instrument-serif", weights: [400], subsets: { latin: LATIN, "latin-ext": LATIN_EXT }, fallback: "serif" },
  { family: "Instrument Sans", pkg: "instrument-sans", weights: [400, 500], subsets: { latin: LATIN, "latin-ext": LATIN_EXT }, fallback: "sans-serif" },
  { family: "Noto Naskh Arabic", pkg: "noto-naskh-arabic", weights: [400], subsets: { arabic: ARABIC } },
  { family: "IBM Plex Sans Arabic", pkg: "ibm-plex-sans-arabic", weights: [400, 500], subsets: { arabic: ARABIC } },
];

const outFonts = join(app, "public/fonts");
mkdirSync(outFonts, { recursive: true });
const css = [
  "/*",
  " * The site's typefaces, self-hosted (written by scripts/fonts/build-fonts.mjs;",
  " * do not edit by hand). SIL Open Font License 1.1: public/fonts/LICENSE-*.txt.",
  " * The \"Fallback\" faces are local fonts sized to the real faces' metrics, so",
  " * text keeps its place while the real face loads.",
  " */",
];

for (const f of FAMILIES) {
  const src = join(app, "node_modules/@fontsource", f.pkg);
  copyFileSync(join(src, "LICENSE"), join(outFonts, `LICENSE-${f.pkg}.txt`));
  for (const weight of f.weights) {
    for (const [subset, range] of Object.entries(f.subsets)) {
      const file = `${f.pkg}-${subset}-${weight}-normal.woff2`;
      copyFileSync(join(src, "files", file), join(outFonts, file));
      css.push(
        `@font-face { font-family: "${f.family}"; font-style: normal; font-weight: ${weight}; font-display: swap; ` +
          `src: url(/fonts/${file}) format("woff2");${range ? ` unicode-range: ${range};` : ""} }`,
      );
    }
  }
  if (f.fallback) {
    const file = join(outFonts, `${f.pkg}-latin-${f.weights[0]}-normal.woff2`);
    const font = fontFromBuffer(readFileSync(file));
    const m = getFallbackMetricsFromFontFile(font, f.fallback === "serif" ? "serif" : "sans-serif");
    const local = f.fallback === "serif" ? 'local("Times New Roman"), local("Times"), local("Georgia")' : 'local("Arial"), local("Helvetica"), local("Liberation Sans")';
    css.push(
      `@font-face { font-family: "${f.family} Fallback"; src: ${local}; ` +
        `ascent-override: ${m.ascentOverride}; descent-override: ${m.descentOverride}; line-gap-override: ${m.lineGapOverride}; size-adjust: ${m.sizeAdjust}; ` +
        `unicode-range: ${LATIN}; }`,
    );
  }
}

writeFileSync(join(app, "public/assets/fonts.css"), css.join("\n") + "\n");
console.log(`fonts.css and ${FAMILIES.length} families written`);
