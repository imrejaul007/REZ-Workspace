# Retail OS API Reference

## Overview

Retail OS provides digital twin services for customer management, inventory, and shopping assistance.

## Base URL

```
Staging: http://localhost:3021
Production: https://retail-api.rtmn.io
```

## Customer Twin Service

### Create Customer
```
POST /api/customers
```

**Request Body:**
```json
{
  "name": "John Smith",
  "email": "john@email.com",
  "phone": "+1-555-0123",
  "demographics": {
    "age": 35,
    "gender": "male",
    "location": "San Francisco"
  },
  "preferences": {
    "categories": ["electronics", "clothing"],
    "brands": ["Apple", "Nike"],
    "priceRange": { "min": 50, "max": 500 }
  }
}
```

### Get Customers
```
GET /api/customers?loyaltyTier=gold&limit=50&offset=0
```

### Get Customer by ID
```
GET /api/customers/:id
```

### Update Customer
```
PUT /api/customers/:id
```

## AI Agents

### Shopping Assistant Agent
**Endpoint:** `POST /agents/shopping`

```json
{
  "action": "recommend_products",
  "customerId": "customer_id",
  "context": { "browsing": ["category_electronics"] }
}
```

### Loyalty Agent
**Endpoint:** `POST /agents/loyalty`

```json
{
  "action": "calculate_points",
  "customerId": "customer_id",
  "purchaseAmount": 150
}
```

## REZ CRM Integration

Connect with Shopify/WooCommerce:

```bash
curl -X POST http://localhost:3093/api/crm/sync \
  -d '{"provider": "shopify", "direction": "bidirectional"}'
```
