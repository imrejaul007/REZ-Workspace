# Cart Recovery Service

Advanced cart abandonment recovery for AdBazaar.

## Features

- Cart tracking and abandonment detection
- Multi-channel recovery (email, SMS, push, WhatsApp)
- Recovery sequence management
- Analytics and reporting
- Recovery rate tracking

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/carts | Create cart |
| GET | /api/carts/:id | Get cart |
| GET | /api/carts/status/abandoned | Get abandoned carts |
| POST | /api/carts/:id/recover | Initiate recovery |
| GET | /api/carts/:id/analytics | Get cart analytics |
| POST | /api/carts/:id/mark-recovered | Mark cart as recovered |
| POST | /api/carts/:id/mark-converted | Mark cart as converted |
| GET | /api/carts/stats/recovery-rate | Get recovery rate |

## Quick Start

```bash
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/AdBazaar/cart-recovery-service
npm install
npm run dev
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 5099 | Service port |
| MONGODB_URI | mongodb://localhost:27017/cart-recovery | MongoDB connection |