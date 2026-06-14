# Audience Twin Service

**Port:** 4805

The Audience Twin Service derives audience twins from HOJAI's twin platform (port 4860) specifically for advertising use cases in the AdBazaar ecosystem.

## Overview

This service creates, manages, and analyzes audience twins - aggregated user profiles derived from HOJAI's digital twin platform. Audience twins enable:

- **Behavioral Prediction:** Predict purchase, click, convert, and churn behaviors
- **Segment Assignment:** Auto-assign audience twins to meaningful segments
- **Quality Scoring:** Rate audience twin data quality (0-10)
- **Channel Optimization:** Recommend optimal communication channels and timing

## Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** MongoDB (Mongoose ODM)
- **Cache:** Redis
- **Validation:** Zod
- **Auth:** JWT
- **Monitoring:** Prometheus metrics

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev

# Run tests
npm test
```

## API Endpoints

### Health & Metrics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Service health check |
| GET | `/health/live` | Liveness probe |
| GET | `/health/ready` | Readiness probe |
| GET | `/metrics` | Prometheus metrics |

### Audience Twin Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/audience/create` | Create audience twin from criteria |
| GET | `/api/audience` | List all audience twins |
| GET | `/api/audience/:id` | Get audience twin by ID |
| POST | `/api/audience/:id/predict` | Predict behavior |
| GET | `/api/audience/:id/segments` | Get segment assignments |
| POST | `/api/audience/:id/refresh` | Refresh twin with latest data |
| DELETE | `/api/audience/:id` | Delete audience twin |

## API Reference

### Create Audience Twin

```bash
POST /api/audience/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "High-Value Electronics Shoppers",
  "description": "Users interested in electronics with high purchase intent",
  "category": "electronics",
  "criteria": {
    "interests": ["electronics", "gadgets", "smartphones"],
    "ageRange": { "min": 18, "max": 45 },
    "location": "Mumbai",
    "purchaseHistory": {
      "minOrders": 3,
      "minValue": 5000
    },
    "engagementLevel": "high",
    "brandAffinities": {
      "Apple": 0.8,
      "Samsung": 0.7
    }
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "twinId": "550e8400-e29b-41d4-a716-446655440000",
    "name": "High-Value Electronics Shoppers",
    "description": "Users interested in electronics...",
    "category": "electronics",
    "size": 1523,
    "memberUserIds": ["user-1", "user-2", ...],
    "attributes": {
      "interests": ["electronics", "gadgets", "smartphones", ...],
      "intentLikelihood": 0.82,
      "channelPreference": "whatsapp",
      "timingPreference": "10:00-14:00",
      "lifetimeValue": 12500,
      "brandAffinities": {
        "Apple": 0.8,
        "Samsung": 0.7
      }
    },
    "behavioralModel": {
      "avgSessionDuration": 480,
      "avgPurchaseFrequency": 6.5,
      "avgOrderValue": 1850,
      "preferredCategories": ["electronics", "accessories"],
      "churnRisk": 0.15
    },
    "qualityScore": 8.5,
    "createdAt": "2026-06-06T10:00:00Z",
    "updatedAt": "2026-06-06T10:00:00Z"
  },
  "message": "Audience twin created successfully"
}
```

### Predict Behavior

```bash
POST /api/audience/:id/predict
Authorization: Bearer <token>
Content-Type: application/json

{
  "action": "purchase",
  "context": {
    "campaignId": "camp-123",
    "productId": "prod-456",
    "offerType": "discount"
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "action": "purchase",
    "probability": 0.75,
    "confidence": 0.85,
    "factors": [
      { "factor": "intent_likelihood", "impact": 0.82 },
      { "factor": "lifetime_value", "impact": 0.65 },
      { "factor": "churn_risk", "impact": -0.08 }
    ],
    "recommendedChannel": "whatsapp",
    "recommendedTiming": "10:00-14:00"
  }
}
```

### Get Segments

```bash
GET /api/audience/:id/segments
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "segmentId": "seg-high-value",
      "segmentName": "High Value Customers",
      "confidence": 0.9,
      "assignedAt": "2026-06-06T10:00:00Z"
    },
    {
      "segmentId": "seg-electronics",
      "segmentName": "Electronics Enthusiasts",
      "confidence": 0.85,
      "assignedAt": "2026-06-06T10:00:00Z"
    }
  ]
}
```

### Refresh Audience Twin

```bash
POST /api/audience/:id/refresh
Authorization: Bearer <token>
```

Refreshes the audience twin with the latest data from HOJAI twin platform.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 4805 | Service port |
| `NODE_ENV` | development | Environment mode |
| `MONGODB_URI` | mongodb://localhost:27017/audience-twin | MongoDB connection URI |
| `REDIS_URL` | redis://localhost:6379 | Redis connection URL |
| `JWT_SECRET` | - | JWT signing secret |
| `HOJAI_TWIN_URL` | http://localhost:4860 | HOJAI twin platform URL |
| `HOJAI_TWIN_API_KEY` | - | HOJAI API key |
| `LOG_LEVEL` | info | Logging level |

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUDIENCE TWIN SERVICE                        │
│                         (Port 4805)                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  Express   │  │   JWT Auth  │  │   Zod       │             │
│  │  Routes    │  │   Middleware│  │  Validation │             │
│  └──────┬─────┘  └─────────────┘  └─────────────┘             │
│         │                                                       │
│  ┌──────┴──────────────────────────────────────────────────┐   │
│  │                   Audience Twin Service                  │   │
│  │  - Create audience twins from criteria                   │   │
│  │  - Predict behaviors                                     │   │
│  │  - Assign segments                                       │   │
│  │  - Calculate quality scores                             │   │
│  └────────────────────────┬────────────────────────────────┘   │
│                           │                                     │
│  ┌────────────────────────┴────────────────────────────────┐   │
│  │              HOJAI Twin Service Integration              │   │
│  │  - Search users by criteria (Port 4860)                   │   │
│  │  - Get audience insights                                  │   │
│  │  - Fetch user twins                                       │   │
│  └────────────────────────┬────────────────────────────────┘   │
│                           │                                     │
└───────────────────────────┼─────────────────────────────────────┘
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
          ▼                 ▼                 ▼
    ┌──────────┐     ┌──────────┐     ┌──────────┐
    │ MongoDB  │     │  Redis   │     │ HOJAI    │
    │          │     │  Cache   │     │ Twin     │
    │          │     │          │     │ (4860)   │
    └──────────┘     └──────────┘     └──────────┘
```

## Data Model

### AudienceTwin

| Field | Type | Description |
|-------|------|-------------|
| `twinId` | UUID | Unique identifier |
| `name` | string | Human-readable name |
| `description` | string | Optional description |
| `category` | string | Audience category |
| `size` | number | Number of members |
| `memberUserIds` | string[] | User IDs in this audience |
| `attributes` | AudienceAttributes | Advertising attributes |
| `behavioralModel` | BehavioralModel | Behavioral patterns |
| `qualityScore` | number | Data quality (0-10) |
| `segments` | SegmentAssignment[] | Auto-assigned segments |
| `ownerId` | string | Creator's user ID |

### AudienceAttributes

| Field | Type | Description |
|-------|------|-------------|
| `interests` | string[] | Top 10 category interests |
| `intentLikelihood` | number | Purchase probability (0-1) |
| `channelPreference` | enum | whatsapp, email, push, sms |
| `timingPreference` | string | Best contact time |
| `lifetimeValue` | number | Average LTV |
| `brandAffinities` | Record | Brand preference scores |

### BehavioralModel

| Field | Type | Description |
|-------|------|-------------|
| `avgSessionDuration` | number | Seconds per session |
| `avgPurchaseFrequency` | number | Purchases per period |
| `avgOrderValue` | number | Average order value |
| `preferredCategories` | string[] | Top categories |
| `churnRisk` | number | Churn probability (0-1) |

## Metrics

Prometheus metrics exposed at `/metrics`:

- `http_request_duration_seconds` - Request latency histogram
- `http_requests_total` - Total request counter
- `audience_twin_created_total` - Twins created counter
- `audience_twin_size` - Current twin sizes gauge
- `prediction_requests_total` - Prediction requests counter
- `hojai_twin_request_duration_seconds` - HOJAI API latency

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| General API | 100 requests / 15 min |
| Create Audience | 20 requests / hour |
| Prediction | 50 requests / minute |

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm test -- --coverage
```

## License

MIT