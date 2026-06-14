# ReZ Ride — Complete Project Plan

**Version:** 1.0
**Date:** May 17, 2026
**Phase:** Planning Complete

---

## Executive Summary

ReZ Ride is **India's first commission-free ride-hailing platform** powered by in-vehicle advertising. Drivers keep 100% of fares, users earn 10% cashback, and advertisers reach intent-qualified passengers in real-time.

**Key Differentiator:** Cross-promotional campaigns with the ReZ ecosystem allow merchants to reward customers with ride credits, creating a powerful network effect.

---

## Product Vision

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                         REZ RIDE ECOSYSTEM                                  │
│                                                                             │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                 │
│  │   RESTAURANT │     │    SALON    │     │    HOTEL    │                 │
│  │             │     │             │     │             │                 │
│  │  Book us,  │     │  Visit us,  │     │  Stay with  │                 │
│  │  get ₹50 off│     │  get free   │     │  us, get 2  │                 │
│  │  your ride  │     │  auto ride  │     │  free rides │                 │
│  └──────┬──────┘     └──────┬──────┘     └──────┬──────┘                 │
│         │                     │                     │                         │
│         └─────────────────────┼─────────────────────┘                         │
│                               │                                             │
│                               ▼                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     REZ MEDIA (AdsBazaar)                           │   │
│  │                                                                       │   │
│  │   • Campaign Management    • Voucher Generation                     │   │
│  │   • Attribution Tracking   • Settlement & Billing                   │   │
│  │                                                                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                               │                                             │
│                               ▼                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         REZ RIDE                                     │   │
│  │                                                                       │   │
│  │   ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐    │   │
│  │   │  User App │  │Driver App │  │  Vehicle  │  │  Backend  │    │   │
│  │   │           │  │           │  │  Screens  │  │  Services │    │   │
│  │   └───────────┘  └───────────┘  └───────────┘  └───────────┘    │   │
│  │                                                                       │   │
│  │   • 0% Commission    • 10% Cashback    • Intent-Targeted Ads      │   │
│  │                                                                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       REZ WALLET                                     │   │
│  │                                                                       │   │
│  │   • Ride Credits  • Service Credits  • Cashback  • Rewards       │   │
│  │                                                                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Complete Feature Set

### Phase 1: MVP (Months 1-3)

#### User App Features (12)

| # | Feature | Description | Priority |
|---|---------|-------------|----------|
| 1 | Phone OTP Login | Login with phone + OTP | P0 |
| 2 | Vehicle Selection | Auto, Cab, SUV options | P0 |
| 3 | Location Input | Pickup & drop with autocomplete | P0 |
| 4 | Fare Estimation | Upfront price before booking | P0 |
| 5 | Driver Matching | Nearest driver via geospatial index | P0 |
| 6 | Real-time Tracking | Live driver location on map | P0 |
| 7 | In-ride Display | Route, ETA, driver info | P0 |
| 8 | Ride Completion | Final fare, receipt, payment | P0 |
| 9 | Ride History | Past rides with receipts | P0 |
| 10 | Wallet Integration | ReZ Wallet balance & auto-pay | P0 |
| 11 | Share Trip | Live location sharing | P0 |
| 12 | SOS Button | Emergency assistance | P0 |

#### Driver App Features (10)

| # | Feature | Description | Priority |
|---|---------|-------------|----------|
| 1 | Driver Login | Phone + vehicle registration | P0 |
| 2 | Go Online/Offline | Toggle availability | P0 |
| 3 | Ride Requests | Accept/decline incoming | P0 |
| 4 | GPS Navigation | Turn-by-turn to pickup | P0 |
| 5 | Start/End Ride | Trip controls | P0 |
| 6 | Earnings Dashboard | Today's, weekly earnings | P0 |
| 7 | Bank/UPI Setup | Payout destination | P0 |
| 8 | OTP Verification | Confirm rider | P0 |
| 9 | Call Rider | One-tap call | P1 |
| 10 | Payout History | Past payouts | P1 |

#### Backend Services (8)

| # | Service | Description | Priority |
|---|---------|-------------|----------|
| 1 | Ride Service | Create, manage, track rides | P0 |
| 2 | Driver Service | Onboarding, status, matching | P0 |
| 3 | Fare Engine | Calculate fares by vehicle | P0 |
| 4 | Dispatch Engine | Match riders to drivers | P0 |
| 5 | Geospatial Index | Redis GEO for nearby drivers | P0 |
| 6 | ETA Calculator | Route time from Maps API | P0 |
| 7 | Payment Processing | ReZ Wallet integration | P0 |
| 8 | WebSocket Server | Real-time updates | P0 |

### Phase 2: Intelligence & Cashback (Months 4-5)

#### New Features (18)

| # | Feature | Description | Priority |
|---|---------|-------------|----------|
| 1 | 10% Cashback | Auto-credit after ride | P0 |
| 2 | Ad Targeting | ReZ Mind → AdsBazaar | P0 |
| 3 | Impression Tracker | Track ad views | P0 |
| 4 | Ad Revenue Display | Driver earnings from ads | P0 |
| 5 | Cashback Celebration | "You earned ₹X" | P0 |
| 6 | In-ride Ads | Display ads during ride | P1 |
| 7 | Rating System | 1-5 star rating | P1 |
| 8 | Driver Ad Revenue | 60% share per ride | P1 |
| 9 | Weekly Payout | Auto-payout to bank/UPI | P1 |
| 10 | ReZ Mind Integration | User intent for targeting | P0 |
| 11 | Intent Capture | Capture ride intents | P1 |
| 12 | Voucher Redemption | Apply merchant vouchers | P1 |
| 13 | Cross-promotion | Service → Ride campaigns | P1 |
| 14 | Settlement Service | Merchant billing | P1 |
| 15 | Campaign Templates | Pre-built for merchants | P2 |
| 16 | Ad Analytics Dashboard | Impressions, CPM | P1 |
| 17 | User Voucher Wallet | View earned vouchers | P1 |
| 18 | Voucher Notifications | Push when earned | P1 |

### Phase 3: Vehicle Screens & Scale (Months 6-8)

#### Vehicle Screen Features (20)

| # | Feature | Description | Priority |
|---|---------|-------------|----------|
| 1 | Screen Registration | Register screen to vehicle | P0 |
| 2 | Ad Display Mode | Full-screen ad during ride | P0 |
| 3 | Real-time Push | Push ads via WebSocket | P0 |
| 4 | Impression Tracking | View duration logging | P0 |
| 5 | Heartbeat Monitoring | Online/offline status | P0 |
| 6 | Driver Info Overlay | Name, vehicle, trip info | P1 |
| 7 | Tap Interactions | Passenger taps → log | P1 |
| 8 | Uptime Compliance | Track 70% requirement | P1 |
| 9 | OTA Updates | Remote app updates | P1 |
| 10 | Screen Dashboard | Owner earnings & status | P1 |
| 11 | Hero Image Ads | Full-screen product | P0 |
| 12 | Video Ads | 15-30 sec playback | P1 |
| 13 | Offline Mode | Cache ads when offline | P1 |
| 14 | Health Monitoring | Battery, storage | P1 |
| 15 | Revenue Attribution | Link to driver earnings | P0 |
| 16 | Promo Cards | Split layout ads | P2 |
| 17 | Carousel Ads | Swipeable products | P2 |
| 18 | Network Status | Show connectivity | P1 |
| 19 | Brightness Auto | Adjust based on light | P2 |
| 20 | Screen Deactivation | Disable non-compliant | P2 |

### Phase 4: Advanced Features (Months 9-12)

#### Pricing (6)

| # | Feature | Description | Priority |
|---|---------|-------------|----------|
| 1 | Surge Pricing | Demand-based multiplier | P1 |
| 2 | Dynamic Pricing | Real-time rate adjustment | P1 |
| 3 | H3 Zone Management | Geofenced pricing zones | P1 |
| 4 | Time-based Pricing | Peak/off-peak rates | P1 |
| 5 | Night Charges | 1.25x (11 PM - 6 AM) | P1 |
| 6 | Airport Rates | Special flat rates | P2 |

#### Transport (5)

| # | Feature | Description | Priority |
|---|---------|-------------|----------|
| 1 | Bus Booking | Shared ride, fixed route | P1 |
| 2 | Seat Selection | Choose available seat | P1 |
| 3 | Scheduled Rides | Book for later time | P2 |
| 4 | Multi-stop | Add intermediate stops | P2 |
| 5 | Pool Rides | Share with similar routes | P3 |

#### Enterprise (5)

| # | Feature | Description | Priority |
|---|---------|-------------|----------|
| 1 | Corporate Accounts | Company billing | P2 |
| 2 | Employee Dashboard | Track company rides | P2 |
| 3 | Policy Controls | Spending limits, zones | P2 |
| 4 | Invoice Generation | Monthly invoices | P2 |
| 5 | API Integration | Book via company portal | P2 |

---

## Cross-Promotional Campaigns

### Campaign Types

| Type | Trigger | Reward | Example |
|------|---------|--------|---------|
| **Service → Ride** | Book restaurant/salon | ₹50 off ride | "Dine at Restaurant X, get ₹50 off" |
| **Shop → Ride** | Spend ₹500+ | Free auto ride | "Shop ₹500 at Store X, get free auto" |
| **Ride → Service** | Complete ride | 20% off restaurant | "Take ReZ Ride to Restaurant X, get 20% off" |
| **Bundle** | Book multiple services | 25% off | "Hotel + Cab + Restaurant = 25% off" |

### Campaign Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CAMPAIGN REDEMPTION FLOW                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  USER COMPLETES SERVICE                                                    │
│  (Restaurant Order, Salon Visit, etc.)                                      │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ SERVICE WEBHOOK → AdsBazaar                                           │   │
│  │ { event: 'service.completed', merchant_id, user_id, amount }        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ CAMPAIGN ELIGIBILITY CHECK                                           │   │
│  │ ✓ Merchant has active campaign?                                      │   │
│  │ ✓ Amount >= threshold?                                              │   │
│  │ ✓ Budget remaining?                                                  │   │
│  │ ✓ User not already used?                                            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ GENERATE VOUCHER                                                     │   │
│  │ { voucher_id, value: 50, type: 'ride_credit', expires_in: 7d }   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ CREDIT TO WALLET                                                     │   │
│  │ POST /wallet/credit                                                 │   │
│  │ User receives ₹50 ride credit                                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ NOTIFY USER                                                          │   │
│  │ 📱 "You earned ₹50 off your next ReZ Ride!"                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Technical Architecture

### Service Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND LAYER                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐             │
│  │   User App   │    │  Driver App  │    │ Vehicle Screen│             │
│  │ React Native │    │ React Native │    │ WebView/      │             │
│  │              │    │              │    │ Android App   │             │
│  └──────────────┘    └──────────────┘    └──────────────┘             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         API GATEWAY                                         │
│                    (Authentication, Rate Limiting)                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
          ┌──────────────────────────┼──────────────────────────┐
          │                          │                          │
          ▼                          ▼                          ▼
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│  Ride Service  │      │ Driver Service  │      │   Ad Service   │
│                 │      │                 │      │                 │
│ • Booking       │      │ • Onboarding    │      │ • Targeting     │
│ • Dispatch      │      │ • Matching      │      │ • Serving       │
│ • Fare Calc     │      │ • Status        │      │ • Tracking      │
│ • State Machine │      │ • Earnings      │      │ • Reporting     │
└────────┬────────┘      └────────┬────────┘      └────────┬────────┘
         │                        │                        │
         └────────────────────────┼────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         EXTERNAL SERVICES                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐             │
│  │  ReZ Auth    │    │  ReZ Wallet  │    │  ReZ Mind    │             │
│  │              │    │              │    │              │             │
│  │ • JWT Auth   │    │ • Payments   │    │ • Intent     │             │
│  │ • OTP        │    │ • Cashback   │    │ • Targeting  │             │
│  │ • Sessions   │    │ • Payouts    │    │ • Profiling  │             │
│  └──────────────┘    └──────────────┘    └──────────────┘             │
│                                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐             │
│  │  AdsBazaar   │    │  Maps API    │    │  Notifs Hub  │             │
│  │              │    │              │    │              │             │
│  │ • Campaigns  │    │ • Routing    │    │ • Push       │             │
│  │ • Creatives │    │ • ETA        │    │ • SMS        │             │
│  │ • Reporting  │    │ • Geocoding  │    │ • WhatsApp   │             │
│  └──────────────┘    └──────────────┘    └──────────────┘             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Database Schema

```typescript
// User
interface User {
  _id: ObjectId;
  phone: string;
  name?: string;
  created_at: Date;
}

// Driver
interface Driver {
  _id: ObjectId;
  phone: string;
  name: string;
  vehicle: {
    type: 'auto' | 'cab' | 'suv';
    plate: string;
  };
  status: 'offline' | 'online' | 'riding';
  rating: number;
  bank_details: { account: string; ifsc: string };
}

// Ride
interface Ride {
  _id: ObjectId;
  user_id: ObjectId;
  driver_id?: ObjectId;
  pickup: { lat: number; lng: number; address: string };
  drop: { lat: number; lng: number; address: string };
  vehicle_type: 'auto' | 'cab' | 'suv';
  status: 'requested' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  fare: { base: number; distance: number; time: number; total: number };
  voucher_applied?: { id: string; amount: number };
  ad_impressions?: number;
  cashback_credited: boolean;
}

// Campaign (AdsBazaar)
interface Campaign {
  _id: ObjectId;
  merchant_id: string;
  type: 'service_to_ride' | 'shop_to_ride' | 'ride_to_service';
  trigger: { source: string; action: string; min_amount: number };
  reward: { type: string; value: number; validity_days: number };
  limits: { total_budget: number; redemption_limit: number };
  status: 'active' | 'paused' | 'ended';
}

// Voucher (AdsBazaar)
interface Voucher {
  _id: ObjectId;
  campaign_id: ObjectId;
  merchant_id: string;
  user_id: string;
  type: 'ride_credit' | 'service_credit';
  value: number;
  valid_until: Date;
  used: boolean;
  used_for_ride_id?: ObjectId;
}

// Wallet
interface Wallet {
  _id: ObjectId;
  user_id: string;
  balance: number;
  ride_credits: number;    // NEW: For rides only
  service_credits: number; // NEW: For services only
}
```

---

## Fare Structure

### Base Fares

| Vehicle | Base Fare | Per KM | Per Minute | Night (11PM-6AM) |
|---------|----------|--------|------------|-------------------|
| Auto | ₹25 | ₹10 | ₹1.5 | 1.25x |
| Cab | ₹40 | ₹14 | ₹2 | 1.25x |
| SUV | ₹60 | ₹18 | ₹2.5 | 1.25x |

### Fare Example

```
10 KM CAB RIDE (15 minutes):
├── Base Fare: ₹40
├── Distance (8 km × ₹14): ₹112
├── Time (15 min × ₹2): ₹30
├── Night Charges (if applicable): 1.25x
└── Total: ₹182

User Pays: ₹182
Cashback (10%): ₹18.20 → Credited to wallet
```

---

## Revenue Model

### Traditional vs ReZ Ride

| Aspect | Uber/Ola | ReZ Ride |
|--------|----------|----------|
| Driver Commission | 20-25% | **0%** |
| User Cashback | None | **10%** |
| Ad Targeting | Random | **Intent-based** |
| Ad Inventory | In-app only | **In-app + Screens** |

### Revenue Streams

| Stream | Description |
|--------|-------------|
| **Ad Revenue** | CPM from intent-targeted ads |
| **Platform Fee** | Transaction fee from merchants (Phase 2+) |
| **Premium Targeting** | Higher CPM for premium audiences |
| **Subscription** | Driver/monthly pass (Phase 3+) |

### Ad Revenue Split

```
AD REVENUE PER RIDE:
├── Total CPM: ₹25 (average targeted)
├── Impressions: 20 (20 min ride, 30s ads)
├── Revenue: ₹0.50 per ride
│
├── Driver Share (60%): ₹0.30
└── Platform Share (40%): ₹0.20

PLATFORM COSTS:
├── Server/Infrastructure: ₹0.05
├── Payment Processing: ₹0.02
├── Customer Support: ₹0.01
└── Total: ₹0.08

PLATFORM MARGIN: ₹0.12 per ride
```

---

## Build Order

### Month 1: Foundation

```
Week 1-2: Backend Core
├── Set up project structure
├── Create Ride Service
├── Create Driver Service
├── Set up MongoDB + Redis
└── Implement basic APIs

Week 3-4: User App MVP
├── Login screen
├── Home screen (vehicle selection)
├── Booking flow
├── Map & tracking
└── Ride completion
```

### Month 2: Driver & Matching

```
Week 1-2: Driver App MVP
├── Login screen
├── Online/offline toggle
├── Ride requests
├── Navigation integration
└── Earnings dashboard

Week 3-4: Matching Engine
├── Redis GEO setup
├── Driver location updates
├── Matching algorithm
├── ETA calculation
└── WebSocket integration
```

### Month 3: Payments & Polish

```
Week 1-2: Payments
├── ReZ Wallet integration
├── Payment processing
├── Fare calculation
├── Receipt generation
└── Refund handling

Week 3-4: Polish & Launch Prep
├── Admin dashboard
├── Driver approval flow
├── Error handling
├── Testing
└── Soft launch
```

### Month 4-5: Intelligence & Cashback

```
Week 1-2: ReZ Mind Integration
├── Intent capture for rides
├── User profiling
├── Ad targeting integration
└── Cashback calculation

Week 3-4: Ad Serving
├── AdsBazaar integration
├── In-ride ad display
├── Impression tracking
└── Revenue reporting
```

### Month 6-8: Vehicle Screens

```
Month 6: Screen Infrastructure
├── Screen registration
├── WebSocket communication
├── Ad push service
└── Health monitoring

Month 7: Screen App
├── Android app development
├── Ad display modes
├── Impression tracking
└── Offline support

Month 8: Compliance & Scale
├── Uptime tracking
├── Revenue attribution
├── Screen dashboard
└── Multi-city prep
```

---

## Team Structure

### Phase 1 (Months 1-3)

| Role | Count | Responsibilities |
|------|-------|-----------------|
| Tech Lead | 1 | Architecture, code review |
| Backend Engineers | 2 | Services, APIs, database |
| Mobile Engineers | 2 | iOS + Android |
| Designer | 1 | UI/UX |
| QA | 1 | Testing |

**Total: 7 people**

### Phase 2 (Months 4-5)

| Role | Count | Add |
|------|-------|-----|
| Backend Engineers | +1 | Ad integration |
| Data Engineer | 1 | Analytics |

**Total: 9 people**

### Phase 3 (Months 6-8)

| Role | Count | Add |
|------|-------|-----|
| Mobile Engineers | +1 | Screen app |
| DevOps | 1 | Infrastructure |

**Total: 11 people**

---

## Success Metrics

### Phase 1 (MVP Launch)

| Metric | Target |
|--------|--------|
| Rides completed | 1,000/month |
| Driver satisfaction | >4.0 rating |
| User satisfaction | >4.0 rating |
| Payment success rate | >99% |
| App crash rate | <1% |

### Phase 2 (Intelligence)

| Metric | Target |
|--------|--------|
| Ad impressions | 50,000/month |
| Average CPM | >₹20 |
| Cashback distributed | Track |
| User retention | Compare P1 vs P2 |

### Phase 3 (Scale)

| Metric | Target |
|--------|--------|
| Screens deployed | 100+ |
| Screen uptime | >70% |
| Cities active | 2-3 |
| Total rides | 10,000+/month |

---

## Dependencies & Prerequisites

### Internal Services (Must be ready)

| Service | Port | Purpose |
|---------|------|---------|
| ReZ Auth | 4002 | JWT, OTP |
| ReZ Wallet | 4004 | Payments, cashback |
| ReZ Mind | 4018 | Intent analysis |
| AdsBazaar | - | Ad marketplace |
| Maps API | - | Routing, ETA |

### External Services

| Service | Purpose | Notes |
|---------|---------|-------|
| Google Maps | Routing, ETA | Primary |
| MongoDB | Primary database | - |
| Redis | Cache, sessions, GEO | - |
| Twilio | SMS OTP | - |

### Legal/Regulatory

| Item | Status | Notes |
|------|--------|-------|
| Aggregator License | Needed | Check with legal |
| Insurance | Needed | Per-ride coverage |
| Vehicle Permits | Needed | Check local regulations |
| GST Registration | Needed | For settlements |

---

## Open Questions

| Question | Priority | Owner |
|----------|----------|--------|
| Launch city? | High | Business |
| Initial driver pool? | High | Business |
| Screen hardware sourcing? | High | Operations |
| Regulatory license timeline? | High | Legal |
| Marketing budget? | Medium | Marketing |
| Success metrics? | Medium | Product |

---

## Document Index

| Document | Location | Purpose |
|---------|---------|---------|
| README | `rez-ride/README.md` | Product overview |
| Product Concept | `docs/PRODUCT-CONCEPT.md` | Business model |
| Business Logic | `docs/BUSINESS-LOGIC.md` | Revenue, fares |
| Technical Architecture | `docs/TECHNICAL-ARCHITECTURE.md` | System design |
| Integrations | `docs/INTEGRATIONS.md` | External services |
| Screen Spec | `docs/SCREEN-SPEC.md` | Vehicle screen |
| MVP Scope | `docs/MVP-SCOPE.md` | Phase 1 plan |
| Feature Spec | `docs/SPEC-FEATURES.md` | All features |
| MVP Spec | `docs/SPEC-MVP.md` | MVP details |
| **Complete Plan** | `docs/COMPLETE-PLAN.md` | This document |

---

## Next Steps

1. **Answer Open Questions** (City, Driver pool, Budget)
2. **Set up Development Environment**
3. **Integrate with ReZ Auth & Wallet**
4. **Build Backend Services**
5. **Build Mobile Apps**
6. **Test with Small Driver Pool**
7. **Soft Launch**
8. **Iterate Based on Feedback**

---

**Ready to build? Let me know which component to start with.**
