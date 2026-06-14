# RABTUL-Technologies API Reference

**Last Updated:** 2026-05-12  
**Version:** 1.0.0

---

## Table of Contents

1. [Authentication](#authentication)
2. [Auth Service](#auth-service)
3. [Wallet Service](#wallet-service)
4. [Payment Service](#payment-service)
5. [Order Service](#order-service)
6. [Catalog Service](#catalog-service)
7. [Search Service](#search-service)
8. [Articles Service](#articles-service)
9. [Bill Payments Service](#bill-payments-service)
10. [Cashback Service](#cashback-service)
11. [Gamification Service](#gamification-service)
12. [Creator Earnings Service](#creator-earnings-service)
13. [Booking Service](#booking-service)
14. [Schedule Service](#schedule-service)
15. [Notifications Service](#notifications-service)
16. [Analytics Service](#analytics-service)

---

## Authentication

### Bearer Token

All authenticated endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

### Token Payload

```json
{
  "sub": "user_id",
  "role": "user",
  "iat": 1234567890,
  "exp": 1234567890
}
```

---

## Auth Service

**Base URL:** `https://rez-auth-service.onrender.com`  
**Gateway Route:** `/user/auth/*`

### Send OTP

```
POST /user/auth/send-otp
```

**Request:**
```json
{
  "phoneNumber": "+919876543210",
  "countryCode": "+91"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "expiresIn": 300
}
```

### Verify OTP

```
POST /user/auth/verify-otp
```

**Request:**
```json
{
  "phoneNumber": "+919876543210",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "tokens": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "expiresIn": 604800
  },
  "user": {
    "id": "user_id",
    "phoneNumber": "+919876543210",
    "role": "user"
  }
}
```

### Get Profile

```
GET /user/auth/me
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "phoneNumber": "+919876543210",
    "email": "user@example.com",
    "profile": {
      "firstName": "John",
      "lastName": "Doe"
    },
    "isVerified": true,
    "isOnboarded": true
  }
}
```

---

## Wallet Service

**Base URL:** `https://rez-wallet-service-36vo.onrender.com`  
**Gateway Route:** `/wallet/*`

### Get Balance

```
GET /wallet/balance
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "balance": {
    "rezCoins": 1000,
    "cashback": 500,
    "totalValue": 1500
  }
}
```

### Get Transactions

```
GET /wallet/transactions
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 20)
- `type` (credit/debit/all)
- `startDate` (ISO date)
- `endDate` (ISO date)

**Response:**
```json
{
  "success": true,
  "transactions": [
    {
      "id": "txn_id",
      "type": "credit",
      "amount": 100,
      "coinType": "REZ",
      "description": "Earned from purchase",
      "createdAt": "2026-05-12T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

### Withdraw

```
POST /wallet/withdraw
Authorization: Bearer <token>
```

**Request:**
```json
{
  "amount": 500,
  "method": "bank_transfer",
  "accountNumber": "1234567890",
  "ifsc": "SBIN0001234"
}
```

**Response:**
```json
{
  "success": true,
  "withdrawal": {
    "id": "wd_id",
    "amount": 500,
    "status": "processing"
  }
}
```

---

## Payment Service

**Base URL:** `https://rez-payment-service.onrender.com`  
**Gateway Route:** `/payment/*`

### Create Order

```
POST /payment/initiate
Authorization: Bearer <token>
```

**Request:**
```json
{
  "amount": 1000,
  "currency": "INR",
  "receipt": "order_receipt_123"
}
```

**Response:**
```json
{
  "success": true,
  "order": {
    "id": "order_id",
    "razorpayOrderId": "rzp_xxx",
    "amount": 1000,
    "currency": "INR"
  }
}
```

### Verify Payment

```
POST /payment/verify
Authorization: Bearer <token>
```

**Request:**
```json
{
  "razorpayOrderId": "rzp_xxx",
  "razorpayPaymentId": "pay_xxx",
  "razorpaySignature": "signature"
}
```

**Response:**
```json
{
  "success": true,
  "payment": {
    "id": "payment_id",
    "status": "captured",
    "amount": 1000
  }
}
```

---

## Order Service

**Base URL:** `https://rez-order-service.onrender.com`  
**Gateway Route:** `/orders/*`

### Get Orders

```
GET /orders
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 20)
- `status` (pending/confirmed/delivered/cancelled)

**Response:**
```json
{
  "success": true,
  "orders": [
    {
      "id": "order_id",
      "status": "delivered",
      "total": 1000,
      "itemCount": 3,
      "createdAt": "2026-05-12T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "pages": 3
  }
}
```

### Get Order Details

```
GET /orders/:id
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "order": {
    "id": "order_id",
    "status": "delivered",
    "items": [
      {
        "productId": "prod_id",
        "name": "Product Name",
        "quantity": 2,
        "price": 500
      }
    ],
    "subtotal": 1000,
    "deliveryFee": 50,
    "total": 1050,
    "deliveryAddress": {
      "address": "123 Main St",
      "city": "Mumbai",
      "pincode": "400001"
    }
  }
}
```

---

## Catalog Service

**Base URL:** `https://rez-catalog-service-1.onrender.com`  
**Gateway Route:** `/products/*`, `/categories/*`

### Get Products

```
GET /products
```

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 20)
- `category` (category slug)
- `minPrice` (number)
- `maxPrice` (number)
- `sort` (price_asc/price_desc/newest)

**Response:**
```json
{
  "success": true,
  "products": [
    {
      "id": "prod_id",
      "name": "Product Name",
      "price": 999,
      "originalPrice": 1999,
      "images": ["url1", "url2"],
      "rating": 4.5,
      "store": {
        "id": "store_id",
        "name": "Store Name"
      }
    }
  ],
  "pagination": {...}
}
```

### Get Categories

```
GET /categories
```

**Response:**
```json
{
  "success": true,
  "categories": [
    {
      "id": "cat_id",
      "name": "Electronics",
      "slug": "electronics",
      "image": "url",
      "productCount": 150
    }
  ]
}
```

---

## Search Service

**Base URL:** `https://rez-search-service.onrender.com`  
**Gateway Route:** `/search/*`

### Search

```
GET /search?q=query
```

**Query Parameters:**
- `q` (required) - Search query
- `page` (default: 1)
- `limit` (default: 20)
- `filters` (JSON encoded filters)

**Response:**
```json
{
  "success": true,
  "results": [...],
  "total": 100,
  "facets": {
    "categories": [...],
    "priceRange": {...}
  }
}
```

---

## Articles Service

**Base URL:** `https://rez-articles-service.onrender.com`  
**Gateway Route:** `/articles/*`

### Get Articles

```
GET /articles
```

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 20)
- `category` (category slug)
- `featured` (true/false)

**Response:**
```json
{
  "success": true,
  "articles": [
    {
      "id": "art_id",
      "title": "Article Title",
      "slug": "article-title",
      "excerpt": "Short description...",
      "coverImage": "url",
      "category": "shopping",
      "readTime": 5,
      "publishedAt": "2026-05-12T00:00:00.000Z"
    }
  ],
  "pagination": {...}
}
```

### Get Article

```
GET /articles/:slug
```

**Response:**
```json
{
  "success": true,
  "article": {
    "id": "art_id",
    "title": "Article Title",
    "content": "Full HTML content...",
    "author": {
      "id": "author_id",
      "name": "Author Name"
    },
    "views": 1500
  }
}
```

---

## Bill Payments Service

**Base URL:** `https://rez-bill-payments-service.onrender.com`  
**Gateway Route:** `/bills/*`, `/bill-payments/*`

### Get Providers

```
GET /bills/providers
```

**Response:**
```json
{
  "success": true,
  "providers": [
    {
      "id": "electricity",
      "name": "Electricity",
      "icon": "flash"
    }
  ]
}
```

### Fetch Bill

```
POST /bills/fetch
Authorization: Bearer <token>
```

**Request:**
```json
{
  "provider": "electricity",
  "customerId": "123456789"
}
```

**Response:**
```json
{
  "success": true,
  "bill": {
    "provider": "electricity",
    "customerId": "123456789",
    "amount": 2500,
    "dueDate": "2026-06-15T00:00:00.000Z",
    "status": "pending"
  }
}
```

### Pay Bill

```
POST /bill-payments/pay
Authorization: Bearer <token>
```

**Request:**
```json
{
  "billId": "bill_id",
  "amount": 2500,
  "paymentMethod": "wallet"
}
```

**Response:**
```json
{
  "success": true,
  "transaction": {
    "id": "txn_id",
    "status": "completed",
    "timestamp": "2026-05-12T00:00:00.000Z"
  }
}
```

---

## Cashback Service

**Base URL:** `https://rez-cashback-service.onrender.com`  
**Gateway Route:** `/cashback/*`

### Get Summary

```
GET /cashback/summary
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "summary": {
    "totalEarned": 5000,
    "totalRedeemed": 2000,
    "currentBalance": 3000,
    "pending": 500
  }
}
```

### Get History

```
GET /cashback/history
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "transactions": [
    {
      "id": "txn_id",
      "amount": 100,
      "type": "credit",
      "description": "Cashback from order",
      "createdAt": "2026-05-12T00:00:00.000Z"
    }
  ]
}
```

---

## Gamification Service

**Base URL:** `https://rez-gamification-service.onrender.com`  
**Gateway Route:** `/achievements/*`, `/challenges/*`, `/badges/*`, `/missions/*`

### Get Achievements

```
GET /achievements
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "achievements": [
    {
      "id": "first_purchase",
      "name": "First Purchase",
      "description": "Complete your first purchase",
      "points": 100,
      "icon": "cart",
      "progress": 1,
      "completed": true
    }
  ]
}
```

### Get Challenges

```
GET /challenges
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "challenges": [
    {
      "id": "challenge_id",
      "name": "Daily Challenge",
      "description": "Complete 3 purchases today",
      "reward": 50,
      "progress": 2,
      "target": 3,
      "status": "active"
    }
  ]
}
```

### Get Leaderboard

```
GET /leaderboard
```

**Query Parameters:**
- `type` (daily/weekly/monthly)
- `limit` (default: 100)

**Response:**
```json
{
  "success": true,
  "leaderboard": [
    {
      "rank": 1,
      "user": {
        "id": "user_id",
        "name": "User Name",
        "avatar": "url"
      },
      "points": 5000
    }
  ]
}
```

---

## Creator Earnings Service

**Base URL:** `https://rez-creator-earnings-service.onrender.com`  
**Gateway Route:** `/creators/*`

### Get Profile

```
GET /creators/profile
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "profile": {
    "userId": "user_id",
    "tier": "gold",
    "totalEarnings": 10000,
    "totalPicks": 50,
    "totalConversions": 100
  }
}
```

### Get Earnings Summary

```
GET /creators/earnings/summary
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "summary": {
    "totalEarnings": 10000,
    "pendingPayout": 2000,
    "lifetimeEarnings": 50000,
    "thisMonth": 3000,
    "lastMonth": 2500
  }
}
```

---

## Booking Service

**Base URL:** `https://rez-booking-service.onrender.com`  
**Gateway Route:** `/bookings/*`

### Get Restaurants

```
GET /bookings/restaurants
```

**Query Parameters:**
- `location` (city/coordinates)
- `date` (YYYY-MM-DD)
- `time` (HH:MM)
- `partySize` (number)

**Response:**
```json
{
  "success": true,
  "restaurants": [
    {
      "id": "rest_id",
      "name": "Restaurant Name",
      "cuisine": ["Italian", "Pizza"],
      "rating": 4.5,
      "slots": [...]
    }
  ]
}
```

### Create Booking

```
POST /bookings
Authorization: Bearer <token>
```

**Request:**
```json
{
  "restaurantId": "rest_id",
  "date": "2026-05-15",
  "time": "19:00",
  "partySize": 4,
  "name": "John Doe",
  "phone": "+919876543210"
}
```

**Response:**
```json
{
  "success": true,
  "booking": {
    "id": "booking_id",
    "status": "confirmed",
    "confirmationCode": "ABC123"
  }
}
```

---

## Notifications Service

**Base URL:** `https://rez-notifications-service.onrender.com`  
**Gateway Route:** `/notifications/*`

### Get Notifications

```
GET /notifications
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "notifications": [
    {
      "id": "notif_id",
      "title": "Order Delivered",
      "body": "Your order has been delivered",
      "type": "order",
      "read": false,
      "createdAt": "2026-05-12T00:00:00.000Z"
    }
  ]
}
```

---

## Analytics Service

**Base URL:** `https://analytics-events-37yy.onrender.com`  
**Gateway Route:** `/events/*`

### Track Event

```
POST /events/track
Authorization: Bearer <token>
```

**Request:**
```json
{
  "events": [
    {
      "eventType": "page_view",
      "eventId": "evt_xxx",
      "timestamp": "2026-05-12T00:00:00.000Z",
      "metadata": {
        "page": "/home",
        "source": "deep_link"
      }
    }
  ]
}
```

**Response:**
```json
{
  "success": true
}
```

---

## Schedule Service

**Base URL:** `http://localhost:4090`
**Port:** 4090

### Create Event Type

```
POST /api/event-types
```

**Request:**
```json
{
  "slug": "consultation",
  "title": "30-min Consultation",
  "duration": 30,
  "locationType": "VIDEO_CALL",
  "requiresConfirmation": true,
  "price": 500,
  "currency": "INR"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "evt_xxx",
    "slug": "consultation",
    "title": "30-min Consultation",
    "duration": 30,
    "price": 500
  }
}
```

### Get Availability

```
GET /api/availability/:username/:slug?startDate=2026-05-27&endDate=2026-05-29
```

**Response:**
```json
{
  "success": true,
  "data": {
    "slots": [
      {
        "startTime": "2026-05-27T10:00:00Z",
        "endTime": "2026-05-27T10:30:00Z",
        "available": true
      }
    ]
  }
}
```

### Create Booking

```
POST /api/bookings
```

**Request:**
```json
{
  "eventTypeId": "evt_xxx",
  "startTime": "2026-05-27T10:00:00Z",
  "endTime": "2026-05-27T10:30:00Z",
  "attendeeName": "John Doe",
  "attendeeEmail": "john@example.com",
  "timezone": "Asia/Kolkata"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "uid": "bk_xxx",
    "status": "CONFIRMED",
    "startTime": "2026-05-27T10:00:00Z",
    "endTime": "2026-05-27T10:30:00Z"
  }
}
```

### List Event Types

```
GET /api/event-types
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "evt_xxx",
      "slug": "consultation",
      "title": "30-min Consultation",
      "duration": 30
    }
  ]
}
```

### Cancel Booking

```
PATCH /api/bookings/:uid/cancel
```

**Request:**
```json
{
  "reason": "Schedule conflict"
}
```

### Create Webhook

```
POST /api/webhooks
```

**Request:**
```json
{
  "url": "https://your-app.com/webhooks",
  "triggers": ["booking.created", "booking.cancelled"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "wh_xxx",
    "secret": "whsec_xxx"
  }
}
```

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

### Error Codes

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | Invalid or missing token |
| `FORBIDDEN` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `VALIDATION_ERROR` | Invalid request data |
| `RATE_LIMITED` | Too many requests |
| `SERVER_ERROR` | Internal server error |

---

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| Global | 100/min |
| Auth (OTP) | 5/min |
| Auth (Verify) | 10/min |
| Payments | 20/min |
