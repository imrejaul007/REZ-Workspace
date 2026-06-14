# REZ Booking Modification Service

Booking Amendments, Cancellations & Date Changes

**Port:** 4026

## Features

- Modification requests (date changes, room upgrades/downgrades, guest changes)
- Cancellation policies with seasonal adjustments
- Approval workflow for modifications
- Price calculation for date/room changes
- Refund calculation with cancellation fees
- Full audit trail for all changes
- Guest and staff confirmation workflows
- Policy preview and scenarios

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| GET | /api/policies/:hotelId | Get all cancellation policies |
| POST | /api/policies | Create cancellation policy |
| PUT | /api/policies/:policyId | Update cancellation policy |
| GET | /api/policies/preview/:hotelId/:roomTypeId | Preview applicable policy |
| POST | /api/modifications | Create modification request |
| GET | /api/modifications/:bookingId | Get modifications for booking |
| GET | /api/modifications/single/:modificationId | Get specific modification |
| POST | /api/modifications/:modificationId/approve | Approve modification |
| POST | /api/modifications/:modificationId/reject | Reject modification |
| POST | /api/modifications/:modificationId/cancel | Cancel modification request |
| GET | /api/modifications/hotel/:hotelId/pending | Get pending modifications |
| POST | /api/cancellations/preview | Preview cancellation refund |
| POST | /api/cancellations | Create cancellation request |
| POST | /api/cancellations/:cancellationId/confirm | Guest confirms cancellation |
| POST | /api/cancellations/:cancellationId/process | Process cancellation |
| GET | /api/cancellations/:bookingId | Get cancellations for booking |
| GET | /api/audit/:bookingId | Get modification audit trail |
| GET | /api/stats/:hotelId | Get modification statistics |
| POST | /api/date-change/calculate | Calculate date change pricing |

## Quick Start

```bash
# Install dependencies
npm install

# Start the service
npm start

# Development mode with hot reload
npm run dev
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 4026 | Service port |
| MONGO_URL | mongodb://localhost:27017/rez_booking_modifications | MongoDB connection string |
