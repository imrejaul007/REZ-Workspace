# REZ Dynamic Pricing Service

ML-Powered Real-Time Pricing Engine

**Port:** 4040

## Features

- Demand forecasting (occupancy, lead time, day of week)
- Competitor price monitoring and analysis
- Seasonal and event-based pricing adjustments
- Customer segment pricing
- Revenue optimization with recommendations
- Batch pricing for multiple dates
- Custom pricing rules management
- Price confidence scoring
- Alternative pricing scenarios

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| POST | /api/pricing/calculate | Calculate dynamic price |
| POST | /api/pricing/batch | Batch pricing for multiple dates |
| GET | /api/revenue/optimize | Get revenue optimization report |
| GET | /api/competitors | Get competitor analysis |
| GET | /api/demand/forecast | Get demand forecast |
| GET | /api/rules | List custom pricing rules |
| POST | /api/rules | Create custom pricing rule |
| DELETE | /api/rules/:ruleId | Delete pricing rule |

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
| PORT | 4040 | Service port |
