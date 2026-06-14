# Merchant Website OS - SDK & Widgets

**Version:** 1.0.0
**Date:** June 1, 2026

---

## Quick Start

### 1. Install SDK

```bash
npm install @rez/merchant-sdk
```

### 2. Initialize

```typescript
import { initMerchantSDK } from '@rez/merchant-sdk';

await initMerchantSDK({
  merchantId: 'YOUR_MERCHANT_ID',
  apiKey: 'YOUR_API_KEY',
  environment: 'production' // or 'staging'
});
```

### 3. Use Services

```typescript
import { Payment, Wallet, Cart, Booking, Reviews } from '@rez/merchant-sdk';

// Accept Payment
const result = await Payment.checkout({
  amount: 500,
  customer: { id: 'cust_123', name: 'John' }
});

// Add to Wallet
await Wallet.credit({
  userId: 'user_456',
  amount: 100,
  reason: 'loyalty_reward'
});

// Create Booking
await Booking.create({
  service: 'haircut',
  datetime: '2026-06-15T14:00:00Z',
  customer: { id: 'cust_123' }
});
```

---

## Widgets

### Payment Widget

```html
<div id="payment-widget"></div>
<script src="https://cdn.rez.money/widgets/payment.js"
  data-merchant="MERCHANT_ID"
  data-amount="500"
  data-currency="INR"></script>
```

### Cart Widget

```html
<div id="cart-widget"></div>
<script src="https://cdn.rez.money/widgets/cart.js"
  data-merchant="MERCHANT_ID"
  data-theme="light"></script>
```

### Booking Widget

```html
<div id="booking-widget"></div>
<script src="https://cdn.rez.money/widgets/booking.js"
  data-merchant="MERCHANT_ID"
  data-service="haircut"></script>
```

### Reviews Widget

```html
<div id="reviews-widget"></div>
<script src="https://cdn.rez.money/widgets/reviews.js"
  data-merchant="MERCHANT_ID"
  data-limit="10"></script>
```

### Loyalty Widget

```html
<div id="loyalty-widget"></div>
<script src="https://cdn.rez.money/widgets/loyalty.js"
  data-merchant="MERCHANT_ID"
  data-customer="CUSTOMER_ID"></script>
```

---

## API Reference

### Authentication

```typescript
// Verify customer token
await Auth.verify(token: string): Promise<Customer>

// Login with phone
await Auth.loginWithPhone(phone: string): Promise<void>

// Verify OTP
await Auth.verifyOTP(phone: string, otp: string): Promise<Token>
```

### Payments

```typescript
// Create checkout session
await Payment.checkout(params: {
  amount: number;
  customer: { id: string; name?: string; email?: string };
  items?: Array<{ id: string; name: string; price: number; quantity: number }>;
  returnUrl?: string;
  metadata?: Record<string, any>;
}): Promise<CheckoutSession>

// Get payment status
await Payment.getStatus(paymentId: string): Promise<PaymentStatus>

// Verify webhook signature
Payment.verifyWebhookSignature(payload: string, signature: string): boolean
```

### Wallet

```typescript
// Get balance
await Wallet.getBalance(userId: string): Promise<number>

// Credit
await Wallet.credit(params: {
  userId: string;
  amount: number;
  reason: string;
  metadata?: Record<string, any>;
}): Promise<Transaction>

// Debit
await Wallet.debit(params: {
  userId: string;
  amount: number;
  reason: string;
}): Promise<Transaction>

// Get transactions
await Wallet.getTransactions(userId: string, limit?: number): Promise<Transaction[]>
```

### Cart

```typescript
// Create cart
await Cart.create(params: {
  merchantId: string;
  customerId: string;
}): Promise<Cart>

// Add item
await Cart.addItem(params: {
  cartId: string;
  item: { productId: string; quantity: number; price: number };
}): Promise<Cart>

// Remove item
await Cart.removeItem(params: {
  cartId: string;
  itemId: string;
}): Promise<Cart>

// Checkout
await Cart.checkout(cartId: string, paymentMethod?: PaymentMethod): Promise<CheckoutSession>
```

### Booking

```typescript
// Get available slots
await Booking.getSlots(params: {
  serviceId: string;
  date: string;
}): Promise<Slot[]>

// Create booking
await Booking.create(params: {
  serviceId: string;
  slotId: string;
  customer: { id: string; name: string; phone: string };
  notes?: string;
}): Promise<Booking>

// Cancel booking
await Booking.cancel(bookingId: string, reason?: string): Promise<void>

// Reschedule
await Booking.reschedule(params: {
  bookingId: string;
  newSlotId: string;
}): Promise<Booking>
```

### Reviews

```typescript
// Get reviews
await Reviews.get(params: {
  merchantId: string;
  limit?: number;
  offset?: number;
}): Promise<Review[]>

// Submit review
await Reviews.submit(params: {
  merchantId: string;
  customerId: string;
  rating: number; // 1-5
  comment?: string;
  photos?: string[];
}): Promise<Review>
```

### Notifications

```typescript
// Send notification
await Notifications.send(params: {
  userId: string;
  type: 'push' | 'sms' | 'email' | 'whatsapp';
  title: string;
  body: string;
  data?: Record<string, any>;
}): Promise<void>
```

---

## Webhooks

### Supported Events

```typescript
// Payment events
'payment.success'
'payment.failed'
'payment.pending'

// Order events
'order.created'
'order.confirmed'
'order.shipped'
'order.delivered'
'order.cancelled'

// Booking events
'booking.created'
'booking.confirmed'
'booking.cancelled'
'booking.reminder'

// Wallet events
'wallet.credited'
'wallet.debited'
```

### Webhook Handler

```typescript
import { Webhooks } from '@rez/merchant-sdk';

const handler = Webhooks.createHandler({
  secret: process.env.WEBHOOK_SECRET,
  onPaymentSuccess: async (event) => {
    console.log('Payment received:', event.data.paymentId);
    // Update order status, send confirmation, etc.
  },
  onOrderDelivered: async (event) => {
    console.log('Order delivered:', event.data.orderId);
    // Update inventory, send review request, etc.
  }
});

// Express handler
app.post('/webhooks/rez', express.raw({ type: 'application/json' }), handler);
```

---

## TypeScript Types

```typescript
interface Customer {
  id: string;
  name: string;
  email?: string;
  phone: string;
  createdAt: Date;
}

interface Payment {
  id: string;
  amount: number;
  currency: 'INR';
  status: 'pending' | 'success' | 'failed';
  method: 'upi' | 'card' | 'wallet';
  createdAt: Date;
}

interface Order {
  id: string;
  merchantId: string;
  customerId: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
}

interface Booking {
  id: string;
  serviceId: string;
  customerId: string;
  slot: Slot;
  status: 'pending' | 'confirmed' | 'cancelled';
}

interface Review {
  id: string;
  merchantId: string;
  customerId: string;
  rating: number;
  comment?: string;
  photos?: string[];
  createdAt: Date;
}
```

---

## Error Handling

```typescript
import { MerchantSDKError, PaymentError, AuthError } from '@rez/merchant-sdk';

try {
  await Payment.checkout({ amount: 500, customer: {...} });
} catch (error) {
  if (error instanceof PaymentError) {
    console.log('Payment failed:', error.code, error.message);
  } else if (error instanceof MerchantSDKError) {
    console.log('SDK error:', error.message);
  }
}
```

---

## Support

- Documentation: https://docs.rez.money/merchant
- API Reference: https://api.rez.money/docs
- Support: support@rez.money
