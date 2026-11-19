# Deployment

## CranL (planned host)

[CranL](https://cranl.com) builds the site from this repository with the
`Dockerfile` at the root and runs Next.js's standalone server on port 3000.

What is in the repository:

- `Dockerfile` – installs the pnpm workspace, builds `apps/web`, and runs
  `node apps/web/server.js` from `.next/standalone` (with `public/` and
  `.next/static` copied next to it).
- `.dockerignore` – keeps `node_modules`, build output and tool folders out of the build.
- `cranl.json` – a CranL blueprint describing one app, `web`, built from the
  Dockerfile on `main`, listening on port 3000.
- `apps/web/next.config.ts` – `output: "standalone"` with the workspace root as
  the tracing root.

Verified: the standalone server, copied on its own with the same layout as
the image, serves every page and passes the browser test suites. The Docker
image itself has not been built here (this environment cannot reach Docker
Hub); CranL builds it on its side.

### First deploy (dashboard)

1. Create an account at cranl.com (the Free plan needs no card).
2. Create an app from GitHub, connect the GitHub account and choose
   `onerealspirit42/JIANOVA`, branch `main`.
3. Choose the Dockerfile build and port 3000.
4. Deploy. The site gets a `*.cranl.net` address; every push to `main`
   deploys again.

Plan notes (from cranl.com, November 2026): a custom domain needs the Basic
plan or above; the Riyadh and Jeddah regions need Pro or above. The Free plan
deploys in the Netherlands.

### With the CLI (optional)

`cranl login`, then apply `cranl.json` as a blueprint (see
https://docs.cranl.com). Keep API keys out of the repository.

## Payments (STRABL, not integrated)

There is nothing to sell yet, so no checkout is wired in. Before integrating
STRABL (https://docs.strabl.io: hosted checkout, a Node.js SDK and order
webhooks), confirm with STRABL that it serves Saudi merchants in SAR and
which methods it offers (mada, Apple Pay, cards), open a merchant account,
and keep its keys in the host's environment variables, never in the code.
