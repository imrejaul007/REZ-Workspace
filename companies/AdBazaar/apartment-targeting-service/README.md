# Apartment Targeting Service

**Port:** 4815

Hyperlocal targeting service for apartment/community-level advertising. This enables advertisers to target users at specific apartment complexes, gated communities, and standalone buildings - a capability no other ad platform provides.

## Features

- **Apartment Registration:** Register and manage apartment complexes with full demographics
- **Demographics Profiling:** Track flats, residents, income levels, and family sizes
- **Resident Estimation:** Calculate estimated residents and targetable devices
- **Interest-Based Targeting:** Target users by interests and demographics
- **Income-Level Targeting:** Focus on specific income brackets
- **Nearby POI Targeting:** Leverage nearby points of interest for context
- **BuzzLocal Integration:** Sync apartments from BuzzLocal (AXOM)
- **Geo-Targeting:** Find nearby apartments using Haversine distance calculation

## Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** MongoDB (Mongoose)
- **Cache:** Redis
- **Validation:** Zod
- **Auth:** JWT
- **Metrics:** Prometheus

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB 6+
- Redis 7+

### Installation

```bash
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/AdBazaar/apartment-targeting-service

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start MongoDB and Redis (if not running)
# Then start the service

# Development mode
npm run dev

# Or build and run production
npm run build
npm start
```

### Health Check

```bash
curl http://localhost:4815/health
```

## API Endpoints

### Apartments

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/apartments` | Register apartment | Admin/Advertiser |
| GET | `/api/apartments` | List apartments | All |
| GET | `/api/apartments/nearby` | Find nearby apartments | All |
| GET | `/api/apartments/:id` | Get apartment details | All |
| PUT | `/api/apartments/:id` | Update apartment | Admin/Advertiser |
| DELETE | `/api/apartments/:id` | Delete apartment | Admin |
| GET | `/api/apartments/:id/residents` | Get resident stats | All |

### Targeting

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/apartments/:id/target` | Create targeting config | Admin/Advertiser |
| GET | `/api/apartments/:id/target` | Get targeting config | All |
| GET | `/api/apartments/:id/reach` | Get estimated reach | All |
| GET | `/api/targeting/match` | Find matching apartments | All |
| POST | `/api/targeting/check-match` | Check user match | All |
| POST | `/api/targeting/sync/buzzlocal` | Sync from BuzzLocal | Admin |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/ready` | Readiness probe |
| GET | `/live` | Liveness probe |
| GET | `/metrics` | Prometheus metrics |

## API Examples

### Register Apartment

```bash
curl -X POST http://localhost:4815/api/apartments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "Sunrise Heights",
    "type": "gated_community",
    "address": {
      "street": "MG Road",
      "area": "Koramangala",
      "city": "Bangalore",
      "state": "Karnataka",
      "pincode": "560034",
      "country": "India"
    },
    "location": {
      "lat": 12.9352,
      "lng": 77.6245
    },
    "demographics": {
      "totalFlats": 500,
      "occupiedFlats": 450,
      "avgFamilySize": 4,
      "incomeLevel": "upper_middle"
    },
    "amenities": ["gym", "pool", "clubhouse"],
    "nearbyPOIs": ["Metro Station", "Shopping Mall"]
  }'
```

### Create Targeting Config

```bash
curl -X POST http://localhost:4815/api/apartments/APT-XXXXXX/target \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "enabled": true,
    "minAge": 25,
    "maxAge": 45,
    "interests": ["tech", "finance", "fitness"],
    "incomeBrackets": ["upper_middle", "high"],
    "targetDevices": 500
  }'
```

### Find Nearby Apartments

```bash
curl "http://localhost:4815/api/apartments/nearby?lat=12.9352&lng=77.6245&radius=5000&limit=10" \
  -H "Authorization: Bearer <token>"
```

## Apartment Schema

```typescript
interface Apartment {
  apartmentId: string;          // APT-XXXXXXXX
  name: string;
  type: 'apartment' | 'gated_community' | 'standalone';
  address: {
    street: string;
    area: string;
    city: string;
    state: string;
    pincode: string;           // 6 digits
    country: string;
  };
  location: {
    lat: number;               // -90 to 90
    lng: number;               // -180 to 180
  };
  demographics: {
    totalFlats: number;
    occupiedFlats: number;
    avgFamilySize: number;
    estimatedResidents: number;
    incomeLevel: 'low' | 'middle' | 'upper_middle' | 'high';
  };
  amenities: string[];
  nearbyPOIs: string[];
  targeting: {
    enabled: boolean;
    minAge?: number;
    maxAge?: number;
    interests?: string[];
    incomeBrackets?: string[];
  };
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}
```

## Authentication

All API endpoints (except health/metrics) require JWT authentication.

```bash
Authorization: Bearer <jwt-token>
```

JWT Payload:
```json
{
  "userId": "user-123",
  "email": "user@example.com",
  "role": "admin" | "advertiser" | "viewer"
}
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 4815 | Service port |
| NODE_ENV | development | Environment |
| MONGODB_URI | mongodb://localhost:27017/apartment-targeting | MongoDB connection |
| REDIS_URL | redis://localhost:6379 | Redis connection |
| JWT_SECRET | - | JWT signing secret |
| BUZZLOCAL_URL | http://localhost:3000 | BuzzLocal API URL |
| BUZZLOCAL_SYNC_ENABLED | false | Enable BuzzLocal sync |
| METRICS_ENABLED | true | Enable Prometheus metrics |

## Prometheus Metrics

Available at `/metrics`:

- `http_requests_total` - Total HTTP requests
- `http_request_duration_seconds` - Request duration histogram
- `apartments_total` - Total apartments
- `apartments_active` - Active apartments
- `total_residents` - Total estimated residents
- `targeting_configs_active` - Active targeting configs
- `cache_hits_total` - Cache hits
- `cache_misses_total` - Cache misses

## Project Structure

```
apartment-targeting-service/
├── src/
│   ├── config/
│   │   └── index.ts           # Configuration
│   ├── models/
│   │   ├── apartment.model.ts # Apartment MongoDB model
│   │   └── targeting-config.model.ts
│   ├── services/
│   │   ├── apartment.service.ts  # Apartment business logic
│   │   ├── targeting.service.ts  # Targeting business logic
│   │   └── redis.service.ts      # Redis cache service
│   ├── routes/
│   │   ├── apartment.routes.ts   # Apartment endpoints
│   │   ├── targeting.routes.ts   # Targeting endpoints
│   │   └── health.routes.ts      # Health checks
│   ├── middleware/
│   │   ├── auth.middleware.ts    # JWT authentication
│   │   ├── metrics.middleware.ts # Prometheus metrics
│   │   ├── validation.middleware.ts
│   │   └── error.middleware.ts
│   ├── types/
│   │   └── index.ts              # TypeScript types & Zod schemas
│   └── index.ts                  # Main entry point
├── tests/
│   └── *.test.ts                 # Unit tests
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm test -- --coverage
```

## BuzzLocal Integration

The service can sync apartments from the BuzzLocal (AXOM) platform:

1. Enable `BUZZLOCAL_SYNC_ENABLED=true` in environment
2. Set `BUZZLOCAL_URL` to your BuzzLocal instance
3. Call `POST /api/targeting/sync/buzzlocal` to trigger sync

## License

Internal - AdBazaar