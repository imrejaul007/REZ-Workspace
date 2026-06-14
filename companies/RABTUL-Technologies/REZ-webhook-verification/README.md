# REZ Webhook Verification Service

A centralized webhook signature verification service for the REZ ecosystem. This service handles cryptographic signature verification, event deduplication, and webhook relay for multiple payment and e-commerce providers.

## Features

- **Multi-Provider Support**: Built-in support for Razorpay, Stripe, Shopify, PhonePe, PayU, Paytm, WooCommerce
- **Multiple Verification Algorithms**: HMAC-SHA256, HMAC-SHA1, HMAC-MD5, JWT, RSA-SHA256, ECDSA-SHA256
- **Event Deduplication**: Redis-based deduplication with MongoDB fallback
- **Retry Handling**: Exponential backoff with jitter for failed webhooks
- **Webhook Relay**: Automatic relay to configured services
- **Event Logging**: Complete payload logging for debugging
- **Provider Management**: REST API for managing webhook providers
- **Rate Limiting**: Configurable rate limiting per endpoint
- **Health Checks**: Health and readiness endpoints

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- MongoDB 6.0+
- Redis 7.0+ (optional, for deduplication)

### Installation

```bash
cd REZ-webhook-verification
npm install
```

### Configuration

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Update `.env` with your configuration:
```bash
# Generate a secure token
openssl rand -hex 32

# Add to .env
INTERNAL_SERVICE_TOKEN=<generated-token>

# Add provider webhook secrets
RAZORPAY_WEBHOOK_SECRET=your-razorpay-secret
STRIPE_WEBHOOK_SECRET=whsec_...
SHOPIFY_WEBHOOK_SECRET=your-shopify-secret
```

### Running

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## API Endpoints

### Webhook Verification

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/verify` | Verify webhook signature |
| POST | `/api/v1/relay` | Relay webhook to service |

### Provider Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/providers` | List all providers |
| POST | `/api/v1/providers` | Add new provider |
| GET | `/api/v1/providers/:id` | Get provider details |
| PATCH | `/api/v1/providers/:id` | Update provider |
| DELETE | `/api/v1/providers/:id` | Delete provider |

### Event Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/events` | List events |
| GET | `/api/v1/events/:id` | Get event details |
| POST | `/api/v1/retry/:id` | Retry failed webhook |

### Utilities

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/event-types` | List supported event types |
| GET | `/api/v1/statistics` | Get webhook statistics |
| POST | `/api/v1/cleanup` | Clean up old events |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Basic health check |
| GET | `/ready` | Readiness check |

## Usage Examples

### Verify a Webhook

```bash
curl -X POST http://localhost:4034/api/v1/verify \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: your-token" \
  -d '{
    "providerId": "razorpay",
    "payload": {
      "event": "payment.captured",
      "payload": {
        "payment": {
          "id": "pay_abc123",
          "amount": 1000,
          "currency": "INR"
        }
      }
    },
    "signature": "verified-signature-from-razorpay",
    "headers": {
      "x-razorpay-signature": "verified-signature-from-razorpay"
    }
  }'
```

### Response

```json
{
  "success": true,
  "data": {
    "verified": true,
    "eventId": "550e8400-e29b-41d4-a716-446655440000",
    "eventType": "payment.captured"
  },
  "meta": {
    "requestId": "req-abc123",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "version": "1.0.0"
  }
}
```

### Relay a Webhook

```bash
curl -X POST http://localhost:4034/api/v1/relay \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: your-token" \
  -d '{
    "targetUrl": "https://your-service.com/webhook",
    "payload": { ... },
    "headers": {
      "Authorization": "Bearer your-auth-token"
    }
  }'
```

### Add a Custom Provider

```bash
curl -X POST http://localhost:4034/api/v1/providers \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: your-token" \
  -d '{
    "name": "My Custom Provider",
    "type": "custom",
    "algorithm": "hmac_sha256",
    "secret": "your-webhook-secret",
    "relayUrl": "https://your-service.com/webhook",
    "allowedEvents": ["order.created", "order.updated"]
  }'
```

## Supported Providers

| Provider | Algorithm | Signature Header |
|----------|----------|-----------------|
| Razorpay | HMAC-SHA256 | `x-razorpay-signature` |
| Stripe | HMAC-SHA256 | `stripe-signature` |
| Shopify | HMAC-SHA256 | `x-shopify-hmac-sha256` |
| PhonePe | HMAC-SHA256 | `x-verify` |
| PayU | SHA-512 | `hash` |
| Paytm | HMAC-SHA256 | `x-verify` |

## Architecture

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│   External      │     │   Webhook            │     │   Target        │
│   Providers     │────▶│   Verification       │────▶│   Services      │
│   (Razorpay,    │     │   Service            │     │   (Order,       │
│   Stripe, etc.) │     │   (Port 4034)        │     │   Payment)      │
└─────────────────┘     └──────────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌──────────────┐
                        │   MongoDB    │  (Event Storage)
                        └──────────────┘
                               │
                        ┌──────────────┐
                        │   Redis      │  (Deduplication)
                        └──────────────┘
```

## Security

### Authentication

All API endpoints (except `/health`) require the `X-Internal-Token` header:

```bash
curl -H "X-Internal-Token: your-token" ...
```

### Rate Limiting

- Global: 100 requests per minute
- Verification endpoint: 500 requests per minute
- Limits are per service token or IP address

## Monitoring

### Prometheus Metrics (Coming Soon)

```
# Request metrics
webhook_verification_requests_total{provider, status}
webhook_verification_duration_seconds{provider}
webhook_verification_retries_total{provider}
```

## Troubleshooting

### 401 Unauthorized

- Ensure `X-Internal-Token` header is present
- Verify token matches `INTERNAL_SERVICE_TOKEN` in `.env`

### 429 Rate Limited

- Wait and retry with exponential backoff
- Check rate limit headers in response

### Verification Failed

- Check provider secret is correct
- Verify payload has not been modified
- Check timestamp is within tolerance

## License

Proprietary - REZ Ecosystem
