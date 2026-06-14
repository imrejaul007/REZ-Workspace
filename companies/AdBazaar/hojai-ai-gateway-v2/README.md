# Hojai AI Gateway v1.1.0

**Central AI Intelligence for AdBazaar**

---

## Quick Start

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Start server
npm start

# Or with Docker
docker-compose up
```

---

## Features

| Feature | Status |
|---------|--------|
| REZ Intelligence Integration | ✅ |
| Circuit Breakers | ✅ |
| Redis Caching | ✅ |
| Rate Limiting | ✅ |
| API Authentication | ✅ |
| Prometheus Metrics | ✅ |
| Sentry Ready | ✅ |
| Kubernetes Ready | ✅ |
| CI/CD Pipeline | ✅ |

---

## API Endpoints

### Core AI

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/intent/predict` | Predict user intent |
| POST | `/api/behavior/predict` | Predict churn/LTV |
| POST | `/api/audience/segments` | Generate audience segments |
| POST | `/api/targeting/optimize` | Optimize targeting |
| POST | `/api/campaign/predict` | Predict campaign performance |
| POST | `/api/creative/generate` | Generate ad copy |
| POST | `/api/leads/score` | Score leads |
| POST | `/api/fraud/detect` | Detect fraud |
| POST | `/api/content/personalize` | Personalize content |
| POST | `/api/action/next-best` | Next best action |
| POST | `/api/recommendations` | Get recommendations |

### Monitoring

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/ready` | Readiness check |
| GET | `/metrics` | Prometheus metrics |
| GET | `/api/circuit-breakers` | Circuit breaker status |
| GET | `/api/cache/stats` | Cache statistics |
| POST | `/api/cache/clear` | Clear cache |

---

## Environment Variables

```bash
# Service
NODE_ENV=production
PORT=4560

# REZ Intelligence
REZ_INTENT_SERVICE_URL=http://localhost:4018
REZ_PREDICTIVE_SERVICE_URL=http://localhost:4141
REZ_IDENTITY_SERVICE_URL=http://localhost:4050
REZ_SIGNAL_SERVICE_URL=http://localhost:4142
REZ_SEGMENT_SERVICE_URL=http://localhost:4126
REZ_COMMERCE_SERVICE_URL=http://localhost:4129

# Cache
REDIS_URL=redis://localhost:6379

# Auth
ADMIN_TOKEN=your-admin-token
API_KEYS=key1,key2,key3

# CORS
CORS_ORIGIN=http://localhost:3000,https://rez.money
```

---

## Deployment

### Docker

```bash
# Build image
docker build -t hojai-ai-gateway:v1.1.0 .

# Run container
docker run -p 4560:4560 \
  -e REZ_INTENT_SERVICE_URL=http://host.docker.internal:4018 \
  hojai-ai-gateway:v1.1.0
```

### Docker Compose

```bash
docker-compose up -d
```

### Kubernetes

```bash
kubectl apply -f k8s/deployment.yaml
```

---

## React Integration

```tsx
import { 
  useIntentPrediction, 
  useBehaviorPrediction, 
  useCampaignPrediction,
  IntentBadge,
  ChurnRiskBadge,
  CampaignMetrics
} from './services/dashboardClient';

// Predict user intent
const { data: intent } = useIntentPrediction('user_123');

// Predict behavior
const { data: behavior } = useBehaviorPrediction('user_123');

// Predict campaign performance
const { data: prediction } = useCampaignPrediction(50000);

// UI Components
<IntentBadge intent={intent?.intent} confidence={intent?.confidence} />
<ChurnRiskBadge risk={behavior?.churnRisk} />
<CampaignMetrics prediction={prediction} />
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENTS                                 │
│  Dashboard │ Merchant Portal │ External APIs                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   HOJAI AI GATEWAY                          │
│  Port: 4560                                               │
│  - Circuit Breakers                                        │
│  - Rate Limiting (100/min)                                 │
│  - Redis Cache                                             │
│  - API Auth                                                │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ Intent Graph  │   │ Predictive   │   │ Identity     │
│   (4018)    │   │ Engine(4141)│   │ Graph(4050) │
└───────────────┘   └───────────────┘   └───────────────┘
```

---

## Testing

```bash
# Test health
curl http://localhost:4560/health

# Test intent prediction
curl -X POST http://localhost:4560/api/intent/predict \
  -H "Content-Type: application/json" \
  -d '{"userId": "user_123"}'

# Test campaign prediction
curl -X POST http://localhost:4560/api/campaign/predict \
  -H "Content-Type: application/json" \
  -d '{"budget": 50000, "objective": "conversion"}'
```

---

## CI/CD

GitHub Actions pipeline:
1. Build & Test
2. Push to Docker Registry
3. Deploy to Kubernetes

Trigger: Push to main branch or new tag

---

## License

Proprietary - REZ Media

**Version:** 1.1.0
**Date:** 2026-05-27
