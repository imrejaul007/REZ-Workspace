# Media Mix Modeling Service

**AdBazaar Media Mix Modeling (MMM) Service** - A comprehensive advertising attribution and budget optimization platform.

**Port:** 4974  
**Competitors:** Nielsen, Meta's Marketing Mix Modeling (MMA), Neustar, Analytic Partners

---

## Overview

Media Mix Modeling (MMM) is a statistical analysis technique used by advertisers to quantify the effectiveness of their marketing spend across different channels. This service provides:

- **Channel Attribution:** Understand which channels drive conversions
- **ROI Analysis:** Calculate ROAS, CPA, and contribution by channel
- **Budget Optimization:** Find optimal budget allocation across channels
- **Scenario Planning:** Simulate budget scenarios before committing
- **Forecasting:** Predict future performance based on historical data

---

## Features

### 1. MMM Modeling
- Ridge regression-based attribution modeling
- Adstock transformation (carryover effect)
- Saturation curves (diminishing returns)
- Cross-validation for model quality
- Feature importance analysis

### 2. Channel Attribution
Multiple attribution models supported:
- **First Touch:** 100% credit to first touchpoint
- **Last Touch:** 100% credit to last touchpoint
- **Linear:** Equal credit to all touchpoints
- **Time Decay:** More credit to recent touchpoints
- **Position Based:** 40% first, 40% last, 20% distributed
- **Data Driven:** Based on statistical model results

### 3. ROI Analysis
- ROAS (Return on Ad Spend) by channel
- CPA (Cost Per Acquisition) by channel
- Contribution percentage by channel
- Marginal ROAS for optimization
- Channel efficiency scoring

### 4. Budget Optimization
- Marginal ROAS-based allocation
- Constraint-based optimization (min/max spend)
- Mix maintenance options
- Diminishing returns modeling
- Automated recommendations

### 5. Scenario Planning
- Create budget allocation scenarios
- Compare scenarios side-by-side
- vs. Baseline and vs. Current comparisons
- Revenue and ROAS projections
- What-if analysis

### 6. Forecasting
- Weekly, monthly, quarterly, yearly forecasts
- Trend analysis
- Seasonality modeling
- Confidence intervals
- Multi-period ahead predictions

---

## Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** MongoDB
- **Cache:** Redis
- **Validation:** Zod
- **Logging:** Winston
- **Metrics:** Prometheus (prom-client)

---

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB 6.0+
- Redis 7.0+

### Installation

```bash
# Navigate to service directory
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/AdBazaar/media-mix-modeling

# Install dependencies
npm install

# Build TypeScript
npm run build

# Start service
npm run dev
```

### Configuration

Create a `.env` file:

```env
PORT=4974
MONGODB_URI=mongodb://localhost:27017/media-mix-modeling
REDIS_URL=redis://localhost:6379
NODE_ENV=development
INTERNAL_SERVICE_TOKEN=your-service-token
LOG_LEVEL=info
CORS_ORIGIN=*
```

### Health Check

```bash
curl http://localhost:4974/health
```

### Metrics

```bash
curl http://localhost:4974/metrics
```

---

## API Endpoints

### Models

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/models` | Create MMM model |
| GET | `/api/models` | List models |
| GET | `/api/models/:id` | Get model |
| PUT | `/api/models/:id` | Update model |
| DELETE | `/api/models/:id` | Delete model |
| POST | `/api/models/:id/train` | Train model |
| GET | `/api/models/:id/results` | Get training results |

### Attribution

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/models/:id/attribution` | Get channel attribution |
| GET | `/api/models/:id/attribution/summary` | Get attribution summary |
| GET | `/api/models/:id/roi` | Get ROI by channel |

### Optimization

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/models/:id/optimize` | Get budget optimization |
| GET | `/api/models/:id/optimize/efficiency` | Get channel efficiency |

### Scenarios

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/models/:id/scenarios` | Create scenario |
| GET | `/api/models/:id/scenarios` | List scenarios |
| GET | `/api/models/:id/scenarios/:sid` | Get scenario |
| POST | `/api/models/:id/scenarios/compare` | Compare scenarios |

### Forecasting

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/models/:id/forecasting` | Generate forecast |
| GET | `/api/models/:id/forecasting` | Get saved forecasts |

---

## API Examples

### Create a Model

```bash
curl -X POST http://localhost:4974/api/models \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: your-service-token" \
  -d '{
    "name": "Q4 2025 Campaign",
    "advertiserId": "adv_123",
    "channels": [
      {
        "name": "Google Ads",
        "type": "SEARCH",
        "spend": 50000,
        "reach": 100000,
        "conversions": 500,
        "revenue": 250000
      },
      {
        "name": "Facebook Ads",
        "type": "SOCIAL",
        "spend": 30000,
        "reach": 200000,
        "conversions": 300,
        "revenue": 150000
      },
      {
        "name": "TV Campaign",
        "type": "TV",
        "spend": 100000,
        "reach": 500000,
        "conversions": 200,
        "revenue": 100000
      }
    ],
    "dateRange": {
      "start": "2025-10-01T00:00:00Z",
      "end": "2025-12-31T23:59:59Z"
    },
    "targetMetric": "revenue",
    "attributionModel": "DATA_DRIVEN"
  }'
```

### Train Model

```bash
curl -X POST http://localhost:4974/api/models/{modelId}/train \
  -H "X-Internal-Token: your-service-token" \
  -d '{
    "hyperparameters": {
      "regularization": 0.1,
      "maxIterations": 1000,
      "convergenceThreshold": 0.001,
      "adstockDecay": 0.5,
      "saturationLambda": 0.5
    }
  }'
```

### Get Attribution

```bash
curl http://localhost:4974/api/models/{modelId}/attribution \
  -H "X-Internal-Token: your-service-token"
```

### Optimize Budget

```bash
curl -X POST http://localhost:4974/api/models/{modelId}/optimize \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: your-service-token" \
  -d '{
    "totalBudget": 200000,
    "constraints": {
      "minSpendPerChannel": 5000,
      "maintainMix": false
    }
  }'
```

### Create Scenario

```bash
curl -X POST http://localhost:4974/api/models/{modelId}/scenarios \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: your-service-token" \
  -d '{
    "name": "Q1 2026 Growth Plan",
    "totalBudget": 250000,
    "allocation": {
      "google":40,
      "facebook": 35,
      "tv": 25
    }
  }'
```

### Generate Forecast

```bash
curl -X POST http://localhost:4974/api/models/{modelId}/forecasting \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: your-service-token" \
  -d '{
    "period": "MONTH",
    "periodsAhead": 12
  }'
```

---

## Data Models

### MMMModel
```typescript
{
  name: string;
  advertiserId: string;
  channels: ObjectId[];
  dateRange: { start: Date; end: Date };
  targetMetric: 'conversions' | 'revenue' | 'leads' | 'engagement';
  attributionModel: AttributionModel;
  controlVariables?: { name: string; value: number }[];
  status: 'DRAFT' | 'TRAINING' | 'TRAINED' | 'FAILED' | 'ARCHIVED';
  lastTrainedAt?: Date;
}
```

### Channel
```typescript
{
  channelId: string;
  name: string;
  type: ChannelType;
  spend: number;
  reach?: number;
  frequency?: number;
  impressions?: number;
  clicks?: number;
  conversions?: number;
  revenue?: number;
  dataPoints: { date: Date; spend: number; ... }[];
}
```

### ModelResult
```typescript
{
  modelId: ObjectId;
  trainedAt: Date;
  roas: Record<string, number>;
  contribution: Record<string, number>;
  saturation: Record<string, number>;
  adstock: Record<string, number>;
  marginalRoas: Record<string, number>;
  modelMetrics: {
    rSquared: number;
    adjustedRSquared: number;
    rmse: number;
    mae: number;
    mape: number;
  };
  featureImportance: Record<string, number>;
}
```

---

## Competitor Comparison

| Feature | Nielsen | Meta MMA | AdBazaar MMM |
|---------|---------|----------|--------------|
| Multi-channel attribution | Yes | Yes | Yes |
| Statistical modeling | Yes | Yes | Yes |
| Adstock/Saturation | Yes | Yes | Yes |
| Budget optimization | Additional cost | Yes | Yes |
| Scenario planning | Additional cost | Limited | Full |
| Forecasting | Additional cost | Limited | Full |
| API access | Enterprise | Limited | Full REST API |
| Real-time updates | No | Limited | Yes |
| **Price** | $50K+/year | Included with ads | **Startup friendly** |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│ MEDIA MIX MODELING SERVICE                      │
│ Port: 4974                                   │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │
│  │   Routes │  │ Middleware │  │   Utils    │                  │
│  │ mmm.routes │  │  (auth)    │  │ (logger,   │                  │
│  │            │  │            │  │  metrics)  │                  │
│  └──────┬──────┘  └─────────────┘  └─────────────┘                  │
│         │                                                          │
│  ┌──────┴──────────────────────────────────────────────────────┐   │
│  │                      Services Layer                          │   │
│  ├────────────┬────────────┬────────────┬────────────┬─────────┤ │
│  │   Model   │  Training │Attribution│Optimization│ Scenario│   │
│  │  Service  │  Service  │  Service  │   Service  │ Service │   │
│  └────────────┴────────────┴────────────┴────────────┴─────────┘   │
│ │                                                          │
│  ┌──────┴──────────────────────────────────────────────────────┐   │
│  │                    Models (Mongoose)                          │   │
│  ├──────────┬──────────┬──────────┬──────────┬──────────┬───────┤   │
│  │ MMMModel │ Channel  │  Model │ Scenario │ Forecast │       │   │
│  │          │          │  Result  │          │          │       │   │
│  └──────────┴──────────┴──────────┴──────────┴──────────┴───────┘   │
│         │                                                          │
│  ┌──────┴──────────────────────────────────────────────────────┐   │
│  │                    Data Layer                                 │   │
│  │     ┌─────────────┐              ┌─────────────┐              │   │
│  │     │   MongoDB   │              │    Redis   │              │   │
│  │     │ (Primary) │              │   (Cache)  │              │   │
│  │     └─────────────┘              └─────────────┘              │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Prometheus Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `mmm_http_requests_total` | Counter | Total HTTP requests |
| `mmm_http_request_duration_seconds` | Histogram | Request duration |
| `mmm_model_training_total` | Counter | Training runs |
| `mmm_model_training_duration_seconds` | Histogram | Training duration |
| `mmm_model_r_squared` | Gauge | Model R-squared value |
| `mmm_active_models` | Gauge | Active models count |
| `mmm_attribution_requests_total` | Counter | Attribution requests |
| `mmm_optimization_requests_total` | Counter | Optimization requests |
| `mmm_scenario_requests_total` | Counter | Scenario requests |
| `mmm_cache_hit_total` | Counter | Cache hits |
| `mmm_cache_miss_total` | Counter | Cache misses |

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 4974 | Service port |
| `MONGODB_URI` | mongodb://localhost:27017/media-mix-modeling | MongoDB connection |
| `REDIS_URL` | redis://localhost:6379 | Redis connection |
| `NODE_ENV` | development | Environment |
| `INTERNAL_SERVICE_TOKEN` | - | Service authentication token |
| `LOG_LEVEL` | info | Logging level |
| `CORS_ORIGIN` | * | CORS origin |

---

## Error Handling

All API errors return a consistent format:

```json
{
  "success": false,
  "error": "Error message",
  "details": [] // Zod validation errors if applicable
}
```

---

## License

Internal AdBazaar Service - All rights reserved

---

## Support

For issues or questions, contact the AdBazaar platform team.
