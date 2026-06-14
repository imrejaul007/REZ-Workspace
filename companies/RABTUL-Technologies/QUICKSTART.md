# REZ QR Cloud - Quickstart Guide

**Deploy in 15 minutes. Start selling today.**

---

## Prerequisites

- GitHub account
- MongoDB Atlas account (free)
- Render account (free tier available)

---

## Step 1: Deploy Service (5 min)

### 1.1 Push to GitHub

```bash
cd RABTUL-Technologies

# Add files
git add rez-qr-cloud-service/ rez-qr-cloud-app/

# Commit
git commit -m "feat: QR Cloud v2.1 - Complete QR commerce platform"

# Push
git push origin main
```

### 1.2 Create MongoDB Atlas Cluster

1. Go to https://www.mongodb.com/cloud/atlas
2. Click "Build a Database"
3. Choose **FREE** tier
4. Select **Mumbai** region
5. Click "Create"

### 1.3 Get Connection String

1. Click "Connect" on your cluster
2. Select "Connect your application"
3. Copy connection string
4. Replace `<password>` with your password

### 1.4 Deploy to Render

1. Go to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repo
4. Settings:
   - **Root Directory:** `rez-qr-cloud-service`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Add environment variables:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `4300` |
| `MONGODB_URI` | Your Atlas connection string |
| `LOG_LEVEL` | `info` |

6. Click "Create Web Service"
7. Wait 2-3 minutes

---

## Step 2: Deploy Customer App (5 min)

### 2.1 Deploy to Vercel

1. Go to https://vercel.com
2. Import project
3. Select `rez-qr-cloud-app` folder
4. Framework: Static
5. Deploy

### 2.2 Update API URL

After deployment, edit `index.html`:
```javascript
const API_URL = 'https://your-service.onrender.com/api';
```

---

## Step 3: Test (2 min)

### 3.1 Health Check

```bash
curl https://your-service.onrender.com/api/health
```

Should return:
```json
{"status":"healthy","service":"qr-cloud"}
```

### 3.2 Create Test Merchant

```bash
curl -X POST https://your-service.onrender.com/api/merchants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Restaurant",
    "slug": "test-restaurant",
    "type": "restaurant",
    "phone": "+919876543210"
  }'
```

Should return API key:
```json
{
  "success": true,
  "data": {
    "apiKey": "qr_xxxxx..."
  }
}
```

---

## Step 4: Go Sell (3 min)

### 4.1 Access Dashboard

1. Open `dashboard.html`
2. Enter API key
3. Start creating QR codes

### 4.2 Merchant Acquisition

See `MERCHANT-ACQUISITION.md` for sales scripts.

---

## Quick Reference

### Service URLs

| Environment | URL |
|-------------|-----|
| Local | `http://localhost:4300` |
| Production | `https://your-service.onrender.com` |

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/merchants` | Create merchant |
| GET | `/api/resolve/:code` | Resolve QR |
| POST | `/api/orders` | Create order |

### Test Credentials

After deployment, use the API key from merchant creation.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Service not starting | Check logs in Render |
| MongoDB connection | Verify connection string |
| CORS errors | Update ALLOWED_ORIGINS |
| WebSocket not working | Enable WebSocket on Render (paid) |

---

## Next Steps

1. ✅ Deploy service
2. ⬜ Add Razorpay keys
3. ⬜ Configure custom domain
4. ⬜ Start merchant acquisition

---

## Support

- Email: support@rez.money
- Docs: See README.md
- Sales: See MERCHANT-ACQUISITION.md
