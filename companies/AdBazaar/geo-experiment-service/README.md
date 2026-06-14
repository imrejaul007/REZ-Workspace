# Geo Experiment Service

**Port: 4973**

Geographic holdout testing service for AdBazaar DOOH campaigns. Enables controlled experiments comparing treatment markets against control markets with statistical analysis.

## Overview

The Geo Experiment Service provides geographic holdout capabilities for running controlled experiments in specific markets. It enables:
- Market-based A/B testing (treatment vs control)
- Geographic performance analytics with statistical significance
- Lift calculation and confidence intervals
- DOOH campaign optimization through data-driven decisions

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    GEO EXPERIMENT SERVICE                    │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ Experiment │  │   Market    │  │   Results   │         │
│  │  Service   │  │  Service    │  │  Analysis   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│  ┌─────────────┐  ┌─────────────┐                          │
│  │ Treatment  │  │   Control   │                          │
│  │  Service   │  │  Service    │                          │
│  └─────────────┘  └─────────────┘                          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  MongoDB    │  │    Redis    │  │ Prometheus  │        │
│  │   (Data)    │  │   (Cache)   │  │  (Metrics)  │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

## Features

### 1. Geo Experiments
Create and manage geographic experiments with treatment and control markets.

### 2. Market Management
Add treatment and control markets with DMA codes, coordinates, and demographics.

### 3. Statistical Analysis
- Lift calculation (percentage improvement over control)
- Confidence intervals (configurable, default 95%)
- P-value computation for statistical significance
- Sample size tracking

### 4. Results & Recommendations
- Market-by-market lift analysis
- Overall experiment performance
- Actionable recommendations based on results

## API Endpoints

### Health & Monitoring

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Basic health check |
| GET | `/health/detailed` | Health with dependency status |
| GET | `/metrics` | Prometheus metrics |

### Experiments

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/experiments` | Create geo experiment |
| GET | `/api/experiments` | List experiments |
| GET | `/api/experiments/:id` | Get experiment |
| PUT | `/api/experiments/:id` | Update experiment |
| POST | `/api/experiments/:id/start` | Start experiment |
| POST | `/api/experiments/:id/pause` | Pause experiment |
| POST | `/api/experiments/:id/complete` | Complete experiment |
| DELETE | `/api/experiments/:id` | Delete experiment |

### Markets

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/experiments/:id/markets` | Add market |
| GET | `/api/experiments/:id/markets` | List markets |
| GET | `/api/experiments/:id/markets/:marketId` | Get market |

### Treatment & Control

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/experiments/:id/treatment` | Set treatment |
| GET | `/api/experiments/:id/treatment` | List treatments |
| POST | `/api/experiments/:id/control` | Set control |
| GET | `/api/experiments/:id/control` | List controls |

### Results

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/experiments/:id/results` | Geo results |
| GET | `/api/experiments/:id/lift` | Lift analysis |
| POST | `/api/experiments/:id/recalculate` | Recalculate results |
| GET | `/api/experiments/:id/summary` | Experiment summary |

## Usage Examples

### Create an Experiment

```bash
curl -X POST http://localhost:4973/api/experiments \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: your-token" \
  -d '{
    "name": "Mumbai vs Bangalore DOOH Test",
    "description": "Compare new ad format performance",
    "confidenceLevel": 0.95,
    "minMarketDurationDays": 7,
    "metrics": ["impressions", "conversions", "revenue"]
  }'
```

### Add Treatment Market

```bash
curl -X POST http://localhost:4973/api/experiments/{id}/markets \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: your-token" \
  -d '{
    "name": "Mumbai DMA",
    "type": "treatment",
    "dmaCode": "117",
    "city": "Mumbai",
    "state": "Maharashtra",
    "country": "IN"
  }'
```

### Add Control Market

```bash
curl -X POST http://localhost:4973/api/experiments/{id}/markets \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: your-token" \
  -d '{
    "name": "Bangalore DMA",
    "type": "control",
    "dmaCode": "77",
    "city": "Bangalore",
    "state": "Karnataka",
    "country": "IN"
  }'
```

### Set Treatment Spend

```bash
curl -X POST http://localhost:4973/api/experiments/{id}/treatment \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: your-token" \
  -d '{
    "marketId": "market-id",
    "spend": 50000,
    "impressions": 1000000,
    "reach": 250000,
    "frequency": 4,
    "startDate": "2026-06-01T00:00:00Z",
    "endDate": "2026-06-30T23:59:59Z"
  }'
```

### Set Control Baseline

```bash
curl -X POST http://localhost:4973/api/experiments/{id}/control \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: your-token" \
  -d '{
    "marketId": "control-market-id",
    "baseline": {
      "impressions": 900000,
      "reach": 225000,
      "conversions": 1500,
      "revenue": 75000
    },
    "startDate": "2026-06-01T00:00:00Z",
    "endDate": "2026-06-30T23:59:59Z"
  }'
```

### Get Lift Analysis

```bash
curl http://localhost:4973/api/experiments/{id}/lift \
  -H "X-Internal-Token: your-token"
```

Response:
```json
{
  "success": true,
  "data": {
    "experimentId": "...",
    "experimentName": "Mumbai vs Bangalore DOOH Test",
    "overallLift": 25.5,
    "overallConfidence": 0.97,
    "isSignificant": true,
    "marketResults": [...],
    "recommendations": [
      "Strong positive lift detected. Consider rolling out to all markets.",
      "Results are statistically significant. Safe to make decisions."
    ],
    "analyzedAt": "2026-06-07T12:00:00Z"
  }
}
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 4973 | Service port |
| NODE_ENV | development | Environment |
| MONGODB_URI | mongodb://localhost:27017/adbazaar_geo_experiment | MongoDB connection |
| REDIS_HOST | localhost | Redis host |
| REDIS_PORT | 6379 | Redis port |
| REDIS_PASSWORD | - | Redis password |
| INTERNAL_SERVICE_TOKEN | - | Internal service auth token |
| LOG_LEVEL | info | Logging level |

## Models

### GeoExperiment
- name, description
- status (draft, running, paused, completed, cancelled)
- startDate, endDate
- confidenceLevel, minMarketDurationDays
- metrics configuration
- targeting (locations, DMA codes, demographics)

### Market
- experimentId, name, type (treatment/control)
- dmaCode, city, state, country
- latitude, longitude, radius
- population, expectedReach
- status (active, paused, completed)
- metrics (impressions, reach, conversions, revenue)

### TreatmentMarket
- experimentId, marketId
- spend, impressions, reach, frequency
- startDate, endDate

### ControlMarket
- experimentId, marketId
- baseline (impressions, reach, conversions, revenue)
- startDate, endDate

### GeoResult
- experimentId, marketId
- lift, confidence, pValue
- isSignificant, sampleSize
- treatmentMetrics, controlMetrics

## Quick Start

```bash
# Install dependencies
cd geo-experiment-service
npm install

# Start development server
npm run dev

# Health check
curl http://localhost:4973/health

# Detailed health with dependencies
curl http://localhost:4973/health/detailed

# Prometheus metrics
curl http://localhost:4973/metrics
```

## Integration

### With SSP Portal
The SSP Portal uses geo experiments to:
- Define campaign targeting by market
- Calculate expected lift before launching
- Measure actual performance post-campaign

### With AdBazaar Backend
- Sync campaign metrics with markets
- Update experiment status based on campaign state
- Push results to analytics pipeline

### With Analytics Service
- Export geo results for reporting
- Feed lift data into campaign optimization
- Trigger alerts on significant results

## Metrics

Prometheus metrics exposed at `/metrics`:
- `geo_experiment_http_requests_total` - HTTP request counter
- `geo_experiment_http_request_duration_seconds` - Request latency
- `geo_experiment_active_experiments` - Active experiment count
- `geo_experiment_markets_total` - Market counts by type
- `geo_experiment_lift_percent` - Lift distribution
- `geo_experiment_db_operation_duration_seconds` - DB latency
- `geo_experiment_redis_operation_duration_seconds` - Cache latency
- `geo_experiment_errors_total` - Error counter

## Related Services

- **SSP Portal** (4520-4525) - Supply Side Platform using geo experiments
- **AdBazaar Backend** - Campaign coordination
- **Analytics Service** - Result aggregation