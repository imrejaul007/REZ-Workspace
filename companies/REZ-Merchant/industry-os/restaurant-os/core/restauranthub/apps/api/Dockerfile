# Multi-stage build for production optimization with security hardening
FROM node:18-alpine AS base

# Security: Install security updates and essential packages
RUN apk update && apk upgrade && \
    apk add --no-cache \
    dumb-init \
    curl \
    ca-certificates \
    && rm -rf /var/cache/apk/*

# Security: Create non-root user early
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Security: Install only required system dependencies
RUN apk add --no-cache libc6-compat python3 make g++

# Copy package files
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/*/package*.json ./packages/*/

# Install dependencies with security audit
RUN npm ci --only=production --audit && \
    npm cache clean --force && \
    rm -rf ~/.npm

# Build stage
FROM base AS builder
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache libc6-compat python3 make g++

COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/*/package*.json ./packages/*/

RUN npm ci --audit

# Copy source code (use .dockerignore to exclude sensitive files)
COPY . .

# Generate Prisma client
RUN npm run db:generate

# Build the application
RUN npm run build --workspace=@restauranthub/api

# Remove development dependencies and clean up
RUN npm prune --production && \
    npm cache clean --force && \
    rm -rf ~/.npm

# Security scanning stage
FROM builder AS security-scan
RUN npm audit --audit-level=moderate
RUN npx audit-ci --moderate

# Production stage
FROM base AS runner
WORKDIR /app

# Security: Set production environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS="--max-old-space-size=1024"

# Security: Remove package managers and build tools
RUN apk del apk-tools && rm -rf /var/cache/apk/* /tmp/* /var/tmp/*

# Copy only necessary files from builder
COPY --from=deps --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/packages ./packages

# Security: Create necessary directories with proper permissions
RUN mkdir -p /app/logs /app/tmp && \
    chown -R nestjs:nodejs /app && \
    chmod -R 755 /app && \
    chmod -R 750 /app/logs

# Security: Switch to non-root user
USER nestjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Enhanced health check with better endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/api/v1/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]