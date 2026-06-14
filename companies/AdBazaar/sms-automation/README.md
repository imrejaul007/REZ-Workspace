# AdBazaar SMS Automation Service

SMS automation and drip for AdBazaar.

## Features

- Create and manage SMS drip sequences
- Multi-step SMS campaigns with delays
- User enrollment and tracking
- Automated SMS sending via Twilio/MSG91
- Action tracking (delivered, failed, replied)
- Analytics and delivery metrics
- Variable interpolation in SMS

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
| PORT | Service port | 5043 |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/adbazaar_sms_automation |
| REDIS_URL | Redis connection string | redis://localhost:6379 |
| SMS_PROVIDER | SMS provider (twilio/msg91) | twilio |
| TWILIO_ACCOUNT_SID | Twilio Account SID | - |
| TWILIO_AUTH_TOKEN | Twilio Auth Token | - |
| TWILIO_PHONE_NUMBER | Twilio phone number | - |
| INTERNAL_SERVICE_TOKEN | Service-to-service auth token | - |

## API Endpoints

### Sequences

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/sequences | Create a new sequence |
| GET | /api/sequences | List all sequences |
| GET | /api/sequences/:id | Get sequence by ID |
| PUT | /api/sequences/:id | Update sequence |
| DELETE | /api/sequences/:id | Delete sequence |
| POST | /api/sequences/:id/steps | Add step to sequence |
| PUT | /api/sequences/:id/steps/reorder | Reorder steps |
| POST | /api/sequences/:id/enroll | Enroll user in sequence |
| GET | /api/sequences/:id/enrollments | Get enrollments |
| GET | /api/sequences/:id/analytics | Get sequence analytics |

### Tracking

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/track/:enrollmentId/:action | Track SMS action |

### System

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| GET | /metrics | Prometheus metrics |

## Trigger Types

- `campaign_signup` - Triggered when user signs up for campaign
- `trial_start` - Triggered when trial starts
- `purchase` - Triggered after purchase
- `manual` - Manually triggered
- `segment` - Based on user segment membership

## SMS Variables

Use `{{variableName}}` syntax in SMS content:

```
Hello {{firstName}}! Your order #{{orderId}} has been shipped.
```

## Request/Response Examples

### Create Sequence

```bash
curl -X POST http://localhost:5043/api/sequences \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "Order Updates",
    "description": "Order status SMS sequence",
    "trigger": { "type": "purchase" },
    "tags": ["ecommerce", "orders"]
  }'
```

### Add Step

```bash
curl -X POST http://localhost:5043/api/sequences/seq123/steps \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "Shipping Notification",
    "smsContent": "Hi {{firstName}}, your order #{{orderId}} has been shipped! Track: {{trackingUrl}}",
    "delayHours": 24
  }'
```

### Enroll User

```bash
curl -X POST http://localhost:5043/api/sequences/seq123/enroll \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "userId": "user123",
    "phone": "+919876543210",
    "variables": {
      "firstName": "John",
      "orderId": "ORD-12345",
      "trackingUrl": "https://track.example.com/12345"
    }
  }'
```

## License

MIT