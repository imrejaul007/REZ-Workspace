# RABTUL-Technologies - Complete Service Documentation

> **Version:** 2.0.0
> **Last Updated:** 2026-05-13
> **Total Services:** 40

---

## Table of Contents

1. [Platform Overview](#platform-overview)
2. [Core Business Services](#core-business-services)
3. [Infrastructure Services](#infrastructure-services)
4. [Resilience Services](#resilience-services)
5. [BuzzLocal Services](#buzzlocal-services)
6. [Shared Libraries](#shared-libraries)
7. [Service Dependencies](#service-dependencies)
8. [Environment Variables](#environment-variables)

---

## Platform Overview

### Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js 20.x |
| Language | TypeScript |
| Database | MongoDB, PostgreSQL |
| Cache | Redis |
| Queue | BullMQ, Kafka |
| API | REST, WebSocket |
| Auth | JWT, OTP, TOTP |
| Monitoring | Sentry, Prometheus |

### Service Categories

| Category | Count | Examples |
|----------|--------|-----------|
| Core Business | 8 | Auth, Payment, Wallet |
| Infrastructure | 12 | Gateway, Scheduler, Secrets |
| Resilience | 6 | Circuit Breaker, Retry, DLQ |
| BuzzLocal | 9 | Social discovery |
| Contracts | 1 | Shared types |

---

## Core Business Services

### 1. rez-auth-service (Port 4002)

**Purpose:** Authentication & Identity
**Database:** MongoDB (rez_auth)
**Cache:** Redis

#### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | User registration |
| POST | `/api/v1/auth/login` | Login with email/password |
| POST | `/api/v1/auth/otp/send` | Send OTP via SMS/WhatsApp |
| POST | `/api/v1/auth/otp/verify` | Verify OTP |
| POST | `/api/v1/auth/mfa/verify-otp` | MFA verification |
| POST | `/api/v1/auth/login-pin` | PIN login |
| POST | `/api/v1/auth/set-pin` | Set/update PIN |
| POST | `/api/v1/auth/has-pin` | Check PIN exists |
| POST | `/api/v1/auth/logout` | Logout |
| POST | `/api/v1/auth/refresh` | Refresh token |
| GET | `/api/v1/auth/me` | Get current user |
| PATCH | `/api/v1/auth/profile` | Update profile |

#### Rate Limits

| Endpoint | Limit |
|----------|-------|
| OTP Send | 5/min per phone |
| OTP Verify | 5/min per phone |
| Login | 10/min per IP |
| PIN Check | 60/min per IP |

#### Environment Variables

```bash
JWT_SECRET=<secret>
JWT_ADMIN_SECRET=<secret>
JWT_MERCHANT_SECRET=<secret>
MONGODB_URI=mongodb://...
REDIS_URL=redis://...
SMS_API_KEY=<vendor-api-key>
```

---

### 2. rez-payment-service (Port 4001)

**Purpose:** Payment Processing
**Database:** MongoDB (rez_payments)

#### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payments/initiate` | Start payment |
| POST | `/api/payments/:id/capture` | Capture payment |
| GET | `/api/payments/:id` | Get payment status |
| POST | `/api/payments/:id/refund` | Refund payment |
| GET | `/api/payments/:id/history` | Payment history |
| POST | `/api/webhooks/razorpay` | Razorpay webhook |
| POST | `/api/webhooks/stripe` | Stripe webhook |

#### Features

- Razorpay integration
- Stripe integration
- UPI payments
- Payment gateway abstraction
- Webhook handling with signature verification
- Idempotency keys

---

### 3. rez-wallet-service (Port 4004)

**Purpose:** Digital Wallet
**Database:** MongoDB (rez_wallet)

#### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/wallets/:id` | Get wallet |
| GET | `/api/wallets/:id/balance` | Get balance |
| POST | `/api/wallets/:id/credit` | Add funds |
| POST | `/api/wallets/:id/debit` | Withdraw funds |
| GET | `/api/wallets/:id/transactions` | Transaction history |
| POST | `/api/wallets/:id/transfer` | Transfer between wallets |

#### Wallet Types

| Type | Description |
|------|-------------|
| `user` | Consumer wallet |
| `merchant` | Business wallet |
| `platform` | Platform reserve |

---

### 4. rez-order-service (Port 4005)

**Purpose:** Order Management
**Database:** MongoDB (rez_orders)

#### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/orders` | Create order |
| GET | `/api/orders/:id` | Get order |
| PUT | `/api/orders/:id/status` | Update status |
| GET | `/api/orders/user/:userId` | User orders |
| GET | `/api/orders/merchant/:merchantId` | Merchant orders |

#### Order Status

```
created → confirmed → preparing → ready → delivered → completed
                ↓
            cancelled
```

---

### 5. rez-catalog-service (Port 4006)

**Purpose:** Product Catalog
**Database:** MongoDB (rez_catalog)

#### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List products |
| GET | `/api/products/:id` | Get product |
| POST | `/api/products` | Create product |
| PUT | `/api/products/:id` | Update product |
| DELETE | `/api/products/:id` | Delete product |
| GET | `/api/categories` | List categories |

---

### 6. rez-search-service (Port 4007)

**Purpose:** Search & Discovery
**Database:** Elasticsearch

#### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/search` | Search products |
| GET | `/api/search/suggestions` | Autocomplete |
| GET | `/api/search/filters` | Filter options |

---

### 7. rez-profile-service (Port 4008)

**Purpose:** User Profiles
**Database:** MongoDB (rez_profiles)

#### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/profiles/:id` | Get profile |
| PUT | `/api/profiles/:id` | Update profile |
| GET | `/api/profiles/:id/preferences` | Get preferences |
| PUT | `/api/profiles/:id/preferences` | Update preferences |

---

### 8. rez-notifications-service (Port 4009)

**Purpose:** Notifications
**Queue:** BullMQ

#### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/notifications/send` | Send notification |
| GET | `/api/notifications/:userId` | User notifications |
| PUT | `/api/notifications/:id/read` | Mark as read |

#### Channels

- Push notifications
- SMS
- Email
- In-app

---

### 9. rez-analytics-service (Port 4010)

**Purpose:** Business Intelligence

#### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/events` | Track events |
| GET | `/api/analytics/reports` | Generate reports |
| GET | `/api/analytics/dashboard` | Dashboard metrics |

---

### 10. rez-audit-service (Port 4011)

**Purpose:** Audit Logging

#### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/audit/log` | Create audit entry |
| GET | `/api/audit/logs` | Query logs |
| GET | `/api/audit/export` | Export logs |

---

## Infrastructure Services

### 11. api-gateway (Port 3000)

**Purpose:** API Gateway & Routing

#### Routes

| Path | Service |
|------|---------|
| `/api/auth/*` | Auth Service |
| `/api/payment/*` | Payment Service |
| `/api/wallet/*` | Wallet Service |
| `/api/orders/*` | Order Service |
| `/api/catalog/*` | Catalog Service |
| `/api/intent/*` | Intent Service |
| `/api/ads/*` | Ad Platform |

#### Security

- JWT validation
- Rate limiting (100 req/min)
- Helmet security headers
- CORS with explicit origins
- Request ID propagation

---

### 12. REZ-observability-platform (Port 4015)

**Purpose:** Monitoring & Alerting

#### Features

- Structured logging
- Metrics collection
- Alert management
- Dashboards
- APM integration

---

### 13. REZ-policy-engine (Port 4016)

**Purpose:** Business Rules

#### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/rules/evaluate` | Evaluate rule |
| GET | `/api/rules` | List rules |
| POST | `/api/rules` | Create rule |

---

### 14. REZ-secrets-manager (Port 4017)

**Purpose:** Secrets Management

#### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/secrets/:key` | Get secret |
| POST | `/api/secrets` | Create secret |
| DELETE | `/api/secrets/:key` | Delete secret |

---

### 15. REZ-scheduler-service (Port 4020)

**Purpose:** Cron Jobs

#### Features

- Cron expression parsing
- One-time jobs
- Recurring jobs
- Job history

---

### 16. REZ-notifications-hub (Port 4021)

**Purpose:** Unified Notifications

#### Features

- Channel routing
- Template management
- Delivery tracking
- Preference management

---

### 17. REZ-developer-platform (Port 4022)

**Purpose:** Developer Tools

#### Features

- API documentation
- SDK generation
- Webhook testing
- Sandbox environment

---

### 18. REZ-cross-wallet-identity (Port 4023)

**Purpose:** Multi-Wallet Identity

---

## Resilience Services

### 19. REZ-circuit-breaker

**Purpose:** Fault Tolerance

#### States

```
CLOSED → Normal operation
   ↓
OPEN → Reject requests (after failures)
   ↓
HALF-OPEN → Test recovery
   ↓
CLOSED or OPEN
```

#### Configuration

```javascript
{
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 30000, // ms
  resetTimeout: 60000
}
```

---

### 20. REZ-retry-service

**Purpose:** Auto-Retry Failed Operations

#### Configuration

```javascript
{
  maxAttempts: 3,
  backoff: [1000, 2000, 4000], // ms
  retryOn: ['ECONNRESET', 'ETIMEDOUT']
}
```

---

### 21. REZ-idempotency-service

**Purpose:** Prevent Duplicate Operations

#### Features

- Redis-based idempotency keys
- Configurable TTL
- Automatic cleanup

---

### 22. REZ-dlq-service

**Purpose:** Dead Letter Queue

#### Features

- Failed message capture
- Retry scheduling
- Manual intervention
- Alerting

---

## BuzzLocal Services

### 23-31. BuzzLocal Platform

| Service | Purpose |
|---------|---------|
| BuzzLocal Discovery | Local search |
| BuzzLocal Social | Social features |
| BuzzLocal Reviews | Ratings & reviews |
| BuzzLocal Rewards | Loyalty program |
| BuzzLocal Messaging | In-app messaging |
| BuzzLocal Stories | Ephemeral content |
| BuzzLocal Live | Live streaming |
| BuzzLocal Stories | Stories feature |
| BuzzLocal Stories | Additional features |

---

## Shared Libraries

### rez-contracts

**Purpose:** Shared TypeScript types and Zod schemas

#### Packages

```typescript
// Types
import { User, Order, Payment } from '@rez/contracts';

// Schemas
import { userSchema, orderSchema } from '@rez/contracts';

// FSM helpers
import { paymentTransitions } from '@rez/contracts';
```

---

## Service Dependencies

```
┌─────────────────────────────────────────────────────────────────┐
│                        API Gateway                                │
└──────┬──────────┬──────────┬──────────┬──────────┬─────────────┘
       │          │          │          │          │
   ┌───▼───┐ ┌───▼───┐ ┌───▼───┐ ┌───▼───┐ ┌───▼───┐
   │ Auth  │ │Payment│ │Wallet │ │ Order │ │Catalog│
   │4002   │ │4001   │ │4004   │ │4005   │ │4006   │
   └───┬───┘ └───┬───┘ └───┬───┘ └───┬───┘ └───┬───┘
       │          │          │          │          │
   ┌───▼─────────▼─────────▼─────────▼─────────▼───┐
   │              MongoDB / Redis                  │
   └───────────────────────────────────────────────┘
```

---

## Environment Variables

### Required for All Services

```bash
NODE_ENV=production
MONGODB_URI=mongodb://user:pass@host:27017/db
REDIS_URL=redis://:pass@host:6379
INTERNAL_SERVICE_TOKENS_JSON={"service":"token"}
ALLOWED_ORIGINS=https://rez.money,https://admin.rez.money
```

### Service-Specific

| Service | Variables |
|---------|-----------|
| Auth | JWT_SECRET, OTP_PROVIDER_API_KEY |
| Payment | RAZORPAY_KEY, STRIPE_KEY |
| Observability | SENTRY_DSN, PROMETHEUS_URL |
| Secrets | ENCRYPTION_KEY |

---

## Port Reference

| Service | Port | Protocol |
|---------|------|----------|
| api-gateway | 3000 | HTTP |
| rez-auth-service | 4002 | HTTP |
| rez-payment-service | 4001 | HTTP |
| rez-wallet-service | 4004 | HTTP |
| rez-order-service | 4005 | HTTP |
| rez-catalog-service | 4006 | HTTP |
| rez-search-service | 4007 | HTTP |
| rez-profile-service | 4008 | HTTP |
| rez-notifications-service | 4009 | HTTP |
| rez-analytics-service | 4010 | HTTP |
| rez-audit-service | 4011 | HTTP |
| REZ-observability-platform | 4015 | HTTP |
| REZ-policy-engine | 4016 | HTTP |
| REZ-secrets-manager | 4017 | HTTP |
| REZ-scheduler-service | 4020 | HTTP |

---

## Quick Reference

### Health Check

```bash
curl http://localhost:4002/health
# {"status":"ok","service":"auth","version":"1.0.0"}
```

### Create Internal Token

```bash
INTERNAL_SERVICE_TOKENS_JSON='{"my-service":"my-secret-token"}'
```

### Redis Connection

```bash
redis-cli -u redis://:password@host:6379
```

---

**Document Owner:** RABTUL-Technologies Team
**Next Review:** 2026-06-13
