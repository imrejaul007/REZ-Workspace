# HOJAI Revenue Intelligence - Developer Guide

## Service Purpose

HOJAI Revenue Intelligence is a microservice for HOJAI AI's CoPilot product that provides:

- Revenue tracking (ARR, MRR, pipeline, CAC, LTV)
- AI-powered revenue forecasting
- Churn prediction and analysis
- Revenue alerts and notifications
- Analytics and cohort analysis

## Port

**4757** - All API endpoints are available at `http://localhost:4757`

## MongoDB Collections

| Collection | Purpose |
|------------|---------|
| `RevenueMetric` | ARR, MRR, and other revenue metrics over time |
| `RevenuePipeline` | Sales deals and pipeline management |
| `RevenueForecast` | AI-generated revenue predictions |
| `RevenueAlert` | Revenue alerts (churn, drop, pipeline risk) |
| `Subscription` | Customer subscriptions with MRR/ARR |
| `RevenueBreakdown` | Revenue segmented by product/segment/region |
| `ConversionMetric` | Funnel conversion rates by stage |
| `CACMetric` | Customer acquisition cost by channel |
| `LTVMetric` | Lifetime value by segment/plan |

## API Routes Summary

### Health (No Auth)
- `GET /health` - Service health
- `GET /health/live` - Liveness probe
- `GET /health/ready` - Readiness probe

### Dashboard (Tenant Required)
- `GET /api/dashboard` - Revenue overview

### Metrics (Tenant Required)
- `GET /api/arr` - ARR metrics
- `GET /api/mrr` - MRR metrics
- `GET /api/metrics` - List metrics
- `POST /api/metrics` - Record metric
- `GET /api/breakdown` - Revenue breakdown
- `POST /api/breakdown` - Record breakdown
- `GET /api/cac` - CAC metrics
- `POST /api/cac` - Record CAC
- `GET /api/ltv` - LTV metrics
- `POST /api/ltv` - Record LTV

### Pipeline (Tenant Required)
- `GET /api/pipeline` - List deals
- `POST /api/pipeline` - Create deal
- `GET /api/pipeline/:id` - Get deal
- `PATCH /api/pipeline/:id` - Update deal

### Subscriptions (Tenant Required)
- `GET /api/subscriptions` - List subscriptions
- `POST /api/subscriptions` - Create subscription
- `GET /api/subscriptions/:id` - Get subscription
- `PATCH /api/subscriptions/:id` - Update subscription

### Conversion (Tenant Required)
- `GET /api/conversion` - Conversion metrics
- `POST /api/conversion` - Record conversion

### Forecast (Tenant Required)
- `GET /api/forecast` - List forecasts
- `POST /api/forecast` - Generate forecast
- `GET /api/forecast/pipeline-risk` - Pipeline risk
- `GET /api/forecast/sales` - Sales forecast
- `GET /api/forecast/churn` - Churn analysis

### Alerts (Tenant Required)
- `GET /api/alerts` - List alerts
- `POST /api/alerts` - Create alert
- `POST /api/alerts/check` - Auto-check alerts
- `PATCH /api/alerts/:id/read` - Mark read
- `POST /api/alerts/mark-all-read` - Mark all read
- `DELETE /api/alerts/:id` - Delete alert

### Analytics (Tenant Required)
- `GET /api/analytics` - Analytics overview
- `GET /api/analytics/growth` - Growth trends
- `GET /api/analytics/cohort` - Cohort analysis
- `GET /api/analytics/unit-economics` - Unit economics

## AI Features

### Revenue Forecasting
- Time series forecasting (linear, exponential, moving average)
- Confidence intervals based on historical fit
- Factor analysis showing what drives revenue

### Pipeline Risk Scoring
- Identifies stale deals (>14 days without update)
- Flags large deals in early stages
- Detects past-due expected close dates
- Scores deals by multiple risk factors

### Churn Prediction
- Identifies at-risk subscriptions
- Checks trial expiration timing
- Analyzes MRR and tenure patterns
- Monitors renewal engagement

### Sales Forecasting
- Quarterly weighted pipeline forecasting
- Annual projection based on growth trends
- Confidence-adjusted predictions
- Deal-stage weighted calculations

### Revenue Alerts
- Revenue drop alerts (>10% MoM decline)
- Churn spike alerts (>5% churn rate)
- Pipeline risk alerts (3+ stale deals)
- Growth stall warnings (<2% growth)

## Integration Points

### hojai-board (AI CFO)
- Exposes revenue forecasts for AI CFO dashboard
- Provides pipeline risk analysis
- Delivers revenue alerts for CFO review

### hojai-customer-intelligence
- Reads customer data for churn analysis
- Correlates revenue with customer engagement
- Enriches subscription data with customer profile

## Development

```bash
# Install dependencies
npm install

# Start development with hot reload
npm run dev

# Build for production
npm run build

# Run production
npm start
```

## Pattern Compliance

This service follows patterns from `hojai-customer-intelligence`:
- Same middleware stack (helmet, cors, express.json)
- Same health endpoint pattern
- Same tenant middleware
- Same response format (createResponse/createErrorResponse)
- Same logging pattern (createLogger)
- Same MongoDB connection pattern
- Same graceful shutdown pattern
- Same tenant isolation on all schemas

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 4757 | Service port |
| `MONGODB_URI` | mongodb://localhost:27017/hojai-revenue-intelligence | MongoDB connection |
| `JWT_SECRET` | CHANGE_ME | JWT signing secret |
| `CORS_ORIGIN` | * | CORS allowed origin |
| `NODE_ENV` | production | Environment mode |
