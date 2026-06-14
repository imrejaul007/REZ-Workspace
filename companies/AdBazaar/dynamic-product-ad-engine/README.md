# Dynamic Product Ad Engine (DPA)

**Port:** 4841

A powerful service for creating dynamic product ads from product feeds - one template, thousands of personalized ads.

## Overview

The Dynamic Product Ad Engine enables advertisers to:
- Upload product feeds from multiple sources (manual, Shopify, WooCommerce, etc.)
- Create template-based dynamic ad campaigns
- Render personalized ads for specific products and users
- Track performance metrics (impressions, clicks, conversions)

## Features

- **Product Feed Management**
  - Support for multiple feed sources (manual, Shopify, WooCommerce, etc.)
  - Automatic product syncing
  - Inventory filtering (price, category, stock status)
  - Real-time product availability

- **Template-Based Ad Rendering**
  - Multiple layout types (single, grid, carousel, hero, collection)
  - Customizable element positioning and styling
  - Dynamic content substitution (product image, name, price, discount)
  - HTML output with tracking parameters

- **Advanced Targeting**
  - Rule-based product filtering
  - User segment targeting
  - Browsing history personalization
  - Cart abandonment retargeting
  - Discount threshold rules

- **Performance Tracking**
  - Impressions, clicks, orders tracking
  - CTR and conversion rate calculation
  - Revenue and ROAS metrics
  - Campaign-level analytics

## Quick Start

### Installation

```bash
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/AdBazaar/dynamic-product-ad-engine
npm install
```

### Configuration

Create a `.env` file or set environment variables:

```env
PORT=4841
MONGODB_URI=mongodb://localhost:27017/dynamic-product-ad
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-jwt-secret-change-in-production
IMAGE_CDN_URL=https://cdn.adbazaar.com
ALLOWED_ORIGINS=https://rez.money,https://admin.rez.money,https://ads.rez.money
```

### Run

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

### Feed Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/dpa/feed` | Upload a new product feed |
| GET | `/api/dpa/feeds` | List all feeds |
| GET | `/api/dpa/feeds/:id` | Get feed details |
| PUT | `/api/dpa/feeds/:id` | Update feed products |
| DELETE | `/api/dpa/feeds/:id` | Delete a feed |
| POST | `/api/dpa/feeds/:id/sync` | Sync feed from source |
| POST | `/api/dpa/feeds/:id/pause` | Pause a feed |
| POST | `/api/dpa/feeds/:id/activate` | Activate a feed |
| GET | `/api/dpa/feeds/:id/products` | Get filtered products |

### Campaign Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/dpa/campaign` | Create a DPA campaign |
| GET | `/api/dpa/campaigns` | List all campaigns |
| GET | `/api/dpa/campaigns/:id` | Get campaign details |
| PUT | `/api/dpa/campaigns/:id` | Update campaign |
| DELETE | `/api/dpa/campaigns/:id` | Delete campaign |
| POST | `/api/dpa/campaigns/:id/activate` | Activate campaign |
| POST | `/api/dpa/campaigns/:id/pause` | Pause campaign |
| GET | `/api/dpa/campaigns/:id/preview` | Preview dynamic ad |
| GET | `/api/dpa/campaigns/:id/metrics` | Get campaign metrics |
| POST | `/api/dpa/campaigns/:id/record-click` | Record a click |
| POST | `/api/dpa/campaigns/:id/record-conversion` | Record a conversion |

### Ad Rendering

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/dpa/render` | Render a dynamic ad |
| POST | `/api/dpa/render/batch` | Render multiple ads |
| GET | `/api/dpa/render/personalized` | Get personalized products |
| POST | `/api/dpa/render/track/impression` | Track impression |
| POST | `/api/dpa/render/track/click` | Track click |
| POST | `/api/dpa/render/track/conversion` | Track conversion |

### Health & Metrics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/ready` | Readiness check |
| GET | `/metrics` | Prometheus metrics |

## Usage Examples

### 1. Upload a Product Feed

```bash
curl -X POST http://localhost:4841/api/dpa/feed \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "name": "Electronics Store",
    "merchantId": "merchant-001",
    "source": "manual",
    "products": [
      {
        "productId": "prod-001",
        "name": "Wireless Headphones",
        "category": "Electronics",
        "price": 1999,
        "originalPrice": 2999,
        "imageUrl": "https://example.com/headphones.jpg",
        "url": "https://store.com/headphones",
        "availability": "in_stock"
      }
    ]
  }'
```

### 2. Create a DPA Campaign

```bash
curl -X POST http://localhost:4841/api/dpa/campaign \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "name": "Summer Sale Campaign",
    "advertiserId": "advertiser-001",
    "feedId": "feed-abc123",
    "template": {
      "layout": "single",
      "dimensions": { "width": 1200, "height": 628 },
      "elements": [
        {
          "type": "product_image",
          "position": { "x": 0, "y": 0, "width": 600, "height": 628 },
          "style": {}
        },
        {
          "type": "product_name",
          "position": { "x": 620, "y": 100, "width": 560, "height": 50 },
          "style": { "fontSize": 24, "fontWeight": "bold" }
        },
        {
          "type": "price",
          "position": { "x": 620, "y": 160, "width": 200, "height": 40 },
          "style": { "fontSize": 20, "color": "#4CAF50" }
        },
        {
          "type": "discount",
          "position": { "x": 620, "y": 200, "width": 150, "height": 30 },
          "style": {}
        },
        {
          "type": "cta",
          "position": { "x": 620, "y": 500, "width": 200, "height": 50 },
          "style": { "backgroundColor": "#ff4444", "color": "white" }
        }
      ]
    },
    "rules": {
      "minPrice": 500,
      "maxPrice": 5000,
      "inStockOnly": true
    },
    "targeting": {
      "cartAbandoners": true
    }
  }'
```

### 3. Preview an Ad

```bash
curl http://localhost:4841/api/dpa/campaigns/dpa-abc123/preview?productId=prod-001
```

### 4. Render an Ad

```bash
curl -X POST http://localhost:4841/api/dpa/render \
  -H "Content-Type: application/json" \
  -d '{
    "campaignId": "dpa-abc123",
    "productId": "prod-001",
    "userId": "user-123",
    "context": {
      "deviceType": "mobile",
      "location": { "country": "India", "city": "Mumbai" }
    }
  }'
```

## Data Models

### ProductFeed

```typescript
interface ProductFeed {
  feedId: string;
  merchantId: string;
  name: string;
  source: 'manual' | 'shopify' | 'woocommerce' | 'magento' | 'bigcommerce' | 'api';
  products: Product[];
  stats: {
    totalProducts: number;
    activeProducts: number;
    outOfStockProducts: number;
    lastSynced: Date;
  };
  status: 'active' | 'syncing' | 'paused' | 'error';
  createdAt: Date;
}
```

### DPACampaign

```typescript
interface DPACampaign {
  campaignId: string;
  advertiserId: string;
  name: string;
  feedId: string;
  template: AdTemplate;
  rules: TargetingRules;
  targeting: UserTargeting;
  metrics: CampaignMetrics;
  status: 'active' | 'paused' | 'completed' | 'draft';
  budget?: {
    daily?: number;
    total?: number;
    spent: number;
  };
  createdAt: Date;
}
```

### AdTemplate

```typescript
interface AdTemplate {
  layout: 'grid' | 'carousel' | 'single' | 'hero' | 'collection';
  dimensions: { width: number; height: number };
  elements: TemplateElement[];
  backgroundColor?: string;
}

interface TemplateElement {
  type: 'product_image' | 'product_name' | 'price' | 'discount' | 'cta' | 'logo';
  position: { x: number; y: number; width: number; height: number };
  style: ElementStyle;
}
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    API Layer (Express)                       │
├─────────────────────────────────────────────────────────────┤
│  Routes: /api/dpa/feed, /api/dpa/campaign, /api/dpa/render  │
├─────────────────────────────────────────────────────────────┤
│                     Services Layer                          │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐       │
│  │ FeedService  │ │CampaignService│ │RendererService│      │
│  └──────────────┘ └──────────────┘ └──────────────┘       │
├─────────────────────────────────────────────────────────────┤
│                     Models Layer                            │
│  ┌──────────────┐ ┌──────────────┐                        │
│  │ ProductFeed  │ │  DPACampaign │                        │
│  └──────────────┘ └──────────────┘                        │
├─────────────────────────────────────────────────────────────┤
│                  Infrastructure                             │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐       │
│  │   MongoDB    │ │    Redis     │ │ Prometheus   │       │
│  └──────────────┘ └──────────────┘ └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

## Project Structure

```
dynamic-product-ad-engine/
├── package.json
├── tsconfig.json
├── jest.config.js
├── README.md
├── src/
│   ├── index.ts              # Main entry point
│   ├── config/
│   │   └── index.ts          # Configuration
│   ├── types/
│   │   └── index.ts          # TypeScript interfaces
│   ├── models/
│   │   ├── ProductFeed.ts    # Product feed model
│   │   ├── DPACampaign.ts     # Campaign model
│   │   └── index.ts          # Models export
│   ├── services/
│   │   ├── FeedService.ts    # Feed management
│   │   ├── CampaignService.ts # Campaign management
│   │   ├── RendererService.ts # Ad rendering
│   │   └── index.ts          # Services export
│   ├── routes/
│   │   ├── feedRoutes.ts     # Feed endpoints
│   │   ├── campaignRoutes.ts # Campaign endpoints
│   │   ├── renderRoutes.ts   # Render endpoints
│   │   └── index.ts          # Routes export
│   ├── middleware/
│   │   ├── auth.ts           # JWT authentication
│   │   ├── metrics.ts        # Prometheus metrics
│   │   ├── validation.ts     # Zod validation
│   │   └── index.ts          # Middleware export
│   └── utils/
│       ├── logger.ts         # Logging utility
│       └── validation.ts    # Zod schemas
└── tests/
    ├── setup.ts
    ├── services/
    │   └── RendererService.test.ts
    ├── middleware/
    │   └── auth.test.ts
    └── utils/
        └── validation.test.ts
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 4841 | Service port |
| NODE_ENV | development | Environment mode |
| MONGODB_URI | mongodb://localhost:27017/dynamic-product-ad | MongoDB connection |
| REDIS_URL | redis://localhost:6379 | Redis connection |
| REDIS_ENABLED | true | Enable/disable Redis |
| JWT_SECRET | (required) | JWT signing secret |
| JWT_EXPIRES_IN | 24h | Token expiration |
| IMAGE_CDN_URL | https://cdn.adbazaar.com | CDN base URL |
| ALLOWED_ORIGINS | (comma-separated URLs) | CORS allowed origins |
| RATE_LIMIT_WINDOW_MS | 900000 | Rate limit window (15 min) |
| RATE_LIMIT_MAX_REQUESTS | 100 | Max requests per window |
| LOG_LEVEL | info | Logging level |

## Security

- JWT authentication required for all write operations
- Optional authentication for ad rendering/preview
- Role-based access control (advertiser, admin, viewer)
- CORS protection with whitelist
- Rate limiting (100 requests per 15 minutes)
- Input validation with Zod schemas
- Helmet security headers

## Monitoring

Prometheus metrics available at `/metrics`:

- `dpa_http_requests_total` - HTTP request counter
- `dpa_http_request_duration_seconds` - Request duration histogram
- `dpa_feeds_created_total` - Feeds created counter
- `dpa_campaigns_created_total` - Campaigns created counter
- `dpa_ads_rendered_total` - Ads rendered counter
- `dpa_impressions_total` - Impressions counter
- `dpa_clicks_total` - Clicks counter
- `dpa_conversions_total` - Conversions counter
- `dpa_active_campaigns` - Active campaigns gauge
- `dpa_active_feeds` - Active feeds gauge
- `dpa_products_in_feeds` - Total products gauge

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- tests/services/RendererService.test.ts
```

## License

MIT