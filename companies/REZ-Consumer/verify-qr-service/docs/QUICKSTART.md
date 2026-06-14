# Verify QR Service Quick Start Guide (v2.0)

Get up and running with the Verify QR service in 10 minutes.

## New in v2.0

- **Extended Warranties** - Subscription-based warranty plans
- **Express Replacement** - Get replacement before returning device
- **Pickup & Delivery** - Doorstep service
- **Priority Slots** - Same-day, Next-day, Express
- **ML Center Assignment** - Auto-recommend nearest center

---

## Prerequisites

- Node.js 18+
- MongoDB 7+
- API keys for integrated services

## Quick Start

### 1. Install & Run

```bash
cd verify-qr-service
npm install
npm run dev
```

### 2. Verify a Product

```bash
curl -X POST http://localhost:4003/api/verify \
  -H "Content-Type: application/json" \
  -d '{
    "serial_number": "TEST123456",
    "user_id": "user_123",
    "user_phone": "+919999999999"
  }'
```

### 3. Activate Warranty

```bash
curl -X POST http://localhost:4003/api/activate-warranty \
  -H "Content-Type: application/json" \
  -d '{
    "serial_number": "TEST123456",
    "user_id": "user_123",
    "customer_name": "John Doe",
    "customer_phone": "+919999999999",
    "purchase_date": "2026-05-01"
  }'
```

### 4. Get Service Types

```bash
curl http://localhost:4003/api/service-types/TEST123456
```

### 5. Find Nearest Service Center (ML-powered)

```bash
curl "http://localhost:4003/api/nearest-center?lat=12.97&lng=77.59&brand=Samsung"
```

### 6. Book Service Appointment

```bash
curl -X POST http://localhost:4003/api/book-service \
  -H "Content-Type: application/json" \
  -d '{
    "serial_number": "TEST123456",
    "user_id": "user_123",
    "customer_name": "John Doe",
    "customer_phone": "+919999999999",
    "service_center_id": "SC-TEST001",
    "service_type": "routine_service",
    "preferred_date": "2026-05-20",
    "preferred_time": "10:00"
  }'
```

### 7. Subscribe to Extended Warranty

```bash
curl http://localhost:4003/api/warranty-plans?coverage_type=premium

curl -X POST http://localhost:4003/api/subscribe \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user_123",
    "customer_name": "John Doe",
    "customer_phone": "+919999999999",
    "plan_id": "PLAN-xxx",
    "serial_number": "TEST123456",
    "product_name": "Samsung Galaxy S24",
    "brand": "Samsung",
    "purchase_price": 79999,
    "auto_renew": true
  }'
```

### 8. Request Express Replacement

```bash
curl -X POST http://localhost:4003/api/express-replacement \
  -H "Content-Type: application/json" \
  -d '{
    "claim_id": "claim_xxx",
    "serial_number": "TEST123456",
    "user_id": "user_123",
    "customer_name": "John Doe",
    "customer_phone": "+919999999999",
    "customer_address": {
      "line1": "123 Main St",
      "city": "Bangalore",
      "state": "Karnataka",
      "pincode": "560001"
    },
    "brand": "Samsung",
    "model": "Galaxy S24",
    "issue_description": "Screen not working"
  }'
```

### 9. Request Pickup & Delivery

```bash
curl -X POST http://localhost:4003/api/pickup-request \
  -H "Content-Type: application/json" \
  -d '{
    "booking_id": "SVC-xxx",
    "user_id": "user_123",
    "customer_name": "John Doe",
    "customer_phone": "+919999999999",
    "pickup_address": {
      "line1": "123 Main St",
      "city": "Bangalore",
      "pincode": "560001",
      "instructions": "Ring doorbell"
    },
    "service_type": "repair",
    "scheduled_pickup": "2026-05-21T10:00:00Z"
  }'
```

### 10. Get Analytics

```bash
# Booking metrics
curl http://localhost:4003/analytics/bookings

# Predictive analytics (admin)
curl "http://localhost:4003/api/admin/analytics/predict?center_id=SC-TEST001&period=30days"
```

---

## Docker Quick Start

```bash
# Build and run
docker-compose up -d

# Check logs
docker-compose logs -f verify-qr-service

# Stop
docker-compose down
```

---

## API Documentation

Full Swagger docs: `docs/openapi.yaml`

Or visit http://localhost:4003/api/docs (if swagger-ui is enabled)

---

## Environment Variables

```bash
PORT=4003
MONGODB_URI=mongodb://localhost:27017/verify-qr

# External Services (optional in dev)
MERCHANT_API=http://localhost:4001
WALLET_API=http://localhost:4004
CARE_API=http://localhost:4055
```

---

## Next Steps

1. Read [API.md](./API.md) for full documentation
2. Check [INTEGRATION.md](./INTEGRATION.md) for service integrations
3. See [CHANGELOG.md](../CHANGELOG.md) for version history
