# REZ Creator Commerce Service

**Version:** 1.0.0
**Date:** June 7, 2026
**Status:** COMPLETE - Full Implementation

## Overview

REZ Creator Commerce is a comprehensive creator commerce platform that enables creators to manage their profiles, products, commissions, orders, and analytics. Built on Express.js with MongoDB (Mongoose) and Redis for caching.

## Service Details

| Property | Value |
|----------|-------|
| **Port** | 4150 |
| **Company** | AdBazaar |
| **Location** | `/AdBazaar/REZ-creator-commerce/` |
| **Tech Stack** | Express.js, Mongoose, Redis, Winston, Zod, TypeScript |
| **MongoDB** | ✅ Integrated |
| **Redis** | ✅ Integrated |

## Architecture

```
REZ-creator-commerce/
├── src/
│   ├── index.ts              # Main entry point
│   ├── config.ts             # Environment configuration
│   ├── types/
│   │   └── index.ts          # TypeScript interfaces
│   ├── models/
│   │   ├── Creator.ts        # Creator profile model
│   │   ├── Product.ts        # Creator product model
│   │   ├── Order.ts          # Order model
│   │   ├── Analytics.ts       # Analytics model
│   │   └── Payout.ts          # Payout model
│   ├── services/
│   │   ├── creator.service.ts
│   │   ├── product.service.ts
│   │   ├── order.service.ts
│   │   ├── analytics.service.ts
│   │   ├── payout.service.ts
│   │   └── cache.service.ts
│   └── routes/
│       ├── creator.routes.ts
│       ├── product.routes.ts
│       ├── order.routes.ts
│       ├── analytics.routes.ts
│       └── payout.routes.ts
├── package.json
├── tsconfig.json
└── CLAUDE.md
```

## API Endpoints

### Creators
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/creators` | List all creators (paginated) |
| POST | `/api/creators` | Create new creator |
| GET | `/api/creators/:id` | Get creator by ID |
| PUT | `/api/creators/:id` | Update creator |
| DELETE | `/api/creators/:id` | Delete creator |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/creators/:id/products` | List creator products |
| POST | `/api/creators/:id/products` | Create product for creator |
| GET | `/api/products/:id` | Get product by ID |
| PUT | `/api/products/:id` | Update product |
| DELETE | `/api/products/:id` | Delete product |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/creators/:id/orders` | List creator orders |
| POST | `/api/orders` | Create new order |
| GET | `/api/orders/:id` | Get order by ID |
| PUT | `/api/orders/:id` | Update order status |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/creators/:id/analytics` | Get creator analytics |
| GET | `/api/analytics/overview` | Platform-wide analytics |

### Payouts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/creators/:id/payouts` | List creator payouts |
| POST | `/api/payouts/request` | Request payout |
| GET | `/api/payouts/:id` | Get payout by ID |
| PUT | `/api/payouts/:id` | Update payout status |

## Data Models

### Creator
```typescript
{
  _id: ObjectId,
  name: string,
  email: string,
  bio: string,
  avatar: string,
  socialLinks: {
    instagram?: string,
    twitter?: string,
    youtube?: string,
    tiktok?: string,
    website?: string
  },
  categories: string[],
  rating: number,
  totalProducts: number,
  totalOrders: number,
  totalEarnings: number,
  pendingPayout: number,
  status: 'active' | 'inactive' | 'suspended',
  onboardingComplete: boolean,
  bankDetails: {
    accountNumber: string,
    ifsc: string,
    bankName: string,
    accountHolder: string
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Product
```typescript
{
  _id: ObjectId,
  creatorId: ObjectId,
  name: string,
  description: string,
  price: number,
  commission: number,        // Percentage (0-100)
  commissionAmount: number,  // Calculated: price * commission / 100
  inventory: number,
  category: string,
  images: string[],
  status: 'active' | 'inactive' | 'sold_out',
  createdAt: Date,
  updatedAt: Date
}
```

### Order
```typescript
{
  _id: ObjectId,
  creatorId: ObjectId,
  productId: ObjectId,
  customerId: string,
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded',
  amount: number,
  commissionAmount: number,
  netEarnings: number,
  quantity: number,
  customerEmail: string,
  customerName: string,
  shippingAddress?: {
    street: string,
    city: string,
    state: string,
    pincode: string,
    country: string
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Analytics
```typescript
{
  _id: ObjectId,
  creatorId: ObjectId,
  date: Date,
  totalEarnings: number,
  totalOrders: number,
  totalProducts: number,
  conversionRate: number,
  pageViews: number,
  uniqueVisitors: number,
  topProducts: Array<{ productId: ObjectId, count: number }>,
  earningsByDay: Array<{ date: Date, amount: number }>,
  createdAt: Date,
  updatedAt: Date
}
```

### Payout
```typescript
{
  _id: ObjectId,
  creatorId: ObjectId,
  amount: number,
  status: 'pending' | 'processing' | 'completed' | 'failed',
  method: 'bank_transfer' | 'upi' | 'wallet',
  transactionId?: string,
  bankReference?: string,
  notes?: string,
  requestedAt: Date,
  processedAt?: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## Business Logic

### Commission Calculation
```typescript
commissionAmount = orderAmount * (commissionRate / 100)
netEarnings = orderAmount - commissionAmount
```

### Payout Processing
1. Creator requests payout
2. System validates minimum amount (₹100)
3. Validates creator has sufficient pending earnings
4. Creates payout record with status 'pending'
5. Admin approves/processes payout
6. Status updated to 'processing' then 'completed'

### Analytics Aggregation
- Daily aggregation of earnings, orders, conversions
- Rolling 30-day, 90-day, 365-day summaries
- Real-time updates on order completion

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 4150 | Service port |
| MONGODB_URI | mongodb://localhost:27017/rez-creator-commerce | MongoDB connection |
| REDIS_HOST | localhost | Redis host |
| REDIS_PORT | 6379 | Redis port |
| NODE_ENV | development | Environment |
| LOG_LEVEL | info | Winston log level |

## Quick Start

```bash
# Install dependencies
cd /AdBazaar/REZ-creator-commerce
npm install

# Start development server
npm run dev

# Health check
curl http://localhost:4150/health

# Create creator
curl -X POST http://localhost:4150/api/creators \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Creator",
    "email": "john@example.com",
    "bio": "Content creator",
    "categories": ["fashion", "lifestyle"]
  }'
```

## Ecosystem Integration

| Service | Integration | Purpose |
|---------|-------------|---------|
| RABTUL Auth | User authentication | Creator login |
| RABTUL Wallet | Payment processing | Order payments |
| RABTUL Notifications | Push/SMS | Order updates |
| HOJAI AI | Analytics intelligence | Earnings predictions |

## Search Keywords
- creator commerce
- creator profile
- product management
- commission tracking
- payout processing
- creator analytics

## Related Services
- `/AdBazaar/creators/creator-qr` - Creator QR codes
- `/AdBazaar/creators/creator-qr-service` - Creator QR backend
- `/AdBazaar/adsqr` - Ad campaign QR

---

**Last Updated:** June 7, 2026
**Version:** 1.0.0
