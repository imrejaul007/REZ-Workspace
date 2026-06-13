# RTMN Driver Twin Service

Digital twin service for transport drivers in the RTMN Transport OS ecosystem. This service manages driver profiles, status, performance, earnings, and scheduling for the KHAIRMOVE platform.

## Overview

The Driver Twin Service is part of the Transport OS Digital Twin architecture, providing real-time digital representations of drivers. It integrates with:

- **KHAIRMOVE Fleet** - Vehicle and fleet management
- **KHAIRMOVE Driver** - Driver application integration
- **Dispatch Service** - Order matching and routing
- **Vehicle Twin** - Vehicle telemetry and status
- **Fleet Twin** - Fleet-level aggregation

## Features

- **Driver Profile Management** - Store and update driver personal information, licensing, and documents
- **Real-time Status Tracking** - Monitor driver availability, location, and current assignments
- **Performance Metrics** - Track trips, ratings, acceptance rates, and on-time performance
- **Earnings Management** - Daily, weekly, and monthly earnings with payout tracking
- **Shift Management** - Start/end shifts with regulatory hours tracking
- **Order Handling** - Accept and cancel orders with proper status transitions
- **Event-Driven Architecture** - Real-time event emission for status changes and updates
- **Geospatial Queries** - Find nearby available drivers

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- MongoDB 6.x
- Redis 7.x (optional, for distributed event emission)

### Installation

```bash
# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Edit .env with your configuration
```

### Development

```bash
# Run in development mode with hot reload
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### Docker

```bash
# Build the image
docker build -t driver-twin-service .

# Run with docker-compose
docker-compose up
```

## API Endpoints

### Driver Twin Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/twins/driver` | Create a new driver twin |
| GET | `/api/twins/driver/:id` | Get driver twin by ID |
| GET | `/api/twins/driver` | List driver twins with filters |
| PUT | `/api/twins/driver/:id` | Update driver twin |
| DELETE | `/api/twins/driver/:id` | Delete driver twin |

### Status & Location

| Method | Endpoint | Description |
|--------|----------|-------------|
| PUT | `/api/twins/driver/:id/status` | Update driver status |
| PUT | `/api/twins/driver/:id/location` | Update driver location |

### Performance & Earnings

| Method | Endpoint | Description |
|--------|----------|-------------|
| PUT | `/api/twins/driver/:id/performance` | Update performance metrics |
| PUT | `/api/twins/driver/:id/earnings` | Update earnings |
| PUT | `/api/twins/driver/:id/schedule` | Update schedule |

### Shift Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/twins/driver/:id/shift/start` | Start a shift |
| POST | `/api/twins/driver/:id/shift/end` | End a shift |

### Orders

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/twins/driver/:id/rate` | Record driver rating |
| GET | `/api/twins/driver/search/nearby` | Find nearby drivers |

### Statistics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/twins/driver/stats/summary` | Get driver statistics |

### Events

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/events` | List available event types |
| GET | `/api/events/stream` | SSE event stream |
| POST | `/api/events/test` | Emit test event (internal) |

## Twin ID Format

```
twin.transport.driver.{driver_id}
```

Example: `twin.transport.driver.DRV-001`

## Event Types

| Event | Description |
|-------|-------------|
| `driver.twin.created` | New driver twin created |
| `driver.twin.updated` | Driver twin updated |
| `driver.status.changed` | Driver status changed |
| `driver.location.updated` | Driver location updated |
| `driver.performance.updated` | Performance metrics changed |
| `driver.earnings.updated` | Earnings updated |
| `driver.schedule.updated` | Schedule changed |
| `driver.rating.received` | New rating received |
| `driver.shift.started` | Shift started |
| `driver.shift.ended` | Shift ended |
| `driver.order.accepted` | Order accepted |
| `driver.order.cancelled` | Order cancelled |

## Driver Status Flow

```
offline -> online -> busy -> online -> offline
              |        |
              v        v
            break    break
              |        |
              v        v
            online  offline
```

## Example Usage

### Create a Driver Twin

```bash
curl -X POST http://localhost:9047/api/twins/driver \
  -H "Content-Type: application/json" \
  -H "x-api-key: driver-twin-api-key" \
  -d '{
    "driver_id": "DRV-001",
    "profile": {
      "name": { "first": "John", "last": "Doe" },
      "email": "john.doe@example.com",
      "phone": "+1234567890"
    },
    "licensing": {
      "license_number": "DL-123456",
      "license_type": "commercial",
      "license_expiry": "2027-12-31"
    },
    "fleet_id": "FLEET-001"
  }'
```

### Start a Shift

```bash
curl -X POST http://localhost:9047/api/twins/driver/DRV-001/shift/start \
  -H "Content-Type: application/json" \
  -H "x-api-key: driver-twin-api-key" \
  -d '{
    "vehicle_id": "VEH-001"
  }'
```

### Update Location

```bash
curl -X PUT http://localhost:9047/api/twins/driver/DRV-001/location \
  -H "Content-Type: application/json" \
  -H "x-api-key: driver-twin-api-key" \
  -d '{
    "lat": 25.2048,
    "lng": 55.2708
  }'
```

### Find Nearby Drivers

```bash
curl "http://localhost:9047/api/twins/driver/search/nearby?lat=25.2048&lng=55.2708&radius_km=5" \
  -H "x-api-key: driver-twin-api-key"
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Service port | `9047` |
| `NODE_ENV` | Environment | `development` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/driver_twin` |
| `REDIS_URL` | Redis connection string | (optional) |
| `API_KEY` | API key for authentication | `driver-twin-api-key` |
| `INTERNAL_SERVICE_TOKEN` | Internal service token | (required for delete) |
| `LOG_LEVEL` | Logging level | `info` |

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Driver Twin Service                        │
├─────────────────────────────────────────────────────────────────┤
│  Routes                                                          │
│  ├── Driver Routes (CRUD, status, location, orders)             │
│  └── Event Routes (SSE, event emission)                        │
├─────────────────────────────────────────────────────────────────┤
│  Services                                                        │
│  └── DriverTwinService (business logic)                         │
├─────────────────────────────────────────────────────────────────┤
│  Models & Schemas                                               │
│  ├── DriverTwinModel (MongoDB)                                  │
│  └── Zod Schemas (validation)                                   │
├─────────────────────────────────────────────────────────────────┤
│  Events                                                          │
│  └── TwinEventEmitter (local + Redis)                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     External Services                            │
│  ├── KHAIRMOVE Fleet (vehicle management)                       │
│  ├── KHAIRMOVE Driver (driver app)                              │
│  ├── Dispatch Service (order matching)                          │
│  └── Vehicle Twin (telemetry)                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage
```

## License

Proprietary - RTMN Architecture Team
