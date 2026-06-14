# Website SSP SDK Service

Backend service for the AdBazaar JavaScript SDK - enables web publishers to integrate with the AdBazaar SSP (Supply-Side Platform).

## Overview

The Website SSP SDK service provides:
- Publisher registration and management
- Ad placement configuration
- Impression and click tracking
- Earnings calculation and reporting
- Header bidding support
- SDK configuration endpoints

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Start in development mode
npm run dev

# Run tests
npm test
```

## API Endpoints

### SDK Configuration

#### GET /api/sdk/config/:publisherId
Get SDK configuration for a publisher.

**Response:**
```json
{
  "config": {
    "publisherId": "uuid",
    "apiKey": "sk_...",
    "adFormats": ["banner", "rectangle"],
    "headerBidding": true,
    "minCPM": 1.5,
    "refreshInterval": 60000,
    "debug": false
  },
  "baseUrl": "http://localhost:4850",
  "version": "1.0.0"
}
```

#### POST /api/sdk/register
Register a new publisher.

**Request:**
```json
{
  "name": "Publisher Name",
  "website": "https://example.com",
  "category": "news",
  "contact": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890"
  },
  "settings": {
    "adFormats": ["banner", "rectangle"],
    "minCPM": 2.0,
    "headerBidding": true
  }
}
```

**Response:**
```json
{
  "message": "Publisher registered successfully",
  "publisher": {
    "publisherId": "pub_...",
    "name": "Publisher Name",
    "status": "pending"
  },
  "token": "jwt_token"
}
```

### Placements

#### GET /api/sdk/placement/:placementId
Get placement configuration.

#### POST /api/sdk/placement
Create a new placement.

**Request:**
```json
{
  "publisherId": "uuid",
  "name": "Homepage Banner",
  "pageUrl": "https://example.com",
  "adFormats": ["banner", "rectangle"],
  "size": { "width": 728, "height": 90 },
  "position": "header",
  "minCPM": 1.5
}
```

### Event Tracking

#### POST /api/sdk/impression
Track an ad impression.

**Headers:**
- `X-API-Key`: Publisher API key

**Request:**
```json
{
  "placementId": "uuid",
  "adId": "optional_ad_id",
  "metadata": {
    "country": "US",
    "device": "desktop",
    "browser": "Chrome",
    "os": "Windows"
  }
}
```

#### POST /api/sdk/click
Track an ad click.

**Request:**
```json
{
  "impressionId": "uuid",
  "placementId": "uuid",
  "adId": "optional_ad_id",
  "metadata": {
    "country": "US",
    "device": "mobile"
  }
}
```

### Publisher Management

#### GET /api/sdk/publisher/:id/earnings
Get publisher earnings report.

**Response:**
```json
{
  "publisherId": "uuid",
  "totalEarnings": 150.50,
  "pendingPayout": 50.00,
  "paidOut": 100.50,
  "impressions": 150000,
  "clicks": 2500,
  "ctr": 1.67,
  "avgCPM": 1.00,
  "lastUpdated": "2024-01-01T00:00:00Z"
}
```

#### POST /api/sdk/publisher
Create a publisher account (admin/internal).

## Health Check

#### GET /health
Returns service health status.

#### GET /metrics
Returns Prometheus metrics.

## Publisher Categories

- `news` - News publications
- `blog` - Blogs
- `entertainment` - Entertainment content
- `ecommerce` - E-commerce sites
- `social` - Social platforms
- `gaming` - Gaming sites
- `education` - Educational content
- `tech` - Technology
- `lifestyle` - Lifestyle content
- `finance` - Financial content
- `sports` - Sports content
- `travel` - Travel content
- `food` - Food content
- `health` - Health content
- `other` - Other categories

## Ad Formats

- `banner` - Standard banner ads (728x90, 468x60, etc.)
- `rectangle` - Rectangle ads (300x250, 336x280)
- `native` - Native advertising
- `video` - Video ads
- `interstitial` - Full-screen interstitial ads

## Placement Positions

- `header` - Top of page
- `sidebar` - Sidebar placement
- `content` - Within content
- `footer` - Bottom of page
- `interstitial` - Full-screen overlay

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 4850 | Service port |
| NODE_ENV | development | Environment |
| MONGODB_URI | mongodb://localhost:27017/website-ssp-sdk | MongoDB connection |
| REDIS_HOST | localhost | Redis host |
| REDIS_PORT | 6379 | Redis port |
| JWT_SECRET | - | JWT signing secret |
| SDK_BASE_URL | http://localhost:4850 | Base URL for SDK |
| DEFAULT_MIN_CPM | 1.00 | Default minimum CPM |
| DEFAULT_PAYOUT_RATE | 0.70 | Publisher payout rate |
| METRICS_ENABLED | true | Enable Prometheus metrics |

## Architecture

```
website-ssp-sdk/
├── src/
│   ├── config/         # Configuration (database, redis, app config)
│   ├── models/         # Mongoose models
│   ├── services/       # Business logic
│   ├── routes/         # Express routes
│   ├── middleware/     # Express middleware (auth, validation, metrics)
│   ├── types/          # TypeScript types and Zod schemas
│   ├── utils/          # Utility functions
│   └── index.ts       # Entry point
├── package.json
├── tsconfig.json
└── jest.config.js
```

## Metrics

The service exposes Prometheus metrics at `/metrics`:

- `http_requests_total` - Total HTTP requests
- `http_request_duration_seconds` - Request duration histogram
- `active_connections` - Active connections gauge
- `sdk_impressions_total` - Total impressions tracked
- `sdk_clicks_total` - Total clicks tracked
- `sdk_earnings_total` - Total earnings in cents
- `publishers_total` - Total publishers by status
- `placements_total` - Total placements by status

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

## License

Proprietary - AdBazaar Inc.