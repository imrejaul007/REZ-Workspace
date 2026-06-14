# REZ-Consumer to RABTUL-Technologies Integration Matrix

**Last Updated:** 2026-05-12  
**Status:** Integration Audit & Fixes Complete

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    REZ-Consumer App                             │
│                   (React Native/Expo)                            │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      │ All API Calls
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│              API Gateway (RABTUL-Technologies)                  │
│         https://rez-api-gateway.onrender.com                      │
└─────────────────────┬───────────────────────────────────────────┘
                      │
          ┌──────────┴──────────┬───────────────┬─────────────────┐
          │                      │             │                 │
          ▼                      ▼             ▼                 ▼
    ┌──────────┐         ┌──────────┐   ┌──────────┐     ┌──────────┐
    │  Auth   │         │  Wallet  │   │ Payment  │     │  Order  │
    │ Service │         │ Service  │   │ Service  │     │ Service │
    └──────────┘         └──────────┘   └──────────┘     └──────────┘
```

---

## Service Mapping

### RABTUL-Technologies Services → Consumer App Routes

| Service | URL | Consumer Routes | Status |
|---------|-----|-----------------|--------|
| **Auth Service** | `rez-auth-service.onrender.com` | `/user/auth/*` | ✅ Connected |
| **Wallet Service** | `rez-wallet-service-36vo.onrender.com` | `/wallet/*` | ✅ Connected |
| **Payment Service** | `rez-payment-service.onrender.com` | `/payment/*` | ✅ Connected |
| **Order Service** | `rez-order-service.onrender.com` | `/orders/*` | ✅ Connected |
| **Search Service** | `rez-search-service.onrender.com` | `/search/*` | ✅ Connected |
| **Catalog Service** | `rez-catalog-service-1.onrender.com` | `/products/*`, `/categories/*` | ✅ Connected |
| **Notifications** | `rez-notifications-service.onrender.com` | `/notifications/*` | ✅ Connected |

---

## Consumer App API Endpoints → Service Routing

### Authentication Flow
```
/user/auth/send-otp      → Auth Service  ✅
/user/auth/verify-otp    → Auth Service  ✅
/user/auth/logout       → Auth Service  ✅
/user/auth/me           → Auth Service  ✅
/user/auth/profile       → Auth Service  ✅
/user/auth/refresh-token → Auth Service  ✅
```

### Wallet Flow
```
/wallet/balance          → Wallet Service  ✅
/wallet/transactions     → Wallet Service  ✅
/wallet/withdraw         → Wallet Service  ✅
/wallet/payment          → Wallet Service  ✅
/wallet/gift/*           → Wallet Service  ✅
```

### Payment Flow
```
/payment/initiate        → Payment Service  ✅
/payment/verify          → Payment Service  ✅
/payment/refund          → Payment Service  ✅
```

### Order Flow
```
/orders                  → Order Service  ✅
/orders/:id             → Order Service  ✅
```

---

## Missing Services (Need Implementation)

The following services are called by REZ-Consumer but NOT in RABTUL-Technologies:

| Missing Service | Consumer Routes | Status |
|-----------------|-----------------|--------|
| **Articles Service** | `/articles/*` | ❌ Not Found |
| **Bill Payments** | `/bill-payments/*` | ❌ Not Found |
| **Cashback Service** | `/cashback/*` | ❌ Not Found |
| **Coupons Service** | `/coupons/*` | ❌ Not Found |
| **Discounts Service** | `/discounts/*` | ❌ Not Found |
| **Events Service** | `/events/*` | ❌ Not Found |
| **Gamification** | `/achievements/*`, `/challenges/*` | ❌ Not Found |
| **Referral Service** | `/referral/*` | ❌ Not Found |
| **Reviews Service** | `/reviews/*` | ❌ Not Found |

---

## API Gateway Routes Configuration

```typescript
// Auth Service
app.use('/api/auth', createProxy(SERVICES.auth));
app.use('/user/auth', createProxy(SERVICES.auth));

// Wallet Service
app.use('/api/wallet', createProxy(SERVICES.wallet));
app.use('/wallet', createProxy(SERVICES.wallet));

// Payment Service
app.use('/api/payment', createProxy(SERVICES.payment));
app.use('/payment', createProxy(SERVICES.payment));

// Order Service
app.use('/api/orders', createProxy(SERVICES.order));
app.use('/orders', createProxy(SERVICES.order));

// Search Service
app.use('/search', createProxy(SEARCH_SERVICE_URL));
app.use('/api/search', createProxy(SEARCH_SERVICE_URL));

// Catalog/Products
app.use('/products', createProxy(CATALOG_SERVICE_URL));
app.use('/categories', createProxy(CATALOG_SERVICE_URL));
```

---

## Environment Variables Required

```bash
# Gateway
EXPO_PUBLIC_API_BASE_URL=https://rez-api-gateway.onrender.com/api

# Direct Service URLs (fallback)
EXPO_PUBLIC_AUTH_SERVICE_URL=https://rez-auth-service.onrender.com
EXPO_PUBLIC_WALLET_SERVICE_URL=https://rez-wallet-service-36vo.onrender.com
EXPO_PUBLIC_PAYMENT_SERVICE_URL=https://rez-payment-service.onrender.com
EXPO_PUBLIC_ORDER_SERVICE_URL=https://rez-order-service.onrender.com
EXPO_PUBLIC_SEARCH_SERVICE_URL=https://rez-search-service.onrender.com
EXPO_PUBLIC_CATALOG_SERVICE_URL=https://rez-catalog-service-1.onrender.com
EXPO_PUBLIC_NOTIFICATION_SERVICE_URL=https://rez-notifications-service.onrender.com
```

---

## Health Check Endpoints

| Service | Health Endpoint |
|---------|-----------------|
| API Gateway | `/health` |
| Auth Service | `/health` |
| Wallet Service | `/health` |
| Payment Service | `/health` |
| Order Service | `/health` |

---

## Authentication

### Consumer App → Gateway
- Uses Bearer JWT token in `Authorization` header
- Gateway validates JWT and forwards `X-User-Id` header to services

### Gateway → Services
- Services use Bearer JWT for user-facing endpoints
- Internal endpoints may use `X-Internal-Token` header

---

## Next Steps

1. **Create Missing Services** - Implement articles, cashback, coupons, discounts services
2. **Add to Gateway** - Route missing services through API Gateway
3. **Update Consumer App** - Point to gateway for all calls
4. **Test Integration** - Verify all flows work end-to-end
