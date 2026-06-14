# REZ Payment Service - SPEC.md

**Version:** 1.0.0
**Port:** 4001
**Company:** RABTUL-Technologies
**Category:** Core

---

## Overview

Payment gateway service integrating with Razorpay for UPI, cards, net banking, and wallets. Handles payment creation, webhook verification, refunds, reconciliation, and wallet credit orchestration via BullMQ.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      REZ Payment Service                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  Components:                                                                │
│  ├── Payment Gateway   → Razorpay integration                             │
│  ├── Webhook Handler   → HMAC verification, event deduplication            │
│  ├── Refund Engine     → Partial/full refunds                             │
│  ├── Reconciliation    → Daily reconciliation jobs                         │
│  ├── Lost Coins Recovery → Recover stuck wallet credits                   │
│  └── Monolith Sync    → Sync payments to legacy system                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Models

### Payment
```typescript
{
  paymentId: string           // Razorpay payment ID
  orderId: ObjectId
  userId: ObjectId
  amount: number
  currency: string
  method: 'upi' | 'card' | 'netbanking' | 'wallet' | 'emi'
  status: 'created' | 'authorized' | 'captured' | 'failed' | 'refunded'
  razorpaySignature?: string
  walletCredited: boolean
  walletCreditTxId?: string
  metadata: Record<string, any>
  createdAt: Date
  updatedAt: Date
}
```

### Refund
```typescript
{
  refundId: string
  paymentId: string
  amount: number
  status: 'pending' | 'processed' | 'failed'
  reason?: string
  processedAt?: Date
}
```

---

## API Endpoints

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/pay/create` | Create Razorpay order |
| POST | `/pay/verify` | Verify payment signature |
| GET | `/pay/:paymentId` | Get payment details |
| POST | `/pay/:paymentId/capture` | Capture authorized payment |

### Refunds
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/pay/:paymentId/refund` | Create refund |
| GET | `/pay/:paymentId/refunds` | List refunds |

### Webhooks
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/pay/webhook/razorpay` | Razorpay webhook handler |
| POST | `/api/payment/webhook/razorpay` | Alternate webhook path |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/dlq` | DLQ admin endpoints |
| GET | `/metrics` | Prometheus metrics |
| GET | `/api-docs` | Swagger documentation |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check (separate port) |

---

## Dependencies

```json
{
  "express": "^4.18.0",
  "mongoose": "^8.23.1",
  "bullmq": "^5.4.0",
  "ioredis": "^5.3.0",
  "helmet": "^7.1.0",
  "cors": "^2.8.5",
  "compression": "^1.8.1",
  "winston": "^3.11.0",
  "zod": "^3.23.x",
  "razorpay": "^2.9.0",
  "jsonwebtoken": "^9.0.3",
  "node-cron": "^4.2.1",
  "prom-client": "^15.1.0",
  "@sentry/node": "^7.120.4",
  "swagger-ui-express": "^5.0.1",
  "uuid": "^14.0.0"
}
```

---

## Security

- HMAC-SHA256 webhook signature verification
- Event deduplication via Redis (24-hour window)
- X-Forwarded-For spoofing detection
- Internal service token authentication
- Payment state machine validation

---

## Integration Points

| Service | Direction | Purpose |
|---------|-----------|---------|
| RABTUL Wallet | Write | Credit wallet on capture |
| RABTUL Order | Write | Update order payment status |
| Razorpay | Bidirectional | Payment processing |
| Legacy Monolith | Write | Payment sync |

---

## Status

- [x] Payment creation
- [x] Webhook handling
- [x] Signature verification
- [x] Refund processing
- [x] Reconciliation jobs
- [x] Lost coins recovery
- [x] Monolith sync worker
- [x] DLQ admin
- [x] Rate limiting
