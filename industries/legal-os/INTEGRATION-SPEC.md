# Legal OS Integration Specification

## Version 1.0 | June 2026

---

## 1. Executive Summary

This document defines the integration architecture for the Legal OS vertical, connecting contract lifecycle management, legal research, and compliance monitoring capabilities through a unified TwinOS framework. The system enables law firms and corporate legal departments to orchestrate complex legal workflows by correlating Client Twins, Matter Twins, Document Twins, Attorney Twins, and Court Twins.

**Core Value Proposition**: Transform fragmented legal operations into an intelligent, interconnected ecosystem where contracts automatically trigger research, compliance checks execute across matter hierarchies, and attorney expertise is matched to client needs in real-time.

**Key Integration Point**: Contract OS (port 4190) serves as the primary data source, feeding contract intelligence into TwinOS where semantic relationships between clients, matters, documents, and court proceedings are established and maintained.

---

## 2. Product Capability Matrix

| Product | Port | Core Function | Data Inputs | Data Outputs |
|---------|------|---------------|-------------|--------------|
| Contract OS | 4190 | Contract lifecycle management, clause extraction, obligation tracking | Contracts, amendments, addenda | Contract metadata, obligations, risk scores |
| Legal Research AI | 5004 | Case law analysis, precedent matching, citation verification | Court opinions, legal briefs, statutes | Research summaries, relevance scores, citations |
| Compliance Checker | 4180-4185 | Regulatory compliance validation, audit trail generation | Regulations, internal policies, contracts | Compliance reports, violation alerts, remediation plans |
| TwinOS | 4142 | Digital twin orchestration, relationship mapping, state management | All product outputs | Twin states, relationship graphs, query responses |
| REZ Business Copilot | 3000 | Natural language query interface, analytics dashboard | TwinOS, all products | Natural language responses, recommendations |

### Legal CRM Service
| Attribute | Value |
|-----------|-------|
| **Port** | `TBD` |
| **Company** | REZ Merchant |
| **Capabilities** | Customer profiles, segmentation, campaigns, visit tracking |
| **Data Produced** | Customer segments, campaign results, churn risk |
| **Data Needed** | Customer Twin, Transaction Twin |
| **TwinOS Role** | CUSTOMER INTELLIGENCE |

---

## 3. Twin JSON Schemas

### 3.1 Client Twin (4142-C1)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "title": "Client Twin",
  "description": "Represents a legal services client entity",
  "twinId": "4142-C1",
  "version": "1.0",
  "attributes": {
    "clientId": { "type": "string", "format": "uuid", "description": "Unique client identifier" },
    "legalName": { "type": "string", "description": "Legal entity name" },
    "dbaName": { "type": "string", "description": "Doing business as name" },
    "entityType": { "type": "enum", "enum": ["LLC", "Corporation", "Partnership", "Sole Proprietorship", "Individual"], "description": "Entity classification" },
    "jurisdiction": { "type": "string", "description": "Primary jurisdiction of operation" },
    "dateOfOnboarding": { "type": "string", "format": "date-time" },
    "clientStatus": { "type": "enum", "enum": ["Active", "Inactive", "Prospect", "Onboarding"], "description": "Current client status" },
    "riskProfile": { "type": "enum", "enum": ["Low", "Medium", "High", "Critical"], "description": "Client risk classification" },
    "primaryContact": {
      "type": "object",
      "properties": {
        "name": { "type": "string" },
        "email": { "type": "string", "format": "email" },
        "phone": { "type": "string" },
        "role": { "type": "string" }
      }
    },
    "billingInfo": {
      "type": "object",
      "properties": {
        "billingAddress": { "type": "string" },
        "paymentTerms": { "type": "string" },
        "feeStructure": { "type": "enum", "enum": ["Hourly", "Fixed", "Contingency", "Hybrid"] }
      }
    },
    "preferences": {
      "type": "object",
      "properties": {
        "communicationStyle": { "type": "string" },
        "preferredAttorneys": { "type": "array", "items": { "type": "string" } },
        "matterPriority": { "type": "string" }
      }
    }
  },
  "relationships": {
    "HAS_MATTER": {
      "type": "array",
      "items": { "$ref": "#/definitions/MatterTwin" },
      "description": "Matters associated with this client"
    },
    "HAS_DOCUMENT": {
      "type": "array",
      "items": { "$ref": "#/definitions/DocumentTwin" },
      "description": "Documents owned by this client"
    },
    "WORKS_WITH": {
      "type": "array",
      "items": { "$ref": "#/definitions/AttorneyTwin" },
      "description": "Attorneys assigned to this client"
    }
  },
  "managingAgent": "Client Intake Agent",
  "dataSources": ["Contract OS", "Client Intake Agent", "Billing System"],
  "updateTriggers": ["New matter opened", "Contract executed", "Contact information changed", "Risk profile updated"]
}
```

### 3.2 Matter Twin (4142-M1)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "title": "Matter Twin",
  "description": "Represents a legal matter or case",
  "twinId": "4142-M1",
  "version": "1.0",
  "attributes": {
    "matterId": { "type": "string", "format": "uuid" },
    "matterNumber": { "type": "string", "description": "Client-facing matter reference number" },
    "matterTitle": { "type": "string" },
    "matterType": {
      "type": "enum",
      "enum": ["Litigation", "Corporate", "IP", "Real Estate", "Employment", "Tax", "Immigration", "Regulatory", "Other"],
      "description": "Primary matter classification"
    },
    "matterSubtype": { "type": "string" },
    "status": { "type": "enum", "enum": ["Open", "In Progress", "On Hold", "Pending Review", "Closed", "Archived"] },
    "priority": { "type": "enum", "enum": ["Critical", "High", "Medium", "Low"] },
    "jurisdiction": { "type": "string" },
    "courtVenue": { "type": "string" },
    "caseNumber": { "type": "string" },
    "filingDate": { "type": "string", "format": "date-time" },
    "deadlines": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "description": { "type": "string" },
          "dueDate": { "type": "string", "format": "date" },
          "status": { "type": "enum", "enum": ["Pending", "Completed", "Missed", "Extended"] }
        }
      }
    },
    "budget": {
      "type": "object",
      "properties": {
        "estimatedHours": { "type": "number" },
        "actualHours": { "type": "number" },
        "budgetAmount": { "type": "number" },
        "currency": { "type": "string", "default": "USD" }
      }
    },
    "parties": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "role": { "type": "string" },
          "type": { "type": "enum", "enum": ["Plaintiff", "Defendant", "Petitioner", "Respondent", "Third Party"] }
        }
      }
    }
  },
  "relationships": {
    "BELONGS_TO": { "$ref": "#/definitions/ClientTwin" },
    "HAS_DOCUMENT": {
      "type": "array",
      "items": { "$ref": "#/definitions/DocumentTwin" }
    },
    "ASSIGNED_TO": {
      "type": "array",
      "items": { "$ref": "#/definitions/AttorneyTwin" }
    },
    "PROCEEDS_IN": {
      "type": "array",
      "items": { "$ref": "#/definitions/CourtTwin" }
    }
  },
  "managingAgent": "Matter Manager Agent",
  "dataSources": ["Contract OS", "Case Management System", "Matter Manager Agent"],
  "updateTriggers": ["Document uploaded", "Deadline approached", "Status changed", "Attorney assigned"]
}
```

### 3.3 Document Twin (4142-D1)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "title": "Document Twin",
  "description": "Represents a legal document with semantic intelligence",
  "twinId": "4142-D1",
  "version": "1.0",
  "attributes": {
    "documentId": { "type": "string", "format": "uuid" },
    "documentType": {
      "type": "enum",
      "enum": ["Contract", "Brief", "Motion", "Pleading", "Correspondence", "Memo", "Opinion", "Filing", "Agreement", "Amendment"],
      "description": "Document classification"
    },
    "title": { "type": "string" },
    "version": { "type": "string" },
    "status": { "type": "enum", "enum": ["Draft", "Under Review", "Approved", "Executed", "Expired", "Archived"] },
    "source": { "type": "string", "description": "Origin system or party" },
    "createdDate": { "type": "string", "format": "date-time" },
    "executedDate": { "type": "string", "format": "date-time" },
    "expirationDate": { "type": "string", "format": "date-time" },
    "hash": { "type": "string", "description": "Content hash for integrity verification" },
    "extractedData": {
      "type": "object",
      "properties": {
        "parties": { "type": "array", "items": { "type": "string" } },
        "effectiveDate": { "type": "string", "format": "date" },
        "terminationDate": { "type": "string", "format": "date" },
        "governingLaw": { "type": "string" },
        "clauses": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "type": { "type": "string" },
              "text": { "type": "string" },
              "riskLevel": { "type": "enum", "enum": ["Low", "Medium", "High"] },
              "position": { "type": "string" }
            }
          }
        },
        "obligations": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "party": { "type": "string" },
              "description": { "type": "string" },
              "dueDate": { "type": "string", "format": "date" },
              "status": { "type": "enum", "enum": ["Pending", "Fulfilled", "Breached"] }
            }
          }
        }
      }
    },
    "complianceFlags": {
      "type": "array",
      "items": { "type": "string" }
    },
    "riskScore": { "type": "number", "minimum": 0, "maximum": 100 }
  },
  "relationships": {
    "ASSOCIATED_WITH": {
      "type": "array",
      "items": {
        "oneOf": [
          { "$ref": "#/definitions/ClientTwin" },
          { "$ref": "#/definitions/MatterTwin" }
        ]
      }
    },
    "REFERENCES": {
      "type": "array",
      "items": { "$ref": "#/definitions/DocumentTwin" }
    },
    "AUTHORED_BY": { "$ref": "#/definitions/AttorneyTwin" }
  },
  "managingAgent": "Document Analysis Agent",
  "dataSources": ["Contract OS", "Document Analysis Agent", "Legal Research AI"],
  "updateTriggers": ["Document uploaded", "Clause extracted", "Risk analysis completed", "Compliance check performed"]
}
```

### 3.4 Attorney Twin (4142-A1)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "title": "Attorney Twin",
  "description": "Represents a legal professional with expertise mapping",
  "twinId": "4142-A1",
  "version": "1.0",
  "attributes": {
    "attorneyId": { "type": "string", "format": "uuid" },
    "fullName": { "type": "string" },
    "barNumber": { "type": "string" },
    "barJurisdictions": { "type": "array", "items": { "type": "string" } },
    "specializations": {
      "type": "array",
      "items": { "type": "string" }
    },
    "expertiseLevel": { "type": "enum", "enum": ["Associate", "Senior Associate", "Partner", "Of Counsel", "Managing Partner"] },
    "hourlyRate": { "type": "number" },
    "utilization": { "type": "number", "minimum": 0, "maximum": 100 },
    "availability": {
      "type": "object",
      "properties": {
        "currentCapacity": { "type": "number" },
        "maxCapacity": { "type": "number" },
        "blockedHours": { "type": "array" }
      }
    },
    "performanceMetrics": {
      "type": "object",
      "properties": {
        "mattersHandled": { "type": "integer" },
        "avgResolutionTime": { "type": "number" },
        "clientSatisfaction": { "type": "number" },
        "successRate": { "type": "number" }
      }
    },
    "education": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "institution": { "type": "string" },
          "degree": { "type": "string" },
          "year": { "type": "integer" }
        }
      }
    },
    "certifications": { "type": "array", "items": { "type": "string" } }
  },
  "relationships": {
    "REPRESENTS": {
      "type": "array",
      "items": { "$ref": "#/definitions/ClientTwin" }
    },
    "HANDLES": {
      "type": "array",
      "items": { "$ref": "#/definitions/MatterTwin" }
    },
    "AUTHORED": {
      "type": "array",
      "items": { "$ref": "#/definitions/DocumentTwin" }
    },
    "APPEARS_IN": {
      "type": "array",
      "items": { "$ref": "#/definitions/CourtTwin" }
    }
  },
  "managingAgent": "Research Agent",
  "dataSources": ["HR System", "Time Tracking", "Matter Manager Agent"],
  "updateTriggers": ["Matter assigned", "Hours logged", "Specialization updated", "Availability changed"]
}
```

### 3.5 Court Twin (4142-C2)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "title": "Court Twin",
  "description": "Represents a court or tribunal entity",
  "twinId": "4142-C2",
  "version": "1.0",
  "attributes": {
    "courtId": { "type": "string", "format": "uuid" },
    "courtName": { "type": "string" },
    "courtType": {
      "type": "enum",
      "enum": ["Federal", "State", "Appellate", "District", "Magistrate", "Bankruptcy", "Supreme", "Administrative", "Tribunal"],
      "description": "Court classification"
    },
    "jurisdiction": { "type": "string" },
    "venue": { "type": "string" },
    "judges": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "position": { "type": "string" },
          "appointmentDate": { "type": "string", "format": "date" }
        }
      }
    },
    "filingRequirements": {
      "type": "object",
      "properties": {
        "acceptedFormats": { "type": "array", "items": { "type": "string" } },
        "pageLimits": { "type": "object" },
        "filingFees": { "type": "object" }
      }
    },
    "procedures": {
      "type": "object",
      "properties": {
        "discoveryRules": { "type": "string" },
        "motionDeadline": { "type": "integer" },
        "trialSettings": { "type": "string" }
      }
    },
    "historicalData": {
      "type": "object",
      "properties": {
        "casesFiled": { "type": "integer" },
        "avgResolutionTime": { "type": "number" },
        "rulingPatterns": { "type": "array" }
      }
    }
  },
  "relationships": {
    "HEARS": {
      "type": "array",
      "items": { "$ref": "#/definitions/MatterTwin" }
    },
    "PRECEDENT_FOR": {
      "type": "array",
      "items": { "$ref": "#/definitions/DocumentTwin" }
    }
  },
  "managingAgent": "Research Agent",
  "dataSources": ["Court Records", "Legal Research AI", "Contract OS"],
  "updateTriggers": ["Case filed", "Ruling issued", "Procedures updated", "Judge appointed"]
}
```

---

## 4. Integration Flows

### 4.1 Contract Lifecycle Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CONTRACT LIFECYCLE FLOW                            │
└─────────────────────────────────────────────────────────────────────────────┘

[Contract OS:4190] ───► [TwinOS:4142] ───► [Legal Research AI:5004]
        │                    │                      │
        │                    ▼                      │
        │            ┌──────────────┐              │
        │            │  Contract    │              │
        │            │  Extraction  │              │
        │            └──────────────┘              │
        │                    │                      │
        │                    ▼                      ▼
        │            ┌──────────────────────────────────┐
        │            │     DOCUMENT TWIN CREATION        │
        │            │  • Parse clauses                 │
        │            │  • Extract obligations          │
        │            │  • Calculate risk score         │
        │            │  • Identify referenced parties   │
        │            └──────────────────────────────────┘
        │                    │
        │                    ▼
        │            ┌──────────────────────────────────┐
        │            │     RELATIONSHIP MAPPING          │
        │            │  • Link to Client Twin            │
        │            │  • Link to Matter Twin           │
        │            │  • Link to Attorney Twin         │
        │            │  • Create obligation triggers     │
        │            └──────────────────────────────────┘
        │                    │
        │                    ▼
        │            ┌──────────────────────────────────┐
        │            │     COMPLIANCE CHECK (4180-85)   │
        │            │  • Regulatory validation          │
        │            │  • Policy verification           │
        │            │  • Risk flag generation          │
        │            │  • Alert routing                 │
        │            └──────────────────────────────────┘
        │                    │
        ▼                    ▼
   [Contract Store]    [Twin State Updated]
```

### 4.2 API Endpoints

#### TwinOS API (Port 4142)

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|--------------|----------|
| `/twin/create` | POST | Create new twin instance | Twin schema | Twin ID + state |
| `/twin/{twinId}` | GET | Retrieve twin state | - | Twin JSON |
| `/twin/{twinId}` | PUT | Update twin attributes | Partial twin | Updated twin |
| `/twin/{twinId}/relate` | POST | Create relationship | Source, target, type | Relationship ID |
| `/twin/{twinId}/query` | POST | Query twin graph | Cypher query | Query results |
| `/twin/bulk` | POST | Bulk twin operations | Array of operations | Results array |
| `/twin/subscribe` | WS | Real-time updates | Twin ID | Stream of changes |

#### Contract OS API (Port 4190)

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|--------------|----------|
| `/contracts` | GET | List contracts | Filters, pagination | Contract list |
| `/contracts/{id}` | GET | Get contract details | - | Contract JSON |
| `/contracts/{id}/clauses` | GET | Extract clauses | - | Clause array |
| `/contracts/{id}/obligations` | GET | Get obligations | - | Obligation list |
| `/contracts/{id}/sync` | POST | Sync to TwinOS | - | Sync status |
| `/contracts/import` | POST | Bulk import | File upload | Import report |

#### Legal Research AI API (Port 5004)

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|--------------|----------|
| `/research/query` | POST | Execute research query | Query text | Research results |
| `/research/citation` | POST | Verify citation | Citation text | Verification result |
| `/research/precedent` | POST | Find precedents | Case facts | Precedent list |
| `/research/summarize` | POST | Summarize document | Document ID | Summary |
| `/research/twin/{id}` | GET | Get research for twin | - | Research context |

#### Compliance Checker API (Ports 4180-4185)

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|--------------|----------|
| `/compliance/check` | POST | Run compliance check | Entity, rules | Check result |
| `/compliance/audit` | GET | Generate audit trail | Date range | Audit report |
| `/compliance/alerts` | GET | Get active alerts | Filters | Alert list |
| `/compliance/remediate` | POST | Create remediation plan | Violation ID | Plan details |
| `/compliance/rules` | GET | List compliance rules | Category | Rule list |

---

## 5. Agent Definitions

### 5.1 Client Intake Agent

**Purpose**: Orchestrate new client onboarding, verification, and initial relationship establishment.

**Capabilities**:
- KYC/AML verification against watchlists
- Entity extraction from intake forms
- Client Twin creation and initialization
- Initial matter type recommendation
- Conflict checking against existing clients
- Billing setup and fee structure assignment

**Trigger Events**:
- New client inquiry received
- Engagement letter executed
- Intake form submitted
- Matter opened for existing client

**Actions**:
```
ON new_client_inquiry:
  1. Extract entity information from inquiry
  2. Run conflict check against Client Twins
  3. If conflict found → Alert conflicts team
  4. If clear → Create Client Twin (4142-C1)
  5. Score risk profile based on entity type and jurisdiction
  6. Recommend initial matter types
  7. Route to appropriate attorney pool
```

### 5.2 Matter Manager Agent

**Purpose**: Coordinate matter lifecycle, deadlines, and resource allocation.

**Capabilities**:
- Matter Twin (4142-M1) creation and updates
- Deadline tracking and alert generation
- Resource allocation optimization
- Budget monitoring and variance alerts
- Status workflow management
- Cross-matter dependency tracking

**Trigger Events**:
- New matter opened
- Deadline approaching (configurable: 7, 14, 30 days)
- Budget threshold exceeded
- Status change requested
- Document added to matter

**Actions**:
```
ON matter_event:
  1. Update Matter Twin state
  2. Check for dependent matters
  3. If deadline → Generate calendar entries + alerts
  4. If budget_warning → Notify billing + partner
  5. Sync changes to affected twins
  6. Log to audit trail
```

### 5.3 Document Analysis Agent

**Purpose**: Extract intelligence from legal documents, track obligations, and manage document lifecycle.

**Capabilities**:
- Clause extraction using NLP
- Obligation identification and tracking
- Risk scoring based on clause analysis
- Cross-document reference resolution
- Version comparison and change tracking
- Compliance flag generation

**Trigger Events**:
- Document uploaded to Contract OS
- Document executed
- Obligation due date approaching
- Document referenced in another document

**Actions**:
```
ON document_event:
  1. Fetch document from Contract OS
  2. Run clause extraction pipeline
  3. Identify and extract obligations
  4. Calculate risk score
  5. Create/update Document Twin (4142-D1)
  6. Link to related twins
  7. If obligation → Create deadline triggers
  8. Sync to Compliance Checker
```

### 5.4 Research Agent

**Purpose**: Execute legal research, find precedents, and maintain attorney expertise profiles.

**Capabilities**:
- Natural language research query processing
- Precedent matching based on case facts
- Citation verification and linking
- Attorney expertise mapping
- Court procedure research
- Rule change monitoring

**Trigger Events**:
- Research query submitted
- Matter requires precedent research
- Attorney expertise profile update
- Court ruling in relevant area

**Actions**:
```
ON research_request:
  1. Parse and expand query
  2. Query Legal Research AI (5004)
  3. Aggregate results from multiple sources
  4. Rank by relevance and authority
  5. Generate research summary
  6. Update relevant twin contexts
  7. Cache for future reference
```

### 5.5 Compliance Agent

**Purpose**: Monitor regulatory compliance, generate alerts, and manage remediation workflows.

**Capabilities**:
- Multi-jurisdiction regulatory monitoring
- Contract compliance validation
- Policy violation detection
- Audit trail generation
- Remediation workflow orchestration
- Compliance reporting

**Trigger Events**:
- Contract executed or amended
- Regulatory change detected
- Audit period initiated
- Violation detected
- Remediation deadline approaching

**Actions**:
```
ON compliance_event:
  1. Load applicable regulations
  2. Query relevant twins for context
  3. Run compliance checks (ports 4180-4185)
  4. Generate violation report if issues found
  5. Create remediation plan
  6. Route to responsible party
  7. Track remediation progress
  8. Generate audit documentation
```

### 5.6 CRM Agent

**Purpose**: Manage client engagement, matter lifecycle intelligence, and campaign orchestration for improved client retention and matter profitability.

**Capabilities**:
- Client profiling across all matter types
- Matter health scoring and prediction
- Campaign orchestration for client retention
- Churn prediction and prevention
- Cross-selling opportunity identification
- Client satisfaction tracking

**Trigger Events**:
- New matter opened
- Matter status change
- Client communication received
- Deadline missed
- Budget threshold exceeded
- Matter closed

**Actions**:
```
ON crm_event:
  1. Load Client Twin and related Matter Twins
  2. Calculate matter health scores based on status trends
  3. Predict client churn based on matter activity patterns
  4. If high churn risk → Trigger retention campaign
  5. Identify cross-selling opportunities from matter patterns
  6. Sync profile data to REZ CRM
  7. Update Client Twin with engagement metrics
  8. Generate partner alerts for at-risk relationships
  9. Track satisfaction through matter closure feedback
```

---

## 6. Business Copilot Queries

The REZ Business Copilot (port 3000) provides natural language access to Legal OS data through TwinOS.

### 6.1 Client Management Queries

```
User: "Show me all active clients with matters in New York"
Copilot → TwinOS Query:
  MATCH (c:ClientTwin {status: "Active"})-[:HAS_MATTER]->(m:MatterTwin)
  WHERE m.jurisdiction CONTAINS "New York"
  RETURN c.clientId, c.legalName, count(m) as matterCount
  ORDER BY matterCount DESC

User: "Which clients have contracts expiring in the next 90 days?"
Copilot → TwinOS Query:
  MATCH (c:ClientTwin)-[:HAS_DOCUMENT]->(d:DocumentTwin {documentType: "Contract"})
  WHERE d.expirationDate <= date() + duration('P90D')
  AND d.expirationDate > date()
  RETURN c.legalName, d.title, d.expirationDate

User: "What's the total exposure from high-risk clients?"
Copilot → TwinOS Aggregation:
  MATCH (c:ClientTwin {riskProfile: "High"})
  RETURN sum(c.totalExposure) as totalHighRiskExposure
```

### 6.2 Matter Analytics Queries

```
User: "Show me all critical priority matters with approaching deadlines"
Copilot → TwinOS Query:
  MATCH (m:MatterTwin {priority: "Critical", status: "In Progress"})
  WHERE any(d in m.deadlines WHERE d.status = "Pending" AND d.dueDate <= date() + duration('P7D'))
  RETURN m.matterNumber, m.matterTitle, m.deadlines

User: "What's the average budget utilization across all open matters?"
Copilot → TwinOS Aggregation:
  MATCH (m:MatterTwin) WHERE m.status IN ["Open", "In Progress"]
  RETURN avg(m.budget.actualHours / m.budget.estimatedHours * 100) as avgUtilization

User: "Which attorneys are handling the most active litigations?"
Copilot → TwinOS Query:
  MATCH (a:AttorneyTwin)-[:HANDLES]->(m:MatterTwin {matterType: "Litigation", status: "In Progress"})
  RETURN a.fullName, count(m) as activeMatters
  ORDER BY activeMatters DESC
```

### 6.3 Document Intelligence Queries

```
User: "Find all contracts with indemnification clauses that exceed $1M"
Copilot → TwinOS Query:
  MATCH (d:DocumentTwin {documentType: "Contract"})-[:ASSOCIATED_WITH]->(m:MatterTwin)
  WHERE any(c in d.extractedData.clauses WHERE c.type = "Indemnification")
  AND d.extractedData.maxLiability > 1000000
  RETURN d.title, d.extractedData.maxLiability, m.matterTitle

User: "Which documents haven't been updated in over 6 months?"
Copilot → TwinOS Query:
  MATCH (d:DocumentTwin)
  WHERE d.createdDate < date() - duration('P6M')
  AND d.status = "Draft"
  RETURN d.documentId, d.title, d.createdDate

User: "Show me the risk distribution across all executed contracts"
Copilot → TwinOS Aggregation:
  MATCH (d:DocumentTwin {status: "Executed", documentType: "Contract"})
  RETURN d.riskScore, count(d) as count
  ORDER BY d.riskScore
```

### 6.4 Compliance Queries

```
User: "Generate a compliance report for all active client matters"
Copilot → Multi-Step:
  1. Query Matter Twins with status "In Progress"
  2. Fetch compliance flags from Document Twins
  3. Aggregate violations by category
  4. Generate formatted report

User: "Which contracts are missing required compliance clauses?"
Copilot → TwinOS Query:
  MATCH (d:DocumentTwin {documentType: "Contract", status: "Executed"})
  WHERE NOT EXISTS(d.complianceFlags) OR size(d.complianceFlags) = 0
  RETURN d.title, d.documentId

User: "Show me all compliance violations from Q1 2026"
Copilot → TwinOS Query:
  MATCH (d:DocumentTwin)
  WHERE d.complianceFlags IS NOT NULL
  AND d.createdDate >= date('2026-01-01')
  AND d.createdDate < date('2026-04-01')
  UNWIND d.complianceFlags as flag
  RETURN flag, count(d) as occurrences
```

---

## 7. Economic Integration

### 7.1 Revenue Model

| Revenue Stream | Calculation | Twin Attribution |
|---------------|-------------|------------------|
| Contract Review | Per-document fee × complexity factor | Document Twin execution count |
| Matter Management | Monthly retainer + per-matter fee | Matter Twin active count |
| Client Advisory | Hourly billing × attorney rates | Attorney Twin utilization |
| Compliance Services | Per-check fee + subscription | Compliance check volume |
| Research Services | Per-query fee + premium sources | Research query count |

### 7.2 Cost Attribution

| Cost Center | Attribution Method | Twin Correlation |
|-------------|-------------------|------------------|
| AI/ML Processing | API call count per twin type | Twin operation volume |
| Storage | GB per twin instance | Twin storage metrics |
| Bandwidth | Data transfer per integration | Flow data volume |
| Compliance Checks | Check count × jurisdiction factor | Compliance check API calls |
| Research Queries | Query count × source tier | Research API calls |

### 7.3 Pricing Tiers

| Tier | Capabilities | Monthly Price |
|------|--------------|---------------|
| Essential | Client + Matter Twins, 1 agent | $2,500/mo |
| Professional | Full twin suite, 3 agents | $7,500/mo |
| Enterprise | Unlimited twins, all agents, dedicated support | Custom |

---

## 8. Implementation Roadmap

### Week 1-2: Foundation

| Day | Task | Deliverable |
|-----|------|-------------|
| 1-2 | Environment setup | Dev environment configured |
| 3-4 | TwinOS core deployment | TwinOS running on port 4142 |
| 5-7 | Schema implementation | All 5 twin schemas validated |
| 8-10 | Contract OS integration | Contract OS connected to TwinOS |
| 11-14 | Basic API endpoints | CRUD operations functional |

**Milestone**: Basic twin creation and relationship management operational.

### Week 3-4: Agent Development

| Day | Task | Deliverable |
|-----|------|-------------|
| 15-17 | Client Intake Agent | Agent deployed, basic onboarding flows |
| 18-20 | Matter Manager Agent | Agent deployed, deadline tracking |
| 21-23 | Document Analysis Agent | Clause extraction pipeline active |
| 24-26 | Research Agent | Legal Research AI integration |
| 27-28 | Compliance Agent | Compliance Checker integration |

**Milestone**: All 5 agents operational and connected to twins.

### Week 5: Integration & Testing

| Day | Task | Deliverable |
|-----|------|-------------|
| 29-31 | End-to-end flow testing | Contract lifecycle fully automated |
| 32-33 | API security audit | All endpoints secured |
| 34-35 | Performance testing | Load testing complete, latency < 200ms |
| 36-37 | Data migration prep | Migration scripts validated |
| 38 | Staging deployment | Staging environment operational |

**Milestone**: Full integration tested and staged for production.

### Week 6: Go-Live Preparation

| Day | Task | Deliverable |
|-----|------|-------------|
| 39-40 | Production deployment | Production environment live |
| 41-42 | Business Copilot integration | Natural language queries operational |
| 43 | User acceptance testing | Stakeholder sign-off |
| 44 | Training documentation | User guides completed |
| 45 | Go-live | System operational |
| 46-47 | Hypercare support | 24/7 support for 48 hours |
| 48 | Project closure | Documentation, lessons learned |

**Milestone**: Legal OS fully operational with all integrations live.

---

## Appendix A: Port Reference

| Service | Port | Protocol |
|---------|------|----------|
| Contract OS | 4190 | HTTP/REST |
| Legal Research AI | 5004 | HTTP/REST |
| Compliance Checker | 4180-4185 | HTTP/REST (load-balanced) |
| TwinOS | 4142 | HTTP/REST + WebSocket |
| REZ Business Copilot | 3000 | HTTP/REST |

## Appendix B: Error Codes

| Code | Description | Resolution |
|------|-------------|------------|
| LEG-001 | Twin creation failed | Check schema validity |
| LEG-002 | Relationship already exists | Use update instead of create |
| LEG-003 | Compliance check timeout | Retry with exponential backoff |
| LEG-004 | Document extraction failed | Verify document format |
| LEG-005 | Agent communication timeout | Check agent health status |

---

*Document Version: 1.0*
*Last Updated: June 2026*
*Owner: Legal OS Integration Team*
