# REZ Merchant - Unified Commerce OS Features

**Version:** 1.0.0
**Last Updated:** June 14, 2026
**Status:** ✅ PRODUCTION READY

---

## COMPANY OVERVIEW

**REZ Merchant** is the multi-industry business management platform for the RTNM ecosystem. It provides vertical-specific OS solutions for 15 industries.

**Parent:** RTNM Group
**Tagline:** "Unified Commerce OS"

---

## SERVICE CATEGORIES

| Category | Count | Description |
|----------|-------|-------------|
| Core Platform | 47 | Shared services |
| Restaurant | 14 | Restaurant management |
| Hotel | 18 | Hotel operations |
| Salon/Spa | 8+ | Beauty services |
| Fitness/Gym | 6 | Health clubs |
| Healthcare | 6 | Medical practices |
| Retail | 6 | Retail stores |
| Grocery | 4 | Grocery stores |
| Other | 12 | Various industries |
| **Total** | **175+** | |

---

## CORE PLATFORM SERVICES

### API & Gateway
| Service | Port | Purpose |
|---------|------|---------|
| rez-merchant-service | 4005 | Core API |
| rez-api-gateway | - | API Gateway |
| rez-merchant-gateway | - | Gateway |

### POS & Checkout
| Service | Port | Purpose |
|---------|------|---------|
| rez-pos-service | - | Universal POS |
| rez-kds-service | - | Kitchen Display |
| rez-checkout-service | - | Checkout |

### Operations
| Service | Port | Purpose |
|---------|------|---------|
| rez-staff-service | - | Staff Management |
| rez-inventory-engine | - | Inventory Management |
| rez-supplier-service | - | Supplier Management |

### Analytics
| Service | Port | Purpose |
|---------|------|---------|
| REZ-dashboard | - | Analytics Dashboard |
| rez-analytics-service | - | Analytics |

---

## RESTAURANT OS (14 Services)

### Core Services
| Service | Port | Purpose |
|---------|------|---------|
| rez-restaurant-service | 4012 | Restaurant API |
| rez-menu-service | - | Menu Management |
| rez-order-service | - | Order Management |
| rez-table-service | - | Table Management |

### Kitchen & Operations
| Service | Port | Purpose |
|---------|------|---------|
| rez-kds-display | - | Kitchen Display |
| rez-drive-thru-kds | 4066 | Drive-thru KDS |
| rez-self-kiosk | 3050 | Self-ordering Kiosk |

### Delivery & QSR
| Service | Port | Purpose |
|---------|------|---------|
| rez-qsr-service | - | QSR Management |
| rez-delivery-service | - | Delivery |

---

## HOTEL OS (18 Services)

### Core
| Service | Port | Purpose |
|---------|------|---------|
| rez-hotel-service | 4015 | Hotel API |
| rez-hotel-booking | - | Booking |
| rez-hotel-guest | - | Guest Management |
| rez-hotel-frontdesk | - | Front Desk |

### Operations
| Service | Port | Purpose |
|---------|------|---------|
| rez-hotel-housekeeping | - | Housekeeping |
| rez-hotel-pos | - | Hotel POS |
| rez-hotel-inventory | - | Inventory |

### Revenue
| Service | Port | Purpose |
|---------|------|---------|
| rez-hotel-revenue | - | Revenue Management |
| rez-hotel-channel-manager | - | Channel Manager |

---

## SALON & SPA OS

### Core Services
| Service | Port | Purpose |
|---------|------|---------|
| rez-salon-service | 4110 | Salon API |
| GlamAI | 3000 | AI Beauty Advisor |

### Features
| Feature | Description | Status |
|---------|-------------|--------|
| **Appointments** | Booking system | ✅ |
| **Staff Scheduling** | Shift management | ✅ |
| **Inventory** | Product tracking | ✅ |
| **Loyalty** | Reward points | ✅ |
| **AI Recommendations** | Style advice | ✅ |

---

## HEALTHCARE OS

### Services
| Service | Port | Purpose |
|---------|------|---------|
| rez-healthcare-service | 4007 | Healthcare API |
| Medical AI | - | Diagnosis assist |

### Features
| Feature | Description | Status |
|---------|-------------|--------|
| **Patient Records** | EMR/EHR | ✅ |
| **Appointments** | Scheduling | ✅ |
| **Prescriptions** | Digital Rx | ✅ |
| **Billing** | Insurance claims | ✅ |

---

## RETAIL OS

### Services
| Service | Port | Purpose |
|---------|------|---------|
| rez-retail-service | 4160 | Retail API |

### Features
| Feature | Description | Status |
|---------|-------------|--------|
| **POS** | Point of Sale | ✅ |
| **Inventory** | Stock management | ✅ |
| **Loyalty** | Customer rewards | ✅ |
| **E-commerce** | Online store | ✅ |

---

## QR SERVICES

| Service | Purpose |
|---------|---------|
| REZ-qr-service | QR code generation |
| REZ-qr-analytics | QR analytics |
| REZ-qr-campaign | QR campaigns |
| REZ-qr-unified | Unified QR |

### QR Types
- Menu QR (Restaurant)
- Table QR (Ordering)
- Payment QR
- Product QR
- Shelf QR

---

## CONNECTIVITY

### External Integrations
| Service | Integration |
|---------|-------------|
| WhatsApp | Business API |
| Shopify | E-commerce |
| WooCommerce | Store |
| Razorpay | Payments |
| Google Maps | Location |

### Internal Integrations
| Service | Integration |
|---------|-------------|
| RABTUL | Auth, Payments |
| HOJAI AI | Intelligence |
| REZ-Consumer | Consumer apps |

---

## TECHNOLOGY STACK

| Category | Technology |
|----------|------------|
| Runtime | Node.js 18+ |
| Language | TypeScript |
| Database | MongoDB |
| API | Express.js |
| Web | Next.js |
| Mobile | React Native |

---

## DOCUMENTATION

| File | Purpose |
|------|---------|
| README.md | Overview |
| CLAUDE.md | Developer guide |
| PORT-REGISTRY.md | Port assignments |
| COMPLETE-SERVICE-AUDIT.md | Full audit |

---

**Version:** 1.0.0
**Last Updated:** June 14, 2026
**Status:** ✅ ALL 175+ SERVICES PRODUCTION READY