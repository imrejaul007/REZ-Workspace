# Government & Public Services Industry OS - Integration Specification

**Version:** 1.0
**Date:** June 12, 2026
**Status:** Ready for Implementation
**Owner:** RTNM Digital

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Capability Matrix](#2-product-capability-matrix)
3. [Twin Architecture](#3-twin-architecture)
4. [Integration Flows](#4-integration-flows)
5. [Agent Architecture](#5-agent-architecture)
6. [Business Copilot Queries](#6-business-copilot-queries)
7. [Economic Integration](#7-economic-integration)
8. [Implementation Roadmap](#8-implementation-roadmap)

---

## 1. Executive Summary

### 1.1 Industry Overview

Government and public services operations face significant challenges in delivering citizen-centric, efficient, and transparent services:

| Challenge | Impact | Solution via Government OS |
|-----------|--------|---------------------------|
| **Fragmented Citizen Data** | Citizens interact with multiple departments, creating siloed records | Citizen Twin provides unified 360-degree citizen view |
| **Manual Service Delivery** | Citizens wait days/weeks for permits, approvals, and responses | Service Twin automates routing and tracking |
| **Compliance Complexity** | Multiple regulatory frameworks (RTI, GDPR, eGov standards) | Compliance Suite with automated monitoring |
| **Departmental Silos** | Citizens repeat information across departments | Department Twin enables cross-department data sharing |
| **Permit Bottlenecks** | Critical permits delayed due to manual processing | Permit Twin with AI-powered routing |
| **Complaint Resolution** | Citizen complaints lost or delayed without visibility | Complaint Twin with SLA tracking |
| **Trust Deficits** | Citizens distrust government processes | Trust OS with transparency and accountability |

### 1.2 Current Product Landscape

```
GOVERNMENT & PUBLIC SERVICES ECOSYSTEM
├── Compliance Suite (Axom)
│   └── Communication compliance, policy engine, audit trail
│
├── Compliance Checker (LawGens)
│   └── Multi-framework regulatory compliance (RTI, GDPR, eGov)
│
├── Trust OS (Axom)
│   └── Trust infrastructure, verification, governance
│
├── RABTUL Auth (RABTUL Technologies)
│   ├── Government-grade authentication (4002)
│   ├── Digital identity management
│   └── Multi-factor authentication
│
├── MemoryOS (HOJAI AI)
│   └── Citizen memory, context persistence
│
└── TwinOS Hub (Government OS)
    ├── Citizen Twin
    ├── Service Twin
    ├── Department Twin
    ├── Permit Twin
    └── Complaint Twin
```

### 1.3 Key Integration Opportunity

**Primary Integration Point:** RABTUL Auth ↔ TwinOS (Citizen Twin)

This integration enables:
- Government-grade citizen identity verification
- Single sign-on across all government services
- Citizen profile synchronization with service records
- Consent management for data sharing
- Audit trail for all citizen interactions

### 1.4 Expected Outcomes

| Outcome | Metric | Impact |
|---------|--------|--------|
| Service Delivery Time | 60% reduction in average processing time | Improved citizen satisfaction |
| Permit Processing | 45% faster permit approvals | Economic development acceleration |
| Complaint Resolution | 80% SLA compliance | Enhanced government credibility |
| Compliance Coverage | 95% automated monitoring | Reduced regulatory risk |
| Citizen Engagement | 40% increase in digital adoption | Cost reduction in service delivery |

---

## 2. Product Capability Matrix

### 2.1 Compliance Suite

| Attribute | Details |
|-----------|---------|
| **Company** | Axom |
| **Port** | 4180-4185 |
| **Tech Stack** | Node.js, Express, MongoDB |
| **Core Capabilities** | Communication compliance, Policy engine, Enforcement gateway, LLM compliance, Agent governance, Audit trail |
| **Data Produced** | Compliance reports, Policy violations, Enforcement actions, Audit logs, Risk assessments |
| **Data Needed** | Communication records, User actions, Policy definitions, Framework requirements, Citizen context |
| **Current Integration** | Partial - Policy engine ready, needs TwinOS for citizen-linked compliance tracking |

### 2.2 Compliance Checker

| Attribute | Details |
|-----------|---------|
| **Company** | LawGens |
| **Port** | 4180-4185 |
| **Tech Stack** | Node.js, Express, Python AI |
| **Core Capabilities** | Multi-framework compliance (RTI, GDPR, IT Act, eGov standards), Document verification, Regulatory updates |
| **Data Produced** | Compliance assessments, Violation reports, Framework adherence scores, Remediation plans |
| **Data Needed** | Citizen data, Service records, Department policies, Regulatory framework definitions |
| **Current Integration** | Partial - Core compliance ready, needs TwinOS for cross-department compliance tracking |

### 2.3 Trust OS

| Attribute | Details |
|-----------|---------|
| **Company** | Axom |
| **Port** | 4200-4210 |
| **Tech Stack** | Node.js, Express, Blockchain |
| **Core Capabilities** | Trust infrastructure, Verification services, Governance framework, Reputation scoring |
| **Data Produced** | Trust scores, Verification records, Governance logs, Reputation metrics |
| **Data Needed** | Citizen profiles, Service interactions, Department evaluations, Historical data |
| **Current Integration** | Partial - Trust infrastructure ready, needs TwinOS for citizen/department trust modeling |

### 2.4 RABTUL Auth

| Attribute | Details |
|-----------|---------|
| **Company** | RABTUL Technologies |
| **Port** | 4002 |
| **Tech Stack** | Node.js, Express, Redis, MongoDB |
| **Core Capabilities** | Government-grade authentication, JWT/OTP/OAuth, Multi-factor authentication, Role-based access control, Session management |
| **Data Produced** | Auth tokens, Session records, Access logs, Identity verifications |
| **Data Needed** | Citizen credentials, Identity documents, Department access rules |
| **Current Integration** | Ready - Core auth service, needs TwinOS for Citizen Twin identity resolution |

### 2.5 MemoryOS

| Attribute | Details |
|-----------|---------|
| **Company** | HOJAI AI |
| **Port** | 4520 |
| **Tech Stack** | Node.js, Python, MongoDB, Redis |
| **Core Capabilities** | Citizen memory, Context persistence, Interaction history, Preference storage |
| **Data Produced** | Memory records, Context snapshots, Preference profiles, Interaction logs |
| **Data Needed** | Citizen identity, Service interactions, Communication history |
| **Current Integration** | Partial - Memory service ready, needs TwinOS for Citizen Twin integration |

### 2.6 Product Integration Status Summary

| Product | Integration Status | Key Integration Points |
|---------|-------------------|----------------------|
| Compliance Suite | PARTIAL | TwinOS (Citizen Twin, Department Twin) |
| Compliance Checker | PARTIAL | TwinOS (Department Twin, Service Twin) |
| Trust OS | PARTIAL | TwinOS (Citizen Twin, Department Twin) |
| RABTUL Auth | READY | TwinOS (Citizen Twin) - PRIMARY |
| MemoryOS | PARTIAL | TwinOS (Citizen Twin) |

---

## 3. Twin Architecture

### 3.1 Core Government Twins

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    GOVERNMENT & PUBLIC SERVICES TWINOS                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐                │
│  │   CITIZEN    │◄───►│   SERVICE   │◄───►│  DEPARTMENT  │                │
│  │    TWIN      │     │    TWIN      │     │    TWIN      │                │
│  │   (5251)     │     │   (5252)     │     │   (5253)     │                │
│  └──────────────┘     └──────────────┘     └──────────────┘                │
│         │                    │                    │                        │
│         │                    │                    │                        │
│         ▼                    ▼                    ▼                        │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐                │
│  │   PERMIT    │     │  COMPLAINT  │     │    TWIN     │                │
│  │    TWIN     │◄───►│    TWIN      │     │     HUB      │                │
│  │   (5254)     │     │   (5255)     │     │   (5250)     │                │
│  └──────────────┘     └──────────────┘     └──────────────┘                │
│                                                           │                  │
│  ┌─────────────────────────────────────────────────────────┘                  │
│  │                                                                          │
│  └──────────────────────────► TWIN HUB (5250) ◄──────────────────────────────│
│                               Central Orchestration                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Twin Definitions

#### 3.2.1 Citizen Twin

| Attribute | Specification |
|-----------|---------------|
| **Service** | government-citizen-twin |
| **Port** | 5251 |
| **Type** | Entity Digital Twin - Citizen Identity |
| **Data Model** | See Section 3.2.1.1 |
| **Twins It Relates To** | Service Twin, Department Twin, Permit Twin, Complaint Twin |
| **Agents That Interact** | Citizen Onboarding Agent, Service Routing Agent, Compliance Agent |

##### 3.2.1.1 Citizen Twin Data Model

```json
{
  "citizenId": "string (UUID)",
  "governmentId": "string (Aadhaar/Voter ID/Passport)",
  "governmentIdType": "aadhaar|voter_id|passport|driving_license",
  "verified": "boolean",
  "verificationLevel": "basic|standard|enhanced",
  
  "demographics": {
    "firstName": "string",
    "lastName": "string",
    "middleName": "string",
    "dateOfBirth": "ISO8601 date",
    "gender": "string",
    "bloodType": "string",
    "maritalStatus": "string",
    "nationality": "string",
    "language": "string"
  },
  
  "contact": {
    "primaryPhone": "string",
    "alternatePhone": "string",
    "email": "string",
    "primaryAddress": {
      "street": "string",
      "city": "string",
      "state": "string",
      "district": "string",
      "pincode": "string",
      "country": "string",
      "coordinates": {
        "latitude": "number",
        "longitude": "number"
      }
    },
    "correspondenceAddress": "address object"
  },
  
  "family": {
    "householdId": "string",
    "familyMembers": ["citizen-reference"],
    "primaryEarner": "boolean",
    "dependents": "number"
  },
  
  "services": {
    "activeApplications": ["service-application-reference"],
    "approvedServices": ["service-reference"],
    "pendingServices": ["service-reference"],
    "rejectedServices": ["service-reference"],
    "serviceHistory": [
      {
        "serviceId": "string",
        "serviceName": "string",
        "department": "string",
        "appliedAt": "ISO8601 datetime",
        "status": "string",
        "completedAt": "ISO8601 datetime"
      }
    ]
  },
  
  "permits": {
    "active": ["permit-reference"],
    "pending": ["permit-reference"],
    "expired": ["permit-reference"],
    "history": ["permit-reference"]
  },
  
  "complaints": {
    "filed": ["complaint-reference"],
    "resolved": ["complaint-reference"],
    "pending": ["complaint-reference"],
    "satisfactionScores": ["number"]
  },
  
  "trustScore": {
    "overall": "number (0-100)",
    "verificationLevel": "number (0-100)",
    "complianceScore": "number (0-100)",
    "interactionScore": "number (0-100)",
    "lastUpdated": "ISO8601 datetime"
  },
  
  "preferences": {
    "communicationChannel": "sms|email|whatsapp|app|portal",
    "language": "string",
    "accessibilityNeeds": ["string"],
    "privacyConsent": {
      "dataSharing": "boolean",
      "thirdPartyAccess": "boolean",
      "consentGivenAt": "ISO8601 datetime",
      "consentExpiresAt": "ISO8601 datetime"
    }
  },
  
  "wallet": {
    "balance": "number",
    "currency": "INR",
    "linkedAccounts": ["account-reference"],
    "autoRecharge": "boolean"
  },
  
  "metadata": {
    "registeredAt": "ISO8601 datetime",
    "lastUpdated": "ISO8601 datetime",
    "lastLogin": "ISO8601 datetime",
    "accountStatus": "active|suspended|closed",
    "dataFreshness": "string"
  }
}
```

**Relationships:**
- Linked to Service Twin (service applications and history)
- Linked to Department Twin (ward/location)
- Linked to Permit Twin (all citizen permits)
- Linked to Complaint Twin (all citizen complaints)
- Verified by RABTUL Auth (identity verification)
- Stored in MemoryOS (preferences and history)
- Monitored by Compliance Suite (compliance status)

**Agents Managing Citizen Twin:**
- Citizen Onboarding Agent - New citizen registration
- Service Routing Agent - Service application routing
- Compliance Agent - Citizen compliance monitoring
- Trust Score Agent - Trust score calculation
- Complaint Handler Agent - Complaint processing

---

#### 3.2.2 Service Twin

| Attribute | Specification |
|-----------|---------------|
| **Service** | government-service-twin |
| **Port** | 5252 |
| **Type** | Service Definition Digital Twin |
| **Data Model** | See Section 3.2.2.1 |
| **Twins It Relates To** | Citizen Twin, Department Twin, Permit Twin |
| **Agents That Interact** | Service Catalog Agent, Service Routing Agent, SLA Monitor Agent |

##### 3.2.2.1 Service Twin Data Model

```json
{
  "serviceId": "string (UUID)",
  "serviceCode": "string (e.g., GOV-SVC-001)",
  "name": {
    "en": "string",
    "hi": "string",
    "regional": "string"
  },
  "description": {
    "en": "string",
    "hi": "string"
  },
  
  "classification": {
    "category": "certificate|permit|license|benefit|utility|information|complaint",
    "type": "citizen|business|government",
    "urgency": "normal|urgent|stat",
    "sensitivity": "public|confidential|restricted"
  },
  
  "department": {
    "departmentId": "department-reference",
    "departmentName": "string",
    "division": "string",
    "office": "string"
  },
  
  "eligibility": {
    "citizenTypes": ["string"],
    "criteria": [
      {
        "type": "age|income|location|occupation|property|other",
        "operator": "eq|neq|gt|gte|lt|lte|in|between",
        "value": "any",
        "required": "boolean"
      }
    ],
    "requiredDocuments": [
      {
        "documentType": "string",
        "mandatory": "boolean",
        "verifiedBy": "string"
      }
    ],
    "exclusions": ["string"]
  },
  
  "process": {
    "steps": [
      {
        "stepId": "number",
        "name": "string",
        "description": "string",
        "department": "department-reference",
        "officerRole": "string",
        "slaDays": "number",
        "autoApprove": "boolean",
        "conditions": ["string"]
      }
    ],
    "totalSlaDays": "number",
    "isOnline": "boolean",
    "isMobileFriendly": "boolean"
  },
  
  "fees": {
    "amount": "number",
    "currency": "INR",
    "feeType": "fixed|variable|waivable|exempt",
    "paymentMethods": ["string"],
    "waiverCriteria": ["string"],
    "exemptCategories": ["string"]
  },
  
  "applications": {
    "total": "number",
    "pending": "number",
    "approved": "number",
    "rejected": "number",
    "avgProcessingDays": "number",
    "slaComplianceRate": "number (percentage)"
  },
  
  "digitalIntegration": {
    "externalSystems": [
      {
        "system": "string",
        "endpoint": "string",
        "purpose": "string"
      }
    ],
    "verificationApis": ["string"],
    "notificationChannels": ["string"]
  },
  
  "metrics": {
    "monthlyApplications": "number",
    "approvalRate": "number (percentage)",
    "citizenSatisfaction": "number (0-100)",
    "digitalAdoptionRate": "number (percentage)"
  },
  
  "metadata": {
    "createdAt": "ISO8601 datetime",
    "updatedAt": "ISO8601 datetime",
    "effectiveFrom": "ISO8601 date",
    "effectiveTo": "ISO8601 date",
    "version": "string",
    "status": "active|inactive|draft|archived"
  }
}
```

**Relationships:**
- Linked to Citizen Twin (citizen applications)
- Linked to Department Twin (owning department)
- Linked to Permit Twin (for permit-related services)
- Routed by Service Routing Agent
- Monitored by SLA Monitor Agent
- Checked by Compliance Checker

---

#### 3.2.3 Department Twin

| Attribute | Specification |
|-----------|---------------|
| **Service** | government-department-twin |
| **Port** | 5253 |
| **Type** | Organization Digital Twin |
| **Data Model** | See Section 3.2.3.1 |
| **Twins It Relates To** | Citizen Twin, Service Twin, Permit Twin, Complaint Twin |
| **Agents That Interact** | Department Admin Agent, Compliance Agent, Performance Agent |

##### 3.2.3.1 Department Twin Data Model

```json
{
  "departmentId": "string (UUID)",
  "departmentCode": "string (e.g., DEPT-REV-001)",
  "name": {
    "en": "string",
    "hi": "string",
    "abbreviation": "string"
  },
  "description": "string",
  
  "hierarchy": {
    "ministry": "string",
    "directorate": "string",
    "division": "string",
    "district": "string",
    "taluka": "string",
    "zone": "string"
  },
  
  "type": {
    "classification": "revenue|regulatory|utility|social|defense|judiciary|legislative",
    "level": "central|state|district|local",
    "jurisdiction": "geographic-area"
  },
  
  "location": {
    "headOffice": {
      "address": "object",
      "city": "string",
      "state": "string",
      "pincode": "string",
      "coordinates": "object"
    },
    "regionalOffices": [
      {
        "name": "string",
        "address": "object",
        "jurisdiction": "string"
      }
    ],
    "citizenServiceCenters": [
      {
        "name": "string",
        "address": "object",
        "services": ["service-reference"],
        "operatingHours": "object"
      }
    ]
  },
  
  "contact": {
    "helpline": "string",
    "email": "string",
    "website": "url",
    "grievanceOfficer": "contact-details"
  },
  
  "leadership": {
    "minister": "contact-details",
    "secretary": "contact-details",
    "director": "contact-details",
    "headOfDepartment": "contact-details"
  },
  
  "staff": {
    "total": "number",
    "officers": "number",
    "supportStaff": "number",
    "vacancies": "number",
    "outsourced": "number"
  },
  
  "services": {
    "offered": ["service-reference"],
    "mandatory": ["service-reference"],
    "citizenCharter": {
      "published": "boolean",
      "lastUpdated": "ISO8601 datetime",
      "url": "string"
    }
  },
  
  "digitalPresence": {
    "portal": "url",
    "mobileApp": "string",
    "socialMedia": {
      "twitter": "string",
      "facebook": "string",
      "linkedin": "string"
    },
    "apiEndpoint": "string"
  },
  
  "performance": {
    "slaComplianceRate": "number (percentage)",
    "avgResolutionDays": "number",
    "citizenSatisfactionScore": "number (0-100)",
    "digitalAdoptionRate": "number (percentage)",
    "pendingApplications": "number",
    "overdueApplications": "number"
  },
  
  "compliance": {
    "rtiCompliance": {
      "officerDesignated": "boolean",
      "lastRTIResponse": "ISO8601 datetime",
      "pendingRTI": "number"
    },
    "auditStatus": "string",
    "lastAuditDate": "ISO8601 datetime",
    "complianceScore": "number (0-100)"
  },
  
  "budget": {
    "allocated": "number",
    "spent": "number",
    "fiscalYear": "string",
    "utilizationRate": "number (percentage)"
  },
  
  "trustScore": {
    "overall": "number (0-100)",
    "transparencyScore": "number (0-100)",
    "responsivenessScore": "number (0-100)",
    "accountabilityScore": "number (0-100)",
    "lastUpdated": "ISO8601 datetime"
  },
  
  "metadata": {
    "createdAt": "ISO8601 datetime",
    "updatedAt": "ISO8601 datetime",
    "status": "active|inactive|restructured"
  }
}
```

**Relationships:**
- Linked to Citizen Twin (citizens in jurisdiction)
- Linked to Service Twin (services offered)
- Linked to Permit Twin (permits issued)
- Linked to Complaint Twin (complaints received)
- Monitored by Compliance Suite
- Evaluated by Trust OS

---

#### 3.2.4 Permit Twin

| Attribute | Specification |
|-----------|---------------|
| **Service** | government-permit-twin |
| **Port** | 5254 |
| **Type** | License/Permit Digital Twin |
| **Data Model** | See Section 3.2.4.1 |
| **Twins It Relates To** | Citizen Twin, Service Twin, Department Twin |
| **Agents That Interact** | Permit Processing Agent, Renewal Agent, Compliance Agent |

##### 3.2.4.1 Permit Twin Data Model

```json
{
  "permitId": "string (UUID)",
  "permitNumber": "string (e.g., PERM-REV-2026-001234)",
  "permitType": "building|trade|environmental|health|fire|safety|mining|forest|other",
  
  "classification": {
    "category": "construction|business|environmental|health|safety|transport|agriculture",
    "subCategory": "string",
    "riskLevel": "low|medium|high|critical",
    "regulatoryFramework": "string"
  },
  
  "holder": {
    "citizenId": "citizen-reference",
    "citizenName": "string",
    "type": "individual|organization|government",
    "organization": {
      "name": "string",
      "registrationNumber": "string",
      "pan": "string",
      "gstin": "string"
    }
  },
  
  "application": {
    "applicationId": "string",
    "serviceId": "service-reference",
    "departmentId": "department-reference",
    "filedBy": "citizen-reference",
    "filedAt": "ISO8601 datetime",
    "mode": "online|offline|hybrid"
  },
  
  "location": {
    "propertyAddress": "object",
    "surveyNumber": "string",
    "khataNumber": "string",
    "municipalWard": "string",
    "zone": "residential|commercial|industrial|agricultural|mixed",
    "coordinates": "object"
  },
  
  "details": {
    "description": "string",
    "scope": "string",
    "capacity": "string",
    "constructionType": "string",
    "floorCount": "number",
    "areaSqFt": "number"
  },
  
  "validity": {
    "issueDate": "ISO8601 date",
    "expiryDate": "ISO8601 date",
    "duration": "number (days)",
    "autoRenew": "boolean",
    "renewalNoticeDays": "number",
    "gracePeriodDays": "number"
  },
  
  "status": {
    "current": "pending|under_review|approved|rejected|expired|revoked|suspended",
    "history": [
      {
        "status": "string",
        "changedAt": "ISO8601 datetime",
        "changedBy": "officer-reference",
        "reason": "string"
      }
    ]
  },
  
  "approvals": {
    "required": [
      {
        "departmentId": "department-reference",
        "approvalType": "string",
        "status": "pending|approved|rejected",
        "approvedAt": "ISO8601 datetime",
        "approverId": "officer-reference"
      }
    ],
    "conditionalApprovals": ["string"]
  },
  
  "inspections": {
    "required": "boolean",
    "scheduled": [
      {
        "date": "ISO8601 datetime",
        "inspectorId": "officer-reference",
        "purpose": "string"
      }
    ],
    "completed": [
      {
        "date": "ISO8601 datetime",
        "inspectorId": "officer-reference",
        "findings": "string",
        "reportUrl": "string",
        "status": "passed|failed|conditional"
      }
    ]
  },
  
  "fees": {
    "applicationFee": "number",
    "processingFee": "number",
    "inspectionFee": "number",
    "securityDeposit": "number",
    "totalPaid": "number",
    "paymentDate": "ISO8601 datetime",
    "receiptNumber": "string"
  },
  
  "compliance": {
    "conditions": ["string"],
    "ongoingRequirements": [
      {
        "requirement": "string",
        "frequency": "daily|weekly|monthly|quarterly|yearly",
        "nextDue": "ISO8601 datetime",
        "lastCompliance": "ISO8601 datetime",
        "status": "compliant|non_compliant|pending"
      }
    ],
    "violations": [
      {
        "date": "ISO8601 datetime",
        "violation": "string",
        "penalty": "number",
        "status": "pending|paid|waived"
      }
    ]
  },
  
  "renewal": {
    "lastRenewed": "ISO8601 datetime",
    "renewalCount": "number",
    "upcomingRenewal": "ISO8601 datetime",
    "autoRenewalEnabled": "boolean"
  },
  
  "documents": {
    "uploaded": [
      {
        "documentType": "string",
        "fileName": "string",
        "uploadedAt": "ISO8601 datetime",
        "verified": "boolean"
      }
    ],
    "generated": [
      {
        "documentType": "certificate|approval|notice|letter",
        "generatedAt": "ISO8601 datetime",
        "documentUrl": "string"
      }
    ]
  },
  
  "metadata": {
    "createdAt": "ISO8601 datetime",
    "updatedAt": "ISO8601 datetime",
    "dataFreshness": "string"
  }
}
```

**Relationships:**
- Linked to Citizen Twin (permit holder)
- Linked to Service Twin (application service)
- Linked to Department Twin (issuing department)
- Tracked by Permit Processing Agent
- Monitored by Compliance Agent
- Synced with RABTUL Pay (fee payments)

---

#### 3.2.5 Complaint Twin

| Attribute | Specification |
|-----------|---------------|
| **Service** | government-complaint-twin |
| **Port** | 5255 |
| **Type** | Grievance Digital Twin |
| **Data Model** | See Section 3.2.5.1 |
| **Twins It Relates To** | Citizen Twin, Department Twin, Service Twin |
| **Agents That Interact** | Complaint Intake Agent, Grievance Officer Agent, Escalation Agent |

##### 3.2.5.1 Complaint Twin Data Model

```json
{
  "complaintId": "string (UUID)",
  "complaintNumber": "string (e.g., COMP-GOV-2026-001234)",
  
  "classification": {
    "category": "service_delay|corruption|harassment|facility|staff|process|other",
    "subCategory": "string",
    "severity": "low|medium|high|critical",
    "anonymous": "boolean"
  },
  
  "filer": {
    "citizenId": "citizen-reference",
    "citizenName": "string",
    "contactPhone": "string",
    "contactEmail": "string",
    "anonymous": "boolean"
  },
  
  "respondent": {
    "departmentId": "department-reference",
    "departmentName": "string",
    "officerName": "string",
    "officerDesignation": "string",
    "officeLocation": "string"
  },
  
  "relatedService": {
    "serviceId": "service-reference",
    "serviceName": "string",
    "applicationId": "string",
    "relatedPermitId": "permit-reference"
  },
  
  "description": {
    "summary": "string",
    "detailedNarrative": "string",
    "incidentDate": "ISO8601 date",
    "incidentLocation": "string"
  },
  
  "evidence": {
    "documents": [
      {
        "documentType": "string",
        "fileName": "string",
        "uploadedAt": "ISO8601 datetime",
        "url": "string"
      }
    ],
    "images": [
      {
        "description": "string",
        "uploadedAt": "ISO8601 datetime",
        "url": "string"
      }
    ]
  },
  
  "sla": {
    "assignedAt": "ISO8601 datetime",
    "dueDate": "ISO8601 datetime",
    "responseDueDate": "ISO8601 datetime",
    "resolutionDueDate": "ISO8601 datetime",
    "slaBreached": "boolean",
    "extensionCount": "number",
    "extensionReason": "string"
  },
  
  "status": {
    "current": "registered|assigned|under_investigation|pending_action|resolved|closed|escalated|withdrawn",
    "history": [
      {
        "status": "string",
        "changedAt": "ISO8601 datetime",
        "changedBy": "officer-reference",
        "action": "string",
        "remarks": "string"
      }
    ]
  },
  
  "assignment": {
    "assignedTo": "officer-reference",
    "assignedBy": "officer-reference",
    "assignedAt": "ISO8601 datetime",
    "currentHandler": "officer-reference",
    "transferHistory": [
      {
        "fromOfficer": "officer-reference",
        "toOfficer": "officer-reference",
        "transferredAt": "ISO8601 datetime",
        "reason": "string"
      }
    ]
  },
  
  "investigation": {
    "findings": "string",
    "rootCause": "string",
    "evidenceReviewed": ["string"],
    "witnessStatements": ["string"],
    "investigationReport": "string",
    "investigationCompletedAt": "ISO8601 datetime"
  },
  
  "resolution": {
    "actionTaken": "string",
    "correctiveAction": "string",
    "preventiveAction": "string",
    "compensations": "number",
    "disciplinaryAction": "string",
    "resolvedAt": "ISO8601 datetime",
    "resolvedBy": "officer-reference"
  },
  
  "feedback": {
    "citizenSatisfaction": "number (1-5)",
    "citizenComments": "string",
    "citizenFeedbackAt": "ISO8601 datetime",
    "isSatisfied": "boolean"
  },
  
  "rti": {
    "linkedRTI": "string",
    "rtiFiled": "boolean",
    "rtiReference": "string"
  },
  
  "appeal": {
    "canAppeal": "boolean",
    "appealDeadline": "ISO8601 datetime",
    "appealed": "boolean",
    "appealReference": "string",
    "appealOutcome": "string"
  },
  
  "metadata": {
    "createdAt": "ISO8601 datetime",
    "updatedAt": "ISO8601 datetime",
    "source": "portal|app|helpline|walkin|email|social_media",
    "dataFreshness": "string"
  }
}
```

**Relationships:**
- Linked to Citizen Twin (complainant)
- Linked to Department Twin (respondent department)
- Linked to Service Twin (related service)
- Managed by Complaint Intake Agent
- Tracked by Grievance Officer Agent
- Escalated by Escalation Agent

---

### 3.3 Twin Hub (Central Orchestration)

| Attribute | Specification |
|-----------|---------------|
| **Service** | government-twin-hub |
| **Port** | 5250 |
| **Type** | Central Twin Orchestration |
| **Purpose** | Coordinate cross-twin queries, aggregate results, event routing |

#### 3.3.1 Twin Hub Data Model

```json
{
  "hubId": "string (UUID)",
  "registeredTwins": [
    {
      "twinId": "string",
      "twinName": "string",
      "port": "number",
      "health": "healthy|degraded|down",
      "lastHeartbeat": "ISO8601 datetime"
    }
  ],
  "queries": [
    {
      "queryId": "string",
      "type": "cross_twin|aggregate|federated",
      "twinTargets": ["twinId"],
      "query": "string",
      "results": "object",
      "executedAt": "ISO8601 datetime",
      "latency": "number (ms)"
    }
  ],
  "schemas": {
    "citizenTwin": "json-schema-url",
    "serviceTwin": "json-schema-url",
    "departmentTwin": "json-schema-url",
    "permitTwin": "json-schema-url",
    "complaintTwin": "json-schema-url"
  }
}
```

---

## 4. Integration Flows

### 4.1 Core Integration Flow: RABTUL Auth ↔ TwinOS (Citizen Twin)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                    INTEGRATION FLOW: RABTUL Auth ↔ TwinOS                         │
└─────────────────────────────────────────────────────────────────────────────────────┘

  Citizen                    RABTUL Auth                       TwinOS
    │                          (4002)                          (5250)
    │                                                                       │
    │  ┌─────────────────────────────────────────────────────────────────┐
    │  │              CITIZEN IDENTITY FLOW                               │
    │  └─────────────────────────────────────────────────────────────────┘
    │                                                                       │
    │  POST /auth/register
    │  ───────────────────
    │  { phone, otp, name, dob }
    │                │
    │                ▼
    │  ┌────────────────────────────────────────────────────────────────┐
    │  │  1. RABTUL Auth - Create identity                              │
    │  │     - Verify phone via OTP                                     │
    │  │     - Create auth credentials                                  │
    │  │     - Generate citizen UUID                                   │
    │  └────────────────────────────────────────────────────────────────┘
    │                │
    │                │ citizen.created event
    │                ▼
    │  ┌────────────────────────────────────────────────────────────────┐
    │  │  2. TwinOS Hub - Create Citizen Twin                           │
    │  │     - Sync demographics                                       │
    │  │     - Link to government ID                                   │
    │  │     - Initialize trust score                                  │
    │  │     - Set preferences                                         │
    │  └────────────────────────────────────────────────────────────────┘
    │                │
    │                │ citizen.twin.created event
    │                ▼
    │  ┌────────────────────────────────────────────────────────────────┐
    │  │  3. MemoryOS - Initialize citizen memory                      │
    │  │     - Create context profile                                  │
    │  │     - Set interaction preferences                             │
    │  └────────────────────────────────────────────────────────────────┘
    │
    │
    │  ┌─────────────────────────────────────────────────────────────────┐
    │  │              SERVICE ACCESS FLOW                                 │
    │  └─────────────────────────────────────────────────────────────────┘
    │
    │  GET /api/services
    │  ─────────────────
    │  (JWT token in header)
    │                │
    │                ▼
    │  ┌────────────────────────────────────────────────────────────────┐
    │  │  1. RABTUL Auth - Verify token                                 │
    │  │     - Validate JWT                                             │
    │  │     - Check permissions                                       │
    │  │     - Return citizen ID                                       │
    │  └────────────────────────────────────────────────────────────────┘
    │                │
    │                │ citizen context
    │                ▼
    │  ┌────────────────────────────────────────────────────────────────┐
    │  │  2. TwinOS Hub - Enrich with Citizen Twin                     │
    │  │     - Fetch citizen profile                                   │
    │  │     - Get eligible services                                   │
    │  │     - Get pending applications                                │
    │  │     - Get trust score                                         │
    │  └────────────────────────────────────────────────────────────────┘
    │                │
    │                ▼
    │  ┌────────────────────────────────────────────────────────────────┐
    │  │  3. Return enriched service catalog                           │
    │  │     - Filtered by eligibility                                │
    │  │     - Personalized recommendations                           │
    │  └────────────────────────────────────────────────────────────────┘
    │
    ▼
```

### 4.2 Service Application Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                    SERVICE APPLICATION INTEGRATION FLOW                         │
└─────────────────────────────────────────────────────────────────────────────────────┘

  Citizen                    TwinOS Hub                   Department              RABTUL
    │                          (5250)                        (5253)               (4001)
      │                                                                       │
      │  POST /api/services/{serviceId}/apply
      │  ─────────────────────────────────
      │  { documents: [], declaration: true }
      │                │
      │                ▼
      │  ┌────────────────────────────────────────────────────────────────┐
      │  │  1. TwinOS Hub - Process Application                           │
      │  │     - Validate citizen eligibility                             │
      │  │     - Verify documents via Compliance Checker                 │
      │  │     - Create application record                               │
      │  │     - Link to Citizen Twin                                    │
      │  │     - Update Service Twin metrics                             │
      │  └────────────────────────────────────────────────────────────────┘
      │                │
      │    ┌───────────┴───────────┐
      │    │                       │
      │    ▼                       ▼
      │  ┌────────────┐      ┌────────────┐
      │  │  Citizen  │      │ Department │
      │  │   Twin    │      │    Twin    │
      │  │  (5251)   │      │  (5253)    │
      │  └────────────┘      └────────────┘
      │                │
      │                │ application.created event
      │                ▼
      │  ┌────────────────────────────────────────────────────────────────┐
      │  │  2. Department - Route to Officer                            │
      │  │     - Assign to appropriate officer                         │
      │  │     - Set SLA deadlines                                     │
      │  │     - Notify officer                                        │
      │  └────────────────────────────────────────────────────────────────┘
      │                │
      │                ▼
      │  ┌────────────────────────────────────────────────────────────────┐
      │  │  3. Process Fees (if applicable)                             │
      │  │     - Calculate fees                                        │
      │  │     - Initiate via RABTUL Pay                               │
      │  │     - Record payment in Citizen Twin                         │
      │  └────────────────────────────────────────────────────────────────┘
      │                │
      │                ▼
      │  ┌────────────────────────────────────────────────────────────────┐
      │  │  4. Notify Citizen                                           │
      │  │     - SMS/Email confirmation                                │
      │  │     - Application number                                    │
      │  │     - Expected timeline                                     │
      │  └────────────────────────────────────────────────────────────────┘
      │
      ▼
```

### 4.3 Permit Processing Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                    PERMIT PROCESSING INTEGRATION FLOW                             │
└─────────────────────────────────────────────────────────────────────────────────────┘

  Applicant                 TwinOS Hub                   Compliance               RABTUL
    │                          (5250)                   Checker                   Pay
      │                                                                       │
      │  POST /api/permits/apply
      │  ──────────────────────
      │  { permitType, location, details, documents }
      │                │
      │                ▼
      │  ┌────────────────────────────────────────────────────────────────┐
      │  │  1. TwinOS Hub - Create Permit Twin                            │
      │  │     - Validate application                                     │
      │  │     - Create Permit Twin record                                │
      │  │     - Link to Citizen Twin                                     │
      │  │     - Check for existing permits at location                    │
      │  └────────────────────────────────────────────────────────────────┘
      │                │
      │                ▼
      │  ┌────────────────────────────────────────────────────────────────┐
      │  │  2. Compliance Checker - Multi-Framework Check                 │
      │  │     - Zoning compliance                                       │
      │  │     - Environmental regulations                               │
      │  │     - Building codes                                          │
      │  │     - Fire safety requirements                                 │
      │  │     - Health regulations                                      │
      │  └──────────────────────────────────────���─────────────────────────┘
      │                │
      │                ▼
      │  ┌────────────────────────────────────────────────────────────────┐
      │  │  3. Cross-Department Approvals                               │
      │  │     - Fire department                                        │
      │  │     - Environmental department                               │
      │  │     - Health department                                      │
      │  │     - Municipal corporation                                  │
      │  │     - Update Permit Twin with approvals                      │
      │  └────────────────────────────────────────────────────────────────┘
      │                │
      │                ▼
      │  ┌────────────────────────────────────────────────────────────────┐
      │  │  4. Inspection Scheduling (if required)                       │
      │  │     - Assign inspectors                                      │
      │  │     - Schedule inspection dates                              │
      │  │     - Record in Permit Twin                                  │
      │  └────────────────────────────────────────────────────────────────┘
      │                │
      │                ▼
      │  ┌────────────────────────────────────────────────────────────────┐
      │  │  5. Fee Collection via RABTUL Pay                            │
      │  │     - Calculate total fees                                   │
      │  │     - Process payment                                        │
      │  │     - Update Permit Twin with payment                        │
      │  └────────────────────────────────────────────────────────────────┘
      │                │
      │                ▼
      │  ┌────────────────────────────────────────────────────────────────┐
      │  │  6. Permit Issuance                                           │
      │  │     - Generate permit certificate                            │
      │  │     - Update Permit Twin status                              │
      │  │     - Notify applicant                                       │
      │  │     - Set renewal reminders                                 │
      │  └────────────────────────────────────────────────────────────────┘
      │
      ▼
```

### 4.4 Complaint Resolution Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                    COMPLAINT RESOLUTION INTEGRATION FLOW                         │
└─────────────────────────────────────────────────────────────────────────────────────┘

  Citizen                    TwinOS Hub                  Department              Trust OS
    │                          (5250)                      (5253)                 (4200)
      │                                                                       │
      │  POST /api/complaints
      │  ─────────────────────
      │  { category, description, evidence, respondent }
      │                │
      │                ▼
      │  ┌────────────────────────────────────────────────────────────────┐
      │  │  1. TwinOS Hub - Create Complaint Twin                       │
      │  │     - Generate complaint number                              │
      │  │     - Create Complaint Twin record                          │
      │  │     - Link to Citizen Twin                                  │
      │  │     - Categorize and prioritize                             │
      │  │     - Set SLA deadlines                                     │
      │  └────────────────────────────────────────────────────────────────┘
      │                │
      │                ▼
      │  ┌────────────────────────────────────────────────────────────────┐
      │  │  2. Auto-Route to Department                                 │
      │  │     - Identify responsible department                       │
      │  │     - Assign to grievance officer                          │
      │  │     - Update Department Twin metrics                       │
      │  │     - Send acknowledgment to citizen                       │
      │  └────────────────────────────────────────────────────────────────┘
      │                │
      │                ▼
      │  ┌────────────────────────────────────────────────────────────────┐
      │  │  3. Investigation Workflow                                  │
      │  │     - Officer investigates                                 │
      │  │     - Evidence collection                                   │
      │  │     - Witness statements                                   │
      │  │     - Department response                                  │
      │  │     - Update Complaint Twin status                         │
      │  └────────────────────────────────────────────────────────────────┘
      │                │
      │                ▼
      │  ┌────────────────────────────────────────────────────────────────┐
      │  │  4. Resolution & Closure                                     │
      │  │     - Officer proposes resolution                           │
      │  │     - Citizen accepts/rejects                               │
      │  │     - Close complaint if accepted                           │
      │  │     - Update Trust scores                                   │
      │  │     - Request feedback                                      │
      │  └────────────────────────────────────────────────────────────────┘
      │                │
      │                ▼
      │  ┌────────────────────────────────────────────────────────────────┐
      │  │  5. Escalation (if unresolved)                              │
      │  │     - Escalate to higher authority                          │
      │  │     - Update Complaint Twin                                │
      │  │     - Notify citizen of escalation                         │
      │  │     - Track escalation path                                │
      │  └────────────────────────────────────────────────────────────────┘
      │
      ▼
```

### 4.5 API Endpoints Specification

#### 4.5.1 TwinOS Hub API (Port 5250)

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/health` | Service health | - | `{ status, twins }` |
| GET | `/api/hub/twins` | List registered twins | - | `{ twins: [] }` |
| GET | `/api/hub/twins/{twinId}` | Get twin status | - | `{ twin, health }` |
| POST | `/api/hub/query` | Cross-twin query | `{ targets, query, params }` | `{ results, latency }` |
| POST | `/api/hub/sync` | Trigger sync | `{ twinId, data }` | `{ syncId, status }` |
| GET | `/api/hub/sync/{syncId}` | Get sync status | - | `{ syncId, status, progress }` |
| WS | `/ws/twin/{twinId}` | Twin event stream | - | Event stream |

#### 4.5.2 Citizen Twin API (Port 5251)

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/health` | Service health | - | `{ status }` |
| GET | `/api/citizen/{id}` | Get citizen | - | `{ citizen }` |
| POST | `/api/citizen` | Create citizen | `{ demographics, contact }` | `{ citizenId }` |
| PUT | `/api/citizen/{id}` | Update citizen | `{ updates }` | `{ citizen }` |
| GET | `/api/citizen/{id}/services` | Get citizen services | - | `{ services }` |
| GET | `/api/citizen/{id}/permits` | Get citizen permits | - | `{ permits }` |
| GET | `/api/citizen/{id}/complaints` | Get citizen complaints | - | `{ complaints }` |
| GET | `/api/citizen/{id}/trust-score` | Get trust score | - | `{ trustScore }` |
| POST | `/api/citizen/{id}/preferences` | Update preferences | `{ preferences }` | `{ citizen }` |

#### 4.5.3 Service Twin API (Port 5252)

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/health` | Service health | - | `{ status }` |
| GET | `/api/service/{id}` | Get service | - | `{ service }` |
| GET | `/api/services` | List all services | `{ category, department }` | `{ services }` |
| POST | `/api/service` | Create service | `{ name, classification, department }` | `{ serviceId }` |
| PUT | `/api/service/{id}` | Update service | `{ updates }` | `{ service }` |
| GET | `/api/service/{id}/applications` | Get service applications | - | `{ applications }` |
| GET | `/api/service/{id}/metrics` | Get service metrics | - | `{ metrics }` |
| POST | `/api/service/{id}/apply` | Apply for service | `{ citizenId, documents }` | `{ applicationId }` |

#### 4.5.4 Department Twin API (Port 5253)

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/health` | Service health | - | `{ status }` |
| GET | `/api/department/{id}` | Get department | - | `{ department }` |
| GET | `/api/departments` | List all departments | `{ level, district }` | `{ departments }` |
| POST | `/api/department` | Create department | `{ name, hierarchy, type }` | `{ departmentId }` |
| PUT | `/api/department/{id}` | Update department | `{ updates }` | `{ department }` |
| GET | `/api/department/{id}/services` | Get department services | - | `{ services }` |
| GET | `/api/department/{id}/performance` | Get performance metrics | - | `{ performance }` |
| GET | `/api/department/{id}/compliance` | Get compliance status | - | `{ compliance }` |

#### 4.5.5 Permit Twin API (Port 5254)

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/health` | Service health | - | `{ status }` |
| GET | `/api/permit/{id}` | Get permit | - | `{ permit }` |
| GET | `/api/permits` | List permits | `{ citizenId, status, type }` | `{ permits }` |
| POST | `/api/permit` | Create permit | `{ permitType, holder, location }` | `{ permitId }` |
| PUT | `/api/permit/{id}` | Update permit | `{ updates }` | `{ permit }` |
| POST | `/api/permit/{id}/approve` | Approve permit | `{ approverId, conditions }` | `{ permit }` |
| POST | `/api/permit/{id}/reject` | Reject permit | `{ approverId, reason }` | `{ permit }` |
| POST | `/api/permit/{id}/inspect` | Add inspection | `{ inspectorId, findings }` | `{ permit }` |
| POST | `/api/permit/{id}/renew` | Renew permit | `{ paymentReceipt }` | `{ permit }` |

#### 4.5.6 Complaint Twin API (Port 5255)

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/health` | Service health | - | `{ status }` |
| GET | `/api/complaint/{id}` | Get complaint | - | `{ complaint }` |
| GET | `/api/complaints` | List complaints | `{ citizenId, status, department }` | `{ complaints }` |
| POST | `/api/complaint` | Create complaint | `{ classification, description, respondent }` | `{ complaintId }` |
| PUT | `/api/complaint/{id}` | Update complaint | `{ updates }` | `{ complaint }` |
| POST | `/api/complaint/{id}/assign` | Assign complaint | `{ officerId }` | `{ complaint }` |
| POST | `/api/complaint/{id}/resolve` | Resolve complaint | `{ resolution }` | `{ complaint }` |
| POST | `/api/complaint/{id}/escalate` | Escalate complaint | `{ reason, level }` | `{ complaint }` |
| POST | `/api/complaint/{id}/feedback` | Submit feedback | `{ satisfaction, comments }` | `{ complaint }` |

#### 4.5.7 RABTUL Auth API (Port 4002)

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/api/auth/register` | Register citizen | `{ phone, name, dob }` | `{ citizenId, otpSent }` |
| POST | `/api/auth/send-otp` | Send OTP | `{ phone }` | `{ otpSent }` |
| POST | `/api/auth/verify-otp` | Verify OTP | `{ phone, otp }` | `{ token, citizenId }` |
| POST | `/api/auth/login` | Login | `{ phone, password }` | `{ token }` |
| GET | `/api/auth/profile` | Get profile | - | `{ profile }` |
| PUT | `/api/auth/profile` | Update profile | `{ updates }` | `{ profile }` |
| POST | `/api/auth/verify-identity` | Verify identity | `{ governmentId, type }` | `{ verified, level }` |

#### 4.5.8 RABTUL Pay API (Port 4001)

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/api/payments/initiate` | Initiate payment | `{ amount, purpose, citizenId }` | `{ paymentId }` |
| POST | `/api/payments/{paymentId}/verify` | Verify payment | `{ razorpaySignature }` | `{ verified }` |
| GET | `/api/payments/{paymentId}` | Get payment status | - | `{ payment }` |
| POST | `/api/payments/webhook` | Payment webhook | `{ event, payload }` | `{ received }` |
| POST | `/api/payments/refund` | Initiate refund | `{ paymentId, amount }` | `{ refundId }` |

### 4.6 Events/Messages Specification

#### 4.6.1 Event Bus Topics

| Topic | Publisher | Subscribers | Event Types |
|-------|-----------|-------------|-------------|
| `gov.citizen.*` | Citizen Twin | Service Twin, Permit Twin, Complaint Twin | `created`, `updated`, `verified`, `preferences_changed` |
| `gov.service.*` | Service Twin | Citizen Twin, Department Twin | `created`, `updated`, `application_received`, `sla_breach` |
| `gov.department.*` | Department Twin | Service Twin, Complaint Twin | `created`, `updated`, `performance_alert`, `compliance_update` |
| `gov.permit.*` | Permit Twin | Citizen Twin, Department Twin | `created`, `approved`, `rejected`, `expired`, `renewed` |
| `gov.complaint.*` | Complaint Twin | Citizen Twin, Department Twin, Trust OS | `created`, `assigned`, `escalated`, `resolved`, `closed` |
| `gov.payment.*` | RABTUL Pay | Citizen Twin, Permit Twin, Service Twin | `success`, `failed`, `refund_initiated` |
| `gov.auth.*` | RABTUL Auth | Citizen Twin, Twin Hub | `login`, `logout`, `identity_verified` |

#### 4.6.2 Event Schema

```json
{
  "eventId": "string (UUID)",
  "eventType": "string (e.g., citizen.created)",
  "source": "string (service name)",
  "sourceId": "string (entity ID)",
  "timestamp": "ISO8601 datetime",
  "version": "string (1.0.0)",
  "payload": {
    "entityType": "string",
    "entityId": "string",
    "changes": {
      "field": { "old": "any", "new": "any" }
    }
  },
  "metadata": {
    "correlationId": "string",
    "causationId": "string",
    "userId": "string",
    "sessionId": "string"
  }
}
```

### 4.7 Error Handling

#### 4.7.1 Error Response Schema

```json
{
  "error": {
    "code": "string (e.g., CITIZEN_NOT_FOUND)",
    "message": "string (human readable)",
    "details": {
      "field": "string",
      "reason": "string"
    },
    "traceId": "string (for debugging)",
    "timestamp": "ISO8601 datetime"
  }
}
```

#### 4.7.2 Error Codes

| Code | HTTP Status | Description | Action |
|------|-------------|-------------|--------|
| `CITIZEN_NOT_FOUND` | 404 | Citizen does not exist | Check citizen ID |
| `SERVICE_NOT_FOUND` | 404 | Service does not exist | Check service ID |
| `DEPARTMENT_NOT_FOUND` | 404 | Department does not exist | Check department ID |
| `PERMIT_NOT_FOUND` | 404 | Permit does not exist | Check permit ID |
| `COMPLAINT_NOT_FOUND` | 404 | Complaint does not exist | Check complaint ID |
| `TWIN_UNAVAILABLE` | 503 | Twin service is down | Retry with backoff |
| `AUTH_FAILED` | 401 | Authentication failed | Re-authenticate |
| `PERMISSION_DENIED` | 403 | Insufficient permissions | Request access |
| `VALIDATION_ERROR` | 400 | Invalid request data | Fix request body |
| `RATE_LIMITED` | 429 | Too many requests | Wait and retry |
| `SLA_BREACH` | 400 | SLA deadline exceeded | Escalate |
| `DUPLICATE_APPLICATION` | 409 | Application already exists | Check existing |

---

## 5. Agent Architecture

### 5.1 Government Services Agents Overview

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                    GOVERNMENT & PUBLIC SERVICES AGENT ARCHITECTURE               │
└─────────────────────────────────────────────────────────────────────────────────────┘

                              ┌──────────────────┐
                              │   AGENT ORCHESTRATOR   │
                              │      (5090)            │
                              │                        │
                              │  - Skill matching      │
                              │  - Workflow assembly   │
                              │  - Agent coordination  │
                              └──────────┬───────────┘
                                         │
         ┌───────────────────────────────┼───────────────────────────────┐
         │                               │                               │
         ▼                               ▼                               ▼
┌─────────────────┐            ┌─────────────────┐            ┌─────────────────┐
│   CITIZEN       │            │   SERVICE      │            │  DEPARTMENT     │
│   AGENTS        │            │   AGENTS       │            │   AGENTS        │
│                 │            │                 │            │                 │
│  - Onboarding   │            │  - Catalog      │            │  - Admin        │
│  - Routing      │            │  - Routing      │            │  - Compliance   │
│  - Trust Score  │            │  - SLA Monitor  │            │  - Performance  │
│  - Compliance   │            │  - Analytics    │            │  - Officer      │
└─────────────────┘            └─────────────────┘            └─────────────────┘
         │                               │                               │
         ▼                               ▼                               ▼
┌─────────────────┐            ┌─────────────────┐            ┌─────────────────┐
│   PERMIT       │            │  COMPLAINT     │            │   PAYMENT      │
│   AGENTS       │            │   AGENTS       │            │   AGENTS       │
│                 │            │                 │            │                 │
│  - Processing   │            │  - Intake       │            │  - Processing   │
│  - Inspection   │            │  - Investigation│            │  - Settlement   │
│  - Renewal      │            │  - Escalation   │            │  - Reconciliation│
│  - Compliance   │            │  - Resolution   │            │  - Fraud Detect │
└─────────────────┘            └─────────────────┘            └─────────────────┘
```

### 5.2 Agent Definitions

#### 5.2.1 Citizen Onboarding Agent

| Attribute | Specification |
|-----------|---------------|
| **Agent ID** | `gov.citizen.onboarding` |
| **Port** | 5251-A1 |
| **Role** | New citizen registration and identity verification |
| **Twins Managed** | Citizen Twin (5251) |
| **Skills** | KYC processing, Document verification, Identity resolution |
| **Capabilities** | Create citizen profiles, Government ID verification, Preference setup |
| **Triggers** | New citizen registration, Identity update request |

**Actions:**
- `register_citizen`: Onboard new citizen with basic info
- `verify_identity`: Verify government ID (Aadhaar, Voter ID, etc.)
- `link_accounts`: Connect external accounts
- `setup_preferences`: Configure communication preferences
- `initialize_trust_score`: Set initial trust score

#### 5.2.2 Service Routing Agent

| Attribute | Specification |
|-----------|---------------|
| **Agent ID** | `gov.service.routing` |
| **Port** | 5252-A1 |
| **Role** | Route service applications to appropriate departments |
| **Twins Managed** | Service Twin (5252), Citizen Twin (5251) |
| **Skills** | Eligibility checking, Document validation, Routing logic |
| **Capabilities** | Application routing, Eligibility determination, Document verification |
| **Triggers** | New service application, Document upload, Application status change |

**Actions:**
- `check_eligibility`: Verify citizen eligibility for service
- `validate_documents`: Check required documents
- `route_application`: Route to appropriate department
- `track_application`: Monitor application progress
- `notify_citizen`: Send status updates

#### 5.2.3 SLA Monitor Agent

| Attribute | Specification |
|-----------|---------------|
| **Agent ID** | `gov.service.sla` |
| **Port** | 5252-A2 |
| **Role** | Monitor and enforce service level agreements |
| **Twins Managed** | Service Twin (5252), Department Twin (5253) |
| **Skills** | Deadline tracking, Escalation management, Performance analysis |
| **Capabilities** | SLA monitoring, Deadline alerts, Escalation triggers |
| **Triggers** | SLA approaching, SLA breach, Performance threshold |

**Actions:**
- `monitor_sla`: Track all active applications
- `send_reminders`: Notify officers of approaching deadlines
- `trigger_escalation`: Escalate breached applications
- `generate_sla_report`: Produce SLA compliance reports
- `update_metrics`: Update department SLA metrics

#### 5.2.4 Permit Processing Agent

| Attribute | Specification |
|-----------|---------------|
| **Agent ID** | `gov.permit.processing` |
| **Port** | 5254-A1 |
| **Role** | Process permit applications through multi-department workflow |
| **Twins Managed** | Permit Twin (5254), Department Twin (5253) |
| **Skills** | Multi-department coordination, Compliance checking, Inspection scheduling |
| **Capabilities** | Cross-department routing, Compliance verification, Inspection management |
| **Triggers** | New permit application, Approval received, Inspection completed |

**Actions:**
- `process_application`: Process new permit application
- `route_approvals`: Route to required departments
- `schedule_inspection`: Schedule site inspection
- `collect_fees`: Calculate and collect fees
- `issue_permit`: Generate and issue permit
- `manage_renewal`: Handle permit renewals

#### 5.2.5 Complaint Intake Agent

| Attribute | Specification |
|-----------|---------------|
| **Agent ID** | `gov.complaint.intake` |
| **Port** | 5255-A1 |
| **Role** | Process citizen complaints and grievances |
| **Twins Managed** | Complaint Twin (5255), Citizen Twin (5251) |
| **Skills** | Complaint classification, Sentiment analysis, Priority determination |
| **Capabilities** | Complaint registration, Categorization, Priority assignment |
| **Triggers** | New complaint, Anonymous complaint, Follow-up complaint |

**Actions:**
- `register_complaint`: Create new complaint record
- `classify_complaint`: Categorize and prioritize
- `identify_respondent`: Determine responsible department
- `acknowledge_complaint`: Send acknowledgment to citizen
- `track_complaint`: Monitor complaint status

#### 5.2.6 Grievance Officer Agent

| Attribute | Specification |
|-----------|---------------|
| **Agent ID** | `gov.complaint.officer` |
| **Port** | 5255-A2 |
| **Role** | Manage complaint investigation and resolution |
| **Twins Managed** | Complaint Twin (5255), Department Twin (5253) |
| **Skills** | Investigation management, Evidence collection, Resolution planning |
| **Capabilities** | Investigation workflow, Evidence tracking, Resolution coordination |
| **Triggers** | Complaint assigned, Investigation needed, Resolution proposed |

**Actions:**
- `assign_complaint`: Assign to appropriate officer
- `investigate`: Conduct investigation
- `collect_evidence`: Gather supporting documents
- `propose_resolution`: Create resolution plan
- `close_complaint`: Close resolved complaint

#### 5.2.7 Escalation Agent

| Attribute | Specification |
|-----------|---------------|
| **Agent ID** | `gov.complaint.escalation` |
| **Port** | 5255-A3 |
| **Role** | Handle complaint escalations and high-priority cases |
| **Twins Managed** | Complaint Twin (5255), Department Twin (5253), Trust OS |
| **Skills** | Escalation management, Priority escalation, Authority routing |
| **Capabilities** | Multi-level escalation, Authority identification, Timeline management |
| **Triggers** | SLA breach, Citizen rejection, High-severity complaint |

**Actions:**
- `escalate_complaint`: Move to higher authority
- `identify_escalation_path`: Determine escalation chain
- `notify_authorities`: Alert higher officials
- `track_escalation`: Monitor escalation progress
- `report_escalation`: Generate escalation reports

#### 5.2.8 Department Compliance Agent

| Attribute | Specification |
|-----------|---------------|
| **Agent ID** | `gov.department.compliance` |
| **Port** | 5253-A1 |
| **Role** | Monitor department compliance with regulatory requirements |
| **Twins Managed** | Department Twin (5253), Service Twin (5252) |
| **Skills** | RTI compliance, Audit management, Policy enforcement |
| **Capabilities** | Compliance monitoring, Audit trail, Policy verification |
| **Triggers** | Compliance check request, Audit scheduled, Policy violation |

**Actions:**
- `monitor_compliance`: Track compliance status
- `conduct_audit`: Execute compliance audit
- `enforce_policy`: Apply policy requirements
- `generate_report`: Produce compliance reports
- `track_rti`: Monitor RTI responses

#### 5.2.9 Trust Score Agent

| Attribute | Specification |
|-----------|---------------|
| **Agent ID** | `gov.trust.score` |
| **Port** | 5251-A2 |
| **Role** | Calculate and maintain trust scores for citizens and departments |
| **Twins Managed** | Citizen Twin (5251), Department Twin (5253) |
| **Skills** | Trust modeling, Behavior analysis, Reputation scoring |
| **Capabilities** | Trust calculation, Score updates, Trend analysis |
| **Triggers** | Interaction completed, Violation detected, Milestone reached |

**Actions:**
- `calculate_citizen_trust`: Update citizen trust score
- `calculate_department_trust`: Update department trust score
- `analyze_trust_trends`: Track trust score changes
- `generate_trust_report`: Produce trust reports
- `alert_trust_change`: Notify on significant changes

#### 5.2.10 Payment Processing Agent

| Attribute | Specification |
|-----------|---------------|
| **Agent ID** | `gov.payment.processing` |
| **Port** | 4001-A1 |
| **Role** | Process government fee payments |
| **Twins Managed** | Citizen Twin (5251), Permit Twin (5254) |
| **Skills** | Fee calculation, Payment processing, Reconciliation |
| **Capabilities** | Multi-method payments, Auto-reconciliation, Refund processing |
| **Triggers** | Payment initiation, Settlement deadline, Refund request |

**Actions:**
- `calculate_fees`: Compute total fees
- `initiate_payment`: Process payment request
- `verify_payment`: Confirm payment status
- `process_refund`: Handle refund requests
- `reconcile_transactions`: Match payments with records

---

## 6. Business Copilot Queries

### 6.1 Insights Available to Government Administrators

**Operational Insights:**
- Service application volumes and trends
- Department-wise processing times
- SLA compliance rates by department
- Permit application pipeline
- Complaint resolution statistics
- Citizen satisfaction scores

**Financial Insights:**
- Revenue from service fees
- Revenue from permit fees
- Pending fee collections
- Refund processed
- Budget utilization by department
- Cost per service delivery

**Compliance Insights:**
- RTI compliance status
- Audit findings by department
- Policy violation trends
- Regulatory compliance scores
- Upcoming compliance deadlines
- Risk exposure by framework

**Trust Insights:**
- Department trust scores
- Citizen trust trends
- Transparency metrics
- Responsiveness indicators
- Accountability scores
- Public perception analysis

### 6.2 Natural Language Queries Supported

| Category | Sample Queries |
|----------|---------------|
| **Services** | "Show me all pending service applications", "Which services have lowest approval rates?", "What's the average processing time for birth certificates?" |
| **Departments** | "Show department performance rankings", "Which departments are missing SLA targets?", "What's the workload distribution across departments?" |
| **Permits** | "Show all building permits pending approval", "Which permits expire next month?", "What's the approval rate for trade licenses?" |
| **Complaints** | "Show all complaints filed this month", "Which department has highest complaint volume?", "What are the top complaint categories?" |
| **Compliance** | "What's our RTI compliance status?", "Show departments with audit findings", "Which services need policy updates?" |
| **Financial** | "What's the total revenue from permits this quarter?", "Show fee collection trends", "Which departments have highest fee arrears?" |
| **Trust** | "Show citizen trust scores by district", "Which departments have declining trust scores?", "What's the correlation between SLA compliance and trust?" |

### 6.3 Dashboard Views Needed

**Executive Dashboard:**
- Government service metrics overview
- Department performance rankings
- Citizen satisfaction trends
- Compliance risk summary
- Revenue and budget utilization
- Alerts and action items

**Department Dashboard:**
- Service application pipeline
- SLA compliance rate
- Staff workload distribution
- Citizen feedback summary
- Compliance checklist
- Budget and expenditure

**Service Dashboard:**
- Application volumes by service
- Approval/rejection rates
- Average processing time
- Document requirements
- Fee structure
- Citizen eligibility

**Permit Dashboard:**
- Permit pipeline by type
- Cross-department approval status
- Inspection schedule
- Expiring permits
- Fee collection status
- Compliance violations

**Complaint Dashboard:**
- Complaint volume by category
- Resolution time trends
- SLA compliance rate
- Department-wise complaints
- Escalation statistics
- Citizen satisfaction scores

**Compliance Dashboard:**
- Framework compliance scores
- RTI response status
- Audit findings
- Policy acknowledgments
- Upcoming deadlines
- Risk exposure

---

## 7. Economic Integration

### 7.1 Revenue Model

#### 7.1.1 Service Fees

| Service Category | Fee Model | Typical Range |
|-----------------|-----------|---------------|
| Certificates | Fixed + Variable | INR 50-500 |
| Permits | Fixed + Area-based | INR 500-50,000 |
| Licenses | Fixed + Renewal | INR 1,000-100,000 |
| Benefits | Means-tested | Free to subsidized |
| Utilities | Volume-based | Variable |

#### 7.1.2 Transaction Revenue

| Transaction Type | Revenue Share | Platform Fee |
|-----------------|---------------|-------------|
| Online Applications | 2-5% of fee | Platform maintenance |
| Payment Processing | Per transaction | RABTUL Pay |
| Permit Renewals | Flat fee | Auto-renewal service |
| Compliance Services | Subscription | Monthly/annual |

### 7.2 Cost Optimization

#### 7.2.1 Operational Savings

| Area | Current Cost | Projected Savings | Mechanism |
|------|-------------|-------------------|-----------|
| Manual Processing | High | 60% reduction | Automation |
| Paper Documentation | High | 80% reduction | Digital records |
| Physical Counter | High | 50% reduction | Online services |
| Complaint Handling | Medium | 40% reduction | AI triage |
| Compliance Audits | High | 30% reduction | Automated monitoring |

#### 7.2.2 Performance Incentives

| Metric | Target | Incentive |
|--------|--------|-----------|
| SLA Compliance | >95% | Performance bonus |
| Digital Adoption | >80% | Grants |
| Citizen Satisfaction | >85% | Recognition |
| Processing Time | <50% of SLA | Awards |

### 7.3 Economic Impact Indicators

| Indicator | Measurement | Target |
|-----------|-------------|--------|
| Service Delivery Cost | Cost per service | 40% reduction |
| Processing Time | Average days | 60% reduction |
| Citizen Effort | Steps to complete | 70% reduction |
| Digital Adoption | % online | 80% adoption |
| Compliance Cost | Cost per department | 30% reduction |
| Complaint Resolution | % within SLA | 95% compliance |

### 7.4 Budget Integration

#### 7.4.1 Government Budget Alignment

| Budget Category | Integration Point | Data Required |
|----------------|-------------------|---------------|
| e-Governance | Digital services | Service metrics |
| Citizen Services | Service delivery | Volume data |
| Compliance | Monitoring | Compliance scores |
| Infrastructure | Permit processing | Permit data |
| Welfare | Benefits delivery | Beneficiary data |

#### 7.4.2 Reporting Integration

| Report Type | Frequency | Contents |
|-------------|-----------|----------|
| Service Metrics | Weekly | Application volumes, processing times |
| Financial Summary | Monthly | Revenue, expenditures, arrears |
| Compliance Status | Quarterly | Audit findings, policy updates |
| Performance Review | Annually | Department rankings, trust scores |

---

## 8. Implementation Roadmap

### 8.1 6-Week Implementation Plan

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                    GOVERNMENT & PUBLIC SERVICES OS - 6 WEEK ROADMAP                 │
└─────────────────────────────────────────────────────────────────────────────────────┘

WEEK 1: Foundation & Core Integration
─────────────────────────────────────
│ Day 1-2   │ TwinOS Hub Setup
│           │ - Deploy Twin Hub (5250)
│           │ - Configure twins registry
│           │ - Set up event bus topics
│           │ - Establish health monitoring
│
│ Day 3-4   │ RABTUL Auth Integration
│           │ - Integrate RABTUL Auth (4002)
│           │ - Configure citizen identity flow
│           │ - Set up JWT validation
│           │ - Implement government ID verification
│
│ Day 5-7   │ Citizen Twin Implementation
│           │ - Deploy Citizen Twin (5251)
│           │ - Implement data model
│           │ - Create citizen onboarding flow
│           │ - Set up trust score initialization
│
├───────────┼─────────────────────────────────────────────────────────────────────────┤
│ WEEK 2:   │ Service & Department Twins                                           │
├───────────┼─────────────────────────────────────────────────────────────────────────┤
│ Day 8-9   │ Service Twin Implementation
│           │ - Deploy Service Twin (5252)
│           │ - Build service catalog
│           │ - Implement eligibility engine
│           │ - Create application workflow
│
│ Day 10-11 │ Department Twin Implementation
│           │ - Deploy Department Twin (5253)
│           │ - Build department hierarchy
│           │ - Implement performance metrics
│           │ - Set up compliance tracking
│
│ Day 12-14 │ Service Routing Agent
│           │ - Deploy Service Routing Agent
│           │ - Implement routing logic
│           │ - Build eligibility checker
│           │ - Create notification triggers
│
├───────────┼─────────────────────────────────────────────────────────────────────────┤
│ WEEK 3:   │ Permit & Complaint Twins                                            │
├───────────┼─────────────────────────────────────────────────────────────────────────┤
│ Day 15-16 │ Permit Twin Implementation
│           │ - Deploy Permit Twin (5254)
│           │ - Build permit data model
│           │ - Implement approval workflow
│           │ - Create inspection scheduling
│
│ Day 17-18 │ Complaint Twin Implementation
│           │ - Deploy Complaint Twin (5255)
│           │ - Build complaint data model
│           │ - Implement SLA tracking
│           │ - Create escalation workflow
│
│ Day 19-21 │ Permit & Complaint Agents
│           │ - Deploy Permit Processing Agent
│           │ - Deploy Complaint Intake Agent
│           │ - Deploy Grievance Officer Agent
│           │ - Deploy Escalation Agent
│
├───────────┼─────────────────────────────────────────────────────────────────────────┤
│ WEEK 4:   │ Compliance & Trust Integration                                      │
├───────────┼─────────────────────────────────────────────────────────────────────────┤
│ Day 22-23 │ Compliance Suite Integration
│           │ - Integrate Compliance Suite (4180-4185)
│           │ - Configure multi-framework compliance
│           │ - Set up RTI monitoring
│           │ - Build audit trail
│
│ Day 24-25 │ Trust OS Integration
│           │ - Integrate Trust OS (4200-4210)
│           │ - Configure trust scoring
│           │ - Implement transparency metrics
│           │ - Build accountability tracking
│
│ Day 26-28 │ Department Compliance Agent
│           │ - Deploy Department Compliance Agent
│           │ - Implement compliance monitoring
│           │ - Build audit management
│           │ - Create compliance reporting
│
├───────────┼─────────────────────────────────────────────────────────────────────────┤
│ WEEK 5:   │ Payment & Business Intelligence                                     │
├───────────┼─────────────────────────────────────────────────────────────────────────┤
│ Day 29-30 │ RABTUL Pay Integration
│           │ - Integrate RABTUL Pay (4001)
│           │ - Configure fee collection
│           │ - Set up refund processing
│           │ - Implement payment reconciliation
│
│ Day 31-32 │ Payment Processing Agent
│           │ - Deploy Payment Processing Agent
│           │ - Implement fee calculation
│           │ - Build payment workflow
│           │ - Create refund handling
│
│ Day 33-35 │ Business Copilot Integration
│           │ - Deploy dashboard views
│           │ - Configure natural language queries
│           │ - Build reporting templates
│           │ - Set up alerts and notifications
│
├───────────┼─────────────────────────────────────────────────────────────────────────┤
│ WEEK 6:   │ Testing, Training & Go-Live                                         │
├───────────┼─────────────────────────────────────────────────────────────────────────┤
│ Day 36-37 │ Integration Testing
│           │ - End-to-end flow testing
│           │ - API integration testing
│           │ - Event bus testing
│           │ - Performance testing
│
│ Day 38-39 │ User Acceptance Testing
│           │ - Citizen journey testing
│           │ - Department officer testing
│           │ - Admin dashboard testing
│           │ - Feedback collection
│
│ Day 40-41 │ Training & Documentation
│           │ - Officer training sessions
│           │ - Admin training sessions
│           │ - User documentation
│           │ - API documentation
│
│ Day 42    │ Go-Live
│           │ - Production deployment
│           │ - Monitoring setup
│           │ - Support team briefing
│           │ - Launch announcement
```

### 8.2 Milestone Checklist

#### Week 1 Milestones
- [ ] TwinOS Hub deployed and healthy
- [ ] RABTUL Auth integration functional
- [ ] Citizen Twin deployed with data model
- [ ] Citizen onboarding flow working

#### Week 2 Milestones
- [ ] Service Twin deployed with catalog
- [ ] Department Twin deployed with hierarchy
- [ ] Service Routing Agent operational
- [ ] Eligibility checking functional

#### Week 3 Milestones
- [ ] Permit Twin deployed with workflow
- [ ] Complaint Twin deployed with SLA
- [ ] Permit Processing Agent operational
- [ ] Complaint handling agents deployed

#### Week 4 Milestones
- [ ] Compliance Suite integrated
- [ ] Trust OS integrated
- [ ] Department Compliance Agent deployed
- [ ] Multi-framework compliance working

#### Week 5 Milestones
- [ ] RABTUL Pay integration complete
- [ ] Payment Processing Agent deployed
- [ ] Business Copilot dashboards live
- [ ] Reporting templates configured

#### Week 6 Milestones
- [ ] All integration tests passed
- [ ] UAT completed with feedback
- [ ] Training completed for all users
- [ ] Go-live successful

### 8.3 Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Data migration delays | Medium | High | Phased migration, parallel run |
| Integration failures | Medium | Medium | Comprehensive testing, fallback |
| User adoption resistance | High | High | Change management, training |
| Performance issues | Low | High | Load testing, scaling plan |
| Compliance gaps | Low | Critical | Continuous compliance monitoring |

### 8.4 Success Metrics

| Metric | Baseline | Target | Week |
|--------|----------|--------|------|
| Citizen onboarding | 0 | 100/day | 6 |
| Service applications | 0 | 500/day | 6 |
| SLA compliance | N/A | >95% | 8 |
| Digital adoption | 0% | >60% | 8 |
| Complaint resolution | N/A | >90% | 8 |
| Payment processing | 0 | 100% | 6 |

---

## Appendix A: API Reference

### A.1 Quick Reference

| Service | Port | Base URL |
|---------|------|----------|
| TwinOS Hub | 5250 | `http://localhost:5250` |
| Citizen Twin | 5251 | `http://localhost:5251` |
| Service Twin | 5252 | `http://localhost:5252` |
| Department Twin | 5253 | `http://localhost:5253` |
| Permit Twin | 5254 | `http://localhost:5254` |
| Complaint Twin | 5255 | `http://localhost:5255` |
| RABTUL Auth | 4002 | `http://localhost:4002` |
| RABTUL Pay | 4001 | `http://localhost:4001` |
| Compliance Suite | 4180 | `http://localhost:4180` |
| Trust OS | 4200 | `http://localhost:4200` |

### A.2 Authentication

All API calls require JWT token in Authorization header:
```
Authorization: Bearer <jwt_token>
```

### A.3 Rate Limits

| Endpoint Type | Limit |
|--------------|-------|
| Read operations | 1000 req/min |
| Write operations | 100 req/min |
| Batch operations | 10 req/min |

---

## Appendix B: Data Retention

| Data Type | Retention Period | Legal Basis |
|-----------|-----------------|-------------|
| Citizen records | Permanent | Identity verification |
| Service applications | 7 years | Audit requirements |
| Permit records | 10 years | Regulatory |
| Complaint records | 5 years | Grievance resolution |
| Payment records | 7 years | Financial compliance |
| Audit logs | 5 years | Compliance |

---

## Appendix C: Compliance Frameworks

| Framework | Application | Requirements |
|-----------|-------------|--------------|
| RTI Act | All services | Information disclosure |
| IT Act | Digital services | Data protection |
| GDPR | Personal data | Privacy compliance |
| eGov Standards | All services | Service delivery standards |
| CGA Guidelines | Financial | Budget compliance |

---

**Document Version:** 1.0
**Last Updated:** June 12, 2026
**Next Review:** Quarterly
**Owner:** RTNM Digital - Government OS Team
