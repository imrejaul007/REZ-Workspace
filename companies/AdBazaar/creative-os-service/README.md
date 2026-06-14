# Creative OS Service

**Port: 5020**

AdBazaar's Creative OS - Creative automation and performance prediction platform. This service provides AI-powered creative generation, performance prediction, A/B testing variations, and automated optimization for advertising creatives.

## Features

- **Creative Management**: Create, update, approve, and manage advertising creatives
- **AI Generation**: Generate creative content using AI with brand guidelines
- **Performance Prediction**: ML-based CTR, CVR, and conversion predictions
- **A/B Testing**: Create and manage variation tests (A/B, multivariate, bandit)
- **AI Optimization**: Automated creative optimization based on goals
- **Templates**: Pre-built creative templates for quick start
- **Analytics**: Comprehensive creative performance analytics

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB (Mongoose ODM)
- **Cache**: Redis
- **Logging**: Winston
- **Metrics**: Prometheus (prom-client)
- **Validation**: Zod

## Quick Start

```bash
# Install dependencies
cd creative-os-service
npm install

# Start development server
npm run dev

# Start production server
npm run build
npm start
```

## Environment Variables

```env
PORT=5020
MONGODB_URI=mongodb://localhost:27017/creative-os
REDIS_URL=redis://localhost:6379
LOG_LEVEL=info
INTERNAL_SERVICE_KEY=your-internal-service-key
HOJAI_API_URL=http://localhost:4800
HOJAI_API_KEY=your-hojai-api-key
```

## API Endpoints

### Health & Metrics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/metrics` | Prometheus metrics |

### Creative Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/creatives` | Create new creative |
| GET | `/api/creatives` | List creatives |
| GET | `/api/creatives/:id` | Get creative by ID |
| PUT | `/api/creatives/:id` | Update creative |
| POST | `/api/creatives/:id/activate` | Activate creative |
| POST | `/api/creatives/:id/pause` | Pause creative |
| POST | `/api/creatives/:id/duplicate` | Duplicate creative |
| POST | `/api/creatives/:id/submit-review` | Submit for review |
| POST | `/api/creatives/:id/approve` | Approve creative |
| POST | `/api/creatives/:id/reject` | Reject creative |

### AI Generation

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/creatives/generate` | Generate creative with AI |
| POST | `/api/creatives/:id/optimize` | AI optimization |

### Performance Prediction

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/creatives/:id/predict` | Get performance prediction |
| GET | `/api/creatives/:id/analytics` | Get creative analytics |

### A/B Testing

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/creatives/:id/variations` | Create variation test |
| GET | `/api/creatives/:id/variations` | Get active variations |

### Templates

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/creatives/templates` | List creative templates |

### Statistics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/creatives/stats/top-performers` | Get top performing creatives |

## API Examples

### Create a Creative

```bash
curl -X POST http://localhost:5020/api/creatives \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: your-service-key" \
  -d '{
    "name": "Summer Sale Banner",
    "type": "banner",
    "content": {
      "headline": "Summer Sale - Up to 50% Off",
      "body": "Discover amazing deals this summer",
      "cta": "Shop Now"
    },
    "campaignId": "camp_123",
    "advertiserId": "adv_456",
    "dimensions": { "width": 300, "height": 250 },
    "tags": ["summer", "sale", "fashion"]
  }'
```

### Generate Creative with AI

```bash
curl -X POST http://localhost:5020/api/creatives/generate \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: your-service-key" \
  -d '{
    "type": "banner",
    "campaignId": "camp_123",
    "advertiserId": "adv_456",
    "productName": "Running Shoes",
    "productDescription": "Premium running shoes for athletes",
    "industry": "retail",
    "tone": "energetic",
    "ctaText": "Buy Now"
  }'
```

### Get Performance Prediction

```bash
curl -X GET "http://localhost:5020/api/creatives/creative_id/predict?placement=banner" \
  -H "X-Internal-Token: your-service-key"
```

### Create A/B Test

```bash
curl -X POST http://localhost:5020/api/creatives/creative_id/variations \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: your-service-key" \
  -d '{
    "testName": "Headline Test",
    "testType": "ab",
    "hypothesis": "Question headlines will perform better",
    "variations": [
      {
        "name": "Control",
        "content": { "headline": "Buy Now" }
      },
      {
        "name": "Treatment",
        "content": { "headline": "Ready to Buy?" }
      }
    ],
    "startDate": "2026-06-01T00:00:00Z"
  }'
```

### Optimize Creative

```bash
curl -X POST http://localhost:5020/api/creatives/creative_id/optimize \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: your-service-key" \
  -d '{
    "goal": "ctr",
    "constraints": { "maxChanges": 3 }
  }'
```

## Data Models

### Creative

```typescript
{
  name: string;
  type: 'banner' | 'video' | 'native' | 'text' | 'carousel' | 'interactive';
  content: {
    headline?: string;
    body?: string;
    cta?: string;
    imageUrl?: string;
    videoUrl?: string;
    assets?: Array<{ type: string; url: string }>;
  };
  campaignId: string;
  advertiserId: string;
  status: 'draft' | 'pending_review' | 'approved' | 'rejected' | 'active' | 'paused' | 'archived';
  dimensions?: { width: number; height: number };
  targetAudience?: { ageRange?: [number, number]; gender?: string[]; interests?: string[] };
  metrics?: { impressions: number; clicks: number; conversions: number; ctr: number; cvr: number; spend: number };
  tags?: string[];
}
```

### CreativePrediction

```typescript
{
  creativeId: string;
  predictions: {
    predictedCTR: number;
    predictedCVR: number;
    predictedImpressions: number;
    predictedClicks: number;
    predictedConversions: number;
    predictedCPA: number;
    predictedROAS: number;
  };
  confidence: { ctrConfidence: number; cvrConfidence: number; overallConfidence: number };
  factors: Array<{ name: string; impact: number; description: string }>;
  benchmarks: { industryCTR: number; industryCVR: number; similarAdCTR: number };
  recommendations: string[];
 modelVersion: string;
}
```

## Services Architecture

```
creative-os-service/
├── src/
│   ├── index.ts              # Main entry point
│   ├── models/               # Mongoose schemas
│   │   ├── Creative.ts
│   │   ├── CreativeVariation.ts
│   │   ├── CreativePrediction.ts
│   │   └── CreativeTemplate.ts
│   ├── services/             # Business logic
│   │   ├── creativeService.ts
│   │   ├── generationService.ts
│   │   ├── predictionService.ts
│   │   ├── variationService.ts
│   │   └── optimizationService.ts
│   ├── routes/              # API routes
│   │   └── creativeRoutes.ts
│   ├── middleware/          # Express middleware
│   │   └── auth.ts
│   └── utils/               # Utilities
│       ├── logger.ts
│       └── metrics.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Prometheus Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `http_request_duration_seconds` | Histogram | HTTP request duration |
| `http_requests_total` | Counter | Total HTTP requests |
| `creative_operations_total` | Counter | Creative operations by type |
| `creative_generation_duration_seconds` | Histogram | AI generation duration |
| `prediction_requests_total` | Counter | Prediction requests |
| `prediction_confidence_score` | Gauge | Prediction confidence |
| `variation_tests_total` | Gauge | Active variation tests |
| `optimization_improvement_percentage` | Gauge | Optimization improvements |

## Authentication

Internal service authentication using `X-Internal-Token` header:

```bash
curl -H "X-Internal-Token: your-service-key" http://localhost:5020/api/creatives
```

## Related Services

- **AdBazaar Gateway** (Port 4000): Central API gateway
- **HOJAI AI** (Port 4800): AI/ML services for generation
- **REZ Intent Graph** (Port 4018): Intent prediction
- **RABTUL Auth** (Port 4002): Authentication service

## License

Proprietary - AdBazaar