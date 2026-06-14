# CorpID v2.0 Architecture

**Version:** 2.0 | **Date:** June 10, 2026 | **Status:** In Progress

---

## Overview

CorpID v2.0 transforms from a standalone identity verification system into the **Universal Identity Infrastructure** for the RTMN ecosystem.

### Current State (v1.5)
- ✅ Universal ID format (CI-IND-XXXXX)
- ✅ 6 entity types (Individual, Business, Supplier, Merchant, Driver, Franchise)
- ✅ CI Score system (0-1000 with tiers)
- ✅ Career Passport
- ✅ Trust Wallet
- ✅ Identity verification workflow

### Target State (v2.0)
- ✅ Employee ↔ CorpID Unification
- ✅ Agent Entity (CI-AGT-XXXXX)
- ✅ Relationship Graph
- ✅ Assertion Framework
- 🔲 Twin-Ready Exports
- 🔲 Evidence Chain to MemoryOS

---

## Entity Model

### Core Entities

| Entity Type | Prefix | Purpose | Status |
|-------------|--------|---------|--------|
| INDIVIDUAL | CI-IND | Human entities | Existing |
| BUSINESS | CI-BIZ | Company entities | Existing |
| SUPPLIER | CI-SUP | Supplier entities | Existing |
| MERCHANT | CI-MER | Merchant entities | Existing |
| DRIVER | CI-DRV | Driver entities | Existing |
| FRANCHISE | CI-FRN | Franchise entities | Existing |
| **AGENT** | **CI-AGT** | **AI Agent entities** | **NEW v2.0** |
| ASSET | CI-ASS | Asset entities | Future |
| PRODUCT | CI-PRO | Product entities | Future |
| LOCATION | CI-LOC | Location entities | Future |
| KNOWLEDGE | CI-KNW | Knowledge entities | Future |

---

## CorpID v2.0 Services

| Service | Port | Purpose |
|---------|------|---------|
| `corpid-identity-service` | 4702 | Entity creation, identity management |
| `corpid-trust-graph-service` | 4706 | Relationships, graph traversal |
| `corpid-assertion-service` | 4707 | Claims, evidence, skills |
| `corpid-agent-registry` | 4708 | AI agent management, capability matching |
| `corpid-api-gateway` | 4701 | Unified entry point |

---

## CorpID v2.0 Entity Schema

### Human Entity (INDIVIDUAL)

```typescript
interface HumanIdentity {
  // Core Identity
  corpId: string;                    // CI-IND-XXXXX
  entityType: 'INDIVIDUAL';
  status: VerificationStatus;
  verificationLevel: number;         // 0-5

  // Personal Info
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
  dateOfBirth?: Date;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';

  // Employment (links to CorpPerks)
  employeeId?: string;              // EMP-XXX
  role?: string;
  department?: string;
  managerId?: string;               // Manager's CorpID

  // Assertions (claims made by/about this entity)
  assertions: Assertion[];

  // Relationships
  relationships: Relationship[];

  // Links to other systems
  linkedEntities: {
    type: 'EMPLOYEE' | 'USER' | 'CONTRACTOR';
    externalId: string;
  }[];

  // Trust
  ciScore?: CIScore;
  trustLevel?: TrustLevel;

  // Metadata
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
```

### Agent Entity (NEW v2.0)

```typescript
interface AgentIdentity {
  // Core Identity
  corpId: string;                    // CI-AGT-XXXXX
  entityType: 'AGENT';
  status: 'ACTIVE' | 'INACTIVE' | 'DEPRECATED';

  // Agent Info
  name: string;                       // "Finance Analyst Agent"
  description?: string;
  version?: string;

  // Classification
  agentType: 'SPECIALIZED' | 'GENERALIST' | 'ORCHESTRATOR';

  // Capabilities
  capabilities: {
    name: string;                    // "Financial Analysis"
    description?: string;
    inputTypes?: string[];           // ["JSON", "CSV", "PDF"]
    outputTypes?: string[];          // ["Report", "Dashboard"]
  }[];

  // Tools & Integrations
  tools: {
    name: string;                    // "Browser", "Calculator", "API"
    enabled: boolean;
    config?: Record<string, unknown>;
  }[];

  // Permissions
  permissions: {
    dataAccess: string[];            // ["read:finance", "write:reports"]
    actionAccess: string[];          // ["execute:dashboard", "send:email"]
    escalationRules?: string[];
  };

  // Costs
  costProfile: {
    perInvocation?: number;          // $ per call
    perTokenInput?: number;          // $ per input token
    perTokenOutput?: number;         // $ per output token
    monthlyBudget?: number;
  };

  // Performance
  performance: {
    accuracyRate?: number;           // 0-100%
    avgResponseTime?: number;        // ms
    uptimePercent?: number;           // 0-100%
    errorRate?: number;              // 0-100%
    totalInvocations?: number;
    lastInvokedAt?: Date;
  };

  // Owner
  ownerId?: string;                  // Human CorpID or Organization CorpID

  // Trust
  trustScore?: number;               // 0-100
  humanRatings?: {
    count: number;
    average: number;
  };

  // Relationships
  relationships: Relationship[];

  // Metadata
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Core Primitives

### 1. Assertion

Represents a claim about an entity.

```typescript
interface Assertion {
  id: string;
  corpId: string;
  
  // What is being asserted
  predicate: string;                 // "skill:python", "capability:analysis"
  value: any;                        // true, "EXPERT", ["read", "write"]
  
  // Source of assertion
  source: AssertionSource;
  
  // Confidence
  confidence: number;                // 0.0 - 1.0
  
  // Evidence references (links to MemoryOS events)
  evidenceRefs?: string[];           // MemoryOS event IDs
  
  // Validity
  validFrom: Date;
  validUntil?: Date;
  
  // Audit
  createdAt: Date;
  createdBy: string;                 // CorpID of who made the assertion
}

type AssertionSource = 
  | 'SELF_DECLARED'      // User asserted themselves
  | 'PEER_VERIFIED'      // Others confirmed
  | 'SYSTEM_OBSERVED'    // From integrations (GitHub, Jira, etc.)
  | 'CREDENTIAL'         // From verified issuer (AWS, Coursera, etc.)
  | 'MANUAL_REVIEW'      // HR/Manager approved
  | 'AGENT_COMPUTED';    // AI computed from evidence
```

### 2. Relationship

Represents connections between entities.

```typescript
interface Relationship {
  id: string;
  
  // Connection
  fromCorpId: string;
  toCorpId: string;
  type: RelationshipType;
  
  // Properties
  properties?: {
    weight?: number;                 // 0-1, strength of relationship
    verified?: boolean;
    since?: Date;
    until?: Date;
    authority?: string;              // For hierarchical relationships
  };
  
  // Source
  source?: 'SELF_DECLARED' | 'SYSTEM_INFERRED' | 'MANUAL_APPROVED';
  
  // Audit
  createdAt: Date;
  createdBy: string;
  expiresAt?: Date;
}

type RelationshipType = 
  // Human → Human
  | 'REPORTS_TO'
  | 'MANAGES'
  | 'WORKS_WITH'
  | 'COLLABORATES_WITH'
  | 'MENTORS'
  | 'MENTORED_BY'
  | 'PEER_OF'
  
  // Human → Organization
  | 'EMPLOYED_BY'
  | 'CONTRACTED_BY'
  | 'OWNED_BY'                    // For business owners
  
  // Human → Agent
  | 'CREATED_BY'
  | 'SUPERVISES'
  | 'USES'
  
  // Agent → Agent
  | 'CALLS'
  | 'DELEGATES_TO'
  | 'COORDINATES_WITH'
  
  // Agent → Organization
  | 'DEPLOYED_IN'
  | 'OWNED_BY'
  
  // Organization → Organization
  | 'SUBSIDIARY_OF'
  | 'PARTNERED_WITH'
  | 'SUPPLIES_TO'
  | 'CLIENT_OF';
```

### 3. Evidence (via MemoryOS)

Evidence is stored in MemoryOS. CorpID stores references.

```typescript
interface EvidenceRef {
  assertionId: string;
  memoryEventId: string;
  weight: number;                    // How much this event supports the assertion
  createdAt: Date;
}
```

Evidence types:
- **Projects completed** → Skill assertions
- **PRs reviewed** → Code review skill
- **Peer confirmations** → Relationship assertions
- **Performance reviews** → Capability assertions
- **Certifications issued** → Credential assertions

---

## Employee ↔ CorpID Integration

### Current State
```
CorpPerks Employee     CorpID Identity
     │                      │
     └── Separate ──────────┘
```

### Target State (v2.0)
```
CorpPerks Employee     CorpID Identity
     │                      │
     └────────┬─────────────┘
              │
         Linked by:
         - employeeId → corpId
         - email → email
         - employeeId in CorpID metadata
```

### Integration Points

| CorpPerks | CorpID | Direction |
|-----------|--------|----------|
| Employee.email | Identity.email | Sync |
| Employee.employeeId | Identity.metadata.employeeId | Sync |
| Employee.department | Identity.metadata.department | Sync |
| Employee.designation | Identity.metadata.designation | Sync |
| Employee.managerId | Relationship (REPORTS_TO) | Sync |
| New Employee | New CorpID (INDIVIDUAL) | Create |

### Sync Flow

```typescript
// When employee is created in CorpPerks
async function onEmployeeCreated(employee: Employee) {
  // 1. Create CorpID if not exists
  let corpId = await findCorpIdByEmail(employee.email);
  if (!corpId) {
    corpId = await createCorpId('INDIVIDUAL', {
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      phone: employee.phone,
      metadata: {
        employeeId: employee.employeeId,
        department: employee.department,
        designation: employee.designation,
        tenantId: employee.tenantId,
      }
    });
  }

  // 2. Link employee to CorpID
  employee.corpId = corpId;
  await employee.save();

  // 3. Create reporting relationship if manager exists
  if (employee.managerId) {
    const managerCorpId = await getCorpIdByEmployeeId(employee.managerId);
    if (managerCorpId) {
      await createRelationship(
        corpId,
        managerCorpId,
        'REPORTS_TO',
        { source: 'SYSTEM_SYNC' }
      );
    }
  }

  return corpId;
}
```

---

## RTMN Architecture Integration

### Full Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                        HOJAI AI                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐                 │
│  │  CorpID  │────▶│ MemoryOS │────▶│  TwinOS  │                 │
│  │   v2.0   │     │          │     │          │                 │
│  └──────────┘     └──────────┘     └──────────┘                 │
│       │                                    │                    │
│       │         ┌──────────┐                │                    │
│       └────────▶│   SADA   │◀───────────────┘                    │
│                 │ (Trust)  │                                     │
│                 └──────────┘                                     │
│                       │                                          │
│       ┌───────────────┼───────────────┐                         │
│       │               │               │                         │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐                  │
│  │  Salar   │    │  Sutar   │    │  Nexha   │                  │
│  │   OS     │    │   OS     │    │          │                  │
│  └──────────┘    └──────────┘    └──────────┘                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Layer Responsibilities

| Layer | Responsibility | Key Data |
|-------|---------------|----------|
| CorpID | Entity & Assertions | Identity, Relationships, Claims |
| MemoryOS | Events & History | What happened, when, between whom |
| TwinOS | Current State | Snapshot of reality right now |
| SADA | Trust Computation | Scores, reputation, verification |
| Salar | Workforce Intelligence | Skills graph, capacity, predictions |
| Sutar | Execution | Task assignment, orchestration |
| Nexha | Economic Network | Transactions, settlements |

---

## API Endpoints (v2.0)

### Core Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/identities/individual` | Create human identity |
| POST | `/identities/agent` | **Create agent identity (NEW)** |
| GET | `/identities/:corpId` | Get identity |
| PATCH | `/identities/:corpId` | Update identity |
| DELETE | `/identities/:corpId` | Soft delete |

### Employee Integration

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/identities/link/employee` | **Link employee to CorpID (NEW)** |
| GET | `/identities/:corpId/employee` | **Get linked employee (NEW)** |
| GET | `/employee/:employeeId/corpId` | **Get CorpID from employeeId (NEW)** |

### Assertions

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/assertions` | Create assertion |
| GET | `/identities/:corpId/assertions` | Get all assertions |
| PATCH | `/assertions/:id` | Update assertion |
| POST | `/assertions/:id/evidence` | Add evidence reference |

### Relationships

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/relationships` | Create relationship |
| GET | `/identities/:corpId/relationships` | Get relationships |
| DELETE | `/relationships/:id` | Remove relationship |
| GET | `/identities/:corpId/graph` | **Get full graph (NEW)** |

### Agent-Specific (NEW)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/agents/:corpId/invoke` | Invoke agent |
| GET | `/agents/:corpId/metrics` | Get agent metrics |
| PATCH | `/agents/:corpId/config` | Update agent config |
| GET | `/agents/find` | Find agents by capability |

---

## Implementation Phases

### Phase 1: Employee-CorpID Link (This Sprint)
- [ ] Add `corpId` field to Employee model
- [ ] Add employee linking endpoints
- [ ] Create CorpID on employee creation
- [ ] Sync reporting relationships

### Phase 2: Agent Entity (Next Sprint)
- [ ] Add AGENT to EntityType enum
- [ ] Create Agent schema
- [ ] Add agent creation endpoint
- [ ] Add agent invocation endpoint
- [ ] Add capability matching endpoint

### Phase 3: Relationship Graph
- [ ] Extend relationship types
- [ ] Create graph traversal endpoint
- [ ] Add relationship inference
- [ ] Connect to MemoryOS for evidence

### Phase 4: Assertion Framework
- [ ] Create Assertion model
- [ ] Add assertion CRUD endpoints
- [ ] Implement evidence linking
- [ ] Add confidence computation

### Phase 5: SADA Integration
- [ ] Connect to SADA service
- [ ] Push assertions for trust computation
- [ ] Pull trust scores back

---

## Migration Guide

### Existing Data

```javascript
// For each existing employee without CorpID
db.employees.find({ corpId: { $exists: false } }).forEach(async (employee) => {
  const corpId = await createCorpId('INDIVIDUAL', {
    firstName: employee.firstName,
    lastName: employee.lastName,
    email: employee.email,
    metadata: {
      employeeId: employee.employeeId,
      department: employee.department,
    }
  });
  
  await db.employees.updateOne(
    { _id: employee._id },
    { $set: { corpId: corpId } }
  );
});
```

---

## Backward Compatibility

CorpID v2.0 maintains full backward compatibility:
- Existing CI-IND-XXXXX IDs continue to work
- Existing API contracts unchanged
- New features are additive only

---

## Future Entities (Not in v2.0)

| Entity | Prefix | Dependencies |
|--------|--------|-------------|
| ASSET | CI-ASS | AssetMind |
| PRODUCT | CI-PRO | HOJAI Marketplace |
| LOCATION | CI-LOC | Nexha, RABTUL |
| KNOWLEDGE | CI-KNW | Knowledge Graph initiative |

---

**Next:** [CORPID-V2-EMPLOYEE-INTEGRATION.md](./CORPID-V2-EMPLOYEE-INTEGRATION.md)
