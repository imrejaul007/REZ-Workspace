# KHAIRMOVE - Mobility + Airport + Community Ecosystem

**Version:** 3.0.0
**Updated:** June 12, 2026
**Tagline:** "Move Smarter, Travel Better"

---

## COMPANY OVERVIEW

**KHAIRMOVE** is RTNM Digital's comprehensive mobility platform providing:
- Ride-hailing and delivery services
- Premium airport ecosystem (Airzy)
- Community ride-sharing (Rider Circle)
- Vehicle rentals

### What KHAIRMOVE Owns

| Category | Products |
|----------|----------|
| **Rides** | khaimove-ride-service, khaimove-user-app, khaimove-driver-app, rider-circle |
| **Delivery** | khaimove-delivery-service, khaimove-logistics-aggregator |
| **Rentals** | khaimove-rental-service |
| **Airport** | Airzy ecosystem (18 services + mobile + web apps) |
| **Community** | Rider Circle (ride sharing + social) |
| **Integration** | buzzlocal-rides-integration |

---

## COMPLETE PORT REGISTRY

### Core Ride-Hailing Services (Ports 4600-4610)

| Port | Service | Purpose |
|------|---------|---------|
| **4600** | khaimove-api-gateway | Unified API entry point |
| **4601** | khaimove-ride-service | Ride-hailing backend |
| **4602** | khaimove-fleet-service | Fleet management |
| **4603** | khaimove-delivery-service | Food/package delivery |
| **4604** | khaimove-logistics-aggregator | Multi-carrier shipping |
| **4605** | khaimove-rental-service | Hourly/daily rentals |
| **4606** | buzzlocal-rides-integration | Community rides |

### Airzy Airport Ecosystem (Ports 4500-4517)

| Port | Service | Purpose |
|------|---------|---------|
| **4500** | airzy-api-gateway | Airport API gateway |
| **4501** | airzy-flight-service | Flight tracking & booking |
| **4502** | airzy-lounge-service | Lounge access |
| **4503** | airzy-itinerary-service | Trip planning |
| **4504** | airzy-wallet-extension | Travel coins |
| **4505** | airzy-ai-brain | AI recommendations |
| **4506** | airzy-corp-service | Corporate travel |
| **4507** | airzy-hotel-extension | Hotel booking |
| **4508** | airzy-transfer-extension | Airport transfers |
| **4509** | airzy-dooh-extension | Digital signage |
| **4510** | airzy-dining-extension | Airport dining |
| **4511** | airzy-social-extension | Reviews & tips |
| **4512** | airzy-gate-navigation | Terminal navigation |
| **4513** | airzy-document-vault | Document storage |
| **4514** | airzy-visa-service | Visa applications |
| **4515** | airzy-travel-finance | BNPL, FOREX |
| **4516** | airzy-concierge-extension | AI concierge |
| **4517** | airzy-intelligence | AI/ML services |

### Rider Circle Ecosystem (Ports 4200-4400)

| Port | Service | Purpose |
|------|---------|---------|
| **4200** | rider-circle-api | REST API |
| **4300** | rider-circle-graph | Knowledge Graph |
| **4400** | rider-circle-intelligence | AI Engine |

### HOJAI AI Services Currently Running (June 13, 2026)

KHAIRMOVE integrates with the following HOJAI AI services:

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

---

## RIDE-HAILING ECOSYSTEM

### Fare Structure

| Vehicle | Base Fare | Per KM | Per Min |
|---------|-----------|--------|---------|
| Bike | ₹15 | ₹6 | ₹1 |
| Auto | ₹25 | ₹10 | ₹1.5 |
| Cab | ₹40 | ₹14 | ₹2 |
| SUV | ₹60 | ₹18 | ₹2.5 |

### Mobile Apps

| App | Platform | Purpose |
|-----|----------|---------|
| `khaimove-user-app` | Expo/React Native | User ride booking |
| `khaimove-driver-app` | Expo/React Native | Driver partner app |
| `khaimove-admin-dashboard` | Next.js | Admin operations panel |

### Key Features
- Real-time driver matching
- Live GPS tracking
- OTP verification
- In-app payments (RABTUL Wallet)
- Rating & reviews
- SOS emergency
- Surge pricing

---

## AIRZY ECOSYSTEM

**Tagline:** "Smart companion for frequent travelers"
**Positioning:** "Premium airport lifestyle ecosystem"

### Airzy Mobile & Web Apps

| App | Platform | Purpose |
|-----|----------|---------|
| `airzy/apps/mobile` | Expo | Airport companion |
| `airzy/apps/web` | Next.js | Airport web portal |

### Airzy Architecture

```
Airzy Mobile App
       │
       ▼
Airzy API Gateway (4500)
       │
       ├── RABTUL (Auth, Wallet, Payment)
       ├── REZ Intelligence (AI, Predictions)
       └── Airzy Services (4501-4517)
```

### Airzy Membership Tiers

| Tier | Fee/yr | Lounge Visits | Coin Rate |
|------|--------|--------------|-----------|
| Basic | Free | 0 | 1.0x |
| Plus | ₹2,999 | 2 | 1.5x |
| Elite | ₹9,999 | 5 | 2.0x |
| Royale | ₹29,999 | Unlimited | 3.0x |

### Airzy Features by Layer

**Layer 1 - Travel Utility**
- Flight search & booking (Amadeus)
- Hotel booking
- Airport transfers (ReZ Ride)

**Layer 2 - Airport Experience**
- Lounge booking (DreamFolks, Priority Pass)
- Airport dining
- Gate navigation
- Porter/concierge

**Layer 3 - Rewards & Wallet**
- Airzy Coins
- Membership tiers
- Coin multipliers
- Lounge credits

**Layer 4 - AI Traveler Brain**
- Travel prediction
- Contextual offers
- Proactive reminders

**Layer 5 - Premium Services**
- VIP lounge access
- Dedicated concierge
- Priority handling

**Layer 6 - Documents**
- Visa requirements
- AI visa assistant
- Document vault (DigiLocker)
- Travel folder

**Layer 7 - Travel Finance**
- Travel BNPL
- Forex conversion
- Travel insurance

**Layer 8 - Social**
- Traveler reviews
- Itinerary sharing
- Travel tips
- Community features

---

## RIDER CIRCLE ECOSYSTEM

**Tagline:** "The Operating System for Adventure Mobility"

### Rider Circle Components

| Component | Purpose |
|-----------|---------|
| `rider-circle-app` | Mobile app (Expo) |
| `rider-circle-api` | Backend API |
| `rider-circle-graph` | Neo4j Knowledge Graph |
| `rider-circle-intelligence` | Python AI Engine |
| `rider-circle-shared` | Shared utilities |

### Rider Circle Features

- **SafeQR** - Emergency ID for riders
- **Live Tracking** - Real-time GPS presence
- **AI Genie** - Route planning, maintenance advice
- **Bike Digital Twin** - Health tracking, predictions
- **Trust Score** - Reputation system
- **REZ Coins** - Rewards for rides

---

## DELIVERY ECOSYSTEM

### Services

| Service | Purpose |
|---------|---------|
| `khaimove-delivery-service` | Food/package delivery |
| `khaimove-logistics-aggregator` | Multi-carrier aggregation |
| `rez-delivery-ui` | Delivery tracking UI |
| `rez-delivery-tracking` | Real-time tracking |
| `rez-food-delivery-service` | Food delivery |
| `rez-instant-delivery-service` | Instant delivery |

### Carrier Integrations

| Carrier | Status |
|---------|--------|
| Delhivery | ✅ Active |
| BlueDart | ✅ Active |
| DTDC | ✅ Active |
| FedEx | ✅ Active |
| DHL | ✅ Active |

---

## DIRECTORY STRUCTURE

```
KHAIRMOVE/
├── 📱 Mobile Apps
│   ├── khaimove-user-app/           # User ride app
│   ├── khaimove-driver-app/        # Driver app
│   └── khaimove-admin-dashboard/    # Admin panel
│
├── 🚗 Ride Services
│   ├── khaimove-api-gateway/       # Port 4600
│   ├── khaimove-ride-service/      # Port 4601
│   ├── khaimove-fleet-service/     # Port 4602
│   └── buzzlocal-rides-integration/ # Port 4606
│
├── 📦 Delivery Services
│   ├── khaimove-delivery-service/   # Port 4603
│   ├── khaimove-logistics-aggregator/ # Port 4604
│   ├── rez-delivery-ui/
│   ├── rez-delivery-tracking/
│   ├── rez-food-delivery-service/
│   └── rez-instant-delivery-service/
│
├── 🚗 Rentals
│   └── khaimove-rental-service/     # Port 4605
│
├── ✈️ Airzy Airport Ecosystem
│   ├── airzy/apps/
│   │   ├── mobile/                 # Airzy mobile app
│   │   └── web/                   # Airzy web portal
│   ├── airzy-api-gateway/         # Port 4500
│   ├── airzy-flight-service/      # Port 4501
│   ├── airzy-lounge-service/      # Port 4502
│   ├── airzy-itinerary-service/   # Port 4503
│   ├── airzy-wallet-extension/    # Port 4504
│   ├── airzy-ai-brain/            # Port 4505
│   ├── airzy-corp-service/        # Port 4506
│   ├── airzy-hotel-extension/     # Port 4507
│   ├── airzy-transfer-extension/   # Port 4508
│   ├── airzy-dooh-extension/      # Port 4509
│   ├── airzy-dining-extension/    # Port 4510
│   ├── airzy-social-extension/    # Port 4511
│   ├── airzy-gate-navigation/    # Port 4512
│   ├── airzy-document-vault/      # Port 4513
│   ├── airzy-visa-service/        # Port 4514
│   ├── airzy-travel-finance/     # Port 4515
│   ├── airzy-concierge-extension/  # Port 4516
│   └── airzy-intelligence/         # Port 4517
│
├── 🚴 Rider Circle
│   ├── rider-circle-app/           # Mobile app
│   ├── rider-circle-api/          # Port 4200
│   ├── rider-circle-graph/        # Port 4300
│   ├── rider-circle-intelligence/ # Port 4400
│   └── rider-circle-shared/
│
├── 🔧 Shared
│   ├── shared/                    # Shared utilities
│   └── docs/                      # Documentation
│
├── 📋 Documentation
│   ├── docs/company/              # Company audits
│   ├── docs/products/             # Product features
│   └── docs/services/             # Service docs
│
├── 📄 Key Files
│   ├── CLAUDE.md                  # This file
│   ├── README.md                  # Main readme
│   ├── AUDIT.md                   # Audit report
│   ├── PRODUCTION-AUDIT.md        # Production readiness
│   ├── KHAIRMOVE-DETAILED-AUDIT.md # Detailed audit
│   ├── SOT.md                     # Source of truth
│   ├── DEPLOYMENT.md              # Deployment guide
│   ├── RTNM-COMPANIES-AUDIT.md    # Cross-company audit
│   └── RTNM-PRODUCTS-FEATURES-AUDIT.md # Features audit
```

---

## CROSS-COMPANY INTEGRATION

### With RABTUL Technologies

| Service | Port | Purpose |
|---------|------|---------|
| AUTH_SERVICE_URL | 4002 | Authentication |
| PAYMENT_SERVICE_URL | 4001 | Payments |
| WALLET_SERVICE_URL | 4004 | Wallet |
| NOTIFICATION_SERVICE_URL | 4011 | Push notifications |

### With REZ-Intelligence

| Service | Port | Purpose |
|---------|------|---------|
| INTENT_SERVICE_URL | 4018 | Destination prediction |
| DEMAND_FORECAST_URL | 4042 | Surge forecasting |

---

## BUILD COMMANDS

### Ride-Hailing
```bash
cd khaimove-api-gateway && npm run dev
cd khaimove-ride-service && npm run dev
```

### Airzy
```bash
cd airzy && docker-compose up -d
```

### Rider Circle
```bash
cd rider-circle/rider-circle-api && npm run dev
cd rider-circle/rider-circle-app && npx expo start
```

---

## SECURITY

- All service-to-service calls require `X-Internal-Token` header
- Never commit `.env` files
- Use Zod for input validation
- Rate limiting on all public endpoints
- API key rotation for third-party integrations

---

## DOCUMENTATION

| File | Purpose |
|------|---------|
| `docs/company/RTNM-COMPANIES-AUDIT.md` | Cross-company audit |
| `docs/products/RTNM-PRODUCTS-FEATURES-AUDIT.md` | Features audit |
| `docs/company/AUDIT.md` | KHAIRMOVE audit |
| `docs/company/PRODUCTION-AUDIT.md` | Production readiness |
| `docs/company/KHAIRMOVE-DETAILED-AUDIT.md` | Detailed audit |
| `airzy/README.md` | Airzy documentation |
| `rider-circle/README.md` | Rider Circle documentation |
| `DEPLOYMENT.md` | Deployment guide |

---

**Last Updated:** June 12, 2026
**Version:** 3.0.0