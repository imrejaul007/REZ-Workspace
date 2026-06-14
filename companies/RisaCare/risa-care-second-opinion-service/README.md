# RisaCare Second Opinion Service

**Medical Second Opinions and Specialist Matching**

A comprehensive second opinion service for RisaCare Healthcare OS, connecting patients with medical specialists for expert diagnoses and treatment recommendations.

## Overview

RisaCare Second Opinion Service helps patients:
- Get expert medical second opinions
- Find the right specialist for their condition
- Upload and share medical reports
- Receive comprehensive treatment plans
- Compare multiple specialist opinions

## Features

### Request Management
- Create second opinion requests
- Track request status (pending, matched, under review, completed)
- Assign specialists to requests
- Upload medical reports (lab, imaging, pathology, clinical)

### Specialist Matching
- Search specialists by name, specialty, credentials
- Filter by rating, fee, language, availability
- View detailed specialist profiles
- Check real-time availability slots
- Multi-specialty coverage (Cardiology, Oncology, Neurology, etc.)

### Opinion Reports
- Specialists submit detailed opinions
- Treatment plans with alternatives
- Medication recommendations
- Lifestyle recommendations
- Follow-up requirements
- Confidence scoring

### Summary Analytics
- Consensus diagnosis detection
- Treatment recommendation aggregation
- Follow-up tracking
- Average confidence calculation

### Report Upload
- Support for multiple report types
- Secure file storage
- Report categorization

## Quick Start

```bash
cd risa-care-second-opinion-service
npm install
npm run dev
```

Service runs on **port 4726**.

## API Endpoints

### Requests
```
POST /api/requests                              - Create request
GET  /api/requests/:patientId                 - Get patient's requests
GET  /api/requests/detail/:requestId          - Get request details
PUT  /api/requests/:requestId                 - Update status
GET  /api/requests                             - List all (with filters)
POST /api/requests/:requestId/assign           - Assign specialist
```

### Specialists
```
GET  /api/specialists                         - List specialists (filters)
GET  /api/specialists/search?query=           - Search specialists
GET  /api/specialists/match?specialty=        - Match specialists
GET  /api/specialists/:specialistId          - Get specialist details
GET  /api/specialists/:specialistId/availability - Get slots
GET  /api/specialists/specialties            - Get by specialty
```

### Opinions
```
POST /api/opinions                              - Submit opinion
GET  /api/opinions/:reportId                  - Get opinion
GET  /api/opinions/request/:requestId          - Get request opinions
GET  /api/opinions/request/:requestId/summary  - Get opinion summary
GET  /api/opinions/patient/:patientId         - Get patient opinions
POST /api/opinions/:requestId/complete        - Mark completed
```

### Reports
```
POST /api/reports                              - Upload report
GET  /api/reports/:requestId                 - Get request reports
```

## Usage Examples

### Create Second Opinion Request
```bash
curl -X POST http://localhost:4726/api/requests \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "patient-123",
    "originalDiagnosis": "Suspected cardiac arrhythmia",
    "medicalHistory": [
      {
        "condition": "Hypertension",
        "diagnosedDate": "2020-01-15",
        "currentMedications": ["Amlodipine 5mg"]
      }
    ],
    "condition": "Cardiac arrhythmia evaluation",
    "specialty": "Cardiology",
    "urgency": "urgent",
    "notes": "Patient experiencing palpitations"
  }'
```

### Search Specialists
```bash
curl "http://localhost:4726/api/specialists/search?query=cardiology"
```

### Match Specialists
```bash
curl "http://localhost:4726/api/specialists/match?specialty=cardiology&minRating=4.5&maxFee=3000"
```

### Submit Opinion
```bash
curl -X POST http://localhost:4726/api/opinions \
  -H "Content-Type: application/json" \
  -d '{
    "requestId": "REQ-12345678",
    "specialistId": "SPEC-001",
    "diagnosis": "Atrial fibrillation with rapid ventricular response",
    "treatmentPlan": "Rate control with beta-blockers, anticoagulation therapy, and lifestyle modifications",
    "alternativeOptions": [
      "Cardioversion if symptomatic",
      "Catheter ablation for refractory cases"
    ],
    "confidence": 92,
    "medications": ["Metoprolol 50mg BID", "Apixaban 5mg BID"],
    "lifestyleRecommendations": [
      "Reduce caffeine intake",
      "Regular exercise 30 min/day",
      "Stress management"
    ],
    "followUpRequired": true
  }'
```

### Upload Medical Report
```bash
curl -X POST http://localhost:4726/api/reports \
  -H "Content-Type: application/json" \
  -d '{
    "requestId": "REQ-12345678",
    "type": "imaging",
    "title": "ECG Report",
    "fileUrl": "https://example.com/reports/ecg-123.pdf"
  }'
```

## Medical Specialties

| Specialty | Description |
|-----------|-------------|
| Cardiology | Heart and cardiovascular system |
| Medical Oncology | Cancer treatment |
| Neurology | Nervous system disorders |
| Orthopedics | Bone and joint conditions |
| Endocrinology | Hormone and metabolic disorders |
| Gastroenterology | Digestive system |
| Pulmonology | Respiratory system |
| Nephrology | Kidney disorders |

## Report Types

| Type | Description |
|------|-------------|
| lab | Laboratory test results |
| imaging | X-ray, MRI, CT, ultrasound |
| pathology | Biopsy and tissue analysis |
| clinical | Clinical examination notes |

## Urgency Levels

| Level | Response Time |
|-------|--------------|
| routine | 5-7 business days |
| urgent | 2-3 business days |
| emergent | 24-48 hours |

## Architecture

```
risa-care-second-opinion-service/
├── src/
│   ├── index.ts                     # Express server entry
│   ├── models/
│   │   └── secondOpinion.ts        # Types, Zod schemas, DataStore
│   ├── routes/
│   │   └── secondOpinionRoutes.ts  # Express routes
│   └── services/
│       ├── requestService.ts       # Request management
│       ├── specialistService.ts    # Specialist matching
│       └── opinionService.ts       # Opinion processing
├── package.json
├── tsconfig.json
└── README.md
```

## Integration

Integrates with:
- RisaCare Core (4700-4708) for patient data
- RABTUL Notifications (4011) for specialist notifications
- RABTUL Auth for authentication
- Medical report storage systems
- Insurance verification (future)

## Port Configuration

| Service | Port |
|---------|------|
| Second Opinion Service | 4726 |

## License

Proprietary - RTNM Group
