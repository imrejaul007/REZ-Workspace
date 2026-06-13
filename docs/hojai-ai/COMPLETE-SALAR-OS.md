# SALAR OS - Complete Documentation

**Version:** 3.0 | **Date:** June 10, 2026 | **Port:** 4710

---

## Overview

**SALAR OS** is the Workforce Intelligence Network that makes autonomous operations possible.

```
Understand what humans and AI agents know, can do, should do, and are trusted to do.
```

---

## All Modules (9 Total)

| Module | Port | Purpose |
|--------|------|---------|
| **Capability Registry** | 4710 | Maps capabilities to workforce |
| **Agent Twin** | 4710 | Digital twin for AI agents |
| **Human Twin** | 4710 | Digital twin for employees |
| **Hybrid Twin** | 4710 | Human + Agent teams |
| **Organization Twin** | 4710 | Digital twin for organizations |
| **AI Employee LLM** | 4710 | Connect employees to LLM |
| **Vector Store** | 4710 | Semantic search, RAG |
| **Payment** | 4710 | Stripe, Razorpay integration |
| **Sutar Bridge** | 4710 | Integration with Sutar |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SALAR OS v3.0                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────┐           │
│  │ TWIN LAYER                                                │           │
│  │  Human Twin | Agent Twin | Hybrid Twin | Organization Twin   │           │
│  └─────────────────────────────────────────────────────────────┘           │
│                              │                                              │
│                              ▼                                              │
│  ┌─────────────────────────────────────────────────────────────┐           │
│  │ CAPABILITY LAYER                                           │           │
│  │  50+ capabilities mapped to humans, agents, orgs         │           │
│  └─────────────────────────────────────────────────────────────┘           │
│                              │                                              │
│                              ▼                                              │
│  ┌─────────────────────────────────────────────────────────────┐           │
│  │ LLM LAYER                                                 │           │
│  │  Connect AI employees to OpenAI, Claude                   │           │
│  └─────────────────────────────────────────────────────────────┘           │
│                              │                                              │
│                              ▼                                              │
│  ┌─────────────────────────────────────────────────────────────┐           │
│  │ VECTOR LAYER                                             │           │
│  │  Semantic search, RAG, similarity                       │           │
│  └─────────────────────────────────────────────────────────────┘           │
│                              │                                              │
│                              ▼                                              │
│  ┌─────────────────────────────────────────────────────────────┐           │
│  │ PAYMENT LAYER                                            │           │
│  │  Stripe, Razorpay, Subscriptions                         │           │
│  └─────────────────────────────────────────────────────────────┘           │
│                              │                                              │
│                              ▼                                              │
│  ┌─────────────────────────────────────────────────────────────┐           │
│  │ SUTAR BRIDGE                                             │           │
│  │  Workforce decisions, outcomes, simulation                 │           │
│  └─────────────────────────────────────────────────────────────┘           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## API Reference

### Twin Layer

#### Human Twin

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/human-twin` | Create human twin |
| GET | `/human-twin/:id` | Get human twin |
| PATCH | `/human-twin/:id` | Update human twin |
| POST | `/human-twin/:id/delegate` | Delegate to AI |
| GET | `/human-twin` | List all human twins |

#### Agent Twin

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/agent-twin` | Create agent twin |
| GET | `/agent-twin/:id` | Get agent twin |
| POST | `/agent-twin/:id/task` | Record task |
| GET | `/agent-twin/:id/metrics` | Get metrics |
| POST | `/agent-twin/find` | Find best agents |
| GET | `/agent-twin/simulate/:id/impact` | Simulate removal |

#### Hybrid Twin

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/hybrid-team` | Create hybrid team |
| POST | `/hybrid-team/find-optimal` | Find optimal team |
| POST | `/hybrid-team/:id/task` | Assign task |
| GET | `/hybrid-team` | List all hybrid teams |

#### Organization Twin

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/organization-twin` | Create organization twin |
| GET | `/organization-twin/:id` | Get organization twin |
| PATCH | `/organization-twin/:id` | Update organization |
| POST | `/organization-twin/:id/department` | Add department |
| POST | `/organization-twin/:id/workforce` | Update workforce |
| POST | `/organization-twin/:id/skills` | Update skills |
| POST | `/organization-twin/compare` | Compare organizations |
| POST | `/organization-twin/sync-corpid` | Sync from CorpID |

---

### LLM Layer

#### AI Employee LLM

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/ai-employee-llm/config` | Register employee LLM |
| GET | `/ai-employee-llm/config/:id` | Get config |
| POST | `/ai-employee-llm/chat` | Chat with employee |
| GET | `/ai-employee-llm/employees` | List all employees |
| POST | `/ai-employee-llm/bulk-seed` | Bulk seed from Agent Twin |
| GET | `/ai-employee-llm/session/:id` | Get session history |
| DELETE | `/ai-employee-llm/session/:id` | Clear session |

#### Chat Example

```bash
curl -X POST http://localhost:4710/ai-employee-llm/chat \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "CI-AGT-001",
    "message": "Help me with Python code",
    "userId": "CI-IND-001"
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "sessionId": "SES-XXX",
    "employeeId": "CI-AGT-001",
    "response": "I'd be happy to help with Python...",
    "usage": {
      "prompt_tokens": 100,
      "completion_tokens": 50
    }
  }
}
```

---

### Vector Layer

#### Vector Store

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/vector/collections` | Create collection |
| POST | `/vector/documents` | Add document |
| POST | `/vector/search` | Semantic search |
| POST | `/vector/search/workforce` | Search workforce |
| POST | `/vector/bulk` | Bulk index |
| GET | `/vector/collections/:id` | Get collection |
| GET | `/vector/documents/:id` | Get document |
| DELETE | `/vector/documents/:id` | Delete document |
| GET | `/vector/stats` | Get stats |

#### Search Example

```bash
curl -X POST http://localhost:4710/vector/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Python machine learning",
    "corpId": "CI-AGT-001",
    "limit": 5,
    "minSimilarity": 0.7
  }'
```

---

### Payment Layer

#### Stripe

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/payments/stripe/intent` | Create payment intent |
| POST | `/payments/stripe/checkout` | Create checkout session |

#### Razorpay

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/payments/razorpay/order` | Create order |
| POST | `/payments/razorpay/verify` | Verify payment |

#### Subscriptions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/payments/subscriptions` | Create subscription |
| GET | `/payments/subscriptions/:id` | Get subscription |
| POST | `/payments/subscriptions/:id/usage` | Update usage |
| POST | `/payments/subscriptions/:id/cancel` | Cancel subscription |

#### Payment Example

```bash
# Create Razorpay order
curl -X POST http://localhost:4710/payments/razorpay/order \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 999,
    "currency": "INR",
    "notes": {
      "product": "Agent subscription"
    }
  }'

# Create subscription
curl -X POST http://localhost:4710/payments/subscriptions \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "CI-IND-001",
    "customerEmail": "user@example.com",
    "planType": "PRO",
    "billingCycle": "MONTHLY"
  }'
```

---

### Capability Layer

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/capabilities/init` | Initialize capabilities |
| GET | `/capabilities` | List all capabilities |
| GET | `/capabilities/:id` | Get capability |
| POST | `/capabilities/mappings` | Map capability |
| GET | `/capabilities/mappings/:type/:id` | Get entity capabilities |
| POST | `/capabilities/mappings/find` | Find by capability |
| GET | `/capabilities/matrix` | Workforce matrix |
| GET | `/capabilities/gaps/:orgId` | Analyze gaps |

---

### Integration Layer

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/seed/agents` | Seed AI employees |
| GET | `/seed/status` | Check seed status |
| POST | `/integrations/corpperks/sync` | Sync CorpPerks |
| POST | `/integrations/marketplace/sync` | Sync marketplace |
| POST | `/integrations/hybrid-team` | Create hybrid team |
| POST | `/integrations/hybrid-team/auto` | Auto-create team |
| GET | `/integrations/network` | Network status |

---

### Sutar Bridge

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/sutar/bridge/workforce-decision` | Workforce decision |
| POST | `/sutar/bridge/outcome` | Record outcome |
| POST | `/sutra/bridge/capability-check` | Check capabilities |
| POST | `/sutar/bridge/capacity-check` | Check capacity |
| POST | `/sutar/bridge/simulation` | Workforce simulation |
| GET | `/sutar/bridge/agent/:id` | Get agent details |
| GET | `/sutar/bridge/health` | Bridge health |

---

## Environment Variables

```bash
# Salar OS
SALAR_PORT=4710
SALAR_MONGO_URI=mongodb://localhost:27017/salaros

# CorpID
CORPID_SERVICE_URL=http://localhost:4702
INTERNAL_TOKEN=corpid-internal-token

# LLM Providers
OPENAI_API_KEY=sk-xxx
ANTHROPIC_API_KEY=sk-ant-xxx

# Vector Store
EMBEDDING_DIMENSION=1536

# Payment
STRIPE_SECRET_KEY=sk_live_xxx
RAZORPAY_KEY_ID=rzp_xxx
RAZORPAY_KEY_SECRET=xxx
PAYMENT_WEBHOOK_URL=http://localhost:4710/payments/webhook

# Sutar
SUTAR_DECISION_URL=http://localhost:4240
```

---

## Quick Start

```bash
# 1. Start MongoDB
mongod --dbpath /data/db

# 2. Start Salar OS
cd CorpPerks/salar-os
npm install
npm run dev  # Port 4710

# 3. Initialize capabilities
curl -X POST http://localhost:4710/capabilities/init

# 4. Seed AI employees
curl -X POST http://localhost:4710/seed/agents

# 5. Create organization twin
curl -X POST http://localhost:4710/organization-twin \
  -H "Content-Type: application/json" \
  -d '{"corpId": "CI-BIZ-001", "name": "HOJAI AI"}'

# 6. Check network status
curl http://localhost:4710/integrations/network
```

---

## The Moat

```
LINKEDIN:     Human profiles only
WORKDAY:      Human records only
GLEARN:       Enterprise search only

SALAR OS:     Human + Agent + Hybrid + Organization Twins
               LLM-powered AI employees
               Semantic search and RAG
               Built-in payments
               Sutar integration

               All connected. All intelligent.
```

---

## What's Built

| Component | Status |
|-----------|--------|
| 9 Core Modules | ✅ Complete |
| 50+ Capabilities | ✅ Defined |
| 232 AI Employee Support | ✅ Ready |
| Vector Search | ✅ Ready |
| LLM Integration | ✅ Ready |
| Payment Integration | ✅ Ready |
| Sutar Bridge | ✅ Ready |

---

**SALAR OS v3.0 | June 10, 2026**
