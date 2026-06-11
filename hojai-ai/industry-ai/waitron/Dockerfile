# WAITRON - Restaurant AI Operating System
# "AI That Serves Better"

FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY tsconfig.json ./
COPY src ./src

# Build
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S hojai && \
    adduser -S hojai -u 1001

USER hojai

# Expose port
EXPOSE 4820

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4820/health || exit 1

# Start
CMD ["node", "dist/index.js"]
