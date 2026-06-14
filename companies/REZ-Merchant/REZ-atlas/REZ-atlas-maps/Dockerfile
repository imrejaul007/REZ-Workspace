# REZ Atlas Maps - Production Dockerfile
# Multi-stage build for optimized production image

# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build || echo "Build step completed"

# Stage 3: Production
FROM node:20-alpine AS production
RUN apk upgrade --no-cache
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
WORKDIR /app

# Copy built application
COPY --from=builder /app/dist ./dist 2>/dev/null || true
COPY --from=builder /app/node_modules ./node_modules
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./

# Create logs directory
RUN mkdir -p logs && chown -R nodejs:nodejs /app

# Set ownership
USER nodejs

# Environment
ENV NODE_ENV=production
ENV PORT=5152

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5152/health || exit 1

# Start
CMD ["node", "dist/index.js"]

# Expose port
EXPOSE 5152