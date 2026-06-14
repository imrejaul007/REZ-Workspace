# KHAIRMOVE Documentation

> All documentation for KHAIRMOVE products and services

---

## 📚 Documentation Index

### Company Documentation (`company/`)

| Document | Description |
|---------|-------------|
| [RTNM-COMPANIES-AUDIT.md](company/RTNM-COMPANIES-AUDIT.md) | Cross-company audit of entire RTNM ecosystem |
| [RTNM-PRODUCTS-FEATURES-AUDIT.md](../products/RTNM-PRODUCTS-FEATURES-AUDIT.md) | All products & features across companies |
| [AUDIT.md](company/AUDIT.md) | KHAIRMOVE internal audit |
| [PRODUCTION-AUDIT.md](company/PRODUCTION-AUDIT.md) | Production readiness report |
| [KHAIRMOVE-DETAILED-AUDIT.md](company/KHAIRMOVE-DETAILED-AUDIT.md) | Detailed audit of all services |
| [SOT.md](company/SOT.md) | Source of truth |

### Product Features (`products/`)

| Document | Description |
|---------|-------------|
| [RTNM-PRODUCTS-FEATURES-AUDIT.md](products/RTNM-PRODUCTS-FEATURES-AUDIT.md) | All RTNM product features |
| [FEATURES-RIDE-HAILING.md](products/FEATURES-RIDE-HAILING.md) | Ride-hailing features |
| [FEATURES-AIRZY.md](products/FEATURES-AIRZY.md) | Airzy airport ecosystem features |
| [FEATURES-RIDER-CIRCLE.md](products/FEATURES-RIDER-CIRCLE.md) | Rider Circle features |
| [FEATURES-DELIVERY.md](products/FEATURES-DELIVERY.md) | Delivery ecosystem features |

---

## 🏢 Company Structure

### KHAIRMOVE Products

| Category | Products | Docs |
|----------|----------|------|
| **Ride-Hailing** | khaimove-ride-service, khaimove-user-app, khaimove-driver-app | [FEATURES-RIDE-HAILING.md](products/FEATURES-RIDE-HAILING.md) |
| **Delivery** | khaimove-delivery-service, khaimove-logistics-aggregator | [FEATURES-DELIVERY.md](products/FEATURES-DELIVERY.md) |
| **Rentals** | khaimove-rental-service | - |
| **Airport (Airzy)** | 18 services (4500-4517), mobile app, web app | [FEATURES-AIRZY.md](products/FEATURES-AIRZY.md) |
| **Community (Rider Circle)** | rider-circle-api, rider-circle-app | [FEATURES-RIDER-CIRCLE.md](products/FEATURES-RIDER-CIRCLE.md) |

---

## 📱 Product Documentation

### Airzy (Airport Ecosystem)

**Location:** `../airzy/`
**Ports:** 4500-4517

Airzy is KHAIRMOVE's premium airport ecosystem with 18 services.

| Service | Port | Purpose |
|---------|------|---------|
| airzy-api-gateway | 4500 | API gateway |
| airzy-flight-service | 4501 | Flight tracking |
| airzy-lounge-service | 4502 | Lounge access |
| airzy-itinerary-service | 4503 | Trip planning |
| airzy-wallet-extension | 4504 | Travel coins |
| airzy-ai-brain | 4505 | AI recommendations |
| airzy-corp-service | 4506 | Corporate travel |
| airzy-hotel-extension | 4507 | Hotel booking |
| airzy-transfer-extension | 4508 | Airport transfers |
| airzy-dooh-extension | 4509 | Digital signage |
| airzy-dining-extension | 4510 | Dining |
| airzy-social-extension | 4511 | Reviews |
| airzy-gate-navigation | 4512 | Navigation |
| airzy-document-vault | 4513 | Documents |
| airzy-visa-service | 4514 | Visa |
| airzy-travel-finance | 4515 | BNPL, Forex |
| airzy-concierge-extension | 4516 | AI concierge |
| airzy-intelligence | 4517 | AI/ML |

### Rider Circle (Community Rides)

**Location:** `../rider-circle/`
**Ports:** 4200-4400

Rider Circle is KHAIRMOVE's adventure mobility ecosystem.

| Service | Port | Purpose |
|---------|------|---------|
| rider-circle-api | 4200 | REST API |
| rider-circle-graph | 4300 | Neo4j Knowledge Graph |
| rider-circle-intelligence | 4400 | Python AI Engine |

### Ride-Hailing Services

**Location:** `../khaimove-*/`
**Ports:** 4600-4606

| Service | Port | Purpose |
|---------|------|---------|
| khaimove-api-gateway | 4600 | API gateway |
| khaimove-ride-service | 4601 | Ride-hailing |
| khaimove-fleet-service | 4602 | Fleet management |
| khaimove-delivery-service | 4603 | Delivery |
| khaimove-logistics-aggregator | 4604 | Multi-carrier |
| khaimove-rental-service | 4605 | Rentals |
| buzzlocal-rides-integration | 4606 | Community rides |

---

## 🔗 External References

| Company | Products |
|---------|---------|
| **RABTUL** | Auth, Wallet, Payment, Notifications |
| **REZ-Intelligence** | Intent, Predictions, AI |
| **Nexha** | Commerce, Transfers |
| **AdBazaar** | DOOH, Advertising |

---

**Last Updated:** June 12, 2026
**Version:** 3.0.0