# REZ Inventory Sync Service - SPEC.md

**Version:** 1.0.0
**Port:** (see config)
**Company:** RABTUL-Technologies
**Category:** Core

---

## Overview

Unified inventory sync service for real-time synchronization across POS systems and catalog. Prevents overselling by maintaining accurate stock levels.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│               REZ Inventory Sync Service                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  Components:                                                                │
│  ├── Sync Engine   → Real-time inventory sync                           │
│  ├── POS Connector → Multiple POS system integration                   │
│  ├── Stock Manager → Stock level management                             │
│  └── Scheduler     → Periodic reconciliation                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### Inventory
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/inventory/:productId` | Get stock level |
| POST | `/sync` | Sync inventory |
| POST | `/sync/batch` | Batch sync |

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
  "ioredis": "^5.3.0",
  "axios": "^1.6.0",
  "zod": "^3.22.0",
  "winston": "^3.11.0"
}
```

---

## Status

- [x] Real-time sync
- [x] POS integration
- [x] Stock management
- [x] Reconciliation
