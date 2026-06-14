# REZ Delivery Service - SPEC.md

**Version:** 1.0.0
**Port:** 4009
**Company:** RABTUL-Technologies
**Category:** Core

---

## Overview

Unified delivery management system aggregating multiple delivery aggregators. Provides real-time tracking, driver assignment, and delivery orchestration across multiple providers.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      REZ Delivery Service                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  Components:                                                                │
│  ├── Order Manager    → Delivery order lifecycle                         │
│  ├── Driver Tracker  → Real-time driver positions                        │
│  ├── Aggregator Hub → Multi-provider integration                         │
│  ├── ETA Calculator  → Delivery time estimation                          │
│  └── WebSocket Server → Real-time tracking updates                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### Deliveries
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/deliveries` | Create delivery |
| GET | `/api/deliveries/:id` | Get delivery |
| PUT | `/api/deliveries/:id` | Update delivery |
| DELETE | `/api/deliveries/:id` | Cancel delivery |

### Tracking
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/deliveries/:id/track` | Get live tracking |
| GET | `/api/drivers/:id/location` | Get driver location |

### Drivers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/drivers/nearby` | Find nearby drivers |
| POST | `/api/drivers/:id/assign` | Assign to delivery |

### Webhooks
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/webhook/driver-location` | Driver location update |
| POST | `/webhook/delivery-status` | Status updates |

---

## Dependencies

```json
{
  "express": "^4.18.2",
  "mongoose": "^8.0.3",
  "ioredis": "^5.3.2",
  "socket.io": "^4.7.2",
  "bullmq": "^5.1.0",
  "axios": "^1.6.0",
  "helmet": "^7.1.0",
  "winston": "^3.11.0"
}
```

---

## Integration Points

| Service | Direction | Purpose |
|---------|-----------|---------|
| REZ Order Service | Read | Order details |
| REZ Catalog | Read | Product info |
| REZ Notifications | Write | Delivery alerts |
| External Aggregators | Read/Write | Driver tracking |

---

## Status

- [x] Delivery CRUD
- [x] Driver assignment
- [x] Real-time tracking
- [x] WebSocket updates
- [x] Multi-aggregator support
- [ ] ETA optimization
