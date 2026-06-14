# Day 8-14: Subscriptions for Payments

## Overview

Build subscription billing into rez-payment-service.

## Core Types

```typescript
// types/subscription.ts
export interface Subscription {
  id: string;
  customerId: string;
  status: 'active' | 'past_due' | 'canceled' | 'trialing';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  items: SubscriptionItem[];
  defaultPaymentMethodId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionItem {
  id: string;
  priceId: string;
  quantity: number;
  price: Price;
}

export interface Price {
  id: string;
  currency: 'INR';
  unitAmount: number; // paise
  interval: 'day' | 'week' | 'month' | 'year';
  intervalCount: number;
}
```

## Endpoints

```
POST   /api/subscriptions          Create subscription
GET    /api/subscriptions/:id     Get subscription
PATCH  /api/subscriptions/:id     Update subscription
DELETE /api/subscriptions/:id     Cancel subscription

POST   /api/subscriptions/:id/pause
POST   /api/subscriptions/:id/resume

GET    /api/subscriptions/:id/invoices
POST   /api/subscriptions/:id/retry   Retry payment

POST   /api/prices                 Create price
GET    /api/prices                List prices
```

## Quick Start

```typescript
// Create subscription
const sub = await fetch(`${PAYMENT_URL}/subscriptions`, {
  method: 'POST',
  headers: { 'X-Internal-Token': TOKEN },
  body: JSON.stringify({
    customerId: 'cust_123',
    priceId: 'price_456',
    paymentMethodId: 'pm_789'
  })
});
```
