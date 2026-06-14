# ReZ Ride — MVP Feature Specification

**Version:** 1.0
**Date:** May 17, 2026
**Phase:** MVP (Phase 1)
**Timeline:** 3 months

---

## MVP Scope

### What We Build

| Category | Features | Count |
|----------|----------|-------|
| User App | Core booking flow | 12 |
| Driver App | Core driver flow | 10 |
| Backend | Ride + Driver + Fare + Dispatch | 8 |
| Admin | Dashboard + Approvals | 6 |
| **Total** | | **36** |

### What We DON'T Build (Yet)

| Feature | Reason | When |
|---------|--------|-------|
| Vehicle Screens | Need driver base first | Phase 3 |
| Surge Pricing | Complex, needs data | Phase 4 |
| Bus Booking | Different UX | Phase 3 |
| In-app Ads | Can add later | Phase 2 |
| Cashback | Need ad revenue | Phase 2 |
| WhatsApp Booking | Channel expansion | Phase 4 |
| Scheduled Rides | Nice to have | Phase 4 |

---

## User App — MVP Features

### Screen 1: Login

```
┌─────────────────────────────────────┐
│                                     │
│            [ReZ Logo]               │
│                                     │
│      "Rides that pay you back"      │
│                                     │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  │      +91                    │    │
│  │      [Phone Input]          │    │
│  │                             │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  │      Request OTP            │    │
│  │                             │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  │         [OTP Input]         │    │
│  │                             │    │
│  └─────────────────────────────┘    │
│                                     │
│        By continuing, you agree      │
│        to Terms & Privacy           │
│                                     │
└─────────────────────────────────────┘
```

| Feature | Description | Acceptance Criteria |
|---------|-------------|-------------------|
| Phone Input | Accept 10-digit Indian numbers | Prefill +91, validate length |
| OTP Request | Send OTP via SMS | Show loading, handle errors |
| OTP Input | 6-digit verification | Auto-submit on complete |
| Terms Links | Navigate to T&C, Privacy | Open in-app browser |
| Resend OTP | After 30-second cooldown | Show countdown timer |
| Error Handling | Invalid OTP, timeout | Show specific error message |

**API:**
```typescript
POST /auth/request-otp
  body: { phone: string }
  response: { success: boolean, expires_in: number }

POST /auth/verify-otp
  body: { phone: string, otp: string }
  response: { token: string, user: User }
```

---

### Screen 2: Home

```
┌─────────────────────────────────────┐
│  ☰                    [Profile] [⚙] │
│                                     │
│  Where to?                          │
│  ┌─────────────────────────────┐    │
│  │ 🔍 Enter pickup location    │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 📍 Enter drop location      │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌───────┐ ┌───────┐ ┌───────┐     │
│  │ Auto  │ │  Cab  │ │  SUV  │     │
│  │  ₹25  │ │  ₹40  │ │  ₹60  │     │
│  │  3min │ │  5min │ │  8min │     │
│  └───────┘ └───────┘ └───────┘     │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  🪙 Wallet Balance: ₹500    │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  │       Book Ride             │    │
│  │                             │    │
│  └─────────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

| Feature | Description | Acceptance Criteria |
|---------|-------------|-------------------|
| Pickup Location | Auto-detect or search | Request location permission |
| Drop Location | Search with autocomplete | Show recent + popular |
| Vehicle Selection | Auto, Cab, SUV | Show ETA + estimate |
| Fare Estimate | Upfront price | Show before booking |
| Wallet Balance | Show available balance | Real-time from wallet |
| Book Ride Button | Primary CTA | Disable if no drop |

**API:**
```typescript
GET /maps/autocomplete?query={query}&lat={lat}&lng={lng}

POST /fare/estimate
  body: { pickup: Location, drop: Location, vehicle_type: string }
  response: { estimate: number, distance_km: number, eta_min: number }

POST /rides
  body: { pickup: Location, drop: Location, vehicle_type: string }
  response: { ride_id: string, status: 'requested' }
```

---

### Screen 3: Finding Driver

```
┌─────────────────────────────────────┐
│  ←  Finding your ride               │
│                                     │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  │    ┌───┐                    │    │
│  │    │ ◉ │  Driver heading    │    │
│  │    └───┘  to you           │    │
│  │                             │    │
│  │         4 min               │    │
│  │                             │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ Vehicle: Maruti Swift       │    │
│  │ Color: White, KA-01-AB-1234 │    │
│  │ Driver: Rajesh Kumar       │    │
│  │ ⭐ 4.8                      │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌────────────┐  ┌────────────┐     │
│  │   📞 Call  │  │   ✕ Cancel │     │
│  └────────────┘  └────────────┘     │
│                                     │
└─────────────────────────────────────┘
```

| Feature | Description | Acceptance Criteria |
|---------|-------------|-------------------|
| Driver Info | Photo, name, vehicle | Show after match |
| ETA Display | Minutes to arrive | Update in real-time |
| Driver Location | Show on mini-map | Track movement |
| Call Driver | One-tap call | Use tel: protocol |
| Cancel Ride | Cancel with reason | Show reasons list |

**WebSocket Events:**
```typescript
// Server → Client
{ type: 'ride.assigned', data: { driver: Driver, eta: number } }
{ type: 'driver.location', data: { lat: number, lng: number } }
{ type: 'driver.arrived', data: { ride_id: string } }
```

---

### Screen 4: In-Ride

```
┌─────────────────────────────────────┐
│  ←  In Ride                         │
│                                     │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  │    [Full-screen Map]        │    │
│  │                             │    │
│  │         🔴                  │    │
│  │         Your ride           │    │
│  │         12 min away        │    │
│  │                             │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ Drop: MG Road, Bangalore    │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌────────────┐  ┌────────────┐     │
│  │   📞 Call  │  │  📝 Share  │     │
│  └────────────┘  └────────────┘     │
│                                     │
│  ┌────────────┐  ┌────────────┐     │
│  │    🆘      │  │   ✕ End   │     │
│  │   SOS      │  │   Ride     │     │
│  └────────────┘  └────────────┘     │
│                                     │
└─────────────────────────────────────┘
```

| Feature | Description | Acceptance Criteria |
|---------|-------------|-------------------|
| Live Map | Full route display | Driver + destination |
| ETA Updates | Countdown to arrival | Update every 30s |
| Drop Location | Show destination | Address + name |
| Call Driver | One-tap call | Confirm before call |
| Share Trip | Share live location | Open share sheet |
| SOS Button | Emergency assistance | Show last 5 contacts |
| End Ride | Not visible to user | Driver controls |

**WebSocket Events:**
```typescript
{ type: 'ride.started', data: { started_at: string } }
{ type: 'ride.updated', data: { eta: number, distance: number } }
```

---

### Screen 5: Ride Complete

```
┌─────────────────────────────────────┐
│                                     │
│            ✓                        │
│                                     │
│        Ride Complete!               │
│                                     │
│  ┌─────────────────────────────┐    │
│  │    Total Fare                │    │
│  │         ₹145.00             │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ Base Fare          ₹40.00   │    │
│  │ Distance (8.2 km)  ₹82.00  │    │
│  │ Time (12 min)      ₹24.00  │    │
│  │ ─────────────────────────── │    │
│  │ Total             ₹145.00  │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │    ⭐⭐⭐⭐⭐                │    │
│  │    Rate your ride           │    │
│  │                             │    │
│  │    [Submit Rating]          │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │    Download Receipt         │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │    Book Another Ride        │    │
│  └─────────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

| Feature | Description | Acceptance Criteria |
|---------|-------------|-------------------|
| Fare Breakdown | Show all components | Base + distance + time |
| Success Animation | Checkmark + confetti | Celebratory feel |
| Star Rating | 1-5 stars | Tap to select |
| Submit Rating | Send to backend | Show thank you |
| Download Receipt | PDF generation | Open share sheet |
| Book Again | Quick re-book | Same pickup/drop |

**API:**
```typescript
PATCH /rides/:id/status
  body: { status: 'completed' }

POST /rides/:id/rate
  body: { rating: number, feedback?: string }

GET /rides/:id/receipt
  response: { pdf_url: string }
```

---

### Screen 6: Ride History

```
┌─────────────────────────────────────┐
│  ←  Your Rides                      │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 🔍 Search rides...          │    │
│  └─────────────────────────────┘    │
│                                     │
│  ─── Today ────                     │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ May 17, 2026 • 10:30 AM    │    │
│  │ Home → Office               │    │
│  │ Cab • KA-01-AB-1234        │    │
│  │ ₹145.00 • ⭐ 5             │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ May 17, 2026 • 8:15 AM    │    │
│  │ Office → Home               │    │
│  │ Auto • KA-01-CD-5678       │    │
│  │ ₹85.00 • ⭐ 4             │    │
│  └─────────────────────────────┘    │
│                                     │
│  ─── Yesterday ────                │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ May 16, 2026 • 6:45 PM     │    │
│  │ Mall → Home                 │    │
│  │ SUV • KA-01-EF-9012        │    │
│  │ ₹320.00 • ⭐ 5            │    │
│  └─────────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

| Feature | Description | Acceptance Criteria |
|---------|-------------|-------------------|
| Ride List | Chronological order | Group by date |
| Ride Card | Date, route, vehicle, fare | Show key info |
| Search | Filter by date, location | Search input |
| Tap to View | Show full details | Expand card |
| Report Issue | Flag problems | Show after ride |

**API:**
```typescript
GET /rides/history?page=1&limit=20
  response: {
    rides: Ride[],
    has_more: boolean,
    total: number
  }
```

---

## Driver App — MVP Features

### Screen 1: Login

```
┌─────────────────────────────────────┐
│                                     │
│            [ReZ Logo]               │
│                                     │
│      "Drive & Earn More"            │
│                                     │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  │      +91                    │    │
│  │      [Phone Input]          │    │
│  │                             │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  │      Request OTP            │    │
│  │                             │    │
│  └─────────────────────────────┘    │
│                                     │
│  New driver? Apply now →           │
│                                     │
└─────────────────────────────────────┘
```

| Feature | Description | Acceptance Criteria |
|---------|-------------|-------------------|
| Phone Input | 10-digit validation | +91 prefix |
| OTP Request | SMS verification | Handle errors |
| OTP Input | 6-digit auto-submit | 30s resend |
| New Driver Link | Apply now CTA | Open apply form |
| Remember Me | Stay logged in | Checkbox option |

---

### Screen 2: Home (Online)

```
┌─────────────────────────────────────┐
│  ☰                    [Profile] [⚙] │
│                                     │
│  ┌─────────────────────────────┐    │
│  │    ✅ You're Online         │    │
│  │                             │    │
│  │    Today's Earnings         │    │
│  │        ₹1,245              │    │
│  │                             │    │
│  │  12 rides • 4.8 ⭐          │    │
│  └─────────────────────────────┘    │
│                                     │
│         [GO OFFLINE]               │
│                                     │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  │    [Map with Driver Pin]    │    │
│  │                             │    │
│  │    Your Location            │    │
│  │    MG Road, Bangalore       │    │
│  │                             │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌────────────┐  ┌────────────┐     │
│  │  Earnings  │  │   Help    │     │
│  └────────────┘  └────────────┘     │
│                                     │
└─────────────────────────────────────┘
```

| Feature | Description | Acceptance Criteria |
|---------|-------------|-------------------|
| Online Toggle | Go online/offline | Show current status |
| Today's Stats | Earnings, rides, rating | Real-time updates |
| Driver Location | Show on map | Continuous GPS |
| Earnings Link | View details | Navigate to earnings |
| Help Link | Support options | Open help screen |

**API:**
```typescript
PATCH /drivers/:id/status
  body: { status: 'online' | 'offline' }

POST /drivers/:id/location
  body: { lat: number, lng: number, accuracy: number }
  // Every 5 seconds
```

---

### Screen 3: Ride Request

```
┌─────────────────────────────────────┐
│                                     │
│     📍 New Ride Request!            │
│                                     │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  │    Pickup: MG Road         │    │
│  │    (0.8 km away)           │    │
│  │                             │    │
│  │    Drop: Indiranagar        │    │
│  │    (5.2 km, ~15 min)       │    │
│  │                             │    │
│  │  ─────────────────────────  │    │
│  │                             │    │
│  │  Earnings     ₹145          │    │
│  │                             │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌────────────┐  ┌────────────┐     │
│  │            │  │            │     │
│  │   ✕        │  │    ✓      │     │
│  │  Decline   │  │   Accept   │     │
│  │            │  │            │     │
│  └────────────┘  └────────────┘     │
│                                     │
│         0:15                        │
│                                     │
└─────────────────────────────────────┘
```

| Feature | Description | Acceptance Criteria |
|---------|-------------|-------------------|
| Request Popup | Show on new request | Audio + vibration |
| Pickup Info | Location + distance | Show on map preview |
| Drop Info | Destination + ETA | Show on map preview |
| Earnings | Expected fare | Real-time calculation |
| Countdown Timer | 15 seconds | Show urgency |
| Accept Button | Accept the ride | Send to server |
| Decline Button | Skip this ride | Show reason optional |

**WebSocket Events:**
```typescript
// Server → Driver
{ type: 'ride.request', data: { ride_id, pickup, drop, earnings } }

// Client → Server
{ type: 'ride.accept', data: { ride_id } }
{ type: 'ride.decline', data: { ride_id, reason?: string } }
```

---

### Screen 4: Navigating to Pickup

```
┌─────────────────────────────────────┐
│  ←  Heading to pickup               │
│                                     │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  │    [Full-screen Map]        │    │
│  │                             │    │
│  │         🚗 ────────── 📍    │    │
│  │         ↑       ↑          │    │
│  │     Driver   Pickup         │    │
│  │                             │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ Passenger: Rahul            │    │
│  │ 📞 Call Passenger           │    │
│  │ Pickup: MG Road, Bangalore  │    │
│  │ Drop: Indiranagar           │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  │     🚘 I've Arrived         │    │
│  │                             │    │
│  └─────────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

| Feature | Description | Acceptance Criteria |
|---------|-------------|-------------------|
| Turn-by-Turn | Navigation to pickup | Open Google Maps |
| Route Display | Show path | Update in real-time |
| Passenger Info | Name, photo | Show after match |
| Call Passenger | One-tap call | Before pickup only |
| I've Arrived | Notify passenger | Change button state |
| ETA to Pickup | Show remaining time | Update continuously |

---

### Screen 5: Ride Active

```
┌─────────────────────────────────────┐
│  ←  Ride in Progress               │
│                                     │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  │    [Full-screen Map]        │    │
│  │                             │    │
│  │         🔴                  │    │
│  │         Your destination    │    │
│  │         5 min away         │    │
│  │                             │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ Drop: Indiranagar           │    │
│  │ 15.2 km • Est. ₹145         │    │
│  │                             │    │
│  │ Current: ₹98.00             │    │
│  │ Wait: ₹2/min                │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  │       ⏹ End Ride           │    │
│  │                             │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌────────────┐  ┌────────────┐     │
│  │  📞 Call   │  │  🗺️ Route │     │
│  └────────────┘  └────────────┘     │
│                                     │
└─────────────────────────────────────┘
```

| Feature | Description | Acceptance Criteria |
|---------|-------------|-------------------|
| Live Navigation | To destination | Google Maps |
| ETA Display | Minutes remaining | Update continuously |
| Distance Left | Kilometers to go | Show remaining |
| Live Fare | Running meter | Update in real-time |
| Waiting Charges | Show if waiting | ₹2/min after 2 min free |
| End Ride Button | Complete trip | Confirm end |
| Call Passenger | One-tap call | Available throughout |
| Route Button | Open in Maps | Open navigation |

---

### Screen 6: Earnings

```
┌─────────────────────────────────────┐
│  ←  Your Earnings                   │
│                                     │
│  ┌─────────────────────────────┐    │
│  │    Today's Summary          │    │
│  │                             │    │
│  │    ₹1,245                  │    │
│  │    12 rides                 │    │
│  │                             │    │
│  │  ┌────────┐  ┌────────┐    │    │
│  │  │Ride ₹ │  │Ad ₹   │    │    │
│  │  │1,200  │  │45     │    │    │
│  │  └────────┘  └────────┘    │    │
│  └─────────────────────────────┘    │
│                                     │
│  ─── Recent Rides ────              │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 10:30 AM • MG Rd → Indiran  │    │
│  │ ₹145 • ⭐ 5                 │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  8:15 AM • Home → Office    │    │
│  │ ₹85 • ⭐ 4                  │    │
│  └─────────────────────────────┘    │
│                                     │
│  ─── Payouts ────                  │
│                                     │
│  Pending: ₹3,450                   │
│  Next payout: May 20                │
│                                     │
│  [Request Payout]                   │
│                                     │
└─────────────────────────────────────┘
```

| Feature | Description | Acceptance Criteria |
|---------|-------------|-------------------|
| Today's Total | Sum of all earnings | Update in real-time |
| Ride Breakdown | Ride earnings | Sum of fare |
| Ad Earnings | Ad revenue share | 60% of ad revenue |
| Recent Rides | List of today | Tap for details |
| Pending Payout | Amount to be paid | Show next payout date |
| Request Payout | Trigger payout | Min ₹500 threshold |
| Weekly View | See week's breakdown | Swipe for week |

---

## Backend Services — MVP

### Service Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        API Gateway                          │
│                    (Kong / Express)                         │
└─────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ▼                   ▼                   ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   Ride Service  │  │  Driver Service │  │   Fare Service  │
│                 │  │                 │  │                 │
│ • Create ride   │  │ • Driver reg   │  │ • Estimate fare │
│ • Update status │  │ • Go online    │  │ • Calculate fare│
│ • Get history  │  │ • Location     │  │ • Apply rates   │
│ • Cancel       │  │ • Earnings     │  │ • Surge pricing │
└─────────────────┘  └─────────────────┘  └─────────────────┘
          │                   │                   │
          └───────────────────┼───────────────────┘
                              │
                              ▼
          ┌───────────────────┴───────────────────┐
          │                                       │
          ▼                                       ▼
┌─────────────────┐                    ┌─────────────────┐
│   MongoDB       │                    │     Redis       │
│                 │                    │                 │
│ • rides         │                    │ • driver:online │
│ • drivers       │                    │ • driver:loc:{id}│
│ • users         │                    │ • ride:cache    │
│ • earnings      │                    │ • session       │
└─────────────────┘                    └─────────────────┘
```

### Database Schemas

```typescript
// User Schema
interface User {
  _id: ObjectId;
  phone: string;
  name?: string;
  email?: string;
  created_at: Date;
  updated_at: Date;
}

// Driver Schema
interface Driver {
  _id: ObjectId;
  phone: string;
  name: string;
  photo_url?: string;
  vehicle: {
    type: 'auto' | 'cab' | 'suv';
    make: string;
    model: string;
    plate: string;
    color: string;
  };
  status: 'offline' | 'online' | 'riding' | 'busy';
  rating: number;
  total_rides: number;
  bank_details?: {
    account_number: string;
    ifsc: string;
    upi_id?: string;
  };
  created_at: Date;
  updated_at: Date;
}

// Ride Schema
interface Ride {
  _id: ObjectId;
  user_id: ObjectId;
  driver_id?: ObjectId;
  pickup: {
    lat: number;
    lng: number;
    address: string;
  };
  drop: {
    lat: number;
    lng: number;
    address: string;
  };
  vehicle_type: 'auto' | 'cab' | 'suv';
  status: 'requested' | 'assigned' | 'accepted' | 'arrived' | 'in_progress' | 'completed' | 'cancelled';
  fare: {
    base: number;
    distance: number;
    time: number;
    total: number;
  };
  started_at?: Date;
  completed_at?: Date;
  rating?: number;
  created_at: Date;
  updated_at: Date;
}

// Earnings Schema
interface Earnings {
  _id: ObjectId;
  driver_id: ObjectId;
  date: Date;
  rides: {
    ride_id: ObjectId;
    amount: number;
  }[];
  ad_revenue: number;
  total: number;
  paid_out: boolean;
  paid_out_at?: Date;
}
```

### API Endpoints

```typescript
// Auth
POST /auth/request-otp
POST /auth/verify-otp

// Rides
POST /rides                    // Create ride
GET /rides/:id                // Get ride
PATCH /rides/:id/status        // Update status
POST /rides/:id/cancel        // Cancel ride
POST /rides/:id/rate          // Rate ride
GET /rides/history            // User history

// Drivers
POST /drivers                  // Register
GET /drivers/:id               // Get profile
PATCH /drivers/:id/status     // Online/offline
POST /drivers/:id/location    // Update location
GET /drivers/:id/earnings     // Get earnings
POST /drivers/:id/payout      // Request payout

// Fare
POST /fare/estimate            // Get estimate
POST /fare/calculate           // Calculate final

// Dispatch
POST /dispatch/find            // Find nearby drivers
POST /dispatch/match           // Match driver to ride

// Maps
GET /maps/autocomplete         // Location search
GET /maps/reverse-geocode     // Get address from lat/lng
```

---

## Admin Dashboard — MVP

### Screens

```
┌─────────────────────────────────────────────────────────────┐
│  Sidebar Navigation                                         │
│  ┌────────────┐                                             │
│  │ Dashboard  │ ← Active                                    │
│  │ Drivers    │                                             │
│  │ Users      │                                             │
│  │ Rides      │                                             │
│  │ Payouts    │                                             │
│  │ Cities     │                                             │
│  │ Settings   │                                             │
│  └────────────┘                                             │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                                                         ││
│  │  [Main Content Area]                                    ││
│  │                                                         ││
│  │                                                         ││
│  │                                                         ││
│  │                                                         ││
│  │                                                         ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### Dashboard Screen

| Widget | Data | Refresh |
|--------|------|---------|
| Active Rides | Live count | Real-time |
| Online Drivers | Live count | Real-time |
| Today's Revenue | Sum of fares | Every 5 min |
| Today's Rides | Completed count | Every 5 min |
| Pending Payouts | Amount | Every 5 min |
| Recent Rides | Last 10 list | Every 30 sec |
| Recent Drivers | Last 10 list | Every 30 sec |

### Driver Approval Screen

| Feature | Description |
|---------|-------------|
| Pending List | Drivers awaiting approval |
| Document Preview | DL, RC, Insurance images |
| Approve Button | Accept driver |
| Reject Button | Decline with reason |
| Search | Find by phone/name |

---

## Testing Requirements

### Unit Tests

| Service | Coverage Target |
|---------|----------------|
| Fare Service | 90% |
| Dispatch Service | 85% |
| Ride State Machine | 95% |
| Driver Matching | 80% |

### Integration Tests

| Flow | Description |
|------|-------------|
| User Booking | Complete booking flow |
| Driver Matching | Request → Accept → Complete |
| Payment | Wallet debit/credit |
| OTP | Request → Verify → Login |

### E2E Tests

| Test | Tool |
|------|------|
| User App Flow | Detox (iOS), Appium (Android) |
| Driver App Flow | Detox, Appium |
| Admin Flow | Cypress |

---

## Performance Requirements

| Metric | Target |
|--------|--------|
| API P95 Latency | <200ms |
| Matching Time | <500ms |
| Location Update Processing | <50ms |
| Ad Decision | <100ms |
| App Launch Time | <3s |
| Screen Load Time | <1s |

---

## Security Requirements

| Requirement | Implementation |
|-------------|----------------|
| HTTPS Only | TLS 1.3 |
| Token Expiry | 60 minutes |
| OTP Expiry | 5 minutes |
| OTP Max Attempts | 3 |
| Rate Limiting | 100 req/min per user |
| Input Validation | Zod schemas |
| SQL Injection | Parameterized queries |
| XSS | Output encoding |

---

## Dependencies

### External Services

| Service | Purpose | SLA |
|---------|---------|-----|
| ReZ Auth | User/Driver auth | 99.9% |
| ReZ Wallet | Payments | 99.9% |
| Google Maps | Routing, ETA | 99.5% |
| MongoDB | Primary database | 99.9% |
| Redis | Cache, sessions | 99.5% |
| Twilio | SMS OTP | 99% |

### Internal Services

| Service | Port | Purpose |
|---------|------|---------|
| rez-auth-service | 4002 | Authentication |
| rez-wallet-service | 4004 | Payments |
| rez-notifications-service | 4011 | Push/SMS |

---

## Open Questions

| Question | Priority | Owner |
|----------|----------|-------|
| Launch city? | High | Business |
| Initial driver pool size? | High | Business |
| Maps provider (Google vs Mapbox)? | Medium | Tech |
| Payment retry logic? | Medium | Tech |
| Driver acceptance timeout? | Medium | Product |
| Cancellation policy? | Medium | Product |
