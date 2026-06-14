# Rez Websocket Hub - Production Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build || true
EXPOSE 4024
CMD ["npm", "start"]
