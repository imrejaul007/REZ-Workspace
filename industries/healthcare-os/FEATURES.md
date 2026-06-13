# Healthcare OS - Features

**Status:** ✅ BUILT | **Port:** 5020 | **Updated:** June 14, 2026

---

## Digital Twins

### Patient Twin
- HIPAA-compliant records
- Longitudinal health history
- Medication tracking
- Allergy alerts
- Insurance information
- Appointment history

### Appointment Twin
- Multi-provider scheduling
- Wait time estimation
- Reminder automation
- Cancellation handling
- Waitlist management
- Telehealth integration

### Doctor Twin
- Schedule management
- Specialization tracking
- Patient load analytics
- Performance metrics
- Credential management

### Billing Twin
- Insurance claims processing
- Payment tracking
- Explanation of benefits
- Collections management
- Financial counseling

### Inventory Twin
- Medical supplies tracking
- Expiry alerts
- Reorder automation
- Equipment maintenance
- Pharmaceutical tracking

---

## AI Agents

### Intake Agent
- Patient registration
- Symptom collection
- Insurance verification
- Privacy consent

### Triage Agent
- Urgency assessment
- Department routing
- Wait time communication
- Emergency escalation

### Scheduling Agent
- Appointment booking
- Rescheduling automation
- Provider matching
- Follow-up scheduling

### Followup Agent
- Post-visit care
- Medication reminders
- Test result delivery
- Satisfaction surveys

### Prescription Agent
- Rx verification
- Drug interaction check
- Refill requests
- Pharmacy coordination

### Claims Agent
- Claims processing
- Denial management
- Appeals handling
- Status tracking

---

## API Endpoints

### Core
- `GET /health` - Health check
- `GET /api/twins` - List all twins
- `GET /api/agents` - List all agents

### Patients
- `POST /api/patients` - Register patient
- `GET /api/patients/:id` - Get patient
- `PUT /api/patients/:id` - Update patient
- `GET /api/patients/:id/history` - Medical history
- `GET /api/patients/:id/appointments` - Patient appointments

### Appointments
- `POST /api/appointments` - Book appointment
- `GET /api/appointments/:id` - Get appointment
- `PUT /api/appointments/:id` - Update appointment
- `POST /api/appointments/:id/cancel` - Cancel
- `GET /api/appointments/provider/:id` - Provider schedule

### Doctors
- `POST /api/doctors` - Add doctor
- `GET /api/doctors/:id` - Get doctor
- `PUT /api/doctors/:id/schedule` - Update schedule
- `GET /api/doctors/:id/availability` - Check availability

### Billing
- `GET /api/billing/:patientId` - Get billing info
- `POST /api/billing/claim` - Submit claim
- `GET /api/billing/claims/:id` - Claim status
- `POST /api/billing/payment` - Record payment

---

## Integrations

| Service | Integration Type | Purpose |
|---------|-----------------|---------|
| RTMN Hub | HTTP | Central orchestration |
| AgentOS | HTTP | Agent invocation |
| Government OS | Event | Insurance verification |
| RABTUL | Payment | Transactions |
| Legal OS | Event | Compliance |

---

## Quick Start

```bash
cd industries/healthcare-os
npm install
node src/index.js
# Runs on http://localhost:5020
```
