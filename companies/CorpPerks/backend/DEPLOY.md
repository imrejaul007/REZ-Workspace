# CorpPerks Backend Deployment Guide

## Prerequisites

- [ ] MongoDB Atlas account
- [ ] GitHub account
- [ ] Render account (free tier works)

---

## Step 1: Push to GitHub

```bash
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/CorpPerks/backend

# Initialize git if needed
git init
git add .
git commit -m "CorpPerks Backend API - Initial deployment"

# Add remote (create repo on GitHub first)
git remote add origin https://github.com/yourusername/corpperks-backend.git
git push -u origin main
```

---

## Step 2: Create MongoDB Atlas Cluster

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create free M0 cluster (Singapore region)
3. Create database user:
   - Username: `corpperks_app`
   - Password: (generate strong password)
4. Network access: Add `0.0.0.0/0` (allow all IPs) or Render's IP
5. Get connection string:
   ```
   mongodb+srv://corpperks_app:PASSWORD@cluster.mongodb.net/corpperks?retryWrites=true&w=majority
   ```

---

## Step 3: Deploy to Render

1. Go to [render.com](https://render.com)
2. Connect GitHub account
3. Click "New Blueprint Instance"
4. Select `corpperks-backend` repository
5. Use `render.yaml` configuration
6. Add environment variables:
   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `PORT` | `4006` |
   | `MONGODB_URI` | (from Step 2) |
   | `JWT_SECRET` | (auto-generated) |
   | `JWT_EXPIRES_IN` | `7d` |
   | `CORS_ORIGIN` | `https://peopleos.corpperks.com` |

7. Click "Apply"

---

## Step 4: Verify Deployment

```bash
# Test health endpoint
curl https://your-service.onrender.com/health

# Expected response:
# {"status":"ok","service":"corpperks-backend","timestamp":"2026-05-22T..."}
```

---

## Step 5: Update Frontend API Client

Update PeopleOS to use production URL:

```typescript
// /CorpPerks/peopleos/src/lib/api/client.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://your-service.onrender.com/api/v1';
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/login` | Login |
| POST | `/api/v1/auth/register` | Register |
| GET | `/api/v1/auth/me` | Current user |
| GET | `/api/v1/tenants` | List tenants |
| POST | `/api/v1/tenants` | Create tenant |
| GET | `/api/v1/employees` | List employees |
| POST | `/api/v1/employees` | Create employee |
| GET | `/api/v1/leave` | Leave requests |
| POST | `/api/v1/leave` | Create leave request |
| PUT | `/api/v1/leave/:id` | Update leave |
| GET | `/api/v1/attendance` | Attendance records |
| POST | `/api/v1/attendance` | Check in |
| GET | `/api/v1/shifts` | Shift schedule |
| POST | `/api/v1/shifts` | Create shift |
| GET | `/api/v1/departments` | List departments |
| POST | `/api/v1/departments` | Create department |

---

## Health Check

```
GET /health
```

Response:
```json
{
  "status": "ok",
  "service": "corpperks-backend",
  "timestamp": "2026-05-22T00:00:00.000Z"
}
```

---

## Troubleshooting

### 500 Error on startup
- Check MongoDB URI is correct
- Verify network access in Atlas

### CORS errors
- Add frontend domain to `CORS_ORIGIN` env var

### JWT errors
- Ensure `JWT_SECRET` is at least 32 characters
