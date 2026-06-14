# ReZ Schedule Service - Universal Scheduling Platform

**Version:** 3.0.0 (Integration Edition)
**Port:** 4090
**Company:** RABTUL-Technologies
**Category:** Core
**Status:** Production Ready

---

## Overview

**Universal scheduling platform** like Calendly. Single service for:
- Salon/Clinic/Consultant appointments
- Restaurant table reservations
- HR/Professional meeting scheduling
- Group bookings and classes
- Any time-slot based booking

**Anyone can integrate** via SDKs, REST API, Widget, or Plugins.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ReZ Schedule Service                                │
├─────────────────────────────────────────────────────────────────────────────┤
│  Core Services:                                                             │
│  ├── Availability Engine     → Time-slot calculation + RRULE               │
│  ├── Booking Service         → Reservation lifecycle + idempotency          │
│  ├── Event Type Manager     → Booking types & settings                    │
│  ├── Schedule Manager       → Availability rules + RRULE                 │
│  ├── Seat Service           → Capacity management for groups/classes        │
│  ├── Waiting List Service   → Queue management for full slots             │
├─────────────────────────────────────────────────────────────────────────────┤
│  Integration Services:                                                      │
│  ├── Calendar Sync          → Google Calendar, Outlook, Apple               │
│  ├── Video Meeting         → Zoom, Google Meet, Teams, Daily.co          │
│  ├── Webhook Service       → Event-driven integrations                   │
│  ├── Notification Bridge    → RABTUL Notifications                      │
│  ├── Intelligence Bridge    → REZ Intelligence predictions               │
├─────────────────────────────────────────────────────────────────────────────┤
│  Platform Services:                                                        │
│  ├── Rate Limiting          → Token bucket algorithm                     │
│  ├── Audit Logging         → Compliance & tracking                      │
│  ├── Cache Service          → Redis-based caching                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  External Services:                                                         │
│  ├── RABTUL Auth (4002)    → User verification                         │
│  ├── RABTUL Wallet (4004)  → Payment/cashback                           │
│  ├── RABTUL Notifications  → Email/SMS/Push                            │
│  └── REZ Intelligence       → No-show prediction, recommendations        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Features (World-Class)

### Core Booking
- [x] Universal event types (appointment, reservation, class)
- [x] Timezone-aware availability calculation
- [x] Buffer time (before and after)
- [x] Minimum notice period
- [x] Maximum advance booking
- [x] Slot interval customization
- [x] RRULE-based recurring availability
- [x] Special dates (holidays, exceptions)

### Booking Types
- [x] One-on-One (individual)
- [x] Group bookings with capacity
- [x] Class/seat management
- [x] Waiting list with priority queue
- [x] Seat holds with TTL

### Location Types
- [x] In-person
- [x] Phone call
- [x] Video call (Zoom, Meet, Teams, Daily.co)
- [x] Custom link

### Customization
- [x] Custom questions (text, select, checkbox, file upload, signature)
- [x] Conditional logic for questions
- [x] Custom branding per event type
- [x] Pricing and deposits
- [x] Confirmation requirements

### Integrations
- [x] Google Calendar (bi-directional sync)
- [x] Outlook Calendar (bi-directional sync)
- [x] Apple Calendar (read-only)
- [x] Zoom meetings
- [x] Google Meet
- [x] Microsoft Teams
- [x] Daily.co video rooms
- [x] Webhooks (HMAC-SHA256 signed)
- [x] RABTUL Auth
- [x] RABTUL Wallet
- [x] RABTUL Notifications
- [x] REZ Intelligence

### Security & Compliance
- [x] Rate limiting (token bucket)
- [x] Idempotency keys
- [x] Webhook signature verification
- [x] Audit logging
- [x] CORS protection
- [x] Helmet security headers
- [x] Input validation (Zod)

### Performance
- [x] Redis-based caching
- [x] Availability slot caching
- [x] Cache invalidation on writes
- [x] Database indexes (composite)

---

## Database Schema

### Core Models

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  User ────────────────────────────────────────────────────────              │
│  ├── id, userId (RABTUL), username, name, email                        │
│  ├── timeZone, weekStartDay, bio, avatarUrl                              │
│  └── Organization link, Role, Calendar integrations                        │
│                                                                            │
│  Organization ──────────────────────────────────────────────────────────────  │
│  ├── id, name, slug, logo, primaryColor                                  │
│  └── Settings (JSON), Members, EventTypes, Webhooks                        │
│                                                                            │
│  EventType ──────────────────────────────────────────────────────────────── │
│  ├── id, slug, title, description, duration                              │
│  ├── bookingType (ONE_ON_ONE, GROUP, COLLECTIVE, ROUND_ROBIN, POOL)      │
│  ├── capacity, seatsPerSlot                                               │
│  ├── locationType, locationAddress, meetingUrl, phoneNumber                │
│  ├── requiresConfirmation, disableGuests                                  │
│  ├── maxBookingsPerDay, minNoticeMinutes, slotInterval                    │
│  ├── recurrence (RRULE), price, currency                                   │
│  ├── waitingListEnabled, waitingListCapacity                               │
│  └── CustomQuestions, Seats, WaitingList                                  │
│                                                                            │
│  Booking ─────────────────────────────────────────────────────────────────  │
│  ├── id, uid, idempotencyKey                                            │
│  ├── status (PENDING, CONFIRMED, CANCELLED, COMPLETED, NO_SHOW, WAITLISTED)│
│  ├── eventTypeId, userId (host), attendeeId                              │
│  ├── startTime, endTime, timezone                                         │
│  ├── price, paymentId, paymentStatus                                       │
│  ├── rescheduledFrom, rescheduledTo, cancellationReason                   │
│  ├── responses (custom question answers), utmData                         │
│  └── Reminders tracking                                                   │
│                                                                            │
│  Schedule ────────────────────────────────────────────────────────────────   │
│  ├── id, name, userId, isDefault                                         │
│  ├── rrule (RFC 5545), rruleStart, rruleEnd                            │
│  └── ScheduleDays (availability for each weekday)                           │
│                                                                            │
│  Seat ──────────────────────────────────────────────────────────────────   │
│  ├── id, eventTypeId, startTime, endTime                                 │
│  ├── status (AVAILABLE, RESERVED, BOOKED, WAITLISTED)                   │
│  └── bookedBy, heldBy, holdExpiresAt                                      │
│                                                                            │
│  WaitingList ────────────────────────────────────────────────────────────   │
│  ├── id, eventTypeId, requestedStart, requestedEnd                       │
│  ├── email, name, phone                                                  │
│  ├── status (waiting, notified, booked, expired)                         │
│  └── position, notifiedAt, expiresAt                                       │
│                                                                            │
│  Webhook ────────────────────────────────────────────────────────────────  │
│  ├── id, userId/organizationId, url, secret (HMAC-SHA256)              │
│  ├── triggers (booking.created, booking.cancelled, etc.)                   │
│  └── active, settings, lastTriggeredAt, failureCount                     │
│                                                                            │
│  WebhookDelivery ────────────────────────────────────────────────────────   │
│  ├── id, webhookId, eventType, eventId                                   │
│  ├── payload, responseCode, attemptCount                                 │
│  └── status (PENDING, DELIVERED, FAILED, RETRYING), nextRetryAt          │
│                                                                            │
│  AuditLog ──────────────────────────────────────────────────────────────   │
│  ├── id, action, entityType, entityId                                    │
│  ├── actorType, actorId, actorEmail                                      │
│  ├── ipAddress, userAgent, changes                                        │
│  └── createdAt                                                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### Event Types
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/event-types` | List user's event types |
| POST | `/api/event-types` | Create event type |
| GET | `/api/event-types/:id` | Get event type |
| PUT | `/api/event-types/:id` | Update event type |
| DELETE | `/api/event-types/:id` | Delete event type |
| GET | `/api/event-types/public/:username/:slug` | Public event type |

### Availability
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/event-types/:id/availability` | Get available slots |
| GET | `/api/availability/:username/:slug` | Public availability |
| POST | `/api/availability/check` | Check specific slot |

### Bookings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bookings` | List bookings |
| POST | `/api/bookings` | Create booking |
| GET | `/api/bookings/:uid` | Get booking |
| PATCH | `/api/bookings/:uid/cancel` | Cancel booking |
| PATCH | `/api/bookings/:uid/reschedule` | Reschedule booking |
| PATCH | `/api/bookings/:uid/confirm` | Confirm booking |
| PATCH | `/api/bookings/:uid/complete` | Complete booking |
| PATCH | `/api/bookings/:uid/no-show` | Mark no-show |

### Seats (Group/Class)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/seats/:eventTypeId/:date` | Get available seats |
| POST | `/api/seats/hold` | Hold a seat |
| DELETE | `/api/seats/release/:seatId` | Release held seat |

### Waiting List
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/waiting-list` | Join waiting list |
| GET | `/api/waiting-list/:eventTypeId` | Get waiting list |
| DELETE | `/api/waiting-list/:id` | Leave waiting list |

### Webhooks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/webhooks` | List webhooks |
| POST | `/api/webhooks` | Create webhook |
| GET | `/api/webhooks/:id` | Get webhook |
| DELETE | `/api/webhooks/:id` | Delete webhook |
| GET | `/api/webhooks/:id/deliveries` | Delivery history |
| POST | `/api/webhooks/:id/retry-all` | Retry failed |

### Audit
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/audit/:entityType/:entityId` | Entity audit trail |
| GET | `/api/audit/user/:userId` | User activity |
| GET | `/api/audit/stats/summary` | Audit statistics |
| POST | `/api/audit/export` | Export audit logs |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Basic health |
| GET | `/health/live` | Liveness check |
| GET | `/health/ready` | Readiness check |
| GET | `/health/detailed` | Detailed health |

### API Keys
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/api-keys` | List API keys |
| POST | `/api/api-keys` | Create API key |
| DELETE | `/api/api-keys/:id` | Delete API key |

---

## SDKs & Integrations

### Available SDKs

| SDK | Package | Status |
|-----|---------|--------|
| **JavaScript/TypeScript** | `@rez/schedule-sdk` | ✅ Ready |
| **Python** | `rez-schedule` | ✅ Ready |
| **React** | `@rez/schedule-sdk/react` | ✅ Ready |
| **Next.js** | `@rez/schedule-sdk/nextjs` | ✅ Ready |

### Integration Options

| Method | Complexity | Best For |
|--------|------------|----------|
| **Widget** | ⭐ Drop-in | Any website (WordPress, Wix, Squarespace, custom) |
| **SDK** | ⭐⭐ | React, Next.js, Node.js apps |
| **REST API** | ⭐⭐⭐ | Custom integrations |
| **Webhooks** | ⭐⭐ | Real-time notifications |
| **iFrame** | ⭐ | Strict sandboxing |

### Widget Embed

```html
<!-- Add to any website -->
<div id="booking"></div>

<script src="https://cdn.rez.money/schedule/widget.js"></script>
<script>
  ReZSchedule.init({
    container: '#booking',
    username: 'drsharma',
    slug: 'consultation',
    theme: 'light',
    primaryColor: '#6366f1'
  });
</script>
```

### WordPress Shortcode

```
[rez_schedule username="drsharma" slug="consultation" theme="dark"]
```

### iFrame Embed

```html
<iframe
  src="https://embed.rez.money/schedule/drsharma/consultation"
  width="100%" height="600"
  style="border: none; border-radius: 12px;">
</iframe>
```

### SDK Quick Start

```bash
# JavaScript
npm install @rez/schedule-sdk

# Python
pip install rez-schedule
```

```typescript
import { createClient } from '@rez/schedule-sdk';

const client = createClient({ apiKey: 'your-api-key' });

// Get availability
const { slots } = await client.availability.get({
  username: 'drsharma',
  slug: 'consultation',
  startDate: '2026-05-27',
  endDate: '2026-05-29'
});

// Create booking
const booking = await client.bookings.create({
  eventTypeId: slots[0].eventTypeId,
  startTime: slots[0].startTime,
  endTime: slots[0].endTime,
  attendeeName: 'John Doe',
  attendeeEmail: 'john@example.com'
});
```

### Rate Limits

| Plan | Requests/minute |
|------|---------------|
| Free | 60 |
| Pro | 600 |
| Enterprise | 6000 |

### Support

- **Documentation:** docs.rez.money/schedule
- **API Reference:** api.rez.money/schedule/docs
- **Support:** support@rez.money

---

## Webhook Events

| Event | Description |
|-------|-------------|
| `booking.created` | New booking created |
| `booking.confirmed` | Booking confirmed |
| `booking.cancelled` | Booking cancelled |
| `booking.rescheduled` | Booking rescheduled |
| `booking.completed` | Booking completed |
| `booking.no_show` | Marked as no-show |
| `booking.reminder_sent` | Reminder notification sent |
| `event_type.created` | New event type created |
| `event_type.updated` | Event type updated |
| `event_type.deleted` | Event type deleted |
| `availability.updated` | Availability changed |

---

## RRULE Patterns

```typescript
// Weekly on weekdays
FREQ=WEEKLY;INTERVAL=1;BYDAY=MO,TU,WE,TH,FR

// Biweekly on Monday/Wednesday
FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE

// Monthly on 15th
FREQ=MONTHLY;INTERVAL=1;BYMONTHDAY=15

// First Monday of each month
FREQ=MONTHLY;BYDAY=1MO;BYSETPOS=1
```

---

## Rate Limits

| Endpoint Type | Requests | Window |
|---------------|----------|--------|
| Default | 100 | 1 minute |
| Booking | 20 | 1 minute |
| Availability | 60 | 1 minute |
| Auth | 10 | 5 minutes |
| Search | 30 | 1 minute |

---

## Environment Variables

```bash
# Database
DATABASE_URL="postgresql://..."

# RABTUL Services
AUTH_SERVICE_URL="http://localhost:4002"
WALLET_SERVICE_URL="http://localhost:4004"
NOTIFICATION_SERVICE_URL="http://localhost:4011"
INTERNAL_SERVICE_TOKEN="..."

# REZ Intelligence
REZ_INTELLIGENCE_URL="http://localhost:4018"

# Video Providers
ZOOM_ACCOUNT_ID="..."
ZOOM_CLIENT_ID="..."
ZOOM_CLIENT_SECRET="..."
DAILY_API_KEY="..."

# Calendar Providers
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
GOOGLE_SERVICE_ACCOUNT_TOKEN="..."
OUTLOOK_CLIENT_ID="..."
OUTLOOK_CLIENT_SECRET="..."

# App
PORT=4080
NODE_ENV=development
NEXT_PUBLIC_SCHEDULE_URL="http://localhost:4080"
```

---

## Port Registry

| Service | Port | Status |
|---------|------|--------|
| api-gateway | 4000 | ✅ |
| rez-auth-service | 4002 | ✅ |
| rez-booking-service | 4020 | ✅ (Hotel/Travel) |
| **REZ-schedule-service** | **4080** | **✅ NEW** |

---

## Status

- [x] SPEC.md complete
- [x] Prisma schema (17 models)
- [x] Availability engine + RRULE
- [x] Booking service + idempotency
- [x] Event type service
- [x] Schedule service
- [x] Seat service (group/class)
- [x] Waiting list service
- [x] Webhook service + signature
- [x] Calendar sync service
- [x] Video meeting service
- [x] Rate limiting service
- [x] Audit logging service
- [x] Cache service
- [x] REST API routes
- [x] Health endpoints
- [x] Dockerfile
- [x] README

---

## License

MIT - Part of the ReZ ecosystem
