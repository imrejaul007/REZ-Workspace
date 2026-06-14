# Customer Health Score Service

Monitor customer health metrics and risk signals for AdBazaar.

## Overview

This service provides comprehensive customer health scoring, tracking engagement, usage, payment, support, and adoption metrics to identify at-risk customers and drive proactive interventions.

## Features

- **Health Score Calculation**: Multi-dimensional scoring (0-100) based on engagement, usage, payment, support, and adoption
- **Risk Level Classification**: Low, Medium, High, Critical risk levels
- **Trend Analysis**: Historical tracking of health score changes
- **Alert Generation**: Automatic alerts for score drops and risk signals
- **Dashboard Analytics**: Aggregate metrics across customer base

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health/:customerId` | Get health score for a customer |
| POST | `/api/health/:customerId/calculate` | Calculate health score |
| GET | `/api/health/:customerId/history` | Get health score history |
| GET | `/api/health` | Get dashboard summary |
| GET | `/api/health/alerts` | Get all alerts |
| POST | `/api/health/alerts/:alertId/acknowledge` | Acknowledge an alert |
| POST | `/api/health/alerts/:alertId/resolve` | Resolve an alert |

## Health Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Full health check |
| GET | `/health/live` | Liveness probe |
| GET | `/health/ready` | Readiness probe |
| GET | `/metrics` | Prometheus metrics |

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run production build
npm run build
npm start
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 5076 | Service port |
| MONGODB_URI | mongodb://localhost:27017/adbazaar_customer_health | MongoDB connection |
| LOG_LEVEL | info | Logging level |
| INTERNAL_SERVICE_TOKENS_JSON | - | Service authentication tokens |

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Customer Health Score Service         │
├─────────────────────────────────────────────────────────┤
│  Routes Layer                                           │
│  ├── health.ts (Customer health endpoints)              │
│  └── alert routes                                      │
├─────────────────────────────────────────────────────────┤
│  Service Layer                                          │
│  ├── healthScoreService.ts (Score calculation)         │
│  └── alertService.ts (Alert management)               │
├─────────────────────────────────────────────────────────┤
│  Model Layer                                            │
│  ├── healthScore.ts (Customer health score)            │
│  ├── metric.ts (Individual metrics)                    │
│  ├── alert.ts (Health alerts)                          │
│  └── history.ts (Historical tracking)                  │
└─────────────────────────────────────────────────────────┘
```

## Score Calculation

The overall health score is calculated using weighted components:

| Component | Weight | Description |
|-----------|--------|-------------|
| Engagement | 25% | Login frequency, feature adoption, session duration |
| Usage | 25% | API calls, campaigns, data volume |
| Payment | 20% | Payment timeliness, invoice settlement |
| Support | 15% | Ticket resolution, NPS, satisfaction |
| Adoption | 15% | Core features, integrations, team activity |

## Risk Levels

| Level | Score Range | Action |
|-------|-------------|--------|
| Low | 80-100 | Standard monitoring |
| Medium | 60-79 | Proactive engagement |
| High | 30-59 | Immediate attention required |
| Critical | 0-29 | Urgent intervention needed |

## Monitoring

Prometheus metrics available at `/metrics`:

- `health_service_customer_health_score` - Current health scores by customer
- `health_service_active_alerts` - Active alert counts by severity
- `health_service_http_request_duration_seconds` - Request latency
- `health_service_calculation_duration_seconds` - Calculation performance

## Port

**Port: 5076**

See also: [AdBazaar Complete Audit](https://github.com/adbazaar/adbazaar/blob/main/ADBAZAAR-COMPLETE-AUDIT.md)