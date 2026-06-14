# Intent Prediction Engine

ML-powered intent analysis, audience segmentation, and prediction service for the AdBazaar Intent Exchange.

## Overview

The Intent Prediction Engine provides:
- **Intent Scoring**: ML-based confidence scoring for user intent
- **Dormancy Detection**: Identify inactive users for re-engagement
- **Audience Segmentation**: Create targetable audience segments
- **Lookalike Generation**: Find similar users based on seed segments
- **Timing Prediction**: Predict optimal contact times

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB
- Redis

### Installation

```bash
cd intent-prediction-engine
npm install
```

### Configuration

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Update the following variables:
- `PORT=4801`
- `MONGODB_URI=mongodb://localhost:27017/intent-prediction-engine`
- `REDIS_URL=redis://localhost:6379`
- `JWT_SECRET=your-secure-jwt-secret`
- `INTERNAL_SERVICE_KEY=your-internal-service-key`

### Running

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

### Health Check

```bash
curl http://localhost:4801/health
```

## API Endpoints

### Intent Scoring

#### POST /api/predict/intent-score
Get intent confidence score for a user/category.

```bash
curl -X POST http://localhost:4801/api/predict/intent-score \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "category": "DINING",
    "intentKey": "restaurant_search",
    "signals": {
      "searchQueries": ["italian restaurant"],
      "pageViews": 5,
      "dwellTime": 120,
      "clicks": 3,
      "conversions": 0,
      "engagementScore": 0.6
    }
  }'
```

#### POST /api/predict/batch-score
Batch score multiple intent signals.

```bash
curl -X POST http://localhost:4801/api/predict/batch-score \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "signals": [
      {
        "userId": "user-1",
        "category": "DINING",
        "intentKey": "restaurant_search",
        "signals": { "pageViews": 5, "clicks": 3 }
      },
      {
        "userId": "user-2",
        "category": "TRAVEL",
        "intentKey": "flight_search",
        "signals": { "pageViews": 10, "clicks": 5 }
      }
    ]
  }'
```

### Audience Segmentation

#### POST /api/predict/audience
Generate intent audience segment.

```bash
curl -X POST http://localhost:4801/api/predict/audience \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "category": "DINING",
    "minConfidence": 0.5,
    "maxDaysDormant": 30,
    "geoFilters": ["mumbai", "delhi"],
    "limit": 1000
  }'
```

#### GET /api/predict/segments
List available segments.

```bash
curl http://localhost:4801/api/predict/segments?category=DINING&status=active&page=1&limit=50 \
  -H "Authorization: Bearer <token>"
```

#### POST /api/predict/segments
Create a new segment.

```bash
curl -X POST http://localhost:4801/api/predict/segments \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "High-Intent Diners",
    "description": "Users with high dining intent",
    "category": "DINING",
    "criteria": {
      "minConfidence": 0.7,
      "maxDaysDormant": 14,
      "geoFilters": ["mumbai"]
    }
  }'
```

### Dormant Intent Detection

#### GET /api/predict/revival-candidates
Get dormant intents ready for revival.

```bash
curl "http://localhost:4801/api/predict/revival-candidates?minScore=0.5&maxDaysDormant=90&category=DINING&limit=100" \
  -H "Authorization: Bearer <token>"
```

#### GET /api/predict/statistics
Get dormancy detection statistics.

```bash
curl http://localhost:4801/api/predict/statistics \
  -H "Authorization: Bearer <token>"
```

### Lookalike Generation

#### POST /api/predict/lookalike
Generate lookalike audience.

```bash
curl -X POST http://localhost:4801/api/predict/lookalike \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceSegmentId": "segment-123",
    "targetSize": 1000,
    "similarityThreshold": 0.7
  }'
```

### Timing Prediction

#### GET /api/predict/timing/:userId
Predict optimal timing for user engagement.

```bash
curl "http://localhost:4801/api/predict/timing/user-123?category=DINING" \
  -H "Authorization: Bearer <token>"
```

## Authentication

### JWT Token
```bash
Authorization: Bearer <your-jwt-token>
```

### Internal Service Key
```bash
X-Internal-Service-Key: <your-internal-service-key>
```

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-06-06T12:00:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "timestamp": "2026-06-06T12:00:00.000Z"
}
```

## Metrics

Prometheus metrics available at `/metrics`.

Key metrics:
- `intent_prediction_http_request_duration_seconds` - Request latency
- `intent_prediction_scoring_total` - Total scoring requests
- `intent_prediction_dormant_intents` - Dormant intent counts
- `intent_prediction_segments_created_total` - Segments created

## ML Models

The service includes simulated ML models:

1. **intent-scorer**: Scores intent confidence (0-1)
2. **dormancy-detector**: Identifies intents inactive > threshold
3. **conversion-predictor**: Predicts conversion likelihood
4. **revival-scorer**: Scores re-engagement success
5. **timing-predictor**: Predicts optimal contact timing

## Categories

Supported intent categories:
- `DINING` - Restaurant, food delivery, reservations
- `TRAVEL` - Flights, hotels, packages
- `RETAIL` - Shopping, products
- `HEALTHCARE` - Medical, pharmacy
- `GENERAL` - General browsing

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Intent Prediction Engine                  │
├─────────────────────────────────────────────────────────────┤
│  Routes Layer (predictRoutes.ts)                            │
│  ├── Intent Scoring Routes                                  │
│  ├── Audience Segmentation Routes                           │
│  ├── Dormancy Detection Routes                              │
│  ├── Lookalike Generation Routes                            │
│  └── Timing Prediction Routes                               │
├─────────────────────────────────────────────────────────────┤
│  Services Layer                                              │
│  ├── IntentScoringService                                    │
│  ├── DormancyDetectionService                               │
│  ├── AudienceSegmentationService                            │
│  ├── LookalikeGenerationService                             │
│  └── TimingPredictionService                                │
├─────────────────────────────────────────────────────────────┤
│  Models Layer                                                │
│  ├── IntentSegment (MongoDB)                                │
│  └── DormantIntent (MongoDB)                                │
├─────────────────────────────────────────────────────────────┤
│  Config Layer                                                │
│  ├── Database (MongoDB)                                      │
│  ├── Redis (Caching)                                        │
│  └── Logger (Winston)                                       │
└─────────────────────────────────────────────────────────────┘
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 4801 | Service port |
| `MONGODB_URI` | mongodb://localhost:27017/intent-prediction-engine | MongoDB connection |
| `REDIS_URL` | redis://localhost:6379 | Redis connection |
| `JWT_SECRET` | - | JWT signing secret |
| `INTERNAL_SERVICE_KEY` | - | Internal service authentication |
| `ML_SERVICE_URL` | http://localhost:5000 | External ML service |
| `DORMANCY_THRESHOLD_DAYS` | 7 | Days before marking as dormant |
| `NODE_ENV` | development | Environment |
| `LOG_LEVEL` | info | Logging level |

## Health Checks

- `GET /health` - Full health check (DB + Redis)
- `GET /health/live` - Liveness probe
- `GET /health/ready` - Readiness probe

## License

Proprietary - AdBazaar