FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 4117

ENV NODE_ENV=production
ENV PORT=4117

CMD ["npx", "tsx", "src/index.ts"]
