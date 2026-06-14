# AdBazaar Subscription Management Service

**Port:** 5002  
**Company:** AdBazaar  
**Purpose:** Publisher subscription handling for AdBazaar DOOH and advertising platform

## Overview

The Subscription Management Service handles all subscription-related operations for publishers on the AdBazaar platform. It manages subscription lifecycle, plan management, invoicing, billing, and analytics.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Subscription Service (5002)                  │
├─────────────────────────────────────────────────────────────────┤
│  Routes Layer                                                    │
│  ├── /api/subscriptions - Subscription CRUD & lifecycle         │
│  ├── /api/plans - Plan management                                │
│  ├── /api/invoices - Invoice management                          │
│  └── /api/analytics - Analytics & reporting                     │
├─────────────────────────────────────────────────────────────────┤
│  Services Layer                                                  │
│  ├── SubscriptionService - Subscription lifecycle management     │
│  ├── PlanService - Plan CRUD & management                        │
│  ├── InvoiceService - Invoice generation & management            │
│  ├── BillingService - Billing & payment processing               │
│  └── AnalyticsService - Analytics & reporting                   │
├─────────────────────────────────────────────────────────────────┤
│  Models Layer                                                    │
│  ├── Subscription - Publisher subscriptions                      │
│  ├── Plan - Subscription plans                                   │
│  ├── Invoice - Billing invoices                                  │
│  └── SubscriptionEvent - Event audit trail                       │
└─────────────────────────────────────────────────────────────────┘
```

## Features

### Subscription Management
- Create subscriptions with trial periods
- Update subscription status and settings
- Cancel subscriptions (immediate or end-of-cycle)
- Renew subscriptions
- Upgrade/downgrade plans with proration
- View subscription history and events

### Plan Management
- Pre-defined plans (Starter, Professional, Enterprise)
- Custom plan creation
- Plan comparison
- Pricing with billing cycle discounts (5% quarterly, 20% yearly)

### Invoice Management
- Automatic invoice generation
- Invoice status tracking (pending, paid, overdue, cancelled)
- Payment processing via RABTUL Wallet
- Invoice search by number or ID

### Billing Operations
- Automatic renewal processing
- Trial expiration handling
- Payment retry logic
- Credit management

### Analytics
- MRR (Monthly Recurring Revenue) breakdown
- Subscription trends
- Revenue forecasting
- Churn rate calculation

## API Endpoints

### Subscriptions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/subscriptions` | Create subscription |
| GET | `/api/subscriptions` | List subscriptions |
| GET | `/api/subscriptions/:id` | Get subscription |
| PUT | `/api/subscriptions/:id` | Update subscription |
| POST | `/api/subscriptions/:id/cancel` | Cancel subscription |
| POST | `/api/subscriptions/:id/renew` | Renew subscription |
| POST | `/api/subscriptions/:id/upgrade` | Upgrade plan |
| POST | `/api/subscriptions/:id/downgrade` | Downgrade plan |
| GET | `/api/subscriptions/:id/invoices` | Get invoices |
| GET | `/api/subscriptions/:id/events` | Get events |
| GET | `/api/subscriptions/stats` | Subscription stats |

### Plans

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/plans` | Create plan |
| GET | `/api/plans` | List plans |
| GET | `/api/plans/:id` | Get plan |
| GET | `/api/plans/:id/pricing` | Get pricing |
| PUT | `/api/plans/:id` | Update plan |
| DELETE | `/api/plans/:id` | Deactivate plan |
| GET | `/api/plans/compare` | Compare plans |

### Invoices

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/invoices` | List invoices |
| GET | `/api/invoices/:id` | Get invoice |
| GET | `/api/invoices/number/:number` | Get by number |
| POST | `/api/invoices/:id/pay` | Pay invoice |
| POST | `/api/invoices/:id/cancel` | Cancel invoice |
| GET | `/api/invoices/stats` | Invoice stats |
| GET | `/api/invoices/overdue` | Overdue invoices |

### Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/mrr` | MRR breakdown |
| GET | `/api/analytics/trends` | Subscription trends |
| GET | `/api/analytics/forecast` | Revenue forecast |

### System

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/ready` | Readiness check |
| GET | `/metrics` | Prometheus metrics |

## Data Models

### Subscription
```typescript
{
  publisherId: string;
  planId: string;
  status: 'active' | 'paused' | 'cancelled' | 'expired' | 'pending' | 'trial';
  billingCycle: 'monthly' | 'quarterly' | 'yearly';
  startDate: Date;
  endDate: Date;
  nextBillingDate: Date;
  trialEndDate?: Date;
  autoRenew: boolean;
  metadata?: Record<string, any>;
}
```

### Plan
```typescript
{
  name: string;
  type: 'starter' | 'professional' | 'enterprise' | 'custom';
  price: number;
  billingCycles: string[];
  features: string[];
  limits: {
    screens?: number;
    campaigns?: number;
    impressions?: number;
    users?: number;
    storage?: number;
  };
  isActive: boolean;
}
```

### Invoice
```typescript
{
  subscriptionId: string;
  publisherId: string;
  planId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled' | 'refunded';
  billingPeriodStart: Date;
  billingPeriodEnd: Date;
  dueDate: Date;
  paidDate?: Date;
  invoiceNumber: string;
  lineItems: LineItem[];
}
```

## Environment Variables

```env
# Service Configuration
PORT=5002
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/adbazaar_subscriptions

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Internal Service Authentication
INTERNAL_SERVICE_TOKEN=your-internal-token

# External Services
REZ_AUTH_SERVICE_URL=http://localhost:4002
REZ_WALLET_SERVICE_URL=http://localhost:4004
REZ_NOTIFICATION_SERVICE_URL=http://localhost:4011
```

## Quick Start

```bash
# Install dependencies
cd subscription-management
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev

# Start production server
npm run build
npm start
```

## Health Check

```bash
curl http://localhost:5002/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2026-06-07T10:00:00.000Z",
  "service": "subscription-management",
  "version": "1.0.0",
  "dependencies": {
    "mongodb": "connected",
    "redis": "connected"
  }
}
```

## API Examples

### Create Subscription
```bash
curl -X POST http://localhost:5002/api/subscriptions \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: your-token" \
  -d '{
    "publisherId": "pub_123",
    "planId": "plan_professional",
    "billingCycle": "monthly",
    "trialDays": 14
  }'
```

### Upgrade Subscription
```bash
curl -X POST http://localhost:5002/api/subscriptions/sub_456/upgrade \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: your-token" \
  -d '{
    "newPlanId": "plan_enterprise",
    "effectiveDate": "immediate",
    "preserveCredits": true
  }'
```

### Get Subscription Stats
```bash
curl http://localhost:5002/api/subscriptions/stats \
  -H "X-Internal-Token: your-token"
```

Response:
```json
{
  "success": true,
  "data": {
    "totalSubscriptions": 150,
    "activeSubscriptions": 120,
    "trialSubscriptions": 15,
    "cancelledSubscriptions": 10,
    "expiredSubscriptions": 5,
    "monthlyRecurringRevenue": 25000,
    "annualRecurringRevenue": 300000,
    "churnRate": 2.5,
    "growthRate": 15.3
  }
}
```

## Metrics

Prometheus metrics available at `/metrics`:

- `subscription_created_total` - Total subscriptions created
- `subscription_cancelled_total` - Total cancellations
- `subscription_renewed_total` - Total renewals
- `subscription_active_count` - Active subscriptions gauge
- `subscription_mrr_dollars` - Monthly recurring revenue
- `subscription_invoice_paid_total` - Total paid invoices
- `subscription_http_request_duration_seconds` - HTTP request latency

## Integration

### Internal Services (RABTUL)
- **Auth Service** (4002) - Token verification
- **Wallet Service** (4004) - Payment processing
- **Notification Service** (4011) - Email/push notifications

### Authentication
All internal API calls require the `X-Internal-Token` header:
```
X-Internal-Token: your-internal-service-token
```

## License

Proprietary - AdBazaar