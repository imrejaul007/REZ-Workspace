# ReZ Merchant Service API

Merchant management, store operations, and product catalog for the ReZ platform.

## Overview

The Merchant Service handles:
- Merchant profile and authentication
- Store management (CRUD, activation, deactivation)
- Product catalog management
- Order processing and management
- Loyalty and rewards programs
- Analytics and reporting
- Third-party integrations

## Base URL

```
Production: https://api.rez.money/merchant
Staging: https://staging-api.rez.money/merchant
```

## Authentication

All endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <merchant_token>
```

## Merchant Profile

### Get Profile

```http
GET /profile
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "merchant_xxx",
    "businessName": "Restaurant ABC",
    "ownerName": "John Doe",
    "email": "john@restaurant.com",
    "phone": "9876543210",
    "verificationStatus": "verified",
    "kycStatus": "completed",
    "rating": 4.5,
    "isActive": true
  }
}
```

### Update Profile

```http
PUT /profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "businessName": "Restaurant ABC",
  "description": "Best food in town",
  "website": "https://restaurant.com"
}
```

## Store Management

### List Stores

```http
GET /stores
Authorization: Bearer <token>
```

### Create Store

```http
POST /stores
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Main Outlet",
  "slug": "main-outlet",
  "description": "Our flagship restaurant",
  "category": "restaurant",
  "location": {
    "address": "123 Main St",
    "city": "Mumbai",
    "pincode": "400001",
    "coordinates": {
      "lat": 19.076,
      "lng": 72.8777
    }
  },
  "contact": {
    "phone": "9876543210",
    "email": "outlet@restaurant.com"
  }
}
```

### Activate/Deactivate Store

```http
POST /stores/{id}/activate
POST /stores/{id}/deactivate
Authorization: Bearer <token>
```

## Product Catalog

### List Products

```http
GET /products?storeId={storeId}&page=1&limit=20
Authorization: Bearer <token>
```

### Create Product

```http
POST /products
Authorization: Bearer <token>
Content-Type: application/json

{
  "storeId": "store_xxx",
  "name": "Margherita Pizza",
  "description": "Classic Italian pizza with tomato and mozzarella",
  "price": 299,
  "category": "pizza",
  "images": ["https://..."],
  "variants": [
    {
      "name": "Small",
      "price": 199
    },
    {
      "name": "Large",
      "price": 399
    }
  ]
}
```

### Update Product

```http
PUT /products/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Margherita Pizza - Updated",
  "price": 349
}
```

## Order Management

### List Orders

```http
GET /orders?storeId={storeId}&status=pending&page=1&limit=20
Authorization: Bearer <token>
```

**Filters:**
- `storeId` - Filter by store
- `status` - Filter by status (pending, confirmed, preparing, ready, completed, cancelled)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

### Create Order

```http
POST /orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "storeId": "store_xxx",
  "customerId": "customer_xxx",
  "items": [
    {
      "productId": "prod_xxx",
      "quantity": 2,
      "price": 299
    }
  ],
  "paymentMethod": "upi",
  "deliveryAddress": {
    "address": "123 Customer St",
    "city": "Mumbai"
  }
}
```

### Update Order Status

```http
PATCH /orders/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "confirmed"
}
```

## Loyalty Programs

### Get Loyalty Program

```http
GET /loyalty
Authorization: Bearer <token>
```

### Update Loyalty Program

```http
PUT /loyalty
Authorization: Bearer <token>
Content-Type: application/json

{
  "enabled": true,
  "pointsPerRupee": 1,
  "pointsToRupeeRatio": 100,
  "minimumRedemptionPoints": 100
}
```

### Manage Rewards

```http
GET /loyalty/rewards
POST /loyalty/rewards
Authorization: Bearer <token>
```

## Analytics

### Get Dashboard Analytics

```http
GET /analytics?storeId={storeId}&period=week
Authorization: Bearer <token>
```

**Period Options:** `today`, `week`, `month`, `year`

**Response:**
```json
{
  "success": true,
  "data": {
    "totalOrders": 150,
    "totalRevenue": 45000,
    "averageOrderValue": 300,
    "topProducts": [...],
    "ordersByStatus": {...}
  }
}
```

### Get Sales Analytics

```http
GET /analytics/sales?startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer <token>
```

### Get Customer Insights

```http
GET /analytics/customers
Authorization: Bearer <token>
```

## Integrations

### List Integrations

```http
GET /integrations
Authorization: Bearer <token>
```

### Connect Integration

```http
POST /integrations
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "pos",
  "credentials": {
    "apiKey": "xxx",
    "storeId": "xxx"
  }
}
```

**Integration Types:**
- POS (Point of Sale)
- Accounting
- Delivery
- Social Media

## Internal Endpoints

Internal endpoints require `x-internal-token` header:

### Validate Store

```http
GET /internal/stores/{storeId}/validate
X-Internal-Token: <token>
```

### Get Order Stats

```http
GET /internal/merchants/{merchantId}/order-stats
X-Internal-Token: <token>
```

Used for credit scoring. Returns:
- Orders per month
- Dispute rate
- Account age in months

## Store Status

| Status | Description |
|--------|-------------|
| `pending` | Store pending approval |
| `active` | Store is live |
| `inactive` | Store temporarily closed |
| `suspended` | Store suspended |

## Order Status

| Status | Description |
|--------|-------------|
| `pending` | Order received |
| `confirmed` | Order confirmed |
| `preparing` | Being prepared |
| `ready` | Ready for pickup/delivery |
| `completed` | Order completed |
| `cancelled` | Order cancelled |

## Error Handling

**Validation Errors (400):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "businessName must be a string between 3 and 200 characters",
    "gstNumber must be a valid 15-character GST number"
  ]
}
```

**Not Found (404):**
```json
{
  "success": false,
  "message": "Store not found"
}
```

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| Profile Updates | 10/min |
| Product Operations | 100/min |
| Order Operations | 200/min |

## Related Services

- **rez-auth-service**: Merchant authentication
- **rez-wallet-service**: Merchant wallet and payouts
- **rez-payment-service**: Payment processing
- **rez-wallet-service**: Loyalty points management
