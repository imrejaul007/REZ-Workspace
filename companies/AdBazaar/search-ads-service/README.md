# Search Ads Service

**Port: 4993**

AdBazaar's Search Engine Advertising Platform - A comprehensive search ads management service that enables advertisers to create, manage, and optimize search advertising campaigns across multiple search networks (Google, Bing, Yahoo).

## Features

- **Campaign Management**: Create and manage search advertising campaigns with configurable budgets, targeting, and bidding strategies
- **Ad Management**: Create and manage text ads with headlines and descriptions
- **Keyword Management**: Add keywords with different match types (exact, phrase, broad, modified broad)
- **Quality Score**: Real-time quality score calculation based on CTR, relevance, and landing page experience
- **Performance Analytics**: Track impressions, clicks, CTR, CPC, conversions, and ROAS
- **Campaign Optimization**: Automatic and manual optimization of bids and keywords based on performance
- **Multi-Network Support**: Support for Google, Bing, and Yahoo search networks

## Architecture

```
search-ads-service/
├── src/
│   ├── config/           # Configuration management
│   ├── models/           # Mongoose schemas
│   │   ├── SearchCampaign.ts
│   │   ├── SearchAd.ts
│   │   ├── SearchKeyword.ts
│   │   └── SearchPerformance.ts
│   ├── services/         # Business logic
│   │   ├── campaignService.ts
│   │   ├── adService.ts
│   │   ├── keywordService.ts
│   │   ├── qualityScoreService.ts
│   │   └── optimizationService.ts
│   ├── middleware/       # Express middleware
│   │   └── auth.ts
│   ├── utils/           # Utilities
│   │   ├── logger.ts
│   │   └── metrics.ts
│   ├── types/           # TypeScript types
│   │   └── index.ts
│   └── index.ts         # Main entry point
├── package.json
├── tsconfig.json
└── README.md
```

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB 6+
- Redis 7+

### Installation

```bash
cd search-ads-service
npm install
```

### Configuration

Create a `.env` file with the following variables:

```env
PORT=4993
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/search-ads
REDIS_HOST=localhost
REDIS_PORT=6379
INTERNAL_SERVICE_TOKEN=your-internal-token
LOG_LEVEL=info
```

### Running the Service

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## API Endpoints

### Health & Metrics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/metrics` | Prometheus metrics |

### Campaign Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/search/campaigns` | Create campaign |
| GET | `/api/search/campaigns/:id` | Get campaign |
| GET | `/api/search/campaigns` | List campaigns |
| PUT | `/api/search/campaigns/:id` | Update campaign |
| POST | `/api/search/campaigns/:id/activate` | Activate campaign |
| POST | `/api/search/campaigns/:id/pause` | Pause campaign |

### Ad Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/search/campaigns/:id/ads` | Create ad |
| GET | `/api/search/campaigns/:id/ads` | List ads |
| PUT | `/api/search/ads/:adId` | Update ad |

### Keyword Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/search/campaigns/:id/keywords` | Add keyword |
| GET | `/api/search/campaigns/:id/keywords` | List keywords |
| PUT | `/api/search/keywords/:keywordId` | Update keyword |

### Performance & Optimization

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/search/campaigns/:id/performance` | Get performance |
| GET | `/api/search/campaigns/:id/quality-score` | Get quality scores |
| POST | `/api/search/campaigns/:id/optimize` | Optimize campaign |
| POST | `/api/search/campaigns/:id/auto-optimize` | Auto-optimize |

## API Examples

### Create Campaign

```bash
curl -X POST http://localhost:4993/api/search/campaigns \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: your-token" \
  -d '{
    "name": "Summer Sale Campaign",
    "advertiserId": "adv_123",
    "budget": {
      "daily": 100,
      "total": 3000
    },
    "network": "google",
    "bidding": {
      "strategy": "cpc",
      "defaultCpc": 1.50
    },
    "targeting": {
      "locations": ["India"],
      "languages": ["en"]
    }
  }'
```

### Create Ad

```bash
curl -X POST http://localhost:4993/api/search/campaigns/:id/ads \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: your-token" \
  -d '{
    "headline": "Buy Summer Collection",
    "description": "Up to 50% off on all items. Free shipping on orders over 999.",
    "url": "https://example.com/summer-sale",
    "displayUrl": "example.com/summer"
  }'
```

### Add Keywords

```bash
curl -X POST http://localhost:4993/api/search/campaigns/:id/keywords \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: your-token" \
  -d '{
    "term": "summer clothes",
    "matchType": "broad",
    "bid": 2.00
  }'
```

### Optimize Campaign

```bash
curl -X POST http://localhost:4993/api/search/campaigns/:id/optimize \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: your-token" \
  -d '{
    "strategy": "moderate",
    "minQualityScore": 5
  }'
```

## Data Models

### SearchCampaign

| Field | Type | Description |
|-------|------|-------------|
| name | string | Campaign name |
| advertiserId | string | Advertiser identifier |
| budget.daily | number | Daily budget |
| budget.total | number | Total budget |
| budget.spent | number | Amount spent |
| network | enum | google, bing, yahoo, all |
| status | enum | active, paused, ended, pending |
| targeting | object | Targeting options |
| bidding.strategy | enum | cpc, cpm, target_roas, max_conversions |
| bidding.defaultCpc | number | Default CPC bid |

### SearchAd

| Field | Type | Description |
|-------|------|-------------|
| campaignId | ObjectId | Parent campaign |
| headline | string | Ad headline (max 90 chars) |
| description | string | Ad description (max 180 chars) |
| description2 | string | Second description (optional) |
| url | string | Destination URL |
| displayUrl | string | Display URL (max 35 chars) |
| status | enum | active, paused, ended, pending |

### SearchKeyword

| Field | Type | Description |
|-------|------|-------------|
| campaignId | ObjectId | Parent campaign |
| term | string | Keyword term |
| matchType | enum | exact, phrase, broad, modified_broad |
| bid | number | Keyword bid amount |
| qualityScore | number | Quality score (1-10) |
| estimatedCpc | number | Estimated CPC |

### SearchPerformance

| Field | Type | Description |
|-------|------|-------------|
| campaignId | ObjectId | Campaign reference |
| date | Date | Performance date |
| impressions | number | Number of impressions |
| clicks | number | Number of clicks |
| ctr | number | Click-through rate (%) |
| cpc | number | Cost per click |
| spend | number | Total spend |
| conversions | number | Number of conversions |
| roas | number | Return on ad spend |

## Quality Score Factors

| Factor | Weight | Description |
|--------|--------|-------------|
| Expected CTR | 30% | Historical click-through rate |
| Ad Relevance | 25% | Keyword-ad relevance |
| Landing Page | 20% | Landing page experience |
| Ad Copy | 15% | Ad copy quality |
| Historical | 10% | Historical performance |

## Optimization Strategies

### Aggressive
- 50% larger bid adjustments
- Faster scaling for high performers
- Quick pausing of low performers
- Recommended for campaigns with ROAS > 5

### Moderate
- Standard bid adjustments
- Balanced approach
- Recommended for normal campaigns

### Conservative
- 50% smaller bid adjustments
- Minimal changes
- Recommended for campaigns with ROAS < 1

## Authentication

All API endpoints require the `X-Internal-Token` header for internal service authentication:

```
X-Internal-Token: your-internal-service-token
```

## Metrics

Prometheus metrics are available at `/metrics`:

- `search_ads_http_requests_total` - HTTP request counter
- `search_ads_http_request_duration_seconds` - Request duration histogram
- `search_ads_active_campaigns` - Active campaigns gauge
- `search_ads_campaign_spend_total` - Total spend counter
- `search_ads_impressions_total` - Impressions counter
- `search_ads_clicks_total` - Clicks counter
- `search_ads_conversions_total` - Conversions counter
- `search_ads_quality_score_distribution` - Quality score histogram
- `search_ads_optimizations_total` - Optimization counter

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 4993 | Service port |
| NODE_ENV | development | Environment |
| MONGODB_URI | mongodb://localhost:27017/search-ads | MongoDB connection |
| REDIS_HOST | localhost | Redis host |
| REDIS_PORT | 6379 | Redis port |
| REDIS_PASSWORD | - | Redis password |
| INTERNAL_SERVICE_TOKEN | - | Internal auth token |
| LOG_LEVEL | info | Log level |
| METRICS_ENABLED | true | Enable Prometheus metrics |

## License

Proprietary - AdBazaar