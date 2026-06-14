# REZ Creator Earnings Service - SPEC.md

**Version:** 1.0.0
**Port:** (see config)
**Company:** RABTUL-Technologies
**Category:** Finance

---

## Overview

Creator earnings service for tracking and managing earnings for content creators. Handles revenue tracking, payouts, and analytics.

---

## API Endpoints

### Earnings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/earnings/:creatorId` | Get earnings |
| GET | `/earnings/:creatorId/transactions` | Transaction history |

### Payouts
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/payouts` | Request payout |
| GET | `/payouts/:id` | Get payout status |

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
  "helmet": "^7.1.0"
}
```

---

## Status

- [x] Earnings tracking
- [x] Payout management
- [x] Transaction history
