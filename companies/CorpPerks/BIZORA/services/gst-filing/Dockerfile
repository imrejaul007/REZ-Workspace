FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production || npm install --production

COPY src/ ./src/

EXPOSE 4100

CMD ["node", "src/index.js"]
