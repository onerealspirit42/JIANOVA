/**
 * Renders the home page's still pictures of the shoe from the configurator's
 * GLB model, with a transparent background, and writes WebP files to
 * public/images/shoe/ (a full-size and a half-size file for each).
 *
 * Run (needs Playwright with Chromium, and ffmpeg on the PATH):
 *   pnpm --filter web build:stills
 *   pnpm --filter web build:stills -- --only hero,colour-ember   (some stills)
 *   pnpm --filter web build:stills -- --model /public/models/shoe.glb
 *
 * The shoe is public/models/shoe.glb (built by scripts/model/build-shoe.py),
 * coloured with the designer's own material (shoe-material.js). When the final
 * model arrives, point MODEL_URL in parts.ts and --model here at it and run
 * this again. The camera for each still is in STILLS below.
 */
import { createServer } from "node:http";
import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { dirname, extname, join, resolve, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { createRequire } from "node:module";

const WEB = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = join(WEB, "public/images/shoe");
const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const only = opt("only")?.split(",");
const model = opt("model") ?? "/public/models/shoe.glb";

// The colours and part names match src/features/configurator/parts.ts.
const C = {
  chalk: "#f1efec",
  dune: "#d6c3a2",
  lavender: "#c3b5dc",
  stone: "#8d8994",
  royal: "#241039",
  oasis: "#2f5d50",
  ember: "#b4532e",
  midnight: "#17121e",
};
const design = (upper, tabs, laces, lining, heel, midsole, outsole) => ({
  upper: C[upper], tabs: C[tabs], laces: C[laces], lining: C[lining],
  heel: C[heel], midsole: C[midsole], outsole: C[outsole],
});

/** The brand colourway: the hero and the home page's main look. */
const BRAND = design("royal", "chalk", "chalk", "midnight", "royal", "chalk", "midnight");
/** The designer's first look: white knit with royal purple details. */
const CHALK = design("chalk", "royal", "royal", "royal", "royal", "chalk", "midnight");
const EMBER = design("chalk", "ember", "ember", "midnight", "ember", "chalk", "midnight");
const DARK = new Set(["royal", "midnight", "oasis", "ember", "stone"]);

// Cameras: the shoe is 2.84 long and 1.46 tall, sole on y = 0, centred on x
// and z, the toe on +x and the outer side on +z.
const SIDE = { camera: [0.15, 1.05, 5.6], target: [0.02, 0.6, 0], fov: 18 };
const THREE_Q = { camera: [5.4, 2.6, 7.0], target: [0.05, 0.6, 0], fov: 16 };
const STILLS = [
  { name: "hero", width: 3000, height: 1500, colors: BRAND, trim: 0.008, ...SIDE },
  // Close-ups for the parts section (4:3), each in a colourway that sets the parts apart
  { name: "part-laces", width: 1600, height: 1200, colors: design("oasis", "chalk", "chalk", "midnight", "oasis", "chalk", "midnight"), camera: [2.1, 4.3, 3.4], target: [0.15, 0.7, 0], fov: 27 },
  { name: "part-heel", width: 1600, height: 1200, colors: CHALK, camera: [-4.3, 2.3, 3.0], target: [-0.7, 0.68, 0.1], fov: 25 },
  // How it works: three steps (16:10)
  { name: "step-part", width: 1600, height: 1000, colors: CHALK, highlight: "laces", ...THREE_Q },
  { name: "step-colour", width: 1600, height: 1000, colors: EMBER, ...THREE_Q },
  { name: "step-turn", width: 1600, height: 1000, colors: EMBER, camera: [-5.8, 3.3, -5.2], target: [-0.1, 0.6, 0], fov: 16 },
  // Eight colourways for the colour picker: the upper in each colour (4:3)
  ...Object.entries(C).map(([id, hex]) => {
    const accent = DARK.has(id) ? C.chalk : C.royal;
    return {
      name: `colour-${id}`,
      width: 1600,
      height: 1200,
      colors: { upper: hex, tabs: accent, laces: accent, lining: DARK.has(id) ? C.midnight : C.royal, heel: accent, midsole: C.chalk, outsole: C.midnight },
      camera: [5.0, 2.05, 6.6],
      target: [0.05, 0.6, 0],
      fov: 21,
    };
  }),
];

const TYPES = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".glb": "model/gltf-binary" };
const server = createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(/^([/\\])+/, "");
  const file = join(WEB, path);
  if (!file.startsWith(WEB)) return res.writeHead(403).end();
  try {
    const body = await readFile(file);
    res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" }).end(body);
  } catch {
    res.writeHead(404).end();
  }
}).listen(0, "127.0.0.1");
await new Promise((r) => server.once("listening", r));
const port = server.address().port;

// Playwright is not a project dependency; it is found locally or through
// NODE_PATH (for example NODE_PATH=$(npm root -g)).
const { chromium } = createRequire(import.meta.url)("playwright");
const browser = await chromium.launch({
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
const page = await browser.newPage();
page.on("pageerror", (e) => console.error("page error:", e.message));
await page.goto(`http://127.0.0.1:${port}/scripts/stills/render.html?m=${encodeURIComponent(model)}`);
await page.waitForFunction(() => window.ready === true, null, { timeout: 60000 });

await mkdir(OUT, { recursive: true });
const tmp = join(tmpdir(), `jianova-stills-${process.pid}`);
await mkdir(tmp, { recursive: true });
for (const still of STILLS) {
  if (only && !only.includes(still.name)) continue;
  const dataUrl = await page.evaluate((s) => window.renderStill(s), still);
  const png = join(tmp, `${still.name}.png`);
  await writeFile(png, Buffer.from(dataUrl.split(",")[1], "base64"));
  const full = still.trim ? (still.outWidth ?? 2400) : still.width;
  for (const [suffix, w] of [["", full], ["-sm", Math.round(full / 2)]]) {
    const out = join(OUT, `${still.name}${suffix}.webp`);
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", png, "-vf", `scale=${w}:-1:flags=lanczos`,
      "-c:v", "libwebp", "-pix_fmt", "yuva420p", "-quality", "84", "-compression_level", "6", out]);
  }
  console.log(`wrote ${still.name} (${still.width}x${still.height})`);
}
await rm(tmp, { recursive: true, force: true });
await browser.close();
server.close();
