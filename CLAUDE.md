# HOJAI AI - Complete Platform Documentation

**Version:** 4.0 | **Date:** June 3, 2026

---

## OVERVIEW

**HOJAI AI** is the parent AI infrastructure company powering the entire REZ ecosystem.

### Key Architecture

```
HOJAI AI (PARENT COMPANY - Infrastructure)
    │
    ├──► HOJAI CORE (12 platforms)
    │         4500-4590
    │
    ├──► REZ INTELLIGENCE (Privileged Tenant - Built ON HOJAI Core)
    │         186+ services
    │         All REZ companies use REZ Intelligence
    │
    ├──► HOJAI INTELLIGENCE (Commercial - External businesses)
    │         4750-4754
    │
    ├──► GENIE (Personal AI)
    │         4703-4709
    │
    └──► Razo (Voice Product)
              Voice AI assistant
```

---

## HOJAI CORE (12 Platforms)

| Port | Service | Purpose |
|------|---------|---------|
| 4500 | API Gateway | Routing, auth, rate limiting |
| 4501 | Governance | RBAC, audit, permissions |
| 4510 | Event Bus | Pub/sub, streaming |
| 4520 | Memory | Vector store, timeline |
| 4530 | Intelligence | ML predictions |
| 4550 | Agents | Agent orchestration |
| 4560 | Workflows | Automation |
| 4570 | Communications | WhatsApp, SMS, Email |
| 4580 | Hyperlocal | Geo intelligence |
| 4590 | Data | Feature store |

---

## REZ INTELLIGENCE (Privileged Tenant - Built ON HOJAI Core)

**REZ Intelligence** is a privileged tenant built ON HOJAI Core infrastructure, providing AI/ML services to all REZ ecosystem companies.

### Total: 186+ Services

| Category | Services |
|----------|----------|
| **Intent & Memory** | rez-intent-graph, rez-intent-predictor, rez-memory-engine, rez-memory-layer |
| **AI Agents** | rez-agent-registry, rez-autonomous-agents, rez-commerce-agents, rez-support-agent, rez-sales-agent |
| **Commerce** | rez-recommendation-engine, rez-personalization-engine, rez-pricing-engine, rez-cross-sell-engine |
| **Analytics** | rez-analytics-orchestrator, rez-attribution-system, rez-rfm-service, rez-cohort-service |
| **Unified Graph** | rez-unified-identity, rez-unified-profile, rez-consumer-graph, rez-merchant-graph, rez-universal-user-graph |
| **Experts (15+)** | rez-fitness-expert, rez-culinary-expert, rez-hospitality-expert, rez-health-expert, rez-finance-expert, rez-logistics-expert, rez-real-estate-expert, rez-travel-expert, rez-education-expert, rez-retail-expert, rez-salon-expert |
| **MCP Services** | rez-mcp-event-bus, rez-mcp-identity, rez-mcp-inventory, rez-mcp-order, rez-mcp-payment |
| **ML Pipeline** | rez-ml-engine, rez-ml-feature-store, rez-ml-model-registry |
| **Decision** | rez-real-time-decision-engine, rez-predictive-engine, rez-confidence-scorer |
| **Channels** | rez-whatsapp-orchestrator-bridge, rez-rcs-bridge, rez-email-bridge, rez-sms-bridge |

### Key Service Ports

| Service | Port | Purpose |
|---------|------|---------|
| Intent Predictor | 4018 | AI recommendations |
| Predictive Engine | 4123 | ML predictions |
| Memory Layer | 4201 | Memory store |
| Signal Aggregator | 4142 | Event aggregation |

---

## PRODUCT INTELLIGENCE ARCHITECTURE (v3)

**Federated Intelligence Architecture** - Each product has its own intelligence layer.

### 6-Layer Architecture

```
HOJAI Core → REZ Intelligence → Company Intel → Product Intel → Micro Intel → Edge
```

### Product Intelligences (23)

| Product | Port | Domain |
|---------|------|--------|
| BuzzLocal | 4400 | Hyperlocal Social |
| Airzy | 4500 | Travel |
| REZ Merchant | 4600 | Commerce OS |
| REZ Ride | 4700 | Mobility |
| RisaCare | 4800 | Healthcare |
| RIDZA-FinanceOS | 5000 | Finance |
| Nexha | 5300 | Commerce Network |
| AdBazaar | 5400 | Advertising |
| REZ Consumer | 5500 | Super App |
| REZ Trust OS | 5600 | Trust |

### SDK Packages

| Package | Purpose |
|---------|---------|
| `@hojai/intelligence-sdk` | Product Intelligence framework |
| `@hojai/edge-intelligence` | On-device intelligence |

Reference: [docs/PRODUCT-INTELLIGENCE-ARCHITECTURE.md](../docs/PRODUCT-INTELLIGENCE-ARCHITECTURE.md)

---

## HOJAI INTELLIGENCE (Commercial)

Services available to external businesses (not REZ ecosystem).

| Port | Service | Purpose |
|------|---------|---------|
| 4750 | Commerce Intelligence | External commerce AI |

---

## GENIE (Personal AI)

Personal AI services for individual users.

| Port | Service | Purpose |
|------|---------|---------|
| 4703 | GENIE Memory | Personal memory store |
| 4704 | GENIE Relationship | Relationship tracking |
| 4706 | GENIE Briefing | Daily briefings |

---

## VOICEOS PLATFORM

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    VOICE GATEWAY                              │
├─────────────────────────────────────────────────────────────┤
│  📞 Phone (Twilio, Exotel, Knowlarity)                      │
│  💬 WhatsApp Voice                                        │
│  🌐 Web Voice Widget                                     │
│  📱 Mobile Voice                                        │
│  📹 Video Agent                                         │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    SPEECH ENGINE                            │
├─────────────────────────────────────────────────────────────┤
│  🎤 STT: Whisper, Sarvam, Google                        │
│  🔊 TTS: ElevenLabs, Cartesia, Sarvam                     │
│  🌐 Translate: 10+ Indian Languages                     │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    VOICE BRAIN                             │
├─────────────────────────────────────────────────────────────┤
│  🧠 Intent Engine (detect what user wants)                │
│  📋 Context Engine (understand the situation)           │
│  💾 Memory Engine (remember everything)                 │
│  😊 Emotion Engine (detect sentiment)                   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    ACTION ENGINE                            │
├─────────────────────────────────────────────────────────────┤
│  🛒 Voice Commerce (order, checkout, pay)                │
│  📅 Voice Bookings (appointments, reservations)          │
│  💳 Voice Payments (UPI, Card, COD)                     │
│  📞 Voice Support (complaints, refunds)                  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    AI EMPLOYEES                            │
├─────────────────────────────────────────────────────────────┤
│  🤖 Receptionist (answer calls, book appointments)        │
│  🤖 SDR (qualify leads, schedule demos)                  │
│  🤖 Support Agent (handle complaints, refunds)            │
│  🤖 Booking Agent (tables, services, rides)              │
│  🤖 Collections Agent (payment follow-ups)               │
│  🤖 CFO Agent (financial queries)                       │
│  🤖 HR Agent (employee queries)                        │
└─────────────────────────────────────────────────────────────┘
```

### VoiceOS Services

| Port | Service | Purpose |
|------|---------|---------|
| 4850 | Unified Platform | WhatsApp + Support + Commerce |
| 4860 | Telecom Bridge | Twilio, Exotel, Knowlarity |
| 4870 | Multilingual | Hindi, Tamil, Telugu, 7 more |
| 4880 | Voice Commerce | Orders, Bookings, Payments |
| 4112 | rez-ai-voice | Voice agents (Sales, Support, Info) |

---

## RAZO (Voice Product)

**Razo** is a voice AI product built on HOJAI AI infrastructure.

---

## PRODUCT INTELLIGENCE ARCHITECTURE

Each product has its own intelligence layer that works independently but syncs with REZ Intelligence.

### Layers
```
HOJAI AI Core
       ↓
REZ Intelligence (Central - privileged tenant)
       ↓
Product Intelligence (Per Product)
       ↓
Product Services
```

### Product Intelligence Requirements

| Component | Purpose |
|-----------|---------|
| Intelligence Gateway | Entry point, routing, fallback |
| Local Memory | Short-term cache |
| Product Graph | Product-specific entities |
| Product Agents | Domain-specific AI |
| Sync Bridge | REZ Intelligence sync |

### Benefits
- **Resilient** - Works if REZ Intelligence is down
- **Fast** - Local decisions < 100ms
- **Product-specific** - Owns domain knowledge
- **Syncable** - Pulls from central REZ Intelligence

### Products with Intelligence
| Product | Gateway | Owns |
|---------|---------|------|
| BuzzLocal | buzzlocal-intelligence-gateway | Local context |
| Airzy | airzy-intelligence-gateway | Travel patterns |
| REZ Merchant | merchant-intelligence-gateway | Commerce |
| REZ Ride | rider-intelligence-gateway | Mobility |
| RisaCare | risacare-intelligence-gateway | Healthcare |
| RisnaEstate | risnaestate-intelligence-gateway | Real estate |

---

## AI EMPLOYEES (174 Total)

| Category | Count | Examples |
|----------|-------|----------|
| L1 Assistants | 8 | executive-assistant, research-assistant |
| L2 Specialists | 25 | sdr-agent, ai-support-agent, marketing-agent |
| L3 Autonomous | 15 | accountant-ai, receptionist-ai |
| L4 Managers | 3 | ops-manager |
| Industry Experts | 35 | hotel-revenue-manager, restaurant-growth-consultant |
| Hospitality | 32 | concierge-ai, host-ai, kitchen-manager |
| Healthcare | 12 | care-manager, pharmacist-ai |
| REZ Ecosystem | 18 | merchant-cfo, community-manager |
| Generic AI | 46 | accounting-ai, developer-ai |

---

## INTEGRATION

### India Telecom

| Provider | Status | Features |
|----------|--------|----------|
| Twilio | ✅ | International |
| Exotel | ✅ | India, IVR |
| Knowlarity | ✅ | Bulk calling |
| Ozonetel | 🔜 | Coming |

### Languages

| Language | Status |
|----------|--------|
| English | ✅ |
| Hindi | ✅ |
| Tamil | ✅ |
| Telugu | ✅ |
| Bengali | ✅ |
| Kannada | ✅ |
| Malayalam | 🔜 |
| Marathi | 🔜 |
| Gujarati | 🔜 |
| Punjabi | 🔜 |

---

## QUICK START

```bash
# Health check
curl http://localhost:4850/health

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

---

**License:** Proprietary - HOJAI AI
