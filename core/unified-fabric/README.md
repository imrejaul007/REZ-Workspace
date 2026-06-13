# RTMN Unified Fabric - Connection Architecture

**Version:** 1.0.0
**Date:** 2026-06-13
**Status:** ✅ Core connections built, integration testing pending

---

## Overview

The Unified Fabric is the central orchestration layer that connects all RTMN services into one coherent intelligence platform.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         RTMN UNIFIED FABRIC                                  │
│                         (Port 4500)                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Schema   │  │   Service  │  │   Event    │  │    Flow    │         │
│  │  Registry  │  │  Registry  │  │    Bus     │  │ Orchestrator│         │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    CONNECTION MODULES                               │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │   │
│  │  │Business │  │  SUTAR   │  │ RABTUL   │  │  Nexha   │  │AdBazaar│ │   │
│  │  │Copilot  │  │    OS    │  │Services │  │ Commerce │  │ Media  │ │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Connection Modules

### 1. Business Copilot → TwinOS Hub
**File:** `src/connections/businessCopilot.js`

**Purpose:** Enable end-to-end flow: Question → Twin → Memory → Intelligence → Answer

**Features:**
- Query TwinOS Hub for relevant twins
- Query Genie Memory for context
- Query Nexha Intelligence for analytics
- Aggregate responses from all sources
- Generate enhanced suggestions

**Usage:**
```javascript
import { BusinessCopilotWithTwins } from './connections/businessCopilot.js';

const copilot = new BusinessCopilotWithTwins({ logger });
const result = await copilot.process({
  message: 'What are my sales this week?',
  industry: 'retail',
  context: { userId: 'user-001' }
});
```

---

### 2. SUTAR OS → Core Platform
**File:** `src/connections/sutarOS.js`

**Purpose:** Connect SUTAR OS services to RTMN Core

**Services Connected:**
- Trust Engine (port 4180)
- Contract OS (port 4190)
- Decision Engine (port 4240)
- Marketplace (port 4250)
- Negotiation Engine (port 4191)

**Features:**
- Trust score validation
- Contract validation
- Decision making
- Multi-agent execution
- Marketplace search

**Usage:**
```javascript
import { SutarOSConnection } from './connections/sutarOS.js';

const sutar = new SutarOSConnection({ logger });
const trustScore = await sutar.getTrustScore('merchant', 'merchant-001');
const decision = await sutar.makeDecision({ context });
```

---

### 3. RABTUL Services → Core Platform
**File:** `src/connections/rabtul.js`

**Purpose:** Connect RABTUL Auth, Payment, Wallet, Profile

**Services Connected:**
- RABTUL Auth (port 4002)
- RABTUL Payment (port 4001)
- RABTUL Wallet (port 4004)
- RABTUL Profile (port 4005)

**Features:**
- User authentication
- Payment processing
- Wallet transfers
- Profile management
- User features

**Usage:**
```javascript
import { RabtulConnection } from './connections/rabtul.js';

const rabtul = new RabtulConnection({ logger, token });
const balance = await rabtul.getBalance('user-001');
await rabtul.transfer('user-001', 'user-002', 100);
```

---

### 4. Nexha Commerce → Core Platform
**File:** `src/connections/nexha.js`

**Purpose:** Connect Nexha Commerce Network to RTMN Core

**Services Connected:**
- DistributionOS (port 4300)
- FranchiseOS (port 4310)
- ProcurementOS (port 4320)
- TradeFinance (port 4340)
- Intelligence (port 4350)
- Ecosystem Connector (port 4399)

**Features:**
- Distributor management
- Franchise operations
- Procurement & RFQ
- BNPL & credit
- Demand prediction
- Event publishing

**Usage:**
```javascript
import { NexhaConnection } from './connections/nexha.js';

const nexha = new NexhaConnection({ logger, token });
const distributors = await nexha.getDistributors();
const prediction = await nexha.predictDemand({ productId: 'prod-001' });
```

---

### 5. AdBazaar Media OS → Core Platform
**File:** `src/connections/adbazaar.js`

**Purpose:** Connect AdBazaar advertising to RTMN Core

**Services Connected:**
- AdBazaar Backend (port 4085)
- REZ Ads (port 3005)
- DOOH Intelligence (port 4080)
- Intent Exchange (ports 4800-4803)
- Audience Twins (ports 4805-4808)
- AI Campaign Tools (ports 4820-4823)

**Features:**
- Screen marketplace
- Campaign management
- DOOH pricing
- Attribution tracking
- Intent signals
- Audience twins
- AI campaign generation

**Usage:**
```javascript
import { AdBazaarConnection } from './connections/adbazaar.js';

const adbazaar = new AdBazaarConnection({ logger, token });
const screens = await adbazaar.getScreens();
const intentSignals = await adbazaar.getIntentSignals();
```

---

## API Endpoints

### Health & Status
```
GET  /health              - Unified Fabric health
GET  /schemas             - All event schemas
GET  /schemas/:eventType  - Get specific schema
GET  /services            - All registered services
GET  /services/:id       - Get service details
```

### Event Bus
```
POST /events/publish      - Publish event to topic
GET  /events/:topic      - Get events for topic
POST /events/subscribe   - Subscribe to topic
```

### Flow Orchestration
```
GET  /flows              - List available flows
POST /flows/execute      - Execute a flow
```

### BOA Executive Intelligence
```
POST /boa/query          - Execute BOA query
```

---

## Pre-Registered Services (45 Total)

### Core Platform (4)
| Service | Port | Category |
|---------|------|----------|
| api-gateway | 3000 | core |
| twinos-hub | 4000 | core |
| agentos-hub | 4001 | core |
| business-copilot | 4002 | core |

### SUTAR OS (15)
| Service | Port | Category |
|---------|------|----------|
| sutar-gateway | 4140 | sutar |
| sutar-trust-engine | 4180 | sutar |
| sutar-contract-os | 4190 | sutar |
| sutar-negotiation-engine | 4191 | sutar |
| sutar-twin-os | 4142 | sutar |
| sutar-memory-bridge | 4143 | sutar |
| sutar-intent-bus | 4154 | sutar |
| sutar-agent-network | 4155 | sutar |
| sutar-decision-engine | 4240 | sutar |
| sutar-simulation-os | 4241 | sutar |
| sutar-goal-os | 4242 | sutar |
| sutar-marketplace | 4250 | sutar |
| sutar-economy-os | 4251 | sutar |
| sutar-monitoring | 3100 | sutar |

### Genie OS (4)
| Service | Port | Category |
|---------|------|----------|
| genie-personal-os-gateway | 5000 | genie |
| genie-memory-service | 5001 | genie |
| genie-briefing-service | 5002 | genie |
| genie-business-intelligence | 5003 | genie |

### RABTUL (5)
| Service | Port | Category |
|---------|------|----------|
| rez-auth | 4002 | rabtul |
| rez-payment | 4001 | rabtul |
| rez-wallet | 4004 | rabtul |
| rez-profile | 4005 | rabtul |
| rez-merchant | 4003 | rabtul |

### Nexha Commerce (8)
| Service | Port | Category |
|---------|------|----------|
| nexha-gateway | 5002 | nexha |
| nexha-distribution | 4300 | nexha |
| nexha-franchise | 4310 | nexha |
| nexha-procurement | 4320 | nexha |
| nexha-manufacturing | 4330 | nexha |
| nexha-trade-finance | 4340 | nexha |
| nexha-intelligence | 4350 | nexha |
| nexha-connector | 4399 | nexha |

### REE Services (5)
| Service | Port | Category |
|---------|------|----------|
| ree-ops-center | 3000 | ree |
| ree-trust-platform | 3001 | ree |
| ree-growth-engine | 3002 | ree |
| ree-logistics-engine | 3003 | ree |
| ree-attribution-engine | 3004 | ree |

### AdBazaar Media (5)
| Service | Port | Category |
|---------|------|----------|
| adbazaar-backend | 4085 | media |
| rez-ads | 3005 | media |
| rez-dooh-intelligence | 4080 | media |
| rez-dooh-attribution | 4081 | media |
| rez-pricing-engine | 4016 | media |

---

## Event Schemas (7)

| Schema | Purpose |
|--------|---------|
| twin.updated | Digital twin state changes |
| agent.executed | Agent execution events |
| intent.detected | User intent signals |
| copilot.query | Copilot query events |
| copilot.response | Copilot response events |
| sutar.contract | SUTAR contract events |
| nexha.order | Nexha order events |

---

## Cross-System Flows

### 1. Copilot Query Flow
```
Question
    ↓
Business Copilot
    ↓
TwinOS Hub (query twins)
    ↓
Genie Memory (query context)
    ↓
Nexha Intelligence (query analytics)
    ↓
Aggregate Response
    ↓
Answer with Sources
```

### 2. Revenue Analysis Flow
```
Question: "Why did revenue drop?"
    ↓
Business Twin (get business data)
    ↓
Nexha Revenue Data (get revenue metrics)
    ↓
Nexha Market Intelligence (get market trends)
    ↓
SUTAR Decision Engine (analyze)
    ↓
Recommendations
```

### 3. Campaign Creation Flow
```
Natural Language Description
    ↓
Business Copilot
    ↓
AdBazaar NL Campaign Builder
    ↓
TwinOS Hub (create campaign twin)
    ↓
AgentOS Hub (assign optimization agent)
    ↓
AdBazaar (execute campaign)
```

---

## Quick Start

```bash
# Install dependencies
cd core/unified-fabric
npm install

# Start the Unified Fabric
npm run dev

# Run integration tests
node test-connections.js
```

---

## Environment Variables

```bash
# Redis
REDIS_URL=redis://localhost:6379

# Core Platform
TWINOS_HUB_URL=http://localhost:4000
AGENTOS_HUB_URL=http://localhost:4001
BUSINESS_COPILOT_URL=http://localhost:4002

# SUTAR OS
SUTAR_GATEWAY_URL=http://localhost:4140
SUTAR_TRUST_URL=http://localhost:4180
SUTAR_CONTRACT_URL=http://localhost:4190
SUTAR_DECISION_URL=http://localhost:4240
SUTAR_MARKETPLACE_URL=http://localhost:4250

# Genie OS
GENIE_MEMORY_URL=http://localhost:5001

# Nexha Commerce
NEXHA_GATEWAY_URL=http://localhost:5002
NEXHA_DISTRIBUTION_URL=http://localhost:4300
NEXHA_INTELLIGENCE_URL=http://localhost:4350

# AdBazaar Media
ADBAZAAR_BACKEND_URL=http://localhost:4085
DOOH_INTELLIGENCE_URL=http://localhost:4080
INTENT_AGGREGATOR_URL=http://localhost:4800
```

---

## Next Steps

1. **Start all services** - Ensure all services are running
2. **Run integration tests** - `node test-connections.js`
3. **Verify cross-system flows** - Test copilot query flow
4. **Connect remaining services** - Add more SUTAR/Genie services
5. **Add LLM integration** - Connect actual AI to Business Copilot
6. **Build BOA dashboard** - Create executive intelligence UI

---

**Last Updated:** 2026-06-13
