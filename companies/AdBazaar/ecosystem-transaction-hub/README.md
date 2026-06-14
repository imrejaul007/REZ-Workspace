# Ecosystem Transaction Hub

**Port:** 4811

Unified transaction hub for all ad-related transactions - payments, deposits, confirmations within the AdBazaar ecosystem.

## Overview

The Ecosystem Transaction Hub provides a centralized service for processing and managing all transactions originating from ads across the REZ ecosystem. It handles booking deposits, orders, appointments, subscriptions, and tips with support for multiple payment methods.

## Features

- **Unified Transaction Processing** - Single API for all ad-related transactions
- **Multi-Payment Method Support** - RABTUL Wallet, UPI, Card, Net Banking
- **Transaction Attribution** - Track transactions back to ads and campaigns
- **Refund Processing** - Full refund support with wallet integration
- **Analytics & Reporting** - Real-time transaction analytics
- **Redis Caching** - Fast transaction lookups
- **Prometheus Metrics** - Comprehensive observability
- **JWT Authentication** - Secure API access

## Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** MongoDB (Mongoose)
- **Cache:** Redis (ioredis)
- **Validation:** Zod
- **Auth:** JWT
- **Metrics:** Prometheus (prom-client)
- **Language:** TypeScript

## API Endpoints

### Transaction Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/transaction/initiate` | Initiate a new transaction |
| GET | `/api/transaction/:id` | Get transaction details |
| POST | `/api/transaction/:id/confirm` | Confirm payment |
| POST | `/api/transaction/:id/cancel` | Cancel transaction |
| POST | `/api/transaction/:id/refund` | Refund transaction |
| GET | `/api/transaction/user/:userId` | Get user transactions |
| GET | `/api/transaction/ad/:adId` | Get ad transactions |
| GET | `/api/transaction/analytics/advertiser/:advertiserId` | Get analytics |

### Health & Monitoring

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Basic health check |
| GET | `/health/detailed` | Detailed health with dependencies |
| GET | `/health/ready` | Kubernetes readiness probe |
| GET | `/health/live` | Kubernetes liveness probe |
| GET | `/metrics` | Prometheus metrics |

## Transaction Types

| Type | Description |
|------|-------------|
| `booking_deposit` | Deposit for service booking |
| `order` | Product or service order |
| `appointment` | Appointment booking payment |
| `subscription` | Recurring subscription |
| `tip` | Tip or gratuity |

## Transaction Status Flow

```
initiated -> pending_payment -> completed
     |            |                |
     v            v                v
  cancelled    failed          refunded
```

## Request/Response Examples

### Initiate Transaction

```bash
curl -X POST http://localhost:4811/api/transaction/initiate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "adId": "ad-123",
    "campaignId": "camp-456",
    "advertiserId": "adv-789",
    "userId": "user-001",
    "type": "order",
    "amount": 500,
    "currency": "INR",
    "paymentMethod": "wallet",
    "metadata": {
      "productIds": ["prod-1", "prod-2"],
      "adClickId": "click-123"
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transactionId": "TXN-1699999999999-ABC12345",
    "adId": "ad-123",
    "campaignId": "camp-456",
    "advertiserId": "adv-789",
    "userId": "user-001",
    "type": "order",
    "amount": 500,
    "currency": "INR",
    "status": "initiated",
    "paymentMethod": "wallet",
    "metadata": {
      "productIds": ["prod-1", "prod-2"],
      "adClickId": "click-123"
    },
    "createdAt": "2026-06-06T10:00:00.000Z",
    "updatedAt": "2026-06-06T10:00:00.000Z"
  }
}
```

### Confirm Transaction

```bash
curl -X POST http://localhost:4811/api/transaction/TXN-123/confirm \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "paymentReference": "PAY-RAZ-123456",
    "paymentMethod": "upi"
  }'
```

### Get Transaction

```bash
curl http://localhost:4811/api/transaction/TXN-123 \
  -H "Authorization: Bearer <token>"
```

### Get User Transactions

```bash
curl "http://localhost:4811/api/transaction/user/user-001?page=1&limit=20&status=completed" \
  -H "Authorization: Bearer <token>"
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 4811 | Server port |
| `MONGODB_URI` | mongodb://localhost:27017/ecosystem-transaction-hub | MongoDB connection string |
| `REDIS_URL` | redis://localhost:6379 | Redis connection string |
| `JWT_SECRET` | - | JWT signing secret (required in production) |
| `RABTUL_WALLET_URL` | http://localhost:4004 | RABTUL Wallet service URL |
| `RABTUL_PAYMENT_URL` | http://localhost:4008 | RABTUL Payment service URL |
| `NODE_ENV` | development | Environment (development/production) |
| `LOG_LEVEL` | info | Logging level |

## Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
vim .env

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Metrics

The service exposes Prometheus metrics at `/metrics`:

- `ecosystem_transaction_hub_http_requests_total` - Total HTTP requests
- `ecosystem_transaction_hub_http_request_duration_seconds` - Request duration
- `ecosystem_transaction_hub_transactions_total` - Total transactions by type/status
- `ecosystem_transaction_hub_transactions_amount` - Transaction amounts histogram
- `ecosystem_transaction_hub_active_transactions` - Active transactions gauge
- `ecosystem_transaction_hub_payment_processing_duration_seconds` - Payment processing time
- `ecosystem_transaction_hub_cache_hits_total` - Cache hits
- `ecosystem_transaction_hub_cache_misses_total` - Cache misses
- `ecosystem_transaction_hub_external_api_calls_total` - External API calls

## Project Structure

```
ecosystem-transaction-hub/
├── src/
│   ├── config/           # Configuration
│   ├── middleware/       # Express middleware (auth, validation, metrics)
│   ├── models/           # Mongoose models
│   ├── routes/           # API routes
│   ├── services/         # Business logic services
│   ├── types/            # TypeScript types and Zod schemas
│   ├── utils/            # Utilities (logger)
│   ├── tests/            # Test files
│   └── index.ts          # Application entry point
├── package.json
├── tsconfig.json
├── jest.config.js
├── .env.example
└── README.md
```

## Integration with RABTUL

The service integrates with RABTUL Technologies for:

- **Wallet Operations** - Deduct/refund from user wallets
- **Payment Processing** - UPI, Card, Net Banking via RABTUL Payment

### Wallet Flow

1. Transaction initiated
2. If wallet payment: deduct from RABTUL Wallet
3. Transaction confirmed with payment reference
4. On refund: refund to RABTUL Wallet

## Error Handling

All errors return a consistent JSON structure:

```json
{
  "success": false,
  "error": "Error message",
  "details": { ... }
}
```

HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `429` - Too Many Requests
- `500` - Internal Server Error

## Rate Limiting

Default rate limit: 100 requests per minute per user/IP.

Headers returned:
- `X-RateLimit-Limit` - Maximum requests allowed
- `X-RateLimit-Remaining` - Remaining requests
- `X-RateLimit-Reset` - Reset timestamp

## Health Checks

| Endpoint | Purpose |
|----------|---------|
| `/health` | Basic health (always returns 200 if server is up) |
| `/health/detailed` | Full health with dependency status |
| `/health/ready` | Kubernetes readiness (checks DB) |
| `/health/live` | Kubernetes liveness (always returns 200) |

## License

Proprietary - REZ Ecosystem
