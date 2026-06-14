# Rez Shopify Referrals - Production Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build || true
EXPOSE 3113
CMD ["npm", "start"]
