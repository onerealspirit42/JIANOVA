/**
 * Configurator model definition.
 *
 * Everything model-specific lives here. To use a different GLB, export it
 * with meshes named as in `meshes` below (or update the names), and point
 * MODEL_URL at the new file. Nothing else needs to change.
 */

export const MODEL_URL = "/models/shoe-placeholder.glb";

/** True while the procedurally generated stand-in model is in use. */
export const IS_PLACEHOLDER_MODEL = true;

export const PART_IDS = [
  "upper",
  "tongue",
  "laces",
  "collar",
  "heel",
  "midsole",
  "outsole",
] as const;

export type PartId = (typeof PART_IDS)[number];

/** Which mesh names in the GLB belong to each customizable part. */
export const PART_MESHES: Record<PartId, readonly string[]> = {
  upper: ["upper"],
  tongue: ["tongue"],
  laces: ["laces"],
  collar: ["collar"],
  heel: ["heel"],
  midsole: ["midsole"],
  outsole: ["outsole"],
};

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

export const DEFAULT_DESIGN: Design = {
  upper: "chalk",
  tongue: "chalk",
  laces: "royal",
  collar: "royal",
  heel: "royal",
  midsole: "chalk",
  outsole: "midnight",
};

export const isPartId = (value: string): value is PartId =>
  (PART_IDS as readonly string[]).includes(value);

export const isColorId = (value: string): value is ColorId =>
  (COLOR_IDS as readonly string[]).includes(value);

/** Find the part a mesh belongs to, or null for non-customizable meshes. */
export function partForMesh(meshName: string): PartId | null {
  for (const id of PART_IDS) {
    if (PART_MESHES[id].includes(meshName)) return id;
  }
  return null;
}
