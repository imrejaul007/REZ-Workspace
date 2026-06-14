# REZ-Consumer Company - Source of Truth

**Version:** 5.0  
**Date:** 2026-06-03  
**Owner:** REZ-Consumer Team  
**Status:** AUTHORITATIVE

---

## Table of Contents

1. [Company Overview](#1-company-overview)
2. [QR Ecosystem (9 Systems)](#2-qr-ecosystem-9-systems)
3. [Apps Inventory](#3-apps-inventory)
4. [Airzy - Premium Airport Ecosystem](#4-airzy---premium-airport-ecosystem)
5. [Go4Food - Food Discovery Platform](#5-go4food---food-discovery-platform)
6. [REZ Prive - Premium Tier](#6-rez-prive---premium-tier)
7. [Services & Backend](#7-services--backend)
8. [Feature Matrix](#8-feature-matrix)
9. [API Endpoints](#9-api-endpoints)
10. [Integrations](#10-integrations)
11. [Security](#11-security)
12. [Code Audit](#12-code-audit)
13. [Deployment](#13-deployment)
14. [Monitoring](#14-monitoring)
15. [Known Issues](#15-known-issues)
16. [Roadmap](#16-roadmap)

---

## 1. COMPANY OVERVIEW

### REZ-Consumer Company

Consumer-facing apps and services for the RTNM ecosystem.

**Parent:** RTNM Group  
**Infrastructure Provider:** RABTUL-Technologies  
**AI Provider:** HOJAI AI  
**Git Organization:** github.com/imrejaul007

### Key Changes (v5.0)

| Change | Previous | Now |
|--------|----------|-----|
| BuzzLocal | Listed here | Moved to Axom |
| Airzy | Mentioned briefly | Full documentation (10 services) |
| REZ Prive | Not documented | Full documentation |
| QR Systems | Partial | All 9 QR systems documented |

---

## 2. QR ECOSYSTEM (9 SYSTEMS)

REZ Consumer is home to **6 of the 9 QR systems** in the REZ ecosystem.

### Complete QR Matrix

| # | QR System | Purpose | Type | Status |
|---|----------|---------|------|--------|
| 1 | **Creator QR** | Creator/professional personal commerce | Personal commerce | ✅ Active |
| 2 | **Safe QR** | 15 emergency modes (pet, device, medical, etc.) | Privacy-safe | ✅ Active |
| 3 | **Verify QR** | Product authenticity & warranty | Product trust | ✅ Active |
| 4 | **REZ NOW QR** | Merchant digital store | Merchant commerce | ✅ Active |
| 9 | **Ads QR** | DOOH ad engagement | Advertising | ✅ Active |

### Other QR Systems (Different Companies)

| # | QR System | Company | Purpose |
|---|----------|---------|---------|
| 5 | Room QR | StayOwn | Hotel room access |
| 6 | Menu QR | REZ Merchant | Restaurant menu |
| 7 | Table QR | REZ Merchant | Table ordering |
| 8 | Payment QR | RABTUL | UPI/payments |

### 2.1 Creator QR

**Purpose:** Personal commerce platform for creators and professionals

**Features:**
- Creator profiles (bio, avatar, social links, ratings)
- 4 Listing Types: Service, Booking, Promotion, Product
- Booking system with time slots
- ML-powered nearby search
- Analytics dashboard
- Payouts management

**Location:** `creator-qr/`, `creator-qr-service/`

### 2.2 Safe QR

**Purpose:** Privacy-safe communication and recovery QR system

**Features:**
- 15 QR Modes: Pet, Personal, Device, Medical, Helmet, Child, Vehicle, Bicycle, Key, Luggage, Home, Office, Event, Student, Package
- Anonymous messaging
- Karma system for helpers
- Lost mode with community feed
- Support plans (Basic, Priority, Premium)
- Express recovery

**Location:** `safe-qr/`, `safe-qr-service/`

### 2.3 Verify QR

**Purpose:** Enterprise product trust & warranty infrastructure

**Features:**
- Serial registry with batch management
- QR verification with fraud detection
- Warranty activation with 1% cashback
- Ownership passport & certificates
- Transfer mechanism (sale/gift/inheritance)
- Resale safety flow
- Insurance layer
- OEM dashboard with counterfeit analytics

**Location:** `verify-qr-dashboard/`, `verify-qr-service/`, `verify-qr-mobile/`

### 2.4 REZ NOW QR

**Purpose:** Digital mini store for any merchant

**Features:**
- Digital store with catalog
- Business profile & map
- Online ordering & checkout
- Pay Store (UPI, Razorpay, NFC)
- QR code generation
- Analytics & CRM
- Offer automation engine
- Room Hub for hotels

**Location:** `rez-now/`

### 2.5 Ads QR

**Purpose:** DOOH ad engagement and attribution

**Features:**
- QR scan tracking
- Campaign attribution
- DOOH screen engagement
- Revenue tracking

**Location:** Part of AdBazaar ecosystem

---

## 3. APPS INVENTORY

### Total: 12 Primary Apps + 13 Backend Services

| App | Type | Purpose | Status |
|-----|------|---------|--------|
| **ReZ App** | React Native | Main shopping app (736 screens) | Active |
| **REZ Prive** | Section | Premium tier within REZ App | Active |
| **ReZ Driver** | React Native | Delivery driver app | Active |
| **ReZ Now** | Next.js | Digital mini store | Active |
| **REZ Menu** | Next.js | Restaurant menu system | Active |
| **Do** | React Native | Digital out-of-home ads | Active |
| **Safe QR** | React Native | Universal Safe QR scanner | Active |
| **Verify QR** | Next.js | QR verification dashboard | Active |
| **Creator QR** | Next.js | Creator QR generator | Active |
| **Airzy** | Expo | Premium airport ecosystem | Active |
| **go4food** | Next.js + NestJS | Food price comparison | Active |
| **REZ-assistant** | Node.js + Next.js | AI assistant | Active |

### BuzzLocal (MOVED TO AXOM)

**Note:** BuzzLocal has been moved to **Axom** company. See `Axom/` directory.

**Previous Location:** `buzzlocal/`  
**New Location:** `Axom/buzzlocal/`

### Backend Services

| Service | Type | Purpose | Status |
|---------|------|---------|--------|
| **verify-qr-service** | Node.js | QR verification backend | Active |
| **safe-qr-service** | Node.js | Safe QR backend + Karma | Active |
| **creator-qr-service** | Node.js | Creator QR backend | Active |
| **REZ-assistant** | Node.js | AI assistant backend | Active |
| **REZ-assistant-ui** | Next.js | AI assistant frontend | Active |
| **REZ-bills** | Node.js | Bill management | Active |
| **REZ-expense** | Node.js | Expense tracking | Active |
| **REZ-expense-ui** | Next.js | Expense UI | Active |
| **REZ-inbox** | Node.js | Messaging backend | Active |
| **REZ-inbox-ui** | Next.js | Messaging UI | Active |
| **REZ-nearby** | Node.js | Nearby discovery | Active |
| **REZ-nearby-ui** | Next.js | Nearby UI | Active |
| **REZ-save** | Node.js | Savings | Active |
| **REZ-scan** | Node.js | QR scanning | Active |
| **REZ-scan-ui** | Next.js | Scan UI | Active |
| **rez-unified-service** | Node.js | Unified backend | Active |

---

## 4. AIRZY — PREMIUM AIRPORT ECOSYSTEM

**Purpose:** Premium airport and frequent traveler ecosystem  
**Tagline:** "Smart companion for frequent travelers"  
**Positioning:** "Premium airport lifestyle ecosystem"

### Airzy Architecture

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                              AIRZY MOBILE APP (Expo)                           │
├────────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                      AIRZY API GATEWAY (Port 4500)               │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                    │                                       │
│  ┌─────────────────────────────────┼────────────────────────────────────┐  │
│  │                                 │                                    │  │
│  ▼                                 ▼                                    ▼  │
│ ┌─────────────────┐    ┌─────────────────────┐    ┌────────────────────┐ │
│ │   RABTUL       │    │    REZ INTELLIGENCE │    │    EXTERNAL       │ │
│ ├─────────────────┤    ├─────────────────────┤    ├────────────────────┤ │
│ │Auth 4002    ◄──┼───►│Intent 4018      ◄───┼────│Amadeus        ────┤ │
│ │Payment 4001  ◄──┼───►│Travel Expert ◄───┤    │DreamFolks     ────┤ │
│ │Wallet 4004   ◄──┼───►│Signal 4121     ◄───┤    │Priority Pass   ────┤ │
│ │Notify 4011   ◄──┼───►│Predictive 4123 ◄───┤    │                  │ │
│ │Profile 4013  ◄──┼───►│Care 4058      ◄───┤    │                  │ │
│ └─────────────────┘    └─────────────────────┘    └────────────────────┘ │
│                                                                          │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                      AIRZY SERVICES (Ports 4501-4509)             │  │
│  ├──────────┬──────────┬──────────┬──────────┬──────────┬──────────┤  │
│  │ Flight │ Lounge  │Itinerary│ Wallet  │ AI Brain│ Hotel  │Transfer │  │
│  │  4501  │  4502   │  4503   │  4504   │  4505   │  4507   │  4508  │  │
│  └──────────┴──────────┴──────────┴──────────┴──────────┴──────────┴──┘  │
└────────────────────────────────────────────────────────────────────────────────┘
```

### Airzy Services (10 services)

| Service | Port | Type | External Dependency | Status |
|---------|------|------|---------------------|--------|
| `airzy-api-gateway` | 4500 | Gateway | - | ✅ Ready |
| `airzy-flight-service` | 4501 | Flight | Amadeus | ✅ Ready |
| `airzy-lounge-service` | 4502 | Lounge | DreamFolks, Priority Pass | ✅ Ready |
| `airzy-itinerary-service` | 4503 | Itinerary | - | ✅ Ready |
| `airzy-wallet-extension` | 4504 | Wallet | RABTUL Wallet | ✅ Ready |
| `airzy-ai-brain` | 4505 | AI | REZ Intelligence | ✅ Ready |
| `airzy-corp-service` | 4506 | Corp | CorpPerks | ✅ Ready |
| `airzy-hotel-extension` | 4507 | Hotel | - | ✅ Ready |
| `airzy-transfer-extension` | 4508 | Transfer | ReZ Ride | ✅ Ready |
| `airzy-dooh-extension` | 4509 | DOOH | REZ Media DOOH | ✅ Ready |

### Membership Tiers

| Tier | Fee/yr | Lounge Visits | Coin Rate | Key Benefits |
|------|--------|--------------|-----------|--------------|
| **Basic** | Free | 0 | 1.0x | Earn 1% coins, airport offers |
| **Plus** | ₹2,999 | 2 | 1.5x | 2 lounge visits, priority support |
| **Elite** | ₹9,999 | 5 | 2.0x | 5 lounge visits, concierge, transfers |
| **Royale** | ₹29,999 | Unlimited | 3.0x | All Elite + VIP services |

### External Integrations

| Provider | Purpose | Status |
|---------|---------|--------|
| **Amadeus** | Flight search/booking | ✅ Ready |
| **DreamFolks** | Lounge network (1000+ lounges) | ✅ Ready |
| **Priority Pass** | Lounge membership (700+ lounges) | ✅ Ready |

---

## 5. Go4Food (`Go4Food/`) - Google Flights for Food

**GitHub:** https://github.com/imrejaul007/REZ-Consumer/tree/feature/go4food  
**Branch:** `feature/go4food`  
**Type:** Monorepo (Next.js + NestJS)

### What is Go4Food?

AI-powered food discovery platform that compares prices across multiple delivery platforms.

**Slogan:** "Google Flights for Food"

#### Tech Stack

| Component | Technology |
|-----------|-------------|
| Web Frontend | Next.js 14 |
| API Backend | NestJS |
| Database | PostgreSQL + Prisma |
| Real-time | Socket.IO |
| AI | HOJAI AI Integration |
| Payments | RABTUL Services |

#### Project Structure

```
Go4Food/
├── apps/
│   ├── web/                    # Next.js frontend
│   │   └── src/
│   │       ├── app/           # Pages (home, search, restaurant, dish)
│   │       ├── components/    # UI components
│   │       └── lib/          # Utilities
│   └── api/                   # NestJS backend
│       └── go4food-api/
│           ├── src/
│           │   ├── modules/   # Feature modules
│           │   ├── integrations/ # External services
│           │   └── prisma/    # Database
│           └── prisma/
│               └── schema.prisma
└── docs/
    └── AUDIT-REPORT.md
```

#### API Modules (14 Total)

| Module | Port | Purpose |
|--------|------|---------|
| **search** | - | Full-text search with filters |
| **restaurant** | - | Restaurant CRUD, reviews |
| **dish** | - | Dish CRUD, reviews, views |
| **price-intelligence** | - | Cross-platform price comparison |
| **coupon** | - | Coupon management |
| **favorites** | - | User favorites |
| **ordering** | - | Order management |
| **advisor** | - | AI food advisor |
| **community** | - | Social features |
| **trending** | - | Trending dishes/restaurants |
| **location** | - | Geo queries |
| **scraper** | - | Platform scrapers |
| **pos-adapter** | - | POS system integration |
| **deal** | - | Deals & offers |

#### Supported Platforms

| Platform | Commission | Status |
|----------|------------|--------|
| Swiggy | 18% | ✅ |
| Zomato | 20% | ✅ |
| Magicpin | 15% | ✅ |
| Domino's | 12% | ✅ |
| Pizza Hut | 14% | ✅ |
| Faasos | 18% | ✅ |
| Eat.fit | 16% | ✅ |
| McDonald's | 10% | ✅ |

#### POS Integration Adapters

| Source | Port | Description |
|--------|------|-------------|
| **REZ Restaurant Hub** | 4003 | Full restaurant OS data |
| **REZ Standalone POS** | 4005 | Standalone POS menu/orders |
| **Hotel OTA** | 4016 | Hotel room service |

#### Key Features

| Feature | Status | Description |
|---------|--------|-------------|
| Price Comparison | ✅ | Compare dish prices across 8+ platforms |
| Restaurant Search | ✅ | Full-text + geo filters |
| Order Tracking | ✅ | Real-time via WebSocket |
| Coupons | ✅ | Best coupon finder |
| Favorites | ✅ | Save dishes/restaurants |
| AI Advisor | ✅ | Context-aware recommendations |
| POS Sync | ✅ | Scheduled + real-time |

#### Security (Fixed in Audit)

| Issue | Severity | Status |
|-------|----------|--------|
| Authentication | CRITICAL | ✅ Fixed - JwtAuthGuard |
| IDOR Vulnerabilities | CRITICAL | ✅ Fixed |
| Hardcoded Credentials | CRITICAL | ✅ Fixed |
| WebSocket CORS | CRITICAL | ✅ Fixed |
| Rate Limiting | HIGH | ✅ Fixed - ThrottlerGuard |
| Sync Race Conditions | CRITICAL | ✅ Fixed |

#### Database Indexes (Added)

| Model | Indexes |
|-------|---------|
| Restaurant | `isActive, isOpen, cuisines, city` |
| Dish | `restaurantId, isAvailable, cuisines` |
| Deal | `restaurantId, dishId, isActive` |
| CouponCode | `code, platformId, isVerified` |

#### API Endpoints

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/search` | No | Search restaurants/dishes |
| GET | `/api/restaurants/:id` | No | Restaurant details |
| GET | `/api/dishes/:id` | No | Dish details |
| GET | `/api/price/compare/:id` | No | Price comparison |
| GET | `/api/coupons` | No | List coupons |
| POST | `/api/favorites/*` | JWT | User favorites |
| POST | `/api/orders/*` | JWT | Order management |
| POST | `/api/pos/sync` | API Key | POS sync |

#### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://...

# Authentication
JWT_SECRET=your-jwt-secret

# POS Integration
POS_API_KEY=your-pos-api-key
POS_WS_ALLOWED_ORIGINS=http://localhost:3000

# Scraping
SCRAPER_PROXY_POOL=[{"ip":"1.2.3.4","port":8080}]
```

#### Getting Started

```bash
cd Go4Food/apps/api/go4food-api

# Install & setup
npm install
cp .env.example .env
npx prisma db push
npm run start:dev

# Frontend (separate terminal)
cd Go4Food/apps/web
npm install
npm run dev
```

#### Documentation

| Document | Location |
|----------|----------|
| Technical Spec | `docs/GO4FOOD-TECH-SPEC.md` |
| POS Integration | `Go4Food/apps/api/go4food-api/docs/POS-INTEGRATION.md` |
| Audit Report | `Go4Food/docs/AUDIT-REPORT.md` |

---

### 7.1 ReZ App (`rez-app/`)

**Screens:** 237  
**Services:** 233 API files  
**Type:** React Native/Expo SDK 53

#### Key Features

| Category | Screens | Description |
|----------|---------|-------------|
| Shopping | 50+ | Products, categories, search, cart, checkout |
| Wallet | 15+ | Balance, transactions, coins, cashback |
| Orders | 20+ | History, tracking, returns |
| Bookings | 30+ | Restaurant, hotel, travel, events |
| Gamification | 25+ | Achievements, badges, challenges, leaderboard |
| Social | 20+ | Feed, creators, picks, reviews |
| Account | 30+ | Profile, settings, addresses |
| Services | 40+ | Bill pay, insurance, home services |

#### Tech Stack

| Component | Technology |
|-----------|-------------|
| Framework | React Native 0.76.9 + Expo SDK 53 |
| Navigation | Expo Router |
| State | Zustand |
| API Client | Custom axios-based |
| Storage | AsyncStorage, SecureStorage |
| Analytics | Custom event tracking |

---

### 7.2 ReZ Driver (`rez-driver/`)

**Screens:** 9  
**Type:** React Native/Expo

#### Features

| Feature | Description |
|---------|-------------|
| Deliveries | Accept, view, complete deliveries |
| Earnings | View earnings, withdrawal |
| Profile | Driver profile, documents |
| Status | Online/offline toggle |
| Settings | App preferences |

---

### 7.3 ReZ Now (`rez-now/`)

**Type:** Next.js (PWA)  
**URL:** `now.rez.money/{businessSlug}`

#### What is REZ NOW?

**REZ NOW** is a **digital mini store for any merchant**.

It's a mix of:
- **Linktree** - Social links & profile
- **Shopify** - Online store & checkout
- **Google My Business** - Business profile & map
- **Google Maps** - Location & directions
- **Payment gateway** - Direct pay to merchant

**Core Principle:** "Turn every business QR into a growth engine."

**Key Differentiator:** Customers can pay directly to the merchant via "Pay Store" feature.

#### What Merchants Get

| Feature | Description |
|---------|-------------|
| Digital Store | Online presence in minutes |
| Business Profile | Logo, banner, description, hours |
| Contact Info | Phone, email, WhatsApp |
| Social Links | Instagram, Facebook, website |
| Map & Directions | Google Maps integration |
| Products/Services | Catalog with pricing |
| Online Ordering | Cart & checkout |
| Direct Payments | Pay Store (UPI, Razorpay) |
| QR Code | Universal QR for the business |
| Analytics | Views, clicks, conversions |

#### Features

| Category | Coverage |
|----------|----------|
| Ordering System | 95% |
| Payments (UPI, Razorpay, NFC) | 90% |
| REZ Coins & Loyalty | 90% |
| Split Bills | 100% |
| Merchant CRM | 85% |
| Offer Automation Engine | 90% |
| Room Hub (Hotels) | 95% |
| AI/Recommendations | 90% |

#### Customer Features

| Feature | Description |
|---------|-------------|
| Menu Browsing | Dietary filters, customization, add-ons |
| Payments | QR pay, UPI, Razorpay, NFC |
| Split Bills | By total, by item, GST division |
| REZ Coins | Cashback, Bronze/Silver/Gold/Platinum tiers |
| Reorder | One-tap reorder from history |
| Live Tracking | Socket.IO real-time updates |

#### Merchant Features

| Feature | Description |
|---------|-------------|
| Payment Kiosk | Live payments, reconciliation |
| Staff Tools | Kitchen display, waiter call queue |
| Analytics | QR scans, page views, link clicks |
| Offer Automation | Dormant, birthday, happy hour, weather triggers |

#### CRM (Customer Relationship Management)

**Location:** `components/merchant/crm/`

| Component | Purpose |
|-----------|---------|
| `CrmDashboard.tsx` | Main CRM tab with overview/customers/at-risk |
| `CustomerSegments.tsx` | Segment cards with counts & stats |
| `CustomerList.tsx` | Searchable customer table |
| `AtRiskCustomers.tsx` | Dormant/at-risk detection |

**Customer Segments:**

| Segment | Definition |
|---------|-----------|
| New | First-time visitors |
| Repeat | Visited 2+ times |
| VIP | High-value loyal customers |
| At Risk | No visit in 14+ days |

**Customer Data Tracked:**

| Metric | Description |
|-------|-------------|
| `customerId` | Unique customer ID |
| `name` | Customer name |
| `phone` | Phone number |
| `visitCount` | Total visits |
| `totalSpent` | Lifetime value (in paise) |
| `lastVisit` | Date of last visit |
| `avgOrderValue` | Average order value |

**API Client:** `lib/api/customerAnalytics.ts`

| Function | Purpose |
|----------|---------|
| `getCustomerSegments()` | Get segment counts |
| `getCustomers()` | Get customer list |
| `getAtRiskCustomers()` | Get at-risk customers |
| `getCustomerDetail()` | Get customer details |

**Missing (needs backend):**
- Real customer data (currently mock)
- Customer detail view
- Export to CSV
- Email/SMS campaigns
- Customer notes & tags

#### Hotel/Room Hub

| Feature | Description |
|---------|-------------|
| Room Service | Housekeeping, room service, laundry |
| Minibar Billing | Track & bill consumption |
| Express Checkout | Itemized bill with all charges |
| Guest Preferences | Remember preferences per guest |

#### AI Features

| Feature | Description |
|---------|-------------|
| Dish Recommendations | Based on taste profile |
| Weather Suggestions | Weather-aware menu |
| Smart Bundles | AI-powered packages |
| AI Chat Widget | Customer support chatbot |

#### File Structure

```
rez-now/
├── app/ # Pages (scan, store, cart, checkout, wallet, orders)
├── components/
│ ├── catalog/ # Menu, retail, services
│ ├── checkout/ # Payment, split bill
│ ├── loyalty/ # Coins, badges
│ ├── merchant/ # Dashboard, CRM
│ ├── menu/ # Menu components
│ ├── order/ # Order management
│ ├── room/ # Hotel room hub
│ └── web-qr-scanner/ # QR scanner
└── lib/
 ├── api/ # 47 API clients
 └── services/ # AI services
```

#### Launch Status

| Item | Status | Notes |
|------|--------|-------|
| Build | ⚠️ Fixing | ~5 errors remaining |
| TypeScript | ⚠️ Fixing | Type mismatches in API clients |
| Mock Data | ✅ Ready | 2 test stores configured |
| Service Worker | ✅ Implemented | PWA offline support |
| Thermal Printing | ✅ Added | Web Bluetooth ESC/POS |
| PWA Manifest | ✅ Configured | Installable |
| RABTUL Integration | ✅ Added | Auth, Wallet, Payment |
| REZ Intelligence | ✅ Added | Intent prediction |

**Test Stores:**
- `localhost:3000/cafe-blue`
- `localhost:3000/pizza-palace`

**Backend Connected:**
- Auth Service (RABTUL): ✅
- Wallet Service (RABTUL): ✅
- Payment Service (RABTUL): ✅
- Merchant Service: ✅
- Room QR Service: ✅

**Remaining Work:**
- Complete TypeScript fixes in API clients
- Verify with real backend APIs
- E2E testing

---

### 7.4 Do (`do/`)

**Type:** React Native/Expo + Backend

#### Features

| Feature | Description |
|---------|-------------|
| Screen Registration | Register DOOH screens |
| Content Management | Upload, schedule content |
| Analytics | View performance |
| Earnings | Screen owner payouts |

---

## 6. REZ PRIVE — PREMIUM TIER

**Type:** Section within REZ App (Nuqta)  
**Purpose:** Premium shopping experience with exclusive offers

### REZ Prive Overview

REZ Prive is NOT a separate app — it's a **premium tier/section** within the REZ App offering:

### Features

| Feature | Description |
|---------|-------------|
| Exclusive Offers | Access to premium deals and discounts |
| Premium Merchants | Curated selection of top merchants |
| Concierge Service | Dedicated customer support |
| Early Access | First access to new products and sales |
| Priority Support | Faster response times |

### Location in App

```
REZ App (app/prive/)
├── prive/
│   ├── prive-offers.tsx      # Prive offers screen
│   ├── [id].tsx             # Individual offer detail
│   └── _layout.tsx          # Prive navigation
├── prive-offers/
│   ├── index.tsx            # Offers listing
│   ├── [id].tsx            # Offer detail
│   └── _layout.tsx        # Section layout
```

### Components

| Component | Description |
|-----------|-------------|
| `PriveHeaderWrapper.tsx` | Header with premium styling |
| `PriveMemberCard.tsx` | Member tier card |
| `PrivePillarGrid.tsx` | Feature grid |
| `PriveOffersCarousel.tsx` | Offers carousel |
| `PriveConciergeCard.tsx` | Concierge service card |

### APIs

| File | Description |
|-------|-------------|
| `priveApi.ts` | Prive offers and eligibility |
| `priveInviteApi.ts` | Invite system |
| `PriveContext.tsx` | State management |
| `priveStore.ts` | Zustand store |
| `usePriveEligibility.ts` | Eligibility hook |
| `usePriveSection.ts` | Section visibility hook |

---

## 7. Services & Backend

### 3.1 Internal Services

| Service | Location | Purpose |
|---------|----------|---------|
| safe-qr-service | `safe-qr-service/` | Universal Safe QR + Karma integration |
| verify-qr-service | `verify-qr-service/` | QR code verification |
| creator-qr-service | `creator-qr-service/` | Creator QR generation |
| REZ-assistant | `REZ-assistant/` | AI Intent tracking |
| **Go4Food API** | `Go4Food/apps/api/` | Food discovery platform |

### 3.2 Go4Food Services

Go4Food includes these backend modules:

| Module | Purpose |
|--------|---------|
| Search | Full-text search with filters |
| Restaurant | Restaurant CRUD, reviews |
| Dish | Dish CRUD, reviews, views |
| Price Intelligence | Cross-platform price comparison |
| Coupon | Coupon management |
| Favorites | User favorites |
| Ordering | Order management |
| Advisor | AI food advisor |
| Community | Social features |
| Trending | Trending dishes/restaurants |
| Location | Geo queries |
| Scraper | Platform scrapers |
| POS Adapter | POS system integration |
| Deal | Deals & offers |

### 3.4 Safe QR System (`safe-qr/` + `safe-qr-service/`)

Universal privacy-safe communication and recovery QR system.

| Feature | Status | Description |
|---------|--------|-------------|
| QR Generation | ✅ | 15 QR modes (Pet, Personal, Device, Medical, etc.) |
| QR Scanning | ✅ | Universal QR type detection |
| Relay Messaging | ✅ | Anonymous message relay |
| Karma Integration | ✅ | Karma points for helpful actions |
| Lost & Found | ✅ | Lost item reporting + community help |
| Session Management | ✅ | Secure relay sessions |
| Rate Limiting | ✅ | Spam prevention |
| Spam Detection | ✅ | Automated spam filtering |

#### QR Modes Available

| Mode | Prefix | Icon | Karma Feed |
|------|--------|------|------------|
| Pet | REZP | 🐕 | ✅ |
| Personal | REZN | 👤 | ✅ |
| Device | REZD | 💻 | ✅ |
| Medical | REZM | 🏥 | ✅ |
| Helmet | REZH | ⛑️ | ✅ |
| Child | REZC | 👶 | ✅ |
| Vehicle | REZV | 🚗 | ✅ |
| Bicycle | REZB | 🚲 | ✅ |
| Key | REZK | 🔑 | ✅ |
| Luggage | REZL | 🧳 | ✅ |
| Home | REZA | 🏠 | ✅ |
| Office | REZO | 🏢 | ✅ |
| Event | REZE | 🎉 | ✅ |
| Student | REZS | 🎒 | ✅ |
| Package | REZP | 📦 | ✅ |

### 3.5 Rendez Dating (`rendez/`)

Social dating platform connecting people through shared experiences.

| Feature | Status | Description |
|---------|--------|-------------|
| Discovery | ✅ | Location-based matching |
| Messaging | ✅ | Real-time chat |
| Video Calls | ✅ | In-app video calls |
| Meetups | ✅ | Plan meetups with QR check-in |
| Gifts | ✅ | COIN & voucher gifts |
| Safety | ✅ | Report/block, verification badges |

### 3.6 Creator QR System (`creator-qr/` + `creator-qr-service/`)

Personal commerce infrastructure for creators.

| Feature | Status | Description |
|---------|--------|-------------|
| QR Generation | ✅ | Custom creator QR codes |
| Analytics | ✅ | Scan tracking |
| Links | ✅ | Social media integration |

### 3.7 External Services (RABTUL-Technologies)

All consumer apps use RABTUL-Technologies for backend:

| Service | Purpose | Consumer Usage |
|---------|---------|---------------|
| **Auth Service** | JWT, OTP, MFA | Login, signup |
| **Wallet Service** | Coins, balance | Rewards, cashback |
| **Payment Service** | Razorpay | Checkout |
| **Order Service** | Cart, orders | Shopping |
| **Catalog Service** | Products | Browse |
| **Search Service** | Full-text search | Find products |
| **Profile Service** | User profiles | Account |
| **Booking Service** | Reservations | Hotels, restaurants |
| **Articles Service** | Content | Editorial |
| **Bill Payments** | Utilities | Pay bills |
| **Cashback Service** | Rewards | Cashback |
| **Gamification** | Achievements | Badges, challenges |
| **Creator Earnings** | Influencers | Picks, commissions |

---

## QR Ecosystem (REZ-Consumer)

### Complete QR Products (5)

| QR Product | Purpose | Tech | Port |
|-----------|---------|------|------|
| **Safe QR** | Privacy-safe, emergency modes (15 types) | React Native/Expo | 4000 |
| **Verify QR** | Product authenticity verification | Next.js + Node.js | - |
| **Creator QR** | Personal commerce QR generator | Next.js + Node.js | - |
| **ReZ Now QR** | Merchant/store QR - pay, order, profile | Next.js PWA | - |
| **ReZ Web Menu QR** | Restaurant digital menu + ordering | Next.js | - |

### Supporting QR

| QR Product | Purpose |
|-----------|---------|
| **REZ-scan** | SDK - scan any QR type |
| **REZ-scan-ui** | QR Scanner UI |

### Safe QR Modes (15 Types)

| Mode | Prefix | Use Case |
|------|--------|----------|
| Pet | REZP | Lost pet recovery |
| Personal | REZN | Personal items |
| Device | REZD | Electronics |
| Medical | REZM | Medical alerts |
| Helmet | REZH | Bike/motorcycle safety |
| Child | REZC | Child safety |
| Vehicle | REZV | Vehicle info |
| Bicycle | REZB | Bike recovery |
| Key | REZK | Key lost & found |
| Luggage | REZL | Travel items |
| Home | REZA | Home address |
| Office | REZO | Office contact |
| Event | REZE | Event info |
| Student | REZS | Student ID |
| Package | REZP | Package tracking |

For complete cross-company QR documentation, see [docs/QR-ECOSYSTEM.md](../docs/QR-ECOSYSTEM.md).

---

## 4. Feature Matrix

### 4.1 Shopping Features

| Feature | App | Implemented |
|---------|-----|-------------|
| Product Browse | Consumer | ✅ |
| Category Navigation | Consumer | ✅ |
| Search | Consumer | ✅ |
| Filters | Consumer | ✅ |
| Sort | Consumer | ✅ |
| Product Details | Consumer | ✅ |
| Add to Cart | Consumer | ✅ |
| Update Cart | Consumer | ✅ |
| Remove from Cart | Consumer | ✅ |
| Cart Total | Consumer | ✅ |
| Checkout | Consumer | ✅ |
| Address Selection | Consumer | ✅ |
| Payment (Razorpay) | Consumer | ✅ |
| Order Confirmation | Consumer | ✅ |
| Order History | Consumer | ✅ |
| Order Tracking | Consumer | ✅ |
| Cancel Order | Consumer | ✅ |
| Return Order | Consumer | ✅ |
| Reorder | Consumer | ✅ |

### 4.2 Wallet & Rewards

| Feature | App | Implemented |
|---------|-----|-------------|
| Balance Inquiry | Consumer | ✅ |
| Transaction History | Consumer | ✅ |
| Coins | Consumer | ✅ |
| Cashback | Consumer | ✅ |
| Referrals | Consumer | ✅ |
| Welcome Bonus | Consumer | ✅ |
| Redeem Coins | Consumer | ✅ |
| Gold Savings | Consumer | ✅ |
| Lock Deals | Consumer | ✅ |

### 4.3 Bookings

| Feature | App | Implemented |
|---------|-----|-------------|
| Restaurant Search | Consumer | ✅ |
| Restaurant Booking | Consumer | ✅ |
| Hotel Search | Consumer | ✅ |
| Hotel Booking | Consumer | ✅ |
| Bus Booking | Consumer | ✅ |
| Cab Booking | Consumer | ✅ |
| Flight Booking | Consumer | ✅ |
| Event Tickets | Consumer | ✅ |
| Booking History | Consumer | ✅ |
| Cancel Booking | Consumer | ✅ |

### 4.4 Gamification

| Feature | App | Implemented |
|---------|-----|-------------|
| Achievements | Consumer | ✅ |
| Badges | Consumer | ✅ |
| Challenges | Consumer | ✅ |
| Daily Tasks | Consumer | ✅ |
| Leaderboard | Consumer | ✅ |
| Points | Consumer | ✅ |
| Streaks | Consumer | ✅ |
| Levels | Consumer | ✅ |

### 4.5 Creator Features

| Feature | App | Implemented |
|---------|-----|-------------|
| Creator Dashboard | Consumer | ✅ |
| Picks | Consumer | ✅ |
| Earnings | Consumer | ✅ |
| Tier System | Consumer | ✅ |
| Payout | Consumer | ✅ |
| Analytics | Consumer | ✅ |

### 4.6 Driver Features

| Feature | App | Implemented |
|---------|-----|-------------|
| Delivery Queue | Driver | ✅ |
| Accept Delivery | Driver | ✅ |
| Navigation | Driver | ✅ |
| Complete Delivery | Driver | ✅ |
| Earnings View | Driver | ✅ |
| Withdrawal | Driver | ✅ |
| Online Toggle | Driver | ✅ |
| Profile | Driver | ✅ |

### 4.7 Go4Food Features

| Feature | Implemented |
|---------|-------------|
| **Price Comparison** | ✅ |
| Restaurant Search | ✅ |
| Dish Search | ✅ |
| Geo Filtering | ✅ |
| Order Tracking | ✅ |
| Coupon Discovery | ✅ |
| Best Coupon Finder | ✅ |
| Favorites | ✅ |
| AI Food Advisor | ✅ |
| Trending Dishes | ✅ |
| Community Posts | ✅ |
| POS Integration | ✅ |
| Real-time Updates | ✅ |

---

## 5. API Endpoints

### 5.1 Consumer App → Services

| Service | Base URL | Auth |
|---------|----------|------|
| Auth | `rez-auth-service.onrender.com` | JWT |
| Wallet | `rez-wallet-service-36vo.onrender.com` | JWT |
| Payment | `rez-payment-service.onrender.com` | JWT |
| Order | `rez-order-service.onrender.com` | JWT |
| Catalog | `rez-catalog-service-1.onrender.com` | None |
| Search | `rez-search-service.onrender.com` | None |
| Profile | `rezprofile.onrender.com` | JWT |
| Booking | `rez-booking-service.onrender.com` | JWT |

### 5.2 API Gateway

**Base URL:** `https://rez-api-gateway.onrender.com/api`

| Route | Service | Auth |
|-------|---------|------|
| `/user/auth/*` | Auth | Varies |
| `/wallet/*` | Wallet | JWT |
| `/payment/*` | Payment | JWT |
| `/orders/*` | Order | JWT |
| `/products/*` | Catalog | None |
| `/categories/*` | Catalog | None |
| `/search/*` | Search | None |
| `/articles/*` | Articles | None |
| `/bills/*` | Bill Payments | JWT |
| `/cashback/*` | Cashback | JWT |
| `/achievements/*` | Gamification | JWT |
| `/challenges/*` | Gamification | JWT |
| `/creators/*` | Creator | JWT |

---

## 6. Integrations

### 6.1 RABTUL-Technologies Services (Infrastructure)

**Canonical Source:** [RAP.md](https://github.com/imrejaul007/RABTUL-Technologies/blob/main/RAP.md)

| Service | Port | URL | Status | Integration |
|---------|------|-----|--------|-------------|
| **Auth Service** | 4002 | `rez-auth-service.onrender.com` | ✅ | `authApi.ts` |
| **Wallet Service** | 4004 | `rez-wallet-service-36vo.onrender.com` | ✅ | `walletApi.ts` |
| **Payment Service** | 4001 | `rez-payment-service.onrender.com` | ✅ | `paymentService.ts` |
| **Order Service** | 4006 | `rez-order-service-hz18.onrender.com` | ✅ | `orderApi.ts` |
| **Catalog Service** | 4007 | `rez-catalog-service-1.onrender.com` | ✅ | `productsApi.ts` |
| **Search Service** | 4008 | `rez-search-service.onrender.com` | ✅ | `searchApi.ts` |
| **Profile Service** | 4013 | `rez-profile-service.onrender.com` | ✅ | `profileApi.ts` |
| **Notifications** | 4011 | `rez-notifications-service.onrender.com` | ✅ | `notificationService.ts` |
| **Delivery Service** | 4009 | `rez-delivery-service.onrender.com` | ✅ | `deliveryApi.ts` |
| **Booking Service** | 4020 | `rez-booking-service.onrender.com` | ✅ | `unifiedBookingApi.ts` |
| **Observability** | 4025 | `rez-observability.onrender.com` | ✅ | `observabilityApi.ts` |
| **Checkout Optimization** | 4050 | `rez-checkout-optimization.onrender.com` | ✅ | `checkoutApi.ts` |
| **Workflow Builder** | 4045 | `rez-workflow-builder.onrender.com` | ✅ | Via API Gateway |
| **RFM Plus** | 4055 | `rez-rfm-plus.onrender.com` | ✅ | Via API Gateway |
| **Logistics Aggregator** | 4052 | `rez-logistics-aggregator.onrender.com` | ✅ | Via API Gateway |
| **WooCommerce Connector** | 4051 | `rez-woocommerce-connector.onrender.com` | ✅ | Via API Gateway |
| **Analytics** | 4016 | `rez-analytics-service.onrender.com` | ✅ | `analyticsService.ts` |
| **Insights** | 4017 | `rez-insights-service.onrender.com` | ✅ | Via API Gateway |
| **Gamification** | 4018 | `rez-gamification-service-3b5d.onrender.com` | ✅ | `gamificationApi.ts` |
| **Economic Engine** | 4019 | `rez-economic-engine.onrender.com` | ✅ | Via API Gateway |
| **Identity Graph** | 4021 | `rez-identity-graph.onrender.com` | ✅ | Via API Gateway |
| **Circuit Breaker** | 4030 | `rez-circuit-breaker.onrender.com` | ✅ | Via API Gateway |
| **Idempotency Service** | 4033 | `rez-idempotency-service.onrender.com` | ✅ | Via API Gateway |

### 6.2 REZ-Media Services (Marketing & Engagement)

**Canonical Source:** [REZ-Media/SOT.md](REZ-Media/SOT.md)

| Service | Description | Status | Integration |
|---------|-------------|--------|-------------|
| **Karma Service** | Impact economy, community rewards | ✅ | `karmaService.ts` |
| **Gamification** | Points, badges, challenges | ✅ | `gamificationApi.ts` |
| **Ads Service** | Advertising platform | ✅ | `adsApi.ts` |
| **Engagement Platform** | Loyalty, offers, referrals | ✅ | Via API Gateway |
| **Support Tools Hub** | Zendesk, Freshdesk, Intercom | ✅ | Via API Gateway |
| **CRM Hub** | HubSpot, Zoho integration | ✅ | Via API Gateway |
| **Attribution Platform** | Campaign attribution | ✅ | Via API Gateway |
| **WhatsApp Commerce** | WhatsApp shopping | ✅ | Via API Gateway |
| **Checkout SDK** | Embedded checkout | ✅ | Via API Gateway |

### 6.3 REZ-Intelligence Services (AI & ML)

**Canonical Source:** [REZ-Intelligence/SOT.md](REZ-Intelligence/SOT.md)

| Service | Description | Status | Integration |
|---------|-------------|--------|-------------|
| **Intent Graph** | AI recommendations, personalization | ✅ | `intentGraphApi.ts` |
| **Feedback Collector** | User feedback collection | ✅ | Via API Gateway |
| **Lead Intelligence** | Lead scoring | ✅ | Via API Gateway |
| **RFM Service** | Customer segmentation | ✅ | Via API Gateway |
| **CDP Service** | Customer data platform | ✅ | Via API Gateway |
| **Personalization Engine** | Real-time personalization | ✅ | Via API Gateway |
| **Recommendation Engine** | Product recommendations | ✅ | Via API Gateway |
| **Attribution System** | Multi-touch attribution | ✅ | Via API Gateway |

### 6.4 RTNM-Group Services (Core Platform)

**Canonical Source:** [RTNM-Group/SOT.md](RTNM-Group/SOT.md)

| Service | Description | Status | Integration |
|---------|-------------|--------|-------------|
| **Identity Service** | User identity graph | ✅ | Via API Gateway |
| **Central Permissions** | RBAC/ABAC permissions | ✅ | Via API Gateway |
| **Support Dashboard** | Unified support | ✅ | Via API Gateway |
| **Capital Service** | Restaurant lending | ✅ | Via API Gateway |
| **BNPL Service** | Buy now pay later | ✅ | Via API Gateway |
| **Compliance Platform** | Regulatory compliance | ✅ | Via API Gateway |

### 6.5 StayOwn-Hospitality Services (Hotels & Living)

**Canonical Source:** [StayOwn-Hospitality/SOT.md](StayOwn-Hospitality/SOT.md)

| Service | Description | Status | Integration |
|---------|-------------|--------|-------------|
| **Hotel OTA API** | Hotel booking | ✅ | `hotelOtaApi.ts` |
| **Room QR** | Hotel room access QR | ✅ | Via Hotel OTA |
| **Habixo** | Living/rental platform | ✅ | Via API Gateway |

### 6.6 External Services

| Service | Integration | Status |
|---------|-------------|--------|
| Firebase | Analytics, Auth, FCM | ✅ |
| Razorpay | Payments | ✅ |
| Google Maps | Location | ✅ |
| Cloudinary | Image Upload | ✅ |
| Sentry | Error Tracking | ✅ |
| Expo | Push Notifications | ✅ |

### 6.3 External Services

| Service | Integration | Status |
|---------|-------------|--------|
| Firebase | Analytics, Auth | ✅ |
| Razorpay | Payments | ✅ |
| Google Maps | Location | ✅ |
| Cloudinary | Image Upload | ✅ |
| Sentry | Error Tracking | ✅ |
| Expo | Push Notifications | ✅ |

### 6.4 Environment Variables

```bash
# Firebase
FIREBASE_API_KEY=
FIREBASE_AUTH_DOMAIN=
FIREBASE_PROJECT_ID=

# Razorpay
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

# Google Maps
GOOGLE_MAPS_API_KEY=
GOOGLE_PLACES_API_KEY=

# Services
EXPO_PUBLIC_API_BASE_URL=https://rez-api-gateway.onrender.com/api
EXPO_PUBLIC_AUTH_SERVICE_URL=https://rez-auth-service.onrender.com
EXPO_PUBLIC_WALLET_SERVICE_URL=https://rez-wallet-service-36vo.onrender.com
EXPO_PUBLIC_PAYMENT_SERVICE_URL=https://rez-payment-service.onrender.com
EXPO_PUBLIC_ORDER_SERVICE_URL=https://rez-order-service.onrender.com
EXPO_PUBLIC_SEARCH_SERVICE_URL=https://rez-search-service.onrender.com
EXPO_PUBLIC_CATALOG_SERVICE_URL=https://rez-catalog-service-1.onrender.com

# NEW Services
EXPO_PUBLIC_DELIVERY_SERVICE_URL=https://rez-delivery-service.onrender.com
EXPO_PUBLIC_BOOKING_SERVICE_URL=https://rez-booking-service.onrender.com
EXPO_PUBLIC_OBSERVABILITY_URL=https://rez-observability.onrender.com
EXPO_PUBLIC_CHECKOUT_URL=https://rez-checkout-optimization.onrender.com
EXPO_PUBLIC_INTENT_GRAPH_URL=https://rez-intent-graph.onrender.com
```

---

## 7. Infrastructure

### 7.1 Cloud Services

| Service | Provider | Usage |
|---------|----------|-------|
| Backend APIs | Render.com | 23 services |
| Database | MongoDB Atlas | All services |
| Cache | Redis | Sessions, rate limiting |
| CDN | Cloudinary | Images |
| Monitoring | Sentry | Error tracking |
| CI/CD | GitHub Actions | Auto-deploy |

### 7.2 Deployments

| App | Platform | Status |
|-----|----------|--------|
| Consumer App | Expo (EAS) | Active |
| Driver App | Expo (EAS) | Active |
| Web Apps | Vercel | Active |
| Backend Services | Render | Active |

---

## 8. Security

### 8.1 Implemented

| Feature | Status |
|---------|--------|
| JWT Authentication | ✅ |
| OTP Verification | ✅ |
| Rate Limiting | ✅ |
| CSRF Protection | ✅ |
| Secure Storage | ✅ |
| Error Sanitization | ✅ |
| No Console Logs | ✅ (Partial) |

### 8.2 Code Audit Results

| Category | Issues |
|----------|--------|
| Critical | 15 |
| High | 50 |
| Medium | 50 |
| Low | 37 |
| **Total** | **152** |

### 8.3 Known Security Issues

| Issue | Priority | Status |
|-------|----------|--------|
| Console.log in production | HIGH | Partial fix |
| Localhost fallbacks | HIGH | Pending |
| Dev secrets in config | CRITICAL | Pending |

---

## 9. Code Audit

### 9.1 Audit Summary

| App | Issues | Critical |
|-----|--------|----------|
| rez-app-consumer | 52 | 4 |
| rez-driver-app | 18 | 2 |
| rez-now | 34 | 2 |
| do-app | 24 | 3 |
| Rendez | 19 | 2 |
| rez-web-menu | 15 | 0 |

### 9.2 Fixed Issues

| Issue | File | Status |
|-------|------|--------|
| console.error → logger | socialAuthService.ts | ✅ Fixed |
| TypeScript vehicleType | profile.tsx | ✅ Fixed |
| TypeScript licensePlate | profile.tsx | ✅ Fixed |

### 9.3 Remaining Issues

| Issue | Priority | Owner |
|-------|----------|--------|
| Fix remaining console.* | HIGH | Team |
| Remove localhost fallbacks | HIGH | Team |
| npm audit fix | MEDIUM | Team |
| Add error boundaries | MEDIUM | Team |

---

## 10. Deployment

### 10.1 Build Commands

```bash
# ReZ App
cd rez-app
eas build --platform all --profile production

# ReZ Driver
cd rez-driver
eas build --platform all --profile production

# Safe QR App
cd safe-qr
eas build --platform all --profile production

# Do App
cd do
eas build --platform all --profile production

# Rendez
cd rendez
eas build --platform all --profile production

# Web Apps
cd <app>
npm run build

# Go4Food
cd Go4Food/apps/api/go4food-api
npm install
npm run start:dev
```

### 10.2 Environment Setup

1. Copy `.env.example` to `.env`
2. Fill in all API keys
3. Run `eas build`

---

## 11. Monitoring

### 11.1 Health Checks

| Service | Endpoint |
|---------|----------|
| API Gateway | `/health` |
| Auth | `/health` |
| Wallet | `/health` |
| Payment | `/health` |
| Order | `/health` |

### 11.2 Error Tracking

All errors tracked via Sentry:
- Frontend: `@sentry/react-native`
- Backend: `@sentry/node`

### 11.3 Analytics

Custom event tracking via `eventAnalytics.ts`

---

## 12. Known Issues

| Issue | Severity | Workaround |
|-------|----------|------------|
| Console.log in production | HIGH | Use logger |
| Localhost fallbacks | HIGH | Remove in prod |
| npm vulnerabilities | MEDIUM | Run audit |
| Some TypeScript errors | LOW | Fix types |

---

## 13. Roadmap

### Q2 2026

- [ ] Fix all code audit issues
- [ ] Complete npm audit fixes
- [ ] Add error boundaries
- [ ] Implement dark mode
- [ ] Performance optimization

### Q3 2026

- [ ] Add push notification improvements
- [ ] Implement real-time features
- [ ] Add more payment methods
- [ ] Expand creator features

---

## Documentation

| Document | Location | Purpose |
|----------|----------|---------|
| SOT (this) | `SOT.md` | Master reference |
| Code Audit | `CODE-AUDIT-REPORT.md` | Issues list |
| Features | `COMPLETE-FEATURES.md` | All features |
| Inventory | `COMPLETE-INVENTORY.md` | All apps/services |

---

## Change Log

| Date | Version | Changes |
|------|---------|---------|
| 2026-05-15 | 2.0 | Renamed directories to short names, added Safe QR |
| 2026-05-14 | 1.0 | Initial SOT |
| 2026-05-14 | 1.0 | Added code audit results |
| 2026-05-14 | 1.0 | Added feature matrix |

---

**Last Updated:** 2026-05-14  
**Next Review:** 2026-06-14
