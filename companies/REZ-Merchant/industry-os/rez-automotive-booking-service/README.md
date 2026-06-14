# REZ Automotive Booking Service

**Port: 4601**

Service appointment booking for automotive businesses.

## Features

- Service appointment booking
- Time slot management
- Bay/technician assignment
- Booking status tracking

## API Endpoints

- `POST /api/bookings` - Create booking
- `GET /api/bookings` - List bookings
- `GET /api/bookings/:id` - Get booking
- `PUT /api/bookings/:id` - Update booking
- `PATCH /api/bookings/:id/status` - Update status
- `DELETE /api/bookings/:id` - Cancel booking

## Environment Variables

```
PORT=4601
MONGODB_URI=mongodb://localhost:27017/rez_automotive_booking
```
