# Instagram Shop Integration Service

**Port:** 5080

**Version:** 1.0.0

**Purpose:** Connect Instagram Shop for product tagging and in-app checkout

## Overview

This service provides integration with Instagram's Shopping API, enabling merchants to:
- Sync products to Instagram Shopping catalog
- Create and manage orders through Instagram
- Track product tagging suggestions
- View shop analytics and performance metrics

## Tech Stack

- **Runtime:** Node.js with TypeScript
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose
- **Monitoring:** Prometheus metrics
- **Logging:** Winston
- **Validation:** Zod

## Quick Start

### Installation

```bash
cd instagram-shop-integration
npm install
```

### Configuration

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Required environment variables:
- `INSTAGRAM_BUSINESS_ACCOUNT_ID` - Your Instagram Business Account ID
- `INSTAGRAM_CATALOG_ID` - Your Facebook Catalog ID
- `FACEBOOK_ACCESS_TOKEN` - Facebook API access token
- `FACEBOOK_APP_ID` - Facebook App ID
- `FACEBOOK_APP_SECRET` - Facebook App Secret

### Run Development Server

```bash
npm run dev
```

### Run Production Build

```bash
npm run build
npm start
```

## API Endpoints

### Health & Monitoring

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/ready` | GET | Readiness check |
| `/metrics` | GET | Prometheus metrics |

### Products

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/products` | POST | Create a new product |
| `/api/products` | GET | List products |
| `/api/products/:id` | GET | Get product by ID |
| `/api/products/:id` | PATCH | Update product |
| `/api/products/:id` | DELETE | Delete product |
| `/api/products/sync` | POST | Sync product to Instagram |
| `/api/products/:id/sync` | POST | Sync specific product |
| `/api/products/:id/tags` | GET | Get tagging suggestions |
| `/api/products/:id/availability` | PATCH | Update availability |

### Orders

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/orders` | POST | Create a new order |
| `/api/orders` | GET | List orders |
| `/api/orders/stats` | GET | Get order statistics |
| `/api/orders/:id` | GET | Get order by ID |
| `/api/orders/:id/status` | PATCH | Update order status |
| `/api/orders/:id/cancel` | POST | Cancel order |
| `/api/orders/user/:userId` | GET | Get user's orders |

### Analytics

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/analytics` | GET | Shop performance analytics |
| `/api/analytics/daily` | GET | Daily analytics |
| `/api/analytics/products/:id` | GET | Product analytics |
| `/api/analytics/record` | POST | Record daily analytics |

### Webhooks

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/webhooks/instagram` | GET | Webhook verification |
| `/api/webhooks/instagram` | POST | Handle webhook events |

## Data Models

### Product

```typescript
interface IProduct {
  id: string;
  catalogId: string;
  instagramProductId?: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  images: string[];
  availability: 'in_stock' | 'out_of_stock' | 'preorder';
  category: string;
  syncStatus: 'pending' | 'synced' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}
```

### ShopOrder

```typescript
interface IShopOrder {
  id: string;
  instagramOrderId?: string;
  productId: string;
  userId: string;
  quantity: number;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: {
    name: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

## Authentication

Protected routes require one of:
- `X-Internal-Token` header (for internal services)
- `Authorization: Bearer <token>` header (for user authentication)

## Instagram API Integration

This service integrates with:

1. **Instagram Graph API** - For commerce operations
2. **Facebook Marketing API** - For catalog management
3. **Webhooks** - For real-time order updates

### Required Permissions

- `catalog_management`
- `commerce_account_read`
- `commerce_account_write`
- `instagram_basic`
- `instagram_content_publish`
- `instagram_shopping_tag_products`

## Error Handling

All errors return a consistent JSON structure:

```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional details (development only)"
}
```

## Monitoring

### Prometheus Metrics

- `http_requests_total` - Total HTTP requests
- `http_request_duration_seconds` - Request duration histogram
- Default Node.js metrics (memory, CPU, event loop)

### Logging

Logs are output to stdout in JSON format with:
- Timestamp
- Level (info, warn, error)
- Message
- Metadata

## Development

### Project Structure

```
src/
├── index.ts          # Entry point
├── config/           # Configuration
├── models/           # Mongoose models
├── services/         # Business logic
├── routes/           # Express routes
├── middleware/       # Express middleware
└── utils/            # Utilities
```

### Running Tests

```bash
npm test
npm run test:watch
```

## Production Deployment

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/ ./dist/
CMD ["node", "dist/index.js"]
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | No (default: 5080) |
| `NODE_ENV` | Environment | No |
| `MONGODB_URI` | MongoDB connection string | Yes |
| `INSTAGRAM_BUSINESS_ACCOUNT_ID` | IG Business Account ID | Yes |
| `INSTAGRAM_CATALOG_ID` | Catalog ID | Yes |
| `FACEBOOK_ACCESS_TOKEN` | FB Access Token | Yes |
| `FACEBOOK_APP_ID` | FB App ID | Yes |
| `FACEBOOK_APP_SECRET` | FB App Secret | Yes |

## License

Proprietary - AdBazaar