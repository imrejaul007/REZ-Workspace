# Healthcare OS - Medical Services Platform

**Status:** ✅ BUILT - June 14, 2026  
**Port:** 5020  
**Location:** `industries/healthcare-os/`

## Overview

Healthcare OS provides a comprehensive platform for medical services, connecting patients, doctors, appointments, billing, and inventory with AI-powered automation.

## Digital Twins

| Twin | Description | Capabilities |
|------|-------------|--------------|
| **Patient Twin** | Patient records and history | HIPAA-compliant, longitudinal data |
| **Appointment Twin** | Scheduling and visits | Real-time availability, reminders |
| **Doctor Twin** | Physician management | Schedule, specializations, ratings |
| **Billing Twin** | Financial operations | Insurance, claims, payments |
| **Inventory Twin** | Medical supplies | Alerts, reorder, expiry tracking |

## AI Agents

| Agent | Purpose |
|-------|---------|
| **Intake Agent** | Patient registration, symptom collection |
| **Triage Agent** | Urgency assessment, routing |
| **Scheduling Agent** | Appointment booking, rescheduling |
| **Followup Agent** | Post-visit care, reminders |
| **Prescription Agent** | Rx management, interactions |
| **Claims Agent** | Insurance processing, denials |

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /health` | - | Health check |
| `GET /api/twins` | GET | List all twins |
| `GET /api/twins/patient/:id` | GET | Get patient twin |
| `GET /api/twins/appointment/:id` | GET | Get appointment twin |
| `GET /api/twins/doctor/:id` | GET | Get doctor twin |
| `GET /api/twins/billing/:id` | GET | Get billing twin |
| `GET /api/agents` | GET | List all agents |
| `POST /api/patients` | POST | Register patient |
| `GET /api/patients/:id` | GET | Get patient |
| `POST /api/appointments` | POST | Book appointment |
| `GET /api/appointments/:id` | GET | Get appointment |
| `POST /api/doctors` | POST | Add doctor |
| `GET /api/billing/:patientId` | GET | Get billing |

## Quick Start

```bash
cd industries/healthcare-os && npm install && node src/index.js

# Health check
curl http://localhost:5020/health

# Register patient
curl -X POST http://localhost:5020/api/patients \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "dob": "1985-03-15", "insurance": "ABC123"}'

# Book appointment
curl -X POST http://localhost:5020/api/appointments \
  -H "Content-Type: application/json" \
  -d '{"patientId": "patient_123", "doctorId": "dr_456", "date": "2026-06-20"}'
```

## Integration

- Connected to RTMN Hub at `http://localhost:8000`
- Healthcare Agent available via AgentOS
- HIPAA-compliant data handling
- Insurance verification integration
