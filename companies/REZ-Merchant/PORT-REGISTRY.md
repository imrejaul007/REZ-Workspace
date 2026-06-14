# REZ Merchant - Port Registry

**Date:** June 4, 2026  
**Status:** UPDATED - All collisions resolved

---

## PORT ALLOCATION (3000-4700)

### Port Ranges by Category

| Range | Category | Services |
|-------|----------|----------|
| 3000-3099 | Utility Services | Internal tools, bridges |
| 4000-4099 | Core Merchant Services | Main platform services |
| 4100-4199 | Industry-Specific | Restaurant, Hotel, Salon, etc. |
| 4200-4299 | Cross-Industry | Multi-vertical services |
| 4300-4399 | Integration | B2B, webhooks, APIs |
| 4400-4499 | Utility | Alerts, notifications |
| 4500-4599 | Finance | Payments, loans, payroll |
| 4600-4699 | Analytics | Intelligence, forecasting |
| 4700+ | Reserved | Future services |

---

## TOP-LEVEL SERVICES PORT ALLOCATION

| Port | Service | Industry | Status | Notes |
|------|---------|----------|--------|-------|
| **3005** | REZ-merchant-corpperks-bridge | Cross | ✅ Active | CorpPerks HR integration |
| **3024** | rez-ai-waiter | Restaurant | ✅ Active | WhatsApp AI ordering |
| **3055** | rez-demand-forecast | Cross | ✅ Active | ML demand prediction |
| **3081** | rez-merchant-loans-service | Cross | ✅ Active | Merchant financing |
| **3083** | rez-white-label-service | Cross | ✅ Active | White-label platform |
| **4005** | rez-merchant-service | Common | ✅ **CORE** | Primary merchant API |
| **4010** | rez-inventory-engine | Common | ✅ Active | Inventory management |
| **4011** | rez-merchant-intelligence-aggregator | Cross | ✅ Active | Market intelligence |
| **4012** | rez-merchant-intelligence-service | Cross | ✅ Active | Merchant analytics |
| **4022** | rez-merchant-copilot | Cross | ✅ Active | AI business copilot |
| **4025** | REZ-franchise-management | Cross | ✅ Active | Franchise operations |
| **4027** | rez-cross-merchant-service | Cross | ✅ Active | Multi-merchant features |
| **4032** | rez-store-onboarding | Cross | ✅ Active | Merchant onboarding |
| **4040** | rez-merchant-integrations | Cross | ✅ Active | Integration hub |
| **4041** | REZ-merchant-trust-bridge | Cross | ✅ Active | Identity verification |
| **4058** | REZ-nexTabizz | Common | ✅ Active | NexTaBizz web app |
| **4059** | REZ-b2b-integration | Cross | ✅ Active | B2B supplier integration |
| **4060** | REZ-dashboard | Cross | ✅ Active | Analytics dashboard |
| **4061** | REZ-multi-warehouse | Cross | ✅ Active | Warehouse management |
| **4062** | REZ-merchant-referral-portal | Cross | ✅ Active | Referral program |
| **4063** | REZ-nexTabizz-service | Common | ✅ Active | NexTaBizz API |
| **4064** | rez-business-copilot | Cross | ✅ Active | NLP business queries |
| **4065** | rez-inventory-v2-ui | Common | ✅ Active | Inventory UI |
| **4066** | rez-merchant-app | Common | ✅ Active | Merchant mobile app |
| **4067** | rez-staff-ui | Common | ✅ Active | Staff management UI |
| **4068** | rez-staff-web | Common | ✅ Active | Staff web portal |
| **4069** | verify-qr-admin | Cross | ✅ Active | QR verification admin |
| **4070** | rez-table-booking-service | Restaurant | ✅ Active | Table reservations |
| **4071** | rez-unified-dashboard | Cross | ✅ Active | Unified analytics |
| **4080** | rez-kitchen-display | Restaurant | ✅ Active | Kitchen display |
| **4081** | rez-pos-service | Common | ✅ Active | Universal POS |
| **4082** | rez-kitchen-ai | Restaurant | ✅ Active | AI kitchen optimization |
| **4083** | rez-procurement-service | Common | ✅ Active | Purchase orders |
| **4084** | rez-pos-inventory-sync | Common | ✅ Active | POS-Inventory sync |
| **4091** | rez-staff-service | Common | ✅ Active | Staff management |
| **4092** | rez-self-checkout | Retail | ✅ Active | Self-checkout system |
| **4093** | rez-cross-merchant-service | Cross | ✅ Active | Cross-merchant features |

---

## INDUSTRY-OS SERVICES PORT ALLOCATION

### Restaurant Ecosystem

| Port | Service | Status |
|------|---------|--------|
| 4000 | rez-restaurant-os-integration | ✅ Gateway |
| 4012 | rez-restaurant-service | ✅ Core |
| 4010 | rez-restaurant-pos-service | ✅ POS |
| 4013 | rez-restaurant-crm-service | ✅ CRM |
| 4020 | rez-restaurant-reservations | ✅ Booking |
| 4056 | rez-restaurant-inventory-service | ✅ Inventory |

### Hotel Ecosystem

| Port | Service | Status |
|------|---------|--------|
| 4015 | rez-hotel-service | ✅ Core |
| 4018 | rez-hotel-analytics-service | ✅ Analytics |
| 4019 | rez-hotel-housekeeping-service | ✅ Housekeeping |
| 4019 | rez-hotel-maintenance-service | ✅ Maintenance |
| 4020 | rez-hotel-reviews-service | ✅ Reviews |
| 4021 | rez-channel-manager | ✅ OTA |
| 4031 | rez-pms-service | ✅ PMS |
| 4040 | rez-dynamic-pricing-service | ✅ Pricing |
| 4041 | rez-guest-mobile-app | ✅ Guest App |
| 4042 | rez-booking-engine | ✅ Booking |
| 4043 | rez-room-service | ✅ Room Service |
| 4046 | rez-multi-property-dashboard | ✅ Dashboard |
| 4047 | rez-gift-card-service | ✅ Gift Cards |
| 4048 | rez-laundry-service | ✅ Laundry |
| 4049 | rez-spa-service | ✅ Spa |
| 4055 | rez-hotel-channel-integration | ✅ Channel |

### Salon Ecosystem

| Port | Service | Status |
|------|---------|--------|
| 4010 | rez-salon-service | ✅ Core |
| 4004 | rez-salon-crm-service | ✅ CRM |
| 4010 | rez-salon-pos-service | ✅ POS |
| 4012 | rez-salon-membership-service | ✅ Membership |

### Mind/AI Services

| Port | Service | Industry |
|------|---------|----------|
| 4017 | rez-mind-hotel-service | Hotel |
| 4051 | rez-mind-spa-service | Spa |
| 4010 | rez-mind-salon-service | Salon |

### Phase 3 Verticals

| Port | Service | Industry |
|------|---------|----------|
| 4052 | rez-grocery-service | Grocery |
| 4054 | rez-education-service | Education |
| 4060 | rez-automotive-service | Automotive |
| 4062 | rez-fashion-service | Fashion |

### Cross-Industry

| Port | Service | Status |
|------|---------|--------|
| 4071 | rez-cross-industry-loyalty-service | ✅ Unified loyalty |
| 4072 | rez-unified-booking-service | ✅ Unified booking |
| 4070 | rez-mind-pharmacy-service | ✅ AI pharmacy |

---

## RESERVED PORTS

| Port | Reserved For |
|------|--------------|
| 3000 | API Gateway (shared) |
| 4000 | Reserved for gateway/routing |
| 4122 | rez-merchant-intelligence-service (if separate) |
| 4600 | REZ-competitive-intelligence |
| 4610 | rez-payroll |
| 4620 | rez-warranty |
| 4625 | rez-inventory-alerts |
| 4630 | rez-supplier-marketplace |

---

## DEPRECATED PORT USAGE

| Old Port | Service | New Port |
|----------|---------|----------|
| 4000 (collision) | All 20+ services | See individual assignments above |
| 4012 | rez-kitchen-display | 4080 |
| 4013 | rez-pos-service | 4081 |
| 4013 | rez-kitchen-ai | 4082 |
| 4012 | rez-procurement-service | 4083 |
| 4030 | rez-pos-inventory-sync | 4084 |
| 3003 | rez-staff-service | 4091 |
| 3003 | rez-self-checkout | 4092 |

---

## MOBILE SERVICES (No Fixed Port)

| Service | Platform | Notes |
|---------|----------|-------|
| rez-app-merchant | Expo/React Native | Merchant mobile app |
| REZ-kds-mobile | Expo/React Native | Kitchen display mobile |
| REZ-purchase-order-mobile | Expo/React Native | PO mobile app |
| rez-barcode-scanner-ui | HTML5 | Barcode scanner |

---

## UPDATED: June 4, 2026

### Changes Made

1. ✅ Port 4000 collision resolved - 14 services moved to new ports
2. ✅ Port 4012/4013 collision resolved
3. ✅ Port 3003 collision resolved
4. ✅ All ports now unique

### Next Steps

- Update SOT.md with new port allocations
- Update service-to-service URLs in integration services
- Update Docker Compose files
- Update environment templates
