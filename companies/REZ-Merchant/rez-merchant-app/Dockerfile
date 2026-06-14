# ================================================
# REZ Merchant App - Production Dockerfile
# Multi-stage build for Node.js/Express
# ================================================

# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build TypeScript
RUN npm run build || echo "Build skipped"

# Stage 3: Production
FROM node:20-alpine AS runner
WORKDIR /app

# Install security updates and dumb-init
RUN apk upgrade --no-cache && \
    apk add --no-cache dumb-init curl

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

ENV NODE_ENV=production
ENV PORT=3000

# Copy built application
COPY --from=builder /app/dist ./dist 2>/dev/null || true
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./

# Set ownership
RUN chown -R nodejs:nodejs /app

USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT:-3000}/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

CMD ["node", "dist/index.js"]

EXPOSE ${PORT:-3000}
