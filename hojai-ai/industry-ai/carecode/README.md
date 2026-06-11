# CARECODE - Healthcare AI Operating System

**"AI for Better Patient Care"**

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Status](https://img.shields.io/badge/status-Production-green)
![License](https://img.shields.io/badge/license-Proprietary-red)

---

## Overview

CARECODE is an AI-powered operating system for clinics, hospitals, and healthcare establishments. It combines AI agents, automated workers, voice agents, and a complete backend to manage healthcare operations.

## Features

### AI Employees (Agents)

| Agent | Purpose |
|-------|---------|
| **Care Manager AI** | Patient coordination, intake |
| **Pharmacist AI** | Prescription verification, medication guidance |
| **Diagnosis Assistant AI** | Symptom analysis, triage |
| **Health Records AI** | Documentation, record management |

### AI Workers (Automated Tasks)

| Worker | Purpose |
|--------|---------|
| **Appointment Worker** | Scheduling, reminders |
| **Prescription Worker** | Prescription management, renewals |
| **Lab Result Worker** | Result processing, interpretation |
| **Compliance Worker** | HIPAA/regulatory compliance |

### Voice Agents

| Voice Agent | Description |
|-------------|-------------|
| **Phone Receptionist** | Answer calls 24/7 |
| **WhatsApp AI** | Voice/text conversations |
| **IVR System** | Auto-attendant |

## Quick Start

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Start the server
npm start

# Development mode
npm run dev
```

## Environment Variables

```bash
PORT=4102
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
HOJAI_CORE_URL=http://localhost:4100
MERCHANT_OS_URL=http://localhost:4000
```

## API Endpoints

### AI Agents
- `POST /api/ai/care-manager/intake` - Patient intake
- `POST /api/ai/pharmacist/verify` - Prescription verification
- `POST /api/ai/diagnosis/analyze` - Symptom analysis
- `GET /api/ai/health-records/:patientId` - Get health records

### Workers
- `POST /api/workers/appointment/schedule` - Schedule appointment
- `GET /api/workers/appointment/reminders` - Get reminders
- `POST /api/workers/prescription/renew` - Renew prescription
- `GET /api/workers/lab-results/:patientId` - Get lab results

### Voice Agents
- `POST /api/voice/call/incoming` - Handle incoming call
- `POST /api/voice/whatsapp/webhook` - WhatsApp webhook
- `GET /api/voice/ivr/:flowId` - IVR flow

## Port

| Service | Port |
|---------|------|
| Main Service | 4102 |
| Voice Agents | 4850-4860 |

## Architecture

```
CARECODE
├── AI Employees/     # Conversational AI agents
├── AI Workers/       # Automated background tasks
├── Voice Agents/     # Phone & WhatsApp
├── Services/         # Backend services
└── src/
    └── index.ts      # Main entry point
```

## Integration

### HOJAI Core
Connects to HOJAI Core (Port 4100) for:
- Intent Graph
- Memory System
- Trust Engine
- Agent Marketplace

### Merchant OS
Connects to Merchant OS (Port 4000) for:
- Patient management
- Billing
- Inventory

## API Examples

### Health Check
```bash
curl http://localhost:4102/health
```

### Patient Intake
```bash
curl -X POST http://localhost:4102/api/ai/care-manager/intake \
  -H "Content-Type: application/json" \
  -d '{"patientId": "patient123", "name": "John Doe", "symptoms": ["headache", "fever"]}'
```

### Prescription Verification
```bash
curl -X POST http://localhost:4102/api/ai/pharmacist/verify \
  -H "Content-Type: application/json" \
  -d '{"prescriptionId": "rx123", "medications": [{"name": "Amoxicillin", "dosage": "500mg"}]}'
```

### Diagnosis Analysis
```bash
curl -X POST http://localhost:4102/api/ai/diagnosis/analyze \
  -H "Content-Type: application/json" \
  -d '{"symptoms": ["chest pain", "shortness of breath"], "patientHistory": {"age": 45, "conditions": ["hypertension"]}}'
```

### Get Health Records
```bash
curl http://localhost:4102/api/ai/health-records/patient123
```

### Schedule Appointment
```bash
curl -X POST http://localhost:4102/api/workers/appointment/schedule \
  -H "Content-Type: application/json" \
  -d '{"patientId": "patient123", "doctorId": "dr456", "date": "2026-06-15", "time": "10:00"}'
```

### Get Appointment Reminders
```bash
curl http://localhost:4102/api/workers/appointment/reminders
```

### Renew Prescription
```bash
curl -X POST http://localhost:4102/api/workers/prescription/renew \
  -H "Content-Type: application/json" \
  -d '{"prescriptionId": "rx123", "patientId": "patient123"}'
```

### Get Lab Results
```bash
curl http://localhost:4102/api/workers/lab-results/patient123
```

### Voice - Incoming Call
```bash
curl -X POST http://localhost:4102/api/voice/call/incoming \
  -H "Content-Type: application/json" \
  -d '{"from": "+919876543210", "to": "+919123456789"}'
```

### Voice - WhatsApp Webhook
```bash
curl -X POST http://localhost:4102/api/voice/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{"from": "919876543210", "body": "I need to book an appointment"}'
```

## License

Proprietary - HOJAI AI

---

**Parent Company:** HOJAI AI
**Category:** Industry AI - Healthcare
**Version:** 1.0.0
