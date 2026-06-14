# Hotel Ecosystem Deployment Guide

## Prerequisites

- Docker & Docker Compose
- Node.js 20+
- MongoDB 6+
- Redis 7+
- OpenAI API key (for AI features)

## Quick Start

```bash
# Clone and start all services
cd hotel-ecosystem

# Start infrastructure
docker-compose up -d mongodb redis

# Install dependencies
npm install

# Start services
npm run dev
```

## Docker Compose

### Full Stack Development
```yaml
# docker-compose.hotel.yml
version: '3.8'

services:
  mongodb:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  rez-stayown:
    build: ./rez-stayown-service
    ports:
      - "4004:4004"
    environment:
      - MONGODB_URI=mongodb://mongodb:27017/stayown
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
      - INTERNAL_SERVICE_TOKENS_JSON=${INTERNAL_SERVICE_TOKENS_JSON}
    depends_on:
      - mongodb
      - redis

  rez-habixo:
    build: ./rez-habixo-service
    ports:
      - "4005:4005"
    environment:
      - MONGODB_URI=mongodb://mongodb:27017/habixo
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mongodb
      - redis

  rez-hotel:
    build: ./rez-hotel-service
    ports:
      - "4006:4006"
    environment:
      - MONGODB_URI=mongodb://mongodb:27017/hotel
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mongodb
      - redis

  rez-mind-hotel:
    build: ./rez-mind-hotel-service
    ports:
      - "4007:4007"
    environment:
      - MONGODB_URI=mongodb://mongodb:27017/mind-hotel
      - REDIS_URL=redis://redis:6379
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    depends_on:
      - mongodb
      - redis

  rez-channel-manager:
    build: ./rez-channel-manager-service
    ports:
      - "4008:4008"
    environment:
      - MONGODB_URI=mongodb://mongodb:27017/channel-manager
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mongodb
      - redis

  rez-hotel-pos:
    build: ./rez-hotel-pos-service
    ports:
      - "4009:4009"
    environment:
      - MONGODB_URI=mongodb://mongodb:27017/hotel-pos
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mongodb
      - redis

  rez-reputation:
    build: ./rez-reputation-service
    ports:
      - "4010:4010"
    environment:
      - MONGODB_URI=mongodb://mongodb:27017/reputation
      - REDIS_URL=redis://redis:6379
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    depends_on:
      - mongodb
      - redis

volumes:
  mongodb_data:
  redis_data:
```

## Environment Variables

### rez-stayown-service
```bash
# Required
MONGODB_URI=mongodb://localhost:27017/stayown
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-jwt-secret-min-32-chars

# Internal
HOTEL_PMS_URL=http://localhost:3008
HOTEL_OTA_API_URL=http://localhost:3008
INTERNAL_SERVICE_TOKENS_JSON={"stayown":"token","gateway":"token"}

# Optional
PORT=4004
NODE_ENV=development
LOG_LEVEL=info
```

### rez-habixo-service
```bash
# Required
MONGODB_URI=mongodb://localhost:27017/habixo
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-jwt-secret-min-32-chars

# Internal
INTERNAL_SERVICE_TOKENS_JSON={"habixo":"token","stayown":"token"}

# Optional
PORT=4005
```

### rez-hotel-service
```bash
# Required
MONGODB_URI=mongodb://localhost:27017/hotel
REDIS_URL=redis://localhost:6379

# Internal
INTERNAL_SERVICE_TOKENS_JSON={"hotel":"token","stayown":"token"}

# Optional
PORT=4006
```

### rez-mind-hotel-service
```bash
# Required
MONGODB_URI=mongodb://localhost:27017/mind-hotel
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=sk-your-openai-key

# Optional
PORT=4007
PRICING_CACHE_TTL=900 # 15 minutes
```

### rez-channel-manager-service
```bash
# Required
MONGODB_URI=mongodb://localhost:27017/channel-manager
REDIS_URL=redis://localhost:6379

# OTA API Keys
BOOKING_COM_API_KEY=your-booking-api-key
AIRDNA_API_KEY=your-airbnb-api-key

# Optional
PORT=4008
SYNC_INTERVAL_MS=60000 # 1 minute
```

### rez-hotel-pos-service
```bash
# Required
MONGODB_URI=mongodb://localhost:27017/hotel-pos
REDIS_URL=redis://localhost:6379

# Internal
HOTEL_PMS_URL=http://localhost:3008
INTERNAL_SERVICE_TOKENS_JSON={"hotel-pos":"token","hotel":"token"}

# Optional
PORT=4009
DEFAULT_TAX_RATE=12
```

### rez-reputation-service
```bash
# Required
MONGODB_URI=mongodb://localhost:27017/reputation
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=sk-your-openai-key

# Webhook Secrets
GOOGLE_WEBHOOK_SECRET=your-google-secret
TRIPADVISOR_WEBHOOK_SECRET=your-tripadvisor-secret
BOOKINGCOM_WEBHOOK_SECRET=your-booking-secret

# Optional
PORT=4010
REVIEW_FETCH_INTERVAL_MS=3600000 # 1 hour
```

## Health Checks

All services expose health check endpoints:

### Liveness Probe
```http
GET /health/live
```
Returns `200 OK` if service is running.

### Readiness Probe
```http
GET /health/ready
```
Returns `200 OK` if service can accept traffic (DB/Redis connected).

### Response
```json
{
  "status": "healthy",
  "service": "rez-stayown-service",
  "version": "1.0.0",
  "uptime": 3600,
  "dependencies": {
    "mongodb": "connected",
    "redis": "connected"
  }
}
```

## Kubernetes Deployment

### Deployment YAML
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: rez-stayown-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: rez-stayown-service
  template:
    metadata:
      labels:
        app: rez-stayown-service
    spec:
      containers:
        - name: rez-stayown
          image: rez/stayown-service:latest
          ports:
            - containerPort: 4004
          env:
            - name: MONGODB_URI
              valueFrom:
                secretKeyRef:
                  name: rez-secrets
                  key: mongodb-uri
            - name: REDIS_URL
              valueFrom:
                secretKeyRef:
                  name: rez-secrets
                  key: redis-url
            - name: JWT_SECRET
              valueFrom:
                secretKeyRef:
                  name: rez-secrets
                  key: jwt-secret
          livenessProbe:
            httpGet:
              path: /health/live
              port: 4004
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health/ready
              port: 4004
            initialDelaySeconds: 10
            periodSeconds: 5
          resources:
            requests:
              memory: "256Mi"
              cpu: "100m"
            limits:
              memory: "512Mi"
              cpu: "500m"
```

### Service YAML
```yaml
apiVersion: v1
kind: Service
metadata:
  name: rez-stayown-service
spec:
  selector:
    app: rez-stayown-service
  ports:
    - port: 80
      targetPort: 4004
  type: ClusterIP
```

## Monitoring

### Prometheus Metrics

All services expose metrics at `/metrics`:

```http
GET /metrics
```

Key metrics:
- `http_requests_total{method, route, status}` - Request counter
- `http_request_duration_seconds{method, route}` - Request latency histogram
- `mongodb_operations_total{operation}` - DB operation counter
- `redis_operations_total{operation}` - Redis operation counter
- `booking_created_total` - Booking counter
- `revenue_total{currency}` - Revenue tracker

### Grafana Dashboard

Import `grafana/hotel-ecosystem-dashboard.json` for pre-built panels:
- Service Health Overview
- Request Rate & Latency
- Error Rate
- Booking Funnel
- Revenue Tracking
- Dependency Health

## Troubleshooting

### Service Won't Start
```bash
# Check logs
docker-compose logs rez-stayown

# Check environment
docker-compose config

# Verify MongoDB connection
docker-compose exec mongodb mongosh
```

### High Latency
```bash
# Check Redis
docker-compose exec redis redis-cli ping

# Check MongoDB slow queries
docker-compose exec mongodb mongosh --eval "db.currentOp({millis: {$gt: 1000}})"
```

### Rate Limiting Issues
```bash
# Check Redis rate limit keys
docker-compose exec redis redis-cli KEYS "rate:*"
```

## CI/CD Pipeline

### GitHub Actions
```yaml
name: Deploy Hotel Services

on:
  push:
    branches: [main]
    paths:
      - 'rez-*-service/**'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm test

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/build-push-action@v5
        with:
          push: true
          tags: rez/${{ matrix.service }}:latest
```

## Backup & Recovery

### MongoDB Backup
```bash
# Daily backup
docker-compose exec mongodb mongodump --archive=/backup/$(date +%Y%m%d).archive

# Restore
docker-compose exec -T mongodb mongorestore --archive=/backup/20240501.archive
```

### Redis Backup
```bash
# Save RDB
docker-compose exec redis redis-cli BGSAVE

# Copy backup
docker-compose cp redis:/data/dump.rdb ./backups/
```
