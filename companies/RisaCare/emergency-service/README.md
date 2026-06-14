# RisaCare Emergency Service

**Port: 4730**

Emergency ambulance dispatch, SOS coordination, and emergency response management for RisaCare Healthcare OS.

## Overview

RisaCare Emergency Service provides:
- SOS/Emergency trigger
- Automatic ambulance dispatch
- Real-time ambulance tracking
- Hospital coordination
- Emergency response analytics

## Features

### Emergency Management
- One-tap SOS trigger
- Automatic priority classification
- Location tracking (GPS)
- Symptom capture
- Emergency contact notification

### Ambulance Dispatch
- Auto-dispatch nearest ambulance
- Multiple ambulance types (Basic, Advanced, Cardiac, Neonatal)
- Real-time status updates
- ETA calculation
- Crew management

### Hospital Coordination
- Nearest hospital finder
- Emergency-capable hospital filtering
- Bed availability (future)
- Direct hospital communication

## Quick Start

```bash
cd risa-care-emergency-service
npm install
npm run dev
```

Service runs on **port 4730**.

## API Endpoints

### Emergency
```
POST /api/emergency/trigger           - Trigger SOS
GET  /api/emergency/:requestId       - Get emergency details
GET  /api/emergency                 - List emergencies
POST /api/emergency/:id/cancel       - Cancel emergency
POST /api/emergency/:id/resolve      - Mark resolved
```

### Ambulances
```
GET  /api/ambulances               - List ambulances
GET  /api/ambulances/nearest      - Find nearest
GET  /api/ambulances/:id          - Get details
PUT  /api/ambulances/:id          - Update status
```

### Dispatch
```
POST /api/dispatch                  - Manual dispatch
GET  /api/dispatch/:id/events      - Get events
```

### Hospitals
```
GET  /api/hospitals                - List hospitals
GET  /api/hospitals/nearest       - Find nearest
```

### Analytics
```
GET /api/stats                     - Emergency stats
```

## Usage Examples

### Trigger Emergency
```bash
curl -X POST http://localhost:4730/api/emergency/trigger \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "patient-123",
    "callerName": "John Doe",
    "callerPhone": "+919876543210",
    "emergencyType": "cardiac",
    "location": {
      "address": "123 Main St, Mumbai",
      "latitude": 19.076,
      "longitude": 72.877,
      "landmark": "Near Metro Station"
    },
    "description": "Chest pain, difficulty breathing",
    "symptoms": ["chest pain", "shortness of breath", "sweating"]
  }'
```

### Find Nearest Ambulance
```bash
curl "http://localhost:4730/api/ambulances/nearest?lat=19.076&lng=72.877&type=cardiac"
```

### Find Nearest Hospital
```bash
curl "http://localhost:4730/api/hospitals/nearest?lat=19.076&lng=72.877&emergency=true"
```

## Ambulance Types

| Type | Capabilities |
|------|-------------|
| basic | Basic life support, transport |
| advanced | Advanced life support, medications |
| cardiac | ECG, defibrillator, cardiac medications |
| neonatal | Incubator, infant respirator |

## Emergency Types

| Type | Priority | Description |
|------|----------|-------------|
| cardiac | Critical | Heart-related emergencies |
| accident | Critical | Road/industrial accidents |
| respiratory | Critical | Breathing difficulties |
| medical | High | General medical emergencies |
| maternal | High | Pregnancy-related |
| trauma | High | Injury-related |
| other | High | Other emergencies |

## Architecture

```
risa-care-emergency-service/
├── src/
│   └── index.ts              # Express server
├── package.json
├── tsconfig.json
└── README.md
```

## Integration

Integrates with:
- RisaCare API Gateway (4700)
- RisaCare Profile Service (4701) - patient data
- RABTUL Notifications (4011) - SMS alerts
- RABTUL Maps/Location - GPS tracking

## Future Enhancements

- [ ] Integration with government ambulance service (108)
- [ ] Real-time traffic-aware ETA
- [ ] Video consultation during transit
- [ ] Automated hospital bed availability check
- [ ] Insurance pre-authorization

## License

Proprietary - RTNM Group
