# Property Twin Service

A comprehensive digital twin service for multi-property hotel management in the Hotel OS platform.

## Overview

The Property Twin Service implements three core digital twins:

- **Guest Twin**: Profile, preferences, loyalty, stay history, and sentiment data
- **Room Twin**: Status, IoT state, occupancy, and features
- **Property Twin**: Venues, amenities, policies, and revenue centers

## Features

- Guest profile and preference management
- Room status tracking with IoT integration
- Property configuration and metrics
- Loyalty tier management
- Sentiment analysis integration
- Real-time availability search
- Revenue center tracking
- Portfolio-wide statistics

## API Endpoints

### Guest Twin

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/twins/guest` | Create guest twin |
| GET | `/api/twins/guest/:id` | Get guest twin |
| PUT | `/api/twins/guest/:id/preferences` | Update preferences |
| POST | `/api/twins/guest/:id/stay-history` | Add stay history |
| PUT | `/api/twins/guest/:id/sentiment` | Update sentiment |
| PUT | `/api/twins/guest/:id/loyalty` | Update loyalty |
| POST | `/api/twins/guest/:id/tags` | Add tags |
| DELETE | `/api/twins/guest/:id` | Archive guest twin |
| GET | `/api/twins/guest` | Query guest twins |
| GET | `/api/twins/guest/stats` | Get guest statistics |

### Room Twin

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/twins/room` | Create room twin |
| GET | `/api/twins/room/:id` | Get room twin |
| GET | `/api/twins/room/:id/status` | Get room status |
| PUT | `/api/twins/room/:id/status` | Update room status |
| PUT | `/api/twins/room/:id/condition` | Update room condition |
| PUT | `/api/twins/room/:id/iot` | Update IoT state |
| POST | `/api/twins/room/:id/checkin` | Check in guest |
| POST | `/api/twins/room/:id/checkout` | Check out guest |
| GET | `/api/twins/room` | Query room twins |
| GET | `/api/twins/room/available` | Find available rooms |
| GET | `/api/twins/room/maintenance` | Get rooms needing maintenance |
| GET | `/api/twins/room/stats` | Get room statistics |
| POST | `/api/twins/room/bulk` | Bulk create rooms |

### Property Twin

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/twins/property` | Create property twin |
| GET | `/api/twins/property/:id` | Get property twin |
| PUT | `/api/twins/property/:id/metrics` | Update property metrics |
| POST | `/api/twins/property/:id/venues` | Add venue |
| PUT | `/api/twins/property/:id/venues/:venueId` | Update venue |
| DELETE | `/api/twins/property/:id/venues/:venueId` | Remove venue |
| POST | `/api/twins/property/:id/amenities` | Add amenity |
| PUT | `/api/twins/property/:id/amenities/:amenityId` | Update amenity |
| POST | `/api/twins/property/:id/policies` | Add policy |
| GET | `/api/twins/property/:id/policies` | Get policies |
| PUT | `/api/twins/property/:id/revenue-centers/:centerId` | Update revenue center |
| PUT | `/api/twins/property/:id/integrations/:serviceName` | Update integration status |
| GET | `/api/twins/property/:id/venues` | Get active venues |
| GET | `/api/twins/property/:id/amenities` | Get available amenities |
| GET | `/api/twins/property/:id/revpar` | Get RevPAR |
| GET | `/api/twins/property/:id/capacity` | Get total venue capacity |
| GET | `/api/twins/property` | Query property twins |
| GET | `/api/twins/property/stats/portfolio` | Get portfolio statistics |
| DELETE | `/api/twins/property/:id` | Archive property twin |

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB 7+
- Redis 7+
- RabbitMQ 3+ (optional, for event-driven features)

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Build the project
npm run build

# Run tests
npm test
```

### Running the Service

```bash
# Development mode
npm run dev

# Production mode
npm start
```

### Docker

```bash
# Build Docker image
npm run docker:build

# Run with Docker Compose
npm run docker:run
```

## Configuration

Environment variables can be configured in `.env`:

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Service port | 8448 |
| NODE_ENV | Environment | development |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/property-twin-service |
| REDIS_HOST | Redis host | localhost |
| REDIS_PORT | Redis port | 6379 |
| RABBITMQ_URI | RabbitMQ connection string | amqp://localhost:5672 |
| LOG_LEVEL | Logging level | info |
| CORS_ORIGINS | Allowed CORS origins | http://localhost:3000 |
| GUEST_MEMORY_SERVICE_URL | Guest Memory service URL | http://localhost:8447 |
| REZ_POS_SERVICE_URL | REZ POS service URL | http://localhost:8449 |
| REZ_LOYALTY_SERVICE_URL | REZ Loyalty service URL | http://localhost:8450 |
| BRANDPULSE_SERVICE_URL | BrandPulse service URL | http://localhost:8451 |

## Health Check

```bash
curl http://localhost:8448/health
```

## License

Proprietary - All rights reserved
