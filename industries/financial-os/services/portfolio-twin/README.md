# Portfolio Twin Service

**Version:** 1.0.0  
**Industry:** Financial OS  
**Port:** 8950

Digital twin service for investment portfolios, investors, and assets in the RTMN Financial OS ecosystem. This service manages the lifecycle of financial twins including Portfolio Twin, Investor Twin, and Asset Twin.

## Overview

The Portfolio Twin Service provides:

- **Portfolio Twin**: Digital representation of investment portfolios with holdings, performance metrics, risk analytics, and compliance tracking
- **Investor Twin**: Investor profiles, KYC status, preferences, connected accounts, and activity tracking
- **Asset Twin**: Asset information including pricing, fundamentals, technical indicators, and Islamic compliance

## Features

### Portfolio Twin
- Create, read, update, delete portfolio twins
- Manage holdings (add, update, remove)
- Track performance metrics (YTD, MTD, day change, gain/loss)
- Calculate and update risk metrics (Sharpe ratio, volatility, beta)
- Rebalancing recommendations
- Compliance monitoring

### Investor Twin
- Investor profile management
- KYC status tracking
- Investment preferences
- Connected account linking
- Portfolio associations
- Activity tracking

### Asset Twin
- Asset profile management
- Real-time pricing updates
- Fundamental data
- Technical analysis indicators
- Islamic compliance screening
- News aggregation

## API Endpoints

### Portfolio Twin
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/twins/portfolio` | Create portfolio twin |
| GET | `/api/twins/portfolio/:id` | Get portfolio twin |
| GET | `/api/twins/portfolio` | List portfolio twins |
| PUT | `/api/twins/portfolio/:id` | Update portfolio twin |
| DELETE | `/api/twins/portfolio/:id` | Delete portfolio twin |
| POST | `/api/twins/portfolio/:id/holdings` | Add holding |
| PUT | `/api/twins/portfolio/:id/holdings/:assetId` | Update holding |
| DELETE | `/api/twins/portfolio/:id/holdings/:assetId` | Remove holding |
| POST | `/api/twins/portfolio/:id/rebalance` | Trigger rebalancing |
| PUT | `/api/twins/portfolio/:id/performance` | Update performance |
| PUT | `/api/twins/portfolio/:id/risk-metrics` | Update risk metrics |
| GET | `/api/twins/portfolio/stats/summary` | Get statistics |

### Investor Twin
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/twins/investor` | Create investor twin |
| GET | `/api/twins/investor/:id` | Get investor twin |
| GET | `/api/twins/investor` | List investor twins |
| PUT | `/api/twins/investor/:id` | Update investor twin |
| DELETE | `/api/twins/investor/:id` | Delete investor twin |
| POST | `/api/twins/investor/:id/accounts` | Link account |
| DELETE | `/api/twins/investor/:id/accounts/:accountId` | Unlink account |
| POST | `/api/twins/investor/:id/portfolios` | Add portfolio |
| DELETE | `/api/twins/investor/:id/portfolios/:portfolioId` | Remove portfolio |
| PUT | `/api/twins/investor/:id/kyc` | Update KYC |
| GET | `/api/twins/investor/stats/summary` | Get statistics |

### Asset Twin
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/twins/asset` | Create asset twin |
| GET | `/api/twins/asset/:id` | Get asset twin |
| GET | `/api/twins/asset` | List asset twins |
| PUT | `/api/twins/asset/:id` | Update asset twin |
| DELETE | `/api/twins/asset/:id` | Delete asset twin |
| PUT | `/api/twins/asset/:id/pricing` | Update pricing |
| POST | `/api/twins/asset/:id/news` | Add news |
| GET | `/api/twins/asset/search/:query` | Search assets |
| GET | `/api/twins/asset/top/performers` | Top performers |
| GET | `/api/twins/asset/islamic/compliant` | Islamic compliant |
| GET | `/api/twins/asset/stats/summary` | Get statistics |

## Authentication

All API endpoints require authentication via API key:

```
X-API-Key: your-api-key
```

For internal service operations (delete operations), use:

```
X-Internal-Token: your-internal-token
```

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

# Edit .env with your configuration
```

### Development

```bash
# Run in development mode
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### Docker

```bash
# Build image
docker build -t portfolio-twin-service .

# Run with docker-compose
docker-compose up -d
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Service port | 8950 |
| NODE_ENV | Environment | development |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/portfolio_twin |
| REDIS_URL | Redis connection string | redis://localhost:6379 |
| API_KEY | API authentication key | portfolio-twin-api-key |
| INTERNAL_SERVICE_TOKEN | Internal service token | internal-token |
| CORS_ORIGINS | Allowed CORS origins | http://localhost:3000 |
| LOG_LEVEL | Logging level | info |

## Event System

The service emits events for real-time updates:

- `portfolio_twin.created`
- `portfolio_twin.updated`
- `portfolio_twin.holding_added`
- `portfolio_twin.holding_removed`
- `portfolio_twin.performance_updated`
- `portfolio_twin.rebalance_recommended`
- `investor_twin.created`
- `investor_twin.updated`
- `investor_twin.kyc_updated`
- `asset_twin.created`
- `asset_twin.updated`
- `asset_twin.price_update`

## Health Check

```bash
curl http://localhost:8950/health
```

## License

Proprietary - RTMN
