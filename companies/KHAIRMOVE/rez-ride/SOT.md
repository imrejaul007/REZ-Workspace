# ReZ Ride - Source of Truth

**Last Updated:** 2026-05-25
**Version:** 2.5.0
**Status:** Production Ready (Builds Verified)

---

## Security Audit Status

**Last Audit:** 2026-05-23
**Issues Fixed:** 31 Math.random() → crypto | Input Validation | Rate Limiting | Type Safety

| Category | Issues | Status |
|----------|--------|--------|
| Math.random() | 31 | ✅ Fixed |
| Input Validation | 5 services | ✅ Added Zod |
| Error Handling | 6 services | ✅ Typed exceptions |
| Rate Limiting | Booking endpoints | ✅ Added |
| Auth Middleware | Rental service | ✅ Added |
| **Mobile Hardening** | Biometric, Secure Storage | ✅ Added |
| **Type Safety** | Shared types | ✅ `@rez/types` package |

---

## Positioning

> **"India's smartest rewards-powered mobility ecosystem"**
> **"Rides that pay you back"**

ReZ Ride is NOT just another taxi app. It's a **mobility commerce + advertising + rewards infrastructure** integrated into the wider REZ ecosystem.

---

## Quick Reference

| Item | Value |
|------|-------|
| **Port** | 4000 |
| **API Base** | `/api` |
| **WebSocket** | `/ride` |
| **Health** | `/health` |
| **Database** | MongoDB |
| **Cache** | Redis |
| **Services** | 65 |
| **Routes** | 39 |
| **User Screens** | 14 |
| **Driver Screens** | 6 |

---

## Build Status (2026-05-25)

### Native Builds

| Component | Platform | Status | Output | Size |
|-----------|----------|--------|--------|------|
| Backend | Node.js | ✅ Pass | `dist/` | - |
| User App | Android | ✅ APK | `apps/user-app/android/app/build/outputs/apk/debug/app-debug.apk` | 123MB |
| Driver App | Android | ✅ APK | `apps/driver-app/android/app/build/outputs/apk/debug/app-debug.apk` | 123MB |

### JS Bundles

| Component | Platform | Status | Output | Size |
|-----------|----------|--------|--------|------|
| User App | Android | ✅ Bundled | Hermes bytecode in APK | 4.1MB |
| User App | iOS | ✅ Exported | `dist/_expo/static/js/ios/` | 4.1MB |
| Driver App | Android | ✅ Exported | `dist/_expo/static/js/android/` | 4.1MB |
| Driver App | iOS | ✅ Exported | `dist/_expo/static/js/ios/` | 3.8MB |

### Build Commands

```bash
# Backend
cd rez-ride && npm run build

# User App Android
cd rez-ride/apps/user-app && npx expo prebuild --platform android
cd rez-ride/apps/user-app/android && ./gradlew assembleDebug

# Driver App Android
cd rez-ride/apps/driver-app && npx expo prebuild --platform android
cd rez-ride/apps/driver-app/android && ./gradlew assembleDebug

# JS Export
cd rez-ride/apps/user-app && npx expo export --platform all
cd rez-ride/apps/driver-app && npx expo export --platform all
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         ReZ Ride (:4000)                        │
├─────────────────────────────────────────────────────────────────┤
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐       │
│   │  User App   │    │ Driver App  │    │   Admin     │       │
│   │ 14 screens  │    │ 6 screens   │    │  Dashboard  │       │
│   └──────┬──────┘    └──────┬──────┘    └──────┬──────┘       │
│          │                   │                   │               │
│          └───────────────────┼───────────────────┘               │
│                              │                                    │
│                     ┌────────▼────────┐                          │
│                     │   API Gateway   │                          │
│                     │  65 services   │                          │
│                     │  38 routes    │                          │
│                     └────────┬────────┘                          │
│                              │                                    │
└──────────────────────────────┼──────────────────────────────────┘
                               │
     ┌─────────────────────────┼─────────────────────────┐
     │                         │                         │
     ▼                         ▼                         ▼
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   RABTUL   │         │    REZ     │         │  REZ Media  │
│  (Shared)  │         │ INTELLIGENCE│         │   (Ads)     │
├─────────────┤         ├─────────────┤         ├─────────────┤
│ Auth 4002  │         │Intent 4018 │         │Ads 4068    │
│Wallet 4004 │         │Predict 4123│         │Karma 4041  │
│Pay 4001    │         │Signal 4142 │         │DOOH 4018   │
│Notify 4011 │         │Fraud 3007  │         │            │
│Profile 4013 │         │Identity 4050│         │            │
└─────────────┘         └─────────────┘         └─────────────┘
```

---

## Services (65 Total)

### Core Services (15)

| Service | File | Purpose |
|---------|------|---------|
| RideService | `services/ride.service.ts` | Ride lifecycle FSM |
| DriverService | `services/driver.service.ts` | Driver management |
| FareService | `services/fare.service.ts` | Pricing calculation |
| AuthService | `services/auth.service.ts` | JWT/OTP |
| WalletService | `services/wallet.service.ts` | Balance/cashback |
| MapsService | `services/maps.service.ts` | Maps/ETA |
| NotificationService | `services/notification.service.ts` | Push/SMS |
| SafetyService | `services/safety.service.ts` | SOS/emergency |
| SurgeService | `services/surge.service.ts` | Dynamic pricing |
| QuestService | `services/quest.service.ts` | Driver bonuses |
| RentalService | `services/rental.service.ts` | Hourly rentals |
| ScheduledService | `services/scheduled.service.ts` | Pre-booking |
| AirportService | `services/airport.service.ts` | Airport mode |
| GreenService | `services/green.service.ts` | EV/sustainability |
| VoiceService | `services/voice.service.ts` | Voice commands |

### Integration Services (18)

| Service | File | Port | Purpose |
|---------|------|------|---------|
| intelligenceService | `services/intelligence.service.ts` | 4018 | AI/ML |
| rabtulService | `services/rabtul.service.ts` | 4002-4016 | RABTUL |
| mediaService | `services/media.service.ts` | 4068 | Ads/Karma |
| corporateService | `services/corporate.service.ts` | - | CorpPerks |
| ecosystemService | `services/ecosystem.service.ts` | - | Hub |
| dataPipelineService | `services/data-pipeline.service.ts` | 3s batch | Real-time |
| geoSearchService | `services/geo-search.service.ts` | - | Location |
| fraudDetectionService | `services/fraud.service.ts` | 3007 | Fraud |
| identityService | `services/identity.service.ts` | 4050 | Identity |
| locationIntelligenceService | `services/location-intelligence.service.ts` | 4040 | Location |
| signalAggregatorService | `services/signal-aggregator.service.ts` | 4142 | Signals |
| attributionService | `services/attribution.service.ts` | 4100 | Attribution |
| paymentsService | `services/payments.service.ts` | 4001 | Payments |
| otpService | `services/otp.service.ts` | - | OTP |
| emailService | `services/email.service.ts` | - | Email |
| cacheService | `services/cache.service.ts` | - | Redis cache |
| chatService | `services/chat.service.ts` | - | Chat |
| auditService | `services/audit.service.ts` | - | Audit log |

### Commerce Services (3) - NEW

| Service | File | Purpose |
|---------|------|---------|
| subscriptionService | `services/subscription.service.ts` | ReZ Ride Plus |
| rideCommerceService | `services/ride-commerce.service.ts` | In-ride offers |
| predictiveSuggestionsService | `services/predictive-suggestions.service.ts` | AI suggestions |

### Feature Services (29)

| Service | File | Purpose |
|---------|------|---------|
| VoucherService | `services/voucher.service.ts` | Vouchers/coupons |
| AdsService | `services/ads.service.ts` | In-app ads |
| AIMatchingService | `services/ai-matching.service.ts` | Smart matching |
| ChurnRetentionService | `services/churn-retention.service.ts` | Retention |
| CommandCenterService | `services/command-center.service.ts` | Operations |
| CommerceIntegrationService | `services/commerce-integration.service.ts` | Commerce |
| CsatSentimentService | `services/csat-sentiment.service.ts` | NLP/sentiment |
| DriverBenefitsService | `services/driver-benefits.service.ts` | Benefits |
| GiftCardsService | `services/gift-cards.service.ts` | Gift cards |
| LiveTrackingService | `services/live-tracking.service.ts` | GPS tracking |
| LtvAttributionService | `services/ltv-attribution.service.ts` | LTV tracking |
| PayoutService | `services/payout.service.ts` | Driver payouts |
| PoolService | `services/pool.service.ts` | Shared rides |
| PredictiveDemandService | `services/predictive-demand.service.ts` | Demand |
| RealtimeInsightsService | `services/realtime-insights.service.ts` | Analytics |
| ApprovalService | `services/approval.service.ts` | Corporate |
| CityService | `services/city.service.ts` | City management |
| EventPipelineService | `services/event-pipeline.service.ts` | Events |
| GeoService | `services/geo.service.ts` | Geo operations |
| GreenRidesService | `services/green-rides.service.ts` | EV |
| IntegrationHubService | `services/integration-hub.service.ts` | Hub |
| MLService | `services/ml.service.ts` | ML |
| QuickRideService | `services/quick-ride.service.ts` | Express |
| ReportService | `services/report.service.ts` | Reports |
| SupportService | `services/support.service.ts` | Support |
| TicketService | `services/ticket.service.ts` | Tickets |
| QuestService | `services/quests.service.ts` | Quests |
| WalletHistoryService | `services/wallet-history.service.ts` | History |
| WhatsAppService | `services/whatsapp.service.ts` | WhatsApp |

---

## API Routes (38 Total)

### Auth (5)
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/request-otp` | POST | Send OTP |
| `/api/auth/verify-otp` | POST | Verify OTP |
| `/api/auth/refresh` | POST | Refresh token |
| `/api/auth/driver/request-otp` | POST | Driver OTP |
| `/api/auth/driver/verify-otp` | POST | Driver verify |

### Analytics (2) - NEW
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/analytics/batch` | POST | Batch events |
| `/api/analytics/track` | POST | Single event |

### Rides (5)
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/rides` | POST | Create ride |
| `/api/rides/:id` | GET | Get ride |
| `/api/rides/:id/cancel` | POST | Cancel |
| `/api/rides/:id/complete` | POST | Complete |
| `/api/rides/history` | GET | History |

### Drivers (4)
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/drivers/nearby` | GET | Find drivers |
| `/api/drivers/:id/location` | PUT | Update location |
| `/api/drivers/accept/:rideId` | POST | Accept ride |
| `/api/drivers/:id` | GET | Profile |

### Fares (3)
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/fares/estimate` | GET | Calculate fare |
| `/api/fares/compare` | GET | Compare vehicles |
| `/api/surge/:lat/:lng` | GET | Surge pricing |

### Subscriptions (5) - NEW
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/subscription/plans` | GET | Get plans |
| `/api/subscription/subscribe` | POST | Subscribe |
| `/api/subscription/:userId` | GET | Get subscription |
| `/api/subscription/:userId` | DELETE | Cancel |
| `/api/subscription/:userId/benefits` | GET | Get benefits |

### Commerce (6) - NEW
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/commerce/offers` | POST | Get offers |
| `/api/commerce/in-ride` | POST | In-ride offers |
| `/api/commerce/destination` | POST | Destination offers |
| `/api/commerce/personalized` | POST | Personalized offers |
| `/api/commerce/corporate` | POST | Corporate offers |
| `/api/commerce/track` | POST | Track interaction |

### Predictions (5) - NEW
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/predictions/:userId` | GET | Get suggestions |
| `/api/predictions/:userId/destination` | GET | Predict destination |
| `/api/predictions/:userId/routine` | GET | Check routine |
| `/api/predictions/surge/:lat/:lng` | GET | Predict surge |
| `/api/predictions/:userId/offers` | GET | Predicted offers |

### Safety (6) - NEW
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/safety/sos` | POST | SOS emergency |
| `/api/safety/share-location` | POST | Share location |
| `/api/safety/ride/:id/status` | GET | Safety status |
| `/api/safety/ride/:id/report` | POST | Report issue |
| `/api/safety/emergency-contacts` | POST | Add contacts |
| `/api/safety/emergency-numbers` | GET | Get numbers |

### Geo (3)
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/geo/search` | GET | Search places |
| `/api/geo/reverse` | GET | Address lookup |
| `/api/geo/distance` | GET | Distance calc |

### Dashboard (5)
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/dashboard/user/:id` | GET | User dashboard |
| `/api/dashboard/driver/:id` | GET | Driver dashboard |
| `/api/dashboard/corporate/:id` | GET | Corporate |
| `/api/dashboard/executive` | GET | Executive |
| `/api/dashboard/analytics` | GET | Analytics |

### Real-time (5)
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/realtime/user-location` | POST | Track user GPS |
| `/api/realtime/driver-location` | POST | Track driver GPS |
| `/api/realtime/demand-heatmap` | GET | Demand map |
| `/api/realtime/insights` | GET | Live metrics |
| `/api/realtime/search` | POST | Track search |

### Vouchers (4)
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/vouchers` | GET | List vouchers |
| `/api/vouchers/apply` | POST | Apply voucher |
| `/api/vouchers/:id` | GET | Voucher details |
| `/api/vouchers/create` | POST | Create voucher |

### Rental (10) - NEW
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/rental/packages` | GET | List packages |
| `/api/rental/packages/:id` | GET | Package details |
| `/api/rental/booking` | POST | Create booking |
| `/api/rental/booking/:id` | GET | Get booking |
| `/api/rental/booking/:id/start` | POST | Start rental |
| `/api/rental/booking/:id/complete` | POST | Complete rental |
| `/api/rental/booking/:id/cancel` | POST | Cancel booking |
| `/api/rental/user/:id` | GET | User's active rental |
| `/api/rental/user/:id/history` | GET | Rental history |
| `/api/rental/drivers` | GET | Available drivers |

---

## Fare Structure

| Vehicle | Base | Per KM | Per Min | Example (10km, 20min) |
|---------|------|--------|---------|------------------------|
| Bike | ₹15 | ₹6 | ₹1 | ₹115 |
| Auto | ₹25 | ₹10 | ₹1.5 | ₹220 |
| Cab | ₹40 | ₹14 | ₹2 | ₹300 |
| SUV | ₹60 | ₹18 | ₹2.5 | ₹410 |

**Cashback:** 10% on all rides

---

## ReZ Ride Plus - Subscription Plans

| Tier | Price | Surge | Free Cancels | Cashback | Priority |
|------|-------|-------|--------------|----------|----------|
| Lite | ₹99/mo | 5% | 1/mo | +2% | ❌ |
| Plus | ₹199/mo | 10% | 3/mo | +5% | ✅ |
| Premium | ₹299/mo | 20% | 5/mo | +10% | ✅ + Lounge |

---

## Mobile Apps

### User App (14 screens)
**Path:** `apps/user-app/`

| Screen | File | Purpose |
|--------|------|---------|
| Login | `screens/LoginScreen.tsx` | Phone entry + Biometric |
| OTP | `screens/OTPScreen.tsx` | OTP verification |
| Home | `screens/HomeScreen.tsx` | Main screen |
| Location Search | `screens/LocationSearchScreen.tsx` | Search places |
| Add Stop | `screens/AddStopScreen.tsx` | Add stops |
| Confirm Ride | `screens/ConfirmRideScreen.tsx` | Confirm booking |
| Finding Driver | `screens/FindingDriverScreen.tsx` | Waiting for driver |
| In Ride | `screens/InRideScreen.tsx` | Active ride |
| Ride Details | `screens/RideDetailsScreen.tsx` | Ride info |
| Rating | `screens/RatingScreen.tsx` | Rate driver |
| Wallet | `screens/WalletScreen.tsx` | Balance |
| History | `screens/RideHistoryScreen.tsx` | Past rides |
| Profile | `screens/ProfileScreen.tsx` | User profile |
| Support | `screens/SupportScreen.tsx` | Help |

**User App Features:**
- Biometric authentication (Face ID / Touch ID / Fingerprint)
- Secure token storage (expo-secure-store)
- Error boundaries
- Sentry crash reporting
- Analytics with batch sending
- Offline queue
- Deep linking (rezride://, https://rezride.com)

### Driver App (7 screens)
**Path:** `apps/driver-app/`

| Screen | File | Purpose |
|--------|------|---------|
| Login | `screens/DriverLoginScreen.tsx` | Phone entry + Biometric |
| OTP | `screens/DriverOTPScreen.tsx` | OTP verification |
| Home | `screens/DriverHomeScreen.tsx` | Main screen |
| Incoming Ride | `screens/IncomingRideScreen.tsx` | Ride request |
| Active Ride | `screens/DriverRideActiveScreen.tsx` | Driving |
| Earnings | `screens/DriverEarningsScreen.tsx` | Earnings |
| Profile | `screens/DriverProfileScreen.tsx` | Driver profile |

**Driver App Features:**
- Biometric authentication (Face ID / Touch ID / Fingerprint)
- Secure token storage (expo-secure-store)
- Error boundaries
- Sentry crash reporting
- Analytics with batch sending
- **GPS location tracking (3s intervals)**
- Deep linking (rezridedriver://, https://driver.rezride.com)

### Mobile Services

| Service | Purpose |
|---------|---------|
| `secure-storage.ts` | Encrypted token storage |
| `biometric.service.ts` | Biometric authentication |
| `crash-reporting.ts` | Sentry integration |
| `analytics.service.ts` | Event tracking |
| `offline-queue.ts` | Offline request queue |
| `location.service.ts` | GPS tracking (Driver) |

---

## Integrations

### RABTUL Technologies (6)
| Service | Port | Features |
|---------|------|----------|
| Auth | 4002 | JWT/OTP |
| Wallet | 4004 | Balance/cashback |
| Payments | 4001 | Razorpay |
| Notifications | 4011 | Push/SMS |
| Profile | 4013 | User data |
| Analytics | 4016 | Dashboards |

### REZ Intelligence (6)
| Service | Port | Features |
|---------|------|----------|
| Intent | 4018 | Destination prediction |
| Predictive | 4123 | Churn/LTV |
| Signal | 4142 | Behavioral signals |
| Location | 4040 | Hot zones |
| Fraud | 3007 | Fraud detection |
| Identity | 4050 | Cross-platform |

### Attribution
| Service | Port | Features |
|---------|------|----------|
| Hub | 4100 | LTV by channel, ROI |

### REZ Media
| Service | Port | Features |
|---------|------|----------|
| Ads | 4068 | In-app advertising |
| Karma | 4041 | Gamification |

---

## Data Pipeline

```
Every 3 seconds:
┌──────────────────────────────────────────────────────┐
│                                                       │
│  User Location ──────┐                               │
│  (5s intervals)      │                               │
│                      ▼                               │
│              ┌────────────────┐                     │
│              │ Data Pipeline   │                     │
│              │ Service        │                     │
│              └────────┬───────┘                     │
│                       │                             │
└───────────────────────┼─────────────────────────────┘
                        │
     ┌──────────────────┼──────────────────┐
     ▼                  ▼                  ▼
┌──────────┐      ┌──────────┐      ┌──────────┐
│  Intent  │      │   Fraud  │      │  Signal  │
│Predictor │      │ Detection │      │Aggregator │
│ (4018)  │      │  (3007)  │      │  (4142)  │
└──────────┘      └──────────┘      └──────────┘
     │                  │                  │
     ▼                  ▼                  ▼
┌──────────┐      ┌──────────┐      ┌──────────┐
│Better    │      │Block     │      │Behavioral │
│Predict   │      │Fraud     │      │Profiles  │
└──────────┘      └──────────┘      └──────────┘
```

---

## Files Structure

```
rez-ride/
├── src/
│   ├── index.ts              # Entry point ✅
│   ├── services/             # 65 services ✅
│   ├── routes/               # 38 routes ✅
│   ├── models/               # Database models ✅
│   ├── middleware/           # Auth, validation ✅
│   └── websocket/            # Real-time ✅
├── apps/
│   ├── user-app/
│   │   ├── App.tsx ✅
│   │   ├── index.js ✅
│   │   ├── app.json ✅
│   │   ├── eas.json ✅
│   │   └── src/
│   │       ├── screens/ (14) ✅
│   │       ├── services/ ✅
│   │       ├── stores/ ✅
│   │       └── api/ ✅
│   └── driver-app/
│       ├── App.tsx ✅
│       ├── index.js ✅
│       ├── app.json ✅
│       ├── eas.json ✅
│       └── src/
│           ├── screens/ (6) ✅
│           ├── services/ ✅
│           ├── stores/ ✅
│           └── api/ ✅
├── docker-compose.yml ✅
├── Dockerfile ✅
├── .env.example ✅
├── package.json ✅
├── tsconfig.json ✅
├── README.md ✅
├── SOT.md ✅ (this file)
└── LAUNCH-CHECKLIST.md ✅
```

---

## Environment Variables

### Required
```bash
PORT=4000
MONGODB_URI=mongodb://...
JWT_SECRET=...
INTERNAL_SERVICE_TOKEN=...
```

### RABTUL
```bash
REZ_AUTH_SERVICE_URL=http://localhost:4002
REZ_WALLET_SERVICE_URL=http://localhost:4004
REZ_PAYMENT_SERVICE_URL=http://localhost:4001
REZ_NOTIFICATIONS_URL=http://localhost:4011
```

### Intelligence
```bash
REZ_INTENT_URL=http://localhost:4018
REZ_PREDICTIVE_URL=http://localhost:4123
REZ_SIGNAL_AGGREGATOR_URL=http://localhost:4142
REZ_LOCATION_INTELLIGENCE_URL=http://localhost:4040
```

### Fraud & Identity
```bash
REZ_FRAUD_SERVICE_URL=http://localhost:3007
REZ_IDENTITY_URL=http://localhost:4050
```

### Attribution
```bash
REZ_ATTRIBUTION_URL=http://localhost:4100
```

### Maps
```bash
GOOGLE_MAPS_API_KEY=...
MAPBOX_ACCESS_TOKEN=...
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-05-19 | Initial |
| 1.1.0 | 2026-05-20 | Added integrations |
| 1.2.0 | 2026-05-21 | Mobile apps documented |
| 1.3.0 | 2026-05-21 | Added commerce features |
| 1.4.0 | 2026-05-22 | Routes added |
| **2.0.0** | **2026-05-22** | **Complete SOT** |
| **2.1.0** | **2026-05-23** | **Security hardening + Rental API** |
| **2.2.0** | **2026-05-23** | **Mobile hardening + Analytics + Location** |

---

## Status

| Component | Status |
|-----------|--------|
| Backend API | ✅ 65 services |
| API Routes | ✅ 39 routes |
| User App | ✅ 14 screens |
| Driver App | ✅ 6 screens |
| Integrations | ✅ 15 services |
| Documentation | ✅ Complete |
| Docker | ✅ Ready |
| Security | ✅ Hardened |
| **Overall** | **✅ Production Ready** |
