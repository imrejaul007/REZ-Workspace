# ReZ Booking Service

Unified booking management service for hotels, travel, and experiences.

## Tech Stack

- **Runtime:** Node.js with TypeScript
- **Framework:** Express.js
- **Database:** MongoDB (Mongoose ODM)
- **Cache:** Redis (ioredis)
- **Error Tracking:** Sentry
- **Validation:** Zod, Joi
- **Logging:** Winston, Morgan
- **Security:** Helmet, CORS, express-mongo-sanitize

## Environment Variables

```env
# Server
PORT=4020
NODE_ENV=development
SERVICE_VERSION=1.0.0

# CORS
CORS_ORIGIN=https://admin.rez.money,https://rez.money,https://rez-app.vercel.app

# Database
MONGODB_URI=mongodb://localhost:27017/rez_booking

# Authentication
JWT_SECRET=your-jwt-secret-change-in-production
INTERNAL_SERVICE_TOKEN=your-internal-service-token

# Connected Services
HOTEL_SERVICE_URL=http://localhost:4015
STAYOWN_SERVICE_URL=http://localhost:4016
TRAVEL_SERVICE_URL=http://localhost:4007
PAYMENT_SERVICE_URL=http://localhost:4001

# Monitoring
SENTRY_DSN=
```

## API Endpoints

### Health Checks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Basic health check |
| GET | `/health/live` | Liveness probe |
| GET | `/health/ready` | Readiness probe (checks MongoDB) |
| GET | `/health/detailed` | Detailed health with component status |

### Bookings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bookings` | List all bookings |
| POST | `/api/bookings` | Create new booking |
| GET | `/api/bookings/:id` | Get booking by ID |
| PUT | `/api/bookings/:id` | Update booking |
| DELETE | `/api/bookings/:id` | Cancel booking |

### Hotel Bookings
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/bookings/hotels` | Create hotel booking |
| GET | `/api/bookings/hotels/:id` | Get hotel booking |
| PUT | `/api/bookings/hotels/:id` | Update hotel booking |

### Travel Bookings
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/bookings/travel` | Create travel booking |
| GET | `/api/bookings/travel/:id` | Get travel booking |

### Cancellations
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/bookings/cancellations` | Create cancellation request |
| GET | `/api/bookings/cancellations/:id` | Get cancellation status |
| POST | `/api/bookings/cancellations/:id/refund` | Process refund |

## Local Setup

### Prerequisites
- Node.js 20+
- MongoDB (local or Atlas)
- Redis (optional, for caching)

### Installation

```bash
# Clone and navigate
cd rez-booking-service

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
```

### Running Locally

```bash
# Development mode with hot reload
npm run dev

# Production build
npm run build
npm start
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start with ts-node-dev (hot reload) |
| `npm run build` | Compile TypeScript |
| `npm start` | Run production build |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |
| `npm run typecheck` | Type-check without building |

### Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test -- --coverage
```

## Project Structure

```
src/
  index.ts           # Main entry point
  models/            # Mongoose models
  routes/
    bookingRoutes.ts       # Core booking endpoints
    hotelBookingRoutes.ts  # Hotel-specific bookings
    travelBookingRoutes.ts  # Travel bookings
    cancellationRoutes.ts   # Cancellation handling
```

## License

MIT
