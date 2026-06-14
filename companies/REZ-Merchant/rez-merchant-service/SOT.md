# REZ Merchant Service - Source of Truth

**Version:** 1.0  
**Date:** May 2026

---

## Overview

Merchant management microservice handling products, orders, customers, campaigns, and business operations.

---

## Architecture

```
Merchant Service → MongoDB + Redis
                    ↓
        ┌───────────────────────────────┐
        │   REST API (3001             │
        │   ├── Products                 │
        │   ├── Orders                 │
        │   ├── Customers             │
        │   ├── Campaigns             │
        │   └── Finance               │
        └───────────────────────────────┘
                    ↓
        ┌───────────────────────────────┐
        │   External Services          │
        │   ├── RABTUL Auth          │
        │   ├── REZ Mind              │
        │   └── REZ Media            │
        └───────────────────────────────┘
```

---

## Quick Start

```bash
npm install
npm test
npm run dev
npm run build
```

---

## Tests

```bash
npm test
# 302 tests, 275 passing
```

---

## Routes

| Category | Count |
|----------|-------|
| Products | 15+ |
| Orders | 12+ |
| Customers | 8+ |
| Campaigns | 10+ |
| Finance | 15+ |
| **Total** | **170+** |

---

## Environment

| Variable | Purpose |
|----------|---------|
| PORT | Service port |
| MONGODB_URI | Database |
| REDIS_URL | Cache |
| JWT_SECRET | Token signing |
| INTERNAL_SERVICE_TOKENS_JSON | Service auth |
| CLOUDINARY_* | File storage |

---

*Updated: May 2026*
