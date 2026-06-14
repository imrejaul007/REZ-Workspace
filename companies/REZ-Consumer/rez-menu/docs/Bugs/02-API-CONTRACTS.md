# Bug Report: API Contract Layer (Layer 2)

**Audit Date:** 2026-04-12  
**Layer:** Routes, HTTP methods, request payloads, response shapes, API gateway routing  
**Status:** Multiple production-broken features

---

## H1 — Merchant wallet transaction list always renders empty {#h1}
> **Status:** ✅ FIXED

**Severity:** HIGH — broken in production right now  
**Impact:** Every merchant who opens the transaction history sees zero records.

**What is happening:**  
Backend (`rez-wallet-service/src/routes/merchantWalletRoutes.ts` line 59) returns:
```json
{
  "success": true,
  "data": [ ...transactions array... ],
  "pagination": { "total": 50, "page": 1, "hasMore": true }
}
```

Frontend (`rezmerchant/rez-merchant-master/services/api/wallet.ts` lines 96–113) reads:
```typescript
response.data?.transactions   // undefined — data IS the array, not an object
response.data?.pagination     // undefined — pagination is sibling of data, not inside it
```

Since `response.data` is the transactions array itself, `response.data.transactions` is always `undefined`. The list renders empty on every load.

**Files involved:**
- `rez-wallet-service/src/routes/merchantWalletRoutes.ts` (line 59)
- `rezmerchant/rez-merchant-master/services/api/wallet.ts` (lines 96–113)

**Fix (Option A — backend):**  
Change the backend response to:
```json
{ "success": true, "data": { "transactions": [...], "pagination": {...} } }
```

**Fix (Option B — frontend):**  
Change the frontend to read `response.data` directly as the array and `response.pagination` for pagination.

---

## H2 — Merchant cashback approve/reject are permanent 404s {#h2}
> **Status:** ✅ MISJUDGMENT — not a real bug

**Severity:** HIGH — core merchant workflow completely broken  
**Impact:** Merchants cannot approve or reject any cashback request.

**What is happening:**  
Frontend (`rezmerchant/rez-merchant-master/services/api/cashback.ts` lines 96–117) calls:
- `PUT merchant/cashback/{requestId}/approve`
- `PUT merchant/cashback/{requestId}/reject`

These routes exist in `src/merchantroutes/cashback.ts` (lines 205, 299) but NOT in `src/routes/merchant/cashback.ts` — the primary, actively-mounted route file with Joi validation.

If the server mounts `src/routes/merchant/cashback.ts`, both endpoints return **404 Not Found** on every call.

**Files involved:**
- `rezmerchant/rez-merchant-master/services/api/cashback.ts` (lines 96–117)
- `rezbackend/rez-backend-master/src/routes/merchant/cashback.ts` (MISSING approve/reject)
- `rezbackend/rez-backend-master/src/merchantroutes/cashback.ts` (lines 205, 299 — has them, but may not be mounted)

**Fix:**  
Add the missing routes to `src/routes/merchant/cashback.ts`:
```typescript
router.put('/:id/approve', merchantAuth, cashbackController.approveCashbackRequest);
router.put('/:id/reject', merchantAuth, cashbackController.rejectCashbackRequest);
```
Verify which cashback router is actively mounted in `server.ts` or `app.ts`.

---

## H3 — Bulk cashback action: `requestIds` vs `cashbackIds` field name mismatch {#h3}
> **Status:** ✅ MISJUDGMENT — not a real bug

**Severity:** HIGH — every bulk cashback action fails with 400  
**Impact:** Bulk approve/reject workflow silently broken. Returns 400 on every call.

**What is happening:**  
Frontend (`cashback.ts` line 29) sends:
```json
{ "requestIds": ["id1", "id2"], "action": "approve" }
```

Backend `src/routes/merchant/cashback.ts` (line 147) expects:
```json
{ "cashbackIds": ["id1", "id2"], "action": "approve" }
```

Backend uses `stripUnknown: true` in Joi validation. `requestIds` is silently stripped. `cashbackIds` is undefined. Validation fails with 400 on every call.

Note: `src/merchantroutes/cashback.ts` (line 381) uses `requestIds` — consistent with frontend. This confirms the two route files have diverged.

**Files involved:**
- `rezmerchant/rez-merchant-master/services/api/cashback.ts` (line 29)
- `rezbackend/rez-backend-master/src/routes/merchant/cashback.ts` (line 147)
- `rezbackend/rez-backend-master/src/merchantroutes/cashback.ts` (line 381)

**Fix:**  
Standardize on one field name. Recommend `cashbackIds` (more specific). Update both the frontend and the `merchantroutes` file to use `cashbackIds`.

---

## H4 — Cashback export: POST from frontend vs GET on backend {#h4}
> **Status:** ✅ FIXED

**Severity:** HIGH — export feature broken  
**Impact:** Every export attempt from merchant app → 405 Method Not Allowed.

**What is happening:**  
Frontend (`cashback.ts` line 195):
```typescript
this.post('merchant/cashback/export', params)  // sends as POST
```

Backend `src/routes/merchant/cashback.ts` (line 62):
```typescript
router.get('/export', ...)  // GET only
```

Backend `src/merchantroutes/cashback.ts` (line 744):
```typescript
router.get('/export', ...)  // also GET
```

Both backend files register `GET`. Frontend sends `POST`. Result: **405 Method Not Allowed** on every export.

**Files involved:**
- `rezmerchant/rez-merchant-master/services/api/cashback.ts` (line 195)
- `rezbackend/rez-backend-master/src/routes/merchant/cashback.ts` (line 62)

**Fix:**  
Choose one and align:
- Change backend to `router.post('/export', ...)` — preferred since export filters are complex query params better suited to POST body
- OR change frontend to use `this.get('merchant/cashback/export', { params })` — simpler, stays RESTful

---

## H5 — `paymentMethodType` vs `paymentMethod`: two services can't interoperate {#h5}
> **Status:** ✅ FIXED

**Severity:** HIGH — cross-service payment initiation fails 100%  
**Impact:** Payment microservice and monolith cannot exchange payment initiation calls.

**What is happening:**  
| Service | Field name | Values |
|---------|-----------|--------|
| Monolith `walletRoutes.ts` (line 305) | `paymentMethodType` (required) | `card`, `upi`, `wallet`, `netbanking` |
| `rez-payment-service/paymentRoutes.ts` (line 13) | `paymentMethod` (required) | `cod`, `wallet`, `razorpay`, `upi`, `card`, `netbanking` |

Different field names AND different enum values. No field mapping layer exists between them. Any service that calls the other for payment initiation will fail validation.

**Files involved:**
- `rezbackend/rez-backend-master/src/routes/walletRoutes.ts` (line 305)
- `rez-payment-service/src/routes/paymentRoutes.ts` (line 13)

**Fix:**  
Create a shared payment initiation DTO in `rez-shared/`:
```typescript
interface PaymentInitiateDTO {
  paymentMethod: 'cod' | 'wallet' | 'razorpay' | 'upi' | 'card' | 'netbanking';
  amount: number;
  // ...
}
```
Both services validate against this type. Monolith maps `paymentMethodType` → `paymentMethod` at its boundary.

---

## M10 — Cookie auth: merchant web sends cookie, backend only reads Bearer {#m10}
> **Status:** ⏳ DEFERRED — COOKIE_AUTH_ENABLED is currently false (hardcoded); dormant until enabled

**Severity:** MEDIUM  
**Impact:** Merchant web logins with `COOKIE_AUTH_ENABLED=true` hit 401 on every authenticated request.

**What is happening:**  
Merchant `client.ts` (lines 122–127): on web with `COOKIE_AUTH_ENABLED=true`, the `Authorization: Bearer` header is skipped — only the httpOnly cookie `rez_access_token` is sent.

Backend `authenticate` middleware: reads `Authorization: Bearer` only. No cookie fallback in this middleware path.

API Gateway `authMiddleware.ts`: also reads `Authorization: Bearer` only.

Result: merchant web requests with cookie-only auth hit 401. Note: `COOKIE_AUTH_ENABLED` is currently hardcoded to `false` in the merchant app — this bug is dormant but will activate if anyone enables it.

**Files involved:**
- `rezmerchant/rez-merchant-master/services/client.ts` (lines 122–127)
- `rezbackend/rez-backend-master/src/middleware/auth.ts` (extractToken — Bearer only path)
- `rez-api-gateway/src/shared/authMiddleware.ts`

**Fix:**  
Add cookie extraction to the merchant-facing middleware:
```typescript
const token = req.headers.authorization?.split(' ')[1] 
           || req.cookies?.rez_access_token;
```
Or keep `COOKIE_AUTH_ENABLED = false` and document it as intentional.

---

## Additional API Issues Found

### Cashback `generate-sample` route missing from primary router
- Frontend: `POST merchant/cashback/generate-sample`
- Not in `src/routes/merchant/cashback.ts`
- Only in `src/merchantroutes/cashback.ts` (line 609)
- 404 risk depending on which router is mounted

### `/api/wallet/payment` — same path, incompatible payloads
`rez-wallet-service` and monolith both handle `POST /api/wallet/payment` but expect completely different payloads:
- Wallet service: `{ amount, coinType, source, description, sourceId, idempotencyKey }`
- Monolith: `{ amount, orderId, storeId, storeName, description, items }`
Both are mounted — whichever service receives the request will reject the other's payload format.

### Merchant payout: `amountPaise` vs `amount`
`merchantPayoutRoutes.ts` expects `{ amountPaise, bankAccountId }`. Frontend wallet withdrawal (`wallet.ts` line 122) sends `{ amount }`. These are different endpoints, but if any component mixes them, `amountPaise` vs `amount` will cause a silent validation failure.

### Admin cashback refresh token route — possible 404
Admin token refresh (`apiClient.ts` line 43) hits `admin/auth/refresh-token`. If the backend admin auth router only has `/auth/refresh` (without `-token` suffix), the refresh endpoint returns 404, causing admin sessions to silently fail to renew.

### Pagination envelope inconsistency across services
| Service | Pagination shape |
|---------|----------------|
| `rez-wallet-service` wallet transactions | `{ data: { transactions, pagination: { total, page, hasMore } } }` |
| Monolith wallet transactions | No standard envelope, uses `totalPages` |
| `rez-wallet-service` merchant wallet | `{ data: [array], pagination: { ... } }` (sibling, not nested) |

Frontend code expecting `hasMore` from the monolith gets `undefined`. Code expecting `totalPages` from the microservice gets `undefined`.

### Client-side gateway routing gaps
`rezmerchant/client.ts` (lines 34–42) routes `merchant/*` to `rez-merchant-service` (port 4005). But:
- `merchant/cashback` → `rez-merchant-service` — but cashback routes may only exist in the monolith
- `merchant/coins` → `rez-merchant-service` — coin routes are in monolith's `merchantroutes/coins.ts`, not in the merchant service
- If `rez-merchant-service` doesn't proxy these to the monolith, all affected calls return 404 or connection refused
