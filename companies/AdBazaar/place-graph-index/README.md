# Place Graph Index Service

**Port:** 4816

A comprehensive POI (Point of Interest) database service that enables advertising around locations - malls, airports, hospitals, hotels, schools, and more.

## Overview

The Place Graph Index service provides a centralized database of points of interest with detailed audience profiling, geographic search capabilities, and advertising availability information. It's designed to support location-based advertising decisions across the AdBazaar ecosystem.

## Features

- **Comprehensive POI Database** - Store and manage locations across10 categories (mall, airport, hospital, hotel, school, office, restaurant, retail, event_venue, transit)
- **Audience Profiling** - Detailed demographic and visitor pattern data for each location
- **Geographic Search** - Find nearby places using geospatial queries
- **Advertising Availability** - Track available ad formats, pricing (CPM), and targeting options
- **Audience Estimation** - Calculate estimated daily/monthly reach for locations
- **Caching** - Redis-based caching for high performance
- **Metrics** - Prometheus metrics for monitoring
- **JWT Authentication** - Secure API access

## Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose
- **Cache:** Redis (ioredis)
- **Validation:** Zod
- **Auth:** JWT
- **Metrics:** Prometheus (prom-client)
- **Language:** TypeScript

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB 6.0+
- Redis 7.0+

### Installation

```bash
cd AdBazaar/place-graph-index
npm install
```

### Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Update the `.env` file with your configuration:

```env
PORT=4816
MONGODB_URI=mongodb://localhost:27017/place-graph-index
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-jwt-secret
```

### Running

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm run build
npm start
```

## API Endpoints

### Places

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/places` | Create a new place | Required |
| GET | `/api/places` | List places with filters | No |
| GET | `/api/places/search` | Search places by query | No |
| GET | `/api/places/nearby` | Find nearby places | No |
| GET | `/api/places/:id` | Get place details | No |
| PUT | `/api/places/:id` | Update place | Required |
| DELETE | `/api/places/:id` | Delete place | Required |
| GET | `/api/places/:id/audience` | Get audience estimate | No |
| GET | `/api/places/info/stats` | Get statistics | No |
| GET | `/api/places/info/categories` | List categories | No |

### Health & Metrics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/ready` | Readiness check |
| GET | `/metrics` | Prometheus metrics |

## API Examples

### Create a Place

```bash
curl -X POST http://localhost:4816/api/places \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "Phoenix Mall",
    "type": "mall",
    "category": "Shopping Center",
    "address": {
      "street": "142, Outer Ring Road",
      "area": "Marathahalli",
      "city": "Bangalore",
      "state": "Karnataka",
      "pincode": "560037",
      "country": "India"
    },
    "location": {
      "lat": 12.9352,
      "lng": 77.7015
    },
    "attributes": {
      "size": "large",
      "ratings": 4.5,
      "visitorCount": 15000
    },
    "audienceProfile": {
      "demographics": {
        "ageGroups": {
          "18-24": 30,
          "25-34": 35,
          "35-44": 20,
          "45+": 15
        },
        "genderSplit": {
          "male": 45,
          "female": 55
        },
        "incomeLevel": "upper-middle"
      },
      "visitorPatterns": {
        "peakHours": ["10:00-12:00", "14:00-16:00", "18:00-20:00"],
        "busyDays": ["Saturday", "Sunday"],
        "seasonalTrends": ["festival", "holiday"]
      },
      "commonPurposes": ["shopping", "dining", "entertainment"]
    },
    "advertising": {
      "availableFormats": ["banner", "video", "kiosk", "qr"],
      "pricing": {
        "cpm": 150,
        "minBudget": 10000
      },
      "targetingOptions": ["age", "gender", "income", "time"]
    }
  }'
```

### Search Places

```bash
curl "http://localhost:4816/api/places/search?q=mall&city=Bangalore&limit=10"
```

### Find Nearby Places

```bash
curl "http://localhost:4816/api/places/nearby?lat=12.9352&lng=77.7015&radius=5000&type=mall"
```

### Get Audience Estimate

```bash
curl "http://localhost:4816/api/places/place_abc123/audience"
```

## Place Types

| Type | Description |
|------|-------------|
| `mall` | Shopping malls and centers |
| `airport` | Airports and terminals |
| `hospital` | Hospitals and medical facilities |
| `hotel` | Hotels and resorts |
| `school` | Schools and educational institutions |
| `office` | Office buildings and complexes |
| `restaurant` | Restaurants and cafes |
| `retail` | Retail stores and shops |
| `event_venue` | Event venues and stadiums |
| `transit` | Transit hubs and stations |

## Response Format

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message",
  "message": "Additional details"
}
```

### Paginated Response

```json
{
  "success": true,
  "data": {
    "data": [ ... ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

## Integration

### With BuzzLocal (Apartments/Societies)

The service can integrate with BuzzLocal to track POIs in residential areas:

```typescript
// Example: Link a mall to nearby residential societies
await placeService.addNearbyPlace('place_mall_001', 'place_society_001');
```

### With Airzy (Airports/Hotels)

```typescript
// Example: Link an airport to nearby hotels
await placeService.addNearbyPlace('place_airport_001', 'place_hotel_001');
```

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Metrics

The service exposes Prometheus metrics at `/metrics`:

- `place_graph_http_requests_total` - Total HTTP requests
- `place_graph_http_request_duration_seconds` - Request duration
- `place_graph_active_connections` - Active connections
- `place_graph_places_total` - Total places by type/status
- `place_graph_cache_operations_total` - Cache operations
- `place_graph_search_queries_total` - Search queries
- `place_graph_audience_estimates_total` - Audience estimates

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 4816 |
| `NODE_ENV` | Environment | development |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/place-graph-index |
| `REDIS_URL` | Redis connection string | redis://localhost:6379 |
| `JWT_SECRET` | JWT signing secret | - |
| `CORS_ORIGINS` | Allowed CORS origins | * |
| `METRICS_ENABLED` | Enable Prometheus metrics | true |

## License

MIT

## Author

AdBazaar
