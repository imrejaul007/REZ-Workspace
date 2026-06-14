# REZ Verify QR Service - API Documentation (v2.0)

## Base URL

```
Production: https://verify-qr.rezapp.com/api
Staging: https://staging-verify-qr.rezapp.com/api
Development: http://localhost:4003/api
```

---

## Authentication

All API requests require authentication via `X-Internal-Token` header for service-to-service calls, or `Bearer` token for user requests.

```
Authorization: Bearer <token>
X-Internal-Token: <internal-service-token>
```

---

## Rate Limits

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Verification | 30/min | 15 min |
| Service Booking | 20/min | 1 min |
| Claims | 5/hour | 1 hour |
| Subscriptions | 3/hour | 1 hour |
| Search | 60/min | 1 min |
| Admin | 500/min | 1 min |

---

## Endpoints

### Core APIs

#### POST /verify
Verify product authenticity by serial number or QR code.

**Request:**
```json
{
  "serial_number": "PRD1234567890ABCD",
  "user_id": "user_123",
  "user_phone": "+919999999999",
  "location": {
    "lat": 12.9716,
    "lng": 77.5946,
    "city": "Bangalore"
  },
  "device_id": "device_abc123"
}
```

**Response:**
```json
{
  "status": "AUTHENTIC",
  "serial_number": "PRD1234567890ABCD",
  "brand": "Samsung",
  "model": "Galaxy S24",
  "verification_count": 5,
  "warranty_status": "active",
  "action": "VIEW_WARRANTY"
}
```

---

#### POST /activate-warranty
Activate warranty for a verified product.

**Request:**
```json
{
  "serial_number": "PRD1234567890ABCD",
  "user_id": "user_123",
  "customer_name": "John Doe",
  "customer_phone": "+919999999999",
  "purchase_date": "2026-05-01"
}
```

**Response:**
```json
{
  "success": true,
  "warranty_id": "wrr_xxx",
  "expires": "2027-05-01T00:00:00Z",
  "cashback_earned": 799
}
```

---

### Service Booking APIs

#### GET /service-slots
Get available service slots for a center.

#### GET /service-types/:serial
Get eligible service types for a product.

#### POST /book-service
Book a service appointment.

#### GET /api/bookings
Get user's bookings.

#### POST /api/bookings/:id/cancel
Cancel booking.

#### POST /api/bookings/:id/reschedule
Reschedule booking.

#### POST /api/bookings/:id/rate
Rate completed service.

---

### Express Replacement APIs

#### POST /express-replacement
Request express replacement for approved warranty claim.

#### GET /express-replacement/:id
Get replacement status.

#### GET /express-replacement/:id/track
Track replacement with live location.

---

### Pickup & Delivery APIs

#### POST /pickup-request
Request pickup for product service.

#### GET /pickup/:id
Get pickup status.

#### POST /pickup/:id/cancel
Cancel pickup request.

---

### Priority Slots APIs

#### GET /priority-slots
Get priority slots (same-day, next-day, express).

#### POST /priority-slots/generate
Generate priority slots (admin).

---

### Subscription APIs

#### GET /warranty-plans
Get available warranty plans.

#### POST /subscribe
Subscribe to extended warranty plan.

#### GET /subscriptions/:user_id
Get user's subscriptions.

---

### Dynamic QR APIs

#### GET /qr-content/:serial
Get dynamic QR content.

#### PUT /qr-content/:serial
Update dynamic QR content (admin).

---

### ML-Powered APIs

#### GET /nearest-center
Get nearest service center with ML optimization.

---

### Notification APIs

#### POST /notifications/register-device
Register device for push notifications.

#### POST /notifications/booking-update
Send booking update notification.

---

### Analytics APIs

#### GET /analytics/verifications
Get verification metrics.

#### GET /analytics/bookings
Get booking metrics.

#### GET /admin/analytics/predict
Get predictive analytics.

#### GET /admin/analytics/revenue-forecast
Get revenue forecast.

#### GET /admin/bookings/stats
Get booking statistics.

---

### Support APIs

#### POST /support/request
Request customer support.

#### POST /api/bookings/:id/escalate
Escalate to REZ-care.

---

### Admin APIs

#### Serial Management
- POST /admin/serial - Register serial
- GET /admin/serials - List serials
- POST /admin/fraud/resolve - Resolve fraud

#### Service Center Management
- POST /api/service-centers - Register service center
- GET /api/service-centers - List service centers
- GET /api/service-centers/:id - Get service center
- POST /admin/service-slots/generate - Generate slots
- PATCH /admin/service-slots/:id/block - Block slots

#### Booking Management
- GET /admin/bookings - List all bookings
- POST /admin/bookings/:id/confirm - Confirm booking
- POST /admin/bookings/:id/start - Start service
- POST /admin/bookings/:id/complete - Complete service
- POST /admin/bookings/:id/no-show - Mark no-show
- GET /admin/center/:id/analytics - Center analytics

---

## Error Codes

| Code | Description |
|------|-------------|
| `INVALID_REQUEST` | Missing or invalid parameters |
| `PRODUCT_NOT_FOUND` | Serial number not registered |
| `WARRANTY_NOT_FOUND` | No active warranty |
| `CLAIM_NOT_APPROVED` | Claim must be approved for express replacement |
| `PLAN_NOT_ELIGIBLE` | Subscription plan not available |
| `SLOT_UNAVAILABLE` | Selected slot is no longer available |
| `MAX_CLAIMS_REACHED` | Subscription claim limit reached |
| `RATE_LIMITED` | Too many requests |

---

## WebSocket Events

Connect to `wss://verify-qr.rezapp.com` for real-time updates.

### Authentication
```javascript
socket.emit('authenticate', { user_id: 'user_123' });
```

### Subscribe to Tracking
```javascript
socket.emit('subscribe', { type: 'booking', id: 'SVC-xxx' });
```

### Receive Updates
```javascript
socket.on('tracking_update', (data) => {
  console.log(data.status, data.message);
});
```

---

## Full API Documentation

See `openapi.yaml` for complete Swagger/OpenAPI specification.

---

## Support

- **Email:** api-support@rez.money
- **Docs:** https://docs.verify-qr.rezapp.com
- **Status:** https://status.verify-qr.rezapp.com
