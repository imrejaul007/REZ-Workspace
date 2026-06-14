# RisaCare Elderly Service

Remote monitoring, fall detection, and care coordination for elderly patients.

**Port:** 4721
**Company:** RisaCare (Healthcare vertical under RTNM Group)

## Features

- **Elderly Profile Management** - Track patient demographics, living situation, mobility, and emergency contacts
- **Fall Detection & Risk Assessment** - Report falls, calculate risk scores (0-100), and generate recommendations
- **Daily Check-ins** - Schedule and track daily wellness check-ins with vitals monitoring
- **Medication Reminders** - Set reminders, track adherence, and monitor compliance
- **Emergency Response** - Trigger alerts, notify emergency contacts, and track resolution

## Quick Start

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Run production build
npm start
```

## API Endpoints

### Profile Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/profile` | Create elderly patient profile |
| GET | `/api/profile/:userId` | Get patient profile |
| PUT | `/api/profile/:userId` | Update patient profile |
| POST | `/api/profile/:userId/emergency-contacts` | Add emergency contact |
| DELETE | `/api/profile/:userId/emergency-contacts/:contactId` | Remove contact |

### Fall Detection

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/falls` | Report a fall incident |
| GET | `/api/falls/:patientId` | Get fall history & statistics |
| GET | `/api/falls/:patientId/risk` | Get fall risk assessment |

### Daily Check-ins

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/checkin` | Submit daily check-in |
| POST | `/api/checkin/schedule` | Schedule daily check-in |
| GET | `/api/checkin/:patientId` | Get check-in history & trends |
| GET | `/api/checkin/:patientId/missed` | Get missed check-ins |

### Medication Reminders

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/medications` | Set medication reminder |
| GET | `/api/medications/:patientId` | Get medication reminders |
| GET | `/api/medications/:patientId/adherence` | Get adherence statistics |
| PUT | `/api/medications/:reminderId/taken` | Mark as taken |
| PUT | `/api/medications/:reminderId/skipped` | Mark as skipped |

### Emergency Response

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/emergencies/:patientId` | Get active alerts |
| GET | `/api/emergencies/critical` | Get all critical alerts |
| POST | `/api/emergencies/:patientId/trigger` | Trigger emergency |
| PUT | `/api/emergencies/:alertId/resolve` | Resolve emergency |
| PUT | `/api/emergencies/:alertId/respond` | Mark as responded |

### Health Trends

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/trends/:patientId` | Get comprehensive health trends |

## Data Models

### ElderlyProfile
```typescript
{
  userId: string;
  age: number; // 60-120
  livingSituation: 'alone' | 'with_spouse' | 'with_family' | 'assisted_living' | 'nursing_home';
  mobilityLevel: 'independent' | 'limited' | 'assisted' | 'wheelchair' | 'bedridden';
  medicalConditions: string[];
  medications: Medication[];
  emergencyContacts: EmergencyContact[];
  careGiverId?: string;
}
```

### FallRiskAssessment
- **Score:** 0-100
- **Risk Levels:** low (<25), moderate (25-49), high (50-74), very_high (75+)
- **Factors:** Age, mobility, fall history, living situation, medical conditions, medications

### DailyCheckIn
```typescript
{
  patientId: string;
  completed: boolean;
  vitals?: {
    bp?: string;        // e.g., "120/80"
    hr?: number;        // Heart rate (30-220)
    temp?: number;      // Temperature in F (95-108)
    spo2?: number;      // Oxygen saturation (70-100)
  };
  mood?: 'great' | 'good' | 'okay' | 'fair' | 'poor';
  painLevel?: number;  // 0-10
  symptoms?: string[];
}
```

### EmergencyAlert
```typescript
{
  patientId: string;
  type: 'fall' | 'sos' | 'no_activity' | 'vital_concern';
  severity: 'low' | 'medium' | 'high' | 'critical';
  location?: string;
  responded: boolean;
  resolved: boolean;
}
```

## Example Requests

### Create Profile
```bash
curl -X POST http://localhost:4721/api/profile \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "patient-001",
    "age": 72,
    "livingSituation": "alone",
    "mobilityLevel": "limited",
    "emergencyContacts": [
      {
        "name": "Jane Doe",
        "relationship": "Daughter",
        "phone": "+1234567890",
        "isPrimary": true
      }
    ]
  }'
```

### Report Fall
```bash
curl -X POST http://localhost:4721/api/falls \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "patient-001",
    "time": "14:30",
    "location": "Bathroom",
    "severity": "moderate",
    "cause": "Wet floor"
  }'
```

### Submit Check-in
```bash
curl -X POST http://localhost:4721/api/checkin \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "patient-001",
    "vitals": {
      "bp": "118/76",
      "hr": 72,
      "temp": 98.6,
      "spo2": 98
    },
    "mood": "good",
    "painLevel": 2
  }'
```

### Trigger Emergency
```bash
curl -X POST http://localhost:4721/api/emergencies/patient-001/trigger \
  -H "Content-Type: application/json" \
  -d '{
    "type": "sos",
    "severity": "high",
    "location": "Living Room",
    "description": "Patient pressed SOS button"
  }'
```

## Health Monitoring

The service automatically monitors:
- **Missed Check-ins** - Triggers `no_activity` alerts after missed check-ins
- **Abnormal Vitals** - Logs concerns for abnormal heart rate, SpO2, or temperature
- **Severe Falls** - Auto-triggers emergency for severe/injury falls
- **Critical Alerts** - Dashboard endpoint for monitoring all critical alerts

## Architecture

```
risa-care-elderly-service/
├── src/
│   ├── models/
│   │   └── elderlyCare.ts      # Zod schemas & types
│   ├── services/
│   │   ├── elderlyProfileService.ts
│   │   ├── fallDetectionService.ts
│   │   ├── dailyCheckInService.ts
│   │   ├── medicationReminderService.ts
│   │   └── emergencyService.ts
│   ├── routes/
│   │   └── elderlyRoutes.ts    # Express routes
│   ├── utils/
│   │   └── logger.ts           # Winston logger
│   └── index.ts                # Entry point
├── package.json
├── tsconfig.json
└── README.md
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 4721 | Server port |
| NODE_ENV | development | Environment mode |
| LOG_LEVEL | info | Logging level |

## Error Handling

All endpoints return consistent JSON responses:

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

**Error:**
```json
{
  "success": false,
  "error": "Error description",
  "details": [ ... ]  // Validation errors
}
```

## Production Considerations

For production deployment:
1. Replace in-memory storage with database (PostgreSQL/MongoDB)
2. Add authentication middleware
3. Integrate with notification services (Twilio, Firebase)
4. Add rate limiting
5. Set up monitoring (Prometheus metrics)
6. Configure Redis for session caching

## License

Internal use only - RTNM Group / RisaCare
