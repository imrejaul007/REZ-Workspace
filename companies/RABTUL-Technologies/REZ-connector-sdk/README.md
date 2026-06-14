# RABTUL Connector SDK

> **Official SDK for connecting to RABTUL microservices**

A production-ready, type-safe SDK for integrating with RABTUL services including Auth, Wallet, Payment, Notification, EventBus, and Intent services.

[![npm version](https://img.shields.io/npm/v/@rez/connector-sdk.svg)](https://www.npmjs.com/package/@rez/connector-sdk)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## Features

- **Type-safe**: Full TypeScript support with Zod validation
- **Production-ready**: Built-in retry logic, error handling, and logging
- **Modular**: Import only what you need
- **Flexible**: Support for singleton, factory, and manual instantiation
- **Well-documented**: Comprehensive JSDoc and usage examples

## Installation

```bash
npm install @rez/connector-sdk
```

Or using yarn:

```bash
yarn add @rez/connector-sdk
```

Or using pnpm:

```bash
pnpm add @rez/connector-sdk
```

## Quick Start

### Using Singleton Instances (Recommended)

Import pre-configured singletons for immediate use:

```typescript
import { auth, wallet, payment, notification, eventBus, intent } from '@rez/connector-sdk';

// Auth Service
const user = await auth.getUser('user-123');
const result = await auth.verifyToken('jwt-token');
const otpResult = await auth.sendOTP('+919876543210');
const loginResult = await auth.verifyOTP('+919876543210', '123456');

// Wallet Service
const { balance, cashbackBalance } = await wallet.getBalance('user-123') || { balance: 0, cashbackBalance: 0 };
await wallet.addCashback('user-123', 50, 'promotion');
await wallet.transferToMerchant('user-123', 'merchant-456', 100);
const history = await wallet.history('user-123', 50);

// Payment Service
const order = await payment.createOrder({
  amount: 99900, // Rs. 999.00 in paise
  userId: 'user-123',
  merchantId: 'merchant-456',
});
await payment.verifyPayment(order.orderId, 'razorpay-payment-id', 'signature');
await payment.refund('payment-123', 50000, 'Customer request');
const qr = await payment.generateQRCode('order-123', 50000);

// Notification Service
await notification.push('user-123', 'Order Confirmed', 'Your order #12345 is confirmed');
await notification.sms('+919876543210', 'Your OTP is 123456');
await notification.whatsapp('+919876543210', 'order_confirmation', { name: 'John' });
await notification.email('user@example.com', 'Welcome!', 'welcome_template', { name: 'John' });
await notification.sendBulkSMS([
  { phone: '+919876543210', message: 'Hello!' },
  { phone: '+919876543211', message: 'Hello!' },
]);

// Event Bus Service
await eventBus.publish('user.created', { userId: '123', email: 'user@example.com' });
eventBus.subscribe('order.placed', (data) => {
  console.log('Order placed:', data);
});
const history = await eventBus.getHistory('order.placed', 50);

// Intent Service
await intent.trackEvent('user-123', 'product.viewed', { productId: 'prod-456' });
const { intent: userIntent, confidence } = await intent.getIntent('user-123') || { intent: '', confidence: 0 };
const { probability } = await intent.predict('user-123', 'purchase') || { probability: 0 };
const preferences = await intent.getPreferences('user-123');
```

### Using Factory Pattern

Create all connectors with shared configuration:

```typescript
import { createAllConnectors } from '@rez/connector-sdk';

const connectors = createAllConnectors({
  internalServiceToken: process.env.INTERNAL_SERVICE_TOKEN,
  debug: process.env.NODE_ENV === 'development',
});

// Use all connectors
const user = await connectors.auth.getUser('user-123');
const balance = await connectors.wallet.getBalance('user-123');
```

Create individual connectors:

```typescript
import { createAuthConnector, createPaymentConnector } from '@rez/connector-sdk';

const auth = createAuthConnector({
  baseUrl: 'http://auth-service:4002',
  internalServiceToken: process.env.INTERNAL_SERVICE_TOKEN,
});
```

### Using Connector Classes Directly

For more control over configuration:

```typescript
import { AuthConnector, WalletConnector, PaymentConnector } from '@rez/connector-sdk';

const auth = new AuthConnector({
  baseUrl: 'http://localhost:4002',
  internalServiceToken: 'your-token',
  timeout: 30000,
  retries: 3,
  debug: true,
});
```

## Environment Variables

Configure the SDK using environment variables:

```bash
# Internal Service Token (required for all services)
INTERNAL_SERVICE_TOKEN=your-internal-service-token

# Service URLs (optional, defaults to localhost)
AUTH_SERVICE_URL=http://localhost:4002
WALLET_SERVICE_URL=http://localhost:4004
PAYMENT_SERVICE_URL=http://localhost:4003
NOTIFICATION_SERVICE_URL=http://localhost:4011
EVENT_BUS_URL=http://localhost:4051
INTENT_SERVICE_URL=http://localhost:4018
```

See `.env.example` for the complete list.

## Services Overview

### Auth Service (Port 4002)

Handles authentication, user management, and OTP verification.

| Method | Description |
|--------|-------------|
| `verifyToken(token)` | Verify JWT token validity |
| `sendOTP(phone)` | Send OTP to phone number |
| `verifyOTP(phone, otp)` | Verify OTP and get tokens |
| `getUser(userId)` | Get user details by ID |
| `refreshToken(refreshToken)` | Refresh access token |
| `validateJWT(token)` | Validate and decode JWT |

### Wallet Service (Port 4004)

Handles wallet operations, transfers, and balance management.

| Method | Description |
|--------|-------------|
| `getBalance(userId)` | Get user's wallet balance |
| `addCashback(userId, amount, source)` | Add cashback to wallet |
| `deduct(userId, amount, source)` | Deduct from wallet |
| `transferToMerchant(fromUserId, toMerchantId, amount)` | Transfer to merchant |
| `history(userId, limit?)` | Get transaction history |
| `getMerchantBalance(merchantId)` | Get merchant balance |
| `withdraw(merchantId, amount, bankAccountId)` | Withdraw to bank |

### Payment Service (Port 4003)

Handles payment processing, orders, and refunds.

| Method | Description |
|--------|-------------|
| `createOrder(params)` | Create a payment order |
| `verifyPayment(orderId, razorpayPaymentId, signature)` | Verify payment |
| `refund(paymentId, amount, reason)` | Process refund |
| `getPaymentMethods(userId)` | Get saved payment methods |
| `generateQRCode(orderId, amount)` | Generate QR code |
| `verifyQRPayment(qrId)` | Verify QR code payment |

### Notification Service (Port 4011)

Handles push, SMS, WhatsApp, and email notifications.

| Method | Description |
|--------|-------------|
| `push(userId, title, body, data?)` | Send push notification |
| `sms(phone, message)` | Send SMS |
| `whatsapp(phone, template, variables?)` | Send WhatsApp message |
| `email(to, subject, template, variables?)` | Send email |
| `sendBulkSMS(messages)` | Send bulk SMS |
| `sendBulkPush(notifications)` | Send bulk push |
| `getHistory(userId, type?)` | Get notification history |
| `updatePreferences(userId, preferences)` | Update preferences |

### Event Bus Service (Port 4051)

Handles event publishing and real-time subscriptions.

| Method | Description |
|--------|-------------|
| `publish(topic, data)` | Publish an event |
| `subscribe(topic, handler)` | Subscribe to events |
| `getHistory(topic, limit?)` | Get event history |

### Intent Service (Port 4018)

Handles ML-based intent analysis and predictions.

| Method | Description |
|--------|-------------|
| `trackEvent(userId, event, properties?)` | Track user event |
| `getIntent(userId)` | Get user intent |
| `getPreferences(userId)` | Get user preferences |
| `predict(userId, action)` | Predict action probability |

## Error Handling

All methods return `null` on failure or structured error responses. The SDK uses consistent error formats:

```typescript
const result = await auth.verifyToken(token);

if (!result || !('valid' in result) || !result.valid) {
  // Handle error
  console.log('Token verification failed');
}

// For methods that return objects with success property
const transfer = await wallet.transferToMerchant('user-1', 'merchant-1', 100);
if (!transfer) {
  console.log('Transfer failed');
} else {
  console.log('Transfer ID:', transfer.transactionId);
}
```

## Configuration Options

All connectors support these configuration options:

```typescript
interface ConnectorConfig {
  /** Service URL (defaults to env var or localhost with port) */
  baseUrl?: string;
  /** Internal service token for inter-service auth */
  internalServiceToken?: string;
  /** Request timeout in ms (default: 30000) */
  timeout?: number;
  /** Number of retry attempts (default: 3) */
  retries?: number;
  /** Enable debug logging (default: false) */
  debug?: boolean;
}
```

## Retry Logic

The SDK automatically retries failed requests with exponential backoff:

- Maximum 3 retries by default
- Initial delay: 1000ms
- Backoff multiplier: 2
- Maximum delay: 10000ms
- Retries on: 408, 429, 500, 502, 503, 504, network errors

## Type Safety

All inputs are validated using Zod schemas. Invalid inputs return `null`:

```typescript
// This will return null due to invalid phone format
const result = await auth.sendOTP('invalid-phone');

// This works correctly
const result = await auth.sendOTP('+919876543210');
```

## Health Checks

All connectors have a `healthCheck()` method:

```typescript
const { healthy, latency } = await auth.healthCheck();
if (healthy) {
  console.log(`Auth service healthy (latency: ${latency}ms)`);
}
```

## Best Practices

1. **Use singletons for application-wide access** - Pre-configured and shared across your app

2. **Use factory for controlled instantiation** - When you need specific configuration

3. **Handle null returns** - Always check if the result is null before using it

4. **Use TypeScript** - Take advantage of full type safety and IDE support

5. **Set debug mode in development** - Get detailed request/response logging

6. **Configure timeouts appropriately** - Increase for batch operations

## TypeScript Support

The SDK is written in TypeScript with full type definitions:

```typescript
import type {
  User,
  Transaction,
  Order,
  PaymentMethod,
  NotificationPreferences,
  IntentResponse,
} from '@rez/connector-sdk';
```

## License

MIT License - see LICENSE file for details.

## Support

For issues and feature requests, please open an issue on the GitHub repository.