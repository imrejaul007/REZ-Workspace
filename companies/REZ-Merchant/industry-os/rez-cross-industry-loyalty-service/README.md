# REZ Cross-Industry Loyalty Service

A unified loyalty and rewards service that connects all 17 industry verticals, enabling customers to earn and redeem points across different industries.

## Overview

This service provides:
- **Unified Loyalty Points**: Earn and redeem points across all industry verticals
- **Cross-Industry Rewards**: Earn points in restaurants, redeem in spas, etc.
- **Tier Management**: Bronze, Silver, Gold, Platinum, Diamond tiers with multipliers
- **Campaign Management**: Multi-industry merchant campaigns with point boosts
- **Customer Wallet**: Universal wallet that works across all verticals

## Industry Verticals Supported

1. Restaurant
2. Spa & Wellness
3. Retail
4. Hotel
5. Travel
6. Transportation
7. Entertainment
8. Healthcare
9. Fitness
10. Beauty
11. Education
12. Automotive
13. Home Services
14. Grocery
15. Pharmacy
16. Events
17. Gaming

## API Endpoints

### Accounts
- `POST /api/v1/accounts` - Create unified account
- `GET /api/v1/accounts/:accountId` - Get account by ID
- `GET /api/v1/accounts/user/:userId` - Get account by user ID
- `GET /api/v1/accounts/phone/:phone` - Get account by phone
- `PUT /api/v1/accounts/:accountId/tier` - Update tier
- `GET /api/v1/accounts/:accountId/balance` - Get balance across verticals
- `GET /api/v1/accounts/:accountId/transactions` - Transaction history

### Transactions
- `POST /api/v1/transactions/earn` - Earn points
- `POST /api/v1/transactions/redeem` - Redeem points
- `POST /api/v1/transactions/transfer` - Transfer between verticals
- `POST /api/v1/transactions/expire` - Manual expire (cron triggered)
- `GET /api/v1/transactions/:accountId` - Transaction history

### Redemptions
- `POST /api/v1/redemption/cross-industry` - Cross-industry redemption
- `GET /api/v1/redemption/history/:accountId` - Redemption history

### Tiers
- `GET /api/v1/tiers` - List all tiers
- `GET /api/v1/tiers/:tierName` - Get tier details
- `POST /api/v1/tiers/calculate` - Calculate user's tier

### Campaigns
- `POST /api/v1/campaigns` - Create campaign
- `GET /api/v1/campaigns/:merchantId` - Merchant campaigns
- `GET /api/v1/campaigns/active` - Active campaigns
- `POST /api/v1/campaigns/:campaignId/join` - Join campaign

### Analytics
- `GET /api/v1/analytics/:accountId/summary` - Account summary
- `GET /api/v1/analytics/merchant/:merchantId/performance` - Merchant performance
- `GET /api/v1/analytics/leaderboard` - Top accounts

## Configuration

Environment variables:
```
PORT=4071
MONGODB_URI=mongodb://localhost:27017/rez-loyalty
JWT_SECRET=your-jwt-secret
INTERNAL_TOKEN=your-internal-token
RABTUL_ENABLED=true
RABTUL_WEBHOOK_URL=https://rabtul.rez.internal/webhook
```

## Installation

```bash
npm install
npm run build
npm start
```

## Development

```bash
npm run dev
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway (Port 4071)                 │
├─────────────────────────────────────────────────────────────┤
│  Routes → Controllers → Services → Models                   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌──────────────┐  ┌────────────────────────┐  │
│  │ MongoDB │  │ RABTUL       │  │ Industry Vertical     │  │
│  │ Storage │  │ Notifications│  │ Connectors            │  │
│  └─────────┘  └──────────────┘  └────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Tier System

| Tier     | Min Points | Max Points | Multiplier |
|----------|------------|------------|------------|
| Bronze   | 0           | 999        | 1.0x       |
| Silver   | 1000        | 4999       | 1.25x      |
| Gold     | 5000        | 9999       | 1.5x       |
| Platinum | 10000       | 24999      | 1.75x      |
| Diamond  | 25000       | ∞          | 2.0x       |

## Cross-Industry Conversion

Points can be converted between verticals at configured rates. Default conversion rate: 1:1 within same tier. Cross-tier conversions include tier-based multipliers.

## License

Proprietary - REZ Technology