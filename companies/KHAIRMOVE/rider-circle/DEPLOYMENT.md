# 🚀 RiderCircle Deployment Guide

**Version:** 1.0.0 | **Date:** June 7, 2026

---

## 📋 Prerequisites

- Node.js 18+
- MongoDB 6.0+ (or MongoDB Atlas)
- Redis 7.0+ (optional)
- Expo account for mobile deployment

---

## 🖥️ Backend Deployment

### Option 1: Railway (Recommended)

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Deploy API**
   ```bash
   cd rider-circle-api

   # Connect GitHub repo
   railway init

   # Set environment variables
   railway variables set JWT_SECRET=your-secret-key
   railway variables set MONGODB_URI=mongodb://...
   railway variables set NODE_ENV=production

   # Deploy
   railway up
   ```

3. **Add MongoDB**
   - Add MongoDB plugin from Railway marketplace
   - Connection string will be auto-injected

4. **Get Public URL**
   - Your API will be available at: `https://rider-circle-api.up.railway.app`

### Option 2: Render

1. **Create Render Account**
   - Go to [render.com](https://render.com)
   - Connect GitHub

2. **Create Web Service**
   - New → Web Service
   - Connect your repo
   - Set build command: `npm install && npm run build`
   - Set start command: `node dist/index.js`
   - Add environment variables

3. **Add MongoDB**
   - New → MongoDB
   - Connect to your service

### Option 3: Docker

```bash
cd rider-circle

# Build
docker build -t rider-circle-api -f rider-circle-api/Dockerfile .

# Run
docker run -p 4200:4200 \
  -e MONGODB_URI=mongodb://host:27017/rider_circle \
  -e JWT_SECRET=your-secret \
  rider-circle-api
```

---

## 📱 Mobile Deployment

### Option 1: Expo EAS (Recommended)

1. **Setup EAS Build**
   ```bash
   cd rider-circle-app

   # Install EAS CLI
   npm install -g eas-cli

   # Login to Expo
   eas login

   # Configure EAS
   eas build:configure
   ```

2. **Build for Android**
   ```bash
   eas build --platform android --profile preview
   ```

3. **Build for iOS** (requires Apple Developer account)
   ```bash
   eas build --platform ios --profile production
   ```

4. **Submit to Stores**
   ```bash
   eas submit --platform android --latest
   eas submit --platform ios --latest
   ```

### Option 2: Local Build

```bash
cd rider-circle-app

# Generate Android APK
npx expo run:android --variant release

# Generate iOS IPA (Mac only)
npx expo run:ios --configuration Release
```

---

## ⚙️ Environment Variables

### Backend (.env)

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=7d

# MongoDB
MONGODB_URI=mongodb://localhost:27017/rider_circle
MONGODB_DB_NAME=rider_circle

# Redis (optional)
REDIS_URL=redis://localhost:6379

# RABTUL Integration
REZ_AUTH_URL=https://your-rabtul-auth-url.com
REZ_WALLET_URL=https://your-rabtul-wallet-url.com
REZ_NOTIFICATION_URL=https://your-notification-url.com

# HOJAI Integration
HOJAI_AGENT_URL=https://your-hojai-url.com
HOJAI_MEMORY_URL=https://your-memory-url.com
HOJAI_KG_URL=https://your-kg-url.com
```

### Mobile (app.json)

```json
{
  "expo": {
    "extra": {
      "apiUrl": "https://your-api-url.com",
      "eas": {
        "projectId": "your-project-id"
      }
    }
  }
}
```

---

## 🔗 External Service URLs

Update these in your environment after deploying:

| Service | Production URL |
|---------|---------------|
| API | `https://your-api.railway.app` |
| MongoDB | MongoDB Atlas or Railway plugin |
| RABTUL Auth | `https://rabtul-auth.ridercircle.app` |
| RABTUL Wallet | `https://rabtul-wallet.ridercircle.app` |
| HOJAI | `https://hojai.ridercircle.app` |

---

## ✅ Post-Deployment Checklist

- [ ] API health check: `GET /api/health`
- [ ] Database connection verified
- [ ] Environment variables set
- [ ] CORS origins configured
- [ ] Push notification tokens working
- [ ] Mobile app connected to production API
- [ ] SSL certificate active
- [ ] Monitoring/logging setup

---

## 🐛 Troubleshooting

### API Won't Start

1. Check MongoDB connection
   ```bash
   curl http://localhost:4200/api/health/ready
   ```

2. Check logs
   ```bash
   railway logs
   # or
   docker logs rider-circle-api
   ```

### Mobile Can't Connect to API

1. Update API URL in mobile app
2. Check CORS configuration
3. Verify SSL certificate

### Push Notifications Not Working

1. Check notification permissions
2. Verify push token registration
3. Check notification channel setup

---

## 📊 Monitoring

### Recommended Services

- **Sentry** - Error tracking
- **LogRocket** - User session replay
- **Datadog** - APM and monitoring

### Health Check Endpoint

```
GET https://your-api-url.com/api/health
```

Response:
```json
{
  "status": "ok",
  "service": "rider-circle-api",
  "version": "1.0.0",
  "timestamp": "2026-06-07T00:00:00.000Z"
}
```

---

## 🚀 Production Checklist

- [ ] HTTPS enabled
- [ ] Environment variables secured
- [ ] Database backed up
- [ ] Rate limiting configured
- [ ] CORS restricted to mobile app domains
- [ ] Error monitoring active
- [ ] Log aggregation setup
- [ ] Autoscaling configured
- [ ] CDN for static assets

---

**For support:** Create an issue on GitHub or contact the team.
