# REZ Booking Service - SPEC.md

**Version:** 1.0.0
**Port:** 4020
**Company:** RABTUL-Technologies
**Category:** Core

---

## Overview

Unified booking service for hotels, travel, and experiences. Provides centralized reservation management with availability checking, pricing, and confirmation.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      REZ Booking Service                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  Components:                                                                │
│  ├── Availability Engine  → Real-time availability                        │
│  ├── Pricing Engine    → Dynamic pricing                                 │
│  ├── Reservation Manager → Booking lifecycle                             │
│  ├── Calendar Sync     → External calendar integration                    │
│  └── Confirmation Service → Email/SMS confirmations                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Booking Types

| Type | Description |
|------|-------------|
| `hotel` | Hotel room reservations |
| `travel` | Flight/train/bus tickets |
| `experience` | Tours, activities, events |
| `table` | Restaurant reservations |

---

## API Endpoints

### Availability
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/availability/search` | Search availability |
| GET | `/api/availability/:id` | Check item availability |

### Bookings
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/bookings` | Create booking |
| GET | `/api/bookings/:id` | Get booking details |
| PUT | `/api/bookings/:id` | Update booking |
| DELETE | `/api/bookings/:id` | Cancel booking |

### Confirmation
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/bookings/:id/confirm` | Confirm booking |
| POST | `/api/bookings/:id/resend` | Resend confirmation |

### Calendar
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bookings/:id/calendar` | Get booking calendar |
| POST | `/api/calendar/sync` | Sync external calendar |

---

## Dependencies

```json
{
  "express": "^4.18.2",
  "mongoose": "^8.0.0",
  "ioredis": "^5.3.0",
  "helmet": "^7.1.0",
  "joi": "^17.11.0",
  "winston": "^3.11.0",
  "axios": "^1.6.0"
}
```

---

## Integration Points

| Service | Direction | Purpose |
|---------|-----------|---------|
| REZ Payments | Write | Payment processing |
| REZ Notifications | Write | Booking confirmations |
| REZ User Profile | Read | Customer details |
| External Providers | Read | Availability/booking |

---

## Status

- [x] Availability search
- [x] Booking CRUD
- [x] Confirmation service
- [x] Calendar sync
- [x] Dynamic pricing
- [ ] Multi-provider aggregation
