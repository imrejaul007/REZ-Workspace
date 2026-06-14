# RABTUL-Technologies Deployment Guide

**Last Updated:** 2026-05-12  
**Version:** 1.0.0

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development](#local-development)
3. [Deploying Services](#deploying-services)
4. [Render.com Setup](#rendercom-setup)
5. [Environment Variables](#environment-variables)
6. [Health Checks](#health-checks)
7. [Rollback Procedures](#rollback-procedures)
8. [Monitoring](#monitoring)

---

## Prerequisites

### Required Tools

- Node.js 18+
- npm or yarn
- Git
- MongoDB (local or Atlas)
- Redis (local or Redis Cloud)

### Required Accounts

- Render.com (for hosting)
- MongoDB Atlas (for database)
- Sentry (for error tracking)

---

## Local Development

### 1. Clone the Repository

```bash
git clone https://github.com/imrejaul007/RABTUL-Technologies.git
cd RABTUL-Technologies
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment

Copy `.env.example` to `.env` for each service:

```bash
cp .env.example .env
```

### 4. Update Environment Variables

```bash
# Required
MONGODB_URI=mongodb://localhost:27017/rez-auth
JWT_SECRET=your-super-secret-key-here
REDIS_URL=redis://localhost:6379
PORT=4001

# Sentry
SENTRY_DSN=https://xxx@sentry.io/xxx
```

### 5. Start Services

```bash
# Start individual service
cd rez-auth-service
npm run dev

# Or use turbo (if configured)
npm run dev --filter=rez-auth-service
```

### 6. Test Health Check

```bash
curl http://localhost:4001/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "rez-auth-service",
  "timestamp": "2026-05-12T00:00:00.000Z"
}
```

---

## Deploying Services

### Automatic Deployment (Render.com)

All services are configured for automatic deployment on push to `main` branch.

1. Push changes to GitHub
2. Render.com detects the push
3. Builds the service
4. Runs tests (if configured)
5. Deploys to production

### Manual Deployment

```bash
# Build locally
cd rez-auth-service
npm run build

# Deploy via render CLI (if configured)
render deploy
```

---

## Render.com Setup

### Service Configuration

Each service has a `render.yaml` or similar config:

```yaml
services:
  - type: web
    name: rez-auth-service
    env: node
    region: singapore
    plan: starter
    buildCommand: npm install && npm run build
    startCommand: npm start
    healthCheckPath: /health
    envVars:
      - key: NODE_ENV
        value: production
      - key: MONGODB_URI
        sync: false
```

### Service URLs

| Service | Production URL |
|--------|---------------|
| API Gateway | `https://rez-api-gateway.onrender.com` |
| Auth | `https://rez-auth-service.onrender.com` |
| Wallet | `https://rez-wallet-service-36vo.onrender.com` |
| Payment | `https://rez-payment-service.onrender.com` |
| Order | `https://rez-order-service.onrender.com` |
| Catalog | `https://rez-catalog-service-1.onrender.com` |
| Search | `https://rez-search-service.onrender.com` |

### Health Check Configuration

All services must have `/health` endpoint:

```typescript
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'service-name',
    timestamp: new Date().toISOString(),
  });
});
```

---

## Environment Variables

### Required for All Services

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `production` |
| `PORT` | Port to listen | `4001` |
| `MONGODB_URI` | MongoDB connection | `mongodb+srv://...` |
| `REDIS_URL` | Redis connection | `redis://...` |
| `SENTRY_DSN` | Sentry error tracking | `https://...` |

### Service-Specific Variables

#### Auth Service

| Variable | Description |
|----------|-------------|
| `JWT_SECRET` | JWT signing secret |
| `JWT_EXPIRY` | Token expiry (default: 7d) |
| `OTP_EXPIRY` | OTP expiry in seconds |

#### Payment Service

| Variable | Description |
|----------|-------------|
| `RAZORPAY_KEY_ID` | Razorpay key |
| `RAZORPAY_KEY_SECRET` | Razorpay secret |
| `RAZORPAY_WEBHOOK_SECRET` | Webhook signature |

#### API Gateway

| Variable | Description |
|----------|-------------|
| `INTERNAL_SERVICE_TOKENS_JSON` | Service auth tokens |
| `ALLOWED_ORIGINS` | CORS origins |

### Setting Environment Variables

**Render.com Dashboard:**
1. Go to Service → Environment
2. Add each variable
3. Mark sensitive values as "Secret"

**Local .env:**
```bash
MONGODB_URI=mongodb://localhost:27017/rez-auth
JWT_SECRET=dev-secret-key
```

---

## Health Checks

### Endpoint

All services expose `/health`:

```bash
curl https://rez-auth-service.onrender.com/health
```

### Response

```json
{
  "status": "healthy",
  "service": "rez-auth-service",
  "timestamp": "2026-05-12T00:00:00.000Z"
}
```

### Readyness Check

```bash
curl https://rez-api-gateway.onrender.com/ready
```

Response:
```json
{
  "status": "ready",
  "services": {
    "auth": "ok",
    "wallet": "ok",
    "payment": "ok"
  }
}
```

---

## Rollback Procedures

### Automatic Rollback

Render.com automatically rolls back if health checks fail.

### Manual Rollback

**Via Render Dashboard:**
1. Go to Deployments
2. Find the last working deployment
3. Click "Rollback"

**Via Git:**
```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Or deploy specific commit
git checkout <commit-hash>
git push origin main --force
```

### Emergency Rollback

```bash
# Get deployment ID
render deployments list --service=rez-auth-service

# Rollback to specific deployment
render deploy --id=<deployment-id> --service=rez-auth-service
```

---

## Monitoring

### Sentry Integration

All services integrate with Sentry:

```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});

// Error handler
app.use((err, req, res, next) => {
  Sentry.captureException(err);
  res.status(500).json({ error: 'Internal error' });
});
```

### Metrics Endpoint

Some services expose `/metrics`:

```bash
curl https://rez-auth-service.onrender.com/metrics
```

### Logs

View logs in Render Dashboard:
1. Go to Service → Logs
2. Filter by level (error, warn, info)

---

## Deployment Checklist

- [ ] All tests passing locally
- [ ] Environment variables configured
- [ ] Health check endpoint responding
- [ ] MongoDB connection verified
- [ ] Redis connection verified
- [ ] Sentry DSN configured
- [ ] CORS origins configured
- [ ] JWT secret set
- [ ] Service URLs updated in consumer app
- [ ] Load tested in staging

---

## Troubleshooting

### Service Won't Start

1. Check logs: `render logs --service=rez-auth-service`
2. Verify environment variables
3. Check MongoDB connection
4. Verify port is not in use

### Health Check Failing

1. Check service is running
2. Verify `/health` endpoint exists
3. Check database connection
4. Review error logs

### CORS Errors

1. Verify `ALLOWED_ORIGINS` includes your domain
2. Check format: `https://domain.com,https://admin.domain.com`

### Database Connection Failed

1. Verify `MONGODB_URI` is correct
2. Check MongoDB Atlas IP whitelist
3. Verify credentials

---

## Contact

For deployment issues, contact the platform team.
