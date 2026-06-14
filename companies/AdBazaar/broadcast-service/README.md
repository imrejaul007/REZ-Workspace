# AdBazaar Broadcast Service

Mass broadcasting service for AdBazaar (email/SMS/push/in-app).

## Features

- Create and manage mass broadcasts
- Support for email, SMS, push, and in-app channels
- Segment-based targeting
- Scheduled broadcasts
- Real-time analytics and engagement tracking
- Queue-based sending with rate limiting
- Recipient tracking and delivery status

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
| PORT | Service port | 5045 |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/adbazaar_broadcast |
| REDIS_URL | Redis connection string | redis://localhost:6379 |
| EMAIL_PROVIDER | Email provider | sendgrid |
| SENDGRID_API_KEY | SendGrid API key | - |
| EMAIL_FROM_ADDRESS | Default from email | noreply@adbazaar.com |
| SMS_PROVIDER | SMS provider | twilio |
| TWILIO_ACCOUNT_SID | Twilio Account SID | - |
| TWILIO_AUTH_TOKEN | Twilio Auth Token | - |
| TWILIO_PHONE_NUMBER | Twilio phone number | - |
| INTERNAL_SERVICE_TOKEN | Service-to-service auth token | - |

## API Endpoints

### Broadcasts

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/broadcasts | Create a new broadcast |
| GET | /api/broadcasts | List all broadcasts |
| GET | /api/broadcasts/:id | Get broadcast by ID |
| PUT | /api/broadcasts/:id | Update broadcast |
| DELETE | /api/broadcasts/:id | Delete broadcast |
| POST | /api/broadcasts/:id/schedule | Schedule broadcast |
| POST | /api/broadcasts/:id/send | Send broadcast to recipients |
| POST | /api/broadcasts/:id/pause | Pause broadcast |
| POST | /api/broadcasts/:id/resume | Resume broadcast |
| GET | /api/broadcasts/:id/analytics | Get broadcast analytics |

### Segments

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/segments | Create a new segment |
| GET | /api/segments | List all segments |
| GET | /api/segments/:id | Get segment by ID |
| DELETE | /api/segments/:id | Delete segment |

### System

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| GET | /metrics | Prometheus metrics |

## Broadcast Channels

- `email` - Email notifications via SendGrid
- `sms` - SMS via Twilio
- `push` - Push notifications
- `inApp` - In-app notifications

## Request/Response Examples

### Create Broadcast

```bash
curl -X POST http://localhost:5045/api/broadcasts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "Summer Sale Announcement",
    "subject": "Summer Sale -50% Off!",
    "content": "<h1>Summer Sale!</h1><p>Get 50% off on all products.</p>",
    "channel": "email"
  }'
```

### Send Broadcast

```bash
curl -X POST http://localhost:5045/api/broadcasts/bc123/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "recipients": [
      { "userId": "user1", "email": "user1@example.com" },
      { "userId": "user2", "email": "user2@example.com" },
      { "userId": "user3", "email": "user3@example.com" }
    ]
  }'
```

### Schedule Broadcast

```bash
curl -X POST http://localhost:5045/api/broadcasts/bc123/schedule \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "scheduledAt": "2026-06-10T09:00:00Z"
  }'
```

### Create Segment

```bash
curl -X POST http://localhost:5045/api/segments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "Active Advertisers",
    "description": "Advertisers with active campaigns",
    "criteria": {
      "filters": [
        { "field": "status", "operator": "eq", "value": "active" },
        { "field": "campaignCount", "operator": "gte", "value": 1 }
      ],
      "logic": "and"
    }
  }'
```

## License

MIT