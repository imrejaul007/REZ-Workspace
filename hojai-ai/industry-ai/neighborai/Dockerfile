# NEIGHBORAI - Society AI Operating System
# "AI for Smarter Communities"

FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev for build)
RUN npm ci

# Copy source
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built output
COPY --from=builder /app/dist ./dist

# Create logs directory
RUN mkdir -p logs

# Create non-root user for security
RUN addgroup -g 1001 -S neighborai && \
    adduser -S neighborai -u 1001

# Set ownership
RUN chown -R neighborai:neighborai /app

USER neighborai

# Expose port
EXPOSE 4806

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4806/health/live || exit 1

# Start application
CMD ["node", "dist/index.js"]