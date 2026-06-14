# REZ Corporate Service - SPEC.md

**Version:** 1.0.0
**Port:** (see config)
**Company:** CorpPerks
**Category:** Corporate

---

## Overview

Central orchestration service for corporate features including HRIS integration, corporate card management, GST compliance, travel booking, and expense management.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     REZ Corporate Service                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  Services:                                                                │
│  ├── HRIS Integration → Employee sync (GreytHR, BambooHR, Zoho)          │
│  ├── Card Service    → Virtual corporate cards (Razorpay)               │
│  ├── GST Service     → e-Invoice, IRN, GSTR-2B                         │
│  ├── Travel Service  → Hotel/flight booking (TBO)                      │
│  └── Budget/Expense  → Budget enforcement, expense tracking              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Models

### Company
```typescript
{
  companyId: string
  name: string
  gstin: string
  hrisConnected: boolean
  cardProgramActive: boolean
  travelPolicy: string
  budgetAllocation: Record<string, number>
}
```

### Employee
```typescript
{
  employeeId: string
  companyId: string
  email: string
  name: string
  department: string
  designation: string
  cardId?: string
  benefitsBalance: number
  syncedAt: Date
}
```

### CorporateCard
```typescript
{
  cardId: string
  employeeId: string
  virtualNumber: string
  dailyLimit: number
  monthlyLimit: number
  mccRestrictions: string[]
  status: 'active' | 'blocked' | 'expired'
}
```

### GSTInvoice
```typescript
{
  invoiceId: string
  irn?: string
  gstNumber: string
  items: { description: string; hsn: string; amount: number; cgst: number; sgst: number }[]
  totalAmount: number
  ewbNumber?: string
  status: 'draft' | 'irn_generated' | 'signed' | 'cancelled'
}
```

---

## API Endpoints

### HRIS
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/corporate/hris/connections` | Create connection |
| POST | `/api/corporate/hris/connections/:id/sync` | Sync employees |
| GET | `/api/corporate/employees/:companyId` | List employees |

### Cards
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/corporate/cards` | Create virtual card |
| GET | `/api/corporate/cards/company/:companyId` | Company cards |
| POST | `/api/corporate/cards/:id/block` | Block card |
| GET | `/api/corporate/cards/transactions/:companyId` | Transactions |

### GST
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/corporate/gst/invoices` | Create invoice |
| POST | `/api/corporate/gst/invoices/:id/irn` | Generate IRN |
| POST | `/api/corporate/gst/reconcile/:companyId` | GSTR-2B match |

### Travel
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/corporate/travel/hotels/search` | Search hotels |
| POST | `/api/corporate/travel/requests` | Create request |
| POST | `/api/corporate/travel/requests/:id/approve` | Approve |
| POST | `/api/corporate/travel/bookings/hotel` | Book hotel |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |

---

## Dependencies

```json
{
  "axios": "^1.6.0",
  "bcryptjs": "^2.4.3",
  "cors": "^2.8.5",
  "express": "^4.18.2",
  "helmet": "^8.0.0",
  "jsonwebtoken": "^9.0.2",
  "mongoose": "^8.23.1",
  "node-cron": "^3.0.3",
  "pdfkit": "^0.14.0",
  "uuid": "^9.0.0",
  "winston": "^3.11.0",
  "xlsx": "^0.18.5"
}
```

---

## Status

- [x] HRIS integration
- [x] Corporate cards
- [x] GST e-Invoice
- [x] Travel booking
- [x] Budget/expense management

