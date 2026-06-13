FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built files
COPY dist ./dist
COPY package*.json ./

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8444

# Expose port
EXPOSE 8444

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8444/api/health || exit 1

# Start application
CMD ["node", "dist/index.js"]
