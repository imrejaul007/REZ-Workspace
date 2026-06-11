# RTNM ECOSYSTEM - COMPREHENSIVE SERVICE REGISTRY

**Version:** 1.0 | **Date:** June 11, 2026
**Total Services:** 500+ | **Companies:** 22 | **Port Range:** 3000-6099

---

## TABLE OF CONTENTS

1. [Overview Table](#1-overview-table)
2. [HOJAI Core (4500-4610)](#2-hojai-core-4500-4610)
3. [REZ Intelligence (4018-4212)](#3-rez-intelligence-4018-4212)
4. [VoiceOS (4850-4899)](#4-voiceos-4850-4899)
5. [GENIE (4700-4790)](#5-genie-4700-4790)
6. [SUTAR OS (4150-4300)](#6-sutar-os-4150-4300)
7. [SUTAR Integration (4154-4260)](#7-sutar-integration-4154-4260)
8. [RABTUL Technologies (4001-4020)](#8-rabtul-technologies-4001-4020)
9. [CorpPerks (4240-4254, 4710-4720)](#9-corpperks-4240-4254-4710-4720)
10. [Products (4800-5600)](#10-products-4800-5600)
11. [Airzy (4500-4515)](#11-airzy-4500-4515)
12. [REZ Merchant (4005-4081)](#12-rez-merchant-4005-4081)
13. [Network Map](#13-network-map)
14. [Service Dependencies](#14-service-dependencies)
15. [Port Registry](#15-port-registry)

---

## 1. OVERVIEW TABLE

| Port | Service | Category | Docker | Status |
|------|---------|----------|--------|--------|
| **3000** | unified-api-gateway | Platform | ❌ | Planned |
| **3001** | help-center | Platform | ❌ | Planned |
| **3002** | go4food-api | Consumer | ❌ | Planned |
| **3003** | rez-inbox | Consumer | ❌ | Planned |
| **3004** | rez-scan | Consumer | ❌ | Planned |
| **4000** | api-gateway | RABTUL | ✅ | Built |
| **4001** | rez-payment-service | RABTUL | ✅ | Built |
| **4002** | rez-auth-service | RABTUL | ✅ | Built |
| **4004** | rez-wallet-service | RABTUL | ✅ | Built |
| **4005** | rez-merchant-service | REZ-Merchant | ✅ | Built |
| **4006** | rez-order-service | RABTUL | ✅ | Built |
| **4007** | rez-catalog-service | RABTUL | ✅ | Built |
| **4008** | rez-search-service | RABTUL | ✅ | Built |
| **4009** | rez-delivery-service | RABTUL | ✅ | Built |
| **4011** | rez-notifications-service | RABTUL | ✅ | Built |
| **4013** | rez-profile-service | RABTUL | ✅ | Built |
| **4016** | rez-analytics-service | RABTUL | ✅ | Built |
| **4018** | rez-intent-predictor | REZ-Intelligence | ✅ | Built |
| **4020** | rez-booking-service | RABTUL | ✅ | Built |
| **4022** | rez-pricing-service | REZ-Merchant | ❌ | Planned |
| **4025** | rez-observability-platform | RABTUL | ✅ | Built |
| **4030** | rez-circuit-breaker | RABTUL | ✅ | Built |
| **4031** | rez-retry-service | RABTUL | ✅ | Built |
| **4032** | rez-dlq-service | RABTUL | ✅ | Built |
| **4033** | rez-idempotency-service | RABTUL | ✅ | Built |
| **4034** | rez-policy-engine | RABTUL | ✅ | Built |
| **4035** | rez-secrets-manager | RABTUL | ✅ | Built |
| **4037** | rez-loyalty-service | REZ-Merchant | ❌ | Planned |
| **4038** | rez-scheduler-service | RABTUL | ✅ | Built |
| **4058** | rez-data-aggregator | RABTUL | ✅ | Built |
| **4075** | rez-event-bus | RABTUL | ✅ | Built |
| **4080** | rez-kitchen-display | REZ-Merchant | ❌ | Planned |
| **4081** | rez-pos-service | REZ-Merchant | ❌ | Planned |
| **4100** | risnaestate-gateway | RisnaEstate | ❌ | Planned |
| **4101** | hotel-habixo-service | StayOwn | ❌ | Planned |
| **4102** | carecode | HOJAI | ❌ | Planned |
| **4112** | rez-ai-voice | VoiceOS | ✅ | Built |
| **4123** | rez-predictive-engine | REZ-Intelligence | ✅ | Built |
| **4142** | rez-signal-aggregator | REZ-Intelligence | ✅ | Built |
| **4150** | sutar-gateway | SUTAR | ❌ | Planned |
| **4154** | sutar-intent-bus | SUTAR | ✅ | Built |
| **4155** | sutar-rez-bridge | SUTAR | ✅ | Built |
| **4156** | sutar-data-store | SUTAR | ❌ | Planned |
| **4180** | sutar-trust-engine | SUTAR | ❌ | Planned |
| **4181** | sutar-policy-os | SUTAR | ❌ | Planned |
| **4190** | sutar-contract-os | SUTAR | ❌ | Planned |
| **4191** | sutar-negotiation-engine | SUTAR | ✅ | Built |
| **4201** | rez-memory-layer | REZ-Intelligence | ✅ | Built |
| **4201** | buzzlocal-feed-service | BuzzLocal | ✅ | Built |
| **4202** | buzzlocal-community-service | BuzzLocal | ✅ | Built |
| **4203** | buzzlocal-intelligence-service | BuzzLocal | ✅ | Built |
| **4204** | buzzlocal-notification-service | BuzzLocal | ✅ | Built |
| **4205** | buzzlocal-payment-service | BuzzLocal | ✅ | Built |
| **4206** | buzzlocal-realtime-service | BuzzLocal | ✅ | Built |
| **4207** | buzzlocal-vibe-service | BuzzLocal | ✅ | Built |
| **4208** | buzzlocal-weather-service | BuzzLocal | ✅ | Built |
| **4210** | rez-demand-sensing | REZ-Intelligence | ❌ | Planned |
| **4211** | rez-supply-intelligence | REZ-Intelligence | ❌ | Planned |
| **4212** | rez-market-opportunities | REZ-Intelligence | ❌ | Planned |
| **4240** | sutar-decision-engine | SUTAR | ✅ | Built |
| **4241** | sutar-simulation-os | SUTAR | ❌ | Planned |
| **4242** | sutar-goal-os | SUTAR | ❌ | Planned |
| **4243** | sutar-network-learning | SUTAR | ❌ | Planned |
| **4260** | order-flow-orchestrator | SUTAR | ✅ | Built |
| **4300** | nexha-distribution-os | Nexha | ❌ | Planned |
| **4300** | rez-bnpl-service | RABTUL | ❌ | Planned |
| **4500** | hojai-api-gateway | HOJAI | ✅ | Built |
| **4501** | hojai-governance | HOJAI | ✅ | Built |
| **4510** | hojai-event-bus | HOJAI | ✅ | Built |
| **4520** | hojai-memory | HOJAI | ✅ | Built |
| **4530** | hojai-intelligence | HOJAI | ✅ | Built |
| **4550** | hojai-agents | HOJAI | ✅ | Built |
| **4560** | hojai-workflows | HOJAI | ✅ | Built |
| **4570** | hojai-communications | HOJAI | ✅ | Built |
| **4580** | hojai-hyperlocal | HOJAI | ✅ | Built |
| **4590** | hojai-data | HOJAI | ✅ | Built |
| **4620** | voice-memory-bridge | VoiceOS | ✅ | Built |
| **4621** | communication-style-analyzer | VoiceOS | ✅ | Built |
| **4622** | voice-twin-service | VoiceOS | ✅ | Built |
| **4623** | code-switching-detector | VoiceOS | ✅ | Built |
| **4624** | voice-learning-orchestrator | VoiceOS | ✅ | Built |
| **4625** | voice-cloning-service | VoiceOS | ✅ | Built |
| **4626** | ml-training-service | VoiceOS | ✅ | Built |
| **4627** | network-learning-service | VoiceOS | ✅ | Built |
| **4628** | cross-channel-memory | VoiceOS | ✅ | Built |
| **4629** | emotional-voice-service | VoiceOS | ✅ | Built |
| **4630** | negotiation-ai | VoiceOS | ✅ | Built |
| **4631** | voice-translation | VoiceOS | ✅ | Built |
| **4700** | risa-care-api-gateway | RisaCare | ✅ | Built |
| **4701** | risa-care-profile-service | RisaCare | ❌ | Planned |
| **4702** | risa-care-records-service | RisaCare | ✅ | Built |
| **4703** | genie-memory | GENIE | ✅ | Built |
| **4704** | genie-relationship | GENIE | ✅ | Built |
| **4705** | risa-care-booking-service | RisaCare | ✅ | Built |
| **4706** | genie-briefing | GENIE | ✅ | Built |
| **4707** | risa-care-wellness-service | RisaCare | ✅ | Built |
| **4708** | risa-care-corporate-service | RisaCare | ✅ | Built |
| **4707** | genie-sync-service | GENIE | ✅ | Built |
| **4708** | obsidian-service | GENIE | ✅ | Built |
| **4709** | notion-service | GENIE | ✅ | Built |
| **4710** | slack-service | GENIE | ✅ | Built |
| **4711** | telegram-service | GENIE | ✅ | Built |
| **4710** | salar-os | CorpPerks | ✅ | Built |
| **4711** | people-os | CorpPerks | ✅ | Built |
| **4712** | talent-ai | CorpPerks | ✅ | Built |
| **4713** | corp-id | CorpPerks | ✅ | Built |
| **4750** | hojai-commerce-intelligence | HOJAI | ✅ | Built |
| **4751** | hojai-merchant-intelligence | HOJAI | ✅ | Built |
| **4752** | hojai-customer-intelligence | HOJAI | ✅ | Built |
| **4753** | hojai-marketing-intelligence | HOJAI | ✅ | Built |
| **4754** | hojai-financial-intelligence | HOJAI | ✅ | Built |
| **4800** | intent-signal-aggregator | AdBazaar | ✅ | Built |
| **4801** | intent-prediction-engine | AdBazaar | ✅ | Built |
| **4850** | voiceos-unified | VoiceOS | ✅ | Built |
| **4859** | analyst-ai-voice | HOJAI | ❌ | Planned |
| **4860** | glamai | HOJAI | ❌ | Planned |
| **4870** | hojai-gateway | AdBazaar | ✅ | Built |
| **4900** | risnaestate | Products | ✅ | Built |
| **4960** | marketing-os | AdBazaar | ✅ | Built |
| **4961** | cdp | AdBazaar | ✅ | Built |
| **4962** | pixel | AdBazaar | ✅ | Built |
| **4963** | verification | AdBazaar | ✅ | Built |
| **4964** | clean-room | AdBazaar | ✅ | Built |
| **4965** | marketing-agent | AdBazaar | ✅ | Built |
| **4966** | event-stream | AdBazaar | ✅ | Built |
| **4967** | intelligence-graph | AdBazaar | ✅ | Built |
| **4968** | data-marketplace | AdBazaar | ✅ | Built |
| **4969** | revenue-intelligence | AdBazaar | ✅ | Built |
| **4970** | creator-wallet | AdBazaar | ✅ | Built |
| **4971** | personalization | AdBazaar | ✅ | Built |
| **4972** | agency-os | AdBazaar | ✅ | Built |
| **4973** | competitive-intel | AdBazaar | ✅ | Built |
| **4974** | community-media | AdBazaar | ✅ | Built |
| **5000** | ridza | Products | ✅ | Built |
| **5100** | stayown | Products | ✅ | Built |
| **5300** | nexha | Products | ✅ | Built |
| **5400** | adbazaar | Products | ✅ | Built |

---

## 2. HOJAI CORE (4500-4610)

**Purpose:** AI Infrastructure - The "AWS of AI" for the RTNM ecosystem

### Services

| Port | Service | Docker | Dockerfile Location | Purpose |
|------|---------|--------|-------------------|---------|
| 4500 | hojai-api-gateway | ✅ | hojai-ai/api-gateway/Dockerfile | Central routing, auth, rate limiting |
| 4501 | hojai-governance | ✅ | hojai-ai/governance/Dockerfile | RBAC, audit logs, compliance |
| 4510 | hojai-event-bus | ✅ | hojai-ai/event-bus/Dockerfile | Pub/sub event streaming |
| 4520 | hojai-memory | ✅ | hojai-ai/memory/Dockerfile | Vector store, RAG, multi-tier memory |
| 4530 | hojai-intelligence | ✅ | hojai-ai/intelligence/Dockerfile | ML pipeline, model training |
| 4550 | hojai-agents | ✅ | hojai-ai/agents/Dockerfile | AI agent orchestration |
| 4560 | hojai-workflows | ✅ | hojai-ai/workflows/Dockerfile | Workflow automation |
| 4570 | hojai-communications | ✅ | hojai-ai/communications/Dockerfile | WhatsApp, SMS, RCS |
| 4580 | hojai-hyperlocal | ✅ | hojai-ai/hyperlocal/Dockerfile | Geo-intelligence, location services |
| 4590 | hojai-data | ✅ | hojai-ai/data/Dockerfile | Feature store, data processing |

### Docker Compose

```yaml
# From docker-compose.hojai.yml
hojai-api-gateway:
  build: ./hojai-api-gateway
  ports: ["4500:4500"]

hojai-governance:
  build: ./hojai-governance
  ports: ["4501:4501"]

hojai-event-bus:
  build: ./hojai-event-bus
  ports: ["4510:4510"]

hojai-memory:
  build: ./hojai-memory
  ports: ["4520:4520"]

hojai-intelligence:
  build: ./hojai-intelligence
  ports: ["4530:4530"]

hojai-agents:
  build: ./hojai-agents
  ports: ["4550:4550"]

hojai-workflows:
  build: ./hojai-workflows
  ports: ["4560:4560"]

hojai-communications:
  build: ./hojai-communications
  ports: ["4570:4570"]

hojai-hyperlocal:
  build: ./hojai-hyperlocal
  ports: ["4580:4580"]

hojai-data:
  build: ./hojai-data
  ports: ["4590:4590"]
```

### GitHub Location

- Repository: `github.com/imrejaul007/hojai-ai`
- Path: `/hojai-ai/services/`

### Dependencies

**Incoming Events:**
- `user.query` - User questions
- `agent.task` - Task assignments
- `workflow.trigger` - Workflow triggers

**Outgoing Events:**
- `ai.response` - AI responses
- `memory.stored` - Memory storage confirmations
- `workflow.completed` - Workflow completion

**External Dependencies:**
- Redis (6379) - Event caching
- MongoDB (27017) - Data persistence

---

## 3. REZ INTELLIGENCE (4018-4212)

**Purpose:** ML Pipeline - Predictions, signals, intent attribution

### Services

| Port | Service | Docker | Dockerfile Location | Purpose |
|------|---------|--------|-------------------|---------|
| 4018 | rez-intent-predictor | ✅ | REZ-Intelligence/rez-intent-predictor | Product propensity scoring |
| 4123 | rez-predictive-engine | ✅ | REZ-Intelligence/rez-predictive-engine | Forecasting engine |
| 4142 | rez-signal-aggregator | ✅ | REZ-Intelligence/rez-signal-aggregator | Behavioral signal collection |
| 4201 | rez-memory-layer | ✅ | REZ-Intelligence/rez-memory-layer | Intent memory storage |
| 4210 | rez-demand-sensing | ❌ | - | Demand forecasting |
| 4211 | rez-supply-intelligence | ❌ | - | Supply prediction |
| 4212 | rez-market-opportunities | ❌ | - | Opportunity detection |

### Docker Compose

```yaml
# From docker-compose.rez.yml
rez-intent-predictor:
  build: ./rez-intent-predictor
  ports: ["4018:4018"]

rez-predictive-engine:
  build: ./rez-predictive-engine
  ports: ["4123:4123"]

rez-memory-layer:
  build: ./rez-memory-layer
  ports: ["4201:4201"]

rez-signal-aggregator:
  build: ./rez-signal-aggregator
  ports: ["4142:4142"]

voiceos-unified:
  build: ./voice-service
  ports: ["4850:4850"]

rez-ai-voice:
  build: ./voice-service/voice-agents
  ports: ["4112:4112"]
```

### GitHub Location

- Repository: `github.com/imrejaul007/REZ-Intelligence`

### Dependencies

**Incoming Events:**
- `user.behavior` - User behavior data
- `transaction.complete` - Transaction completion
- `intent.expressed` - Intent expressions

**Outgoing Events:**
- `prediction.ready` - Predictions available
- `signal.processed` - Signals processed
- `attribution.complete` - Attribution complete

**External Dependencies:**
- HOJAI Memory (4520) - Model storage
- HOJAI Intelligence (4530) - ML training

---

## 4. VOICEOS (4850-4899)

**Purpose:** Voice AI - Speech recognition, synthesis, voice twins

### Services

| Port | Service | Docker | Dockerfile Location | Purpose |
|------|---------|--------|-------------------|---------|
| 4850 | voiceos-unified | ✅ | voice-service/Dockerfile | Unified voice platform |
| 4112 | rez-ai-voice | ✅ | voice-service/voice-agents/Dockerfile | AI voice agents |
| 4620 | voice-memory-bridge | ✅ | voice-ecosystem/services/voice-memory-bridge | Voice-memory integration |
| 4621 | communication-style-analyzer | ✅ | voice-ecosystem/services/communication-style-analyzer | Communication patterns |
| 4622 | voice-twin-service | ✅ | voice-ecosystem/services/voice-twin-service | Digital voice twins |
| 4623 | code-switching-detector | ✅ | voice-ecosystem/services/code-switching-detector | Language detection |
| 4624 | voice-learning-orchestrator | ✅ | voice-ecosystem/services/voice-learning-orchestrator | Learning orchestration |
| 4625 | voice-cloning-service | ✅ | voice-ecosystem/services/voice-cloning-service | Voice cloning |
| 4626 | ml-training-service | ✅ | voice-ecosystem/services/ml-training-service | Model training |
| 4627 | network-learning-service | ✅ | voice-ecosystem/services/network-learning-service | Network learning |
| 4628 | cross-channel-memory | ✅ | voice-ecosystem/services/cross-channel-memory | Cross-channel memory |
| 4629 | emotional-voice-service | ✅ | voice-ecosystem/services/emotional-voice-service | Emotional voice |
| 4630 | negotiation-ai | ✅ | voice-ecosystem/services/negotiation-ai | Voice negotiation |
| 4631 | voice-translation | ✅ | voice-ecosystem/services/voice-translation | Real-time translation |

### Docker Compose

```yaml
# From docker-compose.voice-ecosystem.yml
voice-memory-bridge:
  build: ./services/voice-memory-bridge
  ports: ["4620:4620"]

communication-style-analyzer:
  build: ./services/communication-style-analyzer
  ports: ["4621:4621"]

voice-twin-service:
  build: ./services/voice-twin-service
  ports: ["4622:4622"]

code-switching-detector:
  build: ./services/code-switching-detector
  ports: ["4623:4623"]

voice-learning-orchestrator:
  build: ./services/voice-learning-orchestrator
  ports: ["4624:4624"]

voice-cloning-service:
  build: ./services/voice-cloning-service
  ports: ["4625:4625"]
```

### GitHub Location

- Repository: `github.com/imrejaul007/hojai-ai`
- Path: `/HOJAI-VOICE-PLATFORM/`

### Dependencies

**Incoming Events:**
- `voice.input` - Voice input streams
- `transcript.ready` - Transcription complete
- `language.detected` - Language detection

**Outgoing Events:**
- `voice.output` - Voice synthesis
- `twin.updated` - Voice twin updates
- `emotion.detected` - Emotion detection

**External Dependencies:**
- HOJAI Memory (4520) - Memory storage
- GENIE Memory (4703) - Personal memory
- ElevenLabs API - Voice synthesis
- Whisper API - Speech recognition

---

## 5. GENIE (4700-4790)

**Purpose:** Personal AI - Memory, relationships, briefings for individuals

### Services

| Port | Service | Docker | Dockerfile Location | Purpose |
|------|---------|--------|-------------------|---------|
| 4703 | genie-memory | ✅ | genie-memory-service/Dockerfile | Personal memory storage |
| 4704 | genie-relationship | ✅ | genie-relationship-service/Dockerfile | Relationship tracking |
| 4706 | genie-briefing | ✅ | genie-briefing-service/Dockerfile | Daily briefings |
| 4707 | genie-sync-service | ✅ | genie-sync-service/Dockerfile | Data synchronization |
| 4708 | genie-obsidian-service | ✅ | genie-obsidian-service/Dockerfile | Obsidian integration |
| 4709 | genie-notion-service | ✅ | genie-notion-service/Dockerfile | Notion integration |
| 4710 | genie-slack-service | ✅ | genie-slack-service/Dockerfile | Slack integration |
| 4711 | genie-telegram-service | ✅ | genie-telegram-service/Dockerfile | Telegram integration |

### Docker Compose

```yaml
# From docker-compose.genie.yml
genie-memory:
  build: ./genie-memory
  ports: ["4703:4703"]

genie-relationship:
  build: ./genie-relationship
  ports: ["4704:4704"]

genie-briefing:
  build: ./genie-briefing
  ports: ["4706:4706"]

genie-sync-service:
  build: ./genie-sync-service
  ports: ["4707:4707"]

obsidian-service:
  build: ./obsidian-service
  ports: ["4708:4708"]

notion-service:
  build: ./notion-service
  ports: ["4709:4709"]

slack-service:
  build: ./slack-service
  ports: ["4710:4710"]

telegram-service:
  build: ./telegram-service
  ports: ["4711:4711"]
```

### GitHub Location

- Repository: `github.com/imrejaul007/hojai-ai`
- Path: `/genie-*/`

### Dependencies

**Incoming Events:**
- `user.interaction` - User interactions
- `calendar.event` - Calendar events
- `relationship.updated` - Relationship changes

**Outgoing Events:**
- `briefing.generated` - Briefing generated
- `memory.recalled` - Memory recalled
- `sync.completed` - Sync completed

**External Dependencies:**
- HOJAI Memory (4520) - Vector storage
- RABTUL Auth (4002) - User authentication

---

## 6. SUTAR OS (4150-4300)

**Purpose:** Autonomous Business OS - Decision making, negotiation, simulation

### Services

| Port | Service | Docker | Dockerfile Location | Purpose |
|------|---------|--------|-------------------|---------|
| 4150 | sutar-gateway | ❌ | - | SUTAR main gateway |
| 4154 | sutar-intent-bus | ✅ | hojai-ai/sutar-intent-bus/Dockerfile | Intent propagation |
| 4155 | sutar-rez-bridge | ✅ | hojai-ai/sutar-rez-bridge/Dockerfile | REZ integration bridge |
| 4156 | sutar-data-store | ❌ | - | SUTAR persistence |
| 4180 | sutar-trust-engine | ❌ | - | Trust scoring |
| 4181 | sutar-policy-os | ❌ | - | Rules engine |
| 4190 | sutar-contract-os | ❌ | - | Smart contracts |
| 4191 | sutar-negotiation-engine | ✅ | hojai-ai/hojai-sutar-os/services/sutar-negotiation-engine | Agent bargaining |
| 4240 | sutar-decision-engine | ✅ | hojai-ai/hojai-sutar-os/services/sutar-decision-engine | Autonomous decisions |
| 4241 | sutar-simulation-os | ❌ | - | Monte Carlo simulation |
| 4242 | sutar-goal-os | ❌ | - | Objective decomposition |
| 4243 | sutar-network-learning | ❌ | - | Collective intelligence |

### GitHub Location

- Repository: `github.com/imrejaul007/hojai-ai`
- Path: `/hojai-ai/hojai-sutar-os/`

### Dependencies

**Incoming Events:**
- `business.intent` - Business intents
- `negotiation.start` - Negotiation starts
- `decision.required` - Decision needed

**Outgoing Events:**
- `decision.made` - Decisions made
- `contract.signed` - Contracts signed
- `simulation.complete` - Simulations complete

**External Dependencies:**
- RABTUL Payment (4001) - Payment processing
- HOJAI Memory (4520) - Decision memory

---

## 7. SUTAR INTEGRATION (4154-4260)

**Purpose:** Bridge between SUTAR OS and REZ services for order flow

### Services

| Port | Service | Docker | Dockerfile Location | Purpose |
|------|---------|--------|-------------------|---------|
| 4154 | sutar-intent-bus | ✅ | hojai-ai/sutar-intent-bus/Dockerfile | Intent bus |
| 4155 | sutar-rez-bridge | ✅ | hojai-ai/sutar-rez-bridge/Dockerfile | SUTAR-REZ bridge |
| 4191 | sutar-negotiation-engine | ✅ | hojai-ai/hojai-sutar-os/services/sutar-negotiation-engine | Negotiation |
| 4240 | sutar-decision-engine | ✅ | hojai-ai/hojai-sutar-os/services/sutar-decision-engine | Decisions |
| 4260 | order-flow-orchestrator | ✅ | hojai-ai/order-flow-orchestrator/Dockerfile | Order coordination |

### Docker Compose

```yaml
# From docker-compose.sutar-integration.yml
services:
  sutar-intent-bus:
    build: ./hojai-ai/sutar-intent-bus
    ports: ["4154:4154"]
    depends_on: [redis]
    environment:
      - PORT=4154
      - REDIS_URL=redis://redis:6379

  sutar-rez-bridge:
    build: ./hojai-ai/sutar-rez-bridge
    ports: ["4155:4155"]
    depends_on: [redis, sutar-negotiation-engine]
    environment:
      - PORT=4155
      - SUTAR_NEGOTIATION_URL=http://sutar-negotiation-engine:4191
      - SUTAR_DECISION_URL=http://sutar-decision-engine:4240
      - REZ_ORDER_URL=http://rez-order-service:4006

  sutar-negotiation-engine:
    build: ./hojai-ai/hojai-sutar-os/services/sutar-negotiation-engine
    ports: ["4191:4191"]

  sutar-decision-engine:
    build: ./hojai-ai/hojai-sutar-os/services/sutar-decision-engine
    ports: ["4240:4240"]

  order-flow-orchestrator:
    build: ./hojai-ai/order-flow-orchestrator
    ports: ["4260:4260"]
    depends_on:
      - sutar-intent-bus
      - sutar-rez-bridge

  rez-event-bus:
    build: ./RTNM-Digital/shared/rez-event-bus
    ports: ["4075:4075"]
```

### Order Flow Architecture

```
User Intent → SUTAR Intent Bus (4154)
                ↓
         SUTAR Negotiation Engine (4191)
                ↓
         SUTAR Decision Engine (4240)
                ↓
         SUTAR-REZ Bridge (4155)
                ↓
         Order Flow Orchestrator (4260)
                ↓
         ┌──────┴──────┐
         ↓             ↓
    REZ Order     REZ Merchant
    (4006)        (4005)
```

---

## 8. RABTUL TECHNOLOGIES (4001-4020)

**Purpose:** Financial Infrastructure - Payments, auth, wallet, BNPL

### Services

| Port | Service | Docker | Dockerfile Location | Purpose |
|------|---------|--------|-------------------|---------|
| 4000 | api-gateway | ✅ | RABTUL-Technologies/api-gateway/Dockerfile | Central routing |
| 4001 | rez-payment-service | ✅ | RABTUL-Technologies/rez-payment-service/Dockerfile | UPI, Razorpay, refunds |
| 4002 | rez-auth-service | ✅ | RABTUL-Technologies/rez-auth-service/Dockerfile | JWT, OTP, OAuth |
| 4004 | rez-wallet-service | ✅ | RABTUL-Technologies/rez-wallet-service/Dockerfile | Coins, balance |
| 4006 | rez-order-service | ✅ | RABTUL-Technologies/rez-order-service/Dockerfile | Order lifecycle |
| 4007 | rez-catalog-service | ✅ | RABTUL-Technologies/rez-catalog-service/Dockerfile | Products, inventory |
| 4008 | rez-search-service | ✅ | RABTUL-Technologies/rez-search-service/Dockerfile | Full-text search |
| 4009 | rez-delivery-service | ✅ | RABTUL-Technologies/rez-delivery-service/Dockerfile | Driver tracking |
| 4011 | rez-notifications-service | ✅ | RABTUL-Technologies/rez-notifications-service/Dockerfile | Push, SMS, WhatsApp |
| 4013 | rez-profile-service | ✅ | RABTUL-Technologies/rez-profile-service/Dockerfile | Profiles, addresses |
| 4016 | rez-analytics-service | ✅ | RABTUL-Technologies/rez-analytics-service/Dockerfile | Dashboards |
| 4020 | rez-booking-service | ✅ | RABTUL-Technologies/rez-booking-service/Dockerfile | Bookings |
| 4025 | rez-observability-platform | ✅ | RABTUL-Technologies/REZ-observability-platform/Dockerfile | Logs, metrics |
| 4030 | rez-circuit-breaker | ✅ | RABTUL-Technologies/REZ-circuit-breaker/Dockerfile | Fault tolerance |
| 4031 | rez-retry-service | ✅ | RABTUL-Technologies/REZ-retry-service/Dockerfile | Retry logic |
| 4032 | rez-dlq-service | ✅ | RABTUL-Technologies/REZ-dlq-service/Dockerfile | Dead letter queue |
| 4033 | rez-idempotency-service | ✅ | RABTUL-Technologies/REZ-idempotency-service/Dockerfile | Deduplication |
| 4034 | rez-policy-engine | ✅ | RABTUL-Technologies/REZ-policy-engine/Dockerfile | Access control |
| 4035 | rez-secrets-manager | ✅ | RABTUL-Technologies/REZ-secrets-manager/Dockerfile | AES-256, rotation |
| 4038 | rez-scheduler-service | ✅ | RABTUL-Technologies/REZ-scheduler-service/Dockerfile | Cron jobs |
| 4058 | rez-data-aggregator | ✅ | RABTUL-Technologies/REZ-data-aggregator/Dockerfile | Data aggregation |

### Docker Compose

```yaml
# From RABTUL-Technologies/docker-compose.yml
services:
  api-gateway:
    build: ./api-gateway
    ports: ["4000:4000"]

  rez-auth-service:
    build: ./rez-auth-service
    ports: ["4002:4002"]

  rez-payment-service:
    build: ./rez-payment-service
    ports: ["4001:4001"]

  rez-wallet-service:
    build: ./rez-wallet-service
    ports: ["4004:4004"]

  rez-order-service:
    build: ./rez-order-service
    ports: ["4006:4006"]

  rez-catalog-service:
    build: ./rez-catalog-service
    ports: ["4007:4007"]

  rez-search-service:
    build: ./rez-search-service
    ports: ["4008:4008"]

  rez-delivery-service:
    build: ./rez-delivery-service
    ports: ["4009:4009"]

  rez-notifications-service:
    build: ./rez-notifications-service
    ports: ["4011:4011"]

  rez-profile-service:
    build: ./rez-profile-service
    ports: ["4013:4013"]

  rez-analytics-service:
    build: ./rez-analytics-service
    ports: ["4016:4016"]

  rez-booking-service:
    build: ./rez-booking-service
    ports: ["4020:4020"]

  mongodb:
    image: mongo:7
    ports: ["27017:27017"]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
```

### GitHub Location

- Repository: `github.com/imrejaul007/RABTUL-Technologies`

### Dependencies

**Consumed By:**
- ALL 22 companies use RABTUL services

**Provides:**
- Auth (4002) - All companies
- Payment (4001) - All companies
- Wallet (4004) - All companies
- Notify (4011) - All companies
- Event Bus (4075) - All companies

---

## 9. CORPPERKS (4240-4254, 4710-4720)

**Purpose:** Workforce OS - HR, payroll, talent, OKRs

### Services

| Port | Service | Docker | Dockerfile Location | Purpose |
|------|---------|--------|-------------------|---------|
| 4240 | salar-os | ✅ | CorpPerks/salar-os/Dockerfile | Workforce OS main |
| 4710 | salar-os | ✅ | CorpPerks/salar-os/Dockerfile | Workforce OS (alt) |
| 4711 | people-os | ✅ | CorpPerks/people-os/Dockerfile | People management |
| 4712 | talent-ai | ✅ | CorpPerks/talent-ai/Dockerfile | AI talent matching |
| 4713 | corp-id | ✅ | CorpPerks/corp-id/Dockerfile | Corporate identity |
| 4720 | corpperks-intelligence | ❌ | - | AI decisions |
| 4725 | corpperks-corp-crm | ❌ | - | CRM |
| 4730 | corpperks-okr-service | ❌ | - | OKRs |
| 4738 | corpperks-payroll-service | ❌ | - | Payroll |

### Docker Compose

```yaml
# From docker-compose.corpperks.yml
services:
  salar-os:
    build: ./salar-os
    ports: ["4240:4240", "4710:4710"]

  people-os:
    build: ./people-os
    ports: ["4711:4711"]

  talent-ai:
    build: ./talent-ai
    ports: ["4712:4712"]

  corp-id:
    build: ./corp-id
    ports: ["4713:4713"]

  corpperks-api:
    build: ../rez-corpperks-service
    ports: ["4013:4013"]
```

### GitHub Location

- Repository: `github.com/imrejaul007/CorpPerks`

### Dependencies

**Incoming Events:**
- `employee.hired` - New employee
- `payroll.process` - Payroll processing
- `okr.updated` - OKR updates

**Outgoing Events:**
- `wage.deposited` - Wage deposits
- `talent.matched` - Talent matches
- `compliance.checked` - Compliance checks

---

## 10. PRODUCTS (4800-5600)

**Purpose:** Vertical OS products - Finance, Healthcare, Commerce, etc.

### RisaCare (Healthcare)

| Port | Service | Docker | Purpose |
|------|---------|--------|---------|
| 4700 | risa-care-api-gateway | ✅ | Healthcare gateway |
| 4701 | risa-care-profile-service | ❌ | Health profiles |
| 4702 | risa-care-records-service | ✅ | Health records |
| 4703 | risa-care-ai-service | ✅ | Healthcare AI |
| 4704 | risa-care-profile-service | ✅ | Profile service |
| 4705 | risa-care-booking-service | ✅ | Appointments |
| 4706 | risa-care-marketplace-service | ✅ | Healthcare marketplace |
| 4707 | risa-care-wellness-service | ✅ | Wellness tracking |
| 4708 | risa-care-corporate-service | ✅ | Corporate healthcare |
| 4800 | risacare | ✅ | Main healthcare OS |
| 4900 | risa-care-pharmacy-service | ❌ | Pharmacy |

### AdBazaar (Marketing)

| Port | Service | Docker | Purpose |
|------|---------|--------|---------|
| 4000 | marketing | ✅ | Core marketing |
| 4007 | ads-service | ✅ | Ad serving |
| 4018 | dooh-service | ✅ | Digital out-of-home |
| 4800 | intent-signal-aggregator | ✅ | Intent signals |
| 4801 | intent-prediction-engine | ✅ | ML scoring |
| 4802 | intent-marketplace | ❌ | Audience exchange |
| 4803 | intent-attribution | ❌ | Multi-touch attribution |
| 4960 | marketing-os | ✅ | Marketing OS |
| 4961 | cdp | ✅ | Customer Data Platform |
| 4962 | pixel | ✅ | Tracking pixel |
| 4963 | verification | ✅ | Ad verification |
| 4964 | clean-room | ✅ | Privacy-safe data |
| 4965 | marketing-agent | ✅ | AI marketing agent |
| 4966 | event-stream | ✅ | Kafka equivalent |
| 4967 | intelligence-graph | ✅ | Knowledge graph |
| 4968 | data-marketplace | ✅ | Audience exchange |
| 4969 | revenue-intelligence | ✅ | Profit tracking |
| 4970 | creator-wallet | ✅ | Creator banking |
| 4971 | personalization | ✅ | Dynamic content |
| 4972 | agency-os | ✅ | Agency management |
| 4973 | competitive-intel | ✅ | Competitor tracking |
| 4974 | community-media | ✅ | Hyperlocal media |
| 4980 | yield-platform-service | ❌ | Yield optimization |
| 4990 | retail-media-os | ❌ | Retail media |
| 5081 | instagram-publishing | ✅ | Social automation |
| 5091 | caption-generator | ✅ | AI captions |

### RIDZA (Finance)

| Port | Service | Docker | Purpose |
|------|---------|--------|---------|
| 5000 | ridza | ✅ | Finance OS |
| 4500 | ridza-core | ❌ | Core finance |
| 4501 | ridza-partner-api | ❌ | Partner API |
| 4502 | ridza-agent-portal | ❌ | Agent portal |
| 4503 | ridza-corpperks-hub | ❌ | CorpPerks integration |
| 4505 | ridza-ai-search | ❌ | AI search |
| 4506 | ridza-provider-api | ❌ | Provider API |
| 4507 | ridza-compliance | ❌ | Compliance |
| 4508 | ridza-events | ❌ | Event streaming |
| 4509 | ridza-workflow | ❌ | Workflow engine |
| 4510 | ridza-fraud | ❌ | Fraud detection |
| 4511 | ridza-merchant-finance | ❌ | Merchant finance |
| 4512 | ridza-finance-intelligence | ❌ | Finance AI |
| 4520 | ridza-insurance | ❌ | Insurance |
| 4530 | ridza-partner-onboarding | ❌ | Partner onboarding |
| 4926 | ridza-treasury-agent | ❌ | Treasury management |
| 4927 | ridza-fpa-agent | ❌ | FP&A agent |
| 4928 | ridza-risk-agent | ❌ | Risk management |
| 4929 | ridza-investment-agent | ❌ | Investment agent |
| 4930 | ridza-collection-agent | ❌ | Payment collection |
| 4940 | ridza-financial-twin | ❌ | Financial twin |
| 4950 | ridza-cfo-agent | ❌ | CFO AI |
| 4960 | ridza-crisis-agent | ❌ | Crisis monitoring |
| 4970 | ridza-problem-detector | ❌ | Issue detection |
| 4980 | ridza-accounting-ledger | ❌ | Accounting |
| 5090 | ridza-finance-copilot | ❌ | CFO dashboard |

### Other Products

| Port | Service | Company | Docker | Purpose |
|------|---------|---------|--------|---------|
| 4900 | risnaestate | RisnaEstate | ✅ | Real estate OS |
| 5100 | stayown | StayOwn | ✅ | Hospitality OS |
| 5300 | nexha | Nexha | ✅ | Commerce network |
| 5400 | adbazaar | AdBazaar | ✅ | Marketing OS |

---

## 11. AIRZY (4500-4515)

**Purpose:** Travel OS - Flights, hotels, visa, travel management

### Services

| Port | Service | Docker | Purpose |
|------|---------|--------|---------|
| 4500 | airzy-api | ✅ | Travel API gateway |
| 4501 | airzy-booking | ✅ | Booking service |
| 4502 | airzy-inventory | ✅ | Inventory management |
| 4503 | airzy-payment | ✅ | Travel payments |
| 4510 | airzy-navigation | ✅ | Navigation |
| 4511 | airzy-dining | ✅ | Restaurant discovery |
| 4512 | airzy-visa | ✅ | Visa services |
| 4513 | airzy-document | ✅ | Document management |
| 4514 | airzy-social | ✅ | Social features |
| 4515 | airzy-finance | ✅ | Travel finance |

### Docker Compose

```yaml
# From docker-compose.airzy.yml
airzy-api:
  build: ./airzy-api
  ports: ["4500:4500"]

airzy-booking:
  build: ./airzy-booking
  ports: ["4501:4501"]

airzy-inventory:
  build: ./airzy-inventory
  ports: ["4502:4502"]

airzy-payment:
  build: ./airzy-payment
  ports: ["4503:4503"]

airzy-navigation:
  build: ./airzy-navigation
  ports: ["4510:4510"]

airzy-dining:
  build: ./airzy-dining
  ports: ["4511:4511"]

airzy-visa:
  build: ./airzy-visa
  ports: ["4512:4512"]

airzy-document:
  build: ./airzy-document
  ports: ["4513:4513"]

airzy-social:
  build: ./airzy-social
  ports: ["4514:4514"]

airzy-finance:
  build: ./airzy-finance
  ports: ["4515:4515"]
```

---

## 12. REZ MERCHANT (4005-4081)

**Purpose:** Merchant Platform - POS, KDS, QR ordering, loyalty

### Services

| Port | Service | Docker | Purpose |
|------|---------|--------|---------|
| 4005 | rez-merchant-service | ✅ | Merchant API |
| 4022 | rez-pricing-service | ❌ | Dynamic pricing |
| 4037 | rez-loyalty-service | ❌ | Loyalty programs |
| 4060 | rez-dashboard | ❌ | Analytics dashboard |
| 4062 | rez-autonomous-agents | ❌ | 8 AI agents |
| 4068 | rez-graph-service | ❌ | Commerce graph |
| 4070 | rez-prive-service | ❌ | Prive coins |
| 4080 | rez-kitchen-display | ❌ | KDS |
| 4081 | rez-pos-service | ❌ | Universal POS |
| 4096 | merchant-ai-employee-ui | ❌ | AI employee UI |
| 4097 | cross-merchant-view | ❌ | Cross-merchant analytics |

### BuzzLocal Services

| Port | Service | Docker | Purpose |
|------|---------|--------|---------|
| 4201 | buzzlocal-feed-service | ✅ | Social feed |
| 4202 | buzzlocal-community-service | ✅ | Community features |
| 4203 | buzzlocal-intelligence-service | ✅ | Local intelligence |
| 4204 | buzzlocal-notification-service | ✅ | Notifications |
| 4205 | buzzlocal-payment-service | ✅ | Local payments |
| 4206 | buzzlocal-realtime-service | ✅ | Real-time features |
| 4207 | buzzlocal-vibe-service | ✅ | Vibe tracking |
| 4208 | buzzlocal-weather-service | ✅ | Weather data |

---

## 13. NETWORK MAP

### Layer Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         LAYER 1: SUTAR OS                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │ Intent Bus  │  │ Negotiation │  │  Decision   │  │    Simulation    │  │
│  │   (4154)    │→ │  Engine     │→ │   Engine    │→ │       OS         │  │
│  │             │  │   (4191)    │  │   (4240)    │  │     (4241)       │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────┘  │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
┌──────────────────────────────────▼──────────────────────────────────────────┐
│                         LAYER 2: BRIDGE                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐ │
│  │  SUTAR-REZ      │  │  Order Flow      │  │      REZ Event Bus          │ │
│  │   Bridge        │→ │  Orchestrator    │→ │        (4075)               │ │
│  │   (4155)        │  │   (4260)         │  │                             │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────────┘ │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
┌──────────────────────────────────▼──────────────────────────────────────────┐
│                         LAYER 3: REZ SERVICES                              │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────────┐   │
│  │  Auth   │  │ Payment │  │  Order  │  │ Catalog │  │    Delivery     │   │
│  │ (4002) │  │ (4001) │  │ (4006) │  │ (4007) │  │     (4009)       │   │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘  └─────────────────┘   │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────────┐   │
│  │  Wallet │  │  Search │  │ Profile │  │  Notify │  │    Analytics    │   │
│  │ (4004) │  │ (4008) │  │ (4013) │  │ (4011) │  │     (4016)       │   │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘  └─────────────────┘   │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
┌──────────────────────────────────▼──────────────────────────────────────────┐
│                         LAYER 4: MERCHANT                                   │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────────┐   │
│  │Merchant │  │   POS   │  │   KDS   │  │ Loyalty │  │     Pricing     │   │
│  │ (4005) │  │ (4081) │  │ (4080) │  │ (4037) │  │     (4022)       │   │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘  └─────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Service Communication Flow

```
User Request
     │
     ▼
┌─────────────┐
│   Gateway   │ (4000/4500)
└──────┬──────┘
       │
       ▼
┌─────────────────┐     ┌─────────────────┐
│   Auth Service   │────→│  SUTAR Intent    │
│     (4002)       │     │     Bus (4154)   │
└─────────────────┘     └────────┬──────────┘
                                │
                                ▼
                    ┌─────────────────────┐
                    │  SUTAR Negotiation   │
                    │      (4191)         │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   SUTAR Decision    │
                    │       (4240)        │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   SUTAR-REZ Bridge  │
                    │       (4155)        │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
     ┌────────────┐    ┌────────────┐    ┌────────────┐
     │   Order    │    │  Payment   │    │   Wallet   │
     │  (4006)    │    │  (4001)   │    │  (4004)    │
     └────────────┘    └────────────┘    └────────────┘
```

---

## 14. SERVICE DEPENDENCIES

### HOJAI Core Dependencies

| Service | Incoming Events | Outgoing Events | External Dependencies |
|---------|-----------------|-----------------|----------------------|
| hojai-api-gateway (4500) | `api.request` | `api.response` | Redis, Auth |
| hojai-governance (4501) | `access.request` | `access.granted` | Auth, Audit logs |
| hojai-event-bus (4510) | `event.publish` | `event.delivered` | Redis |
| hojai-memory (4520) | `memory.store` | `memory.recalled` | Vector DB |
| hojai-intelligence (4530) | `ml.request` | `ml.result` | GPU, Data |
| hojai-agents (4550) | `agent.task` | `agent.complete` | Memory, LLMs |
| hojai-workflows (4560) | `workflow.trigger` | `workflow.done` | Event bus |
| hojai-communications (4570) | `comms.send` | `comms.delivered` | SMS, WhatsApp APIs |
| hojai-hyperlocal (4580) | `location.update` | `geo.result` | Maps API |
| hojai-data (4590) | `data.ingest` | `data.processed` | Data lake |

### REZ Intelligence Dependencies

| Service | Incoming Events | Outgoing Events | External Dependencies |
|---------|-----------------|-----------------|----------------------|
| rez-intent-predictor (4018) | `user.behavior` | `intent.score` | HOJAI Memory |
| rez-predictive-engine (4123) | `forecast.request` | `forecast.ready` | HOJAI Intelligence |
| rez-signal-aggregator (4142) | `signal.raw` | `signal.processed` | Redis |
| rez-memory-layer (4201) | `intent.store` | `intent.recall` | HOJAI Memory |

### RABTUL Core Dependencies

| Service | Incoming Events | Outgoing Events | External Dependencies |
|---------|-----------------|-----------------|----------------------|
| rez-auth-service (4002) | `auth.request` | `auth.token` | MongoDB |
| rez-payment-service (4001) | `payment.request` | `payment.complete` | Razorpay, UPI |
| rez-wallet-service (4004) | `wallet.request` | `wallet.update` | Redis |
| rez-order-service (4006) | `order.create` | `order.confirmed` | MongoDB |
| rez-notifications-service (4011) | `notify.request` | `notify.sent` | FCM, SMS |

### SUTAR Integration Dependencies

| Service | Incoming Events | Outgoing Events | External Dependencies |
|---------|-----------------|-----------------|----------------------|
| sutar-intent-bus (4154) | `intent.receive` | `intent.propagate` | Redis |
| sutar-rez-bridge (4155) | `bridge.translate` | `bridge.forward` | SUTAR + REZ APIs |
| sutar-negotiation-engine (4191) | `negotiate.start` | `negotiate.complete` | Memory |
| sutar-decision-engine (4240) | `decision.required` | `decision.made` | Simulation |
| order-flow-orchestrator (4260) | `order.flow` | `order.executed` | All REZ services |

---

## 15. PORT REGISTRY

### Complete Port Allocation (3000-6099)

| Port Range | Category | Services | Status |
|------------|----------|----------|--------|
| **3000-3019** | RTNM Platform | 20 | Partial |
| **4000-4099** | RABTUL + Merchant | 40+ | Built |
| **4100-4149** | Industry + SUTAR | 15+ | Partial |
| **4150-4299** | SUTAR Core | 20+ | Partial |
| **4300-4499** | HOJAI + Nexha | 30+ | Built |
| **4500-4610** | HOJAI Core | 12 | Built |
| **4620-4649** | VoiceOS | 15+ | Built |
| **4700-4799** | RisaCare + CorpPerks + Genie | 50+ | Partial |
| **4800-4899** | AdBazaar + Intent | 30+ | Partial |
| **4900-4999** | AdBazaar Moats | 30+ | Partial |
| **5000-5099** | RIDZA + Atlas | 40+ | Partial |
| **5100-5399** | Products | 10+ | Built |
| **6000-6099** | RTNM Admin | 10+ | Planned |

### Port Conflicts (To Be Resolved)

| Port | Service A | Service B | Resolution |
|------|-----------|-----------|-------------|
| 4510 | hojai-event-bus | airzy-navigation | Use different ranges |
| 4700 | risa-care-api-gateway | (reserved) | OK |
| 4710 | salar-os | slack-service | Different services OK |
| 4900 | risnaestate | risa-care-pharmacy | Different companies OK |

### Reserved Ports

| Port Range | Purpose | Status |
|------------|---------|--------|
| 6379 | Redis | In use |
| 27017 | MongoDB | In use |
| 5432 | PostgreSQL | In use |
| 9090 | Prometheus | In use |
| 3000 | Grafana | In use |

---

## APPENDIX: DOCKER COMPOSE REFERENCE

### Quick Start Commands

```bash
# Start all HOJAI Core services
docker-compose -f docker-compose.hojai.yml up -d

# Start SUTAR Integration
docker-compose -f docker-compose.sutar-integration.yml up -d

# Start REZ Intelligence
docker-compose -f docker-compose.rez.yml up -d

# Start GENIE services
docker-compose -f docker-compose.genie.yml up -d

# Start CorpPerks
docker-compose -f docker-compose.corpperks.yml up -d

# Start full stack
docker-compose -f docker-compose.full.yml up -d

# Start Voice Ecosystem
docker-compose -f voice-ecosystem/docker-compose.yml up -d
```

### Health Check Endpoints

| Service | Health Endpoint |
|---------|-----------------|
| hojai-api-gateway | `http://localhost:4500/health` |
| hojai-event-bus | `http://localhost:4510/health` |
| hojai-memory | `http://localhost:4520/health` |
| hojai-intelligence | `http://localhost:4530/health` |
| hojai-agents | `http://localhost:4550/health` |
| sutar-intent-bus | `http://localhost:4154/health` |
| sutar-negotiation-engine | `http://localhost:4191/health` |
| sutar-decision-engine | `http://localhost:4240/health` |
| order-flow-orchestrator | `http://localhost:4260/health` |
| rez-intent-predictor | `http://localhost:4018/health` |
| rez-predictive-engine | `http://localhost:4123/health` |
| genie-memory | `http://localhost:4703/health` |
| genie-relationship | `http://localhost:4704/health` |
| genie-briefing | `http://localhost:4706/health` |
| voiceos-unified | `http://localhost:4850/health` |

---

**Document Version:** 1.0
**Last Updated:** June 11, 2026
**Maintained By:** RTNM Digital