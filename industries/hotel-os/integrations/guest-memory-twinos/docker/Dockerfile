FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source files
COPY tsconfig.json ./
COPY src ./src

# Build
RUN npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

# Create logs directory
RUN mkdir -p logs

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8447

# Expose port
EXPOSE 8447

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8447/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Run as non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

# Start the application
CMD ["node", "dist/index.js"]