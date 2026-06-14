# REZ Survey Service

**Port: 4015**

Guest survey and feedback collection for REZ Hotel Ecosystem - NPS, CSAT, and custom surveys.

## Overview

REZ Survey Service provides:
- NPS (Net Promoter Score) surveys
- CSAT (Customer Satisfaction) polls
- Custom survey builder
- Multi-channel distribution
- Analytics and reporting

## Features

### Survey Types
- **NPS**: 0-10 rating with follow-up
- **CSAT**: Satisfaction ratings
- **CES**: Customer Effort Score
- **Custom**: Build your own

### Distribution Channels
- Email
- SMS/WhatsApp
- In-app push
- QR code (tablet kiosk)
- Checkout page

### Question Types
- Rating (1-5, 1-10, stars)
- Multiple choice
- Yes/No
- Text response
- Matrix/rating scale

### Timing
- Pre-arrival
- Check-in
- During stay
- Check-out
- Post-departure (1-7 days)

## Quick Start

```bash
cd industry-os/rez-survey-service
npm install
npm run dev
```

Service runs on **port 4015**.

## API Endpoints

### Surveys
```
GET  /api/surveys/:hotelId            - List surveys
GET  /api/surveys/:surveyId          - Get survey
POST /api/surveys                     - Create survey
PUT  /api/surveys/:surveyId          - Update survey
DELETE /api/surveys/:surveyId        - Delete survey
POST /api/surveys/:surveyId/publish  - Publish survey
POST /api/surveys/:surveyId/pause    - Pause survey
```

### Responses
```
GET  /api/responses/:surveyId          - List responses
POST /api/responses                    - Submit response
GET  /api/responses/:responseId       - Get response
```

### Distribution
```
POST /api/distribute/:surveyId        - Send survey
POST /api/distribute/bulk            - Bulk send
GET  /api/distribution/:surveyId      - Get distribution status
```

### Analytics
```
GET  /api/analytics/:surveyId         - Survey analytics
GET  /api/analytics/:surveyId/nps    - NPS breakdown
GET  /api/analytics/:hotelId/summary - Hotel-level summary
```

### Templates
```
GET  /api/templates                   - List templates
GET  /api/templates/:templateId       - Get template
POST /api/templates                   - Create template
```

## Usage Examples

### Create NPS Survey
```bash
curl -X POST http://localhost:4015/api/surveys \
  -H "Content-Type: application/json" \
  -d '{
    "hotelId": "hotel-123",
    "name": "Post-Stay NPS",
    "type": "nps",
    "questions": [
      {
        "id": "q1",
        "type": "rating",
        "text": "How likely are you to recommend us?",
        "scale": 10,
        "required": true
      },
      {
        "id": "q2",
        "type": "text",
        "text": "What can we improve?",
        "required": false
      }
    ],
    "timing": "post_departure",
    "delayDays": 1,
    "channels": ["email", "sms"]
  }'
```

### Send Survey
```bash
curl -X POST http://localhost:4015/api/distribute/survey-456 \
  -H "Content-Type: application/json" \
  -d '{
    "guestIds": ["guest-789", "guest-790"],
    "channel": "email"
  }'
```

### Submit Response
```bash
curl -X POST http://localhost:4015/api/responses \
  -H "Content-Type: application/json" \
  -d '{
    "surveyId": "survey-456",
    "guestId": "guest-789",
    "bookingId": "booking-999",
    "answers": [
      {"questionId": "q1", "value": 9},
      {"questionId": "q2", "value": "Great service!"}
    ],
    "submittedAt": "2026-06-15T10:30:00Z"
  }'
```

### Get NPS Analytics
```bash
curl "http://localhost:4015/api/analytics/survey-456/nps?period=30days"
```

## NPS Calculation

| Score | Category | Description |
|-------|----------|-------------|
| 9-10 | Promoters | Loyal enthusiasts |
| 7-8 | Passives | Satisfied but vulnerable |
| 0-6 | Detractors | Unhappy customers |

```
NPS = % Promoters - % Detractors
```

## Architecture

```
rez-survey-service/
├── src/
│   ├── index.ts              # Express server
│   ├── survey.test.ts        # Tests
│   └── services/
│       └── survey.service.ts  # Business logic
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

## Integration

Integrates with:
- REZ PMS Service (guest data)
- REZ Booking Engine
- REZ Notifications (email/SMS)
- REZ Guest Mobile App
- REZ CRM Service

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 4015 | Service port |
| EMAIL_PROVIDER | - | Email service |
| SMS_PROVIDER | - | SMS service |

## License

Proprietary - RTNM Group
