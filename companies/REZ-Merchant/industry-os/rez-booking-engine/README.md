# rez-booking-engine

**Port:** 4042

Direct Booking Engine for hotel room reservations with availability, rates, and booking management.

## Features

- **Room Availability** - Real-time inventory checking
- **Rate Management** - Dynamic pricing, rate plans
- **Booking Creation** - Direct reservations with confirmation
- **Booking Modification** - Amendment support
- **Hold & Release** - Temporary room holds

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/availability/:hotelId` | Check room availability |
| GET | `/api/rates/:hotelId` | Get available rates |
| POST | `/api/booking` | Create booking |
| GET | `/api/booking/:id` | Get booking details |
| PUT | `/api/booking/:id` | Modify booking |
| POST | `/api/booking/:id/cancel` | Cancel booking |
| POST | `/api/booking/:id/hold` | Hold room |

## Quick Start

```bash
npm install
npm run dev
npm test
```
