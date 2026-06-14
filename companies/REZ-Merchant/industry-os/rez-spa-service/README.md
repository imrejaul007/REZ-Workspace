# rez-spa-service

**Port:** 4049

Spa Bookings Service for wellness treatments, therapist scheduling, and packages.

## Features

- **Treatment Booking** - Reserve spa treatments
- **Therapist Scheduling** - Assign therapists to slots
- **Wellness Packages** - Pre-defined spa packages
- **Memberships** - Member discounts and benefits
- **Availability** - Real-time slot checking

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/treatments` | List treatments |
| GET | `/api/therapists` | List therapists |
| POST | `/api/bookings` | Create booking |
| GET | `/api/bookings/:id` | Get booking |
| PUT | `/api/bookings/:id/cancel` | Cancel booking |
| GET | `/api/packages` | List packages |
| GET | `/api/availability` | Check availability |

## Quick Start

```bash
npm install
npm run dev
npm test
```
