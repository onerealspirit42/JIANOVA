# JIANOVA

### Redefining the Running Experience.

JIANOVA is a Saudi footwear technology project focused on creating premium running shoes and an innovative digital shopping experience.

## Vision

To combine premium footwear design, modern technology, and personalization into one seamless experience.

## Key Features

- **Interactive 3D Visualization:** Explore shoes in a realistic 3D environment.
  *Working today with a realistic stand-in model (a licensed knit running shoe); the JIANOVA shoe is in design.*
- **Real-time Customization:** Personalize shoe colors, materials, and laces.
  *Colors for seven parts (including laces) work today; materials are planned.*
- **Visual Identity:** A four-pointed star parted by two crossing lines, with downloadable logo files.
- **Premium User Experience:** A modern, elegant, and intuitive interface.
- **Digital Innovation:** Bringing a new level of interaction to footwear shopping.

## Project Status

Early development stage. What exists today:

- A bilingual website (English and Arabic, right-to-left):
  - `/` – the product page: the shoe, its parts, how designing works, the eight colors, questions
  - `/customize` – the 3D designer: rotate, zoom, and change the color of each part
  - `/brand` – the visual identity: the logo, its files, colors, type and usage rules
- The JIANOVA logo: a four-pointed star parted at the centre by two crossing
  lines, beside the wordmark (its A has no crossbar). The lines are a runner's
  legs crossing mid-stride, the four points the four moments of a stride
  (landing, support, push-off, flight). Files in `apps/web/public/brand/`.
- Designs can be saved and shared: the designer keeps the colors in the page address.

The shoe shown is a **stand-in**, not the product: a 3D model of a knit running
shoe, "Materials Variants Shoe" © 2021 Shopify, used under
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) with changes (its side
stripes, heel logo and lettering removed, its parts made recolourable; see
`apps/web/public/models/LICENSE.md`). The site credits it in the footer.
There is no store yet. The requirements for the final model are in
[`docs/3d-model-spec.md`](docs/3d-model-spec.md).

## Structure

- `apps/web` – the website (Next.js, TypeScript)
  - `src/app/[lang]` – the pages, with English and Arabic copy in `dictionaries/`
  - `src/features/configurator` – the 3D designer (React Three Fiber, three.js, Zustand, Tailwind CSS)
  - `src/components/brand` – the logo (`Logo`, `StarMark`)
  - `src/components/site` – the home page's parts: the turning shoe (`TurnHero`, drawn live in 3D by
    `turn-3d.ts`, the rendered frames as its fallback), the colours,
    and the design system's scripts (`KitScripts`, rendered at the end of each page so they run
    only once that page has hydrated). Pages scroll natively; the moving parts ease after the scroll
  - `public/assets` – the design system the marketing pages use (see Design below)
  - `public/images/shoe` – still pictures of the shoe, rendered from the 3D model
  - `public/models/shoe.glb` – the 3D shoe, every vertex tagged with its part
  - `scripts/model/build-shoe.py` – builds `shoe.glb` from the licensed source model
  - `scripts/stills/` – renders the shoe stills and the turn's frames from the model
  - `scripts/brand/` – writes the logo files and icons
  - `scripts/fonts/` – self-hosts the typefaces in `public/fonts` (each page preloads its own)
- `docs/` – project documentation
- `packages/` – reserved for reusable packages, added only when they are genuinely needed

## Development

Requirements: Node.js 22 or newer and pnpm.

```bash
pnpm install
pnpm dev     # start the local development server
pnpm lint    # check code quality
pnpm build   # create a production build
pnpm --filter web build:model    # rebuild the 3D shoe (needs Python with numpy, pillow, opencv-python-headless)
pnpm --filter web build:stills   # re-render the shoe stills (needs Playwright and ffmpeg)
pnpm --filter web build:turn     # re-render the turn's still and fallback frames: 241 with motion blur, about 45 minutes (needs Playwright and ffmpeg)
pnpm --filter web build:logo     # rewrite the logo files and icons
pnpm --filter web build:fonts    # copy the typefaces into public/fonts and write public/assets/fonts.css
```

When the final 3D model arrives: tag its vertices with their part (a `_PART`
attribute, as `build-shoe.py` does), set `MODEL_URL` in
`src/features/configurator/parts.ts`, then run `build:stills` and `build:turn`
so every picture on the home page shows the real shoe.

## Deployment

The site is live on [CranL](https://cranl.com) at
**https://jianova-shypa8.cranl.net**. A root `Dockerfile` builds a standalone
Next.js server, and `cranl.json` describes the app. After a push to `main`,
press Redeploy on the CranL dashboard. Steps and notes are in
[`docs/deployment.md`](docs/deployment.md).

## Design

The marketing pages were built with the
[taste skill](https://github.com/Leonxlnx/taste-skill) (`design-taste-frontend`)
for Claude Code. Its design-system files (CSS and scripts) are copied into
`apps/web/public/assets` under the MIT License (`LICENSE-taste-skill.txt`);
`public/assets/jianova.css` holds JIANOVA's own colors, type, motion and
adjustments; the 3D designer's panel uses the same chips and buttons as the
rest of the site, and its 3D stage keeps a few Tailwind styles.

## Mission

Building a new generation of footwear experiences from Saudi Arabia.

## License

No license has been selected yet. Until one is added, all rights are reserved.

---

*JIANOVA — Innovation in Every Step.*
