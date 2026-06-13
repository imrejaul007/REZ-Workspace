# Business Copilot Integration Specification

**Version:** 2.0.0
**Last Updated:** 2026-06-13
**Industry Scope:** All 24 Industries
**Architecture:** TwinOS Hub Native + HOJAI AI Integration
**Status:** ✅ **16 PRODUCT GROUPS BUILT** | **HOJAI CoPilot**

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture](#2-architecture)
3. [HOJAI CoPilot - Implementation Status](#3-hojai-copilot--implementation-status)
4. [Industry Skill Packs](#4-industry-skill-packs)
5. [Natural Language Query Patterns](#5-natural-language-query-patterns)
6. [Dashboard Specifications](#6-dashboard-specifications)
7. [Integration with TwinOS Hub](#7-integration-with-twinos-hub)
8. [Integration with AgentOS](#8-integration-with-agentos)
9. [Business Copilot API](#9-business-copilot-api)
10. [Implementation Roadmap](#10-implementation-roadmap)

---

## 1. Executive Summary

### Vision

One universal Business Copilot that serves all 24 industries through industry-specific skill packs. The copilot provides natural language interfaces to all product data, enabling operators to query their business through conversational interactions.

### Core Principles

| Principle | Description | HOJAI AI Implementation |
|-----------|-------------|----------------------|
| **One Copilot, Many Skills** | Single AI engine with pluggable industry skill packs | ✅ hojai-business-copilot (Port 4600) + core/business-copilot (Port 4002) |
| **TwinOS-Native** | Queries directly against the TwinOS graph database | ✅ hojai-graph (Port 4810) + hojai-twin (Port 4860) |
| **Actionable Intelligence** | Not just answers, but recommendations and actions | ✅ hojai-board (Port 4870) + AgentOS |
| **Omni-Channel Access** | Available via API, dashboard widgets, and mobile | ✅ hojai-command-center (Port 4801) + API Gateway |
| **Compliance-First** | Built-in compliance awareness per industry | ✅ hojai-workforce + TrustOS |

### Industry Coverage Matrix

| # | Industry | Primary Skill Focus | Key Twins | HOJAI AI Products |
|---|----------|---------------------|-----------|------------------|
| 1 | Hotel | Revenue optimization, guest experience | GuestMemory, RoomTwin | HOJAI StayOwn |
| 2 | Restaurant | Menu optimization, kitchen efficiency | OrderTwin, TableTwin | HOJAI Restaurant AI |
| 3 | Retail | Inventory optimization, shopper insights | ShopperTwin | REZ Merchant |
| 4 | Healthcare | Patient flow, clinical decision support | PatientTwin | HOJAI Clinic AI, RisaCare |
| 5 | Financial | Portfolio management, risk analysis | PortfolioTwin | RIDZA |
| 6 | Automotive | Fleet management, predictive maintenance | VehicleTwin | KHAIRMOVE |
| 7 | Legal | Matter management, document review | MatterTwin | HOJAI Legal AI |
| 8 | Construction | Project status, cost control | ProjectTwin | HOJAI Construction AI |
| 9 | Education | Student tracking, course optimization | StudentTwin | HOJAI Education AI |
| 10 | Real Estate | Property matching, market analysis | PropertyTwin | RisnaEstate |
| 11 | Manufacturing | Production optimization, supply chain | ProductionTwin | HOJAI Manufacturing AI |
| 12 | Professional | Client management, billing | ClientTwin | HOJAI Professional AI |
| 13 | Transport | Fleet tracking, route optimization | FleetTwin | HOJAI Transport AI |
| 14 | Travel | Trip planning, booking optimization | TravelerTwin | HOJAI Travel AI |
| 15 | Government | Citizen services, compliance | CitizenTwin | HOJAI Government AI |
| 16 | Nonprofit | Donor management, program impact | DonorTwin | HOJAI Nonprofit AI |
| 17 | Agriculture | Farm planning, market timing | FarmTwin | HOJAI Agriculture AI |
| 18 | Beauty | Client lifetime value, inventory | ClientTwin | HOJAI Beauty AI |
| 19 | Entertainment | Fan engagement, brand sentiment | FanTwin | HOJAI Entertainment AI |
| 20 | Fashion | Trend analysis, inventory optimization | FashionTwin | HOJAI Fashion AI |
| 21 | Fitness | Member tracking, class optimization | MemberTwin | HOJAI Fitness AI |
| 22 | Gaming | Player engagement, monetization | PlayerTwin | HOJAI Gaming AI |
| 23 | Home Services | Job scheduling, technician dispatch | JobTwin | HOJAI Home Services AI |
| 24 | Sports | Fan engagement, brand sentiment | FanTwin | HOJAI Sports AI |

---

## 2. Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    HOJAI BUSINESS COPILOT                               │
│                         Port: 4600                                       │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    CHAT INTERFACE ✨ NEW                          │  │
│  │              (Integrates with core/business-copilot)              │  │
│  │                      24 Industries, 120+ Skills                   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │              Central Query Router (NLU)                          │  │
│  │         Intent Classification → Skill Pack Selection              │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│         │                │                │                              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                   │
│  │ Memory       │ │ Twin          │ │ Intelligence │                   │
│  │ Interface    │ │ Interface     │ │ Interface    │                   │
│  │ (hojai-     │ │ (hojai-      │ │ (hojai-      │                   │
│  │ memory)      │ │ twin)        │ │ graph)       │                   │
│  └──────────────┘ └──────────────┘ └──────────────┘                   │
│         │                │                │                              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                   │
│  │ Agent        │ │ Workflow     │ │ Execution    │                   │
│  │ Interface    │ │ Interface    │ │ Interface    │                   │
│  │ (hojai-      │ │ (sutar-     │ │ (genie-      │                   │
│  │ expert-os)   │ │ flow-os)    │ │ project)     │                   │
│  └──────────────┘ └──────────────┘ └──────────────┘                   │
│         │                │                │                              │
│  ┌──────────────────────────────────────────────────────────────┐       │
│  │              Simulation Interface ✨ NEW                        │       │
│  │              (sutar-simulation-os + What-If Engine)         │       │
│  └──────────────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────────────┘
         │                │                │
         ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                  CORE BUSINESS COPILOT (Port 4002)                     │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │              24 Industry Skill Packs, 120+ Skills               │    │
│  │  Legal, Healthcare, Finance, Retail, Education, Manufacturing    │    │
│  │  Restaurant, Fitness, Automotive, Entertainment, Gaming           │    │
│  │  Agriculture, Construction, Beauty, Fashion, Sports             │    │
│  │  Government, Home Services, Professional, Nonprofit             │    │
│  │  Media, Energy, Hospitality, Travel, Real Estate              │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         HOJAI AI Platform                                │
│                                                                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐    │
│  │hojai-graph │  │hojai-twin  │  │hojai-board │  │hojai-work  │    │
│  │   4810     │  │   4860     │  │   4870     │  │force 4820  │    │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘    │
│                                                                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐    │
│  │hojai-      │  │hojai-      │  │hojai-      │  │hojai-      │    │
│  │customer    │  │product     │  │competitive │  │revenue     │    │
│  │4752        │  │4755        │  │4756        │  │4757        │    │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘    │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │              Industry AI (15 Verticals)                          │  │
│  │  Healthcare, Legal, Finance, Real Estate, Hospitality, Restaurant │  │
│  │  Fleet, Education, Construction, Retail, Legal, Beauty, Sports   │  │
│  └─────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Query Flow

```
User Query → NLU Parser → Intent Classification → Industry Skill Pack Selection
                                                                │
                                                                ▼
                                              ┌─────────────────────────┐
                                              │  Industry Skill Engine  │
                                              │  (HOJAI Business        │
                                              │   Copilot Gateway)      │
                                              └─────────────────────────┘
                                                                │
                    ┌─────────────────────────────────────────────┼───────────────┐
                    ▼                                                             ▼
        ┌───────────────────┐                                          ┌───────────────────┐
        │   core/business- │                                          │   AgentOS        │
        │   copilot:4002   │                                          │   (hojai-expert- │
        │   (24 Industries)│                                          │   os) Port 4550  │
        └───────────────────┘                                          └───────────────────┘
                    │
                    ▼
        ┌───────────────────┐
        │   HOJAI Graph     │
        │   (hojai-graph)   │
        │   Port 4810       │
        └───────────────────┘
                    │
                    ▼
        ┌───────────────────┐
        │   HOJAI Twin     │
        │   (hojai-twin)   │
        │   Port 4860      │
        └───────────────────┘
```

### Chat Integration

The **hojai-business-copilot** (Port 4600) integrates with **core/business-copilot** (Port 4002) for:

1. **Chat Interface** — Natural language queries with 24 industry skill packs
2. **Skills Catalog** — Get available skills per industry
3. **Industry Query** — Query industry-specific intelligence
4. **Fallback** — If core/business-copilot unavailable, uses local skills

### Port Assignments

| Service | Port | Protocol | Description |
|---------|------|----------|-------------|
| **core/business-copilot** | 4002 | REST | 24 Industry Skill Packs, 120+ Skills, Chat |
| **hojai-business-copilot** | 4600 | REST | Unified Business Copilot Gateway (integrates with core) |
| **hojai-graph** | 4810 | REST | Knowledge Graph (31 entities, 27 relationships) |
| **hojai-twin** | 4860 | REST | Digital Twins (Employee/Customer/Company) |
| **hojai-board** | 4870 | REST | AI C-Suite (CEO/CFO/COO/CMO/CTO/CHRO/CLO) |
| **hojai-workforce** | 4820 | REST | AI Employee Marketplace |
| **hojai-customer-intelligence** | 4752 | REST | Customer 360 |
| **hojai-product-intelligence** | 4755 | REST | Product Hub |
| **hojai-competitive-intelligence** | 4756 | REST | Competitive Intelligence |
| **hojai-revenue-intelligence** | 4757 | REST | Revenue Intelligence |
| **hojai-goal-os** | 4242 | REST | GoalOS |
| **hojai-meeting-intelligence** | 4700 | REST | Meeting Hub |
| **hojai-founder-os** | 4260 | REST | FounderOS |
| **hojai-expert-os** | 4550 | REST | Agent Runtime |
| **sutar-flow-os** | 4244 | REST | Workflow Execution |
| **genie-project-service** | 4708 | REST | Project & Task Execution |
| **hojai-command-center** | 4801 | REST/WS | Executive Dashboard |
| **hojai-memory** | 4520 | REST | Memory Infrastructure |
| **hojai-intelligence** | 4530 | REST | ML Predictions |

### Industry-Specific Ports

| Industry | Primary Product | Port | Status |
|----------|----------------|------|--------|
| Hotel | HOJAI StayOwn | 7500 | ✅ Built |
| Restaurant | HOJAI Restaurant AI | 7600 | ✅ Built |
| Retail | REZ Merchant | 4500 | ✅ Built |
| Healthcare | HOJAI Clinic AI, RisaCare | 3000, 4825 | ✅ Built |
| Financial | RIDZA | 5001 | ✅ Built |
| Legal | HOJAI Legal AI | 3002 | ✅ Built |
| Construction | HOJAI Construction AI | 3003 | ✅ Built |
| Education | HOJAI Education AI | 3008 | ✅ Built |
| Real Estate | RisnaEstate | 4777 | ✅ Built |
| Fleet | KHAIRMOVE | 4553 | ✅ Built |

### Security Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Authentication                            │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  OAuth 2.0 + JWT + Industry-Specific RBAC              │    │
│  │  - Healthcare: HIPAA-compliant audit logging (HOJAI)  │    │
│  │  - Financial: SEC-compliant (RIDZA)                   │    │
│  │  - Government: SOC 2 Type II compliant (TrustOS)       │    │
│  │  - General: Tenant isolation on all schemas            │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  HOJAI TrustOS (Port 4518)                            │    │
│  │  - Trust scoring (0-100)                             │    │
│  │  - Fraud detection                                    │    │
│  │  - Identity verification                              │    │
│  │  - Access control                                     │    │
│  │  - Compliance monitoring                               │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. HOJAI CoPilot - Implementation Status

### ✅ ALL 16 PRODUCT GROUPS BUILT (June 13, 2026)

| # | Product Group | Service | Port | Status |
|---|--------------|---------|------|--------|
| 1 | Company Intelligence | hojai-graph | 4810 | ✅ Built + Enriched |
| 2 | Executive AI Suite | hojai-board | 4870 | ✅ Existing |
| 3 | Company Twin | hojai-twin | 4860 | ✅ Existing |
| 4 | Decision Intelligence | hojai-board | 4870 | ✅ Built |
| 5 | GoalOS | hojai-goal-os | 4242 | ✅ **BUILT** |
| 6 | Project Intelligence | genie-project-service | 4708 | ✅ Existing |
| 7 | Meeting Intelligence | hojai-meeting-intelligence | 4700 | ✅ **BUILT** |
| 8 | Workforce Intelligence | hojai-workforce | 4820 | ✅ Existing |
| 9 | Customer Intelligence | hojai-customer-intelligence | 4752 | ✅ Existing |
| 10 | Product Intelligence | hojai-product-intelligence | 4755 | ✅ **BUILT** |
| 11 | Competitive Intelligence | hojai-competitive-intelligence | 4756 | ✅ **BUILT** |
| 12 | Revenue Intelligence | hojai-revenue-intelligence | 4757 | ✅ **BUILT** |
| 13 | FounderOS | hojai-founder-os | 4260 | ✅ **BUILT** |
| 14 | Agent Workforce | hojai-agent-marketplace | 4580 | ✅ Existing |
| 15 | Workflow Intelligence | sutar-flow-os | 4244 | ✅ **BUILT** |
| 16 | Executive Command Center | hojai-command-center | 4801 | ✅ **BUILT** |

### Service Details

#### ✅ hojai-business-copilot (Port 4600)
**Purpose:** Unified 7-interface gateway for all CoPilot services
**Features:**
- Memory Interface → hojai-memory (4520)
- Twin Interface → hojai-twin (4860)
- Intelligence Interface → hojai-graph (4810) + hojai-intelligence (4530)
- Agent Interface → hojai-expert-os (4550)
- Workflow Interface → sutar-flow-os (4244)
- Execution Interface → genie-project-service (4708)
- Simulation Interface → sutar-simulation-os (4241)

**Routes:** 40+ API endpoints
**Status:** ✅ Built + Compiled

#### ✅ hojai-product-intelligence (Port 4755)
**Purpose:** Unified product intelligence
**Features:**
- Product CRUD with metrics (users, revenue, NPS, PMF score)
- Feature tracking with RICE prioritization
- Feedback analysis with sentiment
- Roadmap management
- AI prioritization (Reach × Impact × Confidence / Effort)
- Product-market fit analysis

**Routes:** 17 API endpoints
**Status:** ✅ Built + Compiled

#### ✅ hojai-competitive-intelligence (Port 4756)
**Purpose:** Competitive intelligence platform
**Features:**
- Competitor tracking (pricing, funding, hiring, news)
- 9 MongoDB models
- Threat alerts (pricing drops, new products, funding)
- Opportunity alerts (market gaps, competitor weaknesses)
- Strategic recommendations

**Routes:** 25+ API endpoints
**Status:** ✅ Built + Compiled

#### ✅ hojai-goal-os (Port 4242)
**Purpose:** Goal management and OKR tracking
**Features:**
- Goal CRUD (annual, quarterly, monthly, weekly)
- OKR management with key results
- Milestone tracking
- Progress monitoring with velocity analysis
- Risk alerts (off-track, deadline, dependency)
- Cascade impact analysis
- AI OKR suggestions

**Routes:** 20+ API endpoints
**Status:** ✅ Built + Compiled

#### ✅ hojai-meeting-intelligence (Port 4700)
**Purpose:** AI-powered meeting management
**Features:**
- Meeting scheduling and management
- Pre-meeting context preparation
- AI-generated notes
- Action item extraction
- Decision capture
- AI summaries (quick, detailed, executive)
- Meeting analytics

**Routes:** 18+ API endpoints
**Status:** ✅ Built + Compiled

#### ✅ hojai-revenue-intelligence (Port 4757)
**Purpose:** Revenue tracking and forecasting
**Features:**
- ARR/MRR tracking
- Pipeline management (6 stages)
- CAC/LTV metrics
- AI forecasting (linear, exponential, moving average)
- Churn prediction
- Pipeline risk scoring
- Revenue alerts
- Unit economics (CAC/LTV ratio, payback period)
- Cohort analysis

**Routes:** 25+ API endpoints
**Status:** ✅ Built + Compiled

#### ✅ hojai-founder-os (Port 4260)
**Purpose:** Founder tools and executive briefings
**Features:**
- Business model canvas (9 building blocks)
- GTM strategy planning
- Fundraising planning
- Hiring plans
- Market analysis (TAM/SAM/SOM)
- Daily CEO briefing
- Weekly executive briefing
- Board briefing
- Investor briefing

**Routes:** 20+ API endpoints
**Status:** ✅ Built + Compiled

#### ✅ hojai-command-center (Port 4801)
**Purpose:** Executive dashboard
**Type:** Next.js 14 App Router
**Features:**
- 12 dashboard pages
- Natural language queries
- KPI cards with trends
- Alert feed with severity
- Real-time data (30s refresh)
- Drill-down navigation

**Pages:**
1. `/` - Executive Command Center
2. `/revenue` - Revenue Intelligence
3. `/customers` - Customer 360
4. `/products` - Product Hub
5. `/projects` - Project Hub
6. `/team` - Workforce Dashboard
7. `/goals` - GoalOS
8. `/meetings` - Meeting Hub
9. `/competitors` - Competitive Intelligence
10. `/decisions` - Decision Center
11. `/agents` - Agent Workforce
12. `/workflows` - Workflow Hub

**Status:** ✅ Built + Compiled

#### ✅ sutar-flow-os (Port 4244)
**Purpose:** Workflow execution and optimization
**Features:**
- Flow definition (steps, triggers, variables)
- Flow execution engine
- Trigger management (manual, scheduled, event, webhook)
- Analytics (success rates, avg duration)
- Bottleneck detection
- AI optimization suggestions

**Routes:** 15+ API endpoints
**Status:** ✅ Built + Compiled

#### ✅ hojai-graph (Port 4810) - ENRICHED
**Purpose:** Knowledge graph for company intelligence
**Entity Types:** 31 (15 → 31)
- Original: human, ai_employee, customer, merchant, supplier, organization, department, team, product, service, document, workflow, task, meeting, project
- Added: company_policy, sop, contract, roadmap, decision, goal, okr, milestone, product_feature, competitor, investor, brand, campaign, meeting_note, action_item

**Relationship Types:** 27 (14 → 27)
- Original: works_with, reports_to, owns, created, approved, referred, purchased, sold, manages, member_of, depends_on, collaborates_with, supersedes, related_to
- Added: aligned_to, supports, blocks, escalated_to, reported_by, owned_by, deadline_of, budgets_for, sponsors, mentors, delegates_to, challenges, validates, duplicates

**AI Features:**
- Entity extraction from text
- Influence analysis (decay-weighted)
- Cascade impact analysis
- Similarity analysis
- Entity health and network analysis

**Status:** ✅ Enriched + Compiled

### Existing Services (Already Built)

| Service | Port | Description |
|---------|------|-------------|
| hojai-board | 4870 | AI C-Suite (CEO/CFO/COO/CMO/CTO/CHRO/CLO) |
| hojai-twin | 4860 | Digital Twins |
| hojai-workforce | 4820 | AI Employee Marketplace |
| hojai-agent-marketplace | 4580 | Agent Registry |
| hojai-customer-intelligence | 4752 | Customer 360 |
| genie-project-service | 4708 | Project & Task Management |
| hojai-memory | 4520 | Memory Infrastructure (L1-L5) |
| hojai-intelligence | 4530 | ML Predictions |
| hojai-expert-os | 4550 | Agent Runtime |
| hojai-simulation-os | 4241 | What-If Simulations |

### Pre-built What-If Scenarios

| Category | Scenarios |
|----------|-----------|
| Revenue Drop | -10%, -20%, -30% |
| Revenue Growth | +10%, +20%, +50% |
| Hiring | 10, 50, 100 people |
| CAC Increase | +10%, +25%, +50% |
| Market Expansion | Dubai, UK, US |

---

## 4. Industry Skill Packs

All 24 industry skill packs are powered by HOJAI AI services. Each industry uses the **same Business Copilot gateway** with industry-specific twins and data.

### 4.1 Hotel OS - Hospitality Skill Pack

**Primary Twin:** GuestMemory (hojai-twin)
**HOJAI Product:** HOJAI StayOwn
**Core Capabilities:** Revenue optimization, guest personalization, operational efficiency

#### Skill Categories → HOJAI Services

| Category | Capabilities | HOJAI Service |
|----------|-------------|---------------|
| **Guest Experience** | Preference synthesis, loyalty tier, personalized offers | hojai-twin + hojai-graph |
| **Revenue Optimization** | ADR forecasting, upsell scoring, dynamic pricing | hojai-revenue-intelligence |
| **Operational** | Housekeeping scheduling, maintenance prediction | hojai-workforce + genie-project |
| **Financial** | Minibar performance, F&B analysis, loyalty ROI | hojai-revenue-intelligence |

#### Sample Queries → HOJAI API

```bash
# Guest Preference Summary
curl -X POST http://localhost:4600/api/twin/customer/{guest_id}
# → Returns: GuestMemory twin with preferences, history, loyalty tier

# Revenue Forecast
curl -X GET http://localhost:4757/api/forecast?type=arr&period=Q3
# → Returns: AI-predicted ARR with confidence intervals

# Market Analysis
curl -X POST http://localhost:4600/api/intelligence/query \
  -d '{"query": "What is our ADR trend this month?"}'
# → Returns: Graph query result with ADR metrics
```

### 4.2 Restaurant OS - Restaurant Intelligence Skill Pack

**Primary Twin:** OrderTwin, TableTwin
**HOJAI Product:** HOJAI Restaurant AI
**Core Capabilities:** Menu optimization, kitchen efficiency, customer lifetime value

#### Skill Categories → HOJAI Services

| Category | Capabilities | HOJAI Service |
|----------|-------------|---------------|
| **Menu Intelligence** | Item performance, pricing optimization, recipe costs | hojai-product-intelligence |
| **Kitchen Operations** | Order flow, prep time, station efficiency | genie-project-service |
| **Customer Analytics** | CLV, frequency, preferences, churn risk | hojai-customer-intelligence |
| **Financial** | Revenue tracking, cost analysis, profit margins | hojai-revenue-intelligence |

### 4.3 Retail OS - Retail Intelligence Skill Pack

**Primary Twin:** ShopperTwin
**HOJAI Product:** REZ Merchant
**Core Capabilities:** Inventory optimization, shopper insights, conversion

#### Skill Categories → HOJAI Services

| Category | Capabilities | HOJAI Service |
|----------|-------------|---------------|
| **Inventory** | Stock levels, reorder alerts, dead stock | hojai-product-intelligence |
| **Shopper Insights** | Demographics, behavior, preferences | hojai-customer-intelligence |
| **Conversion** | Funnel analysis, AOV, cart abandonment | hojai-revenue-intelligence |
| **Pricing** | Competitive pricing, promotions | hojai-competitive-intelligence |

### 4.4 Healthcare OS - Clinical Intelligence Skill Pack

**Primary Twin:** PatientTwin
**HOJAI Product:** HOJAI Clinic AI, RisaCare
**Core Capabilities:** Patient flow, clinical decision support, billing optimization
**Compliance:** HIPAA-compliant

#### Skill Categories → HOJAI Services

| Category | Capabilities | HOJAI Service |
|----------|-------------|---------------|
| **Clinical** | Patient summary, drug interactions, care gaps | hojai-twin + hojai-graph |
| **Operational** | Appointment availability, wait times, capacity | genie-project-service |
| **Financial** | Insurance coverage, claim status, AR summary | hojai-revenue-intelligence |
| **Compliance** | HIPAA audit, licensing, compliance score | hojai-workforce (TrustOS) |

### 4.5 Financial OS - Financial Intelligence Skill Pack

**Primary Twin:** PortfolioTwin
**HOJAI Product:** RIDZA, AssetMind
**Core Capabilities:** Portfolio management, risk analysis, compliance

#### Skill Categories → HOJAI Services

| Category | Capabilities | HOJAI Service |
|----------|-------------|---------------|
| **Portfolio** | Holdings, allocation, performance | hojai-twin + hojai-graph |
| **Risk** | VaR, exposure, stress testing | hojai-intelligence |
| **Compliance** | Regulatory checks, audit trails | hojai-workforce |
| **Revenue** | AUM growth, fee income, client metrics | hojai-revenue-intelligence |

### 4.6-4.24 Industry Skill Packs

All remaining industry skill packs follow the same pattern:

| Industry | Primary Twin | HOJAI Product | Twin Service | Intelligence Service |
|----------|-------------|---------------|--------------|-------------------|
| Automotive | VehicleTwin | KHAIRMOVE | hojai-twin | hojai-intelligence |
| Legal | MatterTwin | HOJAI Legal AI | hojai-twin | hojai-graph |
| Construction | ProjectTwin | HOJAI Construction | genie-project | hojai-revenue |
| Education | StudentTwin | HOJAI Education | hojai-twin | hojai-customer |
| Real Estate | PropertyTwin | RisnaEstate | hojai-twin | hojai-graph |
| Manufacturing | ProductionTwin | HOJAI Manufacturing | hojai-twin | hojai-intelligence |
| Professional | ClientTwin | HOJAI Professional | hojai-twin | hojai-customer |
| Transport | FleetTwin | HOJAI Transport | hojai-twin | hojai-graph |
| Travel | TravelerTwin | HOJAI Travel | hojai-twin | hojai-customer |
| Government | CitizenTwin | HOJAI Government | hojai-twin | hojai-workforce |
| Nonprofit | DonorTwin | HOJAI Nonprofit | hojai-twin | hojai-customer |
| Agriculture | FarmTwin | HOJAI Agriculture | hojai-twin | hojai-intelligence |
| Beauty | ClientTwin | HOJAI Beauty | hojai-twin | hojai-customer |
| Entertainment | FanTwin | HOJAI Entertainment | hojai-twin | hojai-customer |
| Fashion | FashionTwin | HOJAI Fashion | hojai-twin | hojai-product |
| Fitness | MemberTwin | HOJAI Fitness | hojai-twin | hojai-customer |
| Gaming | PlayerTwin | HOJAI Gaming | hojai-twin | hojai-intelligence |
| Home Services | JobTwin | HOJAI Home Services | genie-project | hojai-workforce |
| Sports | FanTwin | HOJAI Sports | hojai-twin | hojai-customer |

---

## 5. Natural Language Query Patterns

### Universal Query Patterns

All industries support these base query intents via **hojai-business-copilot**:

| Intent | Description | HOJAI Service |
|--------|-------------|---------------|
| **STATUS** | Current state queries | hojai-graph (Port 4810) |
| **ANALYZE** | Analytical queries | hojai-intelligence (Port 4530) |
| **COMPARE** | Comparative queries | hojai-graph |
| **PREDICT** | Forecasting queries | hojai-intelligence |
| **RECOMMEND** | Suggestion queries | hojai-board (Port 4870) |
| **FILTER** | Filtering queries | hojai-graph |
| **AGGREGATE** | Aggregation queries | hojai-graph |
| **TREND** | Trend analysis | hojai-revenue-intelligence (Port 4757) |
| **IDENTIFY** | Discovery queries | hojai-intelligence |
| **OPTIMIZE** | Optimization queries | sutar-flow-os (Port 4244) |

### Cross-Industry Query Templates

```bash
# Status Query
curl -X POST http://localhost:4600/api/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is the current status of our Q3 goals?",
    "interfaces": ["goal", "revenue"]
  }'

# → Routes to hojai-goal-os (4242) and hojai-revenue-intelligence (4757)

# Analyze Query
curl -X POST http://localhost:4600/api/intelligence/query \
  -d '{"query": "Analyze our customer churn pattern"}'

# → Routes to hojai-customer-intelligence (4752)

# Predict Query
curl -X POST http://localhost:4600/api/simulate/whatif \
  -d '{"scenario": "What if revenue drops 20%?"}'

# → Routes to sutar-simulation-os (4241)
```

---

## 6. Dashboard Specifications

### Executive Command Center (Port 4801)

The **hojai-command-center** provides 12 dashboard pages:

| Page | Source Services | Key Metrics |
|------|---------------|-------------|
| Command Center | All services | Unified KPIs |
| Revenue | hojai-revenue-intelligence | ARR, MRR, Pipeline, CAC, LTV |
| Customers | hojai-customer-intelligence | Health scores, churn, segments |
| Products | hojai-product-intelligence | Features, PMF, sentiment |
| Projects | genie-project-service | Milestones, delays, budget |
| Team | hojai-workforce | Performance, workload |
| Goals | hojai-goal-os | Progress, at-risk |
| Meetings | hojai-meeting-intelligence | Actions, decisions |
| Competitors | hojai-competitive-intelligence | Threats, opportunities |
| Decisions | hojai-board | Status, outcomes |
| Agents | hojai-agent-marketplace | Performance, registry |
| Workflows | sutar-flow-os | Bottlenecks, success rates |

### Industry Dashboards

Each industry vertical has a dedicated dashboard page in hojai-command-center:

```
/hotel          → HOJAI StayOwn dashboard
/restaurant     → HOJAI Restaurant dashboard
/healthcare     → RisaCare dashboard
/legal          → HOJAI Legal dashboard
/finance        → RIDZA dashboard
```

---

## 7. Integration with TwinOS Hub

### TwinOS Hub - HOJAI Twin Services

The **TwinOS Hub** is implemented via **hojai-twin** (Port 4860):

```
┌─────────────────────────────────────────────────────────────────┐
│                     TwinOS Hub (hojai-twin)                      │
│                         Port: 4860                                │
│                                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ Employee │ │ Customer │ │ Company  │ │ Merchant │           │
│  │ Twin     │ │ Twin     │ │ Twin     │ │ Twin     │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│                                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ Industry │ │ Industry │ │ Industry │ │ Industry │           │
│  │ Twin 1   │ │ Twin 2   │ │ Twin 3   │ │ Twin 24  │           │
│  │ Guest    │ │ Patient  │ │ Portfolio│ │ Vehicle  │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
└─────────────────────────────────────────────────────────────────┘
```

### Twin Producer-Consumer Mapping

| Industry | PRIMARY PRODUCER | PRIMARY CONSUMER | HOJAI Service |
|----------|------------------|------------------|----------------|
| Hotel | GuestMemory | Business Copilot | hojai-twin |
| Restaurant | REZ POS | Business Copilot | hojai-twin |
| Retail | REZ Loyalty | Commerce Ads | hojai-twin |
| Healthcare | HOJAI Clinic AI | Business Copilot | hojai-twin |
| Financial | RIDZA AssetMind | Business Copilot | hojai-twin |
| Automotive | KHAIRMOVE Fleet | Business Copilot | hojai-twin |
| Legal | REZ Practice | Business Copilot | hojai-twin |
| Construction | REZ Project | Business Copilot | genie-project |

### Twin Access Patterns

```bash
# Universal pattern: Get entity with related data
curl http://localhost:4860/api/twin/{type}/{id}
# → Returns twin with predictions, recommendations, insights

# Company Twin with insights
curl http://localhost:4860/api/company/{id}/insights
# → Returns: TwinSummary with predictions and insights
```

---

## 8. Integration with AgentOS

### AgentOS Layer - HOJAI ExpertOS

The **AgentOS** is implemented via **hojai-expert-os** (Port 4550):

```
┌─────────────────────────────────────────────────────────────────┐
│                     AgentOS (hojai-expert-os)                    │
│                         Port: 4550                                │
│                                                                  │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐             │
│  │ Upsell       │ │ Kitchen      │ │ Churn         │             │
│  │ Agent        │ │ Agent        │ │ Agent         │             │
│  └──────────────┘ └──────────────┘ └──────────────┘             │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐             │
│  │ Predict      │ │ Optimize      │ │ Compliance   │             │
│  │ Agent        │ │ Agent        │ │ Agent        │             │
│  └──────────────┘ └──────────────┘ └──────────────┘             │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  200+ AI Employees (hojai-agent-marketplace, Port 4580) │    │
│  │  Sales, Marketing, HR, Finance, Legal, Operations        │    │
│  └──────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### Industry-Specific Agent Mappings

| Industry | Primary Agents | HOJAI Service |
|----------|---------------|---------------|
| Hotel | upsell_engine, guest_memory.personalize | hojai-expert-os |
| Restaurant | kitchen_agent, recommendation_agent | hojai-expert-os |
| Retail | shopper_intelligence, inventory_agent | hojai-expert-os |
| Healthcare | clinical_ai, patient_intelligence | hojai-expert-os |
| Financial | portfolio_intelligence, asset_intelligence | hojai-expert-os |
| Automotive | fleet_management, predictive_maintenance | hojai-expert-os |
| Legal | matter_analytics, document_intelligence | hojai-expert-os |
| Construction | project_intelligence, cost_control | hojai-expert-os |

### Agent Invocation via Business Copilot

```bash
# List available agents
curl http://localhost:4600/api/agent/list

# Invoke specific agent
curl -X POST http://localhost:4600/api/agent/{agent_id}/invoke \
  -d '{"task": "Analyze Q3 sales performance"}'

# Smart execute (auto-select best agent)
curl -X POST http://localhost:4600/api/agent/execute \
  -d '{"task": "Create sales report for Q3"}'
```

---

## 9. Business Copilot API

### Central API - hojai-business-copilot (Port 4600)

```bash
# ===========================================
# MEMORY INTERFACE (→ hojai-memory, Port 4520)
# ===========================================
GET  /api/memory/context?entityType=company&entityId=xxx
POST /api/memory
GET  /api/memory
GET  /api/memory/search?q=xxx
GET  /api/memory/timeline

# ===========================================
# TWIN INTERFACE (→ hojai-twin, Port 4860)
# ===========================================
GET  /api/twin/summary/{type}/{id}
GET  /api/twin/profile/{type}/{id}
GET  /api/twin/predictions/{type}/{id}
GET  /api/twin/insights/{type}/{id}
POST /api/twin/{type}
GET  /api/twin/list/{type}

# ===========================================
# INTELLIGENCE INTERFACE (→ hojai-graph, Port 4810 + hojai-intelligence, Port 4530)
# ===========================================
POST /api/intelligence/query
GET  /api/intelligence/entity/{entityType}/{entityId}
GET  /api/intelligence/insights
GET  /api/intelligence/paths/{sourceType}/{sourceId}/{targetType}/{targetId}
POST /api/intelligence/entity
POST /api/intelligence/relationship
POST /api/intelligence/analyze

# ===========================================
# AGENT INTERFACE (→ hojai-expert-os, Port 4550)
# ===========================================
GET  /api/agent/list
GET  /api/agent/{id}
POST /api/agent/{id}/invoke
GET  /api/agent/{id}/stats
GET  /api/agent/execute
POST /api/agent/execute

# ===========================================
# WORKFLOW INTERFACE (→ sutar-flow-os, Port 4244)
# ===========================================
GET  /api/workflow/list
GET  /api/workflow/{id}
POST /api/workflow
POST /api/workflow/{id}/run
GET  /api/workflow/{id}/runs
PUT  /api/workflow/{id}
DELETE /api/workflow/{id}

# ===========================================
# EXECUTION INTERFACE (→ genie-project-service, Port 4708)
# ===========================================
GET  /api/execute/projects
POST /api/execute/projects
GET  /api/execute/projects/{id}
GET  /api/execute/tasks
POST /api/execute/tasks
PATCH /api/execute/tasks/{id}
GET  /api/execute/dashboard
POST /api/execute/complete

# ===========================================
# SIMULATION INTERFACE (→ sutar-simulation-os, Port 4241)
# ===========================================
POST /api/simulate
POST /api/simulate/whatif
POST /api/simulate/compare
GET  /api/simulate/{id}
GET  /api/simulate/history
POST /api/simulate/scenarios/{scenarioType}  # 15 pre-built scenarios

# ===========================================
# CENTRAL QUERY ROUTER
# ===========================================
POST /api/query
GET  /api/interfaces

# ===========================================
# HEALTH
# ===========================================
GET  /health
GET  /health/live
GET  /health/ready
```

### Response Format

All endpoints return:

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-06-13T12:00:00Z",
    "requestId": "req_xxx"
  }
}
```

### Error Format

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message"
  },
  "meta": {
    "timestamp": "2026-06-13T12:00:00Z",
    "requestId": "req_xxx"
  }
}
```

---

## 10. Implementation Roadmap

### Completed ✅

| Milestone | Status | Date |
|-----------|--------|------|
| HOJAI CoPilot Planning | ✅ | June 12, 2026 |
| 16 Product Groups Architecture | ✅ | June 13, 2026 |
| hojai-business-copilot Gateway | ✅ Built + Compiled | June 13, 2026 |
| hojai-product-intelligence | ✅ Built + Compiled | June 13, 2026 |
| hojai-competitive-intelligence | ✅ Built + Compiled | June 13, 2026 |
| hojai-goal-os | ✅ Built + Compiled | June 13, 2026 |
| hojai-meeting-intelligence | ✅ Built + Compiled | June 13, 2026 |
| hojai-revenue-intelligence | ✅ Built + Compiled | June 13, 2026 |
| hojai-founder-os | ✅ Built + Compiled | June 13, 2026 |
| hojai-command-center | ✅ Built + Compiled | June 13, 2026 |
| sutar-flow-os | ✅ Built + Compiled | June 13, 2026 |
| hojai-graph Enrichment | ✅ Enriched + Compiled | June 13, 2026 |
| Documentation | ✅ Updated | June 13, 2026 |

### In Progress 🚧

| Milestone | Status | ETA |
|-----------|--------|-----|
| Industry Twin Patterns | 🚧 Define per-industry | Q3 2026 |
| Industry Dashboard Widgets | 🚧 Build per-industry | Q3 2026 |
| NLU Parser Enhancement | 🚧 Improve intent classification | Q3 2026 |
| Cypher Query Generation | 🚧 NL → Graph queries | Q3 2026 |

### Planned 📋

| Milestone | Status | ETA |
|-----------|--------|-----|
| All 24 Industry Skill Packs | 📋 Connect to existing | Q3 2026 |
| Industry-Specific Agents | 📋 Use existing agents | Q3 2026 |
| Compliance Modules | 📋 HIPAA, SEC, SOC 2 | Q3 2026 |
| gRPC Support | 📋 Construction industry | Q3 2026 |
| Mobile SDK | 📋 iOS/Android | Q4 2026 |

### HOJAI AI Existing Products

The following industry products are already built in HOJAI AI:

| Industry | Product | Status |
|----------|---------|--------|
| Healthcare | HOJAI Clinic AI | ✅ Built |
| Healthcare | RisaCare | ✅ Built |
| Legal | HOJAI Legal AI | ✅ Built |
| Finance | RIDZA | ✅ Built |
| Finance | AssetMind Terminal | ✅ Built |
| Real Estate | RisnaEstate | ✅ Built |
| Hospitality | HOJAI StayOwn | ✅ Built |
| Restaurant | HOJAI Restaurant AI | ✅ Built |
| Fleet | KHAIRMOVE | ✅ Built |
| Education | HOJAI Education AI | ✅ Built |
| Construction | HOJAI Construction AI | ✅ Built |
| Retail | REZ Merchant | ✅ Built |

---

## Quick Start

### Start Business Copilot Gateway
```bash
cd companies/hojai-ai/services/hojai-business-copilot
npm install
npm run dev
# → Runs on http://localhost:4600
```

### Start Command Center Dashboard
```bash
cd companies/hojai-ai/products/hojai-command-center
npm install
npm run dev
# → Runs on http://localhost:4801
```

### Start Individual Services
```bash
# Product Intelligence
cd services/hojai-product-intelligence && npm run dev

# Competitive Intelligence
cd services/hojai-competitive-intelligence && npm run dev

# GoalOS
cd services/hojai-goal-os && npm run dev

# Meeting Intelligence
cd services/hojai-meeting-intelligence && npm run dev

# Revenue Intelligence
cd services/hojai-revenue-intelligence && npm run dev

# FounderOS
cd services/hojai-founder-os && npm run dev

# FlowOS
cd hojai-sutar-os/services/sutar-flow-os && npm run dev
```

---

## Documentation

| Document | Location |
|----------|----------|
| HOJAI AI Overview | companies/hojai-ai/README.md |
| HOJAI Features | companies/hojai-ai/HOJAI-FEATURES.md |
| HOJAI CoPilot Spec | This document |
| Business Copilot Gateway | services/hojai-business-copilot/CLAUDE.md |
| Product Intelligence | services/hojai-product-intelligence/CLAUDE.md |
| Competitive Intelligence | services/hojai-competitive-intelligence/CLAUDE.md |
| GoalOS | services/hojai-goal-os/CLAUDE.md |
| Meeting Intelligence | services/hojai-meeting-intelligence/CLAUDE.md |
| Revenue Intelligence | services/hojai-revenue-intelligence/CLAUDE.md |
| FounderOS | services/hojai-founder-os/CLAUDE.md |
| FlowOS | hojai-sutar-os/services/sutar-flow-os/CLAUDE.md |
| Command Center | products/hojai-command-center/CLAUDE.md |
| Knowledge Graph | packages/hojai-graph/CLAUDE.md |

---

**Last Updated:** June 13, 2026
**Version:** 2.0.0
**Status:** ✅ ALL 16 PRODUCT GROUPS BUILT | HOJAI CoPilot Operational
