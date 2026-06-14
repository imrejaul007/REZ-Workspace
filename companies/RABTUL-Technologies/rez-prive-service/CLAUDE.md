# ReZ Prive Service

**Status:** Ready for Deployment
**Port:** 4070
**Company:** RABTUL Technologies (Shared Infrastructure)

---

## Overview

ReZ Prive Service is a microservice that provides the premium loyalty system with 6-Pillar eligibility scoring. It connects to all ReZ ecosystem services.

## Features

- **6-Pillar Eligibility Engine**: Calculate user scores across engagement, trust, influence, economic, brand affinity, and network
- **Prive Coin Management**: Award and track Prive coins
- **Tier System**: Entry → Signature → Elite progression
- **Ecosystem Integration**: Creator QR, AdBazaar, DOOH, Karma, Rendez, Intent Graph

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/eligibility` | Get user eligibility |
| GET | `/api/eligibility/pillars` | Get pillar breakdown |
| GET | `/api/coins/balance` | Get Prive coin balance |
| POST | `/api/engagement/signal` | Record engagement |
| GET | `/api/ecosystem/unified-score` | Get unified score |

## Integration Points

### Creator QR
```typescript
// Credit Prive coins on booking
POST /api/coins/credit
```

### AdBazaar
```typescript
// Check tier eligibility
GET /api/eligibility?tier=signature
```

### DOOH
```typescript
// Get user tier for content targeting
GET /api/eligibility
```

### Karma
```typescript
// Get unified score
GET /api/ecosystem/unified-score
```

## Environment Variables

```bash
PORT=4070
MONGODB_URI=mongodb://localhost:27017/rez_prive
INTERNAL_SERVICE_TOKEN=<secret>
WALLET_SERVICE_URL=https://rez-wallet-service-36vo.onrender.com
KARMA_SERVICE_URL=https://rez-karma-service.onrender.com
```

## Commands

```bash
npm install
npm run dev    # Development
npm run build  # Production build
npm start      # Start production
```

## Architecture

```
┌─────────────────────────────────────────────┐
│           ReZ Prive Service (4070)           │
├─────────────────────────────────────────────┤
│ Routes: eligibility | coins | engagement    │
├─────────────────────────────────────────────┤
│ Services:                                   │
│ • EligibilityService (6-Pillar scoring)     │
│ • CoinService (Prive coin management)         │
│ • EcosystemService (cross-service sync)       │
├─────────────────────────────────────────────┤
│ Models: PriveAccess | PriveEngagement       │
└─────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────┐
│         Connected Services                   │
├─────────────────────────────────────────────┤
│ • Wallet Service (Prive coins)               │
│ • Karma Service (unified scoring)            │
│ • Intent Graph (behavior signals)            │
│ • Creator QR (booking bonuses)               │
│ • AdBazaar (campaign targeting)             │
│ • DOOH (content targeting)                  │
└─────────────────────────────────────────────┘
```
