# KHAIRMOVE - Statement of Truth (SOT)

**Version:** 2.0
**Date:** June 4, 2026
**Status:** Active - Development

---

## EXECUTIVE SUMMARY

**KHAIRMOVE** is the mobility and logistics platform within the REZ ecosystem, providing ride-hailing, delivery, and rental services.

### Vision

Make urban mobility effortless - one tap for any mode of transport.

---

## SERVICES

### Core Services

| Port | Service | Purpose | Status |
|------|---------|---------|--------|
| 4600 | khaimove-api-gateway | Unified entry point, routing | ✅ |
| 4601 | khaimove-ride-service | Ride-hailing engine | ✅ |
| 4602 | khaimove-fleet-service | Fleet management | ✅ |
| 4603 | khaimove-delivery-service | Delivery orchestration | ✅ |
| 4604 | khaimove-logistics-aggregator | Multi-carrier aggregation | ✅ |
| 4605 | khaimove-rental-service | Hourly/daily rentals | ✅ |
| 4606 | buzzlocal-rides-integration | Community rides via BuzzLocal | ✅ |

### Additional Services

| Service | Purpose | Status |
|---------|---------|--------|
| rez-ride | Ride-hailing (standalone) | ✅ |
| rez-delivery-tracking | Real-time tracking | ✅ |
| rez-delivery-ui | Delivery dashboard | ✅ |
| rez-food-delivery-service | Food delivery | ✅ |
| rez-instant-delivery-service | Quick delivery | ✅ |

### Mobile Apps

| App | Platform | Purpose |
|-----|----------|---------|
| khaimove-user-app | iOS/Android | User booking |
| khaimove-driver-app | iOS/Android | Driver partner |
| khaimove-admin-dashboard | Web | Operations |

---

## ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                    User/Driver Apps                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   khaimove-api-gateway                       │
│                   Port: 4600                                │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ Ride Service │   │ Fleet Service │   │Delivery Svc  │
│    4601     │   │    4602     │   │    4603     │
└───────────────┘   └───────────────┘   └───────────────┘
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ Ride Matching │   │ Driver Mgmt   │   │ 3rd Party    │
│   Algorithm  │   │ Vehicle Mgmt  │   │ Aggregators  │
└───────────────┘   └───────────────┘   └───────────────┘
```

---

## FARE STRUCTURE

### Standard Fares

| Vehicle Type | Base Fare | Per KM | Per Minute | Waiting/min |
|--------------|-----------|--------|------------|------------|
| Bike | ₹15 | ₹6 | ₹1 | ₹1 |
| Auto | ₹25 | ₹10 | ₹1.5 | ₹1.5 |
| Hatchback | ₹40 | ₹14 | ₹2 | ₹2 |
| Sedan | ₹50 | ₹16 | ₹2.5 | ₹2.5 |
| SUV | ₹60 | ₹18 | ₹3 | ₹3 |

### Surge Pricing

Dynamic pricing based on:
- Demand in area
- Time of day
- Weather conditions
- Special events

---

## INTEGRATION

### RABTUL Services

```typescript
// Authentication
AUTH_SERVICE_URL=http://localhost:4002

// Payments
PAYMENT_SERVICE_URL=http://localhost:4001

// Wallet (ReZ Coins)
WALLET_SERVICE_URL=http://localhost:4004

// Notifications
NOTIFICATION_SERVICE_URL=http://localhost:4011
```

### REZ Intelligence

```typescript
// Intent prediction (destination)
INTENT_SERVICE_URL=http://localhost:4018

// Demand forecasting
DEMAND_FORECAST_URL=http://localhost:4042

// Driver score
DRIVER_SCORE_URL=http://localhost:4050
```

---

## API ENDPOINTS

### Ride Service

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/rides/book` | Book a ride |
| GET | `/api/rides/:id` | Get ride details |
| POST | `/api/rides/:id/cancel` | Cancel ride |
| POST | `/api/rides/:id/rate` | Rate driver |
| GET | `/api/rides/estimate` | Get fare estimate |

### Fleet Service

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/fleet/drivers` | List drivers |
| POST | `/api/fleet/drivers` | Add driver |
| PUT | `/api/fleet/drivers/:id/location` | Update location |
| GET | `/api/fleet/vehicles` | List vehicles |
| POST | `/api/fleet/vehicles` | Add vehicle |

### Delivery Service

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/delivery/book` | Book delivery |
| GET | `/api/delivery/:id/track` | Track delivery |
| POST | `/api/delivery/:id/cancel` | Cancel delivery |

---

## MOBILE APP STRUCTURE

### User App Screens

```
Home
├── Search Destination
├── Select Vehicle
├── Confirm Ride
├── Live Tracking
├── Rate Driver
└── Trip History

Wallet
├── Balance
├── Add Money
├── Transactions
└── ReZ Coins

Profile
├── Personal Info
├── Saved Places
├── Payment Methods
├── Emergency Contacts
└── Help
```

### Driver App Screens

```
Dashboard
├── Online/Offline
├── Current Ride
├── Earnings
└── Incentives

Ride Requests
├── Accept
├── Ignore
└── Navigate

Profile
├── Documents
├── Vehicle Info
├── Earnings
└── Support
```

---

## DEPLOYMENT

### Docker Compose

```bash
docker compose up -d
```

### Individual Services

```bash
cd khaimove-api-gateway && npm run dev
cd khaimove-ride-service && npm run dev
cd khaimove-fleet-service && npm run dev
```

---

## TESTING

```bash
# Run all tests
npm test

# Run service tests
cd khaimove-ride-service && npm test

# Integration tests
npx playwright test
```

---

## SECURITY

- All service-to-service calls require `X-Internal-Token`
- JWT authentication for users
- GPS tracking with encrypted transmission
- Driver KYC verification required
- Zod input validation on all endpoints
- Rate limiting on public APIs

---

## MONITORING

### Health Checks

```bash
curl http://localhost:4600/health
curl http://localhost:4601/health
curl http://localhost:4602/health
```

### Metrics

- Ride completion rate
- Average wait time
- Driver acceptance rate
- Revenue per ride
- User retention

---

## KNOWN ISSUES

| Issue | Priority | Status |
|-------|----------|--------|
| Surge pricing edge cases | Medium | In Progress |
| Multi-stop routing | Low | Planned |
| EV charging integration | Low | Planned |

---

## ROADMAP

### Q3 2026

- [ ] Auto-rickshaw service
- [ ] Intercity rides
- [ ] Schedule rides

### Q4 2026

- [ ] Corporate accounts
- [ ] Pool rides
- [ ] Subscription plans

---

## LAST UPDATED

**Date:** June 4, 2026
**Version:** 2.0
