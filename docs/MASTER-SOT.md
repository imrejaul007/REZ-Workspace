# HOJAI AI - MASTER SOURCE OF TRUTH (SOT)
**Version:** 3.0 | **Date:** May 30, 2026 | **Status:** COMPLETE

---

# POSITIONING

```
HOJAI AI

Operational AI Infrastructure Company

Building AI Operating Systems
for organizations and individuals.
```

---

# ARCHITECTURE

```
HOJAI AI
│
├── HOJAI CORE (12 Platforms) - 4500-4610
│   ├── API Gateway (4500)
│   ├── Governance (4501)
│   ├── Event (4510)
│   ├── Memory (4520)
│   ├── Intelligence (4530)
│   ├── Agents (4550)
│   ├── Workflows (4560)
│   ├── Communications (4570)
│   ├── Hyperlocal (4580)
│   ├── Data (4590)
│   ├── Identity (4600)
│   └── Analytics (4610)
│
├── ML PLATFORM (10 Services) - 4710-4742
│   ├── Feature Store (4710)
│   ├── Model Registry (4711)
│   ├── Model Router (4712)
│   ├── Embedding Service (4720)
│   ├── pgvector Service (4721)
│   ├── LLM Providers (4730)
│   ├── RAG Pipeline (4731)
│   ├── Churn Model (4740)
│   ├── LTV Model (4741)
│   └── Recommendation Engine (4742)
│
├── GENIE (5 Services) - 4561, 4702-4707
│   ├── Hojai Flow (4561)
│   ├── Genie Relationship (4702)
│   ├── Genie Briefing (4704)
│   ├── Genie Privacy (4706)
│   └── Genie Sync (4707)
│
├── EXTENDED (8 Services) - 4800-4870
│   ├── Unified Gateway (4800)
│   ├── Graph (4810)
│   ├── Workforce (4820)
│   ├── Billing (4830)
│   ├── Studio (4840)
│   ├── CorpOS (4850)
│   ├── Twin (4860)
│   └── Board (4870)
│
└── PRODUCTS
    ├── Merchant AI OS
    ├── Enterprise AI OS
    └── Genie Personal AI OS
```

---

# 12 HOJAI CORE PLATFORMS

| Port | Platform | Purpose |
|------|----------|---------|
| 4500 | api-gateway | Routing, auth, rate limiting |
| 4501 | governance | RBAC, audit, permissions |
| 4510 | event | Event bus |
| 4520 | memory | Organizational brain |
| 4530 | intelligence | ML predictions |
| 4550 | agents | AI employees |
| 4560 | workflows | Automation |
| 4570 | communications | SMS, Email, WhatsApp |
| 4580 | hyperlocal | Geo intelligence |
| 4590 | data | Canonical models |
| 4600 | identity | Identity resolution |
| 4610 | analytics | BI, dashboards |

---

# ML PLATFORM - 10 SERVICES

## MLOps (3)

| Port | Service | Purpose |
|------|---------|---------|
| 4710 | feature-store | ML feature management |
| 4711 | model-registry | Model versioning |
| 4712 | model-router | Routing to right model |

## Vector (2)

| Port | Service | Purpose |
|------|---------|---------|
| 4720 | embedding-service | Text embeddings |
| 4721 | pgvector-service | Vector storage + similarity search |

## LLM (2)

| Port | Service | Purpose |
|------|---------|---------|
| 4730 | providers | LLM provider management |
| 4731 | rag | RAG pipeline |

## Models (3)

| Port | Service | Purpose |
|------|---------|---------|
| 4740 | churn-model | Churn prediction |
| 4741 | ltv-model | LTV prediction |
| 4742 | recommendation-engine | Product/user recommendations |

---

# GENIE - 5 SERVICES

| Port | Service | Purpose |
|------|---------|---------|
| 4561 | hojai-flow | Voice-first AI companion |
| 4702 | genie-relationship | Personal relationships |
| 4704 | genie-briefing | Daily briefings |
| 4706 | genie-privacy | Privacy model |
| 4707 | genie-sync | Cross-device sync |

---

# PRODUCTS

## Merchant AI OS

**For:** SMBs (salons, clinics, restaurants, jewellery)

| Module | Description |
|--------|-------------|
| Customers | CRM, segmentation |
| Conversations | Chat, messaging |
| Memory | Business knowledge |
| Workflows | Automation |
| AI Employees | Support, Sales agents |
| Campaigns | Marketing automation |
| Analytics | Business insights |
| ROI Dashboard | Investment tracking |

## Enterprise AI OS

**For:** Hospitals, hotels, retail chains

| Module | Description |
|--------|-------------|
| Operations | Workflow automation |
| Staff | AI employees |
| Customers | 360 view |
| Analytics | Enterprise BI |

## Genie Personal AI OS

**For:** Individuals

| Service | Port | Status |
|---------|------|--------|
| Hojai Flow | 4561 | Built |
| Genie Relationship | 4702 | Built |
| Genie Briefing | 4704 | Built |
| Genie Privacy | 4706 | Built |
| Genie Sync | 4707 | Built |

---

# BUILD PRIORITY

| Priority | Product | Reason |
|----------|---------|--------|
| 1 | Merchant AI OS | Easier sales, faster feedback |
| 2 | Genie | Showcases Hojai, consumer visibility |
| 3 | Enterprise AI OS | After infrastructure matures |

---

# ARCHITECTURE PRINCIPLES

1. **12 Core Platforms** - Don't add more platforms to core
2. **ML Platform is Separate** - 10 dedicated ML services
3. **REZ Owns Graphs** - Not 295+ services count
4. **CorpID is Foundation** - Trust layer for all
5. **Products Use Core** - Products sit on top
6. **Stop Redesigning** - Build instead of design

---

# PORT REGISTRY - COMPLETE

## HOJAI Core (4500-4610)

| Port | Owner | Service |
|------|-------|---------|
| 4500 | HOJAI Core | API Gateway |
| 4501 | HOJAI Core | Governance |
| 4510 | HOJAI Core | Event |
| 4515 | HOJAI Core | Signal |
| 4517 | HOJAI Core | HITL |
| 4518 | HOJAI Core | Trust |
| 4519 | HOJAI Core | Bridge |
| 4520 | HOJAI Core | Memory |
| 4530 | HOJAI Core | Intelligence |
| 4540 | HOJAI Core | ML (core) |
| 4550 | HOJAI Core | Agents |
| 4560 | HOJAI Core | Workflows |
| 4561 | GENIE | Hojai Flow |
| 4570 | HOJAI Core | Communications |
| 4580 | HOJAI Core | Hyperlocal |
| 4590 | HOJAI Core | Data |
| 4600 | HOJAI Core | Identity |
| 4610 | HOJAI Core | Analytics |

## ML Platform (4710-4742)

| Port | Owner | Service |
|------|-------|---------|
| 4710 | HOJAI ML | Feature Store |
| 4711 | HOJAI ML | Model Registry |
| 4712 | HOJAI ML | Model Router |
| 4720 | HOJAI ML | Embedding Service |
| 4721 | HOJAI ML | pgvector Service |
| 4730 | HOJAI ML | LLM Providers |
| 4731 | HOJAI ML | RAG |
| 4740 | HOJAI ML | Churn Model |
| 4741 | HOJAI ML | LTV Model |
| 4742 | HOJAI ML | Recommendation Engine |

## GENIE (4702-4707)

| Port | Owner | Service |
|------|-------|---------|
| 4702 | GENIE | Relationship |
| 4704 | GENIE | Briefing |
| 4706 | GENIE | Privacy |
| 4707 | GENIE | Sync |

## Extended (4800-4870)

| Port | Owner | Service |
|------|-------|---------|
| 4800 | HOJAI | Unified Gateway |
| 4810 | HOJAI | Graph |
| 4820 | HOJAI | Workforce |
| 4830 | HOJAI | Billing |
| 4832 | HOJAI | Unified SDK |
| 4840 | HOJAI | Studio |
| 4850 | HOJAI | CorpOS |
| 4860 | HOJAI | Twin |
| 4870 | HOJAI | Board |

---

# DOCUMENTATION

| Document | Purpose |
|----------|---------|
| MASTER-SOT.md | This document |
| COMPLETE-HOJAI-DOCUMENTATION.md | Full documentation |
| PITCH-DECK.md | Investor deck |
| ONE-PAGER.md | One-page summary |

---

# SERVICE COUNT

| Category | Count |
|---------|-------|
| HOJAI Core (12 platforms) | 15 services |
| ML Platform (10) | 10 services |
| GENIE (5) | 5 services |
| Extended | 8 services |
| Support | 5 services |
| **TOTAL** | **43+ services** |

---

*Version: 3.0*
*Last Updated: May 30, 2026*
*Status: COMPLETE*

---

# AI EMPLOYEES (19+)

## REZ Agents (8)

| Agent | Port | Purpose |
|-------|------|---------|
| Sales Agent | 4066 | Lead qualification |
| Support Agent | - | FAQ, tickets |
| Fraud Agent | - | Anomaly detection |
| Info Agent | - | Knowledge retrieval |
| Consultant Agent | - | Business advice |
| Commerce Agents | - | E-commerce |
| Planning Agent | - | Scheduling |
| Research Agent | - | Research |

## Industry Agents (4)

| Agent | Industry | Purpose |
|-------|----------|---------|
| Bridal Advisor | Jewelry | Conversion |
| Gold Cycle Agent | Jewelry | Patterns |
| No-Show Predictor | Healthcare | Appointments |
| Adherence Agent | Healthcare | Treatment |

## Genie Agents (5)

| Agent | Purpose |
|-------|---------|
| Executive Genie | Schedule, priorities |
| Research Genie | Information |
| Travel Genie | Booking |
| Health Genie | Wellness |
| Finance Genie | Bills |

## HOJAI Agent Types (9)

| Type | Description |
|------|-------------|
| demand_signal | Market demand |
| scarcity | Inventory |
| personalization | User preferences |
| attribution | Conversions |
| adaptive_scoring | Dynamic scores |
| feedback_loop | Feedback |
| network_effect | Growth |
| revenue_attribution | Revenue |
| custom | Build your own |

---

*AI Employees: 19+ Built*

---

# AI EMPLOYEES - COMPLETE CATALOG

## By Autonomy Level

| Level | Name | Count | Built |
|-------|------|-------|-------|
| L1 | Assistants | 7 | 0 |
| L2 | Specialists | 30+ | 3 |
| L3 | Autonomous | 12+ | 2 |
| L4 | Managers | 8+ | 0 |
| Industry | Experts | 25+ | 2 |
| REZ | Ecosystem | 25+ | 1 |
| **Total** | | **250+** | **8** |

## Expert Employees (Priority)

| Employee | Type | Status |
|----------|-------|--------|
| Restaurant Growth Consultant | Industry | ❌ |
| Salon Growth Consultant | Industry | ❌ |
| Merchant CFO | REZ | ❌ |
| Clinic Growth Consultant | Industry | ❌ |
| Gym Growth Consultant | Industry | ❌ |
| Hotel Revenue Manager | Industry | ❌ |
| Jewelry Growth Consultant | Industry | ✅ |
| Healthcare Agents | Industry | ✅ |

## Build Priority

1. L1 Assistants (Executive, Research)
2. Industry Experts (Restaurant, Salon)
3. REZ Experts (Merchant CFO)
4. L2 Specialists (SDR, Marketing)


---

# AI EMPLOYEES BUILT (12)

## Expert Employees

| Port | Employee | Purpose | Status |
|------|----------|---------|--------|
| 4755 | executive-assistant | Calendar, email, notes | ✅ Built |
| 4756 | research-assistant | Market research, reports | ✅ Built |
| 4757 | sdr-agent | Prospect finding, qualification | ✅ Built |
| 4758 | restaurant-growth-consultant | Restaurant specialist | ✅ Built |
| 4759 | salon-growth-consultant | Salon specialist | ✅ Built |
| 4760 | ai-support-agent | 24x7 support | ✅ Built |
| 4761 | marketing-agent | Content, campaigns | ✅ Built |
| 4762 | hr-recruiter-agent | Screening, onboarding | ✅ Built |
| 4763 | gym-growth-consultant | Gym specialist | ✅ Built |
| 4764 | hotel-revenue-manager | Hotel specialist | ✅ Built |
| 4765 | merchant-cfo | Merchant finance | ✅ Built |
| 4766 | content-agent | Content generation | ✅ Built |

## Build Plan

See docs/BUILD-PLAN-AI-EMPLOYEES.md for 315 employees plan.


---

# AI EMPLOYEES (46 BUILT)

## Complete Employee Catalog

| Port | Employee | Type | Status |
|------|----------|------|--------|
| 4755 | executive-assistant | L1 | ✅ |
| 4756 | research-assistant | L1 | ✅ |
| 4757 | sdr-agent | L2 | ✅ |
| 4758 | restaurant-growth-consultant | Industry | ✅ |
| 4759 | salon-growth-consultant | Industry | ✅ |
| 4760 | ai-support-agent | L2 | ✅ |
| 4761 | marketing-agent | L2 | ✅ |
| 4762 | hr-recruiter-agent | L2 | ✅ |
| 4763 | gym-growth-consultant | Industry | ✅ |
| 4764 | hotel-revenue-manager | Industry | ✅ |
| 4765 | merchant-cfo | REZ | ✅ |
| 4766 | content-agent | L2 | ✅ |
| 4767 | clinic-growth-consultant | Industry | ✅ |
| 4768 | ecommerce-manager | Industry | ✅ |
| 4769 | writing-assistant | L1 | ✅ |
| 4770 | meeting-assistant | L1 | ✅ |
| 4771 | appointment-setter | L2 | ✅ |
| 4772 | proposal-agent | L2 | ✅ |
| 4773 | followup-agent | L2 | ✅ |
| 4774 | renewal-agent | L2 | ✅ |
| 4775 | seo-agent | L2 | ✅ |
| 4776 | ads-agent | L2 | ✅ |
| 4777 | social-agent | L2 | ✅ |
| 4778 | interview-agent | L2 | ✅ |
| 4779 | onboarding-agent | L2 | ✅ |
| 4780 | jewelry-growth-consultant | Industry | ✅ |
| 4781 | accountant-ai | L3 | ✅ |
| 4782 | collections-agent | L3 | ✅ |
| 4783 | receptionist-ai | L3 | ✅ |
| 4784 | care-manager | Industry | ✅ |
| 4785 | ops-manager | L4 | ✅ |
| 4786 | procurement-agent | L3 | ✅ |
| 4787 | legal-assistant | L1 | ✅ |
| 4788 | data-analyst | L1 | ✅ |
| 4789 | community-manager | Industry | ✅ |
| 4790 | loyalty-manager | L2 | ✅ |
| 4791 | concierge-ai | Industry | ✅ |
| 4792 | creator-manager | REZ | ✅ |
| 4793 | campaign-manager | REZ | ✅ |
| 4794 | attribution-analyst | REZ | ✅ |
| 4795 | career-coach | MyTalent | ✅ |
| 4796 | safety-coordinator | BuzzLocal | ✅ |
| 4797 | fraud-investigator | CorpID | ✅ |
| 4798 | property-advisor | Real Estate | ✅ |
| 4799 | admission-counselor | Education | ✅ |
| 4800 | placement-officer | Education | ✅ |

**Total: 46 AI Employees Built**
**Ports: 4755-4800**

