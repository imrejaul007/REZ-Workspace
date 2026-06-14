# ── Profile Service Dockerfile ────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

ENV NODE_ENV=production

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source and build
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ── Production Stage ─────────────────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

# Security: Upgrade packages
RUN apk upgrade --no-cache

# Security: Install tini for proper signal handling
RUN apk add --no-cache tini

# Security: Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S profile -u 1001

# Copy built application
COPY --from=builder --chown=profile:nodejs /app/dist ./dist
COPY --from=builder --chown=profile:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=profile:nodejs /app/package.json ./package.json

# Set ownership
RUN chown -R profile:nodejs /app

# Switch to non-root user
USER profile

# Environment variables
ENV NODE_ENV=production \
    PORT=3000

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/index.js"]
