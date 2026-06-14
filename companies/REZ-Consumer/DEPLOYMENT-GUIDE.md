# REZ-Consumer - Deployment Guide

**Version:** 1.0.0
**Date:** June 12, 2026
**Status:** ✅ PRODUCTION READY

---

## Overview

This guide covers deployment of all 26 REZ-Consumer products.

---

## 1. PRE-DEPLOYMENT CHECKLIST

### Environment Setup

- [ ] Set production environment variables from `.env.example`
- [ ] Configure MongoDB clusters with authentication
- [ ] Configure Redis for caching and rate limiting
- [ ] Set strong `JWT_SECRET` (32+ characters)
- [ ] Set strong `INTERNAL_API_KEY`
- [ ] Configure external service URLs
- [ ] Set up Sentry for error tracking
- [ ] Configure Prometheus/Grafana for monitoring

### Security Checklist

- [ ] All `.env` files excluded from git (`.gitignore`)
- [ ] No hardcoded secrets in code
- [ ] HTTPS enforced in production
- [ ] CORS configured for production domains
- [ ] Rate limiting enabled
- [ ] Input validation in place

### Dependencies

- [ ] Node.js 18+ installed
- [ ] MongoDB 6+ installed
- [ ] Redis 7+ installed (for some services)
- [ ] Docker installed (for containerized deployment)

---

## 2. DOCKER DEPLOYMENT

### Build All Services

```bash
# Navigate to company directory
cd /Users/rejaulkarim/Documents/RTMN/companies/REZ-Consumer

# Build each service
for service in verify-qr-service safe-qr-service REZ-assistant REZ-inbox REZ-bills REZ-expense REZ-nearby REZ-save REZ-scan REZ-menu-qr go4food-api; do
  echo "Building $service..."
  cd $service
  docker build -t rez-$service:latest .
  cd ..
done
```

### Run Individual Service

```bash
# Example: verify-qr-service
cd verify-qr-service

# Create .env from example
cp .env.example .env
# Edit .env with production values

# Build and run
docker build -t rez-verify-qr-service .
docker run -d \
  --name rez-verify-qr-service \
  -p 4003:4003 \
  --env-file .env \
  rez-verify-qr-service
```

### Docker Compose (All Services)

```bash
# Start all backend services
docker-compose -f verify-qr-service/docker-compose.yml up -d
docker-compose -f safe-qr-service/docker-compose.yml up -d
docker-compose -f REZ-assistant/docker-compose.yml up -d
docker-compose -f REZ-inbox/docker-compose.yml up -d
```

### Health Check

```bash
# Check all services
for port in 4003 4001 3011 3003 3012 3013 3014 3016 3017 3018 3002; do
  echo "Checking port $port..."
  curl -s http://localhost:$port/health || echo "FAILED"
done
```

---

## 3. KUBERNETES DEPLOYMENT

### Example Deployment (verify-qr-service)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: verify-qr-service
  labels:
    app: verify-qr-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: verify-qr-service
  template:
    metadata:
      labels:
        app: verify-qr-service
    spec:
      containers:
      - name: verify-qr-service
        image: rez/verify-qr-service:latest
        ports:
        - containerPort: 4003
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "4003"
        - name: MONGODB_URI
          valueFrom:
            secretKeyRef:
              name: rez-secrets
              key: mongodb-uri
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: rez-secrets
              key: jwt-secret
        livenessProbe:
          httpGet:
            path: /health
            port: 4003
          initialDelaySeconds: 10
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /health
            port: 4003
          initialDelaySeconds: 5
          periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: verify-qr-service
spec:
  selector:
    app: verify-qr-service
  ports:
  - port: 4003
    targetPort: 4003
  type: LoadBalancer
```

### Apply Kubernetes Configs

```bash
# Apply all deployments
kubectl apply -f k8s-deployment.yaml

# Check status
kubectl get pods -l app=verify-qr-service
kubectl get svc verify-qr-service
```

---

## 4. MOBILE APP DEPLOYMENT

### EAS Build (iOS)

```bash
# Navigate to app
cd verify-qr-mobile

# Configure EAS
eas build:configure

# Build for production
eas build --profile production --platform ios

# Or build for development
eas build --profile development --platform ios
```

### EAS Build (Android)

```bash
# Build for production
eas build --profile production --platform android

# Build for internal testing
eas build --profile preview --platform android
```

### Manual Build

```bash
# iOS
cd verify-qr-mobile
npx expo run:ios --configuration Release

# Android
npx expo run:android --variant release
```

---

## 5. WEB APP DEPLOYMENT

### verify-qr-dashboard

```bash
cd verify-qr-dashboard

# Build for production
npm run build

# Start server
npm start
```

### rez-now

```bash
cd rez-now

# Build for production
npm run build

# Deploy to Vercel
vercel --prod
```

---

## 6. ENVIRONMENT CONFIGURATION

### Production .env Template

```bash
# Server
NODE_ENV=production
PORT=4003

# Database
MONGODB_URI=mongodb://user:pass@cluster.mongodb.net/rez-verify
MONGODB_USER=your_user
MONGODB_PASSWORD=your_password

# Redis
REDIS_URL=redis://user:pass@cluster.redis.net
REDIS_PASSWORD=your_redis_password

# Security (CHANGE THESE!)
JWT_SECRET=CHANGE_ME_generate_strong_secret_here_MIN_32_chars
INTERNAL_API_KEY=CHANGE_ME_generate_strong_api_key_here

# CORS
ALLOWED_ORIGINS=https://rez.money,https://www.rez.money,https://app.rez.money

# RABTUL Services
RABTUL_AUTH_URL=https://rez-auth.rezapp.com
RABTUL_WALLET_URL=https://rez-wallet.rezapp.com
RABTUL_NOTIFICATION_URL=https://rez-notification.rezapp.com

# External Services
REZ_MIND_API=https://REZ-mind.onrender.com
REZ_INTELLIGENCE_API=https://rez-intelligence.onrender.com
REZ_AGENT_API=https://REZ-agent.onrender.com

# Monitoring
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project
LOG_LEVEL=info

# Payment (verify-qr-service)
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
```

---

## 7. SERVICE-SPECIFIC CONFIGURATION

### verify-qr-service (Port 4003)

```bash
# Payment integration
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# WhatsApp
WHATSAPP_PHONE_NUMBER_ID=your_phone_id
WHATSAPP_ACCESS_TOKEN=your_token

# SMS
SMS_API_KEY=your_sms_key
SMS_SENDER_ID=REZAPP
```

### safe-qr-service (Port 4001)

```bash
# Karma system
KARMA_INITIAL_POINTS=100
KARMA_MAX_POINTS=10000
```

### REZ-assistant (Port 3011)

```bash
# AI
ANTHROPIC_API_KEY=your_anthropic_key
MIND_API=https://REZ-mind.onrender.com
INTENT_API=https://rez-intent-graph.onrender.com
```

### REZ-inbox (Port 3003)

```bash
# Email import
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_USER=your_email@gmail.com
IMAP_PASSWORD=your_app_password

# RabbitMQ
RABBITMQ_URL=amqp://user:pass@cluster.rabbitmq.net
```

---

## 8. MONITORING & ALERTING

### Health Check Script

```bash
#!/bin/bash
# health_check.sh

SERVICES=(
  "verify-qr-service:4003"
  "safe-qr-service:4001"
  "REZ-assistant:3011"
  "REZ-inbox:3003"
  "REZ-bills:3012"
  "REZ-expense:3013"
  "REZ-nearby:3014"
  "REZ-save:3016"
  "REZ-scan:3017"
  "REZ-menu-qr:3018"
  "go4food-api:3002"
)

for service in "${SERVICES[@]}"; do
  name="${service%%:*}"
  port="${service##*:}"
  
  status=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$port/health")
  
  if [ "$status" = "200" ]; then
    echo "✅ $name ($port) - OK"
  else
    echo "❌ $name ($port) - FAILED (status: $status)"
    # Send alert
    # curl -X POST "your-alerting-webhook" -d "Service $name is down"
  fi
done
```

### Prometheus Metrics

```bash
# Enable metrics endpoint in services
PROMETHEUS_PORT=9090
```

---

## 9. BACKUP & RECOVERY

### MongoDB Backup

```bash
# Single service backup
mongodump --uri="mongodb://user:pass@host/verify-qr-service" --out=/backup/verify-qr-$(date +%Y%m%d)

# All databases
for db in verify safeqr rezassistant rezinbox rezbills rezexpense reznearby rezsave rezscan rezzmenuqr; do
  mongodump --uri="mongodb://user:pass@host/$db" --out=/backup/$db-$(date +%Y%m%d)
done
```

### Restore

```bash
mongorestore --uri="mongodb://user:pass@host/verify-qr-service" /backup/verify-qr-20260612
```

---

## 10. TROUBLESHOOTING

### Common Issues

| Issue | Solution |
|-------|----------|
| Service won't start | Check MongoDB connection, verify .env |
| Health check fails | Check port binding, firewall rules |
| Rate limit hit | Wait, implement backoff |
| Auth failures | Check JWT_SECRET, token expiration |
| Build fails | Check TypeScript errors, node version |

### Logs

```bash
# View logs
docker logs verify-qr-service

# Follow logs
docker logs -f verify-qr-service

# View from beginning
docker logs --tail 100 verify-qr-service
```

### Debug Mode

```bash
# Enable debug logging
LOG_LEVEL=debug

# Run with ts-node
npm run dev
```

---

## 11. SCALING

### Horizontal Scaling

```bash
# Scale service
docker-compose up -d --scale verify-qr-service=3

# Kubernetes
kubectl scale deployment verify-qr-service --replicas=5
```

### Load Balancer

Configure load balancer to distribute traffic across instances.

### Redis for Session Sharing

Enable Redis for session sharing in scaled environments.

---

## 12. DEPLOYMENT TIMELINE

| Phase | Service | Time |
|-------|---------|------|
| 1 | verify-qr-service, safe-qr-service | 5 min |
| 2 | REZ-assistant, REZ-inbox | 5 min |
| 3 | REZ-bills, REZ-expense | 5 min |
| 4 | REZ-nearby, REZ-save, REZ-scan | 5 min |
| 5 | REZ-menu-qr, go4food-api | 5 min |
| 6 | Mobile apps (EAS) | 15 min |
| 7 | Web apps | 10 min |

**Total Time:** ~45 minutes

---

## 13. ROLLBACK

### Docker Rollback

```bash
# Stop current
docker stop verify-qr-service

# Run previous version
docker run -d --name verify-qr-service -p 4003:4003 rez-verify-qr-service:previous
```

### Kubernetes Rollback

```bash
# Rollback to previous version
kubectl rollout undo deployment/verify-qr-service

# Check status
kubectl rollout status deployment/verify-qr-service
```

---

**Last Updated:** June 12, 2026