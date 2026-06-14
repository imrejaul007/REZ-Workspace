# Merchant Intelligence OS

**Port: 4870**

Merchant Intelligence OS tells merchants what to do, not just run ads. It provides comprehensive business intelligence including revenue trends, margin analysis, product performance, customer cohorts, competitor positioning, demand forecasting, and actionable recommendations.

## Features

### 1. Revenue Analysis
- Track revenue trends over time
- Compare vs industry benchmark
- Calculate growth rates
- Daily, weekly, and monthly aggregations

### 2. Margin Analysis
- Calculate gross and net margins
- Cost breakdown (COGS, marketing, operations)
- Identify margin optimization opportunities

### 3. Product Performance
- Track which products sell
- Identify top performers and underperformers
- Category-wise revenue breakdown
- Return rate analysis

### 4. Customer Cohort Analysis
- RFM (Recency, Frequency, Monetary) analysis
- Customer segmentation (VIP, Loyal, At-Risk, Churned)
- Cohort retention tracking
- Lifetime value calculation

### 5. Competitor Intelligence
- Monitor competitor positioning
- Market share analysis
- Identify market gaps and opportunities
- Price position benchmarking

### 6. Demand Forecasting
- Predict demand based on trends
- Seasonality analysis
- Factor identification
- Inventory recommendations

### 7. Recommendations Engine
- Generate actionable recommendations
- Priority-based sorting (critical, high, medium, low)
- Timeframe categorization (immediate, this week, this month)
- Expected impact metrics

## Quick Start

### Prerequisites
- Node.js >= 18.0.0
- MongoDB (local or Atlas)
- npm or yarn

### Installation

```bash
# Navigate to service directory
cd AdBazaar/merchant-insights-os

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start the service
npm run dev
```

### Health Check

```bash
curl http://localhost:4870/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "merchant-insights-os",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.0.0",
  "uptime": 1234
}
```

## API Endpoints

### Merchant Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/merchants` | Create a new merchant |
| GET | `/api/merchants/:merchantId` | Get merchant details |
| PUT | `/api/merchants/:merchantId` | Update merchant |
| DELETE | `/api/merchants/:merchantId` | Delete merchant |
| GET | `/api/merchants` | List all merchants |

### Insights

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/merchant/:merchantId/insights` | Get full merchant insights |
| GET | `/api/merchant/:merchantId/revenue` | Revenue trends |
| GET | `/api/merchant/:merchantId/margin` | Margin analysis |
| GET | `/api/merchant/:merchantId/products` | Product performance |
| GET | `/api/merchant/:merchantId/customers` | Customer cohort analysis |
| GET | `/api/merchant/:merchantId/competitors` | Competitor positioning |
| GET | `/api/merchant/:merchantId/demand` | Demand forecasting |
| GET | `/api/merchant/:merchantId/recommendations` | Actionable recommendations |

### Data Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/data/revenue` | Create revenue record |
| POST | `/api/data/revenue/bulk` | Bulk create revenue records |
| GET | `/api/data/revenue/:merchantId` | Get revenue records |
| POST | `/api/data/products` | Create product performance |
| POST | `/api/data/products/bulk` | Bulk create products |
| PUT | `/api/data/products/:merchantId/:productId` | Update product |
| POST | `/api/data/customers` | Create customer |
| POST | `/api/data/customers/bulk` | Bulk create customers |
| GET | `/api/data/customers/:merchantId` | Get customers |
| POST | `/api/data/competitors` | Create competitor |
| PUT | `/api/data/competitors/:merchantId/:competitorId` | Update competitor |
| GET | `/api/data/competitors/:merchantId` | Get competitors |

### System

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/metrics` | Prometheus metrics |

## API Examples

### Create a Merchant

```bash
curl -X POST http://localhost:4870/api/merchants \
  -H "Content-Type: application/json" \
  -d '{
    "merchantId": "rest-001",
    "name": "Mumbai Spice Kitchen",
    "category": "restaurant",
    "subcategory": "fine-dining",
    "location": {
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400001"
    }
  }'
```

### Add Revenue Data

```bash
curl -X POST http://localhost:4870/api/data/revenue \
  -H "Content-Type: application/json" \
  -d '{
    "merchantId": "rest-001",
    "date": "2024-01-15",
    "revenue": 25000,
    "orders": 125,
    "averageOrderValue": 200,
    "costs": {
      "cogs": 7500,
      "marketing": 2000,
      "operations": 1500,
      "other": 500
    }
  }'
```

### Get Full Insights

```bash
curl http://localhost:4870/api/merchant/rest-001/insights?period=month
```

### Get Recommendations

```bash
curl http://localhost:4870/api/merchant/rest-001/recommendations?category=all&priority=all
```

## Query Parameters

### Insights Query
- `period`: `week` | `month` | `quarter` | `year` (default: `month`)

### Products Query
- `period`: Time period
- `sortBy`: `revenue` | `units` | `margin` | `growth` (default: `revenue`)
- `limit`: 1-100 (default: 20)

### Recommendations Query
- `category`: `all` | `revenue` | `marketing` | `inventory` | `pricing` | `customer`
- `priority`: `all` | `critical` | `high` | `medium` | `low`

### Competitors Query
- `radius`: 1-50 km (default: 5)
- `limit`: 1-50 (default: 10)

## Example Recommendation

```json
{
  "merchantId": "rest-001",
  "generatedAt": "2024-01-15T10:30:00.000Z",
  "priorityScore": 85,
  "recommendations": [
    {
      "id": "rec-001",
      "category": "marketing",
      "priority": "critical",
      "title": "Pause Ad Spend",
      "description": "Revenue is declining. Additional ad spend may not be effective.",
      "action": "Don't spend on ads this week. Focus on product quality instead.",
      "expectedImpact": {
        "metric": "waste",
        "value": 30,
        "unit": "%"
      },
      "effort": "low",
      "timeframe": "immediate",
      "enabled": true
    },
    {
      "id": "rec-002",
      "category": "inventory",
      "priority": "high",
      "title": "Increase Inventory for Butter Chicken",
      "description": "Butter Chicken is your top performer with 150 units sold.",
      "action": "Increase inventory for Product A. Run a targeted campaign.",
      "expectedImpact": {
        "metric": "revenue",
        "value": 12,
        "unit": "%"
      },
      "effort": "low",
      "timeframe": "this week",
      "enabled": true
    }
  ],
  "summary": {
    "immediate": ["Pause Ad Spend"],
    "thisWeek": ["Increase Inventory for Butter Chicken"],
    "thisMonth": ["Improve Net Margin"]
  }
}
```

## Ecosystem Connections

### HOJAI AI
Used for advanced analysis and insights generation.

### RABTUL Wallet
Used for revenue data aggregation and financial metrics.

### REZ-Merchant
Used for merchant data synchronization and business context.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Service port | `4870` |
| `NODE_ENV` | Environment | `development` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/merchant_insights` |
| `HOJAI_API_URL` | HOJAI API URL | `http://localhost:4800` |
| `RABTUL_WALLET_URL` | RABTUL Wallet URL | `http://localhost:4004` |
| `REZ_MERCHANT_URL` | REZ Merchant URL | `http://localhost:4000` |
| `LOG_LEVEL` | Logging level | `info` |
| `METRICS_ENABLED` | Enable metrics | `true` |

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Project Structure

```
merchant-insights-os/
├── src/
│   ├── config/           # Configuration and logging
│   ├── models/           # MongoDB models
│   ├── services/         # Business logic
│   ├── routes/          # API routes
│   ├── middleware/       # Auth, validation, metrics
│   ├── types/           # TypeScript types
│   └── index.ts         # Main entry point
├── tests/               # Unit tests
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── .env.example
└── README.md
```

## Health Score Calculation

The health score (0-100) is calculated based on:
- Revenue growth (0-20 points)
- Net margin (0-20 points)
- Customer retention (0-10 points)

| Score Range | Status |
|-------------|--------|
| 80-100 | Excellent |
| 60-79 | Good |
| 40-59 | Needs Attention |
| 0-39 | Critical |

## License

Proprietary - REZ Ecosystem
