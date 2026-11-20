/**
 * Configurator model definition.
 *
 * The shoe is public/models/shoe.glb, built by scripts/model/build-shoe.py
 * from a licensed 3D model of a knit running shoe (© 2021 Shopify, CC BY 4.0,
 * modified). Every vertex carries the index of its part in PART_IDS, and
 * shoe-material.js colours the parts on the GPU. To use another model, tag its
 * vertices the same way (a `_PART` attribute) and point MODEL_URL at it.
 */
// (from its own module: the material would bring three.js into every page that lists the parts)
import { SHOE_PARTS } from "./shoe-parts.js";

export const MODEL_URL = "/models/shoe.glb";

/** True while the shoe shown is a stand-in, not the final JIANOVA design. */
export const IS_STAND_IN_MODEL = true;

export const PART_IDS = [
  "upper",
  "tabs",
  "laces",
  "lining",
  "heel",
  "midsole",
  "outsole",
] as const;

export type PartId = (typeof PART_IDS)[number];

if (PART_IDS.join() !== SHOE_PARTS.join()) {
  throw new Error("PART_IDS and SHOE_PARTS must list the parts in the same order");
}

export const partIndex = (part: PartId) => PART_IDS.indexOf(part);

export const COLOR_IDS = [
  "chalk",
  "dune",
  "lavender",
  "stone",
  "royal",
  "oasis",
  "ember",
  "midnight",
] as const;

export type ColorId = (typeof COLOR_IDS)[number];

export const COLORS: Record<ColorId, string> = {
  chalk: "#f1efec",
  dune: "#d6c3a2",
  lavender: "#c3b5dc",
  stone: "#8d8994",
  royal: "#241039",
  oasis: "#2f5d50",
  ember: "#b4532e",
  midnight: "#17121e",
};

export type Design = Record<PartId, ColorId>;

/** The designer's first look: white knit with royal purple details. */
export const DEFAULT_DESIGN: Design = {
  upper: "chalk",
  tabs: "royal",
  laces: "royal",
  lining: "royal",
  heel: "royal",
  midsole: "chalk",
  outsole: "midnight",
};

export const isPartId = (value: string): value is PartId =>
  (PART_IDS as readonly string[]).includes(value);

export const isColorId = (value: string): value is ColorId =>
  (COLOR_IDS as readonly string[]).includes(value);
