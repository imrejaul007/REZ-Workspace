# SUTAR OS - Complete Service Builder Guide

**Version:** 2.0 | **Date:** June 10, 2026

---

## Overview

This guide documents how all SUTAR OS services work together to form the **Autonomous Economic Infrastructure**.

---

## The 12-Layer Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  LAYER   SERVICE              PORT    PURPOSE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   1     Trigger              -       Human goal or system event           │
│                                                                             │
│   2     Intent Graph         4018    Captures all intents                  │
│                                                                             │
│   3     GoalOS              4242    Decomposes goals into sub-goals       │
│                                                                             │
│   4     Decision Engine     4240    Should we proceed?                   │
│                                                                             │
│   5     SimulationOS        4241    What-if analysis                     │
│                                                                             │
│   6     Agent Network      4155    Registry & discovery                 │
│          Marketplace        4250    Agent hiring                         │
│          Discovery Engine    4230    Capability matching                  │
│                                                                             │
│   7     Negotiation Engine  4191    Automated bargaining                │
│                                                                             │
│   8     Trust Engine       4180    Validate trustworthiness             │
│                                                                             │
│   9     Contract OS        4190    Smart contracts                      │
│                                                                             │
│   10    Economy OS         4251    Karma & earnings                     │
│                                                                             │
│   11    Flow               -       Workflow orchestration                │
│                                                                             │
│   12    MemoryOS           -       Learning & storage                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Service Implementation Status

| Service | Port | Status | Lines | Priority |
|---------|------|--------|-------|----------|
| Intent Graph | 4018 | ✅ Complete | 500+ | Critical |
| GoalOS | 4242 | ✅ Complete | 450+ | Critical |
| Decision Engine | 4240 | 🔄 Building | - | Critical |
| SimulationOS | 4241 | 🔄 Building | - | Critical |
| Negotiation Engine | 4191 | 🔄 Building | - | Critical |
| Trust Engine | 4180 | 🔄 Building | - | Critical |
| Contract OS | 4190 | 🔄 Building | - | Critical |
| Economy OS | 4251 | 🔄 Building | - | Critical |
| Agent Network | 4155 | 🔄 Building | - | Critical |
| Marketplace | 4250 | 🔄 Building | - | Critical |
| AXP Protocol | - | 🔄 Building | - | Critical |
| Discovery Engine | 4230 | 🔄 Building | - | High |
| Flow OS | - | ⚠️ Existing | - | High |
| Memory Bridge | - | ⚠️ Existing | - | High |
| Twin OS | - | ⚠️ Existing | - | Medium |
| Network Learning | 4243 | ⚠️ Existing | - | Medium |
| Usage Tracker | 4253 | ⚠️ Existing | - | Medium |
| Monitoring | 3100 | ⚠️ Existing | - | Medium |

---

## Complete Use Case Flow

### Use Case: Restaurant Needs Tomatoes

```
STEP 1: TRIGGER
═══════════════════════════════════════════════════════════════════════════════

Inventory Agent detects tomatoes < threshold
        │
        ▼
POST /api/v1/intents
{
  "type": "PROCUREMENT",
  "subject": "Tomatoes",
  "category": "GROCERY",
  "quantity": 100,
  "unit": "kg",
  "urgency": "high",
  "budget": 4000,
  "agentId": "inventory-agent-001",
  "tenantId": "restaurant-001"
}

Response: Intent created with id "intent-xyz"
```

```
STEP 2: INTENT GRAPH (4018)
═══════════════════════════════════════════════════════════════════════════════

Intent stored in graph
Intent indexed by category
Event emitted for discovery

        │
        ▼
POST /api/v1/goals
{
  "title": "Maintain vegetable inventory",
  "type": "operational",
  "target": 100,
  "deadline": "tomorrow",
  "parentGoalId": "profit-goal-001"
}

Response: Goal created with sub-goals
```

```
STEP 3: GOALOS (4242)
═══════════════════════════════════════════════════════════════════════════════

Goal decomposed into:
- Marketing Goal (target: 25kg)
- Sales Goal (target: 25kg)
- Procurement Goal (target: 25kg) ← This one triggers
- Kitchen Goal (target: 25kg)

Tasks generated automatically
```

```
STEP 4: DECISION ENGINE (4240)
═══════════════════════════════════════════════════════════════════════════════

POST /api/v1/decisions
{
  "type": "PROCUREMENT",
  "question": "Should we restock tomatoes?",
  "amount": 4000,
  "context": { "stock": 10, "minimum": 30 }
}

Response:
{
  "approved": true,
  "confidence": 0.92,
  "reasoning": "Stock below minimum threshold"
}
```

```
STEP 5: SIMULATIONOS (4241)
═══════════════════════════════════════════════════════════════════════════════

POST /api/v1/simulations
{
  "name": "Tomato procurement options",
  "type": "PROCUREMENT",
  "parameters": {
    "quantity": 100,
    "suppliers": ["A", "B", "C"]
  },
  "iterations": 1000
}

Response:
{
  "scenarios": [
    { "supplier": "A", "price": 38, "probability": 0.8 },
    { "supplier": "B", "price": 35, "probability": 0.6 },
    { "supplier": "C", "price": 36, "probability": 0.7 }
  ],
  "bestScenario": { "supplier": "B", "expectedSavings": 300 }
}
```

```
STEP 6: AGENT DISCOVERY (4155)
═══════════════════════════════════════════════════════════════════════════════

POST /api/v1/agents/discover
{
  "capabilities": ["tomatoes", "grocery"],
  "location": "within_100km",
  "trustScore": { "min": 70 }
}

Response:
{
  "agents": [
    { "id": "supplier-a", "name": "Fresh Farms", "trustScore": 92 },
    { "id": "supplier-b", "name": "Veggie Co", "trustScore": 85 },
    { "id": "supplier-c", "name": "Farm Fresh", "trustScore": 72 }
  ]
}
```

```
STEP 7: NEGOTIATION (4191)
═══════════════════════════════════════════════════════════════════════════════

POST /api/v1/negotiations
{
  "intentId": "intent-xyz",
  "item": { "name": "Tomatoes", "quantity": 100, "unit": "kg" },
  "parties": ["restaurant-agent", "supplier-b"],
  "maxRounds": 5
}

Negotiation Flow:
1. Restaurant → RFQ to Supplier B
2. Supplier B → Quote ₹36/kg
3. Restaurant → Counter ₹34/kg
4. Supplier B → Counter ₹35/kg
5. Restaurant → Accept

Final Agreement: ₹35/kg
```

```
STEP 8: TRUST VALIDATION (4180)
═══════════════════════════════════════════════════════════════════════════════

POST /api/v1/validate
{
  "agentId": "supplier-b",
  "requirements": {
    "minTrustScore": 70,
    "maxDisputeRate": 0.05
  }
}

Response:
{
  "valid": true,
  "trustScore": 85,
  "metrics": {
    "creditScore": 750,
    "paymentHistory": 0.98,
    "deliveryRate": 0.95,
    "disputeRate": 0.02
  }
}
```

```
STEP 9: CONTRACT (4190)
═══════════════════════════════════════════════════════════════════════════════

POST /api/v1/contracts
{
  "type": "PURCHASE_ORDER",
  "parties": ["restaurant-agent", "supplier-b"],
  "terms": {
    "product": "Tomatoes",
    "quantity": 100,
    "unit": "kg",
    "price": 35,
    "total": 3500,
    "deliveryDate": "tomorrow"
  }
}

Both parties sign digitally

Response:
{
  "contractId": "CTR-789",
  "status": "active",
  "signatures": { "buyer": "verified", "seller": "verified" }
}
```

```
STEP 10: ECONOMY (4251)
═══════════════════════════════════════════════════════════════════════════════

POST /api/v1/transactions
{
  "fromAgent": "restaurant-agent",
  "toAgent": "supplier-b",
  "amount": 3500,
  "type": "PURCHASE_ORDER",
  "contractId": "CTR-789"
}

Response:
{
  "transactionId": "TXN-123",
  "supplierEarned": 2975,
  "platformFee": 525,
  "buyerKarma": +50,
  "sellerKarma": +75
}
```

```
STEP 11: EXECUTION (Flow)
═══════════════════════════════════════════════════════════════════════════════

Workflow triggered:
1. Finance Agent → Process payment ₹3,500
2. Fleet Agent → Schedule pickup from supplier-b
3. Supplier Agent → Dispatch goods
4. Fleet Agent → Deliver to restaurant
5. Inventory Agent → Update stock (100kg added)
6. Marketing Agent → Track inventory metrics
```

```
STEP 12: LEARNING (MemoryOS)
═══════════════════════════════════════════════════════════════════════════════

Transaction stored:
- Supplier: supplier-b
- Price: ₹35/kg
- Delivery: On time
- Quality: Fresh

Updates:
- Procurement Twin learns best suppliers
- Price patterns updated
- Trust profile updated
- Network learns for other restaurants
```

---

## API Quick Reference

### Intent Graph (4018)
```bash
# Create intent
POST /api/v1/intents
# Get intent
GET /api/v1/intents/:id
# List intents
GET /api/v1/intents?status=open&category=GROCERY
# Match intents
POST /api/v1/intents/match
```

### GoalOS (4242)
```bash
# Create goal (auto-decomposes)
POST /api/v1/goals
# Get goal with sub-goals
GET /api/v1/goals/:id
# Update progress
PATCH /api/v1/goals/:id/progress
# Get hierarchy
GET /api/v1/goals/:id/hierarchy
```

### Decision Engine (4240)
```bash
# Make decision
POST /api/v1/decisions
# Approve
POST /api/v1/decisions/:id/approve
# Reject
POST /api/v1/decisions/:id/reject
```

### SimulationOS (4241)
```bash
# Run simulation
POST /api/v1/simulations
# Get results
GET /api/v1/simulations/:id
```

### Agent Network (4155)
```bash
# Register agent
POST /api/v1/agents
# Discover
POST /api/v1/agents/discover
# Get agent
GET /api/v1/agents/:id
```

### Negotiation (4191)
```bash
# Start negotiation
POST /api/v1/negotiations
# Submit offer
POST /api/v1/negotiations/:id/offers
# Accept
POST /api/v1/negotiations/:id/accept
```

### Trust (4180)
```bash
# Validate trust
POST /api/v1/validate
# Get profile
GET /api/v1/profiles/:agentId
```

### Contract (4190)
```bash
# Create contract
POST /api/v1/contracts
# Sign
POST /api/v1/contracts/:id/sign
```

### Economy (4251)
```bash
# Process transaction
POST /api/v1/transactions
# Get account
GET /api/v1/accounts/:agentId
```

---

## Message Flow (AXP Protocol)

```typescript
// Agent-to-Agent communication

// 1. Restaurant needs tomatoes
{ type: "INTENT", from: "restaurant", intentId: "xyz" }

// 2. Supplier found, RFQ sent
{ type: "RFQ", from: "restaurant", item: "tomatoes", qty: 100 }

// 3. Supplier quotes
{ type: "QUOTE", from: "supplier-b", price: 36, delivery: "24h" }

// 4. Counter offer
{ type: "COUNTER", from: "restaurant", price: 34 }

// 5. Accept
{ type: "ACCEPT", from: "supplier-b", price: 35 }

// 6. Contract created
{ type: "CONTRACT", contractId: "CTR-789" }

// 7. Status updates
{ type: "STATUS_UPDATE", status: "dispatched", tracking: "TRK-456" }

// 8. Complete
{ type: "COMPLETE", rating: 5, feedback: "Fresh delivery" }
```

---

## Configuration

### Environment Variables
```bash
# Service
PORT=4018
NODE_ENV=production

# Security
ALLOWED_ORIGINS=http://localhost:3000,https://app.hojai.ai
ALLOWED_API_KEYS=key1,key2

# Storage (for future DB integration)
DATABASE_URL=postgresql://...

# Redis (for caching)
REDIS_URL=redis://localhost:6379

# Integration
INTENT_GRAPH_URL=http://localhost:4018
GOAL_OS_URL=http://localhost:4242
TRUST_ENGINE_URL=http://localhost:4180
```

---

## Docker Deployment

```yaml
# docker-compose.yml
services:
  intent-graph:
    build: ./services/sutar-intent-graph
    ports:
      - "4018:4018"

  goal-os:
    build: ./services/sutar-goal-os
    ports:
      - "4242:4242"

  decision-engine:
    build: ./services/sutar-decision-engine
    ports:
      - "4240:4240"

  trust-engine:
    build: ./services/sutar-trust-engine
    ports:
      - "4180:4180"

  # ... more services
```

---

## Monitoring

### Health Checks
All services expose:
- `GET /health` - Service health
- `GET /ready` - Readiness check

### Metrics (Prometheus)
- `sutar_decisions_total` - Decision count
- `sutar_negotiations_total` - Negotiation count
- `sutar_contracts_total` - Contract count
- `sutar_transactions_total` - Transaction count
- `sutar_trust_scores` - Trust score distribution

---

## Next Steps

1. **Database Integration** - Add PostgreSQL for persistence
2. **Message Queue** - Add Kafka/RabbitMQ for async
3. **Service Mesh** - Add Consul for discovery
4. **Load Testing** - k6 tests for each service
5. **Integration Tests** - End-to-end flow tests

---

*Document Version: 2.0 | June 10, 2026*
