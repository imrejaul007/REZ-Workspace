# Partner Performance Service

AdBazaar service for partner performance analytics and reporting.

## Features

- Performance calculation and tracking
- Multi-period metrics (daily, weekly, monthly, quarterly, yearly)
- Report generation (performance, revenue, campaign, ROI)
- Metric recording and benchmarking
- Trend analysis
- Performance scoring and tiering

## API Endpoints

### Performance

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/performance/:partnerId` | Get partner performance |
| POST | `/api/performance/:partnerId/calculate` | Calculate performance |
| GET | `/api/performance/:partnerId/aggregate` | Get aggregate performance |
| GET | `/api/performance/dashboard/summary` | Get dashboard summary |
| GET | `/api/performance/trends/:partnerId` | Get performance trends |

### Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/reports` | Generate report |
| GET | `/api/reports/:id` | Get report |
| GET | `/api/reports/partner/:partnerId` | Get partner reports |
| POST | `/api/reports/:id/deliver` | Mark as delivered |
| DELETE | `/api/reports/:id` | Delete report |

### Metrics

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/metrics` | Record metric |
| GET | `/api/metrics/:id` | Get metric |
| GET | `/api/metrics/partner/:partnerId/latest` | Get latest metrics |
| GET | `/api/metrics/partner/:partnerId/history` | Get metric history |
| GET | `/api/metrics/partner/:partnerId/benchmark/:type` | Get benchmark |
| GET | `/api/metrics/partner/:partnerId/aggregate` | Get aggregate metrics |

## Quick Start

```bash
npm install
npm run dev
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Service port | 5064 |
| MONGODB_URI | MongoDB connection | mongodb://localhost:27017/partner-performance |