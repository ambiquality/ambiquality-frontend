# Frontend image: build the Vite SPA, then serve the static bundle with Caddy
# (file_server + SPA history fallback). Published to GHCR as
# ghcr.io/ambiquality/frontend:<tag> by .github/workflows/release.yml.
#
# VITE_* are inlined into the bundle at BUILD time, so the production API origins
# must be passed as build args (the release workflow sets them). Rebuilding is the
# only way to change them — there is no runtime config for a static SPA.
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_AUTH_API_BASE
ARG VITE_EVIDENCE_API_BASE
ARG VITE_PUBLIC_API_BASE
ARG VITE_ENABLE_API_MOCKS=0
ARG VITE_MAP_STYLE_URL=https://tiles.openfreemap.org/styles/positron
ARG VITE_MAP_ATTRIBUTION

# Vite loads .env.production in `vite build` (production mode) and it wins over any
# baked-in defaults. Writing the args here is more reliable than relying on
# process.env propagation through npm.
RUN printf '%s\n' \
      "VITE_AUTH_API_BASE=${VITE_AUTH_API_BASE}" \
      "VITE_EVIDENCE_API_BASE=${VITE_EVIDENCE_API_BASE}" \
      "VITE_PUBLIC_API_BASE=${VITE_PUBLIC_API_BASE}" \
      "VITE_ENABLE_API_MOCKS=${VITE_ENABLE_API_MOCKS}" \
      "VITE_MAP_STYLE_URL=${VITE_MAP_STYLE_URL}" \
      "VITE_MAP_ATTRIBUTION=${VITE_MAP_ATTRIBUTION}" \
      > .env.production \
 && npm run build

FROM caddy:2.11.3-alpine AS final
COPY --from=build /app/dist /usr/share/caddy
COPY Caddyfile.frontend /etc/caddy/Caddyfile
EXPOSE 80
