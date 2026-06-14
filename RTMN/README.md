# RTNM - Real-Time Marketplace Network

**Live Commerce, Auctions & Dynamic Pricing - Next-Generation Marketplace**

> "The future of commerce is real-time"

**Version:** 1.0.0 | **Date:** June 10, 2026 | **Port:** 4600-4629 (Marketplace Suite)

---

## Overview

RTNM (Real-Time Marketplace Network) is RTNM Digital's next-generation marketplace platform enabling live commerce, real-time auctions, dynamic pricing, and instant transactions. Built for the modern digital economy, RTNM connects buyers and sellers through AI-powered matching, live streaming, and seamless payment integration.

The platform supports multiple marketplace models including B2C retail, C2C resale, B2B wholesale, and live auction, all powered by real-time data synchronization and intelligent recommendation systems.

## Architecture

```
                                    ┌─────────────────────────────────────────┐
                                    │           External Clients              │
                                    │    (Buyers, Sellers, Businesses)        │
                                    └──────────────────┬──────────────────────┘
                                                       │
                                       ┌───────────────┴───────────────┐
                                       ▼                               ▼
                            ┌─────────────────┐            ┌─────────────────┐
                            │   Buyer App     │            │  Seller Portal  │
                            │                │            │                 │
                            └────────┬────────┘            └────────┬────────┘
                                     │                              │
                            ┌─────────┴──────────────────────────────┴────────┐
                            │            RTNM Gateway (4600)                │
                            ├─────────────────────────────────────────────────┤
                            │  ┌────────────┐  ┌──────────────────┐          │
                            │  │   Live    │  │    Auction      │          │
                            │  │  Commerce │  │    Engine       │          │
                            │  └────────────┘  └──────────────────┘          │
                            │  ┌────────────┐  ┌──────────────────┐          │
                            │  │  Dynamic  │  │     Listing      │          │
                            │  │  Pricing  │  │     Manager      │          │
                            │  └────────────┘  └──────────────────┘          │
                            │  ┌────────────┐  ┌──────────────────┐          │
                            │  │   Order   │  │   Recommendation │          │
                            │  │   Engine  │  │      Engine     │          │
                            │  └────────────┘  └──────────────────┘          │
                            └─────────────────────────────────────────────────┘
                                                       │
                           ┌───────────────────────────┼───────────────────────────┐
                           │                           │                           │
                           ▼                           ▼                           ▼
                    ┌─────────────┐            ┌─────────────┐            ┌─────────────┐
                    │  RABTUL    │            │   Nexha    │            │  HOJAI AI  │
                    │  (Wallet, │            │  (Commerce │            │  (Matching, │
                    │   Payments)│            │   Network) │            │   Personalize)│
                    └─────────────┘            └─────────────┘            └─────────────┘
```

## Products & Services

### Core Marketplace Services

| Service | Port | Description |
|---------|------|-------------|
| **RTNM Gateway** | 4600 | Main API gateway |
| **Live Commerce** | 4601 | Live streaming shopping |
| **Auction Engine** | 4602 | Real-time auctions |
| **Pricing Engine** | 4603 | Dynamic pricing |
| **Listing Service** | 4604 | Product listings |
| **Order Service** | 4605 | Order processing |

### Marketplace Features

| Feature | Description |
|---------|-------------|
| **Live Commerce** | Stream products, interact in real-time |
| **Auctions** | Timed and live bidding |
| **Dynamic Pricing** | AI-powered price optimization |
| **Instant Checkout** | One-tap purchasing |
| **Multi-Vendor** | Multiple sellers, unified experience |
| **Social Commerce** | Share, review, recommend |

## Key Features

### Live Commerce

- **Live Streaming** - Broadcast product demos, tutorials
- **Real-time Interaction** - Chat, poll, Q&A during streams
- **Flash Sales** - Time-limited offers during live
- **Host Features** - Co-hosting, gifting, badges
- **Viewer Engagement** - Reactions, shares, saves
- **Conversion Tracking** - Stream-to-purchase analytics

### Auction System

- **Timed Auctions** - Scheduled end times
- **Live Bidding** - Real-time bid updates
- **Reserve Price** - Minimum seller threshold
- **Auto-Bid** - Maximum bid with auto-increment
- **Bid History** - Complete audit trail
- **Anti-Sniping** - Extension on last-minute bids

### Dynamic Pricing

- **Demand-Based** - Price adjusts to demand
- **Time-Based** - Flash sales, daily deals
- **Inventory-Based** - Stock level pricing
- **Competitor-Matched** - Market positioning
- **Personalized** - User-specific offers
- **AI Optimization** - ML-driven price tuning

### Product Listings

- **Rich Media** - Photos, videos, 360 views
- **Variants** - Size, color, style options
- **Inventory Sync** - Real-time stock updates
- **Multi-Category** - Deep categorization
- **Search Optimization** - SEO-friendly listings
- **Seller Tools** - Bulk upload, templates

### Order Management

- **Instant Checkout** - One-click purchasing
- **Cart Recovery** - Abandoned cart alerts
- **Order Tracking** - Real-time delivery updates
- **Returns & Refunds** - Easy return process
- **Invoicing** - Auto-generated invoices
- **Multi-Address** - Save multiple addresses

---

## Quick Start

### Prerequisites

- Node.js 20+
- MongoDB 6.0+
- Redis 7.0+
- WebSocket support
- npm or yarn
- Docker (optional)

### Installation

```bash
# Navigate to RTNM directory
cd RTNM

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
```

### Running Locally

```bash
# Start development server
npm run dev

# RTNM Gateway starts on port 4600
```

### Docker Deployment

```bash
# Build Docker image
docker build -t rtnm-marketplace:latest .

# Run container
docker run -d \
  --name rtnm-marketplace \
  -p 4600:4600 \
  -e NODE_ENV=production \
  -e MONGODB_URI=mongodb://host.docker.internal:27017/rtnm \
  -e REDIS_URL=redis://host.docker.internal:6379 \
  rtnm-marketplace:latest
```

---

## Configuration

### Environment Variables

| Variable | Default | Description |
|---------|---------|-------------|
| `PORT` | `4600` | Gateway port |
| `NODE_ENV` | `development` | Environment mode |
| `MONGODB_URI` | `mongodb://localhost:27017/rtnm` | MongoDB connection |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection |
| `WEBSOCKET_PORT` | `4601` | WebSocket server port |
| `MAX_AUCTION_DURATION` | `604800` | Max auction time (7 days) |
| `MIN_BID_INCREMENT` | `10` | Minimum bid increment |
| `PLATFORM_FEE_PERCENT` | `5` | Platform fee (%) |
| `CORS_ORIGINS` | `*` | Allowed CORS origins |

### Docker Compose

```yaml
version: '3.8'
services:
  rtnm:
    build: .
    ports:
      - "4600:4600"
      - "4601:4601"
    environment:
      - PORT=4600
      - WEBSOCKET_PORT=4601
      - MONGODB_URI=mongodb://mongo:27017/rtnm
      - REDIS_URL=redis://redis:6379
      - NODE_ENV=production
    depends_on:
      - mongo
      - redis
    restart: unless-stopped

  mongo:
    image: mongo:6.0
    volumes:
      - mongo-data:/data/db
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    restart: unless-stopped

volumes:
  mongo-data:
```

---

## API Endpoints

### Products

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/products` | Create listing |
| `GET` | `/api/products` | List products |
| `GET` | `/api/products/:id` | Get product details |
| `PUT` | `/api/products/:id` | Update product |
| `DELETE` | `/api/products/:id` | Delete product |
| `POST` | `/api/products/:id/media` | Upload media |

### Auctions

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auctions` | Create auction |
| `GET` | `/api/auctions` | List auctions |
| `GET` | `/api/auctions/:id` | Get auction details |
| `POST` | `/api/auctions/:id/bid` | Place bid |
| `GET` | `/api/auctions/:id/bids` | Get bid history |
| `POST` | `/api/auctions/:id/watch` | Watch auction |

### Orders

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/orders` | Create order |
| `GET` | `/api/orders` | List orders |
| `GET` | `/api/orders/:id` | Get order details |
| `PUT` | `/api/orders/:id/cancel` | Cancel order |
| `POST` | `/api/orders/:id/refund` | Request refund |

### Cart

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/cart` | Get cart |
| `POST` | `/api/cart/items` | Add to cart |
| `PUT` | `/api/cart/items/:id` | Update quantity |
| `DELETE` | `/api/cart/items/:id` | Remove item |
| `POST` | `/api/cart/checkout` | Checkout |

### Live Commerce

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/live/start` | Start live stream |
| `GET` | `/api/live/:id` | Get stream details |
| `POST` | `/api/live/:id/products` | Add products to stream |
| `POST` | `/api/live/:id/chat` | Send chat message |
| `POST` | `/api/live/:id/offer` | Post flash offer |

### Health Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Service health check |
| `GET` | `/health/ready` | Kubernetes readiness |
| `GET` | `/health/live` | Kubernetes liveness |

---

## API Examples

### Create Product Listing

```bash
curl -X POST http://localhost:4600/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "title": "Vintage Leather Messenger Bag",
    "description": "Handcrafted genuine leather messenger bag, perfect for laptops up to 15 inches",
    "price": 4999,
    "category": "fashion-accessories",
    "subcategory": "bags",
    "condition": "used_like_new",
    "stock": 1,
    "variants": [
      { "type": "color", "options": ["Brown", "Black"] }
    ],
    "images": ["base64_image_1", "base64_image_2"],
    "shipping": {
      "weight_kg": 1.2,
      "free_shipping": false,
      "estimated_days": 5
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "prod_abc123",
    "title": "Vintage Leather Messenger Bag",
    "slug": "vintage-leather-messenger-bag-abc123",
    "price": 4999,
    "status": "active",
    "seller_id": "seller_xyz",
    "created_at": "2026-06-10T09:00:00Z"
  }
}
```

### Create Auction

```bash
curl -X POST http://localhost:4600/api/auctions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "product_id": "prod_abc123",
    "starting_price": 1000,
    "reserve_price": 4000,
    "start_time": "2026-06-10T10:00:00Z",
    "end_time": "2026-06-12T10:00:00Z",
    "auction_type": "standard",
    "anti_sniping_minutes": 5
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "auct_abc123",
    "product_id": "prod_abc123",
    "status": "scheduled",
    "current_bid": null,
    "bid_count": 0,
    "starting_price": 1000,
    "reserve_price": 4000,
    "start_time": "2026-06-10T10:00:00Z",
    "end_time": "2026-06-12T10:00:00Z",
    "time_remaining": "48:00:00"
  }
}
```

### Place Bid

```bash
curl -X POST http://localhost:4600/api/auctions/auct_abc123/bid \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "amount": 2500,
    "max_auto_bid": 5000
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "bid_id": "bid_xyz789",
    "auction_id": "auct_abc123",
    "bidder_id": "user_123",
    "amount": 2500,
    "is_winning": true,
    "auto_bid_enabled": true,
    "max_auto_bid": 5000,
    "timestamp": "2026-06-10T09:30:00Z"
  }
}
```

### Start Live Commerce Stream

```bash
curl -X POST http://localhost:4600/api/live/start \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "title": "Summer Fashion Sale - Up to 70% Off!",
    "description": "Join us for exclusive deals on summer collection",
    "category": "fashion",
    "products": ["prod_abc123", "prod_def456"],
    "stream_key": "stream_abc123"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "stream_id": "live_abc123",
    "status": "live",
    "stream_url": "rtmp://rtnm.live/stream/abc123",
    "viewer_count": 0,
    "started_at": "2026-06-10T09:00:00Z",
    "products_count": 2
  }
}
```

### Add to Cart

```bash
curl -X POST http://localhost:4600/api/cart/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "product_id": "prod_abc123",
    "quantity": 1,
    "variant": {
      "color": "Brown"
    }
  }'
```

### Checkout

```bash
curl -X POST http://localhost:4600/api/cart/checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "payment_method": "wallet",
    "shipping_address": {
      "name": "Rahul Sharma",
      "phone": "+91-9876543210",
      "address": "123 MG Road",
      "city": "Jaipur",
      "state": "Rajasthan",
      "pincode": "302001"
    }
  }'
```

---

## Auction Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Auction Lifecycle                              │
└─────────────────────────────────────────────────────────────────────────┘

  Schedule          Live              Bidding           End              Resolution
  ────────          ────              ───────           ───              ──────────

     │                │                  │                │                   │
     ▼                ▼                  ▼                ▼                   ▼
┌─────────┐      ┌─────────┐      ┌─────────┐      ┌─────────┐      ┌─────────────┐
│Auction  │      │Auction  │      │Bid      │      │Final    │      │Winner's     │
│Created  │─────▶│Starts   │─────▶│Placed   │─────▶│Seconds  │─────▶│Confirmed    │
│         │      │         │      │         │      │         │      │             │
└─────────┘      └─────────┘      └─────────┘      └─────────┘      └─────────────┘
                      │                │                │
                      │ Anti-sniping   │                │
                      │ Extension      │                │
                      ▼                ▼                ▼
                 ┌─────────┐      ┌─────────┐      ┌─────────┐
                 │Bid      │      │Outbid   │      │Winner   │
                 │Updates  │      │Alert    │      │Pays     │
                 └─────────┘      └─────────┘      └─────────┘
```

---

## Live Commerce Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      Live Commerce Flow                                 │
└─────────────────────────────────────────────────────────────────────────┘

  Host                      Platform                    Viewers
  ────                      ────────                    ────────

    │                           │                          │
    │  Start Stream             │                          │
    │─────────────────────────▶│                          │
    │                           │  Notify                 │
    │                           │────────────────────────▶│
    │                           │                          │
    │  Add Products             │  Show in Stream          │
    │─────────────────────────▶│                          │
    │                           │  Update UI               │
    │                           │────────────────────────▶│
    │                           │                          │
    │  Post Flash Offer         │  Flash Sale Alert        │
    │─────────────────────────▶│────────────────────────▶│
    │                           │                          │
    │  Chat Message             │  Broadcast               │
    │─────────────────────────▶│────────────────────────▶│
    │                           │                          │
    │                           │◀────────────────────────│
    │                           │     Viewer Purchase      │
    │                           │                          │
    │                           │  Order Created           │
    │                           │◀─────────────────────────│
    │                           │                          │
    │  End Stream              │  Summary                 │
    │─────────────────────────▶│────────────────────────▶│
    │                           │                          │
```

---

## Directory Structure

```
RTNM/
├── src/
│   ├── index.ts              # Main entry point
│   ├── config/
│   │   ├── database.ts       # MongoDB configuration
│   │   └── websocket.ts      # WebSocket server config
│   ├── middleware/
│   │   ├── auth.ts          # Authentication middleware
│   │   ├── validation.ts    # Request validation
│   │   └── rateLimit.ts     # Rate limiting
│   ├── models/
│   │   ├── product.ts       # Product model
│   │   ├── auction.ts       # Auction model
│   │   ├── bid.ts           # Bid model
│   │   ├── order.ts         # Order model
│   │   ├── cart.ts          # Cart model
│   │   └── liveStream.ts    # Live stream model
│   ├── routes/
│   │   ├── products.ts      # Product routes
│   │   ├── auctions.ts      # Auction routes
│   │   ├── orders.ts        # Order routes
│   │   ├── cart.ts          # Cart routes
│   │   └── live.ts          # Live commerce routes
│   ├── services/
│   │   ├── auction.service.ts
│   │   ├── pricing.service.ts
│   │   ├── live.service.ts
│   │   ├── recommendation.service.ts
│   │   └── notification.service.ts
│   └── websocket/
│       ├── auction.handler.ts
│       ├── live.handler.ts
│       └── chat.handler.ts
├── .git/                    # Git repository
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

---

## Security Features

- **JWT Authentication** - Secure token-based auth
- **Seller Verification** - Identity and business verification
- **Anti-Fraud** - Bot detection, fake bid prevention
- **Price Manipulation Prevention** - Fair auction rules
- **Content Moderation** - AI-powered inappropriate content detection
- **Secure Payments** - RABTUL integration for safe transactions
- **Dispute Resolution** - Mediated conflict resolution

---

## Integration Points

### Internal Services

| Service | Integration | Purpose |
|---------|-------------|---------|
| **RABTUL Wallet** | Payments | Secure checkout |
| **RABTUL Auth** | Authentication | User identity |
| **Nexha** | Commerce | Inventory sync |
| **HOJAI AI** | Recommendations | Product matching |
| **REZ Consumer** | Distribution | App integration |

### External Integrations

| Integration | Description |
|-------------|-------------|
| **Razorpay** | Payment gateway |
| **Shiprocket** | Shipping fulfillment |
| **AWS S3** | Media storage |
| **Cloudflare** | CDN and protection |

---

## Port Registry

RTNM uses ports in the 4600-4629 range:

| Service | Port | Description |
|---------|------|-------------|
| **RTNM Gateway** | 4600 | Main API gateway |
| **Live Commerce** | 4601 | Live streaming |
| **Auction Engine** | 4602 | Real-time auctions |
| **Pricing Engine** | 4603 | Dynamic pricing |
| **Listing Service** | 4604 | Product listings |
| **Order Service** | 4605 | Order processing |

---

## Related Products

- [Nexha](/Users/rejaulkarim/Documents/ReZ%20Full%20App/Nexha/) - Commerce network
- [RABTUL Technologies](/Users/rejaulkarim/Documents/ReZ%20Full%20App/RABTUL/) - Payments
- [REZ Consumer](/Users/rejaulkarim/Documents/ReZ%20Full%20App/REZ-Consumer/) - Consumer app
- [HOJAI AI](/Users/rejaulkarim/Documents/ReZ%20Full%20App/HOJAI/) - AI matching

---

## Troubleshooting

### Common Issues

**Auction Bid Failed**
```
Error: Bid amount below minimum increment
```
Solution: Ensure bid is at least 10% higher than current bid.

**Live Stream Not Starting**
```
Error: Stream key invalid or already in use
```
Solution: Generate new stream key or wait for previous stream to end.

**Checkout Failed**
```
Error: Insufficient wallet balance
```
Solution: Add funds to REZ Wallet or use alternative payment method.

**Product Not Visible**
```
Error: Product not approved
```
Solution: Ensure product meets listing guidelines and is fully verified.

---

## License

Proprietary - RTNM Digital

---

Built with ❤️ by RTNM Digital - "The future of commerce is real-time"