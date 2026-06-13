# Rider Twin Service Dockerfile
# Multi-stage build for optimized production image

# ============================================
# Build Stage
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first for better caching
COPY package*.json ./

RUN npm ci --only=production=false

# Copy source code
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript
RUN npm run build

# ============================================
# Production Stage
# ============================================
FROM node:20-alpine AS production

# Add labels
LABEL org.opencontainers.image.title="Rider Twin Service"
LABEL org.opencontainers.image.description="Digital Twin for rider profiles, preferences, loyalty, and activity tracking"
LABEL org.opencontainers.image.version="1.0.0"
LABEL org.opencontainers.image.source="https://github.com/rtmn/transport-os"

# Set working directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

# Copy built artifacts
COPY --from=builder --chown=appuser:appgroup /app/dist ./dist
COPY --from=builder --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:appgroup /app/package.json ./package.json

# Set environment defaults
ENV NODE_ENV=production
ENV PORT=9050
ENV LOG_LEVEL=info

# Expose port
EXPOSE 9050

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:9050/health || exit 1

# Switch to non-root user
USER appuser

# Start application
CMD ["node", "dist/index.js"]
