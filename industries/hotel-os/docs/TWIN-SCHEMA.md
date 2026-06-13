# Hotel OS Twin Schemas

## Guest Twin Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "title": "Guest Twin",
  "twinId": "twin.hotel.guest.{guest_id}",
  "version": "1.0",
  "attributes": {
    "guestId": { "type": "string", "format": "uuid" },
    "profile": {
      "type": "object",
      "properties": {
        "name": { "type": "string" },
        "email": { "type": "string", "format": "email" },
        "phone": { "type": "string" },
        "nationality": { "type": "string" },
        "languagePreference": { "type": "string" },
        "accessibilityNeeds": { "type": "array", "items": { "type": "string" } }
      },
      "required": ["name", "email"]
    },
    "loyalty": {
      "type": "object",
      "properties": {
        "tier": { "type": "string", "enum": ["bronze", "silver", "gold", "platinum"] },
        "pointsBalance": { "type": "number" },
        "memberSince": { "type": "string", "format": "date" },
        "totalStays": { "type": "integer" },
        "totalSpend": { "type": "number" }
      }
    },
    "preferences": {
      "type": "object",
      "properties": {
        "room": {
          "floorPreference": { "type": "string" },
          "viewPreference": { "type": "string" },
          "bedConfiguration": { "type": "string" },
          "temperatureSetting": { "type": "number" }
        },
        "dietary": { "type": "array", "items": { "type": "string" } },
        "accessibility": { "type": "array", "items": { "type": "string" } }
      }
    },
    "stays": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "propertyId": { "type": "string" },
          "roomId": { "type": "string" },
          "checkIn": { "type": "string", "format": "date-time" },
          "checkOut": { "type": "string", "format": "date-time" },
          "spend": { "type": "number" }
        }
      }
    },
    "sentiment": {
      "type": "object",
      "properties": {
        "overall": { "type": "number", "minimum": 0, "maximum": 100 },
        "lastUpdated": { "type": "string", "format": "date-time" },
        "sources": { "type": "array", "items": { "type": "string" } }
      }
    }
  },
  "relationships": [
    { "type": "HAS_MANY", "target": "RoomTwin", "label": "currentStay" },
    { "type": "HAS_MANY", "target": "PropertyTwin", "label": "history" },
    { "type": "HAS_ONE", "target": "LoyaltyTwin", "label": "loyalty" }
  ],
  "indexes": ["guestId", "profile.email", "loyalty.tier"]
}
```

### Example
```json
{
  "twinId": "twin.hotel.guest.guest_abc123",
  "version": "1.0",
  "attributes": {
    "guestId": "guest_abc123",
    "profile": {
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "nationality": "US",
      "languagePreference": "en"
    },
    "loyalty": {
      "tier": "gold",
      "pointsBalance": 15000,
      "memberSince": "2024-01-15",
      "totalStays": 12,
      "totalSpend": 8500
    },
    "preferences": {
      "room": {
        "floorPreference": "high",
        "viewPreference": "ocean",
        "bedConfiguration": "king"
      },
      "dietary": ["vegetarian"],
      "accessibility": []
    },
    "stays": [
      {
        "propertyId": "property_hotel1",
        "roomId": "room_101",
        "checkIn": "2026-06-12T14:00:00Z",
        "checkOut": "2026-06-15T11:00:00Z",
        "spend": 750
      }
    ],
    "sentiment": {
      "overall": 85,
      "lastUpdated": "2026-06-12T10:00:00Z",
      "sources": ["checkout_survey", "online_review"]
    }
  }
}
```

---

## Room Twin Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "title": "Room Twin",
  "twinId": "twin.hotel.room.{room_id}",
  "version": "1.0",
  "attributes": {
    "roomId": { "type": "string" },
    "roomNumber": { "type": "string" },
    "floor": { "type": "integer" },
    "type": { "type": "string", "enum": ["standard", "deluxe", "suite", "penthouse"] },
    "features": { "type": "array", "items": { "type": "string" } },
    "maxOccupancy": { "type": "integer" },
    "status": { 
      "type": "string", 
      "enum": ["available", "occupied", "maintenance", "cleaning", "reserved"] 
    },
    "currentGuest": { "type": "string" },
    "housekeeping": {
      "status": { "type": "string" },
      "lastCleaned": { "type": "string", "format": "date-time" },
      "nextScheduled": { "type": "string", "format": "date-time" }
    },
    "iot": {
      "temperature": { "type": "number" },
      "acOn": { "type": "boolean" },
      "minibar": { "type": "array", "items": { "type": "string" } },
      "smartLock": { "type": "string" }
    }
  },
  "relationships": [
    { "type": "BELONGS_TO", "target": "PropertyTwin", "label": "property" },
    { "type": "HAS_ONE", "target": "GuestTwin", "label": "currentGuest" }
  ],
  "indexes": ["roomId", "roomNumber", "status", "propertyId"]
}
```

### Example
```json
{
  "twinId": "twin.hotel.room.room_101",
  "attributes": {
    "roomId": "room_101",
    "roomNumber": "101",
    "floor": 1,
    "type": "deluxe",
    "features": ["ocean_view", "balcony", "king_bed", "smart_tv"],
    "maxOccupancy": 2,
    "status": "occupied",
    "currentGuest": "guest_abc123",
    "housekeeping": {
      "status": "occupied",
      "lastCleaned": "2026-06-12T10:00:00Z",
      "nextScheduled": "2026-06-15T12:00:00Z"
    },
    "iot": {
      "temperature": 22,
      "acOn": true,
      "minibar": ["coke", "water", "chips", "beer"],
      "smartLock": "lock_abc123"
    }
  }
}
```

---

## Property Twin Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "title": "Property Twin",
  "twinId": "twin.hotel.property.{property_id}",
  "version": "1.0",
  "attributes": {
    "propertyId": { "type": "string" },
    "name": { "type": "string" },
    "brand": { "type": "string" },
    "location": {
      "address": { "type": "string" },
      "city": { "type": "string" },
      "country": { "type": "string" },
      "coordinates": { "type": "object" }
    },
    "inventory": {
      "totalRooms": { "type": "integer" },
      "availableRooms": { "type": "integer" },
      "byType": { "type": "object" }
    },
    "revenue": {
      "today": { "type": "number" },
      "monthToDate": { "type": "number" },
      "yearToDate": { "type": "number" },
      "revPAR": { "type": "number" },
      "avgDailyRate": { "type": "number" },
      "occupancyRate": { "type": "number" }
    },
    "venues": {
      "type": "array",
      "items": {
        "name": { "type": "string" },
        "type": { "type": "string" },
        "capacity": { "type": "integer" }
      }
    },
    "amenities": { "type": "array", "items": { "type": "string" } },
    "policies": {
      "checkInTime": { "type": "string" },
      "checkOutTime": { "type": "string" },
      "cancellationPolicy": { "type": "string" }
    }
  },
  "relationships": [
    { "type": "HAS_MANY", "target": "RoomTwin", "label": "rooms" },
    { "type": "HAS_MANY", "target": "GuestTwin", "label": "guests" }
  ],
  "indexes": ["propertyId", "name", "location.city"]
}
```

### Example
```json
{
  "twinId": "twin.hotel.property.property_hotel1",
  "attributes": {
    "propertyId": "property_hotel1",
    "name": "Grand Plaza Hotel",
    "brand": "StayOwn",
    "location": {
      "address": "123 Beach Road",
      "city": "Dubai",
      "country": "UAE",
      "coordinates": { "lat": 25.2048, "lng": 55.2708 }
    },
    "inventory": {
      "totalRooms": 200,
      "availableRooms": 45,
      "byType": {
        "standard": 80,
        "deluxe": 70,
        "suite": 40,
        "penthouse": 10
      }
    },
    "revenue": {
      "today": 28500,
      "monthToDate": 425000,
      "yearToDate": 2150000,
      "revPAR": 142.5,
      "avgDailyRate": 285,
      "occupancyRate": 77.5
    },
    "venues": [
      { "name": "Ocean View Restaurant", "type": "restaurant", "capacity": 120 },
      { "name": "Sky Bar", "type": "bar", "capacity": 80 },
      { "name": "Wellness Spa", "type": "spa", "capacity": 20 }
    ],
    "amenities": ["pool", "gym", "spa", "wifi", "parking", "beach_access"],
    "policies": {
      "checkInTime": "14:00",
      "checkOutTime": "11:00",
      "cancellationPolicy": "Free cancellation until 24 hours before"
    }
  }
}
```

---

## Relationship Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Property Twin                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ • 200 rooms                                          │    │
│  │ • 3 venues (restaurant, bar, spa)                    │    │
│  │ • Revenue tracking                                   │    │
│  └─────────────────────────────────────────────────────┘    │
│                            │                                 │
│           ┌───────────────┼───────────────┐                 │
│           │               │               │                  │
│           ▼               ▼               ▼                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Room 101   │  │  Room 102   │  │  Room 103   │      │
│  │  (Occupied) │  │  (Available)│  │  (Cleaning) │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│           │                                                   │
│           ▼                                                   │
│  ┌──────────────────────────────────────────────────┐      │
│  │              Guest Twin (John Doe)                 │      │
│  │  • Gold tier, 15000 points                        │      │
│  │  • Ocean view preference                          │      │
│  │  • Check-in: Today 2PM                           │      │
│  │  • Check-out: June 15                            │      │
│  └──────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
```
