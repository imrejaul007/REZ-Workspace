# Z-Events Service - SPEC.md

**Version:** 1.0.0
**Port:** (see config)
**Company:** RABTUL-Technologies
**Category:** Events

---

## Overview

Local events discovery and ticketing service. Manages event listings, ticket sales, and QR code generation for event entry.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Z-Events Service                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  Components:                                                                │
│  ├── Event Manager   → Event CRUD                                       │
│  ├── Ticket Manager → Ticket sales and validation                        │
│  └── QR Generator  → QR code generation                                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Models

### Event
```typescript
{
  eventId: string
  name: string
  description: string
  location: string
  date: Date
  tickets: number
  price: number
  status: 'active' | 'cancelled'
}
```

### Ticket
```typescript
{
  ticketId: string
  eventId: string
  userId: string
  qrCode: string
  status: 'valid' | 'used' | 'cancelled'
  purchasedAt: Date
}
```

---

## API Endpoints

### Events
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/events` | Create event |
| GET | `/events` | List events |
| GET | `/events/:id` | Get event |
| PUT | `/events/:id` | Update event |

### Tickets
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/tickets/purchase` | Purchase ticket |
| GET | `/tickets/:id` | Get ticket |
| POST | `/tickets/:id/validate` | Validate ticket |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |

---

## Dependencies

```json
{
  "express": "^4.18.2",
  "mongoose": "^8.1.1",
  "qrcode": "^1.5.3",
  "axios": "^1.6.5",
  "winston": "^3.11.0"
}
```

---

## Status

- [x] Event management
- [x] Ticket sales
- [x] QR code generation
- [x] Ticket validation
