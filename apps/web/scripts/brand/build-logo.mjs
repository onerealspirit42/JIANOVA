/**
 * Writes the JIANOVA logo files: SVGs in public/brand/ for download, the
 * browser icon (src/app/icon.svg) and the home-screen icons (PNG).
 *
 * The star: four points, each with the apex angle of the wordmark's A
 * (half-angle atan(15.05 / 43) = 19.29 degrees), so the star is built from the
 * same letter. Each side is one smooth curve from tip to tip: it leaves both
 * tips along the A's legs and bows toward the centre (CURVE = how far along
 * the legs its control points sit). The vertical points are longer
 * (1 : 0.70), like a guiding star.
 *
 * The star is split down the middle into two halves, the right one a step
 * higher (STEP): a pair, one foot ahead of the other. GAP is the cut between
 * them. Both are shares of the star's own height.
 *
 * Run: pnpm --filter web build:logo   (PNGs need Playwright with Chromium)
 */
import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const WEB = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const BRAND = join(WEB, "public/brand");

const INK = "#241039";
const PAPER = "#faf9fb";

// ------------------------------------------------------------ geometry
const ALPHA = Math.atan(15.05 / 43);

/** Corner points of the star (tips N, E, S, W) on a 2-unit tall box. */
const RH = 0.7;
const CURVE = 0.92;
const GAP_SHARE = 0.036;
const STEP_SHARE = 0.05;

function starPoints(rv = 1, rh = RH) {
  const tips = [[0, -rv], [rh, 0], [0, rv], [-rh, 0]];
  const inward = [[0, 1], [-1, 0], [0, -1], [1, 0]];
  const rot = ([x, y], a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
  const meet = (p, u, q, v) => {
    const det = u[0] * -v[1] - u[1] * -v[0];
    const s = ((q[0] - p[0]) * -v[1] - (q[1] - p[1]) * -v[0]) / det;
    return [p[0] + s * u[0], p[1] + s * u[1]];
  };
  const out = [];
  for (let i = 0; i < 4; i++) {
    const p = tips[i];
    const q = tips[(i + 1) % 4];
    out.push(p);
    // The leg of tip i that turns toward tip i+1 meets the matching leg of tip i+1.
    const candidates = [];
    for (const a of [ALPHA, -ALPHA])
      for (const b of [ALPHA, -ALPHA]) candidates.push(meet(p, rot(inward[i], a), q, rot(inward[(i + 1) % 4], b)));
    const mid = [(p[0] + q[0]) * 0.15, (p[1] + q[1]) * 0.15];
    candidates.sort((m, n) => Math.hypot(m[0] - mid[0], m[1] - mid[1]) - Math.hypot(n[0] - mid[0], n[1] - mid[1]));
    out.push(candidates[0]);
  }
  return out;
}

/** The four sides as cubic curves [p0, c1, c2, p3], on the 2-unit box. */
function starSides() {
  const pts = starPoints();
  const toward = (p, q) => [p[0] + CURVE * (q[0] - p[0]), p[1] + CURVE * (q[1] - p[1])];
  return [0, 1, 2, 3].map((i) => {
    const tip = pts[2 * i];
    const inner = pts[2 * i + 1];
    const next = pts[(2 * i + 2) % 8];
    return [tip, toward(tip, inner), toward(next, inner), next];
  });
}

const lerp2 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
/** Split a cubic at t (de Casteljau): returns [first part, second part]. */
function splitCubic([p0, p1, p2, p3], t) {
  const a = lerp2(p0, p1, t), b = lerp2(p1, p2, t), c = lerp2(p2, p3, t);
  const d = lerp2(a, b, t), e = lerp2(b, c, t), f = lerp2(d, e, t);
  return [[p0, a, d, f], [f, e, c, p3]];
}
const xAt = ([p0, p1, p2, p3], t) =>
  (1 - t) ** 3 * p0[0] + 3 * (1 - t) ** 2 * t * p1[0] + 3 * (1 - t) * t ** 2 * p2[0] + t ** 3 * p3[0];
/** The t where a side (monotonic in x) crosses x = c. */
function tAtX(side, c) {
  let lo = 0, hi = 1;
  const rising = xAt(side, 1) > xAt(side, 0);
  for (let k = 0; k < 60; k++) {
    const mid = (lo + hi) / 2;
    if (xAt(side, mid) < c === rising) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

/**
 * The star as an SVG path of two closed shapes (the pair), centred on
 * (cx, cy) and `h` tall in all (the step included).
 */
function starPath(cx, cy, h) {
  const [ne, es, sw, wn] = starSides(); // N->E, E->S, S->W, W->N
  const g = GAP_SHARE * 2; // on the 2-unit box
  const step = STEP_SHARE * 2;
  const scale = h / (2 + step);
  const at = ([x, y], dy) => `${(cx + x * scale).toFixed(2)},${(cy + (y + dy) * scale).toFixed(2)}`;
  const curve = (c, dy) => ` C${at(c[1], dy)} ${at(c[2], dy)} ${at(c[3], dy)}`;

  // Left half: from the cut on S->W, round the west point, to the cut on W->N.
  const leftDy = step / 2;
  const a = splitCubic(sw, tAtX(sw, -g / 2))[1];
  const b = splitCubic(wn, tAtX(wn, -g / 2))[0];
  const left = `M${at(a[0], leftDy)}${curve(a, leftDy)}${curve(b, leftDy)} Z`;

  // Right half, one step higher: from the cut on N->E, round the east point, to the cut on E->S.
  const rightDy = -step / 2;
  const c = splitCubic(ne, tAtX(ne, g / 2))[1];
  const d = splitCubic(es, tAtX(es, g / 2))[0];
  const right = `M${at(c[0], rightDy)}${curve(c, rightDy)}${curve(d, rightDy)} Z`;
  return `${left} ${right}`;
}
const star = (cx, cy, h, fill) => `<path fill="${fill}" d="${starPath(cx, cy, h)}"/>`;

// The wordmark: strokes on a 40-unit cap height; the A has no crossbar.
const WORDMARK_W = 219.62;
const wordmark = (x, y, color, id) => `<g transform="translate(${x} ${y})">
  <clipPath id="${id}"><rect width="${WORDMARK_W}" height="40"/></clipPath>
  <g clip-path="url(#${id})" fill="none" stroke="${color}" stroke-width="2.4" stroke-miterlimit="10">
    <path transform="translate(-8 0)" d="M17 0 V31 A9 9 0 0 1 8 40"/>
    <path transform="translate(21.4 0)" d="M0 0 V40"/>
    <path transform="translate(31.87 0)" d="M-1.05 43 L14 0 L29.05 43"/>
    <path transform="translate(69.84 0)" d="M0 43 V0 L24 40 V-3"/>
    <circle cx="124.04" cy="20" r="18.8"/>
    <path transform="translate(153.31 0)" d="M-1.05 -3 L14 40 L29.05 -3"/>
    <path transform="translate(190.35 0)" d="M-1.05 43 L14 0 L29.05 43"/>
  </g>
</g>`;

const svg = (w, h, body, bg) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w * 4}" height="${h * 4}">` +
  `<title>JIANOVA</title>${bg ? `<rect width="${w}" height="${h}" fill="${bg}"/>` : ""}${body}</svg>\n`;

// Horizontal lockup: the star 1.2x the cap height, 14 units from the wordmark.
const STAR_H = 48;
const STAR_W = (STAR_H * RH) / (1 + STEP_SHARE);
const GAP = 14;
const H_W = STAR_W + GAP + WORDMARK_W;
const horizontal = (color) =>
  svg(H_W, STAR_H, star(STAR_W / 2, STAR_H / 2, STAR_H, color) + wordmark(STAR_W + GAP, 4, color, "wm"));

// Stacked lockup: the star above, centred.
const S_STAR = 64;
const stacked = (color) =>
  svg(WORDMARK_W, S_STAR + 22 + 40, star(WORDMARK_W / 2, S_STAR / 2, S_STAR, color) + wordmark(0, S_STAR + 22, color, "wm"));

const starOnly = (color) => svg(STAR_W, STAR_H, star(STAR_W / 2, STAR_H / 2, STAR_H, color));

/** App icon: the paper star on a brand-purple rounded square. */
const appIcon = (size, radius) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${size}" height="${size}">` +
  `<rect width="64" height="64" rx="${radius}" fill="${INK}"/>${star(32, 32, 42, PAPER)}</svg>\n`;

await mkdir(BRAND, { recursive: true });
const files = {
  "jianova-logo.svg": horizontal(INK),
  "jianova-logo-white.svg": horizontal(PAPER),
  "jianova-logo-stacked.svg": stacked(INK),
  "jianova-logo-stacked-white.svg": stacked(PAPER),
  "jianova-star.svg": starOnly(INK),
  "jianova-star-white.svg": starOnly(PAPER),
  "jianova-app-icon.svg": appIcon(512, 14),
};
for (const [name, body] of Object.entries(files)) await writeFile(join(BRAND, name), body);
await writeFile(join(WEB, "src/app/icon.svg"), appIcon(64, 14));
console.log(`wrote ${Object.keys(files).length} files to public/brand and src/app/icon.svg`);
console.log("star path (105 units tall):", starPath((RH * 100) / 2, 52.5, 105));
console.log("star box:", (RH * 100).toFixed(2), "x 105");

// PNG icons: rendered by Chromium from the SVG (Playwright, found locally or via NODE_PATH).
let chromium;
try {
  ({ chromium } = createRequire(import.meta.url)("playwright"));
} catch {
  console.log("Playwright not found: PNG icons skipped");
  process.exit(0);
}
const browser = await chromium.launch();
const page = await browser.newPage();
for (const [file, size, radius] of [
  ["src/app/apple-icon.png", 180, 0], // iOS rounds the corners itself
  ["public/brand/jianova-app-icon-512.png", 512, 14],
  ["public/brand/jianova-app-icon-192.png", 192, 14],
]) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<html><body style="margin:0;background:transparent">${appIcon(size, radius)}</body></html>`);
  await page.locator("svg").screenshot({ path: join(WEB, file), omitBackground: true });
}
await browser.close();
console.log("wrote PNG icons");
