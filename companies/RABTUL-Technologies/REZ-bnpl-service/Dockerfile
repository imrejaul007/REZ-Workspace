FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

EXPOSE 4300

ENV NODE_ENV=production
ENV PORT=4300

CMD ["node", "dist/index.js"]
