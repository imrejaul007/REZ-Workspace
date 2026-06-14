# RisaCare Medication Service

**Medication Management and Adherence**

Service for managing prescriptions, medication schedules, refill reminders, and adherence tracking.

## Overview

RisaCare Medication Service handles:
- Prescription management
- Medication schedules
- Dosage tracking
- Refill reminders
- Adherence monitoring
- Drug interaction checks

## Features

### Prescriptions
- Add prescriptions
- Prescription history
- Doctor-linked prescriptions
- Pharmacy information
- Refill tracking

### Medication Schedules
- Daily schedules
- Multiple times per day
- Weekly schedules
- As-needed medications
- Calendar integration

### Reminders
- Daily reminders
- Refill alerts
- Missed dose notifications
- Take with food alerts
- Custom reminder times

### Adherence Tracking
- Dose logging
- Adherence percentage
- Streak tracking
- Weekly reports
- Trend analysis

### Drug Safety
- Interaction warnings
- Allergen alerts
- Dosage validation
- Duplicate therapy detection

## Quick Start

```bash
cd risa-care-medication-service
npm install
npm run dev
```

Service runs on **port 4707**.

## API Endpoints

### Medications
```
POST /api/medications                         - Add medication
GET  /api/medications/:userId               - Get user's medications
GET  /api/medications/:medicationId         - Get medication details
PUT  /api/medications/:medicationId          - Update medication
DELETE /api/medications/:medicationId       - Remove medication
```

### Schedules
```
POST /api/medications/:id/schedule            - Create schedule
GET  /api/medications/:id/schedule           - Get schedule
PUT  /api/medications/:id/schedule           - Update schedule
DELETE /api/medications/:id/schedule         - Delete schedule
```

### Reminders
```
GET  /api/reminders/:userId                 - Get reminders
PUT  /api/reminders/:reminderId             - Update reminder
DELETE /api/reminders/:reminderId          - Delete reminder
```

### Adherence
```
POST /api/adherence                           - Log dose taken
GET  /api/adherence/:userId                 - Get adherence data
GET  /api/adherence/:userId/report          - Get adherence report
GET  /api/adherence/:userId/streaks         - Get streak data
```

### Refills
```
POST /api/refills                              - Request refill
GET  /api/refills/:userId                   - Get refill status
PUT  /api/refills/:refillId                 - Update refill
```

### Interactions
```
POST /api/interactions/check                  - Check interactions
GET  /api/interactions/:medicationId         - Get interactions
```

## Usage Examples

### Add Medication
```bash
curl -X POST http://localhost:4707/api/medications \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "name": "Metformin",
    "dosage": "500mg",
    "frequency": "twice_daily",
    "times": ["08:00", "20:00"],
    "withFood": true,
    "prescribedBy": "Dr. Priya Sharma",
    "pharmacy": "City Pharmacy",
    "prescriptionId": "rx-456",
    "startDate": "2024-01-15",
    "endDate": "2024-07-15",
    "notes": "Take with breakfast and dinner"
  }'
```

### Log Dose
```bash
curl -X POST http://localhost:4707/api/adherence \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "medicationId": "med-789",
    "scheduledTime": "08:00",
    "takenAt": "2024-01-20T08:15:00Z",
    "status": "taken",
    "notes": "Taken with breakfast"
  }'
```

### Get Adherence Report
```bash
curl "http://localhost:4707/api/adherence/user-123/report?from=2024-01-01&to=2024-01-31"
```

### Check Drug Interactions
```bash
curl -X POST http://localhost:4707/api/interactions/check \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "medicationIds": ["med-789", "med-790", "med-791"]
  }'
```

## Frequency Types

| Frequency | Description |
|-----------|-------------|
| once_daily | Once per day |
| twice_daily | Twice per day |
| three_times_daily | Three times per day |
| four_times_daily | Four times per day |
| every_other_day | Every other day |
| weekly | Once per week |
| as_needed | PRN medications |
| custom | Custom schedule |

## Adherence Status

| Status | Description |
|--------|-------------|
| taken | Dose taken as scheduled |
| missed | Dose missed |
| skipped | User skipped dose |
| delayed | Dose taken late |
| partial | Partial dose taken |

## Adherence Metrics

| Metric | Description |
|--------|-------------|
| dailyAdherence | % taken on scheduled days |
| weeklyAdherence | % taken over the week |
| monthlyAdherence | % taken over the month |
| currentStreak | Consecutive days taken |
| bestStreak | Longest consecutive streak |

## Integration

Integrates with:
- RisaCare API Gateway (4700)
- RisaCare Profile Service (4701)
- RisaCare Records Service (4702)
- RisaCare Pharmacy Service (4718)
- RABTUL Notifications (4011) for reminders
- Drug database API for interactions

## Port Configuration

| Service | Port |
|---------|------|
| Medication Service | 4707 |

## License

Proprietary - RTNM Group
