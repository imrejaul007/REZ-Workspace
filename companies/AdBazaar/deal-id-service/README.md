# Deal ID Service

**Port:** 4963  
**Company:** AdBazaar  
**Purpose:** Programmatic deal management for advertising deals

## Overview

The Deal ID Service provides programmatic deal management capabilities for AdBazaar's SSP (Supply Side Platform). It handles creation, negotiation, activation, and analytics tracking of advertising deals between buyers and sellers.

## Features

- **Deal Management:** Create, update, activate, pause, and complete deals
- **Deal Terms:** Manage pricing, targeting, pacing, and creative requirements
- **Negotiation:** Multi-round negotiation with counteroffers
- **Analytics:** Real-time performance tracking and pacing analysis
- **Pacing:** Budget pacing and delivery optimization

## API Endpoints

### Deal Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/deals` | Create a new deal |
| GET | `/api/deals` | List deals with filters |
| GET | `/api/deals/:id` | Get deal by ID |
| PUT | `/api/deals/:id` | Update deal |
| POST | `/api/deals/:id/activate` | Activate deal |
| POST | `/api/deals/:id/pause` | Pause deal |

### Deal Terms

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/deals/:id/terms` | Create deal terms |
| GET | `/api/deals/:id/terms` | Get deal terms |
| PUT | `/api/deals/:id/terms` | Update deal terms |

### Negotiation

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/deals/:id/negotiate` | Create negotiation |

### Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/deals/:id/analytics` | Get deal analytics |
| GET | `/api/deals/:id/pacing` | Get pacing status |

### Health & Monitoring

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/metrics` | Prometheus metrics |

## Data Models

### Deal

```typescript
interface Deal {
  dealId: string;
  buyer: string;
  seller: string;
  type: 'private' | 'preferred' | 'programmatic' | 'preferred_deal' | 'block';
  price: {
    amount: number;
    currency: string;
    model: 'cpm' | 'cpc' | 'cpa' | 'cpv' | 'flat_rate';
  };
  status: 'draft' | 'pending' | 'active' | 'paused' | 'completed' | 'cancelled' | 'rejected';
  impressions: number;
  budget: { amount: number; spent: number };
  targeting: TargetingConfig;
  pacing: PacingConfig;
  startDate?: Date;
  endDate?: Date;
}
```

### Deal Terms

```typescript
interface DealTerms {
  dealId: string;
  impressions: {
    guaranteed: number;
    nonGuaranteed: number;
    total: number;
  };
  pacing: {
    daily?: number;
    weekly?: number;
    monthly?: number;
    strategy: 'asap' | 'even' | 'frontload' | 'backload';
  };
  targeting: TargetingConfig;
  pricing: {
    basePrice: number;
    currency: string;
    model: string;
    floorPrice?: number;
    ceilingPrice?: number;
    discounts?: Discount[];
  };
  creativeRequirements: CreativeRequirements;
  deliveryRequirements: DeliveryRequirements;
  restrictions: Restrictions;
  attribution: AttributionConfig;
  measurement: MeasurementConfig;
}
```

### Deal Negotiation

```typescript
interface DealNegotiation {
  dealId: string;
  status: 'pending' | 'in_progress' | 'accepted' | 'rejected' | 'countered' | 'expired' | 'withdrawn';
  offers: Offer[];
  counteroffers: Counteroffer[];
  currentRound: number;
  maxRounds: number;
  deadline?: Date;
}
```

### Deal Analytics

```typescript
interface DealAnalytics {
  dealId: string;
  date: string;
  impressions: {
    total: number;
    measurable: number;
    viewable: number;
    viewabilityRate: number;
  };
  clicks: {
    total: number;
    viewThrough: number;
    clickThroughRate: number;
  };
  spend: {
    total: number;
    daily: number;
    remaining: number;
    currency: string;
  };
  pacing: PacingMetrics;
  performance: {
    cpm: number;
    cpc: number;
    cpa: number;
    roas: number;
  };
  inventory: {
    total: number;
    filled: number;
    fillRate: number;
    bidRequests: number;
    bids: number;
    bidRate: number;
  };
}
```

## Authentication

All API endpoints require internal service authentication via Bearer token:

```
Authorization: Bearer <INTERNAL_SERVICE_TOKEN>
```

Set the `INTERNAL_SERVICE_TOKEN` environment variable for authentication.

## Configuration

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| PORT | 4963 | Service port |
| MONGODB_URI | mongodb://localhost:27017/deal-id-service | MongoDB connection URI |
| REDIS_URL | redis://localhost:6379 | Redis connection URL |
| LOG_LEVEL | info | Logging level |
| INTERNAL_SERVICE_TOKEN | deal-id-service-internal-token | Internal auth token |

## Running the Service

```bash
# Install dependencies
npm install

# Development mode
npm run dev

# Production build
npm run build
npm start

# Health check
curl http://localhost:4963/health

# Prometheus metrics
curl http://localhost:4963/metrics
```

## Example Usage

### Create a Deal

```bash
curl -X POST http://localhost:4963/api/deals \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "dealId": "deal_abc123",
    "buyer": "advertiser_001",
    "seller": "publisher_001",
    "type": "preferred_deal",
    "price": {
      "amount": 5.00,
      "currency": "USD",
      "model": "cpm"
    },
    "budget": {
      "amount": 10000,
      "spent": 0
    },
    "pacing": {
      "strategy": "even"
    }
  }'
```

### Activate a Deal

```bash
curl -X POST http://localhost:4963/api/deals/deal_abc123/activate \
  -H "Authorization: Bearer <token>"
```

### Create Deal Terms

```bash
curl -X POST http://localhost:4963/api/deals/deal_abc123/terms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "impressions": {
      "guaranteed": 1000000,
      "nonGuaranteed": 500000,
      "total": 1500000
    },
    "pacing": {
      "strategy": "even",
      "daily": 50000
    },
    "pricing": {
      "basePrice": 5.00,
      "currency": "USD",
      "model": "cpm"
    },
    "creativeRequirements": {
      "formats": ["banner", "video"],
      "sizes": ["300x250", "728x90"]
    }
  }'
```

### Create Negotiation

```bash
curl -X POST http://localhost:4963/api/deals/deal_abc123/negotiate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "party": "buyer",
    "partyId": "advertiser_001",
    "price": {
      "amount": 4.50,
      "currency": "USD",
      "model": "cpm"
    },
    "impressions": {
      "guaranteed": 1200000,
      "total": 1500000
    },
    "message": "Looking for better pricing for bulk commitment"
  }'
```

### Get Analytics

```bash
curl "http://localhost:4963/api/deals/deal_abc123/analytics?startDate=2026-01-01&endDate=2026-01-31" \
  -H "Authorization: Bearer <token>"
```

### Get Pacing Status

```bash
curl http://localhost:4963/api/deals/deal_abc123/pacing \
  -H "Authorization: Bearer <token>"
```

## Prometheus Metrics

| Metric | Type | Description |
|--------|------|-------------|
| http_request_duration_seconds | Histogram | HTTP request duration |
| deals_created_total | Counter | Total deals created |
| deals_activated_total | Counter | Total deals activated |
| deals_paused_total | Counter | Total deals paused |
| negotiations_created_total | Counter | Total negotiations |
| deal_impressions_total | Counter | Total impressions |
| deal_spend_total | Counter | Total spend |
| active_deals_count | Gauge | Active deals count |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Deal ID Service (4963)                    │
├─────────────────────────────────────────────────────────────┤
│  Express Server                                              │
│  ├── Health & Metrics Endpoints                              │
│  ├── Auth Middleware                                         │
│  └── API Routes                                              │
├─────────────────────────────────────────────────────────────┤
│  Services Layer                                              │
│  ├── dealService - Deal CRUD                                │
│  ├── termsService - Deal terms management                    │
│  ├── negotiationService - Deal negotiation                  │
│  ├── analyticsService - Deal analytics                      │
│  └── pacingService - Pacing management                       │
├─────────────────────────────────────────────────────────────┤
│  Models Layer                                                │
│  ├── Deal - Deal document schema                            │
│  ├── DealTerms - Deal terms schema                          │
│  ├── DealNegotiation - Negotiation schema                   │
│  └── DealAnalytics - Analytics schema                       │
├─────────────────────────────────────────────────────────────┤
│  Infrastructure                                              │
│  ├── MongoDB - Primary data store                           │
│  ├── Redis - Caching & pub/sub                              │
│  ├── Prometheus - Metrics collection                        │
│  └── Winston - Logging                                      │
└─────────────────────────────────────────────────────────────┘
```

## Related Services

- **SSP Gateway (4520):** Main entry point for SSP operations
- **Inventory Service (4521):** Inventory management
- **Bidding Service (4522):** Real-time bidding
- **Analytics Service (4524):** Campaign analytics

## License

Proprietary - AdBazaar Internal Use Only