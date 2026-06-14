# StayOwn Hospitality - Master Architecture

**Version:** 2.0 | **Date:** June 10, 2026

---

## OVERVIEW

**StayOwn Hospitality** is the hospitality division of RTNM Digital. It provides hotel management, guest services, and vacation rental solutions to the entire REZ ecosystem.

### Company Structure

```
RTNM Digital
└── StayOwn Hospitality (github.com/imrejaul007/StayOwn-Hospitality)
    ├── Guest-Facing Services
    ├── REZ-Merchant Hotel OS (Operations)
    └── RidZa Hotel OTA (Booking Platform)
```

---

## PRODUCT STRUCTURE

### 1. StayOwn (Guest-Facing)

| Product | Port | Purpose |
|---------|------|---------|
| **ai-front-desk** | 3800 | AI Virtual Concierge - powered by HOJAI Staybot |
| **rez-stayown-service** | 4015 | Room QR - guest check-in, services, checkout |
| **hotel-habixo-service** | 3007 | Vacation rentals - Airbnb-style management |
| **StayOwn-Mobile** | - | Guest mobile app (Expo) |
| **StayOwn-Staff-App** | - | Staff mobile app (Expo) |

### 2. REZ-Merchant Hotel OS (Operations)

**Location:** `REZ-Merchant/industry-os/`

| Service | Port | Purpose |
|---------|------|---------|
| **rez-pms-service** | 4031 | Property Management System |
| **rez-hotel-service** | 4020 | Core hotel management |
| **rez-hotel-housekeeping** | 4021 | Housekeeping tasks, room status |
| **rez-hotel-maintenance** | 4019 | Maintenance requests |
| **rez-hotel-messaging** | 4024 | Guest messaging |
| **rez-hotel-analytics** | 4025 | Analytics dashboard |
| **rez-mind-hotel-service** | 4017 | AI intelligence |
| **rez-dynamic-pricing** | 4040 | ML-based pricing |
| **rez-booking-engine** | 4042 | Direct booking |
| **rez-room-service** | 4043 | F&B room service |
| **rez-gift-card-service** | 4047 | Gift cards |
| **rez-laundry-service** | 4048 | Laundry orders |
| **rez-spa-service** | 4049 | Spa bookings |
| **rez-guest-mobile-app** | 4028 | Guest app backend |
| **rez-multi-property-dashboard** | 4029 | Chain dashboard |
| **rez-hotel-channel-integration** | 4022 | OTA sync |

### 3. RidZa Hotel OTA (Booking Platform)

**Location:** `RidZa/Hotel OTA/`

| App | Port | Purpose |
|-----|------|---------|
| **ota-web** | 3000 | Public hotel booking website |
| **hotel-panel** | 3001 | Hotel management interface |
| **admin** | 3002 | Admin dashboard |
| **corporate-panel** | 3003 | Corporate booking portal |
| **api** | 4000 | API gateway |
| **mobile** | 3004 | Mobile app |
| **hotel-management-master** | - | Enterprise PMS (PostgreSQL) |

---

## SERVICE CONNECTIONS

### Integration Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         STAYOWN HOSPITALITY                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     GUEST EXPERIENCE LAYER                       │   │
│  │  StayOwn-Mobile (Guest App)                                     │   │
│  │  StayOwn-Staff-App (Staff App)                                  │   │
│  │  RidZa ota-web (Public Booking)                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              │                                          │
│                              ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                   SERVICES LAYER                                │   │
│  │                                                                  │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │   │
│  │  │ ai-front-desk│  │rez-stayown   │  │hotel-habixo │          │   │
│  │  │    (3800)   │  │   (4015)     │  │   (3007)    │          │   │
│  │  └──────┬───────┘  └──────┬───────┘  └──────────────┘          │   │
│  │         │                  │                                    │   │
│  │         └────────────────┼──────────────────────────────────┐  │   │
│  │                          │                                  │  │   │
│  │                          ▼                                  │  │   │
│  │  ┌─────────────────────────────────────────────────────────┐│  │   │
│  │  │            HOTEL OS INTEGRATION (3899)                  ││  │   │
│  │  │   Unified integration layer connecting all services     ││  │   │
│  │  └─────────────────────────────────────────────────────────┘│  │   │
│  │                          │                                  │  │   │
│  │         ┌────────────────┼────────────────────────────────┘  │   │
│  │         │                │                                  │   │
│  │         ▼                ▼                                  │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │   │
│  │  │    PMS      │  │ Housekeeping│  │ Maintenance │          │   │
│  │  │  (4031)    │  │   (4021)    │  │   (4019)   │          │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘          │   │
│  │                                                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              │                                          │
│                              ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      HOJAI AI LAYER                              │   │
│  │  Staybot (4840) │ Memory (4520) │ Agents (4550)                │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              │                                          │
│                              ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    RABTUL INFRASTRUCTURE                         │   │
│  │  Auth (4002) │ Payment (4001) │ Wallet (4004) │ Notifications   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## INTEGRATION FLOWS

### 1. Guest Booking Flow

```
Guest (RidZa OTA)
    │
    ▼
RidZa Hotel OTA (3000)
    │
    ├──► API Gateway (4000)
    │         │
    │         ▼
    │    REZ-Merchant Booking Engine (4042)
    │         │
    │         ▼
    │    PMS (4031) ←── Room Assignment
    │
    └──► StayOwn Integration (3899)
              │
              ├──► Guest Twin Created
              │
              └──► AI Front Desk (3800)
                        │
                        └──► Welcome message via Staybot
```

### 2. Check-in Flow

```
Guest arrives
    │
    ▼
StayOwn Guest App / Room QR
    │
    ▼
rez-stayown-service (4015)
    │
    ├──► PMS (4031) - Update room status
    ├──► Housekeeping (4021) - Notify preparation
    ├──► AI Front Desk (3800) - Welcome message
    └──► Digital Key - Activated
```

### 3. AI Concierge Flow

```
Guest sends message
    │
    ▼
AI Front Desk (3800)
    │
    ├──► Fast path: Local pattern match (rooms, wifi, restaurant)
    │
    └──► Complex: HOJAI Staybot (4840)
              │
              └──► AI response with actions
```

### 4. Checkout Flow

```
Guest initiates checkout
    │
    ▼
rez-stayown-service (4015)
    │
    ├──► Calculate final bill from all charges
    ├──► Payment (4001) - Process payment
    ├──► Invoice generated
    ├──► Digital key revoked
    ├──► Housekeeping (4021) - Notify cleaning
    └──► Feedback survey via Staybot
```

---

## PORT ALLOCATION

| Port | Service | Company | Purpose |
|------|---------|---------|---------|
| **3000** | RidZa ota-web | RidZa | Public booking website |
| **3001** | RidZa hotel-panel | RidZa | Hotel admin |
| **3002** | RidZa admin | RidZa | Platform admin |
| **3007** | hotel-habixo-service | StayOwn | Vacation rentals |
| **3800** | ai-front-desk | StayOwn | AI concierge |
| **3810** | minibar-service | StayOwn | Smart minibar tracking |
| **3811** | hotel-restaurant-booking | StayOwn | Restaurant reservations |
| **3812** | hotel-spa-booking | StayOwn | Spa appointments |
| **3814** | room-controls | StayOwn | AC/TV/lights IoT control |
| **3815** | parking-service | StayOwn | Valet, EV charging |
| **3816** | lost-found | StayOwn | Lost item tracking |
| **3817** | upsell-engine | StayOwn | Room upgrades, add-ons |
| **3818** | loyalty-system | StayOwn | Points, tiers, rewards |
| **3819** | review-manager | StayOwn | Review requests, responses |
| **3820** | feedback-survey | StayOwn | Mid-stay feedback, NPS |
| **3821** | concierge-desk | StayOwn | Human concierge queue |
| **3825** | smart-lock-service | StayOwn | BLE/NFC/IoT locks |
| **3826** | predictive-housekeeping | StayOwn | ML-based cleaning |
| **3827** | zero-checkout-automation | StayOwn | Auto invoice/payment |
| **3828** | pre-arrival-service | StayOwn | Preference collection |
| **3899** | hotel-os-integration | StayOwn | Integration layer |
| **4000** | RidZa api | RidZa | API gateway |
| **4015** | rez-stayown-service | StayOwn | Room QR |
| **4017** | rez-mind-hotel-service | REZ-Merchant | AI intelligence |
| **4019** | rez-hotel-maintenance | REZ-Merchant | Maintenance |
| **4020** | rez-hotel-service | REZ-Merchant | Core management |
| **4021** | rez-hotel-housekeeping | REZ-Merchant | Housekeeping |
| **4022** | rez-hotel-channel-integration | REZ-Merchant | OTA sync |
| **4024** | rez-hotel-messaging | REZ-Merchant | Messaging |
| **4025** | rez-hotel-analytics | REZ-Merchant | Analytics |
| **4028** | rez-guest-mobile-app | REZ-Merchant | Guest app backend |
| **4029** | rez-multi-property-dashboard | REZ-Merchant | Chain dashboard |
| **4031** | rez-pms-service | REZ-Merchant | PMS |
| **4040** | rez-dynamic-pricing | REZ-Merchant | ML pricing |
| **4042** | rez-booking-engine | REZ-Merchant | Direct booking |
| **4043** | rez-room-service | REZ-Merchant | Room service |
| **4047** | rez-gift-card-service | REZ-Merchant | Gift cards |
| **4048** | rez-laundry-service | REZ-Merchant | Laundry |
| **4049** | rez-spa-service | REZ-Merchant | Spa |
| **4703** | HOJAI GENIE Memory | HOJAI | Guest memory |
| **4720** | hojai-memory-hotel | StayOwn | Hotel memory layer |
| **4840** | Staybot | HOJAI | Hotel AI |
| **4870** | voice-hotel-agent | StayOwn | Phone AI agent |

---

## TECHNOLOGY STACK

| Layer | Technology |
|-------|------------|
| **Runtime** | Node.js 20 LTS |
| **Framework** | Express.js, Next.js 14 |
| **Database** | MongoDB 7.0, PostgreSQL (RidZa) |
| **Cache** | Redis 7.2 |
| **AI** | HOJAI Staybot, Memory, Agents |
| **Payments** | RABTUL (Razorpay, UPI, Wallet) |
| **Mobile** | React Native (Expo SDK 50/53) |
| **Container** | Docker, Kubernetes |
| **CI/CD** | GitHub Actions |

---

## DATA FLOW

### Guest Data Flow

```
RidZa OTA (booking) ──► PMS ──► Guest Twin (StayOwn)
                              │
                              ├──► Preferences (HOJAI Memory)
                              ├──► History (StayOwn)
                              └──► Analytics (REZ-Merchant)
```

### Revenue Flow

```
Guest books ──► Payment (RABTUL) ──► Wallet (REZ Coins)
                              │
                              └──► Loyalty points (StayOwn)
```

---

## GITHUB REPOSITORIES

| Company | Repository | Services |
|---------|------------|----------|
| **StayOwn** | github.com/imrejaul007/StayOwn-Hospitality | Guest services, apps |
| **REZ-Merchant** | github.com/imrejaul007/REZ-Merchant | Hotel OS |
| **RidZa** | github.com/imrejaul007/RTNM-Group | Hotel OTA |
| **HOJAI AI** | github.com/imrejaul007/hojai-ai | AI services |

---

## DEPRECATED / MOVED

The following were previously in wrong locations and have been moved:

| Old Location | New Location |
|--------------|--------------|
| `RidZa/Hotel OTA` | Should be under StayOwn or REZ-Merchant |

---

## THE INVISIBLE HOTEL - COMPLETE STORY

The Invisible Hotel is an autonomous AI-driven hotel experience where the guest journey is seamless and effortless.

### Complete Guest Journey

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        THE INVISIBLE HOTEL                               │
└─────────────────────────────────────────────────────────────────────────┘

  BOOKING          PRE-ARRIVAL         CHECK-IN           STAY
  ───────         ───────────         ────────          ─────
     │                 │                  │                │
     ▼                 ▼                  ▼                ▼
  Guest          Collect prefs     Auto key         AI learns
  books          via email/SMS     activates        preferences
     │                 │                  │                │
     │            Room prep         Welcome           Services
     │            based on          message           anticipate
     │            preferences        via app           needs
     │                 │                  │                │
     └─────────────────┴──────────────────┴────────────────┘
                                  │
                                  ▼
                              CHECKOUT
                              ───────
                                 │
                    Zero checkout automation
                    - Auto invoice generation
                    - Payment settlement
                    - Lock revocation
                    - Review request
```

### All Invisible Hotel Services

| Port | Service | Purpose |
|------|---------|---------|
| **3828** | pre-arrival-service | Collect guest preferences before arrival |
| **4720** | hojai-memory-hotel | Guest Twin memory, cross-stay preferences |
| **3825** | smart-lock-service | BLE/NFC/IoT lock, auto key activation |
| **3800** | ai-front-desk | AI concierge (HOJAI Staybot) |
| **4870** | voice-hotel-agent | Phone AI agent for voice requests |
| **3826** | predictive-housekeeping | ML-based cleaning predictions |
| **3810** | minibar-service | Smart minibar, auto-billing |
| **3811** | hotel-restaurant-booking | Restaurant reservations, room charging |
| **3812** | hotel-spa-booking | Spa appointments, therapist scheduling |
| **3814** | room-controls | AC/TV/lights IoT control via MQTT |
| **3815** | parking-service | Valet, EV charging, spot booking |
| **3816** | lost-found | Item tracking, guest notification |
| **3817** | upsell-engine | Dynamic upsell offers at booking |
| **3818** | loyalty-system | Points, tiers, rewards |
| **3827** | zero-checkout-automation | Auto invoice, payment, lock revoke |
| **3819** | review-manager | Review requests, sentiment analysis |
| **3820** | feedback-survey | Mid-stay feedback, NPS tracking |
| **3821** | concierge-desk | Human concierge queue, escalations |
| **3899** | hotel-os-integration | Unified integration layer |

### Integration Points

```
External Services Used:
├── HOJAI AI (ports 4500-4899)
│   ├── Staybot (4840) - AI concierge
│   ├── Memory (4520) - Guest memory
│   └── GENIE (4703) - Personal AI
├── RABTUL Technologies
│   ├── Payment (4001) - Checkout settlement
│   ├── Auth (4002) - Guest authentication
│   └── Wallet (4004) - REZ Coins
└── REZ-Merchant Hotel OS
    ├── PMS (4031) - Room management
    ├── Housekeeping (4021) - Task coordination
    └── Booking (4042) - Reservations
```

### Service Dependencies

| Service | Depends On | Provides To |
|---------|-----------|-------------|
| pre-arrival-service | guest-profile | housekeeping, room-controls |
| hojai-memory-hotel | HOJAI Memory | all AI services |
| smart-lock-service | PMS | zero-checkout |
| zero-checkout-automation | minibar, restaurant, spa | billing |
| voice-hotel-agent | AI Front Desk | all services |
| upsell-engine | booking-service | checkout |

---

**Document Version:** 3.0
**Last Updated:** June 11, 2026
**Owner:** StayOwn Hospitality