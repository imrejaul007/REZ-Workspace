# RisaCare Visit Service

**Healthcare Visit Management**

Service for managing doctor visits, appointments, teleconsultations, and visit history.

## Overview

RisaCare Visit Service handles:
- Appointment scheduling
- Visit history
- Doctor consultation records
- Teleconsultation management
- Visit summaries
- Follow-up tracking

## Features

### Appointments
- Schedule appointments
- Reschedule and cancel
- Recurring appointments
- Multi-provider appointments
- Waitlist management

### Visit Types
- In-person visits
- Teleconsultations
- Home visits
- Emergency visits
- Follow-up visits

### Visit Records
- Visit summaries
- Doctor notes
- Diagnoses
- Prescriptions
- Lab orders
- Follow-up recommendations

### Provider Management
- Doctor profiles
- Availability tracking
- Specialty filtering
- Distance sorting

## Quick Start

```bash
cd risa-care-visit-service
npm install
npm run dev
```

Service runs on **port 4704**.

## API Endpoints

### Appointments
```
POST /api/appointments                      - Create appointment
GET  /api/appointments/:userId            - Get user's appointments
GET  /api/appointments/:appointmentId     - Get appointment details
PUT  /api/appointments/:appointmentId     - Update appointment
DELETE /api/appointments/:appointmentId   - Cancel appointment
POST /api/appointments/:id/reschedule     - Reschedule
```

### Visits
```
POST /api/visits                            - Create visit record
GET  /api/visits/:userId                  - Get visit history
GET  /api/visits/:visitId                 - Get visit details
PUT  /api/visits/:visitId                 - Update visit
```

### Teleconsultation
```
POST /api/teleconsult/start                 - Start teleconsult
POST /api/teleconsult/:id/end              - End teleconsult
GET  /api/teleconsult/:id/status          - Get status
```

### Follow-ups
```
POST /api/followups                         - Create follow-up
GET  /api/followups/:userId               - Get follow-ups
PUT  /api/followups/:id                   - Update follow-up
```

## Usage Examples

### Create Appointment
```bash
curl -X POST http://localhost:4704/api/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "providerId": "doc-456",
    "providerName": "Dr. Priya Sharma",
    "specialty": "cardiology",
    "scheduledAt": "2024-02-15T10:00:00Z",
    "type": "in-person",
    "reason": "Chest pain consultation",
    "duration": 30
  }'
```

### Get Visit History
```bash
curl "http://localhost:4704/api/visits/user-123?from=2024-01-01&to=2024-12-31"
```

### Start Teleconsultation
```bash
curl -X POST http://localhost:4704/api/teleconsult/start \
  -H "Content-Type: application/json" \
  -d '{
    "appointmentId": "apt-789",
    "roomId": "room-abc123"
  }'
```

## Appointment Status

| Status | Description |
|--------|-------------|
| scheduled | Confirmed appointment |
| check_in | Patient checked in |
| in_progress | Visit in progress |
| completed | Visit completed |
| cancelled | Appointment cancelled |
| no_show | Patient did not attend |
| rescheduled | Appointment rescheduled |

## Visit Types

| Type | Description |
|------|-------------|
| in-person | Physical clinic visit |
| teleconsult | Video/audio consultation |
| home | Home healthcare visit |
| emergency | Emergency room visit |
| follow-up | Follow-up appointment |
| second_opinion | Second opinion consultation |

## Integration

Integrates with:
- RisaCare API Gateway (4700)
- RisaCare Profile Service (4701)
- RisaCare Records Service (4702)
- RisaCare Booking Service (4715)
- RisaCare Teleconsult Service (4720)
- RABTUL Notifications (4011)

## Port Configuration

| Service | Port |
|---------|------|
| Visit Service | 4704 |

## License

Proprietary - RTNM Group
