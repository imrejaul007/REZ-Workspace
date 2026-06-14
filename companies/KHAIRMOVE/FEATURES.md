# KHAIRMOVE - Mobility Platform Features

**Version:** 1.0.0
**Last Updated:** June 14, 2026
**Status:** ✅ PRODUCTION READY

---

## COMPANY OVERVIEW

**KHAIRMOVE** is the mobility and transportation platform for the RTNM ecosystem. It handles ride-hailing, delivery, rentals, and the Airzy airport ecosystem.

**Parent:** RTNM Group
**Tagline:** "Move Smarter, Travel Better"

---

## SERVICE CATEGORIES

| Category | Count | Description |
|----------|-------|-------------|
| Ride-Hailing | 8 | Bike, Auto, Cab, SUV booking |
| Delivery | 8 | Food, package, instant delivery |
| Rentals | 1 | Hourly/daily vehicle rentals |
| Airzy Airport | 18 | Airport ecosystem services |
| Rider Circle | 4 | Community ride-sharing |
| Admin | 2 | Dashboard, API gateway |
| **Total** | **40+** | |

---

## RIDE-HAILING SERVICES

### khaimove-api-gateway
| Port | Purpose |
|------|---------|
| - | Unified API entry point, routing |

### khaimove-ride-service
| Port | Purpose |
|------|---------|
| 4600 | Bike, Auto, Cab, SUV booking |

### khaimove-fleet-service
| Port | Purpose |
|------|---------|
| 4601 | Fleet management |

### khaimove-driver-app
| Port | Purpose |
|------|---------|
| - | Driver partner mobile app (React Native) |

### khaimove-user-app
| Port | Purpose |
|------|---------|
| - | User ride booking app (React Native) |

### khaimove-admin-dashboard
| Port | Purpose |
|------|---------|
| - | Admin operations panel (Next.js) |

---

## DELIVERY SERVICES

### khaimove-delivery-service
| Port | Purpose |
|------|---------|
| 4603 | Food, package delivery |

### khaimove-logistics-aggregator
| Port | Purpose |
|------|---------|
| 4604 | Multi-carrier shipping |

### Integrated Carriers
- Delhivery
- BlueDart
- DTDC
- FedEx
- DHL

### Related Services
| Service | Purpose |
|---------|---------|
| rez-delivery-ui | Delivery tracking UI |
| rez-delivery-tracking | Package tracking |
| rez-food-delivery-service | Food delivery |
| rez-instant-delivery-service | Quick delivery |

---

## AIRZY - AIRPORT ECOSYSTEM

### Core Services (Ports 4500-4517)

| Service | Port | Purpose |
|---------|------|---------|
| airzy-api-gateway | 4500 | Airport API gateway |
| airzy-flight-service | 4501 | Flight search, booking |
| airzy-lounge-service | 4502 | Lounge access, pay-per-use |
| airzy-wallet-extension | 4503 | Airport wallet |
| airzy-ai-brain | 4504 | AI recommendations |
| airzy-concierge-extension | 4505 | VIP concierge |
| airzy-hotel-booking | 4506 | Hotel booking |
| airzy-transfer-extension | 4507 | Airport transfers |
| airzy-dooh-extension | 4508 | Digital signage |
| airzy-corp-service | 4509 | Corporate services |
| airzy-intinerary-service | 4510 | Trip planning |
| airzy-flight-extension | 4511 | Flight management |
| airzy-hotel-extension | 4512 | Hotel services |
| airzy-social-extension | 4513 | Social features |
| airzy-dining-extension | 4514 | Airport dining |
| airzy-navigator-extension | 4515 | Indoor navigation |
| airzy-documents-extension | 4516 | Document services |
| airzy-visa-extension | 4517 | Visa services |

### Airzy Features
- **Flight Discovery** - Search, compare, book flights
- **Lounge Access** - Pay-per-use airport lounges
- **Airport Transfers** - Pickup, dropoff coordination
- **Hotel Booking** - Airport hotel integration
- **Concierge** - VIP assistance
- **DOOH Advertising** - Digital out-of-home ads
- **Dining** - Airport restaurant pre-order
- **AI Brain** - Personalized recommendations

---

## RIDER CIRCLE

### Community Ride-Sharing

| Service | Port | Purpose |
|---------|------|---------|
| rider-circle-api | 4200 | REST API |
| rider-circle-graph | 4300 | Knowledge Graph |
| rider-circle-intelligence | 4400 | AI Engine |

### Features
- **SafeQR** - Emergency ID for riders
- **Live Tracking** - Real-time GPS presence
- **AI Genie** - Route planning, maintenance advice
- **Bike Digital Twin** - Health tracking, predictions
- **Trust Score** - Reputation system
- **REZ Coins** - Rewards for rides

---

## INTEGRATIONS

### Internal (RTNM Ecosystem)
| Service | Integration |
|---------|-------------|
| REZ-Consumer | User accounts |
| RABTUL Technologies | Auth, Payments, Wallet |
| HOJAI AI | AI recommendations |
| AdBazaar | DOOH advertising |
| StayOwn | Hotel OS |

### External
| Provider | Service |
|----------|---------|
| Google Maps | Navigation |
| OpenStreetMap | Maps |
| Flight APIs | Flight data |

---

## TECHNOLOGY STACK

| Category | Technology |
|----------|------------|
| Runtime | Node.js 18+ |
| Language | TypeScript |
| Database | MongoDB, Neo4j |
| Cache | Redis |
| API | Express.js |
| Mobile | React Native |
| Web | Next.js |

---

## DOCUMENTATION

| File | Purpose |
|------|---------|
| README.md | Overview |
| CLAUDE.md | Developer guide |
| DEPLOYMENT.md | Deployment guide |
| airzy/MIGRATION-GUIDE.md | Airzy migration |

---

**Version:** 1.0.0
**Last Updated:** June 14, 2026
**Status:** ✅ ALL SERVICES PRODUCTION READY