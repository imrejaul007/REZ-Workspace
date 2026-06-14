# REZ Spa Booking Service

**Port: 4401**

Spa appointment booking and scheduling service.

## Features

- Appointment booking and scheduling
- Therapist availability management
- Time slot management
- Booking confirmation and reminders

## API Endpoints

### Bookings
- `POST /api/bookings` - Create new booking
- `GET /api/bookings` - List bookings
- `GET /api/bookings/:id` - Get booking by ID
- `PUT /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Cancel booking
- `PATCH /api/bookings/:id/status` - Update booking status

### Availability
- `GET /api/availability/therapist/:therapistId` - Get therapist availability
- `GET /api/availability/service/:serviceId` - Get service availability
- `POST /api/availability/slots` - Get available time slots

## Booking Status

- `pending` - Awaiting confirmation
- `confirmed` - Booking confirmed
- `in_progress` - Service in progress
- `completed` - Service completed
- `cancelled` - Booking cancelled
- `no_show` - Customer did not show up

## Environment Variables

```
PORT=4401
MONGODB_URI=mongodb://localhost:27017/rez_spa_booking
```
