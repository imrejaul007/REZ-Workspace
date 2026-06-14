# Retail Analytics Dashboard

**Version:** 1.0.0
**Port:** 4995
**Company:** AdBazaar
**Purpose:** Retail media analytics and insights

## Overview

The Retail Analytics Dashboard provides comprehensive retail media analytics for AdBazaar. It enables tracking of sales lift, campaign performance, trend analysis, and attribution across multiple retailers.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  RETAIL ANALYTICS DASHBOARD                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ Dashboard   │  │ Sales Lift  │  │ Performance│         │
│  │ Service     │  │ Service     │  │ Service     │         │
│  │ (4995)     │  │             │  │             │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐                           │
│  │ Trend       │  │ Export      │                           │
│  │ Service     │  │ Service     │                           │
│  │             │  │             │                           │
│  └─────────────┘  └─────────────┘                           │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  MongoDB  │  Redis  │  Prometheus  │  Winston Logger  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Features

### Dashboard Overview
- Total campaigns and active campaigns count
- Revenue and impressions tracking
- Average sales lift metrics
- ROI calculations
- Top performing campaigns
- Recent activity feed
- Alert system for underperforming campaigns

### Sales Lift Analytics
- Campaign sales lift measurement
- Baseline vs actual comparison
- Statistical significance validation
- Confidence intervals
- Breakdown by retailer and category
- Trend analysis over time

### Performance Metrics
- Multi-channel performance tracking (DOOH, digital, physical)
- Impression, conversion, engagement, ROI, and reach metrics
- Period-over-period comparison
- Source-based breakdown
- Hourly performance patterns

### Trend Analysis
- Trend direction detection (upward, downward, stable, volatile)
- Seasonality pattern recognition
- Forecasting (7, 14, 30 days)
- Anomaly detection
- Correlation analysis

### Attribution
- Multi-touch attribution models
- Channel attribution weights
- First-touch, last-touch, linear, time-decay, position-based models
- Attribution accuracy tracking

### Export
- CSV, JSON, XLSX, PDF formats
- Selective data export
- Configurable date ranges
- Batch processing support

## API Endpoints

### Health & Metrics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Service health check |
| GET | `/metrics` | Prometheus metrics |

### Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/overview` | Dashboard overview |
| GET | `/api/dashboard/campaigns` | Campaign overview |
| GET | `/api/dashboard/retailers` | Retailer overview |

### Sales Lift

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sales-lift` | Sales lift metrics |
| GET | `/api/sales-lift/by-retailer` | Breakdown by retailer |
| GET | `/api/sales-lift/by-category` | Breakdown by category |
| GET | `/api/sales-lift/trends` | Sales lift trends |

### Performance

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/performance` | Performance metrics |
| GET | `/api/performance/by-source` | Performance by source |
| GET | `/api/performance/hourly/:retailerId` | Hourly breakdown |

### Trends

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/trends` | Trend analysis |
| GET | `/api/trends/forecast` | Forecasting |
| GET | `/api/trends/seasonality` | Seasonality patterns |
| GET | `/api/trends/anomalies` | Anomaly detection |

### Attribution

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/attribution` | Attribution data |

### Export

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/export` | Data export |

## Query Parameters

### Common Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| retailerId | string | Filter by retailer ID |
| campaignId | string | Filter by campaign ID |
| startDate | ISO date | Start of date range |
| endDate | ISO date | End of date range |
| limit | number | Maximum records to return |

### Sales Lift Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| category | string | Filter by product category |
| period | daily/weekly/monthly | Aggregation period |

### Performance Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| metricType | string | Filter by metric type |
| source | string | Filter by source |
| granularity | string | Data granularity |

### Trend Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| metricName | string | Metric to analyze |
| horizon | number | Forecast horizon (7/14/30) |
| category | string | Product category |

### Export Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| type | string | Data type to export |
| format | string | Export format (csv/json/xlsx/pdf) |

## Data Models

### SalesLiftMetric
```typescript
{
  date: Date;
  campaignId: string;
  campaignName: string;
  retailerId: string;
  retailerName: string;
  category: string;
  baseline: number;
  actual: number;
  lift: number;
  liftPercentage: number;
  confidence: number;
  statisticalSignificance: boolean;
}
```

### PerformanceMetric
```typescript
{
  date: Date;
  metricType: 'impression' | 'conversion' | 'engagement' | 'roi' | 'reach';
  retailerId: string;
  retailerName: string;
  metrics: {
    value: number;
    previousValue?: number;
    change?: number;
    changePercentage?: number;
  };
  source: 'dooh' | 'digital' | 'physical' | 'mixed';
}
```

### TrendAnalysis
```typescript
{
  metricName: string;
  retailerId: string;
  trend: 'upward' | 'downward' | 'stable' | 'volatile';
  trendStrength: number;
  seasonality: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  forecast: {
    next7Days: TrendPoint[];
    next30Days: TrendPoint[];
    confidence: number;
  };
}
```

## Authentication

All API endpoints require internal service authentication using the `X-Internal-Token` header.

```bash
curl -H "X-Internal-Token: your-token" http://localhost:4995/api/dashboard/overview
```

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Environment Variables

| Variable | Default | Description |
|-----------|---------|-------------|
| PORT | 4995 | Server port |
| NODE_ENV | development | Environment |
| MONGODB_URI | mongodb://localhost:27017/retail_analytics_dashboard | MongoDB connection |
| REDIS_HOST | localhost | Redis host |
| REDIS_PORT | 6379 | Redis port |
| INTERNAL_SERVICE_TOKEN | dev-token | Internal auth token |
| LOG_LEVEL | info | Logging level |

## Monitoring

### Prometheus Metrics
- `retail_analytics_http_requests_total` - HTTP request count
- `retail_analytics_http_request_duration_seconds` - Request duration
- `retail_analytics_dashboard_queries_total` - Dashboard queries
- `retail_analytics_sales_lift_queries_total` - Sales lift queries
- `retail_analytics_performance_metrics` - Performance gauge
- `retail_analytics_active_campaigns` - Active campaigns gauge
- `retail_analytics_retailers_tracked` - Retailer count gauge
- `retail_analytics_cache_hits_total` - Cache hits
- `retail_analytics_export_requests_total` - Export requests

### Health Check
```bash
curl http://localhost:4995/health
```

## Error Handling

All errors return a consistent JSON structure:

```json
{
  "success": false,
  "error": "Error message",
  "timestamp": "2026-06-07T00:00:00.000Z"
}
```

## Caching

Redis caching is used for:
- Dashboard overview data (5 minutes)
- Campaign lists (5 minutes)
- Retailer data (5 minutes)
- Trend analysis (5 minutes)
- Forecasts (10 minutes)

## Logging

Winston logging with:
- Console output (colorized in development)
- File output (error.log, combined.log)
- JSON format in production
- Request/response logging
- Error stack traces

## Dependencies

- **express**: Web framework
- **mongoose**: MongoDB ODM
- **redis**: Redis client
- **winston**: Logging
- **prom-client**: Prometheus metrics
- **zod**: Validation
- **axios**: HTTP client
- **uuid**: ID generation

## Ecosystem Integration

| Service | Connection | Purpose |
|---------|------------|---------|
| AdBazaar API | Internal | Campaign data |
| Intent Graph | Internal | AI insights |
| HOJAI Brain | Internal | Intelligence |
| RABTUL Auth | Internal | Service authentication |

## License

Proprietary - AdBazaar