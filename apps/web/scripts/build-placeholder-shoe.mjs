/**
 * Builds the PLACEHOLDER running shoe used by the 3D configurator and writes
 * it to public/models/shoe-placeholder.glb.
 *
 * This is a simplified, procedurally generated stand-in, NOT the final
 * product design. It exists so the configurator can be built and tested
 * through the same pipeline (GLB file -> named meshes -> per-part colour) the
 * real model will use. To swap in the real model, export a GLB whose meshes
 * use the same names (see PART_NAMES below and src/features/configurator/parts.ts).
 *
 * Run: pnpm --filter web build:model
 */
import { writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { ParametricGeometry } from "three/examples/jsm/geometries/ParametricGeometry.js";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";

// GLTFExporter (binary mode) uses FileReader, which Node does not provide.
globalThis.FileReader ??= class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buf) => {
      this.result = buf;
      this.onloadend?.();
    });
  }
};

const OUT = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../public/models/shoe-placeholder.glb",
);

// ---------------------------------------------------------------- shape maths
const L = 2.8; // length, heel (-x) to toe (+x)
const clamp01 = (t) => Math.min(1, Math.max(0, t));
const smooth = (a, b, t) => {
  const x = clamp01((t - a) / (b - a));
  return x * x * (3 - 2 * x);
};
const lerp = (a, b, t) => a + (b - a) * t;
const xOf = (u) => lerp(-L / 2, L / 2, u);

/** Rounded closing envelope so heel and toe are round in plan and profile. */
const envelope = (u, p) => Math.pow(Math.max(Math.sin(Math.PI * u), 0), p);

/** Half-width of the foot at u (0 = heel, 1 = toe). */
const halfWidth = (u) => {
  const base = lerp(0.33, 0.47, smooth(0.0, 0.7, u)) - 0.07 * smooth(0.8, 1, u);
  return base * envelope(u, 0.42);
};

// Sole (stack height and toe spring)
const OUTSOLE = 0.07;
const stack = (u) => lerp(0.36, 0.17, smooth(0.15, 0.85, u)); // heel-to-toe drop
const toeSpring = (u) => 0.16 * Math.pow(smooth(0.6, 1, u), 2);
const heelBevel = (u) => 0.06 * Math.pow(1 - smooth(0, 0.14, u), 2);
const soleBottom = (u) => toeSpring(u) + heelBevel(u);
const soleTop = (u) => soleBottom(u) + OUTSOLE + stack(u);

/** Height of the upper above the sole top. */
const upperHeight = (u) => {
  const heelTab = 0.12 * (1 - smooth(0.02, 0.14, u)); // raised pull tab
  const ankleDip = -0.06 * smooth(0.1, 0.2, u) * (1 - smooth(0.2, 0.34, u));
  const profile = lerp(0.8, 0.26, smooth(0.3, 0.97, u));
  const env = u < 0.5 ? envelope(u, 0.2) : envelope(u, 0.38);
  return (profile + heelTab + ankleDip) * env;
};

// --------------------------------------------------------------------- parts
const uFromX = (x) => clamp01((x + L / 2) / L);

function soleLayer(name, bottomOf, topOf, widen) {
  const N = 80;
  const pts = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    pts.push(new THREE.Vector2(xOf(u), halfWidth(u) * widen + 0.012));
  }
  for (let i = N; i >= 0; i--) {
    const u = i / N;
    pts.push(new THREE.Vector2(xOf(u), -(halfWidth(u) * widen + 0.012)));
  }
  const shape = new THREE.Shape(pts);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 1,
    steps: 1,
    curveSegments: 1,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 3,
  });
  geo.rotateX(-Math.PI / 2); // extrusion now runs along +y (0..1)
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const u = uFromX(pos.getX(i));
    const t = pos.getY(i); // ~ -0.02 .. 1.02 with bevel
    const bottom = bottomOf(u);
    const top = topOf(u);
    pos.setY(i, bottom + t * (top - bottom));
  }
  geo.computeVertexNormals();
  return named(geo, name);
}

/** Point on the upper's surface: u along the foot, v across (0..PI). */
function upperPoint(u, v, inflate = 0) {
  const w = halfWidth(u) + inflate;
  const h = upperHeight(u) + inflate;
  const sv = Math.sin(v);
  const y = soleTop(u) - 0.03 + h * Math.pow(sv, 0.7);
  const taper = 1 - 0.12 * Math.pow(sv, 3); // narrower over the top
  return new THREE.Vector3(xOf(u), y, w * Math.cos(v) * taper);
}

function upperGeometry() {
  const geo = new ParametricGeometry(
    (u, v, target) => target.copy(upperPoint(u, v * Math.PI)),
    120,
    40,
  );
  const merged = mergeVertices(geo.deleteAttribute("uv"), 1e-5);
  merged.computeVertexNormals();
  return merged;
}

function lacesGeometry() {
  const parts = [];
  const rows = 6;
  for (let r = 0; r < rows; r++) {
    const u = lerp(0.4, 0.7, r / (rows - 1));
    const span = 0.5 - r * 0.035;
    const pts = [];
    for (let k = 0; k <= 16; k++) {
      const v = Math.PI / 2 + lerp(-span, span, k / 16);
      pts.push(upperPoint(u, v, 0.034));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    parts.push(new THREE.TubeGeometry(curve, 24, 0.015, 6, false));
  }
  return mergeAll(parts);
}

function tongueGeometry() {
  // A soft panel lying over the instep, rising out of the collar.
  const geo = new ParametricGeometry(
    (s, t, target) => {
      const u = lerp(0.31, 0.72, s);
      const v = Math.PI / 2 + lerp(-0.4, 0.4, t);
      const p = upperPoint(u, v, 0.012);
      p.y += 0.05 * Math.pow(1 - smooth(0, 0.25, s), 2); // rises at the collar
      target.copy(p);
    },
    40,
    16,
  );
  geo.deleteAttribute("uv");
  geo.computeVertexNormals();
  return geo;
}

function collarGeometry() {
  // Padded ring around the ankle opening plus a dark lining "hole".
  const u0 = 0.13;
  const u1 = 0.33;
  const ring = [];
  for (let k = 0; k <= 64; k++) {
    const a = (k / 64) * Math.PI * 2;
    const u = lerp(u0, u1, 0.5 + 0.5 * Math.cos(a));
    const side = Math.sin(a);
    const v = Math.PI / 2 - side * 1.05;
    ring.push(upperPoint(u, v, 0.01));
  }
  const tube = new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(ring, true),
    96,
    0.034,
    10,
    true,
  );
  return tube;
}

function liningGeometry() {
  const u0 = 0.13;
  const u1 = 0.33;
  const geo = new ParametricGeometry(
    (s, t, target) => {
      const a = t * Math.PI * 2;
      const r = s; // 0 = centre, 1 = rim
      const u = lerp(u0, u1, 0.5 + 0.5 * r * Math.cos(a));
      const v = Math.PI / 2 - r * Math.sin(a) * 1.0;
      const p = upperPoint(u, v, 0.004);
      p.y -= 0.03 * (1 - r * r); // dips inward
      target.copy(p);
    },
    12,
    48,
  );
  geo.deleteAttribute("uv");
  geo.computeVertexNormals();
  return geo;
}

function heelGeometry() {
  // A rigid counter wrapping the back of the heel.
  const geo = new ParametricGeometry(
    (s, t, target) => {
      const u = lerp(0.0, 0.24, s);
      const v = lerp(0.0, Math.PI, t);
      const p = upperPoint(u, v, 0.014);
      const side = Math.abs(Math.cos(v)); // 1 at the sides, 0 at the back centre
      // Tall at the back, sweeping down to the sole towards the front.
      const limit = soleTop(u) - 0.02 + lerp(0.52, 0.0, smooth(0.0, 0.24, u)) - 0.05 * side;
      p.y = Math.min(p.y, limit);
      target.copy(p);
    },
    30,
    40,
  );
  geo.deleteAttribute("uv");
  geo.computeVertexNormals();
  return geo;
}

// ------------------------------------------------------------------ helpers
function mergeAll(geos) {
  let count = 0;
  for (const g of geos) count += g.index ? g.index.count : g.attributes.position.count;
  const positions = [];
  const normals = [];
  for (const g of geos) {
    const ng = g.index ? g.toNonIndexed() : g;
    positions.push(...ng.attributes.position.array);
    normals.push(...ng.attributes.normal.array);
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  out.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  void count;
  return out;
}

const materials = {
  upper: { color: "#241039", roughness: 0.82 },
  tongue: { color: "#2e164a", roughness: 0.85 },
  laces: { color: "#f3f1ee", roughness: 0.7 },
  collar: { color: "#2e164a", roughness: 0.9 },
  lining: { color: "#120a1c", roughness: 1 },
  heel: { color: "#3a2158", roughness: 0.45 },
  midsole: { color: "#f3f1ee", roughness: 0.6 },
  outsole: { color: "#1a1520", roughness: 0.92 },
};

function named(geo, name) {
  const m = materials[name];
  const mesh = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({
      name,
      color: new THREE.Color(m.color),
      roughness: m.roughness,
      metalness: 0,
      side: name === "lining" || name === "tongue" ? THREE.DoubleSide : THREE.FrontSide,
    }),
  );
  mesh.name = name;
  return mesh;
}

// -------------------------------------------------------------------- build
const shoe = new THREE.Group();
shoe.name = "shoe";
shoe.add(
  soleLayer("outsole", soleBottom, (u) => soleBottom(u) + OUTSOLE, 1.06),
  soleLayer("midsole", (u) => soleBottom(u) + OUTSOLE - 0.005, soleTop, 1.1),
  named(upperGeometry(), "upper"),
  named(tongueGeometry(), "tongue"),
  named(lacesGeometry(), "laces"),
  named(collarGeometry(), "collar"),
  named(liningGeometry(), "lining"),
  named(heelGeometry(), "heel"),
);
// No textures are used, so texture coordinates are dead weight in the file.
shoe.traverse((obj) => {
  if (obj.isMesh) obj.geometry.deleteAttribute("uv");
});
// The outsole/midsole outlines are already in place; centre the whole shoe.
const box = new THREE.Box3().setFromObject(shoe);
const centre = box.getCenter(new THREE.Vector3());
shoe.position.set(-centre.x, -box.min.y, -centre.z);

const scene = new THREE.Scene();
scene.add(shoe);

const exporter = new GLTFExporter();
const glb = await exporter.parseAsync(scene, { binary: true });
await mkdir(dirname(OUT), { recursive: true });
await writeFile(OUT, Buffer.from(glb));

const size = box.getSize(new THREE.Vector3());
console.log(
  `Wrote ${OUT}\n  ${(glb.byteLength / 1024).toFixed(1)} KB, ` +
    `size ${size.x.toFixed(2)} x ${size.y.toFixed(2)} x ${size.z.toFixed(2)}\n  meshes: ` +
    shoe.children.map((c) => c.name).join(", "),
);
