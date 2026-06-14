# REZ Order Service - SPEC.md

**Version:** 1.0.0
**Port:** 4006
**Company:** RABTUL-Technologies
**Category:** Core

---

## Overview

Order lifecycle management service. Handles order creation, status transitions, cancellation, bill splitting, and real-time order streams via SSE. Manages the complete order state machine from placement to delivery.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        REZ Order Service                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  Components:                                                                │
│  ├── Order Manager     → CRUD, state machine, cursor pagination           │
│  ├── Bill Splitter    → Split payments between users                      │
│  ├── SSE Stream       → Real-time order updates for merchants             │
│  ├── Intent Capture   → Order lifecycle events for ML                    │
│  └── Integration      → Webhooks for support, marketing, ads            │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Models

### Order
```typescript
{
  orderNumber: string          // e.g., ORD-XXXXXXXXXXXX
  status: OrderStatus         // placed | confirmed | preparing | ready | dispatched | out_for_delivery | delivered | cancelled | refunded
  user: ObjectId
  store: ObjectId
  merchant: ObjectId
  items: OrderItem[]
  totals: { subtotal, total, tax, discount, deliveryFee }
  payment: { method, status, amount }
  delivery: { type, address?, status }
  currency: string
  timeline: TimelineEntry[]
  clientIdempotencyKey?: string
  couponCode?: string
  coinsUsed?: object
  specialInstructions?: string
  createdAt: Date
  updatedAt: Date
}
```

### BillSplit
```typescript
{
  orderId: ObjectId
  storeId: ObjectId
  totalAmount: number
  splits: SplitEntry[]
  status: 'pending' | 'partial' | 'settled'
}
```

### OrderStatus
```
placed → confirmed → preparing → ready → dispatched → out_for_delivery → delivered
         ↓
      cancelled

delivered → returned → refunded
```

---

## API Endpoints

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/orders` | Create new order |
| GET | `/orders` | List orders (cursor pagination) |
| GET | `/orders/:id` | Get single order |
| PATCH | `/orders/:id/status` | Update order status (state-machine enforced) |
| POST | `/orders/:id/cancel` | Cancel order |
| GET | `/orders/stream` | SSE stream for merchant dashboard |
| GET | `/orders/stats/:merchantId` | Order statistics |
| GET | `/orders/summary/:userId` | User order summary (30d) |

### Bill Split
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/orders/:id/split` | Create bill split |
| GET | `/orders/:id/splits` | Get split details |
| PATCH | `/orders/:id/splits/:personId/settle` | Settle person's share |
| GET | `/orders/:id/splits/summary` | Per-person summary |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Basic health check |
| GET | `/health/ready` | Readiness probe (MongoDB + Redis) |
| GET | `/health/detailed` | Detailed health with latency |
| GET | `/metrics` | Prometheus metrics |

---

## Dependencies

```json
{
  "express": "^4.21.2",
  "mongoose": "^8.23.1",
  "bullmq": "^5.0.0",
  "ioredis": "^5.3.0",
  "helmet": "^8.1.0",
  "cors": "^2.8.5",
  "compression": "^1.7.4",
  "winston": "^3.11.0",
  "zod": "^3.23.6",
  "uuid": "^9.0.0",
  "prom-client": "^15.1.0",
  "@sentry/node": "^8.0.0"
}
```

---

## Integration Points

| Service | Direction | Purpose |
|---------|-----------|---------|
| REZ Intent Graph | Write | Order lifecycle events |
| REZ Care Service | Write | Order created/status webhooks |
| REZ Merchant Intelligence | Write | Marketing conversions |
| REZ Ads Service | Write | Ad attribution |
| RABTUL Wallet | Read | Balance checks |
| RABTUL Catalog | Read | Product inventory |

---

## Status

- [x] Order CRUD
- [x] State machine enforcement
- [x] Cursor-based pagination
- [x] Idempotency key support
- [x] Bill splitting
- [x] SSE real-time updates
- [x] MongoDB change streams
- [x] Rate limiting
- [x] CORS protection
