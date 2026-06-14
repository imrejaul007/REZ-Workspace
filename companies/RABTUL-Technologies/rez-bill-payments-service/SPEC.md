# REZ Bill Payments Service - SPEC.md

**Version:** 1.0.0
**Port:** (see config)
**Company:** RABTUL-Technologies
**Category:** Finance

---

## Overview

Bill payment service for utility bills, mobile recharges, DTH, and other recurring payments. Integrates with bill payment aggregators for wide coverage.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                   REZ Bill Payments Service                               │
├─────────────────────────────────────────────────────────────────────────────┤
│  Components:                                                                │
│  ├── Bill Fetcher   → Fetch bills from providers                      │
│  ├── Payment Processor → Process bill payments                       │
│  ├── Operator Aggregator → Mobile/DTH operators                      │
│  └── History Manager → Payment history tracking                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Models

### Bill
```typescript
{
  billId: string
  userId: string
  provider: string
  category: 'utility' | 'mobile' | 'dth' | 'internet'
  amount: number
  dueDate: Date
  status: 'pending' | 'paid' | 'overdue'
}
```

### Payment
```typescript
{
  paymentId: string
  billId: string
  amount: number
  status: 'success' | 'failed'
  operatorRef?: string
  processedAt: Date
}
```

---

## API Endpoints

### Bills
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/bills/fetch` | Fetch bill |
| GET | `/bills/:id` | Get bill details |
| GET | `/bills` | List bills |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/payments` | Pay bill |
| GET | `/payments/:id` | Get payment status |

### Operators
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/operators` | List mobile operators |
| GET | `/operators/:id/plans` | Get recharge plans |

### Recharge
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/recharge` | Mobile/DTH recharge |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |

---

## Dependencies

```json
{
  "express": "^4.18.2",
  "mongoose": "^8.0.0",
  "helmet": "^7.1.0",
  "cors": "^2.8.5",
  "express-rate-limit": "^7.1.5",
  "@sentry/node": "^7.92.0"
}
```

---

## Bill Categories

| Category | Examples |
|----------|----------|
| utility | Electricity, Water, Gas |
| mobile | Prepaid/Postpaid |
| dth | Tata Sky, Dish TV |
| internet | Broadband bills |

---

## Status

- [x] Bill fetching
- [x] Bill payment
- [x] Mobile recharge
- [x] DTH recharge
- [x] Payment history
