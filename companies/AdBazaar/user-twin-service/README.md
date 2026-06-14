# User Twin Service

Behavioral simulation twins service for targeted advertising in the AdBazaar ecosystem.

## Overview

The User Twin Service creates and maintains behavioral simulation twins for individual users, enabling:
- Purchase prediction
- Channel preference analysis
- Ad responsiveness scoring
- Brand affinity tracking
- Churn risk assessment

## Port

**4806**

## Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** MongoDB
- **Cache:** Redis
- **Validation:** Zod
- **Authentication:** JWT
- **Metrics:** Prometheus

## Quick Start

```bash
# Install dependencies
npm install

# Start in development mode
npm run dev

# Start in production mode
npm run build && npm start

# Run tests
npm test
```

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
PORT=4806
MONGODB_URI=mongodb://localhost:27017/user-twin
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-jwt-secret-here
NODE_ENV=development
```

## API Endpoints

### Create User Twin
```
POST /api/twin/create
Authorization: Bearer <token>

Body:
{
  "userId": "user-123",
  "profile": {
    "demographics": {
      "age": 30,
      "gender": "male",
      "location": {
        "city": "Mumbai",
        "state": "Maharashtra",
        "country": "India"
      }
    },
    "preferences": {
      "language": "en",
      "notifications": ["email", "push"],
      "priceRange": { "min": 100, "max": 5000 }
    }
  }
}
```

### Get User Twin
```
GET /api/twin/:userId
Authorization: Bearer <token>
```

### Update User Twin
```
PUT /api/twin/:userId
Authorization: Bearer <token>

Body:
{
  "profile": { ... },
  "behavioral": { ... },
  "advertising": { ... }
}
```

### Predict Behavior
```
POST /api/twin/:userId/predict
Authorization: Bearer <token>

Body:
{
  "scenario": "purchase",
  "context": {}
}

Response:
{
  "success": true,
  "data": {
    "twinId": "uuid",
    "predictions": {
      "purchaseProbability": 0.75,
      "recommendedActions": ["Send product recommendations", "Offer limited-time discount"],
      "optimalTime": "19:00",
      "suggestedChannels": ["email", "push"],
      "confidence": 0.85
    },
    "timestamp": "2026-06-06T12:00:00Z"
  }
}
```

### Get Brand Affinities
```
GET /api/twin/:userId/affinity
Authorization: Bearer <token>
```

### Refresh Twin Data
```
POST /api/twin/:userId/refresh
Authorization: Bearer <token>
```

## Health & Metrics

```
GET /health        # Health check
GET /metrics       # Prometheus metrics
```

## User Twin Schema

```typescript
interface UserTwin {
  userId: string;
  twinId: string;
  profile: {
    demographics: {
      age?: number;
      gender?: string;
      location: { city: string; state: string; country: string };
    };
    preferences: {
      language: string;
      notifications: string[];
      priceRange: { min: number; max: number };
    };
  };
  behavioral: {
    interests: { category: string; score: number }[];
    purchaseHistory: { category: string; count: number; total: number }[];
    browsingPatterns: { patterns: string[]; frequency: number };
    engagementScore: number;
    lastActive: Date;
  };
  predictive: {
    churnRisk: number;  // 0-1
    lifetimeValue: number;
    nextPurchaseLikely: Date;
    preferredChannels: string[];
    optimalContactTime: string;
  };
  advertising: {
    adResponsiveness: number;  // 0-1
    clickThroughHistory: number;
    conversionRate: number;
    preferredAdFormats: string[];
    brandAffinities: Record<string, number>;
  };
  status: 'active' | 'inactive' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}
```

## Prediction Features

### Purchase Probability
Calculated based on:
- Engagement score (40% weight)
- Recency of activity (30% weight)
- Purchase history (30% weight)

### Recommended Actions
Generated based on:
- High churn risk → Retention offers
- Low engagement → Re-engagement campaigns
- High-value users → VIP treatment
- High ad responsiveness → Increased frequency

### Optimal Contact Time
Determined by:
- User's location (timezone)
- Engagement patterns
- Historical response rates

## Prometheus Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `http_request_duration_seconds` | Histogram | HTTP request latency |
| `http_requests_total` | Counter | Total HTTP requests |
| `twin_operations_total` | Counter | Twin operations by type |
| `twin_prediction_duration_seconds` | Histogram | Prediction latency |
| `twin_cache_hits_total` | Counter | Cache hits |
| `twin_cache_misses_total` | Counter | Cache misses |
| `active_twins_count` | Gauge | Active twins count |
| `errors_total` | Counter | Errors by type |

## Project Structure

```
user-twin-service/
├── src/
│   ├── config/         # Configuration
│   ├── models/         # MongoDB models
│   ├── services/       # Business logic
│   ├── routes/         # API routes
│   ├── middleware/     # Express middleware
│   ├── types/          # TypeScript types
│   └── index.ts        # Application entry
├── tests/              # Unit tests
├── package.json
├── tsconfig.json
├── jest.config.js
├── .env.example
└── README.md
```

## License

Internal - AdBazaar