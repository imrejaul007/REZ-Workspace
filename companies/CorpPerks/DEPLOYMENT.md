# CorpPerks Production Deployment Guide

> Complete step-by-step guide for deploying CorpPerks to production.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Architecture Overview](#architecture-overview)
3. [Environment Setup](#environment-setup)
4. [Database Migration](#database-migration)
5. [Docker Deployment](#docker-deployment)
6. [Cloud Deployment](#cloud-deployment)
7. [Health Checks](#health-checks)
8. [Monitoring](#monitoring)
9. [Rollback Procedure](#rollback-procedure)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Tools

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 20.x LTS | Runtime for backend services |
| Docker | 24.x+ | Containerization |
| Docker Compose | 2.x+ | Multi-container orchestration |
| Git | 2.x+ | Version control |
| MongoDB | 7.x | Primary database |
| Redis | 7.x | Caching and session storage |

### Infrastructure Requirements

- **Compute**: 4+ vCPUs, 8GB+ RAM
- **Storage**: 50GB+ SSD for MongoDB
- **Network**: HTTPS/TLS enabled
- **Domains**: Configured DNS records

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CorpPerks Architecture                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                         Load Balancer (Nginx)                         │  │
│  │                    api.corpperks.com (443/HTTPS)                      │  │
│  └─────────────────────────────┬───────────────────────────────────────────┘  │
│                                │                                              │
│  ┌────────────────────────────▼───────────────────────────────────────────┐  │
│  │                      API Gateway Layer                                 │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐   │  │
│  │  │ CorpPerks API    │  │ CorpIntel       │  │ ProjectOS           │   │  │
│  │  │ (4006)          │  │ (4135)          │  │ (4715)              │   │  │
│  │  └────────┬────────┘  └────────┬────────┘  └──────────┬──────────┘   │  │
│  └────────────┼───────────────────┼───────────────────────┼───────────────┘  │
│               │                   │                       │                  │
│  ┌────────────▼───────────────────▼───────────────────────▼───────────────┐  │
│  │                           Data Layer                                   │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐   │  │
│  │  │ MongoDB (27017) │  │ Redis (6379)    │  │ CorpID Services     │   │  │
│  │  │                 │  │                 │  │ (4700-4711)         │   │  │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────────┘   │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                        Frontend (Vercel)                              │  │
│  │              peopleos.corpperks.com (Next.js)                          │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/imrejaul007/CorpPerks.git
cd CorpPerks
```

### 2. Configure Environment Variables

Copy the example files and configure for production:

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with production values

# CorpPerks Intelligence
cp corpperks-intelligence/.env.example corpperks-intelligence/.env

# ProjectOS
cp projectos-service/.env.example projectos-service/.env

# CorpID Services
for service in corpid/services/*/; do
    cp "$service/.env.example" "$service/.env" 2>/dev/null || true
done
```

### 3. Required Environment Variables

#### Backend (.env)
```bash
NODE_ENV=production
PORT=4006
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/corpperks
REDIS_URL=redis://redis:6379
JWT_SECRET=generate-a-secure-32-char-key
JWT_EXPIRES_IN=7d
INTERNAL_SERVICE_TOKEN=generate-secure-internal-token
CORS_ORIGIN=https://peopleos.corpperks.com
RABTUL_AUTH_URL=https://rez-auth-service.onrender.com
```

---

## Database Migration

### Automatic Migration on Startup

The backend service runs migrations automatically on startup:

```bash
cd backend
npm run start
# Migrations run automatically
```

### Manual Migration

```bash
# Run all pending migrations
npm run migrate

# Check migration status
npm run migrate status

# Rollback to specific version
npm run migrate rollback 2
```

### Migration Version History

| Version | Name | Description |
|---------|------|-------------|
| 1 | initial_schema | Create core collections |
| 2 | add_tenant_support | Multi-tenancy indexes |
| 3 | add_geo_attendance | Geo-location support |
| 4 | add_audit_logs | Audit trail collection |
| 5 | add_performance_metrics | KPI tracking |
| 6 | add_payroll_support | Payroll collections |

---

## Docker Deployment

### Quick Start

```bash
# Make deploy script executable
chmod +x deploy-all.sh

# Deploy all services
./deploy-all.sh setup   # Create Dockerfiles
./deploy-all.sh up      # Build and start
```

### Individual Service Deployment

```bash
# Build specific service
./deploy-all.sh build:corperks-api

# Start specific service
docker compose -f docker-compose.prod.yml up -d corperks-api

# View logs
./deploy-all.sh logs corperks-api

# Check status
./deploy-all.sh status
```

### Service Ports

| Service | Port | URL |
|---------|------|-----|
| CorpPerks API | 4006 | http://localhost:4006 |
| CorpIntel | 4135 | http://localhost:4135 |
| ProjectOS | 4715 | http://localhost:4715 |
| REZ Merchant Bridge | 4096 | http://localhost:4096 |
| REZ Corporate | 4030 | http://localhost:4030 |
| CorpID Gateway | 4700 | http://localhost:4700 |
| PeopleOS Frontend | 3000 | http://localhost:3000 |

---

## Cloud Deployment

### Render.com (Backend Services)

1. **Connect Repository to Render**
   ```bash
   # Install Render CLI
   npm install -g @render/cli

   # Login
   render login
   ```

2. **Deploy via Blueprint**
   ```bash
   # Deploy each service
   render blueprints submit backend/render.yaml
   render blueprints submit corpperks-intelligence/render.yaml
   render blueprints submit projectos-service/render.yaml
   ```

3. **Environment Variables**
   Set these in Render Dashboard:
   - `MONGODB_URI` (sync: false)
   - `REDIS_URL` (sync: false)
   - `JWT_SECRET` (generateValue: true)
   - `INTERNAL_SERVICE_TOKEN` (generateValue: true)

### Vercel (Frontend)

1. **Connect Repository**
   - Go to vercel.com
   - Import CorpPerks repository
   - Select `peopleos` as root directory

2. **Environment Variables**
   ```
   NEXT_PUBLIC_API_URL=https://corpperks-api.onrender.com/api/v1
   NEXT_PUBLIC_CORPINTEL_URL=https://corpperks-intelligence.onrender.com/api
   NEXT_PUBLIC_PROJECTOS_URL=https://projectos-service.onrender.com/api
   ```

3. **Deploy**
   ```bash
   cd peopleos
   vercel --prod
   ```

---

## Health Checks

### Available Endpoints

| Endpoint | Purpose | Response |
|----------|---------|----------|
| `/health` | Detailed health | Status, uptime, memory, checks |
| `/ready` | Readiness probe | Ready status, dependency checks |
| `/live` | Liveness probe | Simple OK response |
| `/version` | Version info | Service name, version |
| `/metrics` | Prometheus metrics | Text format metrics |

### Verify Health

```bash
# Check API health
curl http://localhost:4006/health

# Check readiness
curl http://localhost:4006/ready

# Check metrics
curl http://localhost:4006/metrics
```

### Expected Response (Health)

```json
{
  "status": "ok",
  "service": "corpperks-backend",
  "version": "1.0.0",
  "uptime": 3600,
  "timestamp": "2026-05-30T00:00:00.000Z",
  "checks": {
    "database": true,
    "memory": true
  },
  "memory": {
    "heapUsed": 45,
    "heapTotal": 128,
    "rss": 89,
    "external": 12
  }
}
```

---

## Monitoring

### Prometheus Metrics

The `/metrics` endpoint exposes Prometheus-compatible metrics:

```
# HELP corperks_uptime_seconds Service uptime in seconds
# TYPE corperks_uptime_seconds gauge
corperks_uptime_seconds{service="corpperks-backend"} 3600

# HELP corperks_database_connected Database connection status
# TYPE corperks_database_connected gauge
corperks_database_connected{service="corpperks-backend"} 1
```

### Grafana Dashboard

Import the CorpPerks dashboard JSON from `config/grafana/dashboard.json`.

### Alerting

Configure alerts for:
- Health check failures
- Memory usage > 90%
- Database disconnection
- High error rate (>5%)

---

## Rollback Procedure

### Docker Rollback

```bash
# Stop current deployment
./deploy-all.sh down

# Restore previous version (Docker preserves images)
docker image tag corpperks-backend:previous corpperks-backend:latest
docker image tag corpperks-intelligence:previous corpperks-intelligence:latest

# Restart
./deploy-all.sh up
```

### Database Rollback

```bash
# Rollback to specific migration version
cd backend
npm run migrate rollback 2
```

### Vercel Rollback

```bash
# List deployments
vercel list

# Rollback to previous deployment
vercel rollback [deployment-url]
```

### Render Rollback

1. Go to Render Dashboard
2. Select service
3. Go to Deployments
4. Click "Redeploy" on previous working version

---

## Troubleshooting

### Common Issues

#### MongoDB Connection Failed

```bash
# Check MongoDB is running
docker compose -f docker-compose.prod.yml ps mongodb

# Check connection string
echo $MONGODB_URI

# Test connection
mongosh "mongodb+srv://user:pass@cluster.mongodb.net"
```

#### Redis Connection Failed

```bash
# Check Redis is running
docker compose -f docker-compose.prod.yml ps redis

# Test connection
docker exec corperks-redis redis-cli ping
```

#### JWT Token Invalid

```bash
# Generate new JWT secret
openssl rand -hex 32

# Update .env file
```

#### CORS Errors

```bash
# Verify CORS origin is set correctly
echo $CORS_ORIGIN

# Should match frontend URL exactly
# e.g., https://peopleos.corpperks.com
```

### Service Logs

```bash
# View all logs
./deploy-all.sh logs

# View specific service
./deploy-all.sh logs corperks-api

# Follow logs in real-time
docker compose -f docker-compose.prod.yml logs -f corperks-api
```

### Health Check Failures

```bash
# Check if service is running
curl http://localhost:4006/health

# Check port binding
lsof -i :4006

# Check environment variables
docker compose -f docker-compose.prod.yml exec corperks-api env
```

---

## Security Checklist

- [ ] All secrets are in environment variables, not code
- [ ] JWT_SECRET is a strong, random value
- [ ] CORS_ORIGIN is set to production domain
- [ ] MongoDB uses authentication
- [ ] Redis has a password set
- [ ] Rate limiting is configured
- [ ] HTTPS is enforced (nginx redirect)
- [ ] Security headers are set
- [ ] No sensitive data in logs
- [ ] Webhook secrets are rotated

---

## Support

For issues or questions:
- GitHub Issues: https://github.com/imrejaul007/CorpPerks/issues
- Email: support@corpperks.com

---

**Last Updated:** 2026-05-30
**Version:** 1.0.0
