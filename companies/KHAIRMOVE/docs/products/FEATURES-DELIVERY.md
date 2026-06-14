# KHAIRMOVE Delivery - Complete Features

**Last Updated:** June 12, 2026

---

## 📦 Delivery Ecosystem Features

### Core Delivery Features
- [x] Instant booking
- [x] Same-day delivery
- [x] Next-day delivery
- [x] Scheduled delivery
- [x] Real-time tracking
- [x] OTP verification
- [x] Proof of delivery
- [x] Delivery estimates

### Order Types
- [x] Food delivery
- [x] Grocery delivery
- [x] Package delivery
- [x] Document delivery
- [x] Pharmacy delivery
- [x]鲜花/flower delivery
- [x] Custom delivery

### Food Delivery Features
- [x] Restaurant discovery
- [x] Menu browsing
- [x] Order placement
- [x] Order customization
- [x] Special instructions
- [x] Tip driver
- [x] Reorder
- [x] Reviews & ratings

### Package Delivery Features
- [x] Door-to-door pickup
- [x] Package sizing
- [x] Weight calculation
- [x]fragile handling
- [x] Insurance option
- [x] Live tracking
- [x] Delivery confirmation

---

## Multi-Carrier Integration

### Carrier Features

| Carrier | Status | Features |
|---------|--------|----------|
| Delhivery | ✅ Active | Express, Standard |
| BlueDart | ✅ Active | Express |
| DTDC | ✅ Active | Express |
| FedEx | ✅ Active | International |
| DHL | ✅ Active | International |

### Carrier Services
- [x] Rate comparison
- [x] Shipment creation
- [x] Tracking
- [x] Label generation
- [x] Pickup scheduling
- [x] COD handling
- [x] Proof of delivery

---

## Pricing Features

### Pricing Types
- [x] Weight-based pricing
- [x] Distance-based pricing
- [x] Zone-based pricing
- [x] Volume-based pricing
- [x] COD charges
- [x] Fuel surcharge
- [x] Remote area charges

### Payment Options
- [x] Prepaid
- [x] Cash on Delivery (COD)
- [x] Online payment
- [x] Wallet payment
- [x] UPI
- [x] Cards

---

## Tracking Features

### Real-time Tracking
- [x] Live location
- [x] Route visualization
- [x] ETA updates
- [x] Status updates
- [x] Driver contact
- [x] Share tracking link

### Notification Features
- [x] Order confirmation
- [x] Pickup scheduled
- [x] Picked up
- [x] In transit
- [x] Out for delivery
- [x] Delivered
- [x] Delivery attempt

---

## User Features

### Ordering
- [x] Address book
- [x] Saved addresses
- [x] Landmark
- [x] Delivery instructions
- [x] Schedule later
- [x] Recurring orders

### Tracking
- [x] Order history
- [x] Track order
- [x] Cancel order
- [x] Modify order
- [x] Report issue
- [x] Get refund

---

## Driver Features

### Delivery Partner
- [x] Partner registration
- [x] Document upload
- [x] Vehicle registration
- [x] Order acceptance
- [x] Navigation to pickup
- [x] Navigation to delivery
- [x] OTP verification
- [x] Delivery confirmation

### Earnings
- [x] Per delivery earnings
- [x] Incentives
- [x] Bonus
- [x] Weekly settlement
- [x] Earnings history
- [x] Tax receipts

---

## Business Features

### Merchant Dashboard
- [x] Order management
- [x] Inventory management
- [x] Menu management
- [x] Pricing
- [x] Offers & deals
- [x] Analytics

### Enterprise Features
- [x] Bulk shipment creation
- [x] API access
- [x] Custom branding
- [x] Dedicated support
- [x] SLA management
- [x] Invoice billing

---

## Technology Stack

| Component | Technology |
|-----------|------------|
| Backend | Express.js / Node.js |
| Database | MongoDB |
| Cache | Redis |
| Real-time | Socket.IO |
| Auth | JWT (RABTUL) |

---

## Services

| Service | Purpose |
|---------|---------|
| khaimove-delivery-service | Food/package delivery |
| khaimove-logistics-aggregator | Multi-carrier aggregation |
| rez-delivery-ui | Delivery tracking UI |
| rez-delivery-tracking | Real-time tracking backend |
| rez-food-delivery-service | Food delivery |
| rez-instant-delivery-service | Instant delivery |

---

## API Endpoints

### Delivery Endpoints
```
POST /api/deliveries           - Create delivery
GET  /api/deliveries          - List deliveries
GET  /api/deliveries/:id      - Get delivery details
PUT  /api/deliveries/:id/cancel - Cancel delivery
POST /api/deliveries/:id/verify-otp - Verify OTP
```

### Carrier Endpoints
```
GET  /api/carriers             - List carriers
POST /api/rates               - Get shipping rates
POST /api/shipments           - Create shipment
GET  /api/shipments/:id       - Track shipment
GET  /api/shipments/:id/label - Get label
```