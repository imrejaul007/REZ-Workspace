FROM node:20-alpine AS base
WORKDIR /app

# Development
FROM base AS development
COPY package*.json ./
RUN npm ci
COPY src ./src
EXPOSE 4190
CMD ["npm", "run", "dev"]

# Build
FROM base AS builder
COPY package*.json ./
RUN npm ci
COPY src ./src
RUN npm run build

# Production
FROM base AS production
ENV NODE_ENV=production
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY package*.json ./
USER nodejs
EXPOSE 4190
CMD ["node", "dist/index.js"]
