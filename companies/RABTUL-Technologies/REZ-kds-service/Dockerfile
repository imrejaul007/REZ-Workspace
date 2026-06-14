FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source
COPY dist/ ./dist/

# Copy environment config template
COPY .env.example .env

# Expose port
EXPOSE 4014

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:4014/health || exit 1

# Start
CMD ["node", "dist/index.js"]
