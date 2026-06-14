# REZ PMS Service

Property Management System for Hotel Operations

**Port:** 4031

## Features

- Front desk operations
- Room management with status tracking
- Guest management with VIP handling
- Reservation management (direct, OTA, walk-in)
- Housekeeping coordination and task management
- Folio management with charges and payments
- Night audit processing
- Multi-property support
- Availability checking
- Rate calculation with GST

## Modules

| Module | Description |
|--------|-------------|
| Front Desk | Check-in, check-out, walk-in |
| Reservations | Booking management, availability |
| Housekeeping | Task management, room status |
| Night Audit | Daily reconciliation |
| Folios | Guest account charges/payments |
| Guest Management | Guest profiles, preferences |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| GET | /api/info | PMS information |
| POST | /api/properties | Create property |
| GET | /api/properties | List properties |
| GET | /api/properties/:propertyId | Get property |
| PUT | /api/properties/:propertyId | Update property |
| POST | /api/room-types | Create room type |
| GET | /api/room-types/:propertyId | List room types |
| POST | /api/rooms | Create room |
| GET | /api/rooms/:propertyId | List rooms |
| GET | /api/rooms/single/:roomId | Get room |
| PUT | /api/rooms/:roomId/status | Update room status |
| POST | /api/reservations | Create reservation |
| GET | /api/reservations/:propertyId | List reservations |
| GET | /api/reservations/availability | Check availability |
| POST | /api/reservations/:reservationId/check-in | Check in |
| POST | /api/reservations/:reservationId/check-out | Check out |
| POST | /api/reservations/:reservationId/assign-room | Assign room |
| POST | /api/guests | Create/update guest |
| GET | /api/guests/:propertyId | List guests |
| GET | /api/guests/single/:guestId | Get guest details |
| POST | /api/housekeeping/tasks | Create task |
| GET | /api/housekeeping/tasks/:propertyId | List tasks |
| POST | /api/housekeeping/tasks/:taskId/start | Start task |
| POST | /api/housekeeping/tasks/:taskId/complete | Complete task |
| GET | /api/housekeeping/room-status/:propertyId | Room status overview |
| POST | /api/folios/:reservationId/charge | Add charge |
| POST | /api/folios/:reservationId/payment | Add payment |
| GET | /api/folios/:reservationId | Get folio |
| GET | /api/night-audit/:propertyId/status | Get audit status |
| POST | /api/night-audit/:propertyId/complete | Complete night audit |
| GET | /api/dashboard/:propertyId | Dashboard overview |
| POST | /api/walk-in | Create walk-in reservation |

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
| PORT | 4031 | Service port |
| MONGO_URL | mongodb://localhost:27017/rez_pms | MongoDB connection string |
