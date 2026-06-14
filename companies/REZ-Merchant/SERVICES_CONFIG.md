# REZ Platform - Service Configuration

## Overview

This document defines the shared service configuration for the REZ platform, ensuring secure inter-service communication.

---

## Service URLs

### Production
```
AUTH_SERVICE_URL=https://rez-auth-service.onrender.com
WALLET_SERVICE_URL=https://rez-wallet-service.onrender.com
PAYMENT_SERVICE_URL=https://rez-payment-service.onrender.com
ORDER_SERVICE_URL=https://rez-order-service.onrender.com
MERCHANT_SERVICE_URL=https://rez-merchant-service.onrender.com
INTENT_SERVICE_URL=https://rez-intent-graph.onrender.com
EVENT_BUS_URL=https://rez-event-bus.onrender.com
IDENTITY_BRIDGE_URL=https://rez-identity-bridge.onrender.com
```

### Development (Local)
```
AUTH_SERVICE_URL=http://localhost:4002
WALLET_SERVICE_URL=http://localhost:4001
PAYMENT_SERVICE_URL=http://localhost:4003
ORDER_SERVICE_URL=http://localhost:4006
MERCHANT_SERVICE_URL=http://localhost:4005
INTENT_SERVICE_URL=http://localhost:4050
EVENT_BUS_URL=http://localhost:4051
IDENTITY_BRIDGE_URL=http://localhost:4092
```

---

## Internal Service Tokens

All internal services use scoped tokens via `INTERNAL_SERVICE_TOKENS_JSON`.

### Token Format
```json
{
  "auth-service": "<hex-token>",
  "wallet-service": "<hex-token>",
  "payment-service": "<hex-token>",
  "order-service": "<hex-token>",
  "merchant-service": "<hex-token>",
  "intent-service": "<hex-token>",
  "event-bus": "<hex-token>",
  "identity-bridge": "<hex-token>",
  "api-gateway": "<hex-token>"
}
```

### Generate Tokens
```bash
# Generate a secure token
openssl rand -hex 32
```

---

## Service Permissions

| Service | Permissions |
|---------|-------------|
| api-gateway | read, write, publish |
| auth-service | read, write |
| wallet-service | read, write |
| payment-service | read, write |
| order-service | read, write |
| merchant-service | read, write |
| intent-service | read, write, publish |
| event-bus | read, write, publish |
| identity-bridge | read, write |

---

## Request Headers

### Internal Service Calls
```headers
X-Internal-Token: <service-token>
X-Internal-Service: <service-name>
Content-Type: application/json
```

### User Context (Forwarded)
```headers
X-User-Id: <user-id>
X-User-Role: <role>
Authorization: Bearer <jwt>
```

### Tracing
```headers
X-Request-Id: <uuid>
X-Correlation-Id: <uuid>
```

---

## Health Endpoints

| Service | Endpoint |
|---------|----------|
| Auth | `/health` |
| Wallet | `/health` |
| Payment | `/health` |
| Order | `/health` |
| Merchant | `/health` |
| Intent | `/health` |
| Event Bus | `/api/health` |
| Identity Bridge | `/health` |

---

## Example: Service-to-Service Call

```typescript
import axios from 'axios';

async function callMerchantService(merchantId: string) {
  const response = await axios.get(
    `${process.env.MERCHANT_SERVICE_URL}/api/v1/merchant/${merchantId}`,
    {
      headers: {
        'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN,
        'X-Internal-Service': 'payment-service',
        'X-Request-Id': crypto.randomUUID(),
      },
      timeout: 5000,
    }
  );
  return response.data;
}
```

---

## Security Checklist

- [ ] All services use `INTERNAL_SERVICE_TOKENS_JSON` (not legacy `INTERNAL_SERVICE_TOKEN`)
- [ ] Tokens are 64+ characters (generated with `openssl rand -hex 32`)
- [ ] CORS is restricted to known origins in production
- [ ] Rate limiting is enabled on all public endpoints
- [ ] Health endpoints do not require authentication
- [ ] Request IDs are propagated for tracing
- [ ] Sensitive data is encrypted at rest
