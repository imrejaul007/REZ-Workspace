# CARECODE - State of Technology

**Version:** 1.0.0
**Date:** June 3, 2026
**Industry:** Healthcare
**Tagline:** "AI for Better Patient Care"

---

## 1. PRODUCT OVERVIEW

CARECODE is an AI-powered operating system for clinics, hospitals, and healthcare establishments. It combines AI agents (workers), automated workers, voice agents, and a complete backend to manage healthcare operations.

### Target Customers
- Standalone clinics and hospitals (HOJAI AI clients)
- REZ ecosystem healthcare clients

### Pricing
- ₹4,999/month (HOJAI AI)
- Included in REZ-Merchant OS (REZ ecosystem)

---

## 2. AI EMPLOYEES (AGENTS)

AI Agents are specialized workers that interact with patients and staff.

### 2.1 Care Manager AI
- **Purpose:** Patient coordination, intake
- **Interactions:** Patient intake, care coordination, follow-up
- **Skills:**
  - Patient registration
  - Care plan coordination
  - Follow-up scheduling
  - Health tips

### 2.2 Pharmacist AI
- **Purpose:** Prescription verification, medication guidance
- **Interactions:** Prescription review, drug interactions, dosage guidance
- **Skills:**
  - Drug interaction checking
  - Allergy alerts
  - Dosage recommendations
  - Side effect education

### 2.3 Diagnosis Assistant AI
- **Purpose:** Symptom analysis, triage
- **Interactions:** Symptom input, condition suggestions, urgency assessment
- **Skills:**
  - Symptom analysis
  - Triage classification
  - Condition suggestions
  - Urgency assessment

### 2.4 Health Records AI
- **Purpose:** Documentation, record management
- **Interactions:** Medical note generation, record retrieval
- **Skills:**
  - Auto documentation
  - Record summarization
  - History analysis
  - Privacy compliance

---

## 3. AI WORKERS (AUTOMATED TASKS)

AI Workers run automated background processes.

### 3.1 Appointment Worker
- **Purpose:** Scheduling, reminders
- **Tasks:**
  - Slot management
  - Reminder calls
  - Cancellation handling
  - Waitlist management

### 3.2 Prescription Worker
- **Purpose:** Prescription management, renewals
- **Tasks:**
  - Renewal tracking
  - Refill requests
  - Interaction monitoring
  - Compliance tracking

### 3.3 Lab Result Worker
- **Purpose:** Result processing, interpretation
- **Tasks:**
  - Result logging
  - Abnormality detection
  - Report generation
  - Doctor notification

### 3.4 Compliance Worker
- **Purpose:** HIPAA/regulatory compliance
- **Tasks:**
  - Privacy monitoring
  - Audit trail
  - Policy enforcement
  - Documentation

---

## 4. VOICE AGENTS

### 4.1 Phone Receptionist
- **Capabilities:**
  - Answer calls 24/7
  - Appointment booking
  - Emergency routing
  - Prescription refills
- **Languages:** Hindi, English, Tamil, Telugu, Bengali, Marathi, Gujarati

### 4.2 WhatsApp AI
- **Capabilities:**
  - Text/voice conversations
  - Appointment reminders
  - Report delivery
  - Health tips

### 4.3 IVR System
- **Capabilities:**
  - Auto-attendant
  - Appointment IVR
  - Emergency routing
  - Prescription status

---

## 5. BACKEND SERVICES

### 5.1 Patient Service (`/services/patient-service/`)
- Patient profiles
- Medical history
- Insurance info
- Contact management

### 5.2 Appointment Service (`/services/appointment-service/`)
- Scheduling
- Slot management
- Reminders
- Cancellation

### 5.3 Pharmacy Service (`/services/pharmacy-service/`)
- Prescription management
- Inventory
- Dispensary
- Renewals

### 5.4 Lab Service (`/services/lab-service/`)
- Test ordering
- Result processing
- Report generation
- Integration

---

## 6. INTEGRATION POINTS

### 6.1 HOJAI Core
- Intent Graph
- Memory System
- Trust Engine
- Agent Marketplace

### 6.2 Merchant OS
- Patient database
- Billing integration
- Reporting

### 6.3 REZ Merchant OS (for REZ clients)
- Full ecosystem sync
- Cross-product insights
- Unified reporting

### 6.4 External Systems
- Lab integrations
- Pharmacy systems
- Insurance verification
- Government health schemes

---

## 7. API ENDPOINTS

### AI Agent APIs
```
POST /api/ai/care/intake
POST /api/ai/pharmacy/verify
POST /api/ai/diagnosis/analyze
POST /api/ai/records/generate
```

### Worker APIs
```
POST /api/workers/appointment/schedule
GET  /api/workers/prescription/renewals
GET  /api/workers/lab/results/:patientId
GET  /api/workers/compliance/audit
```

### Service APIs
```
GET  /api/services/patients/:id
POST /api/services/patients
GET  /api/services/appointments
POST /api/services/appointments
GET  /api/services/prescriptions/:patientId
POST /api/services/lab/order
```

### Voice Agent APIs
```
POST /api/voice/call/incoming
POST /api/voice/whatsapp/webhook
GET  /api/voice/ivr/:flowId
```

---

## 8. TECHNOLOGY STACK

| Layer | Technology |
|-------|------------|
| Runtime | Node.js / TypeScript |
| Framework | Express.js |
| Database | PostgreSQL (Merchant OS) |
| Cache | Redis |
| AI/ML | HOJAI Core / OpenAI |
| Voice | Twilio / Exotel |
| Storage | S3 / Local (HIPAA compliant) |
| Monitoring | Prometheus / Grafana |
| Container | Docker |
| Orchestration | Kubernetes |

---

## 9. DEPLOYMENT

### Ports
- **Main Service:** 4102
- **Voice Agents:** 4850-4860

### Environment Variables
```bash
PORT=4102
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
HOJAI_CORE_URL=http://localhost:4100
MERCHANT_OS_URL=http://localhost:4000
VOICE_PROVIDER=twilio
```

### Health Checks
```bash
GET /health      # Service health
GET /ai/status   # AI employee status
```

---

## 10. CURRENT STATUS

| Component | Status | Notes |
|-----------|--------|-------|
| Care Manager AI | ✅ Implemented | Full implementation in src/index.ts |
| Pharmacist AI | ✅ Implemented | Drug verification in src/index.ts |
| Diagnosis Assistant AI | ✅ Implemented | Symptom analysis in src/index.ts |
| Health Records AI | ✅ Implemented | Documentation in src/index.ts |
| Lab Result AI | ✅ Implemented | Interpretation in src/index.ts |
| Appointment Worker | ✅ Implemented | In src/index.ts |
| Prescription Worker | ✅ Implemented | In src/index.ts |
| Compliance Worker | ⏳ Pending | Needs implementation |
| Phone Receptionist | ⏳ Pending | Needs voice agent setup |
| WhatsApp AI | ⏳ Pending | Needs WhatsApp integration |
| IVR System | ⏳ Pending | Needs IVR flow builder |
| Patient Service | ⏳ Pending | Needs service folder |
| Appointment Service | ⏳ Pending | Needs service folder |
| Pharmacy Service | ⏳ Pending | Needs service folder |
| Lab Service | ⏳ Pending | Needs service folder |

---

## 11. MISSING ITEMS (TODO)

1. **Voice agent implementations** - Phone, WhatsApp, IVR
2. **Worker implementation** - Compliance Worker
3. **Service implementations** - Patient, Appointment, Pharmacy, Lab
4. **CLAUDE.md** - Developer documentation
5. **README.md** - Needs creation
6. **Dockerfile** - Container configuration
7. **services/** folders - Need proper structure

---

**Last Updated:** June 3, 2026
**Maintainer:** HOJAI AI Team
