# RABTUL TECHNOLOGIES - COMPLETE COMPANY STRUCTURE
**Date:** June 13, 2026
**Version:** 2.0

---

## COMPANY OVERVIEW

**Name:** RABTUL Technologies
**Tagline:** Commerce Infrastructure & Merchant Operating Systems
**Positioning:** "Internal AWS + Stripe for the REZ Ecosystem, evolving to independent Commerce Infrastructure Cloud"

---

## COMPANY MISSION

Enable any business to build, scale, and optimize commerce operations through infrastructure-as-a-service.

---

## SERVICE PORT REGISTRY

### Core Infrastructure (Ports 4000-4019)

| Port | Service | Description | Status |
|------|---------|-------------|--------|
| 4000 | api-gateway | Routing, rate limiting, auth | ✅ Built |
| 4001 | rez-payment-service | Razorpay, UPI, webhooks | ✅ Built |
| 4002 | rez-auth-service | JWT, OTP, MFA, OAuth | ✅ Built |
| 4004 | rez-wallet-service | Coins, balance, loyalty | ✅ Built |
| 4006 | rez-order-service | Order lifecycle, FSM | ✅ Built |
| 4007 | rez-catalog-service | Products, inventory | ✅ Built |
| 4008 | rez-search-service | Full-text, autocomplete | ✅ Built |
| 4009 | rez-delivery-service | Driver tracking | ✅ Built |
| 4011 | rez-notifications-service | Push, SMS, email, WhatsApp | ✅ Built |
| 4013 | rez-profile-service | User profiles | ✅ Built |
| 4016 | rez-analytics-service | Dashboards, reports | ✅ Built |
| 4020 | rez-booking-service | Reservations | ✅ Built |

### Business Services (Ports 4020-4059)

| Port | Service | Description | Status |
|------|---------|-------------|--------|
| 4030 | REZ-circuit-breaker | Fault tolerance | ✅ Built |
| 4031 | REZ-retry-service | Exponential backoff | ✅ Built |
| 4032 | REZ-dlq-service | Dead letter queue | ✅ Built |
| 4033 | REZ-idempotency-service | Deduplication | ✅ Built |
| 4034 | REZ-policy-engine | Access control | ✅ Built |
| 4035 | REZ-secrets-manager | Encryption | ✅ Built |
| 4036 | REZ-developer-platform | SDK generation | ✅ Built |
| 4037 | rez-contracts | OpenAPI validation | ✅ Built |
| 4038 | rez-scheduler-service | Cron jobs | ✅ Built |
| 4040 | rez-gamification-service | Karma points | ✅ Built |
| 4041 | rez-cashback-service | Cashback | ✅ Built |
| 4042 | rez-bill-payments-service | Bills | ✅ Built |
| 4043 | rez-articles-service | Content | ✅ Built |
| **4055** | **REZ-treasury-os** | **Cash Mgmt, Investments, Forecasting** | ✅ **NEW** |
| 4044 | REZ-cod-intelligence | RTO prediction | ✅ Built |
| 4045 | REZ-sso-service | SSO | ✅ Built |
| 4046 | REZ-ai-agent-studio | Conversational AI | ✅ Built |
| 4047 | REZ-workflow-builder | Journey automation | ✅ Built |
| 4050 | REZ-checkout-optimization | 1-click checkout | ✅ Built |
| 4051 | REZ-woocommerce-connector | WooCommerce | ✅ Built |
| 4052 | REZ-logistics-aggregator | Multi-carrier | ✅ Built |

### Intelligence Services (Ports 4060-4099)

| Port | Service | Description | Status |
|------|---------|-------------|--------|
| 4060 | REZ-unified-identity | Identity resolution | ✅ Built |
| 4061 | REZ-unified-attribution | Attribution tracking | ✅ Built |
| 4062 | REZ-autonomous-agents | 8 AI agents | ✅ Built |
| 4063 | REZ-unified-notifications | Notification routing | ✅ Built |
| 4064 | REZ-dooh-targeting-feed | DOOH targeting | ✅ Built |
| 4065 | REZ-bootstrap-intelligence | Cold start | ✅ Built |
| 4068 | REZ-graph-service | Commerce graph | ✅ Built |
| 4070 | rez-prive-service | 6-Pillar loyalty | ✅ Built |
| 4082 | REZ-event-bus | Event streaming | ✅ Built |
| 4099 | REZ-cross-company-service | Cross-company | ✅ Built |

---

## ECONOMIC LAYER ARCHITECTURE ⭐ NEW

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    RABTUL Technologies - Economic Layer                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  WalletOS      │  LoyaltyOS      │  RewardsOS      │  ReferralOS           │
│  ───────────   │  ───────────    │  ───────────    │  ───────────          │
│  • Multi-curr  │  • Points       │  • Incentives   │  • Tracking           │
│  • Escrow      │  • Tiers        │  • Gamification  │  • Commission         │
│  • Transfers   │  • Cross-brand  │  • Badges       │  • Payouts            │
├────────────────┼─────────────────┼─────────────────┼───────────────────────┤
│  TreasuryOS ⭐  │  ReputationOS   │                 │                       │
│  ───────────   │  ───────────    │                 │                       │
│  • Cash Mgmt   │  • Trust Scores │                 │                       │
│  • Investments │  • Reviews      │                 │                       │
│  • Forecasting │  • Social Proof │                 │                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

### TreasuryOS (NEW) - Key Features

#### Cash Management
- Multi-Account Management (master, operating, reserve, escrow)
- Cash Pooling & Automated Sweeps
- Real-time Position Tracking
- Transaction Audit Trail

#### Investment Tracking
- Fixed Deposits, Mutual Funds, Bonds
- Mark-to-Market Updates
- Auto-Renewal at Maturity
- TDS Tracking

#### Forecast Optimization
- 13-Week Rolling Forecast
- Shortfall Prediction (4-week lookahead)
- Recovery Action Recommendations
- Variance Analysis

---

## PRODUCTS

### Product 1: RABTUL Core Platform

**Purpose:** Infrastructure services for developers and businesses

**Services:**
- Auth Service
- Payment Service
- Wallet Service
- Order Service
- Catalog Service
- Search Service
- Notifications Service
- Profile Service

**Pricing:**
| Tier | Price | Users | API Calls |
|------|-------|-------|-----------|
| Starter | ₹0 | 100 | 10k/mo |
| Growth | ₹2,999/mo | 1,000 | 100k/mo |
| Business | ₹9,999/mo | 10,000 | 1M/mo |
| Enterprise | Custom | Unlimited | Unlimited |

### Product 1.5: RABTUL Economic Layer ⭐ NEW

**Purpose:** Complete economic infrastructure for commerce

**Services (6 OS Layers):**
- **WalletOS**: Multi-currency, Escrow, Instant Transfers
- **LoyaltyOS**: Points, Tiers, Cross-brand Loyalty
- **RewardsOS**: Incentives, Gamification, Badges
- **ReferralOS**: Tracking, Commission, Payouts
- **TreasuryOS**: Cash Mgmt, Investments, Forecasting
- **ReputationOS**: Trust Scores, Reviews, Social Proof

**Pricing:**
| Tier | Price | Features |
|------|-------|----------|
| Starter | ₹0 | Basic wallet, 1 currency |
| Growth | ₹1,999/mo | Multi-currency, Loyalty |
| Business | ₹4,999/mo | Full Economic Layer |
| Enterprise | Custom | Custom integrations |

### Product 2: RABTUL QR Cloud

**Purpose:** QR-based commerce for merchants

**QR Types:**
- WebMenu QR (Restaurant ordering)
- Room QR (Hotel services)
- Verify QR (Product authenticity)
- Creator QR (Creator commerce)
- Ads QR (Offline attribution)
- Pay QR (Payments)

**Pricing:**
| Tier | Price | QR Types | Scans |
|------|-------|----------|-------|
| Starter | ₹299/mo | 1 | 100/mo |
| Growth | ₹799/mo | 3 | 1,000/mo |
| Business | ₹1,999/mo | All | 5,000/mo |
| Enterprise | Custom | Unlimited | Unlimited |

### Product 3: RABTUL MerchantOS

**Purpose:** Complete merchant operating system

**Modules:**
- KDS (Kitchen Display System)
- POS Integration
- Inventory Management
- Staff Management
- Loyalty Programs
- Analytics Dashboard

**Pricing:** ₹2,999 - ₹9,999/mo

### Product 4: RABTUL Consultancy

**Purpose:** Implementation and managed services

**Services:**
- Quick Start (₹25K)
- Implementation (₹1-5L)
- Enterprise (₹5-50L)
- Managed Services (₹50K-5L/mo)

---

## CLIENTS

### Tier 1: REZ Ecosystem (Internal)

| Company | Services Used |
|---------|---------------|
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

## ORGANIZATIONAL STRUCTURE

```
RABTUL Technologies
├── Core Platform Team
│   ├── Auth & Identity
│   ├── Payments & Wallet
│   ├── Orders & Catalog
│   └── Search & Discovery
│
├── QR Cloud Team
│   ├── QR Infrastructure
│   ├── Merchant Tools
│   └── Analytics
│
├── MerchantOS Team
│   ├── KDS
│   ├── POS Integration
│   └── Inventory
│
├── Intelligence Team
│   ├── AI/ML
│   ├── Attribution
│   └── Graph
│
├── Infrastructure Team
│   ├── DevOps
│   ├── Security
│   └── Observability
│
└── Consultancy Team
    ├── Implementation
    └── Managed Services
```

---

## TECHNICAL ARCHITECTURE

### Technology Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js 18+ |
| Framework | Express.js |
| Database | MongoDB |
| Cache | Redis |
| Queue | BullMQ |
| Real-time | Socket.io |
| Monitoring | OpenTelemetry |
| Error Tracking | Sentry |

### Service Communication

```
┌─────────────────────────────────────────────────────────────┐
│                     API Gateway (4000)                       │
│              Rate Limiting, Auth, Routing                    │
└─────────────────────────┬───────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│     Auth      │  │   Payment     │  │    Wallet     │
│    (4002)     │  │   (4001)      │  │   (4004)      │
└───────────────┘  └───────────────┘  └───────────────┘
        │                 │                 │
        └─────────────────┼─────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Event Bus (4082)                         │
│          Redis Pub/Sub + Kafka Producer                     │
└─────────────────────────────────────────────────────────────┘
```

---

## SERVICE NAMING CONVENTION

### Current → Target

| Current | Target | Status |
|---------|--------|--------|
| rez-auth-service | rabtul-auth | TODO |
| rez-payment-service | rabtul-payments | TODO |
| rez-wallet-service | rabtul-wallet | TODO |
| rez-order-service | rabtul-orders | TODO |
| rez-catalog-service | rabtul-catalog | TODO |
| rez-search-service | rabtul-search | TODO |
| rez-notifications-service | rabtul-notifications | TODO |
| rez-profile-service | rabtul-profiles | TODO |
| REZ-* | RABTUL-* | TODO |

---

## DOCKER SERVICES

### docker-compose.yml Services

```yaml
services:
  # Core
  api-gateway:         # 4000
  rez-auth-service:    # 4002
  rez-payment-service: # 4001
  rez-wallet-service:  # 4004
  rez-order-service:   # 4006
  rez-catalog-service: # 4007
  rez-search-service:  # 4008
  rez-delivery-service: # 4009
  rez-notifications-service: # 4011
  rez-profile-service: # 4013
  rez-analytics-service: # 4016
  rez-booking-service: # 4020

  # Infrastructure
  redis:
  mongodb:
  prometheus:
  grafana:
```

---

## SECURITY

### Implemented

- ✅ JWT Authentication
- ✅ OTP Verification
- ✅ MFA/TOTP
- ✅ Rate Limiting
- ✅ Webhook Verification
- ✅ Secrets Manager
- ✅ Policy Engine
- ✅ Circuit Breaker

### Needed

- [ ] SOC2 Compliance
- [ ] ISO 27001
- [ ] Penetration Testing
- [ ] Security Audit (External)

---

## REVENUE MODEL

| Revenue Stream | Model | Target |
|----------------|-------|--------|
| Core Platform SaaS | Subscription | ₹X L/mo |
| QR Cloud SaaS | Subscription | ₹X L/mo |
| MerchantOS SaaS | Subscription | ₹X L/mo |
| Consultancy | Project/Retainer | ₹X L/mo |
| Enterprise Contracts | Annual | ₹X L/yr |

---

## GROWTH STRATEGY

### Phase 1: Internal (Now)
- Serve REZ ecosystem
- Validate products
- Build reference customers

### Phase 2: Self-Serve SaaS (Next 6 months)
- Launch QR Cloud publicly
- SMB acquisition
- Developer platform

### Phase 3: Consultancy (Ongoing)
- Implementation services
- Agency partnerships
- Enterprise sales

### Phase 4: Scale (12-24 months)
- Enterprise contracts
- Government deals
- International expansion

---

## KEY METRICS

| Metric | Target | Timeline |
|--------|--------|----------|
| External Paying Customers | 100 | 6 months |
| QR Cloud Subscribers | 50 | 6 months |
| Monthly Revenue | ₹10L | 12 months |
| API Calls | 10M/mo | 12 months |
| SLA Uptime | 99.9% | Ongoing |

---

## ACTION ITEMS

### Immediate (Week 1-2)

1. [ ] Rename services `rez-*` → `rabtul-*`
2. [ ] Create pricing pages
3. [ ] Build landing page
4. [ ] Get first 5 external merchants on QR Cloud

### Short Term (Month 1)

1. [ ] Launch QR Cloud publicly
2. [ ] Create developer documentation
3. [ ] Build SDK npm package
4. [ ] Get first 20 paying customers

### Medium Term (Quarter 1-2)

1. [ ] Build agency partner program
2. [ ] Launch enterprise sales
3. [ ] Start consultancy practice
4. [ ] First ₹1L/month revenue

---

**Document Status:** Complete
**Next Review:** June 28, 2026
**Owner:** RABTUL Technologies
