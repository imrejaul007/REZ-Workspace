# Commerce OS - RTMN Unified Commerce

Unified commerce across all industries with transactions, orders, payments, and fulfillment.

## Quick Start

```bash
cd core/commerce-os
npm install
npm start
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/transactions` | List transactions |
| POST | `/api/transactions` | Create transaction |
| GET | `/api/orders` | List orders |
| POST | `/api/orders` | Create order |
| POST | `/api/payments` | Process payment |
| GET | `/api/fulfillment` | Fulfillment status |

## Example

```bash
# Create order
curl -X POST http://localhost:3022/api/orders \
  -H "Content-Type: application/json" \
  -d '{"items": [{"name": "Widget", "price": 99.99, "quantity": 2}], "industry": "retail"}'
```

## Docker

```bash
docker build -t rtmn-commerce-os core/commerce-os
docker run -p 3022:3022 rtmn-commerce-os
```
