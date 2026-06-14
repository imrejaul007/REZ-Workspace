# Multivariate Testing Service

Full multivariate testing capabilities for AdBazaar campaigns.

## Features

- A/B and multivariate testing
- Traffic allocation and bucketing
- Statistical significance calculation
- Real-time metrics tracking
- Variant performance comparison

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/tests | Create a new test |
| GET | /api/tests/:id | Get test by ID |
| PUT | /api/tests/:id | Update test |
| POST | /api/tests/:id/start | Start test |
| POST | /api/tests/:id/pause | Pause test |
| POST | /api/tests/:id/complete | Complete test |
| GET | /api/tests/:id/results | Get test results |
| POST | /api/tests/:id/impression | Track impression |
| POST | /api/tests/:id/conversion | Track conversion |
| DELETE | /api/tests/:id | Archive test |

## Quick Start

```bash
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/AdBazaar/multivariate-testing-service
npm install
npm run dev
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 5093 | Service port |
| MONGODB_URI | mongodb://localhost:27017/multivariate-testing | MongoDB connection |
| AUTH_SERVICE_URL | http://localhost:4002 | RABTUL Auth service |
| INTERNAL_SERVICE_TOKEN | - | Internal service token |

## Test Types

- **A/B Testing**: Compare two variants
- **Multivariate Testing**: Test multiple combinations
- **Multi-Armed Bandit**: Self-optimizing variant selection

## Metrics Tracked

- Impressions
- Conversions
- Revenue
- Click-through rate
- Conversion rate
- Statistical significance
