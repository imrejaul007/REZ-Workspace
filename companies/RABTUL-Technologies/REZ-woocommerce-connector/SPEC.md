# REZ WooCommerce Connector - SPEC.md

**Version:** 1.0.0
**Port:** 4051
**Company:** RABTUL-Technologies
**Category:** Integration

---

## Overview

Deep WooCommerce integration service handling product sync, order management, and COD (Cash on Delivery) handling. Bidirectional sync between WooCommerce and REZ platform.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 REZ WooCommerce Connector                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  Components:                                                                │
│  ├── Product Sync   → Bidirectional product synchronization               │
│  ├── Order Handler → Order import and status sync                        │
│  ├── COD Manager   → Cash on Delivery handling                           │
│  └── Webhook Handler → WooCommerce webhook processing                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### Sync
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/sync/products` | Sync products |
| POST | `/sync/orders` | Sync orders |
| GET | `/sync/status` | Get sync status |

### Webhooks
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/webhook/woocommerce` | WooCommerce webhook |

### COD
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/cod/orders` | List COD orders |
| POST | `/cod/verify` | Verify COD order |

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
  "cors": "^2.8.5"
}
```

---

## Integration Points

| Service | Direction | Purpose |
|---------|-----------|---------|
| REZ Catalog | Bidirectional | Product sync |
| RABTUL Order | Write | Order creation |
| RABTUL Payment | Write | COD verification |

---

## Status

- [x] Product sync
- [x] Order import
- [x] COD handling
- [x] Webhook processing
