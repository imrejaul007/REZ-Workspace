# Event Demand Forecaster

**Port:** 4885  
**Company:** AdBazaar  
**Purpose:** Event demand prediction and forecasting service

---

## Overview

Event Demand Forecaster is an AI-powered service that predicts demand for events across various categories and locations. It provides accurate demand forecasting, trend analysis, calibration, analytics, and actionable recommendations.

## Features

- **Demand Forecasting** - Predict total and peak demand for events
- **Trend Analysis** - Real-time demand trend tracking
- **Forecast Calibration** - Adjust predictions based on actual data
- **Analytics** - Comprehensive forecast accuracy metrics
- **Recommendations** - AI-driven recommendations for pricing, timing, and marketing

## Quick Start

```bash
# Navigate to service directory
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/AdBazaar/event-demand-forecaster

# Install dependencies
npm install

# Start in development mode
npm run dev

# Health check
curl http://localhost:4885/health

# Metrics
curl http://localhost:4885/metrics
```

## API Endpoints

### Create Forecast
```http
POST /api/forecast
Content-Type: application/json
X-Internal-Token: your-token

{
  "eventName": "Summer Music Festival",
  "category": "concert",
  "location": "Mumbai",
  "startDate": "2026-07-15T00:00:00Z",
  "endDate": "2026-07-17T00:00:00Z",
  "historicalData": {
    "previousDemand": 5000,
    "sameEventLastYear": 4500
  },
  "factors": {
    "promotional": 20,
    "weather": 10
  }
}
```

### Get Forecast
```http
GET /api/forecast/:eventId
```

### Get Demand Trend
```http
GET /api/forecast/:eventId/trend?days=30
```

### Get Analytics
```http
GET /api/forecast/:eventId/analytics
```

### Get Category Forecasts
```http
GET /api/forecast/category/concert?status=active
```

### Get Location Forecasts
```http
GET /api/forecast/location/Mumbai?status=active
```

### Calibrate Forecast
```http
POST /api/forecast/:eventId/calibrate
Content-Type: application/json

{
  "adjustments": [
    {
      "factor": "promotional",
      "original": 1.0,
      "value": 1.2,
      "reason": "Strong social media response"
    }
  ],
  "method": "manual",
  "source": {
    "type": "real_time",
    "details": "Based on early ticket sales"
  }
}
```

### Get Recommendations
```http
GET /api/forecast/recommendations/:eventId
```

### Get Dashboard
```http
GET /api/forecast/dashboard
```

## Event Categories

- `concert` - Music concerts
- `sports` - Sporting events
- `conference` - Business conferences
- `exhibition` - Trade shows/exhibitions
- `festival` - Cultural festivals
- `corporate` - Corporate events
- `wedding` - Wedding events
- `social` - Social gatherings
- `political` - Political events
- `religious` - Religious events
- `other` - Other events

## Data Models

### Forecast
```typescript
{
  eventId: string;
  eventName: string;
  category: string;
  location: string;
  startDate: Date;
  endDate: Date;
  predicted: {
    totalDemand: number;
    peakDemand: number;
    peakDate: Date;
    daily: Array<{
      date: Date;
      predicted: number;
      lowerBound: number;
      upperBound: number;
      confidence: number;
    }>;
  };
  confidence: {
    score: number;
    level: 'low' | 'medium' | 'high';
    factors: string[];
  };
  factors: {
    historical: number;
    seasonal: number;
    promotional: number;
    weather: number;
    economic: number;
    social: number;
    location: number;
    competitor: number;
  };
  status: 'pending' | 'active' | 'calibrated' | 'completed' | 'expired';
}
```

### Demand Trend
```typescript
{
  eventId: string;
  date: Date;
  demand: {
    actual: number;
    predicted: number;
    variance: number;
    variancePercent: number;
  };
  trend: {
    direction: 'increasing' | 'decreasing' | 'stable' | 'volatile';
    velocity: number;
    momentum: number;
  };
  signals: {
    social: number;
    search: number;
    ticket: number;
    weather: number;
    competitor: number;
  };
}
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 4885 | Service port |
| `NODE_ENV` | development | Environment |
| `MONGODB_URI` | mongodb://localhost:27017/event-demand-forecaster | MongoDB URI |
| `REDIS_HOST` | localhost | Redis host |
| `REDIS_PORT` | 6379 | Redis port |
| `INTERNAL_SERVICE_TOKEN` | - | Internal service auth token |
| `LOG_LEVEL` | info | Logging level |

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Event Demand Forecaster               │
├─────────────────────────────────────────────────────────┤
│  Routes Layer                                           │
│  ├── POST /api/forecast         (Create forecast)       │
│  ├── GET /api/forecast/:id      (Get forecast)          │
│  ├── GET /api/forecast/:id/trend (Get trend)           │
│  ├── GET /api/forecast/:id/analytics (Get analytics)    │
│  ├── GET /api/forecast/category/:cat (Category)        │
│  ├── GET /api/forecast/location/:loc (Location)        │
│  ├── POST /api/forecast/:id/calibrate (Calibrate)      │
│  ├── GET /api/forecast/recommendations/:id             │
│  └── GET /api/forecast/dashboard                       │
├─────────────────────────────────────────────────────────┤
│  Services Layer                                         │
│  ├── forecastService        (Demand prediction)        │
│  ├── trendService           (Trend analysis)           │
│  ├── calibrationService     (Forecast calibration)     │
│  ├── analyticsService       (Forecast analytics)       │
│  └── recommendationService  (AI recommendations)       │
├─────────────────────────────────────────────────────────┤
│  Models Layer                                           │
│  ├── Forecast              (Mongoose schema)            │
│  ├── DemandTrend           (Mongoose schema)           │
│  ├── ForecastAnalytics     (Mongoose schema)           │
│  └── Calibration           (Mongoose schema)           │
├─────────────────────────────────────────────────────────┤
│  Infrastructure                                         │
│  ├── MongoDB              (Primary database)           │
│  ├── Redis                (Caching)                     │
│  ├── Prometheus           (Metrics)                    │
│  └── Winston              (Logging)                    │
└─────────────────────────────────────────────────────────┘
```

## Confidence Levels

| Level | Score Range | Description |
|-------|-------------|-------------|
| High | 0.75 - 0.95 | Strong historical data and signals |
| Medium | 0.50 - 0.74 | Moderate data availability |
| Low | 0.00 - 0.49 | Limited data, high uncertainty |

## Factors

The forecast considers multiple factors:

- **Historical** - Previous event data
- **Seasonal** - Time of year patterns
- **Promotional** - Marketing campaigns
- **Weather** - Weather conditions
- **Economic** - Economic indicators
- **Social** - Social media signals
- **Location** - City tier (Tier 1/2/3)
- **Competitor** - Competing events

## Recommendations

The service generates AI-powered recommendations across:

- **Pricing** - Dynamic pricing strategies
- **Timing** - Optimal launch and campaign timing
- **Marketing** - Marketing channel optimization
- **Inventory** - Capacity planning
- **General** - Overall strategy improvements

## Metrics

Prometheus metrics available at `/metrics`:

- `event_demand_forecaster_http_request_duration_seconds`
- `event_demand_forecaster_requests_total`
- `event_demand_forecaster_accuracy`
- `event_demand_forecaster_predictions`
- `event_demand_forecaster_cache_operations_total`
- `event_demand_forecaster_calibrations_total`
- `event_demand_forecaster_active_forecasts`
- `event_demand_forecaster_db_operation_duration_seconds`

## Integration

### With AdBazaar Services
```typescript
const response = await axios.post('http://localhost:4885/api/forecast', {
  eventName: 'Product Launch',
  category: 'corporate',
  location: 'Bangalore',
  startDate: '2026-08-01T00:00:00Z',
  endDate: '2026-08-01T00:00:00Z'
}, {
  headers: {
    'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN
  }
});
```

### With HOJAI AI
The service integrates with HOJAI for advanced AI recommendations.

## License

Proprietary - AdBazaar