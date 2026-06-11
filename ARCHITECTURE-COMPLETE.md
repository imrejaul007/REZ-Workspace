# RTNM ECOSYSTEM — COMPLETE ARCHITECTURE DOCUMENTATION

**Version:** 1.0 | **Date:** June 11, 2026 | **Status:** Production Ready

---

## TABLE OF CONTENTS

1. [System Overview](#1-system-overview)
2. [Layer Architecture](#2-layer-architecture)
3. [Data Flow](#3-data-flow)
4. [Communication Patterns](#4-communication-patterns)
5. [Service Contracts](#5-service-contracts)
6. [Deployment Architecture](#6-deployment-architecture)
7. [Security](#7-security)
8. [Monitoring](#8-monitoring)

---

# 1. SYSTEM OVERVIEW

## 1.1 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                        RTNM DIGITAL                                                │
│                              (Parent Company / Ecosystem)                                           │
└────────────────────────────────────────┬──────────────────────────────────────────────────────────┘
                                         │
         ┌────────────────────────────────┼────────────────────────────────┐
         │                                │                                │
         ▼                                ▼                                ▼
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────────────────────┐
│      HOJAI AI       │    │    RABTUL TECH      │    │         REZ INTELLIGENCE            │
│   "AWS of AI"       │    │   "Money Movement"  │    │        "ML Pipeline"                │
│                     │    │                     │    │                                     │
│  • MemoryOS         │    │  • Auth Service     │    │  • Intent Predictor (4018)         │
│  • TwinOS           │    │  • Payment Service  │    │  • Predictive Engine (4123)        │
│  • SUTAR OS         │    │  • Wallet Service    │    │  • Signal Aggregator (4142)        │
│  • VoiceOS          │    │  • Event Bus        │    │  • Memory Layer (4201)             │
│  • 12 Core Platforms│    │  • Circuit Breaker   │    │                                     │
└─────────┬───────────┘    └─────────┬───────────┘    └─────────────┬───────────────────────┘
          │                          │                          │
          └──────────────────────────┼──────────────────────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
                    ▼                ▼                ▼
         ┌──────────────────┐ ┌──────────────┐ ┌──────────────────────┐
         │     RIDZA        │ │   AdBazaar   │ │    REZ MERCHANT      │
         │   Finance OS    │ │  Marketing   │ │   Industry OS        │
         │  Port 4500-4530 │ │  Port 4800+  │ │   Port 4005, 4081    │
         └────────┬─────────┘ └──────┬───────┘ └──────────┬───────────┘
                  │                  │                    │
                  └──────────────────┼────────────────────┘
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         │                           │                           │
         ▼                           ▼                           ▼
┌─────────────────┐        ┌─────────────────┐        ┌─────────────────────────┐
│    CorpPerks    │        │    RisaCare     │        │      REZ CONSUMER       │
│   Workforce OS  │        │   Healthcare    │        │       B2C Apps         │
│   Port 4700+    │        │   Port 4700+    │        │       Port 3000+       │
└─────────────────┘        └─────────────────┘        └─────────────────────────┘
         │                           │                           │
         └───────────────────────────┼───────────────────────────┘
                                     │
                                     ▼
                         ┌─────────────────────┐
                         │       NEXHA         │
                         │  Commerce Network    │
                         │   Port 4300-4360    │
                         └─────────────────────┘
```

## 1.2 Technology Stack

### Core Technologies

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Runtime** | Node.js 20+ | Primary runtime for services |
| **Language** | TypeScript | Type-safe development |
| **Framework** | Express.js / Fastify | REST API servers |
| **Database** | PostgreSQL, MongoDB, Redis | Data persistence |
| **Cache** | Redis | Session, caching, pub/sub |
| **Queue** | RabbitMQ / Kafka | Event streaming |
| **Search** | Elasticsearch | Full-text search |
| **Vector DB** | Pinecone / Qdrant | AI embeddings |
| **Container** | Docker | Service packaging |
| **Orchestration** | Docker Compose / Kubernetes | Service management |

### AI/ML Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **LLM** | Claude API, GPT-4 | Natural language processing |
| **Embeddings** | OpenAI, Cohere | Vector generation |
| **Agent Framework** | Custom HOJAI Agents | Autonomous AI |
| **RAG** | LangChain, Vector DB | Knowledge retrieval |
| **Workflow** | Temporal | Long-running workflows |

## 1.3 Design Principles

### 1. Service Independence
- Each service owns its data and business logic
- Services communicate via well-defined APIs
- No direct database coupling between services

### 2. Event-Driven Architecture
- Services publish events to shared Event Bus
- Subscribers react to events asynchronously
- Guarantees eventual consistency

### 3. AI-First
- AI agents embedded in every layer
- Autonomous decision-making
- Continuous learning and improvement

### 4. Inter-Company Services
- Every company both provides and consumes services
- Clear provider/consumer relationships
- Cross-company transactions tracked in RTNM Ledger

### 5. Scalability
- Horizontal scaling via container orchestration
- Stateless services for easy scaling
- Circuit breakers and retry policies

---

# 2. LAYER ARCHITECTURE

## 2.1 Complete Layer Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    LAYER 1: USER INTERFACE                                  │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐        │
│  │  REZ Consumer   │  │  REZ Merchant   │  │   CorpPerks     │  │   Monitoring    │        │
│  │      App        │  │      App        │  │   Dashboard     │  │   Dashboard     │        │
│  │    (5500+)      │  │    (4081+)      │  │    (4710+)      │  │    (3100)       │        │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘        │
│           │                    │                    │                    │                   │
└───────────┼────────────────────┼────────────────────┼────────────────────┼───────────────────┘
            │                    │                    │                    │
            ▼                    ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                LAYER 2: AI/INTELLIGENCE (HOJAI AI)                          │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐        │
│  │     Genie       │  │    CoPilot      │  │    SUTAR OS     │  │    VoiceOS       │        │
│  │   Personal AI   │  │   Business AI   │  │   Autonomous    │  │    Voice AI     │        │
│  │   (4703-4706)   │  │   (4710+)      │  │   (4240-4254)   │  │    (4850+)      │        │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘        │
│           │                    │                    │                    │                   │
│           └────────────────────┴────────────────────┴────────────────────┘                   │
│                                     │                                                       │
│  ┌───────────────────────────────────┼───────────────────────────────────────────────────┐    │
│  │           HOJAI Core (12 Platforms)                                          │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │    │
│  │  │ Gateway   │ │Governance│ │ EventBus │ │ Memory   │ │ Intelli- │ │ Agents   │     │    │
│  │  │  (4500)   │ │ (4501)   │ │ (4510)   │ │ (4520)   │ │ gence(4530) │ (4550)   │     │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘     │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │    │
│  │  │Workflows │ │ Comms    │ │Hyperlocal│ │  Data    │ │  TwinOS  │ │  FlowOS  │     │    │
│  │  │ (4560)   │ │ (4570)   │ │ (4580)   │ │ (4590)   │ │ (4142)   │ │ (4144)   │     │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘     │    │
│  └───────────────────────────────────────────────────────────────────────────────────────┘    │
└────────────────────────────────────────────┬──────────────────────────────────────────────────┘
                                             │
                                             ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                               LAYER 3: INTEGRATION (SUTAR)                                  │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐        │
│  │   Intent Bus    │  │   Negotiation    │  │   Decision      │  │   REZ Bridge    │        │
│  │    (4154)       │  │    Engine        │  │    Engine       │  │                 │        │
│  │                 │  │    (4191)        │  │    (4240)       │  │                 │        │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘        │
│           │                    │                    │                    │                   │
│  ┌────────┴───────────────────┴───────────────────┴────────────────────┴────────┐           │
│  │                    SUTAR Foundation Services                                  │           │
│  │  • Trust Engine (4180)  • ContractOS (4190)  • PolicyOS (4254)              │           │
│  │  • TwinOS (4142)        • Memory Bridge (4143)  • AXP Protocol (4141)     │           │
│  └────────────────────────────────┬───────────────────────────────────────────┘           │
│                                   │                                                       │
└───────────────────────────────────┼───────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                             LAYER 4: CORE PLATFORM (RABTUL)                                 │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐        │
│  │   Order Service │  │  Delivery Svc   │  │  Payment Svc    │  │   Auth Service  │        │
│  │    (4006)       │  │    (4009)       │  │    (4001)       │  │    (4002)       │        │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘        │
│           │                    │                    │                    │                   │
│  ┌────────┴───────────────────┴───────────────────┴────────────────────┴────────┐           │
│  │                      RABTUL Infrastructure Services                           │           │
│  │  • Wallet (4004)    • Catalog (4007)   • Search (4008)   • Notify (4011)     │           │
│  │  • Profile (4013)   • Analytics (4016) • Booking (4020)  • Loyalty (4037)   │           │
│  │  • Circuit Breaker (4030)  • Retry (4031)  • DLQ (4032)  • Idempotency(4033) │           │
│  └────────────────────────────────┬───────────────────────────────────────────┘           │
│                                   │                                                       │
└───────────────────────────────────┼───────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                  LAYER 5: EVENT BUS                                         │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                             │
│  ┌────────────────────────────────────────────────────────────────────────────────────┐    │
│  │                           REZ EVENT BUS (4075)                                      │    │
│  │                                                                                    │    │
│  │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │    │
│  │   │   Order     │  │   Payment   │  │   Delivery   │  │   Notify    │             │    │
│  │   │  Events     │  │   Events    │  │   Events    │  │   Events    │             │    │
│  │   └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘             │    │
│  │                                                                                    │    │
│  │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │    │
│  │   │   Intent    │  │   Trust     │  │   Contract   │  │   System    │             │    │
│  │   │  Events     │  │   Events    │  │   Events    │  │   Events    │             │    │
│  │   └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘             │    │
│  └────────────────────────────────────────────────────────────────────────────────────┘    │
└────────────────────────────────────────────┬──────────────────────────────────────────────────┘
                                             │
                                             ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                  LAYER 6: PRODUCTS                                          │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │   RIDZA     │ │  RisaCare   │ │   Nexha     │ │  AdBazaar   │ │  StayOwn    │          │
│  │  Finance    │ │ Healthcare  │ │  Commerce   │ │  Marketing  │ │ Hospitality │          │
│  │ Port 5000+  │ │ Port 4700+  │ │ Port 4300+  │ │ Port 4800+  │ │ Port 4101   │          │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘          │
│                                                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │  CorpPerks  │ │ KHAIRMOVE   │ │ RisnaEstate │ │  LawGens    │ │ Z-Events    │          │
│  │  Workforce  │ │  Mobility   │ │ Real Estate │ │   Legal     │ │   Events    │          │
│  │ Port 4710+  │ │ Port 4100+  │ │ Port 4100+  │ │ Port 5098+  │ │ Port 4000+  │          │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘          │
│                                                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                        │
│  │  REZ App    │ │ REZ Merchant│ │ AssetMind   │ │  Axom       │                        │
│  │   Consumer  │ │  Merchant   │ │  Finance    │ │Future Tech  │                        │
│  │ Port 5500+  │ │ Port 4005+  │ │ Port 5001+  │ │ Port 6000+  │                        │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘                        │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

## 2.2 Layer Responsibilities

### Layer 1: User Interface
- Consumer-facing applications (REZ App, Merchant App)
- Enterprise dashboards (CorpPerks, Monitoring)
- Mobile apps and responsive web

### Layer 2: AI/Intelligence
- Personal AI (Genie) for individual users
- Business AI (CoPilot) for enterprises
- Autonomous operations (SUTAR OS)
- Voice interfaces (VoiceOS)

### Layer 3: Integration
- Intent propagation and discovery
- Multi-agent negotiation
- Autonomous decision-making
- Cross-service orchestration

### Layer 4: Core Platform
- Payment processing and orchestration
- Authentication and authorization
- Order lifecycle management
- Inventory and catalog management

### Layer 5: Event Bus
- Pub/sub messaging
- Event streaming
- Real-time notifications
- Cross-service communication

### Layer 6: Products
- Industry-specific solutions (RIDZA, RisaCare, Nexha)
- Commerce platforms (REZ Consumer, REZ Merchant)
- Specialized verticals (StayOwn, KHAIRMOVE)

---

# 3. DATA FLOW

## 3.1 Order Creation Flow (End-to-End)

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                              ORDER CREATION FLOW                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

User Interaction
        │
        ▼
┌───────────────────┐
│  REZ Consumer App │
│    (Port 5500+)   │
└─────────┬─────────┘
          │
          │ 1. User browses, adds to cart, checks out
          │    POST /api/orders
          ▼
┌───────────────────┐
│   API Gateway     │
│   (Port 4000)     │
│   RABTUL          │
└─────────┬─────────┘
          │
          │ 2. Route to Order Service, validate JWT
          ▼
┌───────────────────┐
│  Order Service    │
│   (Port 4006)     │
│   RABTUL          │
└─────────┬─────────┘
          │
          │ 3. Create order, publish ORDER_CREATED event
          │    Event: { type: "ORDER_CREATED", orderId, items, amount }
          ▼
┌───────────────────┐
│   REZ Event Bus   │
│   (Port 4075)     │
└─────────┬─────────┘
          │
          │ 4. Publish event to all subscribers
          │
          ├──────────────────┐
          │                  │
          ▼                  ▼
┌─────────────────┐  ┌─────────────────┐
│  Catalog Service│  │  Payment Service│
│   (Port 4007)   │  │   (Port 4001)  │
│                 │  │                │
│ Reserve inventory│  │ Create payment │
└─────────────────┘  └────────┬────────┘
                             │
                             │ 5. Payment initiated
                             ▼
                    ┌─────────────────┐
                    │  Payment Gateway│
                    │  (Razorpay/UPI) │
                    └────────┬────────┘
                             │
                             │ 6. Payment confirmation
                             ▼
                    ┌─────────────────┐
                    │  Intent Predictor│
                    │   (Port 4018)   │
                    │  REZ Intelligence│
                    └────────┬────────┘
                             │
                             │ 7. Score user intent, update ML model
                             ▼
                    ┌─────────────────┐
                    │   Order Service │
                    │   (Continue)    │
                    └────────┬────────┘
                             │
                             │ 8. Update order status, publish PAYMENT_CONFIRMED
                             ▼
┌───────────────────┐
│   REZ Event Bus   │
│   (Port 4075)     │
└─────────┬─────────┘
          │
          │ 9. Event triggers downstream
          │
          ├──────────────────────────────┐
          │                              │
          ▼                              ▼
┌─────────────────┐            ┌─────────────────┐
│ Delivery Service │            │  Merchant App   │
│   (Port 4009)   │            │   (Port 4081)  │
│                 │            │                 │
│ Assign driver   │            │ Receive order   │
│ Track delivery  │            │ Prepare items   │
└─────────────────┘            └─────────────────┘
          │
          │ 10. Publish DELIVERY_COMPLETED
          ▼
┌───────────────────┐
│  Genie AI         │
│   (Port 4703)    │
│                   │
│ Update user       │
│ memory/timeline   │
└───────────────────┘
```

## 3.2 Intent → Negotiation → Order → Delivery

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                         INTENT → NEGOTIATION → ORDER → DELIVERY                             │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│  PHASE 1: INTENT DETECTION                                                               │
│  ───────────────────────────────                                                           │
│                                                                                             │
│  User Action ──► REZ Consumer App ──► API Gateway                                         │
│                                       │                                                    │
│                                       ▼                                                    │
│                              ┌─────────────────┐                                           │
│                              │ Intent Predictor│                                          │
│                              │   (Port 4018)   │                                           │
│                              │ REZ Intelligence│                                          │
│                              └────────┬────────┘                                           │
│                                       │                                                    │
│  Intent Signals:                     │                                                    │
│  • Product views                    │ ML Score: 0.85 (high propensity)                   │
│  • Search queries                    ▼                                                    │
│  • Add to cart              ┌─────────────────┐                                           │
│  • Time on page             │ Signal Aggregator│                                          │
│  • Purchase history         │   (Port 4142)   │                                           │
│                              └────────┬────────┘                                           │
│                                       │                                                    │
│                                       ▼                                                    │
│                              ┌─────────────────┐                                           │
│                              │  SUTAR Intent   │                                           │
│                              │      Bus        │                                           │
│                              │   (Port 4154)   │                                           │
│                              └────────┬────────┘                                           │
└───────────────────────────────────────┼─────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│  PHASE 2: NEGOTIATION                                                                   │
│  ────────────────────────                                                                 │
│                                                                                            │
│  Intent captured ──► SUTAR Negotiation Engine                                             │
│                      (Port 4191)                                                          │
│                      │                                                                    │
│                      ▼                                                                    │
│              ┌─────────────────┐                                                          │
│              │  Trust Engine   │                                                          │
│              │   (Port 4180)   │                                                          │
│              │                 │                                                          │
│              │ Check supplier  │                                                          │
│              │ trust scores    │                                                          │
│              └────────┬────────┘                                                          │
│                       │                                                                   │
│              ┌────────┴────────┐                                                          │
│              ▼                 ▼                                                           │
│     Trust Score OK    Trust Score Low                                                     │
│          │                 │                                                               │
│          ▼                 ▼                                                               │
│   Proceed with       Require additional                                                  │
│   negotiation        verification                                                        │
│          │                 │                                                               │
│          └────────┬────────┘                                                               │
│                   ▼                                                                       │
│          ┌─────────────────┐                                                              │
│          │ Negotiation     │                                                              │
│          │ Engine          │                                                              │
│          │                 │                                                              │
│          │ • Price terms   │                                                              │
│          │ • Delivery time │                                                              │
│          │ • Quantity      │                                                              │
│          │ • Payment terms │                                                              │
│          └────────┬────────┘                                                              │
│                   │                                                                       │
│                   ▼                                                                       │
│          ┌─────────────────┐                                                              │
│          │  ContractOS     │                                                              │
│          │   (Port 4190)   │                                                              │
│          │                 │                                                              │
│          │ Generate smart  │                                                              │
│          │ contract        │                                                              │
│          └────────┬────────┘                                                              │
└───────────────────┼───────────────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│  PHASE 3: ORDER CREATION                                                                 │
│  ────────────────────────                                                                 │
│                                                                                            │
│  Contract agreed ──► Order Service                                                        │
│                     (Port 4006)                                                           │
│                     │                                                                     │
│                     ▼                                                                     │
│             ┌─────────────────┐                                                            │
│             │ Order Service   │                                                            │
│             │                 │                                                            │
│             │ • Create order  │                                                            │
│             │ • Reserve stock │                                                            │
│             │ • Set pricing   │                                                            │
│             │ • Generate ID  │                                                            │
│             └────────┬────────┘                                                            │
│                      │                                                                    │
│                      ▼                                                                    │
│             ┌─────────────────┐                                                            │
│             │  Payment Service│                                                            │
│             │   (Port 4001)   │                                                            │
│             │                 │                                                            │
│             │ • Create intent │                                                            │
│             │ • UPI/Razorpay  │                                                            │
│             │ • Handle confirm│                                                            │
│             └────────┬────────┘                                                            │
│                      │                                                                    │
│                      ▼                                                                    │
│             ┌─────────────────┐                                                            │
│             │   REZ Event Bus│                                                            │
│             │   (Port 4075)  │                                                            │
│             │                 │                                                            │
│             │ Publish:        │                                                            │
│             │ ORDER_CREATED  │                                                            │
│             │ PAYMENT_PENDING│                                                            │
│             └────────┬────────┘                                                            │
└──────────────────────┼──────────────────────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│  PHASE 4: DELIVERY                                                                      │
│  ──────────────────                                                                     │
│                                                                                           │
│  Payment confirmed ──► Delivery Service                                                   │
│                      (Port 4009)                                                         │
│                      │                                                                   │
│                      ▼                                                                   │
│             ┌─────────────────┐                                                           │
│             │ Delivery Service│                                                           │
│             │                 │                                                           │
│             │ • Assign driver │                                                           │
│             │ • Route optim.  │                                                           │
│             │ • Track real-time│                                                          │
│             └────────┬────────┘                                                           │
│                      │                                                                   │
│                      ▼                                                                   │
│             ┌─────────────────┐                                                           │
│             │  Merchant App   │                                                           │
│             │   (Port 4081)   │                                                           │
│             │                 │                                                           │
│             │ • Notify prep   │                                                           │
│             │ • KDS update    │                                                           │
│             │ • Handoff ready │                                                           │
│             └────────┬────────┘                                                           │
│                      │                                                                   │
│                      ▼                                                                   │
│             ┌─────────────────┐                                                           │
│             │ Driver App      │                                                           │
│             │ (KHAIRMOVE)    │                                                           │
│             │                 │                                                           │
│             │ • Accept order │                                                           │
│             │ • Navigate      │                                                           │
│             │ • Confirm pick  │                                                           │
│             │ • Complete del. │                                                           │
│             └────────┬────────┘                                                           │
│                      │                                                                   │
│                      ▼                                                                   │
│             ┌─────────────────┐                                                           │
│             │   Genie AI     │                                                           │
│             │   (Port 4703)  │                                                           │
│             │                 │                                                           │
│             │ Update memory  │                                                           │
│             │ Timeline        │                                                           │
│             │ Briefing        │                                                           │
│             └─────────────────┘                                                           │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

## 3.3 Service Names and Ports Reference

| Phase | Service | Port | Description |
|-------|---------|------|-------------|
| **Intent** | REZ Consumer App | 5500+ | User interaction |
| **Intent** | API Gateway | 4000 | Route requests |
| **Intent** | Intent Predictor | 4018 | ML scoring |
| **Intent** | Signal Aggregator | 4142 | Behavior tracking |
| **Intent** | SUTAR Intent Bus | 4154 | Publish intents |
| **Negotiation** | Trust Engine | 4180 | Verify trust scores |
| **Negotiation** | Negotiation Engine | 4191 | Bargaining |
| **Negotiation** | ContractOS | 4190 | Smart contracts |
| **Order** | Order Service | 4006 | Order lifecycle |
| **Order** | Payment Service | 4001 | Payment processing |
| **Order** | Wallet Service | 4004 | Coins/balance |
| **Order** | Catalog Service | 4007 | Inventory |
| **Order** | Event Bus | 4075 | Publish events |
| **Delivery** | Delivery Service | 4009 | Driver assignment |
| **Delivery** | REZ Merchant | 4081 | Merchant notification |
| **Delivery** | KHAIRMOVE | 4100+ | Driver management |
| **Post-Delivery** | Genie Memory | 4703 | User memory |
| **Post-Delivery** | Genie Relationship | 4704 | Relationship update |
| **Post-Delivery** | Genie Briefing | 4706 | Daily summary |

---

# 4. COMMUNICATION PATTERNS

## 4.1 REST APIs

### Pattern: Synchronous Request-Response

```
┌──────────┐    HTTP/REST    ┌──────────┐
│  Client  │ ──────────────► │  Service │
│          │                 │          │
│          │ ◄────────────── │          │
└──────────┘    Response     └──────────┘
```

### Key REST Endpoints

#### Authentication Service (4002)
```yaml
POST   /api/auth/register     # User registration
POST   /api/auth/login        # Login with credentials
POST   /api/auth/refresh      # Refresh JWT token
POST   /api/auth/logout       # Invalidate token
POST   /api/auth/otp/send     # Send OTP
POST   /api/auth/otp/verify   # Verify OTP
POST   /api/auth/mfa/setup    # Setup MFA
GET    /api/auth/me           # Current user info
```

#### Order Service (4006)
```yaml
POST   /api/orders            # Create order
GET    /api/orders            # List orders
GET    /api/orders/:id        # Get order details
PATCH  /api/orders/:id/status  # Update status
DELETE /api/orders/:id         # Cancel order
GET    /api/orders/:id/tracking # Track order
```

#### Payment Service (4001)
```yaml
POST   /api/payments/initiate  # Start payment
GET    /api/payments/:id       # Payment status
POST   /api/payments/:id/confirm # Confirm payment
POST   /api/payments/:id/refund  # Refund payment
GET    /api/payments/methods   # Available payment methods
```

#### Wallet Service (4004)
```yaml
GET    /api/wallet/balance     # Get balance
POST   /api/wallet/topup       # Add funds
POST   /api/wallet/withdraw    # Withdraw funds
GET    /api/wallet/transactions # Transaction history
POST   /api/wallet/transfer    # Transfer to another user
```

## 4.2 WebSocket (Real-Time)

### Pattern: Bidirectional Real-Time Communication

```
┌──────────┐    WebSocket    ┌──────────┐
│  Client  │ ◄────────────► │  Server  │
│          │                │          │
│          │  Subscribe:    │          │
│          │ ──────────────►│          │
│          │                │          │
│          │  Push Events:  │          │
│          │ ◄──────────────│          │
└──────────┘                └──────────┘
```

### WebSocket Events by Service

#### SUTAR WebSocket Server (4155)
```javascript
// Client subscribes to events
{
  "event": "subscribe",
  "channel": "intents",
  "filters": {
    "category": "food_beverage",
    "minTrustScore": 70
  }
}

// Server pushes events
{
  "event": "intent.published",
  "data": {
    "intentId": "int_xxx",
    "type": "PROCUREMENT",
    "category": "food_beverage",
    "payload": { "product": "Tomatoes", "quantity": "100kg" },
    "publisher": { "agentId": "restaurant-001" },
    "timestamp": "2026-06-11T10:30:00Z"
  }
}
```

#### Delivery Service WebSocket
```javascript
// Subscribe to order tracking
{
  "event": "subscribe",
  "channel": "order",
  "orderId": "ord_xxx"
}

// Real-time updates
{
  "event": "order.status",
  "data": {
    "orderId": "ord_xxx",
    "status": "OUT_FOR_DELIVERY",
    "driver": {
      "name": "Ravi Kumar",
      "phone": "+91-9876543210",
      "location": { "lat": 12.9716, "lng": 77.5946 }
    },
    "eta": "10 minutes"
  }
}
```

#### Notification Service WebSocket
```javascript
// Real-time notifications
{
  "event": "notification",
  "data": {
    "type": "ORDER_CONFIRMED",
    "title": "Order Confirmed!",
    "body": "Your order #12345 has been confirmed",
    "orderId": "ord_xxx",
    "actions": [
      { "type": "VIEW_ORDER", "url": "/orders/12345" },
      { "type": "TRACK", "url": "/track/12345" }
    ]
  }
}
```

## 4.3 Event Bus (Pub/Sub)

### Pattern: Asynchronous Event Streaming

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│  Publisher  │ ──────► │  Event Bus  │ ◄───── │  Subscriber │
│             │         │   (4075)   │         │             │
└─────────────┘         └─────────────┘         └─────────────┘
                              │
                              ├──► Service A
                              ├──► Service B
                              └──► Service C
```

### Event Types

#### Order Events
```javascript
// ORDER_CREATED
{
  "type": "ORDER_CREATED",
  "source": "order-service",
  "timestamp": "2026-06-11T10:30:00Z",
  "data": {
    "orderId": "ord_xxx",
    "userId": "usr_xxx",
    "items": [...],
    "totalAmount": 599,
    "paymentMethod": "UPI"
  }
}

// ORDER_CONFIRMED
{
  "type": "ORDER_CONFIRMED",
  "source": "payment-service",
  "data": {
    "orderId": "ord_xxx",
    "paymentId": "pay_xxx",
    "status": "CONFIRMED"
  }
}

// ORDER_SHIPPED
{
  "type": "ORDER_SHIPPED",
  "source": "delivery-service",
  "data": {
    "orderId": "ord_xxx",
    "driverId": "drv_xxx",
    "estimatedDelivery": "2026-06-11T11:30:00Z"
  }
}

// ORDER_DELIVERED
{
  "type": "ORDER_DELIVERED",
  "source": "delivery-service",
  "data": {
    "orderId": "ord_xxx",
    "deliveredAt": "2026-06-11T11:25:00Z",
    "signature": "base64_signature"
  }
}
```

#### Payment Events
```javascript
// PAYMENT_INITIATED
{
  "type": "PAYMENT_INITIATED",
  "source": "payment-service",
  "data": {
    "paymentId": "pay_xxx",
    "orderId": "ord_xxx",
    "amount": 599,
    "method": "UPI"
  }
}

// PAYMENT_COMPLETED
{
  "type": "PAYMENT_COMPLETED",
  "data": {
    "paymentId": "pay_xxx",
    "orderId": "ord_xxx",
    "transactionId": "txn_xxx"
  }
}

// PAYMENT_FAILED
{
  "type": "PAYMENT_FAILED",
  "data": {
    "paymentId": "pay_xxx",
    "orderId": "ord_xxx",
    "reason": "INSUFFICIENT_BALANCE"
  }
}
```

#### Intent Events
```javascript
// INTENT_PUBLISHED
{
  "type": "INTENT_PUBLISHED",
  "source": "intent-bus",
  "data": {
    "intentId": "int_xxx",
    "type": "PROCUREMENT",
    "category": "food_beverage",
    "publisher": { "agentId": "agent_xxx" },
    "payload": { ... }
  }
}

// INTENT_MATCHED
{
  "type": "INTENT_MATCHED",
  "data": {
    "intentId": "int_xxx",
    "matches": [
      { "supplierId": "sup_001", "score": 0.95 },
      { "supplierId": "sup_002", "score": 0.87 }
    ]
  }
}

// NEGOTIATION_COMPLETED
{
  "type": "NEGOTIATION_COMPLETED",
  "data": {
    "negotiationId": "neg_xxx",
    "terms": { "price": 3400, "delivery": "2026-06-12" },
    "contractId": "con_xxx"
  }
}
```

## 4.4 gRPC (Internal Communication)

### Pattern: High-Performance Service-to-Service

```
┌──────────┐    gRPC      ┌──────────┐
│  Service │ ──────────► │  Service │
│    A     │              │    B     │
└──────────┘              └──────────┘
```

### Internal gRPC Services

#### Order to Inventory Check
```protobuf
service InventoryService {
  rpc CheckAvailability(InventoryRequest) returns (InventoryResponse);
  rpc ReserveItems(ReserveRequest) returns (ReserveResponse);
  rpc ReleaseItems(ReleaseRequest) returns (ReleaseResponse);
}

message InventoryRequest {
  string product_id = 1;
  int32 quantity = 2;
  string location = 3;
}

message InventoryResponse {
  bool available = 1;
  int32 in_stock = 2;
  string estimated_restock = 3;
}
```

#### Order to Delivery Routing
```protobuf
service DeliveryRoutingService {
  rpc CalculateRoute(RouteRequest) returns (RouteResponse);
  rpc AssignDriver(AssignmentRequest) returns (AssignmentResponse);
  rpc UpdateLocation(LocationUpdate) returns (LocationAck);
}

message RouteRequest {
  string order_id = 1;
  string pickup_location = 2;
  string dropoff_location = 3;
}
```

---

# 5. SERVICE CONTRACTS

## 5.1 API Endpoints by Service

### HOJAI API Gateway (4500)
```yaml
basePath: /api/v1

paths:
  /auth:
    post:
      summary: Authenticate request
      parameters:
        - name: Authorization
          in: header
          required: true
          type: string
          description: Bearer token
  
  /services:
    get:
      summary: List available services
      responses:
        200:
          description: Service catalog
          
  /intents:
    post:
      summary: Publish intent
      parameters:
        - name: body
          in: body
          required: true
          schema:
            $ref: '#/definitions/Intent'
    get:
      summary: Search intents
      parameters:
        - name: category
          in: query
          type: string
```

### RABTUL Order Service (4006)
```yaml
basePath: /api/v1/orders

paths:
  /:
    post:
      summary: Create new order
      parameters:
        - name: body
          in: body
          required: true
          schema:
            $ref: '#/definitions/OrderCreate'
      responses:
        201:
          description: Order created
          schema:
            $ref: '#/definitions/Order'
        400:
          description: Invalid order data
        401:
          description: Unauthorized
          
  /{orderId}:
    get:
      summary: Get order details
      parameters:
        - name: orderId
          in: path
          required: true
          type: string
      responses:
        200:
          description: Order details
        404:
          description: Order not found
          
    patch:
      summary: Update order
      parameters:
        - name: orderId
          in: path
          required: true
        - name: body
          in: body
          schema:
            $ref: '#/definitions/OrderUpdate'
```

### SUTAR Intent Bus (4154)
```yaml
basePath: /api/intents

paths:
  /:
    post:
      summary: Publish new intent
      parameters:
        - name: body
          in: body
          required: true
          schema:
            $ref: '#/definitions/SUTARIntent'
      responses:
        201:
          description: Intent published
          
  /search:
    get:
      summary: Search intents
      parameters:
        - name: q
          in: query
          type: string
        - name: category
          in: query
          type: string
        - name: minTrustScore
          in: query
          type: number
```

## 5.2 Event Types Summary

| Category | Event | Publisher | Subscribers |
|----------|-------|-----------|-------------|
| **Order** | ORDER_CREATED | Order Service | Payment, Delivery, Inventory |
| **Order** | ORDER_CONFIRMED | Payment Service | Delivery, Merchant |
| **Order** | ORDER_SHIPPED | Delivery Service | Consumer, Analytics |
| **Order** | ORDER_DELIVERED | Delivery Service | Consumer, Rewards, Genie |
| **Order** | ORDER_CANCELLED | Order Service | Payment (refund), Inventory |
| **Payment** | PAYMENT_INITIATED | Payment Service | Order, Wallet |
| **Payment** | PAYMENT_COMPLETED | Payment Service | Order, Rewards |
| **Payment** | PAYMENT_FAILED | Payment Service | Order, Notification |
| **Payment** | REFUND_INITIATED | Payment Service | Order |
| **Payment** | REFUND_COMPLETED | Payment Service | Order, Notification |
| **Intent** | INTENT_PUBLISHED | Intent Bus | Negotiation, Discovery |
| **Intent** | INTENT_MATCHED | Discovery | Negotiation |
| **Intent** | NEGOTIATION_STARTED | Negotiation | Trust, Contract |
| **Intent** | NEGOTIATION_COMPLETED | Negotiation | Contract, Order |
| **Trust** | TRUST_SCORE_UPDATED | Trust Engine | Marketplace, Negotiation |
| **Contract** | CONTRACT_CREATED | ContractOS | Order, Monitoring |
| **Contract** | CONTRACT_EXECUTED | ContractOS | All parties |

## 5.3 WebSocket Events Summary

| Channel | Event | Direction | Payload |
|---------|-------|-----------|---------|
| **intents** | intent.published | Server → Client | Full intent data |
| **intents** | intent.matched | Server → Client | Match list |
| **negotiations** | negotiation.started | Server → Client | Negotiation ID |
| **negotiations** | negotiation.update | Bidirectional | Terms progress |
| **negotiations** | negotiation.completed | Server → Client | Final terms |
| **orders** | order.created | Server → Client | Order details |
| **orders** | order.status | Server → Client | Status update |
| **orders** | order.location | Server → Client | Driver location |
| **notifications** | notification | Server → Client | Notification data |
| **trust** | trust.updated | Server → Client | New trust score |

---

# 6. DEPLOYMENT ARCHITECTURE

## 6.1 Docker Composition

### Core Infrastructure

```yaml
# docker-compose.yml (Core Services)

services:
  # RABTUL Core
  api-gateway:
    image: rabtul/api-gateway:1.0
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=production
      - EVENT_BUS_URL=http://event-bus:4075
    depends_on:
      - event-bus
      - auth-service

  auth-service:
    image: rabtul/auth-service:1.0
    ports:
      - "4002:4002"
    environment:
      - DB_HOST=postgres
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis

  payment-service:
    image: rabtul/payment-service:1.0
    ports:
      - "4001:4001"
    environment:
      - RAZORPAY_KEY=${RAZORPAY_KEY}
      - UPI_GATEWAY=${UPI_GATEWAY}
    depends_on:
      - auth-service
      - wallet-service

  wallet-service:
    image: rabtul/wallet-service:1.0
    ports:
      - "4004:4004"
    depends_on:
      - postgres
      - redis

  order-service:
    image: rabtul/order-service:1.0
    ports:
      - "4006:4006"
    depends_on:
      - auth-service
      - payment-service
      - catalog-service
      - event-bus

  catalog-service:
    image: rabtul/catalog-service:1.0
    ports:
      - "4007:4007"
    depends_on:
      - postgres
      - search-service

  search-service:
    image: rabtul/search-service:1.0
    ports:
      - "4008:4008"
    depends_on:
      - elasticsearch

  delivery-service:
    image: rabtul/delivery-service:1.0
    ports:
      - "4009:4009"
    depends_on:
      - order-service
      - map-service

  event-bus:
    image: rabtul/event-bus:1.0
    ports:
      - "4075:4075"
    environment:
      - RABTUL_QUEUE_URL=amqp://rabbitmq:5672
    depends_on:
      - rabbitmq

  # HOJAI AI
  hojai-gateway:
    image: hojai/gateway:1.0
    ports:
      - "4500:4500"
    environment:
      - HOJAI_API_KEY=${HOJAI_API_KEY}

  hojai-memory:
    image: hojai/memory:1.0
    ports:
      - "4520:4520"
    environment:
      - PINECONE_URL=${PINECONE_URL}
    depends_on:
      - redis

  hojai-intelligence:
    image: hojai/intelligence:1.0
    ports:
      - "4530:4530"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}

  hojai-agents:
    image: hojai/agents:1.0
    ports:
      - "4550:4550"

  # SUTAR OS
  sutar-gateway:
    image: hojai/sutar-gateway:1.0
    ports:
      - "4150:4150"

  sutar-intent-bus:
    image: hojai/sutar-intent-bus:1.0
    ports:
      - "4154:4154"
    depends_on:
      - redis

  sutar-websocket:
    image: hojai/sutar-websocket:1.0
    ports:
      - "4155:4155"

  sutar-decision-engine:
    image: hojai/sutar-decision:1.0
    ports:
      - "4240:4240"
    depends_on:
      - hojai-intelligence

  sutar-trust-engine:
    image: hojai/sutar-trust:1.0
    ports:
      - "4180:4180"

  # REZ Intelligence
  intent-predictor:
    image: rez-intelligence/intent-predictor:1.0
    ports:
      - "4018:4018"
    depends_on:
      - hojai-intelligence

  signal-aggregator:
    image: rez-intelligence/signal-aggregator:1.0
    ports:
      - "4142:4142"
    depends_on:
      - event-bus

  # Genie (Personal AI)
  genie-memory:
    image: hojai/genie-memory:1.0
    ports:
      - "4703:4703"

  genie-relationship:
    image: hojai/genie-relationship:1.0
    ports:
      - "4704:4704"

  genie-briefing:
    image: hojai/genie-briefing:1.0
    ports:
      - "4706:4706"

  # Infrastructure
  postgres:
    image: postgres:15-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_PASSWORD=${DB_PASSWORD}

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

  rabbitmq:
    image: rabbitmq:3-management
    ports:
      - "5672:5672"
      - "15672:15672"

  elasticsearch:
    image: elasticsearch:8.0
    environment:
      - discovery.type=single-node
    volumes:
      - es_data:/usr/share/elasticsearch/data

volumes:
  postgres_data:
  redis_data:
  es_data:
```

## 6.2 Kubernetes Architecture

```yaml
# k8s/namespace-rtnm.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: rtnm-ecosystem
---
# k8s/rabtul-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-gateway
  namespace: rtnm-ecosystem
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api-gateway
  template:
    metadata:
      labels:
        app: api-gateway
    spec:
      containers:
        - name: api-gateway
          image: rabtul/api-gateway:1.0
          ports:
            - containerPort: 4000
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          env:
            - name: EVENT_BUS_URL
              value: "http://event-bus:4075"
          readinessProbe:
            httpGet:
              path: /health
              port: 4000
            initialDelaySeconds: 10
            periodSeconds: 5
          livenessProbe:
            httpGet:
              path: /health
              port: 4000
            initialDelaySeconds: 30
            periodSeconds: 10
---
# k8s/service-rabtul.yaml
apiVersion: v1
kind: Service
metadata:
  name: api-gateway
  namespace: rtnm-ecosystem
spec:
  selector:
    app: api-gateway
  ports:
    - port: 80
      targetPort: 4000
  type: LoadBalancer
---
# k8s/ingress-rtnm.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: rtnm-ingress
  namespace: rtnm-ecosystem
  annotations:
    kubernetes.io/ingress.class: nginx
spec:
  rules:
    - host: api.rtnm.digital
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: api-gateway
                port:
                  number: 80
```

## 6.3 Network Topology

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   EXTERNAL NETWORK                                          │
│                                       (Internet)                                            │
└────────────────────────────────────────┬──────────────────────────────────────────────────┘
                                         │
                                         │ HTTPS (443)
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                              LOAD BALANCER (Cloudflare/AWS ALB)                              │
│                                   - SSL Termination                                         │
│                                   - DDoS Protection                                         │
│                                   - WAF Rules                                               │
└────────────────────────────────────────┬──────────────────────────────────────────────────┘
                                         │
          ┌─────────────────────────────┼─────────────────────────────┐
          │                             │                             │
          ▼                             ▼                             ▼
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│   HOJAI AI Zone     │     │   RABTUL Zone       │     │   PRODUCT Zone      │
│   (AI Services)     │     │   (Infrastructure)  │     │   (Industry Apps)   │
│                     │     │                     │     │                     │
│  • Gateway (4500)   │     │  • API Gateway      │     │  • REZ Consumer     │
│  • Memory (4520)    │     │  • Auth (4002)      │     │  • REZ Merchant     │
│  • Intelligence     │     │  • Payment (4001)   │     │  • RIDZA            │
│  • Agents (4550)   │     │  • Wallet (4004)    │     │  • RisaCare         │
│  • SUTAR (4150+)   │     │  • Order (4006)     │     │  • CorpPerks        │
│                     │     │  • Event Bus (4075) │     │                     │
└─────────┬───────────┘     └─────────┬───────────┘     └─────────┬───────────┘
          │                           │                           │
          └───────────────────────────┼───────────────────────────┘
                                      │
                         ┌────────────┴────────────┐
                         │     Internal Network     │
                         │    (VPC/Kubernetes)     │
                         │                         │
                         │  ┌─────────────────┐   │
                         │  │   Service Mesh   │   │
                         │  │   (Istio/Linkerd)│   │
                         │  │   mTLS enabled   │   │
                         │  └────────┬────────┘   │
                         │           │             │
                         │  ┌────────┴────────┐   │
                         │  │   Service A     │   │
                         │  │   Service B     │   │
                         │  │   Service C     │   │
                         │  └─────────────────┘   │
                         └─────────────────────────┘
```

---

# 7. SECURITY

## 7.1 Authentication

### JWT-Based Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                              AUTHENTICATION FLOW                                           │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

User ──► Login ──► Auth Service ──► Verify Credentials ──► Generate JWT
                                                        │
                                                        ▼
                                                  ┌─────────────┐
                                                  │  JWT Token  │
                                                  │             │
                                                  │ {           │
                                                  │   sub: id   │
                                                  │   role: user│
                                                  │   exp: 1hr  │
                                                  │   iat: ts   │
                                                  │ }           │
                                                  └─────────────┘
                                                        │
                                                        ▼
User ──► API Request ──► API Gateway ──► Validate JWT ──► Process Request
                            │
                            ▼
                      ┌─────────────┐
                      │ Valid JWT?  │
                      └──────┬──────┘
                             │
              ┌──────────────┼──────────────┐
              │                              │
           Valid                          Invalid
              │                              │
              ▼                              ▼
        Process Request              Return 401 Unauthorized
```

### Authentication Methods

| Method | Use Case | Implementation |
|--------|----------|----------------|
| **JWT** | API requests | Bearer token in Authorization header |
| **OTP** | Passwordless login | SMS/Email 6-digit code |
| **OAuth** | Social login | Google, Facebook, Apple |
| **MFA** | High-security actions | TOTP authenticator app |
| **API Key** | Service-to-service | X-API-Key header |

### Auth Service Endpoints (4002)

```yaml
POST /api/auth/login:
  body:
    email: string
    password: string
  returns:
    accessToken: string
    refreshToken: string
    expiresIn: number

POST /api/auth/otp/send:
  body:
    phone: string
    purpose: "LOGIN" | "VERIFY" | "RESET"
  returns:
    messageId: string

POST /api/auth/otp/verify:
  body:
    phone: string
    otp: string
    messageId: string
  returns:
    accessToken: string

POST /api/auth/refresh:
  body:
    refreshToken: string
  returns:
    accessToken: string
```

## 7.2 Authorization

### RBAC (Role-Based Access Control)

```javascript
// Roles and Permissions
const roles = {
  ADMIN: {
    permissions: ['*'],
    description: 'Full access to all resources'
  },
  MERCHANT_ADMIN: {
    permissions: [
      'merchant:read', 'merchant:write',
      'order:read', 'order:write',
      'inventory:read', 'inventory:write',
      'analytics:read'
    ],
    description: 'Full access to merchant operations'
  },
  MERCHANT_STAFF: {
    permissions: [
      'order:read', 'order:update',
      'inventory:read'
    ],
    description: 'Limited access for staff'
  },
  CONSUMER: {
    permissions: [
      'profile:read', 'profile:write',
      'order:create', 'order:read',
      'wallet:read'
    ],
    description: 'Customer access'
  },
  SERVICE: {
    permissions: ['*'],
    description: 'Internal service access'
  }
};
```

### Policy Enforcement

```yaml
# Policy Engine Rules (4034)

policies:
  # Order creation
  - name: "create-order"
    effect: "allow"
    subjects: ["consumer", "merchant_admin"]
    actions: ["order:create"]
    resources: ["urn:order:*"]
    
  # View all orders (merchant)
  - name: "view-merchant-orders"
    effect: "allow"
    subjects: ["merchant_admin", "merchant_staff"]
    actions: ["order:read"]
    resources: ["urn:order:merchant:*"]
    conditions:
      - type: "ownership"
        resource: "merchant"
        subject: "merchantId"
        
  # Admin access
  - name: "admin-full-access"
    effect: "allow"
    subjects: ["admin"]
    actions: ["*"]
    resources: ["urn:*:*"]
```

## 7.3 Encryption

### Data Encryption Standards

| Layer | Encryption | Implementation |
|-------|------------|----------------|
| **Transport** | TLS 1.3 | All external connections |
| **Database** | AES-256 | Sensitive fields at rest |
| **Passwords** | bcrypt | Salt rounds: 12 |
| **API Keys** | AES-256 | Secrets Manager rotation |
| **Tokens** | RS256 | JWT signing |
| **Files** | AES-256 | Uploaded documents |

### Secrets Management (4035)

```yaml
# Secrets Manager Configuration

encryption:
  algorithm: "AES-256-GCM"
  keyRotation: "90 days"
  
storage:
  backend: "vault"  # HashiCorp Vault
  region: "ap-south-1"
  
access:
  - service: "api-gateway"
    permissions: ["read"]
  - service: "payment-service"
    permissions: ["read", "write"]
  - service: "auth-service"
    permissions: ["read", "write"]
    
rotation:
  automatic: true
  schedule: "0 2 * * *"  # 2 AM daily
  notifications: true
```

## 7.4 Network Policies

```yaml
# Kubernetes Network Policies

apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: payment-service-policy
  namespace: rtnm-ecosystem
spec:
  podSelector:
    matchLabels:
      app: payment-service
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              name: rtnm-ecosystem
        - podSelector:
            matchLabels:
              app: api-gateway
      ports:
        - protocol: TCP
          port: 4001
  egress:
    - to:
        - podSelector:
            matchLabels:
              app: database
      ports:
        - protocol: TCP
          port: 5432
    - to:
        - podSelector:
            matchLabels:
              app: razorpay-external
      ports:
        - protocol: TCP
          port: 443
```

---

# 8. MONITORING

## 8.1 Health Endpoints

### Service Health Check Pattern

```yaml
# All services expose /health endpoint

GET /health:
  response:
    200:
      {
        "status": "healthy",
        "service": "order-service",
        "version": "1.0.0",
        "uptime": 86400,
        "checks": {
          "database": "ok",
          "cache": "ok",
          "eventBus": "ok"
        },
        "timestamp": "2026-06-11T10:30:00Z"
      }
    503:
      {
        "status": "unhealthy",
        "service": "order-service",
        "error": "Database connection failed",
        "timestamp": "2026-06-11T10:30:00Z"
      }
```

### Health Check Matrix

| Service | Port | Health Endpoint | Critical |
|---------|------|------------------|----------|
| API Gateway | 4000 | /health | Yes |
| Auth Service | 4002 | /health | Yes |
| Payment Service | 4001 | /health | Yes |
| Order Service | 4006 | /health | Yes |
| Wallet Service | 4004 | /health | Yes |
| Event Bus | 4075 | /health | Yes |
| HOJAI Gateway | 4500 | /health | Yes |
| HOJAI Memory | 4520 | /health | Yes |
| SUTAR Gateway | 4150 | /health | Yes |
| SUTAR Decision | 4240 | /health | Yes |
| Intent Predictor | 4018 | /health | No |
| Signal Aggregator | 4142 | /health | No |
| Genie Memory | 4703 | /health | No |

### Quick Health Check Script

```bash
#!/bin/bash
# health-check.sh

services=(
  "4000:api-gateway"
  "4002:auth-service"
  "4001:payment-service"
  "4006:order-service"
  "4075:event-bus"
  "4500:hojai-gateway"
  "4520:hojai-memory"
  "4154:sutar-intent-bus"
  "4240:sutar-decision"
)

echo "RTNM Ecosystem Health Check - $(date)"
echo "======================================"
echo ""

healthy=0
unhealthy=0

for item in "${services[@]}"; do
  port="${item%%:*}"
  name="${item##*:}"
  
  response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$port/health 2>/dev/null)
  
  if [ "$response" = "200" ]; then
    echo "✓ $name (port $port) - HEALTHY"
    ((healthy++))
  else
    echo "✗ $name (port $port) - UNHEALTHY (HTTP $response)"
    ((unhealthy++))
  fi
done

echo ""
echo "======================================"
echo "Summary: $healthy healthy, $unhealthy unhealthy"
```

## 8.2 Metrics

### Key Metrics by Service

#### API Gateway (4000)
```yaml
metrics:
  - name: "requests_total"
    type: counter
    labels: [method, endpoint, status]
    description: "Total API requests"
    
  - name: "request_duration_seconds"
    type: histogram
    labels: [method, endpoint]
    buckets: [0.01, 0.05, 0.1, 0.5, 1, 5]
    description: "Request latency"
    
  - name: "active_connections"
    type: gauge
    description: "Current active connections"
```

#### Order Service (4006)
```yaml
metrics:
  - name: "orders_created_total"
    type: counter
    labels: [merchant_id, payment_method]
    description: "Total orders created"
    
  - name: "order_value_total"
    type: counter
    labels: [merchant_id]
    description: "Total order value"
    
  - name: "order_status_count"
    type: gauge
    labels: [status]
    description: "Orders by status"
    
  - name: "order_processing_duration_seconds"
    type: histogram
    description: "Order processing time"
```

#### Payment Service (4001)
```yaml
metrics:
  - name: "payments_initiated_total"
    type: counter
    labels: [method, status]
    
  - name: "payments_completed_total"
    type: counter
    labels: [method]
    
  - name: "payment_amount_total"
    type: counter
    labels: [method]
    
  - name: "payment_failure_rate"
    type: gauge
    labels: [method]
```

### Prometheus Metrics Endpoint

```yaml
# All services expose /metrics in Prometheus format

GET /metrics:
  response: |
    # HELP orders_created_total Total orders created
    # TYPE orders_created_total counter
    orders_created_total{merchant_id="m001",payment_method="UPI"} 1523
    
    # HELP request_duration_seconds Request latency
    # TYPE request_duration_seconds histogram
    request_duration_seconds_bucket{le="0.1"} 1234
    request_duration_seconds_bucket{le="0.5"} 5678
    request_duration_seconds_sum 456.789
    request_duration_seconds_count 8901
```

## 8.3 Logging

### Log Format Standard

```json
{
  "timestamp": "2026-06-11T10:30:00.123Z",
  "level": "info",
  "service": "order-service",
  "version": "1.0.0",
  "traceId": "abc123def456",
  "spanId": "xyz789",
  "message": "Order created successfully",
  "context": {
    "orderId": "ord_xxx",
    "userId": "usr_xxx",
    "merchantId": "m001"
  },
  "metadata": {
    "duration_ms": 45,
    "requestId": "req_xxx"
  }
}
```

### Log Levels

| Level | Usage | Example |
|-------|-------|---------|
| **ERROR** | Failures requiring attention | Database connection failed, Payment declined |
| **WARN** | Potential issues | Retry attempted, Rate limit approaching |
| **INFO** | Normal operations | Order created, Payment processed |
| **DEBUG** | Detailed debugging | Request headers, SQL queries |
| **TRACE** | Very detailed tracing | Enter function, Exit function |

### Structured Logging Fields

```typescript
interface LogEntry {
  timestamp: string;      // ISO 8601
  level: 'error' | 'warn' | 'info' | 'debug' | 'trace';
  service: string;        // Service name
  version: string;        // Service version
  traceId: string;        // Distributed trace ID
  spanId: string;         // Span ID
  message: string;        // Human-readable message
  context: {
    userId?: string;
    orderId?: string;
    merchantId?: string;
    [key: string]: any;
  };
  error?: {
    name: string;
    message: string;
    stack: string;
  };
}
```

## 8.4 Distributed Tracing

### Trace Propagation

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                           DISTRIBUTED TRACE EXAMPLE                                         │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

Trace: abc123def456 (Order Creation)

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  API Gateway    │───►│  Order Service   │───►│  Payment Service │───►│  Delivery Svc   │
│  Span: abc001    │    │  Span: abc002    │    │  Span: abc003    │    │  Span: abc004    │
│  Duration: 5ms   │    │  Duration: 45ms   │    │  Duration: 120ms  │    │  Duration: 200ms  │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
      │                      │                      │                      │
      │                      │                      │                      │
      └──────────────────────┴──────────────────────┴──────────────────────┘
                                    │
                              Total Trace Duration: 370ms
```

### Trace Headers

```yaml
# W3C Trace Context
traceparent: 00-abc123def456-xyz789-01
tracestate: reznw=abc123def456

# B3 Propagation (Zipkin compatible)
X-B3-TraceId: abc123def456
X-B3-SpanId: xyz789
X-B3-ParentSpanId: parent123
X-B3-Sampled: 1
```

### Trace Collection

```yaml
# Jaeger/OpenTelemetry configuration

opentelemetry:
  serviceName: order-service
  exporter:
    type: jaeger
    endpoint: http://jaeger:14268/api/traces
  sampling:
    type: probabilistic
    rate: 0.1  # 10% of traces
```

---

# APPENDIX

## A. Port Reference

| Port Range | Service Category | Example Services |
|------------|------------------|------------------|
| 3000-3099 | Consumer Apps | unified-api-gateway, REZ-inbox |
| 4000-4099 | RABTUL Core | Auth, Payment, Order, Wallet |
| 4100-4299 | Industry Services | SUTAR, BuzzLocal, Atlas |
| 4300-4499 | HOJAI + Nexha | Distribution, Franchise |
| 4500-4610 | HOJAI Core | 12 core platforms |
| 4700-4799 | RisaCare + CorpPerks + Genie | Healthcare, Workforce, Personal AI |
| 4800-4899 | AdBazaar + VoiceOS | Marketing, Voice AI |
| 4900-4999 | AdBazaar Platform | CDP, Clean Room |
| 5000-5099 | RIDZA + Atlas | Finance OS, Sales AI |
| 6000-6099 | RTNM Platform | Company Registry, Billing |

## B. Service Dependencies Summary

```
REZ Consumer App
    ├── API Gateway (4000)
    ├── Auth Service (4002)
    └── Order Service (4006)
            ├── Auth Service (4002)
            ├── Payment Service (4001)
            │       ├── Auth Service
            │       └── Wallet Service (4004)
            ├── Catalog Service (4007)
            │       └── Search Service (4008)
            ├── Delivery Service (4009)
            └── Event Bus (4075)
                    ├── Notification Service (4011)
                    ├── Genie Memory (4703)
                    └── Analytics (4016)

SUTAR OS
    ├── HOJAI Gateway (4500)
    ├── Intent Bus (4154)
    ├── Negotiation Engine (4191)
    ├── Trust Engine (4180)
    ├── ContractOS (4190)
    ├── Decision Engine (4240)
    └── SimulationOS (4241)
            └── HOJAI Intelligence (4530)
```

## C. Quick Reference Commands

```bash
# Health checks
curl http://localhost:4000/health    # API Gateway
curl http://localhost:4002/health    # Auth
curl http://localhost:4018/health    # Intent Predictor
curl http://localhost:4154/health    # SUTAR Intent Bus
curl http://localhost:4240/health    # SUTAR Decision Engine
curl http://localhost:4703/health    # Genie Memory

# Start services
cd hojai-ai/hojai-sutar-os && ./start-all.sh
docker-compose up -d

# Check logs
kubectl logs -n rtnm-ecosystem -l app=api-gateway --tail=100
docker logs -f api-gateway
```

---

**Document Version:** 1.0
**Last Updated:** June 11, 2026
**Maintained By:** RTNM Digital Architecture Team
**Status:** Production Ready