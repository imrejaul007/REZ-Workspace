# =============================================================================
# REZ Consumer - Consumer App
# =============================================================================
# RTNM Digital Ecosystem | Port: 4200
# =============================================================================

# -----------------------------------------------------------------------------
# Build Stage
# -----------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source
COPY services/ ./services/

# -----------------------------------------------------------------------------
# Production Stage
# -----------------------------------------------------------------------------
FROM node:20-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built artifacts
COPY --from=builder /app/services ./services/

# Create non-root user
RUN groupadd -S appgroup && useradd -S appuser -G appgroup
RUN chown -R appuser:appgroup /app
USER appuser

# Expose port
EXPOSE 4200

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:4200/health || exit 1

# Start
CMD ["node", "-r", "tsx", "services/index.ts"]