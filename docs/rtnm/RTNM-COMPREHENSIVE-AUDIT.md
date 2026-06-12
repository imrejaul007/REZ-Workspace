# RTNM COMPREHENSIVE AUDIT
## RTNM Digital + RTNM Group

**Date:** June 11, 2026 | **Status:** COMPLETE CONTROL SYSTEM

---

# PART 1: RTNM DIGITAL

## What is RTNM Digital?

**RTNM Digital** (aka REZ Ecosystem) is the **integration layer** that connects all 18+ sister companies. It provides:
- Unified Event Bus
- Service Contracts
- Central Context
- Execution Pipeline
- Observability

## RTNM Digital Components

```
RTNM Digital (Integration Layer)
│
├── REZ Integration Hub ──────→ Unified API, routing, rate limiting
├── REZ Attribution Engine ───→ Cross-service attribution (First/Last/Linear)
├── REZ Webhook Manager ──────→ Event webhooks
├── REZ Sync Service ──────────→ Data synchronization
└── RTNM Gateway ───────────────→ Enterprise portal (3000)
```

## RTNM Digital Services

| Port | Service | Purpose | Status |
|------|---------|---------|--------|
| 3000 | Unified API Gateway | Single entry point | ✅ |
| 3015 | SSO Service | Enterprise auth (SAML, OIDC) | ✅ |
| 3016 | Billing Service | Multi-product, GST invoicing | ✅ |
| 3001 | Help Center | Support portal | ✅ |
| 3017 | API Docs | Developer portal + SDKs | ✅ |
| 3010 | Integration Hub | Auto-provisioning | ✅ |
| 3018 | Connect Service | Service registry | ✅ |
| 3012 | Dashboard | Monitoring | ✅ |
| 4900 | REZ Integration Hub | Cross-service operations | ✅ |
| 4901 | Attribution Engine | Marketing attribution | ✅ |
| 4902 | Webhook Manager | Event management | ✅ |
| 4903 | Sync Service | Data sync | ✅ |

## RTNM Digital Event Schema

### Commerce Events
```
commerce.order.created
commerce.order.completed
commerce.inventory.low
commerce.payment.received
```

### Customer Events
```
customer.registered
customer.churn_risk
customer.segment_changed
customer.ltv_changed
```

### Marketing Events
```
marketing.campaign.launched
marketing.campaign.completed
marketing.offer.redeemed
```

### System Events
```
system.agent.heartbeat
system.execution.completed
system.risk.detected
```

## RTNM Digital Service Contracts

Every service exposes standardized contracts:

| Service | Actions |
|---------|---------|
| Business AI | analyze_goals, execute_campaign, adjust_pricing |
| Agent Orchestrator | create_task, execute_task |
| Merchant Service | get_orders, get_products |
| Engagement | create_campaign, send_notification |
| Ad AI | create_ad, optimize_ad |
| Wallet | credit, debit, get_balance |
| Notifications | send_push, send_email, send_sms |

---

# PART 2: RTNM GROUP

## What is RTNM Group?

**RTNM Group** is the **control center** for the entire ecosystem. It provides:
- Admin Panels (8 services)
- Identity & Security
- Finance Services
- Operations
- Inter-company Management

## RTNM Group Architecture

```
RTNM Group (Control Center)
│
├── Admin Panels ────────────────→ 8 admin services
├── Identity & Security ───────────→ Access control, Trust, Compliance
├── Finance ─────────────────────→ Ledger, BNPL, Capital, Billing
├── Operations ───────────────────→ Dashboards, Monitoring
└── Inter-Company ────────────────→ Ledger, Trust, Twins, Graph
```

---

# PART 3: COMPLETE CONTROL SYSTEM

## 1. ACCESS CONTROL (RBAC + ABAC)

### REZ Access Control Service

**Features:**
- RBAC Engine - Role-based with hierarchical roles
- ABAC Engine - Attribute-based policies
- Policy Engine - Combined evaluation
- Permission Manager - Fine-grained control
- Audit Logging - Complete access trails

**Default Roles:**
| Role | Level | Access |
|------|-------|--------|
| Super Admin | 100 | Unlimited |
| Admin | 90 | Administrative |
| Moderator | 70 | Content moderation |
| Editor | 50 | Content creation |
| Viewer | 10 | Read-only |
| Guest | 1 | Minimal |

**API:**
```
POST /api/v1/access/check          - Check access
GET  /api/v1/users/:id/permissions - User permissions
GET  /api/v1/audit/logs           - Query audit logs
```

---

## 2. TRUST MANAGEMENT

### RTNM Company Trust Service (Port 6007)

**Trust Score Calculation:**
```
OverallScore = (PaymentScore × 0.30) +
              (FulfillmentScore × 0.30) +
              (DisputeScore × 0.25) +
              (VerificationScore × 0.15)
```

**Risk Levels:**
| Score | Risk |
|-------|------|
| 70-100 | Low |
| 40-69 | Medium |
| 0-39 | High |

**API:**
```
GET  /api/trust/:corpId            - Get trust score
POST /api/trust/:corpId/update     - Update scores
GET  /api/trust/:corpId/history    - Trust history
GET  /api/trust                    - All scores
GET  /api/trust/leaderboard        - Top companies
GET  /api/trust/risk/:level        - By risk level
```

---

## 3. COMPLIANCE

### REZ Compliance Platform (GDPR/DPDP)

**Features:**
- Consent management
- Data subject rights
- Audit trails
- Data retention
- Breach notification

**API:**
```
POST /api/v1/consent                     - Record consent
POST /api/v1/data/access/:userId         - Right to access
POST /api/v1/data/erasure/:userId       - Right to erasure
POST /api/v1/data/portability/:userId   - Right to portability
GET  /api/v1/audit/logs                 - Query audit logs
```

---

## 4. FINANCIAL CONTROLS

### RTNM Inter-Company Ledger (Port 6004)

**Tracks transactions between all 22 companies**

**Transaction Types:**
| Type | Description |
|------|-------------|
| SERVICE_FEE | Fees for services |
| REVENUE_SHARE | Revenue sharing |
| API_USAGE | API usage charges |
| DATA_SHARING | Data sharing fees |
| MARKETING_FEE | Marketing campaigns |
| INFRASTRUCTURE_COST | Infra sharing |
| SUPPORT_FEE | Support services |
| REFERRAL_COMMISSION | Referral commissions |
| LOYALTY_REWARD | Loyalty rewards |
| SETTLEMENT | Final settlement |

**API:**
```
POST /api/entries                     - Create entry
GET  /api/balance/:corpId            - Company balance
GET  /api/balances                   - All balances
POST /api/reconciliation              - Run reconciliation
GET  /api/settlement/:from/:to        - Settlement summary
GET  /api/stats                       - Network statistics
```

### REZ Financial Ledger Platform

**Features:**
- Double-entry bookkeeping
- Revenue recognition (ASC 606/IFRS 15)
- Multi-currency support
- Payout management

**Account Types:**
| Type | Debit | Credit |
|------|-------|--------|
| Asset | + | - |
| Liability | - | + |
| Equity | - | + |
| Revenue | - | + |
| Expense | + | - |

---

## 5. MONITORING & OBSERVABILITY

### REZ Loyalty Monitoring (Port 4024)

**Monitors:**
- Events processed per second
- Decision latency (p50, p95, p99)
- Error rates by service
- Profile cache hit rate
- Tier upgrade rate
- Streak maintenance rate

### RTNM Monitoring

| Alert | Condition | Action |
|-------|-----------|--------|
| High Error Rate | > 1% | Page on-call |
| Slow Response | > 2s | Investigate |
| Auth Failures | > 10/min | Review security |

---

## 6. PLATFORM ADMIN (Port 4000)

**Complete Authority Over Ecosystem**

| Domain | Control | Services |
|--------|---------|----------|
| Companies | Create, manage, suspend | 6 companies |
| Users | Create, roles, permissions | All users |
| Services | Deploy, restart, scale | 169+ services |
| AI/ML | Train, deploy, monitor | 12+ models |
| Finance | Revenue, transactions | Payment/Wallet |
| Security | API keys, audit logs | Access control |

**Role Hierarchy:**
```
Super Admin (Full Authority)
├── CFO (Finance Dashboard)
├── CTO (Technology Dashboard)
├── CMO (Marketing Dashboard)
├── COO (Operations Dashboard)
├── CHRO (HR Dashboard)
├── CAIO (AI/ML Dashboard)
└── Company Admins (Company-scoped)
```

---

## 7. SECRETS & SECURITY

### REZ Secrets Manager
- Secure vault for API keys
- Credential management
- Environment variables

### REZ API Key Rotation
- Automatic key rotation
- Version tracking
- Access control per key

### REZ Security Middleware
- Rate limiting
- CORS enforcement
- Request validation

---

## 8. IDENTITY

### REZ Identity Service
- User identity management
- CorpID integration
- KYC handling

---

# PART 4: COIN & REWARD SYSTEMS

## REZ Wallet Service (Port 4004)

**6 Coin Types:**
| Coin | Purpose |
|------|---------|
| `rez` | Main currency |
| `prive` | Premium/exclusive |
| `branded` | Merchant promo |
| `promo` | Platform promo |
| `cashback` | Purchase refunds |
| `referral` | Referral bonuses |

**Coin Value:** 1 REZ Coin = ₹1 (configurable)

## REZ Unified Loyalty (Port 4010)

**Tiers:** Bronze → Silver → Gold → Platinum

**Tier Benefits:**
| Tier | Extra Earning | Free Delivery |
|------|--------------|--------------|
| Bronze | Base | ❌ |
| Silver | +25% | ❌ |
| Gold | +50% | ✅ |
| Platinum | +75% | ✅ |

## REZ Referral OS (Port 4019)

**3 Economies:**
| Economy | Default Reward | Commission |
|---------|----------------|-----------|
| Consumer | 100 coins | - |
| Merchant | 10% discount | - |
| Creator | - | 5-15% |

**Fraud Detection:** 12 checks

## Karma Service (Port 3009)

**Level System:**
| Level | Karma | Conversion |
|-------|-------|------------|
| L1 | 0-999 | 25% |
| L2 | 1000-2999 | 50% |
| L3 | 3000-5999 | 75% |
| L4 | 6000+ | 100% |

**Guardrails:**
- Weekly cap: 300 coins
- CSR pool check
- Kill switch

---

# PART 5: ALL 22 COMPANIES

## Sister Companies (All Connected)

| # | Company | Role | GitHub |
|---|---------|------|--------|
| 1 | HOJAI AI | AI Infrastructure | imrejaul007/hojai-ai |
| 2 | RABTUL Technologies | Payments/Auth | imrejaul007/RABTUL-Technologies |
| 3 | REZ-Intelligence | AI/Predictions | imrejaul007/REZ-Intelligence |
| 4 | REZ-Commerce | Commerce Network | imrejaul007/REZ-Commerce |
| 5 | REZ-Merchant | Merchant Platform | imrejaul007/REZ-Merchant |
| 6 | REZ-Media | Advertising | imrejaul007/REZ-Media |
| 7 | StayOwn-Hospitality | Hotels/Rentals | imrejaul007/StayOwn-Hospitality |
| 8 | CorpPerks | Workforce/HR | imrejaul007/CorpPerks |
| 9 | RTNM-Group | Admin/Control | imrejaul007/RTNM-Group |
| 10 | RTNM-Digital | Integration | imrejaul007/RTNM-Digital |
| 11 | RisnaEstate | Real Estate | Imrejaul007/RisnaEstate |
| 12 | RisaCare | Healthcare | imrejaul007/RisaCare |
| 13 | KHAIRMOVE | Mobility | imrejaul007/KHAIRMOVE |
| 14 | Karma-Foundation | Social Impact | imrejaul007/Karma-Foundation |
| 15 | Axom | Future Tech | imrejaul007/Axom |
| 16 | Nexha | Commerce Network | - |
| 17 | RIDZA | Finance | - |
| 18 | AssetMind | Financial Intel | - |
| 19 | LawGens | Legal AI | - |
| 20 | REZ-Workspace | Productivity | - |
| 21 | Z-Events | Events | - |
| 22 | REZ-Consumer | Consumer App | - |

---

# PART 6: INTER-COMPANY SERVICES

## RTNM Inter-Company Graph

Tracks relationships and dependencies between all companies.

## RTNM Company Registry

Central registry of all 22 companies with metadata.

## RTNM Company Twins

Digital twins for each company in the ecosystem.

## RTNM Company Credit

Credit scoring for inter-company transactions.

## RTNM Automated Billing

Automated billing based on inter-company ledger entries.

## RTNM Service Catalog

Central catalog of all 300+ services across the ecosystem.

---

# PART 7: METRICS

| Metric | Value |
|--------|-------|
| Total Products | 25+ |
| Total Companies | 22 |
| Total Services | 300+ |
| Total Twins | 15+ |
| Total Agents | 22+ |
| AI Employees | 200+ |
| Admin Services | 8 |
| Control Services | 10+ |
| Coin Types | 6 |
| Loyalty Tiers | 4 |
| Karma Levels | 4 |

---

# PART 8: CONTROL SUMMARY DIAGRAM

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           RTNM DIGITAL (Integration)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │   Event     │  │  Service   │  │   Central  │  │ Execution │   │
│  │   Bus      │  │ Registry   │  │  Context   │  │  Pipeline │   │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         RTNM GROUP (Control Center)                          │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                           ADMIN LAYER                                    │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐│ │
│  │  │Platform │  │  Ops    │  │  Admin  │  │  Trust  │  │ Loyalty││ │
│  │  │ Admin   │  │Dashboard │  │ Service │  │ Admin   │  │ Admin  ││ │
│  │  │ 4000    │  │          │  │  5005   │  │         │  │ 5007   ││ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └────────┘│ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                        SECURITY LAYER                                   │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐              │ │
│  │  │  Access  │  │  Trust  │  │Compliance│  │ Secrets  │              │ │
│  │  │  Control │  │ Service │  │ Platform │  │ Manager  │              │ │
│  │  │  (RBAC)  │  │  6007   │  │  (GDPR) │  │          │              │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘              │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                       FINANCIAL LAYER                                   │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐│ │
│  │  │ Inter-   │  │Financial │  │  BNPL   │  │Capital  │  │Payment  ││ │
│  │  │ Company  │  │  Ledger  │  │Service  │  │Service  │  │  Links  ││ │
│  │  │  Ledger  │  │ Platform │  │         │  │         │  │         ││ │
│  │  │  6004    │  │  4010    │  │         │  │         │  │         ││ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └─────────┘│ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                        OPERATIONS LAYER                                 │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐│ │
│  │  │  SSO    │  │  Billing │  │  Help   │  │Monitoring│  │Circuit ││ │
│  │  │ Service │  │ Service │  │ Center  │  │  4024   │  │Breaker ││ │
│  │  │  3015   │  │  3016   │  │  3001   │  │         │  │Dashboard││ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └─────────┘│ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          WALLET & REWARDS LAYER                              │
│                                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │  REZ    │  │ Unified  │  │ Referral │  │  Karma   │  │ AdBazaar │     │
│  │  Wallet  │  │ Loyalty  │  │    OS    │  │ Service  │  │ Loyalty  │     │
│  │  4004    │  │  4010    │  │  4019   │  │  3009   │  │ Program  │     │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘     │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐   │
│  │                         COIN TYPES                                    │   │
│  │   rez   │   prive   │  branded  │   promo   │  cashback  │ referral│   │
│  └───────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         22 SISTER COMPANIES                                 │
│                                                                             │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐│
│  │HOJAI│ │RABTUL│ │REZ  │ │Corp │ │Risa │ │Stay │ │Ad   │ │Nexha│ │KHAIR││
│  │ AI  │ │Tech │ │Media│ │Perks│ │Care │ │Own  │ │Bazaar│ │     │ │MOVE ││
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘│
│                                                                             │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐│
│  │Law  │ │RIDZA│ │Asset│ │REZ  │ │REZ  │ │ Z   │ │Karma│ │Axom │ │Risna││
│  │Gens │ │     │ │Mind │ │Merch│ │Cons │ │Events│ │Fndtn│ │     │ │Estate││
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘│
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# QUICK REFERENCE - ALL CONTROL PORTS

| Control Area | Port | Service |
|-------------|------|---------|
| Platform Admin | 4000 | Full ecosystem control |
| Wallet | 4004 | Coins, transactions |
| Financial Ledger | 4010 | Double-entry accounting |
| Loyalty | 4010 | Points, tiers |
| Referral OS | 4019 | Referrals, fraud |
| Loyalty Monitoring | 4024 | Metrics, alerts |
| Karma Service | 3009 | Social impact |
| Unified Gateway | 3000 | Single entry point |
| SSO Service | 3015 | Enterprise auth |
| Billing Service | 3016 | Invoicing |
| Help Center | 3001 | Support |
| API Docs | 3017 | Developer portal |
| Integration Hub | 3010 | Auto-provisioning |
| Dashboard | 3012 | Monitoring |
| Connect Service | 3018 | Service registry |
| Inter-Company Ledger | 6004 | Company finances |
| Company Trust | 6007 | Trust scores |

---

**Last Updated:** June 11, 2026
**Version:** 1.0
**Status:** COMPLETE CONTROL SYSTEM
