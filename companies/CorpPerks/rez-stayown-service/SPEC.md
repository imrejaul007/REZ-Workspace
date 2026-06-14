# REZ StayOwn Service - SPEC.md

**Version:** 1.0.0
**Port:** (see config)
**Company:** CorpPerks
**Category:** Integration

---

## Overview

Integration service connecting CorpPerks with StayOwn hotel booking platform. Enables corporate hotel bookings and travel benefits for employees.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                   REZ StayOwn Service                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  Integrations:                                                            │
│  ├── StayOwn API     → Hotel search and booking                          │
│  ├── CorpPerks Auth → Employee authentication                           │
│  └── Benefits Engine → Eligibility checking                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Models

### HotelBooking
```typescript
{
  bookingId: string
  employeeId: string
  companyId: string
  hotelId: string
  roomType: string
  checkIn: Date
  checkOut: Date
  guests: number
  totalAmount: number
  benefitAmount: number
  status: 'pending' | 'confirmed' | 'cancelled'
}
```

---

## API Endpoints

### Hotels
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/hotels/search` | Search hotels |
| GET | `/api/hotels/:id` | Hotel details |

### Bookings
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/bookings` | Create booking |
| GET | `/api/bookings/:id` | Booking details |
| POST | `/api/bookings/:id/cancel` | Cancel booking |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |

---

## Dependencies

```json
{
  "cors": "^2.8.5",
  "express": "^4.18.2",
  "helmet": "^7.1.0",
  "express-mongo-sanitize": "^2.2.0",
  "morgan": "^1.10.0"
}
```

---

## Status

- [x] Hotel search
- [x] Booking management
- [x] Benefit integration

