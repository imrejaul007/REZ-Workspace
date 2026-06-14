# Cross-Platform Reporting Service

Unified reporting service across all AdBazaar channels.

## Features

- **Unified Reporting**: Generate reports from multiple data sources
- **Multi-Format Export**: Export reports as JSON, CSV, PDF, or Excel
- **Scheduled Reports**: Automate report generation with scheduling
- **Metric Tracking**: Track and calculate various metrics
- **Source Integration**: Connect to ads, DOOH, creators, campaigns data

## Quick Start

```bash
cd cross-platform-reporting-service
npm install
npm run dev
```

## API Endpoints

### Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports/overview` | Get overview of all reporting data |
| GET | `/api/reports/:source` | Get report for specific source |
| POST | `/api/reports/generate` | Generate a new report |
| GET | `/api/reports/:id` | Get report by ID |
| GET | `/api/reports/export/:id` | Export report |

### Sources

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sources` | List all sources |
| POST | `/api/sources` | Create a new source |
| GET | `/api/sources/:id` | Get source by ID |
| PUT | `/api/sources/:id` | Update source |
| DELETE | `/api/sources/:id` | Delete source |
| POST | `/api/sources/:id/sync` | Sync source data |

### Metrics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/metrics` | List all metrics |
| POST | `/api/metrics` | Create a new metric |
| GET | `/api/metrics/:id` | Get metric by ID |
| PUT | `/api/metrics/:id` | Update metric |
| DELETE | `/api/metrics/:id` | Delete metric |
| POST | `/api/metrics/:key/calculate` | Calculate metric value |

### Schedules

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/schedules` | List all schedules |
| POST | `/api/schedules` | Create a new schedule |
| GET | `/api/schedules/due` | Get due schedules |
| GET | `/api/schedules/:id` | Get schedule by ID |
| PUT | `/api/schedules/:id` | Update schedule |
| DELETE | `/api/schedules/:id` | Delete schedule |
| POST | `/api/schedules/:id/execute` | Execute schedule |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 5088 |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/adbazaar-reporting |
| LOG_LEVEL | Log level | info |

## Authentication

All API endpoints require authentication via the `x-api-key` header:

```bash
curl -H "x-api-key: your-api-key" http://localhost:5088/api/reports/overview
```

Optional headers:
- `x-user-id`: User identifier
- `x-organization-id`: Organization identifier

## Health Check

```bash
curl http://localhost:5088/health
```

## Metrics

Prometheus metrics available at:
```bash
curl http://localhost:5088/metrics
```