# Pace Management Service

**AdBazaar Pace Management Service** - Campaign pacing control and optimization for advertising campaigns.

## Overview

The Pace Management Service provides intelligent campaign budget pacing control, ensuring optimal spend distribution across campaign durations. It helps advertisers avoid early budget exhaustion or under-spending by dynamically adjusting campaign pacing based on real-time performance data.

## Features

- **Campaign Pacing Configuration** - Set pacing strategy and budget allocation
- **Real-time Status Tracking** - Monitor campaign spend and pace percentage
- **Pacing Optimization** - Automatic adjustment recommendations
- **Forecasting** - Predictive spend analysis with confidence scores
- **Alert Management** - Configurable alerts for budget and pace thresholds
- **Dashboard** - Real-time overview of all campaign pacing

## Tech Stack

- **Runtime:** Node.js with TypeScript
- **Framework:** Express.js
- **Database:** MongoDB (Mongoose ODM)
- **Cache:** Redis
- **Logging:** Winston
- **Metrics:** Prometheus (prom-client)
- **Validation:** Zod

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB 6+
- Redis 7+

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start the service
npm run dev
```

### Configuration

Create a `.env` file with the following variables:

```env
# Server
PORT=4983
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/pace_management

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Internal Service Auth
INTERNAL_SERVICE_TOKEN=your-internal-service-token-here
```

### Development

```bash
# Run in development mode with hot reload
npm run dev

# Build for production
npm run build

# Run production build
npm start
```

## API Reference

### Health Check

```bash
GET /health
```

Returns service health status including MongoDB and Redis connection states.

### Pacing Management

#### Create Campaign Pacing

```bash
POST /api/pace/campaigns
X-Internal-Token: <token>

{
  "campaignId": "camp-123",
  "strategy": "even",
  "totalBudget": 10000,
  "dailyBudget": 333.33,
  "startDate": "2024-01-01T00:00:00Z",
  "endDate": "2024-01-30T23:59:59Z"
}
```

#### Get Campaign Pacing

```bash
GET /api/pace/campaigns/:id
X-Internal-Token: <token>
```

#### List All Pacing Configurations

```bash
GET /api/pace/campaigns?page=1&limit=20&sortBy=createdAt&sortOrder=desc
X-Internal-Token: <token>
```

#### Update Pacing

```bash
PUT /api/pace/campaigns/:id
X-Internal-Token: <token>

{
  "dailyBudget": 400,
  "strategy": "accelerated"
}
```

#### Delete Pacing

```bash
DELETE /api/pace/campaigns/:id
X-Internal-Token: <token>
```

### Pacing Status

#### Get Pacing Status

```bash
GET /api/pace/campaigns/:id/status
X-Internal-Token: <token>
```

#### Update Pacing Status

```bash
PUT /api/pace/campaigns/:id/status
X-Internal-Token: <token>

{
  "spent": 1500,
  "impressions": 50000,
  "clicks": 1200,
  "conversions": 50
}
```

### Optimization

#### Optimize Campaign

```bash
POST /api/pace/campaigns/:id/optimize
X-Internal-Token: <token>

{
  "targetPace": 95,
  "adjustmentType": "budget",
  "reason": "Campaign is behind schedule"
}
```

#### Get Recommendations

```bash
GET /api/pace/campaigns/:id/recommendations
X-Internal-Token: <token>
```

### Forecasting

#### Get Forecast

```bash
GET /api/pace/campaigns/:id/forecast?forecastDays=7
X-Internal-Token: <token>
```

### Alerts

#### Create Alert

```bash
POST /api/pace/alerts
X-Internal-Token: <token>

{
  "campaignId": "camp-123",
  "alertType": "pace_deviation",
  "threshold": 15,
  "severity": "warning",
  "notificationChannels": ["email", "push"]
}
```

#### List Alerts

```bash
GET /api/pace/alerts?campaignId=camp-123
GET /api/pace/alerts?severity=critical
X-Internal-Token: <token>
```

#### Toggle Alert

```bash
POST /api/pace/alerts/:id/toggle
X-Internal-Token: <token>

{ "enabled": false }
```

### Dashboard

```bash
GET /api/pace/dashboard
X-Internal-Token: <token>
```

### Auto-Optimization

```bash
POST /api/pace/auto-optimize
X-Internal-Token: <token>
```

### Bulk Operations

```bash
POST /api/pace/campaigns/bulk
X-Internal-Token: <token>

{
  "campaigns": [
    {
      "campaignId": "camp-1",
      "strategy": "even",
      "totalBudget": 5000,
      "dailyBudget": 166.67,
      "startDate": "2024-01-01T00:00:00Z",
      "endDate": "2024-01-30T23:59:59Z"
    },
    {
      "campaignId": "camp-2",
      "strategy": "front_loaded",
      "totalBudget": 8000,
      "dailyBudget": 266.67,
      "startDate": "2024-01-01T00:00:00Z",
      "endDate": "2024-01-30T23:59:59Z"
    }
  ]
}
```

### Metrics

```bash
GET /metrics
```

Prometheus-formatted metrics for monitoring.

## Pacing Strategies

| Strategy | Description |
|----------|-------------|
| `even` | Even distribution across campaign duration |
| `accelerated` | Spend faster to meet early targets |
| `front_loaded` | Higher spend at campaign start |
| `back_loaded` | Higher spend at campaign end |
| `aggressive` | Rapid budget consumption |
| `conservative` | Slow, steady spend throughout |
| `custom` | User-defined schedule |

## Alert Types

| Type | Description |
|------|-------------|
| `daily_budget` | Triggers when daily spend threshold reached |
| `total_budget` | Triggers when total spend threshold reached |
| `pace_deviation` | Triggers when pace deviates from target |
| `spend_rate` | Triggers when spend rate exceeds threshold |

## Alert Severities

| Severity | Description |
|----------|-------------|
| `info` | Informational alert |
| `warning` | Warning - attention needed |
| `critical` | Critical - immediate action required |

## Pacing Status Types

| Status | Description |
|--------|-------------|
| `on_track` | Spending is on target |
| `ahead` | Spending faster than expected |
| `behind` | Spending slower than expected |
| `exhausted` | Budget fully spent |
| `paused` | Campaign is paused |

## Data Models

### CampaignPacing

```typescript
{
  campaignId: string;
  strategy: PacingStrategy;
  totalBudget: number;
  dailyBudget: number;
  hourlyBudget?: number;
  startDate: Date;
  endDate: Date;
  targetImpressions?: number;
  targetClicks?: number;
  targetConversions?: number;
  isActive: boolean;
  customSchedule?: Record<string, number>;
}
```

### PacingStatus

```typescript
{
  campaignId: string;
  date: Date;
  spent: number;
  remaining: number;
  pacePercentage: number;
  projectedSpend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cpc: number;
  cpm: number;
  status: PacingStatusEnum;
  hourlyData: IHourlyData[];
}
```

### PacingAlert

```typescript
{
  campaignId: string;
  alertType: AlertThreshold;
  threshold: number;
  currentValue: number;
  severity: AlertSeverity;
  message: string;
  isTriggered: boolean;
  lastTriggered?: Date;
  notificationChannels: string[];
  isEnabled: boolean;
}
```

### PacingForecast

```typescript
{
  campaignId: string;
  date: Date;
  projectedSpend: number;
  projectedImpressions: number;
  projectedClicks: number;
  projectedConversions: number;
  confidence: number;
  confidenceLabel: string;
  factors: IForecastFactor[];
  projectedEndDate?: Date;
  budgetExhaustionDate?: Date;
  daysToCompletion?: number;
}
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 4983 | Service port |
| `NODE_ENV` | development | Environment mode |
| `MONGODB_URI` | mongodb://localhost:27017/pace_management | MongoDB connection URI |
| `REDIS_HOST` | localhost | Redis host |
| `REDIS_PORT` | 6379 | Redis port |
| `INTERNAL_SERVICE_TOKEN` | - | Internal service authentication token |
| `LOG_LEVEL` | info | Logging level |

## Monitoring

### Prometheus Metrics

The service exposes Prometheus metrics at `/metrics`:

- `pace_campaigns_total` - Total campaigns with pacing
- `pace_campaigns_active` - Active campaigns
- `pace_budget_total` - Total budget
- `pace_budget_spent` - Total spent
- `pace_status_distribution` - Campaign status distribution
- `pace_percentage` - Current pace percentage
- `pace_alerts_total` - Total alerts triggered
- `pace_optimization_requests_total` - Optimization requests
- `pace_api_request_duration_seconds` - API latency histogram

### Logging

Logs are written to:
- `logs/error.log` - Error logs
- `logs/combined.log` - All logs
- `logs/pacing.log` - Pacing-specific logs

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Express Server (Port 4983)                │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Pacing     │  │   Status     │  │   Alert     │     │
│  │  Routes     │  │   Routes     │  │   Routes    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Forecast   │  │ Optimization │  │  Dashboard   │     │
│  │  Routes     │  │   Routes     │  │   Routes     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
├─────────────────────────────────────────────────────────────┤
│                      Service Layer                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│  │ Pacing   │ │ Status   │ │Forecast  │ │  Alert   │     │
│  │Service   │ │Service   │ │Service   │ │ Service  │     │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘     │
│  ┌──────────────────────────┐ ┌────────────────────────┐  │
│  │     Optimization         │ │      Redis Client      │  │
│  │        Service           │ │                        │  │
│  └──────────────────────────┘ └────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                       Data Layer                            │
│  ┌──────────────┐              ┌──────────────┐          │
│  │    MongoDB   │              │     Redis    │          │
│  │  (Mongoose) │              │   (Cache)     │          │
│  └──────────────┘              └──────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

## Integration

### Internal Service Auth

All API endpoints require the `X-Internal-Token` header for inter-service communication.

```bash
curl -H "X-Internal-Token: your-token" http://localhost:4983/api/pace/campaigns
```

### Notification Service Integration

Alerts can be sent to configured notification channels:
- Email
- Push notifications
- SMS
- Webhooks
- Slack

### Campaign Service Integration

The optimization service can notify the campaign service of bid adjustments.

## License

MIT