# JIANOVA

### Redefining the Running Experience.

JIANOVA is a Saudi footwear technology project focused on creating premium running shoes and an innovative digital shopping experience.

## Vision

To combine premium footwear design, modern technology, and personalization into one seamless experience.

## Key Features

- **Interactive 3D Visualization:** Explore shoes in a realistic 3D environment.
  *Working today with a simplified placeholder model; the final shoe model is in design.*
- **Real-time Customization:** Personalize shoe colors, materials, and laces.
  *Colors for seven parts (including laces) work today; materials are planned.*
- **Visual Identity:** A four-pointed star built from the wordmark's A, with downloadable logo files.
- **Premium User Experience:** A modern, elegant, and intuitive interface.
- **Digital Innovation:** Bringing a new level of interaction to footwear shopping.

## Project Status

Early development stage. What exists today:

- A bilingual website (English and Arabic, right-to-left):
  - `/` – the product page: the shoe, its parts, how designing works, the eight colors, questions
  - `/customize` – the 3D designer: rotate, zoom, and change the color of each part
  - `/brand` – the visual identity: the logo, its files, colors, type and usage rules
- The JIANOVA logo: a four-pointed star built from the wordmark's A (the A has no
  crossbar) and split into two halves, a pair mid-stride, beside the wordmark.
  Files in `apps/web/public/brand/`.
- Designs can be saved and shared: the designer keeps the colors in the page address.

The shoe shown is a procedurally generated **placeholder**, not the product.
There is no store yet. The requirements for the final model are in
[`docs/3d-model-spec.md`](docs/3d-model-spec.md).

## Structure

- `apps/web` – the website (Next.js, TypeScript)
  - `src/app/[lang]` – the pages, with English and Arabic copy in `dictionaries/`
  - `src/features/configurator` – the 3D designer (React Three Fiber, three.js, Zustand, Tailwind CSS)
  - `src/components/brand` – the logo (`Logo`, `StarMark`)
  - `public/assets` – the design system the marketing pages use (see Design below)
  - `public/images/shoe` – still pictures of the shoe, rendered from the 3D model
  - `scripts/build-placeholder-shoe.mjs` – generates the placeholder shoe model
  - `scripts/stills/` – renders the shoe stills from the model
  - `scripts/brand/` – writes the logo files and icons
- `docs/` – project documentation
- `packages/` – reserved for reusable packages, added only when they are genuinely needed

## Development

Requirements: Node.js 22 or newer and pnpm.

```bash
pnpm install
pnpm dev     # start the local development server
pnpm lint    # check code quality
pnpm build   # create a production build
pnpm --filter web build:model    # regenerate the placeholder 3D model
pnpm --filter web build:stills   # re-render the shoe stills (needs Playwright and ffmpeg)
pnpm --filter web build:logo     # rewrite the logo files and icons
```

When the final 3D model arrives: set `MODEL_URL` in
`src/features/configurator/parts.ts`, then run `build:stills` so every picture on
the home page shows the real shoe.

## Deployment

The site is prepared for [CranL](https://cranl.com): a root `Dockerfile` builds a
standalone Next.js server, and `cranl.json` describes the app. Steps and notes
are in [`docs/deployment.md`](docs/deployment.md).

## Design

The marketing pages were built with the
[taste skill](https://github.com/Leonxlnx/taste-skill) (`design-taste-frontend`)
for Claude Code. Its design-system files (CSS and scripts) are copied into
`apps/web/public/assets` under the MIT License (`LICENSE-taste-skill.txt`);
`public/assets/jianova.css` holds JIANOVA's own colors, type and adjustments.
The 3D designer keeps its own Tailwind styles.

## Mission

Building a new generation of footwear experiences from Saudi Arabia.

## License

No license has been selected yet. Until one is added, all rights are reserved.

---

*JIANOVA — Innovation in Every Step.*
