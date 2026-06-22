# ============================================
# REZ Workspace - Production Dockerfile
# ============================================
# Multi-stage build for optimized production image

# Stage 1: Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY tsconfig.json ./
COPY src ./src
COPY shared ./shared

# Build TypeScript
RUN npm run build

# Stage 2: Production stage
FROM node:20-alpine AS production

# Add labels for better container management
LABEL maintainer="RTNM Digital <support@rtnm.digital>"
LABEL org.opencontainers.image.title="REZ Workspace"
LABEL org.opencontainers.image.description="Work & Productivity Platform"
LABEL org.opencontainers.image.version="1.0.0"

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S rez -u 1001 -G nodejs

WORKDIR /app

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/shared ./shared

# Set ownership
RUN chown -R rez:nodejs /app

# Switch to non-root user
USER rez

# Expose port
EXPOSE 4300

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:4300/health || exit 1

# Set environment variables
ENV NODE_ENV=production
ENV PORT=4300
ENV SERVICE_NAME=rez-workspace

# Start the application
CMD ["node", "dist/index.js"]