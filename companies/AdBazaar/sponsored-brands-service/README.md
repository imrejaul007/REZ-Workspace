# Sponsored Brands Service

**Port: 4991** | AdBazaar - Brand advertising in retail

## Overview

The Sponsored Brands Service is a comprehensive brand advertising platform that enables brands to create, manage, and optimize brand campaigns with keyword targeting, bid management, and performance analytics.

## Features

- **Campaign Management** - Create and manage brand advertising campaigns
- **Keyword Targeting** - Add and manage keywords with match types (broad, phrase, exact)
- **Bid Management** - Manual and automatic bid strategies
- **Performance Analytics** - Real-time metrics and time-series data
- **AI Recommendations** - Smart recommendations for keywords, audiences, and budgets
- **Multi-Ad Format** - Support for headline, display, video, and search ads

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    SPONSORED BRANDS SERVICE                     │
├──��──────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │  Campaign   │  │  Keyword    │  │     Bid     │            │
│  │  Service   │  │  Service    │  │  Service    │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│  ┌─────────────┐  ┌─────────────┐                             │
│  │  Analytics  │  │Recommendation│                             │
│  │  Service   │  │  Service    │                             │
│  └─────────────┘  └─────────────┘                             │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │  Brand      │  │   Keyword   │  │   Brand     │            │
│  │  Campaign   │  │   Model     │  │  Performance│            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐                             │
│  │   MongoDB   │  │    Redis    │                             │
│  │  (Primary)  │  │   (Cache)   │                             │
│  └─────────────┘  └─────────────┘                             │
└─────────────────────────────────────────────────────────────────┘
```

## API Endpoints

### Campaign Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/brands` | Create new brand campaign |
| GET | `/api/brands` | List all campaigns |
| GET | `/api/brands/:id` | Get campaign by ID |
| PUT | `/api/brands/:id` | Update campaign |
| PATCH | `/api/brands/:id/status` | Change campaign status |
| DELETE | `/api/brands/:id` | Delete campaign |

### Keyword Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/brands/:id/keywords` | Add keywords |
| GET | `/api/brands/:id/keywords` | List keywords |
| PATCH | `/api/brands/:id/keywords/:keywordId` | Update keyword |

### Performance & Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/brands/:id/performance` | Get performance metrics |
| GET | `/api/brands/:id/analytics` | Get full analytics |
| GET | `/api/brands/:id/recommendations` | Get AI recommendations |
| GET | `/api/brands/:id/recommendations/bids` | Get bid recommendations |

### Bid Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/brands/:id/bid` | Set bid for keyword(s) |

### Health & Monitoring

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/metrics` | Prometheus metrics |

## Data Models

### BrandCampaign

```typescript
interface IBrandCampaign {
  campaignId: string;
  name: string;
  advertiserId: string;
  brandId: string;
  brandName: string;
  keywords: string[];
  matchTypes: ('broad' | 'phrase' | 'exact')[];
  budget: {
    daily: number;
    lifetime: number;
    spent: number;
  };
  status: 'draft' | 'active' | 'paused' | 'archived';
  targeting: {
    categories: string[];
    products: string[];
    audiences: string[];
    ageGroups: string[];
    gender: string[];
  };
  bidStrategy: {
    type: 'manual' | 'auto' | 'enhanced';
    defaultBid: number;
    maxBid: number;
  };
  performance: {
    impressions: number;
    clicks: number;
    spend: number;
    conversions: number;
    roas: number;
  };
}
```

### Keyword

```typescript
interface IKeyword {
  keywordId: string;
  campaignId: string;
  term: string;
  matchType: 'broad' | 'phrase' | 'exact';
  bid: {
    current: number;
    suggested: number;
    lastUpdated: Date;
  };
  performance: {
    impressions: number;
    clicks: number;
    ctr: number;
    spend: number;
    conversions: number;
    cpc: number;
    roas: number;
  };
  status: 'active' | 'paused' | 'negative';
  qualityScore: number;
  competition: 'low' | 'medium' | 'high';
  searchVolume: number;
}
```

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- MongoDB >= 6.0
- Redis >= 7.0

### Installation

```bash
cd sponsored-brands-service
npm install
```

### Configuration

Create a `.env` file:

```env
PORT=4991
MONGODB_URI=mongodb://localhost:27017/sponsored_brands
REDIS_URL=redis://localhost:6379
LOG_LEVEL=info
NODE_ENV=development
INTERNAL_SERVICE_TOKEN=adbazaar-internal-token
```

### Run Development

```bash
npm run dev
```

### Run Production

```bash
npm run build
npm start
```

## Example Usage

### Create a Campaign

```bash
curl -X POST http://localhost:4991/api/brands \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: adbazaar-internal-token" \
  -d '{
    "name": "Summer Sale 2026",
    "advertiserId": "adv_123",
    "brandId": "brand_456",
    "brandName": "Nike India",
    "keywords": ["running shoes", "sportswear"],
    "budget": {
      "daily": 100,
      "lifetime": 3000
    },
    "schedule": {
      "startDate": "2026-06-01T00:00:00Z",
      "endDate": "2026-08-31T23:59:59Z"
    },
    "creativeAssets": {
      "headlines": ["Nike Summer Sale", "Up to 40% Off"],
      "descriptions": ["Premium sportswear for athletes"]
    }
  }'
```

### Add Keywords

```bash
curl -X POST http://localhost:4991/api/brands/sb_abc123/keywords \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: adbazaar-internal-token" \
  -d '{
    "keywords": [
      { "term": "running shoes", "matchType": "broad", "bid": 0.75 },
      { "term": "sports shoes", "matchType": "phrase", "bid": 0.65 },
      { "term": "best running shoes", "matchType": "exact", "bid": 1.00 }
    ]
  }'
```

### Get Performance

```bash
curl http://localhost:4991/api/brands/sb_abc123/performance
```

### Get Recommendations

```bash
curl http://localhost:4991/api/brands/sb_abc123/recommendations
```

## Services

### CampaignService

Manages brand campaign lifecycle:

- `create(data)` - Create new campaign
- `getById(campaignId)` - Get campaign details
- `list(filters)` - List campaigns with pagination
- `update(campaignId, data)` - Update campaign
- `changeStatus(campaignId, status)` - Change campaign status
- `delete(campaignId)` - Delete campaign

### KeywordService

Manages keyword targeting:

- `addKeyword(campaignId, data)` - Add single keyword
- `bulkAddKeywords(campaignId, keywords)` - Add multiple keywords
- `listByCampaign(campaignId, filters)` - List keywords
- `update(keywordId, data)` - Update keyword
- `updateBid(keywordId, bid)` - Update keyword bid

### BidService

Handles bid management:

- `setKeywordBid(campaignId, keywordId, bid)` - Set bid for keyword
- `setBulkBids(campaignId, bids)` - Set multiple bids
- `getRecommendations(campaignId)` - Get bid recommendations
- `applyAutoBid(campaignId)` - Apply automatic bidding
- `calculateOptimalBid(campaignId, keywordId)` - Calculate optimal bid

### AnalyticsService

Provides performance analytics:

- `getCampaignPerformance(campaignId, dateRange)` - Get metrics
- `getTimeSeriesData(campaignId, days)` - Get historical data
- `getKeywordPerformance(campaignId)` - Per-keyword metrics
- `getAudienceInsights(campaignId)` - Audience breakdown
- `getBenchmarkMetrics(campaignId)` - Industry benchmarks

### RecommendationService

AI-powered recommendations:

- `getKeywordRecommendations(campaignId)` - Keyword suggestions
- `getAudienceRecommendations(campaignId)` - Audience suggestions
- `getCreativeRecommendations(campaignId)` - Creative suggestions
- `getBudgetRecommendations(campaignId)` - Budget optimization
- `getCampaignOptimization(campaignId)` - Campaign improvements
- `getBidRecommendations(campaignId)` - Bid suggestions

## Authentication

Internal services use `X-Internal-Token` header:

```bash
curl -H "X-Internal-Token: adbazaar-internal-token" ...
```

External requests can use API keys with `X-API-Key` header.

## Metrics

Prometheus metrics available at `/metrics`:

- `sponsored_brands_campaigns_total` - Total campaigns
- `sponsored_brands_keywords_total` - Total keywords
- `sponsored_brands_impressions_total` - Total impressions
- `sponsored_brands_clicks_total` - Total clicks
- `sponsored_brands_spend_total` - Total spend
- `sponsored_brands_roas` - Return on ad spend
- `sponsored_brands_errors_total` - Error counts

## Error Handling

All errors return JSON:

```json
{
  "success": false,
  "error": "Error Type",
  "message": "Human readable message",
  "details": [] // Validation errors
}
```

## License

MIT License - AdBazaar

## Version

1.0.0