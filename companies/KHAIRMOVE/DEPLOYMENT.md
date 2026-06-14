# KHAIRMOVE Production Deployment Guide
**Version:** 1.0.0
**Date:** June 12, 2026

---

## 🚨 Pre-Deployment Checklist

### Critical Security Fixes (MUST DO BEFORE DEPLOYMENT)

- [ ] **Replace all hardcoded JWT secrets** - Generate new secrets for each service
- [ ] **Apply authentication middleware** - All protected routes must use `authenticate()`
- [ ] **Configure CORS_ORIGINS** - Set explicit allowed origins (no wildcards in production)
- [ ] **Add rate limiting** - Already implemented, ensure it's active
- [ ] **Validate environment variables** - All services must have proper `.env` files
- [ ] **Add MongoDB to in-memory services** - logistics-aggregator, document-vault, social-extension

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           KHAIRMOVE ECOSYSTEM                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ PUBLIC FACING (Ports 4600, 4500)               │  │
│  │ ┌─────────────────┐    ┌─────────────────────┐                  │  │
│  │  │ API Gateway     │    │ Airzy Gateway │                  │  │
│  │  │ (Port 4600)     │    │ (Port 4500)          │                  │  │
│  │  └────────┬────────┘    └──────────┬──────────┘                  │  │
│  │           │                         │                              │  │
│  │  ┌────────┴────────────────────────┴──────────┐                   │  │
│  │  │              BACKEND SERVICES              │                   │  │
│  │  ├───────────────────────────────────────────┤ │  │
│  │  │                                           │                   │  │
│  │  │  Ride Services (4601)      │  Airport Services (4501-4509)   │  │
│  │  │  Fleet Services (4602)      │                                   │  │
│  │  │  Delivery Services (4603)   │                                   │  │
│  │  │  Logistics (4604)           │                                   │  │
│  │  │  Rental Services (4605)     │                                   │  │
│  │  │  BuzzLocal (4606)           │                                   │  │
│  │  │                                           │                   │  │
│  │  └───────────────────────────────────────────┘                   │  │
│  │                          │                                        │  │
│  │  ┌───────────────────────┴───────────────────────┐               │  │
│  │  │              SHARED INFRASTRUCTURE             │               │  │
│  │  ├───────────────────────────────────────────────┤               │  │
│  │  │  MongoDB (27017)  │  Redis (6379)  │  S3      │               │  │
│  │  └───────────────────────────────────────────────┘               │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Service Ports

### Core KHAIRMOVE Services

| Port | Service | Description |
|------|---------|-------------|
| 4600 | khaimove-api-gateway | Main API entry point |
| 4601 | khaimove-ride-service | Ride-hailing backend |
| 4602 | khaimove-fleet-service | Fleet management |
| 4603 | khaimove-delivery-service | Food/package delivery |
| 4604 | khaimove-logistics-aggregator | Multi-carrier shipping |
| 4605 | khaimove-rental-service | Hourly/daily rentals |
| 4606 | buzzlocal-rides-integration | Community rides |

### Airzy Airport Ecosystem

| Port | Service | Description |
|------|---------|-------------|
| 4500 | airzy-api-gateway | Airport API gateway |
| 4501 | airzy-flight-service | Flight tracking |
| 4502 | airzy-lounge-service | Lounge access |
| 4503 | airzy-itinerary-service | Trip planning |
| 4504 | airzy-wallet-extension | Travel coins |
| 4505 | airzy-ai-brain | AI recommendations |
| 4506 | airzy-corp-service | Corporate travel |
| 4507 | airzy-hotel-extension | Hotel booking |
| 4508 | airzy-transfer-extension | Airport transfers |
| 4509 | airzy-dooh-extension | Digital signage |

---

## Environment Variables

### Required for ALL Services

```bash
# Environment
NODE_ENV=production
SERVICE_NAME=khaimove-service

# Security (MUST BE UNIQUE PER SERVICE)
JWT_SECRET=<generate-32-byte-random-string>
INTERNAL_SERVICE_TOKEN=<generate-32-byte-random-string>
REZ_INTELLIGENCE_API_KEY=<from-rez-intelligence>

# Database
MONGODB_URI=mongodb://user:password@host:27017/dbname?authSource=admin

# Redis
REDIS_URL=redis://:password@host:6379

# CORS (comma-separated domains)
CORS_ORIGINS=https://app.khaimove.com,https://admin.khaimove.com
```

### Service-Specific Variables

#### API Gateway (Port 4600)
```bash
PORT=4600
RIDE_SERVICE_URL=http://khaimove-ride-service:4601
FLEET_SERVICE_URL=http://khaimove-fleet-service:4602
DELIVERY_SERVICE_URL=http://khaimove-delivery-service:4603
LOGISTICS_SERVICE_URL=http://khaimove-logistics-aggregator:4604
RENTAL_SERVICE_URL=http://khaimove-rental-service:4605
BUZZLOCAL_SERVICE_URL=http://buzzlocal-rides:4606
```

#### Ride Service (Port 4601)
```bash
PORT=4601
MONGODB_URI=mongodb://.../khaimove_rides
```

#### Airzy Gateway (Port 4500)
```bash
PORT=4500
AIRZY_FLIGHT_URL=http://airzy-flight-service:4501
AIRZY_LOUNGE_URL=http://airzy-lounge-service:4502
# ... etc for all Airzy services
```

---

## Docker Deployment

### docker-compose.yml

```yaml
version: '3.8'

services:
  # ============================================
  # CORE KHAIRMOVE SERVICES
  # ============================================

  khaimove-api-gateway:
    build: ./khaimove-api-gateway
    ports:
      - "4600:4600"
    environment:
      - NODE_ENV=production
      - PORT=4600
      - CORS_ORIGINS=${CORS_ORIGINS}
      - INTERNAL_SERVICE_TOKEN=${INTERNAL_SERVICE_TOKEN}
      - REZ_INTELLIGENCE_API_KEY=${REZ_INTELLIGENCE_API_KEY}
      - RIDE_SERVICE_URL=http://khaimove-ride-service:4601
      - FLEET_SERVICE_URL=http://khaimove-fleet-service:4602
      - DELIVERY_SERVICE_URL=http://khaimove-delivery-service:4603
      - LOGISTICS_SERVICE_URL=http://khaimove-logistics-aggregator:4604
      - RENTAL_SERVICE_URL=http://khaimove-rental-service:4605
      - BUZZLOCAL_SERVICE_URL=http://buzzlocal-rides:4606
    depends_on:
      - khaimove-ride-service
      - khaimove-fleet-service
 healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4600/health"]
      interval: 30s
      timeout: 10s
      retries: 3
 restart: unless-stopped

  khaimove-ride-service:
    build: ./khaimove-ride-service
    ports:
      - "4601:4601"
    environment:
      - NODE_ENV=production
      - PORT=4601
      - MONGODB_URI=${MONGODB_URI}/khaimove_rides
      - JWT_SECRET=${JWT_SECRET}
      - INTERNAL_SERVICE_TOKEN=${INTERNAL_SERVICE_TOKEN}
      - REZ_INTELLIGENCE_API_KEY=${REZ_INTELLIGENCE_API_KEY}
      - AUTH_SERVICE_URL=${AUTH_SERVICE_URL}
      - WALLET_SERVICE_URL=${WALLET_SERVICE_URL}
      - NOTIFICATION_SERVICE_URL=${NOTIFICATION_SERVICE_URL}
    depends_on:
      - mongodb
      - redis
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4601/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped

  khaimove-fleet-service:
    build: ./khaimove-fleet-service
    ports:
      - "4602:4602"
    environment:
      - NODE_ENV=production
      - PORT=4602
      - MONGODB_URI=${MONGODB_URI}/khaimove_fleet
      - JWT_SECRET=${JWT_SECRET}
      - INTERNAL_SERVICE_TOKEN=${INTERNAL_SERVICE_TOKEN}
      - REZ_INTELLIGENCE_API_KEY=${REZ_INTELLIGENCE_API_KEY}
    depends_on:
      - mongodb
    restart: unless-stopped

  khaimove-delivery-service:
    build: ./khaimove-delivery-service
    ports:
      - "4603:4603"
    environment:
      - NODE_ENV=production
      - PORT=4603
      - MONGODB_URI=${MONGODB_URI}/khaimove_delivery
      - JWT_SECRET=${JWT_SECRET}
      - INTERNAL_SERVICE_TOKEN=${INTERNAL_SERVICE_TOKEN}
    depends_on:
      - mongodb
    restart: unless-stopped

  khaimove-logistics-aggregator:
    build: ./khaimove-logistics-aggregator
    ports:
      - "4604:4604"
    environment:
      - NODE_ENV=production
      - PORT=4604
      - MONGODB_URI=${MONGODB_URI}/khaimove_logistics
      - INTERNAL_SERVICE_TOKEN=${INTERNAL_SERVICE_TOKEN}
      - DELHIVERY_API_KEY=${DELHIVERY_API_KEY}
      - BLUEDART_API_KEY=${BLUEDART_API_KEY}
      - DTDC_API_KEY=${DTDC_API_KEY}
    depends_on:
      - mongodb
    restart: unless-stopped

  khaimove-rental-service:
    build: ./khaimove-rental-service
    ports:
      - "4605:4605"
    environment:
      - NODE_ENV=production
      - PORT=4605
      - MONGODB_URI=${MONGODB_URI}/khaimove_rental
      - JWT_SECRET=${JWT_SECRET}
      - INTERNAL_SERVICE_TOKEN=${INTERNAL_SERVICE_TOKEN}
    depends_on:
      - mongodb
    restart: unless-stopped

  buzzlocal-rides:
    build: ./buzzlocal-rides-integration
    ports:
      - "4606:4606"
    environment:
      - NODE_ENV=production
      - PORT=4606
      - MONGODB_URI=${MONGODB_URI}/buzzlocal
      - JWT_SECRET=${JWT_SECRET}
      - INTERNAL_SERVICE_TOKEN=${INTERNAL_SERVICE_TOKEN}
    depends_on:
      - mongodb
    restart: unless-stopped

  # ============================================
  # AIRZY AIRPORT ECOSYSTEM
  # ============================================

  airzy-api-gateway:
    build: ./airzy/airzy-api-gateway
    ports:
      - "4500:4500"
    environment:
      - NODE_ENV=production
      - PORT=4500
      - CORS_ORIGINS=${CORS_ORIGINS}
      - JWT_SECRET=${JWT_SECRET}
      - INTERNAL_SERVICE_TOKEN=${INTERNAL_SERVICE_TOKEN}
      - AIRZY_FLIGHT_URL=http://airzy-flight-service:4501
      - AIRZY_LOUNGE_URL=http://airzy-lounge-service:4502
      - AIRZY_ITINERARY_URL=http://airzy-itinerary-service:4503
      - AIRZY_WALLET_URL=http://airzy-wallet-extension:4504
      - AIRZY_AI_URL=http://airzy-ai-brain:4505
      - AIRZY_CORP_URL=http://airzy-corp-service:4506
      - AIRZY_HOTEL_URL=http://airzy-hotel-extension:4507
      - AIRZY_TRANSFER_URL=http://airzy-transfer-extension:4508
      - AIRZY_DOOH_URL=http://airzy-dooh-extension:4509
    depends_on:
      - airzy-flight-service
      - airzy-lounge-service
    restart: unless-stopped

  airzy-flight-service:
    build: ./airzy/airzy-flight-service
    ports:
      - "4501:4501"
    environment:
      - NODE_ENV=production
      - PORT=4501
      - MONGODB_URI=${MONGODB_URI}/airzy_flights
      - JWT_SECRET=${JWT_SECRET}
      - AMADEUS_API_KEY=${AMADEUS_API_KEY}
      - AMADEUS_API_SECRET=${AMADEUS_API_SECRET}
    depends_on:
      - mongodb
    restart: unless-stopped

  airzy-lounge-service:
    build: ./airzy/airzy-lounge-service
    ports:
      - "4502:4502"
    environment:
      - NODE_ENV=production
      - PORT=4502
      - MONGODB_URI=${MONGODB_URI}/airzy_lounges
      - JWT_SECRET=${JWT_SECRET}
      - DREAMFOLKS_API_KEY=${DREAMFOLKS_API_KEY}
    depends_on:
      - mongodb
    restart: unless-stopped

  # ... additional Airzy services follow same pattern

  # ============================================
  # INFRASTRUCTURE
  # ============================================

  mongodb:
    image: mongo:7.0
    ports:
      - "27017:27017"
    environment:
      - MONGO_INITDB_ROOT_USERNAME=${MONGO_USER}
      - MONGO_INITDB_ROOT_PASSWORD=${MONGO_PASSWORD}
      - MONGO_INITDB_DATABASE=khaimove
    volumes:
      - mongodb_data:/data/db
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  mongodb_data:
  redis_data:
```

---

## Kubernetes Deployment

### namespace.yaml

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: khaimove
  labels:
    app: khaimove
```

### deployment.yaml (example for ride-service)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: khaimove-ride-service
  namespace: khaimove
spec:
  replicas: 3
  selector:
    matchLabels:
      app: khaimove-ride-service
  template:
    metadata:
      labels:
        app: khaimove-ride-service
    spec:
      containers:
        - name: ride-service
          image: khaimove/ride-service:latest
          ports:
            - containerPort: 4601
          env:
            - name: NODE_ENV
              value: "production"
            - name: PORT
              value: "4601"
            - name: MONGODB_URI
              valueFrom:
                secretKeyRef:
                  name: khaimove-secrets
                  key: mongodb-uri
            - name: JWT_SECRET
              valueFrom:
                secretKeyRef:
                  name: khaimove-secrets
                  key: jwt-secret
            - name: INTERNAL_SERVICE_TOKEN
              valueFrom:
                secretKeyRef:
                  name: khaimove-secrets
                  key: internal-token
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /health/live
              port: 4601
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health/ready
              port: 4601
            initialDelaySeconds: 5
            periodSeconds: 5
```

---

## Secrets Management

### Generate Secure Secrets

```bash
# Generate JWT secret (32 bytes)
openssl rand -hex 32

# Generate internal token (32 bytes)
openssl rand -hex 32

# Generate API keys
openssl rand -hex 16
```

### Kubernetes Secrets

```bash
kubectl create secret generic khaimove-secrets \
  --from-literal=mongodb-uri="mongodb://user:pass@host:27017" \
  --from-literal=jwt-secret="$(openssl rand -hex 32)" \
  --from-literal=internal-token="$(openssl rand -hex 32)" \
  --from-literal=redis-password="$(openssl rand -hex 16)" \
  --namespace=khaimove
```

---

## Monitoring & Observability

### Health Check Endpoints

All services expose:
- `GET /health` - Basic health check
- `GET /health/live` - Liveness probe
- `GET /health/ready` - Readiness probe (checks dependencies)

### Prometheus Metrics

```yaml
# Add to deployment
metrics:
  enabled: true
  port: 9090
  path: /metrics
```

### Log Aggregation

All services output structured JSON logs:
```json
{
  "timestamp": "2026-06-12T10:30:00.000Z",
  "level": "info",
  "service": "khaimove-ride-service",
  "message": "Ride created",
  "requestId": "m1abc123-def456",
  "correlationId": "m1abc123-def456",
  "rideId": "ride_123",
  "userId": "user_456"
}
```

---

## Deployment Steps

### 1. Pre-Deployment Validation

```bash
# Validate all environment variables are set
./scripts/validate-env.sh production

# Run security scan
./scripts/security-scan.sh

# Run integration tests
npm run test:integration
```

### 2. Database Migration

```bash
# Run pending migrations
npm run migrate:up

# Verify migration status
npm run migrate:status
```

### 3. Deploy Services

```bash
# Pull latest images
docker-compose pull

# Start infrastructure first
docker-compose up -d mongodb redis

# Wait for health checks
./scripts/wait-for-health.sh mongodb redis

# Deploy services
docker-compose up -d

# Verify deployment
./scripts/verify-deployment.sh
```

### 4. Post-Deployment Validation

```bash
# Run smoke tests
./scripts/smoke-tests.sh

# Check all health endpoints
curl https://api.khaimove.com/health

# Verify service status
curl https://api.khaimove.com/api/status
```

---

## Rollback Procedure

### Docker

```bash
# Rollback to previous version
docker-compose pull && docker-compose up -d

# Or specify version
docker-compose pull khaimove-ride-service:1.0.0
docker-compose up -d khaimove-ride-service
```

### Kubernetes

```bash
# Rollback deployment
kubectl rollout undo deployment/khaimove-ride-service -n khaimove

# Check rollout status
kubectl rollout status deployment/khaimove-ride-service -n khaimove
```

---

## Performance Tuning

### Recommended Settings

| Service | Memory | CPU | Replicas |
|---------|--------|-----|----------|
| API Gateway | 512Mi | 500m | 3 |
| Ride Service | 1Gi | 1000m | 5 |
| Fleet Service | 512Mi | 500m | 3 |
| Delivery Service | 512Mi | 500m | 3 |
| Logistics | 512Mi | 500m | 2 |

### Rate Limiting

Default rate limits applied:
- Global: 100 requests/minute
- Auth endpoints: 5 requests/minute
- OTP verification: 3 attempts/15 minutes
- Write operations: 20 requests/minute

---

## Troubleshooting

### Common Issues

#### Service Won't Start
```bash
# Check logs
docker-compose logs khaimove-ride-service

# Verify environment
docker-compose exec khaimove-ride-service env | grep -E "^(NODE_ENV|PORT|MONGODB)"

# Check health
curl http://localhost:4601/health
```

#### Database Connection Failed
```bash
# Verify MongoDB is running
docker-compose ps mongodb

# Check connection
docker-compose exec mongodb mongosh --eval "db.adminCommand('ping')"

# Verify credentials
docker-compose exec khaimove-ride-service printenv MONGODB_URI
```

#### CORS Errors
```bash
# Verify CORS_ORIGINS is set
echo $CORS_ORIGINS

# Check allowed origins in response
curl -I https://api.khaimove.com/health
# Look for Access-Control-Allow-Origin header
```

---

## Security Checklist

- [ ] All secrets generated with `openssl rand -hex 32`
- [ ] No default passwords in use
- [ ] CORS_ORIGINS set to specific domains (no wildcards)
- [ ] Rate limiting enabled on all endpoints
- [ ] JWT secrets unique per environment
- [ ] MongoDB authentication enabled
- [ ] Redis password set
- [ ] TLS/SSL configured for all external endpoints
- [ ] Security headers enabled (HSTS, CSP, etc.)
- [ ] No sensitive data in logs
- [ ] API keys rotated regularly

---

**Document Version:** 1.0.0
**Last Updated:** June 12, 2026
**Maintainer:** KHAIRMOVE Engineering Team
