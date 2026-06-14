# REZ Retail Analytics Service

Analytics service for REZ Retail providing sales, customer, and product insights.

## Features

- Sales analytics (summary, trends, by category, by payment method)
- Customer analytics (segments, LTV, acquisition)
- Product analytics (performance, inventory health)
- Period comparisons
- Real-time dashboards

## API Endpoints

### Sales
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sales/summary` | Sales summary |
| GET | `/api/sales/by-period` | Sales by period |
| GET | `/api/sales/by-category` | Sales by category |
| GET | `/api/sales/by-payment` | Sales by payment |
| GET | `/api/sales/hourly` | Hourly distribution |
| GET | `/api/sales/top-products` | Top products |
| GET | `/api/sales/comparison` | Period comparison |

### Customers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/customers/summary` | Customer summary |
| GET | `/api/customers/by-tier` | Distribution by tier |
| GET | `/api/customers/top-ltv` | Top by LTV |
| GET | `/api/customers/acquisition` | Acquisition trends |
| GET | `/api/customers/segments` | Customer segments |
| GET | `/api/customers/engagement` | Engagement metrics |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products/performance` | Product performance |
| GET | `/api/products/categories` | Category performance |
| GET | `/api/products/inventory-health` | Inventory health |

## Configuration

```env
PORT=4105
MONGODB_URI=mongodb://localhost:27017/rez-retail-analytics
REDIS_URL=redis://localhost:6379
```
