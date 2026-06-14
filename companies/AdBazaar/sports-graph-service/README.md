# Sports Graph Service

**AdBazaar Sports Graph - Event intelligence for sports events**

**Port:** 4883

## Overview

Sports Graph Service is AdBazaar's centralized intelligence platform for sports events. It tracks sports events, teams, players, and provides analytics and targeting data for ad campaigns.

## Features

- **Event Management:** Register, update, and track sports events across multiple sports
- **Team Management:** Add and manage teams with rankings and fan statistics
- **Player Management:** Track player information and statistics
- **Sports Analytics:** Real-time analytics, footfall predictions, and performance metrics
- **Ad Targeting:** Location-based targeting, audience segmentation, and campaign recommendations

## Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js with TypeScript
- **Database:** MongoDB with Mongoose
- **Caching:** Redis (optional)
- **Logging:** Winston with structured JSON
- **Metrics:** Prometheus client (prom-client)
- **Validation:** Zod

## Installation

```bash
# Install dependencies
npm install

# Development
npm run dev

# Build
npm run build

# Production
npm start
```

## Environment Variables

```env
# Server
PORT=4883
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/sports-graph-service
MONGODB_HOST=localhost
MONGODB_PORT=27017
MONGODB_DATABASE=sports-graph-service

# Redis (optional)
REDIS_HOST=localhost
REDIS_PORT=6379

# Authentication
INTERNAL_SERVICE_TOKEN=sports-graph-internal-token
API_KEY=your-api-key

# Logging
LOG_LEVEL=info
```

## API Endpoints

### Health & Metrics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Service health check |
| GET | `/metrics` | Prometheus metrics |

### Sports Events

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sports` | Register new sports event |
| GET | `/api/sports` | List events with filters |
| GET | `/api/sports/:id` | Get event by ID |
| PUT | `/api/sports/:id` | Update event |
| DELETE | `/api/sports/:id` | Delete event |
| GET | `/api/sports/live` | Get live events |
| GET | `/api/sports/upcoming` | Get upcoming events |

### Teams

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sports/:id/teams` | Add team to event |
| GET | `/api/sports/:id/teams` | List teams for event |

### Players

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sports/:id/players` | Add player(s) to event |
| GET | `/api/sports/:id/players` | List players for event |

### Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sports/:id/analytics` | Get event analytics |
| GET | `/api/sports/:id/analytics?type=footfall` | Get footfall prediction |
| GET | `/api/sports/:id/analytics?type=performance` | Get event performance |
| GET | `/api/analytics/footfall/:eventId` | Get footfall prediction |
| GET | `/api/analytics/performance/:eventId` | Get event performance |
| GET | `/api/analytics/top-performers` | Get top performing events |
| GET | `/api/analytics/audience-segments/:eventId` | Get audience segments |

### Targeting

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sports/:id/targeting` | Get ad targeting data |
| GET | `/api/sports/:id/targeting?category=restaurant` | Get campaign recommendation |
| GET | `/api/analytics/nearby-merchants/:eventId` | Get nearby merchants |

## Request/Response Examples

### Create Sports Event

```bash
curl -X POST http://localhost:4883/api/sports \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: sports-graph-internal-token" \
  -d '{
    "name": "IPL Final 2026",
    "sport": "cricket",
    "tournament": "IPL 2026",
    "startDate": "2026-05-29T19:30:00Z",
    "venue": {
      "name": "Wankhede Stadium",
      "address": "G Block, Near Srichand",
      "city": "Mumbai",
      "state": "Maharashtra",
      "latitude": 19.076,
      "longitude": 72.8777,
      "capacity": 33000,
      "type": "stadium",
      "amenities": ["parking", "food_court", "vip_lounge"]
    },
    "teams": [
      {"name": "Mumbai Indians", "homeCity": "Mumbai"},
      {"name": "Chennai Super Kings", "homeCity": "Chennai"}
    ],
    "expectedFootfall": 30000,
    "broadcastChannels": ["Star Sports", "Hotstar"]
  }'
```

### Response

```json
{
  "success": true,
  "data": {
    "_id": "65f...",
    "name": "IPL Final 2026",
    "sport": "cricket",
    "status": "scheduled",
    "venue": {...},
    "teams": [...],
    "createdAt": "2026-03-07T12:00:00Z"
  },
  "message": "Sports event created successfully"
}
```

### Get Footfall Prediction

```bash
curl http://localhost:4883/api/sports/:id/analytics?type=footfall \
  -H "X-Internal-Token: sports-graph-internal-token"
```

### Response

```json
{
  "success": true,
  "data": {
    "eventId": "65f...",
    "predictedCrowd": 28050,
    "confidence": 0.75,
    "peakHours": [
      {"hour": 17, "expectedCount": 8415},
      {"hour": 18, "expectedCount": 16830},
      {"hour": 19, "expectedCount": 23842},
      {"hour": 20, "expectedCount": 25245},
      {"hour": 21, "expectedCount": 19635}
    ],
    "nearbyMerchantImpact": {
      "restaurants": {"expectedIncrease": 40, "peakHours": [18, 19, 20]},
      "bars": {"expectedIncrease": 60, "peakHours": [18, 19, 20, 21]},
      "hotels": {"expectedIncrease": 25, "peakHours": [17, 18]},
      "retail": {"expectedIncrease": 30, "peakHours": [18, 21, 22]}
    },
    "calculatedAt": "2026-03-07T12:00:00Z"
  }
}
```

## Authentication

Internal services authenticate using the `X-Internal-Token` header:

```bash
curl -H "X-Internal-Token: sports-graph-internal-token" ...
```

Public endpoints (live/upcoming events) don't require authentication.

## Data Models

### SportsEvent

| Field | Type | Description |
|-------|------|-------------|
| name | string | Event name |
| sport | enum | Sport type (cricket, football, etc.) |
| tournament | string | Tournament name |
| startDate | DateTime | Event start time |
| endDate | DateTime | Event end time |
| status | enum | Event status |
| venue | object | Venue details |
| teams | array | Participating teams |
| expectedFootfall | number | Expected attendance |
| broadcastChannels | array | TV/streaming channels |

### Team

| Field | Type | Description |
|-------|------|-------------|
| eventId | ObjectId | Reference to event |
| name | string | Team name |
| logo | string | Team logo URL |
| fans | number | Fan count |
| ranking | number | Team ranking |
| stats | object | Wins/losses/draws |

### Player

| Field | Type | Description |
|-------|------|-------------|
| eventId | ObjectId | Reference to event |
| teamId | ObjectId | Reference to team |
| name | string | Player name |
| position | string | Player position |
| jerseyNumber | number | Jersey number |
| stats | object | Match statistics |

### SportsAnalytics

| Field | Type | Description |
|-------|------|-------------|
| eventId | ObjectId | Reference to event |
| impressions | number | Ad impressions |
| ticketSales | number | Tickets sold |
| viewership | number | Total viewership |
| engagement | object | Social/streaming/TV engagement |
| demographics | object | Audience demographics |
| peakMoments | array | High-engagement moments |

## Prometheus Metrics

| Metric | Type | Description |
|--------|------|-------------|
| sports_graph_http_request_duration_seconds | Histogram | HTTP request duration |
| sports_graph_http_requests_total | Counter | Total HTTP requests |
| sports_graph_events_tracked_total | Counter | Total events tracked |
| sports_graph_active_events | Gauge | Active events count |
| sports_graph_footfall_predictions_total | Counter | Footfall predictions |
| sports_graph_campaign_recommendations_total | Counter | Campaign recommendations |
| sports_graph_db_query_duration_seconds | Histogram | Database query duration |

## Error Handling

All errors return JSON with:

```json
{
  "success": false,
  "error": "Error message",
  "details": [...] // Zod validation errors
}
```

## Related Services

- **Event Graph Service:** Event relationship tracking
- **Footfall Service:** Foot traffic prediction
- **Campaign Recommendation Service:** Ad campaign optimization

## License

Internal - AdBazaar