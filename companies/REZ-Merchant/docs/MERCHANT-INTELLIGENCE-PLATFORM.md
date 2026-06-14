# REZ Merchant Intelligence Platform

**Complete Documentation**

**Last Updated:** May 13, 2026
**Version:** 1.0.0

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Services](#services)
4. [API Endpoints](#api-endpoints)
5. [Data Pipeline](#data-pipeline)
6. [Privacy & Security](#privacy--security)
7. [Deployment](#deployment)
8. [Monitoring](#monitoring)
9. [Troubleshooting](#troubleshooting)

---

## Overview

The Merchant Intelligence Platform provides cross-merchant analytics and benchmarking, enabling merchants to:

- Compare performance against industry benchmarks
- View demand heatmaps by locality
- Track trends and patterns
- Discover expansion opportunities
- Make data-driven business decisions

### Key Features

| Feature | Description |
|---------|-------------|
| **Demand Heatmaps** | Visualize demand by neighborhood |
| **Benchmarking** | Compare against industry averages |
| **Trend Analysis** | 7d/30d/90d forecasting |
| **Neighborhood Analysis** | Saturation and opportunity scores |
| **Opportunity Detection** | Find underserved markets |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              MERCHANT APPS                                      │
│                                                                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐        │
│  │   Merchant App  │  │  Web Dashboard   │  │      POS        │        │
│  │    (Expo)      │  │    (Next.js)     │  │                 │        │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘        │
│           │                      │                      │                  │
└───────────┼──────────────────────┼──────────────────────┼──────────────────┘
            │                      │                      │
            ▼                      ▼                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MERCHANT SERVICE                                    │
│                              (Port 4005)                                    │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐      │
│  │                    Intelligence Routes                          │      │
│  │   /market/heatmap  /market/benchmark  /market/trends  ...    │      │
│  └────────────────────────────────────────────────────────────────┘      │
│                              │                                             │
│  ┌────────────────────────────────────────────────────────────────┐      │
│  │                  Intelligence Data Pipeline                    │      │
│  │         Syncs merchant data → Intelligence Aggregator          │      │
│  └────────────────────────────────────────────────────────────────┘      │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│              MERCHANT INTELLIGENCE AGGREGATOR                           │
│                           (Port 4011)                                   │
│                                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────┐ │
│  │ Aggregation  │  │ Benchmarking │  │   Heatmap    │  │ Trends │ │
│  │   Engine     │  │    Engine    │  │   Service    │  │Service │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └────────┘ │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    Monitoring Service                              │  │
│  │              Health Scores | Alerts | Metrics                   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DATA STORES                                      │
│                                                                          │
│  ┌──────────────────────┐  ┌──────────────────────┐                     │
│  │      MongoDB        │  │       Redis          │                     │
│  │  (Aggregated Data) │  │      (Cache)        │                     │
│  └──────────────────────┘  └──────────────────────┘                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Services

### 1. Merchant Intelligence Aggregator

**Repository:** `rez-merchant-intelligence-aggregator`
**Port:** 4011

#### Services

| Service | File | Description |
|---------|------|-------------|
| **AggregationService** | `services/aggregationService.ts` | Aggregates merchant data |
| **BenchmarkService** | `services/benchmarkService.ts` | Industry benchmarking |
| **HeatmapService** | `services/heatmapService.ts` | Demand heatmaps |
| **TrendsService** | `services/trendsService.ts` | Trend analysis |
| **MonitoringService** | `services/monitoringService.ts` | Health monitoring |

#### Models

| Model | Description |
|-------|-------------|
| **MerchantData** | Individual merchant metrics (consent-based) |
| **AggregatedMetrics** | Anonymized aggregated data by locality |

### 2. Merchant Service (Intelligence Routes)

**Repository:** `rez-merchant-service`
**Port:** 4005

#### Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/v1/merchant/intelligence/market/heatmap/:city` | GET | Demand heatmap |
| `/api/v1/merchant/intelligence/market/neighborhood` | GET | Neighborhood analysis |
| `/api/v1/merchant/intelligence/market/trends/:locality` | GET | Demand trends |
| `/api/v1/merchant/intelligence/market/benchmark` | GET | Industry benchmarks |
| `/api/v1/merchant/intelligence/market/opportunities` | GET | Expansion opportunities |
| `/api/v1/merchant/intelligence/market/trending` | GET | Trending localities |
| `/api/v1/merchant/intelligence/market/opt-in` | POST | Join program |
| `/api/v1/merchant/intelligence/market/opt-out` | POST | Leave program |

---

## API Endpoints

### Merchant Service → Aggregator

#### Internal Endpoints (Service-to-Service)

```
POST /internal/aggregate
Headers:
  X-Internal-Token: <service-token>
  X-Internal-Service: merchant-service

Body:
{
  "merchantId": "string",
  "businessName": "string",
  "locality": "string",
  "pincode": "string",
  "city": "string",
  "state": "string",
  "industry": "restaurant" | "hotel" | "salon" | "fitness" | "healthcare",
  "category": "string",
  "dailyMetrics": [
    {
      "date": "ISO date",
      "orders": number,
      "revenue": number,
      "customers": number,
      "avgOrderValue": number,
      "repeatCustomers": number,
      "newCustomers": number,
      "peakHours": [number]
    }
  ]
}
```

#### Public Endpoints (Anonymized Data)

##### GET /api/v1/benchmark/industry/:industry

Response:
```json
{
  "success": true,
  "data": {
    "avgOrderValue": 350,
    "avgOrdersPerDay": 45,
    "avgRetentionRate": 35,
    "avgRepeatRate": 30,
    "avgRevenueGrowth": 8.5
  }
}
```

##### GET /api/v1/heatmap/demand/:city

Query params:
- `industry` (default: restaurant)
- `period` (daily, weekly, monthly)

Response:
```json
{
  "success": true,
  "data": {
    "city": "Bangalore",
    "industry": "restaurant",
    "points": [
      {
        "locality": "Koramangala",
        "pincode": "560034",
        "intensity": 85,
        "merchantCount": 45,
        "avgOrderValue": 420,
        "demandScore": 78,
        "growthRate": 12.5
      }
    ],
    "insights": ["..."]
  }
}
```

##### GET /api/v1/trends/demand/:locality

Query params:
- `industry` (default: restaurant)
- `period` (7d, 30d, 90d)

Response:
```json
{
  "success": true,
  "data": {
    "metric": "demand",
    "trend": "up",
    "changePercent": 8.5,
    "forecast": [...],
    "confidence": 85
  }
}
```

### Monitoring Endpoints

##### GET /api/v1/monitoring/metrics

Response:
```json
{
  "success": true,
  "data": {
    "totalMerchants": 150,
    "optedInMerchants": 45,
    "aggregatedLocalities": 12,
    "lastAggregationTime": "2026-05-13T10:00:00Z",
    "dataFreshnessHours": 2.5,
    "errorCount24h": 0,
    "alerts": []
  }
}
```

##### GET /api/v1/monitoring/health-score

Response:
```json
{
  "success": true,
  "data": {
    "score": 95,
    "status": "healthy",
    "timestamp": "2026-05-13T10:00:00Z"
  }
}
```

---

## Data Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ORDER COMPLETED                                      │
│                            (Merchant Service)                                │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    IntelligenceDataPipeline                                │
│                                                                          │
│  syncMerchant(merchantId)                                                │
│    ├── Get store data (locality, category, industry)                    │
│    ├── Aggregate orders for last 30 days                                  │
│    ├── Calculate daily metrics                                           │
│    │     ├── Total orders and revenue                                    │
│    │     ├── Unique customers                                            │
│    │     ├── Peak hours                                                  │
│    │     └── Repeat vs new customers                                     │
│    └── POST to /internal/aggregate                                       │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Intelligence Aggregator                                 │
│                                                                          │
│  AggregationService.upsertMerchantData()                                 │
│    ├── Validate consent                                                  │
│    ├── Store in MerchantData collection                                  │
│    └── Mark for re-aggregation                                          │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Aggregation Cron (Hourly)                               │
│                                                                          │
│  runFullAggregation()                                                    │
│    ├── Get unique locality-industry combinations                         │
│    ├── For each combination (min 3 merchants):                           │
│    │     ├── Aggregate metrics                                          │
│    │     ├── Apply anonymization                                         │
│    │     ├── Calculate benchmarks                                       │
│    │     └── Store in AggregatedMetrics                                 │
│    └── Update cache                                                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Privacy & Security

### Consent Management

All data sharing is **GDPR-compliant** and **opt-in only**.

#### Consent Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           MERCHANT                                        │
│                                                                          │
│  Settings → Market Intelligence → [Join / Opt Out]                     │
│                                                                          │
│  ┌─────────────────┐         ┌─────────────────┐                      │
│  │  Opt In         │         │  Opt Out        │                       │
│  │  ↓              │         │  ↓              │                       │
│  │  POST /opt-in  │         │  POST /opt-out │                       │
│  │  ↓              │         │  ↓              │                       │
│  │  Data syncs     │         │  Consent revoked│                       │
│  │  to aggregator │         │  Data excluded │                       │
│  └─────────────────┘         └─────────────────┘                      │
└─────────────────────────────────────────────────────────────────────────┘
```

### Anonymization

All aggregated data is anonymized using:

| Technique | Description |
|-----------|-------------|
| **Minimum Threshold** | Minimum 3 merchants required |
| **Differential Privacy** | Noise added to prevent identification |
| **No PII** | No names, emails, or identifying info |
| **Location Bucketing** | Pincode buckets, not exact addresses |

### Data Never Collected

- Customer names or phone numbers
- Individual transactions
- Bank or payment details
- Customer addresses

---

## Deployment

### Prerequisites

1. MongoDB instance
2. Redis instance
3. Node.js 18+

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Service port | Yes (default: 4011) |
| `MONGODB_URI` | MongoDB connection | Yes |
| `REDIS_URL` | Redis connection | Yes |
| `CORS_ORIGINS` | Allowed origins | Yes |
| `INTERNAL_SERVICE_TOKENS_JSON` | Service auth tokens | Yes |

### Deploy to Render

1. Connect GitHub repository
2. `render.yaml` auto-configures deployment
3. Set environment variables in Render dashboard
4. Deploy

### Local Development

```bash
# Clone
git clone https://github.com/imrejaul007/rez-merchant-intelligence-aggregator
cd rez-merchant-intelligence-aggregator

# Install
npm install

# Configure
cp .env.example .env
# Edit .env with your values

# Run
npm run dev

# Seed sample data
npm run seed
```

---

## Monitoring

### Health Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Basic liveness |
| `GET /health/ready` | Readiness with dependencies |
| `GET /api/v1/monitoring/health-score` | Health score (0-100) |

### Health Score Calculation

| Factor | Weight |
|--------|--------|
| Merchant participation | -20 if < 10 |
| Data freshness | -30 if > 24h |
| Error rate | -5 to -20 |

### Alerts

| Alert | Trigger | Severity |
|-------|---------|----------|
| Low participation | < 3 merchants | Warning |
| Stale data | > 24 hours | Error |
| No aggregation | Merchants but no data | Error |

---

## Troubleshooting

### Common Issues

#### 1. No data in heatmap

**Cause:** Not enough merchants opted in

**Solution:**
```bash
# Check participation
curl https://your-aggregator.com/api/v1/monitoring/metrics

# Need minimum 3 merchants
```

#### 2. Aggregated data stale

**Cause:** Aggregation cron not running

**Solution:**
```bash
# Trigger manual aggregation
curl -X POST https://your-aggregator.com/internal/run-aggregation \
  -H "X-Internal-Token: your-token"
```

#### 3. Health score low

**Cause:** Multiple factors

**Solution:**
```bash
# Check health score
curl https://your-aggregator.com/api/v1/monitoring/health-score

# Check alerts
curl https://your-aggregator.com/api/v1/monitoring/alerts
```

### Support

- **Email:** platform@rez.money
- **GitHub Issues:** [Report a bug](https://github.com/imrejaul007/rez-merchant-intelligence-aggregator/issues)

---

## Revenue Model

| Tier | Price | Features |
|------|-------|----------|
| **Free** | $0 | Basic analytics, own data only |
| **Pro** | $49/mo | Neighborhood trends, benchmarks |
| **Business** | $199/mo | Competitor analysis, AI recommendations |
| **Enterprise** | $999/mo | Full API access, custom reports |

---

## Changelog

### v1.0.0 (May 13, 2026)
- Initial release
- Aggregation engine
- Benchmark engine
- Heatmap service
- Trends service
- Monitoring service
- GDPR-compliant consent

---

*This document is maintained by the REZ Platform Team.*
