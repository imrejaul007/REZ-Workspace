# REZ Merchant API — Strangler Fig Migration Plan

## Overview
Extract all `/api/merchant/*` routes from the monolith into `rez-merchant-service`.
The merchant app (Expo/React Native) calls ~55 unique endpoint groups.

## Architecture
- **Source**: Monolith at `rezbackend/rez-backend-master/src/merchantroutes/`
- **Target**: `rez-merchant-service` (Express HTTP API, port 4005)
- **Database**: Same MongoDB (shared collections)
- **Gateway**: `rez-api-gateway` routes `/api/merchant/*` to this service
- **Rollback**: Remove gateway route → traffic falls back to monolith catch-all

## Merchant App API Endpoints (Complete List)

### Phase 1 — Core (Must Have for Independence)

| # | Method | Monolith Path | Service Path | Status |
|---|--------|--------------|--------------|--------|
| 1 | POST | `/api/merchant/auth/register` | `/auth/register` | BUILT |
| 2 | POST | `/api/merchant/auth/login` | `/auth/login` | BUILT |
| 3 | POST | `/api/merchant/auth/refresh` | `/auth/refresh` | BUILT |
| 4 | GET | `/api/merchant/auth/me` | `/auth/me` | BUILT |
| 5 | PUT | `/api/merchant/auth/profile` | `/auth/profile` | BUILT |
| 6 | PUT | `/api/merchant/auth/change-password` | `/auth/change-password` | BUILT |
| 7 | POST | `/api/merchant/auth/logout` | `/auth/logout` | BUILT |
| 8 | POST | `/api/merchant/auth/forgot-password` | `/auth/forgot-password` | TODO |
| 9 | POST | `/api/merchant/auth/reset-password` | `/auth/reset-password` | TODO |
| 10 | POST | `/api/merchant/auth/verify-email` | `/auth/verify-email` | TODO |
| 11 | POST | `/api/merchant/auth/resend-verification` | `/auth/resend-verification` | TODO |
| 12 | GET | `/api/merchant/stores` | `/stores` | BUILT |
| 13 | GET | `/api/merchant/stores/active` | `/stores/active` | BUILT |
| 14 | GET | `/api/merchant/stores/:id` | `/stores/:id` | BUILT |
| 15 | POST | `/api/merchant/stores` | `/stores` | BUILT |
| 16 | PUT | `/api/merchant/stores/:id` | `/stores/:id` | BUILT |
| 17 | PATCH | `/api/merchant/stores/:id` | `/stores/:id` | BUILT |
| 18 | DELETE | `/api/merchant/stores/:id` | `/stores/:id` | BUILT |
| 19 | POST | `/api/merchant/stores/:id/activate` | `/stores/:id/activate` | BUILT |
| 20 | POST | `/api/merchant/stores/:id/deactivate` | `/stores/:id/deactivate` | BUILT |
| 21 | GET | `/api/merchant/products` | `/products` | TODO |
| 22 | GET | `/api/merchant/products/:id` | `/products/:id` | TODO |
| 23 | POST | `/api/merchant/products` | `/products` | TODO |
| 24 | PUT | `/api/merchant/products/:id` | `/products/:id` | TODO |
| 25 | DELETE | `/api/merchant/products/:id` | `/products/:id` | TODO |
| 26 | GET | `/api/merchant/products/categories` | `/products/categories` | TODO |
| 27 | GET | `/api/merchant/orders` (via dashboard) | `/orders` | TODO |
| 28 | GET | `/api/merchant/orders/:id` | `/orders/:id` | TODO |
| 29 | PATCH | `/api/merchant/orders/:id/status` | `/orders/:id/status` | TODO |

### Phase 2 — Dashboard & Analytics

| # | Method | Monolith Path | Service Path | Status |
|---|--------|--------------|--------------|--------|
| 30 | GET | `/api/merchant/dashboard` | `/dashboard` | TODO |
| 31 | GET | `/api/merchant/dashboard/metrics` | `/dashboard/metrics` | TODO |
| 32 | GET | `/api/merchant/dashboard/activity` | `/dashboard/activity` | TODO |
| 33 | GET | `/api/merchant/dashboard/top-products` | `/dashboard/top-products` | TODO |
| 34 | GET | `/api/merchant/dashboard/sales-data` | `/dashboard/sales-data` | TODO |
| 35 | GET | `/api/merchant/dashboard/low-stock` | `/dashboard/low-stock` | TODO |
| 36 | GET | `/api/merchant/dashboard/store-performance` | `/dashboard/store-performance` | TODO |
| 37 | GET | `/api/merchant/dashboard/action-items` | `/dashboard/action-items` | TODO |
| 38 | GET | `/api/merchant/dashboard/today-revenue` | `/dashboard/today-revenue` | TODO |
| 39 | GET | `/api/merchant/dashboard/top-items-today` | `/dashboard/top-items-today` | TODO |
| 40 | GET | `/api/merchant/dashboard/customer-payments` | `/dashboard/customer-payments` | TODO |
| 41 | GET | `/api/merchant/dashboard/recent-orders` | `/dashboard/recent-orders` | TODO |
| 42 | GET | `/api/merchant/analytics/overview` | `/analytics/overview` | TODO |
| 43 | GET | `/api/merchant/analytics/sales/*` | `/analytics/sales/*` | TODO |
| 44 | GET | `/api/merchant/analytics/revenue/*` | `/analytics/revenue/*` | TODO |
| 45 | GET | `/api/merchant/analytics/customers/*` | `/analytics/customers/*` | TODO |
| 46 | GET | `/api/merchant/analytics/products/*` | `/analytics/products/*` | TODO |
| 47 | GET | `/api/merchant/analytics/expenses` | `/analytics/expenses` | TODO |

### Phase 3 — Team & Wallet (Already Extracted)

| # | Method | Monolith Path | Service Path | Status |
|---|--------|--------------|--------------|--------|
| 48 | GET | `/api/merchant/team` | `/team` | TODO |
| 49 | GET | `/api/merchant/team/:id` | `/team/:id` | TODO |
| 50 | POST | `/api/merchant/team/invite` | `/team/invite` | TODO |
| 51 | GET | `/api/merchant/team/me/permissions` | `/team/me/permissions` | TODO |
| 52 | GET | `/api/merchant/wallet` | WALLET SERVICE | DONE |
| 53 | GET | `/api/merchant/wallet/stats` | WALLET SERVICE | DONE |
| 54 | POST | `/api/merchant/wallet/withdraw` | WALLET SERVICE | DONE |
| 55 | PUT | `/api/merchant/wallet/bank-details` | WALLET SERVICE | DONE |

### Phase 4 — Supporting Features

| # | Method | Monolith Path | Service Path | Status |
|---|--------|--------------|--------------|--------|
| 56 | GET/POST | `/api/merchant/categories/*` | `/categories/*` | TODO |
| 57 | GET/POST | `/api/merchant/offers/*` | `/offers/*` | TODO |
| 58 | GET/POST | `/api/merchant/cashback/*` | `/cashback/*` | TODO |
| 59 | GET/POST | `/api/merchant/events/*` | `/events/*` | TODO |
| 60 | GET/POST | `/api/merchant/services/*` | `/services/*` | TODO |
| 61 | GET/POST | `/api/merchant/notifications/*` | `/notifications/*` | TODO |
| 62 | POST | `/api/merchant/uploads/*` | `/uploads/*` | TODO |
| 63 | GET/POST | `/api/merchant/support/*` | `/support/*` | TODO |
| 64 | GET | `/api/merchant/liability/*` | `/liability/*` | TODO |
| 65 | GET/POST | `/api/merchant/sync/*` | `/sync/*` | TODO |
| 66 | GET/POST | `/api/merchant/audit/*` | `/audit/*` | TODO |
| 67 | GET/POST | `/api/merchant/profile/*` | `/profile/*` | TODO |
| 68 | GET/POST | `/api/merchant/purchase-orders/*` | `/purchase-orders/*` | TODO |
| 69 | GET/POST | `/api/merchant/suppliers/*` | `/suppliers/*` | TODO |
| 70 | GET/POST | `/api/merchant/trials/*` | `/trials/*` | TODO |
| 71 | GET/POST | `/api/merchant/dine-in/*` | `/dine-in/*` | TODO |
| 72 | GET/POST | `/api/merchant/videos/*` | `/videos/*` | TODO |

## Models Used (shared MongoDB collections)

| Model | Collection | Used By |
|-------|-----------|---------|
| Merchant | merchants | Auth, Profile, Dashboard |
| MerchantUser | merchantusers | Auth (team login) |
| Store | stores | Stores, Products, Orders |
| Product | products | Products, Dashboard |
| Order | orders | Orders, Dashboard, Analytics |
| Category | categories | Categories, Products |
| MerchantWallet | merchantwallets | Wallet Service (separate) |
| Notification | notifications | Notifications |
| Offer | offers | Offers |
| Review | reviews | Reviews |
| Event/EventBooking | events/eventbookings | Events |
| SupportTicket | supporttickets | Support |
| AuditLog | auditlogs | Audit |
| Expense | expenses | Analytics |
| PurchaseOrder | purchaseorders | Purchase Orders |
| Supplier | suppliers | Suppliers |

## Verification Checklist

### Pre-Deploy
- [ ] All Phase 1 routes implemented
- [ ] `tsc --noEmit` passes
- [ ] JWT auth matches monolith (JWT_MERCHANT_SECRET, same token format)
- [ ] Merchant + MerchantUser login both work
- [ ] Password hashing uses bcrypt (same as monolith)
- [ ] Account lockout after 5 failed attempts (same as monolith)
- [ ] Refresh token rotation works

### Gateway Routing
- [ ] `/api/merchant/auth/*` → merchant service
- [ ] `/api/merchant/stores/*` → merchant service
- [ ] `/api/merchant/products/*` → merchant service
- [ ] `/api/merchant/dashboard/*` → merchant service
- [ ] `/api/merchant/orders/*` → merchant service (via dashboard)
- [ ] `/api/merchant/wallet/*` → wallet service (ALREADY DONE)
- [ ] Everything else → monolith (catch-all)

### Post-Deploy Smoke Tests
```bash
# Health check
curl https://rez-merchant-service.onrender.com/health

# Auth - login
curl -X POST https://rez-api-gateway.onrender.com/api/merchant/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@merchant.com","password":"test123"}'

# Auth - me (with token)
curl https://rez-api-gateway.onrender.com/api/merchant/auth/me \
  -H "Authorization: Bearer <TOKEN>"

# Stores - list
curl https://rez-api-gateway.onrender.com/api/merchant/stores \
  -H "Authorization: Bearer <TOKEN>"

# Products - list
curl https://rez-api-gateway.onrender.com/api/merchant/products \
  -H "Authorization: Bearer <TOKEN>"

# Dashboard
curl https://rez-api-gateway.onrender.com/api/merchant/dashboard \
  -H "Authorization: Bearer <TOKEN>"
```

### Rollback Plan
1. Remove `/api/merchant/` location block from gateway nginx.conf
2. Push gateway change → all traffic falls back to monolith
3. No data migration needed (same database)

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| MONGODB_URI | Yes | Same as monolith |
| REDIS_URL | Yes | Same as monolith |
| JWT_MERCHANT_SECRET | Yes | Same as monolith (signs merchant tokens) |
| JWT_SECRET | No | Fallback token validation |
| JWT_ADMIN_SECRET | No | Admin token validation |
| SENTRY_DSN | No | Error tracking |
| NODE_ENV | Yes | production |
| PORT | No | Render overrides (default: 4005) |
