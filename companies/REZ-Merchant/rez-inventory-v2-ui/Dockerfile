# ================================================
# REZ Inventory V2 UI - Production Dockerfile
# Multi-stage build for Vite/React SPA
# ================================================

# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN npm run build

# Stage 3: Production - Serve with nginx
FROM nginx:alpine AS production

# Security: Create nginx user
RUN addgroup -g 101 -S nginx && \
    adduser -S nginx -u 101 -G nginx

# Copy built files
COPY --from=builder --chown=nginx:nginx /app/dist /usr/share/nginx/html

# Nginx configuration for SPA with security headers
RUN echo 'server { \
    listen 80; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    \
    # Security headers \
    add_header X-Frame-Options "SAMEORIGIN" always; \
    add_header X-Content-Type-Options "nosniff" always; \
    add_header X-XSS-Protection "1; mode=block" always; \
    add_header Referrer-Policy "strict-origin-when-cross-origin" always; \
    \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    \
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ { \
        expires 1y; \
        add_header Cache-Control "public, immutable"; \
    } \
    \
    # Disable access to hidden files \
    location ~ /\. { \
        deny all; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Set ownership
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown nginx:nginx /etc/nginx/conf.d/default.conf

USER nginx

EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
