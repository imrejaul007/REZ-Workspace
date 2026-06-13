# Legal Services Industry OS - Integration Specification

**Version:** 1.0
**Date:** June 12, 2026
**Status:** Ready for Implementation

---

## 1. Executive Summary

### 1.1 Industry Overview

The legal services industry faces significant challenges in delivering efficient, cost-effective, and transparent services:

- **Document Fragmentation**: Legal documents (contracts, court filings, compliance reports) are scattered across multiple systems, making it difficult to maintain a unified view of client matters
- **Manual Research Intensive**: Legal research consumes 30-40% of attorney time, with outdated tools and limited AI integration
- **Compliance Complexity**: Regulatory compliance requirements are increasing globally (GDPR, SOC2, LGPD, DPDPA), creating operational burden
- **Client Experience Gap**: Traditional law firms lack modern client engagement tools and transparency
- **Revenue Leakage**: Matter tracking, time capture, and billing inefficiencies lead to lost revenue
- **Knowledge Disconnection**: Institutional knowledge stays siloed in individual attorneys rather than being codified and accessible

### 1.2 Key Integration Opportunity

By integrating Contract OS, Legal Research AI, and Compliance Checker through TwinOS (with Client Twin, Matter Twin, Document Twin, Attorney Twin, and Court Twin), we can:

- Create a unified 360-degree view of legal matters combining contracts, research, and compliance data
- Enable AI-powered legal research and document analysis across all matters
- Automate compliance monitoring and alerting across client portfolios
- Predict legal risks before they become costly issues
- Optimize attorney productivity through intelligent matter management
- Deliver transparent client experiences with real-time matter updates

### 1.3 Expected Outcomes

| Outcome | Metric | Impact |
|---------|--------|--------|
| Research Efficiency | 60% reduction in research time | Attorneys focus on high-value work |
| Contract Turnaround | 45% faster contract processing | Improved client satisfaction |
| Compliance Coverage | 95% automated monitoring | Reduced regulatory risk |
| Matter Profitability | 25% increase in realization rates | Improved law firm economics |
| Client Retention | 30% improvement in NPS | Sustainable revenue growth |

---

## 2. Product Capability Matrix

### 2.1 Contract OS

| Attribute | Details |
|-----------|---------|
| **Company** | LawGens |
| **Port** | 4190 |
| **Core Capabilities** | Machine-readable contracts, AI-to-AI transactions, Cryptographic signatures, Automatic execution, Escalation management, Contract validation, Execution history, Auto-renewal |
| **Data Produced** | Contract documents, Signature records, Execution events, Party information, Terms and conditions, Payment schedules, Compliance triggers |
| **Data Needed** | Client identity, Matter reference, Party wallet addresses, Contract terms, Execution conditions, Attorney credentials |
| **Current Integration** | Partial - Connected to RABTUL Payment/Wallet, needs TwinOS for Client/Matter Twin integration |

### 2.2 Legal Research AI

| Attribute | Details |
|-----------|---------|
| **Company** | RTMZ (REZ Legal Document AI) |
| **Port** | 5004 |
| **Core Capabilities** | Document upload and processing, AI-powered clause extraction, Risk assessment and scoring, Compliance checking against frameworks, Q&A on legal documents, Standard clause library management |
| **Data Produced** | Document analysis results, Extracted clauses, Risk reports, Compliance assessments, Q&A responses, Clause comparisons |
| **Data Needed** | Document content, Client context, Matter context, Standard clause references, Compliance framework definitions, Attorney questions |
| **Current Integration** | Ready - Core AI services, needs TwinOS for matter context and document linking |

### 2.3 Compliance Checker

| Attribute | Details |
|-----------|---------|
| **Company** | RTNM Compliance |
| **Ports** | 4180-4185 |
| **Core Capabilities** | Communication compliance, Policy engine, Enforcement gateway, LLM compliance, Agent governance, Audit trail, Multi-framework support (GDPR, SOC2, HIPAA, PCI-DSS, ISO27001, SOX, CCPA, LGPD, DPDPA) |
| **Data Produced** | Compliance reports, Policy violations, Enforcement actions, Audit logs, Risk assessments |
| **Data Needed** | Document content, Communication records, User actions, Policy definitions, Framework requirements, Matter context |
| **Current Integration** | Partial - Policy engine and audit trail ready, needs TwinOS for matter-linked compliance tracking |

---

## 3. Twin Architecture

### 3.1 Client Twin

| Attribute | Details |
|-----------|---------|
| **Type** | Entity Digital Twin |
| **Twin ID** | `client-{uuid}` |
| **Port** | 4142-C1 |

**Attributes:**

```json
{
  "clientId": "uuid",
  "type": "individual|organization",
  
  "identity": {
    "fullName": "string",
    "email": "string",
    "phone": "string",
    "address": "object",
    "taxId": "string",
    "dateOfIncorporation": "date"
  },
  
  "organization": {
    "legalName": "string",
    "dba": "string",
    "industry": "string",
    "size": "startup|smb|mid-market|enterprise",
    "jurisdiction": "string",
    "registrationNumber": "string",
    "principalPlace": "string"
  },
  
  "matters": {
    "active": ["matter-uuid"],
    "closed": ["matter-uuid"],
    "pending": ["matter-uuid"]
  },
  
  "contacts": {
    "primary": "contact-uuid",
    "billing": "contact-uuid",
    "technical": "contact-uuid",
    "authorizedSignatories": ["contact-uuid"]
  },
  
  "contracts": {
    "active": ["contract-uuid"],
    "expired": ["contract-uuid"],
    "pending": ["contract-uuid"]
  },
  
  "billing": {
    "paymentTerms": "net-15|net-30|net-45|net-60",
    "billingEmail": "string",
    "creditLimit": "amount",
    "outstandingBalance": "amount",
    "preferredCurrency": "USD|INR|EUR"
  },
  
  "preferences": {
    "communicationChannel": "email|sms|whatsapp|portal",
    "language": "string",
    "timeZone": "string",
    "documentFormat": "pdf|docx",
    "billingFormat": "detailed|summary"
  },
  
  "wallet": {
    "balance": "amount",
    "currency": "string",
    "autoRecharge": "boolean",
    "rechargeThreshold": "amount"
  },
  
  "relationships": {
    "parentOrganization": "client-uuid",
    "subsidiaries": ["client-uuid"],
    "relatedParties": ["client-uuid"]
  },
  
  "metadata": {
    "clientSince": "date",
    "lastActivity": "datetime",
    "totalRevenue": "amount",
    "riskRating": "low|medium|high",
    "source": "referral|marketing|organic"
  }
}
```

**Relationships:**
- Linked to Matter Twin (all client matters)
- Linked to Contract Twin (active contracts)
- Linked to Document Twin (all client documents)
- Linked to Attorney Twin (relationship managers)
- Linked to Court Twin (court appearances)
- Owned by Client Twin Agent
- Synced with RABTUL Payment for billing
- Synced with RABTUL Wallet for payments

**Agents Managing Client Twin:**
- LawGens Client Intake Agent - New client onboarding
- LawGens Account Manager Agent - Relationship management
- LawGens Billing Agent - Invoice and payment tracking
- Contract OS Client Liaison Agent - Contract lifecycle
- Compliance OS Client Monitor Agent - Compliance tracking

---

### 3.2 Matter Twin

| Attribute | Details |
|-----------|---------|
| **Type** | Case/Matter Digital Twin |
| **Twin ID** | `matter-{uuid}` |
| **Port** | 4142-M1 |

**Attributes:**

```json
{
  "matterId": "uuid",
  "matterNumber": "string",
  
  "classification": {
    "type": "litigation|transactional|regulatory|compliance|advisory|miscellaneous",
    "subType": "string",
    "practiceArea": "corporate|IP|employment|real-estate|tax|family|criminal|bankruptcy",
    "jurisdiction": "string",
    "court": "string"
  },
  
  "client": {
    "clientId": "client-uuid",
    "clientName": "string",
    "matterTitle": "string"
  },
  
  "parties": {
    "client": "party-details",
    "opposing": "party-details",
    "thirdParties": ["party-details"]
  },
  
  "attorneys": {
    "responsible": "attorney-uuid",
    "lead": "attorney-uuid",
    "supporting": ["attorney-uuid"],
    "paralegals": ["uuid"],
    "externalCounsel": ["uuid"]
  },
  
  "timeline": {
    "opened": "datetime",
    "lastActivity": "datetime",
    "expectedClose": "date",
    "actualClose": "datetime",
    "status": "active|on-hold|closed|archived"
  },
  
  "documents": {
    "pleadings": ["document-uuid"],
    "contracts": ["document-uuid"],
    "correspondence": ["document-uuid"],
    "evidence": ["document-uuid"],
    "research": ["document-uuid"],
    "bills": ["document-uuid"]
  },
  
  "tasks": {
    "open": ["task-uuid"],
    "completed": ["task-uuid"],
    "overdue": ["task-uuid"]
  },
  
  "research": {
    "legalIssues": ["string"],
    "relevantCases": ["case-reference"],
    "statutes": ["string"],
    "aiQueries": ["query-uuid"]
  },
  
  "compliance": {
    "requirements": ["requirement-uuid"],
    "deadlines": ["deadline-uuid"],
    "filings": ["filing-uuid"],
    "status": "compliant|non-compliant|pending-review"
  },
  
  "billing": {
    "billingType": "hourly|fixed|contingency|pro-bono",
    "budget": "amount",
    "spent": "amount",
    "estimatedRemaining": "amount",
    "invoices": ["invoice-uuid"],
    "writeUps": "amount",
    "writeDowns": "amount"
  },
  
  "timeTracking": {
    "totalHours": "number",
    "hoursThisMonth": "number",
    "hoursLastMonth": "number",
    "breakdown": {
      "attorney": "number",
      "paralegal": "number",
      "support": "number"
    }
  },
  
  "risk": {
    "overallRisk": "low|medium|high|critical",
    "litigationRisk": "number",
    "complianceRisk": "number",
    "reputationalRisk": "number",
    "financialRisk": "number",
    "factors": ["string"]
  },
  
  "outcomes": {
    "result": "won|lost|settled|withdrawn|dismissed|pending",
    "summary": "string",
    "judgment": "amount",
    "settlement": "amount",
    "lessonsLearned": ["string"]
  },
  
  "metadata": {
    "source": "client-referral|existing-client|marketing|inbound",
    "priority": "low|normal|high|urgent",
    "confidentialityLevel": "public|private|highly-confidential",
    "tags": ["string"]
  }
}
```

**Relationships:**
- References Client Twin (matter owner)
- Linked to Attorney Twin (assigned team)
- Linked to Document Twin (all matter documents)
- Linked to Court Twin (court matters)
- Linked to Contract Twin (transactional matters)
- Linked to Legal Research AI (research queries)
- Linked to Compliance Checker (compliance requirements)
- Owned by Matter Manager Agent

**Agents Managing Matter Twin:**
- LawGens Matter Intake Agent - New matter creation
- LawGens Matter Manager Agent - Matter coordination
- LawGens Litigation Agent - Court proceedings
- Legal Research AI Research Agent - Legal research
- Compliance Checker Compliance Agent - Compliance monitoring
- Contract OS Matter Agent - Transactional support

---

### 3.3 Document Twin

| Attribute | Details |
|-----------|---------|
| **Type** | Legal Document Digital Twin |
| **Twin ID** | `document-{uuid}` |
| **Port** | 4142-D1 |

**Attributes:**

```json
{
  "documentId": "uuid",
  "documentNumber": "string",
  
  "classification": {
    "type": "contract|pleading|research| correspondence|evidence| memo|opinion|filing",
    "subType": "string",
    "category": "string"
  },
  
  "metadata": {
    "title": "string",
    "description": "string",
    "language": "string",
    "jurisdiction": "string",
    "confidentialityLevel": "public|internal|confidential|highly-confidential"
  },
  
  "source": {
    "uploadedBy": "attorney-uuid",
    "uploadedAt": "datetime",
    "originalFilename": "string",
    "fileType": "pdf|docx|html|txt",
    "fileSize": "number"
  },
  
  "matter": {
    "matterId": "matter-uuid",
    "matterNumber": "string",
    "clientId": "client-uuid"
  },
  
  "classification": {
    "type": "nda|msa|sow|employment|lease|purchase|partnership|license|subscription",
    "status": "draft|pending-review|pending-signature|signed|executed|expired|terminated",
    "riskLevel": "low|medium|high|critical"
  },
  
  "parties": {
    "client": "party-details",
    "counterparty": "party-details",
    "otherParties": ["party-details"]
  },
  
  "terms": {
    "effectiveDate": "date",
    "expirationDate": "date",
    "autoRenew": "boolean",
    "renewalTerm": "months",
    "governingLaw": "string",
    "disputeResolution": "string"
  },
  
  "clauses": {
    "extracted": ["clause-uuid"],
    "standardLibrary": ["clause-uuid"],
    "customClauses": ["clause-uuid"],
    "nonStandardDeviations": ["string"]
  },
  
  "analysis": {
    "legalResearchAI": {
      "analyzed": "boolean",
      "analysisDate": "datetime",
      "riskScore": "number",
      "riskLevel": "string",
      "keyClauses": ["string"],
      "redFlags": ["string"],
      "recommendations": ["string"]
    },
    "complianceChecker": {
      "checked": "boolean",
      "checkDate": "datetime",
      "frameworks": ["string"],
      "compliant": "boolean",
      "violations": ["string"],
      "remediation": ["string"]
    }
  },
  
  "versions": {
    "current": "number",
    "history": [
      {
        "version": "number",
        "createdAt": "datetime",
        "createdBy": "uuid",
        "changes": "string",
        "fileUrl": "string"
      }
    ]
  },
  
  "signatures": {
    "required": "boolean",
    "collected": ["signature-record"],
    "pending": ["signer-record"],
    "signedAt": "datetime",
    "signedBy": ["uuid"]
  },
  
  "workflow": {
    "currentStage": "draft|review|approval|signature|execution|archive",
    "stageHistory": ["stage-record"],
    "approvals": ["approval-record"],
    "comments": ["comment-record"]
  },
  
  "storage": {
    "primaryLocation": "string",
    "backupLocations": ["string"],
    "url": "string",
    "checksum": "string"
  },
  
  "metadata": {
    "createdAt": "datetime",
    "updatedAt": "datetime",
    "lastAccessed": "datetime",
    "tags": ["string"],
    "customFields": {}
  }
}
```

**Relationships:**
- References Client Twin (document owner)
- References Matter Twin (matter context)
- References Attorney Twin (author/reviewer)
- References Court Twin (court filings)
- Linked to Contract Twin (contract documents)
- Analyzed by Legal Research AI
- Checked by Compliance Checker
- Stored in Document Management System
- Signed via E-Signature Service

**Agents Managing Document Twin:**
- LawGens Document Intake Agent - Document ingestion
- Legal Research AI Document Analysis Agent - Clause extraction, risk assessment
- Compliance Checker Document Review Agent - Compliance verification
- Contract OS Document Execution Agent - Contract signing workflow
- LawGens Document Retrieval Agent - Search and retrieval

---

### 3.4 Attorney Twin

| Attribute | Details |
|-----------|---------|
| **Type** | Attorney/Professional Digital Twin |
| **Twin ID** | `attorney-{uuid}` |
| **Port** | 4142-A1 |

**Attributes:**

```json
{
  "attorneyId": "uuid",
  "employeeId": "string",
  
  "identity": {
    "firstName": "string",
    "lastName": "string",
    "middleName": "string",
    "preferredName": "string",
    "email": "string",
    "phone": "string",
    "photo": "url"
  },
  
  "credentials": {
    "barAdmission": [
      {
        "jurisdiction": "string",
        "barNumber": "string",
        "admittedDate": "date",
        "status": "active|suspended|disbarred|retired"
      }
    ],
    "education": [
      {
        "institution": "string",
        "degree": "string",
        "fieldOfStudy": "string",
        "graduationYear": "number"
      }
    ],
    "certifications": ["string"],
    "specializations": ["string"]
  },
  
  "employment": {
    "firm": "string",
    "department": "string",
    "title": "partner|senior-associate|associate|of-counsel|paralegal",
    "level": "number",
    "startDate": "date",
    "status": "active|leave|terminated"
  },
  
  "matters": {
    "assigned": ["matter-uuid"],
    "responsible": ["matter-uuid"],
    "supporting": ["matter-uuid"],
    "completed": ["matter-uuid"]
  },
  
  "clients": {
    "primaryRelationships": ["client-uuid"],
    "newClientsAcquired": "number"
  },
  
  "performance": {
    "utilization": {
      "billableTarget": "hours",
      "billableActual": "hours",
      "nonBillable": "hours",
      "targetAchievement": "percentage"
    },
    "realization": {
      "billed": "amount",
      "collected": "amount",
      "realizationRate": "percentage"
    },
    "efficiency": {
      "averageHoursPerMatter": "number",
      "mattersClosed": "number",
      "documentsProduced": "number"
    }
  },
  
  "billing": {
    "hourlyRates": {
      "standard": "amount",
      "courtAppearance": "amount",
      "consultation": "amount"
    },
    "wallet": {
      "balance": "amount",
      "pendingPayments": "amount"
    }
  },
  
  "workload": {
    "currentMatters": "number",
    "activeTasks": "number",
    "overdueTasks": "number",
    "upcomingDeadlines": "number"
  },
  
  "preferences": {
    "communicationChannel": "email|sms|whatsapp",
    "workingHours": "object",
    "notificationPreferences": "object",
    "matterTypes": ["string"]
  },
  
  "skills": {
    "practiceAreas": ["string"],
    "courtExperience": ["string"],
    "languages": ["string"],
    "technologies": ["string"]
  },
  
  "ai": {
    "enabled": "boolean",
    "assistant": "hojai-agent-uuid",
    "autoResearch": "boolean",
    "autoReview": "boolean"
  },
  
  "metadata": {
    "createdAt": "datetime",
    "lastLogin": "datetime",
    "lastActivity": "datetime"
  }
}
```

**Relationships:**
- Linked to Client Twin (client relationships)
- Linked to Matter Twin (assigned matters)
- Linked to Document Twin (authored documents)
- Linked to Court Twin (court appearances)
- Supervised by Attorney Twin (supervising attorney)
- Reports to Attorney Twin (line manager)
- Owned by Attorney Self-Service Agent

**Agents Managing Attorney Twin:**
- LawGens Attorney Onboarding Agent - New attorney setup
- LawGens Workload Balancer Agent - Matter assignment
- LawGens Performance Agent - Metrics tracking
- Legal Research AI Research Assistant Agent - Research support
- Compliance Checker License Monitor Agent - Bar compliance

---

### 3.5 Court Twin

| Attribute | Details |
|-----------|---------|
| **Type** | Court/Adjudication Digital Twin |
| **Twin ID** | `court-{uuid}` |
| **Port** | 4142-C2 |

**Attributes:**

```json
{
  "courtId": "uuid",
  "courtCode": "string",
  
  "identification": {
    "name": "string",
    "shortName": "string",
    "type": "supreme|federal|state|district|magistrate|tribunal|arbitration|icd",
    "level": "string",
    "chambers": "string"
  },
  
  "jurisdiction": {
    "geographicScope": "string",
    "subjectMatter": ["string"],
    "appellateDistricts": ["string"],
    "originalJurisdictions": ["string"]
  },
  
  "location": {
    "address": "object",
    "city": "string",
    "state": "string",
    "country": "string",
    "postalCode": "string",
    "coordinates": "object"
  },
  
  "contacts": {
    "clerk": "contact-details",
    "mainPhone": "string",
    "mainEmail": "string",
    "website": "url"
  },
  
  "filing": {
    "electronicFiling": "boolean",
    "efilingPortal": "url",
    "filingRequirements": ["string"],
    "filingFees": "object",
    "acceptableFormats": ["string"]
  },
  
  "proceedings": {
    "hearingRooms": "number",
    "availableSlots": "object",
    "typicalDuration": "object",
    "schedulingProcess": "string"
  },
  
  "matters": {
    "pendingCases": ["matter-uuid"],
    "completedCases": ["matter-uuid"],
    "dockets": ["docket-reference"]
  },
  
  "judges": {
    "chiefJudge": "judge-details",
    "judges": ["judge-details"],
    "magistrates": ["judge-details"],
    "clerks": ["contact-details"]
  },
  
  "procedures": {
    "localRules": ["string"],
    "standingOrders": ["string"],
    "caseManagement": "string",
    "discoveryRules": "string",
    "motionPractice": "string"
  },
  
  "timeline": {
    "averageProcessingTime": "object",
    "filingToService": "number",
    "serviceToResponse": "number",
    "discoveryPeriod": "number",
    "trialScheduling": "number"
  },
  
  "fees": {
    "filingFees": "object",
    "appearanceFees": "object",
    "motionFees": "object",
    "transcriptFees": "object",
    "exhibitFees": "object"
  },
  
  "requirements": {
    "counselRequirements": ["string"],
    "formattingStandards": ["string"],
    "mandatoryFilings": ["string"],
    "deadlineCalculations": "string"
  },
  
  "metadata": {
    "lastUpdated": "datetime",
    "lastSync": "datetime",
    "verificationStatus": "verified|pending|unverified"
  }
}
```

**Relationships:**
- Linked to Matter Twin (court proceedings)
- Linked to Attorney Twin (appearance attorneys)
- Linked to Document Twin (court filings)
- Synced with Court Electronic Filing (ECF) systems
- Synced with Legal Research databases (case law)
- Owned by Court Liaison Agent

**Agents Managing Court Twin:**
- LawGens Court Research Agent - Court information gathering
- LawGens Filing Agent - Electronic filing automation
- Legal Research AI Case Law Agent - Case citations and research
- LawGens Calendar Agent - Court date tracking

---

## 4. Integration Flows

### 4.1 Contract OS to Client/Matter Twins

| Attribute | Details |
|-----------|---------|
| **Source** | Contract OS |
| **Target** | TwinOS (Client Twin, Matter Twin) |
| **Direction** | Bidirectional |
| **Priority** | HIGH - Core Integration Point |

**Data Flow:**
Contract OS creates and manages machine-readable contracts. When a new contract is created, the relevant Client Twin is identified and linked. For transactional matters, a Matter Twin is created or linked. Contract execution events (signatures, milestones, payments) update the linked twins in real-time.

**API Endpoints:**

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/v1/client-twin/{clientId}/contract` | Link contract to client |
| GET | `/api/v1/client-twin/{clientId}/contracts` | Get all client contracts |
| POST | `/api/v1/matter-twin/{matterId}/contract` | Link contract to matter |
| GET | `/api/v1/matter-twin/{matterId}/contracts` | Get all matter contracts |
| POST | `/api/v1/twin/contract/sync` | Sync contract events to twins |
| PUT | `/api/v1/twin/contract/{contractId}/status` | Update contract status |

**Events:**
- `contract.created`
- `contract.signed`
- `contract.executed`
- `contract.renewed`
- `contract.expired`
- `contract.terminated`
- `payment.released`
- `milestone.completed`
- `escalation.triggered`

**Request/Response Examples:**

```json
// POST /api/v1/twin/contract/sync
{
  "event": "contract.signed",
  "contractId": "cnt_abc123",
  "clientId": "client_uuid",
  "matterId": "matter_uuid",
  "timestamp": "2026-06-12T10:30:00Z",
  "details": {
    "signerId": "attorney_uuid",
    "signatureHash": "0x...",
    "ipAddress": "192.168.1.1"
  }
}
```

**Error Handling:**
- Retry with exponential backoff (max 5 attempts)
- Dead letter queue for failed syncs
- Manual reconciliation UI for data discrepancies
- Webhook retry on TwinOS unavailability

---

### 4.2 Legal Research AI to Matter/Document Twins

| Attribute | Details |
|-----------|---------|
| **Source** | Legal Research AI |
| **Target** | TwinOS (Matter Twin, Document Twin) |
| **Direction** | Bidirectional |

**Data Flow:**
Legal Research AI analyzes documents and provides research results. Results are linked to the originating Matter Twin and Document Twin. Matter context (related cases, statutes, client history) is fetched from twins to enhance research quality.

**API Endpoints:**

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/v1/matter-twin/{matterId}/research` | Save research to matter |
| GET | `/api/v1/matter-twin/{matterId}/research` | Get matter research history |
| POST | `/api/v1/document-twin/{documentId}/analyze` | Trigger AI analysis |
| GET | `/api/v1/document-twin/{documentId}/analysis` | Get analysis results |
| POST | `/api/v1/twin/research/query` | Execute research with context |
| GET | `/api/v1/twin/research/similar-cases` | Find similar matters |

**Events:**
- `research.completed`
- `document.analyzed`
- `clause.extracted`
- `risk.assessed`
- `compliance.checked`
- `similar-case.found`

**Request/Response Examples:**

```json
// POST /api/v1/twin/research/query
{
  "query": "Force majeure clauses in software development agreements",
  "matterId": "matter_uuid",
  "context": {
    "clientIndustry": "technology",
    "jurisdiction": "Delaware",
    "counterpartyType": "enterprise"
  },
  "filters": {
    "caseTypes": ["contract-dispute", "software-development"],
    "dateRange": {"from": "2020-01-01", "to": "2026-06-12"},
    "courts": ["Delaware Superior Court", "Third Circuit"]
  }
}

// Response
{
  "researchId": "res_xyz789",
  "query": "Force majeure clauses in software development agreements",
  "results": {
    "caseLaw": [
      {
        "caseId": "case_123",
        "citation": "TechCorp v. Vendor Inc., 2023 WL 1234567",
        "relevanceScore": 0.92,
        "summary": "Force majeure clause did not apply to pandemic-related delays...",
        "keyHoldings": ["Pandemic qualifies as force majeure event", "Notice requirements must be strictly followed"]
      }
    ],
    "statutes": [...],
    "secondarySources": [...],
    "practitionerResources": [...]
  },
  "savedToMatter": "matter_uuid",
  "generatedAt": "2026-06-12T10:30:00Z"
}
```

**Error Handling:**
- Research timeout: 30 seconds for quick queries, 5 minutes for deep research
- Rate limiting: 100 requests/minute per matter
- Context validation before research execution
- Automatic query reformulation on poor results

---

### 4.3 Compliance Checker to Matter/Document Twins

| Attribute | Details |
|-----------|---------|
| **Source** | Compliance Checker |
| **Target** | TwinOS (Matter Twin, Document Twin, Client Twin) |
| **Direction** | Bidirectional |

**Data Flow:**
Compliance Checker monitors documents and communications for regulatory compliance. Violations trigger alerts on the linked Matter Twin and notify responsible Attorney Twin. Client Twin carries the overall compliance posture for the client.

**API Endpoints:**

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/v1/client-twin/{clientId}/compliance` | Check client compliance |
| GET | `/api/v1/client-twin/{clientId}/compliance/status` | Get compliance status |
| POST | `/api/v1/matter-twin/{matterId}/compliance/check` | Check matter compliance |
| POST | `/api/v1/document-twin/{documentId}/compliance/check` | Check document compliance |
| GET | `/api/v1/twin/compliance/frameworks` | Get supported frameworks |
| POST | `/api/v1/twin/compliance/policy` | Create compliance policy |

**Events:**
- `compliance.check.completed`
- `violation.detected`
- `violation.remediated`
- `policy.created`
- `policy.updated`
- `audit.scheduled`
- `deadline.approaching`

**Supported Frameworks:**
- GDPR (Data Protection)
- SOC2 (Security)
- HIPAA (Healthcare)
- PCI-DSS (Payment Cards)
- ISO27001 (Information Security)
- SOX (Corporate Governance)
- CCPA (Consumer Privacy)
- LGPD (Brazilian Privacy)
- DPDPA (Indian Privacy)
- SEBI (Capital Markets)

---

### 4.4 TwinOS to RABTUL Payment/Wallet

| Attribute | Details |
|-----------|---------|
| **Source** | TwinOS |
| **Target** | RABTUL Payment, RABTUL Wallet |
| **Direction** | Bidirectional |

**Data Flow:**
TwinOS manages the financial aspects of legal matters. Client Twin carries billing preferences and wallet balance. Matter Twin tracks billing information. Contract Twin triggers payment events. Payments are processed through RABTUL.

**API Endpoints:**

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/v1/client-twin/{clientId}/invoice` | Create invoice |
| GET | `/api/v1/matter-twin/{matterId}/billing` | Get matter billing summary |
| POST | `/api/v1/twin/payment/contract` | Process contract payment |
| POST | `/api/v1/twin/wallet/recharge` | Recharge client wallet |
| GET | `/api/v1/twin/wallet/{clientId}/balance` | Get wallet balance |

---

## 5. Agent Architecture

### 5.1 Client Management Agents

#### 5.1.1 Client Intake Agent

| Attribute | Details |
|-----------|---------|
| **Role** | New client onboarding and registration |
| **Autonomy Level** | L3 (Autonomous) |
| **Twin Managed** | Client Twin (primary) |

**Actions:**
- Collect client information via web form, chat, or phone
- Verify client identity and credentials
- Create Client Twin with complete profile
- Assign relationship manager (Attorney Twin)
- Set up billing preferences
- Configure communication preferences
- Trigger compliance KYC/AML checks

**Skills:**
- Identity verification (KYC)
- Form processing (web, chat, voice)
- Document collection
- Compliance screening
- CRM integration
- Multi-language support

#### 5.1.2 Account Manager Agent

| Attribute | Details |
|-----------|---------|
| **Role** | Client relationship and engagement management |
| **Autonomy Level** | L3 (Autonomous) |
| **Twin Managed** | Client Twin (primary), Matter Twin (secondary) |

**Actions:**
- Monitor client activity across all matters
- Send proactive updates and alerts
- Coordinate cross-matter communications
- Identify upsell and cross-sell opportunities
- Track client satisfaction (NPS)
- Manage client onboarding to new services
- Handle routine inquiries and requests

**Skills:**
- Client health scoring
- Relationship management
- Sentiment analysis
- Multi-channel communication
- Escalation management
- Business development

---

### 5.2 Matter Management Agents

#### 5.2.1 Matter Intake Agent

| Attribute | Details |
|-----------|---------|
| **Role** | New matter creation and classification |
| **Autonomy Level** | L3 (Autonomous) |
| **Twin Managed** | Matter Twin (primary), Client Twin (link) |

**Actions:**
- Process new matter requests
- Classify matter type and practice area
- Assign matter number
- Link to Client Twin
- Identify responsible attorney
- Set up matter workspace
- Configure billing parameters
- Establish matter-specific compliance requirements

**Skills:**
- Matter classification
- Workflow automation
- Attorney assignment optimization
- Compliance requirement identification
- Document template selection

#### 5.2.2 Matter Manager Agent

| Attribute | Details |
|-----------|---------|
| **Role** | Matter coordination and timeline management |
| **Autonomy Level** | L3 (Autonomous) |
| **Twin Managed** | Matter Twin (primary), Document Twin, Attorney Twin |

**Actions:**
- Track matter progress and milestones
- Manage task assignment and deadlines
- Coordinate attorney workload
- Generate matter status reports
- Flag at-risk matters
- Manage document workflow
- Coordinate external parties
- Trigger matter closure procedures

**Skills:**
- Project management
- Deadline tracking
- Workload balancing
- Risk flagging
- Report generation
- Document coordination

---

### 5.3 Document Management Agents

#### 5.3.1 Document Intake Agent

| Attribute | Details |
|-----------|---------|
| **Role** | Document ingestion and classification |
| **Autonomy Level** | L3 (Autonomous) |
| **Twin Managed** | Document Twin (primary), Matter Twin (link) |

**Actions:**
- Receive documents via upload, email, or integration
- Classify document type and confidentiality level
- Extract metadata automatically
- Link to relevant Matter Twin
- Trigger AI analysis
- Route for appropriate review
- Manage version control

**Skills:**
- Document classification
- OCR and text extraction
- Metadata extraction
- Duplicate detection
- Version management
- Format conversion

#### 5.3.2 Contract Execution Agent

| Attribute | Details |
|-----------|---------|
| **Role** | Contract lifecycle and signature management |
| **Autonomy Level** | L3 (Autonomous) |
| **Twin Managed** | Contract Twin, Client Twin, Matter Twin |

**Actions:**
- Prepare contracts for signature
- Manage signature workflow
- Track signature status
- Handle counterparty coordination
- Archive executed contracts
- Monitor renewal dates
- Trigger auto-renewal processes
- Execute automatic contract actions

**Skills:**
- E-signature integration
- Workflow orchestration
- Counterparty management
- Deadline monitoring
- Conditional execution
- Escalation management

---

### 5.4 Research and Analysis Agents

#### 5.4.1 Legal Research Agent

| Attribute | Details |
|-----------|---------|
| **Role** | AI-powered legal research and case analysis |
| **Autonomy Level** | L3 (Autonomous) |
| **Twin Managed** | Matter Twin (context), Document Twin (output) |

**Actions:**
- Execute legal research queries
- Analyze case law and statutes
- Identify relevant precedents
- Extract key holdings and reasoning
- Generate research summaries
- Maintain research history
- Track case citations
- Identify similar matters

**Skills:**
- Natural language legal queries
- Case law analysis
- Statute interpretation
- Citation verification
- Summarization
- Research methodology

#### 5.4.2 Document Analysis Agent

| Attribute | Details |
|-----------|---------|
| **Role** | AI document analysis and clause extraction |
| **Autonomy Level** | L3 (Autonomous) |
| **Twin Managed** | Document Twin (primary), Matter Twin (context) |

**Actions:**
- Analyze document content
- Extract clauses automatically
- Assess contract risk
- Identify non-standard terms
- Compare to standard library
- Generate risk reports
- Suggest redline recommendations
- Monitor for material changes

**Skills:**
- NLP document analysis
- Clause extraction
- Risk scoring
- Standard comparison
- Redline generation
- Change detection

---

### 5.5 Compliance Agents

#### 5.5.1 Compliance Monitor Agent

| Attribute | Details |
|-----------|---------|
| **Role** | Continuous compliance monitoring and alerting |
| **Autonomy Level** | L3 (Autonomous) |
| **Twin Managed** | Matter Twin, Document Twin, Client Twin |

**Actions:**
- Monitor documents for compliance violations
- Track regulatory deadlines
- Manage compliance checklists
- Generate compliance reports
- Coordinate remediation efforts
- Maintain audit trail
- Update policy requirements
- Flag emerging risks

**Skills:**
- Multi-framework compliance
- Risk assessment
- Deadline management
- Audit trail management
- Report generation
- Regulatory monitoring

#### 5.5.2 Policy Engine Agent

| Attribute | Details |
|-----------|---------|
| **Role** | Policy creation and enforcement |
| **Autonomy Level** | L3 (Autonomous) |
| **Twin Managed** | Matter Twin, Document Twin |

**Actions:**
- Create and update compliance policies
- Evaluate documents against policies
- Enforce policy requirements
- Manage policy exceptions
- Track policy acknowledgments
- Generate policy reports

**Skills:**
- Policy authoring
- Rule engine management
- Exception handling
- Policy distribution
- Acknowledgment tracking

---

### 5.6 Attorney Support Agents

#### 5.6.1 Workload Balancer Agent

| Attribute | Details |
|-----------|---------|
| **Role** | Attorney workload optimization |
| **Autonomy Level** | L3 (Autonomous) |
| **Twin Managed** | Attorney Twin, Matter Twin |

**Actions:**
- Track attorney availability
- Monitor matter assignments
- Balance workload distribution
- Identify burnout risks
- Optimize matter allocation
- Coordinate coverage
- Manage attorney utilization

**Skills:**
- Workload analysis
- Assignment optimization
- Utilization tracking
- Coverage coordination
- Capacity planning

#### 5.6.2 Calendar Agent

| Attribute | Details |
|-----------|---------|
| **Role** | Court dates and deadline management |
| **Autonomy Level** | L3 (Autonomous) |
| **Twin Managed** | Matter Twin, Attorney Twin, Court Twin |

**Actions:**
- Track court dates and deadlines
- Send calendar reminders
- Coordinate attorney availability
- Manage courtroom logistics
- Monitor filing deadlines
- Process scheduling orders
- Handle rescheduling requests

**Skills:**
- Calendar integration
- Deadline calculation
- Court rules compliance
- Conflict detection
- Reminder management

---

## 6. Business Copilot Integration

### 6.1 Insights Available to Law Firm Partners

**Operational Insights:**
- Matter status distribution
- Attorney utilization rates
- Document turnaround times
- Task completion rates
- Average matter duration
- Client acquisition trends

**Financial Insights:**
- Revenue by practice area
- Realization and collection rates
- Billable hours by attorney
- Revenue per client
- Matter profitability
- Invoice aging breakdown

**Client Insights:**
- Client health scores
- Relationship strength metrics
- Cross-selling opportunities
- Client satisfaction trends
- Retention risk indicators

**Compliance Insights:**
- Open compliance items
- Policy violation trends
- Upcoming deadlines
- Audit findings
- Risk exposure by framework

### 6.2 Natural Language Queries Supported

| Category | Sample Queries |
|----------|---------------|
| **Matters** | "Show me all active litigation matters", "Which matters are at risk?", "What's the status of the ABC Corp case?" |
| **Documents** | "Find all NDAs expiring next quarter", "Show contracts pending signature", "List high-risk contracts in my portfolio" |
| **Research** | "What are recent rulings on force majeure?", "Find cases similar to our TechCorp dispute", "Summarize relevant case law on employment arbitration" |
| **Compliance** | "What's our GDPR compliance status?", "Show all open compliance items", "Which matters have upcoming regulatory deadlines?" |
| **Financial** | "What's our revenue this quarter by practice area?", "Show top 10 clients by billings", "What's our average realization rate?" |
| **Performance** | "How are my associates performing?", "Which attorneys are underutilized?", "Compare matter outcomes by team" |

### 6.3 Dashboard Views Needed

**Executive Dashboard:**
- Revenue summary (MTD, QTD, YTD)
- Matter pipeline and funnel
- Key performance indicators
- Client health overview
- Compliance risk summary
- Alerts and action items

**Practice Area Dashboard:**
- Matter count and value by area
- Attorney allocation
- Client distribution
- Revenue trends
- Competitive analysis

**Attorney Dashboard:**
- Personal matters and tasks
- Utilization and targets
- Billable hours
- Upcoming deadlines
- Professional development

**Client Dashboard:**
- All matters for client
- Documents and communications
- Billing and payments
- Compliance status
- Relationship notes

**Compliance Dashboard:**
- Framework compliance scores
- Open violations
- Upcoming deadlines
- Policy acknowledgments
- Audit history

---

## 7. Economic Integration

### 7.1 Payment Flows

```
Client Onboarding Flow:
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Client    │────>│ Client Twin  │────>│  RABTUL     │
│  Intake     │     │   (Profile)  │     │  Wallet     │
└─────────────┘     └──────────────┘     └─────────────┘
                                              │
                                              v
                   ┌────────────────────────────────────────┐
                   │            Matter Twin                  │
                   │   (Billing Configuration)               │
                   └────────────────────────────────────────┘
                                              │
                          ┌───────────────────┴───────────────────┐
                          v                                       v
                   ┌─────────────┐                         ┌─────────────┐
                   │  Contract   │                         │  Invoice    │
                   │    OS      │                         │  Generator  │
                   └─────────────┘                         └─────────────┘
                          │                                       │
                          v                                       v
                   ┌─────────────────────────────────────────────────┐
                   │              RABTUL Payment                      │
                   │     (Payment Processing & Settlement)            │
                   └─────────────────────────────────────────────────┘
```

### 7.2 Rewards/Loyalty Integration

**Legal Services Rewards Program:**
- Points earned for timely payments
- Points for contract renewals
- Points for referrals
- Points for compliance program participation
- Points for bulk engagements

**Rewards Redemption:**
- Discounts on future matters
- Reduced hourly rates
- Free compliance reviews
- Priority scheduling
- Premium support access

### 7.3 Wallet Usage

**RABTUL Wallet Integration for Legal:**

| Use Case | Flow |
|----------|------|
| **Retainer Deposit** | Client wallet funded at engagement start |
| **Invoice Payment** | Auto-deduct from wallet on due date |
| **Contract Payments** | Milestone payments from wallet |
| **Expenses** | Court fees, filing fees from wallet |
| **Rewards Accumulation** | Legal rewards credited to wallet |

**Wallet Balances for Legal:**
- Client wallet: Retainers, payments, expenses
- Attorney wallet: Expense reimbursements
- Matter wallet: Project-specific funds (escrow, deposits)
- Rewards wallet: Legal-specific reward points

---

## 8. Implementation Roadmap

### Phase 1: Core Integration (Weeks 1-2)

#### Week 1 (Days 1-5)

**Tasks:**
1. Set up TwinOS infrastructure for Legal Services vertical
2. Deploy Client Twin and Matter Twin data models
3. Create Contract OS to TwinOS sync API endpoints
4. Configure RABTUL Auth integration for legal compliance
5. Set up Document Twin for contract management
6. Implement basic Client Twin with billing preferences
7. Implement basic Matter Twin with task tracking

#### Week 2 (Days 6-10)

**Tasks:**
1. Integrate Contract OS client registration to Client Twin
2. Integrate Contract OS matter creation to Matter Twin
3. Connect Document Twin to Contract OS documents
4. Enable basic Attorney Twin with credentials
5. Deploy Client Intake Agent with onboarding workflow
6. Deploy Matter Intake Agent with classification
7. End-to-end testing of core matter lifecycle
8. UAT with 3 pilot law firms

**Phase 1 Deliverables:**
- TwinOS Legal namespace deployed
- Client Twin with billing and preferences
- Matter Twin with classification and tasks
- Attorney Twin with credentials and workload
- Document Twin with contract linking
- Contract OS bidirectional sync operational
- 2 operational AI agents (Client Intake, Matter Intake)
- 3 pilot firm integrations live

---

### Phase 2: Advanced Features (Weeks 3-4)

#### Week 3 (Days 11-15)

**Tasks:**
1. Integrate Legal Research AI to Matter/Document Twins
2. Deploy Legal Research Agent with case law analysis
3. Deploy Document Analysis Agent with clause extraction
4. Connect Compliance Checker for document monitoring
5. Implement Compliance Monitor Agent
6. Deploy Policy Engine Agent
7. Integrate Court Twin with matter linkage
8. Connect Calendar Agent for court dates

#### Week 4 (Days 16-20)

**Tasks:**
1. Deploy Workload Balancer Agent for attorney optimization
2. Deploy Contract Execution Agent for signature workflow
3. Integrate all agents with Business Copilot
4. Implement Business Copilot dashboards (executive, attorney, client)
5. Performance optimization and load testing
6. Security audit and compliance review
7. Mobile app integration for attorney access
8. Client portal integration for matter visibility

**Phase 2 Deliverables:**
- Legal Research AI fully integrated with Matter/Document Twins
- Document Analysis with clause extraction and risk scoring
- Compliance Checker monitoring across all documents
- Court Twin with calendar integration
- 8 operational AI agents covering full legal workflow
- Business Copilot dashboards for partners, attorneys, clients
- Mobile and portal access operational

---

### Phase 3: Optimization & Scale (Weeks 5-6)

#### Week 5 (Days 21-25)

**Tasks:**
1. Implement predictive matter risk scoring
2. Optimize agent performance based on pilot feedback
3. Scale infrastructure for 100+ firms
4. Implement cross-firm knowledge sharing via anonymized insights
5. Deploy Business Copilot for firm benchmarking
6. Integrate additional practice area workflows
7. Set up real-time compliance alerts and escalations
8. Implement advanced search and discovery

#### Week 6 (Days 26-30)

**Tasks:**
1. Full deployment across all pilot firms
2. Training program for attorneys on AI workflows
3. Training program for partners on Business Copilot
4. Client education on matter portal access
5. Performance monitoring and SLA tracking
6. Feedback collection and agent refinement
7. Documentation and knowledge base creation
8. Go-live celebration and success metrics review

**Phase 3 Deliverables:**
- Predictive risk scoring from combined matter data
- 100+ firm deployment capability
- Business Copilot benchmarking across firms
- Complete training programs (attorney, partner, client)
- Real-time alerts and escalations operational
- Production-ready Legal Services OS

---

## Appendix A: API Endpoint Summary

| Integration | Source | Target | Key Endpoints |
|-------------|--------|--------|---------------|
| Contract-Client | Contract OS | Client Twin | `/client-twin/{id}/contract`, `/client-twin/{id}/contracts` |
| Contract-Matter | Contract OS | Matter Twin | `/matter-twin/{id}/contract`, `/matter-twin/{id}/contracts` |
| Contract-TwinSync | Contract OS | TwinOS | `/twin/contract/sync`, `/twin/contract/{id}/status` |
| Research-Matter | Legal Research AI | Matter Twin | `/matter-twin/{id}/research`, `/matter-twin/{id}/research` |
| Research-Document | Legal Research AI | Document Twin | `/document-twin/{id}/analyze`, `/document-twin/{id}/analysis` |
| Research-Query | Legal Research AI | TwinOS | `/twin/research/query`, `/twin/research/similar-cases` |
| Compliance-Client | Compliance Checker | Client Twin | `/client-twin/{id}/compliance`, `/client-twin/{id}/compliance/status` |
| Compliance-Matter | Compliance Checker | Matter Twin | `/matter-twin/{id}/compliance/check` |
| Compliance-Document | Compliance Checker | Document Twin | `/document-twin/{id}/compliance/check` |
| Compliance-Policy | Compliance Checker | TwinOS | `/twin/compliance/frameworks`, `/twin/compliance/policy` |
| Payment-Invoice | TwinOS | RABTUL Payment | `/client-twin/{id}/invoice`, `/matter-twin/{id}/billing` |
| Wallet-Recharge | TwinOS | RABTUL Wallet | `/twin/wallet/recharge`, `/twin/wallet/{id}/balance` |

---

## Appendix B: Event Summary

| Event | Source | Target | Trigger |
|-------|--------|--------|---------|
| `client.registered` | Client Intake Agent | Client Twin | New client created |
| `matter.opened` | Matter Intake Agent | Matter Twin | New matter created |
| `matter.updated` | Matter Manager Agent | Matter Twin | Matter status changed |
| `document.uploaded` | Document Intake Agent | Document Twin | Document received |
| `document.analyzed` | Document Analysis Agent | Document Twin | AI analysis completed |
| `contract.created` | Contract OS | Client/Matter Twin | Contract initiated |
| `contract.signed` | Contract OS | Client/Matter Twin | All signatures collected |
| `contract.executed` | Contract OS | Client/Matter Twin | Contract goes live |
| `contract.renewed` | Contract OS | Client/Matter Twin | Auto-renewal triggered |
| `contract.expired` | Contract OS | Client/Matter Twin | Contract term ended |
| `research.completed` | Legal Research Agent | Matter Twin | Research query finished |
| `clause.extracted` | Document Analysis Agent | Document Twin | Clause extraction done |
| `risk.assessed` | Document Analysis Agent | Document Twin | Risk score calculated |
| `compliance.check.completed` | Compliance Monitor Agent | All Twins | Compliance check done |
| `violation.detected` | Compliance Monitor Agent | Matter/Client Twin | Compliance breach found |
| `attorney.assigned` | Workload Balancer | Attorney/Matter Twin | Matter assignment |
| `deadline.approaching` | Calendar Agent | Matter Twin | Court date within 5 days |

---

## Appendix C: Port Registry for Legal Services OS

| Service | Port | Purpose |
|---------|------|---------|
| TwinOS Gateway | 4142 | All Twin access |
| Client Twin | 4142-C1 | Client entity management |
| Matter Twin | 4142-M1 | Matter/event management |
| Document Twin | 4142-D1 | Document management |
| Attorney Twin | 4142-A1 | Attorney entity management |
| Court Twin | 4142-C2 | Court information management |
| Contract OS | 4190 | Contract lifecycle engine |
| Legal Research AI | 5004 | Legal document analysis |
| Communication Compliance | 4180 | Compliance monitoring |
| Policy Engine | 4181 | Policy management |
| Enforcement Gateway | 4182 | Compliance enforcement |
| LLM Compliance | 4183 | AI compliance checking |
| Agent Governance | 4184 | AI agent oversight |
| Audit Trail | 4185 | Compliance audit logs |
| RABTUL Auth | 4002 | JWT authentication |
| RABTUL Payment | 4001 | Payment processing |
| RABTUL Wallet | 4004 | Balance management |
| RABTUL Notify | 4005 | Notifications |
| HOJAI Gateway | 4500 | AI agent orchestration |
| HOJAI Memory | 4520 | Context storage |
| HOJAI Agents | 4550 | Agent deployment |
| LawGens API | 5099 | Main legal API |
| RTMZ GraphQL | 5000 | GraphQL gateway |
| RTMZ Contract | 5003 | Contract management |
| RTMZ Cosmic Twin | 5005 | Digital twin core |

---

## Appendix D: TwinOS JSON Schema Reference

### Client Twin Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "title": "Client Twin Schema",
  "description": "Digital twin representation of a legal services client",
  "properties": {
    "clientId": {
      "type": "string",
      "format": "uuid",
      "description": "Unique identifier for the client twin"
    },
    "type": {
      "type": "string",
      "enum": ["individual", "organization"],
      "description": "Client type"
    },
    "identity": {
      "type": "object",
      "properties": {
        "fullName": { "type": "string" },
        "email": { "type": "string", "format": "email" },
        "phone": { "type": "string" },
        "address": { "$ref": "#/definitions/address" }
      },
      "required": ["fullName", "email"]
    },
    "organization": {
      "type": "object",
      "properties": {
        "legalName": { "type": "string" },
        "dba": { "type": "string" },
        "industry": { "type": "string" },
        "size": { "type": "string", "enum": ["startup", "smb", "mid-market", "enterprise"] }
      }
    },
    "billing": {
      "type": "object",
      "properties": {
        "paymentTerms": { "type": "string" },
        "billingEmail": { "type": "string" },
        "creditLimit": { "type": "number" }
      }
    }
  },
  "required": ["clientId", "type", "identity"]
}
```

### Matter Twin Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "title": "Matter Twin Schema",
  "description": "Digital twin representation of a legal matter",
  "properties": {
    "matterId": {
      "type": "string",
      "format": "uuid"
    },
    "matterNumber": {
      "type": "string",
      "description": "Human-readable matter identifier"
    },
    "classification": {
      "type": "object",
      "properties": {
        "type": {
          "type": "string",
          "enum": ["litigation", "transactional", "regulatory", "compliance", "advisory", "miscellaneous"]
        },
        "practiceArea": {
          "type": "string",
          "enum": ["corporate", "IP", "employment", "real-estate", "tax", "family", "criminal", "bankruptcy"]
        }
      }
    },
    "client": {
      "type": "object",
      "properties": {
        "clientId": { "type": "string", "format": "uuid" },
        "clientName": { "type": "string" }
      }
    },
    "attorneys": {
      "type": "object",
      "properties": {
        "responsible": { "type": "string", "format": "uuid" },
        "lead": { "type": "string", "format": "uuid" },
        "supporting": {
          "type": "array",
          "items": { "type": "string", "format": "uuid" }
        }
      }
    },
    "timeline": {
      "type": "object",
      "properties": {
        "opened": { "type": "string", "format": "date-time" },
        "status": { "type": "string", "enum": ["active", "on-hold", "closed", "archived"] }
      }
    },
    "billing": {
      "type": "object",
      "properties": {
        "billingType": { "type": "string", "enum": ["hourly", "fixed", "contingency", "pro-bono"] },
        "budget": { "type": "number" },
        "spent": { "type": "number" }
      }
    }
  },
  "required": ["matterId", "matterNumber", "classification", "client"]
}
```

---

**Document Version:** 1.0
**Last Updated:** June 12, 2026
**Status:** Ready for Implementation
**Prepared by:** Claude Code (AI Assistant)
