# REZ Merchant Platform

**Unified Commerce OS** - Multi-industry business management platform.

**Version:** 3.0  
**Date:** June 8, 2026  
**GitHub:** [imrejaul007/REZ-Merchant](https://github.com/imrejaul007/REZ-Merchant)

---

## Quick Overview

| Metric | Count |
|--------|-------|
| **Total Services** | 175+ |
| **Top-Level Services** | 58 |
| **industry-os Services** | 117 |
| **Frontend Apps** | 10 |
| **Industries** | 15 |
| **Ports Allocated** | 70+ |

---

## 15 Industries Supported

| # | Industry | Services | Core Service | Port |
|---|----------|----------|--------------|------|
| 1 | **Restaurant** | 14 | rez-restaurant-service | 4012 |
| 2 | **Hotel** | 18 | rez-hotel-service | 4015 |
| 3 | **Salon/Spa** | 8 + GlamAI | rez-salon-service | 4110 + GlamAI (3000) |
| 4 | **Fitness/Gym** | 6 | rez-fitness-service | 4005 |
| 5 | **Healthcare** | 6 | rez-healthcare-service | 4007 |
| 6 | **Retail** | 6 | rez-retail-service | 4160 |
| 7 | **Grocery** | 4 | rez-grocery-service | 4800 |
| 8 | **Education** | 4 | rez-education-service | 4054 |
| 9 | **Events** | 2 | rez-events-service | 4055 |
| 10 | **Pharmacy** | 4 | rez-pharmacy-service | 4900 |
| 11 | **Automotive** | 2 | rez-automotive-service | 4600 |
| 12 | **Fashion** | 3 | rez-fashion-service | 4700 |
| 13 | **Drive-thru** | 1 | rez-drive-thru-kds | 4066 |
| 14 | **Self-Kiosk** | 1 | rez-self-kiosk | 3050 |
| 15 | **Travel** | 1 | Itinerary services | - |

---

## Directory Structure

```
REZ-Merchant/
├── Top-Level Services/          # 47 core platform services
│   ├── rez-merchant-service/   # CORE - Main API (4005)
│   ├── rez-pos-service/        # Universal POS
│   ├── rez-kds-service/        # Kitchen Display
│   ├── rez-staff-service/      # Staff Management
│   ├── rez-inventory-engine/   # Inventory
│   ├── REZ-dashboard/         # Analytics
│   └── ... (41 more)
│
├── industry-os/                # 78 industry-specific services
│   ├── shared/                # 7 shared packages
│   ├── hotel-ecosystem/       # 9 hotel services
│   ├── restauranthub/         # Monorepo with 15 apps
│   ├── rez-restaurant-*/      # Restaurant ecosystem
│   ├── rez-hotel-*/           # Hotel ecosystem
│   ├── rez-salon-*/          # Salon ecosystem
│   ├── rez-mind-*/           # AI services
│   └── ...
│
├── merchant-website-os/        # Website platform
└── docs/                      # Documentation
```

---

## Core Services (18 Common Platform)

These services are shared by ALL industries:

| Service | Port | Description |
|---------|------|-------------|
| `rez-merchant-service` | 4005 | **CORE** - Main merchant API |
| `rez-pos-service` | 4081 | Universal POS |
| `rez-kds-service` | 4014 | Kitchen Display System |
| `rez-menu-service` | 4030 | Menu management |
| `rez-inventory-engine` | 4010 | Inventory tracking |
| `rez-staff-service` | 4091 | Staff management |
| `rez-payroll` | 4610 | Payroll processing |
| `rez-loyalty-service` | 4037 | Loyalty program |
| `rez-gift-card-service` | 4047 | Gift cards |
| `rez-pricing-service` | 4022 | Dynamic pricing |
| `rez-currency-service` | 4035 | Multi-currency |
| `rez-language-service` | 4028 | i18n |
| `rez-payment-gateway-service` | 4032 | Payments |
| `rez-survey-service` | 4030 | NPS/CSAT |
| `REZ-dashboard` | 4060 | Analytics |
| `REZ-franchise-management` | 4025 | Franchise |
| `REZ-b2b-integration` | 4059 | B2B/Suppliers |
| `REZ-merchant-copilot` | 4022 | AI Copilot |

---

## Restaurant Ecosystem

```
┌─────────────────────────────────────────────────────────────┐
│                    RESTAURANT ECOSYSTEM                       │
├─────────────────────────────────────────────────────────────┤
│  Core: rez-restaurant-service (4012)                        │
│  POS: rez-restaurant-pos-service (4010)                     │
│  CRM: rez-restaurant-crm-service (4013)                      │
│  Reservations: rez-restaurant-reservations (4020)            │
│  Inventory: rez-restaurant-inventory-service (4056)           │
│  KDS: rez-kds-service (4014), rez-kitchen-display (4080)    │
│  AI: rez-ai-waiter (3024), rez-kitchen-ai (4082)           │
│  Loyalty: rez-restaurant-loyalty-service                     │
│  Analytics: rez-restaurant-analytics-service                 │
└─────────────────────────────────────────────────────────────┘
```

**Total: 14 services**

---

## Hotel Ecosystem

```
┌─────────────────────────────────────────────────────────────┐
│                      HOTEL ECOSYSTEM                         │
├─────────────────────────────────────────────────────────────┤
│  Core: rez-hotel-service (4015)                            │
│  PMS: rez-pms-service (4031)                                │
│  Booking: rez-booking-engine (4042)                        │
│  Guest App: rez-guest-mobile-app (4041)                    │
│  Operations:                                                │
│    - rez-hotel-housekeeping-service (4019)                  │
│    - rez-hotel-maintenance-service (4019)                   │
│    - rez-room-service (4043)                               │
│    - rez-laundry-service (4048)                           │
│    - rez-spa-service (4049)                               │
│  Revenue:                                                   │
│    - rez-hotel-analytics-service (4018)                    │
│    - rez-channel-manager (4021)                           │
│    - rez-google-hotel-ads-service                         │
│  AI: rez-mind-hotel-service (4017)                         │
└─────────────────────────────────────────────────────────────┘
```

**Total: 18 services**

---

## Cross-Industry Services

| Service | Port | Description |
|---------|------|-------------|
| `REZ-merchant-intelligence-service` | 4012 | Merchant analytics |
| `REZ-merchant-intelligence-aggregator` | 4011 | Market intelligence |
| `REZ-merchant-integrations` | 4040 | Integration hub |
| `REZ-merchant-trust-bridge` | 4041 | Identity verification |
| `REZ-merchant-corpperks-bridge` | 3005 | HR integration |
| `REZ-merchant-loans-service` | 3081 | Merchant financing |
| `REZ-competitive-intelligence` | 4600 | Competitor analysis |
| `rez-cross-industry-loyalty-service` | 4071 | Unified loyalty |
| `rez-unified-booking-service` | 4072 | Single booking API |
| `REZ-nexTabizz` | 4058 | QR ordering platform |
| `REZ-multi-warehouse` | 4061 | Warehouse management |
| `REZ-merchant-referral-portal` | 4062 | Referral program |
| `rez-table-booking-service` | 4070 | Reservations |
| `rez-procurement-service` | 4083 | Purchase orders |
| `REZ-purchase-order-mobile` | - | PO mobile app |
| `verify-qr-admin` | 4069 | QR verification |
| `rez-warranty` | 4620 | Warranty management |
| `rez-self-checkout` | 4092 | Self-checkout |
| `rez-supplier-marketplace` | 4630 | Supplier marketplace |
| `REZ-kds-mobile` | - | KDS mobile |

---

## Mobile Apps

| App | Platform | Description |
|-----|----------|-------------|
| `rez-app-merchant` | Expo | Merchant mobile app |
| `REZ-kds-mobile` | Expo | Kitchen display mobile |
| `REZ-purchase-order-mobile` | Expo | Purchase order mobile |
| `rez-barcode-scanner-ui` | HTML5 | Barcode scanner |

---

## Quick Start

### Run a Single Service

```bash
cd <service-name>
npm install
npm run dev
```

### Run All Services (Development)

```bash
# Each service runs independently
cd rez-merchant-service && npm run dev    # Port 4005
cd rez-pos-service && npm run dev          # Port 4081
cd rez-staff-service && npm run dev        # Port 4091
```

### Environment Variables

```env
PORT=4000
MONGODB_URI=mongodb://localhost:27017/service-name
JWT_SECRET=your-secret
REDIS_URL=redis://localhost:6379
```

---

## Port Registry

| Range | Category | Examples |
|-------|----------|----------|
| 3000-3099 | Utility | AI Waiter (3024), Loans (3081) |
| 4000-4099 | Core Platform | Merchant (4005), Staff (4091) |
| 4100-4199 | Industry | Restaurant (4012), Hotel (4015) |
| 4200-4299 | Integration | Franchise (4025), Copilot (4022) |
| 4300-4399 | Utilities | Warehouse (4061), Referral (4062) |
| 4400-4499 | Reserved | - |
| 4500-4699 | Analytics | Dashboard (4060), Payroll (4610) |

See [PORT-REGISTRY.md](PORT-REGISTRY.md) for complete list.

---

## HOJAI Industry AI Integration

All services connect to HOJAI's 15 Industry AI services:

| REZ Merchant | → | HOJAI AI | Port |
|-------------|---|----------|------|
| Restaurant | → | waitron | 4820 |
| Hotel | → | staybot | 4840 |
| Salon | → | glamai | 4860 |
| Healthcare | → | carecode | 4102 |
| Retail | → | shopflow | 4830 |
| Fitness | → | fitmind | 4801 |

---

## Documentation

| Document | Description |
|----------|-------------|
| [SERVICE-CATALOG.md](SERVICE-CATALOG.md) | Complete service listing |
| [PORT-REGISTRY.md](PORT-REGISTRY.md) | Port allocations |
| [REZ-MERCHAND-FINAL-AUDIT.md](REZ-MERCHAND-FINAL-AUDIT.md) | Full audit report |

---

## Technology Stack

| Component | Technology |
|-----------|------------|
| Runtime | Node.js 18+ |
| Framework | Express.js |
| Language | TypeScript |
| Database | MongoDB + Mongoose |
| Cache | Redis / ioredis |
| Queue | BullMQ |
| Auth | JWT |
| Validation | Zod |
| Logging | Winston |
| Security | Helmet, CORS, Rate Limit |

---

## Architecture Pattern

```
┌─────────────────────────────────────────────────────────────┐
│                    API GATEWAY / LOAD BALANCER               │
└─────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
   │  Restaurant │     │    Hotel    │     │    Salon    │
   │   OS        │     │   OS        │     │   OS        │
   └──────┬──────┘     └──────┬──────┘     └──────┬──────┘
          │                   │                   │
          └───────────────────┼───────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   COMMON PLATFORM  │
                    │  (18 shared svc)  │
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │   RABTUL PLATFORM  │
                    │  Auth | Payment    │
                    │  Wallet | Notif    │
                    └───────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   HOJAI INDUSTRY   │
                    │      AI (15)       │
                    └───────────────────┘
```

---

## Support

- **Documentation:** This repo
- **API Docs:** `/api/docs` per service
- **Issues:** GitHub Issues

---

**Maintained by:** REZ Intelligence  
**License:** Proprietary
