# REZ Merchant Intelligence Aggregator

**Cross-merchant analytics and benchmarking service**

## Overview

This service aggregates anonymized merchant data to provide:
- **Locality Heatmaps** - Visualize demand across neighborhoods
- **Benchmarking** - Compare performance against industry averages
- **Trend Analysis** - Track demand patterns over time
- **Opportunity Detection** - Find underserved markets

## Features

### Aggregation Engine
- Privacy-first data aggregation with GDPR compliance
- Minimum merchant threshold (3+) for aggregation
- Anonymization of sensitive metrics
- Consent-based data sharing

### Benchmarking
- Industry-wide performance benchmarks
- Locality-based comparisons
- Top performer identification
- Personalized insights

### Heatmaps
- Demand intensity visualization
- Saturation analysis
- Opportunity scoring
- Trending localities

### Trends
- Demand forecasting
- Seasonal patterns
- Repeat visit analysis
- Category trends

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ MERCHANT APPS │
│ │
│ POST /internal/aggregate ──────────────────────────┐ │
└────────────────────────────────────────────────────┼──┘
│ │
│ ▼
┌─────────────────────────────────────────────────────────────────┐
│ AGGREGATION ENGINE │
│ │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│ │ Anonymize │─►│ Aggregate │─►│ Cache │ │
│ │ Data │ │ │ Metrics │ │ Results │ │
│ └─────────────┘ └─────────────┘ └─────────────┘ │
└─────────────────────────────────────────────────────────────────┘
│ │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│ │ Benchmark │ │ Heatmap │ │ Trends │ │
│ │ Service │ │ Service │ │ Service │ │
│ └─────────────┘ └─────────────┘ └─────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## API Endpoints

### Internal (Service-to-Service)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/internal/aggregate` | Submit merchant metrics |
| POST | `/internal/consent` | Update data sharing consent |
| POST | `/internal/run-aggregation` | Trigger full aggregation |

### Public (Anonymized Data)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/benchmark/industry/:industry` | Industry benchmarks |
| GET | `/api/v1/benchmark/locality` | Locality benchmarks |
| GET | `/api/v1/heatmap/demand/:city` | Demand heatmap |
| GET | `/api/v1/heatmap/neighborhood` | Neighborhood analysis |
| GET | `/api/v1/heatmap/trending` | Trending localities |
| GET | `/api/v1/heatmap/opportunities` | Opportunity areas |
| GET | `/api/v1/trends/demand/:locality` | Demand trends |
| GET | `/api/v1/trends/patterns` | Repeat visit patterns |
| GET | `/api/v1/trends/seasonal` | Seasonal trends |

## Privacy

- **Anonymization**: All aggregated metrics use differential privacy
- **Consent**: Merchants opt-in to data sharing
- **Thresholds**: Minimum 3 merchants required for aggregation
- **No PII**: No personally identifiable information in aggregated data

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment
cp .env.example .env

# Start development
npm run dev

# Build for production
npm run build
npm start
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | Yes | Service port (default: 4011) |
| `MONGODB_URI` | Yes | MongoDB connection |
| `REDIS_URL` | Yes | Redis connection |
| `NODE_ENV` | No | Environment (development/production) |
| `INTERNAL_SERVICE_TOKENS_JSON` | Yes | Service authentication |
