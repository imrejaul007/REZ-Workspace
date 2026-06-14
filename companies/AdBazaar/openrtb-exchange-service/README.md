# OpenRTB Exchange Service

**AdBazaar OpenRTB 2.6 Exchange - Real-time Bidding Exchange**

An enterprise-grade OpenRTB 2.6 compliant exchange service for programmatic advertising, competing with Magnite, PubMatic, and OpenX.

## Overview

The OpenRTB Exchange Service is a real-time bidding exchange that implements the OpenRTB 2.6 specification. It handles bid requests from publishers, manages auctions between buyers and sellers, and provides comprehensive deal management capabilities.

## Features

### Core Functionality
- **OpenRTB 2.6 Compliant** - Full support for bid requests and responses
- **Real-time Bidding** - Sub-second auction processing
- **Multiple Auction Types** - First-price, second-price, fixed-price, and hybrid auctions
- **Deal Management** - Private auctions, preferred deals, and fixed-price deals
- **Seat Management** - Buyer and seller seat configuration with permissions
- **Exchange Statistics** - Comprehensive analytics and reporting

### Auction Types
- **First-Price Auction** - Winner pays their bid price
- **Second-Price Auction** - Winner pays second-highest bid (Vickrey auction)
- **Fixed-Price Auction** - Winner pays a fixed floor price
- **Hybrid Auction** - Deals first, then second-price for open auction

### Deal Types
- **Private Auction** - Invitation-only auctions for specific buyers
- **Preferred Deal** - Guaranteed inventory at pre-negotiated prices
- **Fixed Price** - Fixed CPM for all impressions
- **Open Auction** - Standard openRTB auction

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js with TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Cache**: Redis (optional)
- **Logging**: Winston with daily rotation
- **Metrics**: Prometheus client
- **Validation**: Zod schemas

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB 6.0+
- Redis7.0+ (optional)

### Installation

```bash
# Install dependencies
npm install

# Build
npm run build

# Start
npm start

# Development mode
npm run dev
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Key variables:
- `PORT=4960` - Service port
- `MONGODB_URI` - MongoDB connection string
- `REDIS_URL` - Redis connection string (optional)
- `INTERNAL_SERVICE_TOKEN` - Internal service authentication token
- `EXCHANGE_NAME` - Exchange name for branding
- `CURRENCY` - Default currency (default: USD)

## API Reference

### Health Check

```bash
GET /health
```

Returns service health status including MongoDB and Redis connectivity.

### Metrics

```bash
GET /metrics
```

Returns Prometheus metrics in text format.

### Bid Requests

#### Create Bid Request
```bash
POST /api/bid
Content-Type: application/json
X-Internal-Token: your-token

{
  "imp": [{
    "id": "imp-1",
    "banner": { "w": 728, "h": 90, "mimes": ["image/jpeg", "image/png"] },
    "bidfloor": 1.5,
    "bidfloorcur": "USD"
  }],
  "site": { "id": "site-123", "name": "Example Site" },
  "device": { "ua": "Mozilla/5.0...", "ip": "192.168.1.1" },
  "user": { "id": "user-456" },
  "tmax": 5000
}
```

#### Get Bid Request
```bash
GET /api/bid/:id
```

#### Create Bid Response
```bash
POST /api/bid/:id/response
Content-Type: application/json
X-Internal-Token: your-token

{
  "id": "resp-123",
  "seatbid": [{
    "seat": "buyer-seat-1",
    "bid": [{
      "id": "bid-1",
      "impid": "imp-1",
      "price": 2.50,
      "adm": "<html>...</html>",
      "crid": "creative-123"
    }]
  }]
}
```

### Auctions

#### Run Auction
```bash
POST /api/auction
Content-Type: application/json
X-Internal-Token: your-token

{
  "bidRequestId": "request-123",
  "impId": "imp-1",
  "auctionType": "second_price",
  "floorPrice": 1.0
}
```

#### Get Auction Result
```bash
GET /api/auction/:id
```

### Deals

#### Create Deal
```bash
POST /api/deals
Content-Type: application/json
X-Internal-Token: your-token

{
  "buyerId": "buyer-123",
  "sellerId": "seller-456",
  "type": "private_auction",
  "basePriceCpm": 5.00,
  "name": "Q1 Premium Deal",
  "startTime": "2026-01-01T00:00:00Z",
  "endTime": "2026-03-31T23:59:59Z"
}
```

#### List Deals
```bash
GET /api/deals?status=active&buyerId=buyer-123
```

#### Get Deal
```bash
GET /api/deals/:id
```

#### Update Deal
```bash
PATCH /api/deals/:id
Content-Type: application/json
X-Internal-Token: your-token

{
  "status": "paused",
  "basePriceCpm": 6.00
}
```

#### Approve Deal
```bash
POST /api/deals/:id/approve
```

#### Pause/Resume Deal
```bash
POST /api/deals/:id/pause
POST /api/deals/:id/resume
```

### Seats

#### Create Seat
```bash
POST /api/seats
Content-Type: application/json
X-Internal-Token: your-token

{
  "name": "Buyer Company",
  "type": "buyer",
  "email": "bidding@buyer.com",
  "company": "Buyer Company Inc",
  "permissions": {
    "canBid": true,
    "maxBidPerRequest": 10000,
    "canCreateDeals": true
  }
}
```

#### List Seats
```bash
GET /api/seats?type=buyer&status=active
```

#### Get Seat
```bash
GET /api/seats/:id
```

#### Update Seat
```bash
PATCH /api/seats/:id
Content-Type: application/json
X-Internal-Token: your-token

{
  "status": "suspended",
  "permissions": {
    "canBid": false
  }
}
```

#### Activate/Suspend Seat
```bash
POST /api/seats/:id/activate
POST /api/seats/:id/suspend
```

### Statistics

#### Exchange Statistics
```bash
GET /api/exchange/stats
```

Returns comprehensive exchange statistics including:
- Request counts by status
- Response counts
- Auction statistics
- Deal performance
- Seat metrics
- Performance indicators

#### Top Bidders
```bash
GET /api/exchange/stats/bidders?limit=10
```

#### Top Deals
```bash
GET /api/exchange/stats/deals?limit=10
```

#### Time Series Data
```bash
GET /api/exchange/stats/timeseries?startTime=2026-01-01&endTime=2026-01-07&interval=day
```

## OpenRTB 2.6 Compliance

The service implements the OpenRTB 2.6 specification with the following support:

### Bid Request Objects
- [x] `imp` - Impression array (required)
- [x] `site` - Site object
- [x] `app` - App object
- [x] `device` - Device object
- [x] `user` - User object
- [x] `test` - Test mode flag
- [x] `tmax` - Maximum request time
- [x] `wseat` - Whitelisted seats
- [x] `bseat` - Blocked seats
- [x] `cur` - Currency
- [x] `source` - Source object
- [x] `regs` - Regulations

### Bid Response Objects
- [x] `id` - Response ID
- [x] `bidid` - Bid ID
- [x] `cur` - Currency
- [x] `seatbid` - Seat bid array
- [x] `nbr` - No bid reason
- [x] `ext` - Extensions

### Impression Types
- [x] `banner` - Banner impressions
- [x] `video` - Video impressions
- [x] `audio` - Audio impressions
- [x] `native` - Native impressions

### PMP (Private Marketplace)
- [x] `pmp` - Private marketplace deals
- [x] `deals` - Deal objects

## Prometheus Metrics

The service exposes the following metrics:

### HTTP Metrics
- `openrtb_http_requests_total` - Total HTTP requests
- `openrtb_http_request_duration_seconds` - Request duration histogram

### Bid Metrics
- `openrtb_bid_requests_total` - Total bid requests
- `openrtb_bid_responses_total` - Total bid responses
- `openrtb_bid_latency_seconds` - Bid processing latency

### Auction Metrics
- `openrtb_auctions_total` - Total auctions by type and status
- `openrtb_auction_value_dollars` - Winning auction values

### Exchange Metrics
- `openrtb_active_bids` - Active bids gauge
- `openrtb_active_deals` - Active deals gauge
- `openrtb_seats` - Seats by status
- `openrtb_errors_total` - Error counts

## Authentication

All API endpoints (except `/health` and `/metrics`) require internal service authentication:

```bash
X-Internal-Token: your-internal-service-token
X-Service-Id: your-service-id
X-Permissions: permission1,permission2
```

## Error Handling

All error responses follow this format:

```json
{
  "error": "Error type",
  "message": "Detailed error message",
  "details": ["Additional details if available"]
}
```

## Rate Limiting

Rate limits are configurable per seat:
- Requests per second/minute/hour/day
- Bids per second/minute

## Deployment

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 4960
CMD ["node", "dist/index.js"]
```

### Docker Compose

```yaml
version: '3.8'
services:
  openrtb-exchange:
    build: .
    ports:
      - "4960:4960"
    environment:
      - MONGODB_URI=mongodb://mongo:27017/openrtb_exchange
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mongo
      - redis
```

## Project Structure

```
openrtb-exchange-service/
├── src/
│   ├── index.ts              # Main entry point
│   ├── models/              # Mongoose schemas
│   │   ├── BidRequest.ts
│   │   ├── BidResponse.ts
│   │   ├── Deal.ts
│   │   ├── Seat.ts
│   │   └── Auction.ts
│   ├── services/            # Business logic
│   │   ├── bidService.ts
│   │   ├── auctionService.ts
│   │   ├── dealService.ts
│   │   ├── seatService.ts
│   │   └── statsService.ts
│   ├── middleware/           # Express middleware
│   │   └── auth.ts
│   └── utils/               # Utilities
│       ├── logger.ts
│       └── metrics.ts
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

## License

Proprietary - AdBazaar Inc.
