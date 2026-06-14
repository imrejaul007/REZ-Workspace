# RisnaEstate - Complete Services Reference

**Version:** 1.0.0
**Date:** June 12, 2026
**Status:** COMPLETE - All services documented

---

# TABLE OF CONTENTS

1. [RTNM Ecosystem Services](#1-rtnm-ecosystem-services)
2. [HOJAI AI Services](#2-hojai-ai-services)
3. [RABTUL Technologies Services](#3-rabtul-technologies-services)
4. [AdBazaar Services](#4-adbazaar-services)
5. [Nexha Services](#5-nexha-services)
6. [RisnaEstate Services](#6-risnaestate-services)
7. [All Service Ports Reference](#7-all-service-ports-reference)
8. [API Endpoints](#8-api-endpoints)

---

# 1. RTNM ECOSYSTEM SERVICES

## Ecosystem Overview

```
RTNM Digital (Parent Company)
│
├── HOJAI AI (Port 4520-5140) ──────────────→ AI Services
├── RABTUL Technologies (Port 4001-4068) ───→ Infrastructure
├── AdBazaar (Port 4700-4710) ──────────────→ Marketing
├── Nexha (Port 5002) ──────────────────────→ Commerce
├── CorpPerks (Port 4720) ──────────────────→ HR/Workforce
├── RisaCare (Port 4800) ───────────────────→ Healthcare
├── StayOwn (Port 4801) ───────────────────→ Hospitality
├── RisnaEstate (Port 3000-4129) ←─────────── YOU ARE HERE
├── REZ Consumer (Port 4600-4650) ─────────→ Consumer Apps
├── REZ Merchant (Port 4650-4700) ──────────→ Merchant Platform
├── KHAIRMOVE (Port 4600) ─────────────────→ Mobility
├── LawGens (Port 4750) ────────────────────→ Legal
├── RIDZA (Port 4750) ─────────────────────→ Finance
├── AssetMind (Port 5001) ──────────────────→ Financial Intel
├── Axom (Port 4800) ───────────────────────→ Future Tech
└── Karma Foundation (Port 4700) ──────────→ Social Impact
```

---

# 2. HOJAI AI SERVICES

## 2.1 Core HOJAI Services

| Service | Port | Category | Purpose |
|---------|------|----------|---------|
| **HOJAI Bridge** | 5140 | Universal Connector | Connect all HOJAI products to SkillNet |
| **HOJAI Memory** | 4520 | Core Platform | Vector store, timeline, semantic search |
| **HOJAI Intelligence** | 4530 | Core Platform | ML predictions, anomaly detection |
| **HOJAI Agents** | 4550 | Core Platform | Agent orchestration, scheduling |
| **HOJAI Event Bus** | 4560 | Core Platform | Pub/sub, streaming, real-time events |
| **HOJAI Workflows** | 4570 | Core Platform | Automation, triggers, conditions |
| **HOJAI Communications** | 4580 | Core Platform | WhatsApp, SMS, Email, Push |
| **HOJAI Hyperlocal** | 4590 | Core Platform | Geo intelligence, location services |
| **HOJAI Data** | 4600 | Core Platform | Feature store, data pipeline |
| **HOJAI Governance** | 4610 | Core Platform | RBAC, audit logs, permissions |
| **HOJAI Identity** | 4620 | Core Platform | Identity management, verification |
| **HOJAI Analytics** | 4630 | Core Platform | Dashboards, metrics, reporting |

## 2.2 HOJAI Product Services

| Service | Port | Category | Purpose |
|---------|------|----------|---------|
| **BrandPulse** | 4770 | Brand Intelligence | Brand analysis, sentiment tracking |
| **HIB** | 3053 | Human Intelligence | Code analysis, document summarization |
| **AssetMind** | 5001 | Financial Intelligence | Investor overview, market sentiment |
| **Nexha** | 5002 | Commerce Network | Franchise, distribution, procurement |
| **RisaCare** | 4800 | Healthcare Intelligence | Patient management, telemedicine |
| **StayOwn** | 4801 | Hospitality Intelligence | Property management, booking engine |
| **CorpPerks** | 4720 | Workforce Intelligence | Employee benefits, payroll |
| **KHAIRMOVE** | 4600 | Mobility Intelligence | Ride hailing, delivery, fleet |
| **Genie OS** | 4703 | Personal AI | Personal assistant, smart suggestions |
| **Industry AI** | 4750 | Industry Intelligence | Healthcare, finance, legal AI |

## 2.3 HOJAI SkillNet - LearningOS (5105-5119)

| Service | Port | Purpose |
|---------|------|---------|
| **Core Training** | 5105 | Training job management, model registry |
| **reward-engine** | 5106 | Industry-specific reward functions |
| **evaluation-engine** | 5107 | Agent benchmarking & scoring |
| **feedback-service** | 5108 | RLHF, thumbs up/down, corrections |
| **genome-registry** | 5109 | Agent DNA & version tracking |
| **evolution-engine** | 5110 | A/B testing & mutations |
| **simulation-engine** | 5111 | What-if scenarios |
| **decision-graph** | 5112 | Decision tracking |
| **knowledge-extractor** | 5113 | Experience → playbooks |
| **twin-learning** | 5114 | Human/Company/Asset twins |
| **industry-federation** | 5115 | Cross-org network learning |
| **memory-learning-connector** | 5116 | MemoryOS → LearningOS bridge |
| **autonomous-reward-discovery** | 5117 | Auto-learn reward weights |
| **learning-graph** | 5118 | Visual learning relationships |
| **learning-skill-marketplace** | 5119 | Install/manage learning skills |

## 2.4 HOJAI Bridge Endpoints

| Route | Description |
|-------|-------------|
| `GET /api/products` | List all connected products |
| `GET /api/products/:id/status` | Check product health |
| `GET /api/brandpulse/:company` | Get brand analysis |
| `POST /api/hib/code/analyze` | Analyze code |
| `GET /api/assetmind/:company/overview` | Investor overview |
| `GET /api/nexha/:company/franchise` | Franchise data |
| `GET /api/memory/:userId` | Get memory context |
| `GET /api/intelligence/insights` | Get ML insights |
| `POST /api/skillnet/execute` | Execute skill with context |
| `POST /api/skillnet/train` | Train with cross-product data |
| `GET /api/unified/:userId` | Unified user intelligence |
| `GET /api/insights/cross-product` | Cross-product insights |
| `GET /api/services/status` | All services status |

---

# 3. RABTUL TECHNOLOGIES SERVICES

## 3.1 Core RABTUL Services

| Service | Port | Purpose |
|---------|------|---------|
| **REZ Auth** | 4002 | JWT, OTP, MFA authentication |
| **REZ Payment** | 4001 | Razorpay, UPI, payments |
| **REZ Wallet** | 4004 | REZ Coins, cashback, payouts |
| **REZ Notifications** | 4011 | Push, SMS, WhatsApp, Email |
| **REZ Event Bus** | 4025 | Pub/sub, real-time events |
| **REZ Media** | 4068 | Campaigns, DOOH, QR codes |
| **REZ Intelligence** | 4018 | NRI/HNI/Investor scoring |
| **REZ Data** | 4030 | Data pipeline, analytics |

## 3.2 REZ Auth Endpoints

| Route | Method | Description |
|-------|--------|-------------|
| `POST /api/auth/register` | POST | User registration |
| `POST /api/auth/login` | POST | User login |
| `POST /api/auth/verify-otp` | POST | OTP verification |
| `POST /api/auth/forgot-password` | POST | Password reset |
| `POST /api/auth/refresh` | POST | Token refresh |
| `GET /api/auth/profile` | GET | Get user profile |
| `PUT /api/auth/profile` | PUT | Update profile |

## 3.3 REZ Payment Endpoints

| Route | Method | Description |
|-------|--------|-------------|
| `POST /api/payments/create` | POST | Create payment order |
| `POST /api/payments/verify` | POST | Verify payment |
| `POST /api/payments/refund` | POST | Process refund |
| `GET /api/payments/history` | GET | Payment history |
| `POST /api/payments/webhook` | POST | Payment gateway webhook |

## 3.4 REZ Wallet Endpoints

| Route | Method | Description |
|-------|--------|-------------|
| `GET /api/wallet/balance` | GET | Get wallet balance |
| `POST /api/wallet/topup` | POST | Add funds |
| `POST /api/wallet/withdraw` | POST | Withdraw to bank |
| `POST /api/wallet/transfer` | POST | P2P transfer |
| `GET /api/wallet/transactions` | GET | Transaction history |

## 3.5 REZ Notifications Endpoints

| Route | Method | Description |
|-------|--------|-------------|
| `POST /api/notifications/send` | POST | Send notification |
| `POST /api/notifications/bulk` | POST | Bulk send |
| `GET /api/notifications/templates` | GET | List templates |
| `POST /api/notifications/templates` | POST | Create template |
| `GET /api/notifications/history` | GET | Notification history |

---

# 4. ADBAZAAR SERVICES

| Service | Port | Purpose |
|---------|------|---------|
| **Campaign Manager** | 4700 | Multi-channel campaign orchestration |
| **Ad Server** | 4701 | Programmatic ad serving |
| **DOOH Network** | 4702 | Digital out-of-home advertising |
| **QR Generator** | 4703 | Dynamic QR code generation |
| **Attribution Hub** | 4704 | Multi-touch attribution tracking |
| **Influencer Platform** | 4705 | Influencer discovery and management |

## AdBazaar Endpoints

| Route | Method | Description |
|-------|--------|-------------|
| `POST /api/campaigns` | POST | Create campaign |
| `GET /api/campaigns` | GET | List campaigns |
| `POST /api/campaigns/:id/pause` | POST | Pause campaign |
| `POST /api/campaigns/:id/resume` | POST | Resume campaign |
| `GET /api/campaigns/:id/stats` | GET | Campaign statistics |
| `POST /api/ads/attribution` | POST | Track attribution |

---

# 5. NEXHA SERVICES

| Service | Port | Purpose |
|---------|------|---------|
| **Franchise Network** | 5002 | Multi-brand franchise management |
| **Distribution Network** | 5003 | Supply chain optimization |
| **Procurement** | 5004 | Vendor management, purchasing |
| **Commerce Analytics** | 5005 | Sales intelligence, trends |

## Nexha Endpoints

| Route | Method | Description |
|-------|--------|-------------|
| `GET /api/franchise/:company/overview` | GET | Franchise network overview |
| `GET /api/distribution/:company/network` | GET | Distribution network |
| `GET /api/procurement/:company/overview` | GET | Procurement overview |

---

# 6. RISNAESTATE SERVICES

## 6.1 Core Services (7)

| Service | Port | Purpose |
|---------|------|---------|
| **risna-gateway** | 3000 | API Gateway, routing, auth |
| **risna-property-service** | 4100 | Property listings, search |
| **risna-lead-service** | 4101 | Lead capture, scoring |
| **risna-visa-service** | 4102 | Golden Visa eligibility |
| **risna-referral-service** | 4103 | Multi-level commissions |
| **risna-crm-service** | 4105 | Follow-ups, visits |
| **risna-media-service** | 4106 | Campaigns, marketing |

### Gateway Endpoints
```
GET  /health              - Health status
GET  /health/live         - Liveness probe
GET  /health/ready        - Readiness probe
POST /api/auth/register   - User registration
POST /api/auth/login      - User login
POST /api/auth/verify     - Token verification
GET  /api/v1/properties   - Property listings
GET  /api/v1/leads        - Lead management
GET  /api/v1/visa        - Golden Visa
GET  /api/v1/referrals    - Referrals
GET  /api/v1/brokers     - Broker network
GET  /api/v1/crm         - CRM
GET  /api/v1/media       - Media campaigns
```

### Property Service Endpoints
```
GET    /api/v1/properties              - List properties
GET    /api/v1/properties/:id          - Get property details
POST   /api/v1/properties              - Create property
PUT    /api/v1/properties/:id         - Update property
DELETE /api/v1/properties/:id         - Delete property
GET    /api/v1/properties/search      - Advanced search
GET    /api/v1/properties/nearby     - Nearby properties
GET    /api/v1/properties/similar/:id - Similar properties
```

### Lead Service Endpoints
```
GET    /api/v1/leads              - List leads
GET    /api/v1/leads/:id          - Get lead details
POST   /api/v1/leads              - Create lead
PUT    /api/v1/leads/:id          - Update lead
POST   /api/v1/leads/:id/score    - Score lead
POST   /api/v1/leads/:id/route    - Route lead to broker
GET    /api/v1/leads/stats        - Lead statistics
```

### Visa Service Endpoints
```
POST   /api/v1/visa/check-eligibility     - Check eligibility
POST   /api/v1/visa/apply                  - Submit application
GET    /api/v1/visa/application/:id         - Get application status
POST   /api/v1/visa/document-upload        - Upload document
GET    /api/v1/visa/document-checklist     - Get required documents
POST   /api/v1/visa/appointment             - Book appointment
GET    /api/v1/visa/fee-calculator          - Calculate fees
```

### Referral Service Endpoints
```
POST   /api/v1/referrals/register          - Register referral code
GET    /api/v1/referrals/:code            - Get referral info
POST   /api/v1/referrals/track            - Track conversion
GET    /api/v1/referrals/earnings          - View earnings
GET    /api/v1/referrals/downline          - View downline
POST   /api/v1/referrals/payout-request   - Request payout
GET    /api/v1/referrals/leaderboard       - Top referrers
```

### CRM Service Endpoints
```
GET    /api/v1/crm/tasks               - List tasks
POST   /api/v1/crm/tasks               - Create task
PUT    /api/v1/crm/tasks/:id           - Update task
POST   /api/v1/crm/visits              - Schedule visit
GET    /api/v1/crm/visits/:id          - Get visit details
POST   /api/v1/crm/visits/:id/complete - Complete visit
GET    /api/v1/crm/pipeline            - View pipeline
```

---

## 6.2 Transaction Services (3)

| Service | Port | Purpose |
|---------|------|---------|
| **risna-deal-service** | 4119 | Deal management |
| **risna-agreement-service** | 4127 | Contract generation |
| **risna-handover-service** | 4129 | Property handover |

### Deal Service Endpoints
```
POST   /api/v1/deals                   - Create deal
GET    /api/v1/deals                   - List deals
GET    /api/v1/deals/:id               - Get deal details
PUT    /api/v1/deals/:id               - Update deal
POST   /api/v1/deals/:id/negotiate     - Negotiate terms
POST   /api/v1/deals/:id/accept        - Accept offer
POST   /api/v1/deals/:id/reject        - Reject offer
POST   /api/v1/deals/:id/close         - Close deal
```

### Agreement Service Endpoints
```
POST   /api/v1/agreements              - Create agreement
GET    /api/v1/agreements              - List agreements
GET    /api/v1/agreements/:id          - Get agreement
PUT    /api/v1/agreements/:id          - Update agreement
POST   /api/v1/agreements/:id/sign     - Sign agreement
POST   /api/v1/agreements/:id/send     - Send for signature
GET    /api/v1/agreements/:id/status   - Signature status
GET    /api/v1/agreements/templates   - List templates
```

### Handover Service Endpoints
```
POST   /api/v1/handovers               - Create handover
GET    /api/v1/handovers               - List handovers
GET    /api/v1/handovers/:id           - Get handover details
POST   /api/v1/handovers/:id/schedule  - Schedule handover
POST   /api/v1/handovers/:id/inspect   - Submit inspection
POST   /api/v1/handovers/:id/complete  - Complete handover
POST   /api/v1/handovers/:id/snag      - Report snag
```

---

## 6.3 Intelligence Services (4)

| Service | Port | Purpose |
|---------|------|---------|
| **risna-intelligence-service** | 4110 | AI recommendations |
| **risna-whatsapp-service** | 4111 | WhatsApp integration |
| **risna-investment-service** | 4112 | Investment analysis |
| **risna-distribution-service** | 4113 | Distribution network |

### Intelligence Service Endpoints
```
GET    /api/v1/intelligence/recommendations/:userId  - Personalized recommendations
GET    /api/v1/intelligence/similar/:propertyId       - Similar properties
GET    /api/v1/intelligence/market/trends             - Market trends
GET    /api/v1/intelligence/market/price-index        - Price index
GET    /api/v1/intelligence/market/demand             - Demand analysis
GET    /api/v1/intelligence/user/:userId/profile     - User profile
```

### WhatsApp Service Endpoints
```
POST   /api/v1/whatsapp/webhook              - WhatsApp webhook
GET    /api/v1/whatsapp/webhook/verify       - Verify webhook
POST   /api/v1/whatsapp/send                 - Send message
POST   /api/v1/whatsapp/template             - Send template
GET    /api/v1/whatsapp/conversations        - List conversations
POST   /api/v1/whatsapp/broadcast            - Broadcast message
```

### Investment Service Endpoints
```
POST   /api/v1/investment/analyze             - Analyze property
GET    /api/v1/investment/portfolio/:userId   - User portfolio
POST   /api/v1/investment/scenario           - What-if scenarios
GET    /api/v1/investment/returns/:propertyId - Expected returns
GET    /api/v1/investment/risks/:propertyId  - Risk assessment
```

---

## 6.4 Platform Services (16)

| Service | Port | Purpose |
|---------|------|---------|
| **risna-notification-service** | 4108 | Push notifications |
| **risna-payment-service** | 4109 | Payment processing |
| **risna-builder-service** | 4107 | Builder ERP |
| **risna-booking-service** | 4120 | Booking system |
| **risna-corpperks-bridge** | 4114 | CorpPerks HR integration |
| **risna-ads-integration** | 4115 | AdBazaar ad integration |
| **risna-property-intelligence** | 4116 | Property AI |
| **risna-distribution-router** | 4117 | Distribution routing |
| **risna-influencer-tracker** | 4118 | Influencer tracking |
| **risna-realtime-service** | 4121 | Real-time updates |
| **risna-email-service** | 4122 | Email campaigns |
| **risna-chatbot-service** | 4123 | AI chatbot |
| **risna-document-service** | 4124 | Document management |
| **risna-virtual-tour-service** | 4125 | 360° tours |
| **risna-push-service** | 4126 | Push notifications |

---

# 7. ALL SERVICE PORTS REFERENCE

## Complete Port Map

| Port Range | Service | Company |
|-----------|---------|---------|
| **3000** | Gateway | RisnaEstate |
| **3053** | HIB | HOJAI AI |
| **4001** | REZ Payment | RABTUL |
| **4002** | REZ Auth | RABTUL |
| **4004** | REZ Wallet | RABTUL |
| **4011** | REZ Notifications | RABTUL |
| **4018** | REZ Intelligence | RABTUL |
| **4025** | REZ Event Bus | RABTUL |
| **4030** | REZ Data | RABTUL |
| **4068** | REZ Media | RABTUL |
| **4100** | Property Service | RisnaEstate |
| **4101** | Lead Service | RisnaEstate |
| **4102** | Visa Service | RisnaEstate |
| **4103** | Referral Service | RisnaEstate |
| **4104** | Broker Service | RisnaEstate |
| **4105** | CRM Service | RisnaEstate |
| **4106** | Media Service | RisnaEstate |
| **4107** | Builder Service | RisnaEstate |
| **4108** | Notification Service | RisnaEstate |
| **4109** | Payment Service | RisnaEstate |
| **4110** | Intelligence Service | RisnaEstate |
| **4111** | WhatsApp Service | RisnaEstate |
| **4112** | Investment Service | RisnaEstate |
| **4113** | Distribution Service | RisnaEstate |
| **4114** | CorpPerks Bridge | RisnaEstate |
| **4115** | Ads Integration | RisnaEstate |
| **4116** | Property Intelligence | RisnaEstate |
| **4117** | Distribution Router | RisnaEstate |
| **4118** | Influencer Tracker | RisnaEstate |
| **4119** | Deal Service | RisnaEstate |
| **4120** | Booking Service | RisnaEstate |
| **4121** | Realtime Service | RisnaEstate |
| **4122** | Email Service | RisnaEstate |
| **4123** | Chatbot Service | RisnaEstate |
| **4124** | Document Service | RisnaEstate |
| **4125** | Virtual Tour Service | RisnaEstate |
| **4126** | Push Service | RisnaEstate |
| **4127** | Agreement Service | RisnaEstate |
| **4129** | Handover Service | RisnaEstate |
| **4520** | HOJAI Memory | HOJAI AI |
| **4530** | HOJAI Intelligence | HOJAI AI |
| **4550** | HOJAI Agents | HOJAI AI |
| **4600** | KHAIRMOVE / HOJAI Hyperlocal | KHAIRMOVE / HOJAI AI |
| **4703** | Genie OS | HOJAI AI |
| **4720** | CorpPerks | HOJAI AI |
| **4750** | Industry AI / LawGens / RIDZA | HOJAI AI |
| **4770** | BrandPulse | HOJAI AI |
| **4800** | RisaCare / Axom | HOJAI AI |
| **4801** | StayOwn | HOJAI AI |
| **5001** | AssetMind | HOJAI AI |
| **5002** | Nexha | HOJAI AI |
| **5105-5119** | SkillNet Services | HOJAI AI |
| **5140** | HOJAI Bridge | HOJAI AI |

---

# 8. API ENDPOINTS

## 8.1 Gateway Routes (Proxied)

| Route | Service | Port |
|-------|---------|------|
| `/api/v1/properties/*` | risna-property-service | 4100 |
| `/api/v1/leads/*` | risna-lead-service | 4101 |
| `/api/v1/visa/*` | risna-visa-service | 4102 |
| `/api/v1/referrals/*` | risna-referral-service | 4103 |
| `/api/v1/brokers/*` | risna-broker-service | 4104 |
| `/api/v1/crm/*` | risna-crm-service | 4105 |
| `/api/v1/media/*` | risna-media-service | 4106 |
| `/api/v1/intelligence/*` | risna-intelligence-service | 4110 |
| `/api/v1/whatsapp/*` | risna-whatsapp-service | 4111 |
| `/api/v1/investment/*` | risna-investment-service | 4112 |
| `/api/v1/distribution/*` | risna-distribution-service | 4113 |
| `/api/v1/notifications/*` | risna-notification-service | 4108 |
| `/api/v1/payments/*` | risna-payment-service | 4109 |
| `/api/v1/bookings/*` | risna-booking-service | 4120 |
| `/api/v1/deals/*` | risna-deal-service | 4119 |
| `/api/v1/agreements/*` | risna-agreement-service | 4127 |
| `/api/v1/handovers/*` | risna-handover-service | 4129 |

## 8.2 Health Check Endpoints

| Service | Endpoint | Port |
|---------|----------|------|
| Gateway | `GET /health` | 3000 |
| Property | `GET /health` | 4100 |
| Lead | `GET /health` | 4101 |
| Visa | `GET /health` | 4102 |
| Referral | `GET /health` | 4103 |
| Broker | `GET /health` | 4104 |
| CRM | `GET /health` | 4105 |
| Media | `GET /health` | 4106 |
| Builder | `GET /health` | 4107 |
| Notification | `GET /health` | 4108 |
| Payment | `GET /health` | 4109 |
| Intelligence | `GET /health` | 4110 |
| WhatsApp | `GET /health` | 4111 |
| Investment | `GET /health` | 4112 |
| Distribution | `GET /health` | 4113 |

---

**Total Services:** 100+
**Total Ports:** 100+
**Status:** PRODUCTION READY

**Last Updated:** June 12, 2026