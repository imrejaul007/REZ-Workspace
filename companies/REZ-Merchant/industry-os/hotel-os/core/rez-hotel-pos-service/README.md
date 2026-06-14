# REZ Hotel POS Service

Hotel Point of Sale - Folio Management & Outlet Billing

**Port:** 4005

## Features

- Folio management for guest accounts
- Outlet billing and transactions
- Payment capture integration
- PMS integration
- Sentry error tracking
- Prometheus metrics
- W3C trace propagation
- MongoDB and Redis connectivity
- Graceful shutdown handling

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| GET | /metrics | Prometheus metrics |
| GET | /api/folio/* | Folio management routes |
| GET | /api/outlet/* | Outlet management routes |
| GET | /api/payment/* | Payment routes |

## Quick Start

```bash
# Install dependencies
npm install

# Start the service
npm start

# Development mode with hot reload
npm run dev
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 4005 | Service port |
| HEALTH_PORT | 4105 | Health check port |
| MONGODB_URI | - | MongoDB connection string (required) |
| REDIS_URL | - | Redis connection string (required) |
| JWT_SECRET | - | JWT secret (required) |
| PMS_SERVICE_URL | - | PMS service URL (optional) |
| PAYMENT_SERVICE_URL | - | Payment service URL (optional) |
| SENTRY_DSN | - | Sentry DSN for error tracking |
| CORS_ORIGIN | http://localhost:3000 | Allowed CORS origins |
| INTERNAL_SERVICE_TOKENS_JSON | - | Internal service tokens JSON |
