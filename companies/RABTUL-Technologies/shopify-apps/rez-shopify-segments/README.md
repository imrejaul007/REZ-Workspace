# ReZ Segments - Customer Segmentation

Dynamic customer segmentation for Shopify.

## Features

- [x] Dynamic segments with rules
- [x] Rule operators (eq, gt, lt, contains, etc.)
- [x] Pre-built templates
- [x] Segment analytics

## API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `POST /segments` | POST | Create segment |
| `GET /segments/:shop` | GET | List segments |
| `POST /segments/:id/calculate` | POST | Calculate membership |
| `GET /segments/:id/customers` | GET | Get segment customers |
| `GET /customer/:shop/:customerId/segments` | GET | Get customer segments |

## Segment Rules

```javascript
{
  field: 'totalSpent',
  operator: 'gte',
  value: 5000,
  conjunction: 'and' // 'and' or 'or'
}
```
