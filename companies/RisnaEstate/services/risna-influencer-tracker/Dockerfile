FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 4118

ENV NODE_ENV=production
ENV PORT=4118

CMD ["npx", "tsx", "src/index.ts"]
