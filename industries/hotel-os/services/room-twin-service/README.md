# Room Twin Service

A comprehensive Room Twin service with IoT integration for Hotel OS - The Invisible Hotel platform.

## Overview

The Room Twin Service provides real-time digital representations of hotel rooms, their IoT devices, and the guests staying in them. It integrates with MQTT for IoT device communication and maintains synchronized state across the hotel ecosystem.

## Features

### Twins Implemented

1. **Room Twin** - Room status, IoT state, occupancy, features
2. **Guest Twin** - Profile, preferences, loyalty, stay history, sentiment
3. **Property Twin** - Venues, amenities, policies, revenue centers

### IoT Integration

- MQTT-based device communication
- Real-time state synchronization
- Device heartbeat monitoring
- Alert handling and maintenance tracking
- Remote command execution

### API Endpoints

#### Room Twin
- `POST /api/twins/room` - Create room twin
- `GET /api/twins/room/:id` - Get room twin
- `GET /api/twins/room/:id/status` - Get room status with IoT state
- `PUT /api/twins/room/:id` - Update room twin
- `POST /api/twins/room/:id/checkin` - Check-in guest
- `POST /api/twins/room/:id/checkout` - Check-out guest
- `GET /api/twins/room/property/:propertyId` - Get all rooms for property
- `GET /api/twins/room/property/:propertyId/available` - Get available rooms
- `GET /api/twins/room/property/:propertyId/stats` - Get room statistics
- `POST /api/twins/room/:id/maintenance` - Add maintenance issue
- `POST /api/twins/room/:id/iot/command` - Send IoT command

#### Guest Twin
- `POST /api/twins/guest` - Create guest twin
- `GET /api/twins/guest/:id` - Get guest twin
- `GET /api/twins/guest/:id/full` - Get guest twin with memory data
- `PUT /api/twins/guest/:id/preferences` - Update preferences
- `POST /api/twins/guest/:id/stay` - Add stay history
- `POST /api/twins/guest/:id/feedback` - Add stay feedback
- `GET /api/twins/guest/:id/loyalty` - Get loyalty info
- `GET /api/twins/guest/:id/room-preferences` - Get room preferences
- `GET /api/twins/guest/top/loyalty` - Get top loyalty guests
- `GET /api/twins/guest/sentiment/:minScore/:maxScore` - Get guests by sentiment

#### Property Twin
- `POST /api/twins/property` - Create property twin
- `GET /api/twins/property/:id` - Get property twin
- `PUT /api/twins/property/:id` - Update property twin
- `POST /api/twins/property/:id/venue` - Add venue
- `PUT /api/twins/property/:id/venue/:venueId` - Update venue
- `DELETE /api/twins/property/:id/venue/:venueId` - Remove venue
- `POST /api/twins/property/:id/revenue-center` - Add revenue center
- `PUT /api/twins/property/:id/stats` - Update statistics
- `PUT /api/twins/property/:id/policies` - Update policies
- `GET /api/twins/property/:id/summary` - Get property summary
- `GET /api/twins/property/:id/revenue` - Get total revenue
- `GET /api/twins/property/brand/:brand` - Get properties by brand
- `GET /api/twins/property/city/:city` - Get properties by city

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB 7.0+
- Redis 7+
- MQTT Broker (optional for IoT features)

### Installation

```bash
cd industries/hotel-os/services/room-twin-service
npm install
```

### Development

```bash
# Copy environment file
cp .env.example .env

# Run in development mode
npm run dev

# Run tests
npm test
```

### Production

```bash
# Build
npm run build

# Start
npm start
```

### Docker

```bash
# Build image
docker build -t room-twin-service .

# Run container
docker run -p 8444:8444 room-twin-service
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Service port | 8444 |
| MONGODB_URI | MongoDB connection string | mongodb://admin:password@localhost:27017/room-twin |
| REDIS_URL | Redis connection string | redis://localhost:6379 |
| MQTT_BROKER_URL | MQTT broker URL | mqtt://localhost:1883 |
| GUEST_MEMORY_URL | Guest Memory service URL | http://localhost:8447 |
| REZ_POS_URL | REZ POS service URL | http://localhost:8449 |
| REZ_LOYALTY_URL | REZ Loyalty service URL | http://localhost:8450 |
| BRANDPULSE_URL | BrandPulse service URL | http://localhost:8451 |
| INTERNAL_SERVICE_TOKEN | Internal service authentication token | - |
| LOG_LEVEL | Logging level | info |

## IoT Device Types

- **Thermostat** - Temperature control
- **Lighting** - Main, ambient, bathroom lights
- **Locks** - Door lock control
- **TV** - Television control
- **Minibar** - Minibar inventory tracking
- **Climate** - HVAC control
- **Sensors** - Motion, humidity, occupancy
- **Blinds** - Window blind control

## API Response Format

All API responses follow this format:

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "uuid"
  }
}
```

Error responses:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": { ... }
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "uuid"
  }
}
```

## Service Integration

### Guest Memory (8447)
- Syncs guest profiles and preferences
- Retrieves guest memory data

### REZ POS (8449)
- Minibar item consumption tracking
- Revenue center updates

### REZ Loyalty (8450)
- Loyalty points synchronization
- Tier management

### BrandPulse (8451)
- Sentiment analysis data
- Guest feedback aggregation

## MQTT Topics

### Subscribed Topics
- `hotel/rooms/+/iot/#` - All IoT events from rooms
- `hotel/rooms/+/status` - Room status changes
- `hotel/rooms/+/alerts` - Room alerts
- `hotel/devices/+/heartbeat` - Device heartbeats

### Published Topics
- `hotel/rooms/{roomId}/commands` - IoT commands
- `hotel/rooms/{roomId}/status` - Room status updates
- `hotel/rooms/{roomId}/events` - Room events

## License

Proprietary - RTNM Digital
