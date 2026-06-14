# RABTUL Technologies - API Reference

**Version:** 1.0.0
**Updated:** May 17, 2026

---

## Quick Reference

| Service | Base URL | Port |
|---------|---------|------|
| API Gateway | `https://api.rez.money` | 4000 |
| Auth Service | `https://auth.rez.money` | 4002 |
| Payment Service | `https://payment.rez.money` | 4001 |
| Wallet Service | `https://wallet.rez.money` | 4004 |
| Order Service | `https://orders.rez.money` | 4006 |
| Catalog Service | `https://catalog.rez.money` | 4007 |
| Search Service | `https://search.rez.money` | 4008 |
| Delivery Service | `https://delivery.rez.money` | 4009 |
| Notifications | `https://notifications.rez.money` | 4011 |
| Profile Service | `https://profile.rez.money` | 4013 |
| Analytics | `https://analytics.rez.money` | 4016 |
| Booking Service | `https://bookings.rez.money` | 4020 |

---

## Authentication

### Internal Service Calls

```bash
curl -H "X-Internal-Token: your-internal-token" \
  https://api.rez.money/api/resource
```

### User Authentication

```bash
# JWT in Authorization header
curl -H "Authorization: Bearer <jwt_token>" \
  https://api.rez.money/api/resource
```

---

## Core Services API

### Auth Service (Port 4002)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/login` | Login |
| POST | `/api/v1/auth/signup` | Register |
| POST | `/api/v1/auth/otp/send` | Send OTP |
| POST | `/api/v1/auth/otp/verify` | Verify OTP |
| POST | `/api/v1/auth/refresh` | Refresh token |
| POST | `/api/v1/auth/logout` | Logout |
| GET | `/api/v1/auth/me` | Current user |

#### Login
```json
POST /api/v1/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Register
```json
POST /api/v1/auth/signup
{
  "email": "user@example.com",
  "password": "secure123",
  "phone": "+919876543210"
}
```

#### OTP Flow
```json
// Send OTP
POST /api/v1/auth/otp/send
{
  "phone": "+919876543210",
  "type": "login"
}

// Verify OTP
POST /api/v1/auth/otp/verify
{
  "phone": "+919876543210",
  "otp": "123456"
}
```

---

### Payment Service (Port 4001)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/payments/create` | Create payment |
| POST | `/api/v1/payments/:id/verify` | Verify payment |
| POST | `/api/v1/payments/:id/refund` | Process refund |
| GET | `/api/v1/payments/:id` | Get payment |
| GET | `/api/v1/payments/user/:userId` | List payments |
| POST | `/api/v1/webhooks/razorpay` | Razorpay webhook |

#### Create Payment
```json
POST /api/v1/payments/create
{
  "amount": 10000,
  "currency": "INR",
  "orderId": "order_123",
  "customerId": "cust_456",
  "method": "upi"
}
```

Response:
```json
{
  "id": "pay_abc123",
  "amount": 10000,
  "currency": "INR",
  "status": "created",
  "orderId": "order_123"
}
```

#### Verify Payment
```json
POST /api/v1/payments/pay_abc123/verify
{
  "razorpay_payment_id": "pay_xyz",
  "razorpay_order_id": "order_xyz",
  "razorpay_signature": "signature_here"
}
```

#### Refund
```json
POST /api/v1/payments/pay_abc123/refund
{
  "amount": 5000,
  "reason": "Customer request"
}
```

---

### Wallet Service (Port 4004)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/wallet/:userId` | Get balance |
| POST | `/api/v1/wallet/:userId/topup` | Top up |
| POST | `/api/v1/wallet/:userId/deduct` | Deduct |
| POST | `/api/v1/wallet/:userId/transfer` | Transfer |
| GET | `/api/v1/wallet/:userId/transactions` | Transactions |

#### Top Up
```json
POST /api/v1/wallet/user_123/topup
{
  "amount": 5000,
  "paymentId": "pay_abc123"
}
```

#### Deduct
```json
POST /api/v1/wallet/user_123/deduct
{
  "amount": 500,
  "reason": "Order payment",
  "orderId": "order_123"
}
```

#### Transfer
```json
POST /api/v1/wallet/user_123/transfer
{
  "toUserId": "user_456",
  "amount": 1000,
  "note": "Split bill"
}
```

---

### Order Service (Port 4006)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/orders` | Create order |
| GET | `/api/v1/orders/:id` | Get order |
| PUT | `/api/v1/orders/:id/status` | Update status |
| GET | `/api/v1/orders/user/:userId` | List orders |
| POST | `/api/v1/orders/:id/cancel` | Cancel order |

#### Create Order
```json
POST /api/v1/orders
{
  "userId": "user_123",
  "items": [
    { "productId": "prod_1", "quantity": 2, "price": 500 }
  ],
  "totalAmount": 1000,
  "paymentMethod": "wallet"
}
```

---

### Catalog Service (Port 4007)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/products` | List products |
| GET | `/api/v1/products/:id` | Get product |
| POST | `/api/v1/products` | Create product |
| PUT | `/api/v1/products/:id` | Update product |
| GET | `/api/v1/categories` | List categories |
| GET | `/api/v1/categories/:id/products` | Category products |

#### Search
```
GET /api/v1/products?search=phone&category=electronics&limit=20&offset=0
```

---

### Search Service (Port 4008)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/search` | Full-text search |
| GET | `/api/v1/autocomplete` | Autocomplete |
| POST | `/api/v1/index/products` | Index products |
| DELETE | `/api/v1/index/products/:id` | Remove from index |

#### Search
```
GET /api/v1/search?q=iphone&filters=category:electronics,price:5000-20000
```

#### Autocomplete
```
GET /api/v1/autocomplete?q=iph&limit=10
```

---

### Notifications Service (Port 4011)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/notifications/send` | Send notification |
| GET | `/api/v1/notifications/:userId` | List notifications |
| PUT | `/api/v1/notifications/:id/read` | Mark as read |
| PUT | `/api/v1/notifications/:userId/read-all` | Mark all read |

#### Send Notification
```json
POST /api/v1/notifications/send
{
  "userId": "user_123",
  "type": "push",
  "title": "Order Delivered!",
  "body": "Your order #12345 has been delivered",
  "data": { "orderId": "order_12345" }
}
```

---

### Profile Service (Port 4013)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/profiles/:userId` | Get profile |
| PUT | `/api/v1/profiles/:userId` | Update profile |
| GET | `/api/v1/profiles/:userId/preferences` | Get preferences |
| PUT | `/api/v1/profiles/:userId/preferences` | Update preferences |

---

### Booking Service (Port 4020)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/bookings` | Create booking |
| GET | `/api/v1/bookings/:id` | Get booking |
| PUT | `/api/v1/bookings/:id/cancel` | Cancel booking |
| GET | `/api/v1/bookings/user/:userId` | List bookings |
| GET | `/api/v1/resources/:id/availability` | Check availability |

#### Create Booking
```json
POST /api/v1/bookings
{
  "resourceId": "room_1",
  "userId": "user_123",
  "startTime": "2026-05-20T10:00:00Z",
  "endTime": "2026-05-20T12:00:00Z",
  "guests": 2,
  "notes": "Need projector"
}
```

---

## Infrastructure Services

### Circuit Breaker (Port 4030)
```
GET /health - Health check
GET /api/status/:service - Get circuit status
POST /api/reset/:service - Reset circuit
```

### Retry Service (Port 4031)
```
POST /api/retry - Submit retryable task
GET /api/retry/:id/status - Get task status
```

### DLQ Service (Port 4032)
```
GET /api/queues - List queues
GET /api/queues/:name/messages - Get messages
POST /api/queues/:name/retry - Retry failed
```

### Secrets Manager (Port 4035)
```
GET /api/secrets/:name - Get secret
POST /api/secrets - Create secret
PUT /api/secrets/:name - Update secret
DELETE /api/secrets/:name - Delete secret
POST /api/secrets/:name/rotate - Rotate secret
```

---

## BuzzLocal Services

### Feed Service (Port 4201)
```
GET /api/feed - Get feed
POST /api/posts - Create post
GET /api/posts/:id - Get post
POST /api/posts/:id/like - Like post
POST /api/posts/:id/comments - Add comment
```

### Community Service (Port 4202)
```
GET /api/communities - List communities
POST /api/communities - Create community
POST /api/communities/:id/join - Join community
GET /api/communities/:id/members - List members
```

### Payment Service (Port 4205)
```
POST /api/payments/create - Create payment
POST /api/webhook/razorpay - Webhook endpoint
```

### Realtime Service (Port 4206)
WebSocket: `wss://buzzlocal-realtime.rez.money/ws`

---

## Common Patterns

### Error Response
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [
      { "field": "amount", "message": "must be positive" }
    ]
  }
}
```

### Pagination
```
GET /api/resource?limit=20&offset=0
```

Response:
```json
{
  "data": [...],
  "total": 100,
  "limit": 20,
  "offset": 0,
  "hasMore": true
}
```

### Idempotency
```bash
curl -X POST https://api.rez.money/api/payments \
  -H "X-Idempotency-Key: unique-key-123" \
  -d '{ ... }'
```

### Health Check
```bash
curl https://service.rez.money/health
```

Response:
```json
{
  "status": "healthy",
  "service": "service-name",
  "timestamp": "2026-05-17T12:00:00Z"
}
```

---

## Rate Limits

| Endpoint Type | Limit |
|--------------|-------|
| Auth | 10/min |
| Payments | 100/min |
| Read endpoints | 1000/min |
| Write endpoints | 100/min |

Response headers:
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`
