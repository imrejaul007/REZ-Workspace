# Deployment Guide - ReZ Safe QR Service

## Render Deployment

### Option 1: Auto-Deploy from GitHub

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub account
4. Select repository: `imrejaul007/REZ-Commerce`
5. Set root directory: `REZ-Commerce/rez-safe-qr-service`
6. Configure:
   - **Name:** `rez-safe-qr-service`
   - **Region:** Singapore
   - **Branch:** `main`
   - **Runtime:** `Docker`
   - **Plan:** Starter (Free)

7. Add environment variables:

```bash
# Required
NODE_ENV=production
PORT=4000
MONGODB_URI=<your-mongodb-uri>
INTERNAL_SERVICE_TOKEN=<generate-with-openssl-rand-hex-32>

# RABTUL Services
AUTH_SERVICE_URL=https://rez-auth-service.onrender.com
NOTIFICATIONS_SERVICE_URL=https://rez-notifications-service.onrender.com
WHATSAPP_SERVICE_URL=https://reks-whatsapp-commerce.onrender.com

# QR Config
QR_BASE_URL=https://rez.app/s

# Optional (for production)
REDIS_URL=<your-redis-uri>
FIREBASE_SERVER_KEY=<your-firebase-key>
EXPO_ACCESS_TOKEN=<your-expo-token>
SENTRY_DSN=<your-sentry-dsn>
```

8. Click **"Create Web Service"**

### Option 2: Using Render CLI

```bash
# Login to Render
render login

# Create the service (will prompt for env vars)
render create --type=web --name=rez-safe-qr-service

# Deploy
cd rez-safe-qr-service
render deploy
```

### Option 3: Manual Docker Deploy

```bash
# Build image
docker build -t rez-safe-qr-service .

# Run
docker run -p 4000:4000 \
  -e MONGODB_URI=<your-uri> \
  -e INTERNAL_SERVICE_TOKEN=<your-token> \
  rez-safe-qr-service
```

---

## MongoDB Setup

### Option 1: MongoDB Atlas (Recommended)

1. Create account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create free cluster (M0 Sandbox)
3. Create database user
4. Whitelist IP: `0.0.0.0/0` (for development)
5. Copy connection string:

```
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/rez-safe-qr
```

### Option 2: Local MongoDB

```bash
# macOS (with Homebrew)
brew install mongodb-community
brew services start mongodb-community

# Ubuntu
sudo apt install mongodb
sudo systemctl start mongodb
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Yes | `production` |
| `PORT` | Yes | `4000` |
| `MONGODB_URI` | Yes | MongoDB connection string |
| `INTERNAL_SERVICE_TOKEN` | Yes | Generate: `openssl rand -hex 32` |
| `AUTH_SERVICE_URL` | Yes | RABTUL Auth service |
| `NOTIFICATIONS_SERVICE_URL` | Yes | RABTUL Notifications |
| `WHATSAPP_SERVICE_URL` | No | WhatsApp integration |
| `REDIS_URL` | No | Redis for caching |
| `QR_BASE_URL` | No | Base URL for QR links |
| `FIREBASE_SERVER_KEY` | No | FCM push notifications |
| `EXPO_ACCESS_TOKEN` | No | Expo push notifications |
| `SENTRY_DSN` | No | Error tracking |

---

## Post-Deployment

### 1. Health Check

```bash
curl https://rez-safe-qr-service.onrender.com/api/health
```

Expected response:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "version": "1.0.0",
    "timestamp": "2026-05-14T00:00:00.000Z"
  }
}
```

### 2. Test OTP Flow

```bash
# Request OTP
curl -X POST https://rez-safe-qr-service.onrender.com/api/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "9876543210"}'

# Verify OTP (use the OTP from logs/dev mode)
curl -X POST https://rez-safe-qr-service.onrender.com/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "919876543210", "otp": "123456"}'
```

### 3. Update Client Apps

Update these environment variables in your client apps:

**Consumer App:**
```
EXPO_PUBLIC_SAFE_QR_API=https://rez-safe-qr-service.onrender.com/api
```

**Web (rez-now):**
```
NEXT_PUBLIC_SAFE_QR_API=https://rez-safe-qr-service.onrender.com/api
```

---

## Troubleshooting

### Service Won't Start

1. Check logs: `render logs rez-safe-qr-service`
2. Common issues:
   - Missing `MONGODB_URI`
   - Invalid `INTERNAL_SERVICE_TOKEN`
   - Port already in use

### Database Connection Failed

1. Verify MongoDB URI format
2. Check IP whitelist (allow 0.0.0.0/0 for Render)
3. Test locally first

### CORS Errors

The service allows all origins in development. For production, update CORS configuration in `src/index.ts`.

---

## Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use MongoDB Atlas (not local)
- [ ] Configure Redis for caching (optional)
- [ ] Add `FIREBASE_SERVER_KEY` for push notifications
- [ ] Add `EXPO_ACCESS_TOKEN` for RN notifications
- [ ] Set up monitoring (Sentry)
- [ ] Configure domain (optional)
