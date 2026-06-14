# REZ Subscription Service

A complete subscription and recurring billing service for the REZ ecosystem, built with Node.js, Express, and MongoDB.

## Features

- **Multiple Billing Cycles**: Daily, Weekly, Monthly, Quarterly, Yearly
- **Usage-Based Billing**: Per-unit, tiered, and flat-rate pricing
- **Free Trial Management**: Configurable trial periods with automatic conversion
- **Grace Period Handling**: Automatic grace period for failed payments
- **Auto-Renewal**: Automatic subscription renewal with configurable options
- **Plan Upgrade/Downgrade**: Seamless plan changes with prorated billing
- **Pause/Cancel Subscriptions**: Flexible subscription management
- **Prorated Billing**: Accurate billing for mid-cycle changes
- **Dunning**: Automated payment retry with escalating notices
- **Subscription Analytics**: Comprehensive metrics and reporting

## Architecture

```
REZ-subscription-service/
├── src/
│   ├── index.ts                 # Main Express application
│   ├── models/                  # MongoDB models
│   │   ├── subscription.ts      # Subscription model
│   │   ├── invoice.ts           # Invoice model
│   │   ├── usage.ts             # Usage records model
│   │   └── plan.ts              # Plans model
│   ├── services/                # Business logic
│   │   ├── subscriptionManager.ts # Subscription lifecycle
│   │   ├── billingEngine.ts      # Billing cycle management
│   │   ├── paymentCollector.ts   # Auto-payment collection
│   │   └── usageTracker.ts       # Usage-based billing
│   ├── routes/                  # API routes
│   │   ├── subscriptions.ts     # Subscription endpoints
│   │   ├── usage.ts             # Usage endpoints
│   │   ├── invoices.ts          # Invoice endpoints
│   │   ├── webhooks.ts          # Webhook handlers
│   │   ├── plans.ts             # Plan endpoints
│   │   └── analytics.ts         # Analytics endpoints
│   ├── middleware/              # Express middleware
│   │   └── auth.ts             # Authentication & rate limiting
│   ├── types/                   # TypeScript types & Zod schemas
│   │   └── index.ts            # All types and schemas
│   └── utils/                   # Utilities
│       ├── logger.ts            # Winston logger
│       ├── database.ts          # MongoDB connection
│       └── helpers.ts           # Helper functions
├── .env.example                 # Environment variables template
├── package.json                 # Dependencies
└── tsconfig.json               # TypeScript configuration
```

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- MongoDB >= 6.0
- npm or yarn

### Installation

```bash
# Navigate to service directory
cd REZ-subscription-service

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Configure your environment variables
# Edit .env with your settings

# Build TypeScript
npm run build

# Start the service
npm start
```

### Development

```bash
# Run in development mode with hot reload
npm run dev

# Run tests
npm test

# Run linting
npm run lint
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `4022` |
| `NODE_ENV` | Environment | `development` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/rez_subscriptions` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `INTERNAL_SERVICE_TOKEN` | Internal service authentication token | Required |
| `INTERNAL_SERVICE_TOKENS_JSON` | JSON map of service tokens | `{}` |
| `PAYMENT_SERVICE_URL` | Payment service URL | `http://localhost:4001` |
| `AUTH_SERVICE_URL` | Auth service URL | `http://localhost:3000` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | Optional |
| `DEFAULT_GRACE_PERIOD_DAYS` | Default grace period | `7` |
| `DEFAULT_TRIAL_DAYS` | Default trial period | `14` |
| `MAX_RETRY_ATTEMPTS` | Max payment retry attempts | `3` |
| `BILLING_CRON_SCHEDULE` | Billing cron schedule | `0 0 * * *` |
| `DUNNING_CRON_SCHEDULE` | Dunning cron schedule | `0 6 * * *` |
| `LOG_LEVEL` | Log level | `info` |

## API Reference

### Authentication

All API endpoints (except webhooks) require the `X-Internal-Token` header:

```bash
curl -X GET http://localhost:4022/api/v1/subscriptions \
  -H "X-Internal-Token: your-internal-service-token"
```

### Subscriptions

#### Create Subscription

```http
POST /api/v1/subscriptions
Content-Type: application/json
X-Internal-Token: your-token

{
  "customerId": "cust_123",
  "planId": "professional",
  "autoRenew": true,
  "paymentMethodId": "pm_123",
  "billingAddress": {
    "line1": "123 Main St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "postalCode": "400001",
    "country": "IN"
  }
}
```

#### Get Subscription

```http
GET /api/v1/subscriptions/:id
X-Internal-Token: your-token
```

#### Update Subscription

```http
PATCH /api/v1/subscriptions/:id
Content-Type: application/json
X-Internal-Token: your-token

{
  "autoRenew": false,
  "billingAddress": { ... }
}
```

#### Pause Subscription

```http
POST /api/v1/subscriptions/:id/pause
Content-Type: application/json
X-Internal-Token: your-token

{
  "reason": "Taking a break",
  "resumeDate": "2026-06-01T00:00:00Z"
}
```

#### Resume Subscription

```http
POST /api/v1/subscriptions/:id/resume
X-Internal-Token: your-token
```

#### Cancel Subscription

```http
POST /api/v1/subscriptions/:id/cancel
Content-Type: application/json
X-Internal-Token: your-token

{
  "reason": "Too expensive",
  "cancellationEffectiveDate": "period_end",
  "feedback": "Would return if prices were lower"
}
```

#### Change Plan (Upgrade/Downgrade)

```http
POST /api/v1/subscriptions/:id/change-plan
Content-Type: application/json
X-Internal-Token: your-token

{
  "newPlanId": "enterprise",
  "effectiveDate": "immediate"
}
```

### Usage

#### Record Usage

```http
POST /api/v1/usage
Content-Type: application/json
X-Internal-Token: your-token

{
  "subscriptionId": "sub_abc123",
  "quantity": 100,
  "idempotencyKey": "unique-key-123",
  "metadata": {
    "description": "API calls",
    "endpoint": "/api/orders"
  }
}
```

#### Get Usage Records

```http
GET /api/v1/usage?subscriptionId=sub_abc123&startDate=2026-05-01&endDate=2026-05-31
X-Internal-Token: your-token
```

#### Get Usage Summary

```http
GET /api/v1/usage/summary?subscriptionId=sub_abc123
X-Internal-Token: your-token
```

#### Get Usage Trends

```http
GET /api/v1/usage/trends?subscriptionId=sub_abc123&days=30
X-Internal-Token: your-token
```

### Invoices

#### List Invoices

```http
GET /api/v1/invoices?customerId=cust_123&status=pending
X-Internal-Token: your-token
```

#### Get Invoice

```http
GET /api/v1/invoices/:id
X-Internal-Token: your-token
```

#### Charge Invoice

```http
POST /api/v1/invoices/:id/charge
Content-Type: application/json
X-Internal-Token: your-token

{
  "paymentMethodId": "pm_456"
}
```

#### Refund Invoice

```http
POST /api/v1/invoices/:id/refund
Content-Type: application/json
X-Internal-Token: your-token

{
  "amount": 500,
  "reason": "Customer request"
}
```

### Plans

#### List Plans

```http
GET /api/v1/plans
X-Internal-Token: your-token
```

#### Get Plan

```http
GET /api/v1/plans/:id
X-Internal-Token: your-token
```

### Analytics

#### Get Subscription Analytics

```http
GET /api/v1/analytics/subscriptions
X-Internal-Token: your-token
```

#### Get Billing Metrics

```http
GET /api/v1/analytics/billing
X-Internal-Token: your-token
```

#### Get Billing Report

```http
GET /api/v1/analytics/billing/report?startDate=2026-05-01&endDate=2026-05-31
X-Internal-Token: your-token
```

### Webhooks

#### Stripe Webhook

```http
POST /api/v1/webhooks/stripe
Content-Type: application/json
Stripe-Signature: your-signature

{ ... Stripe event payload ... }
```

## Subscription Lifecycle

```
                    ┌─────────────┐
                    │   PENDING   │
                    └──────┬──────┘
                           │
                           ▼
              ┌────────────────────────┐
              │       TRIALING         │ (if trial period)
              └───────────┬────────────┘
                          │
                          ▼
              ┌────────────────────────┐
         ┌────│       ACTIVE          │◄────────────────┐
         │    └───────────┬────────────┘                 │
         │                │                              │
         │                ▼                              │
         │    ┌────────────────────────┐                │
         │    │      PAST_DUE          │                │
         │    └───────────┬────────────┘                │
         │                │                              │
         │                ▼                              │
         │    ┌────────────────────────┐                │
         │    │      PAUSED            │────────────────┤
         │    └────────────────────────┘                │
         │                                             │
         └─────────────────────────────────────────────┘
                              │
                              ▼
              ┌────────────────────────┐
              │     CANCELLED          │
              └────────────────────────┘
```

## Dunning Process

When a payment fails, the following dunning process occurs:

1. **First Notice** (Day 0): Payment failed, customer notified
2. **Retry 1** (Day 3): First retry attempt
3. **Second Notice** (Day 5): Second failure notice
4. **Retry 2** (Day 8): Second retry attempt
5. **Final Notice** (Day 13): Final warning
6. **Retry 3** (Day 20): Final retry attempt
7. **Cancellation** (Day 20+): Subscription cancelled

## Billing Cycles

| Cycle | Description | Proration Calculation |
|-------|-------------|----------------------|
| `daily` | Billed every day | 1/30 of monthly rate |
| `weekly` | Billed every week | 1/4 of monthly rate |
| `monthly` | Billed every month | Full rate |
| `quarterly` | Billed every 3 months | 3x monthly rate |
| `yearly` | Billed every year | 12x monthly rate |

## Usage-Based Billing

### Per-Unit Pricing

```typescript
{
  usageType: 'per_unit',
  usageLimits: {
    included: 1000,      // Free units per period
    overageRate: 0.10    // Rs 0.10 per additional unit
  }
}
```

### Tiered Pricing

```typescript
{
  usageType: 'tiered',
  usageLimits: {
    // First 1000 units at Rs 0.10
    // Next 5000 units at Rs 0.08
    // Above 6000 units at Rs 0.05
  }
}
```

## Proration

When upgrading or downgrading plans mid-cycle:

**Upgrade**: Full charge for remaining period on new plan
**Downgrade**: Credit for unused time on old plan, charge for new plan

Formula: `(newPrice - oldPrice) × (daysRemaining / totalDays)`

## Error Codes

| Code | Description |
|------|-------------|
| `SUBSCRIPTION_NOT_FOUND` | Subscription does not exist |
| `PLAN_NOT_FOUND` | Plan does not exist |
| `INVALID_STATUS_TRANSITION` | Cannot transition to requested status |
| `PAYMENT_FAILED` | Payment collection failed |
| `DUPLICATE_USAGE` | Usage with same idempotency key exists |
| `ALREADY_PAID` | Invoice is already paid |

## Health Check

```http
GET /api/v1/health
```

Response:
```json
{
  "status": "healthy",
  "service": "rez-subscription-service",
  "timestamp": "2026-05-16T10:30:00.000Z",
  "uptime": 3600
}
```

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- src/services/subscriptionManager.test.ts
```

## Deployment

### Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

EXPOSE 4022

CMD ["node", "dist/index.js"]
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: rez-subscription-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: rez-subscription-service
  template:
    spec:
      containers:
      - name: rez-subscription-service
        image: rez-subscription-service:latest
        ports:
        - containerPort: 4022
        env:
        - name: MONGODB_URI
          valueFrom:
            secretKeyRef:
              name: rez-secrets
              key: mongodb-uri
```

## License

Proprietary - REZ Ecosystem
