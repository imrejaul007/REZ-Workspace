# REZ DSP Bidder

A real-time programmatic advertising bidder service for the REZ ecosystem. This service connects to ad exchanges (Google AdX, Amazon TAM) and evaluates bid requests to optimize campaign performance with intelligent bid strategies.

## Description

The REZ DSP Bidder is a high-performance demand-side platform (DSP) component that handles real-time bidding (RTB) auctions. It evaluates incoming impression opportunities, matches them against active campaigns with targeting criteria, calculates optimal bid prices, and submits bids to ad exchanges.

**Key Responsibilities:**
- Real-time bid evaluation and response (< 100ms latency target)
- Campaign management with multiple bid strategies
- Budget pacing and daily limits enforcement
- Targeting match (geo, screen types, locations)
- Bid logging and performance analytics

## Features

### Core Features
- **Real-time Bidding**: Process bid requests from multiple ad exchanges
- **Multi-Exchange Support**: Google AdX and Amazon TAM integration
- **Bid Strategies**: Fixed, dynamic, and optimized bidding approaches
- **Campaign Management**: Create, pause, resume, and end campaigns
- **Budget Controls**: Daily limits and total budget enforcement
- **Targeting Engine**: Geo, screen type, and location-based targeting
- **Batch Processing**: Support for batch bid evaluation
- **Analytics**: Track impressions, wins, spend, and win rates

### Bid Strategies
| Strategy | Description |
|----------|-------------|
| `fixed` | Bids 10% above floor price |
| `dynamic` | Bids 0-50% above floor with randomization |
| `optimized` | ML-driven bidding (20% above floor in current implementation) |

### Targeting Options
- **Geo Targeting**: Target by country codes
- **Screen Types**: Target specific DOOH screen types
- **Location Targeting**: Target by city or location keywords

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Ad Exchanges                                    │
│  ┌─────────────┐    ┌─────────────┐                                        │
│  │ Google AdX  │    │ Amazon TAM  │                                        │
│  └──────┬──────┘    └──────┬──────┘                                        │
└─────────┼──────────────────┼────────────────────────────────────────────────┘
          │                  │
          ▼                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DSP Bidder Service (4061)                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        Express API Layer                             │   │
│  │  /api/bid, /api/bid/batch, /api/campaigns/*, /health, /ready        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      Bidding Service                                 │   │
│  │  - Evaluate bid requests                                             │   │
│  │  - Match campaigns to impressions                                    │   │
│  │  - Calculate bid prices                                              │   │
│  │  - Budget enforcement                                                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Campaign Service                                  │   │
│  │  - CRUD operations                                                   │   │
│  │  - Status management                                                 │   │
│  │  - Statistics aggregation                                            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│           ┌────────────────────────┼────────────────────────┐              │
│           ▼                        ▼                        ▼              │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐        │
│  │    Campaign     │    │    BidLog       │    │  BudgetTracker  │        │
│  │    (MongoDB)    │    │    (MongoDB)    │    │    (MongoDB)    │        │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘        │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           RABTUL Services                                    │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐               │
│  │   Auth    │  │  Payment  │  │  Wallet   │  │   Notif   │               │
│  │  (4002)   │  │  (4001)   │  │  (4004)   │  │  (4005)   │               │
│  └───────────┘  └───────────┘  └───────────┘  └───────────┘               │
└─────────────────────────────────────────────────────────────────────────────┘
```

## API Endpoints

### Health & Status
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check - returns service status |
| GET | `/ready` | Readiness check - verifies MongoDB connection |

### Campaigns
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/campaigns` | List all campaigns (filter by `status`, `exchange`) |
| POST | `/api/campaigns` | Create a new campaign |
| GET | `/api/campaigns/:id` | Get campaign details |
| PATCH | `/api/campaigns/:id` | Update campaign |
| DELETE | `/api/campaigns/:id` | Delete campaign (must be paused first) |
| POST | `/api/campaigns/:id/pause` | Pause campaign |
| POST | `/api/campaigns/:id/resume` | Resume paused campaign |
| GET | `/api/campaigns/:id/stats` | Get campaign statistics |
| GET | `/api/campaigns/:id/budget` | Get campaign budget status |

### Bidding
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/bid` | Evaluate and bid on single impression |
| POST | `/api/bid/batch` | Batch bid evaluation |

## Usage Examples

### Create a Campaign
```bash
curl -X POST http://localhost:4061/api/campaigns \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: your_token_here" \
  -d '{
    "name": "Q1 Brand Awareness",
    "exchange": "google_adx",
    "budget": 50000,
    "dailyLimit": 2000,
    "bidStrategy": "dynamic",
    "maxBidPrice": 50,
    "targeting": {
      "geo": ["IN", "US"],
      "screenTypes": ["billboard_led", "retail_kiosk"],
      "locations": ["Mumbai", "Delhi"]
    },
    "startDate": "2026-01-01T00:00:00Z",
    "endDate": "2026-03-31T23:59:59Z"
  }'
```

### Submit a Bid Request
```bash
curl -X POST http://localhost:4061/api/bid \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: your_token_here" \
  -d '{
    "exchange": "google_adx",
    "impression": {
      "id": "imp-12345",
      "floor": 5.00,
      "currency": "INR",
      "inventory": {
        "screenId": "screen-mum-001",
        "screenType": "billboard_led",
        "location": "Bandra West",
        "city": "Mumbai",
        "state": "Maharashtra",
        "country": "IN"
      }
    },
    "campaign": {
      "id": "campaign_id_here",
      "targeting": {
        "geo": ["IN"],
        "screenTypes": ["billboard_led"]
      },
      "maxBid": 25
    }
  }'
```

### Batch Bid Request
```bash
curl -X POST http://localhost:4061/api/bid/batch \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: your_token_here" \
  -d '{
    "requests": [
      {
        "exchange": "google_adx",
        "impression": { "id": "imp-1", "floor": 3.00, "currency": "INR", "inventory": { "screenId": "s1", "screenType": "kiosk", "location": "mall", "country": "IN" } },
        "campaign": { "id": "camp-1" }
      },
      {
        "exchange": "amazon_tam",
        "impression": { "id": "imp-2", "floor": 4.50, "currency": "INR", "inventory": { "screenId": "s2", "screenType": "led", "location": "airport", "country": "IN" } },
        "campaign": { "id": "camp-2" }
      }
    ]
  }'
```

### Get Campaign Stats
```bash
curl -X GET "http://localhost:4061/api/campaigns/camp_id/stats" \
  -H "X-Internal-Token: your_token_here"
```

### Pause/Resume Campaign
```bash
# Pause
curl -X POST http://localhost:4061/api/campaigns/camp_id/pause \
  -H "X-Internal-Token: your_token_here"

# Resume
curl -X POST http://localhost:4061/api/campaigns/camp_id/resume \
  -H "X-Internal-Token: your_token_here"
```

## Environment Variables

### Required
| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | JWT signing secret for authentication |

### Optional
| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `4061` | Service port |
| `NODE_ENV` | `development` | Environment mode |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection URL |
| `INTERNAL_SERVICE_TOKEN` | - | Token for service-to-service auth |
| `CORS_ORIGIN` | `*` | Allowed CORS origins (comma-separated) |
| `DSP_NAME` | `ReZ-DSP` | DSP display name |
| `DSP_ID` | `rez_dsp_001` | DSP identifier |
| `DAILY_BUDGET` | `100000` | Default daily budget limit |
| `MAX_BID_PRICE` | `100` | Maximum bid price |
| `MIN_BID_PRICE` | `1` | Minimum bid price |
| `DEFAULT_GEO` | `IN` | Default geo targeting |
| `DEFAULT_SCREEN_TYPES` | `billboard_led,retail_kiosk,cab_tablet` | Default screen types |

### Exchange Configuration
| Variable | Description |
|----------|-------------|
| `GOOGLE_ADX_ENDPOINT` | Google AdX API endpoint |
| `GOOGLE_ADX_TOKEN` | Google AdX authentication token |
| `AMAZON_TAM_ENDPOINT` | Amazon TAM API endpoint |
| `AMAZON_TAM_TOKEN` | Amazon TAM authentication token |

### RABTUL Services
| Variable | Default | Description |
|----------|---------|-------------|
| `RABTUL_AUTH_URL` | `http://localhost:4002` | RABTUL Auth service |
| `RABTUL_PAYMENT_URL` | `http://localhost:4001` | RABTUL Payment service |
| `RABTUL_WALLET_URL` | `http://localhost:4004` | RABTUL Wallet service |
| `RABTUL_NOTIFICATION_URL` | `http://localhost:4005` | RABTUL Notification service |

## Installation

### Prerequisites
- Node.js 20+
- MongoDB 6+
- Redis 7+ (optional, for caching)

### Local Development
```bash
# Clone and install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
# Ensure MONGODB_URI and JWT_SECRET are set

# Start development server
npm run dev
```

### Docker
```bash
# Using docker-compose
docker-compose up -d

# Or build and run manually
docker build -t rez-dsp-bidder .
docker run -p 4061:3000 --env-file .env rez-dsp-bidder
```

## Data Models

### Campaign
```typescript
interface Campaign {
  _id: ObjectId;
  name: string;
  exchange?: 'google_adx' | 'amazon_tam';
  budget: number;
  dailyLimit?: number;
  bidStrategy: 'fixed' | 'dynamic' | 'optimized';
  maxBidPrice?: number;
  targeting?: {
    geo?: string[];
    screenTypes?: string[];
    locations?: string[];
    demographics?: Record<string, unknown>;
    screenIds?: string[];
  };
  status: 'active' | 'paused' | 'ended';
  startDate: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### BidLog
```typescript
interface BidLog {
  _id: ObjectId;
  requestId: string;
  campaignId: string;
  exchange: string;
  impressionId: string;
  floor: number;
  bidPrice: number;
  winPrice?: number;
  won: boolean;
  spent: number;
  timestamp: Date;
  latency: number;
}
```

### BudgetTracker
```typescript
interface BudgetTracker {
  _id: ObjectId;
  campaignId: string;
  date: Date;
  totalSpent: number;
  totalImpressions: number;
  totalBids: number;
  totalWins: number;
  avgBidPrice: number;
  avgWinPrice: number;
}
```

### Creative
```typescript
interface Creative {
  _id: ObjectId;
  id: string;
  campaignId: string;
  url: string;
  width: number;
  height: number;
  mimeType: string;
  status: 'active' | 'paused' | 'ended';
}
```

## Related Services

| Service | Port | Description |
|---------|------|-------------|
| [REZ DSP Portal](https://github.com/your-org/REZ-dsp-portal) | 4064 | Self-serve advertiser portal |
| [RABTUL Auth](https://github.com/your-org/rabtul-auth) | 4002 | Authentication & authorization |
| [RABTUL Payment](https://github.com/your-org/rabtul-payment) | 4001 | Payment processing |
| [RABTUL Wallet](https://github.com/your-org/rabtul-wallet) | 4004 | Digital wallet management |
| [RABTUL Notification](https://github.com/your-org/rabtul-notification) | 4005 | Push & email notifications |
| [REZ DOOH Intelligence](https://github.com/your-org/rez-dooh-intel) | 4080 | DOOH pricing & analytics |

## Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies |
| `npm run dev` | Start development server with hot-reload |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start` | Start production server |
| `npm test` | Run test suite |

## License

Internal use only - AdBazaar REZ Ecosystem