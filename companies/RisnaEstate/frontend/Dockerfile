FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./.next/standalone
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3001

ENV NODE_ENV=production
ENV PORT=3001
ENV NEXT_PUBLIC_API_URL=http://localhost:3000

CMD ["node", ".next/standalone/server.js"]
