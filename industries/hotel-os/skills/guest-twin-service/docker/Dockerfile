FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src/ ./src/

# Build
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Create logs directory
RUN mkdir -p /app/logs

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built files
COPY --from=builder /app/dist ./dist

# Copy env example
COPY .env.example .env

# Expose port
EXPOSE 8443

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8443/health || exit 1

# Start the service
CMD ["node", "dist/index.js"]
