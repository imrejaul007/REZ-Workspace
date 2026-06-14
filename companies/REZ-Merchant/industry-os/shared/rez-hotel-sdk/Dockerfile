# REZ Hotel SDK - Docker Image
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY src ./src

# Install dependencies and build
RUN npm ci
RUN npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

# Copy package files and built output
COPY package*.json ./
COPY dist ./dist

# Install production dependencies only
RUN npm ci --only=production

# Set environment
ENV NODE_ENV=production

# Run the SDK
CMD ["node", "dist/index.js"]
