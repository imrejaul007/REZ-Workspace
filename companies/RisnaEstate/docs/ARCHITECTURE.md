# RisnaEstate - Architecture Documentation

## Overview

RisnaEstate is an AI-powered real estate commerce platform for India + UAE markets, built on the REZ ecosystem infrastructure.

**Focus:** Pre-transaction activities - lead generation, NRI/HNI intelligence, visa eligibility, referrals, and broker operations.

---

## Service Inventory

| Service | Port | Health Port | Purpose |
|---------|------|-------------|---------|
| `risna-property-service` | 4100 | 4200 | Property listings, search, management |
| `risna-lead-service` | 4101 | 4201 | Lead capture, AI scoring, NRI/HNI intelligence |
| `risna-visa-service` | 4102 | 4202 | Golden Visa eligibility engine |
| `risna-referral-service` | 4103 | 4203 | Multi-level referral & commission |
| `risna-broker-service` | 4104 | 4204 | Broker CRM, commission, teams |
| `risna-crm-service` | 4105 | 4205 | Follow-ups, site visits, WhatsApp |
| `risna-media-service` | 4106 | 4206 | Ad campaigns, influencer tracking |

---

## Directory Structure

```
RisnaEstate/
├── services/
│   ├── risna-property-service/     # Port 4100
│   ├── risna-lead-service/         # Port 4101
│   ├── risna-visa-service/         # Port 4102
│   ├── risna-referral-service/     # Port 4103
│   ├── risna-broker-service/        # Port 4104
│   ├── risna-crm-service/          # Port 4105
│   └── risna-media-service/         # Port 4106
├── shared/
│   └── risna-shared-types/         # Common TypeScript types
└── docs/
    └── ARCHITECTURE.md
```

---

## Technology Stack

- **Runtime:** Node.js + TypeScript
- **Framework:** Express.js
- **Database:** MongoDB (Mongoose ODM)
- **Cache:** Redis (ioredis)
- **Validation:** Zod
- **Logging:** Winston

---

## Integration Points

### RABTUL Services
- `rez-auth-service` (4002) - JWT authentication
- `rez-wallet-service` (4004) - Referral payouts, broker commissions
- `rez-notifications-service` (4011) - Push, SMS, WhatsApp

### REZ Intelligence
- Intent Predictor (4018)
- Signal Aggregator (4142)
- Identity Graph (4050)
- Feature Store (4127)

### Internal Services
- Property → Lead (track inquiries)
- Lead → Broker (assignment)
- Referral → Wallet (payouts)
- CRM → WhatsApp (reminders)

---

## API Conventions

### Response Format
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-05-21T00:00:00.000Z"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found"
  },
  "meta": { "timestamp": "..." }
}
```

### Authentication
- Internal: `X-Internal-Token` header
- User: `Authorization: Bearer <JWT>`

---

## Database

Each service has its own MongoDB database:
- `risna-property` → `risna-property-service`
- `risna-lead` → `risna-lead-service`
- etc.

---

## Environment Variables

```bash
# Service
PORT=4100
HEALTH_PORT=4200
SERVICE_NAME=risna-property-service

# Database
MONGODB_URI=mongodb://localhost:27017/risna-property
REDIS_URL=redis://localhost:6379

# Auth
INTERNAL_SERVICE_TOKEN=your-secure-token

# CORS
CORS_ORIGIN=https://risnaestate.com
```

---

## Health Endpoints

| Endpoint | Port | Purpose |
|----------|------|---------|
| `/health` | Main | Basic health check |
| `/health/live` | Health | Liveness probe |
| `/health/ready` | Health | Readiness probe |

---

## Development

```bash
# Install dependencies
cd services/<service-name>
npm install

# Copy environment
cp .env.example .env

# Start in dev mode
npm run dev

# Build for production
npm run build
```

---

## Status

**Phase 1-3 Complete** ✅

Services built and ready for deployment:
- Property Service
- Lead Service
- Visa Service
- Referral Service
- Broker Service
- CRM Service
- Media Service
