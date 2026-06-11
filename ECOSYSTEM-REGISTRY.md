# REZ ECOSYSTEM — UNIFIED SERVICE REGISTRY
**Date:** June 11, 2026
**Total Services:** 510+ | **Companies:** 23 | **Ports:** 3000-6099

---

## THE ECOSYSTEM MAP

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        RTNM-GROUP (6000-6007)                               │
│          Platform Administration · Company Registry · Inter-Company Ledger       │
└──────────────────────────────────┬───────────────────────────────────────────┘
                                   │
          ┌─────────────────────────┼─────────────────────────┐
          │                         │                         │
          ▼                         ▼                         ▼
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────────────┐
│   HOJAI AI (4500)  │  │  RABTUL (4000)     │  │   REZ INTELLIGENCE (4018) │
│   AI Platform      │  │  Financial         │  │   ML Pipeline             │
│   Memory·Agents    │  │  Infrastructure    │  │   Predictions·Signals     │
│   SUTAR OS·Voice  │  │  Payment·Auth     │  │   Intent·Attribution     │
└─────────┬───────────┘  └─────────┬───────────┘  └─────────────┬─────────────┘
          │                         │                          │
          └─────────────────────────┼──────────────────────────┘
                                    │
     ┌──────────────────────────────┼──────────────────────────────┐
     │                              │                              │
     ▼                              ▼                              ▼
┌───────────────────┐  ┌───────────────────────┐  ┌───────────────────────────┐
│   RIDZA (4500)     │  │   AdBazaar (4800)     │  │   REZ MERCHANT (4000)     │
│   Finance OS       │  │   Marketing OS         │  │   Industry OS             │
│   Treasury·FP&A    │  │   CDP·Intent Exchange  │  │   175+ services           │
│   Fraud·Insurance  │  │   DOOH·Attribution    │  │   Restaurant·Hotel·Retail │
└─────────┬─────────┘  └──────────┬────────────┘  └───────────┬───────────────┘
          │                      │                          │
          └──────────────────────┼──────────────────────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    ▼             ▼             ▼
          ┌─────────────────┐ ┌───────────┐ ┌───────────────────────────┐
          │   CorpPerks     │ │  RisaCare │ │   REZ CONSUMER (3000)     │
          │   (4700)        │ │  (4700)   │ │   B2C Apps               │
          │   Workforce OS  │ │  Healthcare│ │   Food·Expense·Inbox       │
          │   HR·Payroll   │ │  56 svc   │ │   Mobile apps             │
          └─────────────────┘ └───────────┘ └───────────────────────────┘
```

---

---

## PART 1B: NEW SERVICES (June 2026)

### Trust, Identity & Reputation

| Port | Service | Company | Type | Description |
|------|---------|---------|------|-------------|
| **4100** | devportal-api | HOJAI | Platform | Developer Platform API |
| **4150** | agent-wallet-api | HOJAI | Finance | Agent Wallet - Payments & Escrow |
| **4160** | agent-identity-api | HOJAI | Identity | Agent Identity - Registry & Certification |
| **4180** | marketplace-api | HOJAI | Platform | Agent Marketplace 2.0 - Ratings & Reviews |
| **4190** | trust-network-gateway | RTNM | Trust | RTNM Trust Network - Universal Trust |

### GCC Market (Arabic & Islamic Finance)

| Port | Service | Company | Type | Description |
|------|---------|---------|------|-------------|
| **4170** | arabic-ai-api | HOJAI | AI | Arabic AI - STT, TTS, NLU, Voice Twin |
| **4530** | islamic-finance-api | RIDZA | Finance | Islamic Finance - BNPL, Zakat, Lending |
| **4540** | remittance-api | RIDZA | Finance | Remittance - P2P Transfers, Exchange Rates |

---

## PART 1: ALL SERVICES BY PORT RANGE

### 3000-3099 — Consumer Apps & Extended

| Port | Service | Company | Type | Description |
|------|---------|---------|------|-------------|
| 3000 | unified-api-gateway | RTNM | Platform | Single entry for all RTNM services |
| 3001 | help-center | RTNM | Platform | Support portal |
| 3002 | go4food-api | REZ-Consumer | App | Food comparison |
| 3003 | REZ-inbox | REZ-Consumer | App | Email parser, receipts |
| 3004 | REZ-scan | REZ-Consumer | App | QR scanning |
| 3010 | integrations | RTNM | Platform | Auto-provisioning |
| 3011 | REZ-assistant | REZ-Consumer | App | AI chat |
| 3012 | unified-dashboard | RTNM | Platform | Monitoring |
| 3013 | REZ-bills | REZ-Consumer | App | Receipt scanning |
| 3015 | SSO-service | RTNM | Platform | Enterprise SSO |
| 3016 | billing-service | RTNM | Platform | Multi-product billing |
| 3018 | connect-service | RTNM | Platform | Service registry |

### 4000-4099 — RABTUL Core + Merchant

| Port | Service | Company | Type | Description |
|------|---------|---------|------|-------------|
| **4000** | api-gateway | RABTUL | Infra | Central routing |
| **4001** | rez-payment-service | RABTUL | Infra | UPI, Razorpay, refunds |
| **4002** | rez-auth-service | RABTUL | Infra | JWT, OTP, OAuth |
| **4004** | rez-wallet-service | RABTUL | Infra | Coins, balance |
| **4005** | rez-merchant-service | REZ-Merchant | Core | Merchant API |
| **4006** | rez-order-service | RABTUL | Infra | Order lifecycle |
| **4007** | rez-catalog-service | RABTUL | Infra | Products, inventory |
| **4008** | rez-search-service | RABTUL | Infra | Full-text search |
| **4009** | rez-delivery-service | RABTUL | Infra | Driver tracking |
| **4011** | rez-notifications-service | RABTUL | Infra | Push, SMS, WhatsApp |
| **4013** | rez-profile-service | RABTUL | Infra | Profiles, addresses |
| **4016** | rez-analytics-service | RABTUL | Infra | Dashboards |
| **4018** | Intent-Predictor | REZ-Intel | AI | Product propensity |
| **4020** | rez-booking-service | RABTUL | Infra | Bookings |
| **4022** | rez-pricing-service | REZ-Merchant | Feature | Dynamic pricing |
| **4025** | REZ-observability-platform | RABTUL | Infra | Logs, metrics |
| **4030** | REZ-circuit-breaker | RABTUL | Infra | Fault tolerance |
| **4031** | REZ-retry-service | RABTUL | Infra | Retry logic |
| **4032** | REZ-dlq-service | RABTUL | Infra | Dead letter queue |
| **4033** | REZ-idempotency-service | RABTUL | Infra | Deduplication |
| **4034** | REZ-policy-engine | RABTUL | Infra | Access control |
| **4035** | REZ-secrets-manager | RABTUL | Infra | AES-256, rotation |
| **4037** | rez-loyalty-service | REZ-Merchant | Feature | Loyalty programs |
| **4038** | REZ-scheduler-service | RABTUL | Infra | Cron jobs |
| **4040** | REZ-data-aggregator | RABTUL | Infra | Data aggregation |
| **4050** | Identity-Graph | REZ-Intel | AI | User resolution |
| **4055** | REZ-care-service | RABTUL | Support | Customer care |
| **4060** | REZ-dashboard | REZ-Merchant | Feature | Analytics |
| **4062** | REZ-autonomous-agents | RABTUL | AI | 8 AI agents |
| **4068** | REZ-graph-service | RABTUL | Infra | Commerce graph |
| **4070** | rez-prive-service | RABTUL | Feature | Prive coins |
| **4075** | REZ-event-bus | RABTUL | Infra | Event streaming |
| **4080** | REZ-kitchen-display | REZ-Merchant | Feature | KDS |
| **4081** | rez-pos-service | REZ-Merchant | Feature | Universal POS |
| **4096** | merchant-ai-employee-ui | RABTUL | AI | AI employee UI |
| **4097** | cross-merchant-view | RABTUL | Feature | Cross-merchant analytics |

### 4100-4299 — Industry Services + BuzzLocal

| Port | Service | Company | Type | Description |
|------|---------|---------|------|-------------|
| **4100** | RisnaEstate-gateway | RisnaEstate | Platform | Real estate |
| **4101** | hotel-habixo-service | StayOwn | Feature | Hotel OS |
| **4102** | carecode | HOJAI | Industry | Healthcare AI |
| **4150** | SUTAR Gateway | HOJAI | AI | SUTAR main |
| **4154** | SUTAR Intent Bus | HOJAI | AI | Intent propagation |
| **4155** | SUTAR WebSocket | HOJAI | AI | Real-time events |
| **4156** | SUTAR Data Store | HOJAI | AI | Persistence |
| **4180** | SUTAR Trust Engine | HOJAI | AI | Trust scoring |
| **4181** | SUTAR Policy OS | HOJAI | AI | Rules engine |
| **4190** | SUTAR Contract OS | HOJAI | AI | Smart contracts |
| **4191** | SUTAR Negotiation | HOJAI | AI | Agent bargaining |
| **4200** | buzzlocal-feed-service | BuzzLocal | App | Feed |
| **4201** | REZ-Memory-Layer | REZ-Intel | AI | Intent memory |
| **4202** | buzzlocal-community-service | BuzzLocal | App | Community |
| **4203** | buzzlocal-intelligence | BuzzLocal | AI | Intelligence |
| **4204** | buzzlocal-notification-service | BuzzLocal | App | Notifications |
| **4205** | buzzlocal-payment-service | BuzzLocal | App | Payments |
| **4208** | buzzlocal-weather-service | BuzzLocal | App | Weather data |
| **4210** | Demand-Sensing | REZ-Intel | AI | Demand forecasting |
| **4211** | Supply-Intelligence | REZ-Intel | AI | Supply prediction |
| **4212** | Market-Opportunities | REZ-Intel | AI | Opportunity detection |
| **4240** | SUTAR Decision Engine | HOJAI | AI | Autonomous decisions |
| **4241** | SUTAR Simulation OS | HOJAI | AI | Monte Carlo |
| **4242** | SUTAR Goal OS | HOJAI | AI | Objective decomposition |
| **4243** | SUTAR Network Learning | HOJAI | AI | Collective intelligence |

### 4300-4499 — HOJAI Core + Nexha

| Port | Service | Company | Type | Description |
|------|---------|---------|------|-------------|
| **4300** | Nexha-distribution-os | Nexha | Platform | Distribution |
| **4300** | rez-bnpl-service | RABTUL | Feature | Buy Now Pay Later |
| **4301** | REZ-memory-ui | HOJAI | UI | Memory UI |
| **4302** | REZ-workflow-builder-ui | HOJAI | UI | Workflow Builder |
| **4303** | REZ-agent-builder-ui | HOJAI | UI | Agent Builder |
| **4310** | Nexha-franchise-os | Nexha | Platform | Franchise ops |
| **4311** | REZ-knowledge-search | RABTUL | AI | Vector search |
| **4320** | Nexha-procurement-os | Nexha | Platform | RFQ, sourcing |
| **4330** | Nexha-manufacturing-os | Nexha | Platform | BOM, production |
| **4340** | Nexha-trade-finance | Nexha | Platform | BNPL, credit |
| **4350** | Nexha-intelligence-layer | Nexha | AI | AI predictions |
| **4360** | Nexha-network-graph | Nexha | Feature | Relationships |
| **4500** | HOJAI API Gateway | HOJAI | Infra | Routing, auth |
| **4501** | HOJAI Governance | HOJAI | Infra | RBAC, audit |
| **4510** | HOJAI Event Bus | HOJAI | Infra | Pub/sub |
| **4520** | HOJAI Memory | HOJAI | AI | Vector store, RAG |
| **4530** | HOJAI Intelligence | HOJAI | AI | ML pipeline |
| **4550** | ExpertOS Marketplace | HOJAI | Platform | Professional AI Marketplace |
| **4551** | HOJAI Agents | HOJAI | AI | Orchestration |
| **4560** | HOJAI Workflows | HOJAI | AI | Automation |
| **4570** | HOJAI Communications | HOJAI | AI | WhatsApp, SMS |
| **4580** | HOJAI Hyperlocal | HOJAI | AI | Geo intelligence |
| **4590** | HOJAI Data | HOJAI | Infra | Feature store |

### 4700-4799 — RisaCare + CorpPerks + Genie + Voice

| Port | Service | Company | Type | Description |
|------|---------|---------|------|-------------|
| **4700** | risa-care-api-gateway | RisaCare | Platform | Healthcare |
| **4701** | risa-care-profile-service | RisaCare | Feature | Profiles |
| **4702** | risa-care-records-service | RisaCare | Feature | Health records |
| **4703** | GENIE Memory | HOJAI | AI | Personal memories |
| **4704** | GENIE Relationship | HOJAI | AI | Relationship tracking |
| **4706** | GENIE Briefing | HOJAI | AI | Daily briefings |
| **4710** | Salar OS | CorpPerks | Platform | Workforce |
| **4715** | CorpPerks-backend | CorpPerks | Platform | HRMS core |
| **4720** | CorpPerks-intelligence | CorpPerks | AI | AI decisions |
| **4725** | CorpPerks-corp-crm | CorpPerks | Feature | CRM |
| **4730** | CorpPerks-okr-service | CorpPerks | Feature | OKRs |
| **4738** | CorpPerks-payroll-service | CorpPerks | Feature | Payroll |
| **4750** | HOJAI Commerce Intelligence | HOJAI | AI | External commerce AI |
| **4751** | HOJAI Merchant Intelligence | HOJAI | AI | Business AI |
| **4752** | HOJAI Customer Intelligence | HOJAI | AI | CRM AI |
| **4753** | HOJAI Marketing Intelligence | HOJAI | AI | Campaign AI |
| **4754** | HOJAI Financial Intelligence | HOJAI | AI | Finance AI |
| **4760** | Voice OS | HOJAI | AI | Voice AI |
| **4780** | REZ-Cosmic-Twin | HOJAI | AI | Entity state |

### 4800-4899 — AdBazaar + Intent Exchange + Voice

| Port | Service | Company | Type | Description |
|------|---------|---------|------|-------------|
| **4800** | intent-signal-aggregator | AdBazaar | AI | Intent signals |
| **4801** | intent-prediction-engine | AdBazaar | AI | ML scoring |
| **4802** | intent-marketplace | AdBazaar | AI | Audience exchange |
| **4803** | intent-attribution | AdBazaar | AI | Multi-touch |
| **4805** | audience-twin-service | AdBazaar | AI | Behavioral sim |
| **4806** | user-twin-service | AdBazaar | AI | User twin |
| **4807** | merchant-twin-service | AdBazaar | AI | Merchant twin |
| **4808** | customer-graph-360 | AdBazaar | AI | 360° view |
| **4809** | Tripmind | HOJAI | Industry | Travel OS |
| **4810** | edulearn | HOJAI | Industry | EdTech |
| **4811** | LearnIQ | HOJAI | Industry | Education OS |
| **4814** | FleetIQ | HOJAI | Industry | Logistics OS |
| **4815** | LedgerAI | HOJAI | Industry | Accounting OS |
| **4820** | Waitron | HOJAI | Industry | Restaurant OS |
| **4830** | ShopFlow | HOJAI | Industry | Retail OS |
| **4850** | Voice Unified Platform | HOJAI | AI | WhatsApp + Voice |
| **4859** | Analyst AI Voice | HOJAI | AI | Finance analyst |
| **4860** | GlamAI | HOJAI | Industry | Salon OS |
| **4880** | ExpertOS Twin Service | HOJAI | Platform | AI Twin for Professionals |
| **4870** | Salon AI | HOJAI | Industry | Salon OS |

### 4900-4999 — AdBazaar Platform Moats + Retail Media

| Port | Service | Company | Type | Description |
|------|---------|---------|------|-------------|
| **4900** | risa-care-pharmacy-service | RisaCare | Feature | Pharmacy |
| **4950** | data-clean-room | AdBazaar | AI | Privacy-safe data |
| **4951** | privacy-preserving-compute | AdBazaar | AI | Federated learning |
| **4952** | identity-matching-engine | AdBazaar | AI | Identity resolution |
| **4960** | marketing-os | AdBazaar | Platform | Marketing OS |
| **4961** | cdp | AdBazaar | Platform | Customer Data Platform |
| **4962** | pixel | AdBazaar | Platform | Tracking pixel |
| **4963** | verification | AdBazaar | Platform | Ad verification |
| **4964** | clean-room | AdBazaar | Platform | Data matching |
| **4965** | marketing-agent | AdBazaar | AI | AI marketing agent |
| **4966** | event-stream | AdBazaar | Platform | Kafka equiv |
| **4967** | intelligence-graph | AdBazaar | AI | Knowledge graph |
| **4968** | data-marketplace | AdBazaar | Platform | Audience exchange |
| **4969** | revenue-intelligence | AdBazaar | AI | Profit tracking |
| **4970** | creator-wallet | AdBazaar | Platform | Creator banking |
| **4971** | personalization | AdBazaar | AI | Dynamic content |
| **4972** | agency-os | AdBazaar | Platform | Agency mgmt |
| **4973** | competitive-intel | AdBazaar | AI | Competitor tracking |
| **4974** | community-media | AdBazaar | Platform | Hyperlocal |
| **4980** | yield-platform-service | AdBazaar | Platform | Yield optimization |
| **4990** | retail-media-os | AdBazaar | Platform | Retail media |

### 5000-5099 — RIDZA + More AdBazaar + Atlas

| Port | Service | Company | Type | Description |
|------|---------|---------|------|-------------|
| **5000** | RIDZA-FinanceOS | RIDZA | Platform | Finance OS |
| **5005** | REZ-Cosmic-Twin | HOJAI | AI | Company/person twin |
| **5090** | Finance Copilot | RIDZA | UI | CFO AI Dashboard |
| **4930** | Collection Agent | RIDZA | AI | Payment collection |
| **4940** | Financial Twin | RIDZA | AI | Real-time finances |
| **4950** | CFO Agent | RIDZA | AI | Finance orchestration |
| **4960** | Crisis Agent | RIDZA | AI | Crisis monitoring |
| **4970** | Problem Detector | RIDZA | AI | Issue detection |
| **4980** | Accounting Ledger | RIDZA | AI | Double-entry accounting |
| **5081** | instagram-publishing | AdBazaar | Platform | Social automation |
| **5091** | caption-generator | AdBazaar | AI | AI captions |
| **5150** | REZ-atlas-gateway | REZ-Merchant | AI | Atlas gateway |
| **5151** | REZ-atlas-discover | REZ-Merchant | AI | Merchant discovery |
| **5152** | REZ-atlas-maps | REZ-Merchant | AI | Heat maps |
| **5153** | REZ-atlas-twin | REZ-Merchant | AI | Merchant twins |
| **5154** | REZ-atlas-score | REZ-Merchant | AI | Lead scoring |
| **5155** | REZ-atlas-signals | REZ-Merchant | AI | Opportunity detection |
| **5170** | REZ-atlas-territory | REZ-Merchant | Feature | Territory mgmt |
| **5171** | REZ-atlas-routes | REZ-Merchant | Feature | Route optimization |
| **5172** | REZ-atlas-copilot | REZ-Merchant | AI | AI sales assistant |

### 6000-6099 — RTNM Platform Administration

| Port | Service | Company | Type | Description |
|------|---------|---------|------|-------------|
| **6000** | rtnm-company-registry | RTNM | Platform | 22 companies |
| **6001** | rtnm-inter-company-graph | RTNM | Platform | Who pays whom |
| **6002** | rtnm-company-twins | RTNM | Platform | Company digital twins |
| **6003** | rtnm-service-catalog | RTNM | Platform | Every service |
| **6004** | rtnm-inter-company-ledger | RTNM | Platform | Revenue/cost tracking |
| **6005** | rtnm-automated-billing | RTNM | Platform | Settlements |
| **6006** | rtnm-company-credit | RTNM | Platform | BNPL between companies |
| **6007** | rtnm-company-trust | RTNM | Platform | Company trust scores |

---

## PART 2: CROSS-PLATFORM CONNECTION MATRIX

### Who Consumes Whom

```
                    CONSUMED BY →
PROVIDES ↓    RABTUL  HOJAI  REZ-Intel  RIDZA  AdBazaar  REZ-Merchant  CorpPerks  RisaCare  RTNM
────────────────────────────────────────────────────────────────────────────────────────────────────────
RABTUL         ✗        ✓       ✓        ✓        ✓           ✓           ✓          ✓        ✓
  (Auth 4002, Payment 4001, Wallet 4004, Notify 4011, etc.)

HOJAI AI       ✓        ✗       ✓        ✓        ✓           ✓           ✓          ✓        ✓
  (Memory 4520, Intelligence 4530, Agents 4550, Workflows 4560, SUTAR 4240-4254)

REZ-Intel      ✓        ✓       ✗        ✓        ✓           ✓           ✓          ✓        ✓
  (Intent 4018, Predictive 4123, Signals 4142)

RIDZA          ✓        ✓       ✓        ✗        ✓           ✓           ✓          ✓        ✓
  (Treasury, FP&A, Risk, Fraud, Insurance)

AdBazaar       ✓        ✓       ✓        ✓        ✗           ✓           ✓          ✓        ✓
  (Marketing, CDP, Intent Exchange)

REZ-Merchant   ✓        ✓       ✓        ✓        ✓           ✗           ✓          ✓        ✓
  (POS, Inventory, Loyalty, Orders)

CorpPerks      ✓        ✓       ✓        ✓        ✓           ✓           ✗          ✓        ✓
  (HR, Payroll, OKRs)

RisaCare       ✓        ✓       ✓        ✓        ✓           ✓           ✓          ✗        ✓
  (Healthcare records, bookings)

RTNM           ✓        ✓       ✓        ✓        ✓           ✓           ✓          ✓        ✗
  (Company registry, billing, trust)
```

### Detailed Connection Map

#### RABTUL → Everything
```
RABTUL provides infrastructure to ALL companies:
- All 22 companies consume RABTUL Auth (4002)
- All 22 companies consume RABTUL Payment (4001)
- All 22 companies consume RABTUL Wallet (4004)
- All 22 companies consume RABTUL Notify (4011)
- All 22 companies consume RABTUL Event Bus (4075)
- All 22 companies consume RABTUL Circuit Breaker (4030)
- All 22 companies consume RABTUL Retry (4031)
- All 22 companies consume RABTUL DLQ (4032)
```

#### HOJAI AI → Everything
```
HOJAI AI provides AI to ALL companies:
- All companies can use HOJAI Memory (4520) for vector search
- All companies can use HOJAI Intelligence (4530) for ML
- All companies can use HOJAI Agents (4550) for orchestration
- All companies can use HOJAI Workflows (4560) for automation
- All companies can use HOJAI Communications (4570) for WhatsApp/SMS
- RIDZA specifically uses SUTAR Decision Engine (4240)
- RIDZA specifically uses SUTAR Simulation (4241)
- RIDZA specifically uses SUTAR Trust Engine (4180)
- RIDZA specifically uses SUTAR Contract OS (4190)
```

#### REZ-Intelligence → Everything
```
REZ-Intelligence provides ML predictions to ALL companies:
- All companies can use Intent Predictor (4018) for propensity
- All companies can use Predictive Engine (4123) for forecasts
- All companies can use Signal Aggregator (4142) for behavior
- All companies can use Attribution (4120) for conversion tracking
- All companies can use Memory Layer (4201) for intent storage
- All companies can use Demand Sensing (4210) for forecasting
```

#### RIDZA → Ecosystem
```
RIDZA provides financial intelligence back to ecosystem:
- RABTUL: Credit decisions, fraud patterns, trust scores
- HOJAI: Financial signals, credit models, consumer behavior
- REZ-Intel: Financial intent signals, cash flow data
- AdBazaar: QR scan → conversion attribution
- REZ-Merchant: Merchant financial health, working capital
- CorpPerks: Employee financial wellness data
```

#### AdBazaar → Ecosystem
```
AdBazaar provides marketing to ALL companies:
- All companies can run campaigns via AdBazaar
- All companies can use CDP (4961) for customer data
- All companies can use Intent Exchange (4800-4803)
- All companies can use Attribution (4803) for tracking
- RIDZA uses AdBazaar for financial product marketing
- REZ-Merchant uses AdBazaar for product campaigns
```

---

## PART 3: SERVICE DEPENDENCY GRAPHS

### RIDZA Dependencies
```
ridza-core (4500)
├── RABTUL Auth (4002) ✅
├── RABTUL Payment (4001) ✅
├── RABTUL Wallet (4004) ✅
├── RABTUL Notify (4011) ✅
├── REZ Intent (4018) ✅
├── REZ Signals (4142) ✅
├── REZ Predictive (4123) ✅
├── HOJAI Memory (4520) ✅
├── HOJAI Intelligence (4530) ✅
├── HOJAI Workflows (4560) ✅
├── HOJAI Comms (4570) ✅
├── SUTAR Decision (4240) ✅
├── SUTAR Trust (4180) ✅
├── SUTAR Contract (4190) ✅
├── SUTAR Simulation (4241) ✅
├── AdBazaar Intent (4800) ✅
├── AdBazaar Attribution (4803) ✅
└── AdBazaar Customer Graph (4808) ✅

ridza-treasury-agent (4926)
├── HOJAI Finance Hub ✅
├── HOJAI Memory (4520) ✅
├── SUTAR Simulation (4241) ✅
├── SUTAR Decision (4240) ✅
└── RABTUL Notify (4011) ✅

ridza-fpa-agent (4927)
├── HOJAI Finance Hub ✅
├── HOJAI Memory (4520) ✅
├── SUTAR Simulation (4241) ✅
└── RABTUL Notify (4011) ✅

ridza-fraud (4510)
├── REZ Fraud Agent (3007) ✅
├── REZ Signals (4142) ✅
└── SUTAR Network Learning (4243) ✅

ridza-compliance (4507)
├── HOJAI Governance (4501) ✅
└── RABTUL Notify (4011) ✅

ridza-insurance (4520)
├── RABTUL Auth (4002) ✅
├── RABTUL Payment (4001) ✅
├── RABTUL Wallet (4004) ✅
└── RABTUL Notify (4011) ✅

ridza-finance-intelligence (4512)
├── REZ Signals (4142) ✅
├── REZ Predictive (4123) ✅
├── REZ Intent (4018) ✅
├── HOJAI Intelligence (4530) ✅
├── SUTAR Simulation (4241) ✅
├── SUTAR Decision (4240) ✅
├── REZ-Cosmic-Twin (5005) ✅
├── HOJAI Board AI (4870) ✅
├── HOJAI Investor Relations (4815) ✅
├── HOJAI Accounting Agent (4800) ✅
├── REZ Revenue Simulation (4308) ✅
└── AdBazaar Customer Graph (4808) ✅

ridza-merchant-finance (4511)
├── REZ Signals (4142) ✅
├── REZ Demand Sensing (4210) ✅
├── AdBazaar Attribution (4803) ✅
└── RABTUL Notify (4011) ✅

ridza-corpperks-hub (4503)
├── RABTUL Wallet (4004) ✅
├── RABTUL Notify (4011) ✅
└── AdBazaar Marketing OS (4960) ✅
```

### REZ-Merchant Dependencies
```
rez-merchant-service (4005)
├── RABTUL Auth (4002) ✅
├── RABTUL Payment (4001) ✅
├── RABTUL Wallet (4004) ✅
├── REZ Intent (4018) ✅
├── REZ Signals (4142) ✅
├── HOJAI Intelligence (4530) ✅
├── AdBazaar Attribution (4803) ✅
└── CorpPerks (4700) ✅

REZ Atlas (5150-5173)
├── REZ Signals (4142) ✅
├── REZ Intent (4018) ✅
├── HOJAI Memory (4520) ✅
└── AdBazaar Intent (4800) ✅
```

---

## PART 4: DATA FLOW MAPS

### Financial Data Flow
```
CorpPerks Employee
    │
    │ (uses financial products)
    ▼
RIDZA Lead Created
    │
    ├─► RABTUL Auth (verify identity) ✅
    │
    ├─► REZ Intent (loan propensity) ✅
    │
    ├─► REZ Signals (behavior signals) ✅
    │
    ├─► HOJAI Intelligence (credit score) ✅
    │
    ├─► SUTAR Decision Engine (approve/reject) ✅
    │
    ├─► SUTAR Trust Engine (trust score) ✅
    │
    ├─► RABTUL Payment (loan disbursement) ✅
    │
    ├─► RABTUL Wallet (coins earned) ✅
    │
    ├─► AdBazaar (attribution: ad → loan) ✅
    │
    ├─► HOJAI Memory (store interaction) ✅
    │
    └─► RTNM Ledger (company revenue) ✅
```

### Marketing → Conversion Flow
```
Customer sees Ad (AdBazaar)
    │
    │ (clicks, browses)
    ▼
REZ-Merchant (views product)
    │
    ├─► REZ Intent (capture intent) ✅
    │
    ├─► REZ Signals (behavior) ✅
    │
    └─► HOJAI Memory (remember) ✅
    │
    ▼
Customer purchases (RABTUL Payment)
    │
    ├─► AdBazaar Attribution (credit ad) ✅
    │
    ├─► REZ-Merchant (update inventory) ✅
    │
    └─► RABTUL Wallet (coins credited) ✅
    │
    ▼
Customer converts to loan seeker (RIDZA)
    │
    ├─► RIDZA Core (lead created) ✅
    │
    ├─► RABTUL Auth (verify) ✅
    │
    ├─► REZ Intent (loan propensity) ✅
    │
    └─► HOJAI Intelligence (credit score) ✅
```

---

## PART 5: MISSING CONNECTIONS (Gap Analysis)

### Critical Gaps

| From | To | Gap | Priority |
|------|-----|-----|----------|
| HOJAI AI | RIDZA | 10 AI services not built | P0 |
| RABTUL | RIDZA | 13 services not wired | P1 |
| REZ-Intel | RIDZA | 6 services not wired | P1 |
| AdBazaar | RIDZA | 4 services not wired | P2 |
| RIDZA | RABTUL | Financial signals not flowing | P1 |
| RIDZA | HOJAI | Finance Copilot missing | P0 |
| RIDZA | REZ-Merchant | Merchant financial health not shared | P2 |
| CorpPerks | RIDZA | Employee financial wellness not integrated | P2 |

### Services That Should Exist But Don't

| Service | Platform | Purpose |
|---------|----------|---------|
| Finance Copilot | RIDZA | CFO dashboard with AI summaries |
| Collection Agent | RIDZA | Automated dunning, payment chase |
| Financial Twin | RIDZA | Unified entity representation |
| Problem Detection | RIDZA | Cash vs revenue trend monitoring |
| Crisis Detection | RIDZA | Early warning system |
| KYC Service | HOJAI | Government database integration |
| Insurance Underwriting AI | HOJAI | Actuarial risk selection |
| Cash Flow Prediction | HOJAI | Merchant cash flow forecasting |
| Portfolio Optimization | HOJAI | Investment optimization |
| Technical Analysis | HOJAI | Chart pattern recognition |
| News Sentiment | HOJAI | Financial news analysis |

---

## PART 6: UNIFIED .ENV CONFIGURATION

```bash
# =============================================================================
# REZ ECOSYSTEM - UNIFIED ENVIRONMENT CONFIGURATION
# =============================================================================

# RTNM Platform
RTNM_COMPANY_ID=ridza
RTNM_API_KEY=xxx
RTNM_REGISTRY_URL=http://rtnm-company-registry:6000

# RABTUL - Financial Infrastructure (ALL services consume these)
AUTH_SERVICE_URL=http://rabtul-auth:4002
PAYMENT_SERVICE_URL=http://rabtul-payment:4001
WALLET_SERVICE_URL=http://rabtul-wallet:4004
NOTIFY_SERVICE_URL=http://rabtul-notify:4011
ORDER_SERVICE_URL=http://rabtul-order:4006
CATALOG_SERVICE_URL=http://rabtul-catalog:4007
SEARCH_SERVICE_URL=http://rabtul-search:4008
PROFILE_SERVICE_URL=http://rabtul-profile:4013
ANALYTICS_SERVICE_URL=http://rabtul-analytics:4016
EVENT_BUS_URL=http://rabtul-eventbus:4075
CIRCUIT_BREAKER_URL=http://rabtul-circuit-breaker:4030
RETRY_SERVICE_URL=http://rabtul-retry:4031
DLQ_SERVICE_URL=http://rabtul-dlq:4032
INTERNAL_SERVICE_TOKEN=xxx

# HOJAI AI - AI Platform
HOJAI_GATEWAY_URL=http://hojai-gateway:4500
HOJAI_GOVERNANCE_URL=http://hojai-governance:4501
HOJAI_EVENT_URL=http://hojai-event:4510
HOJAI_MEMORY_URL=http://hojai-memory:4520
HOJAI_INTELLIGENCE_URL=http://hojai-intelligence:4530
HOJAI_AGENTS_URL=http://hojai-agents:4550
HOJAI_WORKFLOWS_URL=http://hojai-workflows:4560
HOJAI_COMMUNICATIONS_URL=http://hojai-communications:4570
HOJAI_HYPERLOCAL_URL=http://hojai-hyperlocal:4580
HOJAI_DATA_URL=http://hojai-data:4590
HOJAI_API_KEY=xxx

# ExpertOS - Professional Intelligence Cloud
EXPERT_OS_URL=http://expert-os:4550
EXPERT_OS_TWIN_URL=http://expert-twin:4800

# SUTAR OS - Autonomous Business Layer
SUTAR_GATEWAY_URL=http://sutar-gateway:4150
SUTAR_INTENT_BUS_URL=http://sutar-intent:4154
SUTAR_WEBSOCKET_URL=http://sutar-websocket:4155
SUTAR_DATA_STORE_URL=http://sutar-datastore:4156
SUTAR_TRUST_URL=http://sutar-trust:4180
SUTAR_POLICY_URL=http://sutar-policy:4181
SUTAR_CONTRACT_URL=http://sutar-contract:4190
SUTAR_NEGOTIATION_URL=http://sutar-negotiation:4191
SUTAR_DECISION_URL=http://sutar-decision:4240
SUTAR_SIMULATION_URL=http://sutar-simulation:4241
SUTAR_GOAL_URL=http://sutar-goal:4242
SUTAR_NETWORK_URL=http://sutar-network:4243
SUTAR_MARKETPLACE_URL=http://sutar-marketplace:4250
SUTAR_ECONOMY_URL=http://sutar-economy:4251
SUTAR_USAGE_URL=http://sutar-usage:4253
SUTAR_API_KEY=xxx

# REZ Intelligence - ML Pipeline
REZ_INTENT_PREDICTOR_URL=http://rez-intent:4018
REZ_PREDICTIVE_ENGINE_URL=http://rez-predictive:4123
REZ_SIGNAL_AGGREGATOR_URL=http://rez-signals:4142
REZ_ATTRIBUTION_URL=http://rez-attribution:4120
REZ_MEMORY_LAYER_URL=http://rez-memory:4201
REZ_DEMAND_SENSING_URL=http://rez-demand:4210
REZ_SUPPLY_INTELLIGENCE_URL=http://rez-supply:4211
REZ_API_KEY=xxx

# REZ Merchant
REZ_MERCHANT_SERVICE_URL=http://rez-merchant:4005
REZ_POS_SERVICE_URL=http://rez-pos:4081
REZ_LOYALTY_SERVICE_URL=http://rez-loyalty:4037
REZ_ATLAS_URL=http://rez-atlas:5150

# AdBazaar - Marketing OS
ADBAZAAR_SERVICE_URL=http://adbazaar:4000
ADBAZAAR_INTENT_URL=http://adbazaar-intent:4801
ADBAZAAR_ATTRIBUTION_URL=http://adbazaar-attribution:4803
ADBAZAAR_CUSTOMER_GRAPH_URL=http://adbazaar-customer360:4808
ADBAZAAR_MARKETING_OS_URL=http://adbazaar-marketing:4960
ADBAZAAR_CDP_URL=http://adbazaar-cdp:4961

# CorpPerks - Workforce OS
CORPPERKS_URL=http://corpperks:4700
CORPPERKS_API_URL=http://corpperks-api:4013

# RisaCare - Healthcare
RISACARE_URL=http://risacare:4700

# RIDZA - Finance OS
# RIDZA Finance OS - All Services
RIDZA_CORE_URL=http://ridza-core:4500
RIDZA_PARTNER_API_URL=http://ridza-partner-api:4501
RIDZA_AGENT_PORTAL_URL=http://ridza-agent-portal:4502
RIDZA_CORPPERKS_HUB_URL=http://ridza-corpperks-hub:4503
RIDZA_AI_SEARCH_URL=http://ridza-ai-search:4505
RIDZA_PROVIDER_API_URL=http://ridza-provider-api:4506
RIDZA_COMPLIANCE_URL=http://ridza-compliance:4507
RIDZA_EVENTS_URL=http://ridza-events:4508
RIDZA_WORKFLOW_URL=http://ridza-workflow:4509
RIDZA_FRAUD_URL=http://ridza-fraud:4510
RIDZA_MERCHANT_FINANCE_URL=http://ridza-merchant-finance:4511
RIDZA_FINANCE_INTELLIGENCE_URL=http://ridza-finance-intelligence:4512
RIDZA_INSURANCE_URL=http://ridza-insurance:4520
RIDZA_PARTNER_ONBOARDING_URL=http://ridza-partner-onboarding:4530
RIDZA_TREASURY_AGENT_URL=http://ridza-treasury-agent:4926
RIDZA_FPA_AGENT_URL=http://ridza-fpa-agent:4927
RIDZA_RISK_AGENT_URL=http://ridza-risk-agent:4928
RIDZA_INVESTMENT_AGENT_URL=http://ridza-investment-agent:4929

# NEW - June 2026
RIDZA_COLLECTION_AGENT_URL=http://ridza-collection-agent:4930
RIDZA_FINANCIAL_TWIN_URL=http://ridza-financial-twin:4940
RIDZA_CFO_AGENT_URL=http://ridza-cfo-agent:4950
RIDZA_CRISIS_AGENT_URL=http://ridza-crisis-agent:4960
RIDZA_PROBLEM_DETECTOR_URL=http://ridza-problem-detector:4970
RIDZA_FINANCE_COPILOT_URL=http://ridza-finance-copilot:5090
RIDZA_ACCOUNTING_LEDGER_URL=http://ridza-accounting-ledger:4980

# RIDZA Finance Intelligence - Wire Services
RIDZA_SIMULATION_URL=http://localhost:4308
RIDZA_COSMIC_TWIN_URL=http://localhost:5005
RIDZA_BOARD_AI_URL=http://localhost:4870
RIDZA_INVESTOR_RELATIONS_URL=http://localhost:4815
RIDZA_BANK_RECONCILIATION_URL=http://localhost:4800
```

---

## PART 7: TOTAL ECOSYSTEM STATS

| Metric | Count |
|--------|-------|
| Total Services | 510+ |
| Total Companies | 23 |
| HOJAI AI Services | 52+ |
| RABTUL Services | 40+ |
| REZ-Intel Services | 30+ |
| REZ-Merchant Services | 175+ |
| AdBazaar Services | 120+ |
| RIDZA Services | 29 |
| CorpPerks Services | 50+ |
| RisaCare Services | 56 |
| ExpertOS Services | 2 |
| Port Range | 3000-6099 |
| RABTUL Ports | 4000-4311 |
| HOJAI Ports | 4150-4880 |
| REZ-Intel Ports | 4018-4212 |
| AdBazaar Ports | 4800-4974 |
| RIDZA Ports | 4500-4530, 4926-4980, 5090 |
| ExpertOS Ports | 4550, 4880 |
