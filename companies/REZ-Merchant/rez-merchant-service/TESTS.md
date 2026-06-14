# Test Coverage

## Unit Tests

### Orders
- Order status transitions
- State machine validation
- Order state machine: pending → confirmed → preparing → ready → delivered → completed

### Payments
- GST calculation (18% rate)
- Currency formatting (INR, USD, EUR)
- Idempotency key generation (32-char hex)
- Payout state machine
- Refund eligibility (30-day window)
- Max refund cap (₹50,000)

### Loyalty
- Points calculation with multiplier
- Tier system (Bronze → Silver → Gold → Platinum)
- Stamp card completion
- Points redemption
- Expiry rules (365 days)

## Integration Tests

### Order Workflow
- Order → Payment → Notification → Status update
- Refund flow
- Customer segmentation

### Customer Lifecycle
- Onboarding → Points → Milestones → Win-back

## Deployment

Render.com blueprint: `render.yaml`

Environment variables required:
- MONGODB_URI
- REDIS_URL
- JWT_MERCHANT_SECRET
- INTERNAL_SERVICE_TOKENS_JSON
- QR_SECRET
- ENCRYPTION_KEY
- CLOUDINARY_* secrets
- INTERNAL_BRIDGE_TOKEN
