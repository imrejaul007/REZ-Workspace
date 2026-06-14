# Unified Checkout Service

Cross-channel checkout experience for AdBazaar.

## Features

- Multi-channel checkout (web, mobile, app, POS, API)
- Multiple payment methods (UPI, card, wallet, netbanking, COD)
- Real-time cart management
- Payment processing integration
- Session management

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/checkout | Create checkout |
| GET | /api/checkout/:id | Get checkout |
| PUT | /api/checkout/:id | Update checkout |
| POST | /api/checkout/:id/payment | Initiate payment |
| POST | /api/checkout/:id/complete | Complete checkout |
| GET | /api/checkout/:id/status | Get checkout status |
| POST | /api/checkout/:id/cancel | Cancel checkout |
| GET | /api/checkout | List user checkouts |

## Quick Start

```bash
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/AdBazaar/unified-checkout-service
npm install
npm run dev
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 5098 | Service port |
| MONGODB_URI | mongodb://localhost:27017/unified-checkout | MongoDB connection |