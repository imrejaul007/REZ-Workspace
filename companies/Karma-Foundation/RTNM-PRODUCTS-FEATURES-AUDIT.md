# RTNM Products & Features Audit - Karma Foundation

**Company:** Karma Foundation  
**Audit Date:** June 12, 2026  
**Auditor:** Claude Code  
**Status:** ✅ Production Ready

---

## 📋 Table of Contents

1. [Products Overview](#1-products-overview)
2. [Product 1: karma-service](#2-product-1-karma-service)
3. [Product 2: karma-loyalty-bridge](#3-product-2-karma-loyalty-bridge)
4. [Product 3: karma-web](#4-product-3-karma-web)
5. [Product 4: karma-mobile](#5-product-4-karma-mobile)
6. [Feature Matrix](#6-feature-matrix)
7. [Social Programs (13.1)](#7-social-programs-131)
8. [Karma Systems (13.2)](#8-karma-systems-132)
9. [API Endpoints Catalog](#9-api-endpoints-catalog)
10. [Tech Stack](#10-tech-stack)
11. [Dependencies](#11-dependencies)
12. [Roadmap](#12-roadmap)

---

## 1. Products Overview

Karma Foundation consists of 4 products in a microservices architecture:

| # | Product | Type | Port | Tech Stack | Status |
|---|---------|------|------|------------|--------|
| 1 | karma-service | Backend API | 3009 | Node.js, Express, TypeScript, MongoDB, Redis | ✅ |
| 2 | karma-loyalty-bridge | Microservice | 4098 | Node.js, Express, TypeScript, MongoDB | ✅ |
| 3 | karma-web | Web App | 3000 | Next.js 14, React, TailwindCSS | ✅ |
| 4 | karma-mobile | Mobile App | Expo | React Native, Expo, TypeScript | ✅ |

### Architecture

```
Consumer Apps (Web + Mobile)
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                    karma-service (3009)                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ Karma    │ │ Verify   │ │ Batch    │ │ Leader-  │      │
│  │ Engine   │ │ Engine   │ │ Service  │ │ board    │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ Community│ │ Mission  │ │ CSR      │ │ Badge    │      │
│  │ Service  │ │ Engine   │ │ Service  │ │ Service  │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│               karma-loyalty-bridge (4098)                   │
│              Karma → REZ Coins Conversion                   │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                    External Services                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐            │
│  │ MongoDB │ │  Redis  │ │ RABTUL  │ │  REZ    │            │
│  │         │ │         │ │  Auth   │ │Intelligence│         │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘            │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Product 1: karma-service

**Purpose:** Backend API for social impact and NGO ecosystem  
**Port:** 3009  
**Repository:** `karma-service/`

### Service Components

| Component | Purpose | Status |
|-----------|---------|--------|
| **Karma Engine** | Core karma calculation logic | ✅ |
| **Verification Engine** | QR/GPS check-in/out | ✅ |
| **Batch Service** | Weekly coin conversion | ✅ |
| **Leaderboard Service** | Rankings and scores | ✅ |
| **Community Service** | Cause communities | ✅ |
| **CSR Service** | Corporate partnerships | ✅ |
| **Mission Engine** | Daily/weekly challenges | ✅ |
| **Badge Service** | Achievement system | ✅ |

### Database Models

| Model | Collection | Purpose |
|-------|-----------|---------|
| KarmaProfile | karma_profiles | User level, trust score, karma |
| EarnRecord | earn_records | Per-event karma with verification |
| Batch | batches | Weekly conversion batches |
| KarmaEvent | karma_events | Event configuration |
| CSRPool | csr_pools | Corporate CSR coin pool |
| CauseCommunity | cause_communities | Cause communities |
| CommunityPost | community_posts | Community posts |
| Badge | badges | Achievement badges |
| MicroAction | micro_actions | Daily quick actions |
| Mission | missions | Daily/weekly challenges |
| UserDevice | user_devices | FCM tokens for push |
| Notification | notifications | Push notifications |

### Background Workers

| Worker | Purpose | Schedule |
|--------|---------|----------|
| decayWorker | Karma decay calculation | Daily |
| scoreRankWorker | Update leaderboard ranks | Every hour |
| batchScheduler | Weekly batch creation | Sunday 11:59 PM |
| autoCheckoutWorker | Auto check-out stale events | Every 15 min |

---

## 3. Product 2: karma-loyalty-bridge

**Purpose:** Karma → REZ Coins conversion service  
**Port:** 4098  
**Repository:** `karma-loyalty-bridge/`

### Service Components

| Component | Purpose | Status |
|-----------|---------|--------|
| **Conversion Engine** | Karma → REZ conversion | ✅ |
| **Tier Management** | Bronze/Silver/Gold/Platinum | ✅ |
| **Rate Calculator** | Dynamic rate calculation | ✅ |
| **Idempotency Handler** | Duplicate prevention | ✅ |

### Conversion Rates

#### Base Rates by Action

| Action | Base Rate | Description |
|--------|-----------|-------------|
| Check-in | 10% | Event check-in |
| Donation | 15% | Donation activities |
| Share | 5% | Social sharing |
| Review | 10% | Event reviews |
| Mission | 20% | Mission completion |
| Streak | 25% | Consecutive participation |

#### Tier Multipliers

| Tier | Multiplier | Karma Score Threshold |
|------|-----------|----------------------|
| Bronze | 1.0x | 0 |
| Silver | 1.25x | 450 |
| Gold | 1.5x | 600 |
| Platinum | 2.0x | 750 |

---

## 4. Product 3: karma-web

**Purpose:** Consumer web application (Next.js)  
**Framework:** Next.js 14 (App Router)  
**Repository:** `karma-web/`

### Consumer Pages

| Page | Route | Purpose | Status |
|------|-------|---------|--------|
| Home | `/karma/home` | Dashboard with karma overview | ✅ |
| My Karma | `/karma/my-karma` | Passport & earn history | ✅ |
| Explore | `/karma/explore` | Event discovery | ✅ |
| Event Detail | `/karma/event/[id]` | Event information | ✅ |
| Missions | `/karma/missions` | Available missions | ✅ |
| Micro Actions | `/karma/micro-actions` | Daily quick actions | ✅ |
| Leaderboard | `/karma/leaderboard` | Rankings | ✅ |
| Wallet | `/karma/wallet` | Karma coins | ✅ |
| Communities | `/karma/communities` | Cause communities | ✅ |
| Community Detail | `/karma/communities/[slug]` | Community feed | ✅ |

### Corporate Pages

| Page | Route | Purpose | Status |
|------|-------|---------|--------|
| Corporate | `/karma/corporate` | CSR overview | ✅ |
| Benefits | `/karma/corp/benefits` | Employee benefits | ✅ |
| Gifts | `/karma/corp/gifts` | Corporate gifts | ✅ |
| Hotels | `/karma/corp/hotels` | Partner hotels | ✅ |
| Wallet | `/karma/corp/wallet` | Corporate wallet | ✅ |

### Utility Pages

| Page | Route | Purpose | Status |
|------|-------|---------|--------|
| Lost Items | `/karma/lost-items` | Lost & found | ✅ |

---

## 5. Product 4: karma-mobile

**Purpose:** Mobile app for on-the-go karma tracking  
**Framework:** Expo (React Native)  
**Repository:** `karma-mobile/`

### Consumer Screens

| Screen | Route | Purpose | Status |
|--------|-------|---------|--------|
| Login | `/login` | Authentication | ✅ |
| Home | `/karma/home` | Main hub | ✅ |
| My Karma | `/karma/my-karma` | Passport & history | ✅ |
| Explore | `/karma/explore` | Event listing | ✅ |
| Event Detail | `/karma/event/[id]` | Event info | ✅ |
| Missions | `/karma/missions` | Challenges | ✅ |
| Micro Actions | `/karma/micro-actions` | Quick actions | ✅ |
| Leaderboard | `/karma/leaderboard` | Rankings | ✅ |
| Wallet | `/karma/wallet` | Balance | ✅ |
| QR Scan | `/karma/scan` | Scanner | ✅ |
| Communities | `/karma/communities` | List | ✅ |
| Community Detail | `/karma/communities/[slug]` | Detail | ✅ |

### Admin Screens

| Screen | Route | Purpose | Status |
|--------|-------|---------|--------|
| Dashboard | `/admin` | Admin hub | ✅ |
| Karma Score | `/admin/karma-score` | Score admin | ✅ |
| Perks | `/admin/perks` | Perk management | ✅ |

---

## 6. Feature Matrix

| Feature | Priority | Backend | Web | Mobile | Status |
|---------|----------|---------|-----|--------|--------|
| Karma points | P0 | ✅ | ✅ | ✅ | ✅ |
| QR verification | P0 | ✅ | ✅ | ✅ | ✅ |
| GPS verification | P0 | ✅ | ✅ | ✅ | ✅ |
| Level system | P0 | ✅ | ✅ | ✅ | ✅ |
| Batch conversion | P0 | ✅ | ✅ | ✅ | ✅ |
| Leaderboard | P1 | ✅ | ✅ | ✅ | ✅ |
| Communities | P1 | ✅ | ✅ | ✅ | ✅ |
| Missions | P1 | ✅ | ✅ | ✅ | ✅ |
| Impact resume | P1 | ✅ | ✅ | - | ✅ |
| Micro-actions | P2 | ✅ | ✅ | ✅ | ✅ |
| CSR dashboard | P2 | ✅ | ✅ | - | ✅ |
| Streaks | P2 | ✅ | ✅ | ✅ | ✅ |
| Badges | P2 | ✅ | ✅ | ✅ | ✅ |
| AI recommendations | P2 | ⚠️ | - | - | ⚠️ |
| Blockchain verification | P3 | - | - | - | 📋 |
| NFT badges | P3 | - | - | - | 📋 |
| Social graph | P2 | - | - | - | 📋 |
| Corporate matching | P2 | - | - | - | 📋 |

### Priority Legend
- **P0:** Critical - Must have
- **P1:** High - Important
- **P2:** Medium - Nice to have
- **P3:** Low - Future consideration

---

## 7. Social Programs (13.1)

### Core Programs (32 Programs)

| # | Program | Category | Karma Multiplier | Description |
|---|---------|----------|-----------------|-------------|
| 1 | School Support | Education | 1.5x | Tutoring, mentoring, school supplies |
| 2 | Scholarships | Education | 2.0x | Financial support for students |
| 3 | Skill Development | Education | 1.5x | Vocational training |
| 4 | Digital Literacy | Education | 1.5x | Tech education for underserved |
| 5 | Medical Camps | Healthcare | 1.5x | Free health checkups |
| 6 | Blood Donation | Healthcare | 2.0x | Blood donation drives |
| 7 | Health Awareness | Healthcare | 1.0x | Education campaigns |
| 8 | Mental Health | Healthcare | 1.5x | Support programs |
| 9 | Tree Planting | Environment | 2.0x | Reforestation drives |
| 10 | Beach Cleanup | Environment | 1.5x | Coastal cleaning |
| 11 | Waste Management | Environment | 1.5x | Segregation awareness |
| 12 | Renewable Energy | Environment | 1.5x | Solar/wind advocacy |
| 13 | Senior Care | Community Welfare | 1.5x | Elder support programs |
| 14 | Animal Welfare | Community Welfare | 1.5x | Stray animal care |
| 15 | Housing Support | Community Welfare | 2.0x | Home repairs for needy |
| 16 | Refugee Support | Community Welfare | 2.0x | Displaced person aid |
| 17 | Emergency Response | Disaster Relief | 2.5x | First responder support |
| 18 | Relief Distribution | Disaster Relief | 1.5x | Essential supplies |
| 19 | Rehabilitation | Disaster Relief | 1.5x | Long-term recovery |
| 20 | Preparedness | Disaster Relief | 1.5x | Disaster training |
| 21 | Skills Training | Women Empowerment | 1.5x | Vocational programs |
| 22 | Safety Programs | Women Empowerment | 1.5x | Self-defense, awareness |
| 23 | Entrepreneurship | Women Empowerment | 1.5x | Women-owned businesses |
| 24 | Education Support | Women Empowerment | 2.0x | Girls' education |
| 25 | Meal Programs | Food Donation | 1.5x | Serving meals |
| 26 | Food Drives | Food Donation | 1.5x | Collection events |
| 27 | Surplus Recovery | Food Donation | 1.5x | Restaurant partnerships |
| 28 | Community Kitchens | Food Donation | 2.0x | Feeding programs |
| 29 | Zero Waste | Sustainability | 1.5x | Waste reduction |
| 30 | Water Conservation | Sustainability | 1.5x | Rainwater harvesting |
| 31 | Sustainable Transport | Sustainability | 1.5x | Cycling campaigns |
| 32 | Eco Products | Sustainability | 1.0x | Sustainable alternatives |

---

## 8. Karma Systems (13.2)

### Karma Points Metrics

| Metric | Value | Description |
|--------|-------|-------------|
| **Base Unit** | Karma Point (KP) | Standard unit of impact |
| **Max Per Event** | Configurable | Set per event type |
| **Weekly Cap** | 300 Karma | Maximum earnable per week |
| **Decay Rate (30d)** | 20% | Inactive for 30 days |
| **Decay Rate (45d)** | 40% | Inactive for 45 days |
| **Decay Rate (60d)** | 70% | Inactive for 60 days |

### Earning Actions

| Action | Base Karma | Bonus | Total | Status |
|--------|-----------|-------|-------|--------|
| Event participation | 10 KP/hour | Program multiplier | 15-25 KP | ✅ |
| Check-in verification | +5 KP | QR bonus | 10 KP | ✅ |
| Check-out verification | +5 KP | GPS bonus | 10 KP | ✅ |
| NGO approval | +10 KP | Trust bonus | 15 KP | ✅ |
| Review posted | +5 KP | - | 5 KP | ✅ |
| Referral credited | +50 KP | - | 50 KP | ✅ |

### Level System

| Level | Name | Active Karma | Conversion Rate | Weekly Cap |
|-------|------|-------------|-----------------|------------|
| L1 | Seed | 0-499 | 25% | 75 coins |
| L2 | Sprout | 500-1999 | 50% | 150 coins |
| L3 | Bloom | 2000-4999 | 75% | 225 coins |
| L4 | Tree | 5000+ | 100% | 300 coins |

### Trust Grades

| Grade | Score | Badge | Trust Score Weight |
|-------|-------|-------|-------------------|
| S | 90-100 | Platinum Trust | 30% |
| A | 80-89 | Gold Trust | 25% |
| B | 60-79 | Silver Trust | 20% |
| C | 40-59 | Bronze Trust | 15% |
| D | 0-39 | Pending | 10% |

### Trust Score Components

| Component | Weight | Description |
|-----------|--------|-------------|
| Completion Rate | 30% | Events completed vs joined |
| Approval Rate | 25% | NGO-verified vs checked-in |
| Consistency | 20% | Regular participation |
| Impact Quality | 15% | Avg event difficulty |
| Verification | 10% | Confidence score |

### Volunteer Tiers

| Tier | Events/Month | Karma Required | Badge |
|------|--------------|---------------|-------|
| Bronze | 1-2 | 0+ | Bronze |
| Silver | 3-5 | 500+ | Silver |
| Gold | 6-10 | 2000+ | Gold |
| Platinum | 11+ | 5000+ | Platinum |

### NGO Partnership Tiers

| Tier | Min Events/Year | Min Volunteers | CSR Credits | Badge |
|------|----------------|---------------|-------------|-------|
| Associate | 12 | 50 | ₹50,000 | Associate |
| Partner | 24 | 200 | ₹2,00,000 | Partner |
| Champion | 48 | 500 | ₹5,00,000 | Champion |
| Apex | 100+ | 1000+ | ₹10,00,000+ | Apex |

---

## 9. API Endpoints Catalog

### karma-service (Port 3009)

#### Karma Points (P0)
| Method | Endpoint | Description | Auth | Status |
|--------|----------|-------------|------|--------|
| GET | `/api/karma/user/:userId` | Get karma profile | Required | ✅ |
| GET | `/api/karma/user/:userId/level` | Get level info | Required | ✅ |
| GET | `/api/karma/user/:userId/history` | Conversion history | Required | ✅ |
| POST | `/api/karma/earn` | Record karma earned | Required | ✅ |

#### Karma Score (P0)
| Method | Endpoint | Description | Auth | Status |
|--------|----------|-------------|------|--------|
| GET | `/api/karma/score` | Get current user's KarmaScore | Required | ✅ |
| GET | `/api/karma/score/history` | Get score history | Required | ✅ |
| GET | `/api/karma/score/leaderboard` | Get top karma scores | Required | ✅ |
| GET | `/api/karma/score/leaderboard/my-rank` | Get user's rank | Required | ✅ |
| GET | `/api/karma/score/band/:band` | Get band metadata | Public | ✅ |

#### Verification (P0)
| Method | Endpoint | Description | Auth | Status |
|--------|----------|-------------|------|--------|
| POST | `/api/karma/verify/checkin` | Check-in to event | Required | ✅ |
| POST | `/api/karma/verify/checkout` | Check-out from event | Required | ✅ |

#### Leaderboard (P1)
| Method | Endpoint | Description | Auth | Status |
|--------|----------|-------------|------|--------|
| GET | `/api/karma/leaderboard` | Get rankings | Required | ✅ |
| GET | `/api/karma/leaderboard/me` | User's rank | Required | ✅ |

#### Communities (P1)
| Method | Endpoint | Description | Auth | Status |
|--------|----------|-------------|------|--------|
| GET | `/api/karma/communities` | List communities | Required | ✅ |
| GET | `/api/karma/communities/recommended` | Recommended for user | Required | ✅ |
| GET | `/api/karma/communities/my` | User's communities | Required | ✅ |
| GET | `/api/karma/communities/:slug` | Community detail | Required | ✅ |
| GET | `/api/karma/communities/:slug/feed` | Community posts | Required | ✅ |
| POST | `/api/karma/communities/:slug/follow` | Follow community | Required | ✅ |
| DELETE | `/api/karma/communities/:slug/follow` | Unfollow community | Required | ✅ |
| POST | `/api/karma/communities/:slug/posts` | Create post | Required | ✅ |

#### Missions (P1)
| Method | Endpoint | Description | Auth | Status |
|--------|----------|-------------|------|--------|
| GET | `/api/karma/missions` | List missions | Required | ✅ |
| GET | `/api/karma/missions/:id` | Mission detail | Required | ✅ |
| POST | `/api/karma/missions/:id/complete` | Complete mission | Required | ✅ |

#### Micro-Actions (P2)
| Method | Endpoint | Description | Auth | Status |
|--------|----------|-------------|------|--------|
| GET | `/api/karma/micro-actions` | List micro-actions | Required | ✅ |
| POST | `/api/karma/micro-actions/claim` | Claim action | Required | ✅ |

#### Events (P0)
| Method | Endpoint | Description | Auth | Status |
|--------|----------|-------------|------|--------|
| GET | `/api/karma/events` | List events | Required | ✅ |
| GET | `/api/karma/events/nearby` | Nearby events | Required | ✅ |
| GET | `/api/karma/events/:id` | Event detail | Required | ✅ |
| POST | `/api/karma/event/join` | Join event | Required | ✅ |
| DELETE | `/api/karma/event/:id/leave` | Leave event | Required | ✅ |
| GET | `/api/karma/my-bookings` | User's bookings | Required | ✅ |
| PATCH | `/api/karma/booking/:bookingId/approve` | Approve booking | Admin | ✅ |

#### Batch Conversion (P0)
| Method | Endpoint | Description | Auth | Status |
|--------|----------|-------------|------|--------|
| GET | `/api/karma/batch` | List batches | Admin | ✅ |
| GET | `/api/karma/batch/:id/preview` | Preview conversion | Admin | ✅ |
| POST | `/api/karma/batch/:id/execute` | Execute batch | Admin | ✅ |
| POST | `/api/karma/batch/pause-all` | Pause all batches | Admin | ✅ |

#### Wallet (P1)
| Method | Endpoint | Description | Auth | Status |
|--------|----------|-------------|------|--------|
| GET | `/api/karma/wallet/balance` | Get balance | Required | ✅ |
| GET | `/api/karma/wallet/transactions` | Transaction history | Required | ✅ |

#### Reports (P1)
| Method | Endpoint | Description | Auth | Status |
|--------|----------|-------------|------|--------|
| GET | `/api/karma/report` | Impact PDF report | Required | ✅ |
| GET | `/api/karma/resume` | Impact resume JSON | Required | ✅ |
| GET | `/api/karma/resume/pdf` | Impact resume PDF | Required | ✅ |

#### CSR (P2)
| Method | Endpoint | Description | Auth | Status |
|--------|----------|-------------|------|--------|
| GET | `/api/karma/csr/dashboard` | CSR dashboard | Admin | ✅ |
| POST | `/api/karma/csr/allocate` | Allocate credits | Admin | ✅ |
| POST | `/api/karma/csr/partner` | Create partner | Admin | ✅ |
| GET | `/api/karma/csr/report/:partnerId` | CSR report | Admin | ✅ |

#### Civic Corps (P1)
| Method | Endpoint | Description | Auth | Status |
|--------|----------|-------------|------|--------|
| GET | `/api/karma/civic-corps/profile/:userId` | User civic profile | Required | ✅ |
| GET | `/api/karma/civic-corps/missions` | Available missions | Required | ✅ |
| POST | `/api/karma/civic-corps/missions/:id/join` | Join mission | Required | ✅ |

#### Perks (P2)
| Method | Endpoint | Description | Auth | Status |
|--------|----------|-------------|------|--------|
| GET | `/api/karma/perks` | List perks | Required | ✅ |
| GET | `/api/karma/perks/my` | User's perks | Required | ✅ |
| POST | `/api/karma/perks/:id/claim` | Claim perk | Required | ✅ |

#### Badges (P2)
| Method | Endpoint | Description | Auth | Status |
|--------|----------|-------------|------|--------|
| GET | `/api/karma/badges` | List all badges | Required | ✅ |
| GET | `/api/karma/badges/my` | User's badges | Required | ✅ |

#### Notifications (P2)
| Method | Endpoint | Description | Auth | Status |
|--------|----------|-------------|------|--------|
| GET | `/api/karma/notifications` | User notifications | Required | ✅ |
| PATCH | `/api/karma/notifications/:id/read` | Mark as read | Required | ✅ |
| DELETE | `/api/karma/notifications/clear` | Clear all | Required | ✅ |

#### Health (Public)
| Method | Endpoint | Description | Auth | Status |
|--------|----------|-------------|------|--------|
| GET | `/health` | Health check | Public | ✅ |
| GET | `/health/live` | Liveness probe | Public | ✅ |
| GET | `/health/ready` | Readiness probe | Public | ✅ |
| GET | `/metrics` | Prometheus metrics | Public | ✅ |

### karma-loyalty-bridge (Port 4098)

| Method | Endpoint | Description | Auth | Status |
|--------|----------|-------------|------|--------|
| GET | `/health` | Health check | Public | ✅ |
| POST | `/api/v1/convert/preview` | Preview conversion | Public | ✅ |
| POST | `/api/v1/convert` | Execute conversion | Public | ✅ |
| GET | `/api/v1/conversions/:userId` | Conversion history | Public | ✅ |
| GET | `/api/v1/config/rates` | Get conversion rates | Public | ✅ |
| PUT | `/api/v1/config/rates` | Update rates | Admin | ✅ |

---

## 10. Tech Stack

### Backend

| Technology | Version | Purpose |
|------------|--------|---------|
| Node.js | 20+ | Runtime |
| Express | 4.x | Web framework |
| TypeScript | 5.x | Type safety |
| MongoDB | 6+ | Database |
| Mongoose | 8.x | ORM |
| Redis | 7+ | Caching/Queue |
| BullMQ | 5.x | Job queue |

### Frontend Web

| Technology | Version | Purpose |
|------------|--------|---------|
| Next.js | 14+ | Framework |
| React | 18+ | UI library |
| TypeScript | 5.x | Type safety |
| TailwindCSS | 3.x | Styling |
| shadcn/ui | latest | Components |
| Axios | 1.x | HTTP client |

### Mobile

| Technology | Version | Purpose |
|------------|--------|---------|
| Expo | SDK 50+ | Framework |
| React Native | 0.72+ | UI framework |
| TypeScript | 5.x | Type safety |
| expo-secure-store | latest | Secure storage |
| expo-camera | latest | QR scanning |
| @shopify/flash-list | latest | List rendering |

---

## 11. Dependencies

### Internal Services

| Service | URL | Purpose | Status |
|---------|-----|---------|--------|
| RABTUL Auth | AUTH_SERVICE_URL | User authentication | ✅ |
| RABTUL Wallet | WALLET_SERVICE_URL | Coin storage | ✅ |
| RABTUL Payments | MERCHANT_SERVICE_URL | Payment processing | ✅ |
| REZ Intelligence | CDP_URL, INTENT_URL | AI/ML services | ✅ |

### External Services

| Service | Purpose | Status |
|---------|---------|--------|
| MongoDB Atlas | Database | ✅ |
| Redis Cloud | Caching | ✅ |
| Vercel | Web hosting | ✅ |
| Cloudflare | CDN/DNS | ✅ |
| Sentry | Error tracking | ✅ |
| Expo | Mobile builds | ✅ |
| EAS | Mobile CI/CD | ✅ |

---

## 12. Roadmap

### Q2 2026 (Current)

| Feature | Status |
|---------|--------|
| Core karma system | ✅ Complete |
| QR/GPS verification | ✅ Complete |
| Level system | ✅ Complete |
| Batch conversion | ✅ Complete |
| Leaderboard | ✅ Complete |
| Community features | ✅ Complete |
| Impact resume | ✅ Complete |

### Q3 2026

| Feature | Priority | Status |
|---------|----------|--------|
| AI recommendations | P2 | 📋 Planned |
| Corporate matching | P2 | 📋 Planned |
| Social graph | P2 | 📋 Planned |
| Mobile push notifications | P2 | 📋 Planned |

### Q4 2026

| Feature | Priority | Status |
|---------|----------|--------|
| Blockchain verification | P3 | 📋 Planned |
| NFT badges | P3 | 📋 Planned |
| SOC 2 certification | P3 | 📋 Planned |
| International expansion | P3 | 📋 Planned |

---

**Document Status:** Production Ready  
**Next Review:** July 12, 2026

### SUTAR SimulationOS (HOJAI AI)
**Port:** 4241 | **Service:** sutar-simulation-os | **Layer:** 5

#### Features

##### Scenario Planning ✅
| Feature | Status | Category |
|---------|--------|----------|
| Pricing Optimization | ✅ | PRICING |
| Offer Modeling | ✅ | OFFER |
| Cashback ROI | ✅ | CASHBACK |
| Bundle Pricing | ✅ | BUNDLE |

##### Forecasting ✅
| Feature | Status | Category |
|---------|--------|----------|
| Demand Forecasting | ✅ | DEMAND |
| Cash Flow Forecasting | ✅ | CASHFLOW |
| Revenue Forecasting | ✅ | REVENUE |
| Cost Forecasting | ✅ | COST |

##### Risk Modeling ✅
| Feature | Status | Category |
|---------|--------|----------|
| Financial Risk | ✅ | RISK |
| Operational Risk | ✅ | RISK |
| Market Risk | ✅ | RISK |
| Compliance Risk | ✅ | COMPLIANCE |

##### Sensitivity Analysis ✅
| Feature | Status | Category |
|---------|--------|----------|
| What-If Analysis | ✅ | /api/v1/simulations/:id/whatif |
| Impact Assessment | ✅ | ImpactSummary |
| Recommendation Engine | ✅ | Recommendation[] |

##### Operations ✅
| Feature | Status | Category |
|---------|--------|----------|
| Staffing Optimization | ✅ | STAFFING |
| Inventory Optimization | ✅ | INVENTORY |
| Procurement Analysis | ✅ | PROCUREMENT |

#### API Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| /api/v1/simulations | POST | Run Monte Carlo simulation |
| /api/v1/simulations | GET | List simulations |
| /api/v1/simulations/:id | GET | Get simulation |
| /api/v1/simulations/:id | DELETE | Delete simulation |
| /api/v1/simulations/:id/whatif | POST | What-if analysis |
| /api/v1/simulations/compare | POST | Compare scenarios |

#### Implementation
- **Location:** `companies/hojai-ai/hojai-sutar-os/services/sutar-simulation-os/`
- **Technology:** Node.js, Express, TypeScript, Zod
- **Lines:** 1500+
- **Status:** Production Ready

---

### SUTAR OS - Autonomous Economic Infrastructure

**Company:** HOJAI AI | **Services:** 25 | **Status:** Production Ready

| Service | Port | Features |
|---------|------|----------|
| SimulationOS | 4241 | Monte Carlo, What-if, Forecasting, Risk, COMPLIANCE |
| Decision Engine | 4240 | Policy evaluation, Risk assessment, PROCEED/HOLD/REJECT |
| GoalOS | 4242 | Goal decomposition, OKR system |
| Negotiation Engine | 4191 | RFQ, Quotes, Counter-offers |
| Trust Engine | 4180 | Trust scoring, KYC, Credit check |
| Contract OS | 4190 | Contracts, Digital signatures |
| Economy OS | 4251 | Karma points, Transactions, Billing |
| Agent Network | 4155 | Registry, Capability matching |
| Marketplace | 4250 | Service listing, Ratings |
| Network Learning | 4243 | Pattern learning |
| Intent Bus | 4154 | Intent capture, Patterns |
| Memory Bridge | 4143 | Context storage |
| Gateway | 4140 | API routing |

**Simulation Types (14):** PRICING, OFFER, CASHBACK, BUNDLE, DEMAND, CASHFLOW, REVENUE, COST, RISK, COMPLIANCE, STAFFING, INVENTORY, PROCUREMENT, CUSTOM

**Decision Types (10):** OFFER, CASHBACK, PERSONALIZATION, ROUTING, FRAUD, PRICING, NEXT_ACTION, RETENTION, APPROVAL, RISK

---
