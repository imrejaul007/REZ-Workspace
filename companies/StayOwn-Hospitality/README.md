# ⚠️ DEPRECATED - CONSOLIDATED INTO REZ-MERCHANT

**MIGRATION COMPLETE:** June 13, 2026

All hotel services have been moved to:
👉 **REZ-Merchant/industry-os/hotel-os/**

---

# 🏨 THE INVISIBLE HOTEL (Archived)
## Autonomous AI-Driven Hotel Experience

**Version:** 1.0 | **Date:** June 11, 2026
**Status:** ⚠️ DEPRECATED - See consolidated version in REZ-Merchant

---

## OVERVIEW

"The Invisible Hotel" is RTNM Digital's vision for frictionless hospitality. Guests experience seamless service from booking to checkout, powered by AI that anticipates needs before they arise.

**Philosophy:** "The best service is no service" - The hotel should feel invisible, with AI handling everything behind the scenes.

---

## ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                    INVISIBLE HOTEL                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              INTEGRATION GATEWAY (3898)              │   │
│  │              Service Registry & Monitoring           │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                 │
│     ┌─────────────────────┼─────────────────────┐         │
│     │                     │                     │         │
│  ┌──▼──────┐  ┌──────────▼──┐  ┌──────────────▼──┐      │
│  │INVISIBLE│  │   HOJAI AI  │  │    RABTUL       │      │
│  │ HOTEL   │  │             │  │                 │      │
│  │  19 svc │  │  3 services │  │   3 services    │      │
│  └────┬────┘  └──────┬──────┘  └────────┬────────┘      │
│       │              │                  │                │
│       │    ┌─────────┴───────���─┐        │                │
│       │    │  Hotel Mobile App │        │                │
│       │    │     (3001+)       │        │                │
│       │    └───────────────────┘        │                │
│       │                                  │                │
│  ┌────▼──────────────────────────────────▼────┐          │
│  │           ADMIN DASHBOARD (3000)           │          │
│  │           Real-time Monitoring             │          │
│  └────────────────────────────────────────────┘          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## SERVICES (28 Total)

### Invisible Hotel Core (19 Services)

| Service | Port | Purpose |
|---------|------|---------|
| ai-front-desk | 3800 | AI virtual receptionist, guest management |
| minibar-service | 3810 | Smart minibar, auto-billing, inventory |
| hotel-restaurant-booking | 3811 | Restaurant reservations, table management |
| hotel-spa-booking | 3812 | Spa bookings, therapist scheduling |
| room-controls | 3814 | IoT control (AC, lights, TV, curtains) |
| parking-service | 3815 | Valet, parking management |
| lost-found | 3816 | Lost & found tracking |
| upsell-engine | 3817 | AI-powered upselling |
| loyalty-system | 3818 | REZ Rewards, points, tiers |
| review-manager | 3819 | Review collection, responses |
| feedback-survey | 3820 | Post-stay surveys |
| concierge-desk | 3821 | Human concierge requests |
| smart-lock-service | 3825 | BLE/NFC smart locks, auto-revoke |
| predictive-housekeeping | 3826 | AI housekeeping scheduling |
| zero-checkout-automation | 3827 | Auto-checkout, billing settlement |
| pre-arrival-service | 3828 | Preference collection, room prep |
| hotel-os-integration | 3899 | REZ-Merchant & HOJAI integration |
| hojai-memory-hotel | 4720 | Hotel guest memory |
| voice-hotel-agent | 4870 | Voice AI for hotel |

### HOJAI AI Services (3 Services)

| Service | Port | Purpose |
|---------|------|---------|
| hojai-staybot | 4840 | AI concierge, intent detection |
| hojai-memory | 4520 | Guest preferences, history |
| hojai-genie | 4703 | Personal AI assistant, briefings |

### RABTUL Services (3 Services)

| Service | Port | Purpose |
|---------|------|---------|
| rez-payment | 4001 | Payments (Razorpay, UPI, Cards) |
| rez-auth | 4002 | JWT, OTP, MFA |
| rez-wallet | 4004 | REZ Coins, balance, cashback |

### REZ-Merchant Services (3 Services)

| Service | Port | Purpose |
|---------|------|---------|
| rez-pms | 4031 | Property Management System |
| rez-housekeeping | 4021 | Housekeeping tasks |
| rez-booking | 4042 | Booking engine |

---

## GUEST JOURNEY

### Full Experience Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        GUEST JOURNEY                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1️⃣  PRE-BOOKING                                                │
│      └── OTA Search → AI Recommendations → Room Selection        │
│                                                                  │
│  2️⃣  BOOKING                                                    │
│      └── Payment → Confirmation → Welcome Message                │
│                                                                  │
│  3️⃣  PRE-ARRIVAL (24-48hrs before)                              │
│      └── Preference Survey → Room Prep → Welcome Setup           │
│         • Pillow type, AC temp, breakfast preferences            │
│         • AI learns from past stays                              │
│                                                                  │
│  4️⃣  CHECK-IN                                                   │
│      └── Auto Key Activation → Smart Lock → Welcome              │
│                                                                  │
│  5️⃣  STAY (Services)                                            │
│      ├── Room Control: AC, Lights, TV, Curtains                  │
│      ├── Minibar: Auto-detect, Auto-bill                         │
│      ├── Restaurant: Table reservations                          │
│      ├── Spa: Treatment booking                                  │
│      ├── Concierge: AI chat, Voice commands                       │
│      └── Housekeeping: On-demand, Predictive                     │
│                                                                  │
│  6️⃣  AI CONCIERGE (24/7)                                        │
│      └── Chat/Voice → Intent Detection → Action                  │
│                                                                  │
│  7️⃣  CHECKOUT (Zero-Touch)                                      │
│      └── Auto Billing → Loyalty Points → Lock Revoke             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## QUICK START

### Start All Services

```bash
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/StayOwn-Hospitality

# Start integration gateway first
cd integration-gateway && npm run dev &

# Start all hotel services (they auto-start from docker-compose)
docker compose -f docker-compose.invisible-hotel.yml up -d
```

### Run API Tests

```bash
# Test all services
./test-api.sh all

# Guest journey E2E
./test-api.sh guest

# AI services
./test-api.sh ai

# Payment flow
./test-api.sh payment

# Check status
./test-api.sh status
```

### Access Dashboards

| Dashboard | URL |
|-----------|-----|
| Admin Dashboard | http://localhost:3000 |
| Guest Mobile | http://localhost:3001 |
| Service Registry | http://localhost:3898/ecosystem/summary |

---

## KEY FEATURES

### 🤖 AI Concierge (HOJAI Staybot)

- Natural language understanding
- Intent detection & routing
- Multi-language support (10+ Indian languages)
- 24/7 availability
- Seamless handoff to human staff

### 🧠 Guest Memory (HOJAI Memory)

- Preference learning over time
- Cross-stay memory
- Behavioral pattern analysis
- Personalized recommendations

### 🔐 Smart Lock Integration

- BLE/NFC support (Salto, Yale, Allegion)
- Auto key activation on check-in
- Auto revocation on checkout
- Access logs

### 💡 Room Control (IoT)

- AC: Temperature, mode, fan speed
- Lights: On/off, brightness, scenes
- TV: Power, channel, volume
- Curtains: Open/close/half
- MQTT integration

### 🍺 Smart Minibar

- Auto-detection of item removal
- Real-time billing
- Inventory management
- Reorder alerts

### 💰 Zero-Checkout

- Auto-settle all charges
- Loyalty points allocation
- Digital receipt
- Lock revocation

---

## DASHBOARDS

### Admin Dashboard (hotel-dashboard)

```
http://localhost:3000
```

Features:
- Real-time service health monitoring
- Service category breakdown
- Quick actions (run demo journey)
- Live guest journey simulation

### Guest Mobile App (hotel-mobile)

```
http://localhost:3001
```

Features:
- Room control interface
- Minibar ordering
- AI concierge chat
- Loyalty points display
- Account management

### Integration Gateway

```
http://localhost:3898/ecosystem/summary
```

Features:
- All 28 services registered
- Health check every 10 seconds
- Latency monitoring
- Service status dashboard

---

## FILE STRUCTURE

```
StayOwn-Hospitality/
├── README.md                          # This file
├── docker-compose.invisible-hotel.yml # Full stack deployment
├── test-api.sh                        # API testing script
│
├── integration-gateway/               # Service registry (3898)
│   └── src/index.ts
│
├── hotel-dashboard/                   # Admin dashboard (3000)
│   ├── src/App.tsx
│   └── vite.config.ts
│
├── hotel-mobile/                      # Guest mobile app (3001+)
│   ├── src/App.tsx
│   └── src/services/api.ts
│
├── ai-front-desk/                     # AI receptionist (3800)
├── minibar-service/                   # Smart minibar (3810)
├── hotel-restaurant-booking/          # Restaurant (3811)
├── hotel-spa-booking/                 # Spa (3812)
├── room-controls/                     # IoT control (3814)
├── parking-service/                   # Parking (3815)
├── lost-found/                        # Lost & found (3816)
├── upsell-engine/                     # Upselling (3817)
├── loyalty-system/                    # Rewards (3818)
├── review-manager/                   # Reviews (3819)
├── feedback-survey/                   # Surveys (3820)
├── concierge-desk/                    # Concierge (3821)
├── smart-lock-service/                # Smart locks (3825)
├── predictive-housekeeping/           # Housekeeping AI (3826)
├── zero-checkout-automation/          # Auto checkout (3827)
├── pre-arrival-service/               # Pre-arrival (3828)
└── hotel-os-integration/             # OS integration (3899)
```

---

## ENVIRONMENT VARIABLES

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | Service-specific | Service port |
| MONGODB_URI | mongodb://localhost:27017/{service} | MongoDB connection |
| REDIS_URL | redis://localhost:6379 | Redis connection |
| RABBITMQ_URL | amqp://localhost:5672 | RabbitMQ connection |
| JWT_SECRET | (default) | JWT signing secret |

---

## INTEGRATION WITH HOJAI AI

The Invisible Hotel integrates with HOJAI AI services for:

1. **HOJAI Staybot (4840)** - AI Concierge
   - Intent detection
   - Natural language processing
   - Service routing

2. **HOJAI Memory (4520)** - Guest Memory
   - Preference storage
   - Pattern recognition
   - Learning system

3. **HOJAI Genie (4703)** - Personal Assistant
   - Daily briefings
   - Relationship tracking
   - Context awareness

---

## INTEGRATION WITH RABTUL

RABTUL services provide:

1. **REZ Payment (4001)** - Payment processing
2. **REZ Auth (4002)** - Authentication
3. **REZ Wallet (4004)** - REZ Coins & loyalty

---

## DEPLOYMENT

### Docker Compose

```bash
# Start all services
docker compose -f docker-compose.invisible-hotel.yml up -d

# Check status
docker compose -f docker-compose.invisible-hotel.yml ps

# Stop all services
docker compose -f docker-compose.invisible-hotel.yml down
```

### Individual Service Start

```bash
cd <service-directory>
npm install
npm run dev
```

---

## MONITORING

### Health Checks

```bash
# Check all services
curl http://localhost:3898/ecosystem/summary | jq

# Individual service
curl http://localhost:3800/health
curl http://localhost:3814/health
```

### Logs

```bash
# Docker logs
docker logs -f <container-name>

# Service logs (development)
npm run dev
```

---

## FUTURE ENHANCEMENTS

- [ ] WhatsApp integration for guest communication
- [ ] Real-time room status dashboard
- [ ] AI-powered dynamic pricing
- [ ] Voice-first hotel control
- [ ] AR room preview
- [ ] Blockchain-based loyalty

---

## SUPPORT

For questions or issues, contact:
- RTNM Digital - StayOwn Team
- GitHub: github.com/imrejaul007/StayOwn-Hospitality

---

**License:** Proprietary - RTNM Digital
**© 2026 RTNM Digital. All rights reserved.**

---

## HOTEL OWNER DASHBOARD (June 14, 2026)

### Location
`hotel-owner-dashboard/`

### Port
**4900**

### Purpose
Ahmed's intelligence view of Pentouz Hotel operations.

### Quick Start

```bash
cd hotel-owner-dashboard
npm install
npm run dev
```

### API Endpoints

| Endpoint | Description |
|---------|-------------|
| `GET /api/dashboard/overview` | Main dashboard (Ahmed's view) |
| `GET /api/dashboard/occupancy` | 92% occupancy |
| `GET /api/dashboard/revenue` | Revenue analytics |
| `GET /api/dashboard/pricing-recommendation` | 8% = ₹18L |

### Key Metrics

| Metric | Value |
|-------|-------|
| Occupancy | 92% |
| Monthly Revenue | ₹128L |
| Pricing Recommendation | +8% = ₹18L/month |

---

**Last Updated:** June 14, 2026
