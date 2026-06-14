# Revenue Network - Product Features Documentation

**Service:** Revenue Network  
**Port:** 3032  
**Location:** `core/revenue-network/`  
**Status:** ✅ PRODUCTION READY  
**Last Updated:** June 14, 2026

---

## Overview

The Revenue Network provides revenue stream orchestration and tracking across the RTMN ecosystem. It supports multiple revenue types, allocation management, and comprehensive revenue analytics.

---

## Core Features

### 1. Revenue Streams

| Feature | Description | Status |
|---------|-------------|--------|
| **Multi-Type Tracking** | Multiple revenue types | ✅ |
| **Stream Lifecycle** | Full lifecycle management | ✅ |
| **Real-Time Tracking** | Live revenue tracking | ✅ |
| **Revenue Categories** | Categorize revenue | ✅ |
| **Revenue Forecasting** | Predict future revenue | ✅ |
| **Anomaly Detection** | Detect anomalies | ✅ |

### 2. Revenue Types

| Type | Description | Examples |
|------|-------------|----------|
| **SUBSCRIPTION** | Recurring revenue | Monthly subscriptions |
| **TRANSACTION** | Per-transaction | Sales commissions |
| **LICENSE** | Software licenses | SaaS licenses |
| **ADVERTISING** | Ad revenue | Display ads |
| **REFERRAL** | Referral commissions | Affiliate revenue |
| **DATA** | Data services | Data selling |
| **SERVICE** | Service fees | Platform fees |
| **PREMIUM** | Premium features | Upsells |

### 3. Revenue Status

| Status | Description | Transitions |
|--------|-------------|-------------|
| **ACTIVE** | Active stream | → PAUSED, CANCELLED |
| **PAUSED** | Temporarily paused | → ACTIVE, CANCELLED |
| **CANCELLED** | Cancelled | → ACTIVE (renew) |
| **EXPIRED** | Past validity | → ACTIVE (renew) |
| **TRIAL** | In trial period | → ACTIVE, CANCELLED |

### 4. Allocation Engine

| Feature | Description | Status |
|---------|-------------|--------|
| **Allocation Rules** | Define rules | ✅ |
| **Revenue Split** | Split revenue | ✅ |
| **Commission Calculation** | Calculate commissions | ✅ |
| **Deduction Management** | Handle deductions | ✅ |
| **Net Revenue** | Calculate net | ✅ |
| **Allocation Reports** | Allocation reports | ✅ |

### 5. Revenue Analytics

| Feature | Description | Status |
|---------|-------------|--------|
| **MRR/ARR Tracking** | Recurring metrics | ✅ |
| **Growth Analysis** | Growth trends | ✅ |
| **Churn Analysis** | Churn metrics | ✅ |
| **LTV Calculation** | Lifetime value | ✅ |
| **Revenue Breakdown** | By type/source | ✅ |
| **Trend Analysis** | Revenue trends | ✅ |

---

## API Endpoints

### Revenue Streams

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | `/api/streams` | List streams | ✅ |
| GET | `/api/streams/:id` | Get stream | ✅ |
| POST | `/api/streams` | Create stream | ✅ |
| PUT | `/api/streams/:id` | Update stream | ✅ |
| PATCH | `/api/streams/:id/status` | Update status | ✅ |
| DELETE | `/api/streams/:id` | Delete stream | ✅ |

### Allocation

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | `/api/allocation` | Allocation overview | ✅ |
| GET | `/api/allocation/:streamId` | Stream allocation | ✅ |
| POST | `/api/allocation/rules` | Create rule | ✅ |
| PUT | `/api/allocation/rules/:id` | Update rule | ✅ |
| POST | `/api/allocation/calculate` | Calculate split | ✅ |

### Analytics

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | `/api/analytics` | Analytics overview | ✅ |
| GET | `/api/analytics/mrr` | MRR metrics | ✅ |
| GET | `/api/analytics/arr` | ARR metrics | ✅ |
| GET | `/api/analytics/growth` | Growth analysis | ✅ |
| GET | `/api/analytics/churn` | Churn analysis | ✅ |
| GET | `/api/analytics/ltv` | LTV calculation | ✅ |
| GET | `/api/analytics/breakdown` | Revenue breakdown | ✅ |

---

## File Structure

```
revenue-network/
├── src/
│   ├── index.js              # Main entry point
│   ├── config.js            # Configuration
│   └── routes/
│       ├── streams.js         # Stream management
│       ├── allocation.js      # Allocation engine
│       └── analytics.js       # Revenue analytics
├── package.json
├── Dockerfile
├── README.md
└── CLAUDE.md
```

---

## Quick Start

```bash
# Start service
cd core/revenue-network
npm install
npm start

# Health check
curl http://localhost:3032/health

# Create revenue stream
curl -X POST http://localhost:3032/api/streams \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Premium Subscription",
    "type": "SUBSCRIPTION",
    "amount": 999,
    "frequency": "monthly"
  }'

# Get allocation
curl http://localhost:3032/api/allocation/stream_123

# Get analytics
curl http://localhost:3032/api/analytics/mrr
```

---

## Use Cases

### 1. Subscription Management
Track recurring revenue.

### 2. Revenue Splitting
Split revenue between parties.

### 3. Commission Tracking
Track commissions.

### 4. Revenue Forecasting
Predict future revenue.

---

## Integration Points

| Service | Integration | Purpose |
|---------|-------------|---------|
| Commerce OS | Transaction revenue | Sales data |
| Marketplace | Transaction fees | Platform revenue |
| Agent Economy | Agent commissions | Commission tracking |
| Finance OS | Revenue recognition | Accounting |

---

*Last Updated: June 14, 2026*
