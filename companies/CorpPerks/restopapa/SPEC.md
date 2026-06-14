# ReStopapa - SPEC.md

**Version:** 1.0.0
**Port:** (see config)
**Company:** CorpPerks
**Category:** Food & Beverage

---

## Overview

B2B restaurant platform for corporate meal programs. Manages restaurant partnerships, employee meal orders, vendor relationships, and integrates with nextaBizz for inventory procurement.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ReStopapa                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│  Modules:                                                                  │
│  ├── Restaurant Management → Partner restaurants                         │
│  ├── Employee Portal     → Meal ordering and benefits                    │
│  ├── Payment Processing  → Razorpay integration                          │
│  ├── Inventory Webhooks → Sends to nextaBizz                           │
│  └── Marketplace         → Corporate meal marketplace                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Models

### Restaurant
```typescript
{
  restaurantId: string
  name: string
  address: string
  menu: MenuItem[]
  operatingHours: Record<string, { open: string; close: string }>
  status: 'active' | 'inactive'
  gstin?: string
}
```

### Order
```typescript
{
  orderId: string
  restaurantId: string
  employeeId: string
  companyId: string
  items: { itemId: string; quantity: number; price: number }[]
  totalAmount: number
  status: 'pending' | 'confirmed' | 'preparing' | 'delivered' | 'cancelled'
  createdAt: Date
}
```

---

## Webhook Events (to nextaBizz)

| Event | Description |
|-------|-------------|
| `inventory.low_stock` | Stock below threshold |
| `inventory.out_of_stock` | No stock |
| `inventory.stock_updated` | Stock changed |
| `order.status_changed` | Order status update |

---

## Dependencies

```json
{
  "concurrently": "^8.2.2"
}
```

---

## Status

- [x] Restaurant management
- [x] Employee meal orders
- [x] Payment processing
- [x] Inventory webhooks
- [x] Marketplace

