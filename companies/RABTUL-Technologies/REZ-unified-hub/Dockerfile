FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm install

# Copy source
COPY src/ ./src/

# Build
RUN npm run build

# Expose port
EXPOSE 4600

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4600/health || exit 1

# Start
CMD ["node", "dist/index.js"]