# RisnaEstate - Source of Truth

**Last Updated:** May 25, 2026
**Version:** 3.0.2
**Status:** Production Ready

---

## Overview

**RisnaEstate** is an AI-powered real estate distribution and intelligence platform for India + UAE markets, built on the REZ ecosystem.

### Vision

Build the operating system for real estate:
> *discovery → lead gen → referrals → broker network → AI intelligence → global properties*

### Key Differentiators

| Feature | Traditional Portals | RisnaEstate |
|---------|-------------------|-------------|
| Lead Distribution | Basic | AI-powered smart routing |
| Referrals | Single-level | Multi-level + influencer |
| NRI Detection | Manual | AI auto-scoring |
| Corp Network | None | CorpPerks integration |
| Ad Targeting | Generic | Programmatic via AdsBazaar |
| Golden Visa | Not offered | Built-in eligibility |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js 20 + TypeScript |
| API | Express.js |
| Database | MongoDB 7 + Redis 7 |
| Frontend | Next.js 14 + TailwindCSS |
| Mobile | React Native (Expo) |
| Container | Docker |
| CI/CD | GitHub Actions |
| Monitoring | Prometheus + Grafana |

---

## Services Registry (27 Total)

### Core Services (8)

| Service | Port | Purpose | Status |
|---------|------|---------|---------|
| `risna-gateway` | 3000 | API Gateway, auth, routing | ✅ |
| `risna-property-service` | 4100 | Listings, search, filters | ✅ |
| `risna-lead-service` | 4101 | Lead capture, scoring, segments | ✅ |
| `risna-visa-service` | 4102 | Golden Visa eligibility check | ✅ |
| `risna-referral-service` | 4103 | Multi-level commissions | ✅ |
| `risna-broker-service` | 4104 | Broker CRM, teams | ✅ |
| `risna-crm-service` | 4105 | Follow-ups, site visits | ✅ |
| `risna-builder-service` | 4107 | Builder ERP, inventory | ✅ |

### Intelligence Services (9)

| Service | Port | Purpose | Status |
|---------|------|---------|---------|
| `risna-intelligence-service` | 4110 | NRI/HNI/Investor scoring | ✅ |
| `risna-whatsapp-service` | 4111 | WhatsApp commerce bot | ✅ |
| `risna-investment-service` | 4112 | EMI, ROI calculators | ✅ |
| `risna-distribution-service` | 4113 | Lead routing engine | ✅ |
| `risna-corpperks-bridge` | 4114 | CorpPerks → leads | ✅ |
| `risna-ads-integration` | 4115 | AdsBazaar sync | ✅ |
| `risna-property-intelligence` | 4116 | User preferences graph | ✅ |
| `risna-distribution-router` | 4117 | AI routing decisions | ✅ |
| `risna-influencer-tracker` | 4118 | Creator referrals | ✅ |

### Platform Services (6)

| Service | Port | Purpose | Status |
|---------|------|---------|---------|
| `risna-media-service` | 4106 | Campaigns, DOOH | ✅ |
| `risna-notification-service` | 4108 | Push, SMS alerts | ✅ |
| `risna-booking-service` | 4120 | Booking FSM, RABTUL | ✅ |
| `risna-realtime-service` | 4121 | WebSocket updates | ✅ |
| `risna-email-service` | 4122 | Email campaigns | ✅ |
| `risna-chatbot-service` | 4123 | AI chatbot | ✅ |

### User Services (4)

| Service | Port | Purpose | Status |
|---------|------|---------|---------|
| `risna-document-service` | 4124 | KYC verification | ✅ |
| `risna-virtual-tour-service` | 4125 | 360° tours | ✅ |
| `risna-push-service` | 4126 | Mobile push (FCM) | ✅ |

---

## Frontend (25 Pages)

### Consumer Portal

| Page | Route | Status |
|------|-------|--------|
| Home | `/` | ✅ Premium |
| Properties | `/consumer/properties` | ✅ |
| Property Detail | `/consumer/property/:id` | ✅ Premium |
| Visa Check | `/consumer/visa` | ✅ |
| Calculator | `/consumer/calculator` | ✅ |
| Bookings | `/consumer/bookings` | ✅ |
| Profile | `/consumer/profile` | ✅ |
| Saved | `/consumer/saved` | ✅ |
| Referrals | `/consumer/referrals` | ✅ |
| Visits | `/consumer/visits` | ✅ |

### Broker Portal

| Page | Route | Status |
|------|-------|--------|
| Dashboard | `/broker` | ✅ |
| Leads | `/broker/leads` | ✅ |
| Lead Detail | `/broker/leads/:id` | ✅ |
| Visits | `/broker/visits` | ✅ |
| Earnings | `/broker/earnings` | ✅ |
| Inbox | `/broker/inbox` | ✅ |

### Admin Portal

| Page | Route | Status |
|------|-------|--------|
| Dashboard | `/dashboard` | ✅ |
| Users | `/dashboard/portal/users` | ✅ |
| Brokers | `/dashboard/portal/brokers` | ✅ |

### Auth Pages

| Page | Route | Status |
|------|-------|--------|
| Login | `/auth/login` | ✅ |
| Register | `/auth/register` | ✅ |

---

## API Gateway Routes (27 Services)

| Route Prefix | Service | Port |
|--------------|---------|------|
| `/api/v1/properties` | risna-property-service | 4100 |
| `/api/v1/leads` | risna-lead-service | 4101 |
| `/api/v1/visa` | risna-visa-service | 4102 |
| `/api/v1/referrals` | risna-referral-service | 4103 |
| `/api/v1/brokers` | risna-broker-service | 4104 |
| `/api/v1/crm` | risna-crm-service | 4105 |
| `/api/v1/media` | risna-media-service | 4106 |
| `/api/v1/notifications` | risna-notification-service | 4108 |
| `/api/v1/payments` | risna-payment-service | 4109 |
| `/api/v1/intelligence` | risna-intelligence-service | 4110 |
| `/api/v1/whatsapp` | risna-whatsapp-service | 4111 |
| `/api/v1/investment` | risna-investment-service | 4112 |
| `/api/v1/distribution` | risna-distribution-service | 4113 |
| `/api/v1/corpperks` | risna-corpperks-bridge | 4114 |
| `/api/v1/ads` | risna-ads-integration | 4115 |
| `/api/v1/property-intelligence` | risna-property-intelligence | 4116 |
| `/api/v1/distribution-router` | risna-distribution-router | 4117 |
| `/api/v1/influencer` | risna-influencer-tracker | 4118 |
| `/api/v1/bookings` | risna-booking-service | 4120 |
| `/api/v1/realtime` | risna-realtime-service | 4121 |
| `/api/v1/email` | risna-email-service | 4122 |
| `/api/v1/chatbot` | risna-chatbot-service | 4123 |
| `/api/v1/documents` | risna-document-service | 4124 |
| `/api/v1/virtual-tours` | risna-virtual-tour-service | 4125 |
| `/api/v1/push` | risna-push-service | 4126 |

---

## Mobile (17 Screens)

### Screens

| Screen | Status |
|--------|--------|
| Onboarding | ✅ |
| Home | ✅ |
| Property Detail | ✅ |
| Property Search | ✅ |
| Leads | ✅ |
| Calculator | ✅ |
| Visa | ✅ |
| Profile | ✅ |
| Bookings List | ✅ |
| Booking Detail | ✅ |

### Components

- Bottom tab navigation
- Property cards
- Lead cards
- Chat interface
- Calculator inputs

---

## Design System

### Colors

```css
/* Primary - Sky Blue */
primary-50: #f0f9ff
primary-500: #0ea5e9
primary-600: #0284c7
primary-700: #0369a1

/* Accents */
accent-gold: #D4AF37   /* Premium */
accent-emerald: #059669 /* Success */
accent-amber: #F59E0B  /* Warning */

/* Dark */
dark-900: #0f172a
dark-800: #1e293b
```

### Typography

- **Display**: Plus Jakarta Sans
- **Body**: Inter

### Shadows

```css
shadow-card: 0 4px 6px -1px rgba(0, 0, 0, 0.05)
shadow-card-hover: 0 25px 50px -12px rgba(0, 0, 0, 0.15)
shadow-glow: 0 0 40px rgba(14, 165, 233, 0.25)
```

### Animations

| Name | Effect |
|------|--------|
| `float` | Gentle up/down bob |
| `slide-up` | Fade + rise |
| `scale-in` | Pop in |
| `fade-in` | Opacity 0→1 |

---

## REZ Ecosystem Integration

### RABTUL Services (Reuse)

| Service | Port | Used For |
|---------|------|----------|
| Auth | 4002 | JWT/OAuth |
| Payment | 4001 | Booking payments |
| Wallet | 4004 | Refunds, referral payouts |
| Notification | 4011 | Push, SMS, WhatsApp |
| Event Bus | 4025 | Real-time updates |

### REZ Intelligence

| Service | Port | Used For |
|---------|------|----------|
| Intent Predictor | 4018 | Lead scoring |
| Signal Aggregator | 4142 | Behavior signals |
| Identity Graph | 4050 | Cross-platform users |

### Ecosystem Bridges

| Bridge | Port | Connects |
|--------|------|----------|
| CorpPerks Bridge | 4114 | CorpPerks employees → leads |
| Ads Integration | 4115 | AdsBazaar → leads |

---

## Key Features

### 1. Property Discovery
- Buy/Rent/Commercial
- Smart filters (ROI, metro distance, builder)
- AI recommendations
- Virtual tours

### 2. NRI/HNI Detection (AI)
- Phone number analysis (+971, +1, +44)
- Email domain scoring
- Investment behavior

### 3. Golden Visa
- Real-time eligibility check
- Property value qualification
- Document checklist

### 4. Multi-Level Referrals
- Buyer → Broker → Influencer
- Auto commission distribution
- REZ Coins rewards

### 5. WhatsApp Commerce
- Auto-reply bot
- Property brochures
- Site visit scheduling

### 6. Broker Network
- KYC verification
- Commission tracking
- Team management

### 7. Smart Lead Distribution
- AI routing by location/segment
- Load balancing
- Performance tracking

### 8. Email Campaigns
- Welcome sequences
- Lead nurturing
- Property alerts

### 9. AI Chatbot
- 24/7 support
- Intent detection
- Agent transfer

### 10. Document Verification
- KYC automation
- Passport, visa, Emirates ID

---

## Data Flow

```
User searches property
    ↓
Property Service returns listings
    ↓
Lead captured (phone/email)
    ↓
Intelligence scores (NRI/HNI)
    ↓
Distribution routes to broker
    ↓
Broker notified (WhatsApp/Push)
    ↓
Site visit scheduled
    ↓
Booking created (RABTUL Payment)
    ↓
Referral credited (RABTUL Wallet)
    ↓
Event published (RABTUL Event Bus)
```

---

## Environment Variables

```bash
# Core
NODE_ENV=production
PORT=3000
CORS_ORIGIN=http://localhost:3001

# Database
MONGODB_URI=mongodb://localhost:27017/risna
REDIS_URL=redis://localhost:6379

# Security
INTERNAL_SERVICE_TOKEN=your-internal-service-token
JWT_SECRET=your-jwt-secret

# RABTUL Services
RABTUL_AUTH_URL=https://rez-auth-service.onrender.com
RABTUL_PAYMENT_URL=https://rez-payment-service.onrender.com
RABTUL_WALLET_URL=https://rez-wallet-service.onrender.com
RABTUL_NOTIFICATION_URL=https://rez-notifications-service.onrender.com

# REZ Intelligence
REZ_INTELLIGENCE_URL=https://rez-intelligence.rez.app
REZ_INTELLIGENCE_API_KEY=your-api-key

# RisnaEstate Services (27 total)
RISNA_PROPERTY_URL=http://localhost:4100
RISNA_LEAD_URL=http://localhost:4101
RISNA_VISA_URL=http://localhost:4102
RISNA_REFERRAL_URL=http://localhost:4103
RISNA_BROKER_URL=http://localhost:4104
RISNA_CRM_URL=http://localhost:4105
RISNA_MEDIA_URL=http://localhost:4106
RISNA_BUILDER_URL=http://localhost:4107
RISNA_NOTIFICATION_URL=http://localhost:4108
RISNA_PAYMENT_URL=http://localhost:4109
RISNA_INTELLIGENCE_URL=http://localhost:4110
RISNA_WHATSAPP_URL=http://localhost:4111
RISNA_INVESTMENT_URL=http://localhost:4112
RISNA_DISTRIBUTION_URL=http://localhost:4113
RISNA_CORPPERKS_URL=http://localhost:4114
RISNA_ADS_URL=http://localhost:4115
RISNA_PROPERTY_INTELLIGENCE_URL=http://localhost:4116
RISNA_DISTRIBUTION_ROUTER_URL=http://localhost:4117
RISNA_INFLUENCER_URL=http://localhost:4118
RISNA_BOOKING_URL=http://localhost:4120
RISNA_REALTIME_URL=http://localhost:4121
RISNA_EMAIL_URL=http://localhost:4122
RISNA_CHATBOT_URL=http://localhost:4123
RISNA_DOCUMENT_URL=http://localhost:4124
RISNA_VIRTUAL_TOUR_URL=http://localhost:4125
RISNA_PUSH_URL=http://localhost:4126
```

---

## Quick Start

```bash
# Clone
git clone https://github.com/Imrejaul007/RisnaEstate.git
cd RisnaEstate

# Start all services
docker-compose up -d

# Seed demo data
npm run seed

# Access
# API: http://localhost:3000
# Frontend: http://localhost:3001
# Prometheus: http://localhost:9090
# Grafana: http://localhost:3002
```

---

## GitHub

**Repository:** https://github.com/Imrejaul007/RisnaEstate

**CI/CD:** GitHub Actions (all 27 services)

---

## Documentation

| Document | Purpose |
|----------|---------|
| `SOT.md` | This file - source of truth |
| `docs/API.md` | API endpoints |
| `docs/DEPLOYMENT.md` | Production deployment |
| `docs/ARCHITECTURE.md` | System design |
| `CLAUDE.md` | Quick reference for AI assistant |

---

## Docker & Infrastructure

### Dockerfiles (All Present)
- Gateway: `services/risna-gateway/Dockerfile`
- All 27 services: `services/*/Dockerfile`
- Frontend: `frontend/Dockerfile`
- Mobile: `mobile/Dockerfile`

### Docker Compose
- Full stack: `docker-compose.yml` (27 services)
- Monitoring: `monitoring/docker-compose.monitoring.yml`

---

## CI/CD

### GitHub Actions
| Workflow | Purpose |
|----------|---------|
| `ci.yml` | Build + test all 27 services |
| `deploy.yml` | Deploy to staging |
| `deploy-production.yml` | Deploy to production |
| `mobile.yml` | Build mobile apps |

---

## Testing

### Unit Tests (9 files)
| Test File | Coverage |
|-----------|----------|
| `tests/auth.test.ts` | Auth service |
| `tests/property.test.ts` | Property CRUD |
| `tests/lead.test.ts` | Lead operations |
| `tests/visa.test.ts` | Visa eligibility |
| `tests/crm.test.ts` | CRM operations |
| `tests/payment.test.ts` | Payment flow |
| `tests/booking.test.ts` | Booking FSM |
| `tests/lead-scoring.test.ts` | AI scoring |
| `tests/investment.test.ts` | EMI/ROI |

---

## REZ Ecosystem Hooks

### Frontend Integration
| Hook | Purpose |
|------|---------|
| `useREZIntelligence` | NRI/HNI/Investor scoring |
| `useREZMedia` | Campaign management |
| `useRABTULNotifications` | Push/SMS alerts |
| `useRealtime` | WebSocket updates |

### API Client
`frontend/src/lib/api-full.ts` - Complete API integration for all 27 services

---

## Support

- REZ Platform Admin: https://admin.rez.money
- GitHub Issues: https://github.com/Imrejaul007/RisnaEstate/issues
