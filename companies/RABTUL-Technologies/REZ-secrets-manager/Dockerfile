# ============================================================
# REZ Secrets Manager — Multi-stage Dockerfile
# ============================================================
# Production: docker build -t rez-secrets-manager . && docker run -p 4035:4035 rez-secrets-manager
# ============================================================

# ── Builder Stage ────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# ── Production Stage ────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

# Security: Upgrade all packages and add required tools
RUN apk upgrade --no-cache && apk add --no-cache tini curl

# Security: Create non-root user with specific UID/GID
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

COPY package*.json ./

# Security: Clean npm cache after install
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist

# Security: Set proper ownership
RUN chown -R nodejs:nodejs /app

# Security: Run as non-root user
USER nodejs

EXPOSE 4035

# Health check for container orchestration
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -sf http://localhost:4035/health || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/index.js"]
