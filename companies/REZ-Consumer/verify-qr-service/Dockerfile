FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev for build)
RUN npm ci

# Copy source
COPY . .

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy only production files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Create logs directory
RUN mkdir -p ./logs

# Expose port
EXPOSE 4003

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s CMD node -e "require('http').get('http://localhost:4003/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))" || exit 1

# Start
CMD ["node", "dist/index.js"]
