# ============================================
# Finance Auditor - Production Dockerfile
# Multi-stage build with security best practices
# ============================================

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY tsconfig.json ./
COPY src/ ./src/

# Build TypeScript
RUN npm run build

# ============================================
# Stage 2: Production
# ============================================
FROM node:20-alpine AS production

# Create non-root user for security
RUN addgroup -g 1001 -S financeauditor && \
    adduser -u 1001 -S financeauditor -G financeauditor

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && \
    npm cache clean --force

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

# Set ownership to non-root user
RUN chown -R financeauditor:financeauditor /app

# Switch to non-root user
USER financeauditor

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Set environment defaults
ENV NODE_ENV=production \
    PORT=3000

# Start the application
CMD ["node", "dist/index.js"]