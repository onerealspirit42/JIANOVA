# JIANOVA website: production image (used by CranL's Dockerfile build).
# Builds apps/web in the pnpm workspace and runs Next.js's standalone server.

FROM node:22-alpine AS build
WORKDIR /repo
RUN corepack enable
# Dependencies first, so they are cached between builds.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile
COPY apps/web apps/web
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter web build

FROM node:22-alpine AS run
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
# The standalone server keeps the workspace layout: apps/web/server.js.
# Its .next folder belongs to the user the server runs as, so the server can
# write its prerender cache there (as root it failed with EACCES).
COPY --from=build --chown=node:node /repo/apps/web/.next/standalone ./
COPY --from=build /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /repo/apps/web/public ./apps/web/public
USER node
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
