# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build || echo "Build skipped"

# Stage 3: Production
FROM node:20-alpine AS production
RUN apk upgrade --no-cache && apk add --no-cache dumb-init curl
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
WORKDIR /app

COPY --from=builder /app/dist ./dist 2>/dev/null || true
COPY --from=builder /app/node_modules ./node_modules
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY tsconfig.json . 2>/dev/null || true

RUN chown -R nodejs:nodejs /app
USER nodejs

ENV NODE_ENV=production
ENV PORT=5183

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5183/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]

EXPOSE 5183