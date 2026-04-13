# syntax=docker/dockerfile:1.7

# Stage 1: Dependencies — install with bun, resolving @qaf/shared + @qaf/ui
# workspace packages that live in the root monorepo (packages/qaf-shared,
# packages/qaf-ui). Local dev supplies them via docker-compose
# `additional_contexts`; in CI each submodule must publish those packages and
# the workspace: deps be replaced with a git/registry URL.
FROM oven/bun:1.3-alpine AS deps
WORKDIR /app

# Copy sibling workspace packages (local dev only — optional in CI).
COPY --from=qaf-shared . /app/packages/qaf-shared/
COPY --from=qaf-ui . /app/packages/qaf-ui/

COPY package.json bun.lock ./

# Inject a `workspaces` field so bun resolves the @qaf/* deps from /app/packages
# instead of failing on the `workspace:*` protocol.
RUN node -e "const p=require('./package.json'); p.workspaces=['packages/*']; require('fs').writeFileSync('package.json', JSON.stringify(p, null, 2));"

# Drop --frozen-lockfile: adding workspaces changes the lockfile shape.
RUN bun install

# Stage 2: Builder — build Next.js with standalone output
FROM oven/bun:1.3-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/package.json ./package.json
COPY . .
# Re-apply the workspaces patch after `COPY .` overwrites package.json.
RUN node -e "const p=require('./package.json'); p.workspaces=['packages/*']; require('fs').writeFileSync('package.json', JSON.stringify(p, null, 2));"

# Build-time env vars — NEXT_PUBLIC_* are baked into the bundle during `next build`
ARG NEXT_PUBLIC_WS_URL
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_APP_NAME
ARG NEXT_PUBLIC_APP_VERSION
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME
ENV NEXT_PUBLIC_APP_VERSION=$NEXT_PUBLIC_APP_VERSION

RUN bun run build

# Stage 3: Runner — minimal runtime, non-root user
FROM oven/bun:1.3-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000
CMD ["bun", "server.js"]
