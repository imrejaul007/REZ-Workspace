# REZ Merchant Loyalty Dashboard - SPEC.md

**Version:** 1.0.0
**Port:** (see config)
**Company:** RABTUL-Technologies
**Category:** Dashboard

---

## Overview

Merchant dashboard for loyalty program management. Provides analytics, customer insights, and loyalty program configuration for merchants.

---

## API Endpoints

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard/:merchantId` | Get dashboard data |
| GET | `/analytics/:merchantId` | Get analytics |

### Loyalty
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/members/:merchantId` | List loyalty members |
| POST | `/campaigns/:merchantId` | Create campaign |

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
  "axios": "^1.6.0",
  "zod": "^3.22.4"
}
```

---

## Status

- [x] Dashboard analytics
- [x] Loyalty member management
- [x] Campaign management
