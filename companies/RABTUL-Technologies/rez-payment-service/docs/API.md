# ReZ Payment Service API

Payment processing and settlement management for the ReZ platform.

## Overview

The Payment Service handles:
- Payment initiation and capture
- Razorpay integration for payment gateway
- Refund processing
- Payment webhooks from Razorpay
- Merchant settlement tracking
- Wallet credit integration

## Base URL

```
Production: https://api.rez.money/payment
Staging: https://staging-api.rez.money/payment
```

## Authentication

Most endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <access_token>
```

## Payment Flow

```
1. Client → POST /pay/initiate → Creates payment record
2. Client → Razorpay Checkout → User completes payment
3. Client → POST /pay/capture → Captures payment
4. System → POST /pay/internal/wallet-credit → Credits wallet
```

## Initiate Payment

```http
POST /pay/initiate
Authorization: Bearer <token>
Content-Type: application/json

{
  "orderId": "order_12345",
  "amount": 500.00,
  "paymentMethod": "upi",
  "purpose": "order_payment"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "paymentId": "pay_xxx",
    "orderId": "order_12345",
    "amount": 500.00,
    "status": "pending"
  }
}
```

## Capture Payment

After the user completes Razorpay Checkout, capture the payment:

```http
POST /pay/capture
Authorization: Bearer <token>
Content-Type: application/json

{
  "paymentId": "pay_xxx",
  "razorpayPaymentId": "pay_abc123",
  "razorpayOrderId": "order_xyz789",
  "razorpaySignature": "signature_here"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "paymentId": "pay_xxx",
    "status": "completed"
  }
}
```

**Security Features:**
- HMAC-SHA256 signature verification
- Replay prevention via Razorpay payment ID deduplication
- Redis-backed nonce tracking (25-hour window)

## Payment Status

```http
GET /pay/status/{paymentId}
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "payment": {
      "paymentId": "pay_xxx",
      "orderId": "order_12345",
      "amount": 500.00,
      "paymentMethod": "upi",
      "status": "completed"
    },
    "auditTrail": [
      {
        "action": "payment.created",
        "timestamp": "2024-01-15T10:00:00Z"
      },
      {
        "action": "payment.captured",
        "timestamp": "2024-01-15T10:05:00Z"
      }
    ]
  }
}
```

## Refund Payment

Refunds require merchant or admin role:

```http
POST /pay/refund
Authorization: Bearer <merchant_token>
Content-Type: application/json

{
  "paymentId": "pay_xxx",
  "amount": 250.00,
  "reason": "Partial refund for damaged item"
}
```

## Razorpay Integration

### Create Order

```http
POST /api/razorpay/create-order
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 500.00,
  "receipt": "rcpt_xxx",
  "notes": {
    "orderId": "order_12345",
    "orderNumber": "ORD-12345"
  }
}
```

### Get Config

```http
GET /api/razorpay/config
Authorization: Bearer <token>
```

Returns `key_id` for Razorpay SDK initialization.

## Webhook Events

The payment service handles these Razorpay webhook events:

| Event | Description |
|-------|-------------|
| `payment.captured` | Payment successfully completed |
| `payment.failed` | Payment failed |
| `refund.processed` | Refund completed by Razorpay |
| `refund.failed` | Refund failed |

### Webhook Security

1. Verify `x-razorpay-signature` header using webhook secret
2. Deduplicate via `x-razorpay-event-id` (24-hour window)
3. Rate limit per IP (100 requests/minute)
4. Check Redis connectivity before processing

## Payment Methods

| Method | Code | Description |
|--------|------|-------------|
| UPI | `upi` | Unified Payments Interface |
| Card | `card` | Credit/Debit Card |
| Netbanking | `netbanking` | Internet Banking |
| Wallet | `wallet` | ReZ Wallet |
| COD | `cod` | Cash on Delivery |
| BNPL | `bnpl` | Buy Now Pay Later |

## Payment Status

| Status | Description |
|--------|-------------|
| `pending` | Payment initiated |
| `processing` | Payment processing |
| `completed` | Payment successful |
| `failed` | Payment failed |
| `cancelled` | Payment cancelled |
| `refunded` | Payment refunded |

## Merchant Settlements

```http
GET /pay/merchant/settlements
Authorization: Bearer <merchant_token>
```

Returns settlement history with pagination.

## Internal Endpoints

Internal endpoints require `X-Internal-Token` header:

### Credit Wallet

```http
POST /pay/internal/wallet-credit
X-Internal-Token: <token>
Content-Type: application/json

{
  "paymentId": "pay_xxx",
  "amount": 500,
  "idempotencyKey": "wallet-credit-pay_xxx"
}
```

### Payment Regularity

Used for merchant credit scoring:

```http
GET /internal/merchants/{merchantId}/payment-regularity
X-Internal-Token: <token>
```

Returns on-time payment rate over trailing 90 days.

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| Payment Initiate | 100/min per user |
| Payment Capture | 100/min per user |
| Refund | 10/min per merchant |
| Webhook | 100/min per IP |

## Error Codes

| Code | Description |
|------|-------------|
| `PAY_FAILED` | Payment processing failed |
| `PAY_REFUND_NOT_ALLOWED` | Not authorized to refund |
| `PAY_GATEWAY_ERROR` | Payment gateway error |
| `SRV_INTERNAL_ERROR` | Server error |
| `RES_NOT_FOUND` | Payment not found |

## Webhook Failures

If the payment service is unavailable during webhook delivery:
- Razorpay retries with exponential backoff
- Events are deduplicated within 24 hours
- Failed events can be manually retried via DLQ admin

## DLQ Admin

Monitor and manage failed jobs:

```http
# Queue summary
GET /admin/dlq

# List failed jobs
GET /admin/dlq/wallet-credit/jobs?start=0&end=49

# Retry single job
POST /admin/dlq/wallet-credit/jobs/{jobId}/retry

# Retry all
POST /admin/dlq/wallet-credit/retry-all

# Discard job
DELETE /admin/dlq/wallet-credit/jobs/{jobId}
```

## Related Services

- **rez-wallet-service**: Wallet balance and coin management
- **rez-auth-service**: User authentication
- **rez-merchant-service**: Merchant management
