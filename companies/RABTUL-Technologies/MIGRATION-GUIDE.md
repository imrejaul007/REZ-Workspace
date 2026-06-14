# RABTUL Service Migration Guide
## How to Migrate to RABTUL Centralized Services

**For:** All RTMN Companies
**Version:** 1.0
**Date:** May 12, 2026

---

## PURPOSE

This guide helps companies migrate from local services to RABTUL centralized infrastructure.

---

## MIGRATION CHECKLIST

### Before Migration

- [ ] Review [RAP.md](RAP.md) for available services
- [ ] Get RABTUL service URLs from RAP.md
- [ ] Request `INTERNAL_SERVICE_TOKEN` from RABTUL
- [ ] Set up environment variables
- [ ] Test RABTUL services in staging

### During Migration

- [ ] Replace local service calls with RABTUL API calls
- [ ] Update authentication headers
- [ ] Test all integrations
- [ ] Monitor for errors

### After Migration

- [ ] Remove local service code
- [ ] Update documentation
- [ ] Notify RABTUL of successful migration
- [ ] Update RAP.md if adding new integrations

---

## AUTH SERVICE MIGRATION

### Before (Local Auth)
```typescript
// ❌ WRONG - Local auth service
import { AuthService } from './authService';

const auth = new AuthService();
const user = await auth.verifyToken(token);
```

### After (RABTUL Auth)
```typescript
// ✅ CORRECT - RABTUL Auth Service
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'https://rez-auth-service.onrender.com';

const response = await fetch(`${AUTH_SERVICE_URL}/api/auth/verify`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN
  },
  body: JSON.stringify({ token })
});

const user = await response.json();
```

### Environment Variables
```bash
AUTH_SERVICE_URL=https://rez-auth-service.onrender.com
INTERNAL_SERVICE_TOKEN=<your-shared-token>
```

---

## PAYMENT SERVICE MIGRATION

### Before (Local Razorpay)
```typescript
// ❌ WRONG - Local Razorpay
import Razorpay from 'razorpay';

const razorpay = new Razorpay({ key_id, key_secret });
const order = await razorpay.orders.create({ amount, currency });
```

### After (RABTUL Payment)
```typescript
// ✅ CORRECT - RABTUL Payment Service
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'https://rez-payment-service.onrender.com';

const response = await fetch(`${PAYMENT_SERVICE_URL}/api/payments/initiate`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN
  },
  body: JSON.stringify({
    amount: 1000,
    currency: 'INR',
    merchantId: 'your-merchant-id'
  })
});

const order = await response.json();
```

### Environment Variables
```bash
PAYMENT_SERVICE_URL=https://rez-payment-service.onrender.com
INTERNAL_SERVICE_TOKEN=<your-shared-token>
```

---

## WALLET SERVICE MIGRATION

### Before (Local Wallet)
```typescript
// ❌ WRONG - Local wallet
const balance = await localWallet.getBalance(userId);
await localWallet.credit(userId, amount);
```

### After (RABTUL Wallet)
```typescript
// ✅ CORRECT - RABTUL Wallet Service
const WALLET_SERVICE_URL = process.env.WALLET_SERVICE_URL || 'https://rez-wallet-service-36vo.onrender.com';

const response = await fetch(`${WALLET_SERVICE_URL}/api/wallet/${userId}`, {
  method: 'GET',
  headers: {
    'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN
  }
});

const wallet = await response.json();
// { balance: 5000, coins: 250 }
```

### Credit Wallet
```typescript
await fetch(`${WALLET_SERVICE_URL}/api/wallet/credit`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN
  },
  body: JSON.stringify({
    userId,
    amount: 100,
    type: 'CREDIT',
    reason: 'Refund'
  })
});
```

---

## ORDER SERVICE MIGRATION

### Before (Local Order)
```typescript
// ❌ WRONG - Local order service
const order = await localOrderService.create({ items, userId });
```

### After (RABTUL Order)
```typescript
// ✅ CORRECT - RABTUL Order Service
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'https://rez-order-service-hz18.onrender.com';

const response = await fetch(`${ORDER_SERVICE_URL}/api/orders`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN
  },
  body: JSON.stringify({
    userId,
    items: [{ productId, quantity, price }],
    paymentMethod: 'WALLET'
  })
});

const order = await response.json();
// { orderId: 'ord_xxx', status: 'PENDING' }
```

---

## NOTIFICATIONS SERVICE MIGRATION

### Before (Local Notifications)
```typescript
// ❌ WRONG - Local notification
await localNotifications.send({ userId, type: 'SMS', message });
```

### After (RABTUL Notifications)
```typescript
// ✅ CORRECT - RABTUL Notifications Service
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'https://rez-notifications-service.onrender.com';

await fetch(`${NOTIFICATION_SERVICE_URL}/api/v1/notifications/send`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN
  },
  body: JSON.stringify({
    userId,
    channel: 'PUSH', // or 'SMS', 'EMAIL', 'WHATSAPP'
    template: 'order_confirmed',
    data: { orderId: 'ord_xxx', items: 3 }
  })
});
```

---

## SEARCH SERVICE MIGRATION

### Before (Local Search)
```typescript
// ❌ WRONG - Local Elasticsearch
const results = await localElastic.search({ query: 'pizza' });
```

### After (RABTUL Search)
```typescript
// ✅ CORRECT - RABTUL Search Service
const SEARCH_SERVICE_URL = process.env.SEARCH_SERVICE_URL || 'https://rez-search-service.onrender.com';

const response = await fetch(`${SEARCH_SERVICE_URL}/api/search`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN
  },
  body: JSON.stringify({
    query: 'pizza',
    filters: { category: 'food', price: { min: 100, max: 500 } },
    limit: 20
  })
});

const results = await response.json();
// { products: [...], total: 45 }
```

---

## ANALYTICS SERVICE MIGRATION

### Before (Local Analytics)
```typescript
// ❌ WRONG - Local analytics tracking
await localAnalytics.track({ event: 'purchase', userId, amount });
```

### After (RABTUL Analytics)
```typescript
// ✅ CORRECT - RABTUL Analytics Service
const ANALYTICS_SERVICE_URL = process.env.ANALYTICS_SERVICE_URL || 'https://rez-analytics-service.onrender.com';

await fetch(`${ANALYTICS_SERVICE_URL}/api/track`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN
  },
  body: JSON.stringify({
    event: 'purchase',
    userId: 'user_123',
    properties: { amount: 999, currency: 'INR' }
  })
});
```

---

## COMMON HEADERS FOR ALL SERVICES

All RABTUL services require these headers:

```typescript
const headers = {
  'Content-Type': 'application/json',
  'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN,
  'X-Service-Name': 'your-company-service-name' // Optional but recommended
};
```

---

## ERROR HANDLING

All services return standard error responses:

```typescript
// Error Response
{
  "error": true,
  "code": "SERVICE_UNAVAILABLE",
  "message": "Payment service is temporarily unavailable",
  "retryAfter": 5 // seconds
}
```

### Retry Logic
```typescript
async function callWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response.json();
      
      if (response.status === 503) {
        const error = await response.json();
        await sleep(error.retryAfter * 1000);
        continue;
      }
      
      throw new Error(`HTTP ${response.status}`);
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      await sleep(1000 * (i + 1));
    }
  }
}
```

---

## HEALTH CHECKS

Verify RABTUL services are available:

```typescript
async function checkRABTULHealth() {
  const services = [
    { name: 'auth', url: process.env.AUTH_SERVICE_URL },
    { name: 'payment', url: process.env.PAYMENT_SERVICE_URL },
    { name: 'wallet', url: process.env.WALLET_SERVICE_URL },
    { name: 'order', url: process.env.ORDER_SERVICE_URL }
  ];
  
  const results = await Promise.all(
    services.map(async (s) => {
      try {
        const res = await fetch(`${s.url}/health`);
        return { name: s.name, status: res.ok ? 'healthy' : 'unhealthy' };
      } catch {
        return { name: s.name, status: 'unreachable' };
      }
    })
  );
  
  return results;
}
```

---

## MIGRATION COMPLETION

Once migration is complete:

1. **Remove old service code:**
   ```bash
   rm -rf src/services/localAuth.ts
   rm -rf src/services/localPayment.ts
   ```

2. **Update dependencies:**
   ```bash
   # Remove local Razorpay if used
   npm uninstall razorpay
   ```

3. **Update documentation:**
   - Update README.md
   - Update API documentation
   - Update onboarding docs

4. **Notify RABTUL:**
   - Create issue in RABTUL-Technologies
   - Include: Company name, migrated services, date

5. **Update company integration list:**
   - Add to company's integration documentation
   - Link to RAP.md

---

## RABTUL SUPPORT

- **Slack:** #rabtul-support
- **GitHub Issues:** [RABTUL-Technologies/issues](https://github.com/imrejaul007/RABTUL-Technologies/issues)
- **On-Call:** 24/7 for production issues

---

*Migration Guide v1.0 - May 12, 2026*
