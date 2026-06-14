# REZ CorpPerks Service - SPEC.md

**Version:** 2.0.0
**Port:** (see config)
**Company:** CorpPerks
**Category:** Benefits

---

## Overview

CorpPerks API Gateway - Enterprise employee benefits platform. Central hub for managing corporate perks, meal cards, wellness programs, and employee rewards.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    REZ CorpPerks Service                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  Components:                                                                │
│  ├── Benefits Gateway   → API routing and aggregation                   │
│  ├── Auth Middleware   → JWT validation                                 │
│  ├── Rate Limiter      → Request throttling                             │
│  └── Redis Cache       → Session and data caching                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Models

### BenefitPlan
```typescript
{
  planId: string
  companyId: string
  type: 'meal' | 'wellness' | 'transport' | 'fuel' | 'gift'
  allocation: number
  validity: { start: Date; end: Date }
  restrictions: {
    minTransaction?: number
    maxDaily?: number
    mccCodes?: string[]
  }
}
```

### EmployeeBenefit
```typescript
{
  benefitId: string
  employeeId: string
  planId: string
  balance: number
  utilized: number
  transactions: Transaction[]
}
```

### Transaction
```typescript
{
  transactionId: string
  employeeId: string
  benefitId: string
  amount: number
  merchantName: string
  mcc: string
  timestamp: Date
}
```

---

## API Endpoints

### Benefits
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/benefits/:employeeId` | Get employee benefits |
| GET | `/api/benefits/:employeeId/transactions` | Transaction history |
| POST | `/api/benefits/:employeeId/utilize` | Use benefit |

### Plans
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/plans/:companyId` | Company benefit plans |
| POST | `/api/plans` | Create plan |
| PUT | `/api/plans/:id` | Update plan |

### Companies
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/companies` | Register company |
| GET | `/api/companies/:id` | Company details |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |

---

## Dependencies

```json
{
  "cors": "^2.8.5",
  "express": "^4.18.2",
  "express-mongo-sanitize": "^2.2.0",
  "express-rate-limit": "^7.0.0",
  "helmet": "^7.1.0",
  "ioredis": "^5.3.0",
  "jsonwebtoken": "^9.0.0",
  "mongoose": "^8.23.1",
  "redis": "^4.6.10",
  "uuid": "^9.0.0"
}
```

---

## Status

- [x] Benefits gateway
- [x] Employee benefits
- [x] Transaction tracking
- [x] Plan management

