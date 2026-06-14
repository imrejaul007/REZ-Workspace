FROM node:20-alpine

WORKDIR /app

# Install global dependencies
RUN npm install -g expo-cli

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source
COPY . .

# Set environment
ENV NODE_ENV=production

# Build the app (will produce web build)
RUN npx expo export --platform web

# Install serve to serve the web build
RUN npm install -g serve

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

# Start serve
CMD ["serve", "-s", "dist", "-l", "3000"]
