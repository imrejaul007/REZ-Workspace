# =============================================================================
# REZ Order Service - Docker Image
# Port: 4006
# =============================================================================

FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app

RUN apk upgrade --no-cache && apk add --no-cache tini curl

RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist

RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 4006

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:4006/health || exit 1

ENV NODE_ENV=production
ENV PORT=4006

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/index.js"]
