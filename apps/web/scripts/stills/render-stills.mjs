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
 * When the final model arrives, change MODEL_URL in
 * src/features/configurator/parts.ts, run this again, and every picture on
 * the home page updates. The camera for each still is in STILLS below.
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
const model = opt("model") ?? "/public/models/shoe-placeholder.glb";

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
const design = (upper, tongue, laces, collar, heel, midsole, outsole) => ({
  upper: C[upper], tongue: C[tongue], laces: C[laces], collar: C[collar],
  heel: C[heel], midsole: C[midsole], outsole: C[outsole], lining: "#120a1c",
});

/** The brand colourway: the hero and the home page's main look. */
const BRAND = design("royal", "royal", "chalk", "royal", "royal", "chalk", "midnight");
const CHALK = design("chalk", "chalk", "royal", "royal", "royal", "chalk", "midnight");

// Cameras: the model is centred on x and z, the sole on y = 0, the toe on +x.
const SIDE = { camera: [0.2, 0.98, 5.2], target: [0.02, 0.56, 0], fov: 18 };
const THREE_Q = { camera: [5.6, 2.3, 7.2], target: [0.05, 0.42, 0], fov: 18 };
const STILLS = [
  { name: "hero", width: 3000, height: 1500, colors: BRAND, trim: 0.012, ...SIDE },
  // Close-ups of the parts (4:3), each part in a colour that sets it apart
  { name: "part-laces", width: 1600, height: 1200, colors: design("oasis", "chalk", "midnight", "oasis", "midnight", "chalk", "midnight"), camera: [1.7, 3.9, 3.3], target: [0.3, 0.62, 0], fov: 24 },
  { name: "part-heel", width: 1600, height: 1200, colors: BRAND, camera: [-4.6, 1.7, 3.0], target: [-0.65, 0.55, 0], fov: 24 },
  { name: "part-sole", width: 1600, height: 1200, colors: design("dune", "dune", "midnight", "stone", "stone", "chalk", "ember"), camera: [2.2, 0.55, 4.6], target: [0.25, 0.3, 0], fov: 24 },
  { name: "part-upper", width: 1600, height: 1200, colors: design("midnight", "midnight", "chalk", "stone", "stone", "chalk", "midnight"), camera: [4.6, 2.0, 3.0], target: [0.55, 0.5, 0], fov: 24 },
  // How it works: three steps (16:10)
  { name: "step-part", width: 1600, height: 1000, colors: CHALK, highlight: "laces", ...THREE_Q },
  { name: "step-colour", width: 1600, height: 1000, colors: design("chalk", "chalk", "ember", "ember", "ember", "chalk", "midnight"), ...THREE_Q },
  { name: "step-turn", width: 1600, height: 1000, colors: design("chalk", "chalk", "ember", "ember", "ember", "chalk", "midnight"), camera: [-5.8, 3.4, -5.6], target: [-0.1, 0.45, 0], fov: 18 },
  // Eight colourways for the colour picker: the upper and tongue in each colour (4:3)
  ...Object.entries(C).map(([id, hex]) => ({
    name: `colour-${id}`,
    width: 1600,
    height: 1200,
    colors: { ...BRAND, upper: hex, tongue: hex, laces: id === "chalk" ? C.royal : C.chalk, collar: id === "royal" ? C.midnight : C.royal, heel: id === "royal" ? C.midnight : C.royal },
    camera: [5.0, 1.75, 6.6],
    target: [0.05, 0.48, 0],
    fov: 21,
  })),
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
