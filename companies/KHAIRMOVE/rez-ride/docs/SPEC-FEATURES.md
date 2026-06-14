# ReZ Ride — Feature Specification

**Version:** 1.0
**Date:** May 17, 2026
**Status:** Draft

---

## Table of Contents

1. [Overview](#overview)
2. [User App Features](#user-app-features)
3. [Driver App Features](#driver-app-features)
4. [Vehicle Screen Features](#vehicle-screen-features)
5. [Backend Services](#backend-services)
6. [Admin Dashboard](#admin-dashboard)
7. [Safety & Trust](#safety--trust)
8. [Ads & Monetization](#ads--monetization)
9. [Ecosystem Integration](#ecosystem-integration)
10. [Technical Requirements](#technical-requirements)

---

## Overview

### Product Vision

ReZ Ride is India's first commission-free ride-hailing platform powered by in-vehicle advertising. Drivers keep 100% of fares, users earn 10% cashback, and advertisers reach intent-qualified passengers in real-time.

### Core Differentiators

| Aspect | Traditional | ReZ Ride |
|--------|-------------|----------|
| Driver Commission | 20-25% | 0% |
| User Cashback | None | 10% of fare |
| Ad Targeting | Random | Intent-based (ReZ Mind) |
| Ad Inventory | In-app only | In-app + Vehicle screens |

### Key Metrics

| Metric | Target |
|--------|--------|
| Driver commission | 0% |
| User cashback | 10% of fare |
| Ad revenue split (driver) | 60% |
| Ad revenue split (platform) | 40% |
| Screen uptime requirement | 70%+ |
| Driver rating minimum | 4.0 |

---

## User App Features

### Authentication

```typescript
// Feature: Phone OTP Login
interface AuthFeature {
  phone_login: boolean;
  otp_verification: boolean;
  biometric_login: boolean; // Face ID, fingerprint
  social_login: boolean; // Google, Apple
}
```

| Feature | Description | Priority |
|---------|-------------|----------|
| Phone OTP Login | Enter phone → receive OTP → verify | P0 |
| Biometric Login | Face ID / fingerprint for returning users | P1 |
| Remember Device | Skip OTP for trusted devices | P1 |

### Home Screen

```typescript
// Feature: Vehicle Selection
interface VehicleSelection {
  vehicle_types: ('auto' | 'cab' | 'suv' | 'bike' | 'bus')[];
  eta_display: boolean;
  surge_indicator: boolean;
}
```

| Feature | Description | Priority |
|---------|-------------|----------|
| Vehicle Type Selection | Auto, Cab, SUV, Bike, Bus options | P0 |
| Pickup Location | Auto-detect or manual input | P0 |
| Drop Location | Search with autocomplete | P0 |
| Saved Places | Home, Work, Recent locations | P1 |
| Fare Estimate | Show price before booking | P0 |
| Surge Indicator | Show if surge pricing active | P1 |
| ETA Display | Estimated arrival time | P0 |
| Promo Code Input | Apply discount before booking | P2 |
| Wallet Balance | Show ReZ Wallet balance | P0 |

### Booking Flow

```typescript
// Feature: Booking Flow
interface BookingFlow {
  payment_method: 'wallet' | 'upi' | 'card';
  tip_option: boolean;
  ride_later: boolean;
  notes_to_driver: boolean;
}
```

| Feature | Description | Priority |
|---------|-------------|----------|
| Payment Method | Wallet (default), UPI, Card | P0 |
| Ride Later | Schedule for future time | P2 |
| Notes to Driver | Special instructions | P2 |
| Tip Option | Add tip for driver | P2 |
| Confirm Booking | Final confirmation screen | P0 |
| Booking Confirmation | Success screen with ride details | P0 |

### Live Ride Tracking

```typescript
// Feature: Live Tracking
interface LiveTracking {
  driver_location: boolean;
  eta_updates: boolean;
  route_display: boolean;
  driver_contact: boolean;
}
```

| Feature | Description | Priority |
|---------|-------------|----------|
| Driver Location | Real-time GPS on map | P0 |
| ETA Updates | Countdown to arrival | P0 |
| Route Display | Show route from driver to pickup | P0 |
| Driver Info | Photo, name, vehicle, plate | P0 |
| Call Driver | One-tap call button | P1 |
| Chat Driver | In-app text messaging | P1 |
| Share Trip | Share live location with contacts | P0 |
| Emergency SOS | One-tap emergency button | P0 |
| Cancel Ride | Cancel with reason selection | P1 |

### Ride Completion

```typescript
// Feature: Ride Completion
interface RideCompletion {
  fare_breakdown: boolean;
  cashback_credit: boolean;
  rating_prompt: boolean;
  receipt_generation: boolean;
}
```

| Feature | Description | Priority |
|---------|-------------|----------|
| Fare Breakdown | Base + distance + time + surge | P0 |
| Cashback Credit | "You earned ₹X" animation | P0 |
| Cashback Balance | Show new wallet balance | P0 |
| Rate Driver | 1-5 stars + feedback | P1 |
| Trip Receipt | PDF receipt generation | P0 |
| Report Issue | Report lost item / problem | P1 |
| Book Return | Quick return trip booking | P2 |
| Ride Again | Quick re-book same route | P2 |

### History & Wallet

```typescript
// Feature: History & Wallet
interface HistoryWallet {
  ride_history: boolean;
  filter_rides: boolean;
  export_receipts: boolean;
  wallet_transactions: boolean;
}
```

| Feature | Description | Priority |
|---------|-------------|----------|
| Ride History | List of past rides | P0 |
| Filter Rides | By date, vehicle type, status | P1 |
| Transaction History | All wallet transactions | P0 |
| Cashback Summary | Total earned, used, expired | P1 |
| Add Money | Top up wallet | P1 |
| Withdraw | Withdraw to bank | P1 |
| Export Receipts | Download multiple receipts | P2 |

### In-Ride Experience

```typescript
// Feature: In-Ride Experience
interface InRideExperience {
  ad_display: boolean;
  ad_interaction: boolean;
  trip_info: boolean;
  emergency_access: boolean;
}
```

| Feature | Description | Priority |
|---------|-------------|----------|
| Trip Info | Current route, ETA, drop location | P0 |
| In-App Ads | Display ads during ride | P1 |
| Ad Interaction | Tap to view product details | P1 |
| Stop at ATM | Quick stop request | P2 |
| Change Drop | Update destination mid-ride | P2 |
| SOS Button | Emergency assistance | P0 |
| Share Status | Update trip status to contacts | P0 |

---

## Driver App Features

### Onboarding

```typescript
// Feature: Driver Onboarding
interface DriverOnboarding {
  phone_verification: boolean;
  document_upload: boolean;
  vehicle_registration: boolean;
  background_check: boolean;
  training_completion: boolean;
}
```

| Feature | Description | Priority |
|---------|-------------|----------|
| Phone Login | OTP verification | P0 |
| Personal Info | Name, photo, address | P0 |
| Vehicle Info | Type, make, model, plate | P0 |
| Documents Upload | DL, RC, Insurance, Permit | P0 |
| Background Check | Verification status | P1 |
| Vehicle Inspection | Photo verification | P1 |
| Training Videos | Safety, customer service | P2 |
| Agreement Sign | Terms acceptance | P0 |
| Bank/UPI Setup | Payout destination | P0 |
| Profile Photo | Driver photo | P0 |

### Online/Offline

```typescript
// Feature: Online Status
interface OnlineStatus {
  go_online: boolean;
  go_offline: boolean;
  auto_offline: boolean;
  break_mode: boolean;
}
```

| Feature | Description | Priority |
|---------|-------------|----------|
| Go Online | One-tap to start accepting | P0 |
| Go Offline | One-tap to stop accepting | P0 |
| Auto-Offline | Configurable time limits | P2 |
| Break Mode | Temporary pause | P1 |
| Online Indicator | Show status to users | P0 |

### Ride Requests

```typescript
// Feature: Ride Requests
interface RideRequests {
  request_popup: boolean;
  auto_accept: boolean;
  destination_hint: boolean;
  accept_decline: boolean;
}
```

| Feature | Description | Priority |
|---------|-------------|----------|
| Request Popup | Show pickup, drop, fare, ETA | P0 |
| Destination Hint | See drop location before accepting | P1 |
| Pickup Map | Show pickup pin | P0 |
| Fare Preview | Show estimated earnings | P0 |
| Accept Ride | Accept request | P0 |
| Decline Ride | Decline with optional reason | P0 |
| Auto-Accept | Toggle for automatic acceptance | P1 |
| Request Timer | 15-second countdown | P0 |
| Retry Queue | Next request after decline | P0 |

### Navigation

```typescript
// Feature: Navigation
interface Navigation {
  turn_by_turn: boolean;
  google_maps: boolean;
  mapbox: boolean;
  offline_maps: boolean;
}
```

| Feature | Description | Priority |
|---------|-------------|----------|
| Turn-by-Turn | Embedded navigation | P0 |
| Pickup Navigation | Navigate to rider | P0 |
| Drop Navigation | Navigate to destination | P0 |
| Alternate Routes | Show alternative paths | P1 |
| Traffic Alerts | Real-time traffic updates | P0 |
| Offline Mode | Cached maps when offline | P2 |

### Ride Controls

```typescript
// Feature: Ride Controls
interface RideControls {
  arrive_status: boolean;
  start_ride: boolean;
  end_ride: boolean;
  cancel_ride: boolean;
}
```

| Feature | Description | Priority |
|---------|-------------|----------|
| Arrived Status | Notify rider "I've arrived" | P0 |
| Start Ride | Begin trip with OTP verification | P0 |
| End Ride | Complete trip, calculate fare | P0 |
| OTP Verification | Confirm rider with OTP | P0 |
| Cancel Ride | Cancel with reason | P1 |
| Rider No-Show | Report no-show | P1 |
| Route Deviation | Alert if off-route | P1 |
| Wait Time | Track waiting time | P0 |

### Earnings

```typescript
// Feature: Earnings
interface Earnings {
  daily_summary: boolean;
  weekly_summary: boolean;
  monthly_summary: boolean;
  payout_history: boolean;
  earnings_chart: boolean;
}
```

| Feature | Description | Priority |
|---------|-------------|----------|
| Today's Earnings | Rides + ad revenue | P0 |
| This Week | Breakdown by day | P0 |
| This Month | Cumulative + breakdown | P1 |
| Ride Breakdown | Per-ride details | P0 |
| Ad Revenue | Share from impressions | P0 |
| Incentives | Bonuses, surge earnings | P1 |
| Payout Summary | Total paid out | P0 |
| Pending Payout | Amount to be paid | P0 |
| Request Payout | Trigger payout to bank/UPI | P0 |
| Earnings Chart | Visual chart over time | P1 |

### Payouts

```typescript
// Feature: Payouts
interface Payouts {
  auto_payout: boolean;
  manual_payout: boolean;
  payout_schedule: boolean;
  minimum_threshold: boolean;
}
```

| Feature | Description | Priority |
|---------|-------------|----------|
| Bank Transfer | Direct to bank account | P0 |
| UPI Transfer | Instant to UPI ID | P0 |
| Auto Payout | Automatic weekly/daily | P1 |
| Payout Schedule | Set preferred timing | P1 |
| Minimum Threshold | ₹500 minimum for payout | P1 |
| Payout History | Past payouts list | P0 |
| TDS Certificate | Download for taxes | P2 |

### Driver Support

```typescript
// Feature: Driver Support
interface DriverSupport {
  chat_support: boolean;
  call_support: boolean;
  faq_section: boolean;
  issue_reporting: boolean;
}
```

| Feature | Description | Priority |
|---------|-------------|----------|
| Chat Support | In-app chat with support | P1 |
| Call Support | Toll-free number | P1 |
| Help Articles | FAQ and guides | P2 |
| Report Issue | Report rider or technical | P1 |
| Deactivation Appeal | Appeal suspension | P1 |

---

## Vehicle Screen Features

### Screen Management

```typescript
// Feature: Screen Management
interface ScreenManagement {
  device_registration: boolean;
  heartbeat_monitoring: boolean;
  ota_updates: boolean;
  health_checks: boolean;
}
```

| Feature | Description | Priority |
|---------|-------------|----------|
| Device Registration | Register screen to vehicle | P0 |
| Heartbeat | Periodic online status | P0 |
| Battery Monitor | Show battery level | P1 |
| Storage Monitor | Show storage usage | P1 |
| Network Status | Show connectivity | P1 |
| OTA Updates | Remote app updates | P1 |
| Screen Brightness | Auto-adjust brightness | P2 |

### Ad Display

```typescript
// Feature: Ad Display
interface AdDisplay {
  hero_image: boolean;
  video_ad: boolean;
  promo_card: boolean;
  carousel: boolean;
}
```

| Feature | Description | Priority |
|---------|-------------|----------|
| Hero Image | Full-screen product image ad | P0 |
| Video Ad | 15-30 sec video playback | P1 |
| Promo Card | Split image + text layout | P2 |
| Carousel | Swipeable multiple products | P2 |
| Ad Timer | Countdown to next ad | P1 |
| Tap to Interact | Record interaction events | P1 |
| Call-to-Action | "Tap for more" button | P1 |
| Brand Watermark | Persistent ReZ branding | P0 |

### Screen States

```typescript
// Feature: Screen States
interface ScreenStates {
  idle: boolean;
  ride_pending: boolean;
  navigating: boolean;
  in_ride: boolean;
  ride_complete: boolean;
  offline: boolean;
}
```

| State | Description | Display |
|-------|-------------|---------|
| Idle | No ride, waiting | "Available for rides" + driver info |
| Ride Pending | Request received | Pickup/drop preview |
| Navigating | Driver to pickup | "Picking up passenger" |
| In Ride | Passenger in vehicle | Full-screen ads |
| Ride Complete | Trip ended | Thank you + earnings |
| Offline | No connectivity | "Screen offline" message |

### Impression Tracking

```typescript
// Feature: Impression Tracking
interface ImpressionTracking {
  view_duration: boolean;
  interaction_log: boolean;
  offline_queue: boolean;
  sync_when_online: boolean;
}
```

| Feature | Description | Priority |
|---------|-------------|----------|
| View Duration | Track seconds viewed | P0 |
| Interaction Log | Tap, swipe events | P1 |
| Viewability | Detect if screen visible | P1 |
| Offline Queue | Store when offline | P1 |
| Sync When Online | Upload queued data | P1 |
| Revenue Attribution | Link to driver earnings | P0 |

### Uptime Compliance

```typescript
// Feature: Uptime Compliance
interface UptimeCompliance {
  uptime_tracking: boolean;
  compliance_threshold: number; // 70%
  penalty_structure: boolean;
}
```

| Feature | Description | Priority |
|---------|-------------|----------|
| Uptime Tracking | Track screen-on time per ride | P0 |
| 70% Threshold | Minimum requirement | P0 |
| Compliance Score | Driver's compliance percentage | P1 |
| Penalty Warning | Alert when below threshold | P1 |
| Revenue Impact | Reduced ad share if non-compliant | P1 |
| Deactivation | Screen disabled after repeated failure | P2 |

---

## Backend Services

### Ride Service

```typescript
// Feature: Ride Service
interface RideService {
  endpoints: string[];
  state_machine: string[];
}

const RIDE_STATES = [
  'requested',   // Ride created, waiting for driver
  'assigned',    // Driver matched, en route
  'accepted',    // Driver confirmed
  'arrived',     // Driver at pickup
  'in_progress', // Ride started
  'completed',   // Ride finished
  'cancelled'    // Ride cancelled
];
```

| Feature | Description | Endpoint |
|---------|-------------|----------|
| Create Ride | Book new ride | `POST /rides` |
| Get Ride | Get ride details | `GET /rides/:id` |
| Update Status | Transition state | `PATCH /rides/:id/status` |
| Cancel Ride | Cancel with reason | `POST /rides/:id/cancel` |
| Get History | User's ride history | `GET /rides/history` |
| Calculate Fare | Compute final fare | `POST /rides/:id/fare` |
| Add Stop | Add intermediate stop | `PATCH /rides/:id/stops` |

### Driver Service

```typescript
// Feature: Driver Service
interface DriverService {
  endpoints: string[];
  state_machine: string[];
}

const DRIVER_STATES = [
  'offline',   // Not accepting rides
  'online',    // Available
  'riding',    // On active ride
  'busy'       // Temporarily unavailable
];
```

| Feature | Description | Endpoint |
|---------|-------------|----------|
| Register Driver | New driver signup | `POST /drivers` |
| Get Driver | Get driver profile | `GET /drivers/:id` |
| Update Status | Go online/offline | `PATCH /drivers/:id/status` |
| Get Earnings | Driver earnings | `GET /drivers/:id/earnings` |
| Request Payout | Trigger payout | `POST /drivers/:id/payout` |
| Get Payout History | Past payouts | `GET /drivers/:id/payouts` |
| Update Location | Report GPS location | `POST /drivers/:id/location` |

### Dispatch Service

```typescript
// Feature: Dispatch Service
interface DispatchService {
  matching_algorithm: 'nearest' | 'score_based';
  geospatial_index: 'redis_geo' | 'h3';
  timeout_seconds: number; // 15
}
```

| Feature | Description | Endpoint |
|---------|-------------|----------|
| Find Nearby | Query available drivers | `POST /dispatch/find` |
| Match Driver | Assign driver to ride | `POST /dispatch/match` |
| Send Request | Notify driver | `POST /dispatch/request` |
| Handle Timeout | Retry or expand | `POST /dispatch/timeout` |
| Cancel Request | Cancel pending request | `POST /dispatch/cancel` |

### Fare Service

```typescript
// Feature: Fare Service
interface FareService {
  vehicle_types: {
    auto: { base: 25; per_km: 10; per_min: 1.5; };
    cab: { base: 40; per_km: 14; per_min: 2; };
    suv: { base: 60; per_km: 18; per_min: 2.5; };
  };
  night_multiplier: 1.25; // 11 PM - 6 AM
}
```

| Feature | Description | Endpoint |
|---------|-------------|----------|
| Estimate Fare | Upfront price | `POST /fare/estimate` |
| Calculate Fare | Final price | `POST /fare/calculate` |
| Apply Surge | Dynamic pricing | `POST /fare/surge` |
| Night Charges | Time-based rate | Auto |
| Distance Calculation | Route distance | Internal |

### Payment Service

```typescript
// Feature: Payment Service
interface PaymentService {
  methods: ['wallet', 'upi', 'card'];
  auto_debit: boolean;
  cashback_percentage: 10; // 10%
}
```

| Feature | Description | Endpoint |
|---------|-------------|----------|
| Process Payment | Charge user | `POST /payments` |
| Get Balance | Wallet balance | `GET /payments/balance` |
| Add Money | Top up wallet | `POST /payments/add` |
| Cashback Credit | Credit 10% | `POST /payments/cashback` |
| Refund | Process refund | `POST /payments/refund` |

### Ad Service

```typescript
// Feature: Ad Service
interface AdService {
  targeting: ['intent', 'category', 'location', 'time'];
  cpm_range: { min: 10; max: 100; };
  revenue_split: { driver: 60; platform: 40; };
}
```

| Feature | Description | Endpoint |
|---------|-------------|----------|
| Get Targeted Ad | Fetch ad for ride | `POST /ads/target` |
| Record Impression | Log impression | `POST /ads/impression` |
| Record Interaction | Log interaction | `POST /ads/interaction` |
| Get Report | Ride ad report | `GET /ads/report/:rideId` |
| Get Revenue | Ad revenue breakdown | `GET /ads/revenue/:driverId` |

---

## Admin Dashboard

### Dashboard Overview

```typescript
// Feature: Admin Dashboard
interface AdminDashboard {
  real_time_metrics: boolean;
  date_filters: boolean;
  export_data: boolean;
}
```

| Feature | Description | Priority |
|---------|-------------|----------|
| Live Rides | Current active rides | P0 |
| Active Drivers | Online driver count | P0 |
| Today's Revenue | Platform revenue | P0 |
| Today's Rides | Completed rides | P0 |
| Pending Payouts | Driver payouts pending | P0 |
| Alerts | System warnings | P1 |
| Date Filters | Custom date range | P0 |
| Export Data | Download CSV/PDF | P2 |

### Driver Management

```typescript
// Feature: Driver Management
interface DriverManagement {
  approval_workflow: boolean;
  document_verification: boolean;
  suspension: boolean;
}
```

| Feature | Description | Priority |
|---------|-------------|----------|
| Driver List | All registered drivers | P0 |
| Pending Approvals | Awaiting verification | P0 |
| Document Review | Verify DL, RC, etc. | P0 |
| Approve/Reject | Accept or reject driver | P0 |
| Driver Details | Full profile view | P0 |
| Driver Stats | Ratings, rides, earnings | P0 |
| Suspend Driver | Temporarily block | P1 |
| Permanent Ban | Remove from platform | P1 |
| Driver Search | Find by name/phone | P0 |

### User Management

```typescript
// Feature: User Management
interface UserManagement {
  user_list: boolean;
  ride_history: boolean;
  wallet_history: boolean;
}
```

| Feature | Description | Priority |
|---------|-------------|----------|
| User List | All registered users | P0 |
| User Details | Profile, contact | P0 |
| User Rides | All user's rides | P0 |
| Wallet Transactions | User's wallet history | P1 |
| Suspend User | Block user | P1 |
| Fraud Flag | Mark suspicious | P1 |

### City Management

```typescript
// Feature: City Management
interface CityManagement {
  multi_city: boolean;
  zone_pricing: boolean;
}
```

| Feature | Description | Priority |
|---------|-------------|----------|
| City List | All operating cities | P0 |
| Add City | Launch new city | P0 |
| City Settings | Configure pricing | P0 |
| Zone Editor | Define pricing zones | P1 |
| Surge Zones | Set surge areas | P1 |
| City Analytics | Per-city metrics | P0 |

### Screen Management

```typescript
// Feature: Screen Management
interface ScreenManagement {
  device_registry: boolean;
  health_monitoring: boolean;
  compliance_tracking: boolean;
}
```

| Feature | Description | Priority |
|---------|-------------|----------|
| Screen List | All registered screens | P0 |
| Register Screen | Add new device | P0 |
| Screen Health | Online/offline status | P0 |
| Uptime Report | Compliance percentage | P0 |
| Update Screen | Push OTA update | P1 |
| Deactivate Screen | Disable device | P1 |

### Analytics

```typescript
// Feature: Analytics
interface Analytics {
  metrics: ['rides', 'revenue', 'drivers', 'users', 'ads'];
  visualizations: ['chart', 'table', 'map'];
}
```

| Feature | Description | Priority |
|---------|-------------|----------|
| Rides Analytics | Volume, trends | P0 |
| Revenue Analytics | Ad vs ride revenue | P0 |
| Driver Analytics | Supply, engagement | P0 |
| User Analytics | Acquisition, retention | P0 |
| Ad Analytics | Impressions, CPM | P0 |
| Heatmaps | Demand visualization | P1 |
| Cohort Analysis | User retention | P2 |
| Funnel Analysis | Booking conversion | P1 |

### Support

```typescript
// Feature: Support
interface Support {
  ticket_system: boolean;
  dispute_resolution: boolean;
}
```

| Feature | Description | Priority |
|---------|-------------|----------|
| Support Tickets | View all tickets | P0 |
| Assign Ticket | Assign to agent | P1 |
| Resolve Ticket | Mark as resolved | P0 |
| Dispute Center | Ride disputes | P1 |
| Refund Approval | Approve refunds | P0 |
| Compensation | Issue credits | P1 |

---

## Safety & Trust

### User Safety

```typescript
// Feature: User Safety
interface UserSafety {
  emergency: boolean;
  trip_sharing: boolean;
  verification: boolean;
}
```

| Feature | Description | Priority |
|---------|-------------|----------|
| SOS Button | Emergency contact + location | P0 |
| Share Trip | Real-time location sharing | P0 |
| Trip Check-in | Prompt after expected time | P1 |
| Driver Verification | Background check badge | P0 |
| Vehicle Verification | RC, permit check badge | P0 |
| Trip Recording | Audio recording (opt-in) | P2 |
| Safety Score | Driver safety rating | P2 |
| Ride Insurance | Per-ride coverage | P1 |

### Driver Safety

```typescript
// Feature: Driver Safety
interface DriverSafety {
  rider_verification: boolean;
  panic_button: boolean;
  trip_tracking: boolean;
}
```

| Feature | Description | Priority |
|---------|-------------|----------|
| Rider Verification | Phone verification badge | P0 |
| Trip Details | Share trip with contacts | P0 |
| Panic Button | Emergency alert | P1 |
| Route Deviation Alert | Alert if suspicious | P1 |
| Insurance | Accident coverage | P1 |
| Health Benefits | Wellness program | P3 |

### Fraud Prevention

```typescript
// Feature: Fraud Prevention
interface FraudPrevention {
  detection: boolean;
  prevention: boolean;
}
```

| Feature | Description | Priority |
|---------|-------------|----------|
| Fake Booking Detection | Suspicious patterns | P1 |
| Driver Collusion | Fare manipulation | P1 |
| Promo Abuse | Coupon fraud | P1 |
| Payment Fraud | Stolen cards | P1 |
| Location Spoofing | Fake GPS | P1 |
| Multi-Accounting | Duplicate accounts | P1 |

---

## Ads & Monetization

### Ad Targeting

```typescript
// Feature: Ad Targeting
interface AdTargeting {
  intent: boolean;
  category: boolean;
  location: boolean;
  time: boolean;
  device: boolean;
}
```

| Feature | Description | Priority |
|---------|-------------|----------|
| Intent Targeting | Based on ride context | P0 |
| Category Targeting | Travel, food, retail | P0 |
| Location Targeting | Near POI, destination | P1 |
| Time Targeting | Morning, evening, etc. | P1 |
| Device Targeting | Phone type, OS | P2 |
| Retargeting | Previous ad interactions | P2 |
| Lookalike | Similar user profiles | P2 |

### Ad Formats

```typescript
// Feature: Ad Formats
interface AdFormats {
  image: { width: number; height: number; size_mb: number; };
  video: { duration_sec: number; formats: string[]; };
}
```

| Format | Specs | Priority |
|--------|-------|----------|
| Hero Image | 1920x1080, <2MB | P0 |
| Video | 15-30 sec, MP4 | P1 |
| Carousel | 3-5 cards | P2 |
| Interactive | Deep links | P2 |

### Advertiser Portal

```typescript
// Feature: Advertiser Portal
interface AdvertiserPortal {
  self_service: boolean;
  api_access: boolean;
}
```

| Feature | Description | Priority |
|---------|-------------|----------|
| Campaign Create | Set up new campaign | P1 |
| Targeting Setup | Choose audience | P1 |
| Budget Control | Daily/monthly limits | P1 |
| Creative Upload | Add images/videos | P1 |
| Performance Dashboard | Real-time stats | P1 |
| Billing & Invoices | Payment history | P1 |
| API Access | Programmatic buying | P2 |

### Revenue Model

```typescript
// Feature: Revenue Model
interface RevenueModel {
  cpm_rates: {
    standard: 10;   // ₹10-15
    targeted: 25;    // ₹20-30
    intent: 50;     // ₹40-60
    premium: 80;    // ₹80-100
  };
  split: {
    driver: 60;
    platform: 40;
  };
}
```

| Tier | CPM | Targeting | Priority |
|------|-----|-----------|----------|
| Standard | ₹10-15 | Random | P0 |
| Category | ₹20-30 | By category | P0 |
| Intent | ₹40-60 | By ride context | P0 |
| Premium | ₹80-100 | Real-time personalized | P1 |

---

## Ecosystem Integration

### ReZ Ecosystem

```typescript
// Feature: Ecosystem Integration
interface EcosystemIntegration {
  wallet_unified: boolean;
  loyalty_unified: boolean;
  cross_promotion: boolean;
}
```

| Feature | Description | Priority |
|---------|-------------|----------|
| Single Wallet | ReZ Wallet works everywhere | P0 |
| Loyalty Points | Earn across all services | P0 |
| Cashback Universal | Use ride cashback on food | P0 |
| Hotel Integration | Ride to/from hotel | P1 |
| Restaurant Integration | Ride to restaurant | P1 |
| Travel Integration | Ride to station/airport | P2 |

### External Integrations

```typescript
// Feature: External Integrations
interface ExternalIntegrations {
  maps: ['google', 'mapbox', 'osrm'];
  payments: ['razorpay', 'upi'];
  communications: ['twilio', 'firebase'];
}
```

| Integration | Purpose | Priority |
|------------|---------|----------|
| Google Maps | Primary routing, ETA | P0 |
| Mapbox | Fallback routing | P2 |
| Razorpay | Driver payouts | P0 |
| UPI | Instant payouts | P0 |
| Firebase | Push notifications | P0 |
| Twilio | SMS, voice | P1 |

### Channel Integration

```typescript
// Feature: Channel Integration
interface ChannelIntegration {
  whatsapp: boolean;
  voice: boolean;
  qr: boolean;
}
```

| Channel | Feature | Priority |
|---------|---------|----------|
| WhatsApp | Book via WhatsApp bot | P2 |
| Voice | Book via voice assistant | P3 |
| QR Code | Scan QR to book | P2 |
| Widget | Embed booking widget | P2 |

---

## Technical Requirements

### Mobile Apps

```typescript
// Feature: Mobile Requirements
interface MobileRequirements {
  ios: { min_version: '14.0'; };
  android: { min_version: '8.0'; api_level: 26; };
}
```

| Requirement | iOS | Android |
|-------------|-----|---------|
| Min Version | 14.0 | 8.0 (API 26) |
| Location Permission | Always | Always |
| Notification Permission | Yes | Yes |
| Camera (Driver) | For photo upload | For photo upload |

### Backend

```typescript
// Feature: Backend Requirements
interface BackendRequirements {
  uptime_sla: '99.9%';
  p95_latency_ms: 200;
  concurrent_rides: 10000;
}
```

| Requirement | Value |
|-------------|-------|
| Uptime SLA | 99.9% |
| P95 Latency | <200ms |
| Concurrent Rides | 10,000+ |
| Driver Location Updates | Every 3 sec |
| Ad Decision Latency | <100ms |

### Security

```typescript
// Feature: Security Requirements
interface SecurityRequirements {
  encryption: 'AES-256';
  tls: '1.3';
  token_expiry_minutes: 60;
}
```

| Requirement | Implementation |
|-------------|----------------|
| Data Encryption | AES-256 at rest |
| Transport | TLS 1.3 |
| Auth Tokens | JWT, 60-min expiry |
| Rate Limiting | Per-endpoint |
| Input Validation | Zod schemas |

---

## Implementation Phases

### Phase 1: Core (MVP)

**Timeline:** 3 months
**Features:** 25

```
User App:       Login, Home, Booking, Tracking, Completion, History
Driver App:     Login, Online, Requests, Navigation, Ride Controls, Earnings
Backend:        Ride, Driver, Fare, Dispatch, Payment, Auth
Admin:          Dashboard, Driver Approval, User View, City Config
Safety:         SOS, Trip Share, Driver Verification
```

### Phase 2: Intelligence & Cashback

**Timeline:** 2 months
**Features:** 18

```
User App:       10% Cashback, In-ride Ads, Rating
Driver App:      Ad Revenue, Weekly Payout
Backend:         Cashback Service, Ad Targeting, ReZ Mind
Admin:           Ad Analytics, Screen Management
Ecosystem:       Cross-service cashback
```

### Phase 3: Vehicle Screens & Scale

**Timeline:** 3 months
**Features:** 20

```
Screens:        Real-time Ads, Impression Tracking, Uptime Compliance
Multi-city:     City Management, Zone Pricing
Transport:       Bus Booking
Admin:           Screen Dashboard, Multi-city Analytics
```

### Phase 4: Advanced

**Timeline:** 3 months
**Features:** 22

```
Pricing:        Surge, Dynamic, Night Charges
Matching:       Preferences, Scheduled Rides
Enterprise:     Corporate Accounts, API
Safety:         Insurance, Trip Recording
Channels:       WhatsApp, QR Booking
```

---

## Open Questions

1. **Launch City:** Which city to start with?
2. **Fleet Strategy:** Own vehicles or driver-partners?
3. **Screen Program:** ReZ provides hardware or drivers buy?
4. **Regulatory:** What licenses needed in India?
5. **Driver Acquisition:** How to attract initial driver pool?
6. **Marketing Budget:** How much for user acquisition?

---

## Appendix

### Abbreviations

| Abbreviation | Full Form |
|--------------|-----------|
| OTP | One-Time Password |
| ETA | Estimated Time of Arrival |
| SOS | Save Our Souls (Emergency) |
| OTA | Over-The-Air (Updates) |
| CPM | Cost Per Mille (per 1000 impressions) |
| TDS | Tax Deducted at Source |
| UPI | Unified Payments Interface |
| RC | Registration Certificate |
| DL | Driving License |
| POV | Point of View |

### Glossary

| Term | Definition |
|------|------------|
| Surge Pricing | Dynamic multiplier during high demand |
| Geospatial Index | Data structure for location queries |
| H3 | Uber's hexagonal hierarchical spatial index |
| Cashback | Credit back to wallet (not withdrawal) |
| Ad Impression | Ad view counted (minimum 5 sec) |
