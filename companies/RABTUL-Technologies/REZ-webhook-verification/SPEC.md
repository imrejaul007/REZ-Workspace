# REZ Webhook Verification - SPEC.md

**Version:** 1.0.0
**Port:** (see config)
**Company:** RABTUL-Technologies
**Category:** Security

---

## Overview

Centralized webhook signature verification service. Provides HMAC verification for all incoming webhooks from external services (Razorpay, WooCommerce, etc.).

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                REZ Webhook Verification                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  Components:                                                                │
│  ├── Signature Verifier → HMAC verification                             │
│  ├── Event Deduplicator → Redis-based deduplication                     │
│  └── Payload Validator  → Schema validation                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### Verification
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/verify` | Verify webhook signature |
| POST | `/verify/batch` | Verify batch of events |

### Providers
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/providers` | Register provider |
| GET | `/providers` | List providers |
| DELETE | `/providers/:id` | Remove provider |

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
  "winston": "^3.11.0",
  "zod": "^3.22.4",
  "jsonwebtoken": "^9.0.2",
  "helmet": "^7.1.0",
  "cors": "^2.8.5"
}
```

---

## Supported Providers

| Provider | Signature Header |
|----------|------------------|
| Razorpay | X-Razorpay-Signature |
| WooCommerce | X-WC-Webhook-Signature |
| Custom | X-Custom-Signature |

---

## Status

- [x] HMAC verification
- [x] Event deduplication
- [x] Schema validation
- [x] Provider management
