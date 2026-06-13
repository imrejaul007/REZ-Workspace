# Healthcare OS Integration Specification

**Version:** 1.0.0  
**Last Updated:** 2026-06-12  
**Industry:** Healthcare

---

## Executive Summary

The Healthcare OS Integration Specification defines the technical architecture for connecting RTMN's healthcare products with TwinOS, enabling real-time digital twins of patients, doctors, staff, facilities, and insurance entities. The integration creates a unified data layer where HOJAI Clinic AI serves as the primary intelligence engine, feeding data to TwinOS while consuming patient insights for clinical decision support.

**Key Integration Point:** HOJAI Clinic AI ↔ TwinOS  
**Data Flow Direction:** Bidirectional - AI produces clinical insights, TwinOS orchestrates patient data  
**Primary Protocol:** REST API with HL7 FHIR R4 for clinical data exchange  
**Authentication:** OAuth 2.0 with SMART on FHIR for clinical systems

---

## Product Capability Matrix

### 1. HOJAI Clinic AI

| Attribute | Value |
|-----------|-------|
| **Port** | `8643` |
| **Capabilities** | Clinical decision support, diagnosis assistance, treatment recommendations, drug interaction checking, triage, symptom analysis |
| **Data Produced** | AI diagnoses, treatment plans, clinical notes, risk scores, flagged cases |
| **Data Needed** | Patient Twin (history, symptoms), Doctor Twin (specialty, preferences), Facility Twin (capabilities) |
| **TwinOS Role** | PRIMARY PRODUCER - clinical intelligence engine |

### 2. RisaCare B2B Enterprise

| Attribute | Value |
|-----------|-------|
| **Port** | `8644` |
| **Capabilities** | Multi-facility management, enterprise reporting, resource allocation, compliance tracking, audit trails |
| **Data Produced** | Facility metrics, utilization rates, compliance reports, staff assignments |
| **Data Needed** | Facility Twin, Staff Twin, Patient Twin |

### 3. MyRisa

| Attribute | Value |
|-----------|-------|
| **Port** | `8645` |
| **Capabilities** | Patient portal, appointment booking, teleconsult, health records, medication reminders, lab results |
| **Data Produced** | Appointments, teleconsult sessions, patient feedback, health data uploads |
| **Data Needed** | Patient Twin, Doctor Twin, Appointment Twin |

### 4. Teleconsult

| Attribute | Value |
|-----------|-------|
| **Port** | `8646` |
| **Capabilities** | Video consultations, screen sharing, e-prescribing, virtual waiting room, session recording |
| **Data Produced** | Consultation records, prescriptions, session duration, technical metrics |
| **Data Needed** | Patient Twin, Doctor Twin, Facility Twin |

### 5. Insurance Aggregator

| Attribute | Value |
|-----------|-------|
| **Port** | `8647` |
| **Capabilities** | Insurance comparison, coverage verification, claim submission, pre-authorization, provider network lookup |
| **Data Produced** | Coverage checks, claim submissions, insurance claims, provider data |
| **Data Needed** | Patient Twin (insurance info), Insurance Twin, Facility Twin |

### 6. RCM Service

| Attribute | Value |
|-----------|-------|
| **Port** | `8648` |
| **Capabilities** | Revenue cycle management, claims processing, denial management, payment posting, reporting |
| **Data Produced** | Claims, payments, denials, AR reports, reimbursement data |
| **Data Needed** | Patient Twin, Insurance Twin, Appointment Twin |

### 7. FHIR Service

| Attribute | Value |
|-----------|-------|
| **Port** | `8649` |
| **Capabilities** | FHIR R4 compliant data exchange, HL7 compatibility, medical records export, interoperability |
| **Data Produced** | FHIR resources, patient bundles, clinical documents |
| **Data Needed** | All twins - FHIR export layer |

### 8. Healthcare CRM Service

| Attribute | Value |
|-----------|-------|
| **Port** | `TBD` |
| **Company** | REZ Merchant |
| **Capabilities** | Customer profiles, segmentation, campaigns, visit tracking |
| **Data Produced** | Customer segments, campaign results, churn risk |
| **Data Needed** | Customer Twin, Transaction Twin |
| **TwinOS Role** | CUSTOMER INTELLIGENCE |

---

## Digital Twin Definitions

### Patient Twin

**TwinOS Entity ID:** `twin.healthcare.patient.{patient_id}`

**Attributes:**
```json
{
  "patient_id": "string (UUID)",
  "demographics": {
    "name": {
      "given": ["string"],
      "family": "string",
      "prefix": "string|null",
      "suffix": "string|null"
    },
    "birth_date": "ISO8601 date",
    "gender": "male|female|other|unknown",
    "contact": {
      "phone": "string",
      "email": "string",
      "address": {
        "line1": "string",
        "line2": "string|null",
        "city": "string",
        "state": "string",
        "postal_code": "string",
        "country": "string"
      }
    },
    "emergency_contact": {
      "name": "string",
      "relationship": "string",
      "phone": "string"
    }
  },
  "insurance": {
    "primary": {
      "insurance_id": "string",
      "provider": "string",
      "policy_number": "string",
      "group_number": "string",
      "coverage_type": "string",
      "effective_date": "ISO8601 date",
      "expiration_date": "ISO8601 date"
    },
    "secondary": "object|null",
    "copay": "number",
    "deductible": {
      "individual": "number",
      "met": "number"
    }
  },
  "medical_history": {
    "conditions": [
      {
        "code": "ICD10 code",
        "description": "string",
        "diagnosed_date": "ISO8601 date",
        "status": "active|resolved|chronic"
      }
    ],
    "allergies": [
      {
        "code": "string",
        "substance": "string",
        "reaction": "string",
        "severity": "mild|moderate|severe"
      }
    ],
    "medications": [
      {
        "code": "RxNorm code",
        "name": "string",
        "dosage": "string",
        "frequency": "string",
        "prescribed_by": "string (doctor_id)",
        "start_date": "ISO8601 date",
        "end_date": "ISO8601 date|null"
      }
    ],
    "surgeries": [
      {
        "procedure_code": "CPT code",
        "description": "string",
        "date": "ISO8601 date",
        "facility": "string"
      }
    ],
    "family_history": ["string"]
  },
  "visits": {
    "upcoming": [
      {
        "appointment_id": "string",
        "doctor_id": "string",
        "facility_id": "string",
        "scheduled_at": "ISO8601 datetime",
        "type": "string",
        "reason": "string"
      }
    ],
    "past": [
      {
        "appointment_id": "string",
        "doctor_id": "string",
        "facility_id": "string",
        "date": "ISO8601 datetime",
        "type": "string",
        "diagnosis": ["string"],
        "notes": "string"
      }
    ]
  },
  "ai_insights": {
    "risk_scores": {
      "readmission": "number (0-100)",
      "chronic_condition": "number (0-100)",
      "no_show": "number (0-100)"
    },
    "recommended_actions": ["string"],
    "flagged_conditions": ["string"],
    "last_assessment": "ISO8601 datetime"
  },
  "preferences": {
    "communication": {
      "preferred_channel": "email|phone|sms|app",
      "language": "string",
      "accessibility_needs": ["string"]
    },
    "care": {
      "preferred_facility_id": "string|null",
      "preferred_doctor_id": "string|null",
      "second_opinion_preference": "boolean"
    }
  },
  "consent": {
    "treatment": "boolean",
    "data_sharing": "boolean",
    "teleconsult": "boolean",
    "research": "boolean",
    "marketing": "boolean"
  }
}
```

**Relationships:**
- `ENROLLED_IN` → Insurance Twin
- `SEES` → Doctor Twin (1:many)
- `VISITS` → Facility Twin (1:many)
- `HAS_APPOINTMENT` → Appointment Twin (1:many)
- `AUTHORIZED_BY` → Consent Twin

**Managing Agent:** `agent.patient_intelligence`

### Doctor Twin

**TwinOS Entity ID:** `twin.healthcare.doctor.{doctor_id}`

**Attributes:**
```json
{
  "doctor_id": "string (UUID)",
  "profile": {
    "name": {
      "given": ["string"],
      "family": "string",
      "prefix": "string",
      "suffix": "string"
    },
    "specialties": ["string"],
    "subspecialties": ["string"],
    "languages": ["string"],
    "gender": "string"
  },
  "credentials": {
    "license_number": "string",
    "license_state": "string",
    "npi": "string",
    "dea": "string|null",
    "board_certifications": ["string"],
    "education": [
      {
        "degree": "string",
        "institution": "string",
        "year": "number"
      }
    ]
  },
  "facilities": [
    {
      "facility_id": "string",
      "privileges": "active|limited|pending",
      "admitting_privileges": "boolean"
    }
  ],
  "schedule": {
    "availability": [
      {
        "facility_id": "string",
        "day_of_week": "number (0-6)",
        "start_time": "string (HH:MM)",
        "end_time": "string (HH:MM)",
        "slot_duration_minutes": "number"
      }
    ],
    "blocked_time": [
      {
        "start": "ISO8601 datetime",
        "end": "ISO8601 datetime",
        "reason": "string"
      }
    ]
  },
  "performance": {
    "avg_consult_time_minutes": "number",
    "patients_today": "number",
    "patients_this_week": "number",
    "avg_rating": "number (1-5)",
    "review_count": "number",
    "no_show_rate": "number (percentage)"
  },
  "ai_assist": {
    "enabled": "boolean",
    "suggestion_accept_rate": "number",
    "common_diagnoses": ["string"],
    "treatment_patterns": ["string"]
  },
  "insurances": ["string (insurance_ids)"],
  "status": {
    "current": "available|in_session|break|off_duty",
    "current_patient_id": "string|null",
    "session_started_at": "ISO8601 datetime|null"
  }
}
```

**Relationships:**
- `WORKS_AT` → Facility Twin (1:many)
- `SEES` → Patient Twin (1:many)
- `AFFILIATED_WITH` → Insurance Twin (1:many)

**Managing Agent:** `agent.doctor_intelligence`

### Staff Twin

**TwinOS Entity ID:** `twin.healthcare.staff.{staff_id}`

**Attributes:**
```json
{
  "staff_id": "string (UUID)",
  "profile": {
    "name": "string",
    "role": "nurse|receptionist|technician|administrator|phlebotomist|therapist",
    "department": "string",
    "facility_id": "string"
  },
  "credentials": {
    "license_number": "string|null",
    "certifications": ["string"],
    "training_completed": ["string"]
  },
  "schedule": {
    "shifts": [
      {
        "date": "ISO8601 date",
        "start": "string (HH:MM)",
        "end": "string (HH:MM)",
        "type": "regular|overtime|on_call"
      }
    ],
    "pto_balance": "number (hours)"
  },
  "performance": {
    "tasks_completed_today": "number",
    "avg_task_time": "number (minutes)",
    "patient_satisfaction": "number (1-5)"
  },
  "status": {
    "current": "clocked_in|on_break|clocked_out",
    "current_task": "string|null",
    "location": "string"
  }
}
```

**Relationships:**
- `WORKS_AT` → Facility Twin
- `ASSISTS` → Doctor Twin
- `SERVICES` → Patient Twin

**Managing Agent:** `agent.staff_management`

### Facility Twin

**TwinOS Entity ID:** `twin.healthcare.facility.{facility_id}`

**Attributes:**
```json
{
  "facility_id": "string (UUID)",
  "profile": {
    "name": "string",
    "type": "clinic|hospital|urgent_care|lab|imaging|pharmacy",
    "address": {
      "line1": "string",
      "city": "string",
      "state": "string",
      "postal_code": "string",
      "country": "string",
      "coordinates": { "lat": "number", "lng": "number" }
    },
    "contact": {
      "phone": "string",
      "email": "string"
    }
  },
  "capabilities": {
    "specialties": ["string"],
    "services": ["string"],
    "equipment": ["string"],
    "languages_supported": ["string"]
  },
  "hours": {
    "regular": {
      "monday": { "open": "string (HH:MM)", "close": "string (HH:MM)" },
      "tuesday": { "open": "string (HH:MM)", "close": "string (HH:MM)" },
      "wednesday": { "open": "string (HH:MM)", "close": "string (HH:MM)" },
      "thursday": { "open": "string (HH:MM)", "close": "string (HH:MM)" },
      "friday": { "open": "string (HH:MM)", "close": "string (HH:MM)" },
      "saturday": { "open": "string (HH:MM)", "close": "string (HH:MM)" },
      "sunday": { "open": "string (HH:MM)", "close": "string (HH:MM)" }
    },
    "holidays": ["ISO8601 date"]
  },
  "staffing": {
    "doctors": [
      {
        "doctor_id": "string",
        "specialty": "string",
        "available_today": "boolean"
      }
    ],
    "staff": [
      {
        "staff_id": "string",
        "role": "string",
        "on_duty": "boolean"
      }
    ]
  },
  "capacity": {
    "exam_rooms": "number",
    "in_use": "number",
    "waiting_room_capacity": "number",
    "current_wait": "number (minutes)"
  },
  "insurance_networks": ["string (insurance_ids)"],
  "performance": {
    "appointments_today": "number",
    "avg_wait_time_minutes": "number",
    "avg_visit_duration_minutes": "number",
    "patient_satisfaction": "number (1-5)"
  }
}
```

**Relationships:**
- `EMPLOYS` → Doctor Twin (1:many)
- `EMPLOYS` → Staff Twin (1:many)
- `PARTICIPATES_IN` → Insurance Twin (1:many)
- `HOSTS` → Patient Twin (visits)

**Managing Agent:** `agent.facility_management`

### Insurance Twin

**TwinOS Entity ID:** `twin.healthcare.insurance.{insurance_id}`

**Attributes:**
```json
{
  "insurance_id": "string (UUID)",
  "provider": {
    "name": "string",
    "code": "string",
    "logo_url": "string"
  },
  "plans": [
    {
      "plan_id": "string",
      "name": "string",
      "type": "hmo|ppo|epo|pos|hdhp",
      "metal_level": "bronze|silver|gold|platinum"
    }
  ],
  "coverage": {
    "in_network": {
      "primary_care": "number (percentage)",
      "specialist": "number (percentage)",
      "emergency": "number (percentage)",
      "preventive": "number (percentage)",
      "mental_health": "number (percentage)"
    },
    "out_of_network": {
      "reimbursement": "number (percentage)"
    },
    "deductibles": {
      "individual": "number",
      "family": "number"
    },
    "out_of_pocket_max": {
      "individual": "number",
      "family": "number"
    }
  },
  "prior_auth_requirements": [
    {
      "service_type": "string",
      "codes": ["string"],
      "turnaround_hours": "number"
    }
  ],
  "facilities": ["string (facility_ids)"],
  "doctors": ["string (doctor_ids)"]
}
```

**Relationships:**
- `OFFERS` → Plan Twin
- `AFFILIATED_WITH` → Facility Twin (1:many)
- `AFFILIATED_WITH` → Doctor Twin (1:many)
- `ENROLLED_BY` → Patient Twin (1:many)

**Managing Agent:** `agent.insurance_management`

---

## Integration Flows

### Flow 1: Patient Visit Lifecycle

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   MyRisa   │────▶│   TwinOS    │────▶│  HOJAI AI   │────▶│   FHIR      │
│  (Book)    │     │(Patient Twin)│     │ (Clinical)  │     │  Service    │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                           │                    │                    │
                           ▼                    ▼                    ▼
                    ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
                    │  RisaCare   │     │    RCM      │     │  Insurance  │
                    │  Enterprise │     │  Service    │     │ Aggregator  │
                    └─────────────┘     └─────────────┘     └─────────────┘
```

**API Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/patients` | Create patient |
| GET | `/api/v1/patients/{patient_id}` | Get patient |
| PATCH | `/api/v1/patients/{patient_id}` | Update patient |
| POST | `/api/v1/appointments` | Schedule appointment |
| GET | `/api/v1/appointments/{appointment_id}` | Get appointment |
| POST | `/api/v1/twins/patient` | Create Patient Twin |
| GET | `/api/v1/twins/patient/{patient_id}` | Get Patient Twin |
| PATCH | `/api/v1/twins/patient/{patient_id}` | Update Patient Twin |

**FHIR Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/fhir/Patient/{id}` | Get FHIR Patient |
| GET | `/fhir/Patient/{id}/$everything` | Get Patient Bundle |
| POST | `/fhir/Condition` | Create Condition |
| POST | `/fhir/Observation` | Create Observation |
| POST | `/fhir/Encounter` | Create Encounter |

### Flow 2: Clinical Decision Support

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Teleconsult│────▶│   TwinOS    │────▶│  HOJAI AI   │────▶│   Doctor    │
│  (Session)   │     │(Patient Twin)│     │ (Analysis)  │     │   Twin      │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

**API Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/ai/diagnosis` | Get AI diagnosis |
| POST | `/api/v1/ai/treatment-plan` | Generate treatment plan |
| POST | `/api/v1/ai/drug-check` | Check drug interactions |
| POST | `/api/v1/ai/triage` | Get triage recommendation |
| GET | `/api/v1/twins/patient/{patient_id}/ai-insights` | Get AI insights |

**Request/Response Example:**

```json
// POST /api/v1/ai/diagnosis
{
  "patient_id": "PAT-123",
  "symptoms": [
    { "code": "R50.9", "description": "Fever" },
    { "code": "R05", "description": "Cough" },
    { "code": "R07.9", "description": "Chest pain" }
  ],
  "duration_days": 3,
  "severity": "moderate",
  "include_differential": true
}

// Response
{
  "diagnoses": [
    {
      "condition": "Community Acquired Pneumonia",
      "icd10_code": "J18.9",
      "confidence": 0.87,
      "differential": false,
      "recommendations": [
        "Order chest X-ray",
        "Consider CBC, CMP, procalcitonin",
        "Initiate antibiotic therapy"
      ]
    }
  ],
  "differentials": [
    {
      "condition": "Viral Pneumonia",
      "icd10_code": "J12.9",
      "confidence": 0.65,
      "recommendations": ["Supportive care", "Rest", "Hydration"]
    }
  ],
  "urgency": "urgent",
  "references": ["UpToDate topic", "Clinical guidelines"]
}
```

### Flow 3: Insurance & RCM

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Insurance  │────▶│   TwinOS    │────▶│    RCM      │────▶│  Insurance  │
│ Aggregator  │     │(Insurance Twin)│   │  Service    │     │  Aggregator │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

**API Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/insurance/verify` | Verify coverage |
| POST | `/api/v1/insurance/prior-auth` | Request prior authorization |
| POST | `/api/v1/claims` | Submit claim |
| GET | `/api/v1/claims/{claim_id}` | Get claim status |
| GET | `/api/v1/twins/insurance/{insurance_id}` | Get Insurance Twin |

---

## Agent Architecture

### Agent Registry

| Agent ID | Type | Responsibilities |
|----------|------|------------------|
| `agent.patient_intelligence` | Clinical | Patient profiling, risk scoring, care gap identification |
| `agent.doctor_intelligence` | Clinical | Doctor matching, schedule optimization, performance tracking |
| `agent.facility_management` | Operations | Facility capacity, wait time management, resource allocation |
| `agent.insurance_management` | Financial | Coverage verification, prior auth, claims processing |
| `agent.clinical_ai` | Intelligence | Diagnosis assistance, treatment planning, drug checking |
| `agent.triage` | Clinical | Symptom analysis, urgency assessment, routing |
| `agent.revenue_cycle` | Financial | Claims management, denial handling, AR follow-up |
| `agent.consent_management` | Compliance | Consent tracking, HIPAA compliance, data sharing |
| `agent.twin_orchestrator` | TwinOS Core | Twin CRUD, relationship management, event distribution |
| `agent.healthcare_crm` | CRM | Patient engagement, retention campaigns, outreach, patient lifetime value |

### Agent Communication Patterns

**Pub/Sub Topics:**
- `healthcare.patient.checkin` - Patient arrival events
- `healthcare.appointment.scheduled` - New appointment events
- `healthcare.appointment.completed` - Visit completion
- `healthcare.ai.diagnosis` - AI diagnosis results
- `healthcare.insurance.verified` - Coverage verification
- `healthcare.claim.submitted` - Claim submission
- `healthcare.alert.urgent` - Urgent alerts
- `healthcare.consent.updated` - Consent changes

**FHIR Event Patterns:**
```json
{
  "resourceType": "Bundle",
  "type": "history",
  "entry": [
    {
      "resource": {
        "resourceType": "Encounter",
        "status": "finished",
        "subject": { "reference": "Patient/PAT-123" },
        "participant": [{ "individual": { "reference": "Practitioner/DOC-456" } }]
      }
    }
  ]
}
```

---

## Business Copilot Queries Supported

### Clinical Queries

| Query | Description | Example |
|-------|-------------|---------|
| `patient_summary` | Summarize patient history | "Summarize John Doe's medical history" |
| `drug_interactions` | Check drug interactions | "Any drug interactions with Smith's current meds?" |
| `diagnosis_assistance` | Get AI diagnosis | "What could be causing Smith's symptoms?" |
| `treatment_options` | Get treatment plans | "What are the treatment options for Smith's condition?" |
| `care_gaps` | Identify care gaps | "What preventive care is due for patient Smith?" |

### Operational Queries

| Query | Description | Example |
|-------|-------------|---------|
| `appointment_availability` | Check open slots | "When can Dr. Johnson see a new patient?" |
| `wait_time` | Current wait times | "What's the wait at the downtown clinic?" |
| `facility_capacity` | Check capacity | "Which facilities have availability today?" |
| `staff_scheduling` | Staff coverage | "Are we adequately staffed for tonight's shift?" |
| `patient_location` | Track patient | "Where is patient Smith in the facility?" |

### Financial Queries

| Query | Description | Example |
|-------|-------------|---------|
| `insurance_coverage` | Verify coverage | "Does Smith's insurance cover this procedure?" |
| `prior_auth_status` | Check auth status | "What's the status of Smith's prior auth?" |
| `claim_status` | Track claim | "Where is Smith's claim in processing?" |
| `ar_summary` | AR overview | "What's our AR over 30 days?" |
| `reimbursement_trend` | Revenue trends | "How are our reimbursements trending?" |

### Compliance Queries

| Query | Description | Example |
|-------|-------------|---------|
| `consent_status` | Check consents | "Does patient Smith have teleconsult consent?" |
| `hipaa_audit` | HIPAA report | "Show all data access for patient Smith this month" |
| `licensing_status` | License checks | "Are all our doctors' licenses current?" |
| `compliance_score` | Compliance metrics | "What's our current compliance score?" |

### Example Copilot Interactions

```python
# Example: Drug interaction check
{
  "query": "Check for drug interactions with patient's current medications",
  "agent": "agent.clinical_ai",
  "context": {
    "patient_id": "PAT-123",
    "new_medication": "Warfarin 5mg"
  },
  "response": {
    "interactions": [
      {
        "drug": "Aspirin 81mg",
        "severity": "major",
        "description": "Concurrent use increases bleeding risk",
        "recommendation": "Consider alternative or monitor INR closely"
      }
    ],
    "contraindications": [],
    "warnings": [
      {
        "drug": "Ibuprofen",
        "severity": "moderate",
        "description": "May enhance anticoagulant effect"
      }
    ]
  }
}

# Example: Care gap identification
{
  "query": "What preventive care is due for patient PAT-123?",
  "agent": "agent.patient_intelligence",
  "response": {
    "care_gaps": [
      {
        "category": "screening",
        "type": "mammogram",
        "due_date": "2024-03-15",
        "last_completed": "2022-03-20",
        "recommendation": "Schedule mammogram screening"
      },
      {
        "category": "immunization",
        "type": "flu_vaccine",
        "due_date": "2024-10-01",
        "last_completed": "2023-10-15",
        "recommendation": "Administer flu vaccine"
      }
    ],
    "chronic_care": [
      {
        "condition": "Type 2 Diabetes",
        "measure": "HbA1c",
        "last_result": "7.2%",
        "goal": "<7%",
        "recommendation": "Review diabetes management plan"
      }
    ]
  }
}
```

---

## Economic Integration

### Payment Flows

| Flow | Description | Integration |
|------|-------------|-------------|
| Copay Collection | Patient copay at visit | REZ POS → Patient Twin → RCM |
| Insurance Billing | Claims submission | RCM → Insurance Aggregator → TwinOS |
| Payment Plans | Installment processing | RCM → Patient Twin |
| Self-Pay | Uninsured patients | REZ POS → RCM → TwinOS |

**API Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/payments/copay` | Collect copay |
| POST | `/api/v1/payments/payment-plan` | Create payment plan |
| GET | `/api/v1/patients/{patient_id}/balance` | Get patient balance |
| POST | `/api/v1/claims` | Submit claim |

### Insurance Integration

| Provider Type | Integration Method |
|--------------|-------------------|
| Commercial | Real-time eligibility via 270/271 |
| Medicare | Direct connection to CMS |
| Medicaid | State-specific connections |
| Self-Pay | Financial assistance screening |

**Coverage Verification Response:**
```json
{
  "verification_id": "VER-2024-001234",
  "patient_id": "PAT-123",
  "insurance_id": "INS-456",
  "effective_date": "2024-01-01",
  "coverage": {
    "primary_care": { "copay": 25, "coinsurance": 20 },
    "specialist": { "copay": 50, "coinsurance": 30 },
    "urgent_care": { "copay": 75, "coinsurance": 30 },
    "emergency": { "copay": 250, "coinsurance": 30 }
  },
  "deductible": {
    "individual": 1500,
    "met": 750,
    "remaining": 750
  },
  "prior_auth_required": [
    { "service": "MRI", "codes": ["72148"] }
  ]
}
```

---

## Implementation Roadmap

### Week 1: Foundation & Compliance

**Objective:** Set up TwinOS with HIPAA-compliant infrastructure

| Task | Description | Owner | Deliverable |
|------|-------------|-------|-------------|
| 1.1 | Configure HIPAA-compliant TwinOS | DevOps | Secure tenant provisioned |
| 1.2 | Define twin schemas | Data Eng | FHIR-compatible schemas |
| 1.3 | Set up FHIR service | Backend | FHIR R4 server running |
| 1.4 | Configure SMART on FHIR auth | Security | OAuth 2.0 + SMART |
| 1.5 | Create audit logging | Compliance | HIPAA audit trail |
| 1.6 | Set up encryption | Security | TLS 1.3, AES-256 |
| 1.7 | Create test environment | DevOps | Isolated test environment |
| 1.8 | Document API contracts | API Team | FHIR-compliant specs |

**Acceptance Criteria:**
- HIPAA-compliant infrastructure
- FHIR R4 server operational
- SMART auth working
- Audit logging active

### Week 2: Patient & Doctor Twins

**Objective:** Implement core patient and doctor twins

| Task | Description | Owner | Deliverable |
|------|-------------|-------|-------------|
| 2.1 | Implement Patient Twin CRUD | Backend | Patient Twin API |
| 2.2 | Implement Doctor Twin CRUD | Backend | Doctor Twin API |
| 2.3 | Build medical history management | Backend | Conditions, allergies, meds |
| 2.4 | Create appointment integration | Backend | Appointment ↔ TwinOS |
| 2.5 | Build MyRisa integration | Backend | Patient portal ↔ TwinOS |
| 2.6 | Implement consent management | Backend | Consent tracking |
| 2.7 | Create WebSocket connections | Backend | Real-time updates |
| 2.8 | Build test scenarios | QA | Integration tests |

**Acceptance Criteria:**
- Patient Twin complete
- Doctor Twin complete
- FHIR export working
- Consent tracking active

### Week 3: Clinical AI Integration

**Objective:** Connect HOJAI Clinic AI to TwinOS

| Task | Description | Owner | Deliverable |
|------|-------------|-------|-------------|
| 3.1 | Implement AI diagnosis endpoint | ML Team | Diagnosis API |
| 3.2 | Build treatment planning | ML Team | Treatment API |
| 3.3 | Implement drug interaction checking | ML Team | Drug check API |
| 3.4 | Create triage endpoint | ML Team | Triage API |
| 3.5 | Build AI insights pipeline | Data Eng | Real-time insights |
| 3.6 | Implement Teleconsult integration | Backend | Video ↔ TwinOS |
| 3.7 | Deploy clinical_ai agent | ML Team | Agent operational |
| 3.8 | Build clinical decision workflow | Backend | Decision support flow |

**Acceptance Criteria:**
- AI diagnosis working
- Drug checking operational
- Teleconsult integrated
- Clinical workflow complete

### Week 4: Facility & Insurance Integration

**Objective:** Connect facility and insurance twins

| Task | Description | Owner | Deliverable |
|------|-------------|-------|-------------|
| 4.1 | Implement Facility Twin | Backend | Facility Twin API |
| 4.2 | Implement Insurance Twin | Backend | Insurance Twin API |
| 4.3 | Build RisaCare B2B integration | Backend | Enterprise ↔ TwinOS |
| 4.4 | Implement Insurance Aggregator | Backend | Insurance ↔ TwinOS |
| 4.5 | Build prior auth workflow | Backend | Prior auth process |
| 4.6 | Deploy facility_management agent | ML Team | Agent operational |
| 4.7 | Deploy insurance_management agent | ML Team | Agent operational |
| 4.8 | Build capacity management | Backend | Real-time capacity |

**Acceptance Criteria:**
- Facility Twin operational
- Insurance Twin operational
- Prior auth workflow working
- Capacity management active

### Week 5: RCM & Business Copilot

**Objective:** Implement RCM and enable queries

| Task | Description | Owner | Deliverable |
|------|-------------|-------|-------------|
| 5.1 | Implement RCM Service | Backend | Claims processing |
| 5.2 | Build claims submission | Backend | 837P submission |
| 5.3 | Implement denial management | Backend | Denial workflow |
| 5.4 | Deploy revenue_cycle agent | ML Team | Agent operational |
| 5.5 | Implement clinical query handlers | NLP Team | Clinical queries |
| 5.6 | Implement operational queries | NLP Team | Operational queries |
| 5.7 | Implement financial queries | NLP Team | Financial queries |
| 5.8 | User acceptance testing | QA | UAT completed |

**Acceptance Criteria:**
- RCM operational
- Claims processing working
- All documented queries functional
- UAT passed

### Week 6: Security Audit & Go-Live

**Objective:** Complete security audit and production deployment

| Task | Description | Owner | Deliverable |
|------|-------------|-------|-------------|
| 6.1 | Complete security audit | Security | Penetration testing |
| 6.2 | HIPAA compliance review | Compliance | Compliance certification |
| 6.3 | Performance testing | QA | Load testing |
| 6.4 | Disaster recovery test | DevOps | DR drill |
| 6.5 | Documentation | Tech Writing | All docs complete |
| 6.6 | Staff training | Product | Training materials |
| 6.7 | Go-live checklist | DevOps | Deployment verified |
| 6.8 | Production deployment | DevOps | Go-live |

**Acceptance Criteria:**
- Security audit clean
- HIPAA compliant
- Performance targets met
- DR tested
- Production deployed

---

## Appendix

### A. API Rate Limits

| Endpoint Category | Limit | Window |
|-------------------|-------|--------|
| Patient Operations | 1000 | per minute |
| AI Endpoints | 500 | per minute |
| FHIR Resources | 2000 | per minute |
| Business Copilot | 100 | per minute |
| WebSocket Connections | 500 | per tenant |

### B. Data Retention (HIPAA Compliant)

| Data Type | Retention Period |
|-----------|-----------------|
| Patient Records | 6 years after last encounter |
| Medical History | 6 years after last encounter |
| Financial Records | 6 years |
| Audit Logs | 6 years |
| Consent Forms | 6 years after revocation |
| PHI Backup | 6 years |

### C. Security Requirements (HIPAA)

- All API calls over TLS 1.3
- OAuth 2.0 with SMART on FHIR
- Role-based access control (RBAC)
- PHI encrypted at rest (AES-256)
- Minimum necessary access principle
- Comprehensive audit logging
- Annual risk assessments
- Business Associate Agreements (BAAs)

### D. Error Codes

| Code | Description |
|------|-------------|
| `PATIENT_NOT_FOUND` | Patient does not exist |
| `CONSENT_REQUIRED` | Required consent missing |
| `PRIOR_AUTH_REQUIRED` | Prior authorization needed |
| `COVERAGE_VERIFICATION_FAILED` | Insurance verification failed |
| `AI_DIAGNOSIS_UNCERTAIN` | Low confidence diagnosis |
| `DRUG_INTERACTION_CRITICAL` | Critical drug interaction |
| `APPOINTMENT_CONFLICT` | Slot not available |
| `AUTH_INVALID_TOKEN` | Invalid/expired token |

### E. FHIR Resource Mapping

| Twin Type | FHIR Resource |
|-----------|---------------|
| Patient Twin | Patient, Person |
| Doctor Twin | Practitioner |
| Staff Twin | Practitioner, PractitionerRole |
| Facility Twin | Organization, Location |
| Insurance Twin | Organization, Coverage |
| Appointment | Encounter, Appointment |
| Medical History | Condition, AllergyIntolerance, MedicationStatement |
| Observations | Observation, DiagnosticReport |

---

**Document Control:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-06-12 | RTMN Architecture Team | Initial specification |
