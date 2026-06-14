# RisaCare - Source of Truth (SOT)

> **Version:** 5.0.0 | **Updated:** June 7, 2026 | **Status:** Production Ready

> **Last Audit:** June 7, 2026 - All 56 services with MongoDB ✅

---

## Product Identity

**RisaCare** is India's Consumer Healthcare Operating System.

### What It Is
- AI-powered healthcare navigation
- Healthcare coordination infrastructure
- Personal health OS
- Healthcare commerce layer
- Preventive wellness platform
- Family healthcare management
- Second opinion services
- Home healthcare coordination

### What It Is NOT
- An AI doctor
- A diagnosis platform
- A prescription engine
- A replacement for medical professionals

---

## Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                        RisaCare Platform                           │
├────────────────────────────────────────────────────────────────────┤
│  B2C Services (4700-4729)          B2B Services (4740-4743)       │
│  ├── Core Platform (4700-4708)     ├── Hospital (4740)            │
│  ├── Chronic Care (4720)           ├── Doctor Practice (4741)     │
│  ├── Elderly Care (4721)          ├── Lab (4742)                 │
│  ├── Mental Health (4722)         └── Pharmacy (4743)            │
│  ├── Teleconsult (4723)                                          │
│  ├── Insurance (4724)                                            │
│  ├── Nutrition (4725)                                             │
│  ├── Second Opinion (4726)                                        │
│  ├── Vaccination (4727)                                           │
│  ├── Home Healthcare (4728)                                       │
│  └── Sleep (4729)                                                 │
├────────────────────────────────────────────────────────────────────┤
│                  Frontend Layer                                    │
│        Mobile (React Native/Expo)  │  Web (React/Vite)            │
├─────────────────────────────────────────────────────────────────┤
│                  REZ Intelligence Layer                           │
│   Intent │ Health Expert │ Memory │ Signals │ Behavior            │
├─────────────────────────────────────────────────────────────────┤
│                  RABTUL Core Services                            │
│     Auth │ Wallet │ Payment │ Notify │ Booking │ Profile          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Services Registry

### B2C Consumer Healthcare (4700-4729)

#### Core Platform (4700-4708)

| Port | Service | Description | Status |
|------|---------|-------------|--------|
| 4700 | risa-care-api-gateway | Main entry, routing, auth | ✅ Complete |
| 4701 | risa-care-profile-service | Profiles, family, emergency contacts | ✅ Complete |
| 4702 | risa-care-records-service | Health records, OCR, extraction | ✅ Complete |
| 4703 | risa-care-wellness-service | Cycle, habits, challenges, pregnancy | ✅ Complete |
| 4704 | risa-care-visit-service | Appointments, visit history, teleconsult | ✅ Complete |
| 4705 | risa-care-consent-service | HIPAA/DPDP compliance, permissions | ✅ Complete |
| 4706 | risa-care-care-circle-service | Family management, caregiver access | ✅ Complete |
| 4707 | risa-care-medication-service | Prescriptions, reminders, adherence | ✅ Complete |

#### Healthcare Products (4720-4729)

| Port | Service | Description | Status |
|------|---------|-------------|--------|
| 4720 | risa-care-chronic-care-service | Diabetes, BP, Thyroid management | ✅ Complete |
| 4721 | risa-care-elderly-service | Fall detection, emergency SOS, check-ins | ✅ Complete |
| 4722 | risa-care-mental-health-service | Mood tracking, therapy, crisis support | ✅ Complete |
| 4723 | risa-care-teleconsult-service | Video consultations, doctor matching | ✅ Complete |
| 4724 | risa-care-insurance-service | Plan comparison, claims tracking | ✅ Complete |
| 4725 | risa-care-nutrition-service | AI meal planning, calorie tracking | ✅ Complete |
| 4726 | risa-care-second-opinion-service | Expert opinions, specialist matching | ✅ Complete |
| 4727 | risa-care-vaccination-service | Immunization tracking, certificates | ✅ Complete |
| 4728 | risa-care-home-healthcare-service | Home nursing, caregiver matching | ✅ Complete |
| 4729 | risa-care-sleep-service | Sleep pattern analysis, quality scoring | ✅ Complete |

### B2B Healthcare Enterprise (4740-4743)

| Port | Service | Description | Status |
|------|---------|-------------|--------|
| 4740 | risa-care-hospital-service | Hospital management, ADT, wards | ✅ Complete |
| 4741 | risa-care-doctor-practice-service | Clinic management, prescriptions | ✅ Complete |
| 4742 | risa-care-lab-service | Lab information system, results | ✅ Complete |
| 4743 | risa-care-pharmacy-management-service | Inventory, dispensing, suppliers | ✅ Complete |

### Emergency & Integration Services (4730-4732)

| Port | Service | Description | Status |
|------|---------|-------------|--------|
| 4730 | emergency-service | Ambulance dispatch, SOS, hospital coordination | ✅ Complete |
| 4731 | abha-service | India Digital Health ID (ABHA) integration | ✅ Complete |
| 4732 | risa-care-ai-scribe | AI Clinical Scribe - SOAP notes generation | ✅ Complete |

### Compliance & Engagement (4750-4752)

| Port | Service | Description | Status |
|------|---------|-------------|--------|
| 4750 | risa-care-rcm-service | Revenue Cycle Management | ✅ Complete |
| 4751 | risa-care-ivr-service | IVR Service - Phone booking, triage | ✅ NEW |
| 4752 | risa-care-compliance-service | HIPAA/PDP compliance automation | ✅ NEW |

### AI + Revenue Services (4753-4762)

| Port | Service | Description | Status |
|------|---------|-------------|--------|
| 4753 | risa-care-wearable-service | Apple Health, Google Fit | ✅ Complete |
| 4753 | risa-care-wearable-service | Apple Health, Google Fit | ✅ Complete |
| 4754 | risa-care-predictive-service | Deterioration, Fall risk | ✅ Complete |
| 4755 | risa-care-lab-integration | SRL, PathLabs | ✅ Complete |
| 4756 | risa-care-teleconsult-v2 | Video consultations | ✅ Complete |
| 4757 | risa-care-pharmacy-integration | 1mg, PharmEasy | ✅ Complete |
| 4758 | risa-care-eligibility-service | CAQH, NaviNet | ✅ Complete |
| 4759 | risa-care-clearinghouse | 837 Claims | ✅ Complete |
| 4760 | risa-care-nursing-home-service | Resident management | ✅ Complete |
| 4761 | risa-care-fhir-service | FHIR R4 | ✅ Complete |
| 4762 | risa-care-ambient-audio-service | Real-time STT | ✅ Complete |

### Patient/Doctor Apps (4770-4781)

| Port | Service | Description | Status |
|------|---------|-------------|--------|
| 4770 | risa-care-mobile-backend | Auth, Chat, Appointments | ✅ NEW |
| 4772 | risa-care-hospital-admin | Hospital admin dashboard | ✅ NEW |
| 4773 | risa-care-telemedicine | Video, E-Prescription | ✅ NEW |
| 4774 | risa-care-marketplace | Health products | ✅ NEW |
| 4775 | risa-care-insurance-aggregator | Insurance compare/buy | ✅ NEW |
| 4776 | risa-care-homecare | Home nursing, caregivers | ✅ NEW |
| 4777 | risa-care-diagnostics | Lab tests, booking | ✅ NEW |
| 4778 | risa-care-emr-service | Electronic Medical Records | ✅ NEW |
| 4779 | risa-care-patient-portal | Patient records portal | ✅ NEW |
| 4780 | risa-care-provider-directory | Doctor/hospital search | ✅ NEW |
| 4781 | risa-care-health-wallet | Savings, rewards | ✅ NEW |

### Frontend Applications

| App | Stack | Description |
|-----|-------|-------------|
| risa-care-mobile | React Native (Expo) | Mobile app (19 screens) |
| risa-care-web | React + Vite | Web dashboard |

---

## API Endpoints

### Core Platform (4700-4708)

#### API Gateway (4700)
```
GET    /health                      - Gateway health
POST   /auth/validate              - Validate JWT
POST   /auth/refresh               - Refresh token
```

#### Profile Service (4701)
```
POST   /api/profile                       - Create profile
GET    /api/profile/:userId             - Get profile
PUT    /api/profile/:userId             - Update profile
GET    /api/profile/:userId/emergency-contacts
POST   /api/profile/:userId/emergency-contacts
GET    /api/profile/:userId/medical-info
```

#### Records Service (4702)
```
POST   /api/records                         - Create record
GET    /api/records/:userId               - Get records
POST   /api/records/:userId/documents       - Upload document
GET    /api/records/:userId/timeline     - Get timeline
```

#### Wellness Service (4703)
```
GET    /api/wellness/:userId/score        - Health score
GET    /api/cycle                         - Cycle data
POST   /api/cycle                         - Log cycle
GET    /api/habits                        - Get habits
POST   /api/habits                        - Log habit
```

#### Visit Service (4704)
```
POST   /api/appointments                      - Book appointment
GET    /api/appointments/:userId            - List appointments
GET    /api/visits/:userId                  - Visit history
POST   /api/teleconsult/start                 - Start teleconsult
```

#### Consent Service (4705)
```
POST   /api/consents                           - Grant consent
GET    /api/consents/:userId                 - Get consents
PUT    /api/privacy/:userId                   - Update privacy
GET    /api/consents/audit/:userId            - Audit trail
```

#### Care Circle Service (4706)
```
POST   /api/circles                            - Create circle
GET    /api/circles/:userId                  - Get circles
POST   /api/circles/:circleId/members          - Add member
GET    /api/emergency/:userId                 - Emergency access
```

#### Medication Service (4707)
```
POST   /api/medications                         - Add medication
GET    /api/medications/:userId               - Get medications
POST   /api/adherence                           - Log dose
GET    /api/adherence/:userId/report          - Adherence report
POST   /api/interactions/check                  - Check interactions
```

### B2C Healthcare (4720-4729)

#### Chronic Care (4720)
```
POST   /api/chronic/diseases                      - Add disease
GET    /api/chronic/:userId/diseases            - Get diseases
POST   /api/chronic/:userId/readings             - Log reading
GET    /api/chronic/:userId/readings/:type      - Get readings
GET    /api/chronic/:userId/ai-insights         - AI insights
```

#### Elderly Care (4721)
```
POST   /api/elderly/checkins                      - Daily check-in
GET    /api/elderly/:userId/checkins            - Check-in history
POST   /api/elderly/sos                          - Trigger SOS
GET    /api/elderly/:userId/fall-history        - Fall history
GET    /api/elderly/:userId/gps                 - Location
```

#### Mental Health (4722)
```
POST   /api/mental/mood                           - Log mood
GET    /api/mental/:userId/mood                  - Mood history
POST   /api/mental/journal                       - Add journal entry
GET    /api/mental/:userId/journal              - Journal entries
POST   /api/mental/crisis                        - Crisis support
GET    /api/mental/:userId/assessments          - Assessments
```

#### Teleconsult (4723)
```
POST   /api/teleconsult/sessions                   - Start session
GET    /api/teleconsult/sessions/:id            - Get session
POST   /api/teleconsult/sessions/:id/end        - End session
GET    /api/teleconsult/doctors                  - List doctors
```

#### Insurance (4724)
```
GET    /api/insurance/plans                      - List plans
POST   /api/insurance/compare                    - Compare plans
GET    /api/insurance/:userId/policies          - User policies
POST   /api/insurance/claims                    - File claim
GET    /api/insurance/claims/:claimId           - Claim status
```

#### Nutrition (4725)
```
POST   /api/nutrition/meals                       - Log meal
GET    /api/nutrition/:userId/meals             - Meal history
POST   /api/nutrition/diet-plans                 - Create plan
GET    /api/nutrition/:userId/diet-plans        - Get plans
GET    /api/nutrition/:userId/calories          - Calorie summary
```

#### Second Opinion (4726)
```
POST   /api/requests                              - Create request
GET    /api/requests/:patientId                 - Get requests
GET    /api/specialists                         - List specialists
GET    /api/specialists/match?specialty=        - Match specialists
POST   /api/opinions                              - Submit opinion
GET    /api/opinions/request/:requestId/summary  - Opinion summary
```

#### Vaccination (4727)
```
POST   /api/vaccinations                          - Add record
GET    /api/vaccinations/:userId                - Get records
GET    /api/vaccinations/:userId/compliance     - Compliance report
GET    /api/vaccines                            - Vaccine catalog
POST   /api/reminders                            - Set reminder
POST   /api/certificates                         - Generate certificate
```

#### Home Healthcare (4728)
```
POST   /api/care-requests                        - Create request
GET    /api/care-requests/:patientId            - Get requests
GET    /api/caregivers/search                   - Search caregivers
POST   /api/visits                              - Schedule visit
POST   /api/visits/:visitId/start              - Start visit
POST   /api/care-plans                          - Create plan
POST   /api/equipment                           - Request equipment
POST   /api/vitals                              - Record vitals
GET    /api/vitals/:patientId/trends           - Vital trends
```

#### Sleep (4729)
```
POST   /api/sleep                                - Log sleep
GET    /api/sleep/:userId                       - Sleep history
GET    /api/sleep/:userId/analysis              - Analysis
GET    /api/sleep/:userId/quality               - Quality report
POST   /api/sleep/goals                         - Set goals
```

### B2B Enterprise (4740-4743)

#### Hospital Service (4740)
```
POST   /api/hospital                              - Create hospital
POST   /api/patients                             - Register patient
POST   /api/admissions                           - Admit patient
POST   /api/beds/allocate                        - Allocate bed
POST   /api/operations                           - Schedule surgery
GET    /api/staff/stats                          - Staff statistics
```

#### Doctor Practice (4741)
```
POST   /api/practice                              - Create practice
POST   /api/appointments                          - Book appointment
GET    /api/appointments/slots/:doctorId         - Available slots
POST   /api/prescriptions                         - Create prescription
GET    /api/revenue                              - Revenue stats
```

#### Lab Service (4742)
```
POST   /api/labs                                 - Create lab
GET    /api/tests                                - List tests
POST   /api/samples                              - Register sample
POST   /api/results                              - Submit results
GET    /api/results/:id/report                   - Generate report
```

#### Pharmacy Management (4743)
```
POST   /api/pharmacy                             - Setup pharmacy
GET    /api/medicines                            - List medicines
GET    /api/inventory/low-stock                  - Low stock alerts
POST   /api/prescriptions/validate               - Validate Rx
POST   /api/sales                                - Process sale
GET    /api/suppliers/rankings                  - Supplier rankings
```

---

## Events

### B2C Events
- `risa.health.chronic.disease.added`
- `risa.health.chronic.reading.logged`
- `risa.health.elderly.checkin.completed`
- `risa.health.elderly.fall.detected`
- `risa.health.elderly.sos.triggered`
- `risa.health.mental.mood.logged`
- `risa.health.mental.crisis.escalated`
- `risa.health.teleconsult.started`
- `risa.health.teleconsult.ended`
- `risa.health.insurance.claim.filed`
- `risa.health.nutrition.meal.logged`
- `risa.health.nutrition.plan.created`
- `risa.health.opinion.requested`
- `risa.health.opinion.received`
- `risa.health.vaccination.recorded`
- `risa.health.vaccination.certificate.generated`
- `risa.health.homecare.request.created`
- `risa.health.homecare.visit.completed`
- `risa.health.homecare.equipment.delivered`
- `risa.health.sleep.logged`
- `risa.health.sleep.alert`

### B2B Events
- `risa.enterprise.hospital.patient.registered`
- `risa.enterprise.hospital.admission.created`
- `risa.enterprise.hospital.bed.allocated`
- `risa.enterprise.practice.appointment.booked`
- `risa.enterprise.practice.prescription.created`
- `risa.enterprise.lab.sample.collected`
- `risa.enterprise.lab.result.ready`
- `risa.enterprise.pharmacy.inventory.low`
- `risa.enterprise.pharmacy.prescription.dispensed`

---

## External Integrations

### REZ Intelligence
| Service | Port | Purpose |
|---------|------|---------|
| Intent Predictor | 4018 | Intent routing |
| Health Expert | 3011 | Medical interpretation |
| Memory Layer | 4201 | Health memory |
| Signal Aggregator | 4142 | Behavioral signals |

### RABTUL Services
| Service | Port | Purpose |
|---------|------|---------|
| Auth | 4002 | JWT, OTP, OAuth |
| Payment | 4001 | Razorpay, UPI |
| Wallet | 4004 | Coins, cashback |
| Notifications | 4011 | Push, SMS, WhatsApp |
| Booking | 4020 | Reservations |
| Profile | 4013 | User profiles |

---

## Environment Variables

```bash
# B2C Services (4700-4729)
API_GATEWAY_PORT=4700
PROFILE_SERVICE_PORT=4701
RECORDS_SERVICE_PORT=4702
WELLNESS_SERVICE_PORT=4703
VISIT_SERVICE_PORT=4704
CONSENT_SERVICE_PORT=4705
CARE_CIRCLE_SERVICE_PORT=4706
MEDICATION_SERVICE_PORT=4707

CHRONIC_CARE_PORT=4720
ELDERLY_CARE_PORT=4721
MENTAL_HEALTH_PORT=4722
TELECONSULT_PORT=4723
INSURANCE_PORT=4724
NUTRITION_PORT=4725
SECOND_OPINION_PORT=4726
VACCINATION_PORT=4727
HOME_HEALTHCARE_PORT=4728
SLEEP_PORT=4729

# B2B Services (4740-4743)
HOSPITAL_PORT=4740
DOCTOR_PRACTICE_PORT=4741
LAB_PORT=4742
PHARMACY_PORT=4743

# AI + RCM Services (4750-4762)
RCM_SERVICE_PORT=4750
WEARABLE_SERVICE_PORT=4753
PREDICTIVE_SERVICE_PORT=4754
LAB_INTEGRATION_PORT=4755
TELECONSULT_V2_PORT=4756
PHARMACY_INTEGRATION_PORT=4757
ELIGIBILITY_SERVICE_PORT=4758
CLEARINGHOUSE_PORT=4759
NURSING_HOME_PORT=4760
FHIR_SERVICE_PORT=4761
AMBIENT_AUDIO_PORT=4762

# Patient/Doctor Apps (4770-4779)
MOBILE_BACKEND_PORT=4770
TELEMEDICINE_PORT=4773
EMR_SERVICE_PORT=4778

# REZ Intelligence
REZ_INTELLIGENCE_URL=http://localhost:4018
REZ_INTELLIGENCE_API_KEY=your-key

# RABTUL
AUTH_SERVICE_URL=http://localhost:4002
PAYMENT_SERVICE_URL=http://localhost:4001
WALLET_SERVICE_URL=http://localhost:4004
NOTIFICATION_SERVICE_URL=http://localhost:4011
INTERNAL_SERVICE_TOKEN=your-token

# Database
MONGODB_URI=mongodb://localhost:27017/risa_care
```

---

## MongoDB Database Registry (Updated June 6, 2026)

**Status:** ✅ All 56 services have MongoDB support

| Port | Service | Database |
|------|---------|----------|
| 4701 | profile-service | `mongodb://localhost:27017/risa-care-profile` |
| 4702 | records-service | `mongodb://localhost:27017/risa-care-records` |
| 4703 | wellness-service | `mongodb://localhost:27017/risa-care-wellness` |
| 4704 | visit-service | `mongodb://localhost:27017/risa-care-visits` |
| 4705 | consent-service | `mongodb://localhost:27017/risa-care-consents` |
| 4706 | care-circle-service | `mongodb://localhost:27017/risa-care-circles` |
| 4707 | medication-service | `mongodb://localhost:27017/risa-care-medications` |
| 4720 | chronic-care-service | `mongodb://localhost:27017/risa_care_chronic` |
| 4721 | elderly-service | `mongodb://localhost:27017/risa_care_elderly` |
| 4722 | mental-health-service | `mongodb://localhost:27017/risa_care_mental_health` |
| 4723 | teleconsult-service | `mongodb://localhost:27017/risa_care_teleconsult` |
| 4724 | insurance-service | `mongodb://localhost:27017/risa_care_insurance` |
| 4725 | nutrition-service | `mongodb://localhost:27017/risa_care_nutrition` |
| 4726 | second-opinion-service | `mongodb://localhost:27017/risa_care_second_opinion` |
| 4727 | vaccination-service | `mongodb://localhost:27017/risa_care_vaccination` |
| 4728 | home-healthcare-service | `mongodb://localhost:27017/risa_care_home_healthcare` |
| 4729 | sleep-service | `mongodb://localhost:27017/risa_care_sleep` |
| 4740 | hospital-service | `mongodb://localhost:27017/risa_care_hospital` |
| 4741 | doctor-practice-service | `mongodb://localhost:27017/risa_care_doctor_practice` |
| 4742 | lab-service | `mongodb://localhost:27017/risa_care_lab` |
| 4743 | pharmacy-service | `mongodb://localhost:27017/risa_care_pharmacy` |
| 4753 | wearable-service | `mongodb://localhost:27017/risa_care_wearable` |
| 4754 | predictive-service | `mongodb://localhost:27017/risa_care_predictive` |
| 4755 | lab-integration-service | `mongodb://localhost:27017/risa_care_lab_integration` |
| 4756 | teleconsult-v2 | `mongodb://localhost:27017/risa_care_teleconsult` |
| 4757 | pharmacy-integration | `mongodb://localhost:27017/risa_care_pharmacy_integration` |
| 4758 | eligibility-service | `mongodb://localhost:27017/risa_care_eligibility` |
| 4759 | clearinghouse | `mongodb://localhost:27017/risa_care_clearinghouse` |
| 4760 | nursing-home-service | `mongodb://localhost:27017/risa_care_nursing_home` |
| 4761 | fhir-service | `mongodb://localhost:27017/risa_care_fhir` |
| 4770 | mobile-backend | `mongodb://localhost:27017/risa_care_mobile` |
| 4772 | hospital-admin | `mongodb://localhost:27017/risa_care_hospital_admin` |
| 4773 | telemedicine | `mongodb://localhost:27017/risa_care_telemedicine` |
| 4774 | marketplace | `mongodb://localhost:27017/risa_care_marketplace` |
| 4775 | insurance-aggregator | `mongodb://localhost:27017/risa_care_insurance_agg` |
| 4776 | homecare | `mongodb://localhost:27017/risa_care_homecare` |
| 4778 | emr-service | `mongodb://localhost:27017/risa_care_emr` |
| 4779 | patient-portal | `mongodb://localhost:27017/risa_care_patient_portal` |
| 4780 | provider-directory | `mongodb://localhost:27017/risa_care_provider_directory` |
| 4781 | health-wallet | `mongodb://localhost:27017/risa_care_health_wallet` |

### Health Check Response Format
```json
{
  "status": "healthy",
  "service": "risa-care-xxx",
  "version": "1.0.0",
  "database": "connected",
  "timestamp": "2026-06-06T..."
}
```

---

## Quick Start

```bash
# B2C Services
cd risa-care-api-gateway && npm run dev          # 4700
cd risa-care-profile-service && npm run dev    # 4701
cd risa-care-records-service && npm run dev     # 4702
cd risa-care-wellness-service && npm run dev    # 4703
cd risa-care-visit-service && npm run dev       # 4704
cd risa-care-consent-service && npm run dev     # 4705
cd risa-care-care-circle-service && npm run dev # 4706
cd risa-care-medication-service && npm run dev  # 4707

# B2C Healthcare Products
cd risa-care-chronic-care-service && npm run dev    # 4720
cd risa-care-elderly-service && npm run dev         # 4721
cd risa-care-mental-health-service && npm run dev   # 4722
cd risa-care-teleconsult-service && npm run dev      # 4723
cd risa-care-insurance-service && npm run dev        # 4724
cd risa-care-nutrition-service && npm run dev        # 4725
cd risa-care-second-opinion-service && npm run dev  # 4726
cd risa-care-vaccination-service && npm run dev     # 4727
cd risa-care-home-healthcare-service && npm run dev # 4728
cd risa-care-sleep-service && npm run dev           # 4729

# B2B Services
cd risa-care-hospital-service && npm run dev          # 4740
cd risa-care-doctor-practice-service && npm run dev   # 4741
cd risa-care-lab-service && npm run dev              # 4742
cd risa-care-pharmacy-management-service && npm run dev # 4743

# AI + RCM Services
cd risa-care-rcm-service && npm run dev              # 4750
cd risa-care-wearable-service && npm run dev         # 4753
cd risa-care-predictive-service && npm run dev       # 4754
cd risa-care-lab-integration-service && npm run dev  # 4755
cd risa-care-teleconsult-v2 && npm run dev           # 4756
cd risa-care-pharmacy-integration && npm run dev     # 4757
cd risa-care-eligibility-service && npm run dev      # 4758
cd risa-care-clearinghouse && npm run dev           # 4759
cd risa-care-nursing-home-service && npm run dev     # 4760
cd risa-care-fhir-service && npm run dev             # 4761
cd risa-care-ambient-audio-service && npm run dev    # 4762

# Patient/Doctor Apps
cd risa-care-mobile-backend && npm run dev            # 4770
cd risa-care-hospital-admin && npm run dev          # 4772
cd risa-care-telemedicine && npm run dev             # 4773
cd risa-care-marketplace && npm run dev              # 4774
cd risa-care-insurance-aggregator && npm run dev     # 4775
cd risa-care-homecare && npm run dev                # 4776
cd risa-care-diagnostics && npm run dev              # 4777
cd risa-care-emr-service && npm run dev              # 4778
cd risa-care-patient-portal && npm run dev            # 4779
cd risa-care-provider-directory && npm run dev      # 4780
cd risa-care-health-wallet && npm run dev            # 4781
```

---

## Project Stats

| Category | Count |
|----------|-------|
| Core Platform Services | 8 |
| B2C Healthcare Services | 10 |
| B2B Enterprise Services | 4 |
| AI + RCM Services | 13 |
| Patient/Doctor Apps | 11 |
| **Total Backend Services** | **56** ✅ |
| MongoDB Connected | **56** ✅ |
| Frontend Apps | 2 |
| Documentation Files | 15+ |

---

## Git Repository

**Remote:** git@github.com:imrejaul007/RisaCare.git

### Recent Commits
```
xxxxxxx feat: Add MongoDB to 13 RisaCare services (4724-4743, 4709, 4754-4755)
512a0f6 feat: Complete RisaCare ecosystem audit fixes
e8a0d64 chore: add linting, formatting, and service discovery
3d55167 feat: complete frontend - mobile 12 screens + web dashboard
8be162e feat: mobile app structure, API client, store, deployment guide
59d73fe feat: RisaCare v1.0.0 - India Healthcare Operating System
```

---

## Documentation

| Document | Purpose |
|---------|---------|
| [CLAUDE.md](CLAUDE.md) | Developer quick reference |
| [MONGODB-AUDIT.md](MONGODB-AUDIT.md) | MongoDB integration audit |
| [docker-compose-full.yml](docker-compose-full.yml) | Full Docker deployment |
| [start-services.sh](start-services.sh) | Quick start script |
| [SPEC.md](SPEC.md) | Product specification |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Technical architecture |
| [docs/API-CONTRACTS.md](docs/API-CONTRACTS.md) | API contracts |
| [docs/DATABASE-SCHEMAS.md](docs/DATABASE-SCHEMAS.md) | Database schemas |
| [docs/EVENTS.md](docs/EVENTS.md) | Event definitions |
| [docs/ECOSYSTEM-INTEGRATION.md](docs/ECOSYSTEM-INTEGRATION.md) | REZ/RABTUL |

---

## Ecosystem Integration

### HOJAI-AI (Port 4600-4605)
- AI interpretation, medical scribe, voice AI
- Port: 4730 (LLM), 4590 (Voice)

### RABTUL Technologies (Port 4001-4011)
- Auth (4002), Payment (4001), Wallet (4004)
- Notifications (4011), Booking (4020)

### REZ Intelligence (Port 3000-3020)
- Intent Graph, Health Expert (3011)
- Memory, Signals

---

## Compliance

- **HIPAA-inspired** controls for health data
- **DPDP Act** compliance (India's data protection)
- **Field-level encryption** for sensitive health data
- **Audit logging** for all data access
- **Never commit** `.env` files

---

*This is the canonical Source of Truth for RisaCare. Last updated: June 7, 2026*
