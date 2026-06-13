# Legal OS Twin Schemas

## Overview

Legal OS uses Digital Twin architecture to create comprehensive digital representations of legal entities, cases, documents, and calendar events.

## Twin Types

### 1. Client Twin

Represents a law firm's client (individual, corporate, government, or nonprofit).

```javascript
{
  // Identity
  clientId: "CLI-2024-00001",
  name: "Acme Corporation",
  type: "corporate", // individual | corporate | government | nonprofit
  
  // Contact Information
  email: "contact@acme.com",
  phone: "+1-555-0123",
  address: {
    street: "123 Main St",
    city: "San Francisco",
    state: "CA",
    zip: "94102",
    country: "USA"
  },
  
  // Business Info
  company: "Acme Corporation",
  industry: "Technology",
  
  // Status & Source
  status: "active", // prospect | inactive | active
  source: "referral",
  referralSource: "External Counsel - Smith & Jones",
  
  // Relationships
  matters: ["matter_id_1", "matter_id_2"],
  
  // Billing
  billingInfo: {
    paymentTerms: "net30",
    billingEmail: "billing@acme.com",
    taxId: "12-3456789"
  },
  
  // Metadata
  tags: ["tech", " recurring", "enterprise"],
  customFields: {},
  
  // Timestamps
  createdAt: ISODate("2024-01-15"),
  updatedAt: ISODate("2024-06-10"),
  
  // Digital Twin Metadata
  twinMetadata: {
    version: 3,
    lastSync: ISODate("2024-06-13"),
    syncSource: "hubspot",
    health: "healthy",
    relationships: {
      matterCount: 5,
      totalRevenue: 125000,
      lastMatterOpened: ISODate("2024-05-01")
    }
  }
}
```

**Twin Relationships:**
- 1 Client → Many Matters
- 1 Client → Many Documents (via matters)
- 1 Client → Many Calendar Events (via matters)

---

### 2. Matter Twin (Case)

Represents a legal matter or case.

```javascript
{
  // Identity
  matterId: "MAT-2024-00012",
  title: "Smith v. Acme - Breach of Contract",
  caseNumber: "2024-CV-1234",
  
  // Classification
  type: "litigation", // litigation | corporate | real_estate | ip | employment | family | criminal | bankruptcy | other
  status: "active", // intake | pending | active | on_hold | closed | archived
  priority: "high", // low | medium | high | urgent
  
  // Parties
  client: "client_twin_id",
  assignedTo: "attorney_user_id",
  
  parties: [
    {
      name: "John Smith",
      type: "plaintiff",
      counsel: "Public Interest Law Group"
    },
    {
      name: "Acme Corporation",
      type: "defendant"
    }
  ],
  
  // Court Information
  court: {
    name: "Superior Court of California, County of San Francisco",
    jurisdiction: "California State",
    caseNumber: "2024-CV-1234"
  },
  opposingCounsel: {
    name: "Jane Doe",
    firm: "Doe & Associates",
    email: "jane@doelaw.com",
    phone: "+1-555-0199"
  },
  
  // Description
  description: "Breach of contract dispute regarding software licensing agreement...",
  
  // Milestones
  milestones: [
    {
      title: "Discovery Deadline",
      description: "Complete all discovery requests",
      dueDate: ISODate("2024-06-15"),
      status: "pending", // pending | in_progress | completed | overdue
      completedAt: null
    },
    {
      title: "Motion Hearing",
      description: "Summary judgment motion hearing",
      dueDate: ISODate("2024-07-20"),
      status: "pending"
    }
  ],
  
  // Time Tracking
  timeEntries: [
    {
      attorney: "attorney_id",
      date: ISODate("2024-06-10"),
      hours: 2.5,
      description: "Reviewed contract documents and prepared summary",
      billingRate: 450,
      billed: false
    }
  ],
  
  // Documents
  documents: ["document_id_1", "document_id_2"],
  
  // Expenses
  expenses: [
    {
      date: ISODate("2024-06-01"),
      description: "Court filing fee",
      amount: 435,
      category: "filing",
      receipt: "receipt_id",
      billed: false
    }
  ],
  
  // Billing
  billingType: "hourly", // hourly | flat | contingency | pro_bono
  billingRate: 450,
  flatFee: null,
  estimatedHours: 100,
  budget: 50000,
  
  // Dates
  openedAt: ISODate("2024-02-15"),
  closedAt: null,
  createdAt: ISODate("2024-02-15"),
  updatedAt: ISODate("2024-06-10"),
  
  // Digital Twin Metadata
  twinMetadata: {
    version: 5,
    lastSync: ISODate("2024-06-13"),
    syncSource: null,
    health: "healthy",
    relationships: {
      documentCount: 12,
      timeHoursTotal: 45.5,
      expensesTotal: 1245,
      unbilledTotal: 20925,
      daysOpen: 119
    }
  }
}
```

---

### 3. Document Twin

Represents legal documents (contracts, briefs, motions, etc.).

```javascript
{
  // Identity
  documentId: "DOC-2024-00156",
  title: "Service Agreement - Final v2",
  type: "contract", // contract | brief | motion | pleading | correspondence | evidence | internal | other
  
  // Relationships
  case: "matter_twin_id",
  parentDocument: "document_id_original", // for versions
  
  // File Information
  originalName: "Service_Agreement_Final_v2.pdf",
  filePath: "/documents/2024/06/DOC-2024-00156.pdf",
  fileSize: 245760, // bytes
  mimeType: "application/pdf",
  hash: "sha256:abc123...",
  version: 2,
  
  // Metadata
  tags: ["contract", "final", "reviewed"],
  metadata: {
    pages: 15,
    wordCount: 4500,
    signatories: ["John Smith", "Jane Doe"],
    effectiveDate: ISODate("2024-07-01")
  },
  
  // Archive
  archived: false,
  archivedAt: null,
  archivedBy: null,
  
  // Audit
  uploadedBy: "user_id",
  createdAt: ISODate("2024-06-10"),
  updatedAt: ISODate("2024-06-10"),
  
  // Digital Twin Metadata
  twinMetadata: {
    version: 2,
    lastSync: null,
    health: "healthy",
    relationships: {
      caseTitle: "Smith v. Acme - Breach of Contract",
      signedBy: ["Jane Doe"],
      expirationDate: ISODate("2025-07-01")
    }
  }
}
```

---

### 4. Calendar Twin

Represents calendar events (court dates, deadlines, meetings, etc.).

```javascript
{
  // Identity
  calendarId: "CAL-2024-00892",
  
  // Event Details
  title: "Client Meeting - Contract Review",
  type: "meeting", // court_date | deadline | meeting | call | deposition | hearing | other
  
  // Time
  start: ISODate("2024-06-15T10:00:00Z"),
  end: ISODate("2024-06-15T11:30:00Z"),
  allDay: false,
  
  // Relationships
  case: "matter_twin_id",
  
  // Location
  location: "Conference Room A",
  description: "Review and finalize service agreement terms",
  
  // Attendees
  attendees: ["user_id_1", "user_id_2", "client_contact_id"],
  
  // Reminders
  reminders: [
    {
      time: ISODate("2024-06-15T09:00:00Z"),
      type: "email",
      sent: true,
      sentAt: ISODate("2024-06-14T09:00:00Z")
    },
    {
      time: ISODate("2024-06-15T08:00:00Z"),
      type: "notification",
      sent: false
    }
  ],
  
  // Recurrence
  recurring: {
    frequency: "weekly", // daily | weekly | monthly | yearly
    interval: 1,
    endDate: ISODate("2024-08-31")
  },
  
  // Appearance
  color: "#3B82F6",
  
  // Audit
  createdBy: "user_id",
  createdAt: ISODate("2024-06-01"),
  updatedAt: ISODate("2024-06-10"),
  
  // Digital Twin Metadata
  twinMetadata: {
    version: 1,
    lastSync: null,
    health: "healthy",
    relationships: {
      matterTitle: "Smith v. Acme - Breach of Contract",
      attendeeCount: 3,
      isExternal: true
    }
  }
}
```

---

## Twin Relationships Diagram

```
┌─────────────┐
│   Client    │ 1
│   Twin      │──────────┬───────────────────┐
└─────────────┘          │                   │
                         │ N                  │ N
                         ▼                   ▼
                  ┌─────────────┐     ┌─────────────┐
                  │   Matter    │────▶│  Document   │
                  │   Twin      │ 1,N │   Twin      │
                  └─────────────┘     └─────────────┘
                         │
                         │ N
                         ▼
                  ┌─────────────┐
                  │  Calendar   │
                  │   Twin      │
                  └─────────────┘
```

---

## Cross-References

### Client → Matter
```javascript
// Get client with all matters
db.clienttwins.aggregate([
  { $match: { clientId: "CLI-2024-00001" } },
  { $lookup: {
      from: "mattertwins",
      localField: "matters",
      foreignField: "_id",
      as: "matterDetails"
  }}
])
```

### Matter → Client
```javascript
// Get matter with client info
db.mattertwins.aggregate([
  { $match: { matterId: "MAT-2024-00012" } },
  { $lookup: {
      from: "clienttwins",
      localField: "client",
      foreignField: "_id",
      as: "clientInfo"
  }}
])
```

---

## Twin Health Metrics

Each twin tracks health indicators:

```javascript
twinMetadata: {
  version: 3,
  lastSync: ISODate(),
  syncSource: "hubspot", // null if not synced
  health: "healthy", // healthy | warning | critical
  relationships: {
    // Type-specific metrics
  }
}
```

### Health Thresholds

| Status | Condition |
|--------|-----------|
| healthy | All data valid, recent sync, no warnings |
| warning | Sync delayed > 24h, or minor data issues |
| critical | Sync failed, or major data inconsistencies |
