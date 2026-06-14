# Hotel Ecosystem Architecture

## Overview

The Hotel Ecosystem is a microservices architecture powering hospitality operations across discovery, booking, operations, and guest experience.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CONSUMER LAYER                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │   ReZ App   │  │  StayOwn    │  │   Habixo    │  │  Room QR    │    │
│  │  (Discovery)│  │  (Booking)  │  │  (Living)   │  │  (In-Room) │    │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘    │
└──────────┼───────────────┼───────────────┼───────────────┼──────────────┘
           │               │               │               │
           ▼               ▼               ▼               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           API GATEWAY                                       │
│                        rez-api-gateway                                      │
│                   (Authentication, Routing)                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        ▼                           ▼                           ▼
┌───────────────┐          ┌───────────────┐          ┌───────────────┐
│ STAYOWN SERVICE│          │ HABIXO SERVICE│          │  HOTEL SERVICE │
│               │          │               │          │               │
│ • Hotel search│          │ • Properties  │          │ • Room QR      │
│ • Bookings    │          │ • Matching    │          │ • Staff tasks  │
│ • Room QR     │          │ • Bookings    │          │ • Housekeeping │
│ • Pricing     │          │ • Payments    │          │ • Maintenance  │
└───────┬───────┘          └───────┬───────┘          └───────┬───────┘
        │                          │                          │
        └──────────────────────────┼──────────────────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          AI/ML LAYER                                        │
│                        rez-mind-hotel-service                               │
│         (Dynamic Pricing, Recommendations, Sentiment Analysis)             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        ▼                           ▼                           ▼
┌───────────────┐          ┌───────────────┐          ┌───────────────┐
│CHANNEL MANAGER│          │   HOTEL POS   │          │REPUTATION SRV│
│               │          │               │          │               │
│• Booking.com  │          │• Folios       │          │• Google       │
│• Airbnb       │          │• Restaurant   │          │• TripAdvisor  │
│• Agoda        │          │• Minibar      │          │• OTA reviews  │
│• MakeMyTrip   │          │• Spa/Banquet │          │• AI responses │
└───────────────┘          └───────────────┘          └───────────────┘
```

## Services

### Core Booking Services

| Service | Port | Purpose |
|---------|------|---------|
| `rez-stayown-service` | 4004 | Hotel search, booking, room QR generation |
| `rez-habixo-service` | 4005 | Short/long-term rentals, flatmate matching |
| `rez-hotel-service` | 4006 | Staff operations, housekeeping, maintenance |

### AI/ML Services

| Service | Port | Purpose |
|---------|------|---------|
| `rez-mind-hotel-service` | 4007 | Dynamic pricing, recommendations, predictions |

### Operations Services

| Service | Port | Purpose |
|---------|------|---------|
| `rez-channel-manager-service` | 4008 | OTA inventory sync, overbooking prevention |
| `rez-hotel-pos-service` | 4009 | Folio management, billing, GST invoices |
| `rez-reputation-service` | 4010 | Review aggregation, sentiment analysis |

## Data Flows

### Booking Flow
```
1. User searches hotels → rez-stayown-service
2. ReZ Mind calculates dynamic price → rez-mind-hotel-service
3. User books → rez-stayown-service creates booking
4. Booking synced to PMS → Hotel PMS
5. Availability synced to OTAs → rez-channel-manager-service
```

### Room QR Flow
```
1. Booking confirmed → rez-stayown-service generates QR
2. Guest scans QR → rez-hotel-service validates
3. Service request → rez-hotel-service routes to department
4. Staff completes task → Housekeeping/Maintenance updated
```

### In-Room Commerce Flow
```
1. Guest scans QR → Room QR interface loads
2. Guest orders service (room service, spa, etc.)
3. Order posted to folio → rez-hotel-pos-service
4. Guest checks out → Folio settled with booking
```

## Technology Stack

| Layer | Technology |
|-------|-------------|
| **Runtime** | Node.js 20+, TypeScript |
| **API** | Express.js, REST |
| **Database** | MongoDB (Mongoose ODM) |
| **Cache** | Redis |
| **Queue** | BullMQ |
| **Auth** | JWT (RS256) |
| **Logging** | Winston + Sentry |
| **Monitoring** | Prometheus + Grafana |
| **Container** | Docker |

## Service Dependencies

```
rez-stayown-service
├── MongoDB (bookings, properties)
├── Redis (cache, rate limiting)
├── rez-mind-hotel-service (pricing)
└── Hotel PMS (inventory)

rez-habixo-service
├── MongoDB (properties, bookings, profiles)
├── Redis (cache)
└── rez-mind-hotel-service (matching)

rez-hotel-service
├── MongoDB (tasks, rooms)
├── Redis (QR validation)
└── rez-stayown-service (bookings)

rez-mind-hotel-service
├── MongoDB (events, models)
├── Redis (feature cache)
└── OpenAI (predictions)

rez-channel-manager-service
├── MongoDB (sync state)
├── Redis (distributed locks)
└── OTA APIs (Booking.com, Airbnb, etc.)

rez-hotel-pos-service
├── MongoDB (folios, transactions)
├── Redis (session)
└── Hotel PMS (folio posting)

rez-reputation-service
├── MongoDB (reviews)
├── Redis (webhook deduplication)
└── OpenAI (sentiment, responses)
```

## Security

- All internal services use `X-Internal-Token` header
- JWT authentication for external API calls
- HMAC-SHA256 webhook signature verification
- Rate limiting per IP and per user
- Input validation with Zod schemas
- MongoDB parameterized queries (no injection)
