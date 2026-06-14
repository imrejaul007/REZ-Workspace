# Deploy New Services to Render.com

**Date:** 2026-05-13

---

## Prerequisites

1. Install Render CLI: `npm install -g @render/cli`
2. Login: `render login`

---

## Services to Deploy

| Service | Name | Port |
|---------|------|------|
| Articles | `rez-articles-service` | 4010 |
| Bill Payments | `rez-bill-payments-service` | 4030 |
| Cashback | `rez-cashback-service` | 4040 |
| Gamification | `rez-gamification-service` | 4050 |
| Creator Earnings | `rez-creator-earnings-service` | 4060 |

---

## Deploy Each Service

### Option 1: Via Render Dashboard

1. Go to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Connect GitHub: `imrejaul007/RABTUL-Technologies`
4. Select the service folder (e.g., `rez-articles-service`)
5. Configure:
   - **Name:** `rez-articles-service`
   - **Region:** Singapore
   - **Branch:** `main`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
6. Add Environment Variables:
   ```
   NODE_ENV = production
   PORT = 4010
   MONGODB_URI = (your MongoDB Atlas URI)
   SENTRY_DSN = (your Sentry DSN)
   ALLOWED_ORIGINS = https://rezapp.com,https://www.rezapp.com
   ```
7. Click "Create Web Service"

### Option 2: Via CLI

```bash
# Login first
render login

# Deploy each service
render deploy --service=rez-articles-service --path=rez-articles-service
render deploy --service=rez-bill-payments-service --path=rez-bill-payments-service
render deploy --service=rez-cashback-service --path=rez-cashback-service
render deploy --service=rez-gamification-service --path=rez-gamification-service
render deploy --service=rez-creator-earnings-service --path=rez-creator-earnings-service
```

---

## After Deployment

### 1. Verify Health Checks

```bash
curl https://rez-articles-service.onrender.com/health
curl https://rez-bill-payments-service.onrender.com/health
curl https://rez-cashback-service.onrender.com/health
curl https://rez-gamification-service.onrender.com/health
curl https://rez-creator-earnings-service.onrender.com/health
```

### 2. Update API Gateway

Add service URLs to API Gateway environment variables:

```bash
ARTICLES_SERVICE_URL=https://rez-articles-service.onrender.com
BILL_PAYMENTS_SERVICE_URL=https://rez-bill-payments-service.onrender.com
CASHBACK_SERVICE_URL=https://rez-cashback-service.onrender.com
GAMIFICATION_SERVICE_URL=https://rez-gamification-service.onrender.com
CREATOR_EARNINGS_SERVICE_URL=https://rez-creator-earnings-service.onrender.com
```

### 3. Update Consumer App .env

```bash
EXPO_PUBLIC_ARTICLES_SERVICE_URL=https://rez-articles-service.onrender.com
EXPO_PUBLIC_BILL_PAYMENTS_SERVICE_URL=https://rez-bill-payments-service.onrender.com
EXPO_PUBLIC_CASHBACK_SERVICE_URL=https://rez-cashback-service.onrender.com
EXPO_PUBLIC_GAMIFICATION_SERVICE_URL=https://rez-gamification-service.onrender.com
EXPO_PUBLIC_CREATOR_EARNINGS_SERVICE_URL=https://rez-creator-earnings-service.onrender.com
```

---

## Troubleshooting

### Service Won't Start

1. Check logs: `render logs --service=rez-articles-service`
2. Verify environment variables are set
3. Check MongoDB connection

### Health Check Failing

1. Ensure `/health` endpoint exists
2. Check service is listening on correct port
3. Review error logs

### CORS Errors

1. Verify `ALLOWED_ORIGINS` includes your domain
2. Check format: `https://domain.com,https://admin.domain.com`

---

## Expected URLs

After deployment:

| Service | Expected URL |
|---------|--------------|
| Articles | `https://rez-articles-service.onrender.com` |
| Bill Payments | `https://rez-bill-payments-service.onrender.com` |
| Cashback | `https://rez-cashback-service.onrender.com` |
| Gamification | `https://rez-gamification-service.onrender.com` |
| Creator Earnings | `https://rez-creator-earnings-service.onrender.com` |

---

## Post-Deployment Checklist

- [ ] All 5 services deployed
- [ ] Health checks passing
- [ ] Gateway routes configured
- [ ] Consumer app env vars updated
- [ ] Integration tests passing
