# Karma Foundation - Deployment Guide

**Version:** 1.0.0 | **Date:** May 27, 2026

---

## Prerequisites

- Node.js 20+
- MongoDB 6+ (local or Atlas)
- Redis 7+ (local or cloud)
- Docker (optional)

---

## Environment Variables

### karma-service (Port 3009)

```env
# Required
PORT=3009
MONGODB_URI=mongodb://localhost:27017/karma_foundation
REDIS_URL=redis://localhost:6379
JWT_SECRET=<minimum-32-characters>
INTERNAL_SERVICE_TOKEN=<secret-token>
QR_SECRET=<hmac-secret>

# RABTUL Integration
AUTH_SERVICE_URL=https://rez-auth-service.onrender.com
WALLET_SERVICE_URL=https://rez-wallet-service.onrender.com

# Optional
NODE_ENV=production
SENTRY_DSN=<sentry-key>
CORS_ORIGIN=https://karma-foundation.vercel.app
```

### karma-loyalty-bridge (Port 4098)

```env
PORT=4098
MONGODB_URI=mongodb://localhost:27017/karma_loyalty
RABTUL_URL=http://localhost:4004
KARMA_URL=http://localhost:3009
ADMIN_TOKEN=<admin-token>
```

### karma-web (Next.js)

```env
NEXT_PUBLIC_API_URL=https://karma-foundation-api.onrender.com
```

### karma-mobile (Expo)

```env
API_URL=https://karma-foundation-api.onrender.com
AUTH_URL=https://rez-auth-service.onrender.com
```

---

## Local Development

### 1. karma-service

```bash
cd karma-service
npm install
npm run build
npm start
# Runs on http://localhost:3009
```

### 2. karma-loyalty-bridge

```bash
cd karma-loyalty-bridge
npm install
npm run build
npm start
# Runs on http://localhost:4098
```

### 3. karma-web

```bash
cd karma-web
npm install
npm run dev
# Runs on http://localhost:3000
```

### 4. karma-mobile

```bash
cd karma-mobile
npm install
npx expo start
```

---

## Docker Deployment

### karma-service

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3009
CMD ["node", "dist/index.js"]
```

### Build & Run

```bash
docker build -t karma-foundation-service ./karma-service
docker run -p 3009:3009 \
  -e MONGODB_URI=mongodb://host:27017/karma_foundation \
  -e REDIS_URL=redis://host:6379 \
  -e JWT_SECRET=$JWT_SECRET \
  -e QR_SECRET=$QR_SECRET \
  karma-foundation-service
```

---

## Production Deployment

### karma-service (Render)

1. Connect GitHub repo
2. Set build command: `npm run build`
3. Set start command: `npm start`
4. Add environment variables
5. Deploy

### karma-loyalty-bridge (Render)

1. Connect GitHub repo
2. Set build command: `npm run build`
3. Set start command: `npm start`
4. Add environment variables
5. Deploy

### karma-web (Vercel)

1. Import project from GitHub
2. Set root directory: `karma-web`
3. Add environment variables:
   - `NEXT_PUBLIC_API_URL`
4. Deploy

### karma-mobile (EAS)

```bash
# Configure EAS
eas build:configure

# Build for Android
eas build --platform android --profile preview

# Build for iOS
eas build --platform ios --profile preview

# Submit to stores
eas submit --platform android
eas submit --platform ios
```

---

## Health Checks

| Service | Endpoint |
|---------|----------|
| karma-service | `GET /health` |
| karma-loyalty-bridge | `GET /health` |

---

## Monitoring

### Prometheus Metrics

- karma-service: `GET /metrics`

### Sentry

Set `SENTRY_DSN` environment variable for error tracking.

---

## Security Checklist

- [x] JWT_SECRET minimum 32 characters (validated at startup)
- [x] QR_SECRET configured (fail-closed if missing)
- [x] INTERNAL_SERVICE_TOKEN set
- [x] CORS_ORIGIN restricted to production domain (required in production)
- [x] Rate limiting enabled
- [x] MongoDB authentication enabled
- [x] Redis authentication enabled
- [ ] SSL/TLS configured
- [x] CSP headers enabled (helmet middleware)
- [x] NEXT_PUBLIC_TOKEN_DERIV_SECRET set (web app)
- [x] ADMIN_TOKEN set (loyalty bridge)
- [x] Biometric auth enabled (mobile)

---

## Troubleshooting

### Connection Refused

Check if services are running:
```bash
curl http://localhost:3009/health
curl http://localhost:4098/health
```

### MongoDB Connection Failed

1. Verify MongoDB is running
2. Check connection string
3. Verify network access

### Redis Connection Failed

1. Verify Redis is running
2. Check connection string
3. Verify network access

---

## Support

For issues, contact: support@karma.foundation
