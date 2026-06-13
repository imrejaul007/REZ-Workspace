# Healthcare OS API Reference

## Overview

Healthcare OS provides HIPAA-compliant digital twin services for patient management, appointments, and clinical operations.

## Base URL

```
Staging: http://localhost:3031
Production: https://healthcare-api.rtmn.io
```

## Patient Twin Service

### Create Patient
```
POST /api/patients
```

**Request Body:**
```json
{
  "demographics": {
    "firstName": "John",
    "lastName": "Doe",
    "dateOfBirth": "1985-03-15",
    "gender": "male"
  },
  "contact": {
    "email": "john.doe@email.com",
    "phone": "+1-555-0123",
    "address": {
      "street": "123 Main St",
      "city": "San Francisco",
      "state": "CA",
      "zip": "94102"
    }
  },
  "insurance": {
    "provider": "Blue Cross",
    "policyNumber": "BC123456",
    "groupNumber": "GRP001",
    "copay": 25
  },
  "medicalHistory": {
    "allergies": ["penicillin", "peanuts"],
    "medications": [
      { "name": "Lisinopril", "dosage": "10mg", "frequency": "daily" }
    ],
    "conditions": ["hypertension"]
  }
}
```

### Get Patients
```
GET /api/patients?status=active&limit=50&offset=0
```

### Get Patient by ID
```
GET /api/patients/:id
```

### Update Patient
```
PUT /api/patients/:id
```

### Get Patient Appointments
```
GET /api/patients/:id/appointments
```

## AI Agents

### Intake Agent
**Endpoint:** `POST /agents/intake`

```json
{
  "action": "register_patient",
  "data": { "demographics": {...}, "insurance": {...} }
}
```

### Scheduling Agent
**Endpoint:** `POST /agents/scheduling`

```json
{
  "action": "find_available_slots",
  "providerId": "provider_id",
  "date": "2024-06-15",
  "duration": 30
}
```

## REZ CRM Integration

Connect with Epic/Cerner for EHR sync:

```bash
curl -X POST http://localhost:3092/api/crm/sync \
  -d '{"provider": "epic", "direction": "bidirectional"}'
```
