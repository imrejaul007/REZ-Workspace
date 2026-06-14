# AdBazaar Webhook Service

Webhook management and delivery service for AdBazaar.

## Features

- Create and manage webhooks for various events
- Automatic delivery with retry logic
- HMAC signature verification
- Event filtering by campaign type, advertiser, budget
- Detailed delivery logs and analytics
- Redis queue for reliable delivery

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Service port | 5040 |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/adbazaar_webhooks |
| REDIS_URL | Redis connection string | redis://localhost:6379 |
| INTERNAL_SERVICE_TOKEN | Service-to-service auth token | - |

## API Endpoints

### Webhooks

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/webhooks | Create a new webhook |
| GET | /api/webhooks | List all webhooks |
| GET | /api/webhooks/:id | Get webhook by ID |
| PUT | /api/webhooks/:id | Update webhook |
| DELETE | /api/webhooks/:id | Delete webhook |
| POST | /api/webhooks/:id/test | Test webhook delivery |
| GET | /api/webhooks/:id/logs | Get webhook delivery logs |
| POST | /api/webhooks/:id/toggle | Toggle webhook active state |

### System

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| GET | /metrics | Prometheus metrics |
| POST | /api/trigger | Trigger webhooks for an event |

## Webhook Events

- `campaign.created` - New campaign created
- `campaign.updated` - Campaign updated
- `campaign.deleted` - Campaign deleted
- `campaign.approved` - Campaign approved
- `campaign.rejected` - Campaign rejected
- `campaign.paused` - Campaign paused
- `ad.impression` - Ad impression recorded
- `ad.click` - Ad click recorded
- `payment.received` - Payment received
- `payment.failed` - Payment failed
- `user.registered` - New user registered

## Request/Response Examples

### Create Webhook

```bash
curl -X POST http://localhost:5040/api/webhooks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "My Webhook",
    "url": "https://example.com/webhook",
    "events": ["campaign.created", "campaign.approved"],
    "retryPolicy": {
      "maxRetries": 3,
      "retryDelay": 5000
    }
  }'
```

### Response

```json
{
  "_id": "...",
  "name": "My Webhook",
  "url": "https://example.com/webhook",
  "events": ["campaign.created", "campaign.approved"],
  "secret": "abc123...",
  "active": true,
  "retryPolicy": {
    "maxRetries": 3,
    "retryDelay": 5000,
    "backoffMultiplier": 2
  },
  "ownerId": "user123",
  "createdAt": "2026-06-07T00:00:00.000Z",
  "updatedAt": "2026-06-07T00:00:00.000Z"
}
```

## Signature Verification

All webhook deliveries include HMAC-SHA256 signature in the `X-Webhook-Signature` header.

```javascript
const crypto = require('crypto');

function verifySignature(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  const expectedSignature = `sha256=${hmac.digest('hex')}`;
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

## License

MIT