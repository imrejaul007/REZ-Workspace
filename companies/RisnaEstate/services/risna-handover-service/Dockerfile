FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 4129

ENV NODE_ENV=production
ENV PORT=4129

CMD ["npx", "tsx", "src/index.ts"]
