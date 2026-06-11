# SUTAR OS - Canonical Architecture v2.0

**Version:** 2.0 | **Date:** June 10, 2026  
**Status:** CANONICAL MODEL (Approved after architectural review)

---

## Executive Summary

SUTAR OS is **Autonomous Economic Infrastructure** — not just workflow automation.

```
AWS = Cloud Infrastructure
Stripe = Financial Infrastructure
Nexha = Commerce Infrastructure
SUTAR = Autonomous Economic Infrastructure
```

---

## Core Insight

> **Agents don't know each other. They know the network.**

Just like humans use search, reviews, trust, negotiation, and contracts — SUTAR agents do the same thing automatically, 24/7, without human intervention.

---

## Canonical Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                     SUTAR OS - AUTONOMOUS ECONOMIC FLOW                          │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                         LAYER 1: TRIGGER                                   │ │
│  │                                                                             │ │
│  │    Human Goal: "Increase profit by 20%"                                  │ │
│  │                          OR                                                  │ │
│  │    System Event: "Inventory below threshold"                             │ │
│  │                          OR                                                  │ │
│  │    External Intent: "Need supplier for tomatoes"                          │ │
│  │                                                                             │ │
│  └──────────────────────────────────┬──────────────────────────────────────────┘ │
│                                      │                                              │
│                                      ▼                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                         LAYER 2: INTENT                                    │ │
│  │                                                                             │ │
│  │    Intent Graph (4018)                                                      │ │
│  │    • Captures all intents                                                 │ │
│  │    • Pattern recognition                                                   │ │
│  │    • Context enrichment                                                    │ │
│  │                                                                             │ │
│  │    {                                                                       │ │
│  │      "type": "PROCUREMENT",                                               │ │
│  │      "product": "tomatoes",                                               │ │
│  │      "quantity": "100kg"                                                  │ │
│  │      "urgency": "high"                                                    │ │
│  │      "budget": 4000                                                       │ │
│  │    }                                                                       │ │
│  │                                                                             │ │
│  └──────────────────────────────────┬──────────────────────────────────────────┘ │
│                                      │                                              │
│                                      ▼                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                         LAYER 3: GOALOS                                     │ │
│  │                                                                             │ │
│  │    GoalOS (4242)                                                            │ │
│  │    • Decompose high-level goals into sub-goals                            │ │
│  │    • Prioritize and sequence                                               │ │
│  │    • Set success metrics                                                    │ │
│  │                                                                             │ │
│  │    "Increase profit by 20%"                                                │ │
│  │         │                                                                    │ │
│  │         ├──► Revenue Goal: +25%                                            │ │
│  │         ├──► Cost Goal: -10%                                               │ │
│  │         ├──► Pricing Goal: +5%                                              │ │
│  │         └──► Efficiency Goal: +5%                                           │ │
│  │                                                                             │ │
│  └──────────────────────────────────┬──────────────────────────────────────────┘ │
│                                      │                                              │
│                                      ▼                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                         LAYER 4: DECISION ENGINE                            │ │
│  │                                                                             │ │
│  │    Decision Engine (4240)                                                   │ │
│  │    • Should we do this?                                                    │ │
│  │    • Is it within policy?                                                  │ │
│  │    • What are the risks?                                                   │ │
│  │                                                                             │ │
│  │    Questions before discovery:                                                │ │
│  │    • Do we really need it?                                                  │ │
│  │    • Is this the right time?                                                │ │
│  │    • Are we authorized to proceed?                                          │ │
│  │                                                                             │ │
│  │    Decision: PROCEED | HOLD | REJECT                                        │ │
│  │                                                                             │ │
│  └──────────────────────────────────┬──────────────────────────────────────────┘ │
│                                      │                                              │
│                                      ▼                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                         LAYER 5: SIMULATIONOS                               │ │
│  │                                                                             │ │
│  │    SimulationOS (4241)                                                       │ │
│  │    • What-if analysis                                                       │ │
│  │    • Scenario testing                                                       │ │
│  │    • Impact prediction                                                      │ │
│  │                                                                             │ │
│  │    Before buying:                                                            │ │
│  │    • "What if prices drop 10%?"                                            │ │
│  │    • "What if we order 200kg instead of 100kg?"                           │ │
│  │    • "What if we delay 1 week?"                                           │ │
│  │                                                                             │ │
│  │    Output: Recommended action + confidence score                             │ │
│  │                                                                             │ │
│  └──────────────────────────────────┬──────────────────────────────────────────┘ │
│                                      │                                              │
│                                      ▼                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                         LAYER 6: DISCOVERY                                 │ │
│  │                                                                             │ │
│  │    Agent Network (4155) + Marketplace (4250)                              │ │
│  │    • Capability matching                                                    │ │
│  │    • Location filtering                                                    │ │
│  │    • Category search                                                       │ │
│  │                                                                             │ │
│  │    Discovery Methods:                                                       │ │
│  │    1. Category Match: "Who provides tomatoes?"                             │ │
│  │    2. Capability Match: "Who can deliver tomorrow?"                         │ │
│  │    3. Location Match: "Who is within 100km?"                               │ │
│  │    4. Trust Filter: "Whose score is >80?"                                  │ │
│  │                                                                             │ │
│  │    Output: Qualified agents: A, B, C, D                                     │ │
│  │                                                                             │ │
│  └──────────────────────────────────┬──────────────────────────────────────────┘ │
│                                      │                                              │
│                                      ▼                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                         LAYER 7: NEGOTIATION                               │ │
│  │                                                                             │ │
│  │    Negotiation Engine (4191)                                                │ │
│  │    • RFQ (Request for Quote)                                               │ │
│  │    • Counter-offer exchange                                                │ │
│  │    • Terms negotiation                                                     │ │
│  │                                                                             │ │
│  │    AXP Protocol Messages:                                                   │ │
│  │                                                                             │ │
│  │    Restaurant Agent ──► RFQ ───────────────────────────► Supplier A        │ │
│  │              ◄─── Quote ₹36/kg ────────────────────────────              │ │
│  │              ──── Counter ₹34/kg ──────────────────────► Supplier A        │ │
│  │              ◄─── Accept ₹35/kg ─────────────────────────────             │ │
│  │                                                                             │ │
│  └──────────────────────────────────┬──────────────────────────────────────────┘ │
│                                      │                                              │
│                                      ▼                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                         LAYER 8: TRUST                                      │ │
│  │                                                                             │ │
│  │    Trust Engine (4180)                                                     │ │
│  │    • Credit score verification                                              │ │
│  │    • Trust score validation                                                 │ │
│  │    • Payment history check                                                  │ │
│  │    • Dispute rate analysis                                                  │ │
│  │    • Delivery success rate                                                   │ │
│  │                                                                             │ │
│  │    Trust Metrics:                                                          │ │
│  │    • Supplier A = 92 (PASS)                                                │ │
│  │    • Supplier B = 78 (PASS)                                               │ │
│  │    • Supplier C = 58 (FAIL - removed)                                      │ │
│  │                                                                             │ │
│  └──────────────────────────────────┬──────────────────────────────────────────┘ │
│                                      │                                              │
│                                      ▼                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                         LAYER 9: CONTRACT                                   │ │
│  │                                                                             │ │
│  │    ContractOS (4190)                                                       │ │
│  │    • Smart contract generation                                              │ │
│  │    • Digital signatures                                                     │ │
│  │    • Terms & conditions                                                     │ │
│  │    • Compliance checks                                                       │ │
│  │                                                                             │ │
│  │    {                                                                       │ │
│  │      "contractId": "CTR-789",                                              │ │
│  │      "buyer": "Restaurant Agent",                                           │ │
│  │      "seller": "Supplier A",                                               │ │
│  │      "product": "Tomatoes",                                                 │ │
│  │      "quantity": "100kg",                                                  │ │
│  │      "price": "₹35/kg",                                                   │ │
│  │      "total": "₹3,500",                                                   │ │
│  │      "signatures": { "buyer": "✓", "seller": "✓" }                       │ │
│  │    }                                                                       │ │
│  │                                                                             │ │
│  └──────────────────────────────────┬──────────────────────────────────────────┘ │
│                                      │                                              │
│                                      ▼                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                         LAYER 10: ECONOMY                                   │ │
│  │                                                                             │ │
│  │    EconomyOS (4251)                                                         │ │
│  │    • Karma points allocation                                                │ │
│  │    • Platform fee calculation                                               │ │
│  │    • Earnings tracking                                                     │ │
│  │    • Billing & payments                                                    │ │
│  │                                                                             │ │
│  │    Transaction:                                                            │ │
│  │    • Supplier earned: ₹3,500                                               │ │
│  │    • Platform fee: ₹525 (15%)                                             │ │
│  │    • Buyer paid: ₹4,025                                                    │ │
│  │    • Agent karma: +50 points                                               │ │
│  │                                                                             │ │
│  └──────────────────────────────────┬──────────────────────────────────────────┘ │
│                                      │                                              │
│                                      ▼                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                         LAYER 11: EXECUTION                                 │ │
│  │                                                                             │ │
│  │    Flow + Multi-Agent Coordination                                          │ │
│  │    • Task orchestration                                                    │ │
│  │    • Sequential/parallel execution                                          │ │
│  │    • Error handling & retry                                                 │ │
│  │                                                                             │ │
│  │    Execution Workflow:                                                      │ │
│  │                                                                             │ │
│  │    Step 1: Finance Agent ──► Process payment (₹3,500)                     │ │
│  │                    │                                                        │ │
│  │                    ▼                                                        │ │
│  │    Step 2: Fleet Agent ──► Schedule pickup                                  │ │
│  │                    │                                                        │ │
│  │                    ▼                                                        │ │
│  │    Step 3: Supplier ──► Dispatch goods                                     │ │
│  │                    │                                                        │ │
│  │                    ▼                                                        │ │
│  │    Step 4: Fleet Agent ──► Deliver to restaurant                          │ │
│  │                    │                                                        │ │
│  │                    ▼                                                        │ │
│  │    Step 5: Inventory Agent ──► Update stock (100kg added)                 │ │
│  │                                                                             │ │
│  └──────────────────────────────────┬──────────────────────────────────────────┘ │
│                                      │                                              │
│                                      ▼                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                         LAYER 12: LEARNING                                  │ │
│  │                                                                             │ │
│  │    MemoryOS + Network Learning                                             │ │
│  │    • Transaction stored                                                    │ │
│  │    • Supplier performance logged                                           │ │
│  │    • Price patterns learned                                               │ │
│  │    • Preferences updated                                                    │ │
│  │                                                                             │ │
│  │    TwinOS Updates:                                                         │ │
│  │    • Procurement Twin learns best suppliers                                │ │
│  │    • Finance Twin updates spending patterns                                │ │
│  │    • Network Learning shares insights with other businesses                 │ │
│  │                                                                             │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Internal vs External Marketplace

### Internal Marketplace (Within Company)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     INTERNAL MARKETPLACE                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Company: Restaurant Chain                                                   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    OWNED AGENTS                                        │    │
│  │                                                                      │    │
│  │    ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐      │    │
│  │    │ Booking  │  │Inventory │  │ Kitchen  │  │  Sales   │      │    │
│  │    │  Agent  │  │  Agent   │  │  Agent  │  │  Agent   │      │    │
│  │    └───────────┘  └───────────┘  └───────────┘  └───────────┘      │    │
│  │                                                                      │    │
│  │    ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐      │    │
│  │    │ Finance  │  │Marketing │  │   HR    │  │ Customer │      │    │
│  │    │  Agent  │  │  Agent   │  │  Agent  │  │ Relations│      │    │
│  │    └───────────┘  └───────────┘  └───────────┘  └───────────┘      │    │
│  │                                                                      │    │
│  │    All owned by company. Work together via Event Bus.                │    │
│  │                                                                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  Communication: Event Bus (4510)                                          │
│  Registry: Agent Network (4155)                                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### External Marketplace (Across Nexha)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     EXTERNAL MARKETPLACE (NEXHA)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │ Supplier   │  │Manufacturer│  │Distributor │  │Wholesaler │      │
│  │  Agents   │  │   Agents   │  │   Agents   │  │   Agents   │      │
│  │   500+   │  │   200+    │  │   300+    │  │   100+    │      │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘      │
│                                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │ Logistics  │  │ Marketing   │  │   Legal    │  │  Finance   │      │
│  │   Agents   │  │   Agents    │  │   Agents   │  │   Agents    │      │
│  │   150+    │  │   100+     │  │   50+     │  │   80+     │      │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘      │
│                                                                              │
│  All on Nexha. Available for hire. Discoverable via Agent Network.         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## AXP Protocol (Agent Exchange Protocol)

### Message Types

```typescript
// 1. INTRODUCE - Agent announces capabilities
{
  "type": "INTRODUCE",
  "from": "supplier-agent-001",
  "capabilities": ["tomatoes", "onions", "potatoes"],
  "location": "Nashik, Maharashtra",
  "trustScore": 92
}

// 2. INTENT - Agent publishes need
{
  "type": "INTENT",
  "from": "restaurant-agent",
  "intent": "PROCUREMENT",
  "product": "tomatoes",
  "quantity": 100,
  "unit": "kg",
  "urgency": "high",
  "budget": 4000
}

// 3. RFQ - Request for Quote
{
  "type": "RFQ",
  "from": "restaurant-agent",
  "to": "supplier-agent-001",
  "requestId": "rfq-123",
  "item": { "name": "Tomatoes", "quantity": 100, "unit": "kg" },
  "deadline": "24h"
}

// 4. QUOTE - Supplier response
{
  "type": "QUOTE",
  "from": "supplier-agent-001",
  "to": "restaurant-agent",
  "requestId": "rfq-123",
  "price": 38,
  "currency": "INR",
  "deliveryDays": 1,
  "validUntil": "2024-01-14T00:00:00Z"
}

// 5. COUNTER - Counter offer
{
  "type": "COUNTER",
  "from": "restaurant-agent",
  "to": "supplier-agent-001",
  "requestId": "rfq-123",
  "counterPrice": 34,
  "notes": "Long-term partnership potential"
}

// 6. ACCEPT - Agreement reached
{
  "type": "ACCEPT",
  "from": "supplier-agent-001",
  "to": "restaurant-agent",
  "requestId": "rfq-123",
  "finalPrice": 35
}

// 7. CONTRACT - Smart contract
{
  "type": "CONTRACT",
  "contractId": "CTR-789",
  "parties": ["restaurant-agent", "supplier-agent-001"],
  "terms": {
    "product": "Tomatoes",
    "quantity": 100,
    "price": 35,
    "total": 3500
  },
  "signatures": { "restaurant-agent": "verified", "supplier-agent-001": "verified" }
}

// 8. STATUS_UPDATE - Progress notification
{
  "type": "STATUS_UPDATE",
  "from": "supplier-agent-001",
  "to": "restaurant-agent",
  "contractId": "CTR-789",
  "status": "dispatched",
  "trackingId": "TRK-456"
}

// 9. COMPLETE - Task finished
{
  "type": "COMPLETE",
  "from": "supplier-agent-001",
  "to": "restaurant-agent",
  "contractId": "CTR-789",
  "rating": 5,
  "feedback": "Fresh delivery, on time"
}
```

---

## Infrastructure Services

| Service | Port | Purpose |
|---------|------|---------|
| **Intent Graph** | 4018 | Captures and stores all intents |
| **Agent Network** | 4155 | Registry, discovery, connections |
| **GoalOS** | 4242 | Goal decomposition |
| **Decision Engine** | 4240 | Should we proceed? |
| **SimulationOS** | 4241 | What-if analysis |
| **Marketplace** | 4250 | Agent hiring |
| **Negotiation Engine** | 4191 | Automated bargaining |
| **Trust Engine** | 4180 | Identity & reputation |
| **ContractOS** | 4190 | Smart contracts |
| **EconomyOS** | 4251 | Karma & earnings |
| **Usage Tracker** | 4253 | Task tracking |
| **Event Bus** | 4510 | Message routing |
| **Memory** | 4520 | Learning storage |

---

## Strategic Positioning

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     STRATEGIC POSITIONING                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│    AWS          →  Cloud Infrastructure                                     │
│                   • Compute, Storage, Network                               │
│                                                                              │
│    Stripe       →  Financial Infrastructure                                 │
│                   • Payments, Identity, Compliance                         │
│                                                                              │
│    Nexha        →  Commerce Infrastructure                                 │
│                   • B2B Marketplace, Supply Chain, Trade                    │
│                                                                              │
│    SUTAR        →  Autonomous Economic Infrastructure                      │
│                   • Decision Making                                        │
│                   • Discovery                                              │
│                   • Negotiation                                             │
│                   • Trust                                                  │
│                   • Contracts                                              │
│                   • Economy                                                │
│                   • Learning                                               │
│                                                                              │
│    ══════════════════════════════════════════════════════════════════════     │
│                                                                              │
│    NOT JUST: Workflow Automation                                             │
│                                                                              │
│    BUT:      Agent Economy Network                                        │
│              where thousands of agents can                                 │
│              autonomously find, evaluate, hire,                             │
│              negotiate, contract, and transact                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Key Architectural Principles

### 1. Agents Don't Know Each Other

```
Traditional:     Agent A ────► Agent B
                 (must know each other)

SUTAR:          Agent A ────► Network ────► Agent B
                               ↑
                        (discovers on demand)
```

### 2. GoalOS Before Discovery

```
WRONG:          Intent ────► Discovery ────► Buy

RIGHT:          Intent ────► GoalOS ────► Decision ────► Simulation
                                       │
                                       ▼
                                    Discovery ────► Buy
```

### 3. Trust Before Contract

```
Every transaction requires:
1. Credit check
2. Trust score > threshold
3. Payment history review
4. Dispute rate analysis
5. Delivery success rate
```

### 4. Learning After Every Transaction

```
Every outcome feeds:
1. MemoryOS (event storage)
2. TwinOS (capability updates)
3. Network Learning (collective intelligence)
```

---

## Use Case: Manufacturing Machine Failure

```
Machine Twin detects failure
        │
        ▼
Intent Graph captures: "MAINTENANCE_REQUIRED"
        │
        ▼
GoalOS decomposes:
• Find replacement part
• Evaluate repair vs replace
• Source supplier
• Schedule downtime
        │
        ▼
Decision Engine: "Approved for procurement up to ₹50,000"
        │
        ▼
SimulationOS:
• Option A: Repair (₹20,000, 2 days)
• Option B: Replace (₹45,000, 1 day)
• Option C: Rent (₹5,000/day, immediate)
        │
        ▼
Discovery finds:
• Supplier A (spare parts)
• Supplier B (equipment rental)
• Supplier C (maintenance service)
        │
        ▼
Negotiation Engine:
• RFQ → Quote → Counter → Accept
        │
        ▼
Trust Engine validates suppliers
        │
        ▼
ContractOS creates smart contract
        │
        ▼
Flow executes:
• Order part
• Process payment
• Schedule technician
• Update maintenance log
        │
        ▼
Learning:
• Downtime cost: ₹10,000/day
• Best supplier found
• Preventive maintenance schedule updated
```

---

## Comparison: Multi-Agent Framework vs Agent Economy

| Aspect | Multi-Agent Framework | SUTAR Agent Economy |
|--------|------------------------|---------------------|
| **Focus** | Collaboration | Commerce |
| **Relationships** | Hardcoded | Emergent |
| **Discovery** | Predefined | On-demand |
| **Trust** | Assumed | Validated |
| **Contracts** | Optional | Required |
| **Economy** | None | Built-in |
| **Learning** | Local | Network-wide |
| **Scale** | Few agents | Thousands |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Initial | Basic flow documentation |
| 2.0 | June 10, 2026 | Added GoalOS → Decision → Simulation before Discovery (per architectural review) |

---

## Approval Status

- [x] Architectural Review Complete
- [x] Strategic Positioning Validated
- [x] Internal/External Marketplace Distinction Clarified
- [x] AXP Protocol Documented
- [x] Canonical Model Established

**This document represents the canonical SUTAR architecture.**

---

*Document Version: 2.0 | June 10, 2026*
