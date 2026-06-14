# REZ Platform - Detailed Company Overview

**Last Updated:** May 12, 2026  
**Version:** 1.0.0

---

## Table of Contents

1. [Company Overview](#company-overview)
2. [REZ-Merchant Products](#rez-merchant-products)
3. [Industry Verticals](#industry-verticals)
4. [REZ-Intelligence (AI/ML Platform)](#rez-intelligence-aiml-platform)
5. [RABTUL-Technologies (Core Platform)](#rabtul-technologies-core-platform)
6. [Service Connections](#service-connections)
7. [Technology Stack](#technology-stack)

---

## Company Overview

**REZ** is a comprehensive commerce platform consisting of three main divisions:

| Division | Repository | Purpose |
|----------|------------|---------|
| **REZ-Merchant** | Merchant OS for multi-industry businesses | `imrejaul007/REZ-Merchant` |
| **REZ-Intelligence** | AI/ML platform for commerce intelligence | `imrejaul007/REZ-Intelligence` |
| **RABTUL-Technologies** | Core infrastructure services | `imrejaul007/RABTUL-Technologies` |

### Key Statistics
- **60+ Microservices**
- **30 AI Agents**
- **4 Industry Verticals**
- **Cross-platform identity**

---

## REZ-Merchant Products

### 1. Merchant Service (Backend API)
**Port:** 4005 | **Repository:** `rez-merchant-service`

Complete merchant backend with:

| Module | Features |
|--------|----------|
| **Authentication** | JWT auth, OTP verification, refresh tokens |
| **Products** | CRUD, categories, variants, gallery, restore |
| **Orders** | List, status, refund, bulk operations |
| **Stores** | Multi-location, gallery, analytics |
| **Wallet** | Balance, withdrawals, bank details |
| **Loyalty** | Points, rewards, punch cards |
| **Campaigns** | Promotions, karma system |
| **CRM** | Customer management, engagement |
| **Analytics** | Creator analytics, store analytics |
| **Payments** | Payouts, settlements, transactions |
| **Integrations** | Swiggy, Zomato, delivery partners |

### 2. Merchant App (Mobile - Expo/React Native)
**Framework:** Expo SDK 53 | **Platforms:** iOS, Android, Web

```
rez-app-merchant/
├── app/                    # Expo Router pages
│   ├── (auth)/            # Login, OTP screens
│   ├── (tabs)/           # Tab navigation
│   │   ├── home/         # Dashboard
│   │   ├── orders/       # Order management
│   │   ├── menu/         # Menu management
│   │   ├── customers/    # CRM
│   │   └── settings/     # Profile, config
│   └── pos/              # Point of Sale
├── services/              # API clients, offline sync
├── stores/               # Zustand state management
└── components/           # Reusable UI components
```

**Features:**
- Real-time order notifications
- Offline POS capability
- Menu management
- Customer insights
- Loyalty program management
- Analytics dashboard
- Push notifications
- QR code generation

### 3. Merchant Intelligence Service
**Port:** 4009

Business intelligence and analytics:

| Feature | Description |
|---------|-------------|
| **Health Score** | 0-100 merchant health rating |
| **Growth Score** | Revenue, order, customer growth |
| **Engagement Score** | Customer engagement metrics |
| **Recommendations** | Personalized strategic advice |
| **Competitor Analysis** | Market positioning |
| **Trend Analysis** | Historical patterns, forecasting |

### 4. Merchant Copilot (AI Assistant)
**Port:** 4007

AI-powered assistant for merchants:

- Natural language queries
- Business insights
- Automated recommendations
- Decision support

### 5. Merchant Integrations
**Port:** 4010

External service integrations:

| Integration | Description |
|------------|-------------|
| **AdBazaar ROI** | Attribution, campaign tracking |
| **Swiggy Sync** | Restaurant aggregator sync |
| **Zomato Sync** | Restaurant aggregator sync |
| **Dunzo** | Delivery partner |
| **Shadowfax** | Delivery partner |

### 6. Barcode Scanner UI
**Framework:** React Native

Mobile barcode scanner for:
- Product lookup
- Inventory scanning
- QR code verification

### 7. Dashboard (Analytics Web App)
**Framework:** Next.js 14 | **Deployment:** Vercel

Real-time analytics dashboard:

- **Real-time Metrics** - Live KPIs with auto-refresh
- **Funnel Visualization** - Conversion analysis
- **Campaign Performance** - ROI, CTR, conversions
- **Revenue Tracking** - Daily trends vs targets

---

## Industry Verticals

### 1. Restaurant Hub

**Ecosystem:** `industry-os/restauranthub`

| Service | Description |
|---------|-------------|
| `rez-restaurant-admin-web` | Admin dashboard |
| `rez-restaurant-pos-service` | Point of Sale |
| `rez-restaurant-analytics-service` | Analytics |
| `rez-restaurant-crm-service` | Customer management |
| `rez-restaurant-inventory-service` | Stock management |
| `rez-restaurant-loyalty-service` | Rewards program |
| `rez-restaurant-marketing-service` | Campaigns |
| `rez-restaurant-order-service` | Order management |
| `rez-restaurant-menu-service` | Menu management |
| `rez-ai-restaurant` | AI enhancements |

**Features:**
- Table management
- Kitchen display system
- Online ordering
- Aggregator sync (Swiggy, Zomato)
- Multi-branch support

### 2. Hotel Ecosystem

**Ecosystem:** `industry-os/hotel-ecosystem`

| Service | Description |
|---------|-------------|
| `rez-hotel-admin-web` | Hotel admin |
| `rez-hotel-service` | Core hotel operations |
| `rez-hotel-pos-service` | Hotel POS |

**Features:**
- Room booking
- Check-in/out
- Housekeeping
- Billing
- Guest management

### 3. Salon & Fitness

**Ecosystem:** `industry-os/healthcare-fitness-ecosystem`

| Service | Description |
|---------|-------------|
| `rez-fitness-service` | Gym management |
| `rez-healthcare-service` | Healthcare ops |
| `rez-pharmacy-service` | Pharmacy management |

**Features:**
- Appointment scheduling
- Membership management
- Class booking
- Treatment plans

### 4. REZ Mind (AI Services)

**Purpose:** AI-powered intelligence for each vertical

| Service | Vertical | Features |
|---------|---------|----------|
| `rez-mind-restaurant-service` | Restaurant | Demand forecasting, menu optimization |
| `rez-mind-hotel-service` | Hotel | Occupancy prediction, pricing |
| `rez-mind-salon-service` | Salon | Customer lifetime value |
| `rez-mind-fitness-service` | Fitness | Attendance prediction |
| `rez-mind-healthcare-service` | Healthcare | Patient insights |

---

## REZ-Intelligence (AI/ML Platform)

**"THE MOAT"** - AI-powered commerce intelligence

### Infrastructure Services

| Port | Service | Purpose |
|------|---------|---------|
| 4091 | Integration SDK | Unified SDK for all apps |
| 4092 | Identity Bridge | Cross-app user identity |
| 4008 | Event Platform | Event publishing |
| 4031 | Event Bus | Event distribution |

### Intelligence Services (Phase 1-4)

| Port | Service | Purpose |
|------|---------|---------|
| 4040 | Reorder Engine | Predict reorders |
| 4041 | Taste Profile | Consumer preferences |
| 4050 | Identity Graph | Unified identity |
| 4062 | Autonomous Agents | 30 AI agents |

### AI Agents (30 Total)

**Commerce Agents (15):**
1. DemandSignalAgent - Demand signals
2. ScarcityAgent - Stock scarcity detection
3. PriceElasticityAgent - Pricing optimization
4. ReorderPredictorAgent - Reorder predictions
5. TasteEvolutionAgent - Taste changes
6. ChurnRiskAgent - Customer churn
7. LTVPredictorAgent - Lifetime value
8. InventoryAlertAgent - Stock alerts
9. DemandForecastAgent - Demand prediction
10. CompetitorMonitorAgent - Market monitoring
11. TrendDetectorAgent - Trend analysis
12. PriceOptimizerAgent - Dynamic pricing
13. OfferMatcherAgent - Offer matching
14. CrossSellAgent - Cross-selling
15. UrgencyTriggerAgent - Urgency creation

**User Agents (15):**
1. PersonalizationAgent - User personalization
2. SegmentClassifierAgent - User segmentation
3. RecommendationQualityAgent - Quality control
4. EngagementScoreAgent - Engagement tracking
5. SessionAnalyzerAgent - Session analysis
6. SearchIntentAgent - Search understanding
7. BrowsePatternAgent - Browse patterns
8. PurchasePredictorAgent - Purchase prediction
9. CartRecoveryAgent - Cart abandonment
10. ReviewAnalyzerAgent - Review analysis
11. PreferenceLearningAgent - Preference learning
12. NotificationTimingAgent - Optimal timing
13. ChannelOptimizerAgent - Channel optimization
14. RetentionAgent - User retention
15. ReferralAgent - Referral optimization

### Integration Services

| Port | Service | Purpose |
|------|---------|---------|
| 4085 | Feedback Collector | Conversion tracking |
| 4090 | Unified Recommendations | All recommendations |
| 4093 | Notification Router | Push/SMS/Email |
| 4094 | Realtime Gateway | WebSocket events |

### Core Intelligence Services

| Port | Service | Purpose |
|------|---------|---------|
| 4050 | Identity Graph | Unified customer identity |
| 4060 | Knowledge Graph | Semantic entity relationships |
| 4061 | Merchant Brain | Merchant intelligence |
| 4070 | Payments Brain | Fraud detection |
| 4071 | Inventory Sync | Inventory predictions |
| 4072 | Creator Network | Creator intelligence |
| 4073 | Merchant OS | Merchant dashboard |

---

## RABTUL-Technologies (Core Platform)

**Shared Infrastructure Services**

### Core Business Services

| Service | Port | Purpose |
|---------|------|---------|
| `rez-auth-service` | 4002 | Authentication, JWT, OAuth |
| `rez-wallet-service` | 4001 | Wallet management |
| `rez-payment-service` | 4003 | Payment processing |
| `rez-order-service` | 4006 | Order management |
| `rez-catalog-service` | 4004 | Product catalog |
| `rez-booking-service` | 4007 | Reservations |
| `rez-delivery-service` | 4008 | Delivery tracking |

### Infrastructure Services

| Service | Purpose |
|---------|---------|
| `REZ-circuit-breaker` | Fault tolerance |
| `REZ-retry-service` | Automatic retries |
| `REZ-idempotency-service` | Idempotent operations |
| `REZ-dlq-service` | Dead letter queue |
| `REZ-secrets-manager` | Secret storage |
| `REZ-policy-engine` | Access policies |
| `REZ-observability-platform` | Monitoring |

### Messaging & Events

| Service | Purpose |
|---------|---------|
| `REZ-event-bus` | Event distribution |
| `REZ-notifications-hub` | Multi-channel notifications |
| `REZ-notifications-service` | Notification management |

### Cross-Cutting Services

| Service | Purpose |
|---------|---------|
| `REZ-cross-wallet-identity` | Unified wallet identity |
| `REZ-developer-platform` | Developer tools |
| `REZ-analytics-service` | Platform analytics |
| `REZ-audit-service` | Audit logging |
| `REZ-contracts` | Smart contracts |

---

## Service Connections

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           REZ PLATFORM                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        MERCHANT APPS                                  │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐  │   │
│  │  │ Merchant    │  │ Merchant    │  │ Merchant    │  │ Dashboard │  │   │
│  │  │ App (iOS)  │  │ App (Web)   │  │ POS         │  │ Analytics │  │   │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └─────┬─────┘  │   │
│  └─────────┼────────────────┼────────────────┼───────────────┼────────┘   │
│            │                │                │               │              │
│            └────────────────┴────────────────┴───────────────┘              │
│                                      │                                       │
│                                      ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                   REZ-MERCHANT-SERVICE (4005)                         │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │   │
│  │  │ Products │ │  Orders  │ │  Wallet  │ │ Loyalty  │ │Analytics │  │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                       │
│            ┌────────────────────────┼────────────────────────┐              │
│            │                        │                        │              │
│            ▼                        ▼                        ▼              │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐          │
│  │    RABTUL        │  │    REZ          │  │    INDUSTRY      │          │
│  │  TECHNOLOGIES    │  │  INTELLIGENCE   │  │     VERTICALS    │          │
│  ├──────────────────┤  ├──────────────────┤  ├──────────────────┤          │
│  │ Auth (4002)      │  │ Identity (4050) │  │ Restaurant       │          │
│  │ Wallet (4001)    │  │ Event Bus (4031)│  │ Hotel           │          │
│  │ Payment (4003)   │  │ AI Agents (4062)│  │ Salon/Fitness   │          │
│  │ Order (4006)      │  │ Reorder (4040)  │  │ Healthcare       │          │
│  │ Catalog (4004)    │  │ Taste (4041)    │  │ Pharmacy         │          │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Inter-Service Communication

```
┌─────────────────────────────────────────────────────────────────┐
│                    SERVICE CALL FLOWS                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Merchant App ──────► Merchant Service ──────► Auth Service      │
│       │                     │                     │              │
│       │                     │                     │              │
│       │                     ▼                     ▼              │
│       │              ┌────────────┐      ┌────────────┐       │
│       │              │   Wallet   │      │  Payment   │       │
│       │              │  Service   │◄────►│  Service   │       │
│       │              └────────────┘      └────────────┘       │
│       │                     │                     │              │
│       │                     └──────────┬──────────┘              │
│       │                                │                         │
│       │                                ▼                         │
│       │                         ┌────────────┐                  │
│       │                         │Order Service│                  │
│       │                         └────────────┘                  │
│       │                                │                         │
│       │                                ▼                         │
│       │                    ┌──────────────────┐                 │
│       └───────────────────►│REZ Intelligence │                 │
│                            │   Event Bus     │                 │
│                            └────────┬─────────┘                 │
│                                     │                           │
│                    ┌────────────────┼────────────────┐         │
│                    ▼                ▼                ▼         │
│             ┌──────────┐   ┌──────────┐   ┌──────────┐    │
│             │Identity  │   │AI Agents │   │Reorder   │    │
│             │Graph     │   │(30)      │   │Engine    │    │
│             └──────────┘   └──────────┘   └──────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        DATA FLOWS                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. USER EVENT                                                  │
│     Merchant App ──► Event Bus ──► Identity Graph               │
│                             │                                    │
│                             ▼                                    │
│                      AI Agents (30)                             │
│                             │                                    │
│                             ▼                                    │
│                   Recommendations Engine                        │
│                             │                                    │
│                             ▼                                    │
│                   Personalization Engine                         │
│                                                                  │
│  2. ORDER FLOW                                                  │
│     POS ──► Merchant Service ──► Order Service                  │
│                                  │                               │
│                                  ▼                               │
│                           Payment Service                        │
│                                  │                               │
│                                  ▼                               │
│                           Wallet Service                         │
│                             │                                    │
│                             ▼                                    │
│                      Settlement Service                          │
│                                                                  │
│  3. ANALYTICS FLOW                                              │
│     All Events ──► Event Bus ──► Analytics Service               │
│                                  │                               │
│                                  ▼                               │
│                           Dashboard                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend

| Layer | Technology |
|-------|------------|
| Mobile | React Native (Expo SDK 53) |
| Web Apps | Next.js 14 (App Router) |
| Desktop | Electron (POS) |
| Styling | Tailwind CSS |
| Charts | Recharts |
| State | Zustand |
| Forms | React Hook Form + Zod |

### Backend

| Layer | Technology |
|-------|------------|
| Runtime | Node.js 18+ |
| Framework | Express |
| API | REST + WebSocket |
| Database | MongoDB 7 |
| Cache | Redis |
| Queue | BullMQ |
| ORM | Mongoose |

### AI/ML

| Layer | Technology |
|-------|------------|
| Models | TensorFlow, PyTorch |
| Embeddings | OpenAI, local models |
| Agents | Custom + LangChain |
| Graph DB | Neo4j (knowledge graph) |
| Vector DB | Pinecone/Weaviate |

### Infrastructure

| Layer | Technology |
|-------|------------|
| Container | Docker |
| Deploy | Render, Vercel |
| CI/CD | GitHub Actions |
| Monitoring | Sentry, Prometheus |
| Logging | Winston |

---

## Security Architecture

### Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION FLOW                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────┐     ┌─────────────┐     ┌──────────────┐         │
│  │ Merchant│     │ Auth Service│     │ Merchant     │         │
│  │   App   │────►│  (4002)     │────►│  Service     │         │
│  └─────────┘     └──────┬──────┘     └──────────────┘         │
│       │                 │                                     │
│       │  1. Login       │  2. Verify                          │
│       │  (phone/OTP)    │     │                               │
│       │                 ▼     │                               │
│       │          ┌───────────┐│                              │
│       │          │ JWT Token  │◄─ 3. Issue Token              │
│       │          │ Generated  │                               │
│       │          └───────────┘                               │
│       │                 │                                     │
│       │                 │ 4. Signed with                       │
│       │                 │    JWT_SECRET                       │
│       │                 ▼                                     │
│       │          ┌───────────────┐                           │
│       └──────────│ Token in      │                           │
│                  │ Authorization  │                           │
│                  │ Header         │                           │
│                  └───────────────┘                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Security Features

| Feature | Implementation |
|---------|---------------|
| Auth | JWT + Refresh Tokens (30-day) |
| Encryption | AES-256-GCM |
| Hashing | PBKDF2, bcrypt |
| OTP | SHA-256 + Pepper |
| Webhooks | HMAC-SHA256 signatures |
| Rate Limiting | Redis-backed distributed |
| CORS | Origin whitelist |
| Headers | Helmet (HSTS, CSP) |
| Secrets | Environment variables |

---

## Industry-Specific Connections

### Restaurant Connection Map

```
┌─────────────────────────────────────────────────────────────────┐
│                     RESTAURANT ECOSYSTEM                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐                                                │
│  │  Merchant   │◄────── External Platforms                     │
│  │    App      │       ┌──────────┐                            │
│  └──────┬──────┘       │ Swiggy   │                            │
│         │              └──────────┘                            │
│         │              ┌──────────┐                            │
│         │              │ Zomato   │                            │
│         └──────────────┴──────────┴─────────────────────┐      │
│                          │                                │      │
│                          ▼                                ▼      │
│              ┌───────────────────────┐    ┌─────────────────┐ │
│              │    Merchant Service    │◄──►│Restaurant Service│ │
│              └───────────┬───────────┘    └────────┬────────┘ │
│                          │                          │           │
│         ┌────────────────┼────────────────────────┘           │
│         │                │                                    │
│         ▼                ▼                                    │
│  ┌─────────────┐  ┌──────────────┐                           │
│  │  POS       │  │ Menu Service │                           │
│  │  Service   │  └──────────────┘                           │
│  └──────┬─────┘                                             │
│         │                                                    │
│         ▼                                                    │
│  ┌────────────────┐                                         │
│  │ Kitchen Display│                                         │
│  │   System (KDS) │                                         │
│  └────────────────┘                                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Hotel Connection Map

```
┌─────────────────────────────────────────────────────────────────┐
│                      HOTEL ECOSYSTEM                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐     ┌────────────────┐                        │
│  │  Hotel OTA  │────►│ Booking Service │                        │
│  │    Apps     │     └───────┬────────┘                        │
│  └─────────────┘             │                                 │
│                              ▼                                 │
│                    ┌─────────────────┐                        │
│                    │ Hotel Service    │                        │
│                    └────────┬────────┘                        │
│                             │                                  │
│         ┌───────────────────┼───────────────────┐             │
│         ▼                   ▼                   ▼             │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐        │
│  │  Front Desk │   │ Housekeeping│   │   Billing   │        │
│  │   Module    │   │   Module    │   │   Module    │        │
│  └─────────────┘   └─────────────┘   └─────────────┘        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Deployment URLs

### Production

| Service | URL |
|---------|-----|
| Merchant Service | `rez-merchant-service.onrender.com` |
| Auth Service | `rez-auth-service.onrender.com` |
| Wallet Service | `rez-wallet-service.onrender.com` |
| Payment Service | `rez-payment-service.onrender.com` |
| Event Bus | `rez-event-bus.onrender.com` |

### Development (Local)

| Service | Port |
|---------|------|
| Merchant Service | 4005 |
| Auth Service | 4002 |
| Wallet Service | 4001 |
| Payment Service | 4003 |
| Order Service | 4006 |
| Event Bus | 4031 |
| Identity Graph | 4050 |

---

## Contact

- **Security:** security@rez.money
- **Platform:** platform@rez.money
- **Documentation:** See individual service README.md files

---

*This document is the Source of Truth for the REZ Platform architecture.*
