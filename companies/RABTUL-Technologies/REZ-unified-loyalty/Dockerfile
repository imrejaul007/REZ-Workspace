# REZ Unified Loyalty Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
RUN mkdir -p dist src || true
COPY dist ./dist
COPY src ./src
EXPOSE 4049
CMD ["node", "dist/index.js"]
