# rez-channel-integration-service

**Port:** 4055

Channel integration service for managing OTA connections (Booking.com, MakeMyTrip, Goibibo, etc.)

## Features

- Channel connection management
- Room mapping and inventory sync
- Rate plan configuration
- Booking synchronization
- Performance analytics

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/channels` | List channels |
| POST | `/api/connections` | Connect channel |
| GET | `/api/connections/:hotelId` | Hotel connections |
| POST | `/api/rooms` | Create room mapping |
| GET | `/api/rates/:hotelId` | Get rate plans |
| POST | `/api/rates` | Create rate plan |
| GET | `/api/bookings/:hotelId` | Channel bookings |
| GET | `/api/analytics/:hotelId` | Channel analytics |

## Supported Channels

- Booking.com (15% commission)
- MakeMyTrip (15% commission)
- Goibibo (15% commission)
- Expedia (12% commission)
- Airbnb
- Google Hotel Ads

## Quick Start

```bash
npm install
npm run dev
npm test
```
