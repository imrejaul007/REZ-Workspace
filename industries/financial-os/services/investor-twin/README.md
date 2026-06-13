# Investor Twin Service

## Overview

The Investor Twin Service is a core component of the Financial OS that manages investor profiles, portfolios, risk profiles, and investment analytics. It provides a comprehensive digital twin representation of each investor in the ecosystem.

## Features

- **Investor Profile Management**: Create, read, update, and delete investor profiles
- **Portfolio Tracking**: Track holdings, allocations, and real-time portfolio values
- **Risk Profile Management**: Manage investor risk tolerance and investment horizons
- **Transaction History**: Record and track all investment transactions
- **Watchlist Management**: Track securities of interest
- **Performance Metrics**: Calculate and store investment performance metrics
- **Market Data Integration**: Real-time market data refresh for holdings
- **Preferences Management**: Investor-specific settings and preferences

## Architecture

```
investor-twin-service/
├── src/
│   ├── index.ts              # Application entry point
│   ├── controllers/         # HTTP request handlers
│   ├── services/            # Business logic
│   ├── models/              # MongoDB models
│   ├── schemas/             # TypeScript type definitions
│   ├── routes/              # Express route definitions
│   ├── middleware/          # Express middleware
│   └── utils/               # Utility functions and clients
├── tests/                   # Jest test files
├── docker/                  # Docker configuration
└── package.json
```

## API Endpoints

### Investor Twin Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/twins/investor` | Create a new Investor Twin |
| GET | `/api/twins/investor` | List all Investor Twins |
| GET | `/api/twins/investor/:investorId` | Get Investor Twin by ID |
| GET | `/api/twins/investor/:investorId/summary` | Get Portfolio Summary |
| PUT | `/api/twins/investor/:investorId/risk-profile` | Update Risk Profile |
| PUT | `/api/twins/investor/:investorId/portfolio` | Update Portfolio Allocations |
| PUT | `/api/twins/investor/:investorId/holdings` | Update Holdings |
| POST | `/api/twins/investor/:investorId/transactions` | Add Transaction |
| PUT | `/api/twins/investor/:investorId/metrics` | Update Metrics |
| POST | `/api/twins/investor/:investorId/watchlist` | Add to Watchlist |
| DELETE | `/api/twins/investor/:investorId/watchlist/:symbol` | Remove from Watchlist |
| PUT | `/api/twins/investor/:investorId/preferences` | Update Preferences |
| DELETE | `/api/twins/investor/:investorId` | Delete Investor Twin |
| POST | `/api/twins/investor/:investorId/refresh` | Refresh Market Data |

### Health Check Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Service health check |
| GET | `/ready` | Service readiness check |

## Data Models

### Investor Types

- `individual` - Individual retail investor
- `institutional` - Institutional investor
- `accredited` - Accredited investor
- `retail` - Retail investor
- `family_office` - Family office
- `venture_capital` - Venture capital firm
- `private_equity` - Private equity firm
- `hedge_fund` - Hedge fund
- `sovereign_wealth` - Sovereign wealth fund
- `pension_fund` - Pension fund

### Risk Tolerance Levels

- `conservative` - Low risk tolerance
- `moderate` - Moderate risk tolerance
- `aggressive` - Aggressive risk tolerance
- `very_aggressive` - Very aggressive risk tolerance

### Asset Classes

- `equities` - Stocks and equity securities
- `fixed_income` - Bonds and fixed income securities
- `real_estate` - Real estate investments
- `commodities` - Commodity investments
- `crypto` - Cryptocurrency
- `alternatives` - Alternative investments
- `cash` - Cash and cash equivalents
- `derivatives` - Derivative instruments

## Event Publishing

The service publishes the following events to RabbitMQ:

- `investor.twin.created` - When a new investor twin is created
- `investor.twin.risk.updated` - When risk profile is updated
- `investor.twin.portfolio.updated` - When portfolio allocations change
- `investor.twin.holdings.updated` - When holdings are updated
- `investor.twin.transaction.added` - When a new transaction is added
- `investor.twin.metrics.updated` - When performance metrics are updated
- `investor.twin.watchlist.added` - When a symbol is added to watchlist
- `investor.twin.watchlist.removed` - When a symbol is removed from watchlist
- `investor.twin.preferences.updated` - When preferences are updated
- `investor.twin.market.refreshed` - When market data is refreshed
- `investor.twin.deleted` - When an investor twin is deleted

## External Service Integrations

- **Trading Service** - Order placement and position tracking
- **Portfolio Service** - Portfolio sync and rebalancing
- **Risk Analytics Service** - Risk metric calculations
- **Market Data Service** - Real-time market quotes
- **REZ Dashboard** - Dashboard notifications and sync

## Environment Variables

See `.env.example` for all configuration options.

## Running the Service

### Development

```bash
npm install
npm run dev
```

### Production

```bash
npm run build
npm start
```

### Docker

```bash
npm run docker:build
npm run docker:run
```

### Testing

```bash
npm test
```

## Health Check Response

```json
{
  "status": "healthy",
  "service": "investor-twin-service",
  "version": "1.0.0",
  "timestamp": "2026-06-12T00:00:00.000Z",
  "mongodb": "connected",
  "rabbitmq": "connected"
}
```

## Example Usage

### Create Investor Twin

```bash
curl -X POST http://localhost:4030/api/twins/investor \
  -H "Content-Type: application/json" \
  -d '{
    "investorId": "inv123",
    "type": "individual",
    "name": "John Doe",
    "contact": {
      "phone": "+1234567890",
      "email": "john@example.com"
    },
    "riskProfile": {
      "riskTolerance": "aggressive",
      "investmentHorizon": "long_term"
    }
  }'
```

### Get Portfolio Summary

```bash
curl http://localhost:4030/api/twins/investor/inv123/summary
```

### Add Transaction

```bash
curl -X POST http://localhost:4030/api/twins/investor/inv123/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "transaction": {
      "type": "buy",
      "symbol": "AAPL",
      "quantity": 100,
      "price": 150,
      "amount": 15000,
      "fees": 10,
      "timestamp": "2026-06-12T00:00:00.000Z",
      "status": "executed"
    }
  }'
```

## License

Proprietary - All rights reserved
