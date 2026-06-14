# ReZ Ride API Documentation

**Version:** 1.0.0
**Base URL:** `https://api.rezride.com`
**Environment:** Production

---

## Authentication

### OTP Request
```
POST /api/auth/request-otp
Content-Type: application/json

Request:
{
  "phone": "919876543210",
  "type": "login" | "register"
}

Response:
{
  "success": true,
  "expiresIn": 300
}
```

### OTP Verify
```
POST /api/auth/verify-otp
Content-Type: application/json

Request:
{
  "phone": "919876543210",
  "otp": "1234"
}

Response:
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_123",
    "phone": "919876543210",
    "name": "John Doe"
  }
}
```

---

## Rides

### Create Ride
```
POST /api/rides
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  "pickup": {
    "lat": 12.9716,
    "lng": 77.5946,
    "address": "MG Road, Bangalore"
  },
  "drop": {
    "lat": 12.9356,
    "lng": 77.6245,
    "address": "Koramangala, Bangalore"
  },
  "vehicleType": "cab",
  "paymentMethod": "wallet"
}

Response:
{
  "success": true,
  "ride": {
    "id": "ride_123",
    "status": "requested",
    "otp": "1234",
    "fare": {
      "base": 40,
      "distanceCharge": 140,
      "timeCharge": 40,
      "total": 220,
      "cashback": 22
    }
  }
}
```

### Get Ride
```
GET /api/rides/:rideId
Authorization: Bearer <token>

Response:
{
  "success": true,
  "ride": {
    "id": "ride_123",
    "status": "in_progress",
    "pickup": {...},
    "drop": {...},
    "driver": {
      "id": "driver_456",
      "name": "Rajesh K",
      "phone": "919876543211",
      "rating": 4.8,
      "vehicle": {
        "make": "Maruti",
        "model": "Swift",
        "color": "White",
        "plate": "KA01AB1234"
      },
      "currentLocation": {
        "lat": 12.9750,
        "lng": 77.5950
      }
    },
    "fare": {...},
    "otp": "1234"
  }
}
```

### Cancel Ride
```
POST /api/rides/:rideId/cancel
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  "reason": "Changed plans"
}

Response:
{
  "success": true,
  "ride": {...},
  "cancellationFee": 0
}
```

---

## Fares

### Get Fare Estimate
```
GET /api/fares/estimate?pickupLat=12.9716&pickupLng=77.5946&dropLat=12.9356&dropLng=77.6245&vehicleType=cab

Response:
{
  "success": true,
  "estimate": {
    "vehicleType": "cab",
    "base": 40,
    "distanceCharge": 140,
    "timeCharge": 40,
    "total": 220,
    "cashback": 22
  },
  "route": {
    "distanceKm": 10,
    "durationMinutes": 20
  }
}
```

### Compare Fares
```
GET /api/fares/compare?pickupLat=12.9716&pickupLng=77.5946&dropLat=12.9356&dropLng=77.6245

Response:
{
  "success": true,
  "route": {
    "distanceKm": 10,
    "durationMinutes": 20
  },
  "estimates": [
    { "type": "auto", "name": "Auto", "total": 150, "cashback": 15 },
    { "type": "cab", "name": "Cab", "total": 220, "cashback": 22 },
    { "type": "suv", "name": "SUV", "total": 320, "cashback": 32 }
  ]
}
```

### Get Surge
```
GET /api/surge/:lat/:lng

Response:
{
  "success": true,
  "surge": {
    "multiplier": 1.5,
    "level": "high",
    "available": true
  }
}
```

---

## Drivers

### Get Nearby Drivers
```
GET /api/drivers/nearby?lat=12.9716&lng=77.5946&radius=5&vehicleType=cab

Response:
{
  "success": true,
  "drivers": [
    {
      "id": "driver_456",
      "name": "Rajesh K",
      "rating": 4.8,
      "totalRides": 1500,
      "vehicle": {...},
      "distance": 1.2,
      "eta": 5
    }
  ]
}
```

### Update Driver Status
```
POST /api/drivers/status
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  "status": "online",
  "location": {
    "lat": 12.9716,
    "lng": 77.5946
  }
}

Response:
{
  "success": true,
  "status": "online"
}
```

---

## Scheduled Rides

### Create Scheduled Ride
```
POST /api/scheduled
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  "pickup": {...},
  "drop": {...},
  "vehicleType": "cab",
  "scheduledAt": "2026-05-20T10:00:00Z"
}

Response:
{
  "success": true,
  "scheduledRide": {
    "id": "sr_123",
    "status": "pending",
    "scheduledAt": "2026-05-20T10:00:00Z"
  }
}
```

---

## Corporate

### Create Corporate Account
```
POST /api/corporate/accounts
Authorization: Bearer <admin_token>
Content-Type: application/json

Request:
{
  "companyName": "Acme Corp",
  "domain": "acme.com",
  "email": "admin@acme.com",
  "phone": "919876543210",
  "plan": "growth"
}

Response:
{
  "success": true,
  "account": {
    "id": "corp_123",
    "companyId": "CORP_12345",
    "companyName": "Acme Corp",
    "plan": "growth",
    "status": "trial",
    "budget": {
      "totalBudget": 200000,
      "remainingAmount": 200000
    }
  }
}
```

### Enroll Employee
```
POST /api/corporate/employees
Authorization: Bearer <admin_token>
Content-Type: application/json

Request:
{
  "corporateAccountId": "corp_123",
  "name": "John Doe",
  "email": "john@acme.com",
  "phone": "919876543211",
  "department": "Engineering"
}

Response:
{
  "success": true,
  "employee": {
    "id": "emp_123",
    "employeeId": "EMP_12345",
    "name": "John Doe",
    "status": "enrolled"
  }
}
```

---

## Airports

### Get Airport Queue
```
GET /api/airports/blr_airport/queue?vehicleType=cab

Response:
{
  "success": true,
  "queue": {
    "zoneId": "blr_airport",
    "vehicleType": "cab",
    "totalWaiting": 15,
    "avgWaitTime": 12,
    "entries": [...]
  }
}
```

### Join Airport Queue
```
POST /api/airports/blr_airport/queue/join
Authorization: Bearer <driver_token>
Content-Type: application/json

Request:
{
  "driverId": "driver_456",
  "driverName": "Rajesh K",
  "vehicleType": "cab",
  "vehiclePlate": "KA01AB1234"
}

Response:
{
  "success": true,
  "entry": {
    "id": "qe_123",
    "position": 16,
    "estimatedPickupTime": 48,
    "status": "waiting"
  }
}
```

---

## Gift Cards & Passes

### Purchase Pass
```
POST /api/gift-cards/passes
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  "userId": "user_123",
  "passId": "pass_weekly_basic"
}

Response:
{
  "success": true,
  "userPass": {
    "id": "up_123",
    "passName": "Weekly Pass",
    "ridesRemaining": 25,
    "validUntil": "2026-05-24T00:00:00Z"
  }
}
```

### Check Gift Card Balance
```
GET /api/gift-cards/balance/:code

Response:
{
  "success": true,
  "valid": true,
  "balance": 500,
  "validUntil": "2027-05-18T00:00:00Z"
}
```

---

## Safety

### Trigger SOS
```
POST /api/safety/sos
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  "rideId": "ride_123",
  "userId": "user_123",
  "driverId": "driver_456",
  "type": "emergency",
  "lat": 12.9716,
  "lng": 77.5946
}

Response:
{
  "success": true,
  "alert": {
    "id": "SOS_123",
    "status": "dispatched",
    "policeNotified": true
  }
}
```

---

## Error Codes

| Code | Message | Description |
|------|---------|-------------|
| `AUTH_001` | Invalid OTP | OTP verification failed |
| `AUTH_002` | OTP Expired | OTP has expired |
| `RIDE_001` | No Drivers | No drivers available |
| `RIDE_002` | Ride Cancelled | Ride was cancelled |
| `RIDE_003` | Invalid Status | Invalid ride status transition |
| `PAY_001` | Payment Failed | Payment processing failed |
| `PAY_002` | Insufficient Balance | Not enough wallet balance |

---

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| `/api/auth/*` | 5/min |
| `/api/rides` | 10/min |
| `/api/fares/*` | 30/min |
| All others | 100/min |

---

## Webhooks

Subscribe to events:
```
POST /api/webhooks
Content-Type: application/json

Request:
{
  "url": "https://your-server.com/webhook",
  "events": ["ride.completed", "ride.cancelled"]
}
```
