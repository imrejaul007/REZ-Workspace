# QR Cloud Service - Deployment Guide

## Quick Deploy to Render

### Step 1: Create MongoDB Atlas Database

1. Go to https://www.mongodb.com/cloud/atlas
2. Create free cluster (M0 Sandbox)
3. Create database user
4. Whitelist IP: `0.0.0.0/0`
5. Copy connection string

### Step 2: Deploy to Render

1. Go to https://dashboard.render.com
2. Click "New +" → "Blueprint"
3. Connect GitHub: https://github.com/imrejaul007/RABTUL-Technologies
4. Create `render.yaml` file:

```yaml
services:
  - type: web
    name: rez-qr-cloud
    env: node
    region: singapore
    plan: starter
    buildCommand: npm install && npm run build
    startCommand: npm start
    healthCheckPath: /api/health
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 4300
      - key: MONGODB_URI
        sync: false
      - key: QR_CLOUD_URL
        value: https://qr.rez.money
      - key: INTERNAL_SERVICE_TOKEN
        sync: false
```

### Step 3: Set Environment Variables

| Variable | Value |
|----------|-------|
| `MONGODB_URI` | Your MongoDB Atlas connection string |
| `QR_CLOUD_URL` | `https://qr.rez.money` |
| `INTERNAL_SERVICE_TOKEN` | `random-secure-token` |
| `AUTH_SERVICE_URL` | `https://rez-auth-service.onrender.com` |
| `PAYMENT_SERVICE_URL` | `https://rez-payment-service.onrender.com` |
| `WALLET_SERVICE_URL` | `https://rez-wallet-service-36vo.onrender.com` |
| `NOTIFICATION_SERVICE_URL` | `https://rez-notifications-service.onrender.com` |

### Step 4: Deploy

Click "Create Blueprint" and wait for deployment.

---

## Alternative: Manual Deploy

```bash
# Build locally
cd rez-qr-cloud-service
npm run build

# Deploy to Render CLI
render deploy
```

---

## After Deployment

1. Update `QR_CLOUD_URL` in config
2. Test health endpoint: `https://your-url.onrender.com/api/health`
3. Test merchant creation
4. Update DNS for `qr.rez.money`

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| MongoDB connection failed | Check MONGODB_URI format |
| Service not starting | Check logs in Render dashboard |
| WebSocket not working | Enable WebSocket in Render (paid plan) |

---

## Free Tier Limitations

| Feature | Free | Paid |
|---------|------|------|
| Server | 750 hours/month | Unlimited |
| Sleep after 15min | Yes | No |
| Custom domain | No | Yes |
| WebSocket | Limited | Full |
| MongoDB Atlas | 512MB | 10GB+ |

**Recommendation:** Use paid plan for production.
