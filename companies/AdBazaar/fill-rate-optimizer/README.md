# Fill Rate Optimizer - AdBazaar

**Port:** 4981  
**Company:** AdBazaar  
**Purpose:** Maximize ad fill rate across all inventory

## Overview

The Fill Rate Optimizer is a comprehensive service that monitors, analyzes, and optimizes ad fill rates across AdBazaar's inventory. It provides real-time insights, predictive forecasting, and actionable recommendations to maximize revenue from available inventory.

## Features

### Core Functionality
- **Real-time Fill Rate Monitoring** - Track current fill rates across all inventory
- **Historical Analysis** - View fill rate trends over time with various granularities
- **Multi-dimensional Analysis** - Analyze fill rates by inventory, demand source, time period
- **Predictive Forecasting** - Forecast future fill rates with confidence intervals
- **Smart Optimization** - Generate actionable recommendations to improve fill rates
- **Alert Management** - Set up customizable alerts for fill rate thresholds

### Analytics
- Fill rate by inventory with trend analysis
- Fill rate by demand source breakdown
- Comparison across multiple inventories
- Time-series analysis with hourly, daily, weekly, monthly views

### Forecasting
- 24-hour fill rate predictions
- Confidence scoring based on historical patterns
- Factor analysis (day of week, time of day patterns)
- Forecast accuracy tracking

### Alerts
- Configurable threshold alerts (above/below/equals)
- Multi-channel notifications (email, webhook, Slack, SMS)
- Alert history and statistics

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Fill Rate Optimizer                       │
│                        (Port 4981)                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │   FillRate  │  │  Analysis  │  │Optimization │          │
│  │  Service   │  │  Service   │  │  Service   │          │
│  │            │  │ │  │            │          │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘          │
│         │                │                │                 │
│  ┌──────┴────────────────┴────────────────┴──────┐          │
│  │              Data Layer                       │          │
│  │  MongoDB (FillRate, Analysis, Alert, Forecast)│          │
│  │  Redis (Caching)                             │          │
│  └──────────────────────────────────────────────┘          │
│                                                              │
│  ┌──────────────────────────────────────────────┐          │
│  │         Prometheus Metrics (Port 4981/metrics)│          │
│  └──────────────────────────────────────────────┘          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## API Endpoints

### Health & Monitoring
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/metrics` | Prometheus metrics |
| GET | `/ready` | Readiness check |

### Fill Rate Data
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/fill-rate/current` | Get current fill rate |
| GET | `/api/fill-rate/summary` | Get fill rate summary with comparison |
| GET | `/api/fill-rate/history` | Get fill rate history |
| POST | `/api/fill-rate/record` | Record new fill rate data |

### Analysis
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/fill-rate/analysis` | Get fill rate analysis |
| GET | `/api/fill-rate/recommendations` | Get optimization recommendations |
| GET | `/api/fill-rate/compare` | Compare multiple inventories |

### Inventory & Demand
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/fill-rate/by-inventory` | Fill rate by inventory |
| GET | `/api/fill-rate/by-demand` | Fill rate by demand source |

### Optimization
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/fill-rate/optimize` | Generate optimization plan |

### Forecasting
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/fill-rate/forecast` | Generate fill rate forecast |
| GET | `/api/fill-rate/forecast/accuracy` | Get forecast accuracy metrics |
| GET | `/api/fill-rate/forecast/compare` | Compare forecast vs actual |

### Alerts
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/fill-rate/alerts` | Create new alert |
| GET | `/api/fill-rate/alerts` | List all alerts |
| GET | `/api/fill-rate/alerts/:id` | Get single alert |
| PUT | `/api/fill-rate/alerts/:id` | Update alert |
| DELETE | `/api/fill-rate/alerts/:id` | Delete alert |
| GET | `/api/fill-rate/alerts/stats` | Get alert statistics |
| POST | `/api/fill-rate/alerts/check` | Manually trigger alert check |

## Data Models

### FillRate
```typescript
{
  date: Date;
  inventoryId: string;
  inventoryName?: string;
  impressions: number;
  filled: number;
  rate: number;
  requestId?: string;
  metadata?: Record<string, any>;
}
```

### FillAnalysis
```typescript
{
  inventoryId: string;
  analysisDate: Date;
  factors: {
    name: string;
    impact: number;
    description: string;
    category: 'demand' | 'supply' | 'technical' | 'pricing';
  }[];
  recommendations: {
    priority: 'high' | 'medium' | 'low';
    action: string;
    expectedImpact: number;
    implementation: string;
  }[];
  metrics: {
    avgFillRate: number;
    minFillRate: number;
    maxFillRate: number;
    totalImpressions: number;
    totalFilled: number;
    fillRateVariance: number;
  };
}
```

### FillAlert
```typescript
{
  inventoryId?: string;
  threshold: number;
  condition: 'above' | 'below' | 'equals';
  notification: {
    email?: string;
    webhook?: string;
    slack?: string;
    sms?: string;
  };
  status: 'active' | 'paused' | 'triggered' | 'disabled';
  triggeredCount: number;
  createdBy: string;
}
```

### FillForecast
```typescript
{
  date: Date;
  inventoryId?: string;
  predicted: number;
  confidence: number;
  factors: {
    name: string;
    weight: number;
    direction: 'positive' | 'negative' | 'neutral';
  }[];
  model: string;
  horizon: number;
  actual?: number;
  error?: number;
}
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 4981 | Service port |
| MONGODB_URI | mongodb://localhost:27017/fill-rate-optimizer | MongoDB connection |
| REDIS_URL | redis://localhost:6379 | Redis connection |
| INTERNAL_SERVICE_TOKEN | fill-rate-optimizer-secret | Internal API authentication |
| LOG_LEVEL | info | Logging level |
| NODE_ENV | development | Environment |

## Quick Start

```bash
# Install dependencies
cd fill-rate-optimizer
npm install

# Start development server
npm run dev

# Start production server
npm run build
npm start
```

## Health Checks

```bash
# Health check
curl http://localhost:4981/health

# Prometheus metrics
curl http://localhost:4981/metrics

# Current fill rate
curl http://localhost:4981/api/fill-rate/current

# Fill rate by inventory
curl http://localhost:4981/api/fill-rate/by-inventory
```

## Example Usage

### Record Fill Rate Data
```bash
curl -X POST http://localhost:4981/api/fill-rate/record \
  -H "Content-Type: application/json" \
  -d '{
    "inventoryId": "inv-123",
    "inventoryName": "Homepage Banner",
    "impressions": 10000,
    "filled": 8500,
    "metadata": {
      "source": "dsp-a",
      "revenue": 25.50
    }
  }'
```

### Create Alert
```bash
curl -X POST http://localhost:4981/api/fill-rate/alerts \
  -H "Content-Type: application/json" \
  -d '{
    "inventoryId": "inv-123",
    "threshold": 70,
    "condition": "below",
    "notification": {
      "webhook": "https://hooks.example.com/alerts"
    },
    "createdBy": "admin@example.com"
  }'
```

### Generate Forecast
```bash
curl "http://localhost:4981/api/fill-rate/forecast?inventoryId=inv-123&horizon=24"
```

### Optimize Fill Rate
```bash
curl -X POST http://localhost:4981/api/fill-rate/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "inventoryId": "inv-123",
    "targetRate": 85,
    "strategy": "moderate"
  }'
```

## Prometheus Metrics

| Metric | Type | Description |
|--------|------|-------------|
| fill_rate_http_request_duration_seconds | Histogram | HTTP request duration |
| fill_rate_current | Gauge | Current fill rate by inventory |
| fill_rate_distribution | Histogram | Fill rate distribution |
| fill_rate_impressions_total | Counter | Total impressions |
| fill_rate_trend | Gauge | Fill rate trend |
| fill_rate_optimizations_total | Counter | Total optimizations |
| fill_rate_alerts_total | Counter | Total alerts triggered |
| fill_rate_forecast_accuracy | Gauge | Forecast accuracy |

## Integration

The service integrates with:
- **MongoDB** - Data persistence
- **Redis** - Caching layer
- **Prometheus** - Metrics collection
- **Winston** - Structured logging

## Error Handling

All API responses follow this format:
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

Error responses:
```json
{
  "success": false,
  "error": "Error message",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## License

Internal use only - AdBazaar