# CorpPerks Deployment Guide

**Version:** 1.0.0
**Last Updated:** June 4, 2026
**Environment:** Production

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Service Architecture](#service-architecture)
4. [Environment Variables](#environment-variables)
5. [Deployment Steps](#deployment-steps)
6. [Docker Deployment](#docker-deployment)
7. [Cloud Platform Deployment](#cloud-platform-deployment)
8. [Health Checks & Monitoring](#health-checks--monitoring)
9. [Rollback Procedures](#rollback-procedures)
10. [Troubleshooting](#troubleshooting)

---

## Overview

CorpPerks is a B2B employee benefits and perks platform consisting of multiple microservices that work together to provide:
- Employee benefits management
- Corporate discounts and rewards
- Loyalty points system
- Multi-tenant architecture

### Services Overview

| Service | Port | Description | Dependencies |
|---------|------|-------------|--------------|
| corpperks-api | 3001 | Main REST API | MongoDB, Redis, Auth |
| corpperks-auth | 3002 | Authentication service | MongoDB, Redis |
| corpperks-benefits | 3003 | Benefits management | MongoDB |
| corpperks-rewards | 3004 | Rewards and points | MongoDB, Redis |
| corpperks-catalog | 3005 | Partner catalog | MongoDB |
| corpperks-gateway | 3000 | API Gateway | All services |

---

## Prerequisites

### System Requirements

| Component | Minimum | Recommended |
|-----------|---------|--------------|
| CPU | 2 cores | 4+ cores |
| RAM | 4 GB | 8+ GB |
| Storage | 50 GB SSD | 100+ GB SSD |
| OS | Ubuntu 20.04+ | Ubuntu 22.04 LTS |

### Software Dependencies

```bash
# Required software versions
Node.js: 18.x LTS or 20.x LTS
MongoDB: 6.0+
Redis: 7.0+
Docker: 24.0+ (for containerized deployment)
Docker Compose: 2.20+ (for local development)
Git: 2.40+
```

### Infrastructure Requirements

1. **MongoDB Cluster**
   - Primary + 2 Secondary replicas for production
   - Minimum 3-node replica set
   - WiredTiger storage engine
   - Journaling enabled

2. **Redis Cluster**
   - Redis 7.0+ with Cluster mode for production
   - Minimum 3 master nodes
   - Persistence enabled (RDB + AOF)

3. **Load Balancer**
   - SSL termination
   - Health check support
   - Sticky sessions (if needed)

---

## Service Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTS                               │
│            (Web App, Mobile App, Admin Portal)               │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    CORPPERKS-GATEWAY                        │
│                         Port: 3000                          │
│              (Rate Limiting, Auth, Routing)                 │
└────────────────┬──────────────┬──────────────┬──────────────┘
                 │              │              │
        ┌────────▼─────┐ ┌──────▼──────┐ ┌────▼────────────┐
        │corpperks-api │ │corpperks-auth│ │corpperks-benefits│
        │   Port: 3001 │ │  Port: 3002  │ │   Port: 3003    │
        └───────┬──────┘ └──────┬───────┘ └──────┬──────────┘
                │               │                 │
        ┌───────▼───────────────▼─────────────────▼──────────┐
        │                    RABTUL-SaaS                     │
        │  ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
        │  │invoice-gen│ │ pos-lite │ │ tally-bridge     │   │
        │  └──────────┘ └──────────┘ └──────────────────┘   │
        └────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
   ┌─────────┐          ┌─────────┐          ┌─────────┐
   │ MongoDB │          │  Redis  │          │RABTUL-  │
   │ Cluster │          │ Cluster │          │Auth     │
   └─────────┘          └─────────┘          └─────────┘
```

---

## Environment Variables

### Core Environment Variables

Create a `.env.production` file for each service:

```env
# ============================================
# CORPPERKS-API Environment Variables
# ============================================

# Application
NODE_ENV=production
PORT=3001
SERVICE_NAME=corpperks-api
LOG_LEVEL=info

# MongoDB
MONGODB_URI=mongodb://mongo1:27017,mongo2:27017,mongo3:27017/corpperks?replicaSet=rs0
MONGODB_USER=corpperks_user
MONGODB_PASSWORD=your_secure_password
MONGODB_AUTH_SOURCE=admin

# Redis
REDIS_HOST=redis-cluster.internal
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_DB=0

# RABTUL Integration
RABTUL_API_URL=https://api.rabtul.tech
RABTUL_API_KEY=your_rabtul_api_key
RABTUL_AUTH_SERVICE_URL=https://auth.rabtul.tech
RABTUL_WALLET_SERVICE_URL=https://wallet.rabtul.tech

# JWT
JWT_SECRET=your_jwt_secret_min_32_chars
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Email (SMTP)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your_sendgrid_api_key
SMTP_FROM=noreply@corpperks.com

# SMS (Twilio)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1234567890

# File Storage (S3-compatible)
S3_ENDPOINT=https://s3.amazonaws.com
S3_REGION=ap-south-1
S3_BUCKET=corpperks-uploads
S3_ACCESS_KEY=your_s3_access_key
S3_SECRET_KEY=your_s3_secret_key

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGINS=https://corpperks.com,https://admin.corpperks.com

# Encryption
ENCRYPTION_KEY=your_32_char_encryption_key
```

### CorpPerks-Benefits Environment Variables

```env
# ============================================
# CORPPERKS-BENEFITS Environment Variables
# ============================================

NODE_ENV=production
PORT=3003
SERVICE_NAME=corpperks-benefits
LOG_LEVEL=info

# MongoDB (can use same connection or separate)
MONGODB_URI=mongodb://mongo1:27017,mongo2:27017,mongo3:27017/corpperks_benefits?replicaSet=rs0
MONGODB_USER=corpperks_user
MONGODB_PASSWORD=your_secure_password

# RabbitMQ (for async job processing)
RABBITMQ_URI=amqp://rabbitmq:5672
RABBITMQ_USER=corpperks
RABBITMQ_PASSWORD=your_rabbitmq_password

# Benefit Categories
BENEFIT_TIERS=basic,premium,enterprise
MAX_BENEFITS_PER_COMPANY=500

# Integration URLs
INVOICE_GEN_URL=https://invoice-gen.rabtul.tech
TALLY_BRIDGE_URL=https://tally-bridge.rabtul.tech
```

### CorpPerks-Rewards Environment Variables

```env
# ============================================
# CORPPERKS-REWARDS Environment Variables
# ============================================

NODE_ENV=production
PORT=3004
SERVICE_NAME=corpperks-rewards
LOG_LEVEL=info

# MongoDB
MONGODB_URI=mongodb://mongo1:27017,mongo2:27017,mongo3:27017/corpperks_rewards?replicaSet=rs0
MONGODB_USER=corpperks_user
MONGODB_PASSWORD=your_secure_password

# Redis (for real-time points tracking)
REDIS_HOST=redis-cluster.internal
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# Points Configuration
POINTS_CURRENCY=PKR
POINTS_TO_CURRENCY_RATIO=100
MIN_REDEMPTION_POINTS=500
MAX_REDEMPTION_AMOUNT=100000

# RABTUL Wallet Integration
RABTUL_WALLET_URL=https://wallet.rabtul.tech
RABTUL_WALLET_API_KEY=your_wallet_api_key
```

---

## Deployment Steps

### Step 1: Clone and Prepare Repository

```bash
# Clone the repository
git clone https://github.com/hojai-ai/corpperks.git
cd corpperks

# Checkout production branch
git checkout production

# Install dependencies for all services
npm run install:all

# Build all services
npm run build:all
```

### Step 2: Database Setup

```bash
# Connect to MongoDB primary
mongosh --host mongo1.internal --username admin --password your_password --authenticationDatabase admin

# Create databases
use corpperks;
use corpperks_benefits;
use corpperks_rewards;
use corpperks_catalog;

# Create application users
db.createUser({
  user: "corpperks_user",
  pwd: "your_secure_password",
  roles: [
    { role: "readWrite", db: "corpperks" },
    { role: "readWrite", db: "corpperks_benefits" },
    { role: "readWrite", db: "corpperks_rewards" },
    { role: "readWrite", db: "corpperks_catalog" }
  ]
});

# Create indexes
db.employees.createIndex({ "email": 1 }, { unique: true });
db.employees.createIndex({ "companyId": 1, "status": 1 });
db.benefits.createIndex({ "category": 1, "status": 1 });
db.transactions.createIndex({ "createdAt": -1 });
db.transactions.createIndex({ "employeeId": 1, "createdAt": -1 });

# Exit MongoDB shell
exit
```

### Step 3: Redis Setup

```bash
# Connect to Redis cluster
redis-cli -c -h redis-cluster.internal -p 6379 -a your_redis_password

# Create Redis users for each service
ACL SETUSER corpperks_api ON '>api_password' ~corpperks:* +@all
ACL SETUSER corpperks_auth ON '>auth_password' ~corpperks_auth:* +@all
ACL SETUSER corpperks_benefits ON '>benefits_password' ~corpperks_benefits:* +@all
ACL SETUSER corpperks_rewards ON '>rewards_password' ~corpperks_rewards:* +@all

# Configure memory policy
CONFIG SET maxmemory-policy allkeys-lru
CONFIG SET save "900 1 300 100 60 10000"

# Exit Redis CLI
exit
```

### Step 4: Configure Secrets

```bash
# Create secrets directory
mkdir -p /opt/corpperks/secrets

# Create individual secret files
echo -n "your_jwt_secret_min_32_chars" > /opt/corpperks/secrets/jwt_secret
echo -n "your_32_char_encryption_key" > /opt/corpperks/secrets/encryption_key
chmod 600 /opt/corpperks/secrets/*
```

### Step 5: Deploy Services

#### Manual Deployment (Systemd)

Create systemd service files:

```bash
# /etc/systemd/system/corpperks-gateway.service
[Unit]
Description=CorpPerks API Gateway
After=network.target redis.service mongodb.service
Wants=redis.service mongodb.service

[Service]
Type=simple
User=corpperks
WorkingDirectory=/opt/corpperks/gateway
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
Environment=NODE_ENV=production
EnvironmentFile=/opt/corpperks/secrets/env.gateway

[Install]
WantedBy=multi-user.target
```

Deploy each service:

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable and start services
sudo systemctl enable corpperks-gateway
sudo systemctl start corpperks-gateway
sudo systemctl enable corpperks-api
sudo systemctl start corpperks-api
sudo systemctl enable corpperks-auth
sudo systemctl start corpperks-auth
sudo systemctl enable corpperks-benefits
sudo systemctl start corpperks-benefits
sudo systemctl enable corpperks-rewards
sudo systemctl start corpperks-rewards

# Check service status
sudo systemctl status corpperks-gateway
```

---

## Docker Deployment

### docker-compose.yml (Production)

```yaml
version: '3.8'

services:
  # API Gateway
  gateway:
    image: corpperks/gateway:latest
    container_name: corpperks-gateway
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - SERVICE_URL=http://corpperks-api:3001
      - AUTH_SERVICE_URL=http://corpperks-auth:3002
      - BENEFITS_SERVICE_URL=http://corpperks-benefits:3003
    depends_on:
      - api
      - auth
      - benefits
    networks:
      - corpperks-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Main API Service
  api:
    image: corpperks/api:latest
    container_name: corpperks-api
    restart: unless-stopped
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo-primary:27017/corpperks
      - REDIS_HOST=redis-cluster
      - REDIS_PORT=6379
      - RABTUL_API_URL=https://api.rabtul.tech
    depends_on:
      - mongo-primary
      - redis-cluster
    networks:
      - corpperks-network
    volumes:
      - ./logs:/app/logs
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Authentication Service
  auth:
    image: corpperks/auth:latest
    container_name: corpperks-auth
    restart: unless-stopped
    ports:
      - "3002:3002"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo-primary:27017/corpperks_auth
      - REDIS_HOST=redis-cluster
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - mongo-primary
      - redis-cluster
    networks:
      - corpperks-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3002/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Benefits Service
  benefits:
    image: corpperks/benefits:latest
    container_name: corpperks-benefits
    restart: unless-stopped
    ports:
      - "3003:3003"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo-primary:27017/corpperks_benefits
      - RABTUL_API_URL=https://api.rabtul.tech
    depends_on:
      - mongo-primary
    networks:
      - corpperks-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3003/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Rewards Service
  rewards:
    image: corpperks/rewards:latest
    container_name: corpperks-rewards
    restart: unless-stopped
    ports:
      - "3004:3004"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo-primary:27017/corpperks_rewards
      - REDIS_HOST=redis-cluster
      - RABTUL_WALLET_URL=https://wallet.rabtul.tech
    depends_on:
      - mongo-primary
      - redis-cluster
    networks:
      - corpperks-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3004/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # MongoDB
  mongo-primary:
    image: mongo:6.0
    container_name: corpperks-mongo
    restart: unless-stopped
    command: mongod --replSet rs0 --keyFile /etc/mongo/keyfile
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=${MONGO_ROOT_PASSWORD}
    volumes:
      - mongo-data:/data/db
      - ./mongo-keyfile:/etc/mongo/keyfile:ro
    networks:
      - corpperks-network
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 30s
      timeout: 10s
      retries: 5

  # Redis Cluster
  redis-cluster:
    image: redis:7.2-alpine
    container_name: corpperks-redis
    restart: unless-stopped
    command: redis-server --requirepass ${REDIS_PASSWORD} --appendonly yes
    volumes:
      - redis-data:/data
    networks:
      - corpperks-network
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: corpperks-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - gateway
    networks:
      - corpperks-network

networks:
  corpperks-network:
    driver: bridge

volumes:
  mongo-data:
  redis-data:
```

### Build and Deploy Commands

```bash
# Build all Docker images
docker-compose -f docker-compose.yml build

# Tag images for registry
docker tag corpperks/gateway:latest your-registry.com/corpperks/gateway:v1.0.0
docker tag corpperks/api:latest your-registry.com/corpperks/api:v1.0.0
docker tag corpperks/auth:latest your-registry.com/corpperks/auth:v1.0.0
docker tag corpperks/benefits:latest your-registry.com/corpperks/benefits:v1.0.0
docker tag corpperks/rewards:latest your-registry.com/corpperks/rewards:v1.0.0

# Push to registry
docker push your-registry.com/corpperks/gateway:v1.0.0
docker push your-registry.com/corpperks/api:v1.0.0
docker push your-registry.com/corpperks/auth:v1.0.0
docker push your-registry.com/corpperks/benefits:v1.0.0
docker push your-registry.com/corpperks/rewards:v1.0.0

# Deploy in production
docker-compose -f docker-compose.yml up -d

# Check logs
docker-compose -f docker-compose.yml logs -f

# Scale services
docker-compose -f docker-compose.yml up -d --scale api=3
```

---

## Cloud Platform Deployment

### Railway Deployment

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Add environment variables
railway variables set NODE_ENV=production
railway variables set MONGODB_URI=$MONGODB_URI
railway variables set REDIS_HOST=$REDIS_HOST
railway variables set REDIS_PASSWORD=$REDIS_PASSWORD
railway variables set RABTUL_API_KEY=$RABTUL_API_KEY

# Deploy gateway service
cd gateway
railway up

# Deploy API service
cd ../api
railway up

# Deploy remaining services
cd ../auth && railway up
cd ../benefits && railway up
cd ../rewards && railway up

# Open dashboard
railway open
```

### Render Deployment

1. **Create render.yaml:**

```yaml
services:
  - type: web
    name: corpperks-gateway
    env: docker
    dockerfilePath: ./gateway/Dockerfile
    envVars:
      - key: NODE_ENV
        value: production
      - key: MONGODB_URI
        sync: false
      - key: REDIS_HOST
        sync: false

  - type: web
    name: corpperks-api
    env: docker
    dockerfilePath: ./api/Dockerfile
    envVars:
      - key: NODE_ENV
        value: production
      - key: MONGODB_URI
        sync: false

  - type: web
    name: corpperks-auth
    env: docker
    dockerfilePath: ./auth/Dockerfile
    envVars:
      - key: NODE_ENV
        value: production
```

2. **Deploy:**

```bash
# Install Render CLI
npm install -g @render/cli

# Login
render auth login

# Deploy
render deploy --service-account-name corpperks-deployer
```

### Vercel Deployment (For Frontend)

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy frontend
cd frontend
vercel --prod

# Set environment variables
vercel env add MONGODB_URI production
vercel env add API_URL production
```

---

## Health Checks & Monitoring

### Health Check Endpoints

Each service exposes health check endpoints:

| Service | Endpoint | Description |
|---------|----------|-------------|
| Gateway | `GET /health` | Overall gateway health |
| Gateway | `GET /health/ready` | Readiness probe |
| Gateway | `GET /health/live` | Liveness probe |
| API | `GET /health` | API health + dependencies |
| API | `GET /health/db` | Database connection status |
| API | `GET /health/redis` | Redis connection status |
| Auth | `GET /health` | Auth service health |
| Benefits | `GET /health` | Benefits service health |
| Rewards | `GET /health` | Rewards service health |

### Sample Health Check Response

```json
{
  "status": "healthy",
  "timestamp": "2026-06-04T12:00:00.000Z",
  "service": "corpperks-api",
  "version": "1.0.0",
  "uptime": 86400,
  "dependencies": {
    "mongodb": {
      "status": "connected",
      "latency": 2
    },
    "redis": {
      "status": "connected",
      "latency": 1
    },
    "rabtul": {
      "status": "healthy",
      "latency": 45
    }
  },
  "metrics": {
    "requests": {
      "total": 150000,
      "success": 148500,
      "errors": 1500
    },
    "memory": {
      "used": 256000000,
      "total": 512000000
    }
  }
}
```

### Monitoring with Prometheus

Add Prometheus metrics endpoint to each service:

```javascript
// metrics.js
const promClient = require('prom-client');

const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 1, 3, 5, 10]
});
register.registerMetric(httpRequestDuration);

// Usage in Express
app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer();
  res.on('finish', () => {
    end({ method: req.method, route: req.route.path, status_code: res.statusCode });
  });
  next();
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

### Grafana Dashboard Configuration

```json
{
  "dashboard": {
    "title": "CorpPerks Production",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total{service=\"corpperks-api\"}[5m])",
            "legendFormat": "{{method}} {{route}}"
          }
        ]
      },
      {
        "title": "Error Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total{status_code=~\"5..\"}[5m])",
            "legendFormat": "5xx Errors"
          }
        ]
      },
      {
        "title": "Response Time P99",
        "targets": [
          {
            "expr": "histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "P99 Latency"
          }
        ]
      }
    ]
  }
}
```

### Alert Rules

```yaml
# alert-rules.yaml
groups:
  - name: corpperks
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status_code=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"

      - alert: HighLatency
        expr: histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m])) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High latency detected"

      - alert: ServiceDown
        expr: up{job="corpperks"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Service is down"
```

---

## Rollback Procedures

### Quick Rollback (Docker)

```bash
# 1. List available images
docker images corpperks/*

# 2. Stop current containers
docker-compose down

# 3. Pull previous version
docker pull corpperks/gateway:v0.9.0
docker pull corpperks/api:v0.9.0
docker pull corpperks/auth:v0.9.0
docker pull corpperks/benefits:v0.9.0
docker pull corpperks/rewards:v0.9.0

# 4. Update docker-compose.yml with previous versions
# Edit image tags from :latest to :v0.9.0

# 5. Start services with previous version
docker-compose up -d

# 6. Verify rollback
curl https://api.corpperks.com/health
```

### Database Rollback

```bash
# 1. Create backup before rollback
mongodump --uri="mongodb://admin:password@mongo1:27017" --out=/backups/pre-rollback-$(date +%Y%m%d)

# 2. Restore to previous state (if needed)
mongorestore --uri="mongodb://admin:password@mongo1:27017" --drop /backups/pre-rollback-20260601
```

### Service-Specific Rollback

```bash
# Rollback specific service only
docker-compose stop corpperks-api
docker tag corpperks/api:v0.9.0 corpperks/api:latest
docker-compose up -d corpperks-api

# Verify specific service
curl -f https://api.corpperks.com/health
```

### Automated Rollback Script

```bash
#!/bin/bash
# rollback.sh

set -e

VERSION=${1:-previous}
ENV=${2:-production}

echo "Starting rollback to version: $VERSION"

# Stop services
docker-compose down

# Pull specified version
docker pull corpperks/gateway:$VERSION
docker pull corpperks/api:$VERSION
docker pull corpperks/auth:$VERSION
docker pull corpperks/benefits:$VERSION
docker pull corpperks/rewards:$VERSION

# Update tags
for service in gateway api auth benefits rewards; do
  docker tag corpperks/$service:$VERSION corpperks/$service:latest
done

# Start services
docker-compose up -d

# Wait for health checks
sleep 30

# Verify rollback
if curl -f https://api.corpperks.com/health; then
  echo "Rollback successful!"
else
  echo "Rollback failed! Restoring previous version..."
  docker-compose down
  docker-compose -f docker-compose.backup.yml up -d
  exit 1
fi
```

---

## Troubleshooting

### Common Issues and Solutions

#### 1. Service Won't Start

```bash
# Check logs
docker-compose logs -f corpperks-api

# Common causes:
# - Missing environment variables
# - Database connection failure
# - Port already in use

# Fix: Ensure all env vars are set
docker-compose config > /dev/null
```

#### 2. Database Connection Issues

```bash
# Test MongoDB connection
mongosh --host mongo1.internal --username admin --password password --authenticationDatabase admin --eval "db.adminCommand('ping')"

# Test from container
docker exec -it corpperks-api mongosh --eval "db.adminCommand('ping')"

# Check connection string format
# Correct: mongodb://user:pass@host:27017/db?authSource=admin
```

#### 3. Redis Connection Issues

```bash
# Test Redis connection
redis-cli -h redis-cluster.internal -p 6379 -a password ping

# Check Redis logs
docker-compose logs redis-cluster

# Common fix: Ensure REDIS_HOST matches container network name
```

#### 4. High Memory Usage

```bash
# Check memory usage per container
docker stats

# Restart specific service
docker-compose restart corpperks-api

# Increase memory limit in docker-compose.yml
```

#### 5. SSL/TLS Certificate Issues

```bash
# Check certificate expiry
openssl s_client -connect corpperks.com:443 -showcerts | openssl x509 -noout -dates

# Renew certificates
certbot renew --nginx

# Force reload Nginx
docker-compose exec nginx nginx -s reload
```

### Debug Mode

```bash
# Enable debug logging
export LOG_LEVEL=debug

# Run service in debug mode
docker-compose run --rm --service-ports corpperks-api

# With Node.js debugger
docker-compose run --rm -p 9229:9229 corpperks-api node --inspect=0.0.0.0:9229 dist/index.js
```

### Log Analysis

```bash
# Search logs for errors
docker-compose logs | grep -i error

# Search logs for specific request ID
docker-compose logs | grep "req-12345"

# Export logs for analysis
docker-compose logs > /tmp/corpperks-logs-$(date +%Y%m%d).txt

# Real-time error monitoring
docker-compose logs -f | grep --line-buffered "ERROR\|FATAL"
```

---

## Security Checklist

- [ ] All services running behind HTTPS
- [ ] MongoDB authentication enabled
- [ ] Redis password configured
- [ ] Secrets stored in secrets manager (not in code)
- [ ] Environment variables validated on startup
- [ ] Rate limiting enabled on all endpoints
- [ ] CORS configured for production domains only
- [ ] JWT secrets are 32+ characters
- [ ] Database users have minimal required permissions
- [ ] SSL certificates auto-renew configured
- [ ] Firewall rules configured (allow only necessary ports)
- [ ] Log sensitive data redaction enabled
- [ ] Security headers (HSTS, CSP, etc.) configured
- [ ] API keys and tokens are not logged
- [ ] Docker images scanned for vulnerabilities

---

## Support

For deployment issues, contact:
- **Email:** devops@hojai.ai
- **Slack:** #corpperks-support
- **Documentation:** https://docs.corpperks.com

---

**Document Version:** 1.0.0
**Last Updated:** June 4, 2026
**Maintained By:** HOJAI-AI DevOps Team
