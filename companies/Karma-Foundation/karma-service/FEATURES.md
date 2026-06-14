# karma-service - Features & Endpoints

**Package:** karma-service  
**Port:** 3009  
**Purpose:** Backend API for social impact and NGO ecosystem  
**Tech Stack:** Node.js, Express, TypeScript, MongoDB, Redis, BullMQ  
**Status:** ✅ Production Ready

---

## 📋 Table of Contents

1. [Service Components](#1-service-components)
2. [API Endpoints](#2-api-endpoints)
3. [Database Models](#3-database-models)
4. [Workers & Background Jobs](#4-workers--background-jobs)
5. [Level System](#5-level-system)
6. [Trust Grades](#6-trust-grades)
7. [Social Programs](#7-social-programs)
8. [Environment Variables](#8-environment-variables)
9. [Security Features](#9-security-features)

---

## 1. Service Components

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
| **Wallet Integration** | REZ wallet credits | ✅ |
| **AI Assistant** | Mission/perk recommendations | ✅ |

---

## 2. API Endpoints

### Karma Points (P0 - Critical)

| Method | Endpoint | Description | Auth | Status |
|--------|----------|-------------|------|--------|
| GET | `/api/karma/user/:userId` | Get full karma profile | Required | ✅ |
| GET | `/api/karma/user/:userId/level` | Get level + conversion rate | Required | ✅ |
| GET | `/api/karma/user/:userId/history` | Get conversion history | Required | ✅ |
| POST | `/api/karma/earn` | Record karma earned | Required | ✅ |
| POST | `/api/karma/decay-all` | Trigger decay for all (admin) | Admin | ✅ |

### Karma Score (P0)

| Method | Endpoint | Description | Auth | Status |
|--------|----------|-------------|------|--------|
| GET | `/api/karma/score` | Get current user's KarmaScore | Required | ✅ |
| GET | `/api/karma/score/history` | Get score history | Required | ✅ |
| GET | `/api/karma/score/leaderboard` | Get top karma scores | Required | ✅ |
| GET | `/api/karma/score/leaderboard/my-rank` | Get user's rank | Required | ✅ |
| GET | `/api/karma/score/band/:band` | Get band metadata | Public | ✅ |

### Verification (P0 - Critical)

| Method | Endpoint | Description | Auth | Status |
|--------|----------|-------------|------|--------|
| POST | `/api/karma/verify/checkin` | Check-in to event | Required | ✅ |
| POST | `/api/karma/verify/checkout` | Check-out from event | Required | ✅ |

### Leaderboard (P1)

| Method | Endpoint | Description | Auth | Status |
|--------|----------|-------------|------|--------|
| GET | `/api/karma/leaderboard` | Get rankings | Required | ✅ |
| GET | `/api/karma/leaderboard/me` | User's rank | Required | ✅ |

### Communities (P1)

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

### Missions (P1)

| Method | Endpoint | Description | Auth | Status |
|--------|----------|-------------|------|--------|
| GET | `/api/karma/missions` | List missions | Required | ✅ |
| GET | `/api/karma/missions/:id` | Mission detail | Required | ✅ |
| POST | `/api/karma/missions/:id/complete` | Complete mission | Required | ✅ |

### Micro-Actions (P2)

| Method | Endpoint | Description | Auth | Status |
|--------|----------|-------------|------|--------|
| GET | `/api/karma/micro-actions` | List micro-actions | Required | ✅ |
| POST | `/api/karma/micro-actions/claim` | Claim action | Required | ✅ |

### Events (P0)

| Method | Endpoint | Description | Auth | Status |
|--------|----------|-------------|------|--------|
| GET | `/api/karma/events` | List events | Required | ✅ |
| GET | `/api/karma/events/nearby` | Nearby events | Required | ✅ |
| GET | `/api/karma/events/:id` | Event detail | Required | ✅ |
| POST | `/api/karma/event/join` | Join event | Required | ✅ |
| DELETE | `/api/karma/event/:id/leave` | Leave event | Required | ✅ |
| GET | `/api/karma/my-bookings` | User's bookings | Required | ✅ |

### Booking (P1)

| Method | Endpoint | Description | Auth | Status |
|--------|----------|-------------|------|--------|
| GET | `/api/karma/booking/:eventId` | Get booking | Required | ✅ |
| PATCH | `/api/karma/booking/:bookingId/approve` | Approve booking | Admin | ✅ |

### Batch Conversion (P0 - Critical)

| Method | Endpoint | Description | Auth | Status |
|--------|----------|-------------|------|--------|
| GET | `/api/karma/batch` | List batches | Admin | ✅ |
| GET | `/api/karma/batch/:id/preview` | Preview conversion | Admin | ✅ |
| POST | `/api/karma/batch/:id/execute` | Execute batch | Admin | ✅ |
| POST | `/api/karma/batch/pause-all` | Pause all batches | Admin | ✅ |

### Wallet (P1)

| Method | Endpoint | Description | Auth | Status |
|--------|----------|-------------|------|--------|
| GET | `/api/karma/wallet/balance` | Get balance | Required | ✅ |
| GET | `/api/karma/wallet/transactions` | Transaction history | Required | ✅ |

### Reports (P1)

| Method | Endpoint | Description | Auth | Status |
|--------|----------|-------------|------|--------|
| GET | `/api/karma/report` | Impact PDF report | Required | ✅ |
| GET | `/api/karma/resume` | Impact resume JSON | Required | ✅ |
| GET | `/api/karma/resume/pdf` | Impact resume PDF | Required | ✅ |

### CSR (P2)

| Method | Endpoint | Description | Auth | Status |
|--------|----------|-------------|------|--------|
| GET | `/api/karma/csr/dashboard` | CSR dashboard | Admin | ✅ |
| POST | `/api/karma/csr/allocate` | Allocate credits | Admin | ✅ |
| POST | `/api/karma/csr/partner` | Create partner | Admin | ✅ |
| GET | `/api/karma/csr/report/:partnerId` | CSR report | Admin | ✅ |

### Civic Corps (P1)

| Method | Endpoint | Description | Auth | Status |
|--------|----------|-------------|------|--------|
| GET | `/api/karma/civic-corps/profile/:userId` | User civic profile | Required | ✅ |
| GET | `/api/karma/civic-corps/missions` | Available missions | Required | ✅ |
| POST | `/api/karma/civic-corps/missions/:id/join` | Join mission | Required | ✅ |

### Perks (P2)

| Method | Endpoint | Description | Auth | Status |
|--------|----------|-------------|------|--------|
| GET | `/api/karma/perks` | List perks | Required | ✅ |
| GET | `/api/karma/perks/my` | User's perks | Required | ✅ |
| POST | `/api/karma/perks/:id/claim` | Claim perk | Required | ✅ |

### Badges (P2)

| Method | Endpoint | Description | Auth | Status |
|--------|----------|-------------|------|--------|
| GET | `/api/karma/badges` | List all badges | Required | ✅ |
| GET | `/api/karma/badges/my` | User's badges | Required | ✅ |

### Notifications (P2)

| Method | Endpoint | Description | Auth | Status |
|--------|----------|-------------|------|--------|
| GET | `/api/karma/notifications` | User notifications | Required | ✅ |
| PATCH | `/api/karma/notifications/:id/read` | Mark as read | Required | ✅ |
| DELETE | `/api/karma/notifications/clear` | Clear all | Required | ✅ |

### AI Recommendations (P2)

| Method | Endpoint | Description | Auth | Status |
|--------|----------|-------------|------|--------|
| GET | `/api/karma/ai/recommend-missions` | AI mission recommendations | Required | ✅ |
| GET | `/api/karma/ai/recommend-perks` | AI perk recommendations | Required | ✅ |

### Health (Public)

| Method | Endpoint | Description | Auth | Status |
|--------|----------|-------------|------|--------|
| GET | `/health` | Health check | Public | ✅ |
| GET | `/health/live` | Liveness probe | Public | ✅ |
| GET | `/health/ready` | Readiness probe | Public | ✅ |
| GET | `/health/detailed` | Detailed health | Public | ✅ |
| GET | `/healthz` | Health (short) | Public | ✅ |
| GET | `/metrics` | Prometheus metrics | Public | ✅ |

---

## 3. Database Models

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
| ScoreHistory | score_histories | Daily score snapshots |
| KarmaCoin | karma_coins | Coin balances |

---

## 4. Workers & Background Jobs

| Worker | Purpose | Schedule |
|--------|---------|----------|
| decayWorker | Karma decay calculation | Daily |
| scoreRankWorker | Update leaderboard ranks | Every hour |
| batchScheduler | Weekly batch creation | Sunday 11:59 PM |
| autoCheckoutWorker | Auto check-out stale events | Every 15 min |
| coinEventSubscriber | Listen for coin events | Real-time |

---

## 5. Level System

| Level | Name | Active Karma | Conversion Rate | Weekly Cap |
|-------|------|-------------|-----------------|------------|
| L1 | Seed | 0-499 | 25% | 75 coins |
| L2 | Sprout | 500-1999 | 50% | 150 coins |
| L3 | Bloom | 2000-4999 | 75% | 225 coins |
| L4 | Tree | 5000+ | 100% | 300 coins |

### Earning Actions

| Action | Base Karma | Bonus | Status |
|--------|-----------|-------|--------|
| Event participation | 10 KP/hour | Program multiplier | ✅ |
| Check-in verification | +5 KP | QR bonus | ✅ |
| Check-out verification | +5 KP | GPS bonus | ✅ |
| NGO approval | +10 KP | Trust bonus | ✅ |
| Review posted | +5 KP | - | ✅ |
| Referral credited | +50 KP | - | ✅ |

---

## 6. Trust Grades

| Grade | Score | Badge | Color |
|-------|-------|-------|-------|
| S | 90-100 | Platinum Trust | `#E5E4E2` |
| A | 80-89 | Gold Trust | `#FFD700` |
| B | 60-79 | Silver Trust | `#C0C0C0` |
| C | 40-59 | Bronze Trust | `#CD7F32` |
| D | 0-39 | Pending | `#808080` |

### Trust Score Components

| Component | Weight | Description |
|-----------|--------|-------------|
| Completion Rate | 30% | Events completed vs joined |
| Approval Rate | 25% | NGO-verified vs checked-in |
| Consistency | 20% | Regular participation |
| Impact Quality | 15% | Avg event difficulty |
| Verification | 10% | Confidence score |

---

## 7. Social Programs

### Program Categories (32 Programs)

| Category | Programs | Multiplier |
|----------|----------|------------|
| Education | 4 | 1.5x - 2.0x |
| Healthcare | 4 | 1.0x - 2.0x |
| Environment | 4 | 1.5x - 2.0x |
| Community Welfare | 4 | 1.5x - 2.0x |
| Disaster Relief | 4 | 1.5x - 2.5x |
| Women Empowerment | 4 | 1.5x - 2.0x |
| Food Donation | 4 | 1.5x - 2.0x |
| Sustainability | 4 | 1.0x - 1.5x |

---

## 8. Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| PORT | Yes | 3009 | Service port |
| NODE_ENV | Yes | development | Environment |
| MONGODB_URI | Yes | - | MongoDB connection |
| REDIS_URL | Yes | - | Redis connection |
| JWT_SECRET | Yes | - | JWT signing (min 32 chars) |
| QR_SECRET | Yes | - | HMAC for QR verification |
| INTERNAL_SERVICE_TOKEN | Yes | - | Service-to-service auth |
| CORS_ORIGIN | Yes | - | Allowed origins |
| AUTH_SERVICE_URL | Yes | - | RABTUL Auth URL |
| WALLET_SERVICE_URL | Yes | - | RABTUL Wallet URL |
| MERCHANT_SERVICE_URL | No | - | RABTUL Merchant URL |
| SENTRY_DSN | No | - | Sentry error tracking |
| TRACKIFY_API_KEY | No | - | Trackify analytics |

---

## 9. Security Features

| Feature | Status | Description |
|---------|--------|-------------|
| TypeScript Strict Mode | ✅ | Full type safety |
| CORS Validation | ✅ | Explicit origin required |
| JWT Secret Validation | ✅ | Minimum 32 chars |
| QR Secret Validation | ✅ | Fail-closed if missing |
| Redis Distributed Locks | ✅ | Atomic SET NX EX |
| Rate Limiting | ✅ | 100 req/min per IP |
| Structured Logging | ✅ | Winston logger |
| Auth Middleware | ✅ | All protected routes |
| Helmet Security | ✅ | Security headers |
| Mongo Sanitization | ✅ | Query injection prevention |

---

## Quick Start

```bash
# Install dependencies
npm install

# Build
npm run build

# Start
npm start

# Development
npm run dev
```

---

**Last Updated:** June 12, 2026