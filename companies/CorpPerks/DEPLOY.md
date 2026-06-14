# CorpPerks Ecosystem Deployment Checklist

## Overview

```
CorpPerks Platform (Port 4006)
    │
    ├── PeopleOS (Frontend - Vercel)
    │
    ├── nextaBizz (B2B Procurement)
    │   ├── Web App (Docker)
    │   └── Services (Docker/PM2)
    │
    └── ReStopapa (Restaurant - Port 4005)
        └── Sends webhooks → nextaBizz
```

---

## Step 1: MongoDB Atlas Setup (Required)

1. Create account at mongodb.com/cloud/atlas
2. Create free M0 cluster in Singapore region
3. Create database user with read/write permissions
4. Add network access: 0.0.0.0/0
5. Get connection string

---

## Step 2: Deploy CorpPerks Backend

**Location:** CorpPerks/backend/

```bash
# Push to GitHub
git init
git add .
git commit -m "CorpPerks Backend v1.0"
git remote add origin https://github.com/yourusername/corpperks-backend.git
git push -u origin main
```

**Render Setup:**
- Connect GitHub repo
- Region: Singapore
- Build command: npm install && npm run build
- Start command: npm start

**Environment Variables:**
| Variable | Value |
|----------|-------|
| NODE_ENV | production |
| PORT | 4006 |
| MONGODB_URI | mongodb+srv://... |
| JWT_SECRET | (auto-generate) |
| JWT_EXPIRES_IN | 7d |

---

## Step 3: Deploy ReStopapa Backend

**Location:** CorpPerks/restopapa/backend/

Uses NestJS with Prisma. Deploy similarly to Step 2.

---

## Step 4: Deploy nextaBizz

**Location:** CorpPerks/nextabizz/

Uses Docker and Turbo monorepo. See nextabizz/DEPLOY.md for details.

---

## Step 5: Deploy PeopleOS Frontend

**Location:** CorpPerks/peopleos/

Deploy to Vercel with NEXT_PUBLIC_API_URL pointing to CorpPerks Backend.

---

## Verification

```bash
# Test CorpPerks Backend
curl https://your-api.onrender.com/health

# Test ReStopapa Backend
curl https://restopapa-api.onrender.com/health
```
