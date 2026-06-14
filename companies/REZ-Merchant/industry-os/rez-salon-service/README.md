# REZ Salon Service

REZ Salon OS - Core service management for hair, beauty, and wellness salons

**Port:** 4200

## Features

- **Salon Management**: Manage multiple salon locations with branch information
- **Booking Management**: Handle appointments, scheduling, and booking modifications
- **Service Catalog**: Define and manage salon services with pricing and duration
- **Availability Tracking**: Real-time availability management for staff and slots
- **Staff Management**: Track staff schedules, working hours, and service assignments
- **Multi-location Support**: Manage bookings across multiple salon branches
- **Rate Limiting**: Built-in protection against API abuse
- **CORS Protection**: Strict cross-origin request handling in production

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| GET | /api/salons | List all salons |
| GET | /api/salons/:id | Get salon by ID |
| POST | /api/salons | Create new salon |
| PUT | /api/salons/:id | Update salon |
| DELETE | /api/salons/:id | Delete salon |
| GET | /api/bookings | List all bookings |
| GET | /api/bookings/:id | Get booking by ID |
| POST | /api/bookings | Create new booking |
| PUT | /api/bookings/:id | Update booking |
| DELETE | /api/bookings/:id | Cancel booking |
| GET | /api/services | List all services |
| POST | /api/services | Create new service |
| PUT | /api/services/:id | Update service |
| GET | /api/availability/:salonId | Get availability |
| POST | /api/availability | Set availability |

## Quick Start

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run in production mode
npm run build && npm start

# Run tests
npm test
```

## Configuration

Configure via environment variables or `.env` file:
- `PORT`: Server port (default: 4010)
- `MONGODB_URI`: MongoDB connection string
- `NODE_ENV`: Environment (development/production)
- `CORS_ORIGIN`: Comma-separated list of allowed origins
- `JWT_SECRET`: Secret for JWT authentication
