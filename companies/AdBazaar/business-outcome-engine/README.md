# Business Outcome Engine

**Port:** 4931 | **Company:** AdBazaar | **Competitors:** Google Business Profile, HubSpot

AI-powered Business Outcome Engine that tracks, attributes, and optimizes business outcomes across advertising campaigns.

## Overview

The Business Outcome Engine is a comprehensive AI service that:
- Predicts business outcomes using ML-based forecasting
- Manages outcome-based advertising campaigns
- Tracks conversions with multi-touch attribution
- Recommends interventions to achieve goals
- Calculates ROAS and revenue forecasting
- Learns from outcomes to improve predictions

## Features

### 1. Campaign Management
- Create outcome-based campaigns with KPIs
- Budget tracking and utilization
- Status management (draft, active, paused, completed)
- Multi-objective support (revenue, conversions, leads, engagement)

### 2. Outcome Tracking
- Track conversions, purchases, signups, leads, engagement
- Real-time event tracking
- Progress monitoring
- Touchpoint tracking for customer journey analysis

### 3. Multi-Touch Attribution
Six attribution models supported:
- **First Touch**: 100% credit to first touchpoint
- **Last Touch**: 100% credit to last touchpoint
- **Linear**: Equal credit to all touchpoints
- **Time Decay**: More credit to recent touchpoints
- **Position Based**: 40% first, 40% last, 20% distributed
- **Data Driven**: AI-weighted attribution based on interaction type

### 4. AI Optimization
- Automated performance analysis
- Budget reallocation recommendations
- Audience refinement suggestions
- Bid adjustment recommendations
- Channel performance optimization
- Creative performance insights

### 5. ROAS Calculation
- Real-time ROAS tracking
- Cost per acquisition (CPA) calculation
- Cost per mille (CPM) calculation
- Channel-level ROAS analysis
- ROAS trend analysis

### 6. Revenue Forecasting
- 30/60/90 day revenue forecasts
- Multiple scenario predictions (optimistic/base/pessimistic)
- Forecast accuracy tracking
- Factor identification for predictions

### 7. Intervention Recommendations
- Prioritized action recommendations
- Expected impact estimation
- Cost and ROI analysis
- Risk assessment for each intervention

### 8. Learning Loop
- Outcome recording and analysis
- Model accuracy tracking
- Intervention effectiveness evaluation
- Continuous improvement

## Outcome Types

| Type | Description |
|------|-------------|
| `revenue` | Revenue targets |
| `ltv` | Customer lifetime value |
| `churn` | Customer churn rate |
| `conversion` | Conversion rate |
| `retention` | Customer retention |
| `engagement` | User engagement |

## Intervention Types

| Type | Description |
|------|-------------|
| `discount` | Discount campaigns |
| `loyalty_offer` | Loyalty program offers |
| `personalized_content` | Personalized content delivery |
| `re_engagement` | Dormant customer re-engagement |
| `upsell` | Upselling opportunities |
| `cross_sell` | Cross-selling opportunities |
| `win_back` | Win-back campaigns |
| `premium_upgrade` | Premium tier upgrades |
| `loyalty_tier` | Loyalty tier upgrades |
| `referral_incentive` | Referral program incentives |

## API Endpoints

### Health & Metrics
```
GET  /health              - Health check
GET  /metrics            - Prometheus metrics
```

### Business Outcome Engine (Port 4931)

#### Campaign Management
```
POST /api/outcomes/campaign           - Create outcome campaign
GET  /api/outcomes/campaign/:id       - Get campaign by ID
GET  /api/outcomes/campaigns/:advertiserId - Get advertiser campaigns
PUT  /api/outcomes/campaign/:id/status - Update campaign status
```

#### Outcome Tracking
```
POST /api/outcomes/track              - Track business outcome
GET  /api/outcomes/campaign/:id/outcomes - Get campaign outcomes
```

#### Attribution
```
GET  /api/outcomes/attribution/:campaignId - Get attribution report
POST /api/outcomes/attribution/calculate   - Calculate attribution
GET  /api/outcomes/attribution/:campaignId/compare - Compare models
```

#### AI Optimization
```
POST /api/outcomes/optimize           - Get optimization recommendations
POST /api/outcomes/optimize/apply     - Apply automated optimizations
```

#### ROAS
```
POST /api/outcomes/roas               - Calculate ROAS
GET  /api/outcomes/roas/:campaignId/trend - Get ROAS trend
GET  /api/outcomes/roas/:campaignId/suggestions - Get optimization suggestions
```

#### Forecasting
```
GET  /api/outcomes/forecasting/:campaignId - Generate revenue forecast
GET  /api/outcomes/forecasting/:campaignId/accuracy - Get forecast accuracy
```

#### Performance & Dashboard
```
GET  /api/outcomes/performance/:campaignId - Get performance analytics
GET  /api/outcomes/dashboard/:advertiserId - Get advertiser dashboard
GET  /api/outcomes/summary/:advertiserId - Get campaign summary
```

### Prediction
```
POST /api/predict                    - Generate outcome prediction
GET  /api/predictions/:businessId    - Get recent predictions
GET  /api/accuracy/:outcomeType?     - Get prediction accuracy
```

### Interventions
```
POST /api/interventions/recommend    - Get recommendations
POST /api/interventions/apply       - Apply intervention
PUT  /api/interventions/:id/result   - Update result
GET  /api/interventions/best        - Best performing interventions
```

### Tracking
```
POST /api/track                      - Track outcome event
GET  /api/events/:businessId        - Get events
GET  /api/status/:businessId/:type   - Get current status
GET  /api/metrics/:businessId/:type  - Get aggregated metrics
```

### Goals
```
POST /api/goals                      - Create/update goal
GET  /api/goals/:businessId          - Get active goals
PUT  /api/goals/:goalId/pause        - Pause goal
PUT  /api/goals/:goalId/resume       - Resume goal
```

### Learning
```
POST /api/learning/record            - Record outcome
GET  /api/learning/stats             - Learning statistics
GET  /api/learning/recommendations   - Model improvement recommendations
GET  /api/learning/curve/:type      - Learning curve data
POST /api/learning/backfill         - Backfill historical outcomes
```

### Ecosystem
```
GET  /api/ecosystem/insights/:id    - Get merchant insights
POST /api/ecosystem/analyze         - Analyze with HOJAI AI
GET  /api/ecosystem/status          - Connection status
```

## Quick Start

```bash
# Install dependencies
cd business-outcome-engine
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev

# Health check
curl http://localhost:4931/health
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 4931 | Server port |
| `MONGODB_URI` | mongodb://localhost:27017/business_outcome_engine | MongoDB connection |
| `AUTONOMOUS_GROWTH_ORCHESTRATOR_URL` | http://localhost:4930 | Orchestrator service |
| `MERCHANT_INSIGHTS_OS_URL` | http://localhost:4870 | Merchant insights service |
| `HOJAI_API_URL` | http://localhost:4800 | HOJAI AI service |
| `INTERNAL_SERVICE_TOKEN` | - | Service authentication token |

## Ecosystem Connections

### Connected Services
- **autonomous-growth-orchestrator (4930)** - Growth campaign management
- **merchant-insights-os (4870)** - Merchant analytics and insights
- **HOJAI AI (4800)** - AI reasoning and analysis

### Data Flow
```
Merchant Insights → Business Outcome Engine → Autonomous Growth Orchestrator
        ↓                    ↓
    HOJAI AI ←────────── Intervention Recommendations
```

## Example Usage

### Create an Outcome Campaign
```bash
curl -X POST http://localhost:4931/api/outcomes/campaign \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: your-secret-token" \
  -d '{
    "advertiserId": "adv_123",
    "name": "Summer Sale Campaign",
    "objective": "revenue",
    "startDate": "2026-06-01",
    "budget": { "total": 50000, "currency": "INR" },
    "kpis": { "target": 200000, "metric": "revenue", "unit": "currency" }
  }'
```

### Track a Business Outcome
```bash
curl -X POST http://localhost:4931/api/outcomes/track \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: your-secret-token" \
  -d '{
    "campaignId": "camp_xxx",
    "advertiserId": "adv_123",
    "type": "purchase",
    "value": 2999,
    "customerId": "cust_456",
    "sessionId": "sess_789",
    "conversionData": {
      "channel": "google_ads",
      "source": "google",
      "medium": "cpc",
      "campaign": "summer_sale"
    }
  }'
```

### Get Attribution Report
```bash
curl -X GET "http://localhost:4931/api/outcomes/attribution/camp_xxx?model=linear" \
  -H "X-Internal-Token: your-secret-token"
```

### Calculate ROAS
```bash
curl -X POST http://localhost:4931/api/outcomes/roas \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: your-secret-token" \
  -d '{
    "campaignId": "camp_xxx",
    "advertiserId": "adv_123",
    "revenue": 150000,
    "costs": { "media": 30000, "creative": 5000 },
    "conversions": 150,
    "metrics": { "impressions": 500000, "clicks": 10000 }
  }'
```

### Get AI Optimization Recommendations
```bash
curl -X POST http://localhost:4931/api/outcomes/optimize \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: your-secret-token" \
  -d '{"campaignId": "camp_xxx"}'
```

### Generate Revenue Forecast
```bash
curl -X GET "http://localhost:4931/api/outcomes/forecasting/camp_xxx?advertiserId=adv_123&horizonDays=30" \
  -H "X-Internal-Token: your-secret-token"
```

### Get Advertiser Dashboard
```bash
curl -X GET "http://localhost:4931/api/outcomes/dashboard/adv_123" \
  -H "X-Internal-Token: your-secret-token"
```

### Create a Revenue Goal (Legacy API)
```bash
curl -X POST http://localhost:4931/api/goals \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "biz_123",
    "type": "revenue",
    "targetValue": 100000,
    "targetDate": "2026-07-07"
  }'
```

### Track Revenue Event (Legacy API)
```bash
curl -X POST http://localhost:4931/api/track \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "biz_123",
    "outcomeType": "revenue",
    "value": 25000,
    "source": "payment_gateway"
  }'
```

### Get Prediction
```bash
curl -X POST http://localhost:4931/api/predict \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "biz_123",
    "outcomeType": "revenue",
    "horizonDays": 30
  }'
```

### Get Recommendations
```bash
curl -X POST http://localhost:4931/api/interventions/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "goalId": "goal_abc123",
    "maxRecommendations": 5
  }'
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Business Outcome Engine                   │
├─────────────────────────────────────────────────────────────┤
│  Routes Layer                                              │
│  ├── /health, /metrics                                    │
│  ├── /api/predict, /api/track, /api/goals                 │
│  ├── /api/learning, /api/ecosystem                         │
│  └── /api/outcomes/* - Campaign & Outcome Management      │
├─────────────────────────────────────────────────────────────┤
│  Service Layer                                             │
│  ├── CampaignService - Campaign management                │
│  ├── OutcomeService - Outcome tracking                    │
│  ├── AttributionService - Multi-touch attribution          │
│  ├── OptimizationService - AI-driven optimization          │
│  ├── ROASService - Return on ad spend calculation           │
│  ├── ForecastingService - Revenue forecasting              │
│  ├── PredictionEngine - ML-based forecasting              │
│  ├── InterventionRecommendation - Action recommendations   │
│  └── LearningLoop - Continuous improvement                │
├─────────────────────────────────────────────────────────────┤
│  Data Layer                                                │
│  ├── MongoDB Models (Mongoose)                            │
│  ├── Redis Cache                                          │
│  └── Prometheus Metrics                                   │
└─────────────────────────────────────────────────────────────┘
```

## Competitor Comparison

| Feature | Google Business Profile | HubSpot | **Business Outcome Engine** |
|---------|------------------------|---------|---------------------------|
| Multi-touch Attribution | Basic | Basic | Advanced (6 models) |
| AI Optimization | Limited | Basic | AI-driven recommendations |
| ROAS Tracking | None | Basic | Real-time + trends |
| Revenue Forecasting | None | None | **AI-powered forecasting** |
| Touchpoint Tracking | None | Limited | Complete journey tracking |
| Channel Attribution | Basic | Basic | Deep channel analysis |
| Budget Optimization | None | Manual | Automated recommendations |
| Cross-channel Analytics | Limited | Basic | Complete attribution |

## Monitoring

### Prometheus Metrics
- `business_outcome_engine_predictions_total` - Total predictions
- `business_outcome_engine_interventions_total` - Total interventions
- `business_outcome_engine_outcome_events_total` - Tracked events
- `business_outcome_engine_learning_outcomes_total` - Learning outcomes
- `business_outcome_engine_model_accuracy` - Model accuracy
- `business_outcome_engine_roas_calculations_total` - ROAS calculations
- `business_outcome_engine_forecast_generated_total` - Forecasts generated
- `business_outcome_engine_optimization_recommendations_total` - Optimization recs
- `business_outcome_engine_campaigns_total` - Total campaigns
- `business_outcome_engine_attribution_calculations_total` - Attribution calcs

### Health Check Response
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime": 3600,
  "dependencies": {
    "mongodb": "connected",
    "redis": "connected",
    "autonomousGrowthOrchestrator": "reachable",
    "merchantInsightsOs": "reachable"
  }
}
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 4931 | Server port |
| `MONGODB_URI` | mongodb://localhost:27017/business_outcome_engine | MongoDB connection |
| `REDIS_HOST` | localhost | Redis host |
| `REDIS_PORT` | 6379 | Redis port |
| `AUTONOMOUS_GROWTH_ORCHESTRATOR_URL` | http://localhost:4930 | Orchestrator service |
| `MERCHANT_INSIGHTS_OS_URL` | http://localhost:4870 | Merchant insights service |
| `HOJAI_API_URL` | http://localhost:4800 | HOJAI AI service |
| `INTERNAL_SERVICE_TOKEN` | - | Service authentication token |

## License

Proprietary - REZ Ecosystem