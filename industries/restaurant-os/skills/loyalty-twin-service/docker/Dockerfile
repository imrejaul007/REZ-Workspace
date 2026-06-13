FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./

RUN npm ci

COPY src/ ./src/

RUN npm run build

FROM node:20-alpine AS production

WORKDIR /app

RUN mkdir -p /app/logs

COPY package*.json ./

RUN npm ci --only=production

COPY --from=builder /app/dist ./dist

COPY .env.example .env

EXPOSE 4019

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4019/health || exit 1

CMD ["node", "dist/index.js"]
