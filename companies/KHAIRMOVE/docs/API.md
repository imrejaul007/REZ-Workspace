# KHAIRMOVE API Documentation

## Overview

KHAIRMOVE provides a comprehensive set of APIs for ride-hailing, delivery, logistics, and fleet management.

## Services

| Service | Port | Base URL | OpenAPI |
|---------|------|----------|---------|
| [Ride Service](khaimove-ride-service/src/docs/openapi.yaml) | 4601 | `/api/rides` | ✅ |
| Fleet Service | 4602 | `/api/fleets` | Pending |
| Delivery Service | 4603 | `/api/deliveries` | Pending |
| Logistics Service | 4604 | `/api/carriers` | Pending |
| Rental Service | 4605 | `/api/rentals` | Pending |
| BuzzLocal | 4606 | `/api/pools` | Pending |

## Authentication

### JWT Bearer Token
```
Authorization: Bearer <your-jwt-token>
```

### Internal Service Token
```
X-Internal-Token: <your-internal-token>
```

## Common Headers

| Header | Required | Description |
|--------|----------|-------------|
| `Content-Type` | Yes | `application/json` |
| `Authorization` | Conditional | `Bearer <token>` for user endpoints |
| `X-Internal-Token` | Conditional | For service-to-service calls |
| `X-User-Id` | Conditional | User ID for some endpoints |

## Response Format

All endpoints return:

```json
{
  "success": true,
  "data": { ... }
}
```

Or on error:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

## Rate Limiting

| Tier | Requests/minute |
|------|-----------------|
| Default | 100 |
| Authenticated | 500 |
| Internal | Unlimited |

## Ride Service API

### Endpoints

#### Get Fare Estimate
```http
POST /api/fares/estimate
```

**Request:**
```json
{
  "pickup": { "lat": 12.9716, "lng": 77.5946, "address": "MG Road" },
  "drop": { "lat": 12.9350, "lng": 77.6246, "address": "Koramangala" },
  "vehicleType": "cab"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "vehicleType": "cab",
    "baseFare": 40,
    "perKmRate": 14,
    "perMinRate": 2,
    "estimatedDistance": 5.2,
    "estimatedDuration": 15,
    "surgeMultiplier": 1.0,
    "subtotal": 132.8,
    "cashback": 13.28,
    "estimatedFare": 132.8
  }
}
```

#### Request a Ride
```http
POST /api/rides
```

**Request:**
```json
{
  "pickup": { "lat": 12.9716, "lng": 77.5946 },
  "drop": { "lat": 12.9350, "lng": 77.6246 },
  "vehicleType": "cab"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "ride": {
      "id": "abc123...",
      "status": "requested",
      "otp": "A1B2",
      "fare": { ... }
    },
    "fraudCheck": {
      "riskLevel": "low",
      "passed": true
    }
  }
}
```

#### Get Nearby Drivers
```http
GET /api/drivers/nearby?lat=12.9716&lng=77.5946&vehicleType=cab
```

**Response:**
```json
{
  "success": true,
  "data": {
    "drivers": [
      {
        "id": "driver123",
        "name": "John Doe",
        "vehicle": { "type": "cab", "make": "Maruti", "model": "Swift" },
        "currentLocation": { "lat": 12.9750, "lng": 77.5950 },
        "rating": 4.8,
        "mlScore": 4.6,
        "tier": "gold"
      }
    ],
    "demandLevel": "medium"
  }
}
```

## Vehicle Types

| Type | Base Fare | Per KM | Per Min | Icon |
|------|----------|--------|---------|------|
| Bike | ₹15 | ₹6 | ₹1 | 🏍️ |
| Auto | ₹25 | ₹10 | ₹1.5 | 🛺 |
| Cab | ₹40 | ₹14 | ₹2 | 🚗 |
| SUV | ₹60 | ₹18 | ₹2.5 | 🚙 |

## Status Codes

| Code | Status | Description |
|------|--------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created |
| 400 | Bad Request | Invalid input |
| 401 | Unauthorized | Invalid/missing token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 429 | Too Many Requests | Rate limited |
| 500 | Server Error | Internal error |

## Webhooks

Subscribe to ride events:

```javascript
socket.on('ride:requested', (data) => { ... });
socket.on('ride:accepted', (data) => { ... });
socket.on('ride:completed', (data) => { ... });
socket.on('ride:cancelled', (data) => { ... });
```

## SDK Examples

### JavaScript/TypeScript
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:4601',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});

const fare = await api.post('/api/fares/estimate', {
  pickup: { lat: 12.9716, lng: 77.5946 },
  drop: { lat: 12.9350, lng: 77.6246 },
  vehicleType: 'cab',
});
```

### cURL
```bash
curl -X POST http://localhost:4601/api/rides \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"pickup":{"lat":12.9716,"lng":77.5946},"drop":{"lat":12.935,"lng":77.6246},"vehicleType":"cab"}'
```
