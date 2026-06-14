# REZ Atlas Services - Dockerfile Template
# Use this as a template for each service

FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY src ./src

# Build TypeScript
RUN npm run build 2>/dev/null || true

# Expose port
EXPOSE ${PORT:-3000}

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-3000}/health || exit 1

# Start
CMD ["node", "dist/index.js"]
