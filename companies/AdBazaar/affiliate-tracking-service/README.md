# Affiliate Tracking Service

AdBazaar service for tracking affiliate conversions and commissions.

## Features

- Affiliate registration and management
- Conversion tracking (CPA, Rev Share, Hybrid)
- Commission calculation and management
- Real-time analytics
- Payment tracking

## API Endpoints

### Affiliates

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/affiliates` | Create new affiliate |
| GET | `/api/affiliates` | List all affiliates |
| GET | `/api/affiliates/:id` | Get affiliate by ID |
| PUT | `/api/affiliates/:id` | Update affiliate |
| PATCH | `/api/affiliates/:id/status` | Update affiliate status |
| GET | `/api/affiliates/:id/commissions` | Get affiliate commissions |
| GET | `/api/affiliates/:id/analytics` | Get affiliate analytics |

### Conversions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/conversions` | Create new conversion |
| GET | `/api/conversions` | List conversions |
| GET | `/api/conversions/:id` | Get conversion by ID |
| PATCH | `/api/conversions/:id/status` | Update conversion status |
| POST | `/api/conversions/bulk-approve` | Bulk approve conversions |
| GET | `/api/conversions/stats/summary` | Get conversion statistics |

### Commissions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/commissions` | Create commission |
| GET | `/api/commissions/:id` | Get commission by ID |
| POST | `/api/commissions/auto-generate` | Auto-generate commission |
| GET | `/api/commissions/summary/:affiliateId` | Get commission summary |

## Quick Start

```bash
# Install dependencies
npm install

# Run in development
npm run dev

# Run in production
npm run build
npm start
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Service port | 5060 |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/affiliate-tracking |
| LOG_LEVEL | Log level | info |
| INTERNAL_SERVICE_TOKEN | Service-to-service auth token | - |
| API_KEY | API key for authentication | - |

## Health Check

```bash
curl http://localhost:5060/health
```

## Metrics

Prometheus metrics available at `/metrics`

```bash
curl http://localhost:5060/metrics
```
