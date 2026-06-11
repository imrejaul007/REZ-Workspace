# RTNM Digital - Complete Ecosystem Documentation

**Version:** 8.1 | **Date:** June 11, 2026

---

## OVERVIEW

**RTNM Digital** (also known as REZ Ecosystem) is the parent company that owns multiple independent companies. Each company operates independently, provides services to other companies, and uses services from other companies.

---

## ECOSYSTEM STRUCTURE

```
RTNM Digital (Parent Company / REZ Ecosystem)
│
├── HOJAI AI ────────────────→ provides AI services to all companies
├── RABTUL Technologies ─────→ provides tech & infrastructure to all companies
├── AdBazaar ────────────────→ provides marketing/advertising to all companies
├── Nexha ───────────────────→ provides commerce network to all companies
├── CorpPerks ───────────────→ provides workforce/HR to all companies
├── RisaCare ────────────────→ provides healthcare to all companies
├── StayOwn ─────────────────→ provides hospitality to all companies
├── RisnaEstate ────────────→ provides real estate to all companies
├── REZ Consumer ────────────→ provides consumer app to all companies
├── REZ Merchant ────────────→ provides merchant platform to all companies
├── KHAIRMOVE ───────────────→ provides mobility to all companies
├── LawGens ─────────────────→ provides legal services to all companies
├── REZ Workspace ───────────→ provides productivity to all companies
├── Z-Events ────────────────→ provides events to all companies
├── RIDZA ───────────────────→ provides finance to all companies
├── AssetMind ───────────────→ provides financial intelligence to all companies
├── Axom ───────────────────→ provides future tech to all companies
├── Karma Foundation ────────→ provides social impact to all companies
└── ... other companies
```

**CROSS-CUTTING SYSTEMS:**
```
├── REE (Real-time Ecosystem Engine) ──→ Fraud, Growth, Trust, Attribution
├── RTNM Digital ──────────────────────→ Integration layer
└── RTNM Group ────────────────────────→ Control plane
```

**NOTE: REE is a SEPARATE system** (not "REZ" or any company) that handles cross-cutting operations like fraud detection, growth tracking, trust scores, and attribution. It has 12 external services on ports 3000-3011.

**Key Principles:**
- ✅ Every company is **independent** with its own business/customers
- ✅ Every company **provides services** to other companies
- ✅ Every company **uses services** from other companies
- ✅ All are **sister companies** under RTNM Digital

---

## ALL COMPANIES (Sister Companies)

| Company | Primary Role | Example Services |
|---------|-------------|------------------|
| **HOJAI AI** | AI Infrastructure | Memory, Agents, Knowledge Graph, Digital Twins |
| **RABTUL Technologies** | Tech/Infrastructure | Payments, Auth, Wallet, Cards, BNPL |
| **AdBazaar** | Marketing/Advertising | Campaign Manager, Attribution, Retail Media |
| **Nexha** | Commerce Network | Distribution, Franchise, Procurement |
| **CorpPerks** | Workforce/HR | HRMS, Payroll, TalentAI, CorpID |
| **RisaCare** | Healthcare | Patient Platform, Clinic, Hospital, Telemedicine |
| **StayOwn** | Hospitality | Hotels, Vacation Rentals, Habixo |
| **RisnaEstate** | Real Estate | Marketplace, Property CRM, Management |
| **REZ Consumer** | Consumer App | REZ App, Wallet, Rewards, Safe QR |
| **REZ Merchant** | Merchant Platform | POS, KDS, QR Cloud, Loyalty |
| **KHAIRMOVE** | Mobility | Ride, Driver, Fleet, Logistics |
| **LawGens** | Legal | Research, Contracts, Compliance |
| **REZ Workspace** | Productivity | Workspace, Collaboration, Meetings |
| **Z-Events** | Events | Discovery, Ticketing, CRM |
| **RIDZA** | Finance | Credit, Insurance, Lending |
| **AssetMind** | Financial Intelligence | Bloomberg-like platform, Twins |
| **Axom** | Future Tech | Cosmic OS, Research Systems |
| **Karma Foundation** | Social Impact | Education, Healthcare, Community |
| **REE** | Ecosystem Engine | Fraud, Growth, Trust, Attribution (External) |

---

## REE SERVICES (Ports 3000-3011)

**REE is NOT a company** - it's a cross-cutting system for fraud detection, growth tracking, trust scoring, and marketing attribution. All 12 services are external (not implemented in this codebase).

| Port | Service | Purpose |
|------|---------|---------|
| 3000 | ops_center | Operations dashboard, incident management |
| 3001 | trust_platform | Trust scores, fraud signals |
| 3002 | growth_engine | Referral tracking, viral coefficients |
| 3003 | logistics_engine | Route optimization, delivery risk |
| 3004 | attribution_engine | Marketing attribution, conversion tracking |
| 3005 | creative_studio | Ad creative generation |
| 3006 | franchise_mode | Franchise management |
| 3007 | ai_marketplace | AI agent marketplace |
| 3008 | mind_grocery | Grocery vertical AI |
| 3009 | mind_retail | Retail vertical AI |
| 3010 | rto_fraud | RTO fraud detection |
| 3011 | voice_ai | Voice AI interface |

**REE Clients in Services:**
- `RABTUL-Technologies/rez-profile-service/src/services/reeClient.ts`
- `RABTUL-Technologies/rez-wallet-service/src/utils/reeClient.ts`

**REE Integration Hub:**
- `RTNM-Digital/src/reeIntegration.ts`

---

## GIT REPOSITORIES

Each company has its own GitHub repository. "ReZ Full App" is a LOCAL folder containing all repos.

| Company | GitHub Repository |
|---------|-------------------|
| HOJAI AI | github.com/imrejaul007/hojai-ai |
| RABTUL Technologies | github.com/imrejaul007/RABTUL-Technologies |
| REZ-Intelligence | github.com/imrejaul007/REZ-Intelligence |
| REZ-Commerce | github.com/imrejaul007/REZ-Commerce |
| REZ-Merchant | github.com/imrejaul007/REZ-Merchant |
| REZ-Media | github.com/imrejaul007/REZ-Media |
| StayOwn-Hospitality | github.com/imrejaul007/StayOwn-Hospitality |
| CorpPerks | github.com/imrejaul007/CorpPerks |
| RTNM-Group | github.com/imrejaul007/RTNM-Group |
| RTNM-Digital | github.com/imrejaul007/RTNM-Digital |
| RisnaEstate | github.com/Imrejaul007/RisnaEstate |
| RisaCare | github.com/imrejaul007/RisaCare |
| KHAIRMOVE | github.com/imrejaul007/KHAIRMOVE |
| Karma-Foundation | github.com/imrejaul007/Karma-Foundation |
| Axom | github.com/imrejaul007/Axom |

---

## SHARED SERVICES PATTERN

Every company both **provides** and **consumes** services:

### Example: HOJAI AI provides AI to everyone
- CorpPerks uses HOJAI AI → AI agents, memory
- RisaCare uses HOJAI AI → Health AI, scribe
- REZ Merchant uses HOJAI AI → Commerce AI

### Example: RABTUL provides infrastructure to everyone
- HOJAI AI uses RABTUL → Auth, Wallet
- CorpPerks uses RABTUL → Auth, Wallet, Payments
- RisaCare uses RABTUL → Auth, Wallet, Payments

### Example: AdBazaar provides marketing to everyone
- REZ Consumer uses AdBazaar → Campaign attribution
- REZ Merchant uses AdBazaar → Merchant ads
- CorpPerks uses AdBazaar → Employee gamification

---

## HOJAI AI (AI Infrastructure)

**Role:** "The AWS of AI" - Provides AI services to all ecosystem companies

### Core Platforms

| Platform | Purpose |
|----------|---------|
| HOJAI Core | 12 platforms (API Gateway, Event, Memory, Agents, etc.) |
| MemoryOS | Multi-tier memory infrastructure |
| TwinOS | Digital twins (Human, Agent, Hybrid, Organization) |
| FlowOS | Workflow automation |
| PolicyOS | Policy & compliance |
| SUTAR OS | Autonomous Business OS |
| Agent Platform | AI employee orchestration |

### Personal Intelligence

| Product | Purpose |
|---------|---------|
| Genie AI | Personal memory, relationships, briefings |
| Razo | Voice AI, Voice agents |

### HOJAI Services by Port Range

| Port Range | Category |
|------------|----------|
| 4500-4610 | HOJAI Core (12 platforms) |
| 4595 | Web Intelligence (Scraping, News, Extraction) |
| 4596 | Web Monitoring (Scheduled, Change Detection) |
| 4597 | Web Intelligence MCP (AI Agent Tools) |
| 4750-4754 | HOJAI Intelligence (Commercial) |
| 4702-4707 | Genie (Personal AI) |
| 4850-4899 | VoiceOS |

---

## RABTUL TECHNOLOGIES (Tech Infrastructure)

**Role:** "Infrastructure for money movement" - Provides payments, auth, wallet, BNPL

### Core Services

| Port | Service | Purpose |
|------|---------|---------|
| 4001 | REZ Payment Service | Razorpay, UPI, Cards |
| 4002 | REZ Auth Service | JWT, OTP, MFA, OAuth |
| 4004 | REZ Wallet Service | Coins, Balance, Cashback |
| 4300 | QR Cloud Service | Restaurant QR ordering |

### Financial Services

| Port | Service | Purpose |
|------|---------|---------|
| 4006 | REZ Order Service | Order lifecycle |
| 4007 | REZ Catalog Service | Products, inventory |
| 4009 | REZ Delivery Service | Driver tracking |
| 4020 | REZ Booking Service | Reservations |

---

## OTHER COMPANIES (Quick Reference)

### CorpPerks
- **Role:** Workforce OS - Human + Agent + Hybrid Twins
- **Key Products:** PeopleOS, TalentAI, CorpID, SALAR OS
- **GitHub:** imrejaul007/CorpPerks

### RisaCare
- **Role:** Healthcare OS - Patient, Clinic, Hospital, Telemedicine
- **Key Products:** Patient Platform, EMR, Insurance, Pharmacy
- **GitHub:** imrejaul007/RisaCare

### StayOwn
- **Role:** Hospitality OS - Hotels, Vacation Rentals
- **Key Products:** Hotel OTA, Room QR, Habixo
- **GitHub:** imrejaul007/StayOwn-Hospitality

### AdBazaar
- **Role:** Advertising & Marketing Intelligence
- **Key Products:** Campaign Manager, Attribution, Retail Media
- **GitHub:** imrejaul007/REZ-Media

### Nexha
- **Role:** Commerce Network OS
- **Key Products:** FranchiseOS, DistributionOS, ProcurementOS
- **GitHub:** (see Nexha directory)

### RisnaEstate
- **Role:** Real Estate OS
- **Key Products:** Property Marketplace, Property CRM, PropFlow AI
- **GitHub:** Imrejaul007/RisnaEstate

### KHAIRMOVE
- **Role:** Mobility OS
- **Key Products:** Ride, Driver, Fleet, Logistics
- **GitHub:** imrejaul007/KHAIRMOVE

### LawGens
- **Role:** Legal AI
- **Key Products:** Contract analysis, Compliance, Court research
- **Ports:** 5098-5123

### RIDZA
- **Role:** Finance OS
- **Key Products:** Credit, Insurance, Lending
- **GitHub:** imrejaul007/RTNM-Group

### AssetMind
- **Role:** Financial Intelligence
- **Key Products:** Bloomberg-like platform, Asset/Market/Portfolio Twins
- **Ports:** 5001-5299

---

## QUICK START

```bash
# Health checks
curl http://localhost:4850/health    # Unified Platform
curl http://localhost:4240/health    # SUTAR OS
curl http://localhost:4703/health    # Genie Memory

# Demo
npx tsx demo/scripts/final-demo.ts
```

---

## SERVICES RUNNING (June 2026)

| Service | Port | Status |
|---------|------|--------|
| Unified Platform | 4850 | ✅ |
| Training Pipeline | 4880 | ✅ |
| Event Bus | 4510 | ✅ |
| Memory | 4520 | ✅ |
| Commerce Intelligence | 4750 | ✅ |
| GENIE Memory | 4703 | ✅ |
| GENIE Relationship | 4704 | ✅ |
| GENIE Briefing | 4706 | ✅ |
| REZ Intent Predictor | 4018 | ✅ |
| REZ Predictive Engine | 4123 | ✅ |
| REZ Memory Layer | 4201 | ✅ |
| Web Intelligence | 4595 | ✅ |
| Web Monitoring | 4596 | ✅ |
| Web Intelligence MCP | 4597 | ✅ |

---

## UNIFIED HUB (Port 4600)

The Unified Hub connects all companies to RABTUL services and HOJAI AI through a single entry point.

### Connected Services

| Service | Port | Purpose |
|---------|------|---------|
| Unified Hub | 4600 | Main API Gateway |
| Event Bus Bridge | 4090 | RABTUL ↔ HOJAI Event Bridge |

### RABTUL Services via Hub

| Service | Port | Purpose |
|---------|------|---------|
| Auth | 4002 | User authentication |
| Payment | 4001 | Payments (Razorpay, UPI) |
| Wallet | 4004 | Balance, coins, cashback |
| Order | 4006 | Order lifecycle |
| Booking | 4020 | Reservations |
| Notifications | 4011 | Push, SMS, Email |

### HOJAI AI Services via Hub

| Service | Port | Purpose |
|---------|------|---------|
| HOJAI Gateway | 4500 | API Gateway |
| HOJAI Memory | 4520 | Vector memory |
| HOJAI Intelligence | 4530 | ML predictions |
| HOJAI Agents | 4550 | AI agents |
| HOJAI Workflows | 4560 | Automation |
| HOJAI Web Intelligence | 4595 | Scraping, News, Extraction |
| HOJAI Web Monitoring | 4596 | Scheduled monitoring, Change detection |
| HOJAI Web Intelligence MCP | 4597 | AI agent tools |
| Genie Memory | 4703 | Personal memories |
| Genie Relationship | 4704 | Personal connections |
| Genie Briefing | 4706 | Daily briefings |
| Commerce AI | 4750 | Commerce insights |
| Customer AI | 4752 | CRM insights |
| Marketing AI | 4753 | Campaign optimization |
| Financial AI | 4754 | Finance analysis |

### SUTAR OS via Hub

| Service | Port | Purpose |
|---------|------|---------|
| SUTAR Gateway | 4140 | OS entry point |
| TwinOS | 4142 | Digital twins |
| Intent Bus | 4154 | Intent propagation |
| Decision Engine | 4240 | Autonomous decisions |
| Goal OS | 4242 | Goal tracking |
| Simulation | 4241 | Market simulation |
| Marketplace | 4250 | Agent marketplace |
| Discovery | 4149 | Partner discovery |

---

## COMPANY INTEGRATIONS

### StayOwn-Hospitality (Port 4801)

**Role:** Hospitality OS - Hotels, Vacation Rentals, Habixo

**Key Products:**
- Hotel OTA management
- Room QR ordering
- AI Concierge
- Guest preferences

**Integrations:**
- Unified Hub (4600) - All RABTUL + HOJAI AI
- HOJAI Memory (4520) - Guest preferences
- HOJAI Agents (4550) - AI Concierge
- HOJAI Intelligence (4750) - Pricing optimization
- Genie Memory (4703) - Guest experiences
- RABTUL Wallet (4004) - Payments
- RABTUL Auth (4002) - Guest authentication

**Files:**
- [services.json](StayOwn-Hospitality/services.json) - Service registry
- [src/hub-client.ts](StayOwn-Hospitality/src/hub-client.ts) - Hub client
- [src/index.ts](StayOwn-Hospitality/src/index.ts) - API entry point

### RisnaEstate (Port 4901)

**Role:** Real Estate OS - Property Marketplace, CRM, PropFlow AI

**Key Products:**
- Property listings
- AI-powered recommendations
- Property digital twins
- Lead management

**Integrations:**
- Unified Hub (4600) - All RABTUL + HOJAI AI
- HOJAI Intelligence (4750) - Price prediction
- HOJAI Memory (4520) - Buyer preferences
- HOJAI Agents (4550) - Property assistant
- SUTAR TwinOS (4142) - Property twins
- SUTAR Simulation (4241) - Market simulation
- RABTUL Payment (4001) - Transactions
- RABTUL Wallet (4004) - Deposits

**Files:**
- [services.json](RisnaEstate/services.json) - Service registry
- [src/hub-client.ts](RisnaEstate/src/hub-client.ts) - Hub client
- [src/index.ts](RisnaEstate/src/index.ts) - API entry point

### Nexha-Commerce-Network (Port 5001)

**Role:** Commerce Network OS - FranchiseOS, DistributionOS, ProcurementOS

**Key Products:**
- Franchise management
- Distribution network
- Smart contracts
- Agent marketplace

**Integrations:**
- Unified Hub (4600) - All RABTUL services
- HOJAI Gateway (4500) - AI gateway
- HOJAI Memory (4520) - Network preferences
- HOJAI Intelligence (4750) - Demand forecasting
- HOJAI Workflows (4560) - Automation
- SUTAR Intent Bus (4154) - Intent propagation
- SUTAR Discovery (4149) - Supplier discovery
- SUTAR Marketplace (4250) - Agent marketplace
- SUTAR Contract (4190) - Smart contracts
- SUTAR Decision (4240) - Autonomous decisions

**Files:**
- [services.json](Nexha/services.json) - Service registry
- [src/services/hub-client.ts](Nexha/nexha-commerce-network/src/services/hub-client.ts) - Hub client
- [src/index.ts](Nexha/nexha-commerce-network/src/index.ts) - API entry point

### REZ-Consumer (Port 4200)

**Role:** Consumer App - Genie AI, Wallet, Rewards, Safe QR

**Key Products:**
- Personal AI (Genie)
- Wallet & Payments
- Loyalty rewards
- Voice commands

**Integrations:**
- Unified Hub (4600) - All RABTUL services
- Genie Memory (4703) - Personal memories
- Genie Relationship (4704) - Personal connections
- Genie Briefing (4706) - Daily briefings
- Commerce AI (4750) - Shopping insights
- Customer AI (4752) - Intent prediction
- Marketing AI (4753) - Personalized offers
- Financial AI (4754) - Spending insights
- SUTAR TwinOS (4142) - User twin
- SUTAR Goal (4242) - Goal tracking
- Voice OS (4760) - Voice commands
- Voice Agents (4780) - AI voice assistant

**Files:**
- [services/hub-client.ts](REZ-Consumer/services/hub-client.ts) - Hub client
- [services/index.ts](REZ-Consumer/services/index.ts) - API entry point

### CorpPerks (Port 4720)

**Role:** Workforce OS - Human + Agent + Hybrid Twins

**Key Products:**
- PeopleOS
- TalentAI
- CorpID
- HRMS

**Integrations:**
- Unified Hub (4600) - All RABTUL services
- SUTAR TwinOS (4142) - Employee twins
- SUTAR Goal (4242) - Goal tracking
- HOJAI Memory (4520) - Employee experiences
- HOJAI Agents (4550) - HR assistant
- HOJAI Intelligence (4530) - Employee insights
- Genie Memory (4703) - Personal work memories
- Genie Relation (4704) - Colleague relationships
- Genie Briefing (4706) - Daily briefings

**Files:**
- [services/hub-client.ts](CorpPerks/services/hub-client.ts) - Hub client
- [services/index.ts](CorpPerks/services/index.ts) - API entry point

### RisaCare (Port 4800)

**Role:** Healthcare OS - Patient, Clinic, Hospital, Telemedicine

**Key Products:**
- Patient Platform
- EMR
- Insurance
- Pharmacy

**Integrations:**
- Unified Hub (4600) - All RABTUL services
- SUTAR TwinOS (4142) - Patient twins
- HOJAI Memory (4520) - Medical history
- HOJAI Intelligence (4530) - Health insights
- HOJAI Agents (4550) - Health assistant
- Genie Memory (4703) - Health experiences
- Genie Relation (4704) - Doctor relationships

**Files:**
- [services/hub-client.ts](RisaCare/services/hub-client.ts) - Hub client
- [services/index.ts](RisaCare/services/index.ts) - API entry point

### KHAIRMOVE (Port 4600)

**Role:** Mobility OS - Ride, Driver, Fleet, Logistics

**Key Products:**
- Ride-hailing
- Fleet management
- Hyperlocal delivery
- BuzzLocal (carpooling)

**Integrations:**
- Unified Hub (4600) - All RABTUL services
- REZ Intelligence - Intent prediction, signal tracking, fraud detection
- HOJAI Memory (4520) - Driver experiences
- HOJAI Intelligence (4530) - Route optimization
- RABTUL Wallet (4004) - 10% cashback
- RABTUL Notifications (4011) - Push notifications

**Files:**
- [src/services/hub-client.ts](KHAIRMOVE/src/services/hub-client.ts) - Hub client

### REZ-Merchant (Port 4100)

**Role:** Merchant Platform - POS, KDS, QR Cloud, Loyalty

**Key Products:**
- POS System
- Kitchen Display System
- QR Cloud menus
- Merchant loyalty

**Integrations:**
- Unified Hub (4600) - All RABTUL services
- SUTAR TwinOS (4142) - Merchant twins
- HOJAI Memory (4520) - Merchant experiences
- HOJAI Agents (4550) - Merchant assistant
- HOJAI Intelligence (4530) - Sales insights
- Merchant AI (4751) - Business intelligence

**Files:**
- [services/hub-client.ts](REZ-Merchant/services/hub-client.ts) - Hub client

### AdBazaar (Port 4300)

**Role:** Advertising & Marketing Intelligence

**Key Products:**
- Campaign Manager
- Attribution
- Retail Media

**Integrations:**
- Unified Hub (4600) - All RABTUL services
- SUTAR TwinOS (4142) - Audience twins
- HOJAI Memory (4520) - Campaign history
- HOJAI Intelligence (4530) - Marketing predictions
- Marketing AI (4753) - Campaign optimization
- Intent signals aggregator (4800)

**Files:**
- [services/hub-client.ts](REZ-Media/services/hub-client.ts) - Hub client

### LawGens (Port 5100)

**Role:** Legal AI

**Key Products:**
- Contract analysis
- Compliance
- Court research

**Integrations:**
- Unified Hub (4600) - All RABTUL services
- HOJAI Memory (4520) - Legal research
- HOJAI Intelligence (4530) - Contract analysis
- HOJAI Agents (4550) - Legal assistant
- Financial AI (4754) - Financial compliance

**Files:**
- [services/hub-client.ts](LawGens/services/hub-client.ts) - Hub client

### RIDZA (Port 5200)

**Role:** Finance OS - Credit, Insurance, Lending

**Key Products:**
- Credit services
- Insurance
- Lending

**Integrations:**
- Unified Hub (4600) - All RABTUL services
- SUTAR TwinOS (4142) - Financial twins
- HOJAI Memory (4520) - Financial history
- HOJAI Intelligence (4530) - Risk prediction
- Financial AI (4754) - Credit scoring, investment insights

**Files:**
- [services/hub-client.ts](RIDZA/services/hub-client.ts) - Hub client

---

## EVENT BUS BRIDGE (Port 4090)

**Purpose:** Bidirectional sync between RABTUL Event Bus (4025) and HOJAI Event Bus (4510)

**Features:**
- Event type mapping
- Automatic retry for failed events
- Event buffering
- Cross-system communication

**Configuration:**
```bash
RABTUL_EVENT_BUS=http://rez-event-bus:4025
HOJAI_EVENT_BUS=http://hojai-event-bus:4510
```

---

## DEPLOYMENT

### Docker Compose
```bash
docker compose -f REZ-Ecosystem-docker-compose.yml up -d
```

### Startup Script
```bash
./start-rez-ecosystem.sh all      # All services
./start-rez-ecosystem.sh hojai     # HOJAI AI only
./start-rez-ecosystem.sh rabtul    # RABTUL only
./start-rez-ecosystem.sh status    # Check status
./start-rez-ecosystem.sh ports     # Show all ports
```

### Service Launcher (TypeScript)
```bash
npx tsx start-services.ts all      # All services
npx tsx start-services.ts hojai    # HOJAI AI only
npx tsx start-services.ts dev     # Development mode
```

---

## PORT REFERENCE

| Range | Category |
|-------|----------|
| 4001-4025 | RABTUL Services |
| 4090 | Event Bus Bridge |
| 4100 | REZ Merchant |
| 4140-4254 | SUTAR OS |
| 4200 | REZ Consumer |
| 4201 | REZ Memory Layer |
| 4300 | AdBazaar |
| 4500-4590 | HOJAI AI Core |
| 4600 | Unified Hub / KHAIRMOVE |
| 4703-4707 | Genie (Personal AI) |
| 4720 | CorpPerks |
| 4750-4754 | HOJAI Intelligence Suite |
| 4800 | RisaCare |
| 4801 | StayOwn |
| 4901 | RisnaEstate |
| 5001 | Nexha |
| 5100 | LawGens |
| 5200 | RIDZA |

---

## KEY DOCUMENTS

| Document | Purpose |
|----------|---------|
| [README.md](README.md) | Master index |
| [RTNM-COMPLETE-AUDIT.md](RTNM-COMPLETE-AUDIT.md) | Full ecosystem audit |
| [ECOSYSTEM-REGISTRY.md](ECOSYSTEM-REGISTRY.md) | Complete service registry |

---

## IMPORTANT NOTES

1. **"ReZ Full App" is NOT a git repository** - it's a local folder containing multiple company repositories
2. **Each company has its own git repo** - see the GitHub Repository table above
3. **Always work in the correct company directory** - never push to "ReZ Full App"
4. **Every company is both provider and consumer** - the ecosystem is interconnected

---

**License:** Proprietary - RTNM Digital
