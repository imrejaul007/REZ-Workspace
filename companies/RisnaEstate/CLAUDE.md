# RisnaEstate - AI-Powered Real Estate Commerce Platform

**Version:** 1.0.0
**Status:** PRODUCTION READY
**Tagline:** "AI-Powered Real Estate Distribution and Intelligence"
**Markets:** India + UAE

---

## OVERVIEW

RisnaEstate is a comprehensive real estate platform providing Property Marketplace, Property Intelligence, Property CRM, Broker Network, Golden Visa services, Multi-Level Referrals, and PropFlow AI (12 AI agents).

**GitHub:** github.com/Imrejaul007/RisnaEstate

---

## ECOSYSTEM STRUCTURE

```
RTNM Digital (Parent Company / REZ Ecosystem)
│
├── All Sister Companies (each independent, each shares services):
│   ├── HOJAI AI ──────────────→ provides AI to everyone
│   ├── RABTUL Technologies ───→ provides infrastructure to everyone
│   ├── AdBazaar ─────────────→ provides marketing to everyone
│   ├── Nexha ────────────────→ provides commerce to everyone
│   ├── CorpPerks ────────────→ provides HR/workforce to everyone
│   ├── RisaCare ─────────────→ provides healthcare to everyone
│   ├── StayOwn ──────────────→ provides hospitality to everyone
│   ├── RisnaEstate ←──────── YOU ARE HERE
│   ├── REZ Consumer ─────────→ provides consumer app to everyone
│   ├── REZ Merchant ─────────→ provides merchant platform to everyone
│   ├── KHAIRMOVE ───────────→ provides mobility to everyone
│   ├── LawGens ─────────────→ provides legal to everyone
│   ├── RIDZA ───────────────→ provides finance to everyone
│   ├── AssetMind ───────────→ provides financial intel to everyone
│   ├── Axom ────────────────→ provides future tech to everyone
│   ├── Karma Foundation ─────→ provides social impact to everyone
│   └── ... other companies
```

---

## ALL ECOSYSTEM COMPANIES (from RTNM-COMPANIES-AUDIT.md)

### 1. HOJAI AI
**Role:** "The AWS of AI" - Provides AI services to all ecosystem companies
**GitHub:** github.com/imrejaul007/hojai-ai

#### Core Platforms
| Product | Type | Purpose |
|---------|------|---------|
| **HOJAI Core** | Platform | 12 core platforms (API Gateway, Event Bus, Memory, Intelligence, Agents, Workflows, Communications, etc.) |
| **MemoryOS** | Platform | Multi-tier memory infrastructure |
| **TwinOS** | Platform | Digital twins (Human, Agent, Organization, Asset) |
| **FlowOS** | Platform | Workflow automation |
| **Genie OS** | Platform | Personal AI assistant |
| **HOJAI Bridge** | Platform | Universal connector to all HOJAI products |
| **Industry AI** | Platform | Industry-specific AI models |
| **HIB** | Platform | Human Intelligence Bridge |
| **AssetMind** | Platform | Financial Intelligence |
| **Nexha** | Platform | Commerce Network Intelligence |
| **RisaCare** | Platform | Healthcare Intelligence |
| **StayOwn** | Platform | Hospitality Intelligence |
| **CorpPerks** | Platform | Workforce Intelligence |
| **KHAIRMOVE** | Platform | Mobility Intelligence |

#### HOJAI Services (from services.json)
| Service | Port | Category |
|---------|------|----------|
| **HOJAI Bridge** | 5140 | Universal Connector |
| **BrandPulse** | 4770 | Brand Intelligence |
| **HIB** | 3053 | Human Intelligence |
| **AssetMind** | 5001 | Financial Intelligence |
| **Nexha** | 5002 | Commerce Network |
| **RisaCare** | 4800 | Healthcare Intelligence |
| **StayOwn** | 4801 | Hospitality Intelligence |
| **CorpPerks** | 4720 | Workforce Intelligence |
| **KHAIRMOVE** | 4600 | Mobility Intelligence |
| **Genie OS** | 4703 | Personal AI |
| **Industry AI** | 4750 | Industry Intelligence |
| **Memory** | 4520 | Core Platform |
| **Intelligence** | 4530 | Core Platform |
| **Agents** | 4550 | Core Platform |

#### HOJAI SkillNet - LearningOS (5105-5119)
| Service | Port | Description |
|---------|------|-------------|
| **Core Training** | 5105 | Training job management |
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

### HOJAI AI Services Currently Running (June 13, 2026)

RisnaEstate integrates with the following HOJAI AI services:

| Port | Service | Status | Purpose |
|------|---------|--------|---------|
| 4600 | hojai-business-copilot | ✅ RUNNING | Unified gateway (8 interfaces) |
| 4520 | hojai-memory | ✅ RUNNING | Memory infrastructure (L1-L5) |
| 4550 | hojai-expert-os | ✅ RUNNING | Agent runtime platform |
| 4700 | hojai-meeting-intelligence | ✅ RUNNING | AI meeting management |
| 4708 | genie-project-service | ✅ RUNNING | Project & task management |
| 4752 | hojai-customer-intelligence | ✅ RUNNING | Customer 360 |
| 4755 | hojai-product-intelligence | ✅ RUNNING | Product hub |
| 4756 | hojai-competitive-intelligence | ✅ RUNNING | Competitive intel |
| 4757 | hojai-revenue-intelligence | ✅ RUNNING | Revenue tracking & forecasting |
| 4242 | hojai-goal-os | ✅ RUNNING | Goal management & OKRs |
| 4244 | sutar-flow-os | ✅ RUNNING | Workflow orchestration |
| 4260 | hojai-founder-os | ✅ RUNNING | Founder tools & briefings |
| 4810 | hojai-graph | ✅ RUNNING | Knowledge graph (31 entities) |
| 4820 | hojai-workforce | ✅ RUNNING | AI employee marketplace |
| 4860 | hojai-twin | ✅ RUNNING | Digital twins |
| 4870 | hojai-board | ✅ RUNNING | AI C-Suite advisory board |
| 4241 | sutar-simulation-os | ✅ RUNNING | What-if scenarios |

**Total: 18 HOJAI AI services running**

**Verified Working:**
- ✅ Gateway health endpoint
- ✅ Chat interface (24 industries)
- ✅ Query router with intent classification
- ✅ Skills catalog
- ✅ 120+ skills across 24 industries

---

### 2. RABTUL Technologies
**Role:** "The AWS of Infrastructure" - Provides infrastructure services to all ecosystem companies

#### Core Services
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

---

### 3. AdBazaar
**Role:** "The AWS of Marketing" - Provides marketing and advertising services

#### Services
| Service | Purpose |
|---------|---------|
| **Campaign Manager** | Multi-channel campaign orchestration |
| **Ad Server** | Programmatic ad serving |
| **DOOH Network** | Digital out-of-home advertising |
| **QR Generator** | Dynamic QR code generation |
| **Attribution Hub** | Multi-touch attribution tracking |
| **Influencer Platform** | Influencer discovery and management |

---

### 4. Nexha
**Role:** "The AWS of Commerce" - Provides commerce network intelligence

#### Services
| Service | Purpose |
|---------|---------|
| **Franchise Network** | Multi-brand franchise management |
| **Distribution Network** | Supply chain optimization |
| **Procurement** | Vendor management, purchasing |
| **Commerce Analytics** | Sales intelligence, trends |

---

### 5. CorpPerks
**Role:** "The AWS of HR/Workforce" - Provides employee benefits and HR services

#### Services
| Service | Purpose |
|---------|---------|
| **Employee Benefits** | Corporate perks, discounts |
| **Payroll** | Salary processing, compliance |
| **Attendance** | Time tracking, geofencing |
| **Performance** | KPIs, reviews, feedback |

---

### 6. RisaCare
**Role:** "The AWS of Healthcare" - Provides healthcare intelligence

#### Services
| Service | Purpose |
|---------|---------|
| **Patient Management** | EMR, appointments |
| **Telemedicine** | Video consultations |
| **Pharmacy** | Prescription management |
| **Insurance** | Claims processing |

---

### 7. StayOwn
**Role:** "The AWS of Hospitality" - Provides hospitality intelligence

#### Services
| Service | Purpose |
|---------|---------|
| **Property Management** | Hotel/hostel operations |
| **Booking Engine** | Reservations, availability |
| **Guest Experience** | Check-in, preferences |
| **Revenue Management** | Pricing optimization |

---

### 8. REZ Consumer
**Role:** "The AWS of Consumer Apps" - Provides consumer-facing applications

#### Apps
| App | Purpose |
|-----|---------|
| **REZ App** | Super app for consumers |
| **REZ Pay** | Payments, wallets |
| **REZ Shop** | E-commerce |
| **REZ Travel** | Bookings, travel |

---

### 9. REZ Merchant
**Role:** "The AWS of Merchant Platform" - Provides merchant tools

#### Services
| Service | Purpose |
|---------|---------|
| **Merchant Dashboard** | Analytics, orders |
| **POS System** | Point of sale |
| **Inventory** | Stock management |
| **CRM** | Customer relationships |

---

### 10. KHAIRMOVE
**Role:** "The AWS of Mobility" - Provides mobility and transportation

#### Services
| Service | Purpose |
|---------|---------|
| **Ride Hailing** | Taxi, auto, bike |
| **Delivery** | Package, food delivery |
| **Fleet Management** | Vehicle tracking |
| **Mobility Analytics** | Demand prediction |

---

### 11. LawGens
**Role:** "The AWS of Legal" - Provides legal services and automation

#### Services
| Service | Purpose |
|---------|---------|
| **Contract Generator** | Legal document creation |
| **Compliance Checker** | Regulatory compliance |
| **Case Management** | Legal workflow |
| **IP Management** | Trademarks, patents |

---

### 12. RIDZA
**Role:** "The AWS of Finance" - Provides financial services

#### Services
| Service | Purpose |
|---------|---------|
| ** Lending** | Loans, credit |
| **Insurance** | Financial protection |
| **Investments** | Portfolio management |
| **Tax Filing** | Tax preparation |

---

### 13. AssetMind
**Role:** "The AWS of Financial Intelligence" - Provides investment intelligence

#### Services
| Service | Purpose |
|---------|---------|
| **Investor Overview** | Company analysis |
| **Market Sentiment** | Social listening |
| **Portfolio Summary** | Asset tracking |
| **Risk Analysis** | Investment risk scoring |

---

### 14. Axom
**Role:** "The AWS of Future Tech" - Provides emerging technology

#### Services
| Service | Purpose |
|---------|---------|
| **AR/VR** | Immersive experiences |
| **Blockchain** | Web3 integration |
| **IoT** | Connected devices |
| **Quantum** | Future computing |

---

### 15. Karma Foundation
**Role:** "The AWS of Social Impact" - Provides CSR and sustainability

#### Services
| Service | Purpose |
|---------|---------|
| **Impact Tracking** | Carbon, sustainability |
| **Volunteer Hub** | Volunteer management |
| **Donations** | Fundraising |
| **Social Analytics** | Impact measurement |

---

## RISNAESTATE PRODUCTS & FEATURES

### 1. Property Marketplace

| Feature | Description |
|---------|-------------|
| **Listing Search** | Buy, rent, commercial properties |
| **Advanced Filters** | Location, price range, property type, bedrooms |
| **Virtual Tours** | 360° walkthrough |
| **Mortgage Calculator** | EMI calculation, eligibility check |
| **Neighborhood Info** | Schools, transit, amenities |
| **Price Trends** | Historical data analysis |
| **Property Comparison** | Side-by-side comparison |
| **Favorites** | Save and share properties |

### 2. Property Intelligence

| Feature | Description |
|---------|-------------|
| **User Preferences** | AI learning from user behavior |
| **Similar Properties** | Personalized matches |
| **Price Prediction** | Market trends analysis |
| **Investment Analysis** | ROI calculation |
| **Demand Forecasting** | Area-wise demand trends |
| **Competitor Analysis** | Market positioning |

### 3. Lead Management

| Feature | Description |
|---------|-------------|
| **Lead Capture** | Multiple sources (web, mobile, WhatsApp) |
| **Lead Scoring** | AI prioritization (Hot/Warm/Cold) |
| **NRI Detection** | Auto-identification of NRI leads |
| **HNI Detection** | High Net Worth Individual identification |
| **Smart Routing** | Distribution to appropriate brokers |
| **Follow-up Reminders** | Automated task generation |
| **Lead Assignment** | Round-robin, territory-based |
| **Lead Nurturing** | Automated drip campaigns |

### 4. Broker Network

| Feature | Description |
|---------|-------------|
| **Broker Portal** | CRM for brokers |
| **Team Management** | Hierarchy, targets, reporting |
| **Commission Tracking** | Auto-calculation of commissions |
| **Training Module** | Product knowledge courses |
| **Performance Analytics** | KPIs, conversions |
| **Lead Distribution** | Territory management |
| **Broker Verification** | KYC, credential verification |

### 5. Referrals & Rewards

| Feature | Description |
|---------|-------------|
| **Multi-Level Referrals** | Buyer → Broker → Influencer |
| **Commission Structure** | Tiered rates (L1/L2/L3) |
| **Referral Tracking** | Link-based attribution |
| **Instant Payouts** | UPI, bank transfer |
| **Referral Dashboard** | Earnings, downline |
| **Influencer Tracking** | Social media attribution |

### 6. Golden Visa

| Feature | Description |
|---------|-------------|
| **Eligibility Check** | UAE Golden Visa criteria |
| **Document Checklist** | Required papers |
| **Application Tracking** | Status updates |
| **Agent Coordination** | Visa assistance |
| **Property Investment** | Minimum AED 2M threshold |
| **Family Sponsorship** | Dependent visa support |

### 7. PropFlow AI (12 AI Agents)

| Agent | Purpose |
|-------|---------|
| **Property Recommender** | Personalized property suggestions |
| **Price Predictor** | Market price estimation |
| **Lead Qualifier** | BANT-based qualification |
| **Tour Scheduler** | Site visit coordination |
| **Contract Drafter** | Legal document generation |
| **Mortgage Advisor** | Loan eligibility & options |
| **Investment Advisor** | ROI analysis |
| **Market Analyst** | Market trends & insights |
| **Negotiation Bot** | Price negotiation assistance |
| **Document Verifier** | KYC/document validation |
| **Follow-up Agent** | Automated follow-ups |
| **Closing Coach** | Deal closing assistance |

---

## SERVICES ARCHITECTURE (30 Microservices)

### Core Services (7)

| Service | Port | Purpose |
|---------|------|---------|
| **risna-gateway** | 3000 | API Gateway, routing, auth |
| **risna-property-service** | 4100 | Property listings, search |
| **risna-lead-service** | 4101 | Lead capture, scoring |
| **risna-visa-service** | 4102 | Golden Visa eligibility |
| **risna-referral-service** | 4103 | Multi-level commissions |
| **risna-crm-service** | 4105 | Follow-ups, visits |
| **risna-media-service** | 4106 | Campaigns, marketing |

### Transaction Services (3)

| Service | Port | Purpose |
|---------|------|---------|
| **risna-deal-service** | 4119 | Deal management |
| **risna-agreement-service** | 4127 | Contract generation |
| **risna-handover-service** | 4129 | Property handover |

### Intelligence Services (4)

| Service | Port | Purpose |
|---------|------|---------|
| **risna-intelligence-service** | 4110 | AI recommendations |
| **risna-whatsapp-service** | 4111 | WhatsApp integration |
| **risna-investment-service** | 4112 | Investment analysis |
| **risna-distribution-service** | 4113 | Distribution network |

### Platform Services (16)

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

## INTEGRATIONS

### RABTUL Services

| Service | Port | Usage |
|---------|------|-------|
| **REZ Auth** | 4002 | JWT, OTP, MFA |
| **REZ Payment** | 4001 | Razorpay, UPI |
| **REZ Wallet** | 4004 | REZ Coins, cashback |
| **REZ Notifications** | 4011 | Push, SMS, WhatsApp |

### HOJAI AI Services

| Service | Port | Usage |
|---------|------|-------|
| **HOJAI Intelligence** | 4018 | NRI/HNI/Investor scoring |
| **HOJAI Memory** | 4520 | User preferences |
| **HOJAI Agents** | 4550 | Property search AI |
| **HOJAI TwinOS** | 4142 | Property digital twins |

---

## PORTS REFERENCE

| Range | Category | Services |
|-------|----------|----------|
| 3000 | Gateway | 1 service |
| 4100-4108 | Core Services | 7 services |
| 4110-4113 | Intelligence | 4 services |
| 4114-4118 | Integration | 5 services |
| 4119 | Deal | 1 service |
| 4120-4126 | Platform | 7 services |
| 4127 | Agreement | 1 service |
| 4129 | Handover | 1 service |

---

## DEPLOYMENT

### Quick Start

```bash
# Docker (Recommended)
docker-compose up -d

# Check status
curl http://localhost:3000/health

# All services health
npm run health
```

### Environment Variables

```bash
# Security (REQUIRED)
JWT_SECRET=your-super-secret-jwt-key
INTERNAL_SERVICE_TOKEN=your-internal-service-token

# Database
MONGODB_URI=mongodb://localhost:27017/risnaestate
REDIS_URL=redis://localhost:6379

# CORS
CORS_ORIGIN=https://risnaestate.com

# RABTUL Services
REZ_AUTH_URL=http://localhost:4002
REZ_PAYMENT_URL=http://localhost:4001
REZ_WALLET_URL=http://localhost:4004
```

---

## APPS & PORTALS

| Portal | Type | Purpose |
|--------|------|---------|
| **Consumer Portal** | Web | Property search, booking |
| **Broker Portal** | Web | Lead management, earnings |
| **Admin Portal** | Web | User management, analytics |
| **Mobile App** | App | 17+ screens |

---

## MONITORING

```bash
# Prometheus metrics
curl http://localhost:3000/metrics

# Health check all services
npm run health
```

---

## SECURITY

- JWT authentication (7-day expiry)
- Rate limiting (100 req/min)
- CORS configured for specific origins
- Helmet security headers
- Input sanitization (mongo-sanitize)
- API key authentication for internal services

---

## FILES

| File | Purpose |
|------|---------|
| `CLAUDE.md` | This file - Company overview |
| `PRODUCTS-FEATURES.md` | Detailed product specs |
| `SOT.md` | Source of Truth |
| `docs/API.md` | API reference |
| `docs/ARCHITECTURE.md` | System architecture |
| `docker-compose.yml` | Production deployment |
| `DEPLOYMENT.md` | Deployment guide |

---

## HOJAI AI Integration

**Connected to:** HOJAI AI Business Copilot Platform
**Status:** 21/21 Services Running | June 14, 2026 🎉

### HOJAI AI Services Connected

| Port | Service | Purpose |
|------|---------|---------|
| 4600 | hojai-business-copilot | Unified gateway |
| 4002 | core/business-copilot | 24 industries |
| 4810 | hojai-graph | Knowledge graph |
| 4860 | hojai-twin | Digital twins |
| 4870 | hojai-board | AI C-Suite |
| 4520 | hojai-memory | Memory infrastructure |
| 4530 | hojai-intelligence | ML predictions |
| 4550 | hojai-expert-os | Agent runtime |
| 4580 | hojai-agent-marketplace | AI agent library |
| 4801 | hojai-command-center | Executive dashboard |
| + 11 more services | | |

### Access Points

| Service | URL |
|---------|-----|
| Business Copilot | http://localhost:4600 |
| Command Center | http://localhost:4801 |

**Last Updated:** June 14, 2026

---

**Last Updated:** June 14, 2026
**Status:** PRODUCTION READY - All 30 services deployed