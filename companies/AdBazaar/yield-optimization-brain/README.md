# Yield Optimization Brain

**Port:** 4890

The central yield brain for AdBazaar that automatically decides which ad, advertiser, audience, placement, and bid to maximize revenue. This service is inspired by Magnite's SSP yield optimization technology.

## Purpose

**Inventory Yield AI** that automatically decides:
- **Which ad** - Select optimal creative
- **Which advertiser** - Match highest bidder
- **Which audience** - Match intent signals
- **Which placement** - Match context
- **Which bid** - Maximize revenue

**Optimization Goals:** Revenue, Conversions, LTV (Lifetime Value)

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    YIELD OPTIMIZATION BRAIN                         │
│                         (Port 4890)                                  │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │   Yield    │  │   Floor    │  │    Bid     │  │  Revenue   │ │
│  │  Decision  │  │   Price    │  │ Landscape  │  │ Attribution│ │
│  │   Engine   │  │  Calculator│  │  Analyzer  │  │   Service  │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │  Predictive │  │   A/B      │  │  Strategy   │                 │
│  │    Yield    │  │  Testing   │  │  Manager    │                 │
│  └─────────────┘  └─────────────┘  └─────────────┘                 │
├─────────────────────────────────────────────────────────────────────┤
│                    METRICS & MONITORING                             │
│              (Prometheus + Winston Logging)                         │
└─────────────────────────────────────────────────────────────────────┘
```

## Key Features

### 1. Yield Decision Engine
Real-time yield optimization decisions for every impression opportunity.

**Endpoint:** `POST /api/yield/decide`

```json
// Request
{
  "inventorySlot": {
    "id": "slot_123",
    "type": "banner",
    "format": "display",
    "size": { "width": 300, "height": 250 },
    "context": "premium"
  },
  "userContext": {
    "segments": ["tech", "business"],
    "intentScore": 0.85,
    "deviceType": "mobile"
  },
  "eligibleAds": [
    {
      "ad": {
        "id": "ad_456",
        "advertiserId": "adv_1",
        "advertiserName": "Brand X",
        "bid": 2.50,
        "ctr": 0.04,
        "conversionRate": 0.02
      },
      "eligibility": { "matched": true }
    }
  ],
  "optimizationGoal": "revenue"
}

// Response
{
  "success": true,
  "data": {
    "selectedAd": { "id": "ad_456", "advertiser": "Brand X" },
    "bid": 2.75,
    "floorPrice": 0.50,
    "expectedRevenue": 0.12,
    "expectedCTR": 0.045,
    "confidence": 0.89,
    "decisionReason": "Highest weighted score with intent match"
  }
}
```

### 2. Floor Price Calculator
Calculate optimal floor prices based on competition, intent, and historical performance.

**Endpoint:** `GET /api/yield/floor/:inventoryId`

```json
// Response
{
  "inventoryId": "slot_123",
  "floorPrice": 0.65,
  "dynamicFloor": true,
  "factors": [
    { "name": "Competition", "impact": 0.15, "weight": 0.3 },
    { "name": "Intent Score", "impact": 0.10, "weight": 0.25 }
  ],
  "recommendations": [
    { "action": "Enable dynamic floor pricing", "expectedLift": 0.15 }
  ]
}
```

### 3. Bid Landscape Analyzer
Analyze market bid patterns and trends across inventory types.

**Endpoint:** `GET /api/yield/landscape?inventoryType=banner&timeRange=24h`

```json
// Response
{
  "timeRange": "24h",
  "inventoryType": "banner",
  "distribution": [
    { "bid": 1.0, "count": 150, "percentage": 30, "cumulativePercentage": 30 },
    { "bid": 2.0, "count": 200, "percentage": 40, "cumulativePercentage": 70 }
  ],
  "statistics": {
    "min": 0.25,
    "max": 10.0,
    "median": 1.50,
    "mean": 1.75,
    "p25": 0.75,
    "p75": 2.50
  },
  "trends": {
    "direction": "up",
    "changePercent": 8.5,
    "velocity": 0.35
  },
  "insights": ["Bid prices trending up", "High variance indicates premium opportunities"]
}
```

### 4. Revenue Attribution
Attribute revenue across dimensions (ad, advertiser, placement, format, segment).

**Endpoint:** `GET /api/yield/attribution?startDate=2024-01-01&endDate=2024-01-31&groupBy=advertiser`

```json
// Response
{
  "summary": {
    "totalImpressions": 1000000,
    "totalRevenue": 25000.00,
    "averageRPM": 25.00,
    "totalConversions": 5000,
    "averageCVR": 0.005
  },
  "attribution": [
    {
      "dimension": "advertiser",
      "dimensionValue": "Brand X",
      "impressions": 300000,
      "revenue": 9000.00,
      "rpm": 30.00,
      "ctr": 0.04,
      "conversions": 1500
    }
  ],
  "topPerformers": [
    { "dimension": "advertiser", "value": 9000, "metric": "revenue" }
  ]
}
```

### 5. Predictive Yield
Predict future yield based on trends and patterns.

**Endpoint:** `GET /api/yield/predict?horizon=24h&inventoryType=banner`

```json
// Response
{
  "horizon": "24h",
  "predictedYield": 28.50,
  "confidence": 0.85,
  "factors": [
    { "name": "Revenue Trend", "contribution": 0.05, "trend": "increasing" },
    { "name": "Market Volatility", "contribution": 0.15, "trend": "stable" }
  ],
  "recommendations": [
    { "action": "Consider raising floor prices", "expectedImpact": 0.10, "priority": "high" }
  ],
  "riskFactors": [
    { "factor": "High Market Volatility", "probability": 0.6, "impact": "medium" }
  ]
}
```

### 6. A/B Testing
Test different yield strategies to optimize performance.

**Endpoints:**
- `POST /api/tests` - Create A/B test
- `GET /api/tests` - List tests
- `PUT /api/tests/:id/results` - Update results

```json
// Create Test
{
  "name": "Floor Price Strategy Test",
  "description": "Compare dynamic vs static floor pricing",
  "strategies": ["strategy_dynamic", "strategy_static"],
  "trafficAllocation": [50, 50],
  "duration": 7,
  "successMetrics": ["rpm", "ctr", "conversions"]
}
```

### 7. Strategy Management
Create and manage yield optimization strategies.

**Endpoints:**
- `POST /api/strategies` - Create strategy
- `GET /api/strategies` - List strategies
- `PUT /api/strategies/:id` - Update strategy
- `DELETE /api/strategies/:id` - Archive strategy

```json
// Strategy
{
  "name": "Revenue Maximizer",
  "type": "floor_price",
  "weights": {
    "revenue": 0.5,
    "conversions": 0.3,
    "ltv": 0.1,
    "ctr": 0.05,
    "brandSafety": 0.05
  },
  "status": "active"
}
```

## Ecosystem Connections

| Service | Connection | Purpose |
|---------|-----------|---------|
| REZ-ads-service | HTTP | Ad inventory data |
| intent-signal-aggregator | HTTP | Audience intent signals |
| intent-prediction-engine | HTTP | Prediction data |
| REZ-programmatic-bidding | HTTP | Bid management |
| RABTUL Auth | Internal Token | Service authentication |
| RABTUL Wallet | Internal Token | Revenue tracking |

## Quick Start

```bash
# Install dependencies
cd yield-optimization-brain
npm install

# Start in development mode
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## Health Check

```bash
curl http://localhost:4890/health
```

Response:
```json
{
  "status": "ok",
  "service": "yield-optimization-brain",
  "version": "1.0.0",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600
}
```

## Metrics

Prometheus metrics available at `GET /metrics`:
- `yield_brain_http_requests_total` - Total HTTP requests
- `yield_brain_http_request_duration_seconds` - Request latency
- `yield_brain_decisions_total` - Yield decisions by goal and result
- `yield_brain_decision_revenue` - Revenue distribution
- `yield_brain_decision_confidence` - Confidence scores
- `yield_brain_floor_price` - Floor price by inventory type
- `yield_brain_ab_tests_running` - Active A/B tests
- `yield_brain_strategies_active` - Active strategies

## Configuration

Environment variables:
- `PORT` - Service port (default: 4890)
- `MONGODB_URI` - MongoDB connection string
- `INTERNAL_SERVICE_TOKEN` - Internal service authentication
- `LOG_LEVEL` - Logging level (info, debug, warn)
- `NODE_ENV` - Environment (development, production)

## API Reference

### Yield Decision
`POST /api/yield/decide` - Make yield decision for impression

### Floor Price
`GET /api/yield/floor/:inventoryId` - Get floor price
`GET /api/yield/floor/:inventoryId/history` - Get floor history

### Bid Landscape
`GET /api/yield/landscape` - Analyze bid landscape

### Revenue Attribution
`GET /api/yield/attribution` - Get revenue attribution

### Prediction
`GET /api/yield/predict` - Predict future yield

### History
`GET /api/yield/history` - Get decision history

### Strategies
`GET /api/strategies` - List strategies
`POST /api/strategies` - Create strategy
`PUT /api/strategies/:id` - Update strategy
`DELETE /api/strategies/:id` - Archive strategy

### A/B Tests
`GET /api/tests` - List A/B tests
`POST /api/tests` - Create A/B test
`GET /api/tests/:id` - Get test details
`PUT /api/tests/:id/results` - Update results
`POST /api/tests/:id/pause` - Pause test

## Competitive Advantage

| Feature | Magnite | Yield Optimization Brain |
|---------|---------|-------------------------|
| Real-time Decision | Yes | Yes |
| Multi-objective | Limited | Yes (Revenue/Conversions/LTV) |
| Floor Price Optimization | Yes | Yes + AI-driven |
| Bid Landscape | Yes | Yes + Trend Analysis |
| Predictive Yield | Basic | ML-based |
| A/B Testing | Yes | Yes + Auto-optimization |
| **Cross-Format** | Limited | **15+ Formats** |
| **Ecosystem Integration** | No | **Full REZ Stack** |

## Version

1.0.0 - Initial release