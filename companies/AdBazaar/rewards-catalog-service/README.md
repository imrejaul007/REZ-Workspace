# Rewards Catalog Service

Rewards catalog and redemption for AdBazaar.

## Features

- Multiple reward types (discount, gift card, product, voucher, experience, charity)
- Inventory management
- Points-based redemption
- Digital and physical delivery
- User redemption tracking

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/rewards | Create reward |
| GET | /api/rewards | List rewards |
| GET | /api/rewards/:id | Get reward |
| PUT | /api/rewards/:id | Update reward |
| POST | /api/rewards/:id/redeem | Redeem reward |
| GET | /api/rewards/:id/inventory | Get inventory |
| GET | /api/redemptions/:id | Get redemption |
| GET | /api/rewards/user/:userId/redemptions | Get user redemptions |
| DELETE | /api/rewards/:id | Archive reward |

## Quick Start

```bash
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/AdBazaar/rewards-catalog-service
npm install
npm run dev
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 5102 | Service port |
| MONGODB_URI | mongodb://localhost:27017/rewards-catalog | MongoDB connection |