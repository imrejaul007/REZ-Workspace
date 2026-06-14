# REZ Fitness SDK - Docker Image
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json tsconfig.json ./
COPY src ./src
RUN npm ci && npm run build

FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
COPY dist ./dist
RUN npm ci --only=production
ENV NODE_ENV=production
CMD ["node", "dist/index.js"]
