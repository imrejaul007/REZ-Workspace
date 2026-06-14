# REZ Hotel Pricing Service

Subscription Tiers, Dynamic Pricing, Promotional Campaigns

**Port:** 4022

## Features

- Subscription tier management (Basic/Pro/Premium)
- Feature flags per tier
- Promotional campaigns
- Discount codes
- Dynamic pricing rules
- Subscription billing
- Commission management per tier

## Subscription Tiers

| Tier | Monthly Price | Yearly Price | Commission | OTA Channels |
|------|---------------|--------------|------------|--------------|
| Basic | Free | Free | 15% | 1 |
| Pro | Rs. 999 | Rs. 9,999 | 10% | 3 |
| Premium | Rs. 4,999 | Rs. 49,999 | 5% | Unlimited |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| GET | /api/tiers | List all subscription tiers |
| GET | /api/tiers/:tierName | Get tier details |
| POST | /api/subscriptions | Create hotel subscription |
| GET | /api/subscriptions/:hotelId | Get hotel subscription |
| POST | /api/campaigns | Create promo campaign |
| GET | /api/campaigns/:hotelId | List hotel campaigns |
| POST | /api/campaigns/validate | Validate and apply promo code |
| POST | /api/campaigns/:campaignId/use | Mark campaign as used |
| GET | /api/dynamic-pricing/:hotelId | Get pricing rules |
| POST | /api/dynamic-pricing | Create pricing rule |
| POST | /api/dynamic-pricing/calculate | Calculate dynamic price |
| GET | /api/discounts/:hotelId | List discount codes |
| POST | /api/discounts | Create discount code |

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
| PORT | 4022 | Service port |
| MONGO_URL | mongodb://localhost:27017/rez_hotel_pricing | MongoDB connection string |
