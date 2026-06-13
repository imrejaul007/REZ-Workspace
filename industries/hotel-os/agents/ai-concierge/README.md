# AI Concierge Agent

**Port:** 8452  
**Protocol:** REST API  
**Industry:** Hotel OS

The AI Concierge Agent provides virtual concierge services with hotel-specific skills, managing digital twins of guests, rooms, and properties to enable personalized guest experiences.

## Features

- **Guest Twin Management** - Create, read, update guest profiles with preferences, loyalty, and sentiment data
- **Room Twin Management** - Track room status, IoT state, housekeeping, and revenue data
- **Property Twin Management** - Manage venues, staff, services, and revenue metrics
- **Guest Memory Integration** - Sync with Guest Memory service (8447) for preference learning
- **Sentiment Tracking** - Real-time sentiment updates with BrandPulse integration
- **Service Request Routing** - Route guest requests to appropriate departments

## Digital Twins Implemented

### Guest Twin
- Profile (name, email, phone, nationality, language, accessibility)
- Loyalty (tier, points, member since, total stays, total spend)
- Preferences (room, dining, amenities, communication)
- Stay Patterns (check-in/out times, booking behavior)
- Sentiment (current score, trend, key topics)
- Lifetime Value (CLV, churn risk, recommendation eligibility)
- Current Stay (room, check-in/out, rate code, special requests)

### Room Twin
- Basic Info (room number, type, floor, view, capacity)
- Bed Configuration (bed count, type, rollaway availability)
- Amenities (smart TV, speaker, minibar, coffee, safe, balcony, jacuzzi)
- Status (available, occupied, blocked, out_of_order, cleaning, inspected)
- IoT State (thermostat, lighting, blinds, door lock, occupancy sensor)
- Housekeeping (last cleaned, next scheduled, frequency, supply status)
- Revenue (base rate, rack rate, minibar balance)

### Property Twin
- Location (address, city, country, coordinates, timezone)
- Inventory (total rooms, by type, availability)
- Venues (restaurants, bars, spa, gym, pool, meeting rooms)
- Staff (total count, by department, on duty now)
- Services (24h check-in, concierge, room service hours)
- Revenue (today, MTD, YTD, RevPAR, ADR, occupancy rate)

## API Endpoints

### Guest Twin

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/twins/guest` | Create guest twin |
| GET | `/api/twins/guest` | Get all guest twins |
| GET | `/api/twins/guest/:id` | Get guest twin by ID |
| PUT | `/api/twins/guest/:id/preferences` | Update preferences |
| PATCH | `/api/twins/guest/:id/preferences` | Partial update preferences |
| PUT | `/api/twins/guest/:id/stay` | Update current stay |
| PUT | `/api/twins/guest/:id/sentiment` | Update sentiment |
| DELETE | `/api/twins/guest/:id` | Delete guest twin |

### Room Twin

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/twins/room` | Create room twin |
| GET | `/api/twins/room` | Get all room twins |
| GET | `/api/twins/room/:id` | Get room twin by ID |
| GET | `/api/twins/room/:id/status` | Get room status only |
| PUT | `/api/twins/room/:id/status` | Update room status |
| PATCH | `/api/twins/room/:id/status` | Partial update status |
| PUT | `/api/twins/room/:id/iot` | Update IoT state |
| PATCH | `/api/twins/room/:id/iot` | Partial update IoT state |
| PUT | `/api/twins/room/:id/housekeeping` | Update housekeeping |
| DELETE | `/api/twins/room/:id` | Delete room twin |

### Property Twin

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/twins/property` | Create property twin |
| GET | `/api/twins/property` | Get all property twins |
| GET | `/api/twins/property/:id` | Get property twin by ID |
| PUT | `/api/twins/property/:id/inventory` | Update inventory |
| PUT | `/api/twins/property/:id/venue` | Add/update venue |
| PUT | `/api/twins/property/:id/revenue` | Update revenue |
| PUT | `/api/twins/property/:id/staff` | Update staff |
| PUT | `/api/twins/property/:id/services` | Update services |
| DELETE | `/api/twins/property/:id` | Delete property twin |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Basic health check |
| GET | `/health/ready` | Readiness check with dependencies |
| GET | `/health/live` | Liveness check |

## Quick Start

### Development

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev

# Run tests
npm test
```

### Docker

```bash
# Build and run with Docker Compose
cd docker
docker-compose up -d

# Development mode with hot reload
docker-compose -f docker-compose.dev.yml up -d
```

## Configuration

Environment variables (see `.env.example`):

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 8452 | Service port |
| NODE_ENV | development | Environment |
| GUEST_MEMORY_URL | http://localhost:8447 | Guest Memory service URL |
| REDIS_HOST | localhost | Redis host |
| LOG_LEVEL | info | Logging level |

## Project Structure

```
ai-concierge/
├── src/
│   ├── index.ts              # Main entry point
│   ├── app.ts                # Express app setup
│   ├── types/                # TypeScript type definitions
│   ├── schemas/              # Zod validation schemas
│   ├── services/             # Business logic services
│   │   ├── guest-twin.service.ts
│   │   ├── room-twin.service.ts
│   │   ├── property-twin.service.ts
│   │   └── guest-memory.client.ts
│   ├── routes/               # API route handlers
│   │   ├── guest.routes.ts
│   │   ├── room.routes.ts
│   │   ├── property.routes.ts
│   │   └── health.routes.ts
│   ├── middleware/           # Express middleware
│   └── utils/                # Utilities (logger, errors)
├── tests/                    # Unit tests
├── docker/                   # Docker configuration
├── package.json
├── tsconfig.json
└── README.md
```

## Integration

### Guest Memory (8447)
The AI Concierge syncs guest twin data with Guest Memory for:
- Preference learning across stays
- Lifetime value calculation
- Sentiment tracking

### BrandPulse (8451)
Sentiment updates are forwarded to BrandPulse for:
- NPS calculation
- Competitive benchmarking
- Review aggregation

### REZ POS (8449)
Integrates with POS for:
- Guest billing preferences
- Transaction recording
- Folio management

### REZ Loyalty (8450)
Integrates with Loyalty for:
- Points balance sync
- Tier management
- Points redemption

## Error Codes

| Code | Description |
|------|-------------|
| TWIN_NOT_FOUND | Twin does not exist |
| TWIN_ALREADY_EXISTS | Twin already created |
| TWIN_UPDATE_CONFLICT | Concurrent update conflict |
| VALIDATION_ERROR | Invalid request data |
| SERVICE_UNAVAILABLE | Dependent service down |
| RATE_LIMIT_EXCEEDED | API rate limit hit |

## License

MIT
