# REZ Contracts Service Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
RUN mkdir -p dist src || true
COPY dist ./dist
COPY src ./src
EXPOSE 4035
CMD ["node", "dist/index.js"]
