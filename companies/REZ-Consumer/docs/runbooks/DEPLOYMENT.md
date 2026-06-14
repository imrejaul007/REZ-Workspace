# Deployment Runbook

## Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- Kubernetes (for production)

### Local Development

```bash
# Clone repository
git clone https://github.com/imrejaul007/rez-app-consumer.git
cd rez-app-consumer

# Install dependencies
npm install

# Start backend services
docker-compose up -d

# Start mobile app
cd rez-app
npx expo start
```

### Production Deployment

```bash
# Build Docker images
docker-compose -f docker-compose.prod.yml build

# Deploy to Kubernetes
kubectl apply -f k8s-deployment.yaml

# Check status
kubectl get pods -n rez-consumer
```

---

## Backend Services

### Start Individual Service

```bash
# go4food-api
cd go4food-api
npm install
npm run dev

# REZ-inbox
cd REZ-inbox
npm install
npm run dev

# REZ-assistant
cd REZ-assistant
npm install
npm run dev
```

### Service Ports

| Service | Port |
|---------|------|
| go4food-api | 3002 |
| REZ-inbox | 3003 |
| REZ-assistant | 3010 |
| REZ-nearby | 3015 |
| REZ-scan | 3016 |
| safe-qr-service | 4001 |
| verify-qr-service | 4003 |

---

## Health Checks

```bash
# Check service health
curl http://localhost:3002/health
curl http://localhost:3003/health
curl http://localhost:3010/health
```

---

## Rollback

```bash
# Rollback to previous version
kubectl rollout undo deployment/rez-consumer-services

# Check rollback status
kubectl rollout status deployment/rez-consumer-services
```
