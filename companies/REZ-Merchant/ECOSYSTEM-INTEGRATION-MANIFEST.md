# ECOSYSTEM INTEGRATION MANIFEST

**Version:** 2.0.0  
**Date:** June 7, 2026  
**Purpose:** Complete integration reference for REZ ecosystem services

---

## Overview

This document maps all cross-company service connections, SDK clients, and event bus integrations across the REZ ecosystem.

---

## SDK Client Registry

The unified SDK (`@rez/sdk`) provides clients for all ecosystem services:

```typescript
import { createEcosystemClient } from '@rez/sdk';

const ecosystem = createEcosystemClient({
  baseUrl: 'https://api.rez.com',
  apiKey: process.env.REZ_API_KEY
});
```

### Available Clients

| Client | Port | Company | Purpose |
|--------|------|---------|---------|
| `ecosystem.auth` | 4002 | RABTUL | User authentication |
| `ecosystem.wallet` | 4004 | RABTUL | REZ Coins, payments |
| `ecosystem.payments` | 4001 | RABTUL | Payment processing |
| `ecosystem.notifications` | 4007 | RABTUL | Push/SMS notifications |
| `ecosystem.catalog` | 4008 | RABTUL | Product catalog |
| `ecosystem.orders` | 4009 | RABTUL | Order management |
| `ecosystem.intelligence` | 4100 | REZ-Intelligence | Intent prediction |
| `ecosystem.hojai` | 4630 | HOJAI-AI | AI brain, agents |
| `ecosystem.memory` | 4540 | HOJAI-AI | Memory platform |
| `ecosystem.knowledge` | 4300 | HOJAI-AI | Knowledge graph |
| `ecosystem.mart` | 4100 | REZ-Consumer | REZ-Mart quick commerce |
| `ecosystem.ssp` | 4520 | AdBazaar | SSP portal |
| `ecosystem.rides` | 4603 | KHAIRMOVE | Ride booking |
| `ecosystem.airzy` | 4500 | KHAIRMOVE | Airport services |

---

## Cross-Company Service Connections

### RABTUL-TECHNOLOGIES (Money Movement)

RABTUL provides infrastructure services to ALL companies:

| From | To | Service | Purpose |
|------|-----|---------|---------|
| REZ-Consumer | RABTUL | Auth (4002) | User login |
| REZ-Consumer | RABTUL | Wallet (4004) | REZ Coins |
| REZ-Consumer | RABTUL | Payment (4001) | UPI/Card |
| KHAIRMOVE | RABTUL | Auth (4002) | Driver login |
| KHAIRMOVE | RABTUL | Wallet (4004) | Ride payments |
| AXOM | RABTUL | Auth (4002) | Social login |
| AXOM | RABTUL | Karma | Reputation |
| AdBazaar | RABTUL | Payment (4001) | Ad payments |
| REZ-Merchant | RABTUL | Payment (4001) | Merchant settlement |
| LawGens | RABTUL | Payment (4001) | Legal service payments |
| RIDZA | RABTUL | Payment (4001) | Financial operations |

### HOJAI-AI (AI Intelligence)

HOJAI provides AI services to ALL companies:

| From | To | Service | Purpose |
|------|-----|---------|---------|
| REZ-Consumer | HOJAI | Enterprise Brain (4630) | AI recommendations |
| REZ-Consumer | HOJAI | Memory (4540) | User preferences |
| KHAIRMOVE | HOJAI | Enterprise Brain (4630) | Route optimization |
| KHAIRMOVE | HOJAI | Vision (4790) | OCR, document scan |
| AdBazaar | HOJAI | Enterprise Brain (4630) | Ad targeting |
| REZ-Merchant | HOJAI | waitron (4820) | Restaurant AI |
| REZ-Merchant | HOJAI | staybot (4840) | Hotel AI |
| REZ-Merchant | HOJAI | shopflow (4830) | Retail AI |
| REZ-Merchant | HOJAI | carecode (4102) | Healthcare AI |
| LawGens | HOJAI | Legal Brain (5100) | Legal reasoning |
| RIDZA | HOJAI | CFO Brain (4920) | Financial AI |

### REZ-Intelligence (ML Platform)

REZ-Intelligence provides ML services:

| From | To | Service | Purpose |
|------|-----|---------|---------|
| REZ-Consumer | REZ-Intelligence | Intent (4100) | Purchase prediction |
| REZ-Consumer | REZ-Intelligence | Mind | User intelligence |
| KHAIRMOVE | REZ-Intelligence | Intent | Travel intent |
| REZ-Merchant | REZ-Intelligence | Intent | Merchant growth |
| AdBazaar | REZ-Intelligence | Intent | Ad intent |

### KHAIRMOVE (Mobility)

| From | To | Service | Purpose |
|------|-----|---------|---------|
| REZ-Consumer | KHAIRMOVE | Rides (4603) | Last-mile delivery |
| REZ-Consumer | KHAIRMOVE | Driver App | Delivery tracking |
| AdBazaar | KHAIRMOVE | Rides | Event transportation |

### AdBazaar (Marketing)

| From | To | Service | Purpose |
|------|-----|---------|---------|
| REZ-Consumer | AdBazaar | adsqr (4068) | QR ad campaigns |
| REZ-Merchant | AdBazaar | SSP (4520) | Screen monetization |
| REZ-Consumer | AdBazaar | creator-qr | Creator commerce |

---

## Event Bus Integration

Services communicate via events at `rez-webhook-service/src/event-bus.ts`:

### Event Types

```typescript
// Order Events
ORDER_CREATED = 'order.created'
ORDER_CONFIRMED = 'order.confirmed'
ORDER_PREPARING = 'order.preparing'
ORDER_READY = 'order.ready'
ORDER_PICKED_UP = 'order.picked_up'
ORDER_DELIVERED = 'order.delivered'
ORDER_CANCELLED = 'order.cancelled'

// Payment Events
PAYMENT_INITIATED = 'payment.initiated'
PAYMENT_COMPLETED = 'payment.completed'
PAYMENT_FAILED = 'payment.failed'
PAYMENT_REFUNDED = 'payment.refunded'

// User Events
USER_SIGNED_UP = 'user.signed_up'
USER_LOGGED_IN = 'user.logged_in'
USER_PROFILE_UPDATED = 'user.profile_updated'

// Delivery Events
DELIVERY_ASSIGNED = 'delivery.assigned'
DELIVERY_PICKED_UP = 'delivery.picked_up'
DELIVERY_IN_TRANSIT = 'delivery.in_transit'
DELIVERY_ARRIVING = 'delivery.arriving'
DELIVERY_COMPLETED = 'delivery.completed'

// Inventory Events
INVENTORY_LOW = 'inventory.low'
INVENTORY_OUT = 'inventory.out'
INVENTORY_RESTOCKED = 'inventory.restocked'

// AI Events
AI_INSIGHT_GENERATED = 'ai.insight_generated'
AI_RECOMMENDATION = 'ai.recommendation'
```

### Subscribe to Events

```typescript
import { createEventBus, EventTypes } from '@rez/event-bus';

const eventBus = createEventBus({
  apiKey: process.env.REZ_API_KEY
});

// Subscribe to order events
eventBus.subscribe(EventTypes.ORDER_DELIVERED, async (event) => {
  console.log('Order delivered:', event.data.orderId);
  // Trigger loyalty points
  await ecosystem.wallet.credit(event.data.userId, {
    amount: 10,
    reason: 'Order completed'
  });
});

// Subscribe to payment events
eventBus.subscribe(EventTypes.PAYMENT_COMPLETED, async (event) => {
  console.log('Payment received:', event.data.transactionId);
  // Update order status
  await ecosystem.orders.update(event.data.orderId, {
    status: 'confirmed'
  });
});
```

### Publish Events

```typescript
// Publish order created event
eventBus.publish(EventTypes.ORDER_CREATED, {
  orderId: 'order_123',
  userId: 'user_456',
  storeId: 'store_789',
  items: [...],
  total: 500,
  paymentMethod: 'UPI'
});
```

---

## REZ-Mart Integration

### Connected Services

| Service | Port | Integration |
|---------|------|-------------|
| REZ-Mart Gateway | 4100 | Main entry point |
| Driver Service | 4101 | KHAIRMOVE driver network |
| Tracking Service | 4102 | Real-time location |
| Store Service | 4103 | REZ-Merchant store API |
| Product Service | 4104 | RABTUL catalog |
| Order Service | 4105 | RABTUL orders |
| Delivery Service | 4106 | KHAIRMOVE delivery |
| Inventory Service | 4107 | REZ-Merchant inventory |
| Cart Service | 4108 | Local cart |
| Offer Service | 4109 | RABTUL loyalty |
| Subscription Service | 4110 | Auto-replenishment |
| Analytics Service | 4112 | HOJAI analytics |

### Integration Example

```typescript
// Create a REZ-Mart order
const order = await ecosystem.mart.orders.create({
  userId: 'user_123',
  storeId: 'store_456',
  items: [
    { productId: 'prod_001', quantity: 2 },
    { productId: 'prod_002', quantity: 1 }
  ],
  deliveryLocation: {
    lat: 12.9716,
    lng: 77.5946,
    address: '123 Main St, Bangalore'
  }
});

// Track delivery
const tracking = await ecosystem.mart.tracking.get(order.orderId);
console.log('Status:', tracking.status);
console.log('Driver:', tracking.driverName);
console.log('ETA:', tracking.estimatedDelivery);
```

---

## AdBazaar SSP Integration

### Connected Services

| Service | Port | Integration |
|---------|------|-------------|
| SSP Gateway | 4520 | Main entry point |
| Screen Service | 4521 | DOOH screen network |
| Inventory Service | 4522 | Ad slot management |
| Bidding Service | 4523 | Real-time bidding |
| Revenue Service | 4524 | Earnings tracking |
| Analytics Service | 4525 | Performance metrics |

### Integration Example

```typescript
// Register a screen for monetization
const screen = await ecosystem.ssp.screens.create({
  locationId: 'loc_123',
  locationName: 'Bangalore Airport T2',
  screenType: 'led',
  size: 'large',
  dimensions: { width: 1920, height: 1080 },
  hourlyRate: 5000
});

// Check inventory availability
const slots = await ecosystem.ssp.inventory.search({
  screenId: screen.screenId,
  date: '2026-06-15',
  duration: 4
});
```

---

## HOJAI Memory Platform Integration

```typescript
import { CrossLLMMemory } from '@hojai/cross-llm-memory';

const memory = new CrossLLMMemory({
  apiKey: process.env.HOJAI_KEY,
  userId: 'user_123'
});

// Store user preference
await memory.remember({
  content: 'User prefers organic products',
  type: 'preference',
  source: 'purchase_history'
});

// Recall user context
const context = await memory.recall({
  query: 'shopping preferences',
  limit: 5
});
```

---

## REZ Atlas Integration

Merchant intelligence platform:

```typescript
// Discover nearby businesses
const businesses = await ecosystem.atlas.discover({
  lat: 12.9716,
  lng: 77.5946,
  radius: 5,
  category: 'restaurant'
});

// Get territory insights
const territory = await ecosystem.atlas.territory.get({
  region: 'South Bangalore',
  metrics: ['revenue', 'footfall', 'competition']
});
```

---

## Quick Reference

### Service URLs

| Service | URL |
|---------|-----|
| RABTUL Auth | http://localhost:4002 |
| RABTUL Wallet | http://localhost:4004 |
| RABTUL Payment | http://localhost:4001 |
| HOJAI Brain | http://localhost:4630 |
| HOJAI Memory | http://localhost:4540 |
| REZ Intelligence | http://localhost:4100 |
| REZ-Mart | http://localhost:4100 |
| AdBazaar SSP | http://localhost:4520 |
| KHAIRMOVE | http://localhost:4603 |
| LawGens | http://localhost:5099 |

### Port Ranges

| Range | Company/Product |
|-------|----------------|
| 4000-4099 | RABTUL Core |
| 4100-4112 | REZ-Mart, REZ-Intelligence |
| 4160-4169 | REZ-Retail |
| 4200-4299 | REZ-Merchant UI |
| 4400-4499 | Industry OS (Spa, etc.) |
| 4500-4699 | HOJAI AI |
| 4520-4529 | AdBazaar SSP |
| 4700-4799 | Various |
| 4780-4789 | HOJAI Legal AI |
| 4800-4899 | HOJAI Industry AI |
| 4850-4859 | HOJAI Legal New |
| 4900-4999 | HOJAI ServiceForce |
| 4940-4977 | HOJAI HR Intelligence |
| 5098-5123 | LawGens |
| 5150-5199 | REZ Atlas |

---

**Built with:** RABTUL, HOJAI-AI, REZ-Intelligence, KHAIRMOVE  
**Last Updated:** June 7, 2026
