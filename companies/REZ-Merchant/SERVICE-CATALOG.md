# REZ Merchant - Complete Service Catalog

**Version:** 5.0  
**Date:** June 8, 2026  
**Status:** COMPLETE - All Services Implemented  
**GitHub:** [imrejaul007/REZ-Merchant](https://github.com/imrejaul007/REZ-Merchant)

---

## Quick Stats

| Metric | Count |
|--------|-------|
| **Total Directories** | 107 |
| **Top-Level Services** | 58 |
| **industry-os Services** | 117 |
| **Backend Services** | 175+ |
| **Frontend Apps** | 10 |
| **Industries** | 15 |
| **Ports Allocated** | 70+ |

---

## Architecture Overview

```
REZ Merchant Platform
├── Top-Level Services/          (53 services) - Core platform
├── industry-os/               (117 services) - Industry-specific
│   ├── shared/               (7 packages)   - Shared utilities
│   ├── hotel-ecosystem/      (9 services)   - Hotel platform
│   └── restauranthub/        (15 apps)      - Restaurant monorepo
└── Documentation
    ├── SERVICE-CATALOG.md    (This file)
    ├── PORT-REGISTRY.md      - Port allocations
    └── README.md             - Quick overview
```

---

## Top-Level Services (53)

### Core Platform (7)
| Service | Port | LOC | Description |
|---------|------|-----|-------------|
| `rez-merchant-service` | 4005 | 596 | **CORE** - Main merchant API |
| `REZ-dashboard` | 4060 | 287 | Analytics dashboard |
| `REZ-merchant-copilot` | 4022 | 251 | AI business copilot |
| `REZ-merchant-intelligence-service` | 4012 | 188 | Merchant analytics |
| `REZ-merchant-intelligence-aggregator` | 4011 | 189 | Market intelligence |
| `REZ-merchant-integrations` | 4040 | 420 | Integration hub |
| `REZ-merchant-trust-bridge` | 4041 | 277 | Identity verification |

### POS & Kitchen (7)
| Service | Port | LOC | Description |
|---------|------|-----|-------------|
| `rez-pos-service` | 4081 | 79 | Universal POS |
| `rez-kds-service` | 4014 | 208 | Kitchen Display System |
| `rez-menu-service` | 4030 | 385 | Menu management |
| `rez-kitchen-display` | 4080 | 387 | Kitchen display UI |
| `rez-kitchen-ai` | 4082 | 124 | AI kitchen optimization |
| `rez-self-checkout` | 4092 | 136 | Self-checkout |
| `REZ-kds-mobile` | - | 112 | KDS mobile app |

### Staff & Payroll (4)
| Service | Port | LOC | Description |
|---------|------|-----|-------------|
| `rez-staff-service` | 4091 | 113 | Staff management |
| `rez-payroll` | 4610 | 56 | Payroll processing |
| `rez-store-onboarding` | 4032 | 56 | Merchant onboarding |
| `rez-multi-location` | 4601 | 53 | Multi-location |

### Inventory & Procurement (6)
| Service | Port | LOC | Description |
|---------|------|-----|-------------|
| `rez-inventory-engine` | 4010 | 188 | Inventory tracking |
| `rez-inventory-alerts` | 4625 | 53 | Low-stock alerts |
| `rez-pos-inventory-sync` | 4084 | 131 | POS-Inventory sync |
| `rez-procurement-service` | 4083 | 123 | Purchase orders |
| `rez-supplier-marketplace` | 4630 | 53 | Supplier marketplace |
| `REZ-multi-warehouse` | 4061 | 71 | Warehouse management |

### AI & Intelligence (3)
| Service | Port | LOC | Description |
|---------|------|-----|-------------|
| `rez-ai-waiter` | 3024 | 221 | WhatsApp AI ordering |
| `rez-demand-forecast` | 3055 | 156 | ML demand prediction |
| `REZ-competitive-intelligence` | 4600 | 53 | Competitor analysis |

### Cross-Industry (16)
| Service | Port | LOC | Description |
|---------|------|-----|-------------|
| `REZ-b2b-integration` | 4059 | 123 | B2B supplier integration |
| `REZ-franchise-management` | 4025 | 257 | Franchise operations |
| `REZ-merchant-corpperks-bridge` | 3005 | 180 | HR integration |
| `REZ-merchant-loans-service` | 3081 | 110 | Merchant financing |
| `REZ-merchant-referral-portal` | 4062 | 55 | Referral program |
| `REZ-nexTabizz` | 4058 | 115 | QR ordering platform |
| `REZ-nexTabizz-service` | 4063 | 91 | NexTaBizz API |
| `rez-cross-merchant-service` | 4093 | 81 | Multi-merchant |
| `rez-table-booking-service` | 4070 | 125 | Reservations |
| `rez-warranty` | 4620 | 404 | Warranty management |
| `verify-qr-admin` | 4069 | 122 | QR verification |
| `rez-white-label-service` | 3083 | 98 | White-label |
| `REZ-purchase-order-mobile` | - | 105 | PO mobile app |
| `rez-merchant-corpperks-bridge` | 3005 | 180 | HR bridge |

### Frontend Apps (7) - No Backend
| Service | Type | Description |
|---------|------|-------------|
| `rez-app-merchant` | React Native | Merchant mobile app |
| `rez-barcode-scanner-ui` | HTML5 | Barcode scanner |
| `rez-business-copilot` | Next.js | AI copilot UI |
| `rez-inventory-v2-ui` | Vite/React | Inventory UI |
| `rez-merchant-app` | React Native | Merchant app |
| `rez-staff-ui` | Vite/React | Staff UI |
| `rez-staff-web` | Next.js | Staff web |

---

## industry-os Services (117)

### Restaurant Ecosystem (14)
| Service | Port | Description |
|---------|------|-------------|
| `rez-restaurant-service` | 4012 | Core restaurant API |
| `rez-restaurant-pos-service` | 4010 | Restaurant POS |
| `rez-restaurant-crm-service` | 4013 | Customer management |
| `rez-restaurant-reservations` | 4020 | Table booking |
| `rez-restaurant-inventory-service` | 4056 | Inventory |
| `rez-restaurant-analytics-service` | - | Analytics |
| `rez-restaurant-loyalty-service` | - | Loyalty |
| `rez-restaurant-reviews-service` | - | Reviews |
| `rez-restaurant-scheduling-service` | - | Scheduling |
| `rez-restaurant-admin-web` | - | Admin UI |
| `rez-restaurant-os-integration` | 4000 | Integration |
| `rez-drive-thru-kds` | 4066 | Drive-thru KDS |
| `rez-ai-restaurant` | - | AI capabilities |
| `rez-mind-restaurant-service` | - | AI recommendations |

### Hotel Ecosystem (18)
| Service | Port | Description |
|---------|------|-------------|
| `rez-hotel-service` | 4015 | Core hotel API |
| `rez-hotel-pos-service` | - | Hotel POS |
| `rez-pms-service` | 4031 | Property Management |
| `rez-booking-engine` | 4042 | Reservations |
| `rez-guest-mobile-app` | 4041 | Guest app |
| `rez-hotel-analytics-service` | 4018 | Revenue analytics |
| `rez-hotel-housekeeping-service` | 4019 | HK management |
| `rez-hotel-maintenance-service` | 4019 | Maintenance |
| `rez-hotel-messaging-service` | 4018 | Guest messaging |
| `rez-hotel-reviews-service` | 4020 | Reviews |
| `rez-channel-manager` | 4021 | OTA integration |
| `rez-room-service` | 4043 | Room service |
| `rez-laundry-service` | 4048 | Laundry |
| `rez-spa-service` | 4049 | Spa bookings |
| `rez-google-hotel-ads-service` | - | Google Ads |
| `rez-multi-property-dashboard` | 4046 | Multi-property |
| `rez-mind-hotel-service` | 4017 | AI recommendations |
| `rez-virtual-concierge-service` | 4065 | AI concierge |

### Salon Ecosystem (8)
| Service | Port | Description |
|---------|------|-------------|
| `rez-salon-service` | 4010 | Core salon API |
| `rez-salon-pos-service` | 4010 | Salon POS |
| `rez-salon-crm-service` | 4004 | Customer management |
| `rez-salon-membership-service` | - | Membership |
| `rez-salon-inventory-service` | - | Products |
| `rez-salon-whatsapp-service` | 3005 | WhatsApp booking |
| `rez-salon-qr-service` | - | QR codes |
| `rez-mind-salon-service` | 4010 | AI recommendations |

### Healthcare Ecosystem (6)
| Service | Port | Description |
|---------|------|-------------|
| `rez-healthcare-service` | 4007 | Core healthcare |
| `rez-pharmacy-service` | 4012 | Pharmacy |
| `rez-pharmacy-inventory-service` | - | Pharmacy inventory |
| `rez-pharmacy-prescription-service` | - | Prescriptions |
| `rez-pharmacy-web` | - | Pharmacy web |
| `rez-mind-pharmacy-service` | 4070 | AI pharmacy |

### Fitness Ecosystem (6)
| Service | Port | Description |
|---------|------|-------------|
| `rez-fitness-service` | 4005 | Core fitness |
| `rez-fitness-access-service` | 4015 | Access control |
| `rez-gym-analytics-service` | 4105 | Gym analytics |
| `rez-gym-class-service` | 4106 | Class management |
| `rez-gym-scheduler-service` | 4107 | Shift scheduling |
| `rez-mind-fitness-service` | - | AI trainer |

### Mind/AI Services (7)
| Service | Port | Industry |
|---------|------|----------|
| `rez-mind-hotel-service` | 4017 | Hotel |
| `rez-mind-spa-service` | 4051 | Spa |
| `rez-mind-salon-service` | 4010 | Salon |
| `rez-mind-restaurant-service` | - | Restaurant |
| `rez-mind-healthcare-service` | - | Healthcare |
| `rez-mind-fitness-service` | - | Fitness |
| `rez-mind-pharmacy-service` | 4070 | Pharmacy |

### Phase 3 Verticals (5)
| Service | Port | Industry |
|---------|------|----------|
| `rez-grocery-service` | 4052 | Grocery |
| `rez-education-service` | 4054 | Education |
| `rez-automotive-service` | 4060 | Automotive |
| `rez-fashion-service` | 4062 | Fashion |
| `rez-events-service` | 4055 | Events |

### Cross-Industry Services (21)
| Service | Port | Description |
|---------|------|-------------|
| `rez-cross-industry-loyalty-service` | 4071 | Unified loyalty |
| `rez-unified-booking-service` | 4072 | Single booking |
| `rez-payment-gateway-service` | 4032 | Payments |
| `rez-pricing-service` | 4022 | Dynamic pricing |
| `rez-currency-service` | 4035 | Multi-currency |
| `rez-language-service` | 4028 | i18n |
| `rez-survey-service` | 4030 | NPS/CSAT |
| `rez-loyalty-service` | 4037 | Loyalty |
| `rez-gift-card-service` | 4047 | Gift cards |
| `rez-self-kiosk` | 3050 | Self-service kiosk |
| `rez-warranty` | 4620 | Warranty |
| `rez-developer-portal` | 4100 | API docs |
| `rez-dynamic-pricing-service` | 4040 | Real-time pricing |
| `rez-booking-modification-service` | 4026 | Booking changes |
| `rez-rate-shopping-service` | - | Price comparison |
| `rez-food-safety-service` | - | Compliance |
| `rez-waste-management` | - | Waste tracking |
| `rez-smart-lock-service` | - | Keyless entry |
| `rez-retail-pos` | 4020 | Retail POS |
| `rez-retail-loyalty-service` | 4051 | Retail loyalty |
| `rez-pos-service` | - | POS |

---

## Complete Port Registry (70+ Ports)

| Port | Service | Industry |
|------|---------|----------|
| **3005** | REZ-merchant-corpperks-bridge, rez-salon-whatsapp-service | Cross, Salon |
| **3024** | rez-ai-waiter | Restaurant |
| **3055** | rez-demand-forecast | Cross |
| **3081** | rez-merchant-loans-service | Cross |
| **3083** | rez-white-label-service | Cross |
| **4000** | rez-restaurant-os-integration | Restaurant |
| **4005** | rez-merchant-service | **CORE** |
| **4007** | rez-healthcare-service | Healthcare |
| **4010** | rez-inventory-engine, rez-restaurant-pos-service, rez-salon-service | Common, Restaurant, Salon |
| **4011** | rez-merchant-intelligence-aggregator | Cross |
| **4012** | rez-merchant-intelligence-service, rez-salon-crm-service, rez-pharmacy-service | Cross, Salon, Healthcare |
| **4014** | rez-kds-service | Common |
| **4015** | rez-hotel-service, rez-fitness-access-service | Hotel, Fitness |
| **4017** | rez-mind-hotel-service | Hotel |
| **4018** | rez-hotel-analytics-service, rez-hotel-messaging-service | Hotel |
| **4019** | rez-hotel-housekeeping-service, rez-hotel-maintenance-service | Hotel |
| **4020** | rez-restaurant-reservations, rez-hotel-reviews-service, rez-retail-pos | Restaurant, Hotel, Retail |
| **4021** | rez-channel-manager | Hotel |
| **4022** | rez-merchant-copilot, rez-pricing-service | Cross |
| **4025** | REZ-franchise-management | Cross |
| **4026** | rez-booking-modification-service | Cross |
| **4028** | rez-language-service | Common |
| **4030** | rez-menu-service, rez-survey-service | Common |
| **4031** | rez-pms-service | Hotel |
| **4032** | rez-store-onboarding, rez-payment-gateway-service | Cross, Common |
| **4035** | rez-currency-service | Common |
| **4037** | rez-loyalty-service | Common |
| **4040** | rez-merchant-integrations, rez-dynamic-pricing-service | Cross |
| **4041** | REZ-merchant-trust-bridge | Cross |
| **4042** | rez-booking-engine | Hotel |
| **4043** | rez-room-service | Hotel |
| **4046** | rez-multi-property-dashboard | Hotel |
| **4047** | rez-gift-card-service | Common |
| **4048** | rez-laundry-service | Hotel |
| **4049** | rez-spa-service | Spa |
| **4051** | rez-mind-spa-service, rez-retail-loyalty-service | Spa, Retail |
| **4052** | rez-grocery-service | Grocery |
| **4054** | rez-education-service | Education |
| **4055** | rez-events-service, rez-hotel-channel-integration-service | Events, Hotel |
| **4056** | rez-restaurant-inventory-service | Restaurant |
| **4058** | REZ-nexTabizz | Cross |
| **4059** | REZ-b2b-integration | Cross |
| **4060** | REZ-dashboard, rez-automotive-service | Cross, Automotive |
| **4061** | REZ-multi-warehouse | Cross |
| **4062** | REZ-merchant-referral-portal | Cross |
| **4063** | REZ-nexTabizz-service | Cross |
| **4065** | rez-virtual-concierge-service | Hotel |
| **4066** | rez-drive-thru-kds | Restaurant |
| **4069** | verify-qr-admin | Cross |
| **4070** | rez-table-booking-service, rez-mind-pharmacy-service | Restaurant, Healthcare |
| **4071** | rez-cross-industry-loyalty-service | Cross |
| **4072** | rez-unified-booking-service | Cross |
| **4080** | rez-kitchen-display | Restaurant |
| **4081** | rez-pos-service | Common |
| **4082** | rez-kitchen-ai | Restaurant |
| **4083** | rez-procurement-service | Common |
| **4084** | rez-pos-inventory-sync | Common |
| **4091** | rez-staff-service | Common |
| **4092** | rez-self-checkout | Retail |
| **4093** | rez-cross-merchant-service | Cross |
| **4100** | rez-developer-portal | Cross |
| **4105** | rez-gym-analytics-service | Fitness |
| **4106** | rez-gym-class-service | Fitness |
| **4107** | rez-gym-scheduler-service | Fitness |
| **4600** | REZ-competitive-intelligence | Cross |
| **4601** | rez-multi-location | Cross |
| **4610** | rez-payroll | Common |
| **4620** | rez-warranty | Cross |
| **4625** | rez-inventory-alerts | Common |
| **4630** | rez-supplier-marketplace | Cross |

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
| Real-time | Socket.io |

---

## HOJAI Industry AI Integration

| REZ Merchant | HOJAI Service | Port |
|-------------|---------------|------|
| Restaurant | waitron | 4820 |
| Hotel | staybot | 4840 |
| Salon | glamai | 4860 |
| Healthcare | carecode | 4102 |
| Retail | shopflow | 4830 |
| Fitness | fitmind | 4801 |

---

**Last Updated:** June 5, 2026  
**Version:** 4.0  
**Status:** PRODUCTION READY
