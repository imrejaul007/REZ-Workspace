FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 4113

ENV NODE_ENV=production
ENV PORT=4113

CMD ["npx", "tsx", "src/index.ts"]
