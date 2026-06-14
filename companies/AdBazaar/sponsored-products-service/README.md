# Sponsored Products Service

Sponsored product advertising service within the AdBazaar retail media network.

## Overview

The Sponsored Products Service enables merchants to advertise their products within the AdBazaar retail media network. It provides product-level bid management, keyword targeting, auto-bidding strategies, and performance tracking.

## Features

- **Product-level bid management** - Set and adjust bids for individual products
- **Keyword targeting** - Target products based on keywords and categories
- **Auto-bidding strategies** - Manual, auto, and rule-based bidding options
- **Performance tracking** - Real-time metrics including impressions, clicks, CTR, orders, revenue, and ACOS
- **Search result placement** - Compete for placement in search results
- **ACOS optimization** - Automatic bid adjustment to optimize advertising cost of sales

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Cache**: Redis
- **Validation**: Zod
- **Authentication**: JWT
- **Metrics**: Prometheus (prom-client)
- **Language**: TypeScript

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB
- Redis

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit environment variables
vim .env
```

### Configuration

Create a `.env` file with the following variables:

```env
# Server
PORT=4831
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/sponsored-products

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-jwt-secret-change-in-production
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

## API Endpoints

### Sponsored Products

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sponsored/products` | Add product to sponsored |
| GET | `/api/sponsored/products` | List sponsored products |
| GET | `/api/sponsored/products/:id` | Get product by ID |
| PUT | `/api/sponsored/products/:id` | Update product bid |
| DELETE | `/api/sponsored/products/:id` | Remove from sponsored |
| GET | `/api/sponsored/products/:id/performance` | Get product performance |
| POST | `/api/sponsored/products/:id/auto-bid` | Trigger auto-bidding |

### Bidding

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sponsored/bid` | Place bid for product placement |

### Search

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sponsored/search` | Search products |

### Campaign

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sponsored/campaign/:campaignId/products` | Get campaign products |
| GET | `/api/sponsored/top-performing` | Get top performing products |

### Health& Metrics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/ready` | Readiness check |
| GET | `/metrics` | Prometheus metrics |

## API Examples

### Create Sponsored Product

```bash
curl -X POST http://localhost:4831/api/sponsored/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "campaignId": "campaign-123",
    "productId": "product-456",
    "product": {
      "name": "Wireless Headphones",
      "category": "Electronics",
      "price": 99.99
    },
    "bid": {
      "amount": 0.50,
      "strategy": "manual",
      "maxBid": 2.00
    },
    "budget": {
      "daily": 50,
      "total": 1000
    },
    "targeting": {
      "keywords": ["headphones", "wireless", "audio"],
      "categoryMatch": true
    }
  }'
```

### Place Bid

```bash
curl -X POST http://localhost:4831/api/sponsored/bid \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "sponsoredId": "SPON-ABC12345",
    "amount": 0.75
  }'
```

### Get Performance

```bash
curl http://localhost:4831/api/sponsored/products/SPON-ABC12345/performance \
  -H "Authorization: Bearer <token>"
```

### Search Products

```bash
curl "http://localhost:4831/api/sponsored/search?query=headphones&minPrice=50&maxPrice=150" \
  -H "Authorization: Bearer <token>"
```

## Data Model

### SponsoredProduct

```typescript
interface SponsoredProduct {
  sponsoredId: string; // Unique identifier (SPON-XXXXXXXX)
  campaignId: string; // Associated campaign
  merchantId: string;        // Merchant who owns the product
  productId: string;         // Product identifier
  product: {
    name: string;
    category: string;
    price: number;
    imageUrl?: string;
  };
  bid: {
    amount: number;          // Current bid amount
    strategy: 'manual' | 'auto' | 'rule-based';
    maxBid: number;          // Maximum bid limit
  };
  budget: {
    daily: number;
    total: number;
    spent: number;
  };
  targeting: {
    keywords: string[];
    categoryMatch: boolean;
    priceRange?: { min: number; max: number };
  };
  performance: {
    impressions: number;
    clicks: number;
    ctr: number;
    orders: number;
    revenue: number;
    acos: number;
    searchRank: number;
  };
  status: 'active' | 'paused' | 'outbid';
  createdAt: Date;
  updatedAt: Date;
}
```

## Bidding Strategies

### Manual
Merchant sets bid amount manually. Requires active management.

### Auto
System automatically adjusts bid based on performance targets:
- Increases bid if ACOS is below target (25%)
- Decreases bid if ACOS exceeds target by50%

### Rule-based
Custom rules defined by merchant for bid adjustments.

## Authentication

All API endpoints (except health/metrics) require JWT authentication:

```
Authorization: Bearer <token>
```

JWT payload should include:
```json
{
  "userId": "user-123",
  "merchantId": "merchant-456",
  "role": "merchant"
}
```

## Performance Metrics

| Metric | Description |
|--------|-------------|
| Impressions | Number of times ad was displayed |
| Clicks | Number of clicks on ad |
| CTR | Click-through rate (clicks/impressions) |
| Orders | Number of orders attributed to ad |
| Revenue | Total revenue from attributed orders |
| ACOS | Advertising cost of sales (spend/revenue) |
| Search Rank | Position in search results |

## Project Structure

```
sponsored-products-service/
├── src/
│   ├── config/           # Configuration modules
│   │   ├── index.ts      # Main config
│   │   └── database.ts   # Database connections
│   ├── middleware/       # Express middleware
│   │   ├── auth.ts       # JWT authentication
│   │   ├── errorHandler.ts
│   │   └── metrics.ts    # Prometheus metrics
│   ├── models/           # Mongoose models
│   │   └── SponsoredProduct.ts
│   ├── routes/          # API routes
│   │   └── sponsoredProducts.ts
│   ├── services/        # Business logic
│   │   └── SponsoredProductService.ts
│   ├── types/           # TypeScript types& Zod schemas
│   │   └── index.ts
│   ├── utils/           # Utilities
│   │   └── logger.ts
│   └── index.ts         # Application entry point
├── tests/               # Test files
├── .env.example         # Environment template
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm test -- --coverage
```

## Monitoring

### Prometheus Metrics

Access metrics at `/metrics`:

- `sponsored_products_http_requests_total` - Total HTTP requests
- `sponsored_products_http_request_duration_seconds` - Request latency
- `sponsored_products_sponsored_products_total` - Product counts by status
- `sponsored_products_active_bids_total` - Total bids placed
- `sponsored_products_impressions_total` - Ad impressions
- `sponsored_products_clicks_total` - Ad clicks
- `sponsored_products_orders_total` - Attributed orders
- `sponsored_products_revenue_total` - Attributed revenue

## License

Proprietary - AdBazaar
