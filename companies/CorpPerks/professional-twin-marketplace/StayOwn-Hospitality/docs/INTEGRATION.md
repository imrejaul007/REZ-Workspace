# StayOwn Hospitality - Integration Guide

## Overview

This document describes how StayOwn Hotel services integrate with each other and with the broader HOJAI ecosystem.

## Service Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         STAYOWN HOTEL LAYER                              │
├─────────────────────────────────────────────────────────────────────────┤
│  Guest App          │  Staff Dashboard     │  Admin Console            │
│  (Mobile/Web)       │  (Management)        │  (Analytics)              │
└──────────┬──────────┴──────────┬──────────┴────────────┬─────────────┘
           │                     │                         │
           ▼                     ▼                         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         API GATEWAY (3800)                               │
│                    Authentication, Routing, Rate Limiting                  │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
           ┌─────────────────────┼─────────────────────┐
           │                     │                     │
           ▼                     ▼                     ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│  Guest Twin      │ │  Hotel Business  │ │  Event Bus       │
│  Service (3810)  │ │  Twin (3811)     │ │  (3812)          │
└────────┬─────────┘ └────────┬─────────┘ └────────┬─────────┘
         │                     │                     │
         └─────────────────────┼─────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         HOJAI CORE SERVICES                             │
├─────────────────────────────────────────────────────────────────────────┤
│  CorpID (4501)  │  Memory (4520)  │  Event Bus (4510)  │  Agents     │
│  - Identity     │  - Guest Memory │  - Pub/Sub          │  (4550)     │
│  - Auth         │  - Preferences  │  - Streaming        │  - Voice    │
│  - Profiles     │  - History      │  - Webhooks         │  - Chat     │
└─────────────────┴─────────────────┴─────────────────────┴─────────────┘
```

## Integration Points

### 1. Guest Twin Service → Event Bus

**Purpose:** Publish guest lifecycle events

```typescript
// Guest Check-in Event
POST http://localhost:3812/events
Authorization: Bearer <token>

{
  "type": "guest.arrival.checked-in",
  "source": "guest-twin",
  "hotelId": "hotel_001",
  "guestId": "guest_123",
  "roomId": "room_501",
  "payload": {
    "checkInTime": "2026-06-10T14:00:00Z",
    "preferences": {...}
  }
}
```

**Events Published:**
- `guest.arrival.scheduled` - Booking created
- `guest.arrival.confirmed` - Guest confirmed arrival
- `guest.arrival.checked-in` - Check-in completed
- `guest.departure.scheduled` - Checkout scheduled
- `guest.departure.checked-out` - Check-out completed
- `guest.preference.updated` - Preferences changed
- `guest.feedback.received` - Feedback submitted

### 2. Hotel Business Twin → Event Bus

**Purpose:** Publish operational metrics and alerts

```typescript
// Daily Metrics Event
{
  "type": "hotel.metrics.daily",
  "source": "hotel-business-twin",
  "hotelId": "hotel_001",
  "payload": {
    "date": "2026-06-10",
    "occupancy": 0.85,
    "adr": 4500,
    "revenue": 382500,
    "revpar": 3825,
    "guestSatisfaction": 4.5
  }
}
```

**Events Published:**
- `hotel.metrics.daily` - Daily operational metrics
- `hotel.metrics.alert` - Threshold alerts
- `hotel.prediction.demand` - Demand forecasts
- `hotel.recommendation` - AI recommendations

### 3. Event Bus → All Services

**Purpose:** Subscribe to real-time updates

```typescript
// Subscribe via WebSocket
io.emit('subscribe', {
  events: ['guest.*', 'room.*', 'housekeeping.*'],
  filters: { hotelId: 'hotel_001' }
});

// Receive events
io.on('event', (event) => {
  console.log('Event received:', event.type);
});
```

### 4. External Service Integrations

#### CorpID (Port 4501)
```typescript
// Verify guest identity
GET http://localhost:4501/api/v1/identity/:guestId
Headers: Authorization: Bearer <corp_id_token>

// Response
{
  "guestId": "guest_123",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+919876543210",
  "verified": true
}
```

#### HOJAI Memory (Port 4520)
```typescript
// Store guest preference memory
POST http://localhost:4520/memory
{
  "entityType": "guest",
  "entityId": "guest_123",
  "memoryType": "preference",
  "content": {
    "roomType": "deluxe",
    "floorPreference": "high",
    "earlyCheckIn": true
  }
}

// Retrieve guest history
GET http://localhost:4520/memory/guest/guest_123?type=stay_history
```

#### REZ Intelligence (Port 4018)
```typescript
// Get personalized recommendations
POST http://localhost:4018/predict
{
  "guestId": "guest_123",
  "context": "room_service",
  "history": [...]
}

// Response
{
  "recommendations": [
    { "item": "Masala Chai", "confidence": 0.92 },
    { "item": "Paneer Tikka", "confidence": 0.88 }
  ]
}
```

### 5. Internal Service Communication

#### Zero Checkout → Billing Service
```typescript
// Get final bill
GET http://localhost:3816/bookings/:bookingId/charges
Headers: Authorization: Bearer <billing_token>

// Process payment
POST http://localhost:3816/payments
{
  "bookingId": "booking_123",
  "amount": 12500,
  "method": "upi",
  "guestId": "guest_123"
}
```

#### Maintenance AI → Procurement Service
```typescript
// Check parts availability
GET http://localhost:3814/inventory/:partId

// Order parts
POST http://localhost:3814/orders
{
  "items": [
    { "partId": "PLB-001", "quantity": 2 }
  ],
  "hotelId": "hotel_001",
  "priority": "urgent"
}
```

#### Housekeeping → Event Bus → Room Status
```typescript
// Notify room ready
{
  "type": "room.cleaning.completed",
  "source": "housekeeping",
  "hotelId": "hotel_001",
  "roomId": "room_501",
  "payload": {
    "cleanedBy": "staff_456",
    "duration": 25,
    "qualityScore": 95
  }
}
```

## Data Flow Examples

### Guest Check-in Flow

```
1. Guest arrives at hotel
   │
   ▼
2. Front Desk → Verify guest via CorpID
   │
   ▼
3. Create Guest Twin session
   POST /guest-twin/sessions
   │
   ▼
4. Emit event: guest.arrival.checked-in
   │
   ├──► Event Bus → Notify Housekeeping (prepare room)
   ├──► Event Bus → Notify Maintenance (check room status)
   ├──► Event Bus → Update Hotel Business Twin (occupancy)
   └──► Event Bus → Notify Genie (welcome message)
   │
   ▼
5. Room Key activated
   │
   ▼
6. Guest Twin starts learning preferences
```

### Zero Checkout Flow

```
1. Guest requests checkout (via app)
   │
   ▼
2. Zero Checkout → Get billing from Billing Service
   │
   ▼
3. Present bill to guest (with breakdown)
   │
   ▼
4. Guest confirms payment
   │
   ▼
5. Process payment via Payment Gateway
   │
   ▼
6. Emit: guest.departure.checked-out
   │
   ├──► Event Bus → Revoke digital key
   ├──► Event Bus → Notify Housekeeping (room cleaning)
   ├──► Event Bus → Update Hotel Business Twin
   └──► Event Bus → Send feedback request via Genie
   │
   ▼
7. Generate invoice
   │
   ▼
8. Guest leaves
```

### Maintenance Request Flow

```
1. Issue reported (guest/staff/system)
   │
   ▼
2. Maintenance AI → Create request with AI diagnostics
   │
   ▼
3. Priority assigned based on issue type
   │
   ▼
4. Emit: maintenance.request.created
   │
   ├──► If urgent → Alert staff immediately
   ├──► If guest-affecting → Update room status
   └──► Event Bus → Hotel Business Twin
   │
   ▼
5. Staff assigned and notified
   │
   ▼
6. Work completed
   │
   ▼
7. Parts reordered if needed (Procurement)
   │
   ▼
8. Room status updated, housekeeping triggered
   │
   ▼
9. Analytics captured for insights
```

## Webhook Configuration

For external integrations:

```typescript
// Configure webhooks via Event Bus
POST /subscriptions
{
  "clientId": "external_system",
  "events": [
    "guest.*",
    "booking.*"
  ],
  "webhookUrl": "https://external.system/webhooks/stayown",
  "secret": "webhook_secret_123"
}
```

## Error Handling

All service integrations should implement:

1. **Retry with exponential backoff** for transient failures
2. **Circuit breaker pattern** for downstream service failures
3. **Dead letter queues** for failed message processing
4. **Health checks** before attempting integration

```typescript
// Example: Retry with circuit breaker
const circuitBreaker = new CircuitBreaker(callService, {
  timeout: 3000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000
});

circuitBreaker.fallback(() => ({ cached: true, data: getCachedData() }));
```

## Testing Integrations

Use the provided test scripts:

```bash
# Test event publishing
curl -X POST http://localhost:3812/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"type":"test.event","source":"test","hotelId":"hotel_001"}'

# Test full check-in flow
tsx scripts/test-checkin-flow.ts
```

## Monitoring

All services expose Prometheus metrics:

```bash
# Service metrics
GET /metrics

# Key metrics to monitor:
# - event_bus_messages_published_total
# - event_bus_messages_delivered_total
# - service_latency_seconds
# - external_api_call_duration_seconds
```
