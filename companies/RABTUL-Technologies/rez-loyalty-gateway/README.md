# REZ Loyalty Gateway

**Federated API for Coins, Wallet, and Loyalty Systems**

Version: 1.0.0 | Port: 4601

---

## Overview

REZ Loyalty Gateway is a federated service that provides a unified API for all loyalty-related operations across the REZ ecosystem. It aggregates balances from multiple services, routes operations to the correct source-of-truth, and maintains hybrid tier information.

### Key Features

- ✅ **Unified Balance** - Single API to get all coin types (REZ, PROMO, BRANDED, PRIVE, CASHBACK, REFERRAL)
- ✅ **Smart Routing** - Auto-routes earn/redeem to the correct service based on coin type
- ✅ **Hybrid Tiers** - Combines REZ standard tiers with Prive premium overlay
- ✅ **Event-Driven Sync** - Real-time synchronization via Redis pub/sub
- ✅ **Circuit Breaker** - Graceful degradation when backend services fail
- ✅ **Legacy Support** - Full backward compatibility with alias normalization

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         REZ CONSUMER APP                                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│              REZ LOYALTY GATEWAY (Port 4601)                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐  │
│  │ Balance         │  │  Tier Manager   │  │  Coin Sync Engine           │  │
│  │ Aggregator      │  │  (Hybrid REZ +  │  │  (Redis pub/sub consumer)   │  │
│  │                 │  │    Prive)       │  │                             │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
            │                    │                    │
            ▼                    ▼                    ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ REZ-unified-     │  │   Restaurant     │  │   Prive Service  │
│ loyalty          │  │   Loyalty        │  │   (Premium)      │
│  (Port 4602)     │  │   (REZ-Merchant) │  │   (Port 4070)    │
└──────────────────┘  └──────────────────┘  └──────────────────┘
            │                    │                    │
            ▼                    ▼                    ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ Wallet Service   │  │ Referral OS      │  │ Cashback Service │
│  (Port 4004)     │  │                  │  │                  │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

---

## Coin Types

| Coin Type | Description | Source of Truth | Spend Priority |
|-----------|-------------|-----------------|----------------|
| **REZ** | Universal platform coins | wallet-service (4004) | 6 (last) |
| **PROMO** | Limited-time bonus coins | wallet-service (4004) | 1 (first) |
| **BRANDED** | Merchant-specific coins | restaurant-loyalty | 2 |
| **PRIVE** | Premium/exclusive coins | prive-service (4070) | 3 |
| **CASHBACK** | Purchase cashback | cashback-service | 4 |
| **REFERRAL** | Referral bonuses | referral-os | 5 |

---

## API Endpoints

### Balance

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/loyalty/balance/:userId` | Get unified balance from all services |
| GET | `/api/v1/loyalty/balance/:userId/:coinType` | Get specific coin type balance |
| GET | `/api/v1/loyalty/balance/:userId/total` | Get total spendable balance |

### Earn

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/loyalty/earn` | Earn coins (auto-routes to correct service) |
| POST | `/api/v1/loyalty/earn/batch` | Batch earn for multiple users |

### Redeem

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/loyalty/redeem` | Redeem coins |
| POST | `/api/v1/loyalty/redeem/auto` | Auto-redeem using spend priority |
| GET | `/api/v1/loyalty/redeem/estimate` | Estimate redemption breakdown |

### Tiers

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/loyalty/tiers/:userId` | Get hybrid tier info (REZ + Prive) |
| GET | `/api/v1/loyalty/tiers/:userId/upgrade-preview` | Preview tier upgrade |
| GET | `/api/v1/loyalty/tiers/:userId/prive` | Get Prive eligibility |
| GET | `/api/v1/loyalty/tiers/all/rez` | Get all REZ tier configurations |
| GET | `/api/v1/loyalty/tiers/all/prive` | Get all Prive tier configurations |
| GET | `/api/v1/loyalty/tiers/compare` | Compare two tiers |

### Transactions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/loyalty/transactions/:userId` | Get unified transaction history |
| GET | `/api/v1/loyalty/transactions/:userId/summary` | Get transaction summary |

### Events

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/loyalty/events/status` | Get sync engine status |
| POST | `/api/v1/loyalty/sync/:userId` | Force sync from all services |
| GET | `/api/v1/loyalty/sync/:userId/status` | Get sync status for user |
| POST | `/api/v1/loyalty/events/test` | Test event publishing |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Basic liveness |
| GET | `/health/live` | Liveness probe |
| GET | `/health/ready` | Readiness probe (checks dependencies) |
| GET | `/health/full` | Full health check with all services |
| GET | `/health/circuit-breakers` | Circuit breaker status |

---

## API Examples

### Get Unified Balance

```bash
curl http://localhost:4601/api/v1/loyalty/balance/user123
```

Response:
```json
{
  "success": true,
  "data": {
    "userId": "user123",
    "balances": {
      "REZ": { "available": 500, "locked": 50, "lifetimeEarned": 1000 },
      "PROMO": { "available": 100, "expiresAt": "2026-12-31" },
      "BRANDED": { "available": 200, "byMerchant": {...} },
      "PRIVE": { "available": 50, "score": 75, "tier": "signature" },
      "CASHBACK": { "available": 25 },
      "REFERRAL": { "available": 100 }
    },
    "totalValueUSD": 10.50,
    "conversionRate": 1.0,
    "syncStatus": "synced"
  }
}
```

### Earn Coins

```bash
curl -X POST http://localhost:4601/api/v1/loyalty/earn \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "amount": 100,
    "coinType": "REZ",
    "source": "REZ_APP",
    "description": "Purchase reward"
  }'
```

### Redeem Coins

```bash
curl -X POST http://localhost:4601/api/v1/loyalty/redeem \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "amount": 50,
    "description": "Order discount"
  }'
```

### Get Hybrid Tier Info

```bash
curl http://localhost:4601/api/v1/loyalty/tiers/user123
```

Response:
```json
{
  "success": true,
  "data": {
    "userId": "user123",
    "rezTier": "GOLD",
    "priveTier": "signature",
    "priveScore": 75,
    "combinedMultiplier": 1.875,
    "benefits": {
      "earningMultiplier": 1.5,
      "birthdayBonus": 250,
      "freeDelivery": true
    },
    "tierProgress": 45.5,
    "coinsToNextTier": 7500,
    "nextTier": "PLATINUM"
  }
}
```

---

## Tier System

### REZ Standard Tiers

| Tier | Threshold | Earning Mult | Birthday Bonus | Max Holding |
|------|-----------|--------------|----------------|-------------|
| Bronze | 0 | 1.0x | 50 | 10,000 |
| Silver | 1,000 | 1.25x | 100 | 25,000 |
| Gold | 5,000 | 1.5x | 250 | 50,000 |
| Platinum | 20,000 | 2.0x | 500 | 100,000 |

### Prive Premium Overlay

| Tier | Score Range | Coin Mult | Monthly Bonus |
|------|------------|-----------|--------------|
| None | 0-49 | 0x | 0 |
| Entry | 50-69 | 1.0x | 0 |
| Signature | 70-84 | 1.25x | 500 |
| Elite | 85-100 | 1.5x | 1,000 |

### Combined Multiplier

The combined earning multiplier is: `REZ tier multiplier × Prive tier multiplier`

Example: Gold (1.5x) + Signature (1.25x) = **1.875x combined**

---

## Legacy Aliases

The gateway normalizes legacy coin type aliases to canonical types:

| Legacy | Canonical |
|--------|-----------|
| `nuqta`, `wasil_coins`, `karma_points` | REZ |
| `branded_coin` | BRANDED |
| `prive_coins` | PRIVE |
| `reward`, `bonus`, `promotional` | PROMO |

---

## Environment Variables

```bash
# Service
PORT=4601
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/rez_loyalty_gateway

# Redis
REDIS_URL=redis://localhost:6379

# Auth
INTERNAL_SERVICE_TOKEN=your-internal-service-token-here

# Service URLs
WALLET_SERVICE_URL=http://localhost:4004
UNIFIED_LOYALTY_URL=http://localhost:4602
PRIVE_SERVICE_URL=http://localhost:4070
RESTAURANT_LOYALTY_URL=http://localhost:4301
REFERRAL_OS_URL=http://localhost:4302
CASHBACK_SERVICE_URL=http://localhost:4303

# Sync Settings
SYNC_CACHE_TTL=300
SYNC_RETRY_ATTEMPTS=3

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB
- Redis

### Installation

```bash
cd rez-loyalty-gateway
npm install
cp .env.example .env
# Edit .env with your service URLs
```

### Development

```bash
npm run dev
```

### Production

```bash
npm run build
npm start
```

### Docker

```bash
docker build -t rez-loyalty-gateway .
docker run -p 4601:4601 --env-file .env rez-loyalty-gateway
```

---

## Circuit Breaker

The gateway uses circuit breakers for each backend service:

- **CLOSED**: Normal operation
- **OPEN**: Service unavailable, requests fail fast
- **HALF_OPEN**: Testing if service recovered

Circuit breaker trips after 5 consecutive failures and resets after 30 seconds.

---

## Event Channels

| Channel | Description |
|---------|-------------|
| `loyalty:coin:earned` | Coin earned event |
| `loyalty:coin:redeemed` | Coin redeemed event |
| `loyalty:coin:expired` | Coin expired event |
| `loyalty:tier:changed` | Tier changed event |
| `loyalty:sync:request` | Sync request |
| `loyalty:sync:response` | Sync response |

---

## Monitoring

### Health Endpoints

```bash
# Liveness
curl http://localhost:4601/health/live

# Readiness (with dependency checks)
curl http://localhost:4601/health/ready

# Full health
curl http://localhost:4601/health/full

# Circuit breakers
curl http://localhost:4601/health/circuit-breakers
```

---

## License

Proprietary - RTNM Digital