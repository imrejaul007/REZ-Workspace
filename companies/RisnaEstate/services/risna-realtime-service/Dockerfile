FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 4121

ENV NODE_ENV=production
ENV PORT=4121

CMD ["npx", "tsx", "src/index.ts"]
