# Dental OS - Integration Specification

**Version:** 1.0  
**Date:** June 14, 2026  
**Status:** Ready for Implementation

---

## 1. Overview

### What is Dental OS?

Dental OS connects the SmileCraft Dental Clinic story to the RTNM ecosystem:

| Story Time | Event | RTMN Services |
|------------|-------|--------------|
| 6:00 AM | Twin predictions | RisaCare Health Memory |
| 7:00 AM | Patient reminder | Genie Memory, RisaCare |
| 11:30 AM | QR scan | RABTUL Auth, CorpID |
| 11:32 AM | Consultation | Patient Twin, HOJAI Clinic AI |
| 11:40 AM | Scan analysis | HOJAI Clinic AI |
| 1:00 PM | Inventory | Nexha ProcurementOS |
| 2:00 PM | Staff ops | CorpPerks |
| 4:00 PM | Marketing | AdBazaar, BuzzLocal |
| 7:00 PM | Expansion | SUTAR GoalOS |

---

## 2. Patient Side Integration

### 2.1 REZ Consumer App - Dental Page

**File:** `companies/REZ-Consumer/rez-app/app/healthcare/dental.tsx`

| Feature | Implementation |
|---------|---------------|
| Dentist search | API: `/stores?category=healthcare&type=doctor&specialty=dentist` |
| Service filter | Filter by metadata.services |
| Booking | API: `/consultations/book` |

### 2.2 Genie Memory - Health Context

**Service:** `genie-memory-service` (4703)

| Memory Type | Usage |
|-------------|-------|
| Dental history | Recall last visit, treatments |
| Preferences | Preferred dentist, time slots |
| Relationships | Dentist connections |

### 2.3 Genie Briefing - Health Reminders

**Service:** `genie-briefing-service` (4706)

```typescript
// Reminder for dental checkup
{
  type: "health_reminder",
  category: "dental",
  title: "Dental Checkup Due",
  message: "It's been 14 months since your last dental visit",
  action: {
    type: "book_appointment",
    service: "dental"
  }
}
```

---

## 3. Clinic Side Integration

### 3.1 RisaCare - Healthcare OS

**Location:** `companies/RisaCare/`

| Service | Purpose | Port |
|---------|---------|------|
| Patient Twin | Patient demographics, history | 8643 |
| Human Twin | Personal health twin | - |
| Health Memory | Long-term memory | - |
| Booking | Appointment scheduling | - |
| Insurance | Coverage verification | 8647 |
| AI Scribe | Clinical documentation | - |
| RCM | Revenue cycle | - |

### 3.2 RisaCare Patient Twin Extension

```typescript
interface DentalTwin {
  patientId: string;
  dentalHistory: {
    lastVisit: Date;
    treatments: Treatment[];
    conditions: DentalCondition[];
    allergies: string[];
  };
  oralHealth: {
    cavityRisk: "low" | "medium" | "high";
    gumHealth: "healthy" | "mild" | "moderate" | "severe";
    lastXRay: Date;
  };
  preferences: {
    preferredDentist?: string;
    preferredTimes: string[];
    anxiety: boolean;
  };
}
```

### 3.3 HOJAI Clinic AI - Clinical Support

**Service:** `HOJAI-CLINIC-AI/src/`

| Module | Purpose |
|--------|---------|
| AI Scribe | SOAP notes from conversation |
| Ambient Audio | Voice capture |
| Diagnosis | ICD-10 suggestions |
| Treatment | CPT code suggestions |

### 3.4 CorpPerks - Staff Management

**Location:** `companies/CorpPerks/`

| Feature | Purpose |
|---------|---------|
| Payroll | Staff salary processing |
| Attendance | Check-in/out tracking |
| Leave | Leave management |
| Training | Staff training modules |

---

## 4. Network Side Integration

### 4.1 Nexha ProcurementOS

**Service:** `Nexha/procurement-os/` (4320)

```typescript
// Auto-reorder dental supplies
interface DentalSupply {
  category: "implant" | "anesthetic" | "whitening" | "surgical";
  sku: string;
  currentStock: number;
  reorderPoint: number;
  suppliers: Supplier[];
}

// Procurement flow
1. Inventory Twin detects low stock
2. Create RFQ via ProcurementOS
3. Suppliers respond with quotes
4. Negotiation Engine negotiates
5. Contract generated
6. Order placed
7. Delivery tracked
```

### 4.2 AdBazaar - Marketing

**Location:** `companies/AdBazaar/`

| Campaign Type | Purpose |
|--------------|--------|
| Local discovery | BuzzLocal: "dentist near me" |
| Retargeting | Previous patients |
| New patient | Cosmetic services |
| Seasonal | Teeth whitening deals |

### 4.3 BuzzLocal - Local Discovery

**Service:** `Axom/buzzlocal-services/` (4000-4027)

```typescript
// Local dental search
{
  query: "dentist in Indiranagar",
  filters: {
    specialty: "dental",
    rating: 4.5,
    distance: 5 // km
  }
}
```

### 4.4 RABTUL - Payments

**Location:** `companies/RABTUL-Technologies/`

| Service | Purpose |
|---------|---------|
| Auth (4002) | Patient identity |
| Payment (4001) | Treatment payments |
| Wallet (4004) | Clinic wallet |
| Notification (4005) | SMS/Email |

---

## 5. Intelligence Side Integration

### 5.1 MemoryOS - Personal AI Memory

**Service:** `genie-memory-service` (4703)

```typescript
// Store dental memory
POST /api/memories
{
  corpId: "IND-xxx",
  type: "episodic",
  category: "dental",
  content: "Root canal treatment completed",
  entities: ["dr_meera", "smilecraft"],
  timestamp: Date.now()
}
```

### 5.2 Patient Twin - Health Records

**Service:** `risacare-health-memory/`

```typescript
// Patient dental context
GET /api/patient/:id/dental-context
{
  history: [...],
  riskFactors: [...],
  nextAppointment: {...},
  recommendations: [...]
}
```

### 5.3 Business Copilot - Clinic Intelligence

**Service:** `core/business-copilot` (4002)

```typescript
// Natural language queries
"Show me today's appointments"
"What is my revenue this month?"
"Which patients are overdue for follow-up?"
```

### 5.4 SUTAR GoalOS - Expansion

**Service:** `hojai-goal-os` (4242)

```typescript
// "Open 20 clinics" goal decomposition
POST /api/goals
{
  title: "Open 20 Dental Clinics",
  priority: "critical",
  owner: "dr_meera",
  subGoals: [
    { title: "Find locations", agent: "risnaestate" },
    { title: "Hire staff", agent: "corpperks" },
    { title: "Equipment suppliers", agent: "nexha" },
    { title: "Marketing setup", agent: "adbazaar" },
    { title: "Financial model", agent: "ridza" }
  ]
}
```

---

## 6. Integration Flows

### 6.1 Patient Booking Flow

```
Karim (7:00 AM)
  │
  ├── Genie Memory: Check last dental visit
  │
  ├── RisaCare: Find available dentists
  │
  ├── BuzzLocal: Verify clinic location
  │
  ├── REZ-Consumer: Show dentist cards
  │
  └── Booking: POST /consultations/book
        │
        └── RisaCare: Schedule appointment
              │
              └── Genie Briefing: Confirm booking
```

### 6.2 Clinic Operations Flow

```
Dr. Meera (8:00 AM)
  │
  ├── Genie Briefing: Morning briefing
  │     - Appointments: 68
  │     - Expected revenue: ₹1.8L
  │     - Follow-ups due: 11
  │
  ├── RisaCare: View day's schedule
  │
  ├── CorpPerks: Staff attendance
  │
  └── Nexha: Check inventory levels
```

### 6.3 Inventory Auto-Reorder Flow

```
RisaCare Inventory Twin (1:00 PM)
  │
  ├── Detect: Implants < reorderPoint
  │
  ├── Nexha ProcurementOS: Create RFQ
  │
  ├── SUTAR Negotiation Engine: Negotiate
  │
  ├── SUTAR ContractOS: Generate PO
  │
  ├── RABTUL Payment: Process payment
  │
  └── Delivery: Track via Nexha
```

### 6.4 Expansion Flow

```
Dr. Meera: "Open 20 clinics" (7:00 PM)
  │
  ├── SUTAR GoalOS: Decompose goal
  │
  ├── RisnaEstate: Find locations
  │     └── 5 locations identified
  │
  ├── CorpPerks: Staffing plan
  │     └── 100+ hires needed
  │
  ├── Nexha: Equipment suppliers
  │     └── Bulk pricing negotiated
  │
  ├── AdBazaar: Marketing launch
  │     └── Campaign created
  │
  ├── RIDZA: Financial models
  │     └── ₹50Cr investment plan
  │
  └── AssetMind: Wealth planning
        └── Clinic profits → personal wealth
```

---

## 7. API Endpoints

### 7.1 Patient APIs

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/stores?specialty=dentist` | GET | Find dentists |
| `/consultations/book` | POST | Book appointment |
| `/stores/:id` | GET | Dentist profile |

### 7.2 Clinic APIs

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/appointments` | GET | Today's schedule |
| `/api/patients/:id` | GET | Patient context |
| `/api/inventory` | GET | Supply levels |
| `/api/insurance/verify` | POST | Coverage check |

### 7.3 Intelligence APIs

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/briefings/today` | GET | Morning briefing |
| `/api/goals` | POST | Create expansion goal |
| `/api/memories/dental` | GET | Dental history |

---

## 8. Port Registry

| Service | Port | Purpose |
|---------|------|---------|
| RisaCare Gateway | 4700 | Healthcare OS entry |
| Patient Twin | 8643 | Patient records |
| Insurance Twin | 8647 | Insurance verification |
| Genie Memory | 4703 | Personal memory |
| Genie Briefing | 4706 | Daily briefings |
| Nexha Gateway | 5002 | Commerce network |
| ProcurementOS | 4320 | B2B marketplace |
| AdBazaar | 4007 | Marketing |
| BuzzLocal | 4000 | Local discovery |
| RABTUL Auth | 4002 | Identity |
| Business Copilot | 4002 | AI assistant |
| SUTAR GoalOS | 4242 | Goal decomposition |

---

## 9. Implementation Checklist

### Phase 1: Patient Side
- [x] REZ Consumer dental page (1282 lines)
- [x] Dentist search API
- [x] Booking flow
- [ ] Genie dental context
- [ ] Dental reminders

### Phase 2: Clinic Side
- [x] RisaCare patient management
- [x] HOJAI Clinic AI
- [x] CorpPerks HR
- [ ] Dental Twin extension
- [ ] Inventory Twin

### Phase 3: Network Side
- [x] Nexha procurement
- [x] AdBazaar marketing
- [x] BuzzLocal discovery
- [ ] Dental catalog
- [ ] Supplier network

### Phase 4: Intelligence
- [x] MemoryOS
- [x] Patient Twin
- [x] Business Copilot
- [x] SUTAR GoalOS
- [ ] Multi-agent orchestrator

---

## 10. Quick Start

```bash
# Start services
cd companies/RisaCare && npm run dev
cd companies/hojai-ai/HOJAI-CLINIC-AI && npm run dev
cd companies/Nexha && pnpm dev:procurement

# Book dentist
curl -X POST /api/consultations/book \
  -d '{"storeId": "...", "serviceType": "dental_consultation"}'

# Create expansion goal
curl -X POST /api/goals \
  -d '{"title": "Open 20 Clinics", "priority": "critical"}'
```

---

**Document Version:** 1.0  
**Last Updated:** June 14, 2026  
**Status:** Ready for Implementation
