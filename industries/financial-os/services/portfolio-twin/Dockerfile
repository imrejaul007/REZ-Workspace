# Portfolio Twin Service Dockerfile
# Multi-stage build for optimized production image

# ============================================================================
# BUILD STAGE
# ============================================================================

FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY tsconfig.json ./
COPY jest.config.ts ./
COPY src/ ./src/

# Build TypeScript
RUN npm run build

# ============================================================================
# PRODUCTION STAGE
# ============================================================================

FROM node:20-alpine AS production

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built artifacts from builder
COPY --from=builder /app/dist ./dist

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set ownership
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 8950

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8950/health || exit 1

# Start the application
CMD ["node", "dist/index.js"]
