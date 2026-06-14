# CorpPerks - Deployment Guide for Developer

**Last Updated:** 2026-05-02

---

## Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/imrejaul007/CorpPerks.git
cd CorpPerks

# 2. Clone services (they are in separate repos)
git clone https://github.com/imrejaul007/rez-corpperks-service.git ../rez-corpperks-service
git clone https://github.com/imrejaul007/rez-hotel-service.git ../rez-hotel-service
git clone https://github.com/imrejaul007/rez-procurement-service.git ../rez-procurement-service

# 3. Copy environment files
cd ../rez-corpperks-service && cp .env.example .env
cd ../rez-hotel-service && cp .env.example .env
cd ../rez-procurement-service && cp .env.example .env
cd ../../CorpPerks

# 4. Deploy
docker-compose up -d
```

---

## Environment Variables

### 1. rez-corpperks-service

File: `../rez-corpperks-service/.env`

```env
# Service
PORT=4013
NODE_ENV=production

# Database
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/corpperks

# CORS
CORS_ORIGIN=https://admin.rez.money,https://rez-app.vercel.app

# ReZ Services
WALLET_SERVICE_URL=https://rez-wallet-service.onrender.com
KARMA_SERVICE_URL=https://rez-karma-service.onrender.com
HOTEL_SERVICE_URL=http://hotel-service:4015
PROCUREMENT_SERVICE_URL=http://procurement-service:4012
```

### 2. rez-hotel-service (Hotel Bookings)

File: `../rez-hotel-service/.env`

```env
# Service
PORT=4015
NODE_ENV=production

# StayOwn API
STAYOWN_API_URL=https://api.stayown.com
STAYOWN_API_KEY=your_api_key
```

### 3. rez-procurement-service (Corporate Gifts)

File: `../rez-procurement-service/.env`

```env
# Service
PORT=4012
NODE_ENV=production

# NextaBizz API
NEXTABIZZ_API_URL=https://api.nextabizz.com
NEXTABIZZ_API_KEY=your_api_key
```

---

## Deploy Options

### Option 1: Docker Compose (Recommended)

```bash
docker-compose up -d
```

### Option 2: Render Blueprint

1. Go to https://dashboard.render.com/blueprints
2. Click "New Blueprint Instance"
3. Connect GitHub → Select CorpPerks repo
4. Add environment variables to each service
5. Click "Apply"

---

## Services & Ports

| Service | Port | Health Endpoint |
|---------|------|-----------------|
| rez-corpperks-service | 4013 | /health |
| rez-hotel-service | 4015 | /health |
| rez-procurement-service | 4012 | /health |

---

## Architecture

```
CorpPerks
├── rez-corpperks-service (4013)
│   ├── Wallet Management (Personal + Corporate)
│   ├── Benefits Configuration
│   ├── GST Invoicing
│   ├── HRIS Integration
│   └── Analytics
│
├── rez-hotel-service (4015)
│   └── Hotel Bookings (StayOwn)
│
└── rez-procurement-service (4012)
    └── Corporate Gifts (NextaBizz)
```

---

## Testing Deployment

```bash
# Health Check
curl http://localhost:4013/health
curl http://localhost:4015/health
curl http://localhost:4012/health

# Test API
curl http://localhost:4013/api/wallet/combined/E001
```

---

## Required Accounts

| Service | Website |
|---------|---------|
| MongoDB Atlas | https://cloud.mongodb.com |
| StayOwn | https://stayown.com (ReZ's own) |
| NextaBizz | https://nextabizz.com |

---

## Troubleshooting

### MongoDB Connection Error
- Check MONGODB_URI is correct
- Check IP whitelist includes 0.0.0.0/0

### Service Not Starting
```bash
docker-compose logs corpperks-api
```

---

## File Structure

```
ReZ Full App/
├── CorpPerks/
│   ├── docker-compose.yml
│   ├── render.yaml
│   └── docs/
├── rez-corpperks-service/
├── rez-hotel-service/
└── rez-procurement-service/
```
