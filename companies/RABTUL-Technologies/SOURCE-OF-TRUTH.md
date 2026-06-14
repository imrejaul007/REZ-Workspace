# RABTUL-Technologies Source of Truth

**Last Updated:** 2026-05-12  
**Version:** 1.0.0

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Services Directory](#services-directory)
3. [API Endpoints Matrix](#api-endpoints-matrix)
4. [Consumer App Integration](#consumer-app-integration)
5. [Service Communication](#service-communication)
6. [Database Schemas](#database-schemas)
7. [Environment Variables](#environment-variables)
8. [Deployment](#deployment)
9. [Monitoring](#monitoring)
10. [Security](#security)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  REZ-Consumer App (React Native)  │  Merchant App  │  Admin Dashboard    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           API GATEWAY                                       │
│                    https://rez-api-gateway.onrender.com                      │
│                                                                             │
│  - Authentication (JWT validation)                                          │
│  - Rate Limiting                                                           │
│  - Request Routing                                                         │
│  - CORS Management                                                         │
│  - Security Headers (Helmet)                                                │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
          ┌─────────────────────────────┼─────────────────────────────┐
          │                             │                         │
          ▼                             ▼                         ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Core Services  │    │ Business Logic  │    │  Infrastructure  │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ - Auth         │    │ - Articles     │    │ - Notifications │
│ - Wallet       │    │ - Bill Payments│    │ - Analytics    │
│ - Payment      │    │ - Cashback     │    │ - Audit        │
│ - Order        │    │ - Gamification │    │ - Scheduler    │
│ - Catalog      │    │ - Creator      │    │ - DLQ          │
│ - Search       │    │ - Booking      │    │ - Retry        │
│ - Profile      │    │ - Delivery     │    │ - Circuit Breaker│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## Services Directory

### Core Services (8)

| Service | Repository | Port | Database | Description |
|--------|------------|------|----------|-------------|
| **rez-auth-service** | `rez-auth-service/` | 4001 | MongoDB | Authentication, OTP, JWT |
| **rez-wallet-service** | `rez-wallet-service/` | 4002 | MongoDB | Coins, cashback, transactions |
| **rez-payment-service** | `rez-payment-service/` | 4003 | MongoDB | Razorpay, refunds |
| **rez-order-service** | `rez-order-service/` | 4004 | MongoDB | Orders, cart |
| **rez-catalog-service** | `rez-catalog-service/` | 4005 | MongoDB | Products, categories |
| **rez-search-service** | `rez-search-service/` | 4006 | MongoDB | Full-text search |
| **rez-profile-service** | `rez-profile-service/` | 4007 | MongoDB | User profiles |
| **rez-booking-service** | `rez-booking-service/` | 4008 | MongoDB | Restaurant, hotel, travel |

### Business Logic Services (6)

| Service | Repository | Port | Database | Description |
|--------|------------|------|----------|-------------|
| **rez-articles-service** | `rez-articles-service/` | 4010 | MongoDB | Articles, categories |
| **rez-bill-payments-service** | `rez-bill-payments-service/` | 4030 | MongoDB | Bill payments |
| **rez-cashback-service** | `rez-cashback-service/` | 4040 | MongoDB | Cashback management |
| **rez-gamification-service** | `rez-gamification-service/` | 4050 | MongoDB | Achievements, challenges |
| **rez-creator-earnings-service** | `rez-creator-earnings-service/` | 4060 | MongoDB | Creator dashboard |
| **rez-delivery-service** | `rez-delivery-service/` | 4009 | MongoDB | Delivery tracking |

### Infrastructure Services (9)

| Service | Repository | Description |
|--------|------------|-------------|
| **rez-notifications-service** | `rez-notifications-service/` | Push notifications |
| **rez-analytics-service** | `rez-analytics-service/` | Event tracking |
| **REZ-notifications-hub** | `REZ-notifications-hub/` | Notification routing |
| **rez-audit-service** | `rez-audit-service/` | Audit logging |
| **rez-scheduler-service** | `rez-scheduler-service/` | Cron jobs |
| **REZ-dlq-service** | `REZ-dlq-service/` | Dead letter queue |
| **REZ-retry-service** | `REZ-retry-service/` | Retry logic |
| **REZ-circuit-breaker** | `REZ-circuit-breaker/` | Resilience pattern |
| **REZ-idempotency-service** | `REZ-idempotency-service/` | Idempotency keys |

### Internal Services (4)

| Service | Repository | Description |
|--------|------------|-------------|
| **REZ-secrets-manager** | `REZ-secrets-manager/` | Secrets management |
| **REZ-policy-engine** | `REZ-policy-engine/` | Policy enforcement |
| **REZ-observability-platform** | `REZ-observability-platform/` | Monitoring |
| **REZ-developer-platform** | `REZ-developer-platform/` | Dev tools |

---

## API Endpoints Matrix

### Gateway Routes → Services

| Gateway Route | Service | Auth Required |
|--------------|---------|--------------|
| `/user/auth/*` | Auth Service | No (public endpoints) |
| `/wallet/*` | Wallet Service | JWT Bearer |
| `/payment/*` | Payment Service | JWT Bearer |
| `/orders/*` | Order Service | JWT Bearer |
| `/products/*` | Catalog Service | No |
| `/categories/*` | Catalog Service | No |
| `/search/*` | Search Service | No |
| `/articles/*` | Articles Service | No |
| `/bills/*` | Bill Payments Service | JWT Bearer |
| `/bill-payments/*` | Bill Payments Service | JWT Bearer |
| `/cashback/*` | Cashback Service | JWT Bearer |
| `/achievements/*` | Gamification Service | JWT Bearer |
| `/challenges/*` | Gamification Service | JWT Bearer |
| `/badges/*` | Gamification Service | JWT Bearer |
| `/missions/*` | Gamification Service | JWT Bearer |
| `/leaderboard/*` | Gamification Service | No |
| `/creators/*` | Creator Earnings Service | JWT Bearer |
| `/bookings/*` | Booking Service | JWT Bearer |
| `/notifications/*` | Notifications Service | JWT Bearer |
| `/events/*` | Analytics Service | JWT Bearer |

---

## Consumer App Integration

### REZ-Consumer App → Services

```
REZ-Consumer App (237 screens)
         │
         ├─► API Gateway ─────────────────────────┐
         │                                      │
         ├─► Auth Service (direct)              │
         ├─► Wallet Service (direct)             │
         ├─► Payment Service (direct)            │
         ├─► Search Service (direct)             │
         └─► Catalog Service (direct)            │
                                                  │
                              ┌───────────────────┘
                              ▼
                    RABTUL-Technologies
                    (All Backend Services)
```

### Environment Variables (REZ-Consumer)

```bash
# API Gateway
EXPO_PUBLIC_API_BASE_URL=https://rez-api-gateway.onrender.com/api

# Core Services
EXPO_PUBLIC_AUTH_SERVICE_URL=https://rez-auth-service.onrender.com
EXPO_PUBLIC_WALLET_SERVICE_URL=https://rez-wallet-service-36vo.onrender.com
EXPO_PUBLIC_PAYMENT_SERVICE_URL=https://rez-payment-service.onrender.com
EXPO_PUBLIC_ORDER_SERVICE_URL=https://rez-order-service.onrender.com
EXPO_PUBLIC_SEARCH_SERVICE_URL=https://rez-search-service.onrender.com
EXPO_PUBLIC_CATALOG_SERVICE_URL=https://rez-catalog-service-1.onrender.com

# Additional Services
EXPO_PUBLIC_ARTICLES_SERVICE_URL=https://rez-articles-service.onrender.com
EXPO_PUBLIC_BILL_PAYMENTS_SERVICE_URL=https://rez-bill-payments-service.onrender.com
EXPO_PUBLIC_CASHBACK_SERVICE_URL=https://rez-cashback-service.onrender.com
EXPO_PUBLIC_GAMIFICATION_SERVICE_URL=https://rez-gamification-service.onrender.com
EXPO_PUBLIC_CREATOR_EARNINGS_SERVICE_URL=https://rez-creator-earnings-service.onrender.com
EXPO_PUBLIC_BOOKING_SERVICE_URL=https://rez-booking-service.onrender.com
EXPO_PUBLIC_NOTIFICATION_SERVICE_URL=https://rez-notifications-service.onrender.com
```

---

## Service Communication

### Internal Service Tokens

Services communicate with each other using internal tokens:

```typescript
// Header: X-Internal-Token
// Stored in: INTERNAL_SERVICE_TOKENS_JSON

{
  "auth-service": "token_xxx",
  "wallet-service": "token_yyy",
  "payment-service": "token_zzz"
}
```

### Service-to-Service Calls

```
┌──────────────┐      X-Internal-Token      ┌──────────────┐
│ Auth Service │ ─────────────────────────► │ Wallet Svc  │
└──────────────┘                            └──────────────┘
        │                                          │
        │ JWT (user request)                       │ JWT
        ▼                                          ▼
┌──────────────┐                            ┌──────────────┐
│ Gateway     │                            │ Gateway     │
└──────────────┘                            └──────────────┘
```

---

## Database Schemas

### MongoDB Collections

| Service | Collections |
|---------|-------------|
| Auth | `users`, `sessions`, `otps`, `refresh_tokens` |
| Wallet | `wallets`, `transactions`, `coins` |
| Payment | `payments`, `refunds`, `razorpay_orders` |
| Order | `orders`, `order_items`, `carts` |
| Catalog | `products`, `categories`, `stores` |
| Articles | `articles`, `categories` |
| Bill Payments | `bills`, `providers`, `transactions` |
| Cashback | `cashbacks`, `campaigns` |
| Gamification | `achievements`, `badges`, `challenges`, `missions` |
| Creator | `creators`, `picks`, `earnings` |

---

## Environment Variables

### Required for All Services

```bash
NODE_ENV=production|development
PORT=4001
MONGODB_URI=mongodb://...
JWT_SECRET=<strong-secret>
REDIS_URL=redis://localhost:6379
SENTRY_DSN=https://...
```

### Service-Specific

```bash
# Auth Service
OTP_EXPIRY=300
JWT_EXPIRY=7d

# Payment Service
RAZORPAY_KEY_ID=rzp_xxx
RAZORPAY_KEY_SECRET=xxx
RAZORPAY_WEBHOOK_SECRET=xxx

# Gateway
INTERNAL_SERVICE_TOKENS_JSON={"service":"token"}
ALLOWED_ORIGINS=https://app.rez.com,https://admin.rez.com
```

---

## Deployment

### Render.com Services

All services are deployed on Render.com with:

- **Auto-sleep:** Disabled for API services
- **Health check:** `/health` endpoint
- **Environment:** Production

### Service URLs

| Service | Production URL |
|--------|---------------|
| API Gateway | `https://rez-api-gateway.onrender.com` |
| Auth | `https://rez-auth-service.onrender.com` |
| Wallet | `https://rez-wallet-service-36vo.onrender.com` |
| Payment | `https://rez-payment-service.onrender.com` |
| Order | `https://rez-order-service.onrender.com` |
| Catalog | `https://rez-catalog-service-1.onrender.com` |
| Search | `https://rez-search-service.onrender.com` |

---

## Monitoring

### Health Checks

All services expose `/health` endpoint:

```json
{
  "status": "healthy",
  "service": "service-name",
  "timestamp": "2026-05-12T00:00:00.000Z"
}
```

### Observability

- **Sentry:** Error tracking
- **Logs:** Morgan combined format
- **Metrics:** `/metrics` endpoint

---

## Security

### Headers (Helmet)

- HSTS
- X-Frame-Options
- X-Content-Type-Options
- Content-Security-Policy

### Rate Limiting

- Global: 100 requests/minute
- Auth: 5 requests/minute (OTP)

### CORS

- Configured origins only in production
- Credentials enabled

---

## Change Log

| Date | Version | Changes |
|------|---------|---------|
| 2026-05-12 | 1.0.0 | Initial SOT with 23 services |
| 2026-05-12 | 1.0.0 | Added 5 new services (articles, bill-payments, cashback, gamification, creator-earnings) |

---

## Maintenance

### Adding a New Service

1. Create service in `RABTUL-Technologies/`
2. Add routes to API Gateway
3. Add environment variables to consumer app
4. Update this document
5. Update API documentation

### Updating Existing Service

1. Make changes in service directory
2. Deploy to Render
3. Test endpoints
4. Update documentation if API changes

---

## Support

For questions or issues, contact the platform team.
