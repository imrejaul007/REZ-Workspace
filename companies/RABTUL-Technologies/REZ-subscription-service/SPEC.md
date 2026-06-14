# REZ Subscription Service - SPEC.md

**Version:** 1.0.0
**Port:** (see config)
**Company:** RABTUL-Technologies
**Category:** Core

---

## Overview

Subscription and recurring billing service. Manages subscription plans, billing cycles, payment collection, dunning (payment retry), and subscription lifecycle events.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                REZ Subscription Service                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  Components:                                                                │
│  ├── Plan Manager   → Subscription plans and pricing                    │
│  ├── Billing Engine → Recurring billing cycles                        │
│  ├── Payment Collector → Automatic payment collection                  │
│  └── Dunning Worker → Payment retry logic                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Models

### Subscription
```typescript
{
  subscriptionId: string
  userId: string
  planId: string
  status: 'active' | 'paused' | 'cancelled' | 'past_due'
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelledAt?: Date
  createdAt: Date
}
```

### Plan
```typescript
{
  planId: string
  name: string
  description: string
  price: number
  currency: string
  interval: 'monthly' | 'yearly'
  features: string[]
  trialDays: number
}
```

---

## API Endpoints

### Subscriptions
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/subscriptions` | Create subscription |
| GET | `/subscriptions/:id` | Get subscription |
| PUT | `/subscriptions/:id` | Update subscription |
| POST | `/subscriptions/:id/cancel` | Cancel subscription |
| POST | `/subscriptions/:id/pause` | Pause subscription |
| POST | `/subscriptions/:id/resume` | Resume subscription |

### Plans
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/plans` | List plans |
| GET | `/plans/:id` | Get plan |
| POST | `/plans` | Create plan |

### Billing
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/subscriptions/:id/invoices` | List invoices |
| GET | `/invoices/:id` | Get invoice |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |

---

## Dependencies

```json
{
  "express": "^4.18.2",
  "mongoose": "^8.2.0",
  "ioredis": "^5.3.2",
  "axios": "^1.6.7",
  "winston": "^3.11.0",
  "zod": "^3.22.4",
  "node-cron": "^3.0.3",
  "helmet": "^7.1.0",
  "cors": "^2.8.5"
}
```

---

## Status

- [x] Subscription management
- [x] Plan management
- [x] Billing cycles
- [x] Payment collection
- [x] Dunning
- [x] Invoice generation
