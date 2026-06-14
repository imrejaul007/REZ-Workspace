# REZ Workspace - Deployment Guide (Detailed)

**Version:** 1.0.0 | **Date:** June 12, 2026 | **Company:** REZ Workspace

---

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Docker Deployment](#docker-deployment)
3. [Production Deployment](#production-deployment)
4. [Environment Configuration](#environment-configuration)
5. [Database Migration](#database-migration)
6. [Monitoring Setup](#monitoring-setup)
7. [Backup Procedures](#backup-procedures)
8. [Rollback Procedures](#rollback-procedures)
9. [Security Checklist](#security-checklist)

---

## Pre-Deployment Checklist

### Infrastructure

- [ ] Server with 2GB+ RAM
- [ ] 20GB+ storage
- [ ] Ubuntu 22.04+ or similar
- [ ] Docker 24+ installed
- [ ] Docker Compose 2+ installed
- [ ] Domain configured (optional)
- [ ] SSL certificates (for HTTPS)

### Application

- [ ] All tests passing (`npm test`)
- [ ] TypeScript compiles (`npm run build`)
- [ ] Linting passes (`npm run lint`)
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] Backup taken

### Monitoring

- [ ] Prometheus configured
- [ ] Grafana dashboards ready
- [ ] Alerting configured
- [ ] Log aggregation set up

---

## Docker Deployment

### 1. Clone & Configure

```bash
# Clone repository
git clone https://github.com/imrejaul007/REZ-Workspace.git
cd REZ-Workspace

# Copy environment file
cp .env.example .env

# Edit configuration
nano .env
```

### 2. Configure Environment

```env
# Essential
NODE_ENV=production
PORT=4300

# Security (CHANGE THESE!)
JWT_SECRET=your-32-character-minimum-secret-key
INTERNAL_SERVICE_TOKEN=your-internal-service-token

# Database
MONGODB_URI=mongodb://mongodb:27017/rez-workspace
MONGODB_USER=admin
MONGODB_PASSWORD=change-this-password

# Cache
REDIS_URL=redis://redis:6379
REDIS_PASSWORD=change-this-password

# CORS
CORS_ORIGIN=https://your-domain.com

# External Services
RABTUL_AUTH_URL=https://rez-auth-service.onrender.com
UNIFIED_HUB_URL=http://unified-hub:4600
```

### 3. Build & Start

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### 4. Verify

```bash
# Health check
curl http://localhost:4300/health

# Metrics
curl http://localhost:4300/metrics

# API test
curl http://localhost:4300/api/workspaces
```

---

## Production Deployment

### Server Requirements

| Component | Minimum | Recommended |
|-----------|----------|--------------|
| CPU | 2 cores | 4+ cores |
| RAM | 2 GB | 4+ GB |
| Storage | 20 GB | 50+ GB |
| Network | 100 Mbps | 1 Gbps |

### Step 1: Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh

# Install Docker Compose
sudo apt install docker-compose-plugin

# Add current user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

### Step 2: Firewall Configuration

```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow application port (if not behind nginx)
sudo ufw allow 4300/tcp

# Enable firewall
sudo ufw enable
```

### Step 3: Deploy Application

```bash
# Create deployment directory
sudo mkdir -p /opt/rez-workspace
cd /opt/rez-workspace

# Copy application files
sudo cp -r /path/to/REZ-Workspace .

# Set permissions
sudo chown -R $USER:$USER /opt/rez-workspace

# Start services
cd /opt/rez-workspace
docker-compose -f docker-compose.yml up -d
```

### Step 4: Configure Nginx (SSL)

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo systemctl enable certbot.timer
```

### Step 5: Monitoring

```bash
# Check container health
docker-compose ps

# View resource usage
docker stats

# Check logs
docker-compose logs -f --tail=100
```

---

## Environment Configuration

### Production Environment Variables

```bash
# Create production env file
cat > .env.production << 'EOF'
NODE_ENV=production
PORT=4300

# Database
MONGODB_URI=mongodb://admin:PASSWORD@mongodb:27017/rez-workspace?authSource=admin

# Cache
REDIS_URL=redis://default:PASSWORD@redis:6379
REDIS_PASSWORD=PASSWORD

# Security
JWT_SECRET=$(openssl rand -base64 32)
INTERNAL_SERVICE_TOKEN=$(openssl rand -hex 32)
JWT_EXPIRY=7d

# CORS
CORS_ORIGIN=https://your-domain.com

# Rate Limiting
ENABLE_RATE_LIMIT=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# Monitoring
ENABLE_METRICS=true
HEALTH_CHECK_INTERVAL=30

# External Services
RABTUL_AUTH_URL=https://rez-auth-service.onrender.com
RABTUL_WALLET_URL=https://rez-wallet-service.onrender.com
UNIFIED_HUB_URL=http://unified-hub:4600

# HOJAI Services
HOJAI_GATEWAY=http://hojai-gateway:4500
HOJAI_MEMORY=http://hojai-memory:4520
HOJAI_INTELLIGENCE=http://hojai-intelligence:4530
HOJAI_AGENTS=http://hojai-agents:4550
HOJAI_WORKFLOWS=http://hojai-workflows:4560

# CorpPerks
CORPPERKS_GATEWAY=http://corpperks-gateway:4700
EOF

# Load environment
export $(cat .env.production | grep -v '^#' | xargs)
```

---

## Database Migration

### Before Migration

```bash
# Create backup
docker-compose exec mongodb mongodump --archive=/backup/pre-migration-$(date +%Y%m%d).archive --db=rez-workspace

# Test backup
docker-compose exec -T mongodb mongorestore --archive=/backup/pre-migration-$(date +%Y%m%d).archive --dry-run --db=rez-workspace-test
```

### Run Migrations

```bash
# Stop application
docker-compose stop rez-workspace

# Run migration script
docker-compose run --rm rez-workspace npm run migrate

# Or apply manually
docker-compose exec -T mongodb mongosh < /path/to/migration.js

# Start application
docker-compose start rez-workspace
```

### After Migration

```bash
# Verify data integrity
docker-compose exec mongodb mongosh --eval "db.workspaces.countDocuments()"

# Check application logs
docker-compose logs --tail=50 rez-workspace

# Run health check
curl http://localhost:4300/health/ready
```

---

## Monitoring Setup

### Prometheus Configuration

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'rez-workspace'
    static_configs:
      - targets: ['rez-workspace:4300']
    metrics_path: '/metrics'
```

### Grafana Dashboard

Import the following JSON for pre-built dashboards:

```json
{
  "dashboard": {
    "title": "REZ Workspace",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [{"expr": "rate(rez_workspace_requests_total[5m])"}]
      },
      {
        "title": "Response Time",
        "targets": [{"expr": "histogram_quantile(0.95, rate(rez_workspace_request_duration_ms_bucket[5m]))"}]
      },
      {
        "title": "Active Connections",
        "targets": [{"expr": "rez_workspace_active_connections"}]
      },
      {
        "title": "WebSocket Connections",
        "targets": [{"expr": "rez_workspace_ws_connections"}]
      }
    ]
  }
}
```

### Alerting Rules

```yaml
groups:
  - name: rez-workspace-alerts
    rules:
      - alert: HighErrorRate
        expr: rate(rez_workspace_requests_total{status="error"}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate in REZ Workspace"
      
      - alert: SlowResponse
        expr: histogram_quantile(0.95, rate(rez_workspace_request_duration_ms_bucket[5m])) > 1000
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Slow response times"
```

---

## Backup Procedures

### Automated Backup (Cron)

```bash
# Add to crontab
crontab -e

# Daily backup at 2 AM
0 2 * * * /opt/rez-workspace/scripts/backup.sh >> /var/log/backup.log 2>&1
```

### Backup Script

```bash
#!/bin/bash
# /opt/rez-workspace/scripts/backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/opt/backups/rez-workspace
CONTAINER_NAME=rez-mongodb

# Create backup directory
mkdir -p $BACKUP_DIR

# MongoDB backup
docker exec $CONTAINER_NAME mongodump \
  --archive=$BACKUP_DIR/mongodb-$DATE.archive \
  --db=rez-workspace

# Redis backup
docker exec rez-redis redis-cli BGSAVE
docker cp rez-redis:/data/dump.rdb $BACKUP_DIR/redis-$DATE.rdb

# Compress
gzip $BACKUP_DIR/mongodb-$DATE.archive
gzip $BACKUP_DIR/redis-$DATE.rdb

# Cleanup old backups (keep 7 days)
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

# Upload to S3 (optional)
# aws s3 cp $BACKUP_DIR/mongodb-$DATE.archive.gz s3://your-bucket/backups/

echo "Backup completed: $DATE"
```

---

## Rollback Procedures

### Emergency Rollback

```bash
# 1. Stop current deployment
cd /opt/rez-workspace
docker-compose down

# 2. Restore database
docker-compose up -d mongodb
docker exec rez-mongodb mongorestore \
  --archive=/backup/pre-migration-YYYYMMDD.archive \
  --drop \
  --db=rez-workspace

# 3. Restore application version
git checkout v1.0.0
docker-compose build
docker-compose up -d

# 4. Verify
curl http://localhost:4300/health
```

### Database Rollback

```bash
# Stop application
docker-compose stop rez-workspace

# Restore MongoDB
docker exec rez-mongodb mongorestore \
  --archive=/backup/mongodb-YYYYMMDD.archive \
  --drop \
  --db=rez-workspace

# Clear Redis cache
docker exec rez-redis redis-cli FLUSHALL

# Start application
docker-compose start rez-workspace
```

---

## Security Checklist

### Pre-Deployment

- [ ] JWT_SECRET is minimum 32 characters
- [ ] Database credentials are unique
- [ ] CORS_ORIGIN is set to specific domains
- [ ] Rate limiting is enabled
- [ ] HTTPS configured (SSL certificates)
- [ ] Firewall rules configured
- [ ] Failed login lockout enabled
- [ ] Session timeout configured

### Post-Deployment

- [ ] Security headers present
- [ ] No sensitive data in logs
- [ ] PII redaction enabled
- [ ] Audit logging active
- [ ] Backup encryption enabled
- [ ] Access logs monitored
- [ ] SSL certificate valid
- [ ] DNS records configured

### Regular Maintenance

- [ ] Security updates applied
- [ ] Dependencies updated
- [ ] Passwords rotated
- [ ] Certificates renewed
- [ ] Backups tested
- [ ] Logs reviewed
- [ ] Performance optimized

---

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs rez-workspace

# Check configuration
docker-compose config

# Verify ports
sudo netstat -tlnp | grep 4300
```

### Database Connection Failed

```bash
# Check MongoDB status
docker-compose ps mongodb

# Test connection
docker-compose exec mongodb mongosh --eval "db.adminCommand('ping')"

# Check logs
docker-compose logs mongodb
```

### High Memory Usage

```bash
# Check container stats
docker stats

# Increase memory limit
# Edit docker-compose.yml
# services:
#   rez-workspace:
#     mem_limit: 2g

# Restart
docker-compose up -d
```

---

## Support & Documentation

- **API Documentation:** [SPEC.md](SPEC.md)
- **Features List:** [FEATURES-LIST.md](FEATURES-LIST.md)
- **Company Audit:** [RTNM-COMPANIES-AUDIT.md](RTNM-COMPANIES-AUDIT.md)
- **Product Features:** [RTNM-PRODUCTS-FEATURES-AUDIT.md](RTNM-PRODUCTS-FEATURES-AUDIT.md)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | June 12, 2026 | Initial production deployment |

---

**Last Updated:** June 12, 2026