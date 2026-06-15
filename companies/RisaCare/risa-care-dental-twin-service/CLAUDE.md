# CLAUDE.md - Dental Twin Service

## Overview

**Service:** RisaCare Dental Twin Service  
**Port:** 4751  
**Purpose:** Tooth-by-tooth dental records and oral health history  
**Story:** SmileCraft Dental Clinic - "problem identified months before pain begins"

## Quick Commands

```bash
# Install and start
cd companies/RisaCare/risa-care-dental-twin-service
npm install
npm start

# Health check
curl http://localhost:4751/health

# Initialize patient teeth
curl -X POST http://localhost:4751/api/dental/init \
  -H "Content-Type: application/json" \
  -d '{"patientId": "xxx"}'

# Get dental summary
curl http://localhost:4751/api/dental/summary/xxx

# Generate predictions
curl -X POST http://localhost:4751/api/dental/predict \
  -H "Content-Type: application/json" \
  -d '{"patientId": "xxx"}'
```

## Architecture

```
Dental Twin Service (4751)
├── Routes
│   ├── dental.js        - Main dental routes
│   ├── tooth.js         - Per-tooth operations
│   ├── xray.js          - X-ray management
│   └── oralHealth.js    - Oral health assessment
├── Models
│   └── DentalRecord.js  - Mongoose schemas
│       ├── Treatment    - Treatment history
│       ├── Condition    - Dental conditions
│       ├── XRay         - X-ray records
│       ├── OralHealth   - Oral assessment
│       ├── ToothRecord  - Per-tooth (32)
│       └── DentalSummary - Patient summary
└── hub-client.js        - REZ ecosystem integration
```

## Key Concepts

### 32 Teeth Numbering (Universal System)

| Position | Teeth | Quadrant |
|----------|-------|----------|
| Upper Right | 1-8 | 1 |
| Upper Left | 9-16 | 2 |
| Lower Left | 17-24 | 3 |
| Lower Right | 25-32 | 4 |

### Treatment Types

- filling, root_canal, extraction, crown
- implant, veneer, bridge, inlay, onlay
- bonding, fluoride, sealant, whitening
- orthodontic, periodontal

### X-Ray Types

- bitewing, periapical, panoramic
- cephalometric, cone_beam_ct, occlusal
- full_mouth_series

## Integration Points

| Service | Port | Purpose |
|---------|------|---------|
| Genie Memory | 4703 | Store dental memories |
| Genie Briefing | 4706 | Dental reminders |
| HOJAI Clinic AI | 4501 | X-ray analysis |
| Nexha | 4320 | Dental supplies |
| SUTAR GoalOS | 4242 | Expansion planning |

## Story Timeline

| Time | Event | Endpoint |
|------|-------|----------|
| 6:00 AM | Twin predictions | `/api/dental/predict` |
| 11:30 AM | Patient context | `/api/dental/summary/:id` |
| 11:40 AM | Digital scan | `/api/xray/compare` |
| Noon | Treatment plan | `/api/tooth/:id/:num/treatment` |

## Testing

```bash
# Test health
curl http://localhost:4751/health

# Test init
curl -X POST http://localhost:4751/api/dental/init \
  -H "Content-Type: application/json" \
  -d '{"patientId": "test123"}'

# Test predictions
curl -X POST http://localhost:4751/api/dental/predict \
  -H "Content-Type: application/json" \
  -d '{"patientId": "test123"}'

# Test tooth update
curl -X PUT http://localhost:4751/api/tooth/test123/14 \
  -H "Content-Type: application/json" \
  -d '{"sensitivity": "cold", "prognosis": "good"}'
```

## Notes

- MongoDB required (mongodb://localhost:27017/risacare-dental-twin)
- All routes return `{ success: true, ... }` on success
- Errors return `{ error: "message" }` with appropriate status code
- Tooth numbers are strings ("1" through "32")
