# ============================================================
# REZ Now — Multi-stage Dockerfile
# ============================================================
# Production: docker build -t rez-now . && docker run -p 3000:3000 rez-now
# Dev:        docker compose up rez-now
#
# Note: Requires next.config.ts to have `output: 'standalone'`
# Add to next.config.ts: output: 'standalone'
# ============================================================

# ── Builder Stage ────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1
ENV ANALYZE=false

COPY package*.json ./
RUN npm ci

# Copy all source (needed for standalone output tracing)
COPY . .

# Build with standalone output
RUN npm run build

# ── Production Stage ────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Security: Upgrade all packages and add required tools
RUN apk upgrade --no-cache && apk add --no-cache curl tini

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -sf http://localhost:3000/ || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]
