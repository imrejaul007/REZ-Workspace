# AdBazaar Auction Engine Service

**Port:** 4961

A comprehensive auction engine supporting multiple auction types for programmatic advertising. Handles first-price, second-price, Vickrey, and weighted auctions with real-time bid processing and analytics.

## Features

- **First-Price Auction**: Highest bidder wins and pays their bid
- **Second-Price Auction**: Winner pays second-highest bid + $0.01
- **Vickrey Auction**: Sealed-bid, winner pays second-highest
- **Weighted Auction**: Weighted by quality scores (deal support)
- **Real-time Analytics**: Bid metrics, win rates, revenue tracking
- **Deal Support**: Direct deals and preferred deals integration
- **Prometheus Metrics**: Full observability stack

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Auction Engine Service                    │
│                        Port: 4961                           │
├────────────────────────────────────────��────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ First-Price│  │Second-Price│  │  Vickrey    │        │
│  │  Service   │  │  Service   │  │  Service    │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│  ┌─────────────┐  ┌─────────────────────────────────────┐  │
│  │  Weighted  │  │         Analytics Service            │  │
│  │  Service   │  │   (Win rates, revenue, CTR)         │  │
│  └─────────────┘  └─────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  MongoDB (Auctions, Bids, Config, History)                │
│  Redis (Caching, Rate Limiting, Pub/Sub)                   │
└��────────────────────────────────────────────────────────────┘
```

## API Endpoints

### Auction Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auction/first-price` | Execute first-price auction |
| POST | `/api/auction/second-price` | Execute second-price auction |
| POST | `/api/auction/vickrey` | Execute Vickrey auction |
| POST | `/api/auction/weighted` | Execute weighted auction |
| GET | `/api/auction/:id` | Get auction result by ID |
| GET | `/api/auction/history` | Get auction history |
| GET | `/api/auction/stats` | Get auction statistics |
| POST | `/api/auction/simulate` | Simulate auction outcome |

### Health & Metrics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Service health check |
| GET | `/health/ready` | Readiness check |
| GET | `/metrics` | Prometheus metrics |

## Request/Response Examples

### First-Price Auction

```json
POST /api/auction/first-price
{
  "auctionId": "auction-123",
  "adSlots": [
    {
      "slotId": "slot-1",
      "reservePrice": 1.50,
      "floorPrice": 0.50
    }
  ],
  "bids": [
    {
      "seatId": "seat-1",
      "adId": "ad-1",
      "price": 2.50,
      "creative": {
        "width": 300,
        "height": 250,
        "format": "banner"
      }
    },
    {
      "seatId": "seat-2",
      "adId": "ad-2",
      "price": 2.00,
      "creative": {
        "width": 300,
        "height": 250,
        "format": "banner"
      }
    }
  ],
  "deals": [
    {
      "dealId": "deal-1",
      "seatId": "seat-1",
      "price": 1.80,
      "priority": 1
    }
  ]
}
```

### Response

```json
{
  "success": true,
  "data": {
    "auctionId": "auction-123",
    "auctionType": "first-price",
    "winner": {
      "seatId": "seat-1",
      "adId": "ad-1",
      "price": 2.50,
      "creative": {
        "width": 300,
        "height": 250,
        "format": "banner"
      }
    },
    "price": 2.50,
    "secondPrice": 2.00,
    "timestamp": "2026-06-07T12:00:00.000Z",
    "analytics": {
      "totalBids": 2,
      "bidFloor": 0.50,
      "bidCeiling": 2.50,
      "spread": 0.50
    }
  }
}
```

### Second-Price Auction

```json
POST /api/auction/second-price
{
  "auctionId": "auction-456",
  "adSlots": [
    {
      "slotId": "slot-1",
      "reservePrice": 1.00
    }
  ],
  "bids": [
    {
      "seatId": "seat-1",
      "adId": "ad-1",
      "price": 5.00
    },
    {
      "seatId": "seat-2",
      "adId": "ad-2",
      "price": 3.00
    },
    {
      "seatId": "seat-3",
      "adId": "ad-3",
      "price": 3.00
    }
  ]
}
```

### Response

```json
{
  "success": true,
  "data": {
    "auctionId": "auction-456",
    "auctionType": "second-price",
    "winner": {
      "seatId": "seat-1",
      "adId": "ad-1",
      "price": 5.00
    },
    "price": 3.01,
    "secondPrice": 3.00,
    "timestamp": "2026-06-07T12:00:00.000Z"
  }
}
```

### Weighted Auction

```json
POST /api/auction/weighted
{
  "auctionId": "auction-789",
  "adSlots": [
    {
      "slotId": "slot-1",
      "reservePrice": 1.00
    }
  ],
  "bids": [
    {
      "seatId": "seat-1",
      "adId": "ad-1",
      "price": 2.00,
      "qualityScore": 0.9
    },
    {
      "seatId": "seat-2",
      "adId": "ad-2",
      "price": 3.00,
      "qualityScore": 0.6
    }
  ]
}
```

### Response

```json
{
  "success": true,
  "data": {
    "auctionId": "auction-789",
    "auctionType": "weighted",
    "winner": {
      "seatId": "seat-1",
      "adId": "ad-1",
      "price": 2.00,
      "qualityScore": 0.9
    },
    "effectiveBid": 1.80,
    "adjustedBid": 2.00,
    "price": 1.80,
    "timestamp": "2026-06-07T12:00:00.000Z",
    "reasoning": "seat-1 wins with effective bid 1.80 (2.00 * 0.9) > seat-2 with 1.80 (3.00 * 0.6)"
  }
}
```

## Models

### Auction Model

```typescript
{
  auctionId: string;          // Unique auction identifier
  auctionType: AuctionType;   // first-price | second-price | vickrey | weighted
  bids: Bid[];                 // Array of bids
  winner: Bid | null;          // Winning bid
  price: number;               // Final price paid
  secondPrice: number;        // Second-highest price (for analytics)
  deal: Deal | null;          // Deal information if applicable
  status: AuctionStatus;      // pending | completed | no-fill
  timestamp: Date;
  analytics: {
    totalBids: number;
    bidFloor: number;
    bidCeiling: number;
    spread: number;
  };
}
```

### Bid Model

```typescript
{
  bidId: string;               // Unique bid identifier
  seatId: string;             // Bidder/buyer seat ID
  adId: string;               // Advertisement ID
  price: number;              // Bid price in CPM
  qualityScore?: number;       // Quality score (0-1) for weighted auctions
  creative?: {
    width: number;
    height: number;
    format: string;
  };
  dealId?: string;            // Associated deal ID
  timestamp: Date;
}
```

### AuctionConfig Model

```typescript
{
  configId: string;
  auctionType: AuctionType;
  reservePrice: number;        // Minimum price to accept
  floorPrice: number;         // Hard floor price
  timeLimit: number;          // Auction time limit in ms
  rules: {
    allowSelfBid: boolean;    // Allow same bidder multiple bids
    minBidIncrement: number;   // Minimum bid increment
    maxBids: number;           // Maximum bids per auction
  };
}
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 4961 | Service port |
| `MONGODB_URI` | mongodb://localhost:27017/auction-engine | MongoDB connection |
| `REDIS_URL` | redis://localhost:6379 | Redis connection |
| `LOG_LEVEL` | info | Winston log level |
| `NODE_ENV` | development | Environment |

## Prometheus Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `auction_requests_total` | Counter | Total auction requests by type |
| `auction_duration_seconds` | Histogram | Auction processing duration |
| `auction_bids_total` | Counter | Total bids processed |
| `auction_wins_total` | Counter | Total auctions won by seat |
| `auction_revenue_cents` | Counter | Revenue in cents |
| `auction_price_histogram` | Histogram | Auction price distribution |
| `auction_nofill_total` | Counter | No-fill auctions |

## Quick Start

```bash
# Install dependencies
npm install

# Development
npm run dev

# Production
npm run build
npm start

# Health check
curl http://localhost:4961/health

# Metrics
curl http://localhost:4961/metrics
```

## Error Handling

All errors return standard format:

```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_BIDS",
    "message": "Minimum 2 bids required",
    "details": {
      "received": 1,
      "required": 2
    }
  }
}
```

## Error Codes

| Code | Description |
|------|-------------|
| `INSUFFICIENT_BIDS` | Not enough bids for auction |
| `NO_WINNER` | No valid bids above reserve |
| `INVALID_BID` | Bid validation failed |
| `AUCTION_NOT_FOUND` | Auction ID not found |
| `RESERVE_NOT_MET` | Reserve price not met |
| `DEAL_NOT_FOUND` | Deal ID not found |
| `RATE_LIMITED` | Too many requests |

## Related Services

- **AdBazaar SSP** (4520-4525): Supply-side platform
- **AdBazaar DOOH** (4060-4069): Digital out-of-home ads
- **REZ-Auth** (4002): Authentication service
- **HOJAI Memory** (4540): Bid caching and history

## License

Proprietary - AdBazaar