# Rez Retail Crm Service - Production Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build || true
EXPOSE 4101
CMD ["npm", "start"]
