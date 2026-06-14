# StayOwn Hospitality - Architecture Documentation

**Version:** 1.0 | **Date:** June 10, 2026

---

## Executive Summary

StayOwn Hospitality is an AI-native hotel management system built on the HOJAI AI infrastructure. It transforms traditional hotel operations into an autonomous, guest-centric experience where AI agents handle routine tasks, anticipate guest needs, and enable seamless experiences like zero-checkout.

## Design Principles

1. **Guest-First**: Every architectural decision prioritizes the guest experience
2. **AI-Native**: AI is not an add-on but the core operating system
3. **Event-Driven**: Services communicate through an event bus for loose coupling
4. **Privacy-Preserving**: Guest data is protected with granular controls
5. **Scalable**: Designed for single properties to hotel chains

---

## System Architecture

### High-Level View

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              STAYOWN HOSPITALITY                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        GUEST EXPERIENCE LAYER                        │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │   │
│  │  │  Mobile App │  │  Web App    │  │  Chat Bot   │  │ Voice Agent│  │   │
│  │  │  (Native)   │  │  (PWA)      │  │  (WhatsApp) │  │  (Phone)   │  │   │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  │   │
│  └─────────┼────────────────┼────────────────┼────────────────┼──────────┘   │
│            │                │                │                │              │
│            └────────────────┼────────────────┼────────────────┘              │
│                             │                │                              │
│                             ▼                ▼                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      API GATEWAY (Port 3800)                        │   │
│  │         Authentication, Rate Limiting, Routing, Caching              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                             │                                              │
│  ┌──────────────────────────┼──────────────────────────────────────────┐   │
│  │                     SERVICES LAYER                                  │   │
│  │  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐     │   │
│  │  │   Guest Twin     │ │ Hotel Business   │ │   Event Bus      │     │   │
│  │  │   Service       │ │ Twin Service     │ │   Service        │     │   │
│  │  │   (3810)        │ │ (3811)          │ │   (3812)         │     │   │
│  │  └──────────────────┘ └──────────────────┘ └──────────────────┘     │   │
│  │  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐     │   │
│  │  │ Billing Service │ │ Maintenance AI  │ │  Procurement     │     │   │
│  │  │ (3816)         │ │ (3815)         │ │  Service (3814) │     │   │
│  │  └──────────────────┘ └──────────────────┘ └──────────────────┘     │   │
│  │  ┌──────────────────┐ ┌──────────────────┐                         │   │
│  │  │ Zero Checkout    │ │ Housekeeping     │                         │   │
│  │  │ (3817)          │ │ Service          │                         │   │
│  │  └──────────────────┘ └──────────────────┘                         │   │
│  └──────────────────────────┼──────────────────────────────────────────┘   │
│                             │                                              │
│  ┌──────────────────────────┼──────────────────────────────────────────┐   │
│  │                     DATA LAYER                                       │   │
│  │  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐     │   │
│  │  │   MongoDB       │ │   Redis          │ │   HOJAI Memory   │     │   │
│  │  │   (Primary DB)  │ │   (Cache/Queue)  │ │   (Vector Store) │     │   │
│  │  └──────────────────┘ └──────────────────┘ └──────────────────┘     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     HOJAI CORE LAYER                                 │   │
│  │  CorpID (4501) │ Memory (4520) │ Event Bus (4510) │ Agents (4550)   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Service Details

### 1. Guest Twin Service (Port 3810)

**Purpose:** Create and maintain personalized AI twins for hotel guests

```
┌────────────────────────────────────────────────────────────┐
│                    GUEST TWIN SERVICE                      │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Preference │  │    Stay     │  │   Insight   │         │
│  │   Engine   │  │   Manager   │  │  Generator │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
│         │                │                │                  │
│         └────────────────┼────────────────┘                  │
│                          │                                 │
│                    ┌─────▼─────┐                          │
│                    │  Guest    │                          │
│                    │   Twin    │                          │
│                    │   Model   │                          │
│                    └─────┬─────┘                          │
│                          │                                 │
│         ┌────────────────┼────────────────┐               │
│         │                │                │                │
│         ▼                ▼                ▼                │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │  Room      │  │  Service  │  │   Stay    │            │
│  │ Preferences│  │  Preferences│ │  Patterns │            │
│  └────────────┘  └────────────┘  └────────────┘            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Key Features:**
- Learns from stay history, interactions, feedback
- Generates personalized recommendations
- Syncs with HOJAI Memory for persistence
- Real-time preference updates via Event Bus

### 2. Hotel Business Twin Service (Port 3811)

**Purpose:** AI twin for hotel operations and business intelligence

```
┌────────────────────────────────────────────────────────────┐
│                 HOTEL BUSINESS TWIN SERVICE                 │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │   Metrics   │  │  Prediction │  │Recommendation│       │
│  │  Collector │  │    Engine   │  │    Engine   │       │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘       │
│         │                │                │                  │
│         └────────────────┼────────────────┘                  │
│                          │                                 │
│                    ┌─────▼─────┐                          │
│                    │  Hotel    │                          │
│                    │ Business  │                          │
│                    │   Twin    │                          │
│                    └─────┬─────┘                          │
│                          │                                 │
│         ┌────────────────┼────────────────┐               │
│         │                │                │                │
│         ▼                ▼                ▼                │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐           │
│  │ Operations │  │  Revenue   │  │   Guest    │           │
│  │  Metrics   │  │   Metrics  │  │  Experience│           │
│  └────────────┘  └────────────┘  └────────────┘           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Key Metrics:**
- Occupancy Rate
- Average Daily Rate (ADR)
- Revenue Per Available Room (RevPAR)
- Guest Satisfaction Score
- Staff Productivity
- Maintenance KPIs

### 3. Event Bus Service (Port 3812)

**Purpose:** Central nervous system for real-time event streaming

```
┌────────────────────────────────────────────────────────────┐
│                      EVENT BUS SERVICE                     │
├────────────────────────────────────────────────────────────┤
│                                                             │
│                    ┌─────────────────┐                     │
│                    │   Event Router  │                     │
│                    └────────┬────────┘                     │
│                             │                               │
│         ┌───────────────────┼───────────────────┐          │
│         │                   │                   │           │
│         ▼                   ▼                   ▼           │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │  Pub/Sub   │    │  WebSocket  │    │   History   │     │
│  │  (Redis)   │    │   Server    │    │   Storage   │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                             │
│  Event Types:                                               │
│  • guest.* (8 events)                                       │
│  • room.* (8 events)                                        │
│  • housekeeping.* (6 events)                                │
│  • maintenance.* (6 events)                                │
│  • billing.* (5 events)                                    │
│  • booking.* (4 events)                                     │
│  • staff.* (5 events)                                       │
│  • system.* (2 events)                                      │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

### 4. Zero Checkout Service (Port 3817)

**Purpose:** Enable frictionless automated checkout

```
┌────────────────────────────────────────────────────────────┐
│                   ZERO CHECKOUT SERVICE                     │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │   Billing   │  │  Payment    │  │   Invoice   │       │
│  │  Calculator │  │  Processor  │  │  Generator  │       │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘       │
│         │                │                │                  │
│         └────────────────┼────────────────┘                  │
│                          │                                 │
│                    ┌─────▼─────┐                          │
│                    │  Checkout │                          │
│                    │ Orchestr. │                          │
│                    └─────┬─────┘                          │
│                          │                                 │
│         ┌────────────────┼────────────────┐               │
│         │                │                │                │
│         ▼                ▼                ▼                │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐           │
│  │  Billing   │  │  Payment   │  │    Key     │           │
│  │   Summary  │  │   Receipt  │  │  Revocation│           │
│  └────────────┘  └────────────┘  └────────────┘           │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

**Checkout Flow:**
1. Calculate final bill from all charges
2. Process payment automatically or via guest confirmation
3. Generate invoice
4. Revoke digital key access
5. Trigger post-checkout sequences

### 5. Maintenance AI (Port 3815)

**Purpose:** Intelligent maintenance request handling

```
┌────────────────────────────────────────────────────────────┐
│                    MAINTENANCE AI SERVICE                  │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │   AI        │  │  Priority   │  │  Scheduled  │       │
│  │  Diagnoser  │  │   Engine    │  │ Maintenance │       │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘       │
│         │                │                │                  │
│         └────────────────┼────────────────┘                  │
│                          │                                 │
│                    ┌─────▼─────┐                          │
│                    │  Work     │                          │
│                    │  Order    │                          │
│                    │  Manager  │                          │
│                    └─────┬─────┘                          │
│                          │                                 │
│         ┌────────────────┼────────────────┐               │
│         │                │                │                │
│         ▼                ▼                ▼                │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐          │
│  │  Request  │  │   Parts    │  │   Staff    │          │
│  │  Tracking │  │  Ordering  │  │  Scheduling│          │
│  └────────────┘  └────────────┘  └────────────┘          │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

---

## Data Architecture

### Primary Data Stores

```
┌─────────────────────────────────────────────────────────────────┐
│                        DATA STORES                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                        MONGODB                             │   │
│  │  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐ │   │
│  │  │ guests         │ │ bookings       │ │ maintenance    │ │   │
│  │  │ - profile      │ │ - check-in     │ │ - requests     │ │   │
│  │  │ - preferences  │ │ - check-out    │ │ - schedules    │ │   │
│  │  │ - twin data    │ │ - charges      │ │ - history      │ │   │
│  │  └────────────────┘ └────────────────┘ └────────────────┘ │   │
│  │  ┌────────────────┐ ┌────────────────┐                      │   │
│  │  │ rooms          │ │ staff          │                      │   │
│  │  │ - status       │ │ - schedules    │                      │   │
│  │  │ - inventory    │ │ - assignments  │                      │   │
│  │  │ - maintenance   │ │ - performance │                      │   │
│  │  └────────────────┘ └────────────────┘                      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                         REDIS                              │   │
│  │  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐ │   │
│  │  │ Session Cache  │ │ Event Queue    │ │ Rate Limiting  │ │   │
│  │  │ - guest session │ │ - pub/sub      │ │ - API limits   │ │   │
│  │  │ - auth tokens  │ │ - streaming    │ │ - quotas       │ │   │
│  │  └────────────────┘ └────────────────┘ └────────────────┘ │   │
│  │  ┌────────────────┐ ┌────────────────┐                      │   │
│  │  │ Room Status    │ │ Live Metrics   │                      │   │
│  │  │ - availability │ │ - occupancy    │                      │   │
│  │  │ - cleaning     │ │ - revenue      │                      │   │
│  │  └────────────────┘ └────────────────┘                      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    HOJAI MEMORY                            │   │
│  │  ┌────────────────┐ ┌────────────────┐                    │   │
│  │  │ Guest Memory   │ │ Hotel Knowledge │                    │   │
│  │  │ - preferences  │ │ - policies      │                    │   │
│  │  │ - history      │ │ - procedures    │                    │   │
│  │  │ - insights     │ │ - FAQ           │                    │   │
│  │  └────────────────┘ └────────────────┘                    │   │
│  │  Vector Embeddings for Semantic Search                     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Security Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       SECURITY LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                     AUTHENTICATION                         │   │
│  │                                                              │   │
│  │   Guest Auth              │  Staff Auth                    │   │
│  │   ├── OTP via SMS/WhatsApp│  ├── CorpID SSO               │   │
│  │   ├── Magic Link          │  ├── MFA                      │   │
│  │   ├── Biometric (App)     │  ├── Role-based access        │   │
│  │   └── Digital Key         │  └── Session management       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                     AUTHORIZATION                         │   │
│  │                                                              │   │
│  │   Role-Based Access Control (RBAC)                         │   │
│  │   ┌─────────────────────────────────────────────────────┐  │   │
│  │   │  guest    │  staff    │ manager  │ admin          │  │   │
│  │   ├───────────┼───────────┼───────────┼────────────────┤  │   │
│  │   │ own data  │ dept data │ all hotel │ all systems   │  │   │
│  │   └─────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                       DATA SECURITY                       │   │
│  │                                                              │   │
│  │   • Encryption at rest (AES-256)                          │   │
│  │   • Encryption in transit (TLS 1.3)                        │   │
│  │   • Guest data isolation per hotel                         │   │
│  │   • PII masking and anonymization                          │   │
│  │   • GDPR/PDPA compliant data handling                     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Scalability Design

### Horizontal Scaling

```
                    ┌─────────────┐
                    │   Load      │
                    │   Balancer  │
                    └──────┬──────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼
  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
  │  Instance 1 │  │  Instance 2 │  │  Instance 3 │
  │  Guest Twin  │  │  Guest Twin │  │  Guest Twin │
  └─────────────┘  └─────────────┘  └─────────────┘
         │                 │                 │
         └─────────────────┼─────────────────┘
                           │
                    ┌──────▼──────┐
                    │   MongoDB   │
                    │   Cluster   │
                    └─────────────┘
```

### Database Sharding Strategy

- **By Hotel**: Each hotel's data on dedicated shards for isolation
- **By Time**: Historical data archived to cold storage
- **By Entity**: Guest data, booking data, operational data in separate collections

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     DEPLOYMENT TARGETS                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐   │
│  │   DEVELOPMENT   │  │    STAGING     │  │   PRODUCTION   │   │
│  │                 │  │                │  │                 │   │
│  │ Docker Compose  │  │  K8s Cluster  │  │  K8s Cluster   │   │
│  │ - MongoDB       │  │ - 3 replicas   │  │ - Auto-scaling │   │
│  │ - Redis         │  │ - CI/CD        │  │ - Blue/Green   │   │
│  │ - All Services  │  │ - Load test    │  │ - Canary       │   │
│  │                 │  │                │  │ - Monitoring    │   │
│  └────────────────┘  └────────────────┘  └────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Monitoring & Observability

### Metrics Collected

| Category | Metrics |
|----------|---------|
| **Infrastructure** | CPU, Memory, Disk, Network |
| **Application** | Request rate, Error rate, Latency |
| **Business** | Check-ins, Check-outs, Revenue |
| **AI/ML** | Prediction accuracy, Twin learning rate |

### Alerting

- **Critical**: Service down, payment failures, security breaches
- **Warning**: High latency, low availability, capacity issues
- **Info**: Scheduled maintenance, daily reports

---

## Technology Stack

| Component | Technology |
|-----------|------------|
| Runtime | Node.js 20 LTS |
| Framework | Express.js |
| Database | MongoDB 7.0 |
| Cache | Redis 7.2 |
| Vector Store | HOJAI Memory (Pinecone) |
| Event Bus | Redis Pub/Sub + Socket.IO |
| Authentication | JWT + CorpID |
| Container | Docker + Kubernetes |
| CI/CD | GitHub Actions |
| Monitoring | Prometheus + Grafana |

---

## Future Roadmap

### Phase 2 (Q3 2026)
- [ ] Voice-first guest interaction
- [ ] Predictive housekeeping scheduling
- [ ] Automated inventory ordering
- [ ] Multi-property management

### Phase 3 (Q4 2026)
- [ ] AI concierge agent
- [ ] Dynamic pricing engine
- [ ] Guest journey analytics
- [ ] Mobile staff app with AR

### Phase 4 (2027)
- [ ] Blockchain-based loyalty
- [ ] Metaverse virtual tours
- [ ] Predictive maintenance sensors
- [ ] Autonomous room service robots

---

**Document Version:** 1.0
**Last Updated:** June 10, 2026
**Author:** HOJAI AI Architecture Team
