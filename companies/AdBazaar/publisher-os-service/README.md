# Publisher OS Service

**AdBazaar Publisher OS** - Ad inventory management and monetization platform.

**Competitors:** Google Ad Manager, Magnite, PubMatic
**Port:** 5000

## Overview

Publisher OS is AdBazaar's enterprise-grade ad server platform that enables publishers to manage their advertising inventory, optimize yield, and maximize revenue through advanced header bidding, dynamic floor pricing, and comprehensive analytics.

## Features

### Core Capabilities

- **Publisher Management** - Register, verify, and manage publisher accounts
- **Inventory Management** - Create and manage ad inventory (banners, video, native, interstitial)
- **Placement Management** - Organize inventory into logical ad placements
- **Revenue Tracking** - Real-time revenue analytics and reporting
- **Header Bidding** - Pre-bid integration with multiple SSPs
- **Dynamic Floor Pricing** - AI-powered floor price optimization
- **Performance Analytics** - Comprehensive performance metrics and trends

### Technical Features

- Express.js + TypeScript
- MongoDB for data persistence
- Redis for caching and real-time data
- Prometheus metrics
- Winston logging
- Zod validation
- RESTful API

## Quick Start

### Installation

```bash
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/AdBazaar/publisher-os-service
npm install
```

### Configuration

Create a `.env` file:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/publisher-os
REDIS_URL=redis://localhost:6379
INTERNAL_SERVICE_TOKEN=your-internal-service-token
ADMIN_TOKEN=your-admin-token
LOG_LEVEL=info
```

### Run

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

### Health Check

```bash
curl http://localhost:5000/health
```

## API Endpoints

### Publishers

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/publishers` | Create publisher |
| GET | `/api/publishers` | List publishers |
| GET | `/api/publishers/:id` | Get publisher |
| PUT | `/api/publishers/:id` | Update publisher |
| POST | `/api/publishers/:id/verify` | Verify publisher |
| POST | `/api/publishers/:id/suspend` | Suspend publisher |
| POST | `/api/publishers/:id/reactivate` | Reactivate publisher |
| POST | `/api/publishers/:id/regenerate-key` | Regenerate API key |

### Inventory

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/publishers/:id/inventory` | Add inventory |
| GET | `/api/publishers/:id/inventory` | Get inventory |
| GET | `/api/publishers/:id/inventory/:inventoryId` | Get specific |
| PUT | `/api/publishers/:id/inventory/:inventoryId` | Update inventory |
| DELETE | `/api/publishers/:id/inventory/:inventoryId` | Delete inventory |
| POST | `/api/publishers/:id/inventory/:inventoryId/pause` | Pause inventory |
| POST | `/api/publishers/:id/inventory/:inventoryId/resume` | Resume inventory |
| GET | `/api/publishers/:id/inventory/stats` | Get stats summary |

### Placements

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/publishers/:id/placements` | Create placement |
| GET | `/api/publishers/:id/placements` | List placements |
| GET | `/api/publishers/:id/placements/:placementId` | Get placement |
| PUT | `/api/publishers/:id/placements/:placementId` | Update placement |
| POST | `/api/publishers/:id/placements/:placementId/pause` | Pause placement |
| POST | `/api/publishers/:id/placements/:placementId/resume` | Resume placement |
| DELETE | `/api/publishers/:id/placements/:placementId` | Archive placement |

### Revenue

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/publishers/:id/revenue` | Record revenue |
| GET | `/api/publishers/:id/revenue` | Get revenue summary |
| GET | `/api/publishers/:id/revenue/timeseries` | Get time series |
| GET | `/api/publishers/:id/revenue/breakdown` | Get breakdown |
| GET | `/api/publishers/:id/revenue/top-inventory` | Get top inventory |
| GET | `/api/publishers/:id/revenue/hourly-patterns` | Get hourly patterns |

### Performance

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/publishers/:id/performance` | Get comprehensive metrics |
| GET | `/api/publishers/:id/performance/realtime` | Get real-time metrics |
| GET | `/api/publishers/:id/performance/trends` | Get performance trends |

### Floor Prices

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/publishers/:id/floor-prices` | Set floor price rule |
| GET | `/api/publishers/:id/floor-prices` | Get all rules |
| GET | `/api/publishers/:id/floor-prices/:ruleId` | Get specific rule |
| PUT | `/api/publishers/:id/floor-prices/:ruleId` | Update rule |
| DELETE | `/api/publishers/:id/floor-prices/:ruleId` | Delete rule |
| GET | `/api/publishers/:id/floor-prices/:inventoryId/price` | Get price |
| GET | `/api/publishers/:id/floor-prices/optimize` | Get optimization |

### Header Bidding

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/publishers/:id/header-bidding` | Get config |
| PUT | `/api/publishers/:id/header-bidding` | Update config |
| POST | `/api/publishers/:id/header-bidding/enable` | Enable |
| POST | `/api/publishers/:id/header-bidding/disable` | Disable |
| POST | `/api/publishers/:id/header-bidding/bidders` | Add bidder |
| DELETE | `/api/publishers/:id/header-bidding/bidders/:bidderId` | Remove bidder |
| GET | `/api/publishers/:id/header-bidding/tag` | Get tag |

## Authentication

### Internal Service Token

```bash
curl -H "X-Internal-Token: your-token" http://localhost:5000/api/publishers
```

### Admin Token

```bash
curl -H "X-Admin-Token: your-admin-token" http://localhost:5000/api/publishers/123/verify
```

### Publisher API Key

```bash
curl -H "X-Publisher-Key: pub_xxxxx" http://localhost:5000/api/publishers/123/inventory
```

## Data Models

### Publisher

```typescript
{
  name: string;
  slug: string;
  domains: string[];
  contact: { name, email, phone, title };
  category: string;
  verified: boolean;
  settings: {
    defaultFloorPrice: number;
    revenueShare: number;
    headerBiddingEnabled: boolean;
    brandSafety: { level, customFilters };
    pacing: { dailyLimit, monthlyLimit };
  };
  stats: { totalImpressions, totalRevenue, fillRate, avgEcpm };
  status: 'active' | 'suspended' | 'inactive';
}
```

### Inventory

```typescript
{
  publisherId: string;
  name: string;
  code: string;
  type: 'banner' | 'video' | 'native' | 'interstitial' | 'rewarded' | 'CTV';
  adTypes: string[];
  dimensions: { width, height, size };
  position: string;
  floorPrice: number;
  targeting: { geo, device, dayparting, audience, content };
  stats: { totalRequests, totalImpressions, fillRate, avgEcpm };
}
```

### Placement

```typescript
{
  publisherId: string;
  name: string;
  code: string;
  sizes: { width, height }[];
  adTypes: ('banner' | 'video' | 'native' | 'richmedia' | 'CTV')[];
  positions: string[];
  floorPrice: number;
  settings: { viewabilityTarget, brandSafetyLevel, pacing };
  targeting: { geo, device, dayparting, audience, content };
  childInventories: string[];
}
```

### Revenue

```typescript
{
  publisherId: string;
  date: Date;
  impressions: number;
  revenue: number;
  ecpm: number;
  adType: string;
  country?: string;
  device?: string;
  viewability: number;
  clicks: number;
  conversions: number;
}
```

## Competitor Comparison

| Feature | Google Ad Manager | Magnite | PubMatic | Publisher OS |
|---------|-------------------|---------|----------|--------------|
| Inventory Types | All | All | All | All |
| Header Bidding | Advanced | Advanced | Advanced | Advanced |
| Dynamic Floor Pricing | Limited | Limited | Limited | AI-Powered |
| Real-time Analytics | Yes | Yes | Yes | Yes |
| API Access | Limited | Yes | Yes | Full |
| Customization | Limited | Medium | Medium | High |
| Multi-tenant | No | Yes | Yes | Yes |
| Brand Safety | Basic | Advanced | Advanced | AI-Enhanced |

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Publisher OS Service                       │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  Publisher │  │  Inventory │  │  Placement  │             │
│  │  Service   │  │  Service   │  │  Service    │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  Revenue   │  │ Floor Price │  │ Header      │             │
│  │  Service   │  │  Service    │  │ Bidding     │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
├─────────────────────────────────────────────────────────────────┤
│                    Prometheus Metrics                           │
│                    Winston Logging                               │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐              ┌─────────────┐                  │
│  │   MongoDB   │              │    Redis    │                  │
│  └─────────────┘              └─────────────┘                  │
└─────────────────────────────────────────────────────────────────┘
```

## Monitoring

### Prometheus Metrics

```bash
curl http://localhost:5000/metrics
```

Key metrics:
- `publisher_os_publishers_total` - Total publishers
- `publisher_os_inventory_total` - Total inventory
- `publisher_os_revenue_total` - Total revenue
- `publisher_os_impressions_total` - Total impressions
- `http_request_duration_seconds` - Request latency

### Health Check

```bash
curl http://localhost:5000/health
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 5000 | Server port |
| NODE_ENV | development | Environment |
| MONGODB_URI | mongodb://localhost:27017/publisher-os | MongoDB URI |
| REDIS_URL | redis://localhost:6379 | Redis URL |
| INTERNAL_SERVICE_TOKEN | - | Internal service auth |
| ADMIN_TOKEN | - | Admin auth |
| LOG_LEVEL | info | Log level |
| CORS_ORIGINS | * | CORS origins |

## License

Proprietary - AdBazaar