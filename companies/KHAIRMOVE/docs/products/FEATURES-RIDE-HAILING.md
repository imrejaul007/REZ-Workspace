# KHAIRMOVE Ride-Hailing - Complete Features

**Last Updated:** June 12, 2026

---

## 🚗 Ride-Hailing Features

### Core Booking Features
- [x] One-tap ride request
- [x] Multiple vehicle types (Bike, Auto, Cab, SUV)
- [x] Real-time driver matching
- [x] Live GPS tracking
- [x] Estimated time of arrival (ETA)
- [x] Estimated fare calculation
- [x] OTP verification for ride start
- [x] In-app navigation

### Payment Features
- [x] RABTUL Wallet integration
- [x] Cash payments
- [x] UPI payments
- [x] Card payments
- [x] Ride fare splitting
- [x] Auto-recharge wallet

### Driver Features
- [x] Driver registration
- [x] Document verification
- [x] Vehicle registration
- [x] Real-time earnings
- [x] Trip history
- [x] Driver ratings
- [x] In-app chat with rider
- [x] SOS emergency button

### Safety Features
- [x] Emergency contact sharing
- [x] Live location sharing
- [x] SOS button
- [x] Trip sharing with contacts
- [x] Ride verification (OTP)
- [x] Driver background check
- [x] In-app panic button

### User Features
- [x] Phone OTP login
- [x] Profile management
- [x] Ride history
- [x] Favorite locations
- [x] Saved payment methods
- [x] Push notifications
- [x] Rate driver after ride
- [x] Support chat

### Pricing Features
- [x] Base fare
- [x] Distance-based pricing
- [x] Time-based pricing
- [x] Surge pricing
- [x] Discount coupons
- [x] Loyalty points (REZ Coins)
- [x] Promo codes

### Fleet Management Features
- [x] Fleet creation
- [x] Driver assignment
- [x] Vehicle management
- [x] Fleet analytics
- [x] Earnings reports
- [x] Driver performance tracking

---

## Fare Structure

| Vehicle | Base | Per KM | Per Min | Max Passengers |
|---------|------|--------|---------|---------------|
| Bike | ₹15 | ₹6 | ₹1 | 1 |
| Auto | ₹25 | ₹10 | ₹1.5 | 3 |
| Cab | ₹40 | ₹14 | ₹2 | 4 |
| SUV | ₹60 | ₹18 | ₹2.5 | 6 |

---

## API Endpoints

### User Endpoints
```
POST /api/rides              - Request a ride
GET  /api/rides              - Get user rides
GET  /api/rides/:id          - Get ride details
PUT  /api/rides/:id/cancel   - Cancel ride
POST /api/rides/:id/rate      - Rate ride
POST /api/fares/estimate     - Get fare estimate
POST /api/fares/compare      - Compare vehicle fares
GET  /api/drivers/nearby     - Find nearby drivers
PUT  /api/drivers/:id/location - Update driver location
```

### Driver Endpoints
```
POST /api/drivers/register    - Register as driver
POST /api/drivers/login       - Driver login
PUT  /api/drivers/:id/status  - Update online status
GET  /api/drivers/:id/earnings - Get earnings
GET  /api/drivers/:id/trips  - Get trip history
POST /api/drivers/:id/accept/:rideId - Accept ride
POST /api/drivers/:id/start   - Start ride
POST /api/drivers/:id/complete - Complete ride
```

### Fleet Endpoints
```
POST /api/fleets              - Create fleet
GET  /api/fleets              - List fleets
GET  /api/fleets/:id         - Get fleet details
PUT  /api/fleets/:id         - Update fleet
POST /api/dispatch             - Dispatch vehicle
GET  /api/vehicles/:id       - Get vehicle details
PUT  /api/vehicles/:id       - Update vehicle
```

---

## Technology Stack

| Component | Technology |
|-----------|------------|
| Backend | Express.js / Node.js |
| Database | MongoDB |
| Cache | Redis |
| Real-time | Socket.IO |
| Auth | JWT (RABTUL) |
| Validation | Zod |
| Mobile | React Native / Expo |

---

## Services

| Service | Port | Purpose |
|---------|------|---------|
| khaimove-api-gateway | 4600 | API entry |
| khaimove-ride-service | 4601 | Ride operations |
| khaimove-fleet-service | 4602 | Fleet management |