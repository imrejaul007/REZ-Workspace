# SALAR OS - Workforce Intelligence Network

**Version:** 2.0 | **Date:** June 10, 2026 | **Port:** 4710

---

## Overview

**SALAR OS** is the Workforce Intelligence Network that makes autonomous operations possible.

```
Understand what humans and AI agents know, can do, should do, and are trusted to do.
```

### The Moat

```
LinkedIn:     Human profiles only
Workday:      Human records only
Glean:        Enterprise search only

SALAR OS:     Human + Agent + Hybrid Twins
               All connected. All intelligent.
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SALAR OS                                              │
│                   Workforce Intelligence Network                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  CAPABILITY REGISTRY                                                  │   │
│  │  50+ capabilities mapped to humans, agents, teams                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                              │                                              │
│                              ▼                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  WORKFORCE TWIN LAYER                                              │   │
│  │                                                                     │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │   │
│  │  │ HUMAN TWIN │  │ AGENT TWIN  │  │ HYBRID TWIN│                │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                              │                                              │
│                              ▼                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ASSIGNMENT ENGINE                                                 │   │
│  │  "Who should do this?"                                           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                              │                                              │
│                              ▼                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  SUTAR BRIDGE                                                    │   │
│  │  Integration with Sutar Decision Engine                           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Modules

### 1. Capability Registry

Maps capabilities to workforce entities.

**50+ Capabilities across 9 categories:**

| Category | Examples |
|----------|---------|
| TECHNICAL | Python, JavaScript, Machine Learning, Cloud Architecture |
| BUSINESS | Sales Strategy, Marketing, Financial Analysis |
| OPERATIONS | Project Management, Supply Chain, QA |
| CREATIVE | UI Design, Copywriting, Brand Strategy |
| ANALYTICS | Data Analysis, Business Intelligence, A/B Testing |
| SUPPORT | Customer Support, Technical Support, HR Support |
| HR | Recruiting, Training, Performance Management |
| LEADERSHIP | Team Leadership, Strategic Planning |
| DOMAIN | Healthcare, E-commerce, Hospitality |

### 2. Agent Twin

Digital twin for every AI agent.

```typescript
interface AgentTwin {
  identity: {
    type: 'SPECIALIZED' | 'GENERALIST' | 'ORCHESTRATOR';
    version: string;
    owner: string;
    department: string;
  };
  capabilities: [{
    capabilityId: string;
    name: string;
    level: string;
    confidence: number;
  }];
  performance: {
    totalTasks: number;
    successRate: number;
    avgResponseTime: number;
  };
  trust: {
    overallScore: number;
    humanRating: number;
    riskLevel: string;
  };
  capacity: {
    currentTasks: number;
    availableCapacity: number;
  };
  cost: {
    perTask: number;
    perHour: number;
    monthlySpend: number;
  };
}
```

### 3. Human Twin

Digital twin for every employee.

```typescript
interface HumanTwin {
  employment: {
    role: string;
    department: string;
    managerId: string;
    tenure: number;
  };
  skills: [{
    capabilityId: string;
    name: string;
    level: string;
    confidence: number;
  }];
  aiCollaboration: {
    comfortLevel: number;
    trustInAI: number;
    preferredTasks: string[];
    delegatedTasks: string[];
  };
  capacity: {
    hoursPerWeek: number;
    availableHours: number;
    utilizationRate: number;
    burnoutRisk: number;
  };
  agentPartners: [{
    agentId: string;
    tasksDelegated: number;
    successRate: number;
  }];
}
```

### 4. Hybrid Twin

Digital twin for human-agent teams.

```typescript
interface HybridTeamTwin {
  composition: {
    humans: [{ corpId: string; role: string }];
    agents: [{ agentId: string; role: string }];
  };
  capabilities: [{
    capabilityId: string;
    name: string;
    providedBy: [{ type: string; entityId: string; strength: number }];
  }];
  performance: {
    totalTasks: number;
    hybridTasks: number;
    humanContribution: number;
    agentContribution: number;
  };
  effectiveness: {
    hybridAdvantage: number;
    optimalRatio: string;
    redundancyScore: number;
  };
  state: {
    collaborationScore: number;
    healthStatus: string;
  };
}
```

### 5. Sutar Bridge

Integration with Sutar Decision Engine.

```typescript
// Sutar calls Salar when it needs workforce intelligence
POST /sutar/bridge/workforce-decision
{
  "decisionId": "dec-123",
  "requiredCapabilities": ["python", "security"],
  "allowHybrid": true
}

// Salar responds with workforce recommendations
{
  "recommendations": [
    { "type": "HUMAN", "corpId": "CI-IND-001", "score": 0.92 },
    { "type": "AGENT", "agentId": "CI-AGT-001", "score": 0.88 }
  ],
  "hybridRecommendation": {
    "humans": [...],
    "agents": [...]
  }
}
```

---

## API Reference

### Health & Info

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Service health check |
| GET | `/` | Service info and endpoints |
| GET | `/network` | Workforce Twin Network status |

### Capability Registry

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/capabilities/init` | Initialize 50+ capabilities |
| GET | `/capabilities` | List all capabilities |
| GET | `/capabilities/:id` | Get capability details |
| POST | `/capabilities/mappings` | Map capability to entity |
| GET | `/capabilities/mappings/:type/:id` | Get entity capabilities |
| POST | `/capabilities/mappings/find` | Find entities by capability |
| POST | `/capabilities/mappings/:id/evidence` | Add evidence to mapping |
| GET | `/capabilities/matrix` | Workforce capability matrix |
| GET | `/capabilities/gaps/:orgId` | Analyze capability gaps |

### Agent Twin

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/agent-twin` | Create agent twin |
| GET | `/agent-twin/:agentId` | Get agent twin |
| PATCH | `/agent-twin/:agentId` | Update agent twin |
| POST | `/agent-twin/:agentId/task` | Record task completion |
| GET | `/agent-twin/:agentId/metrics` | Get performance metrics |
| POST | `/agent-twin/find` | Find best agents for task |
| GET | `/agent-twin/health` | Health summary |
| GET | `/agent-twin/simulate/:id/impact` | Simulate agent removal |

### Human Twin

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/human-twin` | Create human twin |
| GET | `/human-twin/:id` | Get human twin |
| PATCH | `/human-twin/:id` | Update human twin |
| POST | `/human-twin/:id/delegate` | Delegate task to AI |
| GET | `/human-twin` | List all human twins |

### Hybrid Team

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/hybrid-team` | Create hybrid team |
| POST | `/hybrid-team/find-optimal` | Find optimal team for task |
| POST | `/hybrid-team/:id/task` | Assign task to team |
| GET | `/hybrid-team` | List all hybrid teams |
| GET | `/network` | Workforce Twin Network |

### Workforce Find

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/workforce/find` | Find best workforce for task |

### Sutar Bridge

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/sutar/bridge/workforce-decision` | Workforce decision request |
| POST | `/sutar/bridge/outcome` | Record execution outcome |
| POST | `/sutar/bridge/capability-check` | Check capability availability |
| POST | `/sutar/bridge/capacity-check` | Check workforce capacity |
| POST | `/sutar/bridge/simulation` | Workforce simulation |
| GET | `/sutar/bridge/agent/:corpId` | Get agent details |
| GET | `/sutar/bridge/health` | Bridge health |

---

## Scripts

### Register AI Employees

```bash
# Register 232 AI employees in CorpID Agent Registry
npx tsx scripts/register-ai-employees.ts --dry-run
npx tsx scripts/register-ai-employees.ts

# Filter by port range
npx tsx scripts/register-ai-employees.ts --port=5000-5100
```

### Generate Human Twins

```bash
# Create Human Twins from employees
npx tsx scripts/generateHumanTwins.ts --dry-run
npx tsx scripts/generateHumanTwins.ts

# With employee data file
npx tsx scripts/generateHumanTwins.ts --file=employees.json
```

### Generate Hybrid Teams

```bash
# Create Hybrid Teams
npx tsx scripts/generateHybridTeams.ts --dry-run
npx tsx scripts/generateHybridTeams.ts
```

### Integration Endpoints

Salar OS provides built-in integration endpoints for connecting the ecosystem:

```bash
# Seed AI Employees (registers all 232 employees)
curl -X POST http://localhost:4710/seed/agents

# Check seed status
curl http://localhost:4710/seed/status

# Sync CorpPerks employees to Human Twins
curl -X POST http://localhost:4710/integrations/corpperks/sync \
  -H "Content-Type: application/json" \
  -d '{
    "employees": [
      {"corpId": "CI-IND-001", "firstName": "John", "lastName": "Doe", "department": "Engineering"}
    ]
  }'

# Sync Marketplace agents to Agent Registry
curl -X POST http://localhost:4710/integrations/marketplace/sync \
  -H "Content-Type: application/json" \
  -d '{
    "agents": [
      {"corpId": "CI-AGT-MKT-001", "name": "Sales Agent", "industry": "Sales"}
    ]
  }'

# Create hybrid team
curl -X POST http://localhost:4710/integrations/hybrid-team \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Engineering Hybrid Team",
    "humans": [{"corpId": "CI-IND-001", "name": "John"}],
    "agents": [{"agentId": "CI-AGT-001", "name": "Code Agent"}]
  }'

# Auto-create hybrid team based on capability
curl -X POST http://localhost:4710/integrations/hybrid-team/auto \
  -H "Content-Type: application/json" \
  -d '{"capability": "Python"}'

# Get network status
curl http://localhost:4710/integrations/network
```

---

## Environment Variables

```bash
# Salar OS
SALAR_PORT=4710
SALAR_MONGO_URI=mongodb://localhost:27017/salaros

# CorpID Services
CORPID_SERVICE_URL=http://localhost:4702
ASSERTION_SERVICE_URL=http://localhost:4707
AGENT_REGISTRY_URL=http://localhost:4708

# Sutar OS
SUTAR_DECISION_URL=http://localhost:4240

# Security
INTERNAL_SERVICE_TOKEN=corpid-internal-token
```

---

## Integration Flow

```
MEMORYOS (Events)
      │
      ├── PR merged          → skill:python
      ├── Task completed      → capability:analysis
      └── Course finished     → cert:aws

      │
      ▼

CORPID ASSERTION SERVICE
      │
      └── Assertion: skill:python, confidence: 0.72

      │
      ▼

SALAR CAPABILITY REGISTRY
      │
      └── Maps: Humans → Python, Agents → Python

      │
      ▼

WORKFORCE TWIN LAYER
      │
      ├── Human Twin (skills, capacity, AI comfort)
      ├── Agent Twin (capabilities, performance, cost)
      └── Hybrid Twin (optimal ratios, collaboration)

      │
      ▼

SUTAR BRIDGE
      │
      └── "Who should do this?"

      │
      ▼

SUTAR DECISION ENGINE
      │
      └── SimulationOS → GoalOS → Execution

      │
      ▼

OUTCOME → SALAR (Learning)
```

---

## Example: Finding Workforce

### Request

```bash
curl -X POST http://localhost:4710/workforce/find \
  -H "Content-Type: application/json" \
  -d '{
    "task": "Build authentication feature",
    "capabilities": ["python", "security"],
    "allowHybrid": true
  }'
```

### Response

```json
{
  "success": true,
  "data": {
    "task": "Build authentication feature",
    "capabilities": ["python", "security"],
    "candidates": {
      "humans": [
        {
          "entityId": "CI-IND-DEV01",
          "entityType": "HUMAN",
          "score": 0.92,
          "capabilities": [...]
        }
      ],
      "agents": [
        {
          "entityId": "CI-AGT-AUTH01",
          "entityType": "AGENT",
          "score": 0.88,
          "capabilities": [...]
        }
      ]
    },
    "hybridRecommendation": {
      "description": "Hybrid team recommended for optimal results",
      "humans": [...],
      "agents": [...]
    },
    "totalCandidates": 5
  }
}
```

---

## Example: Sutar Bridge

### Request from Sutar

```bash
curl -X POST http://localhost:4710/sutar/bridge/workforce-decision \
  -H "Content-Type: application/json" \
  -d '{
    "decisionId": "dec-123",
    "requiredCapabilities": ["python", "cloud"],
    "allowHybrid": true
  }'
```

### Response to Sutar

```json
{
  "success": true,
  "data": {
    "decisionId": "dec-123",
    "recommendations": [
      {
        "type": "HUMAN",
        "corpId": "CI-IND-DEV01",
        "name": "John Developer",
        "matchScore": 0.92,
        "skills": ["python", "cloud"]
      },
      {
        "type": "HYBRID",
        "humans": [{"corpId": "CI-IND-DEV01", "name": "John"}],
        "agents": [{"agentId": "CI-AGT-CLOUD01", "name": "Cloud Agent"}],
        "estimatedCost": 45,
        "estimatedTime": "3 days"
      }
    ],
    "confidence": 0.85,
    "risks": []
  }
}
```

---

## The Moat

> **Nobody else is building this.**

| Platform | Has |
|----------|-----|
| LinkedIn | Human profiles only |
| Workday | Human records only |
| Glean | Enterprise search only |
| **SALAR OS** | **Human + Agent + Hybrid Twins** |

This is the defining feature of SalAR OS.

---

## Related Documents

- [SALAR-OS-ARCHITECTURE.md](SALAR-OS-ARCHITECTURE.md)
- [SALAR-WORKFORCE-TWIN-NETWORK.md](SALAR-WORKFORCE-TWIN-NETWORK.md)
- [SALAR-SUTAR-INTEGRATION.md](SALAR-SUTAR-INTEGRATION.md)
- [HOJAI-AI-AUDIT.md](HOJAI-AI-AUDIT.md)

---

**SALAR OS v2.0 | June 10, 2026**
