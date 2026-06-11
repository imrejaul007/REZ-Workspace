# PROPFLOW - State of Technology

**Version:** 1.0.0
**Date:** June 3, 2026
**Industry:** Real Estate
**Tagline:** "AI That Closes Deals"

---

## 1. PRODUCT OVERVIEW

PROPFLOW is an AI-powered operating system for real estate agencies and developers. It combines AI agents (workers), automated workers, voice agents, and a complete backend to manage real estate operations.

### Target Customers
- Standalone real estate agencies (HOJAI AI clients)
- REZ ecosystem clients

### Pricing
- ₹4,999/month (HOJAI AI)
- Included in REZ-Merchant OS (REZ ecosystem)

---

## 2. AI EMPLOYEES (AGENTS)

AI Agents are specialized workers that interact with buyers and agents.

### 2.1 Lead Qualifier AI
- **Purpose:** Lead scoring, qualification
- **Interactions:** Lead screening, budget queries, timeline assessment
- **Skills:**
  - Budget analysis
  - Timeline assessment
  - Intent scoring
  - Lead routing

### 2.2 Property Advisor AI
- **Purpose:** Property recommendations, matching
- **Interactions:** Property suggestions, comparison, site visit scheduling
- **Skills:**
  - Property matching
  - Feature comparison
  - Pricing analysis
  - Location insights

### 2.3 Site Visit Coordinator AI
- **Purpose:** Visit scheduling, management
- **Interactions:** Site visit booking, reminder, feedback collection
- **Skills:**
  - Calendar management
  - Route optimization
  - Reminder automation
  - Feedback collection

### 2.4 Negotiation Agent AI
- **Purpose:** Deal support, pricing
- **Interactions:** Price negotiation, document handling, closure
- **Skills:**
  - Price analysis
  - Counter-offer generation
  - Document preparation
  - Closure guidance

---

## 3. AI WORKERS (AUTOMATED TASKS)

AI Workers run automated background processes.

### 3.1 Lead Worker
- **Purpose:** Lead management, nurturing
- **Tasks:**
  - Lead capture
  - Follow-up scheduling
  - Nurturing campaigns
  - Status tracking

### 3.2 Property Worker
- **Purpose:** Property database management
- **Tasks:**
  - Listing updates
  - Photo management
  - Virtual tour coordination
  - Availability tracking

### 3.3 Report Worker
- **Purpose:** Sales reporting
- **Tasks:**
  - Pipeline reports
  - Conversion analytics
  - Agent performance
  - Market trends

---

## 4. VOICE AGENTS

### 4.1 Phone Receptionist
- **Capabilities:**
  - Answer property queries
  - Schedule visits
  - Collect requirements
  - Follow-up calls
- **Languages:** Hindi, English, Tamil, Telugu, Bengali, Marathi

### 4.2 WhatsApp AI
- **Capabilities:**
  - Text/voice conversations
  - Property details
  - Visit reminders
  - Price updates

---

## 5. BACKEND SERVICES

### 5.1 Property Service (`/services/property-service/`)
- Property listings
- Features management
- Availability tracking
- Media management

### 5.2 Lead Service (`/services/lead-service/`)
- Lead capture
- Qualification
- Assignment
- Tracking

### 5.3 Visit Service (`/services/visit-service/`)
- Site visit scheduling
- Calendar management
- Feedback collection
- Confirmation

### 5.4 Sales Service (`/services/sales-service/`)
- Deal tracking
- Commission calculation
- Document management
- Agreement generation

---

## 6. INTEGRATION POINTS

### 6.1 HOJAI Core
- Intent Graph
- Memory System
- Trust Engine
- Agent Marketplace

### 6.2 Merchant OS
- Customer database
- Payment processing
- Reporting

### 6.3 REZ Merchant OS (for REZ clients)
- Full ecosystem sync
- Cross-product insights
- Unified reporting

### 6.4 External Systems
- Property portals
- Government registries
- Banking/loan partners
- Legal services

---

## 7. API ENDPOINTS

### AI Agent APIs
```
POST /api/ai/lead/qualify
POST /api/ai/property/match
POST /api/ai/visit/schedule
POST /api/ai/negotiate/support
```

### Worker APIs
```
GET  /api/workers/lead/nurture/:leadId
POST /api/workers/property/update
GET  /api/workers/reports/sales
```

### Service APIs
```
GET  /api/services/properties/:id
POST /api/services/properties
GET  /api/services/leads/:id
POST /api/services/leads
GET  /api/services/visits/:id
POST /api/services/visits
GET  /api/services/sales/:dealId
POST /api/services/sales
```

### Voice Agent APIs
```
POST /api/voice/call/incoming
POST /api/voice/whatsapp/webhook
```

---

## 8. TECHNOLOGY STACK

| Layer | Technology |
|-------|------------|
| Runtime | Node.js / TypeScript |
| Framework | Express.js |
| Database | PostgreSQL (Merchant OS) |
| Cache | Redis |
| AI/ML | HOJAI Core / OpenAI |
| Voice | Twilio / Exotel |
| Storage | S3 / Local |
| Monitoring | Prometheus / Grafana |
| Container | Docker |
| Orchestration | Kubernetes |

---

## 9. DEPLOYMENT

### Ports
- **Main Service:** TBD
- **Voice Agents:** 4850-4860

### Environment Variables
```bash
PORT=4807
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
HOJAI_CORE_URL=http://localhost:4100
MERCHANT_OS_URL=http://localhost:4000
VOICE_PROVIDER=twilio
```

### Health Checks
```bash
GET /health      # Service health
GET /ai/status   # AI employee status
```

---

## 10. CURRENT STATUS

| Component | Status | Notes |
|-----------|--------|-------|
| Lead Qualifier AI | ⏳ Pending | Needs implementation |
| Property Advisor AI | ⏳ Pending | Needs implementation |
| Site Visit Coordinator AI | ⏳ Pending | Needs implementation |
| Negotiation Agent AI | ⏳ Pending | Needs implementation |
| Lead Worker | ⏳ Pending | Needs implementation |
| Property Worker | ⏳ Pending | Needs implementation |
| Report Worker | ⏳ Pending | Needs implementation |
| Phone Receptionist | ⏳ Pending | Needs voice agent setup |
| WhatsApp AI | ⏳ Pending | Needs WhatsApp integration |
| Property Service | ✅ Ready | Service folder exists |
| Lead Service | ⏳ Pending | Needs service folder |
| Visit Service | ⏳ Pending | Needs service folder |
| Sales Service | ⏳ Pending | Needs service folder |

---

## 11. MISSING ITEMS (TODO)

1. **src/index.ts** - Main entry point with all routes
2. **AI employee implementations** - Lead, Property, Visit, Negotiation
3. **Worker implementations** - Lead, Property, Report
4. **Voice agent implementations** - Phone, WhatsApp
5. **Service implementations** - Lead, Visit, Sales
6. **CLAUDE.md** - Developer documentation
7. **README.md** - Needs creation
8. **Dockerfile** - Container configuration
9. **package.json** - Dependencies
10. **tsconfig.json** - TypeScript configuration
11. **employees/** folders - Need AI agent folders
12. **workers/** folders - Need worker folders

---

**Last Updated:** June 3, 2026
**Maintainer:** HOJAI AI Team
