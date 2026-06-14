# REZ Event Bus - SPEC.md

**Version:** 1.0.0
**Port:** 4025
**Company:** RABTUL-Technologies
**Category:** Infrastructure

---

## Overview

Central event streaming backbone for the REZ ecosystem. Publishes and subscribes to domain events across all services, providing asynchronous communication and event-driven architecture support.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        REZ Event Bus                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  Event Categories:                                                         │
│  commerce.*     → Orders, payments, refunds                               │
│  identity.*     → User creation, linking                                  │
│  loyalty.*      → Points, tiers                                           │
│  engagement.*   → Page views, QR scans                                     │
│  intelligence.* → Intent, churn, predictions                              │
│  support.*      → Tickets, CSAT                                           │
│  media.*        → Ad impressions, conversions                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Event Schema

### Base Event
```typescript
{
  eventId: string
  eventType: string           // e.g., "order.created"
  category: string            // e.g., "commerce"
  source: string              // Service name
  timestamp: Date
  correlationId?: string
  userId?: string
  payload: Record<string, any>
  metadata?: Record<string, any>
}
```

---

## API Endpoints

### Publish
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/events/publish` | Publish single event |
| POST | `/events/publish/batch` | Publish multiple events |

### Subscribe
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/events/subscriptions` | List subscriptions |
| POST | `/events/subscribe` | Create subscription |
| DELETE | `/events/subscribe/:id` | Remove subscription |

### Query
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/events/:category` | Query events by category |
| GET | `/events/:category/:type` | Query specific event type |

### Schema Registry
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/schemas` | List registered schemas |
| POST | `/schemas` | Register new schema |
| GET | `/schemas/:name` | Get schema |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/metrics` | Event metrics |

---

## Event Categories

| Category | Events | Purpose |
|----------|--------|---------|
| commerce | order.*, payment.*, refund.* | Transaction lifecycle |
| identity | user.*, device.*, link.* | User management |
| loyalty | points.*, tier.*, reward.* | Loyalty programs |
| engagement | view.*, click.*, scan.* | User activity |
| intelligence | intent.*, churn.*, predict.* | ML signals |
| support | ticket.*, csat.* | Support operations |
| media | impression.*, conversion.* | Ad operations |

---

## Dependencies

```json
{
  "express": "^4.18.2",
  "mongoose": "^8.0.0",
  "ioredis": "^5.3.0",
  "axios": "^1.6.0",
  "zod": "^3.22.4",
  "dotenv": "^16.3.1"
}
```

---

## Integration Points

| Service | Direction | Purpose |
|---------|-----------|---------|
| All Services | Bidirectional | Event publishing/subscribing |
| REZ ML Services | Write | Feature events |
| REZ Care Service | Write | Support events |

---

## Status

- [x] Event publishing
- [x] Event subscription
- [x] Schema registry
- [x] Event replay
- [x] Dead letter queue
- [x] Event metrics
- [x] Correlation IDs
