# REZ Merchant CorpPerks Bridge - SPEC.md

**Version:** 1.0.0
**Port:** (see config)
**Company:** CorpPerks
**Category:** Integration

---

## Overview

Integration service bridging CorpPerks employee benefits with REZ-Merchant platform. Handles employee benefits management, GST invoicing, and HRIS synchronization.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              REZ Merchant CorpPerks Bridge                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│  Components:                                                                │
│  ├── Employee Sync    → HRIS data synchronization                         │
│  ├── Benefits Manager → Employee benefits handling                         │
│  ├── GST Invoice Gen → Tax invoice generation                             │
│  └── Webhook Handler  → Event processing                                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Models

### Employee
```typescript
{
  employeeId: string
  companyId: string
  email: string
  name: string
  department: string
  benefitsEligible: boolean
  syncedAt: Date
}
```

### BenefitsAllocation
```typescript
{
  allocationId: string
  employeeId: string
  benefitType: string
  amount: number
  fiscalYear: number
  utilized: number
  remaining: number
}
```

---

## API Endpoints

### Employees
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/employees/sync` | Sync employee data |
| GET | `/employees/:id` | Employee details |
| GET | `/employees/:id/benefits` | Employee benefits |

### Benefits
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/benefits/allocation/:employeeId` | Get allocation |
| POST | `/benefits/utilize` | Utilize benefit |
| GET | `/benefits/history/:employeeId` | Benefit history |

### GST
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/gst/invoice` | Generate invoice |
| GET | `/gst/invoices/:companyId` | Company invoices |

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
  "axios": "^1.6.7",
  "zod": "^3.22.4",
  "winston": "^3.11.0",
  "cors": "^2.8.5",
  "helmet": "^7.1.0",
  "jsonwebtoken": "^9.0.2"
}
```

---

## Status

- [x] Employee sync
- [x] Benefits management
- [x] GST invoicing
- [x] HRIS integration

