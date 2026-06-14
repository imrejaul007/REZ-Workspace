# REZ Merchant Integrations

Integration layer for external services including aggregators, delivery partners, and ad platforms.

## Features

- **AdBazaar ROI Tracking** - Attribution and campaign performance tracking
- **Aggregator Sync** - Swiggy/Zomato order synchronization with real-time reconciliation
- **Delivery Partners** - Dunzo/Shadowfax integration with quote comparison
- **Multi-channel Management** - Unified API for all integrations
- **Webhook Handling** - Real-time event processing from all partners
- **Attribution** - Click and view attribution with configurable TTL

## Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Express
- **Database**: MongoDB
- **Cache**: Redis
- **External APIs**: Swiggy, Zomato, Dunzo, Shadowfax, AdBazaar

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Docker

```bash
# Build and run
docker build -t rez-merchant-integrations .
docker run -p 4020:4020 rez-merchant-integrations

# Or use docker-compose
docker-compose up -d
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | Yes |
| `NODE_ENV` | Environment | Yes |
| `MONGODB_URI` | MongoDB connection string | Yes |
| `REDIS_URL` | Redis connection string | Yes |
| `AUTH_SERVICE_URL` | RABTUL Auth URL | Yes |
| `ORDER_SERVICE_URL` | RABTUL Order URL | Yes |
| `SWIGGY_API_KEY` | Swiggy API key | No |
| `ZOMATO_API_KEY` | Zomato API key | No |
| `DUNZO_API_KEY` | Dunzo API key | No |
| `SHADOWFAX_API_KEY` | Shadowfax API key | No |

## API Endpoints

### AdBazaar ROI

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ads/track/click` | Track ad click |
| POST | `/api/ads/track/view` | Track ad view |
| POST | `/api/ads/track/conversion` | Track order conversion |
| GET | `/api/ads/campaign/:id/roi` | Get campaign ROI metrics |
| GET | `/api/ads/merchant/:id/performance` | Get merchant performance |
| POST | `/api/ads/sync` | Sync campaigns |

### Aggregators

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/aggregators/register` | Register aggregator adapter |
| GET | `/api/aggregators/orders` | Fetch new orders from all |
| POST | `/api/aggregators/:id/status` | Update order status |
| POST | `/api/aggregators/menu` | Push menu to all |
| POST | `/api/aggregators/webhook/:aggregator` | Webhook handler |
| GET | `/api/aggregators/status/:channelId` | Get channel status |

### Delivery

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/delivery/quotes` | Get delivery quotes |
| POST | `/api/delivery/book` | Book delivery |
| GET | `/api/delivery/:id/track` | Track delivery |
| POST | `/api/delivery/:id/cancel` | Cancel delivery |
| POST | `/api/delivery/webhook/:partner` | Partner webhook |

## Attribution Flow

```
Ad Impression/Click
       ↓
Track to Device → Store in Redis (TTL: 7 days for clicks, 24h for views)
       ↓
Order Placed
       ↓
Find Attribution → Click-through (7 days) → View-through (24h)
       ↓
Update Campaign Metrics → Update Merchant Performance → Clear Attribution
```

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   REZ Merchant Integrations                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐   │
│  │   AdBazaar    │  │   Aggregator   │  │    Delivery    │   │
│  │    ROI        │  │    Channel     │  │   Aggregator   │   │
│  └───────┬────────┘  └───────┬────────┘  └───────┬────────┘   │
│          │                    │                    │             │
│  ┌───────▼──────────────────▼────────────────────▼────────┐    │
│  │                    Event Handlers                        │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              Reconciliation Engine                      │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│   MongoDB    │    │    Redis      │    │    RABTUL    │
│  (persist)   │    │   (cache)    │    │   Services   │
└───────────────┘    └───────────────┘    └───────────────┘
```

## Webhooks

### Aggregator Webhooks

Configure webhooks in Swiggy/Zomato dashboards to point to:
```
POST https://your-domain.com/api/aggregators/webhook/swiggy
POST https://your-domain.com/api/aggregators/webhook/zomato
```

### Delivery Webhooks

```
POST https://your-domain.com/api/delivery/webhook/dunzo
POST https://your-domain.com/api/delivery/webhook/shadowfax
```

## Port

| Service | Port |
|---------|------|
| Merchant Integrations | 4020 |

## Integrations

Connected to:
- **RABTUL Auth** (4002) - Service authentication
- **RABTUL Order** (4006) - Order creation and management
- **RABTUL Payment** (4001) - Payment processing
- **RABTUL Notifications** (4011) - Customer notifications

## Deployment

```bash
# Deploy with Render
render blueprint

# Or build Docker image
docker build -t rez-merchant-integrations .
```
