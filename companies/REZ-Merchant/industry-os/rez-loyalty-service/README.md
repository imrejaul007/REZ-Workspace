# REZ Loyalty Service

Loyalty Program - Points, Tiers, Rewards

**Port:** 4037

## Features

- Multi-tier loyalty program (Bronze, Silver, Gold, Platinum)
- Points earning and redemption
- Tier-based multipliers and benefits
- Reward catalog management
- Referral program
- Birthday bonuses
- Points history tracking
- Analytics and reporting

## Tier Structure

| Tier | Min Points | Multiplier | Benefits |
|------|------------|------------|----------|
| Bronze | 0 | 1x | Basic rewards, Birthday bonus |
| Silver | 5,000 | 1.25x | 10% bonus points, Priority support, Early check-in |
| Gold | 20,000 | 1.5x | 50% bonus points, Free upgrades, Late checkout, Airport lounge |
| Platinum | 50,000 | 2x | 100% bonus points, Suite upgrades, Personal concierge, Guaranteed availability, VIP events |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| GET | /api/tiers | Get tier information |
| POST | /api/members | Enroll new member |
| GET | /api/members/:hotelId | List hotel loyalty members |
| GET | /api/members/single/:memberId | Get member details |
| POST | /api/points/earn | Earn points |
| POST | /api/points/redeem | Redeem points |
| GET | /api/members/:memberId/history | Get points history |
| POST | /api/rewards | Create reward |
| GET | /api/rewards/:hotelId | List available rewards |
| POST | /api/rewards/:rewardId/redeem | Redeem reward |
| GET | /api/analytics/:hotelId | Get loyalty analytics |

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
| PORT | 4037 | Service port |
| MONGO_URL | mongodb://localhost:27017/rez_loyalty | MongoDB connection string |
