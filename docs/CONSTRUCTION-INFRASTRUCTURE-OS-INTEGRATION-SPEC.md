# Construction & Infrastructure Industry OS - Integration Specification

**Document Version:** 1.0.0
**Date:** June 12, 2026
**Author:** RTNM Architecture Team
**Status:** Ready for Implementation

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Capability Matrix](#2-product-capability-matrix)
3. [Twin Architecture](#3-twin-architecture)
4. [Integration Flows](#4-integration-flows)
5. [Agent Architecture](#5-agent-architecture)
6. [Business Copilot Integration](#6-business-copilot-integration)
7. [Economic Integration](#7-economic-integration)
8. [Implementation Roadmap](#8-implementation-roadmap)

---

## 1. Executive Summary

### 1.1 Industry Overview

The Construction & Infrastructure industry faces significant operational challenges that create substantial value opportunities when addressed through unified digital systems:

| Challenge | Impact | Current State | OS Solution |
|-----------|--------|---------------|-------------|
| **Fragmented project data** | 25-35% efficiency loss | Disconnected spreadsheets, paper-based logs | Project Twin with real-time sync |
| **Reactive resource management** | 15-20% labor idle time | Manual scheduling, no visibility | Worker/Equipment Twin with AI scheduling |
| **Material waste & theft** | 8-15% material loss | No tracking, manual counts | Site Twin with material tracking |
| **Contractor compliance** | 10-20% compliance failures | Paper-based certifications | Contractor Twin with automated checks |
| **Safety incidents** | High liability, delays | Reactive incident response | Safety Agent with predictive alerts |
| **Cost overruns** | 80% of projects exceed budget | Late detection, limited visibility | Business Copilot with cost forecasting |
| **Regulatory compliance** | Delays, penalties | Manual documentation | Compliance Checker integration |
| **Equipment downtime** | ₹50K-5L per day per machine | Preventive, not predictive | Equipment Twin with maintenance AI |

### 1.2 Key Integration Opportunity

**Primary Integration Point:** REZ Business Copilot ↔ Project Twin

This integration enables:
- Real-time project cost tracking and forecasting
- AI-powered resource allocation across sites
- Predictive safety and compliance monitoring
- Automated progress reporting to stakeholders
- Contractor performance analytics

### 1.3 Expected Outcomes

| Outcome | Metric | Timeline |
|---------|--------|----------|
| Cost overrun reduction | 20-30% fewer budget overruns | 3-6 months |
| Labor productivity | 15-25% increase in productive hours | 2-4 months |
| Material waste reduction | 25-35% less material loss | 2-4 months |
| Safety incident reduction | 40-50% fewer incidents | 3-6 months |
| Compliance improvement | 90%+ first-pass compliance | 1-3 months |
| Equipment utilization | 20-30% improvement in OEE | 3-6 months |
| Project delivery time | 10-15% faster completion | 3-6 months |

### 1.4 Construction & Infrastructure OS Ecosystem

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                      CONSTRUCTION & INFRASTRUCTURE INDUSTRY OS                        │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                       │
│  ┌───────────────────────────────────────────────────────────────────────────────┐   │
│  │                            TWINOS LAYER (Port 5250)                           │   │
│  │                                                                                 │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │   │
│  │  │ Project  │  │   Site   │  │Contractor│  │  Worker  │  │Equipment │      │   │
│  │  │   Twin   │  │   Twin   │  │   Twin   │  │   Twin   │  │   Twin   │      │   │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘      │   │
│  │       └─────────────┴─────────────┴─────────────┴─────────────┘              │   │
│  │                                    │                                           │   │
│  │                           ┌────────┴────────┐                                  │   │
│  │                           │    Twin Hub    │                                  │   │
│  │                           │     (5250)     │                                  │   │
│  │                           └────────────────┘                                  │   │
│  └───────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                       │
│  ┌───────────────────────────────────────────────────────────────────────────────┐   │
│  │                           PRODUCT LAYER                                         │   │
│  │                                                                                 │   │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  │   │
│  │  │    REZ POS     │  │  REZ Staff    │  │ REZ Inventory │  │  Compliance    │  │   │
│  │  │    (4013)      │  │    (4015)     │  │    (4010)     │  │   Checker      │  │   │
│  │  │                │  │                │  │                │  │    (LawGens)   │  │   │
│  │  │ Project billing│  │ Labor mgmt    │  │ Material track │  │ Regulatory     │  │   │
│  │  │ Invoice mgmt  │  │ Scheduling    │  │ Site stock     │  │ compliance     │  │   │
│  │  └───────┬────────┘  └───────┬────────┘  └───────┬────────┘  └───────┬────────┘  │   │
│  │          │                    │                    │                    │          │   │
│  │          └────────────────────┴────────────────────┴────────────────────┘          │   │
│  │                                      │                                           │   │
│  │                           ┌──────────┴──────────┐                               │   │
│  │                           │   REZ Business     │                               │   │
│  │                           │     Copilot        │                               │   │
│  │                           │    (4022)          │                               │   │
│  │                           │                    │                               │   │
│  │                           │ Project Twin ↔ AI │                               │   │
│  │                           └────────────────────┘                               │   │
│  └───────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                       │
│  ┌───────────────────────────────────────────────────────────────────────────────┐   │
│  │                         INFRASTRUCTURE LAYER                                    │   │
│  │                                                                                 │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │   │
│  │  │   RABTUL   │  │    HOJAI    │  │   REZ       │  │    REZ      │           │   │
│  │  │    Pay     │  │     AI      │  │ Intelligence │  │  Identity   │           │   │
│  │  │   (4001)   │  │ Intelligence│  │  (4530)     │  │    Hub      │           │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘           │   │
│  └───────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                       │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Product Capability Matrix

### 2.1 REZ POS (Point of Sale)

| Attribute | Details |
|-----------|---------|
| **Company** | REZ Merchant |
| **Port** | 4013, 4081 |
| **Core Capabilities** | Project-based billing, progress invoicing, contractor payments, material purchases, petty cash management |
| **Data Produced** | Invoices, payments, project costs, contractor payments, material expenses, revenue recognition |
| **Data Needed** | Project codes, contractor details, material inventory, approval workflows, cost codes |
| **Current Integration** | RABTUL Pay (payments), RABTUL Wallet (rewards), REZ Inventory (purchases) |
| **API Base URL** | `http://localhost:4013` or `REZ_POS_SERVICE_URL` |

**Key Endpoints for Construction:**
```json
POST /api/projects                    - Create project billing code
GET  /api/projects/:id                - Get project details
POST /api/invoices                    - Create invoice (progress/interim/final)
GET  /api/invoices/:id               - Get invoice details
PATCH /api/invoices/:id/status       - Update invoice status
POST /api/payments                    - Record payment
GET  /api/payments/:id              - Get payment details
GET  /api/reports/cost-summary       - Project cost summary
GET  /api/reports/budget-variance    - Budget vs actual report
POST /api/petty-cash                 - Petty cash transactions
GET  /api/contractors/:id/payments   - Contractor payment history
```

**Data Models:**
```typescript
// Project Billing
interface ConstructionProject {
  id: string;
  projectCode: string;
  name: string;
  client: {
    name: string;
    contact: string;
    address: Address;
  };
  contractValue: number;
  currency: string;
  startDate: Date;
  endDate: Date;
  status: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CLOSED';
  billingType: 'LUMPSUM' | 'COST_PLUS' | 'TIME_AND_MATERIALS' | 'UNIT_RATE';
  costCodes: CostCode[];
  milestones: Milestone[];
  approvedBy: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Cost Code
interface CostCode {
  code: string;
  description: string;
  category: 'MATERIAL' | 'LABOR' | 'EQUIPMENT' | 'SUBCONTRACTOR' | 'OVERHEAD' | 'CONTINGENCY';
  budgetedAmount: number;
  actualAmount: number;
  committedAmount: number;
  variance: number;
}

// Invoice
interface ConstructionInvoice {
  id: string;
  invoiceNumber: string;
  projectId: string;
  type: 'PROGRESS' | 'INTERIM' | 'FINAL' | 'RETENTION';
  periodStart: Date;
  periodEnd: Date;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  tax: number;
  retention: number;
  totalAmount: number;
  amountPaid: number;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'PARTIAL' | 'PAID' | 'OVERDUE';
  submittedDate?: Date;
  dueDate: Date;
  approvedBy?: string;
  payments: PaymentRecord[];
}
```

---

### 2.2 REZ Staff

| Attribute | Details |
|-----------|---------|
| **Company** | REZ Merchant |
| **Port** | 4015, 4620 |
| **Core Capabilities** | Labor scheduling, attendance tracking, skill matching, workforce allocation, certification management, safety training tracking |
| **Data Produced** | Worker profiles, schedules, attendance, productivity metrics, certifications, safety records |
| **Data Needed** | Project requirements, skill requirements, site locations, union agreements, training modules |
| **Current Integration** | RABTUL Pay (wage payments), REZ Inventory (consumables), CorpPerks (workforce) |
| **API Base URL** | `http://localhost:4015` or `REZ_STAFF_SERVICE_URL` |

**Key Endpoints for Construction:**
```json
POST /api/workers                     - Register worker
GET  /api/workers/:id                - Get worker profile
PATCH /api/workers/:id/skills        - Update worker skills
POST /api/schedules                   - Create schedule
GET  /api/schedules/:projectId       - Get project schedule
POST /api/attendance                  - Record attendance
GET  /api/attendance/:workerId        - Worker attendance history
GET  /api/attendance/:projectId       - Project attendance
POST /api/certifications              - Add certification
GET  /api/certifications/expiring    - Expiring certifications
GET  /api/productivity/:projectId     - Productivity reports
POST /api/deployments                 - Deploy worker to site
GET  /api/deployments/:workerId       - Worker deployment history
```

**Data Models:**
```typescript
// Worker Profile
interface ConstructionWorker {
  id: string;
  workerId: string;
  name: string;
  phone: string;
  email?: string;
  aadhar?: string;
  photo?: string;
  
  // Employment
  employmentType: 'PERMANENT' | 'CONTRACT' | 'DAILY_WAGER' | 'SUBCONTRACTOR';
  department: string;
  designation: string;
  skillLevel: 'JUNIOR' | 'SEMI_SKILLED' | 'SKILLED' | 'SUPERVISOR' | 'MASTER';
  
  // Skills & Certifications
  skills: WorkerSkill[];
  certifications: Certification[];
  trainingRecords: TrainingRecord[];
  
  // Safety
  safetyTraining: {
    lastTrainingDate: Date;
    nextDueDate: Date;
    certifications: string[];
  };
  ppeIssued: PPEItem[];
  
  // Productivity
  productivityMetrics: {
    averageOutput: number;
    qualityScore: number;
    attendanceRate: number;
    overtimeHours: number;
  };
  
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'TERMINATED';
  createdAt: Date;
}

// Worker Skill
interface WorkerSkill {
  trade: string;                      // e.g., "Masonry", "Plumbing", "Electrical"
  experience: number;                  // years
  proficiency: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  certifications?: string[];
  lastAssessmentDate?: Date;
}

// Attendance Record
interface AttendanceRecord {
  id: string;
  workerId: string;
  projectId: string;
  date: Date;
  checkIn?: Date;
  checkOut?: Date;
  hoursWorked: number;
  overtimeHours: number;
  status: 'PRESENT' | 'ABSENT' | 'LEAVE' | 'HOLIDAY' | 'AWOL';
  reason?: string;
  recordedBy: string;
  verifiedBy?: string;
}
```

---

### 2.3 REZ Inventory

| Attribute | Details |
|-----------|---------|
| **Company** | REZ Merchant |
| **Port** | 4010, 4625 |
| **Core Capabilities** | Material tracking, site inventory, purchase orders, supplier management, material requisitions, consumption tracking, low stock alerts |
| **Data Produced** | Stock levels, material movements, consumption patterns, reorder alerts, wastage reports, inventory valuation |
| **Data Needed** | Material specifications, project requirements, BOM (Bill of Materials), supplier info, storage requirements |
| **Current Integration** | REZ POS (purchases), REZ Manufacturing OS (for prefabrication), RABTUL Pay (supplier payments) |
| **API Base URL** | `http://localhost:4010` or `REZ_INVENTORY_SERVICE_URL` |

**Key Endpoints for Construction:**
```json
POST /api/materials                   - Add material
GET  /api/materials/:id              - Get material details
GET  /api/inventory/:projectId        - Project inventory
POST /api/inventory/transfer          - Transfer between sites
GET  /api/inventory/consumption/:projectId - Material consumption
POST /api/requisitions                 - Create requisition
GET  /api/requisitions/:projectId     - Project requisitions
PATCH /api/requisitions/:id/approve  - Approve requisition
GET  /api/alerts/low-stock           - Low stock alerts
GET  /api/reports/material-costs      - Material cost reports
POST /api/returns                     - Return materials
GET  /api/suppliers/:id/performance   - Supplier performance
```

**Data Models:**
```typescript
// Construction Material
interface ConstructionMaterial {
  id: string;
  materialId: string;
  sku: string;
  name: string;
  description: string;
  category: 'CEMENT' | 'STEEL' | 'AGGREGATES' | 'BRICKS' | 'TIMBER' | 'ELECTRICAL' | 'PLUMBING' | 'HARDWARE' | 'SAFETY' | 'OTHER';
  unit: 'TONNES' | 'BAGS' | 'PIECES' | 'METERS' | 'SQUARE_METERS' | 'CUBIC_METERS' | 'LITERS';
  
  // Specifications
  specifications: {
    grade?: string;                   // e.g., "M35" for concrete
    size?: string;
    brand?: string;
    standard?: string;                // BIS/ISO standard
  };
  
  // Storage
  storage: {
    requiresShed: boolean;
    requiresDry: boolean;
    hazardous?: boolean;
    maxStackHeight?: number;
    shelfLife?: number;              // days
  };
  
  // Stock
  stock: {
    quantity: number;
    reorderPoint: number;
    reorderQuantity: number;
    minStock: number;
    maxStock: number;
    unitCost: number;
    totalValue: number;
  };
  
  // Suppliers
  approvedSuppliers: {
    supplierId: string;
    leadTimeDays: number;
    unitPrice: number;
    moq: number;
  }[];
  
  status: 'ACTIVE' | 'DISCONTINUED' | 'RESTRICTED';
}

// Material Requisition
interface MaterialRequisition {
  id: string;
  requisitionNumber: string;
  projectId: string;
  siteId: string;
  requestedBy: string;
  requestedDate: Date;
  items: RequisitionItem[];
  totalEstimatedCost: number;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'PARTIAL' | 'FULFILLED' | 'CANCELLED';
  approvedBy?: string;
  approvedDate?: Date;
  fulfilledItems: FulfilledItem[];
}

// Site Inventory
interface SiteInventory {
  siteId: string;
  projectId: string;
  materials: {
    materialId: string;
    materialName: string;
    currentStock: number;
    allocatedQuantity: number;
    availableQuantity: number;
    inTransitQuantity: number;
    lastUpdated: Date;
  }[];
  totalValue: number;
  alertFlags: AlertFlag[];
}
```

---

### 2.4 REZ Business Copilot

| Attribute | Details |
|-----------|---------|
| **Company** | REZ Merchant |
| **Port** | 4022 |
| **Core Capabilities** | Natural language project queries, cost forecasting, resource optimization, risk analysis, compliance monitoring, executive dashboards |
| **Data Produced** | AI insights, predictions, recommendations, reports, alerts |
| **Data Needed** | Project Twin data, Site Twin data, Worker Twin data, Equipment Twin data, historical project data |
| **Current Integration** | Project Twin (primary), REZ Intelligence, HOJAI Memory |
| **API Base URL** | `http://localhost:4022` or `REZ_COPILOT_SERVICE_URL` |

**Key Endpoints:**
```json
POST /api/query                        - Natural language query
POST /api/insights/project            - Project insights
GET  /api/forecast/cost/:projectId     - Cost forecasting
GET  /api/forecast/timeline/:projectId - Timeline prediction
POST /api/recommendations/:projectId   - Get recommendations
GET  /api/alerts/:projectId           - Project alerts
GET  /api/reports/executive/:projectId - Executive summary
GET  /api/reports/risk/:projectId     - Risk analysis report
GET  /api/reports/productivity/:projectId - Productivity analysis
GET  /api/dashboard/:projectId        - Real-time dashboard
```

**Copilot Capabilities for Construction:**
```typescript
interface ConstructionCopilotFeatures {
  projectManagement: {
    "What's the current status of Project ABC?";
    "Show me all projects with delays";
    "Which milestones are at risk?";
    "Generate a project status report";
  };
  
  costManagement: {
    "What's the cost-to-date for Project ABC?";
    "Show me budget variance by cost code";
    "Predict final project cost";
    "What's our material cost trend?";
  };
  
  resourceManagement: {
    "Do we have skilled workers available for Project XYZ?";
    "Show me labor utilization across sites";
    "When does our equipment become available?";
    "Optimize resource allocation";
  };
  
  riskAndSafety: {
    "What are the top 5 risks in Project ABC?";
    "Show me safety incidents this month";
    "Any compliance issues pending?";
    "Predict probability of delays";
  };
  
  compliance: {
    "What's our regulatory compliance status?";
    "Show me expiring certifications";
    "Any pending approvals?";
    "Generate compliance report";
  };
  
  contractorManagement: {
    "How is Contractor XYZ performing?";
    "Show me contractor payment status";
    "Compare contractor performance";
    "Recommend contractors for new work";
  };
}
```

---

### 2.5 Compliance Checker

| Attribute | Details |
|-----------|---------|
| **Company** | LawGens |
| **Port** | TBD |
| **Core Capabilities** | Regulatory compliance verification, permit tracking, license management, safety compliance, labor law compliance |
| **Data Produced** | Compliance reports, violation alerts, certification status, audit trails |
| **Data Needed** | Project permits, worker certifications, equipment licenses, safety records, labor records |
| **Current Integration** | REZ Staff (certifications), REZ Business Copilot (reporting) |
| **API Base URL** | TBD |

**Key Endpoints:**
```json
POST /api/compliance/check             - Check compliance status
GET  /api/compliance/:projectId        - Project compliance
GET  /api/permits/:projectId           - Permit status
POST /api/permits/:projectId           - Add permit
GET  /api/audit/:projectId            - Audit trail
GET  /api/violations                   - Active violations
POST /api/violations/:id/resolve       - Resolve violation
GET  /api/reports/compliance          - Compliance report
```

**Compliance Categories:**
```typescript
interface ComplianceChecklist {
  projectPermits: {
    buildingPermit: Permit;
    environmentalClearance: Permit;
    fireNOC: Permit;
    electricalApproval: Permit;
    plumbingApproval: Permit;
    liftInstallationPermit?: Permit;
    occupancyCertificate?: Permit;
  };
  
  laborCompliance: {
    contractorLicense: boolean;
    workerRegistrations: boolean;
    minimumWageCompliance: boolean;
    providentFund: boolean;
    employeeStateInsurance: boolean;
    bonusActCompliance: boolean;
    gratuityCompliance: boolean;
  };
  
  safetyCompliance: {
    safetyOfficerAppointment: boolean;
    firstAidKit: boolean;
    fireExtinguishers: boolean;
    ppeCompliance: boolean;
    safetyTrainingRecords: boolean;
    accidentReporting: boolean;
    scaffoldingInspection: boolean;
    craneCertification: boolean;
  };
  
  environmentalCompliance: {
    dustControl: boolean;
    noiseControl: boolean;
    wasteManagement: boolean;
    waterDischarge: boolean;
    hazardousMaterialHandling: boolean;
  };
}
```

---

## 3. Twin Architecture

### 3.1 Twin Overview

The Construction & Infrastructure OS uses five interconnected Digital Twins representing the key entities in construction projects:

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                        CONSTRUCTION TWIN ECOSYSTEM                                  │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                       │
│  ┌───────────────────────────────────────────────────────────────────────────────┐ │
│  │                           TWIN HUB (Port 5250)                                  │ │
│  │                    Central coordination and state management                     │ │
│  └───────────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                                 │
│  ┌─────────────────────────────────┼─────────────────────────────────────────────┐ │
│  │                                 │                                             │ │
│  │  ┌─────────────┐     ┌─────────┴─────────┐     ┌─────────────┐             │ │
│  │  │   Project   │◄────│       Site       │────►│ Contractor  │             │ │
│  │  │    Twin     │     │       Twin        │     │    Twin     │             │ │
│  │  └──────┬──────┘     └─────────┬─────────┘     └──────┬──────┘             │ │
│  │         │                      │                      │                     │ │
│  │         │         ┌────────────┼────────────┐         │                     │ │
│  │         │         │            │            │         │                     │ │
│  │         │         ▼            ▼            ▼         │                     │ │
│  │         │    ┌─────────┐  ┌─────────┐  ┌─────────┐  │                     │ │
│  │         │    │ Worker  │  │Equipment│  │ Material│  │                     │ │
│  │         │    │  Twin   │  │  Twin   │  │  Twin   │◄─┘                     │ │
│  │         │    └─────────┘  └─────────┘  └─────────┘                        │ │
│  │         │                                                                  │ │
│  │         └──────────────────────────────────┐                              │ │
│  │                                            │                               │ │
│  │                                            ▼                               │ │
│  │                                 ┌─────────────────┐                       │ │
│  │                                 │  REZ Business   │                       │ │
│  │                                 │     Copilot     │                       │ │
│  │                                 └─────────────────┘                       │ │
│  └───────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                       │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Project Twin

The Project Twin is the central digital representation of a construction project, aggregating all site, resource, and progress data.

```json
{
  "$schema": "https://rtnm.digital/schemas/twin/v1",
  "type": "ProjectTwin",
  "id": "project-{projectId}",
  "attributes": {
    "basicInfo": {
      "projectId": "string",
      "projectCode": "string",
      "name": "string",
      "description": "string",
      "type": "RESIDENTIAL | COMMERCIAL | INFRASTRUCTURE | INDUSTRIAL | ROAD | BRIDGE | UTILITY",
      "subType": "string",
      "status": "PLANNING | DESIGN | APPROVAL | ACTIVE | ON_HOLD | COMPLETED | CLOSED"
    },
    "client": {
      "clientId": "string",
      "name": "string",
      "contactPerson": "string",
      "email": "string",
      "phone": "string",
      "address": "Address"
    },
    "contract": {
      "contractId": "string",
      "contractValue": "number",
      "currency": "string",
      "type": "LUMPSUM | COST_PLUS | TIME_AND_MATERIALS | UNIT_RATE",
      "startDate": "ISO8601 Date",
      "endDate": "ISO8601 Date",
      "originalDuration": "number (days)",
      "remainingDays": "number",
      "extensions": "number",
      "penaltyClauses": ["string"],
      "bonusClauses": ["string"]
    },
    "schedule": {
      "plannedStart": "ISO8601 Date",
      "plannedEnd": "ISO8601 Date",
      "actualStart": "ISO8601 Date",
      "expectedEnd": "ISO8601 Date",
      "percentComplete": "number",
      "plannedProgress": "number",
      "scheduleVariance": "number (days)",
      "criticalPathItems": ["string"]
    },
    "cost": {
      "contractValue": "number",
      "budgetedCost": "number",
      "costToDate": "number",
      "estimatedFinalCost": "number",
      "committedCost": "number",
      "earnedValue": "number",
      "costVariance": "number",
      "schedulePerformanceIndex": "number",
      "costPerformanceIndex": "number",
      "budgetUtilization": "number (percentage)"
    },
    "billing": {
      "totalInvoiced": "number",
      "totalReceived": "number",
      "retention": "number",
      "pendingInvoices": "number",
      "retentionPercent": "number",
      "paymentTerms": "string"
    },
    "sites": [
      {
        "siteId": "string",
        "name": "string",
        "location": "GeoLocation",
        "status": "ACTIVE | INACTIVE | COMPLETED"
      }
    ],
    "contractors": [
      {
        "contractorId": "string",
        "name": "string",
        "scope": "string",
        "contractValue": "number",
        "status": "ACTIVE | COMPLETED | TERMINATED"
      }
    ],
    "resources": {
      "totalWorkers": "number",
      "totalEquipment": "number",
      "laborHoursToDate": "number",
      "equipmentHoursToDate": "number"
    },
    "quality": {
      "inspectionCount": "number",
      "passedCount": "number",
      "failedCount": "number",
      "passRate": "number (percentage)",
      "openDefects": "number",
      "criticalDefects": "number"
    },
    "safety": {
      "incidentsTotal": "number",
      "incidentsThisMonth": "number",
      "lostTimeIncidents": "number",
      "nearMisses": "number",
      "safetyScore": "number",
      "daysSinceLastIncident": "number"
    },
    "compliance": {
      "overallStatus": "COMPLIANT | NON_COMPLIANT | PENDING",
      "criticalIssues": "number",
      "pendingPermits": "number",
      "expiringCertifications": "number",
      "lastAuditDate": "ISO8601 Date",
      "nextAuditDate": "ISO8601 Date"
    },
    "risks": [
      {
        "riskId": "string",
        "description": "string",
        "probability": "LOW | MEDIUM | HIGH",
        "impact": "LOW | MEDIUM | HIGH",
        "score": "number",
        "mitigation": "string",
        "status": "OPEN | MITIGATED | CLOSED"
      }
    ],
    "issues": [
      {
        "issueId": "string",
        "description": "string",
        "priority": "LOW | MEDIUM | HIGH | CRITICAL",
        "status": "OPEN | IN_PROGRESS | RESOLVED | CLOSED",
        "raisedBy": "string",
        "raisedDate": "ISO8601 Date"
      }
    ]
  },
  "relationships": {
    "manages": ["SiteTwin"],
    "engages": ["ContractorTwin"],
    "employs": ["WorkerTwin"],
    "uses": ["EquipmentTwin"],
    "deliveredBy": ["REZBusinessCopilot"],
    "monitors": ["ComplianceChecker"]
  },
  "agents": ["ProjectManagerAgent", "CostAgent", "SafetyAgent", "ComplianceAgent"],
  "telemetry": {
    "lastSync": "ISO8601 DateTime",
    "syncInterval": "number (seconds)",
    "connectionStatus": "CONNECTED | DISCONNECTED"
  }
}
```

**JSON Schema:**
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "ProjectTwin",
  "type": "object",
  "required": ["id", "type", "attributes"],
  "properties": {
    "id": {
      "type": "string",
      "pattern": "^project-[a-zA-Z0-9]+$"
    },
    "type": {
      "type": "string",
      "const": "ProjectTwin"
    },
    "attributes": {
      "type": "object",
      "required": ["basicInfo", "cost", "schedule"],
      "properties": {
        "basicInfo": {
          "type": "object",
          "properties": {
            "projectId": { "type": "string" },
            "name": { "type": "string" },
            "status": {
              "type": "string",
              "enum": ["PLANNING", "DESIGN", "APPROVAL", "ACTIVE", "ON_HOLD", "COMPLETED", "CLOSED"]
            }
          }
        },
        "cost": {
          "type": "object",
          "properties": {
            "contractValue": { "type": "number" },
            "costToDate": { "type": "number" },
            "estimatedFinalCost": { "type": "number" },
            "costPerformanceIndex": { "type": "number" }
          }
        },
        "schedule": {
          "type": "object",
          "properties": {
            "percentComplete": { "type": "number", "minimum": 0, "maximum": 100 },
            "scheduleVariance": { "type": "number" }
          }
        }
      }
    }
  }
}
```

---

### 3.3 Site Twin

The Site Twin represents individual construction sites with real-time status, safety metrics, and resource tracking.

```json
{
  "$schema": "https://rtnm.digital/schemas/twin/v1",
  "type": "SiteTwin",
  "id": "site-{siteId}",
  "attributes": {
    "basicInfo": {
      "siteId": "string",
      "name": "string",
      "projectId": "string",
      "location": {
        "address": "string",
        "city": "string",
        "state": "string",
        "postalCode": "string",
        "coordinates": {
          "latitude": "number",
          "longitude": "number"
        }
      },
      "type": "MAIN | SUB | STAGING | YARD | CAMP | MIXING_PLANT",
      "status": "ACTIVE | INACTIVE | COMPLETED | ABANDONED"
    },
    "boundaries": {
      "totalArea": "number (sq meters)",
      "builtUpArea": "number (sq meters)",
      "fencedArea": "number (sq meters)",
      "accessibleArea": "number (sq meters)"
    },
    "access": {
      "mainEntry": {
        "location": "GeoLocation",
        "type": "GATE | RAMP | DOOR",
        "accessControl": "string"
      },
      "emergencyExits": [
        {
          "location": "GeoLocation",
          "type": "DOOR | LADDER | STAIR",
          "marked": "boolean"
        }
      ],
      "restrictedAreas": ["string"]
    },
    "utilities": {
      "power": {
        "source": "GRID | GENERATOR | SOLAR",
        "capacity": "number (kW)",
        "backupAvailable": "boolean",
        "consumption": "number (kWh/day)"
      },
      "water": {
        "source": "MUNICIPAL | BOREWELL | TANKER",
        "storageCapacity": "number (liters)",
        "dailyConsumption": "number (liters)"
      },
      "internet": {
        "type": "WIFI | WIRED | MOBILE_HOTSPOT",
        "bandwidth": "number (Mbps)"
      }
    },
    "workers": {
      "currentCount": "number",
      "maxCapacity": "number",
      "byTrade": [
        {
          "trade": "string",
          "count": "number",
          "skilled": "number",
          "supervisors": "number"
        }
      ],
      "attendance": {
        "present": "number",
        "absent": "number",
        "onLeave": "number"
      }
    },
    "equipment": {
      "onSite": [
        {
          "equipmentId": "string",
          "type": "string",
          "status": "OPERATIONAL | IDLE | MAINTENANCE | BROKEN"
        }
      ],
      "utilizationRate": "number (percentage)"
    },
    "materials": {
      "inventoryValue": "number",
      "criticalMaterials": [
        {
          "materialId": "string",
          "name": "string",
          "currentStock": "number",
          "requiredToday": "number",
          "daysOfStock": "number"
        }
      ],
      "consumptionRate": "number (average/day)"
    },
    "progress": {
      "overallComplete": "number (percentage)",
      "byPhase": [
        {
          "phase": "string",
          "percentComplete": "number",
          "status": "NOT_STARTED | IN_PROGRESS | COMPLETED"
        }
      ],
      "milestones": [
        {
          "milestoneId": "string",
          "name": "string",
          "dueDate": "ISO8601 Date",
          "actualDate": "ISO8601 Date",
          "status": "PENDING | ACHIEVED | DELAYED"
        }
      ],
      "lastUpdated": "ISO8601 DateTime"
    },
    "safety": {
      "safetyScore": "number",
      "ppeCompliance": "number (percentage)",
      "incidents": {
        "total": "number",
        "thisMonth": "number",
        "nearMisses": "number"
      },
      "hazards": [
        {
          "hazardId": "string",
          "description": "string",
          "location": "string",
          "severity": "LOW | MEDIUM | HIGH | CRITICAL",
          "status": "IDENTIFIED | MITIGATED | RESOLVED"
        }
      ],
      "lastInspection": "ISO8601 DateTime",
      "nextScheduledInspection": "ISO8601 Date"
    },
    "weather": {
      "current": {
        "temperature": "number",
        "humidity": "number",
        "windSpeed": "number",
        "conditions": "string"
      },
      "forecast": [
        {
          "date": "ISO8601 Date",
          "conditions": "string",
          "rainProbability": "number",
          "workImpact": "LOW | MEDIUM | HIGH"
        }
      ]
    },
    "security": {
      "guards": "number",
      "cameras": "number",
      "accessLogs": "number (today)",
      "restrictedAccess": "boolean"
    }
  },
  "relationships": {
    "belongsTo": "ProjectTwin",
    "contains": ["WorkerTwin"],
    "stores": ["EquipmentTwin", "Material"],
    "monitoredBy": ["SafetyAgent", "SiteAgent"]
  },
  "agents": ["SiteAgent", "SafetyAgent", "InventoryAgent"]
}
```

---

### 3.4 Contractor Twin

The Contractor Twin represents subcontractors and vendors with performance tracking, compliance monitoring, and relationship management.

```json
{
  "$schema": "https://rtnm.digital/schemas/twin/v1",
  "type": "ContractorTwin",
  "id": "contractor-{contractorId}",
  "attributes": {
    "basicInfo": {
      "contractorId": "string",
      "companyName": "string",
      "legalName": "string",
      "registrationNumber": "string",
      "gstNumber": "string",
      "pan": "string",
      "type": "PRIME | SUB | SPECIALIST | MATERIAL_SUPPLIER | EQUIPMENT_RENTAL",
      "specializations": ["string"],
      "founded": "ISO8601 Date"
    },
    "contact": {
      "primaryContact": {
        "name": "string",
        "designation": "string",
        "phone": "string",
        "email": "string"
      },
      "office": {
        "address": "Address",
        "phone": "string",
        "email": "string"
      },
      "siteOffice": {
        "address": "Address",
        "phone": "string"
      }
    },
    "financial": {
      "bankName": "string",
      "accountNumber": "string",
      "ifscCode": "string",
      "paymentTerms:": "string",
      "creditLimit": "number",
      "creditUsed": "number",
      "udhyogAadhar": "string"
    },
    "workforce": {
      "totalWorkers": "number",
      "permanent": "number",
      "contract": "number",
      "averageSkillLevel": "LOW | MEDIUM | HIGH | EXPERT",
      "supervisors": "number",
      "safetyOfficers": "number"
    },
    "equipment": {
      "owned": [
        {
          "equipmentId": "string",
          "type": "string",
          "count": "number",
          "condition": "GOOD | FAIR | POOR"
        }
      ],
      "rental": "boolean"
    },
    "certifications": [
      {
        "type": "ISO9001 | ISO14001 | ISO45001 | NABCB | CEE",
        "certificateNumber": "string",
        "issueDate": "ISO8601 Date",
        "expiryDate": "ISO8601 Date",
        "status": "VALID | EXPIRED | SUSPENDED"
      }
    ],
    "performance": {
      "overallScore": "number (0-100)",
      "qualityScore": "number",
      "scheduleAdherence": "number",
      "safetyScore": "number",
      "communicationScore": "number",
      "cooperationScore": "number"
    },
    "contracts": [
      {
        "contractId": "string",
        "projectId": "string",
        "scope": "string",
        "contractValue": "number",
        "startDate": "ISO8601 Date",
        "endDate": "ISO8601 Date",
        "status": "ACTIVE | COMPLETED | TERMINATED | ON_HOLD",
        "workCompleted": "number (percentage)",
        "paymentsReceived": "number",
        "retentionHeld": "number"
      }
    ],
    "safety": {
      "incidents": {
        "total": "number",
        "thisYear": "number",
        "fatalities": "number",
        "ltiRate": "number"
      },
      "safetyCompliance": "number (percentage)",
      "trainingRecordsUpToDate": "boolean",
      "ppeCompliance": "number (percentage)"
    },
    "compliance": {
      "laborLawCompliance": "COMPLIANT | NON_COMPLIANT | PENDING",
      "providentFund": "boolean",
      "employeeStateInsurance": "boolean",
      "bonusAct": "boolean",
      "gratuity": "boolean",
      "minimumWageCompliance": "boolean",
      "lastInspectionDate": "ISO8601 Date",
      "violations": "number"
    },
    "risk": {
      "financialRisk": "LOW | MEDIUM | HIGH",
      "performanceRisk": "LOW | MEDIUM | HIGH",
      "complianceRisk": "LOW | MEDIUM | HIGH",
      "dependencyLevel": "LOW | MEDIUM | HIGH | CRITICAL"
    },
    "relationship": {
      "since": "ISO8601 Date",
      "status": "ACTIVE | INACTIVE | ON_PROBATION | BLACKLISTED",
      "accountManager": "string",
      "rating": "number (0-5)",
      "preferredVendor": "boolean"
    }
  },
  "relationships": {
    "engagedBy": ["ProjectTwin"],
    "worksAt": ["SiteTwin"],
    "supplies": ["Material"],
    "provides": ["WorkerTwin", "EquipmentTwin"],
    "evaluatedBy": ["ComplianceAgent", "ProjectManagerAgent"]
  },
  "agents": ["ContractorAgent", "ComplianceAgent", "PaymentAgent"]
}
```

---

### 3.5 Worker Twin

The Worker Twin represents construction workers with skill profiles, certification tracking, safety records, and productivity metrics.

```json
{
  "$schema": "https://rtnm.digital/schemas/twin/v1",
  "type": "WorkerTwin",
  "id": "worker-{workerId}",
  "attributes": {
    "basicInfo": {
      "workerId": "string",
      "name": "string",
      "fatherName": "string",
      "dateOfBirth": "ISO8601 Date",
      "gender": "MALE | FEMALE | OTHER",
      "phone": "string",
      "emergencyContact": {
        "name": "string",
        "phone": "string",
        "relationship": "string"
      },
      "photo": "string (URL)",
      "bloodGroup": "string"
    },
    "identification": {
      "aadharNumber": "string (hashed)",
      "pan": "string (hashed)",
      "voterId": "string (hashed)",
      "bankAccount": "string (hashed)",
      "photoId": "string"
    },
    "employment": {
      "workerType": "PERMANENT | CONTRACT | DAILY_WAGER | APPRENTICE",
      "employer": "string (contractor or company)",
      "designation": "string",
      "dateOfJoining": "ISO8601 Date",
      "employeeCode": "string",
      "uan": "string",
      "epfNumber": "string",
      "esiNumber": "string"
    },
    "skills": [
      {
        "trade": "CARPENTER | MASON | PLUMBER | ELECTRICIAN | STEEL_FIXER | PAINTER | WELDER | CRANE_OPERATOR | EXCAVATOR_OPERATOR | SURVEYOR | Scaffolder | FITTER | MECHANIC",
        "experience": "number (years)",
        "proficiency": "BASIC | INTERMEDIATE | ADVANCED | EXPERT",
        "certifications": ["string"],
        "lastSkillAssessment": "ISO8601 Date"
      }
    ],
    "certifications": [
      {
        "certId": "string",
        "type": "SAFETY_TRAINING | TRADE_LICENSE | VEHICLE_LICENSE | HEIGHT_WORK | CRANE_CERTIFICATION | FORKLIFT | CONFINED_SPACE | FIRST_AID",
        "issueDate": "ISO8601 Date",
        "expiryDate": "ISO8601 Date",
        "issuingAuthority": "string",
        "certificateNumber": "string",
        "status": "VALID | EXPIRED | SUSPENDED",
        "verificationUrl": "string"
      }
    ],
    "safety": {
      "safetyTraining": {
        "basicSafety": {
          "completed": "boolean",
          "lastTraining": "ISO8601 Date",
          "nextDue": "ISO8601 Date"
        },
        "specificTrainings": [
          {
            "training": "string",
            "completed": "boolean",
            "lastTraining": "ISO8601 Date",
            "nextDue": "ISO8601 Date"
          }
        ]
      },
      "ppeCompliance": {
        "helmet": "boolean",
        "safetyVest": "boolean",
        "safetyBoots": "boolean",
        "gloves": "boolean",
        "goggles": "boolean",
        "overallCompliance": "number (percentage)"
      },
      "incidents": {
        "total": "number",
        "thisYear": "number",
        "nearMisses": "number",
        "lti": "number"
      },
      "medicalClearance": {
        "fitnessCertificate": "boolean",
        "lastMedicalCheckup": "ISO8601 Date",
        "nextDue": "ISO8601 Date"
      }
    },
    "productivity": {
      "averageOutput": "number",
      "qualityScore": "number",
      "attendanceRate": "number (percentage)",
      "overtimeHours": "number",
      "utilizationRate": "number (percentage)",
      "earnings": {
        "thisMonth": "number",
        "lastMonth": "number",
        "overtimeEarnings": "number"
      }
    },
    "currentAssignment": {
      "projectId": "string",
      "projectName": "string",
      "siteId": "string",
      "siteName": "string",
      "contractor": "string",
      "deployedDate": "ISO8601 Date",
      "expectedEndDate": "ISO8601 Date"
    },
    "location": {
      "currentSite": "string",
      "lastCheckIn": "ISO8601 DateTime",
      "lastCheckOut": "ISO8601 DateTime",
      "status": "ON_SITE | OFF_SITE | ON_LEAVE | ABSENT"
    }
  },
  "relationships": {
    "deployedBy": ["ContractorTwin"],
    "assignedTo": ["SiteTwin"],
    "employedBy": "ProjectTwin",
    "managedBy": ["WorkerAgent", "SafetyAgent"]
  },
  "agents": ["WorkerAgent", "SafetyAgent", "ComplianceAgent", "PayrollAgent"]
}
```

---

### 3.6 Equipment Twin

The Equipment Twin represents construction equipment with real-time status, maintenance tracking, and utilization monitoring.

```json
{
  "$schema": "https://rtnm.digital/schemas/twin/v1",
  "type": "EquipmentTwin",
  "id": "equipment-{equipmentId}",
  "attributes": {
    "basicInfo": {
      "equipmentId": "string",
      "assetCode": "string",
      "name": "string",
      "type": "CRANE | EXCAVATOR | BULLDOZER | DUMPER | CONCRETE_MIXER | PUMP | COMPACTOR | ROAD_ROLLER | FORKLIFT | TRUCK | HOIST | SCAFFOLDING | FORMWORK | REBAR_CUTTER | WELDING_MACHINE",
      "category": "HEAVY | MEDIUM | LIGHT | TOOLS",
      "manufacturer": "string",
      "model": "string",
      "serialNumber": "string",
      "yearOfManufacture": "number",
      "status": "ACTIVE | IDLE | MAINTENANCE | BROKEN | RETIRED"
    },
    "ownership": {
      "type": "OWNED | RENTED | LEASED | SUB-CONTRACTOR",
      "ownerId": "string",
      "ownerName": "string",
      "purchaseDate": "ISO8601 Date",
      "purchaseCost": "number",
      "currentValue": "number",
      "depreciationRate": "number (percentage)"
    },
    "specifications": {
      "capacity": "string",
      "power": "string",
      "fuelType": "DIESEL | PETROL | ELECTRIC | HYBRID",
      "fuelCapacity": "number (liters)",
      "dimensions": {
        "length": "number",
        "width": "number",
        "height": "number",
        "weight": "number"
      },
      "operatingWeight": "number (tonnes)",
      "groundClearance": "number (mm)"
    },
    "location": {
      "projectId": "string",
      "siteId": "string",
      "currentPosition": {
        "latitude": "number",
        "longitude": "number"
      },
      "zone": "string",
      "lastLocationUpdate": "ISO8601 DateTime"
    },
    "utilization": {
      "totalHours": "number",
      "operatingHours": "number",
      "idleHours": "number",
      "maintenanceHours": "number",
      "utilizationRate": "number (percentage)",
      "thisMonthHours": "number",
      "avgDailyHours": "number"
    },
    "fuel": {
      "currentLevel": "number (percentage)",
      "avgConsumption": "number (liters/hour)",
      "lastRefuel": "ISO8601 Date",
      "estimatedRemaining": "number (hours)",
      "totalSpentThisMonth": "number"
    },
    "operator": {
      "assignedOperator": "WorkerTwin",
      "operatorLicense": "string",
      "licenseExpiry": "ISO8601 Date"
    },
    "telemetry": {
      "engineHours": "number",
      "engineTemp": "number (C)",
      "oilPressure": "number (PSI)",
      "batteryVoltage": "number",
      "hydraulicPressure": "number (PSI)",
      "loadPercentage": "number (percentage)",
      "lastUpdated": "ISO8601 DateTime"
    },
    "maintenance": {
      "condition": "EXCELLENT | GOOD | FAIR | POOR",
      "lastServiceDate": "ISO8601 Date",
      "nextServiceDue": "ISO8601 Date",
      "nextServiceHours": "number",
      "serviceInterval": "number (hours)",
      "serviceHistory": [
        {
          "serviceDate": "ISO8601 Date",
          "type": "ROUTINE | REPAIR | OVERHAUL",
          "description": "string",
          "cost": "number",
          "vendor": "string"
        }
      ],
      "totalMaintenanceCost": "number",
      "ytdMaintenanceCost": "number"
    },
    "oee": {
      "availability": "number (percentage)",
      "performance": "number (percentage)",
      "quality": "number (percentage)",
      "overall": "number (percentage)",
      "target": "number (percentage)"
    },
    "safety": {
      "lastInspection": "ISO8601 Date",
      "nextInspection": "ISO8601 Date",
      "loadTestCertificate": "boolean",
      "insuranceExpiry": "ISO8601 Date",
      "pollutionCertificate": "boolean",
      "fitnessCertificate": "boolean"
    },
    "alerts": [
      {
        "alertId": "string",
        "type": "MAINTENANCE_DUE | FUEL_LOW | OVERLOAD | HOURS_EXCEEDED | SAFETY_FLAG",
        "severity": "INFO | WARNING | CRITICAL",
        "message": "string",
        "timestamp": "ISO8601 DateTime",
        "acknowledged": "boolean"
      }
    ],
    "predictions": {
      "failureProbability": "number (0-1)",
      "remainingUsefulLife": "number (hours)",
      "nextMaintenanceDate": "ISO8601 Date",
      "predictedBreakdown": "ISO8601 Date",
      "modelConfidence": "number (0-1)"
    }
  },
  "relationships": {
    "ownedBy": ["ContractorTwin", "ProjectTwin"],
    "deployedAt": ["SiteTwin"],
    "operatedBy": ["WorkerTwin"],
    "monitoredBy": ["EquipmentAgent", "MaintenanceAgent", "SafetyAgent"]
  },
  "agents": ["EquipmentAgent", "MaintenanceAgent", "SafetyAgent", "CostAgent"]
}
```

---

## 4. Integration Flows

### 4.1 Core Integration: REZ Business Copilot ↔ Project Twin

This is the primary integration enabling AI-powered project management and decision support.

```
┌────────────────────────────────┐     ┌──────────────────────────────────────────┐
│   REZ Business Copilot         │     │              TWINOS LAYER                │
│       (4022)                   │     │                                        │
│                                │     │  ┌─────────────────────────────────┐  │
│  ┌────────────────────────┐     │     │  │         Twin Hub (5250)         │  │
│  │  Natural Language     │──────┼─────┼─│                                 │  │
│  │  Query Processing     │     │     │  │  • State synchronization        │  │
│  └────────────────────────┘     │     │  │  • Query routing               │  │
│                                │     │  │  • Relationship updates         │  │
│  ┌────────────────────────┐     │     │  │  • Alert generation            │  │
│  │  AI Insights &         │──────┼─────┼─│                                 │  │
│  │  Recommendations       │     │     │  └─────────────────────────────────┘  │
│  └────────────────────────┘     │     │           │       │       │       │      │
│                                │     │     ┌─────┘       │       └─────┐      │
│  ┌────────────────────────┐     │     │     │             │             │      │
│  │  Cost Forecasting      │──────┼─────┼───│             │             │      │
│  └────────────────────────┘     │     │     │             │             │      │
│                                │     │     ▼             ▼             ▼      │
│  ┌────────────────────────┐     │     │  ┌────────┐  ┌────────┐  ┌────────┐ │
│  │  Risk Analysis         │──────┼─────┼──│Project │  │  Site  │  │Contract│ │
│  └────────────────────────┘     │     │  │  Twin  │  │  Twin  │  │  Twin  │ │
└────────────────────────────────┘     │  └────────┘  └────────┘  └────────┘ │
                                      │                                         │
                                      │  ┌────────┐  ┌────────┐               │
                                      │  │Worker  │  │Equipment│               │
                                      │  │  Twin  │  │  Twin   │               │
                                      │  └────────┘  └────────┘               │
                                      └──────────────────────────────────────────┘
```

**Integration Event Types:**

```typescript
// Project Update Event
interface ProjectUpdateEvent {
  eventType: 'PROJECT_UPDATED';
  timestamp: string;
  payload: {
    projectId: string;
    changes: {
      field: string;
      oldValue: any;
      newValue: any;
    }[];
    source: 'REZ POS' | 'REZ Staff' | 'REZ Inventory' | 'Manual';
  };
  copilotActions: {
    updateInsights: boolean;
    recalculateForecasts: boolean;
    checkAlerts: boolean;
  };
}

// Cost Change Event
interface CostChangeEvent {
  eventType: 'COST_CHANGED';
  timestamp: string;
  payload: {
    projectId: string;
    costCode: string;
    changeType: 'INVOICE' | 'MATERIAL' | 'LABOR' | 'EQUIPMENT' | 'ADJUSTMENT';
    amount: number;
    description: string;
    vendor?: string;
  };
  copilotActions: {
    updateForecast: boolean;
    checkBudgetVariance: boolean;
    alertIfThreshold: boolean;
  };
}

// Schedule Change Event
interface ScheduleChangeEvent {
  eventType: 'SCHEDULE_CHANGED';
  timestamp: string;
  payload: {
    projectId: string;
    milestoneId?: string;
    changeType: 'START' | 'COMPLETE' | 'DELAY' | 'EXTENSION';
    originalDate: string;
    newDate: string;
    reason: string;
    impactDays: number;
  };
  copilotActions: {
    updateForecast: boolean;
    notifyStakeholders: boolean;
    adjustResourcePlan: boolean;
  };
}

// Safety Incident Event
interface SafetyIncidentEvent {
  eventType: 'SAFETY_INCIDENT';
  timestamp: string;
  payload: {
    projectId: string;
    siteId: string;
    incidentType: 'INJURY' | 'NEAR_MISS' | 'PROPERTY_DAMAGE' | 'HAZARD';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
    workersInvolved: string[];
    equipmentAffected?: string[];
  };
  copilotActions: {
    createAlert: boolean;
    notifySafetyTeam: boolean;
    updateRiskScore: boolean;
    triggerRootCauseAnalysis: boolean;
  };
}

// Resource Event
interface ResourceEvent {
  eventType: 'RESOURCE_CHANGED';
  timestamp: string;
  payload: {
    projectId: string;
    resourceType: 'WORKER' | 'EQUIPMENT' | 'MATERIAL';
    resourceId: string;
    changeType: 'DEPLOYED' | 'REMOVED' | 'SHIFTED';
    fromSite?: string;
    toSite?: string;
    effectiveDate: string;
  };
  copilotActions: {
    updateUtilization: boolean;
    adjustSchedule: boolean;
    alertIfShortage: boolean;
  };
}
```

**Copilot API Integration:**

```yaml
# Business Copilot Query Integration
POST /api/v1/copilot/query:
  description: Process natural language query against Project Twin
  body:
    query: string
    projectId?: string
    context:
      userRole: string
      preferredLanguage: string
  response:
    intent: string
    entities: object
    answer: string
    data: object
    visualizations: Visualization[]
    actions: Action[]
    confidence: number

POST /api/v1/copilot/insights:
  description: Generate AI insights for project
  body:
    projectId: string
    insightTypes: ['COST' | 'SCHEDULE' | 'RISK' | 'RESOURCE' | 'SAFETY' | 'COMPLIANCE']
    timeframe: string
  response:
    insights: Insight[]
    recommendations: Recommendation[]
    alerts: Alert[]

GET /api/v1/copilot/forecast/{projectId}:
  description: Cost and timeline forecasting
  response:
    finalCostEstimate: number
    finalCostRange: { min: number, max: number }
    completionDateEstimate: string
    completionDateRange: { earliest: string, latest: string }
    confidence: number
    scenarios: ForecastScenario[]

GET /api/v1/copilot/risk/{projectId}:
  description: Risk analysis and mitigation
  response:
    risks: Risk[]
    overallRiskScore: number
    riskTrend: string
    mitigations: Mitigation[]
```

---

### 4.2 Worker-Project Integration Flow

```
┌─────────────────────┐     ┌─────────────────────┐     ┌────────────────────┐
│    REZ Staff        │     │    Site Twin        │     │   Project Twin     │
│      (4015)         │     │      (5250)         │     │      (5250)        │
│                     │     │                     │     │                    │
│  ┌────────────────┐ │     │  ┌──────────────┐  │     │  ┌──────────────┐  │
│  │  Worker        │─┼────▶│  │  Workforce   │  │     │  │  Resource     │  │
│  │  Deployed      │ │     │  │  Tracking    │  │     │  │  Allocation   │  │
│  └────────────────┘ │     │  └──────┬───────┘  │     │  └───────┬──────┘  │
│                      │     │         │          │     │          │         │
│  ┌────────────────┐ │     │         ▼          │     │          ▼         │
│  │  Attendance   │─┼────▶│  ┌──────────────┐  │     │  ┌──────────────┐  │
│  │  Recorded     │ │     │  │  Daily Head   │  │     │  │  Labor Cost   │  │
│  └────────────────┘ │     │  │  Count       │  │     │  │  Tracking     │  │
│                      │     │  └──────┬───────┘  │     │  └───────┬──────┘  │
│  ┌────────────────┐ │     │         │          │     │          │         │
│  │  Skills        │─┼────▶│         ▼          │     │          ▼         │
│  │  Updated       │ │     │  ┌──────────────┐  │     │  ┌──────────────┐  │
│  └────────────────┘ │     │  │  Skill Mix   │  │     │  │  Productivity│  │
│                      │     │  │  Analysis    │  │     │  │  Analytics   │  │
│  ┌────────────────┐ │     │  └──────────────┘  │     │  └──────────────┘  │
│  │  Certification │─┼────▶│                     │     │                    │
│  │  Added         │ │     │                     │     │                    │
│  └────────────────┘ │     └─────────────────────┘     └────────────────────┘
```

---

### 4.3 Material-Site Integration Flow

```
┌─────────────────────┐     ┌─────────────────────┐     ┌────────────────────┐
│  REZ Inventory      │     │    Site Twin        │     │  Project Twin      │
│      (4010)         │     │      (5250)         │     │      (5250)        │
│                     │     │                     │     │                    │
│  ┌────────────────┐ │     │  ┌──────────────┐  │     │  ┌──────────────┐  │
│  │  Material       │─┼────▶│  │  Stock       │  │     │  │  Material     │  │
│  │  Delivered      │ │     │  │  Updates     │  │     │  │  Cost         │  │
│  └────────────────┘ │     │  └──────┬───────┘  │     │  └───────┬──────┘  │
│                      │     │         │          │     │          │         │
│  ┌────────────────┐ │     │         ▼          │     │          ▼         │
│  │  Requisition   │─┼────▶│  ┌──────────────┐  │     │  ┌──────────────┐  │
│  │  Approved      │ │     │  │  Allocation   │  │     │  │  Budget       │  │
│  └────────────────┘ │     │  │  Processing   │  │     │  │  Variance     │  │
│                      │     │  └──────┬───────┘  │     │  └──────────────┘  │
│  ┌────────────────┐ │     │         │          │     │                    │
│  │  Consumption   │─┼────▶│         ▼          │     │                    │
│  │  Recorded      │ │     │  ┌──────────────┐  │     │                    │
│  └────────────────┘ │     │  │  Usage vs     │  │     │                    │
│                      │     │  │  Plan        │  │     │                    │
│  ┌────────────────┐ │     │  └──────────────┘  │     │                    │
│  │  Low Stock     │─┼────▶│                     │     │                    │
│  │  Alert         │ │     │                     │     │                    │
│  └────────────────┘ │     │                     │     │                    │
└─────────────────────┘     └─────────────────────┘     └────────────────────┘
```

---

### 4.4 Equipment Monitoring Integration Flow

```
┌─────────────────────┐     ┌─────────────────────┐     ┌────────────────────┐
│  IoT Sensors        │     │  Equipment Twin     │     │  Project Twin      │
│  (On Equipment)     │     │      (5250)         │     │      (5250)        │
│                     │     │                     │     │                    │
│  ┌────────────────┐ │     │  ┌──────────────┐  │     │  ┌──────────────┐  │
│  │  Telemetry     │─┼────▶│  │  Real-time   │  │     │  │  Equipment    │  │
│  │  Data          │ │     │  │  Status      │  │     │  │  Cost         │  │
│  └────────────────┘ │     │  └──────┬───────┘  │     │  └───────┬──────┘  │
│                      │     │         │          │     │          │         │
│  ┌────────────────┐ │     │         ▼          │     │          ▼         │
│  │  Location      │─┼────▶│  ┌──────────────┐  │     │  ┌──────────────┐  │
│  │  Updates       │ │     │  │  GPS         │  │     │  │  Utilization  │  │
│  └────────────────┘ │     │  │  Tracking    │  │     │  │  Analysis     │  │
│                      │     │  └──────┬───────┘  │     │  └──────────────┘  │
│  ┌────────────────┐ │     │         │          │     │                    │
│  │  Fault Code    │─┼────▶│         ▼          │     │                    │
│  │  Detected      │ │     │  ┌──────────────┐  │     │                    │
│  └────────────────┘ │     │  │  Predictive   │  │     │                    │
│                      │     │  │  Maintenance  │  │     │                    │
│  ┌────────────────┐ │     │  └──────────────┘  │     │                    │
│  │  Hours         │─┼────▶│                     │     │                    │
│  │  Exceeded      │ │     │                     │     │                    │
│  └────────────────┘ │     │                     │     │                    │
└─────────────────────┘     └─────────────────────┘     └────────────────────┘
```

---

## 5. Agent Architecture

### 5.1 Agent Overview

AI agents manage digital twins and orchestrate construction operations with autonomous decision-making capabilities.

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              AGENT LAYER                                              │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                       │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │                       PROJECT MANAGER AGENT                                     │  │
│  │  Twins Managed: ProjectTwin (primary)                                           │  │
│  │  Primary Role: Overall project oversight, stakeholder communication             │  │
│  │  Skills: Project Planning, Stakeholder Management, Executive Reporting           │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                       │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐        │
│  │   SITE        │  │   SAFETY     │  │    COST      │  │  COMPLIANCE   │        │
│  │   AGENT       │  │    AGENT     │  │    AGENT     │  │    AGENT      │        │
│  │               │  │               │  │               │  │               │        │
│  │ Twins:        │  │ Twins:        │  │ Twins:        │  │ Twins:        │        │
│  │ • SiteTwin    │  │ • SiteTwin   │  │ • ProjectTwin│  │ • ProjectTwin │        │
│  │ • WorkerTwin  │  │ • WorkerTwin │  │ • SiteTwin   │  │ • ContractorTwin│        │
│  │ • EquipmentTwin│ │ • EquipmentTwin│ │ • EquipmentTwin│ │ • WorkerTwin  │        │
│  │               │  │               │  │               │  │               │        │
│  │ Skills:       │  │ Skills:       │  │ Skills:       │  │ Skills:       │        │
│  │ • Progress   │  │ • Incident   │  │ • Forecasting │  │ • Permit Mgmt │        │
│  │   Tracking   │  │   Response   │  │ • Budget Ctrl │  │ • Audit Prep  │        │
│  │ • Resource   │  │ • Hazard     │  │ • Variance    │  │ • Regulatory  │        │
│  │   Allocation │  │   Detection  │  │   Analysis    │  │   Updates     │        │
│  └───────────────┘  └───────────────┘  └───────────────┘  └───────────────┘        │
│                                                                                       │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐        │
│  │  CONTRACTOR   │  │   WORKER     │  │  EQUIPMENT   │  │  INVENTORY    │        │
│  │    AGENT      │  │    AGENT     │  │    AGENT     │  │    AGENT      │        │
│  │               │  │               │  │               │  │               │        │
│  │ Twins:        │  │ Twins:        │  │ Twins:        │  │ Twins:        │        │
│  │ • ContractorTwin│ │ • WorkerTwin │ │ • EquipmentTwin│ │ • SiteTwin   │        │
│  │ • ProjectTwin │  │ • SiteTwin   │  │ • SiteTwin   │  │ • ProjectTwin │        │
│  │ • SiteTwin    │  │               │  │               │  │               │        │
│  │               │  │ Skills:       │  │ Skills:       │  │ Skills:       │        │
│  │ Skills:       │  │ • Skill      │  │ • Predictive  │  │ • Reorder     │        │
│  │ • Performance│  │   Matching   │  │   Maintenance │  │   Alerts      │        │
│  │   Tracking   │  │ • Deployment │  │ • Utilization │  │ • Consumption │        │
│  │ • Payment    │  │ • Attendance │  │ • Fuel Mgmt   │  │   Tracking    │        │
│  │   Processing │  │   Tracking   │  │               │  │               │        │
│  └───────────────┘  └───────────────┘  └───────────────┘  └───────────────┘        │
│                                                                                       │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Agent Specifications

#### 5.2.1 Project Manager Agent

```json
{
  "agentId": "project-manager-agent-{projectId}",
  "name": "Project Manager Agent",
  "type": "STRATEGIC",
  "managedTwins": [
    "ProjectTwin:{projectId}",
    "SiteTwin:*",
    "ContractorTwin:engagedBy:{projectId}"
  ],
  "role": "Overall project oversight, coordination, and stakeholder communication",
  "capabilities": {
    "progressTracking": {
      "description": "Monitor and report project progress across all sites",
      "inputs": ["siteProgress", "milestoneStatus", "resourceAllocation"],
      "outputs": ["progressReports", "delayAlerts", "recoveryPlans"],
      "autonomy": "AUTONOMOUS"
    },
    "stakeholderCommunication": {
      "description": "Generate and distribute stakeholder updates",
      "inputs": ["projectStatus", "metrics", "pendingApprovals"],
      "outputs": ["executiveSummaries", "clientReports", "boardUpdates"],
      "autonomy": "COORDINATES"
    },
    "riskEscalation": {
      "description": "Identify and escalate critical project risks",
      "inputs": ["riskRegisters", "trendData", "stakeholderInputs"],
      "outputs": ["riskAlerts", "escalationReports", "mitigationPlans"],
      "autonomy": "AUTONOMOUS"
    },
    "decisionSupport": {
      "description": "Provide data-driven recommendations for project decisions",
      "inputs": ["projectData", "historicalProjects", "constraints"],
      "outputs": ["recommendations", "scenarioAnalysis", "impactAssessments"],
      "autonomy": "RECOMMENDS_ONLY"
    }
  },
  "skills": [
    {
      "skillId": "construction-pm-v2",
      "name": "Project Management",
      "version": "2.0",
      "confidence": 0.92,
      "lastUsed": "ISO8601 DateTime"
    },
    {
      "skillId": "construction-reporting-v1",
      "name": "Stakeholder Reporting",
      "version": "1.0",
      "confidence": 0.88,
      "lastUsed": "ISO8601 DateTime"
    }
  ],
  "decisionThresholds": {
    "escalateRisk": {
      "threshold": "probability > 60% AND impact > HIGH",
      "type": "ALWAYS_ESCALATE"
    },
    "delayAlert": {
      "threshold": "scheduleVariance > 5 days",
      "type": "AUTOMATIC"
    },
    "budgetAlert": {
      "threshold": "costVariance > 5%",
      "type": "AUTOMATIC"
    }
  },
  "notifications": {
    "onCriticalRisk": ["ProjectStakeholder"],
    "onMilestoneMissed": ["Client"],
    "onBudgetExceeded": ["Finance"],
    "onSafetyIncident": ["SafetyOfficer", "Client"]
  }
}
```

#### 5.2.2 Safety Agent

```json
{
  "agentId": "safety-agent-{projectId}",
  "name": "Safety Agent",
  "type": "OPERATIONAL",
  "managedTwins": [
    "SiteTwin:*",
    "WorkerTwin:*",
    "EquipmentTwin:*"
  ],
  "role": "Monitor and ensure construction site safety compliance",
  "capabilities": {
    "incidentResponse": {
      "description": "Coordinate emergency response for safety incidents",
      "inputs": ["incidentData", "siteLayout", "emergencyContacts"],
      "outputs": ["responsePlan", "notifications", "evacuationRoutes"],
      "autonomy": "COORDINATES"
    },
    "hazardDetection": {
      "description": "Identify potential hazards through site monitoring",
      "inputs": ["siteData", "workerReports", "equipmentStatus"],
      "outputs": ["hazardAlerts", "riskAssessments", "mitigationActions"],
      "autonomy": "AUTONOMOUS"
    },
    "ppeCompliance": {
      "description": "Monitor personal protective equipment compliance",
      "inputs": ["siteCamera", "workerProfiles", "ppeRequirements"],
      "outputs": ["complianceReports", "violationAlerts", "trainingReminders"],
      "autonomy": "AUTONOMOUS"
    },
    "trainingTracking": {
      "description": "Ensure safety training compliance for all workers",
      "inputs": ["workerCertifications", "trainingSchedules"],
      "outputs": ["trainingReminders", "complianceReports", "certExpiryAlerts"],
      "autonomy": "AUTONOMOUS"
    }
  },
  "skills": [
    {
      "skillId": "safety-osha-v2",
      "name": "OSHA Compliance",
      "version": "2.0",
      "confidence": 0.95,
      "lastUsed": "ISO8601 DateTime"
    },
    {
      "skillId": "safety-incident-response-v1",
      "name": "Incident Response",
      "version": "1.0",
      "confidence": 0.92,
      "lastUsed": "ISO8601 DateTime"
    }
  ],
  "decisionThresholds": {
    "emergencyStop": {
      "threshold": "any CRITICAL incident",
      "type": "ALWAYS_TRIGGER"
    },
    "ppeViolation": {
      "threshold": "compliance < 90%",
      "type": "AUTOMATIC_ALERT"
    },
    "trainingOverdue": {
      "threshold": "any certification expired",
      "type": "REMOVE_FROM_SITE"
    }
  },
  "notifications": {
    "onCriticalIncident": ["ProjectManager", "SafetyOfficer", "Regulator"],
    "onHazardIdentified": ["SiteSupervisor"],
    "onTrainingDue": ["Worker", "Contractor"],
    "onPPEViolation": ["SiteSupervisor"]
  }
}
```

#### 5.2.3 Cost Agent

```json
{
  "agentId": "cost-agent-{projectId}",
  "name": "Cost Agent",
  "type": "FINANCIAL",
  "managedTwins": [
    "ProjectTwin:{projectId}",
    "SiteTwin:*",
    "ContractorTwin:*",
    "EquipmentTwin:*"
  ],
  "role": "Monitor and control project costs, provide forecasting",
  "capabilities": {
    "costTracking": {
      "description": "Track costs across all categories in real-time",
      "inputs": ["invoices", "materialCosts", "laborCosts", "equipmentCosts"],
      "outputs": ["costReports", "varianceAnalysis", "categoryBreakdown"],
      "autonomy": "AUTONOMOUS"
    },
    "forecasting": {
      "description": "Predict final project cost based on current trends",
      "inputs": ["costToDate", "progressRate", "historicalProjects"],
      "outputs": ["forecastEstimate", "confidenceRange", "riskScenarios"],
      "autonomy": "AUTONOMOUS"
    },
    "budgetControl": {
      "description": "Monitor budget utilization and alert on overruns",
      "inputs": ["budgets", "actuals", "commitments"],
      "outputs": ["varianceAlerts", "reallocationRecommendations"],
      "autonomy": "ALERT_ONLY"
    },
    "invoiceProcessing": {
      "description": "Validate and process contractor invoices",
      "inputs": ["invoices", "workCompletion", "retentionRules"],
      "outputs": ["paymentRecommendations", "disputeFlags"],
      "autonomy": "COORDINATES"
    }
  },
  "skills": [
    {
      "skillId": "construction-cost-v2",
      "name": "Construction Costing",
      "version": "2.0",
      "confidence": 0.94,
      "lastUsed": "ISO8601 DateTime"
    },
    {
      "skillId": "construction-forecasting-v1",
      "name": "Cost Forecasting",
      "version": "1.0",
      "confidence": 0.89,
      "lastUsed": "ISO8601 DateTime"
    }
  ],
  "decisionThresholds": {
    "costOverrunAlert": {
      "threshold": "costVariance > 3%",
      "type": "AUTOMATIC"
    },
    "paymentApproval": {
      "threshold": "amount < 500000 AND within budget",
      "type": "AUTOMATIC"
    },
    "escalateOverrun": {
      "threshold": "costVariance > 10%",
      "type": "ESCALATE"
    }
  },
  "notifications": {
    "onBudgetExceeded": ["ProjectManager", "Finance"],
    "onPaymentDue": ["Finance"],
    "onForecastUpdate": ["ProjectManager"],
    "onCostSaving": ["ProjectManager"]
  }
}
```

#### 5.2.4 Contractor Agent

```json
{
  "agentId": "contractor-agent-{projectId}",
  "name": "Contractor Agent",
  "type": "OPERATIONAL",
  "managedTwins": [
    "ContractorTwin:*",
    "WorkerTwin:deployedBy:*",
    "SiteTwin:*"
  ],
  "role": "Manage contractor relationships, performance, and payments",
  "capabilities": {
    "performanceTracking": {
      "description": "Monitor and score contractor performance",
      "inputs": ["workQuality", "scheduleAdherence", "safetyRecord"],
      "outputs": ["performanceScores", "rankings", "improvementPlans"],
      "autonomy": "AUTONOMOUS"
    },
    "paymentProcessing": {
      "description": "Process contractor payments based on work progress",
      "inputs": ["invoices", "workCompletion", "retentionPolicy"],
      "outputs": ["paymentRecommendations", "retentionCalculations"],
      "autonomy": "COORDINATES"
    },
    "complianceMonitoring": {
      "description": "Ensure contractor compliance with labor laws and regulations",
      "inputs": ["laborRecords", "certifications", "complianceChecklist"],
      "outputs": ["complianceStatus", "violationAlerts", "remediationPlans"],
      "autonomy": "AUTONOMOUS"
    },
    "resourceMatching": {
      "description": "Match available contractors to project requirements",
      "inputs": ["projectRequirements", "contractorCapabilities", "performanceHistory"],
      "outputs": ["matchingScores", "recommendations", "shortlists"],
      "autonomy": "RECOMMENDS_ONLY"
    }
  },
  "skills": [
    {
      "skillId": "contractor-mgmt-v1",
      "name": "Contractor Management",
      "version": "1.0",
      "confidence": 0.87,
      "lastUsed": "ISO8601 DateTime"
    },
    {
      "skillId": "labor-compliance-v2",
      "name": "Labor Compliance",
      "version": "2.0",
      "confidence": 0.91,
      "lastUsed": "ISO8601 DateTime"
    }
  ],
  "decisionThresholds": {
    "blacklistContractor": {
      "threshold": "performanceScore < 40% OR major safety violation",
      "type": "ALWAYS_RECOMMEND"
    },
    "preferredStatus": {
      "threshold": "performanceScore > 90% AND 3+ successful projects",
      "type": "AUTOMATIC"
    },
    "complianceHold": {
      "threshold": "major compliance violation",
      "type": "AUTOMATIC"
    }
  },
  "notifications": {
    "onPoorPerformance": ["ProjectManager"],
    "onComplianceIssue": ["ComplianceAgent"],
    "onPaymentDue": ["Contractor"],
    "onContractExpiring": ["ProjectManager"]
  }
}
```

#### 5.2.5 Equipment Agent

```json
{
  "agentId": "equipment-agent-{projectId}",
  "name": "Equipment Agent",
  "type": "OPERATIONAL",
  "managedTwins": [
    "EquipmentTwin:*",
    "SiteTwin:*"
  ],
  "role": "Manage equipment deployment, utilization, and maintenance",
  "capabilities": {
    "predictiveMaintenance": {
      "description": "Predict equipment failures and schedule maintenance",
      "inputs": ["telemetryData", "maintenanceHistory", "operatingHours"],
      "outputs": ["maintenanceSchedule", "failurePredictions", "partsRequired"],
      "autonomy": "AUTONOMOUS"
    },
    "utilizationOptimization": {
      "description": "Maximize equipment utilization across sites",
      "inputs": ["equipmentStatus", "siteRequirements", "transferCosts"],
      "outputs": ["reallocationRecommendations", "utilizationReport"],
      "autonomy": "COORDINATES"
    },
    "fuelManagement": {
      "description": "Monitor and optimize fuel consumption",
      "inputs": ["fuelLevels", "consumptionRates", "fuelCosts"],
      "outputs": ["fuelAlerts", "consumptionReports", "efficiencyScores"],
      "autonomy": "AUTONOMOUS"
    },
    "operatorManagement": {
      "description": "Match operators with equipment and track assignments",
      "inputs": ["operatorSkills", "equipmentRequirements", "availability"],
      "outputs": ["assignments", "licenseAlerts", "trainingNeeds"],
      "autonomy": "AUTONOMOUS"
    }
  },
  "skills": [
    {
      "skillId": "equipment-maintenance-v2",
      "name": "Equipment Maintenance",
      "version": "2.0",
      "confidence": 0.93,
      "lastUsed": "ISO8601 DateTime"
    },
    {
      "skillId": "equipment-utilization-v1",
      "name": "Utilization Analysis",
      "version": "1.0",
      "confidence": 0.88,
      "lastUsed": "ISO8601 DateTime"
    }
  ],
  "decisionThresholds": {
    "scheduleMaintenance": {
      "threshold": "probability > 70% OR hours exceeded",
      "type": "AUTOMATIC"
    },
    "emergencyShutdown": {
      "threshold": "critical fault detected",
      "type": "ALWAYS_TRIGGER"
    },
    "transferEquipment": {
      "threshold": "utilization < 40% for 5+ days AND another site needs",
      "type": "RECOMMEND"
    }
  },
  "notifications": {
    "onMaintenanceDue": ["SiteSupervisor", "MaintenanceTeam"],
    "onBreakdown": ["SiteSupervisor", "ProjectManager"],
    "onLowFuel": ["EquipmentOperator"],
    "onUtilizationLow": ["ProjectManager"]
  }
}
```

---

## 6. Business Copilot Integration

### 6.1 Natural Language Query Capabilities

The Business Copilot provides construction executives and managers with natural language access to project data, insights, and actions.

```typescript
// Construction Query Intent Definitions
interface ConstructionQueries {
  // Project Status Queries
  "What's the current status of Project ABC?": {
    intent: 'PROJECT_STATUS',
    response: {
      overallProgress: number;
      scheduleStatus: 'ON_TRACK' | 'AHEAD' | 'BEHIND';
      costStatus: 'WITHIN_BUDGET' | 'OVER_BUDGET';
      keyMetrics: Metric[];
      issues: Issue[];
    }
  },
  "Show me all projects with delays": {
    intent: 'DELAYED_PROJECTS',
    response: {
      projects: Project[];
      totalDelayDays: number;
      criticalPaths: string[];
    }
  },
  "Which milestones are at risk this month?": {
    intent: 'AT_RISK_MILESTONES',
    response: {
      milestones: Milestone[];
      probabilityOfDelay: number;
      mitigationActions: Action[];
    }
  },

  // Cost Management Queries
  "What's the cost-to-date for Project ABC?": {
    intent: 'COST_TO_DATE',
    response: {
      totalCost: number;
      percentOfBudget: number;
      costByCategory: CategoryCost[];
      trend: TrendData;
    }
  },
  "Show me budget variance by cost code": {
    intent: 'BUDGET_VARIANCE',
    response: {
      variances: {
        costCode: string;
        budgeted: number;
        actual: number;
        variance: number;
        variancePercent: number;
        status: 'GREEN' | 'YELLOW' | 'RED';
      }[];
      overallVariance: number;
    }
  },
  "Predict final project cost": {
    intent: 'COST_FORECAST',
    response: {
      estimatedFinalCost: number;
      confidenceRange: { min: number; max: number };
      confidencePercent: number;
      scenarios: Scenario[];
    }
  },
  "What's our material cost trend over the last 3 months?": {
    intent: 'MATERIAL_COST_TREND',
    response: {
      trend: TrendData;
      byCategory: CategoryCost[];
      prediction: Forecast;
    }
  },

  // Resource Management Queries
  "Do we have skilled workers available for Project XYZ?": {
    intent: 'WORKER_AVAILABILITY',
    response: {
      availableWorkers: {
        trade: string;
        count: number;
        skillLevel: string;
      }[];
      recommendedAction: string;
    }
  },
  "Show me labor utilization across all sites": {
    intent: 'LABOR_UTILIZATION',
    response: {
      bySite: SiteUtilization[];
      overallUtilization: number;
      underutilized: Site[];
      overutilized: Site[];
    }
  },
  "When does our Tower Crane 1 become available?": {
    intent: 'EQUIPMENT_AVAILABILITY',
    response: {
      equipment: string;
      currentSite: string;
      expectedAvailable: Date;
      nextDeployment: string;
    }
  },
  "Optimize resource allocation across Project ABC sites": {
    intent: 'RESOURCE_OPTIMIZATION',
    response: {
      currentAllocation: Allocation[];
      recommendedChanges: Change[];
      expectedBenefits: Benefit[];
    }
  },

  // Risk and Safety Queries
  "What are the top 5 risks in Project ABC?": {
    intent: 'TOP_RISKS',
    response: {
      risks: Risk[];
      overallRiskScore: number;
      recommendedMitigations: Mitigation[];
    }
  },
  "Show me safety incidents this month": {
    intent: 'SAFETY_INCIDENTS',
    response: {
      totalIncidents: number;
      byType: IncidentType[];
      bySeverity: SeverityCount[];
      trend: TrendData;
      comparedToLastMonth: number;
    }
  },
  "Predict probability of delays for next month": {
    intent: 'DELAY_PREDICTION',
    response: {
      probability: number;
      factors: Factor[];
      confidence: number;
      recommendations: string[];
    }
  },

  // Compliance Queries
  "What's our regulatory compliance status?": {
    intent: 'COMPLIANCE_STATUS',
    response: {
      overallStatus: 'COMPLIANT' | 'NON_COMPLIANT' | 'PENDING';
      byCategory: CategoryCompliance[];
      criticalIssues: Issue[];
      pendingActions: Action[];
    }
  },
  "Show me expiring certifications in the next 30 days": {
    intent: 'EXPIRING_CERTIFICATIONS',
    response: {
      certifications: {
        worker: string;
        certification: string;
        expiryDate: Date;
        daysRemaining: number;
      }[];
    }
  },
  "Generate a compliance report for Project ABC": {
    intent: 'COMPLIANCE_REPORT',
    response: {
      report: Report;
      summary: Summary;
      recommendations: string[];
    }
  },

  // Contractor Management Queries
  "How is Contractor XYZ performing?": {
    intent: 'CONTRACTOR_PERFORMANCE',
    response: {
      overallScore: number;
      qualityScore: number;
      scheduleScore: number;
      safetyScore: number;
      trend: TrendData;
      comparedToTarget: number;
    }
  },
  "Show me contractor payment status": {
    intent: 'CONTRACTOR_PAYMENTS',
    response: {
      contractors: {
        name: string;
        contractValue: number;
        workCompleted: number;
        amountPaid: number;
        retention: number;
        pending: number;
      }[];
    }
  },
  "Compare contractor performance": {
    intent: 'CONTRACTOR_COMPARISON',
    response: {
      rankings: ContractorRanking[];
      comparisonMetrics: Metric[];
    }
  },

  // Action Intents
  "Create a safety alert for the scaffolding issue at Site 2": {
    intent: 'CREATE_ALERT',
    entities: { type: 'SAFETY', location: 'Site 2', issue: 'scaffolding' },
    confirmation: true
  },
  "Approve payment for Contractor XYZ invoice #123": {
    intent: 'APPROVE_PAYMENT',
    entities: { contractor: 'XYZ', invoiceId: '123' },
    confirmation: true
  },
  "Schedule additional workers for Project ABC": {
    intent: 'SCHEDULE_WORKERS',
    entities: { project: 'ABC', quantity: 10, trade: 'mason' },
    confirmation: true
  }
}
```

### 6.2 Dashboard Widgets and Reports

```typescript
// Construction Dashboard Widgets
interface ConstructionDashboardWidgets {
  // Real-time Project KPIs
  projectKPI: {
    title: "Project Overview";
    metrics: ['progress', 'budget', 'schedule', 'quality', 'safety'];
    refreshInterval: 60;
    charts: ['gauge', 'line', 'bar'];
  };

  costTracking: {
    title: "Cost Performance";
    metrics: ['costToDate', 'forecastFinal', 'budgetVariance', 'burnRate'];
    refreshInterval: 300;
    charts: ['line', 'waterfall'];
  };

  resourceUtilization: {
    title: "Resource Utilization";
    metrics: ['labor', 'equipment', 'material'];
    refreshInterval: 300;
    charts: ['bar', 'gantt'];
  };

  safetyMetrics: {
    title: "Safety Dashboard";
    metrics: ['incidents', 'nearMisses', 'ppeCompliance', 'trainingStatus'];
    refreshInterval: 60;
    alerts: ['critical', 'high'];
  };

  // Reports
  dailySiteReport: {
    schedule: "daily 6:00 PM";
    recipients: ['projectManager', 'siteSupervisors'];
    sections: ['summary', 'progress', 'incidents', 'issues', 'tomorrowPlan'];
  };

  weeklyCostReport: {
    schedule: "weekly Monday 8:00 AM";
    recipients: ['projectManager', 'finance', 'client'];
    sections: ['costSummary', 'variances', 'forecast', 'pendingInvoices'];
  };

  monthlyExecutiveReport: {
    schedule: "monthly 1st 9:00 AM";
    recipients: ['projectDirector', 'client', 'stakeholders'];
    sections: ['executiveSummary', 'scheduleStatus', 'costStatus', 'risks', 'outlook'];
  };
}
```

### 6.3 Alert Routing to Copilot

```typescript
interface CopilotAlertRouting {
  rules: [
    {
      condition: {
        type: 'SAFETY_INCIDENT',
        severity: 'CRITICAL'
      };
      actions: [
        { type: 'PUSH_NOTIFICATION', message: 'CRITICAL: Safety incident at {site}' },
        { type: 'CREATE_ALERT', priority: 'CRITICAL' },
        { type: 'ESCALATE', to: 'SafetyOfficer', timeLimit: 5 },
        { type: 'NOTIFY_STAKEHOLDERS', scope: 'IMMEDIATE' }
      ];
    },
    {
      condition: {
        type: 'BUDGET_OVERRUN',
        threshold: '> 5%'
      };
      actions: [
        { type: 'PUSH_NOTIFICATION', message: 'Budget alert: {project} exceeded by {percent}' },
        { type: 'UPDATE_DASHBOARD', widget: 'costTracking' },
        { type: 'CREATE_TICKET', priority: 'HIGH' }
      ];
    },
    {
      condition: {
        type: 'SCHEDULE_DELAY',
        threshold: '> 7 days'
      };
      actions: [
        { type: 'PUSH_NOTIFICATION', message: 'Schedule delay: {milestone} by {days} days' },
        { type: 'ANALYZE_IMPACT', onProject: true },
        { type: 'GENERATE_RECOVERY_PLAN', required: true }
      ];
    },
    {
      condition: {
        type: 'MATERIAL_SHORTAGE',
        severity: 'HIGH'
      };
      actions: [
        { type: 'PUSH_NOTIFICATION', message: 'Material shortage: {material} at {site}' },
        { type: 'SUGGEST_ACTION', action: 'Create emergency PO' },
        { type: 'CHECK_ALTERNATIVE_SUPPLIERS', required: true }
      ];
    },
    {
      condition: {
        type: 'CERTIFICATION_EXPIRY',
        timeFrame: '7 days'
      };
      actions: [
        { type: 'PUSH_NOTIFICATION', message: '{count} certifications expiring soon' },
        { type: 'REMOVE_FROM_SITE', condition: 'if expired' },
        { type: 'SCHEDULE_TRAINING', required: true }
      ];
    },
    {
      condition: {
        type: 'EQUIPMENT_BREAKDOWN',
        criticalEquipment: true
      };
      actions: [
        { type: 'PUSH_NOTIFICATION', message: '{equipment} breakdown at {site}' },
        { type: 'DISPATCH_MAINTENANCE', priority: 'HIGH' },
        { type: 'IMPACT_ANALYSIS', onSchedule: true }
      ];
    }
  ];
}
```

---

## 7. Economic Integration

### 7.1 Payment Flows

```typescript
interface ConstructionPaymentFlows {
  // Project Billing
  projectBilling: {
    flow: [
      { step: 'WORK_COMPLETED', system: 'REZ POS', action: 'Record progress' },
      { step: 'INVOICE_CREATED', system: 'REZ POS', action: 'Generate invoice' },
      { step: 'CLIENT_REVIEW', system: 'REZ POS', action: 'Submit for approval' },
      { step: 'PAYMENT_RECEIVED', system: 'RABTUL Pay', action: 'Process payment' },
      { step: 'RECEIPT_RECORDED', system: 'REZ POS', action: 'Update records' }
    ];
    features: {
      progressBilling: true;
      retentionPercent: 5-10;
      paymentSchedule: 'MONTHLY' | 'MILESTONE_BASED';
    };
  };

  // Contractor Payments
  contractorPayments: {
    flow: [
      { step: 'WORK_VERIFIED', system: 'REZ Staff', action: 'Site verification' },
      { step: 'INVOICE_RECEIVED', system: 'REZ POS', action: 'Record invoice' },
      { step: 'RETENTION_DEDUCTED', system: 'REZ POS', action: 'Calculate retention' },
      { step: 'PAYMENT_APPROVED', system: 'REZ Business Copilot', action: 'AI validation' },
      { step: 'PAYMENT_RELEASED', system: 'RABTUL Pay', action: 'Transfer payment' }
    ];
    features: {
      partialPayment: true;
      retention: { percent: 5-10, releaseAfterDefectLiability };
      milestoneBased: true;
      automaticVerification: true;
    };
  };

  // Worker Payments
  workerPayments: {
    flow: [
      { step: 'ATTENDANCE_RECORDED', system: 'REZ Staff', action: 'Daily attendance' },
      { step: 'OVERTIME_CALCULATED', system: 'REZ Staff', action: 'Compute overtime' },
      { step: 'DEDUCTIONS_APPLIED', system: 'REZ Staff', action: 'PF, ESI, TDS' },
      { step: 'PAYMENT_INITIATED', system: 'RABTUL Pay', action: 'Wage transfer' },
      { step: 'RECEIPT_CONFIRMED', system: 'RABTUL Wallet', action: 'Worker receives' }
    ];
    features: {
      daily: ['DAILY_WAGER'];
      weekly: ['CONTRACT'];
      monthly: ['PERMANENT'];
      digitalWage: true;
      complianceDeductions: true;
    };
  };

  // Material Purchases
  materialPurchases: {
    flow: [
      { step: 'REQUISITION_CREATED', system: 'REZ Inventory', action: 'Request material' },
      { step: 'APPROVAL_GRANTED', system: 'REZ Business Copilot', action: 'Budget check' },
      { step: 'PO_CREATED', system: 'REZ Inventory', action: 'Create PO' },
      { step: 'GOODS_RECEIVED', system: 'REZ Inventory', action: 'Accept delivery' },
      { step: 'PAYMENT_RELEASED', system: 'RABTUL Pay', action: 'Supplier payment' }
    ];
    features: {
      purchaseApproval: { threshold: 100000 };
      multipleSupplierQuotes: true;
      qualityVerification: true;
    };
  };

  // Equipment Rentals
  equipmentRentals: {
    trackedCategories: ['HEAVY_EQUIPMENT', 'TOOLS', 'SCAFFOLDING'];
    billingBasis: 'HOURLY' | 'DAILY' | 'MONTHLY';
    includes: ['FUEL', 'OPERATOR', 'TRANSPORT'];
    paymentTerms: 'NET15' | 'NET30';
  };
}
```

### 7.2 REZ Coins and Rewards Integration

```typescript
interface ConstructionRewardsIntegration {
  // Worker Rewards
  workerRewards: {
    categories: [
      {
        category: 'SAFETY_EXCELLENCE',
        actions: ['zeroIncidents', 'hazardIdentification', 'ppeCompliance'],
        coinsPerAction: { min: 50, max: 500 }
      },
      {
        category: 'PRODUCTIVITY',
        actions: ['targetAchieved', 'qualityWork', 'overtimeContribution'],
        coinsPerAction: { min: 25, max: 300 }
      },
      {
        category: 'SKILL_DEVELOPMENT',
        actions: ['certificationObtained', 'skillUpgrade', 'trainingCompleted'],
        coinsPerAction: { min: 100, max: 1000 }
      },
      {
        category: 'INNOVATION',
        actions: ['processImprovement', 'costSaving', 'suggestionImplemented'],
        coinsPerAction: { min: 200, max: 5000 }
      }
    ];
    redemption: {
      products: ['REZ Store', 'Gift Cards', 'Extra Leave', 'Bonus'],
      conversionRate: 1;
    };
  };

  // Contractor Rewards
  contractorRewards: {
    tiers: [
      { tier: 'PARTNER', performanceThreshold: 90 },
      { tier: 'PREFERRED', performanceThreshold: 75 },
      { tier: 'APPROVED', performanceThreshold: 60 }
    ];
    benefits: {
      PARTNER: ['Priority bidding', 'Extended payment terms', 'Volume bonuses'],
      PREFERRED: ['Pre-qualification waiver', 'Performance bonuses'],
      APPROVED: ['Standard terms']
    };
    rewardsPoints: {
      qualityBonus: 1,    // points per % above target
      onTimeDelivery: 2,
      safetyScore: 1.5
    };
  };

  // Site Competition
  siteCompetition: {
    metrics: ['safety', 'productivity', 'quality', 'compliance'];
    period: 'MONTHLY';
    rewards: {
      winningSite: 'team bonus + recognition',
      topPerformer: 'individual rewards'
    };
  };
}
```

### 7.3 Wallet Usage in Construction

```typescript
interface ConstructionWalletUsage {
  // Project Wallet
  projectWallet: {
    purposes: [
      'MATERIAL_PURCHASES',
      'CONTRACTOR_PAYMENTS',
      'WORKER_WAGES',
      'EQUIPMENT_RENTALS',
      'PERMIT_FEES',
      'EMERGENCY_REPAIRS'
    ];
    fundingSources: [
      'CLIENT_PAYMENTS',
      'CORPORATE_ACCOUNT',
      'CREDIT_LINE'
    ];
    controls: {
      maxTransactionValue: 10000000;
      dailyLimit: 50000000;
      dualApproval: { threshold: 5000000 };
      budgetControls: true;
    };
  };

  // Petty Cash for Sites
  pettyCash: {
    maxBalance: 100000;
    refills: ['WEEKLY', 'ON_DEMAND'];
    authorizedExpenses: [
      'EMERGENCY_REPAIRS',
      'SMALL_TOOLS',
      'CONSUMABLES',
      'LABOR_DAILY_WAGES'
    ];
  };

  // Worker Wallets
  workerWallets: {
    purposes: [
      'WAGES',
      'INCENTIVES',
      'SAFETY_BONUSES',
      'TRAINING_REWARDS'
    ];
    disbursement: {
      method: 'WALLET_TRANSFER';
      frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
      recordKeeping: true;
    };
  };

  // Supplier Payments
  supplierPayments: {
    methods: ['IMMEDIATE', 'NET15', 'NET30', 'NET60'];
    incentives: {
      earlyPayment: { discount: '2/10 NET30' };
      onTimeBonus: true;
    };
    reconciliation: true;
  };
}
```

---

## 8. Implementation Roadmap

### 8.1 Six-Week Implementation Plan

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                    CONSTRUCTION & INFRASTRUCTURE OS                                  │
│                         6-WEEK IMPLEMENTATION ROADMAP                                │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                       │
│  WEEK 1: FOUNDATION                                                                 │
│  ├───────────────────────────────────────────────────────────────────────────────   │
│  │ Infrastructure Setup                                                              │
│  │ • Deploy Twin Hub (Port 5250)                                                   │
│  │ • Configure MongoDB/PostgreSQL databases                                        │
│  │ • Set up message queues for event streaming                                     │
│  │ • Configure SSL/TLS certificates                                                 │
│  │                                                                                   │
│  │ Product Integration                                                              │
│  │ • Integrate REZ POS (4013) - Project billing module                             │
│  │ • Configure cost codes and project structures                                    │
│  │ • Set up invoice templates                                                       │
│  │                                                                                   │
│  │ Deliverables: Twin Hub running, REZ POS connected, Cost codes configured        │
│  └───────────────────────────────────────────────────────────────────────────────   │
│                                                                                       │
│  WEEK 2: TWIN CORE                                                                  │
│  ├───────────────────────────────────────────────────────────────────────────────   │
│  │ Project Twin Implementation                                                      │
│  │ • Build Project Twin schema and CRUD APIs                                       │
│  │ • Implement real-time state management                                           │
│  │ • Create relationship graph management                                           │
│  │ • Set up event propagation                                                       │
│  │                                                                                   │
│  │ Site Twin Implementation                                                        │
│  │ • Build Site Twin with progress tracking                                        │
│  │ • Implement worker/material tracking                                             │
│  │ • Configure safety metrics aggregation                                           │
│  │                                                                                   │
│  │ Deliverables: Project Twin API, Site Twin API, Basic dashboards                  │
│  └───────────────────────────────────────────────────────────────────────────────   │
│                                                                                       │
│  WEEK 3: RESOURCE TWINS                                                              │
│  ├───────────────────────────────────────────────────────────────────────────────   │
│  │ Worker Twin Implementation                                                      │
│  │ • Build Worker Twin with skill profiles                                          │
│  │ • Implement certification tracking                                               │
│  │ • Configure attendance integration with REZ Staff                                │
│  │ • Set up safety training records                                                 │
│  │                                                                                   │
│  │ Equipment Twin Implementation                                                    │
│  │ • Build Equipment Twin with telemetry model                                      │
│  │ • Implement maintenance tracking                                                 │
│  │ • Configure utilization monitoring                                               │
│  │ • Set up OEE calculations                                                        │
│  │                                                                                   │
│  │ Deliverables: Worker Twin API, Equipment Twin API, Attendance sync                │
│  └───────────────────────────────────────────────────────────────────────────────   │
│                                                                                       │
│  WEEK 4: CONTRACTOR & COMPLIANCE                                                     │
│  ├───────────────────────────────────────────────────────────────────────────────   │
│  │ Contractor Twin Implementation                                                  │
│  │ • Build Contractor Twin with performance tracking                               │
│  │ • Implement payment processing                                                   │
│  │ • Configure compliance monitoring                                                │
│  │ • Set up performance scoring                                                     │
│  │                                                                                   │
│  │ Compliance Checker Integration                                                   │
│  │ • Integrate Compliance Checker with LawGens                                      │
│  │ • Implement permit tracking                                                      │
│  │ • Configure labor law compliance checks                                          │
│  │ • Set up certification expiry alerts                                             │
│  │                                                                                   │
│  │ Deliverables: Contractor Twin API, Compliance module, Payment workflows          │
│  └───────────────────────────────────────────────────────────────────────────────   │
│                                                                                       │
│  WEEK 5: BUSINESS COPILOT & AI                                                       │
│  ├───────────────────────────────────────────────────────────────────────────────   │
│  │ Business Copilot Integration                                                     │
│  │ • Connect REZ Business Copilot (4022) to Project Twin                           │
│  │ • Implement natural language query processing                                    │
│  │ • Build cost forecasting models                                                  │
│  │ • Create risk analysis algorithms                                                │
│  │                                                                                   │
│  │ AI Agent Deployment                                                              │
│  │ • Deploy Project Manager Agent                                                   │
│  │ • Deploy Safety Agent                                                            │
│  │ • Deploy Cost Agent                                                              │
│  │ • Configure alert routing and escalations                                        │
│  │                                                                                   │
│  │ Deliverables: Business Copilot connected, 4 AI Agents deployed, Reporting       │
│  └───────────────────────────────────────────────────────────────────────────────   │
│                                                                                       │
│  WEEK 6: TESTING & GO-LIVE                                                           │
│  ├───────────────────────────────────────────────────────────────────────────────   │
│  │ Integration Testing                                                               │
│  │ • End-to-end workflow testing                                                    │
│  │ • Performance and load testing                                                   │
│  │ • Security penetration testing                                                    │
│  │ • Data migration validation                                                       │
│  │                                                                                   │
│  │ User Acceptance Testing                                                          │
│  │ • Train key users on new OS                                                       │
│  │ • Conduct UAT sessions                                                           │
│  │ • Gather feedback and implement changes                                           │
│  │                                                                                   │
│  │ Go-Live Preparation                                                              │
│  │ • Final data synchronization                                                     │
│  │ • Backup and rollback procedures                                                 │
│  │ • Monitoring and alerting setup                                                   │
│  │ • Documentation and training materials                                            │
│  │                                                                                   │
│  │ Deliverables: Production-ready system, trained users, complete documentation     │
│  └───────────────────────────────────────────────────────────────────────────────   │
│                                                                                       │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Detailed Week-by-Week Tasks

#### Week 1: Foundation

| Day | Task | Owner | Deliverable |
|-----|------|-------|-------------|
| 1 | Deploy Twin Hub infrastructure | DevOps | Twin Hub running on 5250 |
| 2 | Configure database schemas | Backend | MongoDB/PostgreSQL ready |
| 3 | Set up message queues | Backend | Event streaming configured |
| 4 | Integrate REZ POS - Basic | Backend | POS API connected |
| 5 | Configure cost codes | BA | Cost structure defined |
| 1-5 | **Milestone:** Infrastructure ready | Team | Sprint review |

#### Week 2: Twin Core

| Day | Task | Owner | Deliverable |
|-----|------|-------|-------------|
| 6 | Build Project Twin schema | Backend | JSON schema defined |
| 7 | Implement Project Twin CRUD | Backend | Project APIs |
| 8 | Build Site Twin schema | Backend | Site JSON schema |
| 9 | Implement Site Twin APIs | Backend | Site APIs |
| 10 | Create basic dashboards | Frontend | MVP dashboard |
| 6-10 | **Milestone:** Core twins ready | Team | Sprint review |

#### Week 3: Resource Twins

| Day | Task | Owner | Deliverable |
|-----|------|-------|-------------|
| 11 | Build Worker Twin schema | Backend | Worker schema |
| 12 | Implement Worker APIs | Backend | Worker APIs |
| 13 | Integrate REZ Staff attendance | Backend | Attendance sync |
| 14 | Build Equipment Twin schema | Backend | Equipment schema |
| 15 | Implement Equipment APIs | Backend | Equipment APIs |
| 11-15 | **Milestone:** Resource twins ready | Team | Sprint review |

#### Week 4: Contractor & Compliance

| Day | Task | Owner | Deliverable |
|-----|------|-------|-------------|
| 16 | Build Contractor Twin schema | Backend | Contractor schema |
| 17 | Implement Contractor APIs | Backend | Contractor APIs |
| 18 | Integrate Compliance Checker | Backend | Compliance sync |
| 19 | Implement permit tracking | Backend | Permit module |
| 20 | Set up payment workflows | Backend | Payment processing |
| 16-20 | **Milestone:** Contractor & compliance ready | Team | Sprint review |

#### Week 5: Business Copilot

| Day | Task | Owner | Deliverable |
|-----|------|-------|-------------|
| 21 | Connect Business Copilot | Backend | Copilot integrated |
| 22 | Implement NL query processing | ML | Query parser |
| 23 | Build cost forecasting | ML | Forecast models |
| 24 | Create risk analysis | ML | Risk engine |
| 25 | Deploy AI agents | ML | 4 agents running |
| 21-25 | **Milestone:** AI capabilities live | Team | Sprint review |

#### Week 6: Testing & Go-Live

| Day | Task | Owner | Deliverable |
|-----|------|-------|-------------|
| 26 | Integration testing | QA | Test suite passed |
| 27 | Performance testing | QA | Benchmarks met |
| 28 | Security testing | Security | Vulnerabilities fixed |
| 29 | UAT with users | BA | Sign-off |
| 30 | Go-live preparation | Team | Production ready |
| 26-30 | **Milestone:** SYSTEM LIVE | Team | Go-live |

### 8.3 Resource Requirements

#### Team Composition

| Role | Count | Responsibilities |
|------|-------|------------------|
| Project Manager | 1 | Overall coordination |
| Backend Engineers | 3 | Twin APIs, integrations |
| Frontend Engineers | 1 | Dashboard, reports |
| ML Engineers | 1 | AI models, Copilot |
| QA Engineers | 2 | Testing, UAT |
| DevOps Engineer | 1 | Infrastructure, deployment |
| Business Analyst | 1 | Requirements, UAT |

#### Infrastructure Requirements

| Component | Specification | Purpose |
|-----------|--------------|---------|
| Twin Hub | 4 vCPU, 16GB RAM | Core twin management |
| API Servers | 2x 2 vCPU, 8GB RAM | Load balanced APIs |
| Database | 8 vCPU, 32GB RAM, 500GB SSD | Primary data store |
| Message Queue | 2 vCPU, 8GB RAM | Event streaming |
| ML Server | 4 vCPU, 16GB RAM, GPU | AI inference |
| Monitoring | Standard | Observability |

### 8.4 Success Metrics

| Metric | Baseline | Week 6 Target | Month 3 Target |
|--------|----------|--------------|----------------|
| Twin Data Freshness | N/A | < 5 min latency | < 1 min latency |
| API Response Time | N/A | < 500ms p95 | < 200ms p95 |
| System Availability | N/A | 99.5% | 99.9% |
| User Adoption | 0 | 50% trained | 90% active |
| Query Success Rate | N/A | 90% | 98% |
| Cost Forecast Accuracy | N/A | 85% | 95% |

---

## Appendix A: API Reference Summary

### Twin Hub Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/twin/project` | POST | Create Project Twin |
| `/api/v1/twin/project/:id` | GET | Get Project Twin |
| `/api/v1/twin/project/:id` | PUT | Update Project Twin |
| `/api/v1/twin/site` | POST | Create Site Twin |
| `/api/v1/twin/site/:id` | GET | Get Site Twin |
| `/api/v1/twin/worker` | POST | Create Worker Twin |
| `/api/v1/twin/worker/:id` | GET | Get Worker Twin |
| `/api/v1/twin/equipment` | POST | Create Equipment Twin |
| `/api/v1/twin/equipment/:id` | GET | Get Equipment Twin |
| `/api/v1/twin/contractor` | POST | Create Contractor Twin |
| `/api/v1/twin/contractor/:id` | GET | Get Contractor Twin |
| `/api/v1/twin/search` | POST | Search twins |
| `/api/v1/twin/relationships` | GET | Get relationships |

### Event Subscriptions

| Event | Description | Subscriber |
|-------|-------------|------------|
| `twin.created` | New twin created | Relevant agents |
| `twin.updated` | Twin state changed | Subscribed systems |
| `project.updated` | Project data changed | Project Manager Agent |
| `site.updated` | Site data changed | Site Agent |
| `safety.incident` | Safety incident reported | Safety Agent |
| `cost.changed` | Cost data updated | Cost Agent |
| `worker.deployed` | Worker deployment | Worker Agent |
| `equipment.telemetry` | Equipment data | Equipment Agent |

---

## Appendix B: Data Privacy & Security

### Data Classification

| Classification | Examples | Handling |
|----------------|----------|----------|
| Public | Project names, milestones | Standard access |
| Internal | Costs, schedules | Authenticated access |
| Confidential | Client data, contracts | Encrypted, RBAC |
| Restricted | Worker PII, bank details | Encrypted, audit logged |

### Security Measures

- All API endpoints require JWT authentication
- PII data encrypted at rest (AES-256)
- TLS 1.3 for data in transit
- Role-based access control (RBAC)
- Comprehensive audit logging
- Regular security audits
- Penetration testing

---

*Document Version: 1.0.0*
*Last Updated: June 12, 2026*
*Author: RTNM Architecture Team*
*Status: Ready for Implementation*
