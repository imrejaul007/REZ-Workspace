# REZ Currency Service

Multi-Currency Support - Exchange Rates & Conversion

**Port:** 4035

## Features

- Multi-currency support (INR, USD, EUR, GBP, AED, SGD, THB, AUD, JPY, CNY)
- Real-time exchange rate fetching from external APIs
- Currency conversion with configurable hotel margins
- Automatic rate updates via cron job (hourly)
- Fallback to default rates when APIs unavailable
- Conversion logging and audit trail
- Hotel-specific currency configuration

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| GET | /api/currencies | List all supported currencies |
| GET | /api/rates | Get current exchange rates |
| POST | /api/convert | Convert amount between currencies |
| GET | /api/config/:hotelId | Get hotel currency configuration |
| PUT | /api/config/:hotelId | Update hotel currency configuration |

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
| PORT | 4035 | Service port |
| MONGO_URL | mongodb://localhost:27017/rez_currency | MongoDB connection string |
