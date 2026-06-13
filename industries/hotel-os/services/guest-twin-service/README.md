# Guest Twin Service

Digital twin service for hotel guests, rooms, and properties as part of the Hotel OS ecosystem.

## Overview

The Guest Twin Service provides a unified digital representation of hotel entities including guests, rooms, and properties. It enables real-time tracking, preference management, and event-driven interactions with other Hotel OS services.

## Features

- **Guest Twin**: Profile, preferences, loyalty, stay history, sentiment tracking
- **Room Twin**: Status, IoT state, occupancy, housekeeping, revenue
- **Property Twin**: Venues, amenities, policies, staff, revenue centers
- **Event Emitter**: Real-time event publishing for all twin operations
- **Service Integration**: Connectors for Guest Memory, REZ Loyalty, REZ POS, BrandPulse

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Guest Twin Service (8447)                    │
├─────────────────────────────────────────────────────────────────┤
│  Routes Layer                                                     │
│  ├── /api/twins/guest  - Guest CRUD and operations              │
│  ├── /api/twins/room   - Room CRUD and operations               │
│  ├── /api/twins/property - Property CRUD and operations         │
│  └── /api/events       - Event subscription and publishing      │
├─────────────────────────────────────────────────────────────────┤
│  Services Layer                                                   │
│  ├── GuestTwinService    - Guest profile and preferences        │
│  ├── RoomTwinService     - Room status and IoT management       │
│  └── PropertyTwinService - Property operations                  │
├─────────────────────────────────────────────────────────────────┤
│  Models Layer                                                     │
│  ├── GuestTwin (MongoDB)  - Guest data persistence              │
│  ├── RoomTwin (MongoDB)   - Room data persistence               │
│  └── PropertyTwin (MongoDB) - Property data persistence          │
├─────────────────────────────────────────────────────────────────┤
│  Events Layer                                                     │
│  └── TwinEventEmitter - Redis pub/sub for distributed events     │
└─────────────────────────────────────────────────────────────────┘
```

## API Endpoints

### Guest Twin APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/twins/guest` | Create guest twin |
| GET | `/api/twins/guest/:id` | Get guest twin by ID |
| GET | `/api/twins/guest` | List guest twins |
| PUT | `/api/twins/guest/:id` | Update guest twin |
| PUT | `/api/twins/guest/:id/preferences` | Update preferences |
| GET | `/api/twins/guest/:id/preferences` | Get preferences |
| PUT | `/api/twins/guest/:id/sentiment` | Update sentiment |
| POST | `/api/twins/guest/:id/checkin` | Process check-in |
| POST | `/api/twins/guest/:id/checkout` | Process check-out |
| PUT | `/api/twins/guest/:id/loyalty` | Update loyalty status |
| GET | `/api/twins/guest/stats/summary` | Get guest statistics |
| DELETE | `/api/twins/guest/:id` | Delete guest twin |

### Room Twin APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/twins/room` | Create room twin |
| GET | `/api/twins/room/:id` | Get room twin by ID |
| GET | `/api/twins/room/:id/status` | Get room status |
| GET | `/api/twins/room` | List room twins |
| PUT | `/api/twins/room/:id` | Update room twin |
| PUT | `/api/twins/room/:id/status` | Update room status |
| PUT | `/api/twins/room/:id/iot` | Update IoT state |
| POST | `/api/twins/room/:id/assign` | Assign guest to room |
| POST | `/api/twins/room/:id/clear` | Clear guest from room |
| PUT | `/api/twins/room/:id/housekeeping` | Update housekeeping |
| GET | `/api/twins/room/stats/summary` | Get room statistics |
| DELETE | `/api/twins/room/:id` | Delete room twin |

### Property Twin APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/twins/property` | Create property twin |
| GET | `/api/twins/property/:id` | Get property twin by ID |
| GET | `/api/twins/property` | List property twins |
| PUT | `/api/twins/property/:id` | Update property twin |
| PUT | `/api/twins/property/:id/inventory` | Update inventory |
| PUT | `/api/twins/property/:id/revenue` | Update revenue |
| POST | `/api/twins/property/:id/venues` | Add/update venue |
| DELETE | `/api/twins/property/:id/venues/:venueId` | Remove venue |
| PUT | `/api/twins/property/:id/staff` | Update staff counts |
| GET | `/api/twins/property/stats/summary` | Get property statistics |
| DELETE | `/api/twins/property/:id` | Delete property twin |

## Event Types

### Guest Events
- `guest.twin.created` - New guest twin created
- `guest.twin.updated` - Guest twin updated
- `guest.preferences.updated` - Preferences changed
- `guest.sentiment.updated` - Sentiment score changed
- `guest.checkin` - Guest checked in
- `guest.checkout` - Guest checked out
- `guest.loyalty.updated` - Loyalty status changed

### Room Events
- `room.twin.created` - New room twin created
- `room.twin.updated` - Room twin updated
- `room.status.changed` - Room status changed
- `room.iot.changed` - IoT state changed
- `room.occupied` - Room occupied
- `room.vacated` - Room vacated

### Property Events
- `property.twin.created` - New property twin created
- `property.twin.updated` - Property twin updated
- `property.inventory.changed` - Inventory changed
- `property.revenue.updated` - Revenue metrics updated

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB 6+
- Redis 7+ (optional, for distributed events)

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start services
npm run dev
```

### Docker

```bash
# Build and run
docker-compose up -d

# Run tests
docker-compose exec guest-twin-service npm test
```

## Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Service port | 8447 |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/guest_twin |
| REDIS_URL | Redis connection string | redis://localhost:6379 |
| API_KEY | API authentication key | guest-twin-api-key |
| INTERNAL_SERVICE_TOKEN | Service-to-service token | internal-token |

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test -- --coverage

# Watch mode
npm run test:watch
```

## Integration

### With Guest Memory (8447)
The service integrates with Guest Memory for guest profile enrichment and preference learning.

### With REZ Loyalty (8450)
Updates loyalty points and tier status when guests earn or redeem points.

### With REZ POS (8449)
Tracks guest spending and charges for billing.

### With BrandPulse (8451)
Receives sentiment analysis for guest feedback.

## License

Proprietary - RTMN Platform