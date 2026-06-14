# Retail Media OS Service

**AdBazaar Retail Media OS** - In-store advertising, sales lift measurement, and retail attribution platform.

**Port:** 4990

**Competitors:** Amazon Ads, Walmart Connect, Target Roundel

## Overview

Retail Media OS is AdBazaar's comprehensive retail media advertising platform that enables brands to advertise within retail environments. It provides:

- Retailer and store management
- In-store advertising inventory management
- Campaign creation and optimization
- Sales lift measurement and attribution
- Performance analytics dashboard

## Features

### 1. Retailer Management
- Register and manage retail chains
- Configure retailer settings (markup, bid ranges, targeting)
- Track store locations and capacity
- Integration with POS and inventory systems

### 2. In-Store Inventory Management
- Shelf, endcap, checkout, entrance, freezer placements
- Dynamic pricing based on placement type
- Availability calendar management
- Capacity tracking by store

### 3. Campaign Management
- Multi-objective campaigns (awareness, consideration, conversion, loyalty)
- Flexible bidding strategies (CPM, CPC, CPAS)
- Product-level targeting
- Creative asset management
- Real-time performance tracking

### 4. Sales Lift Measurement
- Geo-test, store-test, holdout, matched-market methodologies
- Statistical confidence calculation
- Incremental sales attribution
- ROI analysis

### 5. Retail Attribution
- Multi-touch attribution models
- Store-level attribution
- Product-level attribution
- Daily attribution trends

## Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** MongoDB (Mongoose ODM)
- **Cache:** Redis
- **Logging:** Winston
- **Metrics:** Prometheus
- **Validation:** Zod

## API Endpoints

### Health & Metrics
```
GET /health                    # Health check
GET /metrics                   # Prometheus metrics
```

### Retailers
```
POST /api/retailers                    # Register retailer
GET /api/retailers                     # List retailers
GET /api/retailers/:id                 # Get retailer
PUT /api/retailers/:id                 # Update retailer
DELETE /api/retailers/:id              # Delete retailer
```

### Stores
```
POST /api/retailers/:id/stores         # Add store locations
GET /api/retailers/:id/stores          # List stores
```

### Inventory
```
POST /api/retailers/:id/inventory      # Create retail media inventory
GET /api/retailers/:id/inventory       # List inventory
GET /api/retailers/:id/inventory/summary # Inventory summary
```

### Campaigns
```
POST /api/campaigns                    # Create campaign
GET /api/campaigns                     # List campaigns
GET /api/campaigns/:id                 # Get campaign
PUT /api/campaigns/:id                 # Update campaign
POST /api/campaigns/:id/status         # Update status
POST /api/campaigns/:id/ads            # Add ads to campaign
GET /api/campaigns/:id/performance     # Performance analytics
POST /api/campaigns/:id/performance    # Update performance
GET /api/campaigns/:id/attribution     # Sales attribution
POST /api/campaigns/:id/sales-lift     # Create sales lift test
GET /api/campaigns/:id/sales-lift      # Get sales lift results
DELETE /api/campaigns/:id              # Delete campaign
```

### Analytics
```
POST /api/analytics/sales-lift                    # Sales lift measurement
GET /api/analytics/sales-lift/:id                 # Get sales lift
GET /api/analytics/sales-lift/retailer/:id        # List retailer sales lifts
GET /api/analytics/sales-lift/retailer/:id/summary # Sales lift summary
GET /api/analytics/dashboard/:retailerId          # Analytics dashboard
GET /api/analytics/attribution/:retailerId        # Attribution summary
GET /api/analytics/campaigns/:retailerId/performance # Campaign performance
GET /api/analytics/inventory/:retailerId          # Inventory analytics
```

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB
- Redis (optional)

### Installation

```bash
# Navigate to service directory
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/AdBazaar/retail-media-os-service

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
```

### Configuration

Create a `.env` file:

```env
PORT=4990
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/retail_media_os
REDIS_HOST=localhost
REDIS_PORT=6379
INTERNAL_SERVICE_TOKEN=your-secret-token
LOG_LEVEL=info
```

## API Usage Examples

### Register a Retailer

```bash
curl -X POST http://localhost:4990/api/retailers \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: your-secret-token" \
  -d '{
    "name": "BigMart",
    "slug": "bigmart",
    "categories": ["grocery", "household", "personal care"],
    "settings": {
      "defaultMarkup": 15,
      "minBid": 0.5,
      "maxBid": 10
    }
  }'
```

### Add Store Location

```bash
curl -X POST http://localhost:4990/api/retailers/{retailerId}/stores \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: your-secret-token" \
  -d '{
    "storeCode": "BM-MUM-001",
    "name": "BigMart Mumbai Store",
    "storeType": "hypermarket",
    "address": {
      "street": "123 Main Street",
      "city": "Mumbai",
      "state": "Maharashtra",
      "postalCode": "400001"
    },
    "capacity": {
      "shelfUnits": 100,
      "endCaps": 20,
      "checkouts": 15
    },
    "attributes": {
      "hasSelfCheckout": true,
      "trafficScore": 8,
      "avgDailyVisitors": 5000
    }
  }'
```

### Create Retail Media Inventory

```bash
curl -X POST http://localhost:4990/api/retailers/{retailerId}/inventory \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: your-secret-token" \
  -d '{
    "storeId": "{storeId}",
    "inventoryType": "endcap",
    "dimensions": {
      "width": 1.2,
      "height": 2.0,
      "depth": 0.5
    },
    "pricing": {
      "basePrice": 5000,
      "markup": 15
    },
    "category": "beverages",
    "visibility": "high",
    "availability": {
      "startDate": "2024-01-01T00:00:00Z",
      "endDate": "2024-03-31T23:59:59Z"
    }
  }'
```

### Create Campaign

```bash
curl -X POST http://localhost:4990/api/campaigns \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: your-secret-token" \
  -d '{
    "retailerId": "{retailerId}",
    "advertiserId": "adv-123",
    "name": "Summer Beverages Campaign",
    "objective": "conversion",
    "bidStrategy": "cpm",
    "budget": {
      "total": 100000,
      "daily": 5000
    },
    "products": [
      {
        "productId": "prod-456",
        "name": "Fresh Cola 2L",
        "category": "beverages",
        "bidAmount": 2.5,
        "adSchedule": {
          "startDate": "2024-06-01T00:00:00Z",
          "endDate": "2024-08-31T23:59:59Z"
        }
      }
    ],
    "schedule": {
      "startDate": "2024-06-01T00:00:00Z",
      "endDate": "2024-08-31T23:59:59Z"
    }
  }'
```

### Sales Lift Measurement

```bash
curl -X POST http://localhost:4990/api/analytics/sales-lift \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: your-secret-token" \
  -d '{
    "campaignId": "{campaignId}",
    "retailerId": "{retailerId}",
    "storeIds": ["store-1", "store-2", "store-3"],
    "method": "store_test",
    "period": {
      "startDate": "2024-05-01T00:00:00Z",
      "endDate": "2024-05-31T23:59:59Z"
    },
    "baseline": {
      "sales": 500000,
      "transactions": 15000,
      "avgOrderValue": 33.33,
      "units": 45000
    },
    "treatment": {
      "sales": 625000,
      "transactions": 18000,
      "avgOrderValue": 34.72,
      "units": 52000
    }
  }'
```

## Competitor Comparison

| Feature | Amazon Ads | Walmart Connect | Target Roundel | **AdBazaar Retail Media OS** |
|---------|------------|-----------------|----------------|------------------------------|
| In-store placements | Limited | Full | Full | **Full** |
| Sales lift measurement | Basic | Advanced | Advanced | **Advanced + Statistical CI** |
| Attribution models | Last-touch | Multi-touch | Multi-touch | **All models + Data-driven** |
| Inventory types | Shelf, Search | All types | All types | **All types + Digital** |
| Pricing | Variable | Fixed + Variable | Fixed | **Dynamic + Markup** |
| Reporting | Real-time | Real-time | Real-time | **Real-time + Predictive** |
| API access | Full | Limited | Limited | **Full API** |
| Indian market | Limited | None | None | **Native support** |

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Retail Media OS Service                       │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  Retailer   │  │  Campaign   │  │  Analytics  │             │
│  │  Service    │  │  Service    │  │  Service    │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  Inventory  │  │  Sales Lift │  │ Attribution │             │
│  │  Service    │  │  Service    │  │  Service    │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
├─────────────────────────────────────────────────────────────────┤
│                    Data Layer                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  MongoDB    │  │   Redis     │  │ Prometheus  │             │
│  │  (Primary)  │  │   (Cache)   │  │  (Metrics)  │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
```

## Project Structure

```
retail-media-os-service/
├── src/
│   ├── index.ts              # Main entry point
│   ├── models/               # Mongoose schemas
│   │   ├── Retailer.ts
│   │   ├── Store.ts
│   │   ├── RetailInventory.ts
│   │   ├── RetailCampaign.ts
│   │   └── SalesLift.ts
│   ├── services/             # Business logic
│   │   ├── retailerService.ts
│   │   ├── inventoryService.ts
│   │   ├── campaignService.ts
│   │   ├── salesLiftService.ts
│   │   └── attributionService.ts
│   ├── routes/               # API routes
│   │   ├── retailerRoutes.ts
│   │   ├── campaignRoutes.ts
│   │   └── analyticsRoutes.ts
│   ├── middleware/           # Express middleware
│   │   ├── auth.ts
│   │   └── validation.ts
│   └── utils/                # Utilities
│       ├── logger.ts
│       └── metrics.ts
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## Health Check

```bash
curl http://localhost:4990/health
```

Response:
```json
{
  "status": "healthy",
  "service": "retail-media-os-service",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "mongodb": "connected",
  "redis": "connected"
}
```

## Metrics

Prometheus metrics available at `/metrics`:
- HTTP request duration and count
- Retailer and store counts
- Campaign metrics
- Ad impressions and clicks
- Sales lift percentages
- Inventory utilization

## License

Proprietary - AdBazaar