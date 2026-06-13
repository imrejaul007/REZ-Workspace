# RTMN Foundation Services - Developer Guide

**Version:** 1.0.0  
**Updated:** June 14, 2026  
**Status:** ✅ ALL 5 SERVICES BUILT & CONNECTED

---

## Overview

RTMN Foundation Services provide the core infrastructure layer that all other services depend on:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    RTMN FOUNDATION LAYER                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    CorpID Service (4702)                              │   │
│  │              Universal Identity for ALL Entities                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    MemoryOS (4703)                                    │   │
│  │                Personal AI Memory Layer                               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    SUTAR Execution Layer                              │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │   │
│  │  │   GoalOS    │  │  Decision    │  │    Agent    │              │   │
│  │  │   4242      │  │  Engine 4240 │  │  Economy 4251│              │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Services

| Service | Port | Purpose | Status |
|---------|------|---------|--------|
| **CorpID Service** | 4702 | Universal Identity | ✅ Built |
| **MemoryOS** | 4703 | Personal AI Memory | ✅ Built |
| **GoalOS** | 4242 | Autonomous Goals | ✅ Built |
| **Decision Engine** | 4240 | Policy & Authorization | ✅ Built |
| **Agent Economy** | 4251 | Karma & Payments | ✅ Built |

---

## Quick Start

```bash
# Install and start CorpID Service
cd services/corpid-service && npm install && npm start

# Install and start MemoryOS
cd services/memory-os && npm install && npm start

# Install and start GoalOS
cd services/goal-os && npm install && npm start

# Install and start Decision Engine
cd services/decision-engine && npm install && npm start

# Install and start Agent Economy
cd services/agent-economy && npm install && npm start
```

---

## Service Details

### CorpID Service (4702)

**Location:** `services/corpid-service/`

Universal identity for all RTMN entities.

#### Entity Types

| Type | Prefix | Example |
|------|--------|---------|
| INDIVIDUAL | IND- | IND-A1B2C3D4E5F6 |
| BUSINESS | BIZ- | BIZ-A1B2C3D4E5F6 |
| SUPPLIER | SUP- | SUP-A1B2C3D4E5F6 |
| MERCHANT | MER- | MER-A1B2C3D4E5F6 |
| DRIVER | DRV- | DRV-A1B2C3D4E5F6 |
| FRANCHISE | FRN- | FRN-A1B2C3D4E5F6 |
| AGENT | AGT- | AGT-A1B2C3D4E5F6 |
| MACHINE | MCH- | MCH-A1B2C3D4E5F6 |
| PRODUCT | PRD- | PRD-A1B2C3D4E5F6 |

#### Key Endpoints

```javascript
// Create entity
POST /api/identity/create

// Get entity
GET /api/identity/:corpId

// Verify (KYC/KYB)
POST /api/identity/:corpId/verify

// Trust score
GET /api/trust/score/:corpId
POST /api/trust/score/:corpId

// Relationships
POST /api/relationships
GET /api/relationships/:corpId
GET /api/relationships/path/find

// Agents
POST /api/agents/register
GET /api/agents/search/find
```

---

### MemoryOS (4703)

**Location:** `services/memory-os/`

Personal AI memory for each CorpID.

#### Memory Types

| Type | Description |
|------|-------------|
| EPISODIC | Experiences, events |
| SEMANTIC | Facts, knowledge |
| PROCEDURAL | Skills, how-tos |
| RELATIONAL | Connections |

#### Key Endpoints

```javascript
// Store memory
POST /api/memories

// Get by entity
GET /api/memories/entity/:corpId

// Search
POST /api/memories/search

// Context for AI
POST /api/context/get

// Conversation
POST /api/context/conversation
GET /api/context/history/:corpId

// Preferences
POST /api/context/preferences
GET /api/context/preferences/:corpId
```

---

### GoalOS (4242)

**Location:** `services/goal-os/`

Autonomous goal decomposition and tracking.

#### Priority Levels

| Level | Value | Use Case |
|-------|-------|----------|
| CRITICAL | 1 | Urgent |
| HIGH | 2 | Important |
| MEDIUM | 3 | Normal |
| LOW | 4 | When possible |

#### Key Endpoints

```javascript
// Create goal
POST /api/goals

// Get with children
GET /api/goals/:goalId

// Decompose into sub-goals
POST /api/goals/:goalId/decompose

// Update progress (auto-propagates)
PATCH /api/goals/:goalId/progress

// Get by owner
GET /api/goals/owner/:corpId

// Get active
GET /api/goals/status/active
```

---

### Decision Engine (4240)

**Location:** `services/decision-engine/`

Policy and authorization decisions.

#### Outcomes

| Outcome | Description |
|---------|-------------|
| PROCEED | Approved |
| HOLD | Needs review |
| REJECT | Denied |
| ESCALATE | Escalate |

#### Key Endpoints

```javascript
// Make decision
POST /api/decisions/decide

// Get decision
GET /api/decisions/:decisionId

// Appeal
POST /api/decisions/:decisionId/appeal

// Policies
POST /api/policies
GET /api/policies

// Holds
POST /api/policies/holds
DELETE /api/policies/holds/:holdId
```

---

### Agent Economy (4251)

**Location:** `services/agent-economy/`

Karma points and agent payments.

#### Currencies

| Currency | Purpose |
|----------|---------|
| KARMA | Reputation points |
| SLB | Service Level Bonds |
| REZ | Platform currency |

#### Reputation Tiers

| Tier | Karma | Multiplier |
|------|-------|------------|
| LEGENDARY | 10,000+ | 1.5x |
| ELITE | 5,000+ | 1.3x |
| TRUSTED | 1,000+ | 1.1x |
| VERIFIED | 100+ | 1.0x |
| NEW | 0-99 | 0.8x |

#### Key Endpoints

```javascript
// Balance
GET /api/economy/balance/:corpId

// Karma
POST /api/economy/karma/award
POST /api/economy/karma/burn

// SLB
POST /api/economy/slb/stake
POST /api/economy/slb/slash

// Leaderboard
GET /api/economy/leaderboard

// Payments
POST /api/payments
POST /api/payments/escrow
POST /api/payments/escrow/:id/release
POST /api/payments/escrow/:id/refund
```

---

## Connection Modules

**Location:** `core/unified-fabric/src/connections/`

| Module | File | Methods |
|--------|------|---------|
| CorpID | `corpId.js` | createEntity, getEntity, verify, trustScore |
| MemoryOS | `memoryOS.js` | store, getMemories, search, getContext |
| GoalOS | `goalOS.js` | createGoal, decompose, updateProgress |
| Decision Engine | `decisionEngine.js` | decide, createPolicy, createHold |
| Agent Economy | `agentEconomy.js` | awardKarma, stakeSLB, createPayment |

---

## Connected Services

| Service | Connects To | Method |
|---------|-------------|--------|
| TwinOS Hub | CorpID | `linkToCorpId()` |
| AgentOS Hub | CorpID | `registerWithCorpId()` |
| Unified Fabric | All 5 | Service Registry |

---

## Health Checks

```bash
curl http://localhost:4702/health  # CorpID
curl http://localhost:4703/health  # MemoryOS
curl http://localhost:4242/health  # GoalOS
curl http://localhost:4240/health  # Decision Engine
curl http://localhost:4251/health  # Agent Economy
```

---

## Example Integration

```javascript
// 1. Create CorpID for new user
const userRes = await fetch('http://localhost:4702/api/identity/create', {
  method: 'POST',
  body: JSON.stringify({
    type: 'INDIVIDUAL',
    name: 'John Doe',
    email: 'john@example.com'
  })
});
const { corpId } = await userRes.json();

// 2. Store user preference
await fetch('http://localhost:4703/api/context/preferences', {
  method: 'POST',
  body: JSON.stringify({
    corpId,
    key: 'notifications',
    value: 'email'
  })
});

// 3. Create business goal
await fetch('http://localhost:4242/api/goals', {
  method: 'POST',
  body: JSON.stringify({
    title: 'Increase revenue 20%',
    ownerCorpId: corpId,
    priority: 2
  })
});

// 4. Award karma for good action
await fetch('http://localhost:4251/api/economy/karma/award', {
  method: 'POST',
  body: JSON.stringify({
    corpId,
    amount: 50,
    reason: 'On-time payment'
  })
});
```

---

## File Structure

```
services/
├── CLAUDE.md                    # This file
├── corpid-service/
│   ├── package.json
│   └── src/
│       ├── index.js            # Port 4702
│       └── routes/
│           ├── identity.js
│           ├── trust.js
│           ├── relationships.js
│           └── agents.js
├── memory-os/
│   ├── package.json
│   └── src/
│       ├── index.js            # Port 4703
│       └── routes/
│           ├── memory.js
│           └── context.js
├── goal-os/
│   ├── package.json
│   └── src/
│       ├── index.js            # Port 4242
│       └── routes/
│           └── goals.js
├── decision-engine/
│   ├── package.json
│   └── src/
│       ├── index.js            # Port 4240
│       └── routes/
│           ├── decisions.js
│           └── policies.js
└── agent-economy/
    ├── package.json
    └── src/
        ├── index.js            # Port 4251
        └── routes/
            ├── economy.js
            └── payments.js
```

---

## Architecture Principles

1. **Identity First**: Every entity gets a CorpID before any other operation
2. **Memory Follows**: Personal data and preferences stored in MemoryOS
3. **Goals Drive**: Goals in GoalOS align all actions
4. **Decisions Gate**: Decision Engine authorizes all important actions
5. **Economy Rewards**: Agent Economy provides karma and payment infrastructure

---

## Related Documentation

- `RTNM-COMPANIES-AUDIT.md` - Ecosystem overview
- `RTNM-PRODUCTS-FEATURES-AUDIT.md` - Product features
- `core/unified-fabric/src/connections/` - Connection modules

---

*Last Updated: June 14, 2026*
