# Guest Memory TwinOS API Specification

**Version:** 1.0.0
**Last Updated:** 2026-06-12
**Service Port:** 8447

---

## Overview

Guest Memory TwinOS Integration provides REST APIs for managing digital twins of guests, rooms, and properties within the Hotel OS ecosystem. It synchronizes with TwinOS Hub for unified twin orchestration.

---

## Authentication

All API endpoints require authentication via API key:

```
Header: X-API-Key: your-api-key
```

For internal services:

```
Header: X-Internal-Service-Token: your-internal-token
```

---

## Endpoints

### Health & Status

#### GET /health
Health check endpoint (no authentication required).

**Response:**
```json
{
  "status": "healthy",
  "service": "guest-memory-twinos",
  "timestamp": "2026-06-12T10:00:00Z"
}
```

#### GET /ready
Readiness check including TwinOS sync status.

**Response:**
```json
{
  "status": "ready",
  "service": "guest-memory-twinos",
  "twinos_sync_enabled": true,
  "timestamp": "2026-06-12T10:00:00Z"
}
```

---

### Guest Twin Operations

#### POST /api/twins/guest
Create a new guest twin.

**Request Body:**
```json
{
  "guest_id": "optional-custom-id",
  "profile": {
    "name": "John Doe",
    "email": "john.doe@example.com",
    "phone": "+1234567890",
    "nationality": "US",
    "language_preference": "en",
    "accessibility_needs": ["wheelchair"]
  },
  "loyalty": {
    "tier": "gold",
    "points_balance": 5000,
    "total_stays": 10,
    "total_spend": 5000
  },
  "preferences": {
    "room": {
      "floor_preference": "high",
      "view_preference": "ocean",
      "temperature_setting": {
        "default": 72,
        "range": { "min": 68, "max": 76 }
      }
    },
    "dining": {
      "dietary_restrictions": ["vegetarian"],
      "allergies": ["peanuts", "shellfish"],
      "favorite_items": ["pasta", "wine"]
    },
    "amenities": {
      "spa_interests": ["massage", "facial"],
      "fitness_habits": true,
      "pool_usage": true
    },
    "communication": {
      "preferred_channel": "app_push",
      "opt_ins": ["promotions", "updates"]
    }
  },
  "sentiment": {
    "current_score": 85,
    "trend": "improving",
    "key_topics": ["room_quality", "service"]
  },
  "lifetime_value": {
    "clv": 15000,
    "potential_clv": 25000,
    "churn_risk": "low"
  },
  "current_stay": {
    "room_id": "room-501",
    "check_in": "2026-06-12T14:00:00Z",
    "check_out": "2026-06-15T11:00:00Z",
    "adults": 2,
    "children": 0,
    "occasion": "anniversary"
  },
  "sync_to_twinos": true
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "guest_id": "uuid-string",
    "guest_twin_id": "twin.hotel.guest.uuid-string",
    "created_at": "2026-06-12T10:00:00Z",
    "synced_to_twinos": true,
    "twinos_twin_id": "twin.hotel.guest.uuid-string"
  },
  "timestamp": "2026-06-12T10:00:00Z"
}
```

#### GET /api/twins/guest/:id
Retrieve a guest twin by ID.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "guest_id": "uuid-string",
    "profile": { ... },
    "loyalty": { ... },
    "preferences": { ... },
    "sentiment": { ... },
    "lifetime_value": { ... },
    "current_stay": { ... },
    "created_at": "2026-06-12T10:00:00Z",
    "updated_at": "2026-06-12T10:00:00Z"
  },
  "timestamp": "2026-06-12T10:00:00Z"
}
```

#### PUT /api/twins/guest/:id/preferences
Update guest preferences.

**Request Body:**
```json
{
  "preferences": {
    "room": {
      "floor_preference": "high",
      "view_preference": "ocean"
    },
    "dining": {
      "dietary_restrictions": ["vegan"],
      "allergies": ["gluten"]
    }
  },
  "sync_to_twinos": true
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "guest_id": "uuid-string",
    "preferences": { ... },
    "updated_at": "2026-06-12T10:00:00Z",
    "synced_to_twinos": true
  },
  "timestamp": "2026-06-12T10:00:00Z"
}
```

#### GET /api/twins/guest
List all guest twins.

**Response (200 OK):**
```json
{
  "success": true,
  "data": [ ... ],
  "count": 100,
  "timestamp": "2026-06-12T10:00:00Z"
}
```

---

### Room Twin Operations

#### POST /api/twins/room
Create a new room twin.

**Request Body:**
```json
{
  "room_id": "optional-custom-id",
  "property_id": "prop-001",
  "room_number": "501",
  "room_type": "deluxe",
  "floor": 5,
  "view": "ocean",
  "capacity": {
    "max_adults": 4,
    "max_children": 2,
    "max_occupancy": 6
  },
  "bed_configuration": {
    "bed_count": 2,
    "bed_type": "king",
    "rollaway_available": true
  },
  "amenities": {
    "smart_tv": true,
    "smart_speaker": true,
    "minibar": true,
    "jacuzzi": true
  },
  "status": {
    "current": "available"
  },
  "iot_state": {
    "thermostat": { "current": 72, "target": 72, "mode": "auto" },
    "lighting": { "scene": "evening", "brightness": 50 },
    "blinds": "closed",
    "door_lock": "locked",
    "occupancy_sensor": false
  },
  "housekeeping": {
    "frequency": "daily",
    "supply_status": "adequate"
  },
  "revenue": {
    "base_rate": 299,
    "rack_rate": 399
  },
  "sync_to_twinos": true
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "room_id": "uuid-string",
    "room_twin_id": "twin.hotel.room.uuid-string",
    "created_at": "2026-06-12T10:00:00Z",
    "synced_to_twinos": true,
    "twinos_twin_id": "twin.hotel.room.uuid-string"
  },
  "timestamp": "2026-06-12T10:00:00Z"
}
```

#### GET /api/twins/room/:id
Retrieve a room twin by ID.

#### GET /api/twins/room/:id/status
Get detailed room status including IoT state and occupancy.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "room_id": "uuid-string",
    "room_number": "501",
    "status": {
      "current": "occupied",
      "next_available": "2026-06-15T11:00:00Z",
      "maintenance_alerts": []
    },
    "iot_state": {
      "thermostat": { "current": 72, "target": 72, "mode": "auto" },
      "lighting": { "scene": "evening", "brightness": 50 },
      "blinds": "closed",
      "door_lock": "locked",
      "minibar_door": "closed",
      "occupancy_sensor": true
    },
    "housekeeping": {
      "last_cleaned": "2026-06-12T08:00:00Z",
      "next_scheduled": "2026-06-13T08:00:00Z",
      "frequency": "daily",
      "supply_status": "adequate"
    },
    "occupancy": {
      "occupied_by": "guest-uuid",
      "check_in": "2026-06-12T14:00:00Z",
      "check_out": "2026-06-15T11:00:00Z"
    }
  },
  "timestamp": "2026-06-12T10:00:00Z"
}
```

#### GET /api/twins/room
List all room twins.

---

### Property Twin Operations

#### POST /api/twins/property
Create a new property twin.

**Request Body:**
```json
{
  "property_id": "optional-custom-id",
  "brand": "Luxury Collection",
  "name": "Grand Hotel",
  "location": {
    "address": "123 Main Street",
    "city": "New York",
    "country": "USA",
    "coordinates": { "lat": 40.7128, "lng": -74.006 },
    "timezone": "America/New_York"
  },
  "inventory": {
    "total_rooms": 200,
    "by_type": {
      "standard": 100,
      "deluxe": 50,
      "suite": 40,
      "penthouse": 10
    },
    "available_today": 150,
    "available_tomorrow": 140
  },
  "venues": [
    {
      "name": "Main Restaurant",
      "type": "restaurant",
      "capacity": 100,
      "hours": { "open": "06:00", "close": "23:00" },
      "pos_revenue_center_id": "pos-rest-001"
    },
    {
      "name": "Rooftop Bar",
      "type": "bar",
      "capacity": 50
    },
    {
      "name": "Wellness Spa",
      "type": "spa",
      "capacity": 20
    }
  ],
  "staff": {
    "total_count": 150,
    "by_department": {
      "front_desk": 20,
      "housekeeping": 40,
      "f_and_b": 50
    },
    "on_duty_now": 75
  },
  "services": {
    "check_in_24h": true,
    "concierge_available": true,
    "room_service_hours": { "open": "06:00", "close": "23:00" }
  },
  "revenue": {
    "today_revenue": 50000,
    "mtd_revenue": 1500000,
    "ytd_revenue": 18000000,
    "revpar": 250,
    "adr": 350,
    "occupancy_rate": 75
  },
  "sync_to_twinos": true
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "property_id": "uuid-string",
    "property_twin_id": "twin.hotel.property.uuid-string",
    "created_at": "2026-06-12T10:00:00Z",
    "synced_to_twinos": true,
    "twinos_twin_id": "twin.hotel.property.uuid-string"
  },
  "timestamp": "2026-06-12T10:00:00Z"
}
```

#### GET /api/twins/property/:id
Retrieve a property twin by ID.

#### GET /api/twins/property
List all property twins.

---

### Sync Status

#### GET /api/twins/sync-status
Get TwinOS Hub synchronization status.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "twinos_sync_enabled": true,
    "message": "TwinOS Hub synchronization is enabled"
  },
  "timestamp": "2026-06-12T10:00:00Z"
}
```

---

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { ... }
  },
  "timestamp": "2026-06-12T10:00:00Z"
}
```

### Error Codes

| Code | Status | Description |
|------|--------|-------------|
| VALIDATION_ERROR | 400 | Request validation failed |
| UNAUTHORIZED | 401 | Missing or invalid API key |
| INVALID_API_KEY | 401 | API key format invalid |
| FORBIDDEN | 403 | Insufficient permissions |
| TWIN_NOT_FOUND | 404 | Requested twin does not exist |
| NOT_FOUND | 404 | Route not found |
| INTERNAL_ERROR | 500 | Internal server error |

---

## Field Constraints

### Guest Preferences

| Field | Constraints |
|-------|-------------|
| temperature_setting.default | 16-30 |
| noise_tolerance | 1-10 |
| sentiment.current_score | 0-100 |

### Room Configuration

| Field | Constraints |
|-------|-------------|
| floor | positive integer |
| capacity values | non-negative integers |
| occupancy_rate | 0-100 |

---

## TwinOS Twin IDs

| Twin Type | Twin ID Format |
|-----------|----------------|
| Guest | `twin.hotel.guest.{guest_id}` |
| Room | `twin.hotel.room.{room_id}` |
| Property | `twin.hotel.property.{property_id}` |

---

## Rate Limits

| Tier | Requests/Minute |
|------|-----------------|
| Standard | 100 |
| Enterprise | 1000 |

---

## Related Services

| Service | Port | Purpose |
|---------|------|---------|
| TwinOS Hub | 4143 | Central twin orchestration |
| BrandPulse | 4770 | Sentiment analysis |
| REZ POS | 8449 | Transaction processing |
| REZ Loyalty | 8450 | Points management |
