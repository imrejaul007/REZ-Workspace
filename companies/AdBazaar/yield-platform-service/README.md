# Yield Platform Service

**Port:** 4980  
**Company:** AdBazaar  
**Role:** Central yield optimization service for advertising inventory

## Overview

The Yield Platform Service is AdBazaar's central yield optimization engine. It provides comprehensive analytics, forecasting, and optimization capabilities for managing advertising inventory across multiple demand sources and inventory types.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    YIELD PLATFORM SERVICE                      │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Yield API   │  │   Forecast   │  │  Backtest    │          │
│  │  (4980)     │  │   Engine     │  │  Engine      │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                │                │                    │
│  ┌──────┴────────────────┴────────────────┴───────┐          │
│  │              OPTIMIZATION ENGINE              │          │
│  │    Floor Price │ Priority │ Pacing │ Demand   │          │
│  └──────┬────────────────┬────────────────┬──────┘          │
│         │                │                │                   │
│  ┌──────┴───────┐  ┌──────┴───────┐  ┌──────┴───────┐       │
│  │  Yield       │  │  Strategy    │  │ Recommendation│       │
│  │  Service     │  │  Service     │  │  Service      │       │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘       │
│         │                │                │                   │
│  ┌──────┴────────────────┴────────────────┴───────┐          │
│  │                 DATA LAYER                    │          │
│  │  MongoDB │ Redis │ Prometheus Metrics          │          │
│  └────────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

## Features

### 1. Yield Analytics
- Real-time yield summary with revenue, eCPM, fill rate metrics
- Inventory breakdown by type (display, video, native)
- Demand source analysis
- Trend calculation (daily, weekly, monthly)

### 2. Yield Optimization
- Automated floor price optimization
- Priority reordering for strategies
- Fill rate optimization
- Constraint-based optimization (min fill rate, max/min floor prices)

### 3. Yield Forecasting
- Multi-horizon forecasting (hourly, daily, weekly, monthly)
- Confidence intervals with upper/lower bounds
- Factor analysis (trend, seasonality, variance)
- Accuracy tracking

### 4. Strategy Backtesting
- Historical performance simulation
- Strategy comparison (vs baseline or other strategies)
- Timeline analysis
- Insights and recommendations

### 5. AI Recommendations
- Automated recommendation generation
- Priority-based recommendation queue
- One-click recommendation application
- Impact estimation

## API Endpoints

### Health & Monitoring

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check with MongoDB/Redis status |
| GET | `/ready` | Readiness probe |
| GET | `/metrics` | Prometheus metrics |
| GET | `/api` | API documentation |

### Yield Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/yield/summary` | Get yield summary |
| GET | `/api/yield/inventory` | Get inventory yield analysis |
| GET | `/api/yield/trends` | Get yield trends |
| GET | `/api/yield/dashboard` | Get dashboard data |

### Yield Optimization

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/yield/optimize` | Optimize yield strategies |
| GET | `/api/yield/compare` | Compare strategies |

### Yield Forecasting

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/yield/forecast` | Get yield forecasts |

### Strategy Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/yield/backtest` | Backtest strategy |

### Recommendations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/yield/recommendations` | Get recommendations |
| POST | `/api/yield/recommendations/:id/apply` | Apply recommendation |

## Quick Start

### Prerequisites
- Node.js >= 18.0.0
- MongoDB (local or Atlas)
- Redis (optional, for caching)

### Installation

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Start in development mode
npm run dev

# Start in production
npm start
```

### Environment Variables

```bash
# Server
PORT=4980
NODE_ENV=development

# MongoDB
MONGO_URI=mongodb://localhost:27017/yield-platform

# Redis
REDIS_URL=redis://localhost:6379

# Security
INTERNAL_SERVICE_TOKEN=yield-platform-internal-token

# CORS
CORS_ORIGIN=*
```

## API Examples

### Get Yield Summary

```bash
curl -X GET "http://localhost:4980/api/yield/summary" \
  -H "X-Internal-Token: yield-platform-internal-token" \
  -H "Content-Type: application/json"
```

### Optimize Yield

```bash
curl -X POST "http://localhost:4980/api/yield/optimize" \
  -H "X-Internal-Token: yield-platform-internal-token" \
  -H "Content-Type: application/json" \
  -d '{
    "objective": "revenue",
    "constraints": {
      "minFillRate": 70,
      "maxFloorPrice": 5.0
    },
    "lookbackDays": 7
  }'
```

### Get Forecast

```bash
curl -X GET "http://localhost:4980/api/yield/forecast?horizon=daily&startDate=2026-06-01T00:00:00Z&endDate=2026-06-07T00:00:00Z" \
  -H "X-Internal-Token: yield-platform-internal-token" \
  -H "Content-Type: application/json"
```

### Backtest Strategy

```bash
curl -X POST "http://localhost:4980/api/yield/backtest" \
  -H "X-Internal-Token: yield-platform-internal-token" \
  -H "Content-Type: application/json" \
  -d '{
    "strategyConfig": {
      "name": "High Floor Strategy",
      "type": "floor",
      "floorPrice": 3.5,
      "priority": 1
    },
    "startDate": "2026-05-01T00:00:00Z",
    "endDate": "2026-05-31T00:00:00Z"
  }'
```

## Data Models

### YieldSummary
- `date`: Date of the summary
- `inventory`: Total impressions and breakdown by type
- `revenue`: Total, gross, and net revenue
- `ecpm`: Average eCPM and by-inventory breakdown
- `fillRate`: Overall and by-inventory fill rates
- `requests`: Total, matched, and passed requests
- `trends`: Revenue, eCPM, and fill rate changes

### YieldStrategy
- `name`: Strategy name
- `type`: floor, priority, waterfall, header_bidding, dynamic
- `status`: active, paused, archived
- `priority`: Numeric priority (higher = more priority)
- `rules`: Conditions for strategy application
- `settings`: Floor price, max bids, targeting, pacing
- `inventoryTypes`: Applicable inventory types
- `demandSources`: Applicable demand sources
- `performance`: Impressions, revenue, eCPM, fill rate, CTR

### YieldForecast
- `date`: Forecast date
- `horizon`: hourly, daily, weekly, monthly
- `inventoryType`: Optional inventory type filter
- `predicted`: Revenue, eCPM, fill rate, impressions
- `confidence`: Overall and per-metric confidence intervals
- `factors`: Contributing factors with weights

### YieldRecommendation
- `type`: floor_optimization, strategy_adjustment, demand_forecast, inventory_mix, pacing_adjustment
- `category`: revenue, fill_rate, ecpm, efficiency, risk
- `priority`: critical, high, medium, low
- `status`: pending, approved, applied, dismissed, expired
- `action`: Action to take (type, target, value)
- `impact`: Estimated impact on metrics
- `conditions`: Current value, threshold, trend

## Prometheus Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `yield_platform_http_requests_total` | Counter | Total HTTP requests |
| `yield_platform_http_request_duration_seconds` | Histogram | Request duration |
| `yield_platform_revenue_total` | Counter | Total revenue by inventory/strategy |
| `yield_platform_ecpm_current` | Gauge | Current eCPM |
| `yield_platform_fill_rate_current` | Gauge | Current fill rate |
| `yield_platform_impressions_total` | Counter | Total impressions |
| `yield_platform_optimization_attempts_total` | Counter | Optimization attempts |
| `yield_platform_optimization_duration_seconds` | Histogram | Optimization duration |
| `yield_platform_forecast_accuracy` | Gauge | Forecast accuracy |
| `yield_platform_recommendations_total` | Counter | Recommendations generated |
| `yield_platform_backtest_runs_total` | Counter | Backtest runs |
| `yield_platform_backtest_duration_seconds` | Histogram | Backtest duration |

## Ecosystem Integration

### Connected Services

| Service | Port | Purpose |
|---------|------|---------|
| RABTUL Auth | 4002 | Internal service token verification |
| RABTUL Wallet | 4004 | Revenue tracking |
| AdBazaar DOOH | 4068 | Inventory management |
| AdBazaar SSP | 4520 | Supply side platform |

### Event Types
- `yield.optimized`: Emitted when optimization completes
- `yield.recommendation.created`: New recommendation generated
- `yield.recommendation.applied`: Recommendation applied

## Error Handling

All API responses follow this format:

```json
{
  "success": true,
  "requestId": "uuid",
  "data": { ... }
}
```

Error responses:

```json
{
  "success": false,
  "requestId": "uuid",
  "error": "Error Type",
  "message": "Error description"
}
```

## License

Internal AdBazaar Service