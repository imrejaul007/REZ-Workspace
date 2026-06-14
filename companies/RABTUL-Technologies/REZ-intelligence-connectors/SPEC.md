# REZ Intelligence Connectors - SPEC.md

**Version:** 1.0.0
**Port:** (see config)
**Company:** RABTUL-Technologies
**Category:** Integration

---

## Overview

Event connectors that hook into existing services to emit intelligence events. Provides standardized event emission for order, auth, payment, and notification flows.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              REZ Intelligence Connectors                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│  Connectors:                                                               │
│  ├── authConnector     → Login, logout, register events                 │
│  ├── orderConnector   → Order lifecycle events                           │
│  ├── paymentConnector → Payment events                                   │
│  └── notificationConnector → Notification events                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Available Connectors

### authConnector
```typescript
import { authEvents } from '@rez/intelligence-connectors/auth';

authEvents.userLoggedIn({ userId, deviceId });
authEvents.userLoggedOut({ userId });
authEvents.userRegistered({ userId, method });
```

### orderConnector
```typescript
import { orderEvents } from '@rez/intelligence-connectors/commerce';

orderEvents.orderPlaced({ orderId, userId, total });
orderEvents.orderCompleted({ orderId, userId, total });
```

### paymentConnector
```typescript
import { paymentEvents } from '@rez/intelligence-connectors/payment';

paymentEvents.paymentInitiated({ paymentId, userId, amount });
paymentEvents.paymentCompleted({ paymentId, userId, amount });
```

---

## Dependencies

```json
{
  "axios": "^1.6.0"
}
```

---

## Exported Modules

| Module | Events |
|--------|--------|
| authConnector | userLoggedIn, userLoggedOut, userRegistered, loginFailed |
| orderConnector | orderPlaced, orderConfirmed, orderCompleted, orderCancelled |
| paymentConnector | paymentInitiated, paymentCompleted, paymentFailed, refundInitiated |
| notificationConnector | notificationSent, notificationClicked, notificationDelivered |

---

## Status

- [x] Auth connector
- [x] Order connector
- [x] Payment connector
- [x] Notification connector
