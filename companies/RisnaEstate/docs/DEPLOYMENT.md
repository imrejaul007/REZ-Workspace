# RisnaEstate Deployment Guide

## Prerequisites

- Docker & Docker Compose
- Node.js 20+
- MongoDB 7+
- Redis 7+

---

## Quick Start (Local)

```bash
# Clone and install
git clone https://github.com/Imrejaul007/RisnaEstate.git
cd RisnaEstate

# Start all services
docker-compose up -d

# Seed demo data
npm run seed

# Check health
npm run health
```

Access:
- API: http://localhost:3000
- Frontend: http://localhost:3001
- Grafana: http://localhost:3002
- Prometheus: http://localhost:9090

---

## Production Deployment

### 1. Server Setup

```bash
# SSH to server
ssh user@your-server

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose
```

### 2. Configure Environment

```bash
# Create .env file
cat > .env << EOF
NODE_ENV=production
JWT_SECRET=your-secure-jwt-secret-32-chars
INTERNAL_SERVICE_TOKEN=your-service-token
MONGODB_URI=mongodb://localhost:27017
REDIS_URL=redis://localhost:6379
CORS_ORIGIN=https://risnaestate.com
EOF
```

### 3. Deploy

```bash
# Pull latest
git pull origin main

# Start services
docker-compose -f docker-compose.yml up -d

# Check logs
docker-compose logs -f
```

---

## GitHub Actions Setup

### Required Secrets

Add these in GitHub → Settings → Secrets:

| Secret | Description |
|--------|-------------|
| `PROD_HOST` | Server IP/hostname |
| `PROD_USER` | SSH username |
| `PROD_SSH_KEY` | Private SSH key |
| `VERCEL_TOKEN` | Vercel API token |

### Optional Secrets

| Secret | Description |
|--------|-------------|
| `SENTRY_DSN` | Sentry error tracking |
| `RAZORPAY_KEY` | Payment gateway |
| `TWILIO_SID` | WhatsApp/SMS |

---

## Monitoring Setup

### Prometheus

```bash
# Start monitoring
docker-compose -f monitoring/docker-compose.monitoring.yml up -d
```

Access:
- Prometheus: http://your-server:9090
- Grafana: http://your-server:3002 (admin/admin)

### Alerts

Configure in Prometheus:
```yaml
groups:
  - name: risnaestate
    rules:
      - alert: ServiceDown
        expr: up{job="risna-services"} == 0
        for: 1m
        labels:
          severity: critical
```

---

## SSL/HTTPS Setup

### Using Nginx + Let's Encrypt

```bash
# Install Nginx
sudo apt install nginx

# Get SSL certificate
sudo certbot --nginx -d risnaestate.com -d api.risnaestate.com
```

### Nginx Config

```nginx
server {
    listen 80;
    server_name risnaestate.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name risnaestate.com;

    ssl_certificate /etc/letsencrypt/live/risnaestate.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/risnaestate.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3001;
    }
}

server {
    listen 443 ssl;
    server_name api.risnaestate.com;

    ssl_certificate /etc/letsencrypt/live/risnaestate.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/risnaestate.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
    }
}
```

---

## Troubleshooting

### Service won't start

```bash
# Check logs
docker-compose logs service-name

# Restart
docker-compose restart service-name
```

### Database connection failed

```bash
# Check MongoDB
docker-compose exec mongo mongosh

# Check Redis
docker-compose exec redis redis-cli ping
```

### Out of memory

```bash
# Increase Docker memory
# Docker Desktop → Settings → Resources → 4GB minimum

# Or add swap
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

---

## Backup

```bash
# Backup MongoDB
docker-compose exec mongo mongodump --out=/data/backup

# Backup Redis
docker-compose exec redis redis-cli BGSAVE
docker cp redis:/data/dump.rdb ./backup/
```

---

## Support

- GitHub Issues: https://github.com/Imrejaul007/RisnaEstate/issues
- REZ Platform: https://admin.rez.money
