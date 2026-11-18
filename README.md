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
- **Premium User Experience:** A modern, elegant, and intuitive interface.
- **Digital Innovation:** Bringing a new level of interaction to footwear shopping.

## Project Status

Early development stage. What exists today:

- A bilingual website (English and Arabic, right-to-left) with the JIANOVA identity.
- A 3D configurator at `/customize`: rotate, zoom, and change the color of each part.

The shoe shown is a procedurally generated **placeholder**, not the product.
There is no store yet. The requirements for the final model are in
[`docs/3d-model-spec.md`](docs/3d-model-spec.md).

## Structure

- `apps/web` – the website (Next.js, TypeScript, Tailwind CSS)
  - `src/features/configurator` – the 3D configurator (React Three Fiber, three.js, Zustand)
  - `scripts/build-placeholder-shoe.mjs` – generates the placeholder shoe model
- `docs/` – project documentation
- `packages/` – reserved for reusable packages, added only when they are genuinely needed

## Development

Requirements: Node.js 22 or newer and pnpm.

```bash
pnpm install
pnpm dev     # start the local development server
pnpm lint    # check code quality
pnpm build   # create a production build
pnpm --filter web build:model   # regenerate the placeholder 3D model
```

## Mission

Building a new generation of footwear experiences from Saudi Arabia.

## License

No license has been selected yet. Until one is added, all rights are reserved.

---

*JIANOVA — Innovation in Every Step.*
