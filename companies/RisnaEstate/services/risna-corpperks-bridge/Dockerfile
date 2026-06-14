FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 4114

ENV NODE_ENV=production
ENV PORT=4114

CMD ["npx", "tsx", "src/index.ts"]
