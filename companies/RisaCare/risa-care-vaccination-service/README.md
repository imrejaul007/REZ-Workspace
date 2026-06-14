# RisaCare Vaccination Service

**Immunization Tracking and Certificate Generation**

A comprehensive vaccination management service for RisaCare Healthcare OS.

## Overview

RisaCare Vaccination Service helps users:
- Track vaccination records
- Get vaccine recommendations based on age
- Set reminders for upcoming vaccinations
- Generate immunization certificates
- Monitor vaccination compliance

## Features

### Vaccination Records
- Log vaccination records with dose information
- Track batch numbers and manufacturers
- Record side effects
- Link to next dose schedules

### Vaccine Catalog
- Comprehensive vaccine database
- Age-appropriate recommendations
- Dosage and interval information
- Contraindications and side effects

### Compliance Tracking
- Personal compliance reports
- Overdue vaccination alerts
- Missing vaccine identification
- Compliance rate calculation

### Reminders
- Email, SMS, and push notification reminders
- Customizable reminder dates
- Sent status tracking

### Certificates
- Digital immunization certificates
- Verification codes
- QR code generation (future)
- Multi-vaccine certificates

## Quick Start

```bash
cd risa-care-vaccination-service
npm install
npm run dev
```

Service runs on **port 4727**.

## API Endpoints

### Vaccination Records
```
POST /api/vaccinations                    - Add vaccination record
GET  /api/vaccinations/:userId          - Get user's records
GET  /api/vaccinations/:userId/upcoming  - Get upcoming vaccinations
GET  /api/vaccinations/:userId/overdue   - Get overdue vaccinations
GET  /api/vaccinations/:userId/compliance - Get compliance report
```

### Vaccine Catalog
```
GET  /api/vaccines            - Get all vaccines
GET  /api/vaccines/:code     - Get vaccine details
```

### Reminders
```
POST /api/reminders                    - Set reminder
GET  /api/reminders/:userId           - Get user's reminders
PUT  /api/reminders/:reminderId/sent  - Mark as sent
```

### Certificates
```
POST /api/certificates              - Generate certificate
GET  /api/certificates/:id         - Get certificate
```

## Usage Examples

### Add Vaccination Record
```bash
curl -X POST http://localhost:4727/api/vaccinations \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "vaccineName": "COVID-19 Vaccine",
    "vaccineCode": "COVID-19",
    "manufacturer": "Pfizer",
    "doseNumber": 1,
    "totalDoses": 2,
    "administeredAt": "2026-06-01T10:00:00Z",
    "location": "City Hospital",
    "nextDoseDue": "2026-06-22T10:00:00Z"
  }'
```

### Get Compliance Report
```bash
curl "http://localhost:4727/api/vaccinations/user-123/compliance"
```

### Generate Certificate
```bash
curl -X POST http://localhost:4727/api/certificates \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-123"}'
```

## Vaccine Catalog

| Code | Name | Doses | Age Groups |
|------|------|-------|-----------|
| COVID-19 | COVID-19 Vaccine | 2 | Adult, Senior |
| FLU | Influenza Vaccine | 1 | All |
| HEP-B | Hepatitis B | 3 | Infant, Child, Adult |
| TT | Tetanus | 1 | All |

## Age Groups

- infant: 0-1 years
- child: 1-12 years
- adolescent: 12-18 years
- adult: 18-65 years
- senior: 65+ years

## Architecture

```
risa-care-vaccination-service/
├── src/
│   ├── index.ts                     # Express server entry
│   ├── models/
│   │   └── vaccination.ts          # Types & Zod schemas
│   ├── routes/
│   │   └── vaccinationRoutes.ts    # Express routes
│   └── services/
│       └── vaccinationService.ts   # Business logic
├── package.json
├── tsconfig.json
└── README.md
```

## Integration

Integrates with:
- RisaCare Core (4700-4708)
- RABTUL Notifications (4011) for reminders
- RABTUL Auth for authentication

## Port Configuration

| Service | Port |
|---------|------|
| Vaccination Service | 4727 |

## License

Proprietary - RTNM Group
