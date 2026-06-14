# TreasuryOS Dockerfile
# Cash Management, Investment Tracking, and Forecast Optimization

FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps

RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Rebuild native dependencies for production
FROM base AS prod-deps

RUN apk add --no-cache libc6-compat python3 make g++

WORKDIR /app

COPY package*.json ./

RUN npm ci

# Development image
FROM base AS development

RUN apk add --no-cache libc6-compat python3 make g++

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY tsconfig.json ./
COPY src ./src

# Build stage
FROM base AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# Production image
FROM base AS production

ENV NODE_ENV=production

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy built files
COPY --from=builder /app/dist ./dist
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package*.json ./

# Set ownership
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 4055

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4055/health || exit 1

# Start the application
CMD ["node", "dist/index.js"]
