# Conversion Optimization AI Service

**Port:** 4820

AI-powered conversion optimization engine that maximizes campaign ROI through intelligent bid optimization and audience targeting.

## Features

- **Real-time Bid Optimization** - AI-powered bid recommendations based on historical performance
- **Audience Performance Analysis** - Deep analysis of audience segments and their conversion potential
- **Budget Reallocation** - Intelligent budget distribution across placements
- **Conversion Prediction** - ML-based conversion forecasting
- **A/B Testing Recommendations** - Data-driven testing suggestions
- **Competitor Analysis** - Market intelligence and competitive positioning
- **Time-of-Day Optimization** - Peak performance identification

## Tech Stack

- **Runtime:** Node.js + TypeScript
- **Framework:** Express.js
- **Database:** MongoDB + Mongoose
- **Cache:** Redis + IORedis
- **Validation:** Zod
- **Auth:** JWT
- **Metrics:** Prometheus (prom-client)
- **Testing:** Jest

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

# Build for production
npm run build

# Start production
npm start
```

## API Endpoints

### Campaign Optimization

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/optimize/campaign` | Start campaign optimization |
| GET | `/api/optimize/campaign/:id` | Get optimization status |
| PUT | `/api/optimize/campaign/:id/pause` | Pause optimization |
| PUT | `/api/optimize/campaign/:id/resume` | Resume optimization |
| GET | `/api/optimize/campaign/:id/insights` | Get optimization insights |

### Bid Recommendations

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/optimize/bid` | Get AI-optimized bid recommendation |
| GET | `/api/optimize/campaign/:id/recommendations` | Get optimization recommendations |

### Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/optimize/recommendations` | Get overall recommendations |
| GET | `/api/optimize/campaign/:id/audience` | Get audience analysis |
| GET | `/api/optimize/campaign/:id/timeslots` | Get time-of-day data |
| GET | `/api/optimize/campaign/:id/competitors` | Get competitor insights |

### Health & Monitoring

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Service health check |
| GET | `/ready` | Readiness check |
| GET | `/metrics` | Prometheus metrics |

## API Documentation

Access API documentation at `GET /api`.

## Authentication

All API endpoints (except health checks) require JWT authentication.

```
Authorization: Bearer <token>
```

JWT payload should include:
```json
{
  "userId": "user-123",
  "advertiserId": "advertiser-456",
  "role": "advertiser"
}
```

## Request/Response Examples

### Start Campaign Optimization

```bash
curl -X POST http://localhost:4820/api/optimize/campaign \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "campaignId": "camp-123",
    "goals": {
      "targetCPA": 50,
      "targetROAS": 4.0
    },
    "maxBid": 5.00
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "optimizationId": "opt-12345678",
    "campaignId": "camp-123",
    "status": "active",
    "goals": {
      "targetCPA": 50,
      "targetROAS": 4.0
    },
    "startedAt": "2026-06-06T10:00:00.000Z"
  }
}
```

### Get Bid Recommendation

```bash
curl -X POST http://localhost:4820/api/optimize/bid \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "campaignId": "camp-123",
    "placementId": "placement-1",
    "currentBid": 1.50,
    "targetCPA": 50
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "placementId": "placement-1",
    "recommendedBid": 1.75,
    "maxBid": 2.28,
    "expectedCPC": 1.49,
    "expectedCTR": 0.029,
    "expectedConversions": 10,
    "confidence": 0.85,
    "reasoning": "Strong historical CTR and high audience overlap"
  }
}
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 4820 | Service port |
| MONGODB_URI | mongodb://localhost:27017/conversion-optimization-ai | MongoDB connection string |
| REDIS_URL | redis://localhost:6379 | Redis connection string |
| JWT_SECRET | your-jwt-secret | JWT signing secret |
| REZ_ADS_SERVICE_URL | http://localhost:4007 | REZ Ads service URL |
| ALLOWED_ORIGINS | https://rez.money,... | CORS allowed origins |
| METRICS_ENABLED | true | Enable Prometheus metrics |

## Metrics

Prometheus metrics available at `/metrics`:

- `http_requests_total` - Total HTTP requests
- `http_request_duration_seconds` - Request duration histogram
- `optimization_active_count` - Active optimizations
- `bid_recommendations_total` - Bid recommendations generated
- `bid_adjustments_total` - Bid adjustments made
- `recommendations_generated_total` - Recommendations generated
- `ai_processing_duration_seconds` - AI processing time
- `cache_hits_total` / `cache_misses_total` - Cache performance

## Project Structure

```
conversion-optimization-ai/
├── src/
│   ├── config/
│   │   └── env.ts           # Environment configuration
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── validation.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── index.ts
│   ├── models/
│   │   ├── optimization.model.ts
│   │   ├── bid-recommendation.model.ts
│   │   └── index.ts
│   ├── routes/
│   │   ├── optimize.routes.ts
│   │   └── index.ts
│   ├── services/
│   │   ├── optimization.service.ts
│   │   ├── redis.service.ts
│   │   └── index.ts
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   ├── logger.ts
│   │   └── metrics.ts
│   └── index.ts             # Entry point
├── tests/
│   └── optimization.test.ts
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## License

Internal - REZ Ecosystem