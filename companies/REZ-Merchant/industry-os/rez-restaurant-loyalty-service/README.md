# Rez Restaurant Loyalty Service

Customer Loyalty, Points, and Rewards Management

**Port:** 4007

## Features

- **Points Management**: Award, redeem, and track customer loyalty points
- **Tier System**: Multi-level loyalty tiers (Bronze, Silver, Gold, Platinum) with progression tracking
- **Rewards Catalog**: Manage redeemable rewards with point costs
- **Points Expiry**: Automatic expiration processing for unused points
- **Tier Upgrades**: Automatic tier checking and upgrade processing
- **Customer Enrollment**: Initialize customers in loyalty programs
- **Program Management**: Create and manage multiple loyalty programs per restaurant
- **Lifetime Points**: Track total points earned over customer lifetime
- **Points History**: Complete audit trail of all point transactions

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| GET | /api/loyalty/points/:customerId | Get customer points balance |
| POST | /api/loyalty/points/earn | Award points to customer |
| POST | /api/loyalty/points/redeem | Redeem points |
| POST | /api/loyalty/points/transfer | Transfer points between customers |
| GET | /api/loyalty/rewards | List available rewards |
| POST | /api/loyalty/rewards | Create new reward |
| POST | /api/loyalty/rewards/:id/redeem | Redeem specific reward |
| POST | /api/loyalty/admin/tiers/check | Check and update tier status |
| POST | /api/loyalty/admin/expiry/process | Process expired points |
| POST | /api/loyalty/programs | Create loyalty program |
| GET | /api/loyalty/programs/:id | Get program details |
| POST | /api/loyalty/customers | Initialize customer in program |

## Quick Start

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run in production mode
npm start

# Run tests
npm test
```

## Configuration

Configure via environment variables or `.env` file:
- `PORT`: Server port (default: 4007)
- `MONGODB_URI`: MongoDB connection string
- `REDIS_URL`: Redis connection string for caching

## Loyalty Tiers

| Tier | Points Required | Benefits |
|------|---------------|----------|
| Bronze | 0 | Base rewards rate |
| Silver | 1000 | 10% bonus points |
| Gold | 5000 | 20% bonus points + priority service |
| Platinum | 10000 | 30% bonus points + exclusive rewards |
