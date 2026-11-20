# JIANOVA 3D shoe model: specification for the final asset

The website's designer currently shows a realistic **stand-in**: a licensed 3D
model of a knit running shoe ("Materials Variants Shoe", © 2021 Shopify,
CC BY 4.0), prepared by `apps/web/scripts/model/build-shoe.py` (side stripes,
heel logo and lettering removed; every vertex tagged with its part). This
document describes what the final, designer-made JIANOVA model needs so it can
replace the stand-in without code changes.

## Deliverable

- One right-foot running shoe, single **GLB** file (glTF 2.0 binary).
- Y is up, the toe points along **+X**, the outer side faces **+Z**, and the
  bottom of the outsole sits at **Y = 0**. The site scales it to 2.84 units long
  (the build script does this), so the source scale is not critical.
- Clean, closed geometry with no hidden interior faces. Apply all transforms.

## Parts

The designer colours seven parts. Every vertex carries the index of its part in
a custom attribute **`_PART`** (a float, one value per vertex), in this order:

| `_PART` | Part         | What it covers                                    |
| ------- | ------------ | ------------------------------------------------- |
| 0       | `upper`      | The upper (knit or mesh body), tongue and eyelets |
| 1       | `tabs`       | Pull tabs: the tongue's and the heel's            |
| 2       | `laces`      | Laces                                             |
| 3       | `lining`     | Inner lining, collar lining and insole            |
| 4       | `heel`       | Heel patch or heel counter                        |
| 5       | `midsole`    | Midsole (foam)                                    |
| 6       | `outsole`    | Outsole (rubber)                                  |

A model made of separate meshes per part can be tagged by the build script
(map each mesh to its part); the order must match `PART_IDS` in
`apps/web/src/features/configurator/parts.ts` and `SHOE_PARTS` in
`shoe-material.js`.

## Materials and textures

- One PBR metallic-roughness material for the whole shoe is enough.
- The base-colour texture is a **detail map**: the light and shade of the
  surface (knit pattern, stitching, foam) around mid-grey, without colour. The
  site colours each part as part colour × detail × 2.
- A normal map and an occlusion-roughness-metalness map carry the surface
  detail; fabric parts should be non-metallic.
- No logos or lettering other than JIANOVA's own.
- Textures: up to 2048 × 2048, WebP (`EXT_texture_webp`).

## Performance budget

- Target file size: **under 3 MB** (the stand-in is 2.2 MB).
- Target geometry: up to roughly 100,000 triangles for the whole shoe (the
  stand-in has 20,000).
- Meshopt compression works (its decoder ships with the site). Avoid Draco: the
  loader would fetch its decoder from Google's servers.

## How to swap it in

1. Put the file at `apps/web/public/models/` (for example `shoe.glb`), tagged
   as above (adapt `build-shoe.py` if the source needs preparing).
2. In `apps/web/src/features/configurator/parts.ts`, set `MODEL_URL` to the new
   path and `IS_STAND_IN_MODEL` to `false` (this removes the stand-in notice),
   and remove the model credit from the footer if the stand-in is gone.
3. Run `pnpm --filter web build:stills` and `pnpm --filter web build:turn` to
   re-render the home page's pictures and its turning shoe from the new model
   (the cameras are in `apps/web/scripts/stills/render-stills.mjs` and
   `render-turn.mjs`).
4. Run the browser tests and review the shoe from every angle.
