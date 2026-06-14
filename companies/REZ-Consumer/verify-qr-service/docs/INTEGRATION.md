# REZ Verify QR Service - Integration Guide (v2.0)

## Table of Contents

1. [Service Dependencies](#service-dependencies)
2. [Authentication](#authentication)
3. [REZ-Care Integration](#rez-care-integration)
4. [REZ-Delivery Integration](#rez-delivery-integration)
5. [REZ-Wallet Integration](#rez-wallet-integration)
6. [REZ-Mind Integration](#rez-mind-integration)
7. [REZ-Intelligence Integration](#rez-intelligence-integration)
8. [REZ-Agent Integration](#rez-agent-integration)
9. [WebSocket Integration](#websocket-integration)
10. [Deployment Checklist](#deployment-checklist)

---

## Service Dependencies

Verify QR Service integrates with the following ReZ platform services:

| Service | Environment Variable | Purpose |
|---------|---------------------|---------|
| MongoDB | `MONGODB_URI` | Primary database |
| Redis | `REDIS_URL` | Caching & rate limiting |
| REZ-Merchant | `MERCHANT_API` | Product catalog, claims |
| REZ-Wallet | `WALLET_API` | Payments, cashback |
| REZ-Mind | `MIND_API` | ML predictions |
| REZ-Intelligence | `INTELLIGENCE_API` | Intent tracking |
| REZ-Notifications | `NOTIF_API` | Push notifications |
| REZ-Agent | `AGENT_API` | WhatsApp notifications |
| REZ-Care | `CARE_API` | Support tickets |
| REZ-Delivery | `DELIVERY_API` | Pickup/delivery |

---

## Authentication

### Service-to-Service (Internal)

Use `X-Internal-Token` header for all internal service calls:

```typescript
const response = await fetch(`${SERVICE_URL}/api/endpoint`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Internal-Token': process.env.INTERNAL_KEY
  },
  body: JSON.stringify(data)
});
```

### Health Check Response

```json
{
  "status": "healthy",
  "service": "REZ Verify QR Service",
  "version": "2.0.0",
  "port": 4003,
  "features": [
    "serial_registry",
    "scan_verification",
    "warranty_management",
    "claim_management",
    "service_booking",
    "service_centers",
    "ownership_transfer",
    "fraud_detection",
    "express_replacement",
    "pickup_delivery",
    "warranty_subscriptions",
    "ml_centers",
    "rez_care_integration"
  ]
}
```

---

## REZ-Care Integration

Customer support escalation and ticket management.

### Flow

```
Customer Issue → Verify QR → Can't resolve?
                              ↓
                    REZ-Care Ticket Created
                              ↓
                    Agent Assigned
                              ↓
                    WhatsApp Updates
```

### Endpoints Used

```typescript
// Create support ticket
POST ${CARE_API}/api/auto-tickets
{
  title: string,
  description: string,
  customer_id: string,
  category: 'verify_qr' | 'warranty' | 'service_booking',
  priority: 'low' | 'medium' | 'high',
  metadata: { serial_number, booking_id }
}

// Submit CSAT survey
POST ${CARE_API}/api/csat/respond
{
  user_id: string,
  interaction_type: 'service_booking',
  interaction_id: string,
  rating: 1-5,
  feedback: string
}

// Self-service actions
POST ${CARE_API}/api/self-service/execute
{
  customerId: string,
  actionType: 'verify_qr_support',
  actionData: { ticket_id, serial_number }
}
```

---

## REZ-Delivery Integration

Pickup and delivery for service requests.

### Flow

```
Service Booked → Customer requests pickup
                        ↓
              REZ-Delivery Pickup Scheduled
                        ↓
              Agent Assigned
                        ↓
              Product Picked Up
                        ↓
              Service Completed
                        ↓
              Product Delivered Back
```

### Endpoints Used

```typescript
// Schedule pickup
POST ${DELIVERY_API}/api/pickup/schedule
{
  pickup_id: string,
  pickup_address: Address,
  scheduled_time: string,
  service_type: 'product_service',
  customer_phone: string
}

// Get live tracking
GET ${DELIVERY_API}/api/track/:tracking_id

// Cancel pickup
POST ${DELIVERY_API}/api/pickup/:pickup_id/cancel
```

---

## REZ-Wallet Integration

Payment processing and cashback.

### Flow

```
Warranty Activation → 1% Cashback to Wallet
Subscription Purchase → Plan Payment Charged
Service Completed → Service Payment (if not warranty)
Express Replacement → Refund Processing
```

### Endpoints Used

```typescript
// Earn cashback
POST ${WALLET_API}/api/earn
{
  user_id: string,
  amount: number,
  source: 'warranty_activation',
  reason: string
}

// Charge subscription
POST ${WALLET_API}/api/charge
{
  user_id: string,
  amount: number,
  reason: string,
  subscription_id: string
}

// Request payment (for service)
POST ${WALLET_API}/api/request-payment
{
  user_id: string,
  amount: number,
  reason: string,
  booking_id: string
}
```

---

## REZ-Mind Integration

ML-powered predictions and recommendations.

### Used For

1. **Fraud Detection** - ML-based anomaly scoring
2. **Service Center Recommendation** - Optimal center selection
3. **Demand Prediction** - Forecasting service demand

### Endpoints Used

```typescript
// Fraud verification
POST ${MIND_API}/api/fraud/verify
{
  serial_number: string,
  user_id: string,
  recent_scans: number
}

// Service center recommendation
POST ${MIND_API}/api/recommend/service-center
{
  user_id: string,
  location: { lat, lng },
  service_type: string,
  brand: string,
  candidates: [{ center_id, distance, load }]
}
```

---

## REZ-Intelligence Integration

Analytics and intent tracking.

### Used For

1. **Intent Tracking** - Track user actions
2. **Attribution** - Track conversions
3. **Predictions** - Demand forecasting

### Endpoints Used

```typescript
// Track intent
POST ${INTELLIGENCE_API}/api/intent/track
{
  user_id: string,
  intent_type: 'service_booking' | 'warranty_verification',
  entities: { product, brand, service_type },
  action: string
}

// Track attribution
POST ${INTELLIGENCE_API}/api/attribution/track
{
  event_type: string,
  user_id: string,
  entities: { product },
  value: number
}

// Get recommendations
POST ${INTELLIGENCE_API}/api/recommend/verify-qr
{
  user_id: string,
  context: { current_product, warranty_status }
}

// Predict service demand
POST ${INTELLIGENCE_API}/api/predict/service-demand
{
  center_id: string,
  historical_data: object,
  forecast_days: number
}
```

---

## REZ-Agent Integration

WhatsApp notifications and updates.

### Templates

| Template | Use Case |
|----------|----------|
| `warranty_activated` | Warranty activation confirmation |
| `claim_received` | Claim filed notification |
| `booking_confirmed` | Service booking confirmed |
| `booking_update` | Booking status change |
| `service_completed` | Service completed notification |
| `support_ticket_created` | Support ticket created |
| `express_replacement_requested` | Replacement requested |

### Endpoint Used

```typescript
POST ${AGENT_API}/api/agent/whatsapp/send
{
  phone: string,
  template: string,
  params: object,
  user_id: string
}
```

---

## WebSocket Integration

Real-time updates for bookings, replacements, and pickups.

### Connection

```typescript
import { io } from 'socket.io-client';

const socket = io('wss://verify-qr.rezapp.com');

// Authenticate
socket.emit('authenticate', { user_id: 'user_123' });

// Subscribe to booking updates
socket.emit('subscribe', { type: 'booking', id: 'SVC-xxx' });

// Listen for updates
socket.on('tracking_update', (data) => {
  console.log(data.status);
  console.log(data.message);
});
```

### Event Types

| Event | Description |
|-------|-------------|
| `authenticated` | User authenticated |
| `subscribed` | Subscribed to tracking |
| `tracking_update` | Status update received |
| `error` | Error occurred |

---

## Deployment Checklist

### Pre-Deployment

- [ ] All environment variables configured
- [ ] MongoDB indexes created (run `mongo-init.js`)
- [ ] Redis connection verified
- [ ] External service URLs accessible
- [ ] Rate limiting configured
- [ ] Monitoring (Sentry) enabled

### Environment Variables

```bash
# Service
PORT=4003
NODE_ENV=production
MONGODB_URI=mongodb://localhost:27017/verify-qr
REDIS_URL=redis://localhost:6379

# External Services
MERCHANT_API=https://rez-merchant.onrender.com
WALLET_API=https://rez-wallet.onrender.com
MIND_API=https://REZ-mind.onrender.com
INTELLIGENCE_API=https://rez-intelligence.onrender.com
NOTIF_API=https://rez-notifications.onrender.com
AGENT_API=https://REZ-agent.onrender.com
CARE_API=https://REZ-care.onrender.com
DELIVERY_API=https://rez-delivery-service.onrender.com

# Security
INTERNAL_KEY=your-secure-key
SENTRY_DSN=https://xxx@sentry.io/xxx
```

### Docker Deployment

```bash
# Build image
docker build -t verify-qr-service:v2.0 .

# Run container
docker run -d \
  --name verify-qr-service \
  -p 4003:4003 \
  -e MONGODB_URI=mongodb://host.docker.internal:27017/verify-qr \
  -e REDIS_URL=redis://host.docker.internal:6379 \
  verify-qr-service:v2.0
```

### Kubernetes Deployment

```bash
kubectl apply -f k8s/deployment.yaml
kubectl get pods -n rez-platform
kubectl logs -f deployment/verify-qr-service -n rez-platform
```

---

## Support

- **Email:** platform@rez.money
- **Slack:** #verify-qr-support
- **Docs:** https://docs.verify-qr.rezapp.com
