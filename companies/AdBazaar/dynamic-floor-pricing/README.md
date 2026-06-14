# Dynamic Floor Pricing Service

AI-driven floor pricing for AdBazaar's advertising inventory optimization.

## Overview

This service manages dynamic floor prices for advertising inventory, using AI to optimize pricing based on historical performance, market conditions, and demand signals.

## Port

**Port: 4982**

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Dynamic Floor Pricing                      │
├─────────────────────────────────────────────────────────────┤
│  Routes Layer                                               │
│  ├── POST /api/floors - Set floor price                     │
│  ├── GET /api/floors/:inventoryId - Get floor               │
│  ├── GET /api/floors - List all floors                      │
│  ├── PUT /api/floors/:id - Update floor                      │
│  ├── POST /api/floors/:id/optimize - Optimize floor         │
│  ├── GET /api/floors/:id/history - Floor history             │
│  ├── GET /api/floors/:id/performance - Floor performance     │
│  ├── POST /api/floors/batch - Batch floor update            │
│  └── GET /api/floors/recommendations - AI recommendations   │
├─────────────────────────────────────────────────────────────┤
│  Services Layer                                             │
│  ├── floorService - Floor price management                  │
│  ├── optimizationService - AI optimization                   │
│  ├── historyService - Price history                          │
│  ├── performanceService - Performance tracking               │
│  └── recommendationService - AI recommendations              │
├─────────────────────────────────────────────────────────────┤
│  Data Layer (MongoDB + Redis)                               │
│  ├── FloorPrice - Current floor prices                       │
│  ├── FloorHistory - Price change history                     │
│  ├── FloorPerformance - eCPM, impressions, revenue           │
│  └── FloorRecommendation - AI suggestions                    │
└─────────────────────────────────────────────────────────────┘
```

## Features

### Core Features
- **Dynamic Floor Pricing**: Set and manage floor prices per inventory item
- **AI Optimization**: Machine learning-based price optimization
- **Performance Tracking**: Real-time eCPM, impressions, and revenue tracking
- **History Management**: Complete audit trail of price changes
- **Batch Operations**: Bulk floor price updates
- **AI Recommendations**: Smart suggestions for optimal pricing

### Floor Types
- `fixed` - Static floor price
- `dynamic` - Algorithm-calculated price
- `market` - Market-rate adjusted price
- `competitive` - Competitor-matched price

### Floor Statuses
- `active` - Currently in effect
- `pending` - Scheduled for future activation
- `inactive` - Temporarily disabled
- `archived` - No longer used

## API Endpoints

### Floor Management

#### Set Floor Price
```http
POST /api/floors
Content-Type: application/json
X-Internal-Token: <token>

{
  "inventoryId": "inv_123",
  "price": 2.50,
  "type": "dynamic",
  "currency": "USD",
  "effectiveDate": "2026-06-07T00:00:00Z",
  "minPrice": 1.00,
  "maxPrice": 10.00,
  "metadata": {
    "category": "premium",
    "placement": "banner"
  }
}
```

#### Get Floor
```http
GET /api/floors/:inventoryId
```

#### List All Floors
```http
GET /api/floors?status=active&type=dynamic&page=1&limit=50
```

#### Update Floor
```http
PUT /api/floors/:id
Content-Type: application/json

{
  "price": 3.00,
  "status": "active"
}
```

#### Optimize Floor
```http
POST /api/floors/:id/optimize
Content-Type: application/json

{
  "targetEcpm": 5.00,
  "minImprovement": 0.1
}
```

#### Get Floor History
```http
GET /api/floors/:id/history?from=2026-01-01&to=2026-06-07
```

#### Get Floor Performance
```http
GET /api/floors/:id/performance?period=7d
```

#### Batch Floor Update
```http
POST /api/floors/batch
Content-Type: application/json

{
  "floors": [
    { "inventoryId": "inv_123", "price": 2.50 },
    { "inventoryId": "inv_456", "price": 3.00 }
  ],
  "reason": "Campaign launch adjustment"
}
```

#### Get AI Recommendations
```http
GET /api/floors/recommendations?inventoryIds=inv_123,inv_456
```

### Health Check
```http
GET /health
```

## Data Models

### FloorPrice
```typescript
{
  inventoryId: string;       // Unique inventory identifier
  price: number;             // Current floor price
  type: FloorType;           // fixed | dynamic | market | competitive
  status: FloorStatus;      // active | pending | inactive | archived
  currency: string;          // ISO currency code
  effectiveDate: Date;      // When floor becomes active
  expiryDate?: Date;         // Optional expiry
  minPrice?: number;         // Price floor minimum
  maxPrice?: number;         // Price floor maximum
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
```

### FloorHistory
```typescript
{
  floorId: string;           // Reference to FloorPrice
  inventoryId: string;
  previousPrice: number;
  newPrice: number;
  timestamp: Date;
  reason: string;
  triggeredBy: string;       // User or system
  metadata?: Record<string, any>;
}
```

### FloorPerformance
```typescript
{
  floorId: string;
  inventoryId: string;
  date: Date;
  impressions: number;
  revenue: number;
  ecpm: number;              // Effective CPM
  fillRate: number;
  winningBidCount: number;
  avgWinningBid: number;
}
```

### FloorRecommendation
```typescript
{
  inventoryId: string;
  suggestedPrice: number;
  confidence: number;        // 0-1
  factors: {
    name: string;
    impact: number;           // -1 to 1
    description: string;
  }[];
  currentPrice: number;
  projectedEcpm: number;
  timestamp: Date;
}
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Service port | 4982 |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/dynamic_floor_pricing |
| REDIS_URL | Redis connection string | redis://localhost:6379 |
| INTERNAL_SERVICE_TOKEN | Service authentication token | - |
| LOG_LEVEL | Logging level | info |
| HOJAI_API_URL | HOJAI AI service URL | http://localhost:4800 |
| REZ_INTELLIGENCE_URL | REZ Intelligence URL | http://localhost:4018 |

## Installation

```bash
npm install
```

## Development

```bash
# Start in development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Health Check

```bash
curl http://localhost:4982/health
```

Response:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2026-06-07T12:00:00Z",
  "services": {
    "mongodb": "connected",
    "redis": "connected"
  }
}
```

## Metrics

Prometheus metrics available at `/metrics`:
- `floor_prices_total` - Total floor prices by type/status
- `floor_optimizations_total` - Optimization operations
- `floor_revenue_total` - Revenue tracked
- `floor_ecpm_avg` - Average eCPM
- `http_request_duration_seconds` - Request latency

## Integration

### Ecosystem Connections
- **HOJAI AI**: AI optimization and recommendations
- **REZ Intelligence**: Intent prediction and demand signals
- **MongoDB**: Persistent storage
- **Redis**: Caching and rate limiting

### Related Services
- SSP Gateway (4520) - Bid requests
- Bidding Engine (4521) - Auction execution
- Analytics Service - Performance data
- Campaign Service - Campaign management

## License

Proprietary - AdBazaar