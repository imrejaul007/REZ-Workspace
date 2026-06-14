# REZ-circuit-breaker Docker Image
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy application files
COPY src/ ./src/

# Expose the service port
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3002/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Run as non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodeapp -u 1001
USER nodeapp

ENV NODE_ENV=production
ENV PORT=3002

CMD ["node", "src/index.js"]
