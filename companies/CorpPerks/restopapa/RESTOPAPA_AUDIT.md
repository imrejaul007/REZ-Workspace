# ReStopapa / RestoPapa - B2B Platform Audit

**Version:** 2.0
**Date:** May 16, 2026
**Auditor:** Claude Code
**Product:** ReStopapa (B2B Restaurant Platform with nextaBizz Integration)

---

## Product Overview

**ReStopapa** is a standalone B2B restaurant platform that integrates with nextaBizz for procurement.

### Architecture
```
ReStopapa (B2B) ←→ nextaBizz (Procurement)
```

### Use Cases
| Use Case | Description |
|----------|-------------|
| **Standalone** | Restaurant uses ReStopapa directly |
| **Via nextaBizz** | Inventory syncs to nextaBizz for procurement |
| **API Integration** | ReZ Merchant calls ReStopapa APIs |

---

## Issues Fixed (May 16, 2026)

### CRITICAL Issues Fixed

| ID | Issue | Fix | File |
|----|-------|-----|------|
| **FIX-1** | All backend modules commented out | Enabled all modules | app.module.ts |
| **FIX-2** | Webhook signature always returns true | Implemented HMAC verification | integration.service.ts |
| **FIX-3** | timingSafeEqual can throw | Added buffer length check | webhook.controller.ts |
| **FIX-4** | Amount tampering possible | Server-side validation + idempotency | payment.service.ts |
| **FIX-5** | Refund amount not validated | Added validation | payment.service.ts |
| **FIX-6** | No nextaBizz webhook sender | Created service | nextabizz-webhook.service.ts |

---

## Security Fixes Applied

### 1. Module Registration (FIX-1)
**Issue:** All backend modules were commented out - auth, payments, etc. didn't work.

**Fix:** Enabled all modules in app.module.ts:
- AuthModule
- RestaurantsModule
- EmployeesModule
- JobsModule
- VendorsModule
- DiscussionsModule
- PaymentsModule
- UploadsModule
- AnalyticsModule

### 2. Webhook Signature Verification (FIX-2)
**Issue:** `verifyWebhookSignature` always returned `true` - security bypass.

**Fix:** Implemented proper HMAC-SHA256 verification:
```typescript
const expectedSignature = crypto
  .createHmac('sha256', secret)
  .update(payload, 'utf8')
  .digest('hex');
return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
```

### 3. Timing-Safe Comparison (FIX-3)
**Issue:** `crypto.timingSafeEqual` throws if buffers have different lengths.

**Fix:** Added length check before comparison:
```typescript
if (signatureBuffer.length !== expectedBuffer.length) {
  return false;
}
return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
```

### 4. Payment Amount Tampering (FIX-4)
**Issue:** Client could send arbitrary amount - ₹1 could become ₹10000.

**Fix:** Server-side amount validation:
- Added MIN_AMOUNT (₹1) and MAX_AMOUNT (₹10L)
- Support for plan names (server-calculated prices)
- Idempotency key to prevent duplicate orders
- Server stores and validates amount, not client

### 5. Refund Validation (FIX-5)
**Issue:** Refund amount not validated - could exceed payment amount.

**Fix:** Added refund validation:
```typescript
if (refundAmount > maxRefundAmount) {
  throw new BadRequestException(`Refund amount cannot exceed ₹${maxRefundAmount / 100}`);
}
if (refundAmount <= 0) {
  throw new BadRequestException('Refund amount must be positive');
}
```

### 6. NextaBizz Webhook Sender (FIX-6)
**Issue:** No integration to send webhooks TO nextaBizz.

**Fix:** Created NextaBizzWebhookService:
- `sendLowStockAlert()` - Inventory low stock
- `sendOutOfStockAlert()` - Out of stock
- `sendStockUpdated()` - Stock level changed
- `sendOrderStatusChanged()` - Order status updates
- HMAC signature on all webhooks
- Retry logic with exponential backoff

---

## Files Modified

| File | Change |
|------|--------|
| backend/src/app.module.ts | Enabled all modules |
| backend/src/integrations/integration.service.ts | Fixed webhook signature verification |
| backend/src/webhooks/webhook.controller.ts | Fixed timingSafeEqual |
| backend/src/payments/payment.service.ts | Fixed amount tampering, added idempotency |
| backend/src/integrations/nextabizz-webhook.service.ts | **NEW** - Webhook sender |
| backend/src/integrations/integration.module.ts | Export new service |

---

## Environment Variables Required

Add to `.env`:
```bash
# NextaBizz Integration
NEXTABIZZ_WEBHOOK_URL=https://api.nextabizz.com/webhooks/restopapa
NEXTABIZZ_WEBHOOK_SECRET=your_hmac_secret_here

# Security
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret
```

---

## Remaining Issues

### HIGH Priority
- [ ] Frontend login has demo credentials in code
- [ ] No rate limiting on public endpoints
- [ ] SQLite database (use PostgreSQL for production)

### MEDIUM Priority
- [ ] Add input validation (Zod/class-validator)
- [ ] Add request logging/monitoring
- [ ] Implement proper error handling

### LOW Priority
- [ ] Add comprehensive tests
- [ ] Add API documentation (Swagger)
- [ ] Implement caching layer

---

## SSO Integration with nextaBizz

### Login Flow
```
1. User clicks "Login with ReZ"
2. Redirect to ReZ Merchant auth
3. User authenticates with ReZ
4. ReZ returns JWT token
5. ReStopapa validates token
6. Create/link ReStopapa user session
```

### Webhook Integration
```
ReStopapa → NextaBizz
├── inventory.low_stock → Create RFQ
├── inventory.out_of_stock → Create urgent RFQ
├── inventory.stock_updated → Sync inventory
└── order.status_changed → Track orders
```

---

**Report Updated:** May 16, 2026
**Status:** CRITICAL ISSUES FIXED
