/**
 * Renders the home page's turn: the shoe turning a full circle on a
 * turntable, changing colourway as it goes (the brand look, then ember, then
 * oasis green), one frame every 3 degrees. The page scrubs through the frames
 * as the visitor scrolls (src/components/site/TurnHero.tsx).
 *
 *   NODE_PATH=$(npm root -g) node scripts/stills/render-turn.mjs
 *   ... --frames 121 --size 1400x1050          (defaults)
 *
 * Writes public/images/shoe/spin/NNN.webp (the frames; NNN-sm.webp, 1100 pixels
 * across, for phones), spin/hero.webp and spin/hero-sm.webp (frame 0, sharper,
 * for the first screen, cut to the shoe so the page can show it whole and as
 * large as its box allows), and src/components/site/turn-frames.ts (each
 * frame's box round the shoe, so the page can keep the shoe centred and fill
 * the screen with it, and where the first-screen still was cut).
 *
 *   ... --hero-only        renders the first-screen stills alone (the frames as they are)
 *
 * Same model, material and studio as render-stills.mjs (render.html, with
 * ?turn=1 for a square shadow ground). Needs Playwright with Chromium and ffmpeg.
 */
import { createServer } from "node:http";
import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { dirname, extname, join, resolve, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { createRequire } from "node:module";

const WEB = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
/** A new folder whenever the frames change their angles, so no browser mixes old frames it kept with new ones. */
const DIR = "/images/shoe/spin";
const OUT = join(WEB, "public", DIR);
const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};
const FRAMES = Number(opt("frames", "121")); // 0..360 degrees inclusive: the last frame is the side view again
/** Frames per 6 degrees: the colour changes below are written for one frame every 6 degrees. */
const U = (FRAMES - 1) / 60;
const [W, H] = opt("size", "1400x1050").split("x").map(Number);
const HERO = [2400, 1800];
/** Frame pixels kept round frame 0's box when the first-screen still is cut (rounded out to sevens, so both still sizes cut on whole pixels). */
const STILL_PAD = 28;
const heroOnly = args.includes("--hero-only");
/**
 * The phone set: the same frames rendered 1100 pixels across. A phone draws the
 * shoe at most about 770 device pixels wide, so this set is never shown above
 * its own size (TurnHero.tsx: targetScale), at two thirds of the weight.
 * Every picture is rendered at the size it is saved: scaling a transparent
 * picture in ffmpeg leaves faint alpha across its empty ground (a ghost box on
 * the page) and makes the transparency costlier to store.
 */
const SMALL = [1100, Math.round((1100 * H) / W)];
const model = opt("model", "/public/models/shoe.glb");

// Colours as in src/features/configurator/parts.ts.
const C = {
  chalk: "#f1efec", dune: "#d6c3a2", lavender: "#c3b5dc", stone: "#8d8994",
  royal: "#241039", oasis: "#2f5d50", ember: "#b4532e", midnight: "#17121e",
};
const PARTS = ["upper", "tabs", "laces", "lining", "heel", "midsole", "outsole"];
const look = (upper, tabs, laces, lining, heel, midsole, outsole) =>
  Object.fromEntries(PARTS.map((p, i) => [p, C[[upper, tabs, laces, lining, heel, midsole, outsole][i]]]));
/** The three looks of the turn: the brand colourway (as the hero), ember details on chalk, an oasis upper. */
const LOOKS = [
  look("royal", "chalk", "chalk", "midnight", "royal", "chalk", "midnight"),
  look("chalk", "ember", "ember", "midnight", "ember", "chalk", "midnight"),
  look("oasis", "chalk", "chalk", "midnight", "oasis", "chalk", "midnight"),
];
/** Where each change of look starts (in 6-degree steps); the details change first, then the upper. */
const CHANGES = [6 * U, 30 * U];
const ORDER = { laces: 0, tabs: 1, heel: 2, upper: 3, lining: 4, midsole: 4, outsole: 4 };
const SPAN = 5 * U; // frames each part takes to change

// Colour maths: sRGB hex <-> OKLab, so a change passes through clean colours.
const toLin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toGam = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
function hexToLab(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => toLin(parseInt(hex.slice(i, i + 2), 16) / 255));
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}
function labToHex([L, A, B]) {
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  const rgb = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
  return "#" + rgb.map((c) => Math.round(Math.min(1, Math.max(0, toGam(c))) * 255).toString(16).padStart(2, "0")).join("");
}
const smooth = (t) => t * t * (3 - 2 * t);
function colorsAt(frame) {
  const out = {};
  for (const part of PARTS) {
    let lab = hexToLab(LOOKS[0][part]);
    CHANGES.forEach((start, i) => {
      const t = Math.min(1, Math.max(0, (frame - start - ORDER[part] * 1.2 * U) / SPAN));
      if (t <= 0) return;
      const to = hexToLab(LOOKS[i + 1][part]);
      lab = lab.map((v, k) => v + (to[k] - v) * smooth(t));
    });
    out[part] = labToHex(lab);
  }
  return out;
}
/** Which look a frame shows (for the page's colourway marker): the change counts once half done. */
const lookAt = (frame) => CHANGES.filter((start) => frame >= start + 4 * U).length;

// The turntable camera: a little above the shoe, far enough for the side view
// (and its shadow) to fill about 86% of the width. The toe turns toward the
// camera first, so the laces come into view.
const CAMERA = { camera: [0, 1.62, 9.5], target: [0, 0.6, 0], fov: 15 };

const TYPES = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".glb": "model/gltf-binary" };
const server = createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(/^([/\\])+/, "");
  const file = join(WEB, path);
  if (!file.startsWith(WEB)) return res.writeHead(403).end();
  try {
    res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" }).end(await readFile(file));
  } catch {
    res.writeHead(404).end();
  }
}).listen(0, "127.0.0.1");
await new Promise((r) => server.once("listening", r));
const port = server.address().port;

const { chromium } = createRequire(import.meta.url)("playwright");
const browser = await chromium.launch({
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
const page = await browser.newPage();
page.on("pageerror", (e) => console.error("page error:", e.message));
await page.goto(`http://127.0.0.1:${port}/scripts/stills/render.html?turn=1&m=${encodeURIComponent(model)}`);
await page.waitForFunction(() => window.ready === true, null, { timeout: 60000 });

await mkdir(OUT, { recursive: true });
const tmp = join(tmpdir(), `jianova-turn-${process.pid}`);
await mkdir(tmp, { recursive: true });
const webp = (png, out, quality) =>
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", png,
    "-c:v", "libwebp", "-pix_fmt", "yuva420p", "-quality", String(quality), "-compression_level", "6", out]);
/** Renders one picture (box: true also clears the shadow's faint tails) and saves it as PNG. */
const render = async (spec, file) => {
  const { png, box } = await page.evaluate((s) => window.renderStill(s), { ...spec, box: true });
  await writeFile(file, Buffer.from(png.split(",")[1], "base64"));
  return box;
};

let boxes = [];
let looks = [];
if (heroOnly) {
  // the frames as they are: their boxes and looks from the last full render
  const last = await readFile(join(WEB, "src/components/site/turn-frames.ts"), "utf8");
  boxes = JSON.parse(last.match(/TURN_BOXES[^=]*= (\[.*?\]);/s)[1]);
  looks = JSON.parse(last.match(/TURN_LOOKS[^=]*= (\[.*?\]);/s)[1]);
}
for (let f = 0; f < (heroOnly ? 0 : FRAMES); f++) {
  const spec = { colors: colorsAt(f), rotationY: -(f / (FRAMES - 1)) * Math.PI * 2, ...CAMERA };
  const name = String(f).padStart(3, "0");
  const box = await render({ ...spec, width: W, height: H }, join(tmp, `${f}.png`));
  webp(join(tmp, `${f}.png`), join(OUT, `${name}.webp`), 80);
  await render({ ...spec, width: SMALL[0], height: SMALL[1] }, join(tmp, `${f}-sm.png`));
  webp(join(tmp, `${f}-sm.png`), join(OUT, `${name}-sm.webp`), 78);
  boxes.push(box);
  looks.push(lookAt(f));
  process.stdout.write(`\rframe ${f + 1}/${FRAMES}`);
}
if (!heroOnly) process.stdout.write("\n");

// Frame 0 again, larger, for the first screen (the picture the turn starts from), cut to the shoe:
// in frame pixels, rounded out to multiples of 7 (the stills are 12/7 and 6/7 of a frame).
const [bx0, by0, bw0, bh0] = boxes[0];
const out7 = (v) => Math.floor(v / 7) * 7;
const up7 = (v) => Math.ceil(v / 7) * 7;
const sx = Math.max(0, out7(bx0 - STILL_PAD)), sy = Math.max(0, out7(by0 - STILL_PAD));
const still = [sx, sy, Math.min(out7(W), up7(bx0 + bw0 + STILL_PAD)) - sx, Math.min(out7(H), up7(by0 + bh0 + STILL_PAD)) - sy];
for (const [name, scale] of [["hero", 1], ["hero-sm", 0.5]]) {
  const file = join(tmp, `${name}.png`);
  const k = (HERO[0] * scale) / W;
  await render({ colors: colorsAt(0), rotationY: 0, ...CAMERA, width: HERO[0] * scale, height: HERO[1] * scale }, file);
  const [cx, cy, cw, ch] = still.map((v) => Math.round(v * k));
  // (a crop moves no pixel: the transparency stays exact)
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", file, "-vf", `crop=${cw}:${ch}:${cx}:${cy}`,
    "-c:v", "libwebp", "-pix_fmt", "yuva420p", "-quality", "84", "-compression_level", "6", join(OUT, `${name}.webp`)]);
}

const ts = `// Written by scripts/stills/render-turn.mjs: do not edit by hand.
/** The folder of the turn's pictures. */
export const TURN_DIR = "${DIR}";
/** The turn's frames: TURN_DIR/NNN.webp, ${W} x ${H} (NNN-sm.webp for phones, ${SMALL[0]} x ${SMALL[1]}), one every ${360 / (FRAMES - 1)} degrees. */
export const TURN_FRAMES = { count: ${FRAMES}, width: ${W}, height: ${H} } as const;
/** Each frame's box round the shoe and its shadow, in frame pixels: [x, y, width, height]. */
export const TURN_BOXES: readonly (readonly [number, number, number, number])[] = ${JSON.stringify(boxes)};
/** Which look each frame shows: 0 brand (royal purple), 1 ember, 2 oasis green. */
export const TURN_LOOKS: readonly number[] = ${JSON.stringify(looks)};
/** The part of frame 0 the first-screen still shows, in frame pixels (TURN_DIR/hero.webp shows it at ${HERO[0]}/${W} of its size, hero-sm.webp at ${HERO[0] / 2}/${W}). */
export const TURN_STILL: readonly [number, number, number, number] = ${JSON.stringify(still)};
`;
await writeFile(join(WEB, "src/components/site/turn-frames.ts"), ts);
await rm(tmp, { recursive: true, force: true });
await browser.close();
server.close();
console.log(heroOnly ? "wrote the hero stills and turn-frames.ts" : `wrote ${FRAMES} frames, hero stills and turn-frames.ts`);
