# RTNM Digital - REZ Marketing Service Company Audit

**Version:** 1.0
**Date:** June 12, 2026
**Company:** AdBazaar
**Product:** REZ Marketing Service

---

## COMPANY OVERVIEW

**Name:** REZ Marketing Service
**Company:** AdBazaar
**Type:** Marketing & Advertising
**Port:** 4136
**Tagline:** "Marketing Automation for the RTNM Ecosystem"

## ECOSYSTEM ROLE

```
RTNM Digital
├── AdBazaar
│   └── REZ Marketing ────────────→ provides marketing to all RTNM ecosystem
│       ├── StayOwn ──────────────→ Hotel guest marketing
│       ├── All Companies ──────────→ Enterprise marketing
│       └── REZ-Consumer ───────────→ Consumer engagement
```

---

## SERVICES

### Core Services

| Port | Service | Purpose | Status |
|------|---------|---------|--------|
| **4136** | REZ-marketing-service | Campaign management | ✅ |

### Related Services

| Service | Purpose |
|---------|---------|
| **REZ-ads-service** | Ad serving |
| **REZ-feedback-service** | User feedback |
| **REZ-gamification-service** | Gamification engine |
| **REZ-graph-api** | Social graph |
| **REZ-journey-service** | Customer journeys |

---

## RTNM INTEGRATIONS

### StayOwn Hotel OS Integration (NEW - June 2026)

REZ Marketing now integrates with StayOwn Hotel OS for hotel guest marketing.

#### Endpoints Added

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/hotels/:hotelId/guests` | GET | Get hotel guests |
| `/api/v1/hotels/:hotelId/campaigns` | POST | Create hotel campaign |
| `/api/v1/campaigns/:campaignId/performance` | GET | Get campaign performance |
| `/api/v1/campaigns/:campaignId/track` | POST | Track conversion |
| `/api/v1/guests/:guestId/preferences` | GET | Get guest preferences |
| `/api/v1/hotels/:hotelId/loyalty/members` | GET | Get loyalty members |
| `/api/v1/guests/:guestId/offers` | POST | Send targeted offer |
| `/api/v1/integration/stayown/status` | GET | Check integration health |

#### Integration Flow

```
Hotel wants to run campaign
        ↓
GET /api/v1/hotels/:hotelId/guests
        ↓
REZ Marketing fetches guest list
        ↓
POST /api/v1/hotels/:hotelId/campaigns
        ↓
Campaign created for hotel guests
        ↓
Track conversions via /api/v1/campaigns/:id/track
        ↓
Monitor via /api/v1/campaigns/:id/performance
```

#### Configuration

```bash
STAYOWN_URL=http://localhost:3899
```

---

## API ENDPOINTS

### Campaign Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/campaigns` | List campaigns |
| POST | `/api/v1/campaigns` | Create campaign |
| GET | `/api/v1/campaigns/:id` | Get campaign details |
| PUT | `/api/v1/campaigns/:id` | Update campaign |
| POST | `/api/v1/campaigns/:id/execute` | Execute campaign |

### User Segmentation

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/segments` | List segments |
| POST | `/api/v1/segments` | Create segment |
| GET | `/api/v1/segments/:id` | Get segment details |

### Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/analytics` | Marketing analytics |
| GET | `/api/v1/analytics/campaigns` | Campaign analytics |

### RTNM Hotel Marketing (NEW)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/hotels/:hotelId/guests` | Get hotel guests |
| POST | `/api/v1/hotels/:hotelId/campaigns` | Create hotel campaign |
| GET | `/api/v1/campaigns/:campaignId/performance` | Campaign performance |
| POST | `/api/v1/campaigns/:campaignId/track` | Track conversion |
| GET | `/api/v1/guests/:guestId/preferences` | Guest preferences |
| GET | `/api/v1/hotels/:hotelId/loyalty/members` | Loyalty members |
| POST | `/api/v1/guests/:guestId/offers` | Send targeted offer |

---

## TECH STACK

- **Runtime:** Node.js 20+
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** MongoDB
- **Cache:** Redis
- **Security:** Helmet, CORS, Rate Limiting, Auth
- **Logging:** Winston

---

## RTNM ECOSYSTEM CONNECTIONS

### Connected Companies

| Company | Service | Integration Type |
|---------|---------|------------------|
| **StayOwn** | Hotel OS (3899) | Hotel guest marketing |

### Connected HOJAI Services

| Service | Purpose |
|---------|---------|
| REZ Intelligence | ML predictions |
| Memory | User context |

---

## FEATURES

### Core Features

| Feature | Description |
|---------|-------------|
| Campaign Management | Create, manage, execute campaigns |
| User Segmentation | Segment users by behavior |
| Marketing Analytics | Track performance |
| Channel Orchestration | Multi-channel execution |
| Scheduling | Optimal timing |

### RTNM Integration Features (NEW)

| Feature | Description |
|---------|-------------|
| Hotel Guests | Get hotel guest list |
| Hotel Campaigns | Create targeted campaigns |
| Campaign Performance | Track hotel campaign metrics |
| Conversion Tracking | Monitor conversions |
| Guest Preferences | Personalize by preference |
| Loyalty Marketing | Target loyalty members |
| Targeted Offers | Send personalized offers |

---

## ENVIRONMENT VARIABLES

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| PORT | No | 4136 | Service port |
| MONGODB_URI | Yes | - | MongoDB connection |
| REDIS_URL | Yes | - | Redis connection |
| INTERNAL_SERVICE_TOKEN | Yes | - | Internal service auth |
| STAYOWN_URL | No | http://localhost:3899 | StayOwn Hotel OS |

---

## QUICK START

```bash
cd AdBazaar/REZ-marketing-service
npm install
npm run dev
# Service runs on port 4136
```


## SUTAR SimulationOS (HOJAI AI)

**Port:** 4241 | **Status:** ✅ Complete

### Overview
What-if analysis, Monte Carlo simulation, and scenario testing for business decisions. Part of the SUTAR OS 12-layer canonical architecture (Layer 5).

### Features

#### Scenario Planning
| Feature | Status | Description |
|---------|--------|-------------|
| Pricing Optimization | ✅ | Price elasticity testing and optimization |
| Offer Modeling | ✅ | Promotional offers and discount strategies |
| Cashback ROI | ✅ | Cashback rewards and return on investment |
| Bundle Pricing | ✅ | Bundle pricing strategy analysis |

#### Forecasting
| Feature | Status | Description |
|---------|--------|-------------|
| Demand Forecasting | ✅ | Forecast demand with seasonality |
| Cash Flow Forecasting | ✅ | Cash flow projections (inflows/outflows) |
| Revenue Forecasting | ✅ | Revenue forecasting with growth modeling |
| Cost Forecasting | ✅ | Cost structure and break-even analysis |

#### Risk Modeling
| Feature | Status | Description |
|---------|--------|-------------|
| Financial Risk | ✅ | Financial risk assessment and mitigation |
| Operational Risk | ✅ | Operational risk modeling |
| Market Risk | ✅ | Market volatility and competition risk |
| Compliance Risk | ✅ | Regulatory compliance and penalty risk |

#### Sensitivity Analysis
| Feature | Status | Description |
|---------|--------|-------------|
| What-If Analysis | ✅ | Parameter change impact analysis |
| Impact Assessment | ✅ | Scenario impact quantification |
| Recommendation Engine | ✅ | AI-powered recommendations |

#### Operations
| Feature | Status | Description |
|---------|--------|-------------|
| Staffing Optimization | ✅ | Workforce planning and optimization |
| Inventory Optimization | ✅ | Stock levels and carrying costs |
| Procurement Analysis | ✅ | Supplier comparison and sourcing |

### Supported Simulation Types
- PRICING, OFFER, CASHBACK, BUNDLE
- DEMAND, CASHFLOW, REVENUE, COST
- RISK, COMPLIANCE, STAFFING, INVENTORY, PROCUREMENT, CUSTOM

### API Endpoints
- `POST /api/v1/simulations` - Run Monte Carlo simulation
- `GET /api/v1/simulations` - List simulations
- `GET /api/v1/simulations/:id` - Get simulation result
- `POST /api/v1/simulations/:id/whatif` - What-if analysis
- `POST /api/v1/simulations/compare` - Compare scenarios

### Implementation Details
- **Technology:** Node.js, Express, TypeScript, Zod
- **Location:** `companies/hojai-ai/hojai-sutar-os/services/sutar-simulation-os/`
- **Lines of Code:** 1500+
- **Dependencies:** express, helmet, cors, express-rate-limit, zod, uuid

---
---

**Last Updated:** June 12, 2026
**Version:** 1.0

## SUTAR OS - Autonomous Economic Infrastructure (HOJAI AI)

**Company:** HOJAI AI
**Total Services:** 25
**Status:** Production Ready

### SUTAR OS 12-Layer Architecture

| Layer | Service | Port | Status | Features |
|-------|---------|------|--------|----------|
| Layer 3 | GoalOS | 4242 | Complete | Goal decomposition, OKR system |
| Layer 4 | Decision Engine | 4240 | Complete | Policy evaluation, Risk assessment |
| Layer 5 | SimulationOS | 4241 | Complete | Monte Carlo, What-if analysis |
| Layer 6 | Agent Network | 4155 | Complete | Registry, Capability matching |
| Layer 7 | Negotiation Engine | 4191 | Complete | RFQ, Quotes, Counter-offers |
| Layer 8 | Trust Engine | 4180 | Complete | Trust scoring, KYC |
| Layer 9 | Contract OS | 4190 | Complete | Contracts, Digital signatures |
| Layer 10 | Economy OS | 4251 | Complete | Karma points, Transactions |
| Layer 11 | Marketplace | 4250 | Complete | Service listing, Ratings |
| Layer 12 | Network Learning | 4243 | Complete | Pattern learning |
| - | Intent Bus | 4154 | Complete | Intent capture |
| - | Memory Bridge | 4143 | Complete | Context storage |
| - | Gateway | 4140 | Complete | API routing |

### SimulationOS Features (Port 4241)

| Category | Feature | Type | Status |
|----------|---------|------|--------|
| Scenario Planning | Pricing | PRICING | Complete |
| Scenario Planning | Offer | OFFER | Complete |
| Scenario Planning | Cashback | CASHBACK | Complete |
| Scenario Planning | Bundle | BUNDLE | Complete |
| Forecasting | Demand | DEMAND | Complete |
| Forecasting | Cash Flow | CASHFLOW | Complete |
| Forecasting | Revenue | REVENUE | Complete |
| Forecasting | Cost | COST | Complete |
| Risk Modeling | Financial Risk | RISK | Complete |
| Risk Modeling | Operational Risk | RISK | Complete |
| Risk Modeling | Market Risk | RISK | Complete |
| Risk Modeling | Compliance | COMPLIANCE | Complete |
| Operations | Staffing | STAFFING | Complete |
| Operations | Inventory | INVENTORY | Complete |
| Operations | Procurement | PROCUREMENT | Complete |
| Operations | Custom | CUSTOM | Complete |

### Decision Engine Features (Port 4240)

| Feature | Status |
|---------|--------|
| OFFER decision | Complete |
| CASHBACK decision | Complete |
| PERSONALIZATION decision | Complete |
| ROUTING decision | Complete |
| FRAUD decision | Complete |
| PRICING decision | Complete |
| NEXT_ACTION decision | Complete |
| RETENTION decision | Complete |
| APPROVAL decision | Complete |
| RISK decision | Complete |

---
