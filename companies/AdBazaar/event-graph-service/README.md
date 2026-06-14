# Event Graph Service

**Event Intelligence Network** - Track events and predict impact on nearby merchants.

**Port:** 4880

## Overview

The Event Graph Service is a specialized microservice that builds dedicated Event Graphs for different event types, enabling intelligent analysis of how events impact nearby merchants and advertising opportunities.

## Event Types Supported

| Type | Description | Default Footfall | Ad Multiplier |
|------|-------------|------------------|---------------|
| **Wedding** | Sangeet, Reception, Mehndi | 500 | 1.2x |
| **Festival** | Diwali, Holi, Eid, Christmas | 5,000 | 1.5x |
| **Conference** | Tech summits, business events | 1,000 | 1.0x |
| **Sports** | IPL, World Cup, Olympics | 10,000 | 2.0x |
| **Religious** | Temple visits, church, mosque | 2,000 | 1.3x |
| **Community** | Society events, club meetings | 300 | 0.8x |
| **Corporate** | Company events, launches | 500 | 0.9x |
| **Entertainment** | Concerts, movies | 2,000 | 1.4x |
| **Political** | Rallies, campaigns | 5,000 | 1.1x |
| **Other** | Miscellaneous events | 500 | 1.0x |

## Features

### 1. Event Discovery
Track events by type, location, scale, and date. Build comprehensive event graphs for analysis.

### 2. Footfall Prediction
Predict expected attendance based on event type, historical data, and venue capacity.

### 3. Impact Analysis
Analyze how events affect nearby merchants across different categories.

### 4. Campaign Suggestions
Get AI-powered recommendations for ad budgets targeting nearby merchants.

### 5. Timing Optimization
Determine optimal campaign timing for maximum impact based on event schedule.

### 6. Event Graph Query
Query events by location, type, date range, and graph relationships.

## API Endpoints

### Health& Info
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check with DB and memory status |
| `/metrics` | GET | Prometheus metrics |
| `/api` | GET | API documentation |

### Events
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/events` | POST | Create a new event |
| `/api/events/bulk` | POST | Bulk create events (max 100) |
| `/api/events` | GET | List events with filters |
| `/api/events/nearby` | GET | Find events near location |
| `/api/events/graph/:type` | GET | Get event graph by type |
| `/api/events/stats` | GET | Get event statistics |
| `/api/events/:id` | GET | Get event by ID |
| `/api/events/:id` | PATCH | Update event |
| `/api/events/:id/status` | PATCH | Update event status |
| `/api/events/:id/footfall` | PATCH | Update actual footfall |
| `/api/events/:id` | DELETE | Delete event |

### Impact Analysis
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/events/:id/impact` | GET | Get impact analysis |
| `/api/events/:id/suggestions` | GET | Get campaign suggestions |
| `/api/impact/compare` | GET | Compare multiple events |
| `/api/impact/predict` | POST | Predict hypothetical event impact |

## Quick Start

### Prerequisites
- Node.js >= 18.0.0
- MongoDB >= 6.0
- npm or yarn

### Installation

```bash
# Navigate to service directory
cd AdBazaar/event-graph-service

# Install dependencies
npm install

# Set environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev

# Or build and start production
npm run build
npm start
```

### Environment Variables

```env
# Server
PORT=4880
NODE_ENV=development
SERVICE_NAME=event-graph-service

# MongoDB
MONGODB_URI=mongodb://localhost:27017/event_graph
MONGODB_POOL_SIZE=10
MONGODB_MIN_POOL=2
MONGODB_TIMEOUT=5000

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# Metrics
METRICS_ENABLED=true
METRICS_PATH=/metrics

# CORS
CORS_ORIGIN=*
CORS_CREDENTIALS=true

# Rate Limiting
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX=100

# Ecosystem Services
BUZZLOCAL_SERVICE_URL=http://localhost:3000
AIRZY_SERVICE_URL=http://localhost:4500
APARTMENT_TARGETING_URL=http://localhost:4000
PLACE_GRAPH_URL=http://localhost:4100

# Business Logic
DEFAULT_RADIUS=5000
MAX_RADIUS=50000
AD_BUDGET_MULTIPLIER=0.4
```

## Usage Examples

### Create an Event

```bash
curl -X POST http://localhost:4880/api/events \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: your-service-token" \
  -d '{
    "name": "IPL Finals Watch Party",
    "type": "sports",
    "date": "2026-06-15",
    "expectedFootfall": 30000,
    "location": {
      "type": "Point",
      "coordinates": [72.8777, 19.0760],
      "city": "Mumbai"
    },
    "organizer": {
      "name": "REZ Sports Club",
      "type": "organization"
    },
    "tags": ["sports", "entertainment"]
  }'
```

### Find Nearby Events

```bash
curl "http://localhost:4880/api/events/nearby?lat=19.0760&lng=72.8777&radius=5000&type=sports&limit=10" \
  -H "X-Internal-Token: your-service-token"
```

### Get Event Graph (Sports)

```bash
curl "http://localhost:4880/api/events/graph/sports?startDate=2026-06-01&endDate=2026-06-30&limit=50" \
  -H "X-Internal-Token: your-service-token"
```

### Get Impact Analysis

```bash
curl "http://localhost:4880/api/events/{eventId}/impact" \
  -H "X-Internal-Token: your-service-token"
```

### Get Campaign Suggestions

```bash
curl "http://localhost:4880/api/events/{eventId}/suggestions" \
  -H "X-Internal-Token: your-service-token"
```

## Response Examples

### Impact Analysis Response

```json
{
  "success": true,
  "data": {
    "eventId": "507f1f77bcf86cd799439011",
    "eventName": "IPL Finals Watch Party",
    "eventType": "sports",
    "date": "2026-06-15T00:00:00.000Z",
    "expectedFootfall": 30000,
    "location": {
      "type": "Point",
      "coordinates": [72.8777, 19.0760],
      "city": "Mumbai"
    },
    "impactMetrics": {
      "nearbyMerchants": 15,
      "affectedCategories": ["restaurant", "bar", "merchandise", "transport", "sports_shop"],
      "peakHours": ["17:00-21:00", "14:00-17:00"],
      "duration": 4,
      "estimatedRevenueImpact": 12000,
      "adOpportunityScore": 85
    },
    "affectedAreas": [
      {
        "name": "Andheri West",
        "radius": 500,
        "merchantCount": 8,
        "averageDistance": 250
      }
    ],
    "recommendations": [
      {
        "category": "restaurant",
        "action": "Target restaurant customers with IPL Finals Watch Party",
        "priority": "high",
        "estimatedReach": 9000,
        "suggestedBudget": 3600
      }
    ]
  }
}
```

### Campaign Suggestions Response

```json
{
  "success": true,
  "data": {
    "eventId": "507f1f77bcf86cd799439011",
    "eventName": "IPL Finals Watch Party",
    "nearbyMerchants": [
      {
        "merchantId": "merchant_1",
        "name": "Pizza Palace",
        "category": "restaurant",
        "distance": 450,
        "relevanceScore": 0.85
      }
    ],
    "campaignTiming": {
      "optimalStart": "2026-06-08T00:00:00.000Z",
      "optimalEnd": "2026-06-16T00:00:00.000Z",
      "peakHours": ["17:00-21:00", "14:00-17:00"],
      "recommendedDuration": 7
    },
    "budgetRecommendations": [
      {
        "category": "restaurant",
        "minBudget": 3000,
        "maxBudget": 5000,
        "expectedROI": 85,
        "adFormat": "Image + Offer"
      }
    ],
    "targetingOptions": {
      "radius": 1000,
      "demographics": ["18-45", "sports_fans"],
      "interests": ["sports", "entertainment", "teams"]
    },
    "totalRecommendedBudget": 12000
  }
}
```

## Ecosystem Connections

| Service | Connection | Purpose |
|---------|------------|---------|
| **BuzzLocal** | Community events | Location-based event discovery |
| **Airzy** | Travel events | Airport/travel event tracking |
| **apartment-targeting-service** | Location data | Merchant proximity analysis |
| **place-graph-index** | Venue data | Venue intelligence |

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    EVENT GRAPH SERVICE (4880)                  │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   Events   │  │   Impact   │  │  Campaign  │             │
│  │   Router   │  │   Router   │  │  Router    │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│         │                │                │                    │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    Event Service                         │ │
│  │  - CRUD operations                                        │ │
│  │  - Geo-spatial queries                                   │ │
│  │  - Event graph aggregation                               │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                   Impact Service                          │ │
│  │  - Footfall prediction                                    │ │
│  │  - Merchant analysis                                     │ │
│  │  - Budget recommendations                                 │ │
│  │  - Timing optimization                                    │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    MongoDB (Events)                       │ │
│  │  - 2dsphere indexes for geo queries                       │ │
│  │  - Compound indexes for type/date                         │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm test -- --coverage
```

## Project Structure

```
event-graph-service/
├── src/
│   ├── index.ts              # Main entry point
│   ├── config/
│   │   ├── index.ts          # Configuration
│   │   ├── logger.ts         # Winston logger
│   │   └── database.ts       # MongoDB connection
│   ├── models/
│   │   ├── event.model.ts    # Event Mongoose model
│   │   └── index.ts
│   ├── services/
│   │   ├── event.service.ts  # Event business logic
│   │   ├── impact.service.ts # Impact analysis logic
│   │   └── index.ts
│   ├── routes/
│   │   ├── events.ts         # Event endpoints
│   │   ├── impact.ts        # Impact endpoints
│   │   └── index.ts
│   ├── middleware/
│   │   ├── auth.ts          # Authentication
│   │   ├── validation.ts    # Zod validation
│   │   ├── metrics.ts       # Prometheus metrics
│   │   ├── error.ts         # Error handling
│   │   └── index.ts
│   └── types/
│       └── index.ts         # TypeScript types & Zod schemas
├── tests/
│   ├── types.test.ts        # Type validation tests
│   └── event.service.test.ts # Service unit tests
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

## Metrics

The service exposes Prometheus metrics at `/metrics`:

| Metric | Type | Description |
|--------|------|-------------|
| `http_request_duration_seconds` | Histogram | Request duration |
| `http_requests_total` | Counter | Total requests |
| `events_total` | Counter | Events by type/status |
| `events_active` | Gauge | Active events |
| `event_footfall_prediction` | Gauge | Predicted footfall |
| `impact_analysis_duration_seconds` | Histogram | Impact analysis time |
| `merchant_reach_count` | Gauge | Merchant reach |

## License

MIT
