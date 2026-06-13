# Hotel OS API Reference

**Version:** 1.0.0  
**Base URL:** `https://hotel-twins.staging.rez.io`

---

## Quick Start

### 1. Get API Key
```bash
curl -X POST https://hotel-twins.staging.rez.io/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "your@email.com", "password": "your-password"}'
```

### 2. Make Your First Request
```bash
curl -X POST https://hotel-twins.staging.rez.io/api/twins/guest \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "profile": {
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890"
    },
    "loyalty": {
      "tier": "gold"
    }
  }'
```

---

## Authentication

All API requests require authentication via JWT Bearer token.

```bash
Authorization: Bearer <your_jwt_token>
```

### Rate Limits
| Endpoint | Limit |
|----------|-------|
| Read endpoints | 1000 req/min |
| Write endpoints | 100 req/min |
| Auth endpoints | 10 req/min |

---

## Guest Twin API

### Create Guest Twin
```http
POST /api/twins/guest
```

**Request:**
```json
{
  "profile": {
    "name": "string",
    "email": "string",
    "phone": "string",
    "nationality": "string",
    "languagePreference": "string"
  },
  "loyalty": {
    "tier": "bronze|silver|gold|platinum",
    "pointsBalance": 0
  },
  "preferences": {
    "room": {
      "floorPreference": "string",
      "viewPreference": "string",
      "bedConfiguration": "string"
    },
    "dietary": ["string"],
    "accessibility": ["string"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "twinId": "guest_abc123",
    "profile": {...},
    "createdAt": "2026-06-12T00:00:00Z"
  }
}
```

### Get Guest Twin
```http
GET /api/twins/guest/:id
```

### Update Preferences
```http
PUT /api/twins/guest/:id/preferences
```

### Process Check-in
```http
POST /api/twins/guest/:id/checkin
```

### Process Check-out
```http
POST /api/twins/guest/:id/checkout
```

---

## Room Twin API

### Create Room Twin
```http
POST /api/twins/room
```

**Request:**
```json
{
  "roomNumber": "101",
  "floor": 1,
  "type": "deluxe",
  "features": ["ocean_view", "balcony", "king_bed"],
  "maxOccupancy": 2
}
```

### Get Room Status
```http
GET /api/twins/room/:id/status
```

**Response:**
```json
{
  "success": true,
  "data": {
    "roomId": "room_xyz789",
    "status": "occupied",
    "currentGuest": "guest_abc123",
    "checkIn": "2026-06-12T14:00:00Z",
    "checkOut": "2026-06-15T11:00:00Z",
    "housekeeping": {
      "status": "clean",
      "lastCleaned": "2026-06-12T10:00:00Z"
    },
    "iot": {
      "temperature": 22,
      "acOn": true,
      "minibar": ["coke", "water", "chips"]
    }
  }
}
```

### Update IoT State
```http
PUT /api/twins/room/:id/iot
```

---

## Property Twin API

### Create Property Twin
```http
POST /api/twins/property
```

### Get Property
```http
GET /api/twins/property/:id
```

### Update Revenue
```http
PUT /api/twins/property/:id/revenue
```

---

## Webhook Events

Subscribe to events for real-time updates:

```json
{
  "webhookUrl": "https://your-server.com/webhooks",
  "events": [
    "guest.checkin",
    "guest.checkout",
    "room.status_change",
    "room.iot_update"
  ]
}
```

### Event Payload
```json
{
  "event": "guest.checkin",
  "timestamp": "2026-06-12T14:00:00Z",
  "data": {
    "guestId": "guest_abc123",
    "roomId": "room_xyz789",
    "propertyId": "property_hotel1"
  }
}
```

---

## Error Codes

| Code | Message | Description |
|------|---------|-------------|
| 400 | BAD_REQUEST | Invalid request body |
| 401 | UNAUTHORIZED | Invalid or missing token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Resource not found |
| 409 | CONFLICT | Duplicate resource |
| 429 | RATE_LIMITED | Too many requests |
| 500 | INTERNAL_ERROR | Server error |

---

## Code Examples

### JavaScript
```javascript
const response = await fetch('/api/twins/guest', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    profile: { name: 'John', email: 'john@example.com' }
  })
});
const data = await response.json();
```

### Python
```python
import requests

response = requests.post(
    '/api/twins/guest',
    headers={'Authorization': f'Bearer {token}'},
    json={'profile': {'name': 'John', 'email': 'john@example.com'}}
)
data = response.json()
```

### cURL
```bash
curl -X POST /api/twins/guest \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"profile": {"name": "John", "email": "john@example.com"}}'
```
