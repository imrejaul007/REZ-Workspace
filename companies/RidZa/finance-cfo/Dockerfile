# Finance CFO - Production Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

# Copy built files and install production dependencies
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodeapp -u 1001
USER nodeapp

EXPOSE 3000

ENV NODE_ENV=production \
    PORT=3000

CMD ["node", "dist/index.js"]