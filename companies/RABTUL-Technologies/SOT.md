# RABTUL TECHNOLOGIES - SOURCE OF TRUTH
## Master Reference Document

**Version:** 5.0
**Date:** June 3, 2026

### Harvey AI Parity - Complete (Built June 3, 2026)

| Harvey Component | REZ Status | Port |
|-----------------|-------------|------|
| Workflow Builder UI | ✅ Built | 4302 |
| Agent Builder UI | ✅ Built | 4303 |
| Agent Marketplace | ✅ Built | 4304 |
| Contract Intelligence UI | ✅ Built | 4305 |
| Industry Workflow Templates | ✅ Built | 4306 |
| Human-in-Loop Approvals | ✅ Built | 4307 |
| Agent Observability | ✅ Built | 4308 |
| Document Processor | ✅ Built | 4309 |
| Workflow Executor | ✅ Built | 4310 |
| Knowledge Search | ✅ Built | 4311 |
| Session Manager | ✅ Built | 4312 |
| Webhook Service | ✅ Built | 4313 |
| Integration Connector | ✅ Built | 4314 |
| Pre-built Agent Templates | ✅ Built (8) | - |
**Owner:** RABTUL Technologies
**Status:** AUTHORITATIVE

---

## ⚠️ IMPORTANT: Git Workflow

**"ReZ Full App" is NOT a git repository.**

It is a **LOCAL FOLDER** containing multiple company repositories. Each company has its OWN git repo.

| Company Repo | Git Remote |
|--------------|------------|
| `RABTUL-Technologies/` | `github.com/imrejaul007/RABTUL-Technologies` |
| `REZ-Intelligence/` | `github.com/imrejaul007/REZ-Intelligence` |
| `REZ-Commerce/` | `github.com/imrejaul007/REZ-Commerce` |
| `REZ-Merchant/` | `github.com/imrejaul007/REZ-Merchant` |
| `REZ-Media/` | `github.com/imrejaul007/REZ-Media` |
| `StayOwn-Hospitality/` | `github.com/imrejaul007/StayOwn-Hospitality` |
| `CorpPerks/` | `github.com/imrejaul007/CorpPerks` |
| `RTNM-Group/` | `github.com/imrejaul007/RTNM-Group` |
| `RTNM-Digital/` | `github.com/imrejaul007/RTNM-Digital` |
| `RisnaEstate/` | `github.com/imrejaul007/RisnaEstate` |

**Rule:** ALWAYS work in the correct company directory. NEVER push to "ReZ Full App".

---

## 🏢 RABTUL TECHNOLOGIES

**Tagline:** Commerce Infrastructure & Merchant Operating Systems
**Positioning:** Infrastructure services powering the REZ ecosystem, evolving to independent Commerce Infrastructure Cloud

### Products

| Product | Description | Status |
|---------|-------------|--------|
| **REZ Core Platform** | Auth, Payments, Wallet, Orders, Catalog, Search, Notifications | ✅ Stable |
| **REZ QR Cloud** | Restaurant QR ordering, table management, payments | ✅ Stable v2.1 |
| **QR Cloud Service** | Port 4300 - MongoDB, Auth, WebSocket, Payments, Wallet | ✅ Stable v2.1 |
| **QR Cloud App** | Customer scan PWA + Merchant dashboard | ✅ Stable v2.1 |
| **QR Cloud Payments** | Razorpay/UPI integration | ✅ Stable v2.1 |

### NEW Products (May 30, 2026)

| Product | Port | Description | Status |
|---------|------|-------------|--------|
| **REZ BNPL Service** | 4300 | Buy Now Pay Later, EMI, Credit | ✅ NEW |
| **REZ Wallet** | 4004 | Coins, balance, cashback | ✅ |
| **REZ Payment** | 4001 | Razorpay, UPI, Cards | ✅ |
| **REZ Auth** | 4002 | JWT, OTP, OAuth | ✅ |

### Financial Services

| Service | Port | Purpose | Status |
|---------|------|---------|--------|
| REZ Payment Service | 4001 | Razorpay, UPI, Cards | ✅ |
| REZ Wallet Service | 4004 | Coins, Balance, Cashback | ✅ |
| REZ BNPL Service | 4300 | EMI, Credit, Deferred | ✅ NEW |
| REZ Payroll | - | Employee payroll | ✅ |
| REZ Bill Payments | - | Utility bills | ✅ |
| **QR Cloud Offers** | Coupons, discounts, rewards | ✅ Stable v2.1 |
| **REZ SDK** | @rez/sdk - TypeScript SDK for developers | ✅ Stable |
| **REZ Consultancy** | Implementation & managed services | ✅ Available |
| **REZ QR Ecosystem** | 17+ QR types across 10+ companies | ✅ Complete |

---

## QR ECOSYSTEM

**Full Documentation:** [QR-ECOSYSTEM-RABTUL.md](QR-ECOSYSTEM-RABTUL.md)

### QR Types by Company

| Company | QR Types | Status |
|---------|----------|--------|
| **REZ-Consumer** | Safe (15 modes), Verify, Creator, ReZ Now, ReZ Menu | ✅ 5 Complete |
| **REZ-Media** | Ads QR, Shelf QR | ✅ 2 Complete |
| **StayOwn** | Room QR | ✅ 1 Complete |
| **REZ-Merchant** | Salon QR | ✅ 1 Complete |
| **REZ-Intelligence** | QR Campaigns | ✅ 1 Complete |
| **RABTUL-Technologies** | QR Cloud (7 types) | ⚠️ 7 Partial |

### Total: 17+ QR Types

### Safe QR - 15 Emergency Modes

| Mode | Purpose |
|------|---------|
| Pet, Personal, Device, Medical, Helmet, Child | Safety |
| Vehicle, Bicycle, Key, Luggage | Lost & Found |
| Home, Office, Event, Student, Package | Context |

---

## QR CLOUD PRODUCT DETAILS

### QR Cloud Service (Port 4300) - STABILIZED v2.1

**Location:** `rez-qr-cloud-service/`

**GitHub:** `github.com/imrejaul007/RABTUL-Technologies/tree/main/rez-qr-cloud-service`

**Features:**
- ✅ MongoDB Database (data persistence)
- ✅ API Key Authentication (secure)
- ✅ WebSocket (real-time orders & scans)
- ✅ Razorpay/UPI Payment Integration
- ✅ RABTUL Wallet Integration
- ✅ Event Bus (real-time events)
- ✅ Rate Limiting (abuse prevention)
- ✅ Offers/Coupons System
- ✅ QR Download & Print
- ✅ Merchant management
- ✅ QR code generation (7 types)
- ✅ Menu management
- ✅ Order processing
- ✅ Analytics & Scan tracking

**Models:**
- Merchant (with API key)
- QRCode (with scan tracking)
- Category, MenuItem
- Order (with payment status)
- ScanEvent
- Offer

**Documentation:**
- [README.md](rez-qr-cloud-service/README.md) - Complete documentation
- [DEPLOY-STEPS.md](rez-qr-cloud-service/DEPLOY-STEPS.md) - Step-by-step deployment
- [MONGODB-ATLAS-SETUP.md](rez-qr-cloud-service/MONGODB-ATLAS-SETUP.md) - Database setup
- [MERCHANT-ACQUISITION.md](rez-qr-cloud-service/MERCHANT-ACQUISITION.md) - Sales scripts

**Endpoints:**
```
PUBLIC:
/api/resolve/:code      - Resolve QR from scan
/api/public/menu/:id    - Get public menu
/api/public/offers/:id  - Get active offers
/api/orders             - Create order
/api/orders/:id/upi-qr  - Get UPI QR for payment

AUTHENTICATED:
/api/merchants          - Merchant CRUD
/api/qr                 - QR code management
/api/qr/:id/download    - Download QR PNG
/api/qr/:id/print      - Print QR
/api/menu               - Get menu
/api/categories         - Manage categories
/api/items              - Manage menu items
/api/orders             - Order management
/api/offers             - Manage offers
/api/analytics          - Analytics
/api/scans              - Scan events
/api/payments           - Payment endpoints
```

**SDK Methods:**
```typescript
const rez = new REZ({ apiKey: '...' });

// Create merchant (returns API key)
await rez.qr.createMerchant({ name: 'Pizza Palace', slug: 'pizza-palace', type: 'restaurant', phone: '+919876543210' });

// Use returned API key for authenticated requests
rez.qr.setApiKey(apiKey);

// Create QR
await rez.qr.createQR({ type: 'menu', name: 'Table 1', targetId: 'table-1' });

// Get menu
await rez.qr.getMenu(merchantId);

// Create order
await rez.qr.createOrder({ customerPhone, type: 'dine_in', items: [...] });

// Initiate payment
await rez.qr.initiatePayment(orderId);

// Get UPI QR
await rez.qr.getUPIQrCode(orderId);

// Create offer
await rez.qr.createOffer({ name: '10% OFF', type: 'percentage', value: 10 });

// Get analytics
await rez.qr.getAnalytics();
```

### QR Cloud Apps

**Landing Page:** `rez-qr-cloud-app/landing.html`
- Merchant-facing landing page
- Features, pricing, demo form
- Signup integration

**Customer App:** `rez-qr-cloud-app/index.html`
- Mobile-friendly PWA
- Scan QR → See Menu → Add to Cart → Place Order
- Works on any device

**Merchant Dashboard:** `rez-qr-cloud-app/dashboard.html`
- Login with API Key
- View orders in real-time (WebSocket)
- Manage QR codes (download/print)
- Manage menu
- View analytics
- Notifications

---

## 📊 SERVICE INVENTORY

### Core Infrastructure Services (Ports 4000-4019)

| Port | Service | Description | Status |
|------|---------|-------------|--------|
| 4000 | api-gateway | Routing, rate limiting, auth | ✅ Stable |
| 4001 | rez-payment-service | Razorpay, UPI, webhooks | ✅ Stable |
| 4002 | rez-auth-service | JWT, OTP, MFA, OAuth | ✅ Stable |
| 4004 | rez-wallet-service | Coins, balance, loyalty | ✅ Stable |
| 4006 | rez-order-service | Order lifecycle, FSM | ✅ Stable |
| 4007 | rez-catalog-service | Products, inventory | ✅ Stable |
| 4008 | rez-search-service | Full-text, autocomplete | ✅ Stable |
| 4009 | rez-delivery-service | Driver tracking | ✅ Stable |
| 4011 | rez-notifications-service | Push, SMS, email, WhatsApp | ✅ Stable |
| 4013 | rez-profile-service | User profiles | ✅ Stable |
| 4016 | rez-analytics-service | Dashboards, reports | ✅ Stable |
| 4020 | rez-booking-service | Reservations | ✅ Stable |

### Business Services (Ports 4020-4059)

| Port | Service | Description | Status |
|------|---------|-------------|--------|
| 4030 | REZ-circuit-breaker | Fault tolerance | ✅ Stable |
| 4031 | REZ-retry-service | Exponential backoff | ✅ Stable |
| 4032 | REZ-dlq-service | Dead letter queue | ✅ Stable |
| 4033 | REZ-idempotency-service | Deduplication | ✅ Stable |
| 4034 | REZ-policy-engine | Access control | ✅ Stable |
| 4035 | REZ-secrets-manager | Encryption | ✅ Stable |
| 4036 | REZ-developer-platform | SDK generation | ✅ Stable |
| 4037 | rez-contracts | OpenAPI validation | ✅ Stable |
| 4038 | rez-scheduler-service | Cron jobs | ✅ Stable |
| 4040 | rez-gamification-service | Karma points | ✅ Stable |
| 4041 | rez-cashback-service | Cashback | ✅ Stable |
| 4042 | rez-bill-payments-service | Bills | ✅ Stable |
| 4043 | rez-articles-service | Content | ✅ Stable |
| 4044 | REZ-cod-intelligence | RTO prediction | ✅ Stable |
| 4045 | REZ-sso-service | SSO | ✅ Stable |
| 4046 | REZ-ai-agent-studio | Conversational AI | ✅ Stable |
| 4047 | REZ-workflow-builder | Journey automation | ✅ Stable |
| 4050 | REZ-checkout-optimization | 1-click checkout | ✅ Stable |
| 4051 | REZ-woocommerce-connector | WooCommerce | ✅ Stable |
| 4052 | REZ-logistics-aggregator | Multi-carrier | ✅ Stable |

### Intelligence Services (Ports 4060-4129)

| Port | Service | Description | Status |
|------|---------|-------------|--------|
| 4060 | REZ-unified-identity | Identity resolution | ✅ Stable |
| 4061 | REZ-unified-attribution | Attribution tracking | ✅ Stable |
| 4062 | REZ-autonomous-agents | 8 AI agents | ✅ Stable |
| 4063 | REZ-unified-notifications | Notification routing | ✅ Stable |
| 4064 | REZ-dooh-targeting-feed | DOOH targeting | ✅ Stable |
| 4065 | REZ-bootstrap-intelligence | Cold start | ✅ Stable |
| 4068 | REZ-graph-service | Commerce graph | ✅ Stable |
| 4070 | rez-prive-service | 6-Pillar loyalty | ✅ Stable |
| 4082 | REZ-event-bus | Event streaming | ✅ Stable |
| 4099 | REZ-cross-company-service | Cross-company | ✅ Stable |
| 4120 | REZ-unified-profile | User profile | ✅ Stable |
| 4121 | REZ-signal-aggregator | Signal collection | ✅ Stable |
| 4122 | REZ-merchant-intelligence | Merchant analytics | ✅ Stable |
| 4126 | REZ-realtime-segments | Real-time segments | ✅ Stable |
| 4129 | REZ-graph-service | Graph database | ✅ Stable |
| 4800 | REZ-autonomous-loop | OADA Loop (Polsia) | ✅ NEW |
| 4801 | REZ-company-memory | Business Entity State | ✅ NEW |
| 4802 | REZ-live-action-feed | Live Action Monitoring | ✅ NEW |
| **4210** | **REZ-memory-cloud** | **Memory Cloud (Supermemory parity)** | **✅ NEW** |
| - | **REZ-memory-extension** | **Browser Extension (cross-site memory capture)** | **✅ NEW** |
| - | **REZ-memory-client** | **SDK (@rez/memory-client)** | **✅ NEW** |
| **4301** | **REZ-memory-ui** | **React Frontend** | **✅ NEW** |
| **4302** | **REZ-workflow-builder-ui** | **Visual Workflow Editor** | **✅ NEW** |
| **4303** | **REZ-agent-builder-ui** | **Agent Creation Interface** | **✅ NEW** |
| **4304** | **REZ-agent-marketplace** | **Agent Templates & Catalog** | **✅ NEW** |
| **4305** | **REZ-contract-intelligence-ui** | **Document Analysis UI** | **✅ NEW** |
| **4306** | **REZ-workflow-templates-service** | **Industry Workflow Templates** | **✅ NEW** |
| **4307** | **REZ-approval-service** | **Human-in-Loop Approvals** | **✅ NEW** |
| **4308** | **REZ-agent-observability** | **Execution Tracing & Metrics** | **✅ NEW** |
| **4309** | **REZ-document-processor** | **PDF/DOCX Parsing & NER** | **✅ NEW** |
| **4310** | **REZ-workflow-executor** | **Workflow Execution Engine** | **✅ NEW** |
| **4311** | **REZ-knowledge-search** | **Vector Search & Hybrid Search** | **✅ NEW** |
| **4312** | **REZ-session-manager** | **AI Agent Session Management** | **✅ NEW** |
| **4313** | **REZ-webhook-service** | **Webhook Management** | **✅ NEW** |
| **4314** | **REZ-integration-connector** | **External System Connectors** | **✅ NEW** |
| **4315** | **REZ-data-pipeline** | **Data Orchestration** | **✅ NEW** |
| **4316** | **REZ-audit-log** | **Audit Logging & Compliance** | **✅ NEW** |
| **4317** | **REZ-config-manager** | **Configuration & Feature Flags** | **✅ NEW** |
| **4318** | **REZ-rate-limiter** | **Advanced Rate Limiting** | **✅ NEW** |
| **4319** | **REZ-cache-service** | **In-Memory Caching** | **✅ NEW** |
| **4320** | **REZ-scheduler** | **Job Scheduling** | **✅ NEW** |
| **4141** | **REZ-data-enrichment-service** | **Data Enrichment** | **✅ NEW** |
| **4142** | **REZ-enrichment-workflow-builder** | **Data Enrichment** | **✅ NEW** |

### BuzzLocal Services

| Port | Service | Description | Status |
|------|---------|-------------|--------|
| - | buzzlocal-feed-service | Feed & posts | ✅ Stable |
| - | buzzlocal-community-service | Community features | ✅ Stable |
| - | buzzlocal-intelligence-service | AI intelligence | ✅ Stable |
| - | buzzlocal-notification-service | Push notifications | ✅ Stable |
| - | buzzlocal-payment-service | Payments | ✅ Stable |
| - | buzzlocal-realtime-service | WebSocket | ✅ Stable |
| - | buzzlocal-vibe-service | Crowd intelligence | ✅ Stable |
| - | buzzlocal-weather-service | Weather data | ✅ Stable |

---

## 📦 PRODUCTS

### REZ QR Cloud

**Tagline:** "QR codes that don't just link — they convert"

**QR Types:**
- WebMenu QR (Restaurant ordering)
- Room QR (Hotel services)
- Pay QR (Payments)
- Verify QR (Product authenticity)
- Creator QR (Creator commerce)
- Ads QR (Offline attribution)

**Pricing:**
| Tier | Price | QR Types | Scans |
|------|-------|----------|-------|
| Starter | ₹299/mo | 1 | 100/mo |
| Growth | ₹799/mo | 3 | 1,000/mo |
| Business | ₹1,999/mo | All | 5,000/mo |
| Enterprise | Custom | Unlimited | Unlimited |

**Documentation:** [docs/QR-CLOUD-PRODUCT.md](docs/QR-CLOUD-PRODUCT.md)

### REZ SDK

**Package:** @rez/sdk
**Purpose:** TypeScript SDK for all REZ services

**Installation:**
```bash
npm install @rez/sdk
```

**Usage:**
```typescript
import { REZ } from '@rez/sdk';

const rez = new REZ({ apiKey: 'your-api-key' });

// Use services
const user = await rez.auth.register({ email: 'user@example.com' });
```

**Documentation:** [docs/DEVELOPER-DOCUMENTATION.md](docs/DEVELOPER-DOCUMENTATION.md)

---

## 👥 CLIENTS

### Tier 1: REZ Ecosystem (Internal)

| Company | Services Used |
|---------|--------------|
| REZ Consumer | All core services |
| REZ Merchant | QR, POS, KDS |
| REZ Media | QR, Ads, Loyalty |
| Hojai AI | Auth, Events |
| KhairMove | Payments, Wallet |
| Karma Foundation | Loyalty, Notifications |
| RisaCare | Full stack |
| Airzy | Bookings, Payments |
| RisnaEstate | Auth, Wallet, Events |
| CorpPerks | Payments, Auth |

### Tier 2: External SaaS Customers

- SMBs (restaurants, hotels, salons)
- Startups
- Developers
- Self-serve via website

### Tier 3: Consultancy Clients

- Businesses needing implementation help
- Agencies (white-label)
- Enterprises (hospital chains, retail)
- Government (smart city)

### Tier 4: Strategic Partners

- Payment gateways
- POS companies
- Accounting/CRM/ERP vendors
- Delivery platforms

---

## 🔧 SERVICE URLs

### Production

```bash
# API Gateway
API_GATEWAY_URL=https://rez-api-gateway.onrender.com

# Core Services
AUTH_SERVICE_URL=https://rez-auth-service.onrender.com
PAYMENT_SERVICE_URL=https://rez-payment-service.onrender.com
WALLET_SERVICE_URL=https://rez-wallet-service-36vo.onrender.com
ORDER_SERVICE_URL=https://rez-order-service.onrender.com
CATALOG_SERVICE_URL=https://rez-catalog-service-1.onrender.com
SEARCH_SERVICE_URL=https://rez-search-service.onrender.com
PROFILE_SERVICE_URL=https://rez-profile-service.onrender.com
BOOKING_SERVICE_URL=https://rez-booking-service.onrender.com

# Notifications & Analytics
NOTIFICATIONS_SERVICE_URL=https://rez-notifications-service.onrender.com
ANALYTICS_SERVICE_URL=https://rez-analytics-service.onrender.com

# Business Services
PRIVE_SERVICE_URL=https://rez-prive-service.onrender.com
DELIVERY_SERVICE_URL=https://rez-delivery-service.onrender.com
GAMIFICATION_SERVICE_URL=https://rez-gamification-service.onrender.com

# Intelligence
GRAPH_SERVICE_URL=http://localhost:4129
UNIFIED_IDENTITY_URL=http://localhost:4060
UNIFIED_ATTRIBUTION_URL=http://localhost:4061
UNIFIED_NOTIFICATIONS_URL=http://localhost:4063
EVENT_BUS_URL=http://localhost:4082
```

---

## 📁 DOCUMENTATION

| Document | Location | Purpose |
|---------|----------|---------|
| **This SOT** | `SOT.md` | Master reference |
| **RAP** | `RAP.md` | Service registry |
| **Governance** | `SERVICE-GOVERNANCE.md` | Rules |
| **Company Structure** | `COMPANY-STRUCTURE-MAY-2026.md` | Complete structure |
| **Strategic Audit** | `STRATEGIC-AUDIT-MAY-2026.md` | Strategic analysis |
| **Deep Audit** | `COMPLETE-DEEP-AUDIT-MAY-2026.md` | Technical audit |
| **Developer Docs** | `docs/DEVELOPER-DOCUMENTATION.md` | SDK documentation |
| **Landing Page** | `docs/LANDING-PAGE.md` | Marketing page |
| **Status Page** | `docs/STATUS-PAGE.md` | Service status |
| **QR Cloud** | `docs/QR-CLOUD-PRODUCT.md` | Product page |
| **QR Cloud README** | `rez-qr-cloud-service/README.md` | Full documentation |
| **QR Cloud Deploy** | `rez-qr-cloud-service/DEPLOY-STEPS.md` | Step-by-step deploy |
| **QR Cloud MongoDB** | `rez-qr-cloud-service/MONGODB-ATLAS-SETUP.md` | Database setup |
| **QR Cloud Sales** | `rez-qr-cloud-service/MERCHANT-ACQUISITION.md` | Sales scripts |
| **QR Cloud Landing** | `rez-qr-cloud-app/landing.html` | Merchant landing page |
| **SDK** | `sdk/src/index.ts` | TypeScript SDK |

---

## 🌐 COMPANY ECOSYSTEM - CROSS-REFERENCE

### All Company SOTs

| Company | GitHub | Services | SOT |
|---------|--------|----------|-----|
| **RABTUL-Technologies** | [RABTUL-Technologies](https://github.com/imrejaul007/RABTUL-Technologies) | 100+ | ✅ Master |
| **REZ-Intelligence** | [REZ-Intelligence](https://github.com/imrejaul007/REZ-Intelligence) | 194 | ✅ [SOT.md](https://github.com/imrejaul007/REZ-Intelligence/blob/main/SOT.md) |
| **REZ-Consumer** | [rez-app-consumer](https://github.com/imrejaul007/rez-app-consumer) | Consumer App | ✅ [SOT.md](https://github.com/imrejaul007/rez-app-consumer/blob/main/SOT.md) |
| **REZ-Merchant** | [REZ-Merchant](https://github.com/imrejaul007/REZ-Merchant) | Merchant Tools | ✅ [SOT.md](https://github.com/imrejaul007/REZ-Merchant/blob/main/SOT.md) |
| **REZ-Media/AdBazaar** | [REZ-Media](https://github.com/imrejaul007/REZ-Media) | Ads, Marketing | ✅ [SOT.md](https://github.com/imrejaul007/REZ-Media/blob/main/SOT.md) |
| **KHAIRMOVE** | [KHAIRMOVE](https://github.com/imrejaul007/KHAIRMOVE) | Rides, Delivery | ✅ [AUDIT.md](https://github.com/imrejaul007/KHAIRMOVE/blob/main/AUDIT.md) |
| **Karma-Foundation** | [Karma-Foundation](https://github.com/imrejaul007/Karma-Foundation) | Loyalty, CSR | ✅ [CLAUDE.md](https://github.com/imrejaul007/Karma-Foundation/blob/main/CLAUDE.md) |
| **CorpPerks** | [CorpPerks](https://github.com/imrejaul007/CorpPerks) | HR, Benefits | ✅ [SOT.md](https://github.com/imrejaul007/CorpPerks/blob/main/SOT.md) |
| **RisaCare** | [RisaCare](https://github.com/imrejaul007/RisaCare) | Healthcare | ✅ [SOT.md](https://github.com/imrejaul007/RisaCare/blob/main/SOT.md) |
| **RisnaEstate** | [RisnaEstate](https://github.com/Imrejaul007/RisnaEstate) | Real Estate | ✅ [SOT.md](https://github.com/Imrejaul007/RisnaEstate/blob/main/SOT.md) |
| **StayOwn-Hospitality** | [StayOwn-Hospitality](https://github.com/imrejaul007/StayOwn-Hospitality) | Hotels | ✅ [SOT.md](https://github.com/imrejaul007/StayOwn-Hospitality/blob/main/SOT.md) |
| **RTNM-Group/RidZa** | [RTNM-Group](https://github.com/imrejaul007/RTNM-Group) | Finance, Insurance | ✅ [SOT.md](https://github.com/imrejaul007/RTNM-Group/blob/main/SOT.md) |
| **RTNM-Digital** | [RTNM-Digital](https://github.com/imrejaul007/RTNM-Digital) | Digital Services | ⚠️ Partial |
| **HOJAI-AI** | [hojai-ai](https://github.com/imrejaul007/hojai-ai) | AI Agents | ✅ [AUDIT](https://github.com/imrejaul007/hojai-ai/blob/main/CLAUDE.md) |

### Ecosystem Summary

| Metric | Count |
|--------|-------|
| Total Companies | 13 |
| With SOT/CLAUDE | 13 |
| Services Built | 300+ |
| TypeScript Services | 250+ |

---

## 🎯 EXECUTION PLAN (90 Days)

### The One Metric

> **Paying merchants using QR Cloud with daily dependency**

### Phase 1: Learn (Day 1-30)
- Visit 50 merchants
- Get 5 to try QR Cloud
- Launch with 5 merchants
- Fix what breaks
- **Deliverable:** 3 paying merchants, validated workflow

### Phase 2: Refine (Day 31-60)
- Simplify based on learnings
- Get to 10 merchants
- First merchant referral
- **Deliverable:** 10 paying merchants, clear product

### Phase 3: Scale (Day 61-90)
- Document everything
- Create referral program
- Hire merchant success
- **Deliverable:** 20 paying merchants, repeatable process

---

## 🔒 GOVERNANCE RULES

### Core Principle

> **"If RABTUL has it → Use RABTUL. If RABTUL doesn't have it → Request RABTUL to create it."**

### Forbidden Patterns

| ❌ Forbidden | ✅ Use Instead |
|-------------|----------------|
| Create local auth | `rez-auth-service` |
| Create local payment | `rez-payment-service` |
| Create local wallet | `rez-wallet-service` |
| Create local order | `rez-order-service` |
| Create local search | `rez-search-service` |
| Create local notifications | `rez-notifications-service` |
| Create local analytics | `rez-analytics-service` |
| Create local profile | `rez-profile-service` |

---

## 🚀 QUICK START

### For Developers

```bash
# Install SDK
npm install @rez/sdk

# Use services
import { REZ } from '@rez/sdk';

const rez = new REZ({ apiKey: 'your-api-key' });
const user = await rez.auth.register({ email: 'user@example.com' });
```

### For Merchants

1. Visit [qr.rez.money](https://qr.rez.money)
2. Sign up for free trial
3. Generate your first QR code
4. Start accepting orders

---

## 📊 METRICS

| Metric | Current | Target |
|--------|---------|--------|
| Services | 100+ | 100+ |
| External Customers | 0 | 20 in 90 days |
| QR Cloud Subscribers | 0 | 10 in 90 days |
| Revenue | ₹0/mo | ₹5,000/mo in 90 days |

---

## 📞 SUPPORT

- **Documentation:** [docs.rez.money](https://docs.rez.money)
- **Status:** [status.rez.money](https://status.rez.money)
- **Support:** support@rez.money
- **GitHub:** github.com/rez-platform

---

**Last Updated:** June 3, 2026 (Night)
**Maintained By:** RABTUL Technologies
**Next Review:** June 28, 2026
