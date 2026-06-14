# RisaCare AI Clinical Scribe

AI-powered clinical documentation service for doctors - generates SOAP notes from consultations.

**Port: 4732**

## Features

- **Speech-to-Text**: Process audio consultations
- **SOAP Note Generation**: AI-generated clinical notes
- **ICD-10 Suggestions**: Automated code recommendations
- **Prescription Drafting**: Generate prescriptions with drug interaction checks
- **Follow-up Scheduling**: AI-powered follow-up recommendations
- **Patient Context**: Maintain patient history for better suggestions

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/api/transcribe` | Process audio transcription |
| POST | `/api/notes/generate` | Generate SOAP note |
| POST | `/api/notes/generate/structured` | Generate from structured input |
| GET | `/api/notes/:id` | Get clinical note |
| PUT | `/api/notes/:id` | Update clinical note |
| POST | `/api/notes/:id/finalize` | Finalize and sign note |
| GET | `/api/icd/suggest` | Get ICD-10 suggestions |
| POST | `/api/prescriptions/draft` | Draft prescription |
| POST | `/api/followup/suggest` | Get follow-up suggestions |
| GET | `/api/stats` | Get statistics |

## Quick Start

```bash
npm install
npm run build
npm start
```

## SOAP Note Structure

```json
{
  "subjective": "Patient's description of symptoms",
  "objective": "Physical examination findings",
  "assessment": "Diagnosis and differential",
  "plan": "Treatment plan"
}
```

## Use Case

```bash
# Generate SOAP note
curl -X POST http://localhost:4732/api/notes/generate \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "P12345",
    "doctorId": "D001",
    "chiefComplaint": "Severe headache for 3 days",
    "type": "teleconsult"
  }'
```
