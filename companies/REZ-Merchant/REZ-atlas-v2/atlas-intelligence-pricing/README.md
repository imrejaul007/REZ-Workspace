# Atlas Intelligence Pricing

**Port:** 5360 | **Company:** REZ-Merchant | **Version:** 1.0.0

## Overview

Dynamic pricing optimization with AI. Recommend optimal prices based on demand, competition, and margin targets.

## Features

- **Competitive Pricing** - Match market rates
- **Demand-Based Pricing** - Adjust for demand
- **Promotional Pricing** - Optimize discounts
- **Margin Optimization** - Maximize profitability

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/recommend` | Get price recommendation |
| GET | `/api/price-history/:productId` | Get price history |

## Quick Start

```bash
cd atlas-intelligence-pricing
npm install
npm run dev
```

## Health Check

```bash
curl http://localhost:5360/health
```

## Example Request

```bash
curl -X POST http://localhost:5360/api/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "product": "basic-plan",
    "basePrice": 999,
    "competitorPrice": 1099,
    "demand": "high"
  }'
```
