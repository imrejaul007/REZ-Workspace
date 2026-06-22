# REZ Workspace - Deployment Guide

**Version:** 1.0.0 | **Date:** June 12, 2026 | **Company:** REZ Workspace

---

## Overview

REZ Workspace is an AI-native work and productivity platform. This guide covers deployment options from local development to production.

## Prerequisites

| Component | Version | Purpose |
|-----------|---------|---------|
| Node.js | 20+ | Runtime |
| Docker | 24+ | Containerization |
| Docker Compose | 2+ | Orchestration |
| MongoDB | 7.0+ | Database (optional with Docker) |
| Redis | 7.0+ | Cache (optional with Docker) |

---

## Quick Start

### Option 1: Docker (Recommended)

```bash
# Clone and navigate
cd /Users/rejaulkarim/Documents/RTMN/companies/REZ-Workspace

# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f rez-workspace
```

### Option 2: Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Server runs on http://localhost:4300
```

---

## Docker Deployment

### Services

| Service | Port | Description |
|---------|------|-------------|
| rez-workspace | 4300 | Main application |
| mongodb | 27017 | Database |
| redis | 6379 | Cache |
| nginx | 80, 443 | Reverse proxy |

### Commands

```bash
# Build image
docker build -t rez-workspace:latest .

# Run container
docker run -d \
  --name rez-workspace \
  -p 4300:4300 \
  -e NODE_ENV=production \
  -e MONGODB_URI=mongodb://localhost:27017/rez-workspace \
  -e REDIS_URL=redis://localhost:6379 \
  rez-workspace:latest

# Docker Compose
docker-compose up -d
docker-compose logs -f
docker-compose down

# Scale (if using swarm)
docker-compose up -d --scale rez-workspace=3
```

---

## Environment Variables

### Required

```env
NODE_ENV=production
PORT=4300
JWT_SECRET=your-32-char-minimum-secret
MONGODB_URI=mongodb://localhost:27017/rez-workspace
REDIS_URL=redis://localhost:6379
INTERNAL_SERVICE_TOKEN=your-service-token
```

### Optional

```env
CORS_ORIGIN=http://localhost:3000
LOG_LEVEL=info
RABTUL_AUTH_URL=https://rez-auth-service.onrender.com
UNIFIED_HUB_URL=http://localhost:4600
```

### Generate Secure Values

```bash
# Generate JWT secret
openssl rand -base64 32

# Generate service token
openssl rand -hex 32
```

---

## Database Setup

### MongoDB

With Docker Compose, MongoDB initializes automatically with:
- Database: `rez-workspace`
- User: `admin`
- Collections: users, workspaces, channels, messages, meetings, documents, tasks, projects, calendar_events, workflows
- Indexes: Optimized for common queries

### Manual Setup

```javascript
// Connect to MongoDB
db = db.getSiblingDB('rez-workspace');

// Create user
db.createUser({
    user: 'rezuser',
    pwd: 'rezpassword',
    roles: [{ role: 'readWrite', db: 'rez-workspace' }]
});
```

---

## Health Checks

### Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Basic health check |
| `GET /health/ready` | Readiness (includes DB check) |
| `GET /health/metrics` | JSON metrics |
| `GET /metrics` | Prometheus metrics |

### Docker Health Check

```yaml
healthcheck:
  test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:4300/health"]
  interval: 30s
  timeout: 10s
  retries: 3
```

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Connection refused | Check PORT env variable |
| MongoDB timeout | Increase `serverSelectionTimeoutMS` |
| Redis connection | Verify REDIS_URL |
| CORS error | Set CORS_ORIGIN env variable |
| JWT errors | Ensure JWT_SECRET is 32+ chars |

### Logs

```bash
# Docker logs
docker-compose logs -f rez-workspace

# Application logs
tail -f logs/app.log

# MongoDB logs
docker-compose logs mongodb

# Redis logs
docker-compose logs redis
```

---

## Security Checklist

- [ ] Change JWT_SECRET from default
- [ ] Set CORS_ORIGIN to specific domains
- [ ] Enable rate limiting (default: enabled)
- [ ] Use HTTPS in production
- [ ] Configure firewall rules
- [ ] Enable audit logging
- [ ] Regular backups of MongoDB

---

## Backup & Restore

### Backup

```bash
# MongoDB backup
docker exec mongodb mongodump --archive=/backup/rez-workspace-$(date +%Y%m%d).archive --db=rez-workspace

# Copy backup
docker cp mongodb:/backup/./backup/
```

### Restore

```bash
# Stop service
docker-compose stop rez-workspace

# Restore
docker exec mongodb mongorestore --archive=/backup/rez-workspace-20250612.archive --db=rez-workspace --drop

# Start service
docker-compose start rez-workspace
```

---

## Performance Tuning

### MongoDB

```javascript
// Create indexes for common queries
db.workspaces.createIndex({ owner_id: 1 });
db.channels.createIndex({ workspace_id: 1 });
db.messages.createIndex({ channel_id: 1, timestamp: -1 });
```

### Redis

```bash
# Configure maxmemory
redis-cli CONFIG SET maxmemory 256mb
redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

---

## Monitoring

### Prometheus Metrics

```
rez_workspace_requests_total{path, status}
rez_workspace_request_duration_ms{path, quantile}
rez_workspace_active_connections
rez_workspace_ws_connections
rez_workspace_cache_hits_total
```

### Grafana Dashboard

Import `grafana-dashboard.json` from the docker folder for pre-built visualizations.

---

## Support

- **Documentation:** [README.md](README.md)
- **API Docs:** [SPEC.md](SPEC.md)
- **Features:** [FEATURES-LIST.md](FEATURES-LIST.md)
- **Issues:** GitHub Issues

---

## Last Updated

**June 12, 2026**