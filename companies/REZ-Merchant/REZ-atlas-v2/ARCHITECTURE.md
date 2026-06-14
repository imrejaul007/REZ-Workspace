# REZ Atlas v2 - Revenue Intelligence Platform

**Version:** 2.0.0  
**Date:** June 9, 2026  
**Tagline:** *"The AI-Powered Revenue Intelligence Platform for the Physical World"*

---

## 🎯 Vision

REZ Atlas v2 transforms from a "Map-First Sales Intelligence" platform to a **complete Revenue Intelligence Platform** that competes with Apollo, Clay, ZoomInfo, Explee, Outreach, and Salesloft — while maintaining the unique moat of **map-first + physical world intelligence**.

---

## 🏗️ Architecture Overview

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                           REZ ATLAS v2 - REVENUE INTELLIGENCE                      ║
╠═══════════════════════════════════════════════════════════════════════════════════╣
║                                                                                   ║
║  ┌─────────────────────────────────────────────────────────────────────────────┐ ║
║  │                         ATLAS DISCOVER (5150-5155)                          │ ║
║  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐    │ ║
║  │  │Gateway  │ │Discover │ │  Maps   │ │  Twin   │ │  Score  │ │ Signals │    │ ║
║  │  │  5150   │ │  5151   │ │  5152   │ │  5153   │ │  5154   │ │  5155   │    │ ║
║  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘    │ ║
║  └─────────────────────────────────────────────────────────────────────────────┘ ║
║                                      │                                            ║
║                                      ▼                                            ║
║  ┌─────────────────────────────────────────────────────────────────────────────┐ ║
║  │                      ATLAS INTELLIGENCE (5156-5169)                         │ ║
║  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐      │ ║
║  │  │  Company  │ │   Person  │ │ Research  │ │   Intent  │ │Enrichment │      │ ║
║  │  │   Twin    │ │   Twin    │ │   Agent   │ │   Engine  │ │           │      │ ║
║  │  │   5156   │ │   5157   │ │   5158   │ │   5159   │ │   5160   │      │ ║
║  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘ └───────────┘      │ ║
║  └─────────────────────────────────────────────────────────────────────────────┘ ║
║                                      │                                            ║
║                                      ▼                                            ║
║  ┌─────────────────────────────────────────────────────────────────────────────┐ ║
║  │                         ATLAS ENGAGE (5161-5169)                            │ ║
║  │  ┌─────────┐ ┌──────────┐ ┌─────────┐ ┌─────────┐ ┌────────────┐           │ ║
║  │  │  Email  │ │ WhatsApp │ │   SMS   │ │  Calls  │ │Deliverability│          │ ║
║  │  │  5161   │ │   5162   │ │  5163   │ │  5164   │ │    5165    │           │ ║
║  │  └─────────┘ └──────────┘ └─────────┘ └─────────┘ └────────────┘           │ ║
║  └─────────────────────────────────────────────────────────────────────────────┘ ║
║                                      │                                            ║
║                                      ▼                                            ║
║  ┌─────────────────────────────────────────────────────────────────────────────┐ ║
║  │                      ATLAS AI WORKFORCE (5170-5179)                        │ ║
║  │  ┌──────────┐ ┌─────────┐ ┌───────────┐ ┌────────┐ ┌──────────┐           │ ║
║  │  │ Territory│ │  Routes │ │  Copilot  │ │  Graph  │ │ SDR Agent│           │ ║
║  │  │   5170   │ │  5171   │ │   5172    │ │  5173  │ │   5174   │           │ ║
║  │  └──────────┘ └─────────┘ └───────────┘ └────────┘ └──────────┘           │ ║
║  │  ┌──────────────┐ ┌───────────┐ ┌──────────┐ ┌─────────────┐              │ ║
║  │  │ Qualification│ │  Meeting  │ │ Follow-up │ │Research Agent│             │ ║
║  │  │    Agent     │ │   Agent   │ │   Agent   │ │    5178     │              │ ║
║  │  │    5175     │ │   5176   │ │   5177   │ │             │              │ ║
║  │  └──────────────┘ └───────────┘ └──────────┘ └─────────────┘              │ ║
║  └─────────────────────────────────────────────────────────────────────────────┘ ║
║                                      │                                            ║
║                                      ▼                                            ║
║  ┌─────────────────────────────────────────────────────────────────────────────┐ ║
║  │                        ATLAS REVENUE OS (5180-5189)                        │ ║
║  │  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────┐                 │ ║
║  │  │   CRM   │ │ Pipeline │ │ Forecast │ │ Conversation   │                 │ ║
║  │  │  5180   │ │  5181   │ │   5182   │ │    Intel        │                 │ ║
║  │  │         │ │          │ │          │ │    5183        │                 │ ║
║  │  └─────────┘ └──────────┘ └──────────┘ └────────────────┘                 │ ║
║  └─────────────────────────────────────────────────────────────────────────────┘ ║
║                                      │                                            ║
║                                      ▼                                            ║
║  ┌─────────────────────────────────────────────────────────────────────────────┐ ║
║  │                            ATLAS UI (5190-5199)                            │ ║
║  │  ┌──────────────┐ ┌─────────────┐ ┌─────────────┐                         │ ║
║  │  │  Dashboard   │ │  Field App   │ │   Outreach  │                         │ ║
║  │  │    5190     │ │    5191     │ │    Studio   │                         │ ║
║  │  │  (Next.js)  │ │   (React)   │ │    5192     │                         │ ║
║  │  └──────────────┘ └─────────────┘ └─────────────┘                         │ ║
║  └─────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

---

## 📦 Complete Service Inventory

### Layer 1: ATLAS DISCOVER (Core Platform)

| Port | Service | Purpose | Status |
|------|---------|---------|--------|
| 5150 | `atlas-gateway` | Central API Gateway, routing | ✅ |
| 5151 | `atlas-discover` | Map-first merchant discovery | ✅ |
| 5152 | `atlas-maps` | Heat maps, clusters, visualization | ✅ |
| 5153 | `atlas-twin` | Merchant Digital Twin | ✅ |
| 5154 | `atlas-score` | AI lead scoring (A/B/C/D) | ✅ |
| 5155 | `atlas-signals` | Opportunity detection | ✅ |

### Layer 2: ATLAS INTELLIGENCE (NEW)

| Port | Service | Purpose | Status |
|------|---------|---------|--------|
| 5156 | `atlas-company-twin` | Company intelligence (revenue, employees, funding) | 🆕 BUILD |
| 5157 | `atlas-person-twin` | Contact intelligence (email, phone, LinkedIn) | 🆕 BUILD |
| 5158 | `atlas-research-agent` | Deep research on merchants/companies | 🆕 BUILD |
| 5159 | `atlas-intent-engine` | Intent signal detection | 🆕 BUILD |
| 5160 | `atlas-enrichment` | Data enrichment from multiple sources | 🆕 BUILD |

### Layer 3: ATLAS ENGAGE (NEW)

| Port | Service | Purpose | Status |
|------|---------|---------|--------|
| 5161 | `atlas-email-service` | Email sequences, sending, tracking | 🆕 BUILD |
| 5162 | `atlas-whatsapp-service` | WhatsApp sequences, templates | 🆕 BUILD |
| 5163 | `atlas-sms-service` | SMS sequences, templates | 🆕 BUILD |
| 5164 | `atlas-call-service` | Call task management, logging | 🆕 BUILD |
| 5165 | `atlas-deliverability` | Email warmup, bounce detection, domain health | 🆕 BUILD |

### Layer 4: ATLAS AI WORKFORCE

| Port | Service | Purpose | Status |
|------|---------|---------|--------|
| 5170 | `atlas-territory` | Territory management | ✅ |
| 5171 | `atlas-routes` | Route optimization | ✅ |
| 5172 | `atlas-copilot` | AI sales assistant | ✅ |
| 5173 | `atlas-graph` | Relationship graph | ✅ |
| 5174 | `atlas-sdr-agent` | AI SDR (full outbound automation) | 🆕 BUILD |
| 5175 | `atlas-qualification-agent` | Lead qualification (BANT, MEDDIC) | 🆕 BUILD |
| 5176 | `atlas-meeting-agent` | Meeting booking automation | 🆕 BUILD |
| 5177 | `atlas-followup-agent` | Follow-up automation | 🆕 BUILD |
| 5178 | `atlas-research-agent` | Research automation | 🆕 BUILD |

### Layer 5: ATLAS REVENUE OS (NEW)

| Port | Service | Purpose | Status |
|------|---------|---------|--------|
| 5180 | `atlas-crm-core` | CRM (Lead, Account, Contact, Opportunity) | 🆕 BUILD |
| 5181 | `atlas-pipeline` | Pipeline management, stages | 🆕 BUILD |
| 5182 | `atlas-forecast` | Revenue forecasting | 🆕 BUILD |
| 5183 | `atlas-conversation-intel` | Call transcription, analysis | 🆕 BUILD |

### Layer 6: ATLAS UI

| Port | Service | Purpose | Status |
|------|---------|---------|--------|
| 5190 | `atlas-dashboard` | Enterprise dashboard | ✅ |
| 5191 | `atlas-field-app` | Mobile field app | ✅ |
| 5192 | `atlas-outreach-studio` | Sequence builder, campaign management | 🆕 BUILD |

---

## 🔑 Key Features by Layer

### ATLAS DISCOVER

| Feature | Description |
|---------|-------------|
| Map-First Search | Search merchants on interactive map |
| Geo-Filters | Filter by radius, city, zone |
| Category Analysis | Restaurant, Retail, Hotel, etc. |
| Heat Maps | Visualize merchant/opportunity density |
| Cluster Maps | Group markers at zoom levels |
| Territory Overlay | Visual territory boundaries |
| Route Plotting | Plot optimized routes on map |

### ATLAS INTELLIGENCE

| Feature | Description |
|---------|-------------|
| **Company Twin** | Revenue estimate, employees, funding, tech stack |
| **Person Twin** | Email, phone, LinkedIn, role, influence score |
| **Research Agent** | Deep research on website, reviews, social, competitors |
| **Intent Engine** | Detect new website, hiring, funding, expansion signals |
| **Enrichment** | Auto-enrich from 50+ data sources |

### ATLAS ENGAGE

| Feature | Description |
|---------|-------------|
| **Email Sequences** | Multi-step email campaigns |
| **WhatsApp Sequences** | WhatsApp outreach with templates |
| **SMS Sequences** | SMS campaigns with personalization |
| **Call Tasks** | Call scheduling, logging, outcomes |
| **Deliverability** | Email warmup, bounce handling, domain health |

### ATLAS AI WORKFORCE

| Feature | Description |
|---------|-------------|
| **Research Agent** | Automated merchant/company research |
| **SDR Agent** | Full outbound: research → email → reply → meeting |
| **Qualification Agent** | BANT/MEDDIC qualification |
| **Meeting Agent** | Calendar sync, meeting booking |
| **Follow-up Agent** | Automated follow-ups based on cadence |

### ATLAS REVENUE OS

| Feature | Description |
|---------|-------------|
| **CRM** | Lead, Account, Contact, Opportunity management |
| **Pipeline** | Visual pipeline with stages, drag-drop |
| **Forecast** | AI-powered revenue forecasting |
| **Conversation Intel** | Call transcription, objection extraction |

---

## 🏆 Competitive Positioning

| Platform | REZ Atlas v2 Advantage |
|----------|----------------------|
| **Apollo** | + Map-first discovery, physical world intelligence |
| **Clay** | + Built-in CRM, integrated engagement |
| **ZoomInfo** | + India-focused data, local intelligence |
| **Explee** | + Territory management, field sales app |
| **Outreach/Salesloft** | + AI agents, automated SDR |
| **MapiLeads** | + AI research, intent signals |

---

## 🔗 REZ Ecosystem Integration

```
REZ Atlas v2
    │
    ├──► HOJAI AI
    │       ├── Memory (Remember merchant context)
    │       ├── Knowledge Graph (Entity relationships)
    │       └── Agents (Research, SDR, Qualification)
    │
    ├──► RABTUL
    │       ├── Auth (User authentication)
    │       ├── Wallet (REZ Coins for outreach)
    │       └── Notifications (Email, SMS, WhatsApp)
    │
    ├──► REZ-Intelligence
    │       ├── Intent Graph (Buyer intent)
    │       └── Mind (Prediction engine)
    │
    └──► REZ-Merchant
            ├── Merchant data
            ├── Product catalog
            └── Industry OS
```

---

## 📊 Data Models

### Company Twin

```typescript
interface CompanyTwin {
  id: string;
  name: string;
  domain: string;
  industry: string;
  size: 'startup' | 'smb' | 'mid-market' | 'enterprise';
  employeeCount: number;
  revenueEstimate: number;
  funding: {
    stage: string;
    amount: number;
    date: string;
  };
  techStack: string[];
  locations: Location[];
  socialProfiles: Social[];
  competitors: string[];
  buyingSignals: string[];
  lastIntentSignal: {
    type: string;
    timestamp: string;
    confidence: number;
  };
  sources: DataSource[];
}
```

### Person Twin

```typescript
interface PersonTwin {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  emailVerified: boolean;
  phone: string;
  whatsapp: string;
  linkedin: string;
  role: string;
  seniority: 'owner' | 'founder' | 'director' | 'manager' | 'executive';
  influenceScore: number;
  companyId: string;
  linkedAccounts: string[];
  engagementScore: number;
  bestContactTime: string;
}
```

### Account (CRM)

```typescript
interface Account {
  id: string;
  name: string;
  domain: string;
  companyTwinId: string;
  contacts: Contact[];
  ownerId: string;
  territoryId: string;
  status: 'prospect' | 'active' | 'churned';
  lifetimeValue: number;
  lastActivity: Date;
  createdAt: Date;
}
```

### Opportunity

```typescript
interface Opportunity {
  id: string;
  accountId: string;
  contactId: string;
  productId: string;
  stage: 'discovery' | 'qualification' | 'proposal' | 'negotiation' | 'closed';
  value: number;
  probability: number;
  expectedCloseDate: Date;
  nextAction: string;
  aiScore: number;
  notes: string;
}
```

---

## 🚀 Quick Start

```bash
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/REZ-Merchant/REZ-atlas-v2

# Start all services
./start-v2.sh

# Or individual layers
cd atlas-intelligence && npm run dev
cd atlas-engage && npm run dev
cd atlas-ai-workforce && npm run dev
cd atlas-revenue-os && npm run dev
cd atlas-gtm && npm run dev  # GTM Module (Port 5200)
```

---

## 🆕 ATLAS GTM - Autonomous Go-To-Market Module

**Location:** `/REZ-Merchant/REZ-atlas-v2/atlas-gtm/`

**Tagline:** "Enter a domain. Get a complete GTM campaign."

**Version:** 3.2.0 | **Date:** June 9, 2026 | **Status:** ✅ COMPLETE + FULLY OPERATIONAL

### What is Atlas GTM?

Atlas GTM is the **Autonomous Go-To-Market Agent System** that competes directly with Explee. Unlike traditional sales tools that require manual work, Atlas GTM:

1. **Enter a company domain** → AI researches everything
2. **Get complete intelligence** → Company, competitors, segments
3. **Generate prospects** → With scoring and prioritization
4. **Create personalized outreach** → Emails, LinkedIn, WhatsApp, calls
5. **Launch campaigns** → With AI SDR automation
6. **Book meetings** → Calendar integration with Zoom/Meet
7. **Enrich data** → Apollo, Clearbit, Hunter, RocketReach

### GTM Module Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ATLAS GTM v3.0 - FULL STACK                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐    │
│   │                        CORE GTM AGENTS                             │    │
│   │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                │    │
│   │  │ Company      │ │ Competitor  │ │ Segment      │                │    │
│   │  │ Understanding│ │ Discovery   │ │ Builder      │                │    │
│   │  └──────────────┘ └──────────────┘ └──────────────┘                │    │
│   │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                │    │
│   │  │ Buyer        │ │ Prospect    │ │ Outreach     │                │    │
│   │  │ Persona      │ │ Intelligence│ │ Intelligence │                │    │
│   │  └──────────────┘ └──────────────┘ └──────────────┘                │    │
│   └─────────────────────────────────────────────────────────────────────┘    │
│                                      │                                        │
│   ┌─────────────────────────────────────────────────────────────────────┐    │
│   │                     AI OUTREACH MODULES                             │    │
│   │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                │    │
│   │  │ AI Message   │ │ Sequence     │ │ Email        │                │    │
│   │  │ Generator    │ │ Builder      │ │ Sender       │                │    │
│   │  │ (OpenAI)     │ │ (Multi-step) │ │ (SendGrid)   │                │    │
│   │  └──────────────┘ └──────────────┘ └──────────────┘                │    │
│   │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                │    │
│   │  │ Calendar/    │ │ WhatsApp     │ │ LinkedIn     │                │    │
│   │  │ Meeting      │ │ Business     │ │ Sales Nav    │                │    │
│   │  │ Booking      │ │ Integration  │ │ Integration  │                │    │
│   │  └──────────────┘ └──────────────┘ └──────────────┘                │    │
│   └─────────────────────────────────────────────────────────────────────┘    │
│                                      │                                        │
│   ┌─────────────────────────────────────────────────────────────────────┐    │
│   │                    DATA ENRICHMENT LAYER                            │    │
│   │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  │    │
│   │  │ Apollo.io    │ │ Clearbit     │ │ Hunter.io    │ │ RocketReach │  │    │
│   │  │ Person/Comp  │ │ Company/Logo │ │ Email Finder │ │ Person Data  │  │    │
│   │  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘  │    │
│   └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### GTM Agent Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ATLAS GTM - AUTONOMOUS FLOW                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Domain Input: "rez.money"                                                   │
│         │                                                                     │
│         ▼                                                                     │
│   ┌──────────────────┐                                                        │
│   │ Company          │  →  Industry, ICP, Pain Points, Use Cases          │
│   │ Understanding   │     Keywords, Differentiators                       │
│   └────────┬─────────┘                                                        │
│            ▼                                                                  │
│   ┌──────────────────┐                                                        │
│   │ Competitor      │  →  Direct, Indirect, Emerging, Regional             │
│   │ Discovery       │     Competitive Analysis                              │
│   └────────┬─────────┘                                                        │
│            ▼                                                                  │
│   ┌──────────────────┐                                                        │
│   │ Segment          │  →  Shopify Brands, D2C, Subscriptions               │
│   │ Builder          │     Marketplace, Fintech, Retail                     │
│   └────────┬─────────┘                                                        │
│            ▼                                                                  │
│   ┌──────────────────┐                                                        │
│   │ Buyer            │  →  CMO, VP Marketing, CRM Manager, Founder          │
│   │ Persona          │     Seniority, Pain Points, Best Channel             │
│   └────────┬─────────┘                                                        │
│            ▼                                                                  │
│   ┌──────────────────┐                                                        │
│   │ Prospect         │  →  Opportunity Score, Pain Score                     │
│   │ Intelligence     │     Intent Score, Urgency Score                       │
│   └────────┬─────────┘                                                        │
│            ▼                                                                  │
│   ┌──────────────────┐                                                        │
│   │ Outreach         │  →  Who to Target, Why Now                          │
│   │ Intelligence     │     Best Offer, Best Channel                         │
│   └────────┬─────────┘                                                        │
│            ▼                                                                  │
│   ┌──────────────────┐                                                        │
│   │ Message          │  →  Email, LinkedIn, WhatsApp, Call Script          │
│   │ Factory          │     Personalized, Research-based                       │
│   └────────┬─────────┘                                                        │
│            ▼                                                                  │
│   ┌──────────────────┐                                                        │
│   │ Campaign         │  →  228 contacts found                               │
│   │ Generated         │     8 segments, Ready to launch                      │
│   └──────────────────┘                                                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### GTM Agents

| Agent | Purpose | Features |
|-------|---------|----------|
| **Company Understanding** | Analyze any company from domain | Industry, ICP, pain points, use cases, keywords, differentiators |
| **Competitor Discovery** | Find all competitors | Direct, indirect, emerging, regional competitors |
| **Segment Builder** | Auto-generate target segments | Shopify Brands, D2C, Subscriptions, Marketplace, etc. |
| **Buyer Persona** | Generate decision-maker profiles | Titles, seniority, pain points, best channels |
| **Prospect Intelligence** | Score and prioritize | Opportunity, pain, intent, urgency, revenue scores |
| **Outreach Intelligence** | Recommend outreach strategy | Who, why now, best offer, best channel, talking points |
| **Message Factory** | Generate personalized messages | Email, LinkedIn, WhatsApp, Call scripts |
| **Campaign Generator** | Orchestrate the full flow | End-to-end GTM campaign generation |

### GTM Modules (v3.2)

| Module | Purpose | Integrations |
|--------|---------|--------------|
| **AI Message Generator** | Personalized outreach via OpenAI | Email, LinkedIn, WhatsApp, Call scripts |
| **Sequence Builder** | Multi-step automation engine | Conditions, delays, A/B testing, branching |
| **Email Sender** | SendGrid with warmup | Bounce tracking, unsubscribe, open/click |
| **Calendar Integration** | Meeting booking | Google Calendar, Zoom, Google Meet |
| **WhatsApp Integration** | WhatsApp Business API | Templates, campaigns, opt-in/out |
| **LinkedIn Integration** | Sales Navigator automation | Search, connect, InMail, post |
| **Data Enrichment** | Apollo, Clearbit, Hunter, RocketReach | Company/person enrichment, email finder |
| **Prospect Database** | Full CRUD, search, import/export | CSV, JSON, bulk operations |
| **REZ CRM Integration** | Bidirectional CRM sync | REZ CRM (Port 4210), deals, activities |

### API Endpoints

#### Core GTM
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/gtm/campaign` | Start full GTM campaign |
| GET | `/api/gtm/campaigns` | List all campaigns |
| GET | `/api/gtm/campaign/:id` | Get campaign status |

#### AI Messages
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/gtm/messages/generate` | Generate personalized messages |
| GET | `/api/gtm/messages/:prospectId` | Get generated messages |

#### Sequences
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/gtm/sequences` | List all sequences |
| POST | `/api/gtm/sequences` | Create sequence |
| PUT | `/api/gtm/sequences/:id` | Update sequence |
| DELETE | `/api/gtm/sequences/:id` | Delete sequence |
| POST | `/api/gtm/sequences/:id/steps` | Add step |
| GET | `/api/gtm/sequences/:id/stats` | Get sequence stats |

#### Email
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/gtm/email/send` | Send single email |
| POST | `/api/gtm/email/bulk` | Send bulk emails |
| GET | `/api/gtm/email/stats` | Email statistics |
| GET | `/api/gtm/email/warmup` | Warmup accounts |
| GET | `/api/gtm/email/log` | Email log |

#### Calendar
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/gtm/calendar/booking-link` | Create booking link |
| GET | `/api/gtm/calendar/booking-link/:id/slots` | Get available slots |
| POST | `/api/gtm/calendar/book` | Book meeting |
| GET | `/api/gtm/calendar/meetings` | List meetings |
| POST | `/api/gtm/calendar/meetings/:id/reschedule` | Reschedule |
| POST | `/api/gtm/calendar/meetings/:id/cancel` | Cancel |
| GET | `/api/gtm/calendar/analytics` | Meeting analytics |

#### WhatsApp
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/gtm/whatsapp/send` | Send WhatsApp message |
| POST | `/api/gtm/whatsapp/send-template` | Send template |
| POST | `/api/gtm/whatsapp/bulk` | Send bulk |
| POST | `/api/gtm/whatsapp/opt-in` | Add opt-in |
| POST | `/api/gtm/whatsapp/opt-out` | Remove opt-in |
| GET | `/api/gtm/whatsapp/templates` | List templates |
| GET | `/api/gtm/whatsapp/analytics` | WhatsApp analytics |
| POST | `/api/gtm/whatsapp/campaigns` | Create campaign |
| POST | `/api/gtm/whatsapp/campaigns/:id/execute` | Execute campaign |

#### LinkedIn
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/gtm/linkedin/search` | Search prospects |
| GET | `/api/gtm/linkedin/profile/:id` | Get profile |
| GET | `/api/gtm/linkedin/profile/:id/engagement` | Engagement insights |
| POST | `/api/gtm/linkedin/connect` | Send connection request |
| POST | `/api/gtm/linkedin/inmail` | Send InMail |
| POST | `/api/gtm/linkedin/post` | Post update |
| POST | `/api/gtm/linkedin/campaigns` | Create campaign |
| GET | `/api/gtm/linkedin/campaigns/:id/analytics` | Campaign analytics |

#### Data Enrichment
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/gtm/enrich/company` | Enrich company |
| POST | `/api/gtm/enrich/person` | Enrich person |
| POST | `/api/gtm/enrich/find-email` | Find email |
| POST | `/api/gtm/enrich/verify-email` | Verify email |
| POST | `/api/gtm/enrich/bulk` | Create bulk job |
| POST | `/api/gtm/enrich/bulk/:jobId/execute` | Execute bulk |
| GET | `/api/gtm/enrich/bulk/:jobId` | Job status |
| GET | `/api/gtm/enrich/cache-stats` | Cache stats |

#### Prospect Database
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/gtm/prospects` | Create prospect |
| GET | `/api/gtm/prospects` | List/search prospects |
| GET | `/api/gtm/prospects/:id` | Get prospect |
| PUT | `/api/gtm/prospects/:id` | Update prospect |
| DELETE | `/api/gtm/prospects/:id` | Delete prospect |
| POST | `/api/gtm/prospects/bulk` | Bulk create/update |
| POST | `/api/gtm/prospects/:id/engagement` | Record engagement |
| POST | `/api/gtm/prospects/:id/tags` | Add tag |
| GET | `/api/gtm/prospects/export/csv` | Export CSV |
| GET | `/api/gtm/prospects/export/json` | Export JSON |
| POST | `/api/gtm/prospects/import/csv` | Import CSV |
| GET | `/api/gtm/prospects/stats` | Dashboard stats |
| POST | `/api/gtm/segments` | Create segment |
| POST | `/api/gtm/views` | Create saved view |

#### REZ CRM Integration
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/gtm/crm/sync/prospect/:id` | Sync prospect to CRM |
| POST | `/api/gtm/crm/sync/all` | Sync all prospects to CRM |
| POST | `/api/gtm/crm/sync/full` | Full bidirectional sync |
| POST | `/api/gtm/crm/deal/prospect/:id` | Create deal from prospect |
| POST | `/api/gtm/crm/engagement/:id` | Log engagement to CRM |
| GET | `/api/gtm/crm/contacts` | Get CRM contacts |
| GET | `/api/gtm/crm/deals` | Get CRM deals |
| POST | `/api/gtm/crm/tasks` | Create task in CRM |
| POST | `/api/gtm/crm/webhook` | CRM webhook handler |

### Quick Start

```bash
# Start GTM Service
cd /REZ-Merchant/REZ-atlas-v2/atlas-gtm
npm install && npm run dev  # Port 5200

# Start GTM Workspace UI
cd ../gtm-workspace
npm install && npm start  # Port 3003

# Test GTM API
curl -X POST http://localhost:5200/api/gtm/campaign \
  -H "Content-Type: application/json" \
  -d '{"domain": "rez.money"}'
```

### GTM Workspace UI

**Location:** `/REZ-Merchant/REZ-atlas-v2/gtm-workspace/`

The GTM Workspace is the Explee competitor UI:

| Feature | Description |
|---------|-------------|
| Campaign Start | Enter domain, AI generates everything |
| Company View | Complete company intelligence |
| Competitor View | All competitors with analysis |
| Segment View | Auto-generated target segments |
| Prospects View | Scored and prioritized prospects |
| Outreach View | Recommendations and talking points |
| Messages View | Generated emails, LinkedIn, WhatsApp, calls |

### vs Explee Comparison

| Feature | Explee | Atlas GTM |
|---------|---------|-----------|
| Company Research | ✅ | ✅ |
| Competitor Discovery | ✅ | ✅ |
| Segment Building | ✅ | ✅ |
| Buyer Personas | ✅ | ✅ |
| Prospect Scoring | ✅ | ✅ |
| Email Generation | ✅ | ✅ |
| LinkedIn Messages | ✅ | ✅ |
| WhatsApp | ❌ | ✅ |
| Call Scripts | ❌ | ✅ |
| Territory Management | ❌ | ✅ (Atlas Core) |
| Field Sales App | ❌ | ✅ (Atlas Field) |
| Map Intelligence | ❌ | ✅ (Atlas Core) |

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | This document |
| [SERVICES.md](SERVICES.md) | Service-by-service documentation |
| [API-REFERENCE.md](API-REFERENCE.md) | Complete API reference |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Production deployment |

---

**Last Updated:** June 9, 2026  
**Version:** 2.0.0  
**Status:** BUILDING