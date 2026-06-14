# AdBazaar Notification Preference Center

User notification preferences management for AdBazaar.

## Features

- Per-user notification preferences
- Channel-specific settings (email, SMS, push, in-app)
- Quiet hours configuration
- Category-based notification control
- Subscription management
- Marketing opt-out
- Analytics and engagement tracking

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
| PORT | Service port | 5044 |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/adbazaar_notification_preferences |
| REDIS_URL | Redis connection string | redis://localhost:6379 |
| INTERNAL_SERVICE_TOKEN | Service-to-service auth token | - |

## API Endpoints

### Preferences

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/preferences/:userId | Get user preferences |
| PUT | /api/preferences/:userId | Update preferences |
| POST | /api/preferences/:userId/reset | Reset preferences to defaults |
| POST | /api/preferences/:userId/opt-out-marketing | Opt out of all marketing |
| GET | /api/can-send/:userId/:channel | Check if notification can be sent |

### Subscriptions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/preferences/:userId/subscribe | Subscribe to notification type |
| DELETE | /api/preferences/:userId/subscribe/:id | Unsubscribe |
| GET | /api/preferences/:userId/subscriptions | List user subscriptions |
| POST | /api/preferences/:userId/subscriptions/:id/pause | Pause subscription |
| POST | /api/preferences/:userId/subscriptions/:id/resume | Resume subscription |

### Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/preferences/:userId/analytics | Get preference analytics |

### System

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| GET | /metrics | Prometheus metrics |

## Notification Channels

- `email` - Email notifications with frequency control
- `sms` - SMS notifications
- `push` - Push notifications (mobile)
- `inApp` - In-app notifications

## Category Types

- `campaign` - Campaign updates
- `promotion` - Promotional content
- `update` - Product/feature updates
- `reminder` - Reminder notifications
- `alert` - Alert notifications

## Request/Response Examples

### Get Preferences

```bash
curl -X GET http://localhost:5044/api/preferences/user123 \
  -H "Authorization: Bearer <token>"
```

### Update Preferences

```bash
curl -X PUT http://localhost:5044/api/preferences/user123 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "channels": {
      "email": {
        "enabled": true,
        "frequency": "daily",
        "quietHours": {
          "start": "22:00",
          "end": "08:00",
          "timezone": "Asia/Kolkata"
        }
      },
      "sms": {
        "enabled": false
      }
    },
    "marketing": {
      "enabled": false
    }
  }'
```

### Subscribe

```bash
curl -X POST http://localhost:5044/api/preferences/user123/subscribe \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "type": "campaign",
    "name": "New Campaign Alerts",
    "description": "Get notified about new campaigns",
    "channels": ["email", "push"],
    "frequency": "realtime"
  }'
```

## License

MIT