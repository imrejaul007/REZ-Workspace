FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev
RUN mkdir -p ./logs

EXPOSE 4001

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s CMD node -e "require('http').get('http://localhost:4001/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))" || exit 1

CMD ["node", "dist/index.js"]
