# StayOwn Hospitality - Source of Truth (SOT)

**GitHub:** https://github.com/imrejaul007/StayOwn-Hospitality
**Local:** StayOwn-Hospitality/
**Last Updated:** June 8, 2026
**Version:** 8.0.0

---

## Overview

**StayOwn-Hospitality** is a guest-facing hotel company that consumes services from REZ-Merchant (Hotel OS) and HOJAI Staybot (AI Brain).

**Role:** Guest-facing hotel services (not operations)
**Parent Company:** StayOwn
**Operations:** REZ-Merchant (Hotel OS)
**AI Brain:** HOJAI Staybot (Port 4840)

---

## ⚠️ CONSOLIDATION STATUS (June 8, 2026)

**HOTEL ECOSYSTEM ARCHITECTURE:**

```
REZ-Merchant (Hotel OS) ───────────────────────────────────────────────────┐
    │                                                                  │
    ├── Operations Services (20+ services)                              │
    ├── REZ Mind Hotel Service (AI)                                     │
    └── Channel Integrations                                            │
                                                                        │
HOJAI Staybot (4840) ◄───────────────────────────────────────────────────┤
    │                                                                  │
    ├── AI Employees (10): Front Desk, Concierge, Revenue, Bellhop...   │
    └── Connectors                                                      │
                                                                        │
StayOwn-Hospitality (Guest-Facing) ◄────────────────────────────────────┘
    │
    ├── ai-front-desk (3800) - AI Virtual Concierge
    ├── hotel-habixo-service (3900) - Vacation Rental Smart Living OS
    ├── rez-stayown-service (4015) - Room QR for Guest Services
    ├── StayOwn-Mobile - Guest Mobile App
    └── StayOwn-Staff-App - Staff Mobile App
```

**Key Rule:** StayOwn-Hospitality ONLY owns guest-facing services. All operations are in REZ-Merchant.

---

## COMPLETE SERVICE REGISTRY

### StayOwn-Hospitality Services (5 Services - Guest-Facing ONLY)

| Service | Port | Purpose | Status |
|---------|------|---------|--------|
| **ai-front-desk** | 3800 | AI virtual concierge for hotel guests | ✅ v3.0 (Refactored) |
| **hotel-habixo-service** | 3007 | Smart Living OS for vacation rentals | ✅ |
| **rez-stayown-service** | 4015 | Primary Room QR - Guest check-in, services | ✅ |
| **StayOwn-Mobile** | - | Guest mobile app (Expo SDK 50) | ✅ |
| **StayOwn-Staff-App** | - | Staff mobile app (Expo SDK 50) | ✅ |

---

## SERVICE DETAILS

### 1. ai-front-desk (Port 3800)

**Purpose:** AI Virtual Concierge - Voice/chat interface for hotel guests

**Features:**
- Voice AI powered by HOJAI
- Check-in/out assistance
- Room service ordering
- Concierge recommendations
- Complaint handling
- Multilingual support

**Integration:**
```
ai-front-desk → HOJAI Staybot (4840) → HOJAI Memory, Knowledge Graph
```

**Key Endpoints:**
```
POST /api/conversations        - Create conversation
GET  /api/conversations/:guestId - Get conversation
POST /api/intent              - Classify guest intent
POST /api/service-request     - Create service request
GET  /health                  - Health check
```

---

### 2. hotel-habixo-service (Port 3007)

**Purpose:** Smart Living OS for vacation rentals (Airbnb-style)

**Features:**
- Property listings management
- Guest check-in/out flow
- Smart lock integration
- Housekeeping scheduling
- Review management
- Pricing automation
- Channel manager (Airbnb, VRBO, Booking.com)
- Roommate matching (Habixo Match)

**API Prefix:** `/api/habixo/`

**Integration:**
```
hotel-habixo-service → REZ-Merchant (rez-hotel-service, rez-channel-manager)
                    → HOJAI Staybot (AI recommendations)
```

**Key Endpoints:**
```
POST /api/habixo/properties          - Create property
GET  /api/habixo/properties/:id      - Get property
POST /api/habixo/bookings            - Create booking
GET  /api/habixo/bookings/:id        - Get booking
POST /api/habixo/match/profile        - Create flatmate profile
GET  /api/habixo/trust/:entityId     - Get trust score
GET  /api/habixo/search              - Search properties
POST /api/habixo/checkin             - Guest check-in
POST /api/habixo/checkout            - Guest check-out
GET  /health                         - Health check
```

---

### 3. rez-stayown-service (Port 4015)

**Purpose:** Primary Room QR - Physical room services for hotel guests

**Features:**
- Room QR code generation and scanning
- Guest check-in via QR
- Room service ordering (food, minibar, amenities)
- Housekeeping requests
- Maintenance requests
- Digital checkout
- WhatsApp integration
- PMS webhooks for room assignment

**QR Types:**
- `guest-checkin` - Scan to check-in
- `room-service` - Scan to order services
- `housekeeping` - Scan to request cleaning
- `maintenance` - Scan to report issues
- `checkout` - Scan to checkout

**Integration:**
```
rez-stayown-service → REZ-Merchant (rez-hotel-service, rez-room-service)
                   → HOJAI Staybot (AI recommendations)
                   → RABTUL (Auth, Wallet, Payment)
```

**Key Endpoints:**
```
POST /api/room-qr/generate    - Generate room QR
GET  /api/room-qr/:id         - Get QR details
POST /api/room-qr/scan       - Scan QR (guest)
POST /api/room-qr/charge     - Add charges to folio
POST /api/pre-arrival         - Pre-arrival info
GET  /api/room-service/:roomId - Get room service menu
POST /api/digital-checkin     - Digital check-in
POST /api/webhooks/pms        - PMS webhook
GET  /health                  - Health check
```

---

### 4. StayOwn-Mobile (Expo Mobile App)

**Purpose:** Guest mobile app for hotel/vacation rental guests

**Features:**
- Booking management
- Digital keys (BLE/NFC/QR)
- Room service ordering
- Housekeeping scheduling
- In-stay messaging
- Checkout and payments
- Loyalty points
- Review submission

**Integration:**
```
StayOwn-Mobile → ai-front-desk (3800)
              → hotel-habixo-service (3900)
              → rez-stayown-service (4015)
              → REZ-Merchant (rez-guest-mobile-app)
              → HOJAI Staybot (AI)
```

---

### 5. StayOwn-Staff-App (Expo Mobile App)

**Purpose:** Staff mobile app for hotel operations

**Features:**
- Task management (housekeeping, maintenance)
- Guest communication
- Room status updates
- Offline mode support
- Real-time notifications

**Integration:**
```
StayOwn-Staff-App → REZ-Merchant (rez-hotel-housekeeping, rez-hotel-maintenance)
                 → rez-stayown-service (4015)
```

---

## INTEGRATION MAP

### With REZ-Merchant (Hotel OS)

| REZ-Merchant Service | Port | Purpose | StayOwn Usage |
|---------------------|------|---------|---------------|
| rez-hotel-service | 4020 | Core hotel management | Booking data, guest profiles |
| rez-hotel-pos-service | 4005 | F&B billing | Room service charges |
| rez-hotel-housekeeping | 4021 | Housekeeping | Task sync, room status |
| rez-hotel-maintenance | 4019 | Maintenance | Issue tracking |
| rez-guest-mobile-app | 4028 | Guest app | StayOwn-Mobile builds on this |
| rez-booking-engine | 4042 | Direct booking | Booking creation |
| rez-channel-manager | - | OTA sync | Airbnb, Booking.com |
| rez-room-service | 4043 | Room service | Menu, orders |
| rez-spa-service | 4049 | Spa bookings | Spa treatments |
| rez-laundry-service | 4048 | Laundry | Laundry orders |
| rez-dynamic-pricing | 4040 | ML pricing | Rate optimization |
| rez-multi-property | 4029 | Chain dashboard | Analytics |
| rez-mind-hotel-service | 4017 | AI intelligence | AI recommendations |

### With HOJAI Staybot (Port 4840)

**AI Employees:**
- Front Desk AI - Check-in/out assistance
- Concierge AI - Recommendations, bookings
- Revenue Manager AI - Pricing optimization
- Bellhop AI - Room service, requests
- Booking Agent - Reservation handling
- Guest Relations AI - Complaint resolution
- Reservation Manager - Booking management

**Connectors:**
- hotel-connector.ts - Connects to REZ-Merchant services

### With RABTUL Technologies

| Service | Port | Purpose |
|---------|------|---------|
| REZ Auth | 4002 | Guest authentication |
| REZ Payment | 4001 | Payment processing |
| REZ Wallet | 4004 | REZ Coins, loyalty |
| REZ Notifications | 4011 | Push notifications |

---

## ENVIRONMENT VARIABLES

### ai-front-desk
```bash
PORT=3800
NODE_ENV=development
HOJAI_STAYBOT_URL=http://localhost:4840
REZ_STAYOWN_URL=http://localhost:4015
MONGODB_URI=mongodb://localhost:27017/ai_front_desk
```

### hotel-habixo-service
```bash
PORT=3007
NODE_ENV=development
REZ_HOTEL_URL=http://localhost:4020
REZ_CHANNEL_MANAGER_URL=http://localhost:4021
MONGODB_URI=mongodb://localhost:27017/habixo
```

### rez-stayown-service
```bash
PORT=4015
NODE_ENV=development
REZ_HOTEL_SERVICE_URL=http://localhost:4020
REZ_ROOM_SERVICE_URL=http://localhost:4043
MONGODB_URI=mongodb://localhost:27017/rez_stayown
```

---

## DEPLOYMENT

### Quick Start
```bash
# Start all StayOwn services
cd /StayOwn-Hospitality

# ai-front-desk
cd ai-front-desk && npm run dev  # Port 3800

# hotel-habixo-service
cd hotel-habixo-service && npm run dev  # Port 3900

# rez-stayown-service
cd rez-stayown-service && npm run dev  # Port 4015

# Mobile apps
cd StayOwn-Mobile && npm start
cd StayOwn-Staff-App && npm start
```

### Health Checks
```bash
curl http://localhost:3800/health  # ai-front-desk
curl http://localhost:3900/health  # hotel-habixo-service
curl http://localhost:4015/health  # rez-stayown-service
```

---

## DOCUMENTATION INDEX

| Document | Description |
|----------|-------------|
| **SOT.md** | This document - Service registry |
| ARCHITECTURE.md | System architecture |
| CLAUDE.md | Claude Code context |
| README.md | Quick start guide |

---

## CHANGE LOG

| Date | Version | Changes |
|------|---------|---------|
| 2026-06-08 | 8.0.0 | CONSOLIDATION: Removed all duplicate operations services. StayOwn now only has guest-facing services (5 total). |
| 2026-06-01 | 7.0.0 | Added 6 new services |
| 2026-06-01 | 6.0.0 | Added 4040-4049 services |
| 2026-05-16 | 3.0.0 | Added QR ecosystem |
| 2026-05-14 | 2.0.0 | Added Room QR details |
| 2026-05-13 | 1.0.0 | Initial SOT |

---

## REFERENCE: REZ-MERCHANT HOTEL OS

**All hotel operations services are in:** `/REZ-Merchant/industry-os/`

| Port | Service | Purpose |
|------|---------|---------|
| 4005 | rez-hotel-pos-service | F&B billing |
| 4017 | rez-mind-hotel-service | AI intelligence |
| 4019 | rez-hotel-maintenance-service | Maintenance |
| 4020 | rez-hotel-service | Core management |
| 4021 | rez-hotel-housekeeping-service | Housekeeping |
| 4022 | rez-hotel-channel-integration | OTA |
| 4024 | rez-hotel-messaging-service | Guest messaging |
| 4025 | rez-hotel-analytics-service | Analytics |
| 4028 | rez-guest-mobile-app | Guest app |
| 4029 | rez-multi-property-dashboard | Chain dashboard |
| 4040 | rez-dynamic-pricing-service | ML pricing |
| 4042 | rez-booking-engine | Direct booking |
| 4043 | rez-room-service | F&B room service |
| 4047 | rez-gift-card-service | Gift cards |
| 4048 | rez-laundry-service | Laundry |
| 4049 | rez-spa-service | Spa bookings |

---

**Last Updated:** June 8, 2026
**Owner:** StayOwn Hospitality Team
**Version:** 8.0.0
**Status:** CONSOLIDATED - Guest-Facing Only