# REZ-Mart Analytics Service

**Port:** 4112 | **Company:** REZ-Consumer | **Category:** Quick Commerce Intelligence

## Purpose

Provides analytics and insights for REZ-Mart including sales metrics, customer behavior, delivery performance, and business intelligence.

## Key API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/sales` | Sales metrics |
| GET | `/api/analytics/orders` | Order analytics |
| GET | `/api/analytics/customers` | Customer insights |
| GET | `/api/analytics/delivery` | Delivery performance |
| GET | `/api/analytics/inventory` | Inventory turnover |
| GET | `/api/analytics/revenue` | Revenue reports |
| POST | `/api/analytics/export` | Export data |

## Environment Variables

```env
PORT=4112
MONGODB_URI=mongodb://localhost:27017/rezmart_analytics
NODE_ENV=development
LOG_LEVEL=info
```

## Start the Service

```bash
cd REZ-Consumer/REZ-Mart/rez-mart-analytics-service
npm run dev
```

## Health Checks

```bash
curl http://localhost:4112/health     # Service health
curl http://localhost:4112/ready      # Readiness check
```

## Ecosystem Connections

| Service | Connection | Purpose |
|---------|------------|---------|
| **rez-mart-gateway** | Port 4100 | API gateway routing |
| **All REZ-Mart Services** | Ports 4101-4111 | Data aggregation |
| **REZ-Intelligence** | REZ-Intelligence | AI-powered insights |
| **HOJAI Analytics** | HOJAI | Advanced analytics |

## Metrics Tracked

| Category | Metrics |
|----------|---------|
| **Sales** | GMV, AOV, conversion rate |
| **Orders** | Volume, fulfillment time, cancellation |
| **Customers** | LTV, retention, acquisition cost |
| **Delivery** | On-time rate, avg delivery time |
| **Inventory** | Turnover, stockout rate |

## Database

- MongoDB collections: `analytics_events`, `daily_metrics`, `reports`
- Indexes on: `date`, `storeId`, `productId`, `metricType`