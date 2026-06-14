# AdBazaar API Gateway

Single entry point for all AdBazaar services. Routes requests to appropriate backend services with authentication, rate limiting, and logging.

## Features

- **Request Routing** - Route requests to appropriate backend services
- **Authentication** - API key and Bearer token authentication
- **Rate Limiting** - Request throttling per client
- **Request Logging** - Request/response logging middleware
- **Circuit Breakers** - Graceful degradation on service failures
- **Health Monitoring** - Health and readiness endpoints

## Quick Start

```bash
# Install dependencies
npm install

# Run in development
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

## API Endpoints

### Health & Status
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/ready` | Readiness check |
| GET | `/routes` | List all routes |

### Core Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/adbazaar` | Platform info |
| GET | `/api/campaigns` | List campaigns |
| POST | `/api/campaigns` | Create campaign |
| GET | `/api/analytics` | Analytics overview |
| GET | `/api/inventory` | Inventory status |
| GET | `/api/commerce` | Commerce metrics |
| GET | `/api/attribution` | Attribution config |
| GET | `/api/tenants` | List tenants |

### AI Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/predict` | AI predictions |
| POST | `/api/ai/recommend` | AI recommendations |

## Route Configuration

| Route | Target Service | Port |
|-------|----------------|------|
| `/api/ads` | Ad Serving | 4007 |
| `/api/qr` | QR Campaigns | 4068 |
| `/api/campaigns` | Unified Campaign | 4500 |
| `/api/tenants` | Tenant Registry | 4510 |
| `/api/inventory` | Inventory Classifier | 4515 |
| `/api/attribution` | Attribution Hub | 4520 |
| `/api/analytics` | Flywheel Analytics | 4550 |
| `/api/ai` | AI Gateway | 4560 |
| `/api/intent` | AI Gateway | 4560 |
| `/api/recommendations` | AI Gateway | 4560 |
| `/api/predict` | AI Gateway | 4560 |

## Authentication

The API Gateway supports two authentication methods:

1. **API Key**: Pass via `X-API-Key` header
2. **Bearer Token**: Pass via `Authorization` header

Public endpoints (no auth required):
- `/health`
- `/ready`
- `/metrics`
- `/`

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `4000` | Service port |
| `API_KEY` | `dev-api-key` | API authentication key |
| `CORS_ORIGIN` | `*` | CORS allowed origins |
| `NODE_ENV` | `development` | Environment |
