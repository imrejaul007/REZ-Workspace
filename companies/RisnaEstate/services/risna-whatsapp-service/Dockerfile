FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 4111

ENV NODE_ENV=production
ENV PORT=4111

CMD ["npx", "tsx", "src/index.ts"]
