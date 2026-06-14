# Publisher Dashboard Service

AdBazaar's Publisher Dashboard - Analytics and reporting for publishers.

**Port:** 5001

## Overview

The Publisher Dashboard Service provides comprehensive analytics and reporting for publishers in the AdBazaar advertising ecosystem. It aggregates data from multiple sources to provide insights on revenue, performance, trends, and audience demographics.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PUBLISHER DASHBOARD SERVICE                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        API LAYER (Express.js)                        │   │
│  │   Health │ Metrics │ Dashboard │ Revenue │ Performance │ Trends    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      SERVICES LAYER                                  │   │
│  │  DashboardService │ RevenueService │ PerformanceService │ TrendService│  │
│  │                    │ ExportService                                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       MODELS LAYER (Mongoose)                       │   │
│  │  DashboardConfig │ RevenueAnalytics │ PerformanceMetric │ TrendData │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│  ┌──────────────────────┐  ┌──────────────────────┐                       │
│  │      MongoDB         │  │        Redis         │                       │
│  │   (Persistence)      │  │      (Cache)         │                       │
│  └──────────────────────┘  └──────────────────────┘                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Features

### Dashboard Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check endpoint |
| `/metrics` | GET | Prometheus metrics |
| `/api/dashboard/:publisherId` | GET | Main dashboard data |
| `/api/dashboard/:publisherId/revenue` | GET | Revenue analytics |
| `/api/dashboard/:publisherId/inventory` | GET | Inventory overview |
| `/api/dashboard/:publisherId/performance` | GET | Performance metrics |
| `/api/dashboard/:publisherId/trends` | GET | Trend analysis |
| `/api/dashboard/:publisherId/demographics` | GET | Audience demographics |
| `/api/dashboard/:publisherId/geography` | GET | Geographic breakdown |
| `/api/dashboard/:publisherId/devices` | GET | Device breakdown |
| `/api/dashboard/:publisherId/compare` | GET | Compare periods |
| `/api/dashboard/:publisherId/export` | GET | Export data |

### Data Models

#### DashboardConfig
- Publisher dashboard configurations
- Widget layouts
- Refresh intervals
- Currency preferences

#### RevenueAnalytics
- Daily revenue data by format
- eCPM calculations
- Fill rates
- Geographic and device breakdowns

#### PerformanceMetric
- Ad unit performance
- Click-through rates
- Viewability metrics
- Bid metrics

#### TrendData
- Historical trend values
- Forecast data
- Seasonality patterns
- Anomaly detection

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- MongoDB
- Redis

### Installation

```bash
cd publisher-dashboard-service
npm install
```

### Configuration

Create a `.env` file or set environment variables:

```bash
PORT=5001
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/publisher_dashboard
REDIS_HOST=localhost
REDIS_PORT=6379
INTERNAL_SERVICE_TOKEN=your-secure-token
```

### Run Development

```bash
npm run dev
```

### Run Production

```bash
npm run build
npm start
```

## API Documentation

### Authentication

All API endpoints require the `X-Internal-Token` header:

```bash
curl -H "X-Internal-Token: your-secure-token" \
     -H "X-Publisher-Id: publisher123" \
     http://localhost:5001/api/dashboard/publisher123
```

### Query Parameters

All dashboard endpoints support:

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| startDate | ISO 8601 | Start of date range | 30 days ago |
| endDate | ISO 8601 | End of date range | now |

### Examples

#### Get Dashboard

```bash
curl -H "X-Internal-Token: your-token" \
     "http://localhost:5001/api/dashboard/publisher123"
```

#### Get Revenue Analytics

```bash
curl -H "X-Internal-Token: your-token" \
     "http://localhost:5001/api/dashboard/publisher123/revenue?startDate=2024-01-01&endDate=2024-01-31"
```

#### Get Performance Metrics

```bash
curl -H "X-Internal-Token: your-token" \
     "http://localhost:5001/api/dashboard/publisher123/performance?startDate=2024-01-01&endDate=2024-01-31"
```

#### Compare Periods

```bash
curl -H "X-Internal-Token: your-token" \
     "http://localhost:5001/api/dashboard/publisher123/compare?currentStart=2024-01-01&currentEnd=2024-01-31&previousStart=2023-12-01&previousEnd=2023-12-31&metric=revenue"
```

#### Export Data

```bash
curl -H "X-Internal-Token: your-token" \
     -o report.json \
     "http://localhost:5001/api/dashboard/publisher123/export?startDate=2024-01-01&endDate=2024-01-31&format=json&type=full"
```

## Metrics

Prometheus metrics are available at `/metrics`:

- `publisher_dashboard_http_requests_total` - Total HTTP requests
- `publisher_dashboard_http_request_duration_seconds` - Request duration
- `publisher_dashboard_queries_total` - Dashboard queries by type
- `publisher_dashboard_query_duration_seconds` - Query duration
- `publisher_dashboard_revenue_total` - Total revenue tracked
- `publisher_dashboard_impressions_total` - Total impressions tracked
- `publisher_dashboard_active_publishers` - Active publishers count
- `publisher_dashboard_cache_hit_rate` - Cache hit rate

## Health Check

```bash
curl http://localhost:5001/health
```

Response:

```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "service": "publisher-dashboard-service",
  "version": "1.0.0",
  "uptime": 3600,
  "checks": {
    "database": "healthy",
    "cache": "healthy"
  }
}
```

## Project Structure

```
publisher-dashboard-service/
├── package.json
├── tsconfig.json
├── README.md
└── src/
    ├── index.ts                 # Main entry point
    ├── config/
    │   └── index.ts             # Configuration
    ├── models/
    │   ├── index.ts
    │   ├── DashboardConfig.ts   # Dashboard configuration model
    │   ├── RevenueAnalytics.ts  # Revenue data model
    │   ├── PerformanceMetric.ts # Performance metrics model
    │   └── TrendData.ts         # Trend data model
    ├── services/
    │   ├── index.ts
    │   ├── dashboardService.ts  # Dashboard business logic
    │   ├── revenueService.ts    # Revenue analytics
    │   ├── performanceService.ts # Performance metrics
    │   ├── trendService.ts      # Trend analysis
    │   └── exportService.ts     # Data export
    ├── middleware/
    │   ├── index.ts
    │   └── auth.ts              # Authentication middleware
    ├── routes/
    │   ├── index.ts
    │   └── dashboard.ts         # API routes
    └── utils/
        ├── logger.ts            # Winston logger
        ├── metrics.ts           # Prometheus metrics
        ├── database.ts          # MongoDB connection
        └── cache.ts             # Redis cache utilities
```

## Error Handling

All errors return a consistent JSON structure:

```json
{
  "success": false,
  "error": "Error Type",
  "message": "Detailed error message"
}
```

## Rate Limiting

Default rate limit: 100 requests per minute per IP.

Rate limit headers are included in responses:
- `X-RateLimit-Limit` - Maximum requests allowed
- `X-RateLimit-Remaining` - Remaining requests
- `X-RateLimit-Reset` - Reset time

## Ecosystem Integration

This service is part of the AdBazaar SSP ecosystem:

```
AdBazaar SSP (Port 4520)
├── SSP Gateway (4521)
├── SSP Inventory (4522)
├── SSP Demand (4523)
├── SSP Analytics (4524)
└── Publisher Dashboard (5001) ← This service
```

## License

Internal - AdBazaar

## Version

1.0.0

## Last Updated

June 7, 2026