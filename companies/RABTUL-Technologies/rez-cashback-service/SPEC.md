# REZ Cashback Service - SPEC.md

**Version:** 1.0.0
**Port:** (see config)
**Company:** RABTUL-Technologies
**Category:** Loyalty

---

## Overview

Cashback management service for the REZ platform. Handles cashback accrual, redemption, and tracking across transactions.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      REZ Cashback Service                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  Components:                                                                │
│  ├── Accrual Engine   → Calculate cashback on transactions               │
│  ├── Redemption Manager → Process cashback withdrawals                      │
│  ├── Balance Tracker  → Track user cashback balance                       │
│  └── Expiry Manager  → Handle cashback expiration                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### Cashback
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/cashback/accrue` | Accrue cashback |
| GET | `/api/cashback/balance/:userId` | Get balance |
| GET | `/api/cashback/history/:userId` | Get transaction history |

### Redemption
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/cashback/redeem` | Redeem cashback |
| GET | `/api/cashback/pending` | Get pending redemptions |
| POST | `/api/cashback/approve/:id` | Approve redemption |

### Settings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cashback/rates` | Get cashback rates |
| PUT | `/api/cashback/rates` | Update rates |

---

## Cashback Rules

| Transaction Type | Cashback % |
|-----------------|------------|
| Food Delivery | 5% |
| Grocery | 3% |
| Travel | 2% |
| Default | 1% |

---

## Dependencies

```json
{
  "express": "^4.18.2",
  "mongoose": "^8.0.0",
  "helmet": "^7.1.0",
  "winston": "^3.11.0",
  "express-rate-limit": "^7.1.5"
}
```

---

## Integration Points

| Service | Direction | Purpose |
|---------|-----------|---------|
| REZ Payments | Read | Transaction data |
| REZ Wallet | Write | Cashback balance |
| REZ Notifications | Write | Redemption alerts |

---

## Status

- [x] Cashback accrual
- [x] Balance tracking
- [x] Redemption processing
- [x] Transaction history
- [ ] Expiry management
