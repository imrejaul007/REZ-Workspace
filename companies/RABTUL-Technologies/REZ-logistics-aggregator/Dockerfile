# REZ Logistics Aggregator Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY dist ./dist 2>/dev/null || true
COPY src ./src
EXPOSE 4052
CMD ["node", "dist/index.js"]
