# REZ DSP Portal

A self-serve advertising platform for the REZ ecosystem that enables advertisers to create, manage, and optimize digital-out-of-home (DOOH) and programmatic advertising campaigns.

## Description

The REZ DSP Portal provides advertisers with a comprehensive interface to manage their advertising campaigns. It integrates with the DSP Bidder for real-time bidding and the DOOH Intelligence service for dynamic pricing and campaign planning.

**Key Responsibilities:**
- Advertiser registration and account management
- Campaign creation with targeting and budget configuration
- Creative management and submission
- Real-time campaign metrics and analytics
- DOOH pricing intelligence and campaign estimates
- Billing and funds management

## Features

### Core Features
- **Advertiser Management**: Register, manage advertiser accounts
- **Campaign Management**: Create, launch, pause, and complete campaigns
- **Creative Management**: Upload and manage ad creatives
- **Targeting Engine**: Demographics, geo, devices, and audience targeting
- **Bidding Strategies**: Auto, manual, target CPA, and target ROAS
- **Real-time Metrics**: Impressions, clicks, CTR, conversions, spend
- **Billing & Payments**: Add funds, view billing summary, invoices
- **DOOH Intelligence**: Dynamic pricing, screen types, campaign estimates

### Campaign Objectives
| Objective | Description |
|-----------|-------------|
| `awareness` | Brand awareness campaigns |
| `traffic` | Drive visitors to locations |
| `conversion` | Trackable actions/conversions |
| `lead` | Lead generation campaigns |

### Bidding Strategies
| Strategy | Description |
|----------|-------------|
| `auto` | System optimizes bid automatically |
| `manual` | Advertiser sets maximum bid |
| `target_cpa` | Optimize for cost per acquisition |
| `target_roas` | Optimize for return on ad spend |

### Targeting Options
- **Demographics**: Age ranges, gender
- **Geography**: City, region, country targeting
- **Interests & Behaviors**: Audience segments
- **Devices**: Mobile, desktop, tablet
- **Placements**: Specific screen types/locations

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Advertisers                                     │
│                      (Web Dashboard / Mobile App)                            │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │ HTTP/REST
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DSP Portal Service (4064)                           │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        Express API Layer                             │   │
│  │  /api/advertisers/*, /api/campaigns/*, /api/reach/*, /api/dooh/*   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     DSPPortal Service                               │   │
│  │  - Advertiser management                                             │   │
│  │  - Campaign lifecycle                                                │   │
│  │  - Creative management                                               │   │
│  │  - Reach estimation                                                  │   │
│  │  - DOOH intelligence integration                                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│           ┌────────────────────────┼────────────────────────┐              │
│           ▼                        ▼                        ▼              │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐        │
│  │   Advertisers   │    │   Campaigns     │    │   Creatives     │        │
│  │   (In-Memory)   │    │   (In-Memory)   │    │   (In-Memory)   │        │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘        │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
           ┌───────────────────────┼───────────────────────┐
           ▼                       ▼                       ▼
┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐
│  DSP Bidder (4061) │  │ DOOH Intel (4080)  │  │ RABTUL Services    │
│                    │  │                    │  │                    │
│  - Real-time bid   │  │  - Screen types    │  │  - Auth (4002)     │
│    evaluation      │  │  - Dynamic pricing │  │  - Payment (4001)  │
│  - Campaign        │  │  - Campaign        │  │  - Wallet (4004)   │
│    execution       │  │    estimates       │  │  - Notification    │
│  - Budget pacing   │  │  - Demo pricing    │  │    (4005)          │
└────────────────────┘  └────────────────────┘  └────────────────────┘
```

## API Endpoints

### Health & Status
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check - returns service status |

### Advertisers
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/advertisers` | Register new advertiser |
| POST | `/api/advertisers/:id/funds` | Add funds to account |
| GET | `/api/advertisers/:id/billing` | Get billing summary |

### Campaigns
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/campaigns` | Create a new campaign |
| POST | `/api/campaigns/:id/creatives` | Add creative to campaign |
| POST | `/api/campaigns/:id/launch` | Launch campaign |
| POST | `/api/campaigns/:id/pause` | Pause campaign |
| GET | `/api/campaigns/:id/metrics` | Get campaign metrics |
| GET | `/api/campaigns/:id/report` | Generate campaign report |

### Reach Estimation
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/reach/estimate` | Estimate campaign reach |

### DOOH Intelligence
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dooh/screen-types` | Get available screen types |
| GET | `/api/dooh/pricing/demo` | Get demo pricing for all screen types |
| POST | `/api/dooh/pricing/calculate` | Calculate dynamic pricing |
| POST | `/api/dooh/estimate` | Calculate campaign estimate |

## Usage Examples

### Register Advertiser
```bash
curl -X POST http://localhost:4064/api/advertisers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@acme.com",
    "company": "Acme Corp",
    "website": "https://acme.com"
  }'
```

### Create Campaign
```bash
curl -X POST http://localhost:4064/api/campaigns \
  -H "Content-Type: application/json" \
  -d '{
    "advertiserId": "adv-12345",
    "name": "Summer Sale Campaign",
    "objective": "awareness",
    "budget": {
      "daily": 500,
      "total": 15000
    },
    "bidding": {
      "strategy": "auto",
      "targetCpa": 10
    },
    "targeting": {
      "age": { "min": 25, "max": 45 },
      "gender": ["male", "female"],
      "locations": ["Mumbai", "Delhi", "Bangalore"],
      "interests": ["shopping", "fashion"],
      "devices": ["mobile", "desktop"]
    }
  }'
```

### Add Creative
```bash
curl -X POST http://localhost:4064/api/campaigns/camp-12345/creatives \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Summer Banner",
    "type": "banner",
    "format": "300x250",
    "url": "https://cdn.example.com/creatives/summer.jpg",
    "clickUrl": "https://acme.com/summer-sale"
  }'
```

### Launch Campaign
```bash
curl -X POST http://localhost:4064/api/campaigns/camp-12345/launch \
  -H "Content-Type: application/json"
```

### Get Campaign Metrics
```bash
curl -X GET http://localhost:4064/api/campaigns/camp-12345/metrics
```

### Generate Report
```bash
curl -X GET "http://localhost:4064/api/campaigns/camp-12345/report?startDate=2026-01-01&endDate=2026-01-31"
```

### Estimate Reach
```bash
curl -X POST http://localhost:4064/api/reach/estimate \
  -H "Content-Type: application/json" \
  -d '{
    "targeting": {
      "locations": ["Mumbai", "Delhi"],
      "interests": ["shopping"]
    },
    "budget": 5000
  }'
```

### Add Funds
```bash
curl -X POST http://localhost:4064/api/advertisers/adv-12345/funds \
  -H "Content-Type: application/json" \
  -d '{ "amount": 10000 }'
```

### Get DOOH Screen Types
```bash
curl -X GET http://localhost:4064/api/dooh/screen-types
```

### Get DOOH Pricing
```bash
curl -X POST http://localhost:4064/api/dooh/pricing/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "screenType": "billboard_led",
    "city": "Mumbai",
    "tier": "metro",
    "scheduledTime": {
      "start": "2026-06-15T09:00:00Z",
      "end": "2026-06-15T21:00:00Z"
    }
  }'
```

### Calculate Campaign Estimate
```bash
curl -X POST http://localhost:4064/api/dooh/estimate \
  -H "Content-Type: application/json" \
  -d '{
    "screenTypes": ["billboard_led", "retail_kiosk"],
    "cities": ["Mumbai", "Delhi"],
    "budget": 25000,
    "objective": "awareness"
  }'
```

## Environment Variables

### Required
| Variable | Description |
|----------|-------------|
| `JWT_SECRET` | JWT signing secret for authentication |

### Optional
| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `4064` | Service port |
| `NODE_ENV` | `development` | Environment mode |
| `MONGODB_URI` | `mongodb://localhost:27017/REZ-dsp-portal` | MongoDB connection (future use) |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection URL |
| `INTERNAL_SERVICE_TOKEN` | - | Token for service-to-service auth |

### DOOH Intelligence Integration
| Variable | Default | Description |
|----------|---------|-------------|
| `DOOH_INTEL_URL` | `http://localhost:4080` | DOOH Intelligence service URL |

### RABTUL Services
| Variable | Default | Description |
|----------|---------|-------------|
| `AUTH_SERVICE_URL` | `http://localhost:4002` | RABTUL Auth service |
| `PAYMENT_SERVICE_URL` | `http://localhost:4001` | RABTUL Payment service |
| `WALLET_SERVICE_URL` | `http://localhost:4004` | RABTUL Wallet service |
| `NOTIFICATION_SERVICE_URL` | `http://localhost:4011` | RABTUL Notification service |
| `ANALYTICS_SERVICE_URL` | `http://localhost:4016` | RABTUL Analytics service |
| `EVENT_BUS_URL` | `http://localhost:4025` | REZ Event Bus |
| `INTENT_SERVICE_URL` | `http://localhost:4018` | REZ Intent/Prediction service |

## Installation

### Prerequisites
- Node.js 18+
- MongoDB 6+ (optional, for production data persistence)
- Redis 7+ (optional, for caching)

### Local Development
```bash
# Clone and install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration

# Start development server
npm run dev
```

### Docker
```bash
# Using docker-compose
docker-compose up -d

# Or build and run manually
docker build -t rez-dsp-portal .
docker run -p 4064:3000 --env-file .env rez-dsp-portal
```

## Data Models

### Advertiser
```typescript
interface DSPAdvertiser {
  id: string;
  name: string;
  email: string;
  company: string;
  website?: string;
  status: 'pending' | 'active' | 'suspended';
  balance: number;
  spent: number;
  createdAt: Date;
}
```

### Campaign
```typescript
interface DSPCampaign {
  id: string;
  advertiserId: string;
  name: string;
  objective: 'awareness' | 'traffic' | 'conversion' | 'lead';
  status: 'draft' | 'active' | 'paused' | 'completed';
  budget: {
    daily?: number;
    total: number;
    spent: number;
  };
  bidding: {
    strategy: 'auto' | 'manual' | 'target_cpa' | 'target_roas';
    maxBid?: number;
    targetCpa?: number;
    targetRoas?: number;
  };
  targeting: DSPargeting;
  creatives: DSpotCreative[];
  metrics: DSPMetrics;
  createdAt: Date;
}
```

### Targeting
```typescript
interface DSPargeting {
  age?: { min: number; max: number };
  gender?: string[];
  locations?: string[];
  interests?: string[];
  behaviors?: string[];
  audiences?: string[];
  devices?: ('mobile' | 'desktop' | 'tablet')[];
  placements?: string[];
}
```

### Creative
```typescript
interface DSpotCreative {
  id: string;
  name: string;
  type: 'banner' | 'video' | 'native' | 'playable';
  format: '300x250' | '300x600' | '320x50' | '728x90' | '1920x1080';
  url: string;
  clickUrl: string;
  status: 'pending' | 'approved' | 'rejected';
}
```

### Metrics
```typescript
interface DSPMetrics {
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  conversionRate: number;
  spend: number;
  cpm: number;
  cpc: number;
  cpa: number;
  roas: number;
}
```

## Related Services

| Service | Port | Description |
|---------|------|-------------|
| [REZ DSP Bidder](https://github.com/your-org/rez-dsp-bidder) | 4061 | Real-time bidding engine |
| [REZ DOOH Intelligence](https://github.com/your-org/rez-dooh-intel) | 4080 | DOOH pricing & analytics |
| [RABTUL Auth](https://github.com/your-org/rabtul-auth) | 4002 | Authentication & authorization |
| [RABTUL Payment](https://github.com/your-org/rabtul-payment) | 4001 | Payment processing |
| [RABTUL Wallet](https://github.com/your-org/rabtul-wallet) | 4004 | Digital wallet management |
| [RABTUL Notification](https://github.com/your-org/rabtul-notification) | 4011 | Push & email notifications |

## Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies |
| `npm run dev` | Start development server |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start` | Start production server |
| `npm test` | Run test suite |
| `npm run test:run` | Run tests once (no watch mode) |

## DOOH Screen Types

The portal supports the following DOOH screen types for campaign targeting:

| Screen Type | Description | Typical CPM Range |
|-------------|-------------|-------------------|
| `billboard_led` | Large LED billboards | INR 150-500 |
| `retail_kiosk` | Retail store digital displays | INR 30-80 |
| `cab_tablet` | Taxi/ride-share tablets | INR 15-40 |
| `transit_display` | Public transport screens | INR 25-60 |
| `elevator_screen` | Elevator interior displays | INR 20-50 |
| `mall_directory` | Mall directory screens | INR 40-100 |
| `airport_display` | Airport digital signage | INR 100-300 |
| `street_furniture` | Street-level digital displays | INR 30-70 |

## License

Internal use only - AdBazaar REZ Ecosystem