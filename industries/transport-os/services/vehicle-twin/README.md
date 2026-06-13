# Vehicle Twin Service

**Part of:** Transport OS (RTMN)
**Port:** 9041
**Version:** 1.0.0

## Overview

The Vehicle Twin Service provides real-time digital twin capabilities for vehicles in the Transport OS ecosystem. It tracks vehicle status, telemetry, location, maintenance schedules, and utilization metrics, enabling fleet operators and dispatch systems to make informed decisions.

## Features

- **Vehicle Registration**: Register vehicles with comprehensive profile data (VIN, license plate, make, model, etc.)
- **Real-time Status Tracking**: Monitor vehicle availability, busy, offline, maintenance, charging, or cleaning status
- **Location Tracking**: Track vehicle GPS coordinates with heading and speed
- **Telemetry Processing**: Ingest and process vehicle telemetry data (fuel, battery, odometer, diagnostics)
- **Maintenance Management**: Schedule and track maintenance, insurance, and inspection dates
- **Utilization Metrics**: Track trip counts, revenue, and utilization rates
- **Nearby Vehicle Search**: Find available vehicles within a radius
- **Event Publishing**: Publish vehicle events to message broker for downstream consumers

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Vehicle Twin Service                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐      │
│   │   Routes    │────▶│ Controllers │────▶│  Services   │      │
│   │             │     │             │     │             │      │
│   └─────────────┘     └─────────────┘     └──────┬──────┘      │
│                                                  │              │
│   ┌─────────────┐     ┌─────────────┐     ┌──────▼──────┐      │
│   │ Middleware  │     │   Models    │◀────│ Repository  │      │
│   │ (CORS, RL)  │     │ (Mongoose)  │     │             │      │
│   └─────────────┘     └─────────────┘     └──────┬──────┘      │
│                                                  │              │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │                    External Services                     │  │
│   │  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐  │  │
│   │  │ MongoDB  │  │  Redis   │  │    RabbitMQ          │  │  │
│   │  │          │  │          │  │ (Event Publishing)   │  │  │
│   │  └──────────┘  └──────────┘  └──────────────────────┘  │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- MongoDB
- Redis (optional)
- RabbitMQ (optional)

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Build the service
npm run build

# Start the service
npm start

# Or run in development mode
npm run dev
```

### Docker

```bash
# Build Docker image
npm run docker:build

# Run with docker-compose
npm run docker:run
```

## API Endpoints

### Vehicle Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/vehicles` | Create a new vehicle |
| GET | `/api/vehicles` | List vehicles (with filters) |
| GET | `/api/vehicles/:vehicleId` | Get vehicle by ID |
| GET | `/api/vehicles/vin/:vin` | Get vehicle by VIN |
| GET | `/api/vehicles/plate/:licensePlate` | Get vehicle by license plate |
| PATCH | `/api/vehicles/:vehicleId/status` | Update vehicle status |
| PATCH | `/api/vehicles/:vehicleId/telemetry` | Update vehicle telemetry |
| PATCH | `/api/vehicles/:vehicleId/location` | Update vehicle location |
| PATCH | `/api/vehicles/:vehicleId/utilization` | Update utilization metrics |
| PATCH | `/api/vehicles/:vehicleId/cleanliness` | Update cleanliness status |
| PATCH | `/api/vehicles/:vehicleId/maintenance` | Update maintenance info |
| DELETE | `/api/vehicles/:vehicleId` | Soft delete vehicle |

### Vehicle Queries

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/vehicles/statistics` | Get fleet statistics |
| GET | `/api/vehicles/nearby` | Find nearby available vehicles |
| GET | `/api/vehicles/fleet/:fleetId` | Get vehicles by fleet |
| GET | `/api/vehicles/owner/:ownerId` | Get vehicles by owner |
| GET | `/api/vehicles/maintenance/due` | Get vehicles needing maintenance |

### Telemetry

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/telemetry/:vehicleId` | Process telemetry update |
| GET | `/api/telemetry/:vehicleId/stats` | Get telemetry statistics |
| GET | `/api/telemetry/low-levels` | Get vehicles with low fuel/battery |
| GET | `/api/telemetry/issues` | Get vehicles with diagnostic issues |
| DELETE | `/api/telemetry/:vehicleId/alerts` | Clear maintenance alerts |
| POST | `/api/telemetry/:vehicleId/service` | Record vehicle service |

### Health Checks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Basic health check |
| GET | `/health/ready` | Readiness check (DB, Redis, RabbitMQ) |
| GET | `/health/live` | Liveness check |

## Request/Response Examples

### Create Vehicle

```bash
POST /api/vehicles
Content-Type: application/json

{
  "profile": {
    "vin": "1HGBH41JXMN109186",
    "licensePlate": "ABC-1234",
    "make": "Toyota",
    "model": "Camry",
    "year": 2023,
    "color": "Silver",
    "category": "sedan",
    "capacity": {
      "passengers": 5,
      "cargoWeightKg": 500,
      "cargoVolumeM3": 0.5
    }
  },
  "ownership": {
    "type": "owned",
    "ownerId": "OWNER-001",
    "fleetId": "FLEET-001"
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "vehicleId": "VTWIN-A1B2C3D4",
    "profile": {
      "vin": "1HGBH41JXMN109186",
      "licensePlate": "ABC-1234",
      "make": "Toyota",
      "model": "Camry",
      "year": 2023,
      "color": "Silver",
      "category": "sedan",
      "capacity": {
        "passengers": 5,
        "cargoWeightKg": 500,
        "cargoVolumeM3": 0.5
      }
    },
    "ownership": {
      "type": "owned",
      "ownerId": "OWNER-001",
      "fleetId": "FLEET-001"
    },
    "status": {
      "current": "offline",
      "location": { "lat": 0, "lng": 0, "address": null },
      "heading": 0,
      "speed": 0,
      "since": "2026-06-12T12:00:00.000Z"
    },
    "telemetry": {
      "fuelLevel": null,
      "batteryLevel": null,
      "odometer": 0,
      "engineHours": 0,
      "diagnostics": {
        "engineStatus": "ok",
        "tirePressure": [],
        "brakeStatus": "ok",
        "oilLevel": 100,
        "coolantTemp": 90,
        "errorCodes": []
      }
    },
    "maintenance": {},
    "utilization": {},
    "cleanliness": {},
    "isActive": true
  },
  "message": "Vehicle created successfully"
}
```

### Update Vehicle Status

```bash
PATCH /api/vehicles/VTWIN-A1B2C3D4/status
Content-Type: application/json

{
  "status": "available",
  "location": {
    "lat": 25.2048,
    "lng": 55.2708,
    "address": "Dubai Mall, Dubai"
  },
  "heading": 90,
  "speed": 0
}
```

### Get Nearby Vehicles

```bash
GET /api/vehicles/nearby?lat=25.2048&lng=55.2708&radius=5&limit=10
```

### Process Telemetry Update

```bash
POST /api/telemetry/VTWIN-A1B2C3D4
Content-Type: application/json

{
  "fuelLevel": 75,
  "batteryLevel": null,
  "odometer": 50234,
  "engineHours": 1234,
  "tirePressure": [32, 32, 31, 33],
  "oilLevel": 85,
  "coolantTemp": 90
}
```

## Vehicle Status Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│ OFFLINE  │────▶│AVAILABLE │────▶│  BUSY    │────▶│AVAILABLE │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
     │                │                │                │
     │                │                │                │
     ▼                ▼                ▼                ▼
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│MAINTENANCE│◀───│ CHARGING │     │ CLEANING │     │MAINTENANCE
└──────────┘     └──────────┘     └──────────┘     └──────────┘
```

## Vehicle Categories

- `sedan` - Standard sedan vehicles
- `suv` - Sport utility vehicles
- `van` - Van/minivan vehicles
- `truck` - Pickup trucks and light trucks
- `motorcycle` - Motorcycles
- `electric` - Electric vehicles
- `bike` - Bicycles
- `scooter` - Electric scooters

## Event Publishing

The service publishes the following events to RabbitMQ:

| Event | Routing Key | Description |
|-------|------------|-------------|
| Vehicle Created | `vehicle.created` | New vehicle registered |
| Vehicle Updated | `vehicle.updated` | Vehicle data modified |
| Status Changed | `vehicle.status_changed` | Vehicle status changed |
| Telemetry Updated | `vehicle.telemetry_updated` | Telemetry data received |
| Maintenance Due | `vehicle.maintenance_due` | Maintenance alert |
| Vehicle Deleted | `vehicle.deleted` | Vehicle soft deleted |

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm test -- --coverage
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SERVICE_PORT` | Service port | `9041` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/vehicle_twin` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `RABBITMQ_URI` | RabbitMQ connection string | `amqp://localhost:5672` |
| `LOG_LEVEL` | Logging level | `info` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `60000` |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` |

## Integration with TwinOS

The Vehicle Twin Service is designed to integrate with the TwinOS platform:

- **TwinOS Entity ID:** `twin.transport.vehicle.{vehicle_id}`
- **Managing Agent:** `agent.vehicle_management`
- **Relationships:**
  - `ASSIGNED_TO` - Fleet Twin
  - `DRIVEN_BY` - Driver Twin (when active)
  - `SERVICES` - Order Twin (1:many)
  - `LOCATED_IN` - Area Twin

## License

MIT
