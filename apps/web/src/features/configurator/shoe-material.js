/**
 * The shoe's material: one physically based material for the whole mesh that
 * colours each part on the GPU. Shared by the 3D designer (ShoeModel.tsx) and
 * the stills renderer (scripts/stills/render.html), so both show the same shoe.
 *
 * The model (public/models/shoe.glb, built by scripts/model/build-shoe.py)
 * tags every vertex with its part (the `_part` attribute, 0 to 6 in PART_IDS
 * order). Its colour map is a "detail" map: the knit, stitching and foam as
 * light and shade around 0.5 (sRGB-decoded), so the colour of a texel is
 * part colour x detail x 2. Fabric parts get a soft sheen, like real knit.
 *
 * Plain JavaScript (no build step) so the stills page can import it as is.
 */
import { Color, MeshPhysicalMaterial } from "three";

/** Parts in the model's order; must match PART_IDS in parts.ts. */
export const SHOE_PARTS = ["upper", "tabs", "laces", "lining", "heel", "midsole", "outsole"];

/** Fabric sheen per part (0 = none): knit, tabs, laces and lining are textiles. */
const SHEEN = [0.24, 0.24, 0.22, 0.16, 0, 0, 0];
/** How much of the part's own colour tints its sheen (1 = all, 0 = white). */
const SHEEN_TINT = 0.7;

const GLOW = new Color("#9b7fc4");

/**
 * Replaces the mesh's glTF material with the part-colouring material.
 * Returns a controller: setColor(i, color), glow(i, amount).
 * @param {import("three").Mesh} mesh
 */
export function applyShoeMaterial(mesh) {
  const source = /** @type {import("three").MeshStandardMaterial} */ (mesh.material);
  const material = new MeshPhysicalMaterial({
    map: source.map,
    normalMap: source.normalMap,
    normalScale: source.normalScale.clone(),
    aoMap: source.aoMap,
    aoMapIntensity: 1,
    roughnessMap: source.roughnessMap,
    metalnessMap: source.metalnessMap,
    roughness: 1,
    metalness: 1,
    sheen: 1,
    sheenRoughness: 0.72,
    envMapIntensity: 1,
  });

  const colors = SHOE_PARTS.map(() => new Color("#ffffff"));
  const uniforms = {
    uPartColor: { value: colors },
    uPartSheen: { value: SHEEN },
    uGlowPart: { value: -1 },
    uGlow: { value: 0 },
    uGlowColor: { value: GLOW },
    uSheenTint: { value: SHEEN_TINT },
  };

  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
attribute float _part;
uniform vec3 uPartColor[${SHOE_PARTS.length}];
uniform float uPartSheen[${SHOE_PARTS.length}];
uniform int uGlowPart;
uniform float uGlow;
varying vec3 vPartColor;
varying float vPartSheen;
varying float vPartGlow;`,
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
int partIndex = int(_part + 0.5);
vPartColor = uPartColor[partIndex];
vPartSheen = uPartSheen[partIndex];
vPartGlow = partIndex == uGlowPart ? uGlow : 0.0;`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
uniform vec3 uGlowColor;
uniform float uSheenTint;
varying vec3 vPartColor;
varying float vPartSheen;
varying float vPartGlow;`,
      )
      .replace(
        "#include <map_fragment>",
        `#ifdef USE_MAP
  diffuseColor.rgb *= vPartColor * texture2D( map, vMapUv ).rgb * 2.0;
#endif`,
      )
      .replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
totalEmissiveRadiance += uGlowColor * vPartGlow;`,
      )
      .replace(
        "#include <lights_physical_fragment>",
        `#include <lights_physical_fragment>
#ifdef USE_SHEEN
  material.sheenColor = mix( vec3( 1.0 ), vPartColor, uSheenTint ) * vPartSheen;
#endif`,
      );
  };
  // One compiled program for every shoe on the page.
  material.customProgramCacheKey = () => "jianova-shoe-v1";

  mesh.material = material;
  return {
    material,
    /** @param {number} part @param {import("three").ColorRepresentation | import("three").Color} color */
    setColor(part, color) {
      colors[part].set(color);
    },
    /** @param {number} part */
    getColor(part) {
      return colors[part];
    },
    /** Tune the fabric sheen (for the stills page and tests). */
    setSheen(perPart, tint) {
      if (perPart) uniforms.uPartSheen.value = perPart;
      if (tint !== undefined) uniforms.uSheenTint.value = tint;
    },
    /** Lights one part (or none with -1) by `amount` (0 to 1). */
    glow(part, amount) {
      uniforms.uGlowPart.value = part;
      uniforms.uGlow.value = amount;
    },
  };
}

/**
 * The part index under a raycast hit on the shoe mesh, or -1.
 * @param {import("three").Mesh} mesh
 * @param {{ a: number } | null | undefined} face
 */
export function partAtFace(mesh, face) {
  const attr = mesh.geometry.getAttribute("_part");
  if (!attr || !face) return -1;
  return Math.round(attr.getX(face.a));
}
