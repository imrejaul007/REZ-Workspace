# REZ SalesMind v2.1

**AI Sales Intelligence Platform** (Formerly REZ Atlas)

Port: **5150**

---

## Overview

REZ SalesMind is an AI-powered sales intelligence platform that connects to the entire RTNM ecosystem. It leverages existing services for prospecting, communication, intelligence, identity, and CRM - no duplication of functionality.

---

## Complete Ecosystem Integration

### HOJAI AI Services ✅
| Service | Port | Purpose | Connection |
|---------|------|---------|------------|
| Web Intelligence | 4595 | Market signals, competitor analysis | ✅ Connected |
| Merchant Intel | 4751 | Business intelligence | ✅ Connected |
| Lead Service | 4752 | Lead scoring, enrichment | ✅ Connected |
| Knowledge Graph | 4786 | Entity relationships | ✅ Connected |
| TwinOS | 4521 | Conversation intelligence | ✅ Connected |

### Genie Voice Services ✅
| Service | Port | Purpose | Connection |
|---------|------|---------|------------|
| Genie Voice | 4760 | Email, SMS, WhatsApp, Calls | ✅ Connected |
| Meeting Scheduling | 4760 | Zoom, Calendar | ✅ Connected |

### REZ Services ✅
| Service | Port | Purpose | Connection |
|---------|------|---------|------------|
| REZ Identity Hub | 6000 | Unified identity, memory | ✅ Connected |
| REZ CRM Hub | 6100 | Leads, deals, pipeline | ✅ Connected |
| REZ Merchant | 4100 | Business data | ✅ Connected |
| REZ Consumer | 4200 | Consumer profiles | ✅ Connected |
| REZ Booking | 4020 | Reservations, scheduling | ✅ Connected |

### AssetMind ✅
| Service | Port | Purpose | Connection |
|---------|------|---------|------------|
| AssetMind Main | 5000 | Revenue twins, forecasting | ✅ Connected |

### AdBazaar ✅
| Service | Port | Purpose | Connection |
|---------|------|---------|------------|
| Campaign Manager | 4300 | Marketing campaigns | ✅ Connected |
| Attribution | 4301 | Conversion tracking | ✅ Connected |
| CRM | 4303 | Customer data | ✅ Connected |

---

## Features

### AI Sales Agent (NEW v2.1)
- Complete sales workflow orchestration
- Multi-channel outreach sequences
- Conversation analysis and insights
- Automatic lead enrichment

### Pre-Call Intelligence
- Company intelligence from HOJAI AI
- Market signals and trends
- Recent conversation history
- Talking points generation

### Prospect Twins
- Personality profiling
- Communication preferences
- Best contact times
- Buying signals detection

### Communication Hub
- Email via Genie Voice
- SMS and WhatsApp
- Phone/Call integration
- Meeting scheduling

### Market Intelligence
- Real-time market signals
- Company profiles
- Industry trends
- Competitor analysis

### Conversation Memory
- Cross-channel history
- Identity persistence
- Pre-call briefs
- Activity tracking

---

## API Endpoints

### Ecosystem Routes (`/api/ecosystem`)
```
GET  /api/ecosystem/prospecting/search?q={query}  - Search prospects
GET  /api/ecosystem/intelligence/market-signals   - Market signals
GET  /api/ecosystem/identity/profile/:id          - Identity profile
GET  /api/ecosystem/identity/conversation-history - Memory
GET  /api/ecosystem/crm/leads                     - CRM leads
GET  /api/ecosystem/crm/deals                     - CRM deals
POST /api/ecosystem/workflow/run                  - Run AI workflow
POST /api/ecosystem/conversation/analyze          - Analyze conversation
GET  /api/ecosystem/status                        - Connection status
```

### Communication Routes (`/api/ecosystem/communication`)
```
POST /api/ecosystem/communication/email    - Send email
POST /api/ecosystem/communication/sms      - Send SMS
POST /api/ecosystem/communication/call     - Make call
POST /api/ecosystem/communication/whatsapp - Send WhatsApp
```

### AI Routes (`/api/ai`)
```
POST /api/ai/email/generate       - Generate email
POST /api/ai/email/sequence      - Generate sequence
POST /api/ai/proposal/generate    - Generate proposal
POST /api/ai/forecast/deal        - Forecast deal
POST /api/ai/forecast/pipeline    - Forecast pipeline
```

### Dashboard (`/api/dashboard`)
```
GET  /api/dashboard/stats         - Dashboard stats
GET  /api/dashboard/pipeline-chart - Chart data
GET  /api/dashboard/leaderboard    - Top performers
```

### Original Routes
```
GET  /api/sales/intelligence/:leadId  - Sales intelligence
GET  /api/sales/pre-call/:leadId       - Pre-call brief
GET  /api/sales/twin/:leadId          - Prospect twin
GET  /api/insights/market/:industry   - Market insights
GET  /api/leads                        - All leads
```

---

## Comparison: REZ SalesMind vs Outplay

| Feature | Outplay | REZ SalesMind |
|---------|---------|---------------|
| Prospecting | B2B Database | HOJAI Lead Service |
| Multi-channel | Email, LinkedIn, SMS, Phone | Genie Voice + All Channels |
| AI SDR | ✅ Basic | ✅ Full Ecosystem |
| Conversation Intelligence | Call Recording | TwinOS + Memory |
| Email Writing | ✅ | ✅ |
| Forecasting | ✅ | ✅ + AssetMind Twin |
| CRM | Salesforce, HubSpot | REZ CRM Hub |
| Identity | ❌ | REZ Identity Hub |
| Memory | ❌ | ✅ Full History |
| Knowledge Graph | ❌ | HOJAI Knowledge Graph |
| Business Twin | ❌ | AssetMind |

**Verdict:** REZ SalesMind is WIDER (ecosystem) + DEEPER (AI agents + memory + twins)

---

## Environment Variables

```env
# HOJAI AI
HOJAI_WEB_INTEL=http://localhost:4595
HOJAI_MERCHANT_INTEL=http://localhost:4751
HOJAI_LEAD_SERVICE=http://localhost:4752
HOJAI_KG=http://localhost:4786
HOJAI_TWIN_OS=http://localhost:4521

# Genie Voice
GENIE_VOICE=http://localhost:4760

# REZ Services
REZ_IDENTITY_HUB=http://localhost:6000
REZ_CRM_HUB=http://localhost:6100
REZ_MERCHANT=http://localhost:4100
REZ_CONSUMER=http://localhost:4200
REZ_BOOKING=http://localhost:4020

# AssetMind
ASSETMIND=http://localhost:5000

# AdBazaar
ADBAZAAR_CAMPAIGNS=http://localhost:4300
ADBAZAAR_CRM=http://localhost:4303
```

---

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Health check
curl http://localhost:5150/health

# Check ecosystem connections
curl http://localhost:5150/api/ecosystem/status

# Dashboard UI
open http://localhost:5150/dashboard
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.1.0 | June 2026 | Ecosystem connector, AI Sales Agent, all RTNM services wired |
| 2.0.0 | June 2026 | Renamed from REZ Atlas, added AdBazaar + REZ CRM Hub |
| 1.0.0 | Earlier | Initial REZ Atlas release |

---

**License:** Proprietary - RTNM Digital