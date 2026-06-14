# REZ Platform - Developer Documentation
**Version:** 1.0
**Date:** May 28, 2026

---

## Welcome to REZ Platform

Build commerce applications faster with REZ's infrastructure services. Authentication, payments, wallet, orders, catalog, search, notifications, and more.

---

## Quick Start

### Install SDK

```bash
npm install @rez/sdk
```

### Initialize Client

```typescript
import { REZ } from '@rez/sdk';

const rez = new REZ({
  apiKey: 'your-api-key',
  environment: 'production'
});

// Use services
const user = await rez.auth.register({ email: 'user@example.com' });
```

---

## Services Overview

| Service | Description | Status |
|---------|-------------|--------|
| **Auth** | User authentication (JWT, OTP, MFA) | ✅ Stable |
| **Payments** | Payment processing (Razorpay, UPI) | ✅ Stable |
| **Wallet** | Coins, balance, loyalty points | ✅ Stable |
| **Orders** | Order lifecycle management | ✅ Stable |
| **Catalog** | Products, categories, inventory | ✅ Stable |
| **Search** | Full-text search, recommendations | ✅ Stable |
| **Notifications** | Push, SMS, email, WhatsApp | ✅ Stable |
| **Profile** | User profiles, addresses | ✅ Stable |
| **QR Cloud** | QR code generation, scanning | ✅ Stable |

---

## Authentication

### Register User

```typescript
// Register with email
const user = await rez.auth.register({
  email: 'user@example.com',
  password: 'securepassword'
});

// Register with phone
const user = await rez.auth.register({
  phone: '+919876543210'
});
```

### Login

```typescript
const result = await rez.auth.login({
  email: 'user@example.com',
  password: 'securepassword'
});

const { token } = result.data;
```

### Verify OTP

```typescript
const result = await rez.auth.verifyOTP({
  phone: '+919876543210',
  otp: '123456'
});
```

### Enable MFA

```typescript
// Enable TOTP
const mfa = await rez.auth.enableMFA({ token });

// Returns QR code URL for authenticator app setup
console.log(mfa.data.qrCodeUrl);
```

---

## Payments

### Initiate Payment

```typescript
const payment = await rez.payments.initiate({
  amount: 99900, // Amount in paise (₹999.00)
  currency: 'INR',
  orderId: 'order_123',
  customerEmail: 'customer@example.com',
  customerPhone: '+919876543210',
  description: 'Order #123'
});

// Returns Razorpay checkout URL
console.log(payment.data.checkoutUrl);
```

### Get Payment Status

```typescript
const payment = await rez.payments.get('pay_123456');
console.log(payment.data.status); // 'captured', 'pending', 'failed'
```

### Refund

```typescript
const refund = await rez.payments.refund('pay_123456', {
  amount: 49900, // Partial refund (₹499.00)
  reason: 'Customer request'
});
```

---

## Wallet

### Get Wallet Balance

```typescript
const wallet = await rez.wallet.get('user_123');
console.log(wallet.data.balance); // 5000 (coins)
```

### Credit Wallet

```typescript
await rez.wallet.credit({
  userId: 'user_123',
  amount: 1000,
  type: 'cashback',
  description: 'Order #123 cashback'
});
```

### Add Coins

```typescript
await rez.wallet.addCoins({
  userId: 'user_123',
  coins: 500,
  source: 'promotion'
});
```

### Redeem Coins

```typescript
await rez.wallet.redeemCoins({
  userId: 'user_123',
  coins: 200,
  reason: 'Order payment'
});
```

---

## Orders

### Create Order

```typescript
const order = await rez.orders.create({
  userId: 'user_123',
  items: [
    { productId: 'prod_001', quantity: 2, price: 49900 },
    { productId: 'prod_002', quantity: 1, price: 99900 }
  ],
  deliveryAddress: {
    street: '123 Main Street',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001'
  },
  paymentMethod: 'wallet'
});
```

### Get Order

```typescript
const order = await rez.orders.get('order_123');
console.log(order.data.status);
```

### Update Order Status

```typescript
await rez.orders.updateStatus('order_123', 'confirmed');
```

### Track Order

```typescript
const tracking = await rez.orders.track('order_123');
console.log(tracking.data.driverLocation);
```

---

## Catalog

### List Products

```typescript
const products = await rez.catalog.getProducts({
  category: 'electronics',
  limit: 20,
  sort: 'popularity'
});
```

### Get Product

```typescript
const product = await rez.catalog.getProduct('prod_001');
console.log(product.data.name, product.data.price);
```

### Search Products

```typescript
const results = await rez.catalog.searchProducts('wireless headphones');
```

---

## Search

### Search

```typescript
const results = await rez.search.search('pizza', {
  type: 'product',
  location: { lat: 19.076, lng: 72.877, radius: 5000 },
  limit: 10
});
```

### Autocomplete

```typescript
const suggestions = await rez.search.autocomplete('piz', { limit: 5 });
```

### Get Recommendations

```typescript
const recs = await rez.search.getRecommendations('user_123', { limit: 10 });
```

---

## Notifications

### Send Notification

```typescript
await rez.notifications.send({
  userId: 'user_123',
  channel: 'push',
  title: 'Order Confirmed!',
  body: 'Your order #123 is being prepared.',
  data: { orderId: 'order_123' }
});
```

### Send Template

```typescript
await rez.notifications.sendTemplate({
  userId: 'user_123',
  templateId: 'order_confirmation',
  variables: {
    orderId: '123',
    amount: '₹999'
  }
});
```

---

## Profile

### Get Profile

```typescript
const profile = await rez.profiles.get('user_123');
```

### Update Profile

```typescript
await rez.profiles.update('user_123', {
  name: 'John Doe',
  avatar: 'https://example.com/avatar.jpg'
});
```

### Add Address

```typescript
await rez.profiles.addAddress('user_123', {
  type: 'home',
  street: '456 Oak Street',
  city: 'Mumbai',
  state: 'Maharashtra',
  pincode: '400001',
  landmark: 'Near Metro Station'
});
```

---

## QR Cloud

### Create QR Code

```typescript
const qr = await rez.qr.create({
  type: 'menu',
  targetId: 'store_001',
  metadata: { storeName: 'Pizza Palace' }
});

// Returns QR code image URL
console.log(qr.data.qrCodeUrl);
```

### Get QR Analytics

```typescript
const analytics = await rez.qr.getAnalytics('qr_001', {
  fromDate: '2026-05-01',
  toDate: '2026-05-28'
});

console.log(analytics.data.totalScans);
console.log(analytics.data.orders);
```

---

## Webhooks

### Verify Webhook Signature

```typescript
// Express.js example
app.post('/webhooks/payment', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const isValid = rez.payments.verifyWebhook(signature, req.body);

  if (!isValid) {
    return res.status(400).send('Invalid signature');
  }

  // Process webhook
  const payment = JSON.parse(req.body);
  console.log('Payment captured:', payment.payload.payment.entity.id);

  res.sendStatus(200);
});
```

---

## Error Handling

```typescript
import { REZ, APIError } from '@rez/sdk';

const rez = new REZ({ apiKey: 'your-api-key' });

try {
  const user = await rez.auth.register({ email: 'user@example.com' });
} catch (error) {
  if (error instanceof APIError) {
    console.error('API Error:', error.code, error.message);
    // Handle specific error codes
  }
}
```

### Error Codes

| Code | Description |
|------|-------------|
| `AUTH_001` | Invalid credentials |
| `AUTH_002` | Account not found |
| `AUTH_003` | Email already exists |
| `PAYMENT_001` | Payment failed |
| `PAYMENT_002` | Insufficient balance |
| `ORDER_001` | Order not found |
| `ORDER_002` | Invalid order status |

---

## Rate Limits

| Tier | Requests/minute | Burst |
|------|----------------|-------|
| Starter | 60 | 100 |
| Growth | 300 | 500 |
| Business | 1000 | 2000 |
| Enterprise | Custom | Custom |

---

## SDK Reference

### Installation

```bash
npm install @rez/sdk
# or
yarn add @rez/sdk
# or
pnpm add @rez/sdk
```

### TypeScript Support

The SDK is written in TypeScript and provides full type definitions:

```typescript
import { REZ, AuthService, PaymentService } from '@rez/sdk';

const rez = new REZ({ apiKey: 'your-key' });

// Fully typed
const user: APIResponse<User> = await rez.auth.register({ email: 'test@example.com' });
```

---

## Support

- **Documentation:** docs.rez.money
- **API Status:** status.rez.money
- **Support:** support@rez.money
- **GitHub:** github.com/rez-platform

---

**Last Updated:** May 28, 2026
