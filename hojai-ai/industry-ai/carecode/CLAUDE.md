# CARECODE - Developer Guide

## Project Context

CARECODE is part of the HOJAI AI Industry AI ecosystem. It's an AI-powered healthcare operating system.

**Parent:** HOJAI AI (`/hojai-ai/`)
**Category:** Industry AI
**Industry:** Healthcare

## Key Files

| File | Purpose |
|------|---------|
| `SOT.md` | Complete technical specification |
| `PRODUCT.md` | Product overview and requirements |
| `src/index.ts` | Main Express server (IMPLEMENTED) |

## Architecture

```
CARECODE
├── employees/           # AI Agent implementations (TO BE BUILT)
│   ├── care-manager/
│   ├── pharmacist-ai/
│   ├── diagnosis-assistant/
│   └── health-records-ai/
├── workers/            # AI Worker implementations (TO BE BUILT)
│   ├── appointment-worker/
│   ├── prescription-worker/
│   ├── lab-result-worker/
│   └── compliance-worker/
├── voice-agents/       # Voice agents (TO BE BUILT)
│   ├── phone-receptionist/
│   ├── whatsapp-ai/
│   └── ivr-system/
├── services/           # Backend services (TO BE BUILT)
│   ├── patient-service/
│   ├── appointment-service/
│   ├── pharmacy-service/
│   └── lab-service/
└── src/
    └── index.ts        # Main entry point (IMPLEMENTED)
```

## AI Employees

1. **Care Manager AI** - Patient coordination, intake (IMPLEMENTED)
2. **Pharmacist AI** - Prescription verification, medication guidance (IMPLEMENTED)
3. **Diagnosis Assistant AI** - Symptom analysis, triage (IMPLEMENTED)
4. **Health Records AI** - Documentation, record management (IMPLEMENTED)

## AI Workers

1. **Appointment Worker** - Scheduling, reminders (IMPLEMENTED)
2. **Prescription Worker** - Prescription management, renewals (IMPLEMENTED)
3. **Lab Result Worker** - Result processing, interpretation (IMPLEMENTED)
4. **Compliance Worker** - HIPAA/regulatory compliance (TODO)

## Voice Agents

1. **Phone Receptionist** - Answer calls 24/7 (TODO)
2. **WhatsApp AI** - Voice/text conversations (TODO)
3. **IVR System** - Auto-attendant (TODO)

## Port

**Main Service:** 4102
**Voice Agents:** 4850-4860

## Commands

```bash
npm install
npm run build
npm start
```

## Environment Variables

```bash
PORT=4102
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
HOJAI_CORE_URL=http://localhost:4100
MERCHANT_OS_URL=http://localhost:4000
VOICE_PROVIDER=twilio
```

## API Base URL

```
http://localhost:4102
```

## HOJAI Integration

All Industry AI products connect to:
- **HOJAI Core** (port 4100) - Intent Graph, Memory, Trust
- **Merchant OS** - Backend services

## Development Notes

- Use TypeScript for all new files
- Follow Express.js patterns from HOJAI Core
- Integrate with HOJAI Core for AI capabilities
- Add proper error handling and validation
- Include health check endpoints
- Ensure HIPAA compliance for patient data

## Current Implementation

The `src/index.ts` is already implemented with:
- Patient intake and care management
- Appointment scheduling
- Prescription verification with drug interaction checking
- Diagnosis analysis with triage
- Health records generation
- Lab result interpretation

## Status

- [x] SOT.md created
- [x] Product folder structure created
- [x] src/index.ts - Main server (IMPLEMENTED)
- [ ] Employee folders with implementations
- [ ] Worker implementations (partial)
- [ ] Voice agent implementations
- [ ] Service implementations
- [ ] CLAUDE.md (this file)
