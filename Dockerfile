# Sri Meenakshi Silk House — production image
# Works with Coolify (Hostinger VPS), any Docker host, Render or Railway.

FROM node:24-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# npm ci runs `prisma generate` (postinstall), which needs the schema and config
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci --no-audit --no-fund

FROM node:24-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
# Public site URL is baked into page metadata at build time (Render/Coolify pass it as a build arg).
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build

# Small toolset used at start-up: database migrations + first admin account
FROM node:24-slim AS migrate
WORKDIR /migrate
RUN npm init -y >/dev/null \
 && npm install --omit=dev --no-audit --no-fund prisma@7.10.1 pg@8 bcryptjs@3

FROM node:24-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    STORAGE_DIR=/app/storage

COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public

COPY --from=migrate /migrate/node_modules /migrate/node_modules
COPY prisma /migrate/prisma
COPY prisma.config.ts scripts/create-admin.mjs scripts/docker-start.sh /migrate/

# Uploaded product photos live here when Supabase Storage is not configured:
# on a VPS (Coolify), mount a persistent volume at /app/storage.
RUN mkdir -p /app/storage && chown node:node /app/storage

USER node
EXPOSE 3000
CMD ["sh", "/migrate/docker-start.sh"]
