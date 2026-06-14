# REZ Retail Loyalty Service

Loyalty program management for REZ Retail.

## Features

- Customer enrollment
- Points earning on purchases
- Points redemption for rewards
- Tier-based benefits
- Birthday and anniversary bonuses
- Points expiration

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/loyalty/program` | Get program details |
| POST | `/api/loyalty/enroll` | Enroll customer |
| GET | `/api/loyalty/customer/:id` | Get customer loyalty info |
| POST | `/api/loyalty/earn` | Earn points |
| POST | `/api/loyalty/redeem` | Redeem points |
| GET | `/api/loyalty/rewards` | Get available rewards |
| GET | `/api/loyalty/calculate` | Calculate points value |

## Configuration

```env
PORT=4102
MONGODB_URI=mongodb://localhost:27017/rez-retail-loyalty
REDIS_URL=redis://localhost:6379
```
