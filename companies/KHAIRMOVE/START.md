# KHAIRMOVE - Complete Setup & Start Guide

> **Status:** ✅ COMPLETE
> **Date:** May 27, 2026
> **Tests:** 16/16 Passing

---

## Quick Start (3 Commands)

```bash
cd KHAIRMOVE

# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your API keys

# 3. Start services
docker-compose up -d
```

---

## Build & Test Status

| Service | TypeScript | Build | Tests |
|---------|------------|-------|-------|
| Ride Service | ✅ Pass | ✅ Pass | ✅ 16/16 |
| Fleet Service | ✅ Pass | ✅ Pass | Pending |
| Delivery Service | ✅ Pass | ✅ Pass | Pending |
| Logistics | ✅ Pass | ✅ Pass | Pending |
| Rental Service | ✅ Pass | ✅ Pass | Pending |
| BuzzLocal | ✅ Pass | ✅ Pass | Pending |
| API Gateway | ✅ Pass | ✅ Pass | Pending |

---

## Services Overview

| Service | Port | Health | OpenAPI |
|---------|------|--------|---------|
| API Gateway | 4600 | `/health` | - |
| Ride Service | 4601 | `/health` | ✅ `src/docs/openapi.yaml` |
| Fleet Service | 4602 | `/health` | - |
| Delivery Service | 4603 | `/health` | - |
| Logistics | 4604 | `/health` | - |
| Rental Service | 4605 | `/health` | - |
| BuzzLocal | 4606 | `/health` | - |

---

## Mobile Apps

### User App
```bash
cd khaimove-user-app
npm install
npm start
```

### Driver App
```bash
cd khaimove-driver-app
npm install
npm start
```

---

## Development Commands

```bash
# All services
npm run dev

# Individual services
npm run dev:gateway    # API Gateway
npm run dev:ride       # Ride Service
npm run dev:fleet      # Fleet Service
npm run dev:delivery   # Delivery Service
npm run dev:logistics  # Logistics
npm run dev:rental     # Rental Service
npm run dev:buzzlocal  # BuzzLocal

# Build
npm run build

# Test
npm test --workspaces --if-present
```

---

## API Examples

### Get Fare Estimate
```bash
curl -X POST http://localhost:4601/api/fares/estimate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "pickup": {"lat": 12.9716, "lng": 77.5946, "address": "MG Road"},
    "drop": {"lat": 12.9350, "lng": 77.6246, "address": "Koramangala"},
    "vehicleType": "cab"
  }'
```

### Request Ride
```bash
curl -X POST http://localhost:4601/api/rides \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "pickup": {"lat": 12.9716, "lng": 77.5946},
    "drop": {"lat": 12.9350, "lng": 77.6246},
    "vehicleType": "cab"
  }'
```

---

## Fare Structure

| Vehicle | Base | Per KM | Per Min |
|---------|------|--------|---------|
| Bike | ₹15 | ₹6 | ₹1 |
| Auto | ₹25 | ₹10 | ₹1.5 |
| Cab | ₹40 | ₹14 | ₹2 |
| SUV | ₹60 | ₹18 | ₹2.5 |

**Cashback:** 10% on every ride

---

## Integrations

### REZ Intelligence
| Service | Port | Purpose |
|---------|------|---------|
| Intent Predictor | 4018 | Destination prediction |
| Signal Aggregator | 4142 | Event recording |
| Fraud Detection | 3007 | Risk assessment |
| Predictive Engine | 4123 | Driver scoring |
| Location Intel | 4040 | Surge, hot zones |
| Memory Layer | 4201 | Movement patterns |

### RABTUL Services
| Service | Port | Purpose |
|---------|------|---------|
| Auth | 4002 | JWT verification |
| Wallet | 4004 | Cashback credits |
| Notification | 4011 | Push notifications |

### Carriers
- Delhivery ✅
- BlueDart ✅
- DTDC ✅
- FedEx ✅
- DHL ✅

---

## Project Structure

```
KHAIRMOVE/
├── khaimove-api-gateway/          # Unified API entry
├── khaimove-ride-service/        # Ride-hailing engine
│   ├── src/
│   │   ├── docs/openapi.yaml    # OpenAPI spec
│   │   └── utils.ts             # Fare, distance utils
│   └── tests/
│       └── ride.service.test.ts  # 16 passing tests
├── khaimove-fleet-service/       # Fleet management
├── khaimove-delivery-service/    # Hyperlocal delivery
├── khaimove-logistics-aggregator/ # Multi-carrier shipping
├── khaimove-rental-service/      # Hourly rentals
├── buzzlocal-rides-integration/  # Community rides
├── khaimove-user-app/           # User mobile app
├── khaimove-driver-app/         # Driver mobile app
├── khaimove-admin-dashboard/     # Admin dashboard
├── shared/                      # Shared types, schemas, auth
├── docker-compose.yml           # Full deployment
├── Dockerfile                   # Multi-stage build
├── services.json                # Service registry
├── deploy.sh                    # Deployment script
└── docs/                        # Documentation
```

---

## Environment Variables

```bash
# REZ Intelligence
REZ_INTENT_URL=http://localhost:4018
REZ_SIGNAL_URL=http://localhost:4142
REZ_FRAUD_URL=http://localhost:3007
REZ_PREDICTIVE_URL=http://localhost:4123
REZ_LOCATION_URL=http://localhost:4040
REZ_MEMORY_URL=http://localhost:4201

# RABTUL
AUTH_SERVICE_URL=http://localhost:4002
WALLET_SERVICE_URL=http://localhost:4004
NOTIFICATION_SERVICE_URL=http://localhost:4011

# Security
INTERNAL_SERVICE_TOKEN=your-secure-token
REZ_INTELLIGENCE_API_KEY=your-key

# Carriers
DELHIVERY_API_KEY=your-key
BLUEDART_API_KEY=your-key
DTDC_API_KEY=your-key
FEDEX_CLIENT_ID=your-id
DHL_API_KEY=your-key
```

---

## Docker Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down

# Rebuild
docker-compose build && docker-compose up -d

# Scale a service
docker-compose up -d --scale ride-service=3
```

---

## CI/CD

GitHub Actions workflow is configured at `.github/workflows/ci.yml`:
- Lint & Type Check
- Unit Tests
- Docker Build
- Deploy to Staging/Production

---

## Git Setup

```bash
# Initialize (already done)
git init

# Add remote
git remote add origin https://github.com/your-org/KHAIRMOVE.git

# Commit
git add .
git commit -m "Initial KHAIRMOVE setup"

# Push
git push -u origin main
```

---

## Next Steps

1. ✅ Setup complete
2. ⬜ Configure `.env` with API keys
3. ⬜ Create GitHub repo and push
4. ⬜ Start REZ Intelligence services
5. ⬜ Start RABTUL services
6. ⬜ Run `docker-compose up -d`
7. ⬜ Test APIs

---

## Support

- **Docs:** `docs/`
- **API:** `khaimove-ride-service/src/docs/openapi.yaml`
- **Issues:** Create issue in GitHub repo
