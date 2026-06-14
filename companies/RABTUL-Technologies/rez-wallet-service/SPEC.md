# REZ Wallet Service - SPEC.md

**Version:** 1.0.0
**Port:** 4004
**Company:** RABTUL-Technologies
**Category:** Core

---

## Overview

Multi-wallet management service handling coins, balance, loyalty points, BNPL credit, corporate benefits, and savings. Supports consumer wallets, merchant wallets, credit scoring, and reconciliation.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        REZ Wallet Service                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│  Components:                                                                │
│  ├── Consumer Wallet   → User balance, coins, transactions                │
│  ├── Merchant Wallet  → Merchant earnings, payouts                       │
│  ├── Credit Engine    → BNPL, credit scores, consumer credit            │
│  ├── Referral System  → Referral verification and rewards                 │
│  ├── Savings Module   → Savings tracking and insights                     │
│  ├── CorpPerks       → Corporate benefits, GST handling                   │
│  └── Reconciliation   → Transaction reconciliation and audit              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Models

### Wallet
```typescript
{
  userId: ObjectId
  balance: number
  coins: number
  currency: string
  status: 'active' | 'suspended' | 'closed'
  tier: 'bronze' | 'silver' | 'gold' | 'platinum'
  metadata: Record<string, any>
}
```

### Transaction
```typescript
{
  walletId: ObjectId
  type: 'credit' | 'debit'
  amount: number
  balanceAfter: number
  reason: string
  reference: string
  status: 'pending' | 'completed' | 'failed'
  metadata: Record<string, any>
  createdAt: Date
}
```

### CreditScore
```typescript
{
  userId: ObjectId
  score: number
  tier: string
  factors: CreditFactor[]
  lastUpdated: Date
}
```

---

## API Endpoints

### Consumer Wallet
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/wallet/:userId` | Get wallet balance |
| POST | `/wallet/:userId/credit` | Add funds |
| POST | `/wallet/:userId/debit` | Deduct funds |
| GET | `/wallet/:userId/transactions` | Transaction history |

### Merchant Wallet
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/merchant-wallet/:merchantId` | Get merchant wallet |
| POST | `/merchant-wallet/:merchantId/payout` | Request payout |
| GET | `/merchant-wallet/:merchantId/earnings` | Earnings breakdown |

### Credit
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/credit/score/:userId` | Get credit score |
| POST | `/api/credit/apply` | Apply for BNPL |
| GET | `/api/credit/limit/:userId` | Get credit limit |

### Savings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/savings/:userId` | Get savings summary |
| GET | `/api/savings/:userId/insights` | Savings insights |
| POST | `/api/savings/:userId/goals` | Create savings goal |

### Internal
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/internal/wallet/credit` | Internal credit |
| POST | `/internal/wallet/debit` | Internal debit |
| GET | `/internal/wallet/read/:userId` | Read model query |
| GET | `/internal/reconciliation` | Reconciliation data |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Basic health check |
| GET | `/health/ready` | Readiness probe |
| GET | `/metrics` | Prometheus metrics |

---

## Dependencies

```json
{
  "express": "^4.21.2",
  "mongoose": "^8.23.1",
  "bullmq": "^5.4.0",
  "ioredis": "^5.3.0",
  "helmet": "^8.1.0",
  "cors": "^2.8.6",
  "compression": "^1.7.4",
  "winston": "^3.11.0",
  "zod": "^3.23.6",
  "jsonwebtoken": "^9.0.3",
  "axios": "^1.7.0",
  "@sentry/node": "^8.0.0",
  "swagger-ui-express": "^5.0.0"
}
```

---

## Integration Points

| Service | Direction | Purpose |
|---------|-----------|---------|
| RABTUL Payment | Write | Payment credits |
| RABTUL Auth | Read | User verification |
| REZ Care Service | Read | Support queries |
| CorpPerks | Read | Corporate benefits |

---

## Status

- [x] Consumer wallet
- [x] Merchant wallet
- [x] Coin management
- [x] Credit scoring
- [x] BNPL support
- [x] Referral verification
- [x] Savings tracking
- [x] Reconciliation
- [x] DLQ admin
- [x] CQRS read model
