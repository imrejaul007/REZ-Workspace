# Healthcare & Clinics OS - Integration Specification

**Version:** 1.0  
**Date:** June 12, 2026  
**Status:** Ready for Implementation  

---

## 1. Industry Overview

### Industry Challenges

Healthcare and clinic operations face significant challenges in providing coordinated, patient-centric care:

- **Fragmented Patient Data**: Patient information is scattered across multiple systems (EMR, labs, pharmacies, insurance), leading to incomplete clinical pictures and potential medical errors
- **Poor Care Coordination**: No unified view of patient journey across providers, facilities, and care settings
- **Administrative Burden**: Doctors spend 40%+ of time on documentation and administrative tasks rather than patient care
- **Insurance Complexity**: Complex billing, prior authorizations, and claims management drain resources
- **Patient Engagement**: Limited tools for ongoing patient engagement between visits
- **Predictive Gap**: Wellness data from consumer apps never reaches clinical systems, missing preventive care opportunities

### Current Product Landscape

The RTNM ecosystem already possesses a comprehensive suite of healthcare products:

| Product | Company | Strength | Services |
|---------|---------|----------|----------|
| HOJAI Clinic AI | HOJAI AI | 5-star | Medical scribe, ambient documentation, clinical AI |
| RisaCare B2B Enterprise | RisaCare | 5-star | Hospital, clinic, lab management |
| MyRisa | RisaCare | 4-star | Personal wellbeing (7 domains) |
| Teleconsult | RisaCare | 4-star | Video telemedicine |
| Insurance Aggregator | RisaCare | 3-star | Health insurance marketplace |
| RCM Service | RisaCare | 3-star | Medical billing/coding |
| FHIR Service | RisaCare | 3-star | Healthcare interoperability |

### Integration Opportunity

By integrating these products through TwinOS (Patient Twin and Doctor Twin), we can:

- Create a unified 360-degree patient view combining clinical and wellness data
- Enable AI-powered clinical decision support across all touchpoints
- Automate administrative workflows to free doctors for patient care
- Predict health risks before they become critical
- Optimize revenue cycle through intelligent claims management

---

## 2. Product Capability Matrix

### 2.1 HOJAI Clinic AI

| Attribute | Details |
|-----------|---------|
| **Company** | HOJAI AI |
| **Core Capabilities** | Medical Scribe with real-time SOAP notes, Ambient documentation capture, AI-powered symptom assessment, Care plan generation, Clinical decision support, 7 AI healthcare employees |
| **Data Produced** | Clinical encounter notes, Diagnosis codes (ICD-10), Treatment plans, Prescriptions, Lab orders, Clinical summaries, Follow-up recommendations |
| **Data Needed** | Patient demographics, Medical history, Current medications, Allergies, Lab results, Vital signs, Insurance information |
| **Current Integration** | Partial - Connected to MemoryOS for patient context, needs TwinOS integration |

### 2.2 RisaCare B2B Enterprise

| Attribute | Details |
|-----------|---------|
| **Company** | RisaCare |
| **Core Capabilities** | Hospital management (ADT, beds, wards), Clinic management, Lab information system (SRL, PathLabs, Metropolis, Apollo), Pharmacy inventory, Nursing home care, EMR, Provider directory |
| **Data Produced** | Patient registration records, Visit encounters, Bed management data, Lab orders/results, Pharmacy inventory, Staff schedules, Revenue cycle data |
| **Data Needed** | Patient identity (ABHA ID), Insurance details, Doctor credentials, Facility information, Pricing schedules |
| **Current Integration** | Partial - Connected to RABTUL Auth/Payment, needs TwinOS for Patient/Doctor Twin |

### 2.3 MyRisa

| Attribute | Details |
|-----------|---------|
| **Company** | RisaCare |
| **Core Capabilities** | Personal wellbeing tracking (7 domains): Women's health, Sexual wellness, Mental wellness, Sleep analysis, Lifestyle tracking, Work-life balance, Relationship wellness |
| **Data Produced** | Wellness scores per domain, Symptom logs, Mood tracking, Sleep patterns, Exercise data, Menstrual cycle data, Fertility predictions |
| **Data Needed** | User identity, User preferences, Health goals, Consent for data sharing |
| **Current Integration** | Isolated - Needs integration to clinical records via Patient Twin |

### 2.4 Teleconsult

| Attribute | Details |
|-----------|---------|
| **Company** | RisaCare |
| **Core Capabilities** | Video consultation platform, Real-time STT with Whisper, Screen sharing, Prescription generation, Follow-up scheduling, Multi-party consultations, Emergency escalation |
| **Data Produced** | Consultation recordings (encrypted), Video call metadata, Prescriptions issued, Consultation summaries, Patient feedback |
| **Data Needed** | Patient identity, Doctor credentials, Appointment details, Medical history context, Insurance eligibility |
| **Current Integration** | Partial - Connected to RABTUL Pay, needs Doctor Twin verification |

### 2.5 Insurance Aggregator

| Attribute | Details |
|-----------|---------|
| **Company** | RisaCare |
| **Core Capabilities** | Health insurance marketplace comparison, Plan recommendation engine, Coverage eligibility checking, Premium calculation, Claims status tracking, Policy management |
| **Data Produced** | Insurance quotes, Policy enrollments, Coverage summaries, Claims data, Network provider lists |
| **Data Needed** | Patient demographics, Medical history summary, Income data, Family composition |
| **Current Integration** | Isolated - Needs Patient Twin for personalized recommendations |

### 2.6 RCM Service

| Attribute | Details |
|-----------|---------|
| **Company** | RisaCare |
| **Core Capabilities** | ICD-10 and CPT coding automation, Charge capture optimization, Claims submission/tracking, Denial management, Eligibility verification (CAQH, NaviNet), 837 EDI clearinghouse, Payment posting, Revenue analytics |
| **Data Produced** | Medical claims (837), Coding suggestions, Denial reasons, Payment records, AR aging reports, Revenue forecasts |
| **Data Needed** | Clinical documentation, Procedure/diagnosis codes, Insurance payer rules, Contract rates, Provider credentials |
| **Current Integration** | Partial - Connected to RABTUL Payment, needs Doctor Twin for credentialing |

### 2.7 FHIR Service

| Attribute | Details |
|-----------|---------|
| **Company** | RisaCare |
| **Core Capabilities** | FHIR R4 resource support, HL7 to FHIR conversion, ABHA integration, External health record imports, Interoperability, Consent management, Data export |
| **Data Produced** | FHIR-compliant health records, Patient summaries, Care plans, Allergy lists, Medication histories, Diagnostic reports |
| **Data Needed** | Patient identifiers (ABHA, local), Clinical data in any format, Consent directives, Provider identifiers |
| **Current Integration** | Ready - Core interoperability hub, needs Patient/Doctor Twin for identity resolution |

---

## 3. Twin Architecture

### 3.1 Patient Twin

| Attribute | Details |
|-----------|---------|
| **Type** | Entity Digital Twin |
| **Twin ID** | `patient-{uuid}` |

**Attributes:**

```
demographics:
  - patientId (UUID)
  - firstName, lastName
  - dateOfBirth, gender, bloodType
  - ABHA_ID (India Health ID)
  - contactInfo (phone, email, address)
  - emergencyContacts[]

medicalHistory:
  - chronicConditions[]
  - pastSurgeries[]
  - familyHistory[]
  - allergies[]
  - immunizationStatus
  - geneticMarkers

currentStatus:
  - activeMedications[]
  - recentLabResults[]
  - vitalSigns[]
  - wellnessScores{} (7 domains from MyRisa)
  - healthGoals[]
  - riskFactors[]

relationships:
  - primaryCareDoctor (Doctor Twin)
  - careTeamMembers[]
  - familyMembers[]
  - insurancePolicies[]
  - careCircle (caregivers)

preferences:
  - communicationChannel
  - language
  - healthLiteracy
  - culturalConsiderations
  - privacyConsent

insurance:
  - policyNumbers[]
  - insurers[]
  - coverageDetails
  - eligibilityStatus
  - claimsHistory[]

financial:
  - walletBalance
  - paymentMethods[]
  - outstandingBalance
  - rewardsPoints
```

**Relationships:**
- Linked to Doctor Twin (primary physician)
- Linked to Doctor Twin (care team)
- Linked to Facility Twin (preferred facilities)
- Linked to Insurance Policy Twin
- Linked to Appointment Twin
- Linked to Prescription Twin
- Linked to Lab Order Twin
- Linked to Claim Twin
- Owned by MyRisa wellbeing domains
- Updated by Teleconsult encounters
- Synced via FHIR Service

**Agents Managing Patient Twin:**
- HOJAI Care Manager Agent - Coordinates care plans
- HOJAI Nurse Agent - Monitors vitals and alerts
- HOJAI Receptionist Agent - Schedules appointments
- HOJAI Records Agent - Manages documentation
- HOJAI Pharmacist AI - Medication management
- RisaCare Care Circle Agent - Family coordination
- RisaCare Chronic Care Agent - Long-term condition management
- RisaCare Elderly Care Agent - Fall detection and SOS

---

### 3.2 Doctor Twin

| Attribute | Details |
|-----------|---------|
| **Type** | Entity Digital Twin |
| **Twin ID** | `doctor-{uuid}` |

**Attributes:**

```
identity:
  - doctorId (UUID)
  - registrationNumber
  - ABHA_ID
  - qualifications[]
  - specializations[]
  - yearsOfExperience
  - languagesSpoken[]

credentials:
  - medicalLicense (state, expiry)
  - boardCertifications[]
  - DEA registration
  - hospitalPrivileges[]
  - insuranceNetworkMemberships[]
  - NPI (National Provider ID)

practice:
  - facilities[]
  - clinicAddresses[]
  - operatingHours{}
  - acceptedInsurance[]
  - languages
  - consultationFee
  - teleconsultAvailability

performance:
  - patientRatings
  - consultationCount
  - averageConsultTime
  - followUpRate
  - diagnosticAccuracy
  - treatmentOutcomes[]

relationships:
  - primaryPatients[]
  - careTeamMembers[]
  - facilities[]
  - staff[]

preferences:
  - documentationStyle (SOAP vs traditional)
  - treatmentApproach (conservative vs aggressive)
  - communicationStyle
  - notificationPreferences

financial:
  - walletBalance
  - pendingPayments[]
  - payoutHistory[]
  - revenueShare
  - rcmStatus
```

**Relationships:**
- Linked to Patient Twin (primary care relationship)
- Linked to Patient Twin (consultation history)
- Linked to Facility Twin (practice locations)
- Linked to Appointment Twin (scheduled visits)
- Linked to Prescription Twin (issued prescriptions)
- Linked to Claim Twin (billing)
- Synced with RCM Service for credentialing
- Verified by FHIR Service Practitioner resources

**Agents Managing Doctor Twin:**
- HOJAI Care Manager Agent - Assigns to patients
- HOJAI Nurse Agent - Coordinates care team
- HOJAI Receptionist Agent - Manages schedule
- RCM Billing Agent - Claims submission
- RCM Coding Agent - Documentation review
- RCM Eligibility Agent - Insurance verification

---

### 3.3 Facility Twin

| Attribute | Details |
|-----------|---------|
| **Type** | Location Digital Twin |
| **Twin ID** | `facility-{uuid}` |

**Attributes:**

```
facilityId: UUID
name: string
type: hospital|clinic|lab|pharmacy|nursing-home|home-health
address: full address
contactInfo: phone, email
hours: operating hours

beds:
  total: number
  occupied: number
  icu:
    total: number
    occupied: number

services: available services[]
departments: departments[]
equipment: medical equipment[]
staff:
  doctors: count
  nurses: count
  support: count

insuranceNetworks: accepted insurers[]
certifications: JCI, NABH, ISO etc
pricing:
  consultation: fees by type
  procedures: fees by code
  roomRates: by category

ratings: average patient rating
amenities: available amenities[]
```

**Relationships:**
- Linked to Doctor Twin (privileges)
- Linked to Patient Twin (admissions)
- Linked to Appointment Twin (locations)
- Linked to Insurance Policy Twin (network status)

---

### 3.4 Appointment Twin

| Attribute | Details |
|-----------|---------|
| **Type** | Event Digital Twin |
| **Twin ID** | `appointment-{uuid}` |

**Attributes:**

```
appointmentId: UUID
patientId: Patient Twin ref
doctorId: Doctor Twin ref
facilityId: Facility Twin ref
dateTime: scheduled time
type: in-person|teleconsult|home-visit
status: scheduled|confirmed|in-progress|completed|cancelled|no-show
reason: visit reason
chiefComplaint: primary complaint
duration: expected minutes
preparationInstructions: patient prep notes

followUp:
  required: boolean
  recommended: boolean
  suggestedDate: date

vitals:
  taken: boolean
  values: {}

encounter:
  consultationNotes: string
  diagnosis: ICD-10[]
  procedures: CPT[]
  prescriptions: UUID[]
  labOrders: UUID[]
  referrals: UUID[]

billing:
  consultFee: amount
  paid: boolean
  paymentMethod: string
  claims: UUID[]
```

**Relationships:**
- References Patient Twin
- References Doctor Twin
- References Facility Twin
- Triggers Prescription Twin creation
- Triggers Lab Order Twin creation
- Triggers Claim Twin creation

---

### 3.5 Prescription Twin

| Attribute | Details |
|-----------|---------|
| **Type** | Medication Digital Twin |
| **Twin ID** | `prescription-{uuid}` |

**Attributes:**

```
prescriptionId: UUID
patientId: Patient Twin ref
doctorId: Doctor Twin ref
appointmentId: Appointment Twin ref

medications:
  - name: drug name
    genericName: string
    dosage: string
    frequency: string
    duration: string
    route: oral|injection|topical|etc
    instructions: string
    refills: number
    pharmacy: preferred pharmacy

diagnosis: ICD-10 codes[]
warnings: drug interactions[]
allergyAlerts: triggered allergies[]

refillStatus:
  requested: boolean
  approved: boolean
  pharmacy: pharmacy ref
  dueDate: date

adherence:
  taken: boolean
  lastTaken: datetime
  missedDoses: count
```

**Relationships:**
- References Patient Twin (recipient)
- References Doctor Twin (prescriber)
- References Appointment Twin
- Linked to Insurance Policy Twin (coverage check)
- Triggers Pharmacy Order Twin
- Monitored by Medication Adherence Agent

---

### 3.6 Lab Order Twin

| Attribute | Details |
|-----------|---------|
| **Type** | Diagnostic Digital Twin |
| **Twin ID** | `lab-order-{uuid}` |

**Attributes:**

```
labOrderId: UUID
patientId: Patient Twin ref
doctorId: Doctor Twin ref
facilityId: Facility Twin ref
appointmentId: Appointment Twin ref (optional)

tests:
  - code: LOINC/CPT
    name: test name
    bodySite: string
    priority: routine|urgent|stat
    fastingRequired: boolean

diagnosis: ICD-10[]
labPartner: SRL|PathLabs|Metropolis|Apollo|in-house

specimen:
  type: blood|urine|tissue|etc
  collectedAt: datetime
  collectedBy: staff ref

results:
  status: pending|processing|available|reviewed
  availableAt: datetime
  results:
    - code: LOINC
      name: string
      value: string
      unit: string
      referenceRange: string
      flag: normal|high|low|critical
  interpretation: AI-generated summary
  reviewedAt: datetime
  reviewedBy: Doctor Twin ref

billing:
  totalCost: amount
  insuranceCovered: boolean
  patientOwes: amount
  paid: boolean
```

**Relationships:**
- References Patient Twin
- References Doctor Twin
- References Facility Twin
- Linked to Insurance Policy Twin (coverage)
- Triggers Claim Twin
- Results linked to Observation Twin (FHIR)

---

### 3.7 Claim Twin

| Attribute | Details |
|-----------|---------|
| **Type** | Financial Digital Twin |
| **Twin ID** | `claim-{uuid}` |

**Attributes:**

```
claimId: UUID
patientId: Patient Twin ref
doctorId: Doctor Twin ref
facilityId: Facility Twin ref
appointmentId: Appointment Twin ref (optional)
insurancePolicyId: Insurance Policy Twin ref

serviceDate: date of service
submissionDate: date submitted
type: professional|facility|dental|vision
status: draft|submitted|pending|paid|denied|appealed|closed

lineItems:
  - cptCode: string
    icd10Codes[]: string
    chargeAmount: amount
    allowedAmount: amount
    paidAmount: amount
    patientResponsibility: amount
    status: string

totals:
  charges: amount
  allowed: amount
  paid: amount
  patientOwes: amount
  adjustments: amount

payer:
  payerId: string
  payerName: string
  memberId: string
  groupNumber: string

denial:
  reason: string
  code: string
  appealDeadline: date
  appealStatus: string

payments:
  - date: datetime
    amount: amount
    method: EFT|check|payment
    reference: string

rcmMetrics:
  daysToSubmit: number
  daysToPayment: number
  denialRate: percentage
```

**Relationships:**
- References Patient Twin
- References Doctor Twin
- References Facility Twin
- References Insurance Policy Twin
- References Appointment/Prescription/Lab Order Twin
- Managed by RCM Service agents

---

### 3.8 Insurance Policy Twin

| Attribute | Details |
|-----------|---------|
| **Type** | Coverage Digital Twin |
| **Twin ID** | `policy-{uuid}` |

**Attributes:**

```
policyId: UUID
patientId: Patient Twin ref
insurerId: string
insurerName: string
policyNumber: string
groupNumber: string
memberId: string
planType: HMO|PPO|EPO|HDHP|indemnity
effectiveDate: date
terminationDate: date (optional)
status: active|terminated|suspended

coverage:
  deductible:
    individual: amount
    family: amount
    met: amount
  
  outOfPocketMax:
    individual: amount
    family: amount
    met: amount
  
  copays:
    primaryCare: amount
    specialist: amount
    teleconsult: amount
    urgentCare: amount
    emergency: amount
  
  coinsurance: percentage
  
  inNetworkBenefits:
    primaryCare: covered percentage
    specialist: covered percentage
    preventive: covered percentage
    prescriptions: tier coverage[]
    labs: covered percentage
    imaging: covered percentage

preAuthRequirements: services requiring prior authorization[]
exclusions: excluded services[]

providers:
  inNetworkDoctors[]: Doctor Twin refs
  inNetworkFacilities[]: Facility Twin refs

claims:
  paidAmount: amount
  claimsCount: number
  lastClaimDate: date
```

**Relationships:**
- References Patient Twin (policy holder)
- Linked to Patient Twin (dependents)
- Linked to Claim Twin (all claims)
- Linked to Doctor Twin (in-network verification)
- Linked to Facility Twin (network status)
- Synced with Insurance Aggregator

---

## 4. Integration Flows

### 4.1 HOJAI Clinic AI to Patient Twin

| Attribute | Details |
|-----------|---------|
| **Source** | HOJAI Clinic AI |
| **Target** | TwinOS (Patient Twin) |
| **Direction** | Bidirectional |

**Data Flow:**
Real-time sync of clinical documentation, diagnoses, treatment plans, and AI-generated care recommendations from HOJAI Clinic AI to the Patient Twin. Bidirectional sync ensures Patient Twin context flows back to HOJAI for clinical decision support.

**API Endpoints:**

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/v1/patient-twin/sync` | Push clinical data to Patient Twin |
| GET | `/api/v1/patient-twin/{patientId}/context` | Fetch Patient Twin context for clinical AI |
| POST | `/api/v1/patient-twin/{patientId}/encounter` | Record new clinical encounter |
| PUT | `/api/v1/patient-twin/{patientId}/care-plan` | Update active care plan |

**Events:**
- `encounter.completed`
- `diagnosis.added`
- `prescription.issued`
- `lab.ordered`
- `care-plan.updated`
- `vitals.recorded`
- `alert.triggered`

**Error Handling:**
Retry with exponential backoff (max 3 attempts), dead letter queue for failed syncs, manual reconciliation UI for data discrepancies.

---

### 4.2 HOJAI Clinic AI to Doctor Twin

| Attribute | Details |
|-----------|---------|
| **Source** | HOJAI Clinic AI |
| **Target** | TwinOS (Doctor Twin) |
| **Direction** | Bidirectional |

**Data Flow:**
Doctor credentials, performance metrics, patient feedback, consultation patterns, and AI-generated productivity insights sync bidirectionally with TwinOS.

**API Endpoints:**

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/doctor-twin/{doctorId}` | Fetch doctor profile and credentials |
| PUT | `/api/v1/doctor-twin/{doctorId}/schedule` | Update availability and slots |
| POST | `/api/v1/doctor-twin/{doctorId}/consultation` | Record completed consultation |

**Events:**
- `doctor.verified`
- `credentials.updated`
- `schedule.changed`
- `performance.metrics.updated`

**Error Handling:**
Credential validation on updates, audit trail for all changes, notification to admin on critical credential expiry.

---

### 4.3 RisaCare B2B to Patient Twin

| Attribute | Details |
|-----------|---------|
| **Source** | RisaCare B2B Enterprise |
| **Target** | TwinOS (Patient Twin) |
| **Direction** | Unidirectional (to Twin) |

**Data Flow:**
Patient registration, demographics, visit history, ADT (Admission-Discharge-Transfer), bed management, and EMR data sync to Patient Twin. Patient Twin provides unified 360-degree view.

**API Endpoints:**

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/v1/twin/patient/register` | Register new patient in TwinOS |
| GET | `/api/v1/twin/patient/{patientId}/360-view` | Get unified patient timeline |
| POST | `/api/v1/twin/patient/{patientId}/adt` | Record ADT event |
| GET | `/api/v1/twin/patient/{patientId}/care-team` | Get assigned care team |

**Events:**
- `patient.registered`
- `patient.admitted`
- `patient.transferred`
- `patient.discharged`
- `bed.occupied`
- `bed.available`

**Error Handling:**
Idempotent operations, reconciliation job nightly, duplicate detection using ABHA ID matching.

---

### 4.4 RisaCare B2B to Doctor Twin

| Attribute | Details |
|-----------|---------|
| **Source** | RisaCare B2B Enterprise |
| **Target** | TwinOS (Doctor Twin) |
| **Direction** | Unidirectional (to Twin) |

**Data Flow:**
Doctor scheduling, facility privileges, department assignments, and productivity metrics sync. Enables cross-facility doctor availability and patient load balancing.

**API Endpoints:**

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/v1/twin/doctor/enroll` | Enroll doctor in TwinOS |
| PUT | `/api/v1/twin/doctor/{doctorId}/privileges` | Update hospital privileges |
| GET | `/api/v1/twin/doctor/{doctorId}/schedule` | Get consolidated schedule |
| GET | `/api/v1/twin/doctor/{doctorId}/patient-load` | Get current patient assignments |

**Events:**
- `doctor.enrolled`
- `privileges.updated`
- `schedule.changed`
- `patient.assigned`
- `patient.discharged`

**Error Handling:**
Privilege validation before updates, conflict detection for double-booking, notification to credentials committee on expiry.

---

### 4.5 MyRisa to Patient Twin

| Attribute | Details |
|-----------|---------|
| **Source** | MyRisa |
| **Target** | TwinOS (Patient Twin) |
| **Direction** | Bidirectional |

**Data Flow:**
Personal wellbeing data from 7 domains (women's health, sexual wellness, mental wellness, sleep, lifestyle, work-life balance, relationships) flows to Patient Twin for predictive health insights. Clinical context flows back to enhance MyRisa recommendations.

**API Endpoints:**

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/v1/twin/patient/{patientId}/wellness` | Sync wellness domain scores |
| GET | `/api/v1/twin/patient/{patientId}/health-risk` | Get AI-generated health risk assessment |
| POST | `/api/v1/twin/patient/{patientId}/goals` | Set shared health goals |
| GET | `/api/v1/twin/patient/{patientId}/trends` | Get longitudinal trend analysis |

**Events:**
- `wellness.updated`
- `risk.alert`
- `goal.achieved`
- `trend.anomaly`
- `domain.concern`

**Error Handling:**
Consent-gated data sharing, anomaly detection for concerning patterns (mental health alerts trigger escalation), differential privacy for analytics.

---

### 4.6 Teleconsult to Patient/Doctor Twins

| Attribute | Details |
|-----------|---------|
| **Source** | Teleconsult |
| **Target** | TwinOS (Patient/Doctor Twin) |
| **Direction** | Bidirectional |

**Data Flow:**
Video consultation sessions, AI-generated summaries, prescriptions, and follow-up recommendations sync bidirectionally. Pre-consult context from both twins enhances AI scribe accuracy.

**API Endpoints:**

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/v1/twin/teleconsult/session` | Create teleconsult session twin |
| PUT | `/api/v1/twin/teleconsult/{sessionId}/complete` | Complete session and sync data |
| GET | `/api/v1/twin/teleconsult/{sessionId}/context` | Get pre-consult context for both parties |

**Events:**
- `session.started`
- `session.ended`
- `prescription.generated`
- `follow-up.scheduled`
- `emergency.escalated`

**Error Handling:**
Session recording encryption, consent verification before context fetch, automatic transcript backup on connection drop.

---

### 4.7 Insurance Aggregator to Patient/Insurance Policy Twins

| Attribute | Details |
|-----------|---------|
| **Source** | Insurance Aggregator |
| **Target** | TwinOS (Patient/Insurance Policy Twin) |
| **Direction** | Bidirectional |

**Data Flow:**
Insurance quotes, policy enrollments, coverage details, and claims status sync. Patient Twin carries active policy references; Insurance Policy Twin maintains detailed coverage state.

**API Endpoints:**

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/v1/twin/insurance/policy` | Create insurance policy twin |
| GET | `/api/v1/twin/insurance/{policyId}/coverage` | Get real-time coverage check |
| POST | `/api/v1/twin/insurance/{policyId}/claim` | Create claim twin from service |
| GET | `/api/v1/twin/insurance/{patientId}/recommendations` | Get personalized plan recommendations |

**Events:**
- `policy.enrolled`
- `policy.expired`
- `coverage.checked`
- `claim.initiated`
- `claim.paid`
- `claim.denied`

**Error Handling:**
Real-time eligibility API integration with payers, policy verification on scheduling, claim status polling with webhook notifications.

---

### 4.8 RCM Service to Doctor/Claim Twins

| Attribute | Details |
|-----------|---------|
| **Source** | RCM Service |
| **Target** | TwinOS (Doctor/Claim Twin) |
| **Direction** | Bidirectional |

**Data Flow:**
Coding suggestions, claims submission status, denial management, and payment posting sync. Doctor Twin maintains credentialing and revenue metrics; Claim Twin tracks full claims lifecycle.

**API Endpoints:**

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/v1/twin/rcm/claim` | Create claim twin from encounter |
| PUT | `/api/v1/twin/rcm/claim/{claimId}/status` | Update claim status |
| GET | `/api/v1/twin/rcm/doctor/{doctorId}/metrics` | Get doctor revenue metrics |
| POST | `/api/v1/twin/rcm/claim/{claimId}/appeal` | Submit appeal for denied claim |

**Events:**
- `claim.created`
- `claim.submitted`
- `claim.paid`
- `claim.denied`
- `appeal.submitted`
- `appeal.approved`
- `payment.received`

**Error Handling:**
Clearinghouse EDI validation, automatic denial categorization, appeal deadline tracking with alerts, resubmission workflow for technical denials.

---

### 4.9 FHIR Service to All Twins

| Attribute | Details |
|-----------|---------|
| **Source** | FHIR Service |
| **Target** | TwinOS (All Twins) |
| **Direction** | Bidirectional |

**Data Flow:**
FHIR R4 resource synchronization across all twins. External health records import via FHIR, ABHA identity resolution, consent management, and interoperability with external hospital systems.

**API Endpoints:**

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/v1/fhir/sync` | Bulk FHIR resource sync |
| GET | `/api/v1/fhir/Patient/{patientId}` | Get FHIR Patient resource |
| POST | `/api/v1/fhir/Consent` | Manage patient consent |
| GET | `/api/v1/fhir/$everything` | Patient data export |

**Events:**
- `fhir.import.completed`
- `fhir.export.completed`
- `consent.updated`
- `identity.resolved`
- `external.record.linked`

**Error Handling:**
HL7 to FHIR conversion validation, consent verification before data export, ABHA ID resolution with fallback to local ID, batch processing for large imports.

---

## 5. Agent Architecture

### 5.1 Care Coordination Agent

| Attribute | Details |
|-----------|---------|
| **Role** | Primary care coordination orchestrator |
| **Autonomy Level** | L3 (Autonomous) |

**Twins Managed:**
- Patient Twin (primary)
- Doctor Twin (primary care physician)
- Appointment Twin (all appointments)
- Facility Twin (care facilities)

**Actions:**
- Monitor patient care journey across all touchpoints
- Alert care team on care gaps
- Coordinate referrals between specialists
- Manage care transitions (hospital to home)
- Track care plan adherence
- Escalate concerning patterns to human oversight

**Skills:**
- Healthcare workflow orchestration
- Care gap identification
- Referral management
- Care transition protocols
- Clinical alert interpretation
- Multi-language patient communication

---

### 5.2 Clinical Decision Support Agent

| Attribute | Details |
|-----------|---------|
| **Role** | AI-powered clinical decision support |
| **Autonomy Level** | L3 (Autonomous) |

**Twins Managed:**
- Patient Twin (context provider)
- Doctor Twin (recommendation context)

**Actions:**
- Analyze patient history for diagnostic suggestions
- Check drug interactions and allergies
- Suggest appropriate diagnostic tests
- Recommend treatment protocols based on guidelines
- Identify patients at risk for readmission
- Support differential diagnosis

**Skills:**
- Medical knowledge base (diagnosis, treatment guidelines)
- Drug interaction database access
- Clinical protocol adherence
- Risk stratification models
- Explainable AI for recommendations
- HIPAA-compliant data handling

---

### 5.3 Appointment Scheduling Agent

| Attribute | Details |
|-----------|---------|
| **Role** | Intelligent appointment management |
| **Autonomy Level** | L3 (Autonomous) |

**Twins Managed:**
- Patient Twin (preferences)
- Doctor Twin (availability)
- Appointment Twin (all appointments)
- Facility Twin (resource availability)

**Actions:**
- Schedule appointments based on doctor availability and patient preference
- Optimize scheduling for efficiency (buffer times, double-booking rules)
- Send appointment reminders via preferred channel
- Handle rescheduling and cancellations
- Manage waitlists and overbooking
- Coordinate teleconsult vs in-person decisions

**Skills:**
- Scheduling optimization algorithms
- Multi-party calendar coordination
- Natural language appointment booking (chat/voice)
- Reminder and confirmation workflows
- No-show prediction and mitigation
- Insurance-aware scheduling

---

### 5.4 Medication Management Agent

| Attribute | Details |
|-----------|---------|
| **Role** | Complete medication lifecycle management |
| **Autonomy Level** | L3 (Autonomous) |

**Twins Managed:**
- Patient Twin (allergies, current meds)
- Prescription Twin (all prescriptions)
- Doctor Twin (prescribing patterns)

**Actions:**
- Manage complete medication list reconciliation
- Monitor medication adherence and send reminders
- Detect drug interactions and allergies
- Process refill requests automatically
- Alert on duplicate therapies
- Coordinate with pharmacy for fulfillment
- Identify cost-saving alternatives

**Skills:**
- Drug interaction checking
- Pharmacy benefit integration
- Adherence monitoring algorithms
- Refill request processing
- Generic substitution recommendations
- Prior authorization for medications

---

### 5.5 Lab Results Agent

| Attribute | Details |
|-----------|---------|
| **Role** | Diagnostic coordination and interpretation |
| **Autonomy Level** | L3 (Autonomous) |

**Twins Managed:**
- Patient Twin (lab history)
- Doctor Twin (ordering patterns)
- Lab Order Twin (all orders)
- Appointment Twin (ordered during)

**Actions:**
- Route lab orders to appropriate partners (SRL, PathLabs, etc.)
- Track specimen collection and transit
- Monitor result turnaround times
- Alert doctors on critical values
- Provide AI-generated result interpretation
- Flag abnormal trends over time
- Coordinate repeat testing

**Skills:**
- Lab partner integrations (SRL, PathLabs, Metropolis, Apollo)
- Reference range interpretation
- Critical value alerting
- Trend analysis for serial tests
- Result explanation for patients
- Follow-up test recommendations

---

### 5.6 Claims Management Agent

| Attribute | Details |
|-----------|---------|
| **Role** | Revenue cycle optimization |
| **Autonomy Level** | L3 (Autonomous) |

**Twins Managed:**
- Claim Twin (all claims)
- Doctor Twin (billing profiles)
- Patient Twin (financial responsibility)
- Insurance Policy Twin (coverage details)

**Actions:**
- Generate claims from clinical encounters
- Submit claims to clearinghouse
- Track claim status through payment
- Manage denials and appeals
- Post payments and adjustments
- Identify underpayments vs contracted rates
- Optimize claims for maximum reimbursement

**Skills:**
- 837 EDI claim generation
- Clearinghouse integrations
- Denial reason categorization
- Appeal letter generation
- Contractual adjustment calculations
- Payment posting automation
- AR aging analysis

---

### 5.7 Insurance Navigation Agent

| Attribute | Details |
|-----------|---------|
| **Role** | Patient insurance support and optimization |
| **Autonomy Level** | L3 (Autonomous) |

**Twins Managed:**
- Patient Twin (coverage needs)
- Insurance Policy Twin (all policies)
- Insurance Aggregator (plan recommendations)

**Actions:**
- Verify patient insurance eligibility in real-time
- Explain coverage and patient responsibility
- Assist with insurance plan selection
- Guide pre-authorization process
- Track claims and explain status
- Identify coverage gaps or issues
- Support insurance appeals when needed

**Skills:**
- Insurance eligibility verification (CAQH, NaviNet)
- Coverage explanation in plain language
- Pre-auth workflow management
- Plan comparison and recommendations
- Claims status tracking
- Patient financial counseling
- Insurance jargon translation

---

### 5.8 Chronic Care Management Agent

| Attribute | Details |
|-----------|---------|
| **Role** | Long-term condition monitoring and support |
| **Autonomy Level** | L3 (Autonomous) |

**Twins Managed:**
- Patient Twin (chronic conditions)
- Prescription Twin (chronic medications)
- Lab Order Twin (monitoring tests)
- Appointment Twin (follow-ups)

**Actions:**
- Monitor chronic conditions (diabetes, BP, thyroid, etc.)
- Track relevant biomarkers and symptoms
- Ensure regular follow-up appointments
- Monitor medication adherence for chronic meds
- Alert on concerning trends or missed tests
- Provide patient education on condition
- Coordinate care with specialists as needed

**Skills:**
- Chronic condition protocols (ADA, JNC, ATA guidelines)
- Biomarker trend monitoring
- Patient education content delivery
- Care plan adherence tracking
- Specialist coordination
- Emergency escalation triggers

---

### 5.9 Patient Engagement Agent

| Attribute | Details |
|-----------|---------|
| **Role** | Multi-channel patient communication |
| **Autonomy Level** | L3 (Autonomous) |

**Twins Managed:**
- Patient Twin (preferences, contact info)
- Appointment Twin (upcoming)
- Prescription Twin (refills due)

**Actions:**
- Send personalized health reminders
- Deliver lab results with explanations
- Collect patient feedback after visits
- Send preventive care reminders
- Broadcast urgent health alerts
- Conduct patient satisfaction surveys
- Provide health education content

**Skills:**
- Multi-channel messaging (WhatsApp, SMS, email, push)
- Personalized content generation
- Health literacy adaptation
- Feedback collection and analysis
- Campaign management for preventive reminders
- Opt-in/opt-out compliance
- WhatsApp Business API integration

---

### 5.10 Elderly Care Agent

| Attribute | Details |
|-----------|---------|
| **Role** | Senior patient safety and support |
| **Autonomy Level** | L3 (Autonomous) |

**Twins Managed:**
- Patient Twin (elderly profile)
- Care Circle Twin (family contacts)
- Lab Order Twin (monitoring)

**Actions:**
- Monitor for fall risk indicators
- Coordinate SOS and emergency response
- Track medication compliance in elderly
- Facilitate family communication about care
- Monitor cognitive decline indicators
- Ensure regular check-ins
- Coordinate home healthcare services

**Skills:**
- Fall risk assessment (Morse, Hendrich II)
- Emergency response coordination
- Family caregiver communication
- Home healthcare coordination
- Cognitive assessment tools (MoCA, MMSE)
- Medication management for polypharmacy
- Wearable device integration (fall detection)

---

### 5.11 Teleconsult Facilitation Agent

| Attribute | Details |
|-----------|---------|
| **Role** | Video consultation support |
| **Autonomy Level** | L3 (Autonomous) |

**Twins Managed:**
- Patient Twin (teleconsult history)
- Doctor Twin (teleconsult availability)
- Appointment Twin (video sessions)
- Prescription Twin (e-prescriptions)

**Actions:**
- Set up and manage video consultation sessions
- Provide pre-consult checklist to patient
- Ensure technical quality during call
- Support AI scribe during consultation
- Generate and send post-consult summaries
- Process e-prescriptions after consult
- Schedule follow-up appointments

**Skills:**
- Video platform integration (Twilio, Exotel)
- Technical troubleshooting
- SOAP note generation
- E-prescription workflow
- Multi-party video coordination
- Screen sharing support
- Emergency escalation protocols

---

### 5.12 Wellbeing to Clinical Bridge Agent

| Attribute | Details |
|-----------|---------|
| **Role** | Connect MyRisa wellness data to clinical insights |
| **Autonomy Level** | L3 (Autonomous) |

**Twins Managed:**
- Patient Twin (clinical + wellness)
- MyRisa Domain Twins (7 wellness domains)

**Actions:**
- Analyze wellness trends for clinical relevance
- Flag concerning patterns to clinical team
- Bridge wellness goals with care plans
- Provide clinical context to wellness recommendations
- Monitor impact of lifestyle changes on clinical markers
- Identify opportunities for preventive interventions

**Skills:**
- Wellness data interpretation
- Clinical correlation analysis
- Preventive health guidelines
- Behavioral change motivation
- Multi-domain trend analysis
- Privacy-preserving data aggregation

---

## 6. Business Copilot Integration

### 6.1 Insights Available to Clinic Managers

**Operational Insights:**
- Patient volume by hour/day/week/month
- Average consultation duration and wait times
- Doctor utilization rates and scheduling efficiency
- Bed occupancy rates (for hospitals)
- Lab test turnaround times
- Prescription refill rates

**Financial Insights:**
- Revenue per doctor, per department, per facility
- Claims submission and payment rates
- Denial rates and top denial reasons
- AR aging breakdown
- Insurance reimbursement trends
- Outstanding patient balances

**Clinical Insights:**
- Top diagnoses by volume
- Average length of stay
- Readmission rates
- Care gap compliance
- Chronic disease management outcomes
- Preventive care completion rates

**Patient Experience Insights:**
- Patient satisfaction scores
- No-show rates and predictive factors
- Appointment cancellation patterns
- Feedback sentiment analysis
- Wait time satisfaction
- Communication preference trends

### 6.2 Natural Language Queries Supported

| Category | Sample Queries |
|----------|---------------|
| **Scheduling** | "Show me tomorrow's appointments for Dr. Sharma", "Which slots have the highest no-show rate?", "Schedule a follow-up for all diabetic patients who missed their last visit" |
| **Revenue** | "What's our revenue so far this month?", "Show me the top 5 denial reasons this quarter", "Compare our reimbursement rate across insurers" |
| **Clinical** | "Which patients have uncontrolled diabetes?", "List all patients with overdue preventive care", "Show me readmission trends for heart failure patients" |
| **Operations** | "What's our average wait time this week?", "Which days are most overcrowded?", "Compare staff productivity across shifts" |
| **Insurance** | "Which claims are pending over 30 days?", "What's our approval rate for pre-authorizations?", "Show me coverage issues by insurance provider" |

### 6.3 Dashboard Views Needed

**Executive Dashboard:**
- Total patients served (daily/weekly/monthly)
- Revenue and AR summary
- Key performance indicators (KPIs) with trends
- Alerts and action items
- Comparative performance (current vs previous period)

**Clinical Dashboard:**
- Patient census by condition
- Care gap tracker
- Chronic disease management metrics
- Lab result turnaround
- Prescription adherence rates

**Operations Dashboard:**
- Appointment utilization heat map
- Staff scheduling overview
- Wait time trends
- Facility capacity (beds, rooms)
- Equipment utilization

**Financial Dashboard:**
- Revenue cycle metrics
- Claims status breakdown
- Denial analysis
- Insurance mix analysis
- Patient AR aging

**Patient Experience Dashboard:**
- Satisfaction trends
- No-show analysis
- Feedback sentiment
- Communication effectiveness
- Service recovery metrics

---

## 7. Economic Integration

### 7.1 Payment Flows

```
Patient Visit Flow:
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Patient   │────>│ Appointment  │────>│   Doctor    │
│   Check-in │     │    Twin      │     │   Twin      │
└─────────────┘     └──────────────┘     └─────────────┘
                          │                     │
                          v                     v
                   ┌────────────────────────────────┐
                   │         RABTUL Payment        │
                   │   (Co-Pay Collection)           │
                   └────────────────────────────────┘
                                    │
                                    v
                   ┌────────────────────────────────┐
                   │          Claim Twin            │
                   │   (Submit to Insurance)         │
                   └────────────────────────────────┘
                                    │
                                    v
                   ┌────────────────────────────────┐
                   │        RCM Service              │
                   │   (Processing & Follow-up)     │
                   └────────────────────────────────┘
                                    │
                                    v
                   ┌────────────────────────────────┐
                   │       RABTUL Payment            │
                   │   (Insurance Reimbursement)     │
                   └────────────────────────────────┘
```

### 7.2 Rewards/Loyalty Integration

**Healthcare Rewards Program:**
- Points earned for preventive care visits (annual checkup, vaccinations)
- Points for completing health goals (weight loss, smoking cessation)
- Points for chronic disease management compliance
- Points for timely appointment attendance
- Points for participating in wellness programs

**Rewards Redemption:**
- Discounts on next consultation
- Reduced co-pay for future visits
- Free lab tests or health screenings
- Pharmacy discounts
- Wellness product discounts
- Teleconsult credits

### 7.3 Wallet Usage

**RABTUL Wallet Integration:**

| Use Case | Flow |
|----------|------|
| **Co-pay Collection** | Patient wallet auto-deducted at check-in |
| **Insurance Deductible** | Wallet used for deductible until met |
| **Prescription Co-pay** | Wallet covers medication costs |
| **Uninsured Patients** | Full payment via wallet with installment options |
| **Rewards Accumulation** | Healthcare rewards credited to wallet |
| **Teleconsult Payments** | Wallet used for video consultation fees |

**Wallet Balances for Healthcare:**
- Patient wallet: Co-pays, deductibles, uninsured payments
- Doctor wallet: Consultation fees, incentives, bonuses
- Clinic wallet: Revenue collection, expense payments
- Rewards wallet: Healthcare-specific reward points

---

## 8. Implementation Roadmap

### Phase 1: Core Integration (Weeks 1-2)

#### Week 1 (Days 1-5)

**Tasks:**
1. Set up TwinOS infrastructure for Healthcare vertical
2. Deploy Patient Twin and Doctor Twin data models
3. Create HOJAI Clinic AI to TwinOS sync API endpoints
4. Configure RABTUL Auth integration for healthcare compliance
5. Set up FHIR Service for identity resolution
6. Implement base Patient Twin with demographics and medical history
7. Implement base Doctor Twin with credentials and schedule

#### Week 2 (Days 6-10)

**Tasks:**
1. Integrate RisaCare B2B patient registration to Patient Twin
2. Integrate RisaCare B2B doctor enrollment to Doctor Twin
3. Connect Appointment Twin to RisaCare B2B scheduling
4. Enable FHIR export for patient records
5. Deploy Care Coordination Agent with basic workflows
6. Deploy Appointment Scheduling Agent
7. End-to-end testing of core patient journey
8. UAT with 3 pilot clinics

**Phase 1 Deliverables:**
- TwinOS Healthcare namespace deployed
- Patient Twin with demographics, allergies, medications, conditions
- Doctor Twin with credentials, schedule, performance
- Appointment Twin with scheduling integration
- FHIR R4 export capability
- 2 operational AI agents (Care Coordination, Scheduling)
- 3 pilot clinic integrations live

---

### Phase 2: Advanced Features (Weeks 3-4)

#### Week 3 (Days 11-15)

**Tasks:**
1. Integrate MyRisa wellbeing data to Patient Twin
2. Deploy Medication Management Agent with drug interaction checking
3. Deploy Lab Results Agent with partner integrations
4. Connect RCM Service for claims lifecycle management
5. Implement Insurance Policy Twin with coverage details
6. Deploy Insurance Navigation Agent
7. Integrate Insurance Aggregator for plan recommendations
8. Connect Teleconsult sessions to Patient/Doctor Twins

#### Week 4 (Days 16-20)

**Tasks:**
1. Deploy Clinical Decision Support Agent with diagnosis suggestions
2. Deploy Chronic Care Management Agent for long-term conditions
3. Deploy Patient Engagement Agent with multi-channel messaging
4. Implement Elderly Care Agent with fall detection
5. Deploy Teleconsult Facilitation Agent with AI scribe
6. Integrate all agents with Business Copilot for clinic managers
7. Performance optimization and load testing
8. Security audit and HIPAA compliance review

**Phase 2 Deliverables:**
- MyRisa 7-domain wellness data flowing to Patient Twin
- Full medication management with drug interactions
- Lab results with AI interpretation (SRL, PathLabs, Metropolis, Apollo)
- Complete claims lifecycle with RCM integration
- Insurance coverage verification and plan recommendations
- 10 operational AI agents covering full patient journey
- Business Copilot integration for clinic operations insights
- HIPAA-compliant security audit passed

---

### Phase 3: Optimization & Scale (Weeks 5-6)

#### Week 5 (Days 21-25)

**Tasks:**
1. Deploy Wellbeing to Clinical Bridge Agent
2. Implement predictive health risk scoring from Patient Twin
3. Optimize agent performance based on pilot feedback
4. Scale infrastructure for 100+ clinics
5. Implement cross-clinic patient matching via ABHA
6. Deploy Business Copilot dashboards for clinic managers
7. Implement referral network optimization
8. Set up real-time health alerts and escalations

#### Week 6 (Days 26-30)

**Tasks:**
1. Full deployment across all pilot clinics
2. Training program for clinic staff on AI workflows
3. Training program for doctors on clinical decision support
4. Patient-facing education on MyRisa integration
5. Performance monitoring and SLA tracking
6. Feedback collection and agent refinement
7. Documentation and knowledge base creation
8. Go-live celebration and success metrics review

**Phase 3 Deliverables:**
- Predictive health risk scoring from combined clinical + wellness data
- 100+ clinic deployment capability
- Business Copilot dashboards (patient volume, revenue, outcomes)
- Complete Wellbeing to Clinical bridge with proactive health management
- Full staff and doctor training programs
- Real-time alerts and escalations operational
- Production-ready Healthcare & Clinics OS

---

## Appendix A: API Endpoint Summary

| Integration | Source | Target | Key Endpoints |
|-------------|--------|--------|---------------|
| HOJAI-Patient | HOJAI Clinic AI | Patient Twin | `/patient-twin/sync`, `/patient-twin/{id}/context`, `/patient-twin/{id}/encounter` |
| HOJAI-Doctor | HOJAI Clinic AI | Doctor Twin | `/doctor-twin/{id}`, `/doctor-twin/{id}/schedule`, `/doctor-twin/{id}/consultation` |
| RisaCare-Patient | RisaCare B2B | Patient Twin | `/twin/patient/register`, `/twin/patient/{id}/360-view`, `/twin/patient/{id}/adt` |
| RisaCare-Doctor | RisaCare B2B | Doctor Twin | `/twin/doctor/enroll`, `/twin/doctor/{id}/privileges`, `/twin/doctor/{id}/schedule` |
| MyRisa-Patient | MyRisa | Patient Twin | `/twin/patient/{id}/wellness`, `/twin/patient/{id}/health-risk`, `/twin/patient/{id}/trends` |
| Teleconsult-Twin | Teleconsult | Patient/Doctor | `/twin/teleconsult/session`, `/twin/teleconsult/{id}/complete`, `/twin/teleconsult/{id}/context` |
| Insurance-Twin | Insurance Aggregator | Patient/Policy | `/twin/insurance/policy`, `/twin/insurance/{id}/coverage`, `/twin/insurance/{patientId}/recommendations` |
| RCM-Twin | RCM Service | Doctor/Claim | `/twin/rcm/claim`, `/twin/rcm/claim/{id}/status`, `/twin/rcm/doctor/{id}/metrics` |
| FHIR-Twin | FHIR Service | All Twins | `/fhir/sync`, `/fhir/Patient/{id}`, `/fhir/Consent`, `/fhir/$everything` |

---

## Appendix B: Event Summary

| Event | Source | Target | Trigger |
|-------|--------|--------|---------|
| `encounter.completed` | HOJAI Clinic AI | Patient Twin | Clinical encounter finished |
| `diagnosis.added` | HOJAI Clinic AI | Patient Twin | New diagnosis recorded |
| `prescription.issued` | HOJAI Clinic AI | Prescription Twin | Prescription created |
| `lab.ordered` | HOJAI Clinic AI | Lab Order Twin | Lab test ordered |
| `care-plan.updated` | HOJAI Clinic AI | Patient Twin | Care plan modified |
| `vitals.recorded` | RisaCare B2B | Patient Twin | Vitals entered |
| `alert.triggered` | Any system | Patient Twin | Clinical alert |
| `patient.registered` | RisaCare B2B | Patient Twin | New patient created |
| `patient.admitted` | RisaCare B2B | Patient Twin | Hospital admission |
| `patient.discharged` | RisaCare B2B | Patient Twin | Hospital discharge |
| `wellness.updated` | MyRisa | Patient Twin | Wellness data synced |
| `risk.alert` | Wellbeing Bridge | Patient Twin | Health risk detected |
| `session.started` | Teleconsult | Appointment Twin | Video call begins |
| `session.ended` | Teleconsult | Appointment Twin | Video call ends |
| `policy.enrolled` | Insurance Aggregator | Policy Twin | New policy created |
| `claim.created` | RCM Service | Claim Twin | Encounter billed |
| `claim.paid` | RCM Service | Claim Twin | Payment received |
| `claim.denied` | RCM Service | Claim Twin | Claim rejected |
| `fhir.import.completed` | FHIR Service | All Twins | External data imported |
| `consent.updated` | FHIR Service | All Twins | Patient consent changed |

---

## Appendix C: Port Registry for Healthcare OS

| Service | Port | Purpose |
|---------|------|---------|
| TwinOS Gateway | 4142 | Patient/Doctor Twin access |
| Patient Twin | 4142-P1 | Patient entity management |
| Doctor Twin | 4142-D1 | Doctor entity management |
| Appointment Twin | 4142-A1 | Appointment event management |
| Prescription Twin | 4142-Rx | Prescription management |
| Lab Order Twin | 4142-L1 | Lab order management |
| Claim Twin | 4142-C1 | Claim lifecycle management |
| Insurance Policy Twin | 4142-I1 | Insurance coverage management |
| RisaCare API Gateway | 4700 | Main RisaCare entry |
| RisaCare Profile | 4701 | Patient profiles |
| RisaCare Records | 4702 | Health records |
| RisaCare Wellness | 4703 | MyRisa domains |
| RisaCare Visit | 4704 | Visit encounters |
| RisaCare Consent | 4705 | HIPAA/DPDP consent |
| RisaCare Care Circle | 4706 | Family access |
| RisaCare Medication | 4707 | Prescriptions |
| RisaCare Teleconsult | 4723 | Video consultations |
| RisaCare Insurance | 4724 | Insurance service |
| RisaCare RCM | 4750 | Revenue cycle |
| RisaCare FHIR | 4761 | FHIR interoperability |
| HOJAI Clinic AI | 4500-G1 | Clinical AI gateway |
| HOJAI Memory | 4520 | Context storage |
| HOJAI Agents | 4550 | AI agent orchestration |
| RABTUL Auth | 4002 | JWT authentication |
| RABTUL Payment | 4001 | Payment processing |
| RABTUL Wallet | 4004 | Balance management |
| RABTUL Notify | 4005 | Notifications |

---

**Document Version:** 1.0  
**Last Updated:** June 12, 2026  
**Status:** Ready for Implementation  
**Prepared by:** Claude Code (AI Assistant)
