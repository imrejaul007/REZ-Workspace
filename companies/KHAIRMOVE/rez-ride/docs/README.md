# ReZ Ride - Complete Production-Ready Platform

> "Rides that pay you back"
> India's first commission-free ride-hailing platform

---

## Quick Start

```bash
# Clone and install
cd rez-ride
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Start with Docker
docker-compose up -d

# Or run locally
npm run dev

# Run tests
npm test

# Load test
k6 run k6-load-test.js
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     ReZ Ride Platform                       │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │  User App  │  │ Driver App │  │  Admin App │           │
│  │   (React  │  │  (React    │  │  (React    │           │
│  │   Native) │  │   Native)  │  │   Native)  │           │
│  └─────┬─────┘  └─────┬─────┘  └─────────────┘           │
│        │              │                                  │
│        └──────────────┼──────────────────────────────────┘
│                       │ REST + WebSocket
│  ┌────────────────────▼────────────────────────────┐     │
│  │              API Gateway (Port 4000)             │     │
│  │                                                │     │
│  │  Auth | Rides | Drivers | Fares | Surge | ... │     │
│  └────────────────────┬───────────────────────────┬─┘     │
│                       │                           │       │
│  ┌────────────────────▼────────┐  ┌────────────▼──────┐ │
│  │     Event Pipeline (Kafka)    │  │  ML Service       │ │
│  │                             │  │                  │ │
│  │  - Ride Events             │  │  - ETA Prediction │ │
│  │  - Driver Events           │  │  - Fraud Detection│ │
│  │  - Fraud Detection        │  │  - Demand Forecast│ │
│  │  - Analytics             │  │                  │ │
│  └────────────────────────────┘  └──────────────────┘ │
│                       │                               │
│  ┌────────────────────▼────────────────────────────┐     │
│  │              Data Layer                         │     │
│  │                                                │     │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐    │     │
│  │  │ MongoDB  │  │  Redis   │  │   Kafka     │    │     │
│  │  │          │  │  (GEO)   │  │  (Events)   │    │     │
│  │  └──────────┘  └──────────┘  └──────────────┘    │     │
│  └───────────────────────────────────────────────┘     │
└───────────────────────────────────────────────────────┘
                       │
┌───────────────────────▼───────────────────────────────┐
│              RABTUL Services (Shared)               │
├───────────────────────────────────────────────────────┤
│                                                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────┐  │
│  │ Auth     │  │ Wallet   │  │ Notifs  │  │ Mind  │  │
│  │ (4002)   │  │ (4004)   │  │ (4011)  │  │ (4018) │  │
│  └──────────┘  └──────────┘  └──────────┘  └───────┘  │
│                                                        │
└──────────────────────────────────────────────────────┘
```

---

## Services Overview

| Category | Services |
|----------|----------|
| **Core** | Ride, Driver, Maps, Geo |
| **Business** | Surge, Pool, Rental, Scheduled |
| **Enterprise** | Corporate, Safety, Quests, Airport |
| **Infrastructure** | Event Pipeline, ML, Command Center |
| **Integration** | Auth, Wallet, Notifications, Ads |

---

## Features

### Rider Features
- [x] Book rides (Auto/Cab/SUV)
- [x] Pool rides (30% savings)
- [x] Hourly rentals
- [x] Scheduled rides
- [x] Fare comparison
- [x] Real-time tracking
- [x] SOS emergency
- [x] Trip sharing
- [x] Gift cards & passes
- [x] 10% cashback

### Driver Features
- [x] Online/offline toggle
- [x] Driver quests & incentives
- [x] Guaranteed earnings
- [x] Weekly leaderboard
- [x] Accident insurance
- [x] Health benefits
- [x] Vehicle maintenance
- [x] Airport queue
- [x] 0% commission
- [x] Instant payouts

### Enterprise Features
- [x] Corporate billing
- [x] Employee management
- [x] GST invoicing
- [x] Budget controls
- [x] Expense reports
- [x] Multi-city support

### Platform Features
- [x] ML ETA prediction
- [x] Demand forecasting
- [x] Fraud detection
- [x] Surge pricing
- [x] Command center
- [x] Heat maps
- [x] RideCheck safety
- [x] Event pipeline

---

## Deployment

### Docker
```bash
docker-compose up -d
```

### Kubernetes
```bash
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/ingress.yaml
```

### Environment Variables
```bash
# Database
MONGODB_URI=mongodb://localhost:27017/rezride

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Auth
JWT_SECRET=your-secret-key

# Maps
GOOGLE_MAPS_API_KEY=xxx

# Twilio
TWILIO_ACCOUNT_SID=xxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+1xxx

# Razorpay
RAZORPAY_KEY_ID=xxx
RAZORPAY_KEY_SECRET=xxx

# RABTUL Services
REZ_AUTH_SERVICE_URL=http://localhost:4002
REZ_WALLET_SERVICE_URL=http://localhost:4004
REZ_NOTIFICATIONS_URL=http://localhost:4011
```

---

## Monitoring

- Prometheus metrics at `/metrics`
- Health check at `/health`
- Dashboard: `monitoring/dashboard.json`
- Alerts: `monitoring/alerts.yml`

---

## Testing

```bash
# Unit tests
npm test

# Load test
k6 run k6-load-test.js

# Check coverage
npm run test:coverage
```

---

## Files Count

| Category | Files |
|----------|-------|
| Services | 31 |
| Models | 9 |
| Routes | 21 |
| Mobile Apps | 3 |
| Docs | 10+ |
| Configs | 5 |
| **Total** | **70+** |

---

## Comparison

| Feature | Uber | ReZ Ride |
|---------|------|----------|
| Commission | 20-25% | **0%** |
| User Cashback | None | **10%** |
| Events | Kafka | Event Pipeline |
| ML | Michelangelo | ML Service |
| Command Center | Galileo | Command Center |
| Safety Checks | Ride Check | RideCheck |

---

## License

Proprietary - RABTUL Technologies
