# StayOwn-Hospitality - Developer Guide

**Version:** 4.0.0
**Updated:** June 12, 2026

---

## OVERVIEW

StayOwn-Hospitality provides guest-facing hospitality services including hotels, vacation rentals, and AI-powered concierge. Now **fully integrated with the RTNM ecosystem**.

### RTNM Ecosystem Architecture

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                              RTNM ECOSYSTEM                                    │
│                                                                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  HOJAI   │  │  RABTUL  │  │CorpPerks │  │  Nexha   │  │  RIDZA   │   │
│  │   AI     │  │Payments  │  │   HR     │  │Commerce  │  │ Finance  │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
│       │              │              │              │              │         │
│       └──────────────┴──────────────┴──────────────┴──────────────┘         │
│                                       │                                        │
│                                       ▼                                        │
│                    ┌─────────────────────────────────────────┐                │
│                    │       STAYOWN HOTEL OS (3899)           │                │
│                    │   hotel-os-integration + rtnm-integrations │                │
│                    └─────────────────────────────────────────┘                │
│                                       │                                        │
│    ┌─────────────────────────────────┼─────────────────────────────────┐     │
│    │                                 │                                 │     │
│    ▼                                 ▼                                 ▼     │
│┌───────────┐                 ┌───────────┐                 ┌───────────┐   │
││ HOJAI     │                 │   19      │                 │   REZ     │   │
││ StayBot   │                 │  Guest    │                 │ Merchant  │   │
││  (4840)   │                 │ Services  │                 │   (PMS)   │   │
││           │                 │ 3810-3828 │                 │ 4031-4049 │   │
││ • Genie   │                 │           │                 │           │   │
││ • Memory  │                 │ Minibar   │                 │ Booking   │   │
││ • Twins   │                 │ Restaurant │                 │ Housekeep │   │
│└───────────┘                 │ Spa       │                 └───────────┘   │
│                             │ Housekeep │                                    │
│                             │ Checkout  │                                    │
│                             └───────────┘                                    │
└────────────────────────────────────────────────────────────────────────────────┘
```

---

## RTNM INTEGRATION SDK

All services use the universal RTNMHotelSDK to connect:

```typescript
// shared/rtnm-sdk/src/index.ts
import { RTNMHotelSDK } from './shared/rtnm-sdk';

const hotel = new RTNMHotelSDK({
  stayOwnUrl: 'http://localhost:3899',
  stayBotUrl: 'http://localhost:4840',
  memoryUrl: 'http://localhost:4520',
  genieUrl: 'http://localhost:4703',
  authUrl: 'http://localhost:4002',
  paymentUrl: 'http://localhost:4001',
  walletUrl: 'http://localhost:4004',
  brandPulseUrl: 'http://localhost:4770',  // Brand intelligence & sentiment
});

// Book hotel
await hotel.bookHotel({ guestId, hotelId, checkIn, checkOut });

// Flight update (Airzy)
await hotel.updateFlight({ guestId, bookingId, delayMinutes: 120 });

// Corporate booking (CorpPerks)
await hotel.createCorporateBooking({ companyId, destination, rooms: 40, guests: 80 });

// Brand reputation (BrandPulse)
const overview = await hotel.getBrandOverview('hotel-123');
const sentiment = await hotel.getSentimentTrend('hotel-123', 'day');
```

---

## SERVICES

### Core Services

| Port | Service | Purpose | Status |
|------|---------|---------|--------|
| **3800** | ai-front-desk | AI virtual concierge | ✅ v3.0 (Refactored) |
| **3007** | hotel-habixo-service | Smart Living OS (vacation rentals) | ✅ |
| **4015** | rez-stayown-service | Room QR - Guest services | ✅ |
| - | StayOwn-Mobile | Guest mobile app (Expo SDK 50) | ✅ |
| - | StayOwn-Staff-App | Staff mobile app (Expo SDK 50) | ✅ |

### RTNM Bridge Services (NEW)

| Port | Service | Purpose | Status |
|------|---------|---------|--------|
| **4841** | staybot-service-router | Central routing hub to all services | ✅ |
| **3891** | stayown-airzy-bridge | Flight tracking → hotel updates | ✅ |
| **3890** | stayown-corp-integration | CorpPerks CoPilot → corporate booking | ✅ |
| **3899** | hotel-os-integration | Unified RTNM integration layer | ✅ |

### HOJAI AI Services

| Port | Service | Purpose | Status |
|------|---------|---------|--------|
| **4840** | hojai-staybot | AI concierge with RTNM connections | ✅ |
| **4520** | hojai-memory | Guest preferences, history | ✅ |
| **4703** | hojai-genie | Personal AI with hotel booking | ✅ |

### HOJAI AI Services Currently Running (June 13, 2026)

StayOwn integrates with the following HOJAI AI services:

| Port | Service | Status | Purpose |
|------|---------|--------|---------|
| 4600 | hojai-business-copilot | ✅ RUNNING | Unified gateway (8 interfaces) |
| 4520 | hojai-memory | ✅ RUNNING | Memory infrastructure (L1-L5) |
| 4550 | hojai-expert-os | ✅ RUNNING | Agent runtime platform |
| 4700 | hojai-meeting-intelligence | ✅ RUNNING | AI meeting management |
| 4708 | genie-project-service | ✅ RUNNING | Project & task management |
| 4752 | hojai-customer-intelligence | ✅ RUNNING | Customer 360 |
| 4755 | hojai-product-intelligence | ✅ RUNNING | Product hub |
| 4756 | hojai-competitive-intelligence | ✅ RUNNING | Competitive intel |
| 4757 | hojai-revenue-intelligence | ✅ RUNNING | Revenue tracking & forecasting |
| 4242 | hojai-goal-os | ✅ RUNNING | Goal management & OKRs |
| 4244 | sutar-flow-os | ✅ RUNNING | Workflow orchestration |
| 4260 | hojai-founder-os | ✅ RUNNING | Founder tools & briefings |
| 4810 | hojai-graph | ✅ RUNNING | Knowledge graph (31 entities) |
| 4820 | hojai-workforce | ✅ RUNNING | AI employee marketplace |
| 4860 | hojai-twin | ✅ RUNNING | Digital twins |
| 4870 | hojai-board | ✅ RUNNING | AI C-Suite advisory board |
| 4241 | sutar-simulation-os | ✅ RUNNING | What-if scenarios |

**Total: 18 HOJAI AI services running**

**Verified Working:**
- ✅ Gateway health endpoint
- ✅ Chat interface (24 industries)
- ✅ Query router with intent classification
- ✅ Skills catalog
- ✅ 120+ skills across 24 industries

### RABTUL Infrastructure

| Port | Service | Purpose | Status |
|------|---------|---------|--------|
| **4002** | rez-auth | JWT, OTP, MFA | ✅ |
| **4001** | rez-payment | Razorpay, UPI, Cards | ✅ |
| **4004** | rez-wallet | REZ Loyalty, points | ✅ |

### ai-front-desk (Port 3800) - Refactored v3.0

**Architecture:**
```
src/
├── config/           # Configuration, database, logging
├── middleware/       # Auth, rate limiting, security
├── models/          # Mongoose models (Guest, Booking, etc.)
├── routes/          # Express route handlers
├── services/        # Business logic layer
├── types/           # TypeScript type definitions
├── validators/       # Request validation
└── __tests__/       # Unit tests
```

**Features:**
- Guest management
- Service requests (room service, housekeeping, concierge, taxi)
- Bookings
- AI Concierge with intent recognition
- Dashboard statistics

**API Endpoints:**
- `POST /api/guests` - Create guest
- `GET /api/guests/:id` - Get guest
- `GET /api/guests/room/:roomNumber` - Get guests by room
- `POST /api/requests` - Create service request
- `GET /api/requests` - List requests
- `POST /api/bookings` - Create booking
- `POST /api/concierge/query` - AI concierge query
- `GET /api/dashboard` - Dashboard statistics

### hotel-habixo-service (Port 3007)

**Products:**
| Product | Type | Description |
|---------|------|-------------|
| **Habixo Stay** | Short-term | Vacation rentals, hotels |
| **Habixo Rent** | Long-term | Premium rentals |
| **Habixo Match** | Social | Flatmate matching |

**API Prefix:** `/api/habixo/`

### rez-stayown-service (Port 4015)

**Features:**
- Room QR generation & validation
- Digital check-in
- WhatsApp integration
- PMS webhooks
- Pre-arrival service
- Google Hotel Ads
- SLA monitoring

---

## MOBILE APPS

### StayOwn-Mobile (Guest App)

**Tech:** Expo SDK 50, React Navigation

**Screens:**
- HomeScreen - Featured hotels, cities, offers
- SearchScreen - Hotel search with filters
- HotelDetailScreen - Hotel details, rooms
- BookingScreen - Booking flow
- CheckInScreen - Digital check-in
- ServicesScreen - Hotel services
- MessagesScreen - Chat with hotel
- MyTripsScreen - Booking history
- ProfileScreen - User profile

### StayOwn-Staff-App (Staff App)

**Tech:** Expo SDK 50, Zustand state management

**Features:**
- QR scanner (expo-camera)
- Notifications (expo-notifications)
- Location (expo-location)
- Offline support (AsyncStorage)
- Task management

---

## QUICK START

```bash
# ai-front-desk (Port 3800)
cd ai-front-desk
npm install
npm run dev

# hotel-habixo-service (Port 3007)
cd hotel-habixo-service
npm install
npm run dev

# rez-stayown-service (Port 4015)
cd rez-stayown-service
npm install
npm run dev

# Mobile apps
cd StayOwn-Mobile
npm install
npx expo start

cd StayOwn-Staff-App
npm install
npx expo start
```

---

## ENVIRONMENT VARIABLES

### ai-front-desk
```bash
PORT=3800
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/ai-front-desk
HOJAI_STAYBOT_URL=http://localhost:4840
REZ_AUTH_URL=http://localhost:4002
REZ_STAYOWN_URL=http://localhost:4015
API_KEY=your-api-key
INTERNAL_SERVICE_TOKEN=your-token
```

### hotel-habixo-service
```bash
PORT=3007
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/habixo
REDIS_HOST=localhost
REDIS_PORT=6379
REZ_AUTH_SERVICE_URL=http://localhost:4002
INTERNAL_SERVICE_TOKEN=your-token
```

### rez-stayown-service
```bash
PORT=4015
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/rez_stayown
REDIS_URI=redis://localhost:6379
```

---

## TESTING

```bash
# ai-front-desk
cd ai-front-desk
npm test                    # Run tests
npm run test:coverage      # With coverage

# hotel-habixo-service
cd hotel-habixo-service
npm test                    # Jest tests
npm run test:e2e           # Cypress tests
npm run test:load          # K6 load tests
```

---

## INTEGRATION

### RTNM Ecosystem Integration

All services connect via `RTNMHotelSDK` (shared/rtnm-sdk):

```typescript
import { RTNMHotelSDK } from './shared/rtnm-sdk';

const hotel = new RTNMHotelSDK({ stayOwnUrl: 'http://localhost:3899' });

// Hotel Booking
await hotel.bookHotel({ guestId, hotelId, checkIn, checkOut });

// Service Request
await hotel.requestService({
  serviceType: 'restaurant',
  action: 'book',
  guestId,
  data: { date: '2026-06-15', time: '7pm', guests: 2 }
});

// Checkout
await hotel.checkout('guest123', 'BOOK-1234');
```

### With HOJAI Staybot (Port 4840)

```typescript
// AI Concierge integration
POST http://localhost:4840/api/concierge
{
  "message": "I need a taxi to airport",
  "guestId": "guest-123"
}
```

### With HOJAI Genie (Port 4703) - NEW

```typescript
// Book hotel via Genie
POST http://localhost:4703/api/genie/:userId/book-hotel
{
  "destination": "Bangalore",
  "checkIn": "2026-06-15",
  "checkOut": "2026-06-17",
  "preferences": { "businessHotel": true }
}
```

### RTNM Sister Companies

| Company | Service | Purpose | Integration |
|---------|---------|---------|-------------|
| **Airzy** | Flight tracking | Chapter 2: Flight delays | stayown-airzy-bridge (3891) |
| **CorpPerks** | HR/CoPilot | Chapter 1: Corporate booking | stayown-corp-integration (3890) |
| **KHAIRMOVE** | Transport | Airport pickup | RTNMHotelSDK.requestAirportTransfer() |
| **Nexha** | Procurement | Auto-order supplies | RTNMHotelSDK.createProcurement() |
| **RIDZA** | Finance | Chapter 15: Cost analysis | RTNMHotelSDK.getFinanceAnalytics() |
| **AdBazaar** | Marketing | Chapter 12: Campaigns | RTNMHotelSDK.createMarketingCampaign() |
| **BrandPulse** | Reputation | Review tracking | RTNMHotelSDK.getBrandReputation() |

### With REZ-Merchant

| Service | Port | Purpose |
|---------|------|---------|
| rez-hotel-service | 4020 | Core hotel management |
| rez-hotel-pos-service | 4005 | F&B billing |
| rez-hotel-housekeeping | 4021 | Housekeeping tasks |
| rez-hotel-maintenance | 4019 | Maintenance |
| rez-room-service | 4043 | Room service |
| rez-mind-hotel-service | 4017 | AI intelligence |

### With RABTUL Services

| Service | Port | Purpose |
|---------|------|---------|
| REZ Auth | 4002 | Guest authentication |
| REZ Payment | 4001 | Payment processing |
| REZ Wallet | 4004 | REZ Coins, loyalty |
| REZ Notifications | 4011 | Push notifications |

---

## HEALTH CHECKS

```bash
# ai-front-desk
curl http://localhost:3800/health

# hotel-habixo-service
curl http://localhost:3007/health

# rez-stayown-service
curl http://localhost:4015/health
```

---

## SECURITY

- API key authentication for internal services
- Rate limiting (100 req/min standard, 10/min strict)
- Input validation with Zod
- Security headers with Helmet
- JWT for external authentication
- CORS with configurable origins

---

## DOCUMENTATION

| Document | Description |
|----------|-------------|
| **SOT.md** | Service registry, ports, integration map |
| **ARCHITECTURE.md** | System architecture |
| **README.md** | Service-specific documentation |
| **DEPLOYMENT-CHECKLIST.md** | Deployment guide |
| **PRODUCTION-AUDIT-DEEP.md** | Quality audit |

---

## RTNM INTEGRATION SPECS

See [shared/RTNM-INTEGRATION-SPECS.md](shared/RTNM-INTEGRATION-SPECS.md) for complete integration documentation including:
- API contracts for each RTNM company
- Webhook specifications
- Environment variables
- Testing scripts

## DOCUMENTATION INDEX

| Document | Description |
|----------|-------------|
| **CLAUDE.md** | This file - Developer guide |
| **SOT.md** | Service registry, ports, integration map |
| **ARCHITECTURE.md** | System architecture |
| **README.md** | Quick start guide |
| **DEPLOYMENT-CHECKLIST.md** | Deployment guide |
| **PRODUCTION-AUDIT-DEEP.md** | Quality audit |
| **PRODUCTION-READY.md** | Production readiness checklist |
| **INTEGRATION-GAP-ANALYSIS.md** | Gap analysis vs story requirements |
| **THE-INVISIBLE-HOTEL.md** | Complete story with RTNM integration |
| **shared/RTNM-INTEGRATION-SPECS.md** | RTNM integration specifications |
| **shared/rtnm-sdk/** | RTNM SDK for all services |

---

## LAST UPDATED

**Date:** June 12, 2026
**Version:** 4.0.0
**Changes:**
- ✅ RTNM Ecosystem integration complete
- ✅ RTNMHotelSDK created (shared/rtnm-sdk/)
- ✅ StayBot connected to all services
- ✅ Genie has hotel booking capability
- ✅ Airzy bridge created (stayown-airzy-bridge)
- ✅ CorpPerks bridge created (stayown-corp-integration)
- ✅ StayBot service router created (staybot-service-router)
- ✅ Hotel OS integration updated with RTNM routes
- ✅ Story updated with connected services (THE-INVISIBLE-HOTEL.md v3.0)
- ✅ Integration specs created (RTNM-INTEGRATION-SPECS.md)

---

## HOTEL OWNER DASHBOARD (June 14, 2026)

**Port:** 4900

Provides Ahmed's intelligence view of Pentouz Hotel operations.

### Location
`hotel-owner-dashboard/`

### Services Connected
| Service | Port | Data |
|---------|------|------|
| Property Twin | 8448 | Occupancy, ADR, RevPAR |
| Revenue Intelligence | 4757 | Revenue metrics |
| Room Twin | 8447 | Room status |
| Guest Twin | 8446 | Guest analytics |
| StayBot | 4840 | AI Concierge |
| RIDZA | 4100 | Financial |

### API Endpoints
| Endpoint | Description |
|---------|-------------|
| `/api/dashboard/overview` | Main dashboard (Ahmed's view) |
| `/api/dashboard/occupancy` | 92% occupancy |
| `/api/dashboard/revenue` | Revenue analytics |
| `/api/dashboard/pricing-recommendation` | 8% = ₹18L |

### Start
```bash
cd hotel-owner-dashboard && npm install && npm run dev
```

---

## HOJAI AI Integration

**Connected to:** HOJAI AI Business Copilot Platform
**Status:** 21/21 Services Running | June 14, 2026 🎉

### HOJAI AI Services Connected

| Port | Service | Purpose |
|------|---------|---------|
| 4600 | hojai-business-copilot | Unified gateway |
| 4002 | core/business-copilot | 24 industries |
| 4810 | hojai-graph | Knowledge graph |
| 4860 | hojai-twin | Digital twins |
| 4870 | hojai-board | AI C-Suite |
| 4520 | hojai-memory | Memory infrastructure |
| 4530 | hojai-intelligence | ML predictions |
| 4550 | hojai-expert-os | Agent runtime |
| 4580 | hojai-agent-marketplace | AI agent library |
| 4801 | hojai-command-center | Executive dashboard |
| + 11 more services | | |

### Access Points

| Service | URL |
|---------|-----|
| Business Copilot | http://localhost:4600 |
| Command Center | http://localhost:4801 |

**Last Updated:** June 14, 2026

---

## NEW SERVICES - June 14, 2026

### Hotel Owner Dashboard (Port 4900)
- Occupancy analytics (92%)
- Revenue analytics
- AI pricing recommendations
- **Pricing execution** (execute pricing changes)
- Conference demand analysis
- Food revenue tracking

### Room Preparation Service (Port 4901)
- Memory → Room Twin → Room Ready
- Guest preference preparation
- Smart Lock configuration
- Housekeeping queue

### SUTAR Orchestrator (Port 4902)
- Cross-service orchestration
- Procurement → Trust → Contract → Payment
- Pricing → Decision → Execution
- Guest → Memory → Learning

### IoT Sensor Hub (Port 4903)
- Real-time equipment monitoring
- AC vibration detection
- Failure prediction
- Maintenance Agent integration

---

## Start All Services

```bash
# Hotel Owner Dashboard
cd hotel-owner-dashboard && npm install && npm run dev

# Room Preparation
cd room-preparation-service && npm install && npm run dev

# SUTAR Orchestrator
cd stayown-sutar-orchestrator && npm install && npm run dev

# IoT Sensor Hub
cd iot-sensor-hub && npm install && npm run dev
```

---

*Last Updated: June 14, 2026*
