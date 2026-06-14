# Incrementality Testing Engine

**Version:** 1.0.0  
**Port:** 4971  
**Company:** AdBazaar  
**Competitors:** Nielsen, Meta's lifted

The Incrementality Testing Engine is AdBazaar's comprehensive solution for measuring true advertising lift. It provides enterprise-grade experimentation capabilities including A/B testing, holdout groups, geographic experiments, and advanced lift analysis with statistical rigor.

## Overview

The Incrementality Testing Engine answers the fundamental question in advertising: "Would my customers have purchased anyway, even without this ad?" By comparing treatment groups (exposed to ads) against control groups (held out), we measure the actual incremental impact of advertising campaigns.

### Key Capabilities

- **A/B Testing**: Compare ad variations to identify winning creative
- **Holdout Groups**: Measure incremental conversions from ad exposure
- **Geographic Experiments**: Test regional variations with treatment/control markets
- **Lift Analysis**: Statistical significance testing with confidence intervals
- **AI Recommendations**: Actionable insights for campaign optimization
- **Real-time Metrics**: Track impressions, clicks, conversions, ROAS in real-time

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     INCREMENTALITY TESTING ENGINE                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐ │
│  │ Experiment │   │  TestGroup │   │   Result   │   │LiftAnalysis │ │
│  │  Service   │   │  Service   │   │  Service   │   │  Service    │ │
│  │            │   │            │   │            │   │             │ │
│  │ - Create   │   │ - Create   │   │ - Record   │   │ - Calculate │ │
│  │ - Start   │   │ - Allocate │   │ - Aggregate│   │ - Statistical│ │
│  │ - Pause   │   │ - Compare  │   │ - Trends   │   │ - MDE       │ │
│  │ - Complete│   │ - Rebalance│   │            │   │             │ │
│  └─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘ │
│                                                                          │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐                     │
│  │  GeoTest   │   │Recommendation│   │  Metrics   │                     │
│  │  Service   │   │  Service    │   │  Collector │                     │
│  │            │   │            │   │            │                     │
│  │ - Regional │   │ - Scaling   │   │ - Prometheus│                     │
│  │ - Compare  │   │ - Budget    │   │ - Custom    │                     │
│  │ - Simulate │   │ - Creative  │   │ - Real-time │                     │
│  └─────────────┘   └─────────────┘   └─────────────┘                     │
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                        DATA LAYER                                        │
│  ┌─────────────────┐              ┌─────────────────┐                   │
│  │     MongoDB     │              │      Redis      │                   │
│  │  (Persistence)  │              │    (Cache)      │                   │
│  └─────────────────┘              └─────────────────┘                   │
└─────────────────────────────────────────────────────────────────────────┘
```

## Features

### 1. Experiment Management

- Create experiments with targeting parameters
- Start, pause, and complete experiments
- Track budget allocation and spending
- Support multiple experiment types

### 2. Test Groups

- Treatment vs Control group comparison
- Custom allocation percentages
- User-level and geo-level allocation
- Real-time metrics aggregation

### 3. Lift Analysis

- **Conversion Lift**: Measure incremental conversions
- **Revenue Lift**: Track incremental revenue
- **ROAS Lift**: Compare return on ad spend
- **Statistical Significance**: p-value, confidence intervals
- **Minimum Detectable Effect (MDE)**: Calculate required sample size

### 4. Geographic Testing

- Regional treatment vs control markets
- Compare market performance
- Identify best/worst performing regions
- Simulate geo test outcomes

### 5. AI Recommendations

- Scaling recommendations for winning campaigns
- Budget reallocation suggestions
- Creative optimization insights
- Targeting refinement guidance
- Timing and duration recommendations

## API Endpoints

### Experiments

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/experiments` | Create new experiment |
| GET | `/api/experiments` | List experiments |
| GET | `/api/experiments/:id` | Get experiment details |
| PUT | `/api/experiments/:id` | Update experiment |
| POST | `/api/experiments/:id/start` | Start experiment |
| POST | `/api/experiments/:id/pause` | Pause experiment |
| GET | `/api/experiments/:id/results` | Get experiment results |

### Analysis

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/experiments/:id/analysis` | Run lift analysis |
| GET | `/api/experiments/:id/lift` | Get lift metrics |
| POST | `/api/experiments/:id/geotests` | Create geo test |
| GET | `/api/experiments/:id/recommendations` | Get AI recommendations |

### System

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/metrics` | Prometheus metrics |

## Quick Start

### Installation

```bash
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/AdBazaar/incrementality-testing-engine
npm install
```

### Development

```bash
npm run dev
# Server starts on port 4971
```

### Production

```bash
npm run build
npm start
```

### Environment Variables

```bash
PORT=4971
MONGODB_URI=mongodb://localhost:27017/incrementality-testing
REDIS_URL=redis://localhost:6379
INTERNAL_SERVICE_TOKEN=your-internal-token
LOG_LEVEL=info
LOG_DIR=./logs
```

## Usage Examples

### Create an Experiment

```bash
curl -X POST http://localhost:4971/api/experiments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{
    "name": "Summer Sale Campaign Lift Test",
    "description": "Measure incremental lift from summer sale campaign",
    "type": "hold_out",
    "budget": 50000,
    "testGroups": [
      {"name": "Treatment", "type": "treatment", "allocation": 80},
      {"name": "Control", "type": "control", "allocation": 20}
    ],
    "targeting": {
      "demographics": {
        "ageRanges": ["25-34", "35-44"],
        "locations": ["Mumbai", "Delhi", "Bangalore"]
      },
      "device": {
        "types": ["mobile", "desktop"]
      }
    }
  }'
```

### Start Experiment

```bash
curl -X POST http://localhost:4971/api/experiments/EXPERIMENT_ID/start \
  -H "Authorization: Bearer your-token"
```

### Record Metrics

```bash
curl -X POST http://localhost:4971/api/experiments/EXPERIMENT_ID/metrics \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{
    "groupId": "GROUP_ID",
    "impressions": 10000,
    "clicks": 500,
    "conversions": 50,
    "revenue": 5000,
    "cost": 1000
  }'
```

### Run Analysis

```bash
curl -X POST http://localhost:4971/api/experiments/EXPERIMENT_ID/analysis \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{
    "confidenceLevel": 0.95
  }'
```

### Get Lift Metrics

```bash
curl http://localhost:4971/api/experiments/EXPERIMENT_ID/lift \
  -H "Authorization: Bearer your-token"
```

### Get Recommendations

```bash
curl http://localhost:4971/api/experiments/EXPERIMENT_ID/recommendations?generate=true \
  -H "Authorization: Bearer your-token"
```

## Competitor Comparison

| Feature | Nielsen | Meta's lifted | AdBazaar Incrementality Engine |
|---------|---------|---------------|-------------------------------|
| A/B Testing | ✅ | ✅ | ✅ |
| Holdout Groups | ✅ | ✅ | ✅ |
| Geo Experiments | ✅ | ❌ | ✅ |
| Lift Analysis | ✅ | ✅ | ✅ |
| Statistical Significance | ✅ | ✅ | ✅ |
| AI Recommendations | ❌ | ❌ | ✅ |
| Real-time Metrics | ❌ | ✅ | ✅ |
| Multi-channel | ✅ | ❌ | ✅ |
| **Price** | $50K+/month | $10K+/month | **Enterprise Included** |

## Statistical Methods

### Lift Calculation

```
Relative Lift = ((Treatment Rate - Control Rate) / Control Rate) × 100
```

### Statistical Significance

Uses two-proportion z-test:

```
z = (p1 - p2) / √(p(1-p)(1/n1 + 1/n2))
```

Where:
- p1 = Treatment conversion rate
- p2 = Control conversion rate
- n1 = Treatment sample size
- n2 = Control sample size
- p = Pooled proportion

### Confidence Interval

```
CI = (p1 - p2) ± z_α/2 × SE
```

### Minimum Detectable Effect

```
MDE = (z_α + z_β) × √(2p(1-p)/n)
```

## Data Models

### Experiment

```typescript
interface Experiment {
  _id: ObjectId;
  name: string;
  description: string;
  type: ExperimentType;
  status: ExperimentStatus;
  startDate?: Date;
  endDate?: Date;
  targeting: Targeting;
  budget: number;
  spent: number;
  metrics: Metrics;
  testGroups: ObjectId[];
  results: ObjectId[];
  liftAnalyses: ObjectId[];
  recommendations: Recommendation[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}
```

### TestGroup

```typescript
interface TestGroup {
  _id: ObjectId;
  experimentId: ObjectId;
  name: string;
  type: TestGroupType;
  size: number;
  allocation: number;
  isActive: boolean;
  metrics: Metrics;
}
```

### LiftAnalysis

```typescript
interface LiftAnalysis {
  _id: ObjectId;
  experimentId: ObjectId;
  lift: number;
  absoluteLift: number;
  relativeLift: number;
  confidenceInterval: { lower: number; upper: number };
  pValue: number;
  tStatistic: number;
  sampleSize: number;
  statisticalPower: number;
  minimumDetectableEffect: number;
  isSignificant: boolean;
  confidenceLevel: number;
  analysisDate: Date;
}
```

## Monitoring

### Prometheus Metrics

- `incrementality_experiments_total` - Total experiments by status/type
- `incrementality_experiments_active` - Active experiment count
- `incrementality_lift_analyses_total` - Lift analyses performed
- `incrementality_average_lift_percent` - Average lift across experiments
- `incrementality_significant_experiments` - Statistically significant experiments
- `incrementality_http_request_duration_seconds` - HTTP request latency
- `incrementality_cache_hits_total` - Redis cache hits

### Health Check

```bash
curl http://localhost:4971/health
```

Response:

```json
{
  "status": "ok",
  "timestamp": "2026-06-07T12:00:00.000Z",
  "service": "incrementality-testing-engine",
  "port": 4971,
  "uptime": 3600,
  "mongodb": "connected",
  "redis": "connected"
}
```

## Error Handling

All API responses follow this format:

```json
{
  "success": true|false,
  "data": {...} | null,
  "error": "Error message" | null,
  "message": "Additional context" | null
}
```

## Security

- Internal service authentication via `X-Internal-Token` header
- Bearer token authentication for user requests
- API key authentication for integrations
- Rate limiting (configurable)
- Input validation with Zod

## License

Proprietary - AdBazaar Internal Use

---

**Last Updated:** June 7, 2026  
**Version:** 1.0.0