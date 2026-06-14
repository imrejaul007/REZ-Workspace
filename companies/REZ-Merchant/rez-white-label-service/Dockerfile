# ================================================
# REZ-Merchant Production Dockerfile Template
# Multi-stage build for Node.js services
# ================================================

# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Install dependencies for faster caching
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependency manifest from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build TypeScript if tsconfig exists
RUN if [ -f tsconfig.json ]; then \
      npm run build || echo "Build step skipped"; \
    fi

# Stage 3: Production
FROM node:20-alpine AS production

# Install security updates and production dependencies
RUN apk upgrade --no-cache && \
    apk add --no-cache dumb-init curl

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy built application
COPY --from=builder /app/dist ./dist 2>/dev/null || true
COPY --from=builder /app/node_modules ./node_modules
COPY --from=deps /app/node_modules ./node_modules

# Copy source for services without build step
COPY --from=builder /app/src ./src
COPY package*.json ./

# Set ownership
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Environment
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3083/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Default command (can be overridden)
CMD ["node", "dist/index.js"]

# Expose port
EXPOSE 3083

# Security: No sudo, no password, minimal capabilities