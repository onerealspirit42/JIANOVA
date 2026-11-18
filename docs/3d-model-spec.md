# JIANOVA 3D shoe model: specification for the final asset

The website's configurator currently uses a simplified, procedurally generated
**placeholder** shoe (`apps/web/scripts/build-placeholder-shoe.mjs`). This
document describes what the final, designer-made model needs so it can replace
the placeholder without code changes.

## Deliverable

- One right-foot running shoe, single **GLB** file (glTF 2.0 binary).
- Real-world scale in metres is preferred (the viewer re-fits the camera, so
  exact scale is not critical). Y is up, the toe points along **+X**, and the
  bottom of the outsole sits at **Y = 0**.
- Clean, closed geometry with no hidden interior faces. Apply all transforms.

## Separate, named parts

Each customizable part must be its **own mesh** with its **own material**, named
exactly as below. One part may contain several meshes if needed; any extra
mesh names are mapped in `apps/web/src/features/configurator/parts.ts`.

| Mesh name | Part                                              |
| --------- | ------------------------------------------------- |
| `upper`   | Main upper (knit / mesh body)                     |
| `tongue`  | Tongue                                            |
| `laces`   | Laces                                             |
| `collar`  | Padded collar around the ankle opening            |
| `heel`    | Heel counter / heel clip                          |
| `midsole` | Midsole (foam)                                    |
| `outsole` | Outsole (rubber)                                  |
| `lining`  | Inner lining (not customizable, keep it dark)     |

Logos, stitching or eyelets that should never change colour can be extra meshes
with any other name.

## Materials and textures

- PBR metallic-roughness materials (the glTF standard).
- The configurator changes each part's **base colour**, so base-colour textures
  for customizable parts should be **neutral grey/white** (detail only, e.g.
  knit pattern), letting the chosen colour tint them.
- Normal and roughness maps are welcome for surface detail (knit, foam, rubber).
- Textures: up to 2048 × 2048, preferably KTX2 or WebP.

## Performance budget

- Target file size: **under 3 MB**, ideally under 2 MB.
- Target geometry: roughly 50,000 – 100,000 triangles for the whole shoe.
- Draco or Meshopt compression is supported if needed (the loader will be
  configured for it when the file arrives).

## How to swap it in

1. Put the file at `apps/web/public/models/` (for example `shoe.glb`).
2. In `apps/web/src/features/configurator/parts.ts`, set `MODEL_URL` to the new
   path and `IS_PLACEHOLDER_MODEL` to `false` (this removes the placeholder
   notices on the site).
3. Run the browser tests and review the shoe from every angle.
