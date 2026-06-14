# REZ Atlas v2 - Deployment Guide

**Version:** 2.0.0  
**Date:** June 9, 2026

---

## Prerequisites

- Node.js 18+
- npm 9+ or yarn
- Docker (optional)
- Redis (for caching)
- MongoDB (for data persistence)

---

## Quick Start

### 1. Clone and Install

```bash
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/REZ-Merchant/REZ-atlas-v2

# Install all layer dependencies
cd atlas-intelligence && npm install && cd ..
cd atlas-engage && npm install && cd ..
cd atlas-ai-workforce && npm install && cd ..
cd atlas-revenue-os && npm install && cd ..
cd dashboard && npm install && cd ..
cd field-app && npm install && cd ..
```

### 2. Start Services

```bash
# Start Intelligence Layer (Ports 5156-5160)
cd atlas-intelligence
npm run dev &

# Start Engage Layer (Ports 5161-5165)
cd atlas-engage
npm run dev &

# Start AI Workforce (Ports 5174-5177)
cd atlas-ai-workforce
npm run dev &

# Start Revenue OS (Ports 5180-5183)
cd atlas-revenue-os
npm run dev &
```

### 3. Start Frontend

```bash
# Dashboard (Port 3001)
cd dashboard
npm run dev &

# Field App (Port 3002)
cd field-app
npm run dev &
```

---

## Service Health Checks

```bash
# Intelligence Layer
curl http://localhost:5156/health  # Company Twin
curl http://localhost:5157/health  # Person Twin
curl http://localhost:5158/health  # Research Agent
curl http://localhost:5159/health  # Intent Engine
curl http://localhost:5160/health  # Enrichment

# Engage Layer
curl http://localhost:5161/health  # Email
curl http://localhost:5162/health  # WhatsApp
curl http://localhost:5163/health  # SMS
curl http://localhost:5164/health  # Call
curl http://localhost:5165/health  # Deliverability

# AI Workforce
curl http://localhost:5174/health  # SDR Agent
curl http://localhost:5175/health  # Qualification
curl http://localhost:5176/health  # Meeting
curl http://localhost:5177/health  # Follow-up

# Revenue OS
curl http://localhost:5180/health  # CRM Core
curl http://localhost:5181/health  # Pipeline
curl http://localhost:5182/health  # Forecast
curl http://localhost:5183/health  # Conversation Intel
```

---

## Docker Deployment

### Dockerfile Example

```dockerfile
# atlas-sdr-agent/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 5174

CMD ["npm", "start"]
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  # Intelligence Layer
  atlas-company-twin:
    build: ./atlas-intelligence/atlas-company-twin
    ports:
      - "5156:5174"
    environment:
      - NODE_ENV=production
      - PORT=5174
    restart: unless-stopped

  atlas-person-twin:
    build: ./atlas-intelligence/atlas-person-twin
    ports:
      - "5157:5174"
    environment:
      - NODE_ENV=production
      - PORT=5174
    restart: unless-stopped

  # ... additional services

  # Redis Cache
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

  # MongoDB
  mongodb:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    restart: unless-stopped

volumes:
  redis_data:
  mongo_data:
```

### Deploy with Docker Compose

```bash
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/REZ-Merchant/REZ-atlas-v2
docker-compose up -d
```

---

## Kubernetes Deployment

### Service Deployment Example

```yaml
# k8s/atlas-sdr-agent.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: atlas-sdr-agent
  namespace: rez-atlas
spec:
  replicas: 3
  selector:
    matchLabels:
      app: atlas-sdr-agent
  template:
    metadata:
      labels:
        app: atlas-sdr-agent
    spec:
      containers:
        - name: atlas-sdr-agent
          image: rez-atlas/atlas-sdr-agent:latest
          ports:
            - containerPort: 5174
          env:
            - name: NODE_ENV
              value: "production"
            - name: PORT
              value: "5174"
            - name: REDIS_URL
              valueFrom:
                secretKeyRef:
                  name: atlas-secrets
                  key: redis-url
            - name: MONGODB_URI
              valueFrom:
                secretKeyRef:
                  name: atlas-secrets
                  key: mongodb-uri
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /health
              port: 5174
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health/ready
              port: 5174
            initialDelaySeconds: 5
            periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: atlas-sdr-agent
  namespace: rez-atlas
spec:
  selector:
    app: atlas-sdr-agent
  ports:
    - port: 80
      targetPort: 5174
  type: ClusterIP
```

### Apply Kubernetes Manifests

```bash
kubectl apply -f k8s/
kubectl get pods -n rez-atlas
```

---

## Environment Variables

### Required Environment Variables

```bash
# Core
NODE_ENV=development|production
PORT=5174

# Redis
REDIS_URL=redis://localhost:6379

# MongoDB
MONGODB_URI=mongodb://localhost:27017/atlas

# API Keys (for external services)
CLEARBIT_API_KEY=your_clearbit_key
APOLLO_API_KEY=your_apollo_key
HUNTER_API_KEY=your_hunter_key
ZOOMINFO_API_KEY=your_zoominfo_key

# Email
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_key

# WhatsApp
WHATSAPP_BUSINESS_ACCOUNT_ID=your_whatsapp_id
WHATSAPP_ACCESS_TOKEN=your_whatsapp_token

# SMS
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token

# AI Services
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key

# Logging
LOG_LEVEL=info
SENTRY_DSN=your_sentry_dsn
```

---

## Monitoring

### Prometheus Metrics

Each service exposes metrics at `/metrics`:

```bash
curl http://localhost:5174/metrics
```

Key metrics:
- `http_requests_total` - Total HTTP requests
- `http_request_duration_seconds` - Request latency
- `atlas_leads_processed_total` - Leads processed
- `atlas_campaigns_active` - Active campaigns
- `atlas_revenue_predicted` - Predicted revenue

### Health Checks

```bash
# Liveness probe
curl http://localhost:5174/health

# Readiness probe
curl http://localhost:5174/health/ready
```

---

## CI/CD Pipeline

### GitHub Actions Example

```yaml
# .github/workflows/deploy.yml
name: Deploy Atlas Services

on:
  push:
    branches: [main]
    paths:
      - 'REZ-Merchant/REZ-atlas-v2/**'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install and Test
        run: |
          cd REZ-Merchant/REZ-atlas-v2/atlas-intelligence
          npm ci
          npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Kubernetes
        run: |
          kubectl apply -f REZ-Merchant/REZ-atlas-v2/k8s/
```

---

## Troubleshooting

### Service Won't Start

1. Check if port is already in use:
```bash
lsof -i :5174
```

2. Check logs:
```bash
npm run dev 2>&1 | head -100
```

### Database Connection Issues

1. Verify MongoDB is running:
```bash
docker ps | grep mongo
```

2. Check connection string in environment variables

### High Memory Usage

1. Check service logs for memory leaks
2. Restart service:
```bash
kubectl rollout restart deployment/atlas-sdr-agent -n rez-atlas
```

---

## Scaling

### Horizontal Scaling

```bash
# Scale SDR Agent to 5 replicas
kubectl scale deployment atlas-sdr-agent --replicas=5 -n rez-atlas

# Auto-scale based on CPU
kubectl autoscale deployment atlas-sdr-agent \
  --cpu-percent=70 \
  --min=3 \
  --max=10 \
  -n rez-atlas
```

### Load Balancing

Services behind the gateway are automatically load-balanced.

---

## Backup and Recovery

### MongoDB Backup

```bash
# Create backup
mongodump --uri="mongodb://localhost:27017/atlas" --out=/backup/atlas

# Restore
mongorestore --uri="mongodb://localhost:27017/atlas" /backup/atlas
```

### Redis Backup

```bash
# Save snapshot
redis-cli SAVE

# Backup dump.rdb
cp /var/lib/redis/dump.rdb /backup/dump.rdb
```

---

## Security

### API Key Authentication

All API requests require:
```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
     https://api.rez.atlas/v1/...
```

### Rate Limiting

Default limits per API key:
- Free: 100 requests/day
- Starter: 5,000 requests/day
- Professional: 50,000 requests/day
- Enterprise: Unlimited

### Secret Management

Use Kubernetes secrets for sensitive data:
```bash
kubectl create secret generic atlas-secrets \
  --from-literal=openai-api-key=your-key \
  --namespace=rez-atlas
```

---

## Performance Tuning

### Redis Caching

Services use Redis for:
- Session caching
- Rate limiting
- Pub/sub for real-time updates

```javascript
// Example: Cache enrichment results
await redis.setex(
  `enrich:${companyDomain}`,
  3600, // 1 hour TTL
  JSON.stringify(enrichedData)
);
```

### Connection Pooling

MongoDB connection pool settings:
```javascript
{
  maxPoolSize: 10,
  minPoolSize: 2,
  idleTimeoutMS: 30000
}
```

---

## Support

For issues or questions:
- Documentation: [docs.rez.atlas](https://docs.rez.atlas)
- Support Email: support@rez.atlas
- Slack: #atlas-support

---

**Last Updated:** June 9, 2026
**Version:** 2.0.0
