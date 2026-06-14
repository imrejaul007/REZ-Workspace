# Shelf Ads Service

**AdBazaar Shelf Ads Service** - Retail shelf advertising and sales lift analytics platform.

**Port:** 4994  
**Company:** AdBazaar  
**Competitor:** Shelf Advertising, Cooler Screens, Ambient

---

## Overview

The Shelf Ads Service enables brands to advertise on retail shelves, targeting consumers at the point of purchase. It provides:

- **Store Management:** Register and manage retail stores with shelf inventory
- **Shelf Management:** Track shelf positions, visibility, and capacity
- **Ad Placement:** Place targeted ads on specific shelves
- **Campaign Management:** Create and manage shelf advertising campaigns
- **Sales Lift Analytics:** Measure the actual sales impact of shelf advertising

---

## Features

### Store Management
- Register retail stores with location data
- Track store metrics (footfall, impressions, tier)
- Support for multiple zones and tiers (premium, standard, economy)
- Geo-targeting with coordinates

### Shelf Management
- Configure shelf positions (aisle, section, height, side)
- Set visibility levels (high, medium, low)
- Define capacity for ad slots
- Dynamic pricing (daily, weekly, monthly)

### Retail Targeting
- Geographic targeting (city, state, zone, radius)
- Category-based targeting
- Store tier and size filtering
- Minimum footfall requirements

### Ad Management
- Multiple ad types (image, video, digital)
- Bidding strategies (CPM, CPC, fixed)
- Demographic targeting
- Real-time impression and click tracking

### Campaign Management
- Budget allocation and tracking
- Date-based scheduling
- Performance optimization
- Geo-targeting updates

### Sales Lift Analytics
- Baseline vs. campaign sales comparison
- Statistical significance testing
- Confidence scoring
- Multi-store aggregation
- Attribution modeling

---

## API Endpoints

### Health Check
```
GET /health                    - Service health
GET /health/ready              - Readiness check
GET /metrics                   - Prometheus metrics
```

### Store Management
```
POST /api/stores               - Register store
GET  /api/stores - List stores
GET  /api/stores/:id           - Get store
PATCH /api/stores/:id          - Update store
DELETE /api/stores/:id         - Delete store
GET /api/stores/stats/overview - Store statistics
```

### Shelf Management
```
POST /api/stores/:id/shelves    - Add shelf to store
GET  /api/stores/:id/shelves   - List store shelves
GET  /api/shelves - List all shelves
GET  /api/shelves/:id         - Get shelf
GET  /api/shelves/available    - Get available shelves
PATCH /api/shelves/:id        - Update shelf
DELETE /api/shelves/:id       - Delete shelf
```

### Ad Management
```
POST /api/shelves/:id/ads      - Add ad to shelf
GET  /api/shelves/:id/ads      - List shelf ads
GET  /api/ads/:id              - Get ad
PATCH /api/ads/:id             - Update ad
DELETE /api/ads/:id            - Delete ad
POST /api/ads/:id/impressions  - Record impression
POST /api/ads/:id/clicks       - Record click
```

### Campaign Management
```
POST /api/campaigns            - Create campaign
GET  /api/campaigns           - List campaigns
GET  /api/campaigns/:id        - Get campaign
PATCH /api/campaigns/:id      - Update campaign
DELETE /api/campaigns/:id      - Delete campaign
POST /api/campaigns/:id/activate - Activate campaign
POST /api/campaigns/:id/pause - Pause campaign
GET /api/campaigns/:id/performance - Get performance
POST /api/campaigns/:id/geo-target - Update geo targeting
```

### Sales Lift Analytics
```
POST /api/sales-lifts          - Create sales lift study
GET  /api/sales-lifts - List sales lifts
GET  /api/sales-lifts/:id      - Get sales lift
GET  /api/campaigns/:id/analytics - Campaign analytics
```

### Dashboard
```
GET /api/analytics/dashboard   - Analytics dashboard
```

---

## Quick Start

### Prerequisites
- Node.js >= 18.0.0
- MongoDB
- Redis

### Installation

```bash
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/AdBazaar/shelf-ads-service
npm install
```

### Configuration

Create a `.env` file:

```env
PORT=4994
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/shelf_ads
REDIS_URL=redis://localhost:6379
INTERNAL_SERVICE_TOKEN=your-internal-token-here
REZ_AUTH_SERVICE_URL=http://localhost:4002
REZ_WALLET_SERVICE_URL=http://localhost:4004
HOJAI_SERVICE_URL=http://localhost:4800
LOG_LEVEL=info
```

### Start Service

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

### Health Check

```bash
curl http://localhost:4994/health
```

---

## Authentication

All API endpoints require internal service authentication via the `X-Internal-Token` header:

```bash
curl -H "X-Internal-Token: your-internal-token-here" \
     http://localhost:4994/api/stores
```

---

## Example Requests

### Create Store

```bash
curl -X POST http://localhost:4994/api/stores \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: your-internal-token-here" \
  -d '{
    "name": "BigMart Downtown",
    "retailerId": "retailer-001",
    "location": {
      "address": "123 Main Street",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400001"
    },
    "zone": "west",
    "tier": "premium",
    "category": ["groceries", "beverages"]
  }'
```

### Add Shelf

```bash
curl -X POST http://localhost:4994/api/stores/{storeId}/shelves \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: your-internal-token-here" \
  -d '{
    "name": "Beverage Aisle - Eye Level",
    "position": {
      "aisle": "A",
      "section": "3",
      "height": "eye",
      "side": "center"
    },
    "category": "beverages",
    "capacity": 3,
    "visibility": "high",
    "pricing": {
      "daily": 500,
      "weekly": 3000,
      "monthly": 10000
    }
  }'
```

### Create Campaign

```bash
curl -X POST http://localhost:4994/api/campaigns \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: your-internal-token-here" \
  -d '{
    "advertiserId": "brand-001",
    "name": "Summer Beverages Campaign",
    "targeting": {
      "geo": {
        "type": "city",
        "values": ["Mumbai", "Delhi"]
      },
      "categories": ["beverages"],
      "storeTiers": ["premium", "standard"]
    },
    "budget": {
      "total": 500000,
      "daily": 25000
    },
    "dates": {
      "start": "2026-06-01",
      "end": "2026-08-31"
    },
    "creative": {
      "type": "image",
      "url": "https://cdn.example.com/summer-drink.jpg"
    }
  }'
```

### Create Sales Lift Study

```bash
curl -X POST http://localhost:4994/api/sales-lifts \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: your-internal-token-here" \
  -d '{
    "campaignId": "{campaignId}",
    "storeId": "{storeId}",
    "shelfId": "{shelfId}",
    "productSku": "BEV-001",
    "period": {
      "start": "2026-05-01",
      "end": "2026-05-31"
    },
    "baseline": {
      "sales": 50000,
      "units": 500,
      "avgOrderValue": 100,
      "transactions": 500
    },
    "campaign": {
      "sales": 65000,
      "units": 650,
      "avgOrderValue": 100,
      "transactions": 650
    }
  }'
```

---

## Data Models

### Store
- `name`: Store name
- `retailerId`: Retailer identifier
- `location`: Address, city, state, pincode, coordinates
- `status`: active, inactive, pending
- `tier`: premium, standard, economy
- `category`: Store categories
- `impressionsPerDay`: Estimated daily impressions
- `avgFootfall`: Average daily footfall

### Shelf
- `storeId`: Parent store reference
- `name`: Shelf identifier
- `position`: Aisle, section, height, side
- `category`: Product category
- `capacity`: Maximum ads
- `visibility`: high, medium, low
- `pricing`: Daily, weekly, monthly rates
- `impressionsPerHour`: Estimated impressions

### ShelfAd
- `shelfId`: Parent shelf reference
- `advertiserId`: Advertiser identifier
- `campaignId`: Campaign reference
- `product`: Product details
- `creative`: Ad creative
- `bid`: Bid amount and type
- `impressions`: Total and daily counts
- `clicks`: Total and daily counts
- `spend`: Total and daily spend

### ShelfCampaign
- `advertiserId`: Advertiser identifier
- `name`: Campaign name
- `targeting`: Geo, category, tier targeting
- `budget`: Total, daily, spent
- `dates`: Start and end dates
- `performance`: Impressions, clicks, CTR, conversions
- `status`: draft, active, paused, completed, cancelled

### SalesLift
- `campaignId`: Campaign reference
- `storeId`: Store reference
- `shelfId`: Shelf reference
- `baseline`: Pre-campaign metrics
- `campaign`: During-campaign metrics
- `lift`: Calculated lift percentages
- `confidence`: Level, score, margin of error
- `statisticalSignificance`: p-value, t-statistic

---

## Integration

### RABTUL Services
- Auth Service (4002): Token verification
- Wallet Service (4004): Budget management

### HOJAI Services
- HOJAI Core (4800): Entity sync, relationships

### REZ Intelligence
- Intent Graph (4018): Lead scoring, AI insights

---

## Monitoring

### Prometheus Metrics
- `shelf_ads_stores_total`: Total stores
- `shelf_ads_shelves_total`: Total shelves
- `shelf_ads_active_campaigns`: Active campaigns
- `shelf_ads_impressions_total`: Total impressions
- `shelf_ads_clicks_total`: Total clicks
- `shelf_ads_sales_lift_percentage`: Average sales lift
- `shelf_ads_http_request_duration_seconds`: Request latency

### Health Endpoints
- `/health`: Basic health check
- `/health/ready`: Readiness check (MongoDB + Redis)
- `/metrics`: Prometheus metrics

---

## License

Proprietary - AdBazaar

---

## Support

For technical support, contact the AdBazaar Engineering Team.
