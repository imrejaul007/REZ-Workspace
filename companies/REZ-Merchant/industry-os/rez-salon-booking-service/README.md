# REZ Salon Booking Service

REZ Salon OS - Appointment booking and scheduling service

**Port:** 4201

## Features

- **Appointment Management**: Create, update, cancel, and reschedule appointments
- **Availability Tracking**: Real-time availability management for stylists and time slots
- **Booking Calendar**: View and manage daily/weekly/monthly booking calendars
- **Conflict Prevention**: Automatic conflict detection for double-booking prevention
- **Walk-in Support**: Handle walk-in customers alongside pre-booked appointments
- **Reminders**: Automated appointment reminders via notifications
- **Waitlist Management**: Queue management for busy periods

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| POST | /api/bookings | Create new booking |
| GET | /api/bookings | List all bookings |
| GET | /api/bookings/:id | Get booking by ID |
| PUT | /api/bookings/:id | Update booking |
| DELETE | /api/bookings/:id | Cancel booking |
| GET | /api/availability/:stylistId | Get stylist availability |
| POST | /api/availability | Set availability |
| GET | /api/availability/slots | Get available time slots |

## Quick Start

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run in production mode
npm run build && npm start
```

## Configuration

- `PORT`: Server port (default: 4201)
- `MONGODB_URI`: MongoDB connection string
- `NODE_ENV`: Environment (development/production)
