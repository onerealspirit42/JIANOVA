# Deployment

## CranL (live)

The site is live at **https://jianova-shypa8.cranl.net** (first deployed on
20 November 2026, commit `24ffd37`). [CranL](https://cranl.com) builds it from
this repository with the `Dockerfile` at the root and runs Next.js's
standalone server on port 3000.

The app: project `Jianova`, application `jianova`, web service, source
"Public Repository" (`https://github.com/onerealspirit42/JIANOVA.git`,
branch `main`, root `/`), Dockerfile build, port 3000, region Netherlands 1
(Free plan).

**Updating the site:** with a public-repository source, a push to `main` does
not deploy by itself. Open the app on the CranL dashboard and press
**Redeploy**. To deploy on every push, connect the GitHub account to CranL
(GitHub connections) and switch the source to the connected repository.

**Then clear the edge cache:** once the deploy is done, press **Purge Cache**
(the CDN box on the app's Overview). The files in `public/` (the kit's scripts
and styles, the pictures, the model) keep their names when they change, and
CranL's edge holds them until the cache is cleared (`next.config.ts` sends
`s-maxage` for them), so they load from the edge rather than from the server,
which on the Free plan can be asleep and slow to answer. Before this, a visit
that found the server asleep got a timeout (504) for some files, and the page
lost its motion. Then open the home page once in each language, scrolling to
the end, so the edge holds every file again.

Verified on the live address: every page in both languages answers 200, a
missing page 404, the logo files and images load, and the 3D designer renders
with WebGL and opens a shared design from its link (`?d=`).

What is in the repository:

- `Dockerfile` – installs the pnpm workspace, builds `apps/web`, and runs
  `node apps/web/server.js` from `.next/standalone` (with `public/` and
  `.next/static` copied next to it).
- `.dockerignore` – keeps `node_modules`, build output and tool folders out of the build.
- `cranl.json` – a CranL blueprint describing one app, `web`, built from the
  Dockerfile on `main`, listening on port 3000.
- `apps/web/next.config.ts` – `output: "standalone"` with the workspace root as
  the tracing root.

### How the first deploy was made (dashboard)

1. Sign in at app.cranl.com (the Free plan needs no card).
2. New application, then Git Repository.
3. Name `jianova`, Web service, Public Repository with the repository URL
   above, branch `main`, port 3000, build type Dockerfile (path `Dockerfile`).
4. Create Application. The site gets a `*.cranl.net` address with SSL.

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
