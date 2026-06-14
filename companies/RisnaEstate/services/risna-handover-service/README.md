# RisnaEstate Handover Service

Property handover workflow management service for RisnaEstate real estate platform.

## Overview

The Handover Service handles the complete property handover workflow from scheduling to final acceptance, including:
- Handover scheduling and rescheduling
- Buyer check-in management
- Keys and documents handover tracking
- Property condition reporting
- Meter readings capture
- Checklist management
- Dispute resolution
- Feedback collection
- Handover report generation

## Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** MongoDB (Mongoose)
- **Cache:** Redis (ioredis)
- **Authentication:** JWT
- **Validation:** Zod
- **Logging:** Winston
- **PDF Generation:** PDFKit

## Port

**Port: 4129**

## Quick Start

```bash
# Install dependencies
cd services/risna-handover-service
npm install

# Copy environment file
cp .env.example .env

# Start in development mode
npm run dev

# Build for production
npm run build

# Start production
npm start
```

## Health Check

```bash
curl http://localhost:4129/health
```

## API Endpoints

### Handover Management
- `POST /api/v1/handovers` - Create handover
- `GET /api/v1/handovers` - List handovers (with filters)
- `GET /api/v1/handovers/:id` - Get handover
- `PUT /api/v1/handovers/:id` - Update handover
- `DELETE /api/v1/handovers/:id` - Cancel handover

### Scheduling
- `POST /api/v1/handovers/:id/schedule` - Schedule handover
- `GET /api/v1/handovers/available-slots` - Get available slots
- `POST /api/v1/handovers/:id/reschedule` - Reschedule

### Check-in
- `POST /api/v1/handovers/:id/checkin` - Buyer check-in
- `GET /api/v1/handovers/:id/checkin-status` - Check-in status

### Keys & Documents
- `POST /api/v1/handovers/:id/keys` - Update keys status
- `POST /api/v1/handovers/:id/keys/confirm` - Confirm keys handed
- `POST /api/v1/handovers/:id/documents` - Update documents
- `POST /api/v1/handovers/:id/documents/confirm` - Confirm documents

### Condition & Meters
- `POST /api/v1/handovers/:id/condition` - Submit condition report
- `PUT /api/v1/handovers/:id/condition` - Update condition report
- `POST /api/v1/handovers/:id/condition/verify` - Verify condition
- `POST /api/v1/handovers/:id/meters` - Submit meter readings
- `PUT /api/v1/handovers/:id/meters` - Update meter readings

### Checklist
- `GET /api/v1/handovers/:id/checklist` - Get checklist
- `POST /api/v1/handovers/:id/checklist/:itemId` - Update item
- `POST /api/v1/handovers/:id/checklist/complete` - Mark complete

### Disputes
- `POST /api/v1/handovers/:id/disputes` - Raise dispute
- `GET /api/v1/handovers/:id/disputes` - List disputes
- `PUT /api/v1/handovers/:id/disputes/:disputeId` - Update dispute
- `POST /api/v1/handovers/:id/disputes/:disputeId/resolve` - Resolve

### Acceptance & Completion
- `POST /api/v1/handovers/:id/accept` - Buyer accepts
- `POST /api/v1/handovers/:id/reject` - Buyer rejects
- `POST /api/v1/handovers/:id/complete` - Complete handover
- `POST /api/v1/handovers/:id/cancel` - Cancel handover
- `GET /api/v1/handovers/:id/report` - Download PDF report
- `POST /api/v1/handovers/:id/feedback` - Submit feedback
- `GET /api/v1/handovers/:id/timeline` - Get timeline

## Authentication

All endpoints require JWT authentication:
```
Authorization: Bearer <token>
```

## Handover Status Flow

```
scheduled -> in_progress -> completed
                |
                v
            disputed -> (resolved) -> in_progress
                |
                v
            cancelled
```

## Default Checklist Items

The service initializes with 27 default checklist items across categories:
- Keys (6 items)
- Documents (6 items)
- Interior (7 items)
- Exterior (4 items)
- Utilities (5 items)

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Service port | 4129 |
| NODE_ENV | Environment | development |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/risna_estate |
| REDIS_HOST | Redis host | localhost |
| REDIS_PORT | Redis port | 6379 |
| JWT_SECRET | JWT signing secret | (required) |
| LOG_LEVEL | Logging level | info |

## Docker

```bash
# Build
docker build -t risna-handover-service .

# Run
docker run -p 4129:4129 risna-handover-service
```

## API Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "message": "Error message",
    "statusCode": 400,
    "errors": { ... }
  }
}
```

## License

Proprietary - RisnaEstate