# REZ Intelligence Connectors

Event connectors to integrate existing services with the REZ Intelligence infrastructure.

## Usage

### Install
```bash
npm install @rez/intelligence-connectors
```

### Import
```typescript
import { eventConnector, commerceEvents, identityEvents } from '@rez/intelligence-connectors';
```

## Event Types

### Commerce Events
```typescript
commerceEvents.orderCreated({ orderId, userId, merchantId, total })
commerceEvents.orderCompleted({ orderId, userId, merchantId, total })
commerceEvents.orderCancelled({ orderId, userId, reason })
commerceEvents.orderRefunded({ orderId, userId, refundAmount })
commerceEvents.cartAbandoned({ cartId, userId, total, ageMinutes })
```

### Identity Events
```typescript
identityEvents.userRegistered({ userId, email, phone, source })
identityEvents.userLoggedIn({ userId, method, deviceId })
identityEvents.profileUpdated({ userId, changes })
identityEvents.deviceLinked({ userId, deviceId })
```

### Loyalty Events
```typescript
loyaltyEvents.pointsEarned({ userId, points, source })
loyaltyEvents.pointsRedeemed({ userId, points, rewardId })
loyaltyEvents.tierUpgraded({ userId, newTier })
```

### Engagement Events
```typescript
engagementEvents.pageViewed({ userId, pageType, pageId })
engagementEvents.productViewed({ userId, productId, merchantId })
engagementEvents.qrScanned({ userId, qrId, qrType })
engagementEvents.searchPerformed({ userId, query, results })
```

### Support Events
```typescript
supportEvents.ticketCreated({ ticketId, userId, category })
supportEvents.csatSubmitted({ ticketId, userId, rating })
```

### Media Events
```typescript
mediaEvents.adImpression({ userId, adId, campaignId })
mediaEvents.adConversion({ userId, adId, campaignId, value })
```

## Service Connectors

### Order Connector
```typescript
import { createOrderConnector } from '@rez/intelligence-connectors/commerce';

const orderConnector = createOrderConnector();

// Hook into your order service
orderConnector.onOrderCreated({
  orderId: 'order_123',
  userId: 'user_456',
  merchantId: 'merchant_789',
  items: [{ productId: 'p1', quantity: 2, price: 299 }],
  total: 598,
  paymentMethod: 'UPI'
});
```

### Auth Connector
```typescript
import { createAuthConnector } from '@rez/intelligence-connectors/auth';

const authConnector = createAuthConnector();

authConnector.onUserRegistered({
  userId: 'user_new',
  phone: '+919876543210',
  source: 'organic'
});
```

### Payment Connector
```typescript
import { createPaymentConnector } from '@rez/intelligence-connectors/payment';

const paymentConnector = createPaymentConnector();

paymentConnector.onPaymentCompleted({
  paymentId: 'pay_123',
  orderId: 'order_456',
  userId: 'user_789',
  amount: 599,
  method: 'UPI'
});
```

### Notification Connector
```typescript
import { createNotificationConnector } from '@rez/intelligence-connectors/notification';

const notificationConnector = createNotificationConnector();

notificationConnector.onNotificationOpened({
  notificationId: 'notif_123',
  userId: 'user_456',
  channel: 'push',
  openedAt: new Date().toISOString()
});
```

## Configuration

```bash
EVENT_BUS_URL=http://localhost:4025
INTERNAL_SERVICE_TOKEN=your-token
```

## Events Flow

```
Service → Event Connector → Event Bus → Intelligence Services
                                    ↓
                          ┌─────────────────────┐
                          │ Central Intent     │
                          │ Feature Store      │
                          │ Decision Engine    │
                          │ Commerce Graph     │
                          └─────────────────────┘
                                    ↓
                          ┌─────────────────────┐
                          │ ML Observability   │
                          └─────────────────────┘
```

## License

Proprietary - RTNM Group
