# CorpPerks Webhook Service

Webhook service for CorpPerks - handles webhook subscriptions, delivery, and retry logic.

## Quick Start

```bash
cd webhook-service

# Install dependencies
npm install

# Start in development mode
npm run dev

# Build for production
npm run build

# Start production
npm start
```

## Environment Variables

```bash
# Server
WEBHOOK_PORT=4746
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/corpperks-webhooks

# Security
INTERNAL_SERVICE_TOKEN=your-secret-token
ALLOWED_ORIGINS=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Retry Settings
WEBHOOK_MAX_RETRIES=3
WEBHOOK_RETRY_DELAY_MS=5000
WEBHOOK_TIMEOUT_MS=30000
```

## API Endpoints

### Subscribe to Events
```bash
POST /api/webhooks/subscribe
X-Internal-Token: your-token
Content-Type: application/json

{
  "url": "https://your-webhook-endpoint.com/webhook",
  "events": ["employee.created", "leave.approved"],
  "description": "My webhook subscription",
  "headers": {
    "Authorization": "Bearer token"
  }
}
```

### List Subscriptions
```bash
GET /api/webhooks/subscriptions
X-Internal-Token: your-token
```

### Delete Subscription
```bash
DELETE /api/webhooks/subscriptions/:id
X-Internal-Token: your-token
```

### Test Webhook
```bash
POST /api/webhooks/test
X-Internal-Token: your-token
Content-Type: application/json

{
  "subscriptionId": "subscription-id"
}
```

### View Logs
```bash
GET /api/webhooks/logs?subscriptionId=xxx&status=failed&limit=50
X-Internal-Token: your-token
```

### Trigger Webhooks (Internal)
```bash
POST /api/webhooks/trigger
X-Internal-Token: your-token
Content-Type: application/json

{
  "eventType": "employee.created",
  "payload": {
    "employeeId": "EMP001",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

## Supported Events

- `employee.created` - New employee registered
- `employee.updated` - Employee details updated
- `leave.applied` - Leave application submitted
- `leave.approved` - Leave approved
- `leave.rejected` - Leave rejected
- `attendance.recorded` - Attendance marked
- `project.created` - New project created
- `project.updated` - Project status changed
- `task.created` - New task created
- `task.updated` - Task status changed

## HMAC Signature Verification

All webhook deliveries include signature verification:

```
X-Webhook-Signature: sha256=<signature>
X-Webhook-Timestamp: <unix-timestamp>
```

To verify:
1. Extract timestamp and signature from headers
2. Compute: `HMAC-SHA256(timestamp + "." + payload, secret)`
3. Compare signatures using timing-safe comparison

## Retry Logic

Failed webhooks are automatically retried with exponential backoff:
- Attempt 1: Immediate
- Attempt 2: 5 seconds delay
- Attempt 3: 10 seconds delay
- Attempt 4: 20 seconds delay

After max retries (default: 3), the webhook is marked as permanently failed.

## Health Check

```bash
GET /health
```
