# instagram-shop-integration
# Instagram shop integration service for AdBazaar social automation
# Port: 5080

FROM node:18-alpine AS builder
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

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set environment variables
ENV NODE_ENV=production \
    PORT=5080

# Copy package files for production dependencies
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && \
    chown -R nodejs:nodejs /app

# Copy built application from builder
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 5080

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
    CMD wget --no-verbose --tries=1 --spider http://localhost:5080/health || exit 1

# Start application
CMD ["node", "dist/index.js"]
