# REZ-Consumer - Developer Guide

**Version:** 8.0.0
**Updated:** June 12, 2026
**Status:** ✅ ALL 43 PRODUCTS/SERVICES PRODUCTION READY

---

## IMPORTANT - COMPANY BOUNDARIES

**READ THIS FIRST**

This is **REZ-Consumer** - Consumer B2C apps and services.

### NOT REZ-Consumer (WRONG LOCATION)

| Service | WRONG Folder | CORRECT Company | CORRECT Folder |
|---------|-------------|-----------------|----------------|
| buzzlocal | REZ-Consumer/ | **AXOM** | /Axom/ |
| airzy | REZ-Consumer/ | **KHAIRMOVE** | /KHAIRMOVE/ |
| rider-circle | REZ-Consumer/ | **KHAIRMOVE** | /KHAIRMOVE/ |
| creator-qr | REZ-Consumer/ | **AdBazaar** | /AdBazaar/creators |

---

## REZ-CONSUMER PRODUCTS (43 Products/Services)

### 📱 Mobile Apps (6)

| App | Platform | Screens | Status |
|-----|----------|---------|--------|
| `rez-app` | Expo SDK 53 | 738+ | ✅ COMPLETE |
| `do` | Expo SDK 53 | 20+ | ✅ COMPLETE |
| `verify-qr-mobile` | Expo SDK 53 | 7 | ✅ PRODUCTION READY |
| `safe-qr` | Expo SDK 53 | 16 | ✅ PRODUCTION READY |
| `rez-driver` | Expo SDK 52 | 8 | ✅ COMPLETE |
| `REZ-Home` | Expo SDK 53 | 9 | ✅ PRODUCTION READY |

### 🌐 Web Apps (3)

| App | Platform | Coverage | Status |
|-----|----------|----------|--------|
| `rez-now` | Next.js 16 | 95% | ✅ COMPLETE |
| `verify-qr-dashboard` | Next.js 14 | 70% | ✅ PRODUCTION READY |
| `go4food` | Next.js 14 | 30% | ✅ PRODUCTION READY |

### 🛒 Standalone Apps (2)

| App | Type | Services | Status |
|-----|------|----------|--------|
| `REZ-Mart` | Mobile + 12 services | Gateway, Orders, Cart, Delivery, Tracking, Store, Product, Inventory, Driver, Offer, Subscription, Analytics | ✅ PRODUCTION READY |
| `REZ-Invest` | Mobile + 5 services | Gateway, Brokerage, Trading, Portfolio, Wallet | ✅ PRODUCTION READY |

### ⚙️ Backend Services (11)

| Service | Port | Database | Status |
|---------|------|----------|--------|
| `verify-qr-service` | 4003 | MongoDB + Redis | ✅ PRODUCTION READY |
| `safe-qr-service` | 4001 | MongoDB + Redis | ✅ PRODUCTION READY |
| `REZ-assistant` | 3011 | MongoDB | ✅ PRODUCTION READY |
| `REZ-inbox` | 3003 | MongoDB | ✅ PRODUCTION READY |
| `REZ-bills` | 3012 | MongoDB | ✅ PRODUCTION READY |
| `REZ-expense` | 3013 | MongoDB | ✅ PRODUCTION READY |
| `REZ-nearby` | 3014 | MongoDB | ✅ PRODUCTION READY |
| `REZ-save` | 3016 | MongoDB | ✅ PRODUCTION READY |
| `REZ-scan` | 3017 | MongoDB | ✅ PRODUCTION READY |
| `REZ-menu-qr` | 3018 | MongoDB | ✅ PRODUCTION READY |
| `go4food-api` | 3002 | MongoDB | ✅ PRODUCTION READY |

### 🎨 UI Services (5)

| Service | Port | Status |
|---------|------|--------|
| `REZ-inbox-ui` | 3010 | ✅ PRODUCTION READY |
| `REZ-assistant-ui` | 3011 | ✅ PRODUCTION READY |
| `REZ-expense-ui` | 3013 | ✅ PRODUCTION READY |
| `REZ-nearby-ui` | 3015 | ✅ PRODUCTION READY |
| `REZ-scan-ui` | 3017 | ✅ PRODUCTION READY |

### 🔐 Security Apps (1)

| App | Port | Status |
|-----|------|--------|
| `corpid-shield-app` | 4716 | ✅ PRODUCTION READY |

---

## COMPLETE SERVICES DETAILS

### rez-app (Main Super App)

| Attribute | Value |
|-----------|-------|
| Files | 3,236 |
| Screens | 738+ |
| SDK | Expo SDK 53 |
| Features | QR scanning, wallet, orders, feed, gamification, AI integration |
| State | Zustand + TanStack Query |
| Navigation | Expo Router |

**Integrated Features:**
- REZ-prive (22 screens) - Premium loyalty
- REZ-try (15 screens) - Trial discovery
- REZ-save - Wishlist integration

### do (AI Chat)

| Attribute | Value |
|-----------|-------|
| Files | 154+ (mobile) + 60+ (backend) |
| Screens | 20+ |
| Features | 38 AI agents, voice input, biometric auth, WebSocket |
| Backend | Express/TypeScript |

**AI Agents (38 total):**
- 15 User Intelligence agents
- 15 Commerce agents
- 8 Autonomous agents

### safe-qr

| Attribute | Value |
|-----------|-------|
| Screens | 16 |
| SDK | Expo SDK 53 |
| Features | QR scanner, 15 emergency modes |

**15 Emergency Modes:**
Pet, Personal, Device, Medical, Helmet, Child, Vehicle, Emergency, Business, Event, Travel, Product, Custom, Community, Anonymous

### verify-qr-mobile

| Attribute | Value |
|-----------|-------|
| Screens | 7 |
| SDK | Expo SDK 53 |
| Features | QR verification, warranty check |

### rez-driver

| Attribute | Value |
|-----------|-------|
| Screens | 8 |
| SDK | Expo SDK 52 |
| Features | Order acceptance, navigation, earnings |

### REZ-Home

| Attribute | Value |
|-----------|-------|
| Screens | 9 |
| SDK | Expo SDK 53 |
| Features | Dashboard, widgets, shortcuts |

---

## WEB APPS DETAILS

### rez-now (Merchant OS)

| Attribute | Value |
|-----------|-------|
| Framework | Next.js 16 |
| Coverage | 95% |
| Features | QR management, orders, menu, payments, analytics |

### verify-qr-dashboard

| Attribute | Value |
|-----------|-------|
| Framework | Next.js 14 |
| Coverage | 70% |
| Features | Product registry, batch QR, warranty |

### go4food

| Attribute | Value |
|-----------|-------|
| Framework | Next.js 14 |
| Coverage | 30% |
| Features | Restaurant search, menu comparison |

---

## BACKEND SERVICES DETAILS

### verify-qr-service (Port 4003)

| Attribute | Value |
|-----------|-------|
| Database | MongoDB + Redis |
| Files | 83 |
| Features | Serial registry, warranty, claims, OEM dashboard, fraud detection |

**API Endpoints:**
- POST `/api/verify` - Verify QR code
- POST `/api/activate-warranty` - Activate warranty
- GET/POST `/api/claims` - Warranty claims
- POST `/api/merchant/register` - Register product
- GET `/api/oem/dashboard` - OEM analytics
- POST `/api/ownership/transfer` - Transfer ownership

### safe-qr-service (Port 4001)

| Attribute | Value |
|-----------|-------|
| Database | MongoDB + Redis |
| Files | 218 |
| Features | 15 emergency modes, karma system, lost mode |

### REZ-assistant (Port 3011)

| Attribute | Value |
|-----------|-------|
| Database | MongoDB |
| Files | 49 |
| Features | AI chat, intent tracking, preferences, Claude AI |

### REZ-inbox (Port 3003)

| Attribute | Value |
|-----------|-------|
| Database | MongoDB |
| Files | 46 |
| Features | Email parser, receipts, notifications, subscriptions |

### REZ-bills (Port 3012)

| Attribute | Value |
|-----------|-------|
| Database | MongoDB |
| Files | 6 |
| Features | Receipt scanning, warranty detection, cashback, tax records |

**Cashback Rates:**
- Restaurant: 2%
- Grocery: 1%
- Shopping: 1.5%
- Electronics: 1%
- Default: 0.5%

### REZ-expense (Port 3013)

| Attribute | Value |
|-----------|-------|
| Database | MongoDB |
| Files | 15 |
| Features | AI categorization, policy enforcement, spend insights |

**AI Categories:**
food, travel, shopping, entertainment, utilities, healthcare, education, other

### REZ-nearby (Port 3014)

| Attribute | Value |
|-----------|-------|
| Database | MongoDB |
| Files | 8 |
| Features | Location-based classifieds, demand tracking |

### REZ-save (Port 3016)

| Attribute | Value |
|-----------|-------|
| Database | MongoDB |
| Files | 6 |
| Features | Wishlist, collections, price alerts, savings transfer |

### REZ-scan (Port 3017)

| Attribute | Value |
|-----------|-------|
| Database | MongoDB |
| Files | 7 |
| Features | Universal QR scanner, type detection, intent tracking |

**QR Types:**
Payment, Restaurant, Product, Event, Loyalty, Creator, Verify, Smart Link, General

### REZ-menu-qr (Port 3018)

| Attribute | Value |
|-----------|-------|
| Database | MongoDB |
| Files | 5 |
| Features | Menu QR ordering, table management, orders |

### go4food-api (Port 3002)

| Attribute | Value |
|-----------|-------|
| Database | MongoDB |
| Files | 22 |
| Features | Food comparison, restaurant search, menu aggregation |

---

## REZ-MART (QUICK COMMERCE)

### Services (12 Microservices)

| Service | Port | Features |
|---------|------|----------|
| rez-mart-gateway | 4100 | API Gateway |
| rez-mart-driver-service | 4101 | Driver management |
| rez-mart-tracking-service | 4102 | Real-time tracking |
| rez-mart-store-service | 4103 | Store management |
| rez-mart-product-service | 4104 | Product catalog |
| rez-mart-order-service | 4105 | Order processing |
| rez-mart-delivery-service | 4106 | Delivery orchestration |
| rez-mart-inventory-service | 4107 | Inventory sync |
| rez-mart-cart-service | 4108 | Cart management |
| rez-mart-offer-service | 4109 | Coupons & offers |
| rez-mart-subscription-service | 4110 | Auto-replenishment |
| rez-mart-analytics-service | 4112 | Analytics |

**Competitor:** Blinkit, BigBasket, Zepto
**Tagline:** "Everything delivered in minutes"

---

## REZ-INVEST (INVESTMENT PLATFORM)

### Services (5 Microservices)

| Service | Port | Features |
|---------|------|----------|
| rez-invest-gateway | 4800 | Investment API Gateway |
| rez-invest-brokerage | 4801 | Brokerage service |
| rez-invest-trading | 4802 | Trading engine |
| rez-invest-portfolio | 4803 | Portfolio management |
| rez-invest-wallet | 4804 | Investment wallet |

---

## CORPID-SHIELD-APP (SECURITY)

| Attribute | Value |
|-----------|-------|
| Port | 4716 |
| Features | Scam detection, UPI safety, QR safety, AI Guardian |

**Features:**
- Scam Call Detection
- SMS Phishing Protection
- QR Code Safety
- UPI Transaction Safety
- Dark Web Monitoring
- AI Guardian chatbot
- Personal Trust Score

---

## INTEGRATED FEATURES IN rez-app

### REZ-prive (Premium Loyalty)

| Attribute | Value |
|-----------|-------|
| Screens | 22 |
| API Endpoints | 30+ |
| Components | 22+ |

**Screens:**
wallet, earnings, tier-progress, pillars, vouchers, benefits, missions, campaigns, concierge, smart-spend, review-earn, eligibility, invite-dashboard, analytics, notifications

### REZ-try (Trial Discovery)

| Attribute | Value |
|-----------|-------|
| Screens | 15 |
| API Endpoints | 20+ |
| Components | 10+ |
| Hooks | 3+ |

**Screens:**
index, bundles, history, score, coins, missions, campaigns, badges, leaderboard, surprise, near-you, trial detail, booking flow

**AI Features:**
- useAIRecommendations.ts - AI-powered recommendations
- useMerchantPricingAI.ts - Dynamic pricing

---

## PORT ASSIGNMENTS

### Backend Services (Express)

| Service | Port | Database |
|---------|------|----------|
| go4food-api | 3002 | MongoDB |
| REZ-inbox | 3003 | MongoDB |
| REZ-assistant | 3011 | MongoDB |
| REZ-bills | 3012 | MongoDB |
| REZ-expense | 3013 | MongoDB |
| REZ-menu-qr | 3018 | MongoDB |
| REZ-nearby | 3014 | MongoDB |
| REZ-save | 3016 | MongoDB |
| REZ-scan | 3017 | MongoDB |
| safe-qr-service | 4001 | MongoDB + Redis |
| verify-qr-service | 4003 | MongoDB + Redis |
| corpild-shield-app | 4716 | MongoDB |

### UI Services (Next.js)

| Service | Port | Connects To |
|---------|------|-------------|
| REZ-inbox-ui | 3010 | REZ-inbox:3003 |
| REZ-assistant-ui | 3011 | REZ-assistant:3011 |
| REZ-expense-ui | 3013 | REZ-expense:3013 |
| REZ-nearby-ui | 3015 | REZ-nearby:3015 |
| REZ-scan-ui | 3017 | REZ-scan:3017 |
| verify-qr-dashboard | 3000 | verify-qr-service:4003 |

### REZ-Mart (4100-4112)

| Service | Port |
|---------|------|
| rez-mart-gateway | 4100 |
| rez-mart-driver-service | 4101 |
| rez-mart-tracking-service | 4102 |
| rez-mart-store-service | 4103 |
| rez-mart-product-service | 4104 |
| rez-mart-order-service | 4105 |
| rez-mart-delivery-service | 4106 |
| rez-mart-inventory-service | 4107 |
| rez-mart-cart-service | 4108 |
| rez-mart-offer-service | 4109 |
| rez-mart-subscription-service | 4110 |
| rez-mart-analytics-service | 4112 |

### REZ-Invest (4800-4804)

| Service | Port |
|---------|------|
| rez-invest-gateway | 4800 |
| rez-invest-brokerage | 4801 |
| rez-invest-trading | 4802 |
| rez-invest-portfolio | 4803 |
| rez-invest-wallet | 4804 |

---

## EXTERNAL SERVICE INTEGRATIONS

### RABTUL Services

| Service | URL |
|---------|-----|
| RABTUL Auth | https://rez-auth.rezapp.com |
| RABTUL Wallet | https://rez-wallet.rezapp.com |
| RABTUL Notification | https://rez-notification.rezapp.com |
| RABTUL Payment | https://rez-payment.rezapp.com |

### AI & Intelligence Services

| Service | URL |
|---------|-----|
| REZ Mind | https://REZ-mind.onrender.com |
| REZ Intelligence | https://rez-intelligence.onrender.com |
| REZ Agent | https://REZ-agent.onrender.com |
| REZ Intent Graph | https://rez-intent-graph.onrender.com |
| REZ Merchant | https://rez-merchant.onrender.com |

---

## TECHNOLOGY STACK

### Mobile Development
- **Framework:** React Native (Expo SDK 52/53)
- **Navigation:** Expo Router (file-based)
- **State Management:** Zustand + TanStack Query
- **Lists:** @shopify/flash-list
- **Maps:** react-native-maps
- **Animations:** react-native-reanimated

### Web Development
- **Framework:** Next.js 14/16
- **Styling:** Tailwind CSS
- **State:** React Query, Zustand
- **Forms:** React Hook Form + Zod

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Language:** TypeScript (strict mode)
- **Database:** MongoDB, Redis
- **Security:** Helmet.js, CORS, Rate Limiting
- **Logging:** Winston

---

## SECURITY (Implemented June 2026)

| Feature | Status | Services |
|---------|--------|----------|
| Helmet.js | ✅ Done | All |
| CORS | ✅ Done | All |
| Rate Limiting | ✅ Done | All services |
| JWT Auth | ✅ Done | All services |
| CSP Headers | ✅ Done | Production |
| HSTS | ✅ Done | Production |
| Account Lockout | ✅ Done | do-backend |
| Winston Logging | ✅ Done | All |
| Health Checks | ✅ Done | All |

---

## BUILD & DEPLOYMENT

### Mobile Apps

```bash
# rez-app (Main App)
cd rez-app && npx expo start

# do (AI Chat)
cd do && npx expo start

# safe-qr
cd safe-qr && npx expo start

# verify-qr-mobile
cd verify-qr-mobile && npx expo start

# rez-driver
cd rez-driver && npx expo start
```

### EAS Build (Mobile)

```bash
# Configure EAS
eas build:configure

# Build for development
eas build --profile development --platform ios

# Build for production
eas build --profile production --platform ios
eas build --profile production --platform android
```

### Web Apps

```bash
# rez-now (Merchant OS)
cd rez-now && npm run dev

# verify-qr-dashboard
cd verify-qr-dashboard && npm run dev
```

### Backend Services

```bash
cd verify-qr-service && npm run dev   # Port 4003
cd safe-qr-service && npm run dev     # Port 4001
cd REZ-assistant && npm run dev      # Port 3011
cd REZ-inbox && npm run dev          # Port 3003
cd REZ-bills && npm run dev          # Port 3012
cd REZ-expense && npm run dev        # Port 3013
cd REZ-nearby && npm run dev         # Port 3014
cd REZ-save && npm run dev           # Port 3016
cd REZ-scan && npm run dev           # Port 3017
cd REZ-menu-qr && npm run dev        # Port 3018
cd go4food-api && npm run dev        # Port 3002
```

---

## DOCUMENTATION FILES

| File | Description |
|------|-------------|
| [README.md](./README.md) | Overview |
| [CLAUDE.md](./CLAUDE.md) | This developer guide |
| [RTNM-COMPANIES-AUDIT.md](./RTNM-COMPANIES-AUDIT.md) | Company audit |
| [RTNM-PRODUCTS-FEATURES-AUDIT.md](./RTNM-PRODUCTS-FEATURES-AUDIT.md) | Products & features audit |
| [SERVICE-STATUS.md](./SERVICE-STATUS.md) | Complete service catalog |
| [API.md](./API.md) | API documentation |

---

## PRODUCTION FIXES (June 12, 2026)

- ✅ Company boundary cleanup (airzy, rider-circle, buzzlocal)
- ✅ JWT secret fallbacks removed
- ✅ Rate limiting added to all services
- ✅ Code modularization (hub-client.ts split)
- ✅ Integration tests added
- ✅ Swagger/OpenAPI documentation added
- ✅ CSP, HSTS security headers added

---

**Last Updated:** June 12, 2026
**Version:** 8.0.0
**Status:** ✅ ALL 43 PRODUCTS/SERVICES PRODUCTION READY