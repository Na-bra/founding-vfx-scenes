# syntax=docker/dockerfile:1.7

# ─── FoundingVFX production image ─────────────────────────────────────────────
# Multi-stage build using Next.js standalone output: the final image contains
# only the traced server bundle and static assets, and runs as a non-root user.

ARG NODE_VERSION=24-alpine

# ─── deps: install exact dependencies from the lockfile ───────────────────────
FROM node:${NODE_VERSION} AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
# Scripts are skipped here; the Prisma client is generated during `npm run build`.
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund --ignore-scripts

# ─── builder: compile the app ─────────────────────────────────────────────────
FROM node:${NODE_VERSION} AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* values are inlined into the bundle at build time, so they are
# build arguments rather than runtime env. None of these are secrets.
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ARG NEXT_PUBLIC_CONTACT_EMAIL=
ARG NEXT_PUBLIC_YOUTUBE_URL=
ARG NEXT_PUBLIC_TIKTOK_URL=
ARG NEXT_PUBLIC_DISCORD_INVITE_URL=
ARG NEXT_PUBLIC_ASSET_HOST=
ARG NEXT_PUBLIC_SUPABASE_URL=
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY=
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_CONTACT_EMAIL=$NEXT_PUBLIC_CONTACT_EMAIL \
    NEXT_PUBLIC_YOUTUBE_URL=$NEXT_PUBLIC_YOUTUBE_URL \
    NEXT_PUBLIC_TIKTOK_URL=$NEXT_PUBLIC_TIKTOK_URL \
    NEXT_PUBLIC_DISCORD_INVITE_URL=$NEXT_PUBLIC_DISCORD_INVITE_URL \
    NEXT_PUBLIC_ASSET_HOST=$NEXT_PUBLIC_ASSET_HOST \
    NEXT_TELEMETRY_DISABLED=1

RUN mkdir -p public && npm run build

# ─── runner: minimal runtime ──────────────────────────────────────────────────
FROM node:${NODE_VERSION} AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 -G nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/api/health" >/dev/null || exit 1

CMD ["node", "server.js"]
