# RisaCare Home Healthcare Service

**In-Home Medical Care and Caregiver Matching**

A comprehensive home healthcare service for RisaCare Healthcare OS, providing in-home medical care, caregiver matching, and care plan management.

## Overview

RisaCare Home Healthcare Service helps patients receive quality medical care at home through:
- Professional caregiver matching
- Care plan management
- Visit scheduling and tracking
- Medical equipment delivery
- Vital signs monitoring
- Caregiver reviews and ratings

## Features

### Caregiver Matching
- Search caregivers by service type, location, and rating
- View detailed caregiver profiles
- Real-time availability checking
- Multi-language support

### Care Requests
- Request various service types (nursing, physiotherapy, caregiver, etc.)
- Specify care level (basic, intermediate, advanced, critical)
- Define visit frequency and preferred times
- Track request status

### Care Plans
- Create comprehensive care plans
- Set measurable goals with milestones
- Track progress over time
- Multi-service care coordination

### Visit Management
- Schedule caregiver visits
- Real-time visit tracking
- Record visit notes and observations
- Document vital signs during visits
- Task completion tracking

### Medical Equipment
- Request medical equipment delivery
- Track delivery status
- Schedule equipment pickup
- Insurance coverage support

### Vital Signs Monitoring
- Record blood pressure, heart rate, temperature, etc.
- Track trends over time
- Generate alerts for abnormal readings
- Integration with care plans

### Reviews and Ratings
- Rate caregiver performance
- Categorized feedback (punctuality, professionalism, care quality, communication)
- Aggregate rating calculation

## Quick Start

```bash
cd risa-care-home-healthcare-service
npm install
npm run dev
```

Service runs on **port 4728**.

## API Endpoints

### Care Requests
```
POST /api/care-requests                    - Create care request
GET  /api/care-requests/:patientId       - Get patient's requests
GET  /api/care-requests/request/:id      - Get specific request
PUT  /api/care-requests/:requestId       - Update request
DELETE /api/care-requests/:requestId     - Cancel request
```

### Caregivers
```
GET  /api/caregivers                    - List all caregivers
GET  /api/caregivers/search            - Search (query: serviceType, city, state, minRating)
GET  /api/caregivers/:caregiverId      - Get caregiver details
```

### Visits
```
POST /api/visits                        - Create visit
GET  /api/visits/:patientId           - Get patient's visits
GET  /api/visits/detail/:visitId      - Get visit with caregiver info
PUT  /api/visits/:visitId              - Update visit
POST /api/visits/:visitId/start        - Start visit
POST /api/visits/:visitId/end          - End visit
```

### Care Plans
```
POST /api/care-plans                    - Create care plan
GET  /api/care-plans/:planId          - Get care plan
PUT  /api/care-plans/:planId          - Update care plan
GET  /api/care-plans/:planId/progress - Get plan progress
```

### Equipment
```
POST /api/equipment                    - Request equipment
GET  /api/equipment/:patientId        - Get patient's equipment
PUT  /api/equipment/:requestId        - Update request
```

### Vitals
```
POST /api/vitals                        - Record vital
GET  /api/vitals/:patientId           - Get patient vitals
GET  /api/vitals/:patientId/trends   - Get vital trends
```

### Reviews
```
POST /api/reviews                       - Create review
GET  /api/reviews/caregiver/:id       - Get caregiver reviews
```

## Usage Examples

### Create Care Request
```bash
curl -X POST http://localhost:4728/api/care-requests \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "patient-123",
    "serviceType": "nursing",
    "startDate": "2026-06-15T00:00:00Z",
    "endDate": "2026-07-15T00:00:00Z",
    "frequency": {
      "days": ["monday", "wednesday", "friday"],
      "timesPerDay": 1,
      "preferredTime": "09:00"
    },
    "address": {
      "street": "123 Main St",
      "city": "Mumbai",
      "state": "Maharashtra",
      "zipCode": "400001"
    },
    "careLevel": "intermediate"
  }'
```

### Search Caregivers
```bash
curl "http://localhost:4728/api/caregivers/search?serviceType=nursing&city=Mumbai&minRating=4.5"
```

### Record Vital Signs
```bash
curl -X POST http://localhost:4728/api/vitals \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "patient-123",
    "type": "blood_pressure_systolic",
    "value": 120,
    "unit": "mmHg"
  }'
```

## Service Types

| Type | Description |
|------|-------------|
| nursing | Professional nursing care |
| physiotherapy | Physical therapy sessions |
| caregiver | General caregiver support |
| medical_equipment | Equipment delivery |
| wound_care | Wound treatment |
| iv_therapy | IV administration |
| post_surgery_care | Post-operative care |

## Care Levels

| Level | Description |
|-------|-------------|
| basic | Basic assistance with daily activities |
| intermediate | Moderate medical care needs |
| advanced | Complex medical care |
| critical | Intensive medical monitoring |

## Vital Types

| Type | Unit | Normal Range |
|------|------|-------------|
| blood_pressure_systolic | mmHg | 90-120 |
| blood_pressure_diastolic | mmHg | 60-80 |
| heart_rate | bpm | 60-100 |
| temperature | °C | 36.1-37.2 |
| respiratory_rate | breaths/min | 12-20 |
| oxygen_saturation | % | 95-100 |
| blood_glucose | mg/dL | 70-100 |
| weight | kg | Varies |
| height | cm | Varies |

## Architecture

```
risa-care-home-healthcare-service/
├── src/
│   ├── index.ts                     # Express server entry
│   ├── models/
│   │   └── homeHealthcare.ts       # Types & interfaces
│   ├── routes/
│   │   └── homeHealthcareRoutes.ts # Express routes
│   └── services/
│       └── homeHealthcareService.ts # Business logic
├── package.json
├── tsconfig.json
└── README.md
```

## Integration

Integrates with:
- RisaCare Core (4700-4708) for patient data
- RABTUL Notifications (4011) for visit reminders
- RABTUL Auth for caregiver authentication
- Medical equipment suppliers

## Port Configuration

| Service | Port |
|---------|------|
| Home Healthcare Service | 4728 |

## License

Proprietary - RTNM Group
