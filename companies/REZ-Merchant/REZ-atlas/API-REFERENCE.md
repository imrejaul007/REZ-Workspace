# REZ Atlas API Reference
**Version:** 1.0.0 | **Date:** June 6, 2026 | **Base URL:** `http://localhost:5150`

---

## 📋 TABLE OF CONTENTS

1. [Gateway API](#gateway-api)
2. [Discover API](#discover-api)
3. [Maps API](#maps-api)
4. [Twin API](#twin-api)
5. [Score API](#score-api)
6. [Signals API](#signals-api)
7. [Territory API](#territory-api)
8. [Routes API](#routes-api)
9. [Copilot API](#copilot-api)
10. [Graph API](#graph-api)

---

## Gateway API

**Base URL:** `http://localhost:5150`

The Gateway provides a unified entry point to all Atlas services.

### Health Endpoints

#### GET /health
```json
{
  "status": "healthy",
  "service": "REZ-atlas-gateway",
  "version": "1.0.0",
  "timestamp": "2026-06-06T12:00:00.000Z",
  "tagline": "The Merchant Intelligence Network for the Physical World"
}
```

#### GET /ready
```json
{
  "status": "ready",
  "services": {
    "discover": "up",
    "maps": "up",
    "twin": "up",
    "score": "up",
    "signals": "up",
    "territory": "up",
    "routes": "up",
    "copilot": "up",
    "graph": "up"
  },
  "timestamp": "2026-06-06T12:00:00.000Z"
}
```

---

### Search

#### GET /api/search
Search merchants across all services.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| q | string | Yes | Search query |
| lat | number | No | Latitude for geo search |
| lng | number | No | Longitude for geo search |
| radius | number | No | Search radius in meters (default: 5000) |
| category | string | No | Filter by category |
| limit | number | No | Max results (default: 10) |

**Response:**
```json
{
  "query": "restaurant",
  "location": { "lat": 19.0, "lng": 72.8, "radius": 5000 },
  "count": 15,
  "merchants": [
    {
      "businessId": "ATLAS-12345678",
      "name": "Restaurant ABC",
      "category": "restaurant",
      "location": {
        "address": "Colaba, Mumbai",
        "lat": 19.02,
        "lng": 72.83
      },
      "contact": {
        "phone": "+91-9876543210"
      },
      "rating": { "overall": 4.2, "count": 120 },
      "source": "database"
    }
  ]
}
```

---

### Merchants

#### GET /api/merchants
List all merchants with optional filters.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| lat | number | Latitude |
| lng | number | Longitude |
| radius | number | Radius in meters |
| category | string | Category filter |
| minScore | number | Minimum score |
| status | string | Status filter |

#### GET /api/merchants/:id
Get merchant by ID.

#### GET /api/merchants/:merchantId/dashboard
Get merchant dashboard data.

#### GET /api/merchants/:merchantId/performance
Get merchant performance score.

---

### Discovery

#### GET /api/discover/search
Search merchants (delegates to Discover service).

#### GET /api/discover/nearby
Find merchants near a location.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| lat | number | Yes | Latitude |
| lng | number | Yes | Longitude |
| radius | number | No | Radius in meters (default: 5000) |
| category | string | No | Category filter |
| limit | number | No | Max results (default: 50) |

**Response:**
```json
{
  "center": { "lat": 19.0, "lng": 72.8 },
  "radius": 5000,
  "total": 45,
  "merchants": [...],
  "byCategory": {
    "restaurant": 15,
    "retail": 12,
    "salon": 8
  },
  "summary": {
    "byCategory": [
      { "category": "restaurant", "count": 15 },
      { "category": "retail", "count": 12 }
    ]
  }
}
```

---

### Maps

#### GET /api/maps/heat
Get heat map data for a region.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| bounds | string | Bounding box |
| category | string | Category filter |
| metric | string | Metric type (default: density) |

#### GET /api/maps/clusters
Get merchant clusters for a region.

#### GET /api/maps/territory/:territoryId
Get territory map data.

---

### Score (Leads)

#### GET /api/score/leads
List all leads with optional filters.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | Lead status |
| grade | string | Lead grade (A/B/C/D) |
| ownerId | string | Owner ID |
| source | string | Lead source |
| limit | number | Max results (default: 100) |

**Response:**
```json
{
  "leads": [
    {
      "id": "uuid",
      "merchantId": "m123",
      "name": "Restaurant ABC",
      "email": "contact@restaurant.com",
      "phone": "+91-9876543210",
      "company": "Restaurant ABC Pvt Ltd",
      "category": "restaurant",
      "source": "discovery",
      "status": "qualified",
      "score": 85,
      "grade": "A",
      "ownerId": "user-1",
      "tags": ["hot", "restaurant"],
      "createdAt": "2026-06-06T10:00:00.000Z",
      "updatedAt": "2026-06-06T12:00:00.000Z"
    }
  ],
  "count": 1,
  "total": 150
}
```

#### POST /api/score/leads
Create a new lead.

**Request Body:**
```json
{
  "name": "Restaurant ABC",
  "email": "contact@restaurant.com",
  "phone": "+91-9876543210",
  "company": "Restaurant ABC Pvt Ltd",
  "category": "restaurant",
  "source": "discovery",
  "merchantId": "m123",
  "ownerId": "user-1",
  "tags": ["hot"],
  "metadata": {
    "hasWebsite": true,
    "hasPOS": false,
    "twinScore": 75
  }
}
```

**Response:**
```json
{
  "lead": {
    "id": "uuid",
    "score": 85,
    "grade": "A"
  },
  "recommendation": {
    "label": "hot",
    "score": 85,
    "grade": "A"
  }
}
```

#### POST /api/score/leads/:id/score
Recalculate lead score.

---

### Signals (Opportunities)

#### GET /api/signals/opportunities
Get all opportunities.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| merchantId | string | Filter by merchant |
| type | string | Opportunity type |
| severity | string | Severity level (high/medium/low) |
| limit | number | Max results (default: 50) |

**Response:**
```json
{
  "opportunities": [
    {
      "id": "uuid",
      "merchantId": "m123",
      "type": "no_qr",
      "title": "No QR Ordering",
      "description": "Restaurant has no digital menu",
      "severity": "high",
      "suggestedProduct": "REZ Menu QR",
      "potentialRevenue": 12000,
      "status": "open",
      "createdAt": "2026-06-06T10:00:00.000Z"
    }
  ],
  "count": 1
}
```

#### GET /api/signals/competitors
Get competitor data for a merchant.

---

### Territory

#### GET /api/territories
List all territories.

#### POST /api/territories
Create a new territory.

**Request Body:**
```json
{
  "name": "Mumbai South",
  "description": "South Mumbai area",
  "ownerId": "user-1",
  "bounds": {
    "north": 19.1,
    "south": 18.9,
    "east": 72.9,
    "west": 72.8
  },
  "regions": [
    { "name": "South Mumbai", "cities": ["Mumbai"] }
  ]
}
```

#### GET /api/territories/:id/performance
Get territory performance metrics.

**Response:**
```json
{
  "performance": {
    "territoryId": "uuid",
    "territoryName": "Mumbai South",
    "ownerId": "user-1",
    "stats": {
      "merchants": 150,
      "leads": 45,
      "revenue": 2500000,
      "conversion": 15
    },
    "metrics": {
      "revenuePerMerchant": 16667,
      "leadConversionRate": "33.3",
      "avgRevenuePerLead": 55556
    }
  }
}
```

#### GET /api/territories/balance
Get territory balance report.

---

### Routes

#### GET /api/routes
List routes with optional filters.

#### POST /api/routes/optimize
Optimize route for given stops.

**Request Body:**
```json
{
  "stops": [
    { "id": "1", "lat": 19.0, "lng": 72.8, "priority": 1 },
    { "id": "2", "lat": 19.1, "lng": 72.9, "priority": 2 }
  ],
  "mode": "driving"
}
```

#### PUT /api/routes/:id/stops/:stopId
Update stop status.

**Request Body:**
```json
{
  "status": "visited"
}
```

---

### Copilot

#### POST /api/copilot/summarize
Generate merchant summary.

**Request Body:**
```json
{
  "merchantId": "m123"
}
```

**Response:**
```json
{
  "merchantId": "m123",
  "summary": {
    "name": "Restaurant ABC",
    "category": "Restaurant",
    "health": "Good",
    "score": 78,
    "keyInsights": [
      "Has website but no online ordering",
      "Rating 4.2 with 120 reviews",
      "Competitor uses REZ Pay"
    ],
    "recommendations": [
      "Suggest REZ Menu QR",
      "Offer REZ Loyalty"
    ]
  }
}
```

#### POST /api/copilot/pitch
Generate personalized pitch.

**Request Body:**
```json
{
  "merchantId": "m123",
  "product": "REZ Menu QR",
  "channel": "email"
}
```

**Response:**
```json
{
  "merchantId": "m123",
  "product": "REZ Menu QR",
  "channel": "email",
  "pitch": {
    "subject": "Boost your Restaurant with REZ Menu QR",
    "body": "Dear [Owner],\n\nI noticed your restaurant..."
  }
}
```

#### POST /api/copilot/compare
Compare merchant with competitors.

---

### Graph

#### GET /api/graph/merchant/:merchantId
Get merchant network graph.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| depth | number | Graph depth (default: 1) |

#### GET /api/graph/relationships
Get relationships with optional filters.

#### POST /api/graph/connect
Create a new relationship.

**Request Body:**
```json
{
  "source": "m123",
  "target": "m456",
  "type": "competitor",
  "weight": 0.8,
  "properties": {
    "distance": "500m"
  }
}
```

---

### Dashboard

#### GET /api/dashboard/summary
Get overall dashboard summary.

#### GET /api/dashboard/acquisition
Get acquisition metrics.

#### GET /api/dashboard/territory
Get territory dashboard.

#### GET /api/dashboard/opportunities
Get opportunity dashboard.

---

## ERROR CODES

| Code | Description |
|------|-------------|
| NOT_FOUND | Resource not found |
| SERVICE_UNAVAILABLE | Backend service unavailable |
| VALIDATION_ERROR | Invalid request data |
| INTERNAL_ERROR | Server error |

---

**Last Updated:** June 6, 2026