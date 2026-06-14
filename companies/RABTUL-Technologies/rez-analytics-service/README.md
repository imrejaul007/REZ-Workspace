# ReZ Analytics Service

A comprehensive real-time analytics and business intelligence service providing dashboards, data aggregation, chart generation, and reporting capabilities for the ReZ ecosystem.

## Features

- **Real-time Dashboards**: Pre-configured dashboard layouts with live data
- **Data Aggregation**: Flexible aggregation by hour, day, week, month
- **Chart Generation**: Multiple chart types (bar, line, pie, funnel, gauge)
- **Revenue Analytics**: Track revenue, refunds, and trends
- **Order Metrics**: Order counts, status distribution, fulfillment rates
- **Customer Analytics**: Cohort analysis, growth tracking, lifetime value
- **Merchant Performance**: Top merchants, ratings, fulfillment metrics
- **Product Analytics**: Top products, category performance
- **Conversion Funnels**: Visitor to purchase conversion tracking
- **Scheduled Reports**: Automated report generation and export

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    ReZ Analytics Service                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Express API │  │   Chart      │  │    Scheduled Jobs     │  │
│  │   (REST)     │  │   Service    │  │    (node-cron)        │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
│         │                 │                     │               │
│  ┌──────▼─────────────────▼─────────────────────▼───────────┐  │
│  │                    Analytics Engine                        │  │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐  │  │
│  │  │  Aggregation │ │   Chart      │ │   Report          │  │  │
│  │  │   Service    │ │   Service    │ │   Generator       │  │  │
│  │  └──────────────┘ └──────────────┘ └──────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                             │                                    │
│  ┌──────────────────────────▼────────────────────────────────┐ │
│  │                    Data Layer                               │ │
│  │  ┌──────────────────┐  ┌────────────────────────────────┐  │ │
│  │  │  In-Memory Store  │  │  External Services              │  │ │
│  │  │  (Dashboard Model)│  │  - Order Service               │  │ │
│  │  │  - Cache         │  │  - Customer Service             │  │ │
│  │  └──────────────────┘  │  - Merchant Service             │  │ │
│  │                        └────────────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file:

```env
PORT=3007
NODE_ENV=development

# Analytics Settings
CACHE_TTL_HOURS=24
AGGREGATION_INTERVAL_MINUTES=15
MAX_DATE_RANGE_DAYS=365

# Report Settings
REPORT_STORAGE_PATH=./reports
PDF_ENABLED=true
CSV_ENABLED=true

# External Service URLs
ORDER_SERVICE_URL=http://localhost:3003
CUSTOMER_SERVICE_URL=http://localhost:3010
MERCHANT_SERVICE_URL=http://localhost:3004
```

## Running the Service

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm run build
npm start
```

### Background Worker

```bash
npm run worker
```

## API Endpoints

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Service health check |

### Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Get main dashboard data |
| GET | `/api/dashboard/revenue` | Revenue dashboard |
| GET | `/api/dashboard/orders` | Orders dashboard |
| GET | `/api/dashboard/customers` | Customers dashboard |
| GET | `/api/dashboard/merchants` | Merchants dashboard |

### Aggregation

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/aggregation/revenue` | Get revenue aggregation |
| GET | `/api/aggregation/orders` | Get order aggregation |
| GET | `/api/aggregation/customers` | Get customer cohort data |
| GET | `/api/aggregation/merchants` | Get merchant performance |
| POST | `/api/aggregation/refresh` | Force refresh aggregation |
| GET | `/api/aggregation/status` | Get last aggregation time |

### Charts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/charts/revenue-bar` | Revenue bar chart |
| GET | `/api/charts/order-line` | Order trend line chart |
| GET | `/api/charts/order-status-pie` | Order status pie chart |
| GET | `/api/charts/revenue-category` | Revenue by category |
| GET | `/api/charts/merchant-performance` | Merchant comparison |
| GET | `/api/charts/customer-growth` | Customer growth chart |
| GET | `/api/charts/top-products` | Top products bar chart |
| GET | `/api/charts/comparison` | Period comparison |
| GET | `/api/charts/conversion-funnel` | Conversion funnel |
| GET | `/api/charts/all` | Get all charts |

### KPIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/kpis` | Get all KPIs |
| GET | `/api/kpis/summary` | Get KPI summary |
| GET | `/api/kpis/trends` | Get KPI trends |

### Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports/executive-summary` | Executive summary report |
| GET | `/api/reports/revenue` | Revenue report |
| GET | `/api/reports/customers` | Customer report |
| GET | `/api/reports/merchants` | Merchant report |
| GET | `/api/reports/export/:format` | Export report (pdf/csv) |

### Filters

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/filters/date-range` | Get date range options |
| GET | `/api/filters/merchants` | Get merchant filter options |
| GET | `/api/filters/categories` | Get category filter options |

## Query Parameters

All aggregation and chart endpoints support the following query parameters:

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `startDate` | ISO 8601 | Start of date range | 30 days ago |
| `endDate` | ISO 8601 | End of date range | Today |
| `period` | string | Aggregation period (hourly/daily/weekly/monthly) | daily |
| `merchantId` | string | Filter by merchant | All |
| `category` | string | Filter by category | All |

## Response Formats

### Chart Response

```json
{
  "success": true,
  "data": {
    "labels": ["Jan", "Feb", "Mar"],
    "datasets": [
      {
        "label": "Revenue",
        "data": [1000, 1500, 2000],
        "backgroundColor": "#4F46E5",
        "borderColor": "#4F46E5"
      }
    ]
  },
  "meta": {
    "generatedAt": "2024-01-15T10:30:00Z",
    "period": "monthly",
    "dateRange": {
      "start": "2024-01-01",
      "end": "2024-01-31"
    }
  }
}
```

### Aggregation Response

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "type": "daily",
    "data": {
      "revenue": [
        { "date": "2024-01-01", "revenue": 1000, "orders": 50 }
      ],
      "total": 30000
    },
    "computedAt": "2024-01-15T10:30:00Z"
  }
}
```

### KPI Response

```json
{
  "success": true,
  "data": {
    "totalRevenue": 50000,
    "totalOrders": 250,
    "averageOrderValue": 200,
    "totalCustomers": 150,
    "newCustomersThisMonth": 25,
    "returningCustomerRate": 0.65,
    "fulfillmentRate": 0.95,
    "refundRate": 0.02,
    "trends": {
      "revenue": [/* historical data */],
      "orders": [/* historical data */]
    }
  }
}
```

## Chart Types

### Bar Chart
- Revenue over time
- Merchant comparison
- Top products

### Line Chart
- Order trends
- Customer growth
- Revenue trends

### Pie Chart
- Order status distribution
- Revenue by category

### Funnel Chart
- Conversion funnel (Visitors -> Cart -> Checkout -> Complete)

### Gauge Chart
- KPI metrics with thresholds

## Caching Strategy

- In-memory cache for aggregation results
- Configurable TTL (default: 24 hours)
- Manual cache invalidation via refresh endpoint
- Cache warming on service startup

## Scheduled Jobs

| Job | Schedule | Description |
|-----|----------|-------------|
| aggregation-refresh | Every 15 minutes | Refresh aggregation cache |
| daily-report | Daily at midnight | Generate daily reports |
| weekly-report | Monday at 6 AM | Generate weekly reports |
| monthly-report | 1st of month, 6 AM | Generate monthly reports |

## Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage
```

## Deployment

### Docker

```bash
docker build -t rez-analytics-service .
docker run -p 3007:3007 rez-analytics-service
```

## License

MIT
