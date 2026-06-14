# RisaCare Teleconsult Service

Video consultation service for RisaCare healthcare platform enabling patients to consult with doctors via video calls.

## Features

- **Session Management**: Schedule, start, end, and cancel video consultations
- **Doctor Availability**: Set and manage available time slots
- **Video Integration**: Video room generation with Daily.co integration (stub)
- **Prescriptions**: Create and manage digital prescriptions
- **Consultation Notes**: SOAP-format clinical notes with ICD codes
- **Reviews & Ratings**: Patient feedback system with detailed statistics
- **Recording Support**: Session recording capability (video provider dependent)

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

## Configuration

```bash
# Environment variables (optional)
PORT=4723
NODE_ENV=development
```

## API Endpoints

### Sessions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/sessions` | Schedule a new consultation |
| GET | `/sessions/:sessionId` | Get session details |
| PUT | `/sessions/:sessionId/start` | Start a session |
| PUT | `/sessions/:sessionId/end` | End a session |
| PUT | `/sessions/:sessionId/cancel` | Cancel a session |
| PUT | `/sessions/:sessionId/no-show` | Mark as no-show |
| GET | `/sessions/patient/:patientId` | Get patient's sessions |
| GET | `/sessions/doctor/:doctorId` | Get doctor's sessions |
| GET | `/sessions/:sessionId/token` | Get video room token |

### Availability

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/availability/:doctorId/:date` | Get doctor's availability |
| POST | `/availability` | Set availability slots |
| GET | `/availability/:doctorId/:startDate/:endDate` | Get availability range |
| GET | `/availability/:doctorId/:date/slots` | Get available slots only |
| POST | `/availability/book` | Book a slot |
| DELETE | `/availability/:doctorId/:date` | Delete availability |

### Consultation Notes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/sessions/:sessionId/notes` | Save consultation notes |
| GET | `/sessions/:sessionId/notes` | Get consultation notes |
| PUT | `/sessions/:sessionId/notes` | Update notes |
| GET | `/sessions/:sessionId/notes/soap` | Get SOAP format notes |

### Prescriptions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/sessions/:sessionId/prescription` | Create prescription |
| GET | `/sessions/:sessionId/prescription` | Get prescription |
| POST | `/sessions/:sessionId/prescription/medicine` | Add medicine |

### Reviews

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/sessions/:sessionId/review` | Submit review |
| GET | `/doctors/:doctorId/reviews` | Get doctor reviews |
| GET | `/doctors/:doctorId/reviews/stats` | Get review statistics |
| GET | `/doctors/:doctorId/reviews/distribution` | Get rating distribution |
| GET | `/doctors/top-rated` | Get top rated doctors |

## Data Models

### TeleconsultSession

```typescript
{
  sessionId: string;
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  scheduledAt: string;
  startedAt?: string;
  endedAt?: string;
  duration: number;
  status: 'scheduled' | 'waiting' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  roomId?: string;
  recordingUrl?: string;
  consultationMode: 'video' | 'audio' | 'chat';
  chiefComplaint?: string;
}
```

### ConsultationNote (SOAP Format)

```typescript
{
  sessionId: string;
  doctorId: string;
  subjective?: string;  // Patient's description
  objective?: string;   // Doctor's observations
  assessment?: string;  // Diagnosis
  plan?: string;        // Treatment plan
  prescriptions?: Medicine[];
  labOrders?: LabOrder[];
  followUp?: FollowUp;
  icdCodes?: string[];
}
```

### Prescription

```typescript
{
  sessionId: string;
  medicines: Medicine[];
  notes?: string;
}
```

## Example Usage

### Schedule a Consultation

```bash
curl -X POST http://localhost:4723/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "patient_123",
    "doctorId": "doctor_456",
    "scheduledAt": "2026-06-02T10:00:00Z",
    "consultationMode": "video",
    "chiefComplaint": "Persistent headache for 3 days"
  }'
```

### Set Doctor Availability

```bash
curl -X POST http://localhost:4723/availability \
  -H "Content-Type: application/json" \
  -d '{
    "doctorId": "doctor_456",
    "date": "2026-06-02",
    "slots": [
      {"start": "2026-06-02T09:00:00Z", "end": "2026-06-02T09:30:00Z"},
      {"start": "2026-06-02T10:00:00Z", "end": "2026-06-02T10:30:00Z"},
      {"start": "2026-06-02T11:00:00Z", "end": "2026-06-02T11:30:00Z"}
    ],
    "consultationFee": 500,
    "currency": "INR"
  }'
```

### Get Video Room Token

```bash
curl "http://localhost:4723/sessions/{sessionId}/token?userId=patient_123&userType=patient"
```

### Submit Review

```bash
curl -X POST http://localhost:4723/sessions/{sessionId}/review \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "patient_123",
    "rating": 5,
    "feedback": "Dr. Smith was very professional and thorough.",
    "wouldRecommend": true,
    "categories": {
      "punctuality": 5,
      "professionalism": 5,
      "thoroughness": 4,
      "communication": 5
    }
  }'
```

## Video Provider Integration

The video service is implemented as a **stub**. To integrate with a real provider:

### Daily.co Integration

```typescript
// In videoService.ts, replace stub methods with:
import DailyIframe from '@daily-co/daily-js';

async generateRoom(sessionId: string): Promise<VideoRoom> {
  const room = await daily.createRoom({
    name: `consultation_${sessionId}`,
    properties: {
      max_participants: 2,
      enable_recording: 'cloud',
      enable_screenshare: true,
    },
  });
  return { roomId: room.id, roomName: room.name, ... };
}

async getRoomToken(roomId: string, userId: string, userType: string): Promise<string> {
  return await daily.createMeetingToken(roomId, {
    userName: userId,
    isOwner: userType === 'doctor',
  });
}
```

### Twilio Video Integration

```typescript
// Alternative: Twilio Video
import twilio from 'twilio';

async generateRoom(sessionId: string): Promise<VideoRoom> {
  const room = await twilio.video.v1.rooms.create({
    uniqueName: `consultation_${sessionId}`,
    type: 'group',
  });
  return { roomId: room.sid, roomName: room.uniqueName, ... };
}
```

## Architecture

```
src/
├── index.ts              # Express app entry point
├── models/
│   └── teleconsult.ts    # Type definitions & Zod schemas
├── services/
│   ├── sessionService.ts      # Session management
│   ├── availabilityService.ts # Slot management
│   ├── videoService.ts       # Video room (stub)
│   ├── prescriptionService.ts # Prescription management
│   ├── notesService.ts       # Clinical notes
│   └── reviewService.ts       # Reviews & ratings
└── routes/
    └── teleconsultRoutes.ts   # API routes
```

## Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Validation Error |
| 404 | Not Found |
| 500 | Internal Error |

## License

Proprietary - RTNM Group
