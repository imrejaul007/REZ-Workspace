# RisaCare ABHA Service

**Port: 4731**

Aadhaar-Based Health Account (ABHA) integration for RisaCare Healthcare OS - India's Digital Health ID system.

## Overview

RisaCare ABHA Service provides:
- ABHA number generation and linking
- Aadhaar verification
- Health record management
- Consent management (per HIPAA/DPDP Act)
- Data sharing via ABHA address
- Profile management

## What is ABHA?

ABHA (Aadhaar-Based Health Account) is India's digital health ID system that enables:
- Universal health records access
- Consent-based data sharing
- Portability of health data across providers
- Integration with government health schemes

## Features

### ABHA Management
- Create new ABHA
- Link existing ABHA
- OTP verification
- Profile updates

### Health Records
- Add health records to ABHA
- View record history
- Filter by type/date
- Share via ABHA address

### Consent Management
- Request data access consent
- Grant/deny consent
- Expiring consents
- Audit trail

## Quick Start

```bash
cd risa-care-abha-service
npm install
npm run dev
```

Service runs on **port 4731**.

## API Endpoints

### ABHA
```
POST /api/abha                     - Create ABHA
POST /api/abha/verify            - Verify via OTP
POST /api/abha/link               - Link existing ABHA
GET  /api/abha/:abhaNumber       - Get ABHA details
GET  /api/abha/patient/:patientId - Get patient's ABHA
```

### Profile
```
GET  /api/abha/profile/:linkId    - Get profile
PUT  /api/abha/profile/:linkId    - Update profile
```

### Consent
```
POST /api/consent/request           - Request consent
POST /api/consent/:id/grant         - Grant consent
POST /api/consent/:id/deny          - Deny consent
GET  /api/consent/patient/:patientId - List consents
```

### Records
```
POST /api/records                   - Add record
GET  /api/records/:abhaNumber      - List records
POST /api/records/:id/share        - Share record
```

## Usage Examples

### Create ABHA
```bash
curl -X POST http://localhost:4731/api/abha \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "patient-123",
    "name": "John Doe",
    "dateOfBirth": "1990-05-15",
    "gender": "male",
    "phone": "+919876543210",
    "address": {
      "state": "Maharashtra",
      "district": "Mumbai"
    }
  }'
```

### Verify ABHA
```bash
curl -X POST http://localhost:4731/api/abha/verify \
  -H "Content-Type: application/json" \
  -d '{
    "abhaNumber": "12-3456-7890-1234",
    "otp": "123456"
  }'
```

### Request Consent
```bash
curl -X POST http://localhost:4731/api/consent/request \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "patient-123",
    "requesterId": "hospital-001",
    "requesterName": "City Hospital",
    "purpose": "treatment",
    "hiTypes": ["Prescription", "Diagnostic Report"],
    "fromDate": "2026-06-01",
    "toDate": "2026-06-30"
  }'
```

### Share Health Record
```bash
curl -X POST http://localhost:4731/api/records/rec-123/share \
  -H "Content-Type: application/json" \
  -d '{
    "targetAbhaAddress": "hospital@abha",
    "consentId": "CONS-456"
  }'
```

## ABHA Format

```
XX-XXXX-XXXX-XXXX
 |    |    |    |
 |    |    |    └─ Unique number
 |    |    └─ Unique number
 |    └─ Unique number
 └─ State code (01-99)
```

## Record Types

| Type | Description |
|------|-------------|
| prescription | Doctor prescriptions |
| diagnostic_report | Lab/imaging reports |
| discharge_summary | Hospital discharge |
| op_record | Outpatient records |
| vaccination | Immunization records |
| wellness | Health checkup reports |

## Integration

Integrates with:
- NHA (National Health Authority) APIs
- RisaCare Records Service (4702)
- RisaCare Profile Service (4701)
- RABTUL Notifications (4011) - consent alerts

## Architecture

```
risa-care-abha-service/
├── src/
│   └── index.ts              # Express server
├── package.json
├── tsconfig.json
└── README.md
```

## License

Proprietary - RTNM Group
