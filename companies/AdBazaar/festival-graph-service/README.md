# Festival Graph Service

**Port:** 4882  
**Company:** AdBazaar  
**Purpose:** Event intelligence for festivals and cultural events

## Overview

Festival Graph is an event intelligence platform that helps track festivals, cultural events, and their impact on advertising and nearby merchants. It provides comprehensive management of festivals, artists, schedules, and analytics with ad targeting capabilities.

## Features

- Festival registration and management
- Artist lineup management
- Schedule and event tracking
- Real-time analytics
- Ad targeting configuration
- Audience segmentation
- Economic impact estimation

## Quick Start

```bash
# Install dependencies
cd festival-graph-service
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Environment Variables

Create a `.env` file with:

```env
PORT=4882
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/festival-graph-service
LOG_LEVEL=info
METRICS_ENABLED=true
INTERNAL_SERVICE_TOKEN=festival-graph-internal-token
FESTIVAL_FORECAST_DAYS=90
MAX_IMPACT_RADIUS=50
```

## API Endpoints

### Health & Metrics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/metrics` | Prometheus metrics |

### Festival Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/festivals` | Register new festival |
| GET | `/api/festivals` | List festivals |
| GET | `/api/festivals/upcoming` | Get upcoming festivals |
| GET | `/api/festivals/:id` | Get festival by ID |
| PUT | `/api/festivals/:id` | Update festival |
| DELETE | `/api/festivals/:id` | Delete festival |

### Artist Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/festivals/:id/artists` | Add artist to festival |
| GET | `/api/festivals/:id/artists` | List artists |

### Schedule Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/festivals/:id/schedule` | Add schedule |
| GET | `/api/festivals/:id/schedule` | Get schedule |
| PUT | `/api/festivals/:id/schedule/:day` | Update schedule |

### Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/festivals/:id/analytics` | Get festival analytics |
| PUT | `/api/festivals/:id/analytics` | Update analytics |

### Ad Targeting

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/festivals/:id/targeting` | Get ad targeting config |
| GET | `/api/festivals/:id/audience` | Get audience segments |
| GET | `/api/festivals/:id/ad-slots` | Get optimal ad slots |

## Data Models

### Festival

```typescript
{
  name: string;
  description?: string;
  date: Date;
  endDate?: Date;
  venue: {
    name: string;
    address: string;
    city: string;
    state?: string;
    country: string;
    coordinates?: { latitude: number; longitude: number };
  };
  type: 'music' | 'food' | 'cultural' | 'religious' | 'sports' | 'arts' | 'film' | 'literary' | 'technology' | 'mixed';
  expectedAttendance: number;
  status: 'planning' | 'announced' | 'on_sale' | 'live' | 'completed' | 'cancelled';
  impactRadius: number;
  tags: string[];
}
```

### Artist

```typescript
{
  festivalId: string;
  name: string;
  stage?: string;
  genre: string[];
  popularity: number; // 0-100
  bio?: string;
  performanceTime?: { start: Date; end?: Date };
  fee?: number;
  verified: boolean;
}
```

### Schedule

```typescript
{
  festivalId: string;
  day: number;
  date: Date;
  events: [{
    id: string;
    name: string;
    artistId?: string;
    stage: string;
    startTime: Date;
    endTime?: Date;
    type: 'performance' | 'workshop' | 'panel' | 'competition' | 'meet_greet' | 'other';
    featured: boolean;
  }];
}
```

### FestivalAnalytics

```typescript
{
  festivalId: string;
  impressions: {
    total: number;
    byChannel: { dooh: number; mobile: number; social: number; web: number };
    byLocation: Record<string, number>;
  };
  ticketSales: {
    total: number;
    sold: number;
    available: number;
    revenue: number;
    conversionRate: number;
  };
  engagement: {
    avgSessionDuration: number;
    bounceRate: number;
    socialShares: number;
  };
  roi: {
    totalSpend: number;
    totalRevenue: number;
    returnOnAdSpend: number;
  };
}
```

## Authentication

Internal service authentication uses the `X-Internal-Token` header:

```bash
curl -H "X-Internal-Token: festival-graph-internal-token" \
  http://localhost:4882/api/festivals
```

In development mode, authentication is bypassed.

## Example Usage

### Create a Festival

```bash
curl -X POST http://localhost:4882/api/festivals \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: festival-graph-internal-token" \
  -d '{
    "name": "Mumbai Music Festival 2026",
    "date": "2026-12-15T10:00:00Z",
    "endDate": "2026-12-17T23:00:00Z",
    "venue": {
      "name": "Jio Garden",
      "address": "Bandra Kurla Complex",
      "city": "Mumbai",
      "state": "Maharashtra",
      "country": "India",
      "coordinates": { "latitude": 19.0596, "longitude": 72.8295 }
    },
    "type": "music",
    "expectedAttendance": 50000,
    "tags": ["electronic", "rock", "indie"],
    "impactRadius": 25
  }'
```

### Add Artist

```bash
curl -X POST http://localhost:4882/api/festivals/{id}/artists \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: festival-graph-internal-token" \
  -d '{
    "name": "A.R. Rahman",
    "stage": "Main Stage",
    "genre": ["world music", "orchestral", "film"],
    "popularity": 95,
    "bio": "Oscar-winning composer and musician",
    "performanceTime": {
      "start": "2026-12-16T20:00:00Z",
      "end": "2026-12-16T22:00:00Z"
    }
  }'
```

### Get Ad Targeting

```bash
curl http://localhost:4882/api/festivals/{id}/targeting \
  -H "X-Internal-Token: festival-graph-internal-token"
```

## Metrics

Prometheus metrics available at `/metrics`:

- `festival_graph_http_requests_total` - Total HTTP requests
- `festival_graph_http_request_duration_seconds` - Request latency
- `festival_graph_festivals_total` - Total festivals by status/type
- `festival_graph_artists_total` - Total artists
- `festival_graph_impressions_total` - Ad impressions by festival/channel
- `festival_graph_ticket_sales_total` - Ticket sales
- `festival_graph_revenue_total` - Total revenue

## Architecture

```
festival-graph-service/
├── src/
│   ├── index.ts              # Express server entry point
│   ├── config/
│   │   ├── environment.ts    # Environment configuration
│   │   ├── database.ts       # MongoDB connection
│   │   └── logger.ts         # Winston logger
│   ├── models/
│   │   ├── Festival.ts       # Festival Mongoose schema
│   │   ├── Artist.ts         # Artist Mongoose schema
│   │   ├── Schedule.ts       # Schedule Mongoose schema
│   │   └── FestivalAnalytics.ts # Analytics schema
│   ├── services/
│   │   ├── festivalService.ts   # Festival business logic
│   │   ├── artistService.ts     # Artist business logic
│   │   ├── scheduleService.ts   # Schedule business logic
│   │   ├── analyticsService.ts  # Analytics business logic
│   │   ├── targetingService.ts  # Ad targeting logic
│   │   └── schemas.ts           # Zod validation schemas
│   ├── routes/
│   │   └── festivalRoutes.ts    # API route handlers
│   ├── middleware/
│   │   └── auth.ts              # Internal service auth
│   └── utils/
│       └── metrics.ts           # Prometheus metrics
├── package.json
├── tsconfig.json
└── README.md
```

## Ecosystem Integration

Festival Graph integrates with:

- **REZ-Auth** - Internal service authentication
- **AdBazaar DOOH** - Digital out-of-home ad placement
- **Place Graph Index** - Merchant location intelligence
- **Event Graph Service** - Cross-event intelligence

## License

Internal - AdBazaar