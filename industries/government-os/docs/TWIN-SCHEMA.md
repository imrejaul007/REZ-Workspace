# Government OS Twin Schema Documentation

This document describes the data schemas for all Twin services in the Government OS platform.

---

## Citizen Twin Schema

The Citizen Twin represents a resident's digital identity, including demographics, needs, and service history.

### Schema Definition

```typescript
interface CitizenTwin {
  // Primary identifier
  residentId: string;  // UUID v4

  // Demographics
  demographics: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;  // ISO 8601 date
    ssn?: string;         // Encrypted
    driversLicense?: string;
    email: string;
    phone: string;
    address: {
      street: string;
      street2?: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;  // Default: 'US'
      coordinates?: {
        latitude: number;
        longitude: number;
      };
    };
    preferredLanguage: string;  // Default: 'en'
    preferredContactMethod: 'email' | 'phone' | 'sms' | 'mail';
  };

  // Profile information
  profile: {
    verifiedStatus: 'pending' | 'verified' | 'rejected';
    verificationMethods: Array<{
      method: 'ssn' | 'drivers_license' | 'in_person' | 'digital';
      verifiedAt: string;
      verifiedBy: string;
    }>;
    citizenType: 'standard' | 'senior' | 'veteran' | 'low_income' | 'disabled' | 'minor';
    eligibilityFlags: string[];
    accountStatus: 'active' | 'suspended' | 'closed';
    preferences: {
      language: string;
      notificationChannels: {
        email: boolean;
        sms: boolean;
        push: boolean;
        inApp: boolean;
      };
      pushTokens: Array<{
        token: string;
        platform: 'ios' | 'android' | 'web';
        createdAt: string;
      }>;
    };
  };

  // Needs tracking
  needs: {
    currentServices: string[];  // Service IDs
    pendingApplications: string[];  // Application IDs
    activePermits: string[];  // Permit IDs
    upcomingRenewals: Array<{
      permitId: string;
      renewalDeadline: string;
      reminderSent: boolean;
    }>;
    flaggedNeeds: string[];  // Categories: 'housing', 'healthcare', 'employment', etc.
    specialAccommodations: Array<{
      type: 'visual' | 'hearing' | 'mobility' | 'cognitive';
      description: string;
    }>;
  };

  // Journey tracking
  journey: {
    interactions: Array<{
      id: string;
      type: 'service_inquiry' | 'application' | 'renewal' | 'complaint' | 'compliment' | 'general';
      channel: 'web' | 'mobile' | 'phone' | 'in_person' | 'chat' | 'mail';
      service?: string;
      timestamp: string;
      outcome: 'resolved' | 'pending' | 'escalated' | 'closed';
      sentiment: 'positive' | 'neutral' | 'negative';
      duration: number;  // Seconds
      agent?: string;
      notes?: string;
    }>;
    touchpoints: Array<{
      timestamp: string;
      type: string;
      channel: string;
      service?: string;
    }>;
    serviceHistory: Array<{
      serviceId: string;
      startedAt: string;
      endedAt?: string;
      status: 'active' | 'completed' | 'cancelled';
      outcome?: string;
    }>;
    engagementScore: number;  // 0-100
    npsScore?: number;  // Net Promoter Score
    lastInteractionAt: string;
  };

  // REZ CRM Sync Status
  syncStatus: {
    lastSyncedToCRM: string | null;
    crmSyncRequired: boolean;
    syncErrors: Array<{
      timestamp: string;
      error: string;
    }>;
    crmRecordId?: string;  // Salesforce Contact ID
  };

  // Metadata
  metadata: {
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    lastModifiedBy: string;
    version: number;
    source: 'online' | 'in_person' | 'batch' | 'api';
  };
}
```

### Indexes

- Primary: `residentId`
- Unique: `ssn`, `driversLicense`, `email`
- Query: `profile.citizenType`, `profile.verifiedStatus`, `demographics.state`

---

## Service Twin Schema

The Service Twin represents a government service, including eligibility rules, requirements, and processes.

### Schema Definition

```typescript
interface ServiceTwin {
  serviceId: string;  // UUID v4

  // Metadata
  metadata: {
    name: string;
    description: string;
    shortDescription: string;  // Max 200 chars
    category: string;
    subcategory: string;
    tags: string[];
    keywords: string[];
    legacyId?: string;  // ID from legacy systems
  };

  // Eligibility rules
  eligibility: {
    citizenTypes: string[];  // 'all' or specific types
    ageRequirements?: {
      min?: number;
      max?: number;
    };
    residencyRequirements?: {
      required: boolean;
      minimumYears?: number;
      states?: string[];  // Specific states
    };
    incomeRequirements?: {
      type: 'none' | 'fpl_percentage';  // Federal Poverty Level
      threshold?: number;
    };
    employmentRequirements?: {
      type: 'none' | 'employed' | 'self_employed' | 'unemployed';
    };
    businessRequirements?: {
      type: 'none' | 'registered' | 'licensed' | 'insured';
      businessTypes?: string[];
      minimumYearsInBusiness?: number;
    };
    prerequisiteServices: string[];  // Service IDs
    exclusionCriteria: Array<{
      type: 'criminal_record' | 'outstanding_fines' | 'deported' | 'other';
      severity?: number;
      description?: string;
    }>;
  };

  // Document requirements
  documents: {
    required: Array<{
      type: string;
      description: string;
      count?: number;  // Min number required
      validWithin?: number;  // Days
      alternatives?: string[];
    }>;
    optional: Array<{
      type: string;
      description: string;
    }>;
    thirdParty: Array<{
      type: string;
      issuer: string;
      verificationRequired: boolean;
    }>;
  };

  // Process definition
  process: {
    steps: Array<{
      name: string;
      description: string;
      guidance: string;
      questions: Array<{
        id: string;
        text: string;
        type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'file';
        required: boolean;
        options?: string[];
        validation?: {
          pattern?: string;
          min?: number;
          max?: number;
        };
      }>;
      estimatedDuration?: string;
      automated?: boolean;
    }>;
    estimatedDuration: string;  // Human readable
    processingTime: {
      minDays?: number;
      maxDays?: number;
      avgDays?: number;
    };
    rushOption: boolean;
    rushProcessingDays?: number;
    rushProcessingFee?: number;
    onlineAvailable: boolean;
    inPersonAvailable: boolean;
    mobileAvailable: boolean;
    thirdPartyIntegration?: {
      name: string;
      type: 'background_check' | 'document_verification' | 'payment';
      endpoint?: string;
    };
  };

  // Fees
  fees: {
    amount: number;
    currency: string;  // Default: 'USD'
    waiverAvailable: boolean;
    feeExemptions: Array<{
      type: string;
      description: string;
      requiredProof: string[];
    }>;
    paymentMethods: ('credit_card' | 'debit_card' | 'check' | 'cash' | 'money_order' | 'online')[];
    installmentAvailable: boolean;
  };

  // Availability
  availability: {
    locations: Array<{
      id: string;
      name: string;
      address: Address;
      services: string[];
      operatingHours: {
        [day: string]: {
          open: string;  // HH:mm
          close: string;
          closed?: boolean;
        };
      };
      appointmentRequired: boolean;
      waitTimeEstimate?: string;
    }>;
    operatingHours?: {
      [day: string]: {
        open: string;
        close: string;
      };
    };
    seasonalAvailability?: {
      startDate: string;
      endDate: string;
      description?: string;
    };
    waitTimeEstimate?: string;
  };

  // Outcomes
  outcomes: {
    types: ('approval' | 'denial' | 'conditional' | 'withdrawn' | 'pending')[];
    appealProcess?: {
      available: boolean;
      deadlineDays: number;
      process: string;
      address: Address;
    };
    renewalProcess?: {
      required: boolean;
      noticeDays: number;
      gracePeriodDays: number;
      automaticRenewal: boolean;
    };
    associatedPermits: string[];
  };

  // Metrics
  metrics: {
    totalApplications: number;
    averageProcessingTime: number;
    satisfactionScore: number;
    successRate: number;
    lastUpdated: string;
  };

  // Status
  status: 'active' | 'inactive' | 'archived' | 'draft';

  // Metadata
  metadata: {
    createdAt: string;
    updatedAt: string;
    version: number;
    effectiveDate?: string;
    expirationDate?: string;
    lastReviewedAt: string;
    createdBy: string;
    lastModifiedBy: string;
  };
}
```

### Indexes

- Primary: `serviceId`
- Query: `metadata.category`, `metadata.subcategory`, `status`
- Full-text: `metadata.name`, `metadata.keywords`, `metadata.description`

---

## Permit Twin Schema

The Permit Twin represents a permit type, while Permit Applications track individual submissions.

### Permit Type Schema

```typescript
interface PermitTwin {
  permitId: string;  // UUID v4

  // Metadata
  metadata: {
    name: string;
    description: string;
    shortDescription: string;
    permitType: string;
    category: string;
    tags: string[];
  };

  // Requirements
  requirements: {
    eligibilityCriteria: Array<{
      type: string;
      description: string;
      required: boolean;
    }>;
    requiredDocuments: string[];
    minimumRequirements?: {
      age?: number;
      experience?: string;
      education?: string;
    };
    insuranceRequirements: Array<{
      type: string;
      required: boolean;
      minCoverage?: number;
    }>;
    backgroundCheckRequired: boolean;
    inspectionRequired: boolean;
  };

  // Application process
  application: {
    submissionMethods: ('online' | 'in_person' | 'mail' | 'fax')[];
    formFields: Array<{
      name: string;
      type: string;
      required: boolean;
      validation?: object;
    }>;
    validationRules: Array<{
      field: string;
      rule: string;
      message: string;
    }>;
    applicationFee: number;
    feeStructure?: {
      base: number;
      additionalFees: Array<{
        name: string;
        amount: number;
        condition?: string;
      }>;
    };
    paymentRequired: boolean;
  };

  // Processing
  processing: {
    estimatedDays: number;
    rushProcessingAvailable: boolean;
    rushProcessingDays?: number;
    rushProcessingFee?: number;
    reviewStages: string[];
    inspectionSchedule?: {
      required: boolean;
      frequency?: string;
      locations?: string[];
    };
    conditionalApproval: boolean;
  };

  docTemplate: string;
  deliveryMethods: ('digital' | 'physical' | 'both')[];
  physicalDocumentRequired: boolean;
  digitalVerificationAvailable: boolean;

  // Validity
  validity: {
    duration: number;
    durationUnit: 'days' | 'months' | 'years';
    renewalRequired: boolean;
    renewalNoticeDays: number;
    gracePeriodDays: number;
    expirationHandling: 'automatic' | 'manual' | 'grace_period';
  };

  // Metrics
  metrics: {
    totalApplications: number;
    totalDecisions: number;
    totalApproved: number;
    totalDenied: number;
    approvalRate: number;
    averageProcessingDays: number;
  };

  status: 'active' | 'inactive' | 'archived';

  metadata: {
    createdAt: string;
    updatedAt: string;
    version: number;
    effectiveDate?: string;
    expirationDate?: string;
  };
}
```

### Permit Application Schema

```typescript
interface PermitApplication {
  applicationId: string;  // UUID v4
  residentId: string;
  permitId: string;
  permitType: string;

  status: 'submitted' | 'under_review' | 'pending_decision' | 'approved' | 'denied' | 'conditional' | 'issued' | 'expired' | 'withdrawn';

  // Submission info
  submission: {
    submittedAt: string;
    submissionMethod: 'online' | 'in_person' | 'mail' | 'fax';
    submittedBy: string;
    ipAddress?: string;
    userAgent?: string;
  };

  // Application data
  data: {
    personalInfo: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      ssn?: string;
      dateOfBirth?: string;
    };
    businessInfo?: {
      name: string;
      type: string;
      ein?: string;
      address: Address;
    };
    addresses: {
      type: 'mailing' | 'property' | 'business';
      address: Address;
    }[];
    contacts: Array<{
      type: string;
      name: string;
      phone: string;
      email: string;
    }>;
    qualifications: object;
    additionalData: Record<string, any>;
  };

  // Documents
  documents: {
    uploaded: Array<{
      id: string;
      type: string;
      name: string;
      url: string;
      uploadedAt: string;
      scannedAt?: string;
    }>;
    verified: Array<{
      id: string;
      type: string;
      verifiedAt: string;
      verifiedBy: string;
    }>;
    rejected: Array<{
      id: string;
      type: string;
      reason: string;
      rejectedAt: string;
    }>;
  };

  // Fees
  fees: {
    applicationFee: number;
    rushFee: number;
    additionalFees: Array<{
      name: string;
      amount: number;
    }>;
    totalFee: number;
    paymentStatus: 'pending' | 'paid' | 'refunded' | 'waived';
    paymentMethod?: string;
    paymentReference?: string;
    paidAt?: string;
  };

  // Review process
  review: {
    currentStage: string;
    stageHistory: Array<{
      stage: string;
      timestamp: string;
      notes?: string;
      changedBy?: string;
    }>;
    assignedTo?: string;
    assignedAt?: string;
    priority: 'normal' | 'high' | 'urgent';
    dueDate?: string;
    notes: Array<{
      timestamp: string;
      author: string;
      content: string;
    }>;
  };

  // Decision
  decision: {
    outcome: 'approved' | 'denied' | 'conditional' | null;
    decidedAt?: string;
    decidedBy?: string;
    reason?: string;
    conditions?: string[];
    appealAvailable: boolean;
    appealDeadline?: string;
  };

  // Issuance
  issuance: {
    issuedAt?: string;
    documentNumber?: string;
    effectiveDate?: string;
    expirationDate?: string;
    deliveryMethod?: 'digital' | 'physical';
    deliveryStatus?: 'pending' | 'sent' | 'delivered';
    deliveryReference?: string;
  };

  metadata: {
    createdAt: string;
    updatedAt: string;
    version: number;
    lastModifiedBy: string;
  };
}
```

### Indexes

- Primary: `applicationId`
- Query: `residentId`, `permitId`, `status`, `submission.submittedAt`

---

## Compliance Twin Schema

The Compliance Twin manages regulations and compliance records.

### Regulation Schema

```typescript
interface Regulation {
  regulationId: string;  // UUID v4

  // Metadata
  metadata: {
    title: string;
    description: string;
    shortDescription: string;
    regulationType: 'statute' | 'rule' | 'policy' | 'ordinance' | 'standard';
    category: string;
    jurisdiction: string;
    authority: string;
    tags: string[];
    keywords: string[];
    citation?: string;  // Official citation
  };

  // Content
  content: {
    fullText: string;
    summary: string;
    effectiveDate: string;
    expirationDate?: string;
    lastReviewedDate: string;
    nextReviewDate?: string;
    version: string;
  };

  // Requirements
  requirements: {
    mandatoryCompliance: boolean;
    complianceDeadline?: string;
    gracePeriodDays: number;
    penalties: Array<{
      type: string;
      description: string;
      amount?: number;
    }>;
    exemptions: Array<{
      type: string;
      criteria: string[];
      description: string;
    }>;
    alternatives: Array<{
      type: string;
      description: string;
      requirements: string[];
    }>;
  };

  // Applicability
  applicability: {
    entityTypes: ('citizen' | 'business' | 'government')[];
    businessTypes?: string[];
    sizeRequirements?: {
      minEmployees?: number;
      maxEmployees?: number;
      minRevenue?: number;
    };
    geographicScope: 'federal' | 'state' | 'county' | 'municipal' | 'statewide';
    industrySectors?: string[];
  };

  // Reporting
  reporting: {
    reportingRequired: boolean;
    reportingFrequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';
    reportingDueDates?: string[];
    reportingMethod?: string;
    reportingRecipient?: string;
    templateUrl?: string;
  };

  // Enforcement
  enforcement: {
    enforcementAgency: string;
    inspectionRequired: boolean;
    inspectionFrequency?: string;
    violationCategories: Array<{
      category: string;
      severity: 'minor' | 'major' | 'critical';
      description: string;
    }>;
    remediationRequirements?: string;
  };

  // Related
  related: {
    relatedRegulations: string[];
    supersedes?: string;
    supersededBy?: string;
    associatedServices: string[];
    associatedPermits: string[];
  };

  status: 'active' | 'inactive' | 'archived' | 'draft';

  metadata: {
    createdAt: string;
    updatedAt: string;
    version: number;
    createdBy: string;
    lastModifiedBy: string;
  };
}
```

### Compliance Record Schema

```typescript
interface ComplianceRecord {
  recordId: string;  // UUID v4
  entityId: string;
  entityType: 'citizen' | 'business';
  entityName: string;
  regulationId: string;
  regulationTitle: string;

  status: 'pending' | 'compliant' | 'non_compliant' | 'partial' | 'expired';

  // Compliance status
  compliance: {
    isCompliant: boolean | null;
    complianceDate?: string;
    verificationMethod?: string;
    verifiedBy?: string;
    verificationDate?: string;
  };

  // Assessment
  assessment: {
    lastAssessedAt: string;
    assessedBy: string;
    assessmentResult: 'compliant' | 'non_compliant' | 'partial';
    findings: Array<{
      type: string;
      description: string;
      severity: 'low' | 'medium' | 'high';
    }>;
    riskLevel: 'low' | 'medium' | 'high';
    riskScore: number;
    evidence: Array<{
      type: string;
      url: string;
      description: string;
    }>;
    notes?: string;
  };

  // Violations
  violations: Array<{
    id: string;
    type: string;
    description: string;
    severity: 'minor' | 'major' | 'critical';
    identifiedAt: string;
    identifiedBy: string;
    resolvedAt?: string;
    resolvedBy?: string;
  }>;

  // Remediation
  remediation: {
    required: boolean;
    deadline?: string;
    completedAt?: string;
    completedBy?: string;
    verifiedAt?: string;
    notes: Array<{
      timestamp: string;
      author: string;
      content: string;
    }>;
  };

  // History
  history: Array<{
    timestamp: string;
    action: string;
    performedBy: string;
    notes?: string;
  }>;

  metadata: {
    createdAt: string;
    updatedAt: string;
    version: number;
  };
}
```

### Indexes

- Primary: `recordId`
- Query: `entityId`, `entityType`, `regulationId`, `status`

---

## Relationship Diagram

```
┌─────────────────┐
│  Citizen Twin   │
│  (residentId)   │
└───────┬─────────┘
        │
        ├── has many ──────────────┐
        │                          │
        ▼                          ▼
┌─────────────────┐       ┌─────────────────┐
│ Service Twin    │       │Permit Application│
│ (serviceId)     │       │(applicationId)  │
└───────┬─────────┘       └───────┬───────────┘
        │                         │
        └── eligibility ──────────┘
                │
                ▼
        ┌─────────────────┐
        │ Permit Twin     │
        │ (permitId)      │
        └───────┬─────────┘
                │
                └── requires ────────┐
                                     │
                                     ▼
                             ┌─────────────────┐
                             │ Regulation      │
                             │ (regulationId)  │
                             └───────┬─────────┘
                                     │
                                     ▼
                             ┌─────────────────┐
                             │Compliance Record│
                             │ (recordId)      │
                             └─────────────────┘
```

---

## Data Retention

| Data Type | Retention Period | Archive Policy |
|-----------|-----------------|----------------|
| Citizen Twins | 7 years after last activity | Archived after 2 years inactive |
| Service Twins | Indefinite | Never deleted |
| Permit Applications | 10 years | Archived after 5 years |
| Compliance Records | 7 years | Archived after 3 years |
| Regulations | Indefinite | Superseded regulations archived |

---

## Encryption

Sensitive fields are encrypted at rest using AES-256:

- SSN
- Drivers License Number
- Financial Information
- Health-related data

All encryption keys are managed via Azure Key Vault.

---

## Audit Logging

All create, update, and delete operations are logged with:

- Timestamp
- User/Service performing action
- IP Address
- Changes made (before/after values)
- Session ID
- Correlation ID
