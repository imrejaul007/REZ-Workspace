# AI Front Desk Service

**Port:** 3800  
**Version:** 3.0.0 (Refactored)  
**Purpose:** Hotel AI receptionist for guest interactions

---

## Architecture

```
src/
├── config/           # Configuration, database, logging
├── middleware/       # Auth, rate limiting, security
├── models/           # Mongoose models (Guest, Booking, etc.)
├── routes/           # Express route handlers
├── services/         # Business logic layer
├── types/            # TypeScript type definitions
├── validators/       # Request validation
└── __tests__/       # Unit tests
```

## Features

- **Guest Management:** Create, update, and track hotel guests
- **Service Requests:** Room service, housekeeping, maintenance
- **Bookings:** Booking lifecycle management
- **AI Concierge:** Natural language guest assistance
- **Dashboard:** Real-time statistics and analytics

## API Endpoints

### Health
- `GET /health` - Health check
- `GET /ready` - Readiness check

### Guests
- `POST /api/guests` - Create guest
- `GET /api/guests/:id` - Get guest by ID
- `GET /api/guests/room/:roomNumber` - Get guests by room
- `PUT /api/guests/:id` - Update guest
- `PUT /api/guests/:id/requests` - Add request to guest
- `DELETE /api/guests/:id` - Delete guest

### Service Requests
- `POST /api/requests` - Create service request
- `GET /api/requests` - List requests (with filters)
- `GET /api/requests/:id` - Get request by ID
- `PUT /api/requests/:id/status` - Update request status
- `GET /api/requests/room/:roomNumber` - Get room requests

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings/:id` - Get booking by ID
- `GET /api/bookings/date/:date` - Get bookings for date
- `PUT /api/bookings/:id/status` - Update booking status
- `POST /api/bookings/:id/cancel` - Cancel booking

### Concierge
- `POST /api/concierge/query` - Process guest query
- `GET /api/concierge/welcome` - Get welcome message
- `GET /api/concierge/greeting` - Get time-based greeting

### Dashboard
- `GET /api/dashboard` - Get dashboard statistics
- `GET /api/dashboard/service-requests` - Request statistics
- `GET /api/dashboard/bookings` - Booking statistics
- `GET /api/dashboard/activity` - Recent activity

## Quick Start

```bash
# Install dependencies
npm install

# Development
npm run dev

# Production
npm run build
npm start

# Run tests
npm test
```

## Environment Variables

```bash
PORT=3800
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/ai-front-desk
HOJAI_STAYBOT_URL=http://localhost:4840
REZ_AUTH_URL=http://localhost:4002
REZ_STAYOWN_URL=http://localhost:4015
API_KEY=your-api-key
INTERNAL_SERVICE_TOKEN=your-internal-token
LOG_LEVEL=info
```

## Security

- API key authentication for internal services
- Rate limiting (100 requests/minute standard, 10/minute strict)
- Input validation with Zod
- Security headers with Helmet
- SQL/NoSQL injection prevention