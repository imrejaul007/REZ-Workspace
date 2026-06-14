# AdBazaar Production Deployment Guide

## Quick Start

```bash
# 1. Copy environment files
cp .env.example .env

# 2. Build all services
npm run build

# 3. Start with PM2
pm2 start pm2.config.js --env production

# 4. Or use Docker
docker-compose -f docker-compose.prod.yml up -d
```

## Port Registry

| Service | Port | Status |
|---------|------|--------|
| REZ-ads-service | 4007 | ✅ Production Ready |
| adBazaar-backend | 4085 | ✅ Fixed |
| REZ-marketing | 4000 | ⚠️ Needs fixes |
| REZ-dooh-service | 4018 | ⚠️ Needs review |
| intent-signal-aggregator | 4800 | ✅ Built |
| intent-prediction-engine | 4801 | ✅ Built |
| intent-marketplace | 4802 | ✅ Built |
| intent-attribution | 4803 | ✅ Built |
| adbazaar-hojai-gateway | 4870 | ✅ Built |

## Health Check Endpoints

All services have:
- `GET /healthz` - Liveness probe (returns 200 OK)
- `GET /health` - Readiness probe (checks DB, Redis)

## Security Checklist

- [x] JWT_SECRET configured
- [x] MongoDB URI configured
- [x] Rate limiting enabled
- [x] Helmet.js enabled
- [x] CORS configured
- [x] PII redaction in logs

## Monitoring

Add to Prometheus:
```
- job_name: 'adbazaar'
  static_configs:
    - targets: ['localhost:4007', 'localhost:4085', 'localhost:4800']
```

## Troubleshooting

```bash
# Check service logs
pm2 logs rez-ads-service

# Check health
curl localhost:4007/health

# Restart service
pm2 restart rez-ads-service
```
