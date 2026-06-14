# Retail Media Network Hub

Central hub for the retail media network - enabling merchants to advertise on REZ platforms.

## Overview

The Retail Media Network Hub is an AdBazaar service that provides:

- **Sponsored Product Campaigns**: Promote products with bid management
- **Display Advertising**: Banner ads across REZ platforms
- **Video Ads**: Video advertising placements
- **Search Advertising**: Keyword-based search ad placements
- **Retail Media Analytics**: Performance tracking with ACOS, CTR, and conversions
- **Inventory Management**: Available ad placements and recommendations

## Features

- Campaign creation and management
- Product-level bid management
- Real-time performance metrics
- ACOS (Advertising Cost of Sales) tracking
- Audience targeting (shoppers, repeat buyers, cart abandoners)
- Category and keyword targeting
- Price range targeting
- Merchant advertising network
- Integration with REZ Merchant

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Cache**: Redis
- **Validation**: Zod
- **Authentication**: JWT
- **Metrics**: Prometheus client
- **Language**: TypeScript

## API Endpoints

### Campaigns

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/retail-media/campaign` | Create retail media campaign |
| GET | `/api/retail-media/campaigns` | List campaigns with pagination |
| GET | `/api/retail-media/campaigns/:id` | Get campaign details |
| PUT | `/api/retail-media/campaigns/:id` | Update campaign |
| DELETE | `/api/retail-media/campaigns/:id` | Delete campaign |
| GET | `/api/retail-media/campaigns/stats/summary` | Get campaign statistics |

### Inventory

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/retail-media/inventory` | Get available inventory |
| GET | `/api/retail-media/inventory/product/:id` | Get product inventory |
| GET | `/api/retail-media/inventory/category/performance` | Get category performance |
| POST | `/api/retail-media/inventory/placements/recommend` | Get recommended placements |

### Sponsored Products

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/retail-media/sponsored` | Create sponsored product campaign |
| GET | `/api/retail-media/sponsored` | List sponsored products |
| PATCH | `/api/retail-media/sponsored/:id/bid` | Update bid amount |
| PATCH | `/api/retail-media/sponsored/:id/budget` | Update daily budget |
| GET | `/api/retail-media/sponsored/:id/performance/:productId` | Get product performance |
| GET | `/api/retail-media/sponsored/:id/recommendations/:productId` | Get bid recommendations |

### Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/retail-media/analytics` | Get retail media analytics |
| GET | `/api/retail-media/analytics/campaign/:id` | Get campaign analytics |
| POST | `/api/retail-media/analytics/record` | Record metrics (internal) |

## Campaign Types

- `sponsored_products`: Product listing ads
- `display`: Banner display ads
- `video`: Video advertisements
- `search`: Search result ads

## Audience Types

- `shoppers`: General shoppers
- `repeat_buyers`: Customers who have purchased before
- `cart_abandoners`: Users who abandoned cart

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB
- Redis (optional)

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
```

### Configuration

```env
PORT=4830
MONGODB_URI=mongodb://localhost:27017/retail-media-network-hub
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-jwt-secret
REZ_MERCHANT_URL=http://localhost:4000
NODE_ENV=development
```

### Running

```bash
# Development
npm run dev

# Production
npm run build
npm start

# Run tests
npm test
```

## Authentication

All API endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

JWT Payload structure:
```json
{
  "userId": "user-123",
  "merchantId": "merchant-456",
  "role": "merchant"
}
```

## Metrics

Prometheus metrics are available at `/metrics` when `ENABLE_METRICS=true`.

### Available Metrics

- `retail_media_campaign_created_total`: Total campaigns created
- `retail_media_ad_impressions_total`: Total ad impressions
- `retail_media_ad_clicks_total`: Total ad clicks
- `retail_media_ad_orders_total`: Total orders from ads
- `retail_media_ad_revenue_total`: Total revenue from ads
- `retail_media_active_campaigns`: Number of active campaigns
- `http_request_duration_seconds`: HTTP request duration
- `cache_hit_total`: Cache hits
- `cache_miss_total`: Cache misses

## Health Check

```
GET /health
```

Returns:
```json
{
  "success": true,
  "status": "healthy",
  "service": "retail-media-network-hub",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "port": 4830
}
```

## Example Usage

### Create a Campaign

```bash
curl -X POST http://localhost:4830/api/retail-media/campaigns \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Summer Sale Campaign",
    "type": "sponsored_products",
    "products": [
      {
        "productId": "PROD-001",
        "bidAmount": 5.50,
        "dailyBudget": 500
      }
    ],
    "targeting": {
      "category": ["Electronics", "Fashion"],
      "keywords": ["laptop", "smartphone"],
      "audienceType": "repeat_buyers"
    },
    "budget": {
      "total": 15000
    }
  }'
```

### Get Analytics

```bash
curl http://localhost:4830/api/retail-media/analytics?groupBy=day \
  -H "Authorization: Bearer <token>"
```

## Performance Metrics

The service tracks key advertising metrics:

- **Impressions**: Number of times ad was displayed
- **Clicks**: Number of ad clicks
- **Orders**: Number of orders from ad
- **Revenue**: Revenue generated from ad
- **ACOS**: Advertising Cost of Sales (spend/revenue * 100)
- **CTR**: Click-through Rate (clicks/impressions * 100)
- **Conversion Rate**: Orders/clicks * 100

## License

Proprietary - REZ Ecosystem