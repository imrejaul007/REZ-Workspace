# Experiment Tracking Service

Centralized experiment tracking for AdBazaar campaigns and features.

## Features

- Multi-type experiments (A/B, multivariate, feature flags, canary, champion-challenger)
- Deterministic user bucketing
- Variant-level analytics
- Guardrail monitoring
- Conversion tracking

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/experiments | Create experiment |
| GET | /api/experiments | List experiments |
| GET | /api/experiments/:id | Get experiment |
| POST | /api/experiments/:id/activate | Activate experiment |
| POST | /api/experiments/:id/pause | Pause experiment |
| POST | /api/experiments/:id/complete | Complete experiment |
| POST | /api/experiments/:id/enroll | Enroll user |
| POST | /api/experiments/:id/convert | Record conversion |
| POST | /api/experiments/:id/metric | Record metric |
| GET | /api/experiments/:id/analytics | Get analytics |
| DELETE | /api/experiments/:id | Archive experiment |

## Quick Start

```bash
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/AdBazaar/experiment-tracking-service
npm install
npm run dev
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 5094 | Service port |
| MONGODB_URI | mongodb://localhost:27017/experiment-tracking | MongoDB connection |