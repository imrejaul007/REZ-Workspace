
---

## HOJAI AI - COMPLETE PRODUCT INVENTORY

### Products Built

| Product | Port | Purpose | Status |
|---------|------|---------|--------|
| WhatsApp AI Employee | 4570 | AI chatbot for merchants | ✅ Built |
| Event Bus | 4510 | Real-time events | ✅ Built |
| Memory Service | 4520 | Customer profiles | ✅ Built |
| Intelligence Engine | 4530 | ML predictions | ✅ Built |
| Flow Orchestrator | 4560 | Workflow automation | ✅ Built |
| API Gateway | 4500 | Routing + Auth | ✅ Built |
| Governance | 4501 | Tenant isolation | ✅ Built |
| Policy Engine | 4505 | Consent + GDPR | ✅ Built |

### RABTUL Connectors

| Connector | Port | Purpose |
|-----------|------|---------|
| Auth | 4002 | User verification |
| Wallet | 4004 | Cashback + loyalty |
| Payment | 4001 | Orders + checkout |
| Notify | 4011 | Push + SMS + WhatsApp |
| Loyalty | 4041 | Points + tiers |

### REZ Intelligence Connectors

| Connector | Source | Data |
|----------|--------|------|
| RisaCare | Health data | Wellness + fitness |
| Commerce | All apps | Shopping + browse |
| Rendez | Dating | Relationships |
| Karma | Social | Good deeds |
| CorpPerks | Enterprise | Employment |
| PeopleOS | Workforce | HR + payroll |
| REZ Merchant | Commerce | Business ops |
| ReZ Ride | Mobility | Rides + commute |
| Airzy | Travel | Flights + hotels |
| Cosmic OS | Astrology | Birth charts |
| RidZa | Finance | Transactions |
| RisnaEstate | Real estate | Property |
| StayOwn | Hospitality | Hotel bookings |
| BuzzLocal | Community | Hyperlocal |
| Z Events | Events | Community |
| Insights Campus | Education | Students |
| Hojai AI | WhatsApp | SMB automation |

### Data Sources (16 Connected

| Source | Data Type | Privacy |
|--------|------------|---------|
| RisaCare | Health | Tier 3 |
| Commerce | Shopping | Tier 1 |
| Rendez | Social | Tier 3 |
| Karma | Impact | Tier 2 |
| CorpPerks | Employment | Tier 2 |
| ReZ Ride | Mobility | Tier 1 |
| Airzy | Travel | Tier 2 |
| BuzzLocal | Local | Tier 1 |
| RidZa | Finance | Tier 3 |
| REZ Card | Payments | Tier 1 |

### Documentation

| Document | Purpose |
|----------|---------|
| SDK Docs | Mobile SDK |
| API Reference | REST API |
| Integration Guide | REZ Connect |
| Quick Start | 5-min setup |
| SOT | Source of Truth |

### Products Ready

| Product | Status |
|---------|--------|
| WhatsApp AI Employee | ✅ Built |
| Event Bus | ✅ Built |
| Memory Layer | ✅ Built |
| Intelligence Engine | ✅ Built |
| Flow Orchestrator | ✅ Built |
| Monitoring | ✅ Built |

### Files Built

| Type | Count |
|------|--------|
| TypeScript services | 22 |
| HTML dashboards | 4 |
| Markdown docs | 8 |
| GitHub Actions | 3 |
| Docker configs | 1 |
| Connectors | 16 |

### SOT Updated ✅

All products documented and connected to REZ ecosystem.


---

## HOJAI AI - WHAT IT IS

### Single Line

> "AI employee for SMBs - handles customer service, bookings, orders 24/7

### What Merchants Get

| What | Benefit |
|------|---------|
| WhatsApp AI | Chatbot responds 24/7 |
| Knowledge Base | Train with Q&A |
| Payments | Accept ₹999/month |
| Analytics | Dashboard |
| REZ signals | Customer enrichment |
| GDPR consent | User controls |

### What REZ Gets

| What | Benefit |
|------|---------|
| Commerce signals | Training data |
| SMB trends | Market intelligence |
| Usage patterns | Product feedback |

### Files

---

## Hojai Flow - Voice-First AI Companion (v1.0)

**Location:** `hojai-ai/hojai-flow-app/` + `hojai-flow-service/`
**Type:** Voice-First AI Companion
**Status:** Built ✅ May 30, 2026

### Product Vision

> "A voice-first AI companion that knows you, remembers for you, finds things for you, and gets work done for you from a single hotkey."

### 5 Core Capabilities

| Capability | Description |
|-----------|-------------|
| **Talk Naturally** | Real-time voice dictation with streaming STT |
| **Remembers Everything** | Personal brain with contacts, projects, decisions |
| **Finds Instantly** | Search across brain and memory |
| **Performs Actions** | Smart actions with suggestions and approvals |
| **Learns Your Style** | Persona-based personalization |

### User Experience

```
User presses: ⌥ + Space (or Fn)

Hojai overlay appears.

User speaks naturally.

Hojai routes intent automatically.

Hojai executes or asks for approval.

Done.
```

### App Screens

| Screen | Route | Purpose |
|--------|-------|---------|
| Flow (Overlay) | `/` | Main voice interface (90% usage) |
| Brain | `/brain` | Personal knowledge graph |
| Actions | `/actions` | Smart actions & approvals |
| Personas | `/personas` | Voice/identity settings |
| Settings | `/settings` | Configuration |

### Brain Categories

| Category | Description |
|----------|-------------|
| **Contacts** | People you interact with |
| **Projects** | Active work items |
| **Decisions** | Choices made |
| **Context** | Current situation |
| **Notes** | Quick thoughts |

### Action Types

| Type | Description |
|------|-------------|
| `message` | WhatsApp/SMS message |
| `email` | Email draft/send |
| `call` | Voice call |
| `meeting` | Calendar event |
| `campaign` | Marketing campaign |
| `follow_up` | Follow-up reminder |
| `approval` | Needs approval |

### Intent Detection

| Speech Pattern | Intent | Action |
|----------------|---------|--------|
| "Send update to Rahul" | execute | send_message |
| "Schedule meeting tomorrow" | execute | create_meeting |
| "What is refund policy?" | ask | search |
| "Remember this merchant prefers WhatsApp" | remember | store_memory |
| "Follow up inactive customers" | delegate | batch_process |
| "Draft email to CEO" | flow | compose_email |
| "Approve proposal" | approve | approval_action |

### Persona Types

| Type | Voice Style | Permissions |
|------|-------------|------------|
| **Personal** | User's voice | Full |
| **Founder** | Assertive | Full |
| **Sales** | Friendly | Limited |
| **Support** | Professional | Read-only |
| **HR** | Warm | Limited |

### Backend Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/personas` | GET/POST | Manage personas |
| `/api/brain` | GET/POST | Brain items |
| `/api/brain/contacts` | GET | Contact list |
| `/api/brain/summary` | GET | Brain stats |
| `/api/actions/suggestions` | GET | AI suggestions |
| `/api/actions/:id/approve` | PATCH | Approve action |

### Environment Variables

```bash
# Backend
MONGODB_URI=mongodb://localhost:27017/hojai_flow

# Voice (optional)
VOICE_SERVICE_URL=http://localhost:4033
VOICE_WS_URL=ws://localhost:8080
```

### Build Commands

```bash
# Backend
cd hojai-flow-service
npm install
npm run dev

# App
cd hojai-flow-app
npm install
npx expo start
```

### Product Grade

| Category | Score |
|----------|-------|
| UI Foundation | 8/10 |
| Backend Foundation | 8/10 |
| Product Experience | 8/10 |
| Voice Experience | 6/10 |
| Memory Experience | 8/10 |
| Business Execution | 8/10 |
| **Overall** | **75-80%** |

### Missing for V1 Complete

| Feature | Priority | Status |
|---------|----------|--------|
| Real streaming STT | P0 | Stub |
| Hotkey registration | P0 | Stub |
| Approval Center | P1 | Partial |
| Style Learning | P1 | Stub |

---

