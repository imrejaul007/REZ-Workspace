# ReZ Ride - Complete Overview

**Tagline:** "Rides that pay you back"
**Positioning:** "India's smartest rewards-powered mobility ecosystem"
**Launch Date:** Ready for deployment
**Version:** 2.0.0

---

## What is ReZ Ride?

> **"Not just another taxi app."**

ReZ Ride is a **mobility commerce + advertising + rewards infrastructure** integrated into the wider REZ ecosystem.

It combines:
- Uber → ride infrastructure
- Ola → local operations
- Rapido → affordability
- Google Maps → AI prediction
- Swiggy → commerce integrations
- REZ ecosystem → ads, rewards, wallet, cashback, CorpPerks

**This combination is your moat.**

---

## Core Differentiation

| Feature | Uber/Ola | ReZ Ride |
|---------|----------|----------|
| Driver Commission | 20-25% | **0%** |
| User Cashback | None | **10%** |
| Subscriptions | None | **ReZ Ride Plus** |
| In-Ride Commerce | None | **"Commerce Before Destination"** |
| AI Predictions | Basic | **Full Intelligence** |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        ReZ Ride                             │
│                                                             │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐   │
│   │  User App   │    │ Driver App  │    │   Admin     │   │
│   │ (14 screens)│    │ (6 screens) │    │  Dashboard  │   │
│   └──────┬──────┘    └──────┬──────┘    └──────┬──────┘   │
│          │                   │                   │           │
│          └───────────────────┼───────────────────┘           │
│                              │                                │
│                     ┌────────▼────────┐                      │
│                     │   API Gateway   │  :4000                │
│                     │  61 services   │                      │
│                     │  28 routes     │                      │
│                     └────────┬────────┘                      │
│                              │                              │
└──────────────────────────────┼──────────────────────────────┘
                               │
     ┌─────────────────────────┼─────────────────────────┐
     │                         │                         │
     ▼                         ▼                         ▼
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   RABTUL   │         │    REZ     │         │  REZ Media │
│  (Shared)  │         │ INTELLIGENCE│         │   (Ads)    │
├─────────────┤         ├─────────────┤         ├─────────────┤
│ Auth 4002  │         │ Intent 4018│         │ Ads 4068   │
│ Wallet 4004 │         │ Predict 4123│         │ Karma 4041 │
│ Pay 4001   │         │ Signals 4142│         │ DOOH 4018  │
│ Notify 4011│         │ Location 4040│         │            │
└─────────────┘         └─────────────┘         └─────────────┘
```

---

## How It Works

### 1. User Opens App → Intelligent Home Screen

```
User opens app
       │
       ▼
ReZ Intelligence checks:
├── User segment (Champion/Active/At-Risk/Churning)
├── Intent prediction (Where do they want to go?)
├── Personalized offers (Cashback, karma points)
└── Nearby promotions
       │
       ▼
Show personalized home screen with:
├── Quick destination (predicted)
├── Available vehicles
├── Estimated fares
└── Active offers
```

### 2. User Books Ride → Real-time Matching

```
User selects pickup & drop
       │
       ▼
┌─────────────────────────────────────────┐
│            Fare Calculation               │
│  Base + Distance Charge + Time Charge   │
│  ± Surge pricing (based on demand)     │
└─────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│        Driver Matching (AI)              │
│  • Location proximity                   │
│  • Rating score                        │
│  • Acceptance rate                      │
│  • Vehicle type match                   │
│  • Demand prediction                   │
└─────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│           Ride Confirmed!               │
│  • OTP for verification                 │
│  • Driver details                      │
│  • Live tracking                       │
└─────────────────────────────────────────┘
```

### 3. Ride in Progress → Continuous Updates

```
Driver picks up user
       │
       ▼
Real-time tracking (every 3 seconds):
├── Driver location → Supply heatmap
├── User location → Intent signals
├── Route optimization
└── ETA updates
       │
       ▼
┌─────────────────────────────────────────┐
│         Safety Features                  │
│  • Live location sharing               │
│  • SOS button                         │
│  • Emergency contacts                  │
│  • Trip monitoring                    │
└─────────────────────────────────────────┘
       │
       ▼
Driver drops user → Payment → Cashback credited
```

### 4. Ride Complete → Data Flows to AI

```
Ride completes
       │
       ├──────────────────────────────┐
       ▼                              ▼
┌─────────────────┐          ┌─────────────────┐
│   RABTUL         │          │  REZ Intelligence │
│   Services       │          │  (ML Training)    │
├─────────────────┤          ├─────────────────┤
│ • Payment (₹)  │          │ • Update LTV     │
│ • Cashback (10%)│          │ • Churn check   │
│ • Notification  │          │ • Signals       │
│ • Analytics    │          │ • Attribution   │
└─────────────────┘          └─────────────────┘
       │
       ▼
┌─────────────────┐
│   REZ Media     │
│   (Earnings)     │
├─────────────────┤
│ • Award karma   │
│ • Track ad view │
│ • Cross-sell    │
└─────────────────┘
```

---

## Features

### For Users

| Feature | Description |
|---------|-------------|
| **OTP Login** | Phone + OTP authentication |
| **Location Search** | Manual search + saved places |
| **Add Stops** | Up to 2 intermediate stops |
| **4 Vehicle Types** | Bike, Auto, Cab, SUV |
| **Fare Estimation** | Real-time fare calculator |
| **Surge Pricing** | Dynamic pricing based on demand |
| **Live Tracking** | Real-time driver location |
| **Driver Call** | Direct call to driver |
| **In-App Chat** | Chat with driver |
| **10% Cashback** | Instant wallet cashback |
| **Karma Points** | Gamification rewards |
| **Rate Driver** | 5-star rating system |
| **Ride History** | Past rides with details |
| **Wallet** | Balance + add money |
| **Promo Codes** | Vouchers & discounts |
| **Corporate Billing** | Business accounts |
| **SOS Emergency** | One-tap emergency |
| **Support** | 24/7 help |

### NEW - ReZ Ride Plus (Subscriptions)

| Plan | Price | Key Benefits |
|------|-------|--------------|
| Lite | ₹99/mo | 5% surge discount, 1 free cancel |
| Plus | ₹199/mo | 10% surge discount, 3 free cancels, priority matching |
| Premium | ₹299/mo | 20% surge discount, lounge access |

### NEW - In-Ride Commerce

During your ride, see contextual offers:
- Food ordering (McDonald's, restaurants)
- Coffee pre-order (Starbucks)
- Fuel cashback
- Mall shopping deals
- Movie tickets
- Parking offers

**"Commerce Before Destination"**

### NEW - AI Predictions

Smart suggestions based on your patterns:
- "Going home?" - Evening commute
- "Book your office cab?" - Morning commute
- "Rain surge in 10 mins" - Weather alert
- "Your café has 20% cashback"

### For Drivers

| Feature | Description |
|---------|-------------|
| **OTP Login** | Quick authentication |
| **Online/Offline** | Toggle availability |
| **Ride Requests** | Accept/reject rides |
| **Smart Matching** | AI-powered suggestions |
| **Navigation** | Turn-by-turn directions |
| **Ride OTP** | Verify passenger |
| **Earnings Dashboard** | Daily/weekly/monthly |
| **Quest Bonuses** | Incentives for targets |
| **Karma Rewards** | Gamification |
| **Background Location** | Track when offline |

### Business Model

| Revenue Stream | Description |
|---------------|-------------|
| **In-Vehicle Ads** | DOOH screens in vehicles |
| **Targeted Promotions** | Merchant campaigns |
| **Corporate Billing** | 5-10% markup |
| **Premium Subscriptions** | ₹99-299/month |

### Multi-Revenue Engine

```
                    ┌─────────────────┐
                    │  ReZ Ride      │
                    │  Platform      │
                    └────────┬────────┘
                             │
   ┌──────────────┬─────────┼─────────┬──────────────┐
   │              │         │         │              │
   ▼              ▼         ▼         ▼              ▼
┌────────┐  ┌────────┐ ┌────────┐ ┌────────┐  ┌────────┐
│In-Car  │  │Merchant │ │Subscript│ │Corp    │  │Commerce│
│Ads     │  │Promos  │ │-ions   │ │Billing │  │Commissions│
│(70%)   │  │(30%)   │ │(100%)  │ │(10%)   │  │(15%)   │
└────────┘  └────────┘ └────────┘ └────────┘  └────────┘
```

---

## Strategic Positioning

### Not Just a Taxi App

ReZ Ride is positioned as:
> **"India's smartest rewards-powered mobility ecosystem"**

This is NOT competing with Uber/Ola directly. It's building something different.

### Why This Matters

| Traditional | ReZ Ride |
|-------------|----------|
| Ride company | Mobility + Commerce infrastructure |
| Commission-based | Advertising-based |
| Transactional | Ecosystem loop |
| Utility | Habit-forming |

### The Moat

1. **Zero commission** → More drivers, lower prices
2. **10% cashback** → Wallet stickiness
3. **In-ride commerce** → Transaction layer
4. **AI predictions** → Habit formation
5. **REZ ecosystem** → Cross-product loyalty

---

## Launch Strategy

### Phase 1: Hyperlocal Launch

Start in **one zone**:
- Whitefield, HSR, Koramangala, Bellandur
- Bengaluru tech corridor

### Why?

- Dense tech workers
- Repeat routes (home ↔ office)
- Corporate users
- High-frequency rides

### First Audiences

1. **Tech employees** - Early adopters
2. **Delivery drivers** - Easy driver acquisition
3. **Corporate offices** - Guaranteed demand

---

## Killer Feature

### "Ride-to-Commerce Intelligence"

Example flow:
```
User books cab to mall
       │
       ▼
During ride, shows:
├── Zara 20% off
├── Starbucks buy 1 get 1
├── Movie tickets ₹199
├── Parking cashback
└── Loyalty points
```

**Ride becomes:**
- Transaction layer
- Discovery layer
- Ad layer
- Rewards layer

**Nobody in India has fully integrated this.**

---

## Integrations

### RABTUL (Shared Infrastructure)

| Service | Port | What It Does |
|---------|------|--------------|
| Auth | 4002 | JWT tokens, OTP verification |
| Wallet | 4004 | User balance, cashback |
| Payments | 4001 | Razorpay integration |
| Notifications | 4011 | Push, SMS, Email |
| Profile | 4013 | User data |
| Analytics | 4016 | Dashboards |

### REZ Intelligence (AI/ML)

| Service | Port | What It Does |
|---------|------|--------------|
| Intent Predictor | 4018 | Predicts where user wants to go |
| Predictive Engine | 4123 | Churn, LTV, demand forecasting |
| Signal Aggregator | 4142 | Behavioral signals |
| Location Intel | 4040 | Hot zones, frequent routes |
| Fraud Detection | 3007 | Block fraudulent rides |
| Identity Graph | 4050 | Cross-platform identity |

### REZ Media (Revenue)

| Service | Port | What It Does |
|---------|------|--------------|
| Ads | 4068 | In-app advertising |
| Karma | 4041 | Gamification, points |
| DOOH | 4018 | Vehicle screen ads |

### CorpPerks (Enterprise)

| Feature | Description |
|---------|-------------|
| Employee Verification | Verify corporate users |
| Policy Enforcement | Vehicle/distance limits |
| GST Invoicing | Auto-generated invoices |
| Expense Tracking | CFO dashboards |

---

## Real-Time Data Flow

```
Every 3 seconds:
┌─────────────────────────────────────────────────────┐
│                                                     │
│  User App ───────┐                                 │
│  (5s intervals)  │                                 │
│                   ▼                                 │
│              ┌─────────────────┐                   │
│              │ Data Pipeline   │                   │
│              │ Service         │                   │
│              └────────┬────────┘                   │
│                       │                             │
└───────────────────────┼───────────────────────────┘
                        │
     ┌──────────────────┼──────────────────┐
     ▼                  ▼                  ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   Intent    │  │    Fraud    │  │   Signal    │
│  Predictor  │  │  Detection  │  │  Aggregator │
│   (4018)    │  │   (3007)   │  │   (4142)    │
└─────────────┘  └─────────────┘  └─────────────┘
     │                  │                  │
     ▼                  ▼                  ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ Better      │  │ Block       │  │ Behavioral   │
│ Predictions │  │ Fraud       │  │ Profiles     │
└─────────────┘  └─────────────┘  └─────────────┘
```

---

## Fare Structure

| Vehicle | Base Fare | Per KM | Per Minute |
|---------|-----------|--------|------------|
| Bike | ₹15 | ₹6 | ₹1 |
| Auto | ₹25 | ₹10 | ₹1.5 |
| Cab | ₹40 | ₹14 | ₹2 |
| SUV | ₹60 | ₹18 | ₹2.5 |

**Example:** 10km, 20min Cab ride
- Base: ₹40
- Distance: 10 × ₹14 = ₹140
- Time: 20 × ₹2 = ₹40
- **Total: ₹220**
- **Cashback (10%): ₹22**

---

## Technical Stack

### Backend
- **Runtime:** Node.js + TypeScript
- **Framework:** Express.js
- **Database:** MongoDB
- **Cache:** Redis
- **WebSocket:** Socket.IO
- **Validation:** Zod

### Mobile Apps
- **Framework:** React Native (Expo)
- **Navigation:** React Navigation
- **State:** Zustand
- **HTTP:** Axios
- **Real-time:** Socket.IO

### Infrastructure
- **Container:** Docker
- **CI/CD:** GitHub Actions
- **Hosting:** Render/Railway/AWS
- **Maps:** Google Maps + Mapbox

---

## API Endpoints

### Auth
- `POST /api/auth/request-otp` - Send OTP
- `POST /api/auth/verify-otp` - Verify OTP

### Rides
- `POST /api/rides` - Create ride
- `GET /api/rides/:id` - Get ride details
- `POST /api/rides/:id/cancel` - Cancel ride
- `GET /api/rides/history` - Ride history

### Drivers
- `GET /api/drivers/nearby` - Find drivers
- `POST /api/drivers/accept/:rideId` - Accept ride
- `PUT /api/drivers/:id/location` - Update location

### Fares
- `GET /api/fares/estimate` - Calculate fare
- `GET /api/fares/compare` - Compare vehicles
- `GET /api/surge/:lat/:lng` - Surge pricing

### Dashboard
- `GET /api/dashboard/user/:id` - User dashboard
- `GET /api/dashboard/driver/:id` - Driver dashboard
- `GET /api/dashboard/executive` - Executive view

### Real-time
- `POST /api/realtime/user-location` - Track user GPS
- `POST /api/realtime/driver-location` - Track driver GPS
- `GET /api/realtime/demand-heatmap` - Demand map

---

## Files Structure

```
rez-ride/
├── src/
│   ├── index.ts              # Entry point
│   ├── services/             # 58 services
│   │   ├── ride.service.ts
│   │   ├── driver.service.ts
│   │   ├── fare.service.ts
│   │   ├── intelligence.service.ts  # AI/ML
│   │   ├── fraud.service.ts         # Fraud detection
│   │   ├── location-intelligence.service.ts
│   │   ├── signal-aggregator.service.ts
│   │   ├── attribution.service.ts
│   │   └── ... (48 more)
│   ├── routes/               # 28 routes
│   ├── models/               # Database models
│   ├── middleware/           # Auth, validation
│   └── websocket/            # Real-time events
├── apps/
│   ├── user-app/             # User mobile app
│   │   ├── src/screens/      # 14 screens
│   │   ├── src/services/    # API, push, analytics
│   │   └── src/stores/       # Zustand stores
│   └── driver-app/           # Driver mobile app
│       └── src/screens/       # 6 screens
├── docker-compose.yml
├── .env.example
├── SOT.md
└── README.md
```

---

## Launch Checklist

- [x] Backend API (58 services)
- [x] User App (14 screens)
- [x] Driver App (6 screens)
- [x] All integrations
- [x] Documentation
- [ ] API Keys (MongoDB, Google Maps, Razorpay)
- [ ] Expo EAS login
- [ ] App Store accounts
- [ ] Build & deploy

---

## What's Unique About ReZ Ride?

| Feature | Traditional | ReZ Ride |
|---------|-------------|----------|
| Driver Commission | 20-25% | **0%** |
| User Cashback | None | **10%** |
| Ad Targeting | Random | **AI-powered** |
| Fraud Protection | Basic | **ML-powered** |
| Attribution | Manual | **Auto** |
| Cross-Sell | None | **Real-time** |

---

## Contact

- **Backend:** Port 4000
- **User App:** Expo (14 screens)
- **Driver App:** Expo (6 screens)
- **Docs:** `SOT.md`

---

*Last Updated: May 21, 2026*
