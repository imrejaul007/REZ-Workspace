# Transport OS Integration Specification

**Version:** 1.0.0  
**Last Updated:** 2026-06-12  
**Industry:** Transportation / Mobility

---

## Executive Summary

The Transport OS Integration Specification defines the technical architecture for connecting RTMN's transportation products with TwinOS, enabling real-time digital twins of vehicles, drivers, riders, fleets, journeys, orders, and travelers. The integration creates a unified data layer where KHAIRMOVE Fleet serves as the primary operational hub, feeding vehicle and fleet data to TwinOS while consuming intelligence for route optimization and dispatch decisions.

**Key Integration Point:** KHAIRMOVE Fleet ↔ TwinOS  
**Data Flow Direction:** Bidirectional - Fleet produces operational data, TwinOS orchestrates mobility twins  
**Primary Protocol:** REST API with MQTT for IoT vehicle telemetry  
**Authentication:** OAuth 2.0 + API Keys for driver/rider apps

---

## Product Capability Matrix

### 1. KHAIRMOVE Ride

| Attribute | Value |
|-----------|-------|
| **Port** | `9043` |
| **Capabilities** | On-demand rides, scheduled rides, airport transfers, corporate accounts, multiple vehicle types |
| **Data Produced** | Ride requests, matches, rides completed, ratings, route data |
| **Data Needed** | Rider Twin, Driver Twin, Vehicle Twin, Journey Twin |

### 2. KHAIRMOVE Fleet

| Attribute | Value |
|-----------|-------|
| **Port** | `9044` |
| **Capabilities** | Fleet management, vehicle tracking, maintenance scheduling, driver assignment, compliance monitoring |
| **Data Produced** | Fleet status, vehicle telemetry, maintenance alerts, assignment data |
| **Data Needed** | Vehicle Twin, Driver Twin, Fleet Twin |
| **TwinOS Role** | PRIMARY PRODUCER - fleet operations hub |

### 3. KHAIRMOVE Logistics

| Attribute | Value |
|-----------|-------|
| **Port** | `9045` |
| **Capabilities** | Package delivery, freight management, route optimization, real-time tracking, proof of delivery |
| **Data Produced** | Deliveries, shipments, tracking events, POD data |
| **Data Needed** | Vehicle Twin, Order Twin, Driver Twin |

### 4. Dispatch

| Attribute | Value |
|-----------|-------|
| **Port** | `9046` |
| **Capabilities** | Intelligent dispatch, surge pricing, driver routing, ETA management, multi-modal coordination |
| **Data Produced** | Dispatch decisions, routing data, pricing decisions, allocation data |
| **Data Needed** | Driver Twin, Vehicle Twin, Rider Twin, Order Twin |

### 5. KHAIRMOVE Driver

| Attribute | Value |
|-----------|-------|
| **Port** | `9047` |
| **Capabilities** | Driver app, earnings tracking, navigation, customer ratings, document management |
| **Data Produced** | Driver status, location updates, earnings, ratings, availability |
| **Data Needed** | Driver Twin, Vehicle Twin, Order Twin |

### 6. Airzy

| Attribute | Value |
|-----------|-------|
| **Port** | `9048` |
| **Capabilities** | Air travel booking, flight tracking, seat selection, lounge access, travel insurance |
| **Data Produced** | Bookings, flight data, traveler profiles, loyalty points |
| **Data Needed** | Traveler Twin, Vehicle Twin (aircraft) |

### 7. Distribution OS

| Attribute | Value |
|-----------|-------|
| **Port** | `9049` |
| **Capabilities** | Warehouse management, last-mile delivery, cross-docking, returns processing |
| **Data Produced** | Shipments, delivery status, warehouse data, returns |
| **Data Needed** | Vehicle Twin, Order Twin, Driver Twin |

### 8. Transport CRM Service

| Attribute | Value |
|-----------|-------|
| **Port** | `TBD` |
| **Company** | REZ Merchant |
| **Capabilities** | Customer profiles, segmentation, campaigns, visit tracking |
| **Data Produced** | Customer segments, campaign results, churn risk |
| **Data Needed** | Customer Twin, Transaction Twin |
| **TwinOS Role** | CUSTOMER INTELLIGENCE |

---

## Digital Twin Definitions

### VehicleTwin

**TwinOS Entity ID:** `twin.transport.vehicle.{vehicle_id}`

**Attributes:**
```json
{
  "vehicle_id": "string (UUID)",
  "profile": {
    "vin": "string",
    "license_plate": "string",
    "make": "string",
    "model": "string",
    "year": "number",
    "color": "string",
    "category": "sedan|suv|van|truck|motorcycle|electric|bike|scooter",
    "capacity": {
      "passengers": "number",
      "cargo_weight_kg": "number",
      "cargo_volume_m3": "number"
    }
  },
  "ownership": {
    "type": "owned|leased|rented|partner",
    "owner_id": "string",
    "fleet_id": "string|null"
  },
  "status": {
    "current": "available|busy|offline|maintenance|charging|cleaning",
    "location": {
      "lat": "number",
      "lng": "number",
      "address": "string|null",
      "updated_at": "ISO8601 datetime"
    },
    "heading": "number (degrees)",
    "speed": "number (km/h)",
    "since": "ISO8601 datetime"
  },
  "telemetry": {
    "fuel_level": "number (percentage)|null",
    "battery_level": "number (percentage)|null",
    "odometer": "number (km)",
    "engine_hours": "number",
    "diagnostics": {
      "engine_status": "ok|warning|critical",
      "tire_pressure": ["number"],
      "brake_status": "ok|warning|critical",
      "oil_level": "number (percentage)",
      "coolant_temp": "number",
      "error_codes": ["string"]
    }
  },
  "maintenance": {
    "next_service_date": "ISO8601 date",
    "next_service_km": "number",
    "last_service_date": "ISO8601 date",
    "last_service_km": "number",
    "insurance_expiry": "ISO8601 date",
    "registration_expiry": "ISO8601 date",
    "inspection_expiry": "ISO8601 date",
    "alerts": ["string"]
  },
  "utilization": {
    "today_trips": "number",
    "today_revenue": "number",
    "week_trips": "number",
    "week_revenue": "number",
    "utilization_rate": "number (percentage)",
    "avg_trip_distance_km": "number",
    "avg_trip_duration_minutes": "number"
  },
  "cleanliness": {
    "last_cleaned": "ISO8601 datetime",
    "cleanliness_score": "number (1-5)",
    "needs_cleaning": "boolean"
  }
}
```

**Relationships:**
- `ASSIGNED_TO` → Fleet Twin
- `DRIVEN_BY` → DriverTwin (when active)
- `SERVICES` → OrderTwin (1:many)
- `LOCATED_IN` → Area Twin

**Managing Agent:** `agent.vehicle_management`

### DriverTwin

**TwinOS Entity ID:** `twin.transport.driver.{driver_id}`

**Attributes:**
```json
{
  "driver_id": "string (UUID)",
  "profile": {
    "name": {
      "first": "string",
      "last": "string"
    },
    "email": "string",
    "phone": "string",
    "photo_url": "string",
    "date_of_birth": "ISO8601 date",
    "language": "string"
  },
  "licensing": {
    "license_number": "string",
    "license_type": "string",
    "license_expiry": "ISO8601 date",
    "license_images": ["string (URLs)"],
    "background_check": {
      "status": "clear|pending|failed",
      "completed_at": "ISO8601 datetime|null"
    }
  },
  "status": {
    "current": "online|busy|offline|break|suspended",
    "location": {
      "lat": "number",
      "lng": "number",
      "updated_at": "ISO8601 datetime"
    },
    "vehicle_id": "string|null",
    "current_order_id": "string|null"
  },
  "performance": {
    "total_trips": "number",
    "total_distance_km": "number",
    "total_earnings": "number",
    "avg_rating": "number (1-5)",
    "rating_count": "number",
    "acceptance_rate": "number (percentage)",
    "cancellation_rate": "number (percentage)",
    "on_time_rate": "number (percentage)"
  },
  "earnings": {
    "today_earnings": "number",
    "week_earnings": "number",
    "month_earnings": "number",
    "pending_payout": "number",
    "last_payout": {
      "amount": "number",
      "date": "ISO8601 date"
    }
  },
  "schedule": {
    "today_hours": "number",
    "week_hours": "number",
    "regulatory_hours_remaining": "number",
    "shift_start": "ISO8601 datetime|null",
    "shift_end": "ISO8601 datetime|null"
  },
  "vehicle_id": "string|null",
  "fleet_id": "string|null"
}
```

**Relationships:**
- `DRIVES` → VehicleTwin (when active)
- `MEMBER_OF` → FleetTwin
- `COMPLETES` → OrderTwin (1:many)
- `RECEIVES` → JourneyTwin (1:many)

**Managing Agent:** `agent.driver_management`

### RiderTwin

**TwinOS Entity ID:** `twin.transport.rider.{rider_id}`

**Attributes:**
```json
{
  "rider_id": "string (UUID)",
  "profile": {
    "name": {
      "first": "string",
      "last": "string"
    },
    "email": "string",
    "phone": "string",
    "photo_url": "string|null"
  },
  "payment": {
    "default_payment_method": "string",
    "saved_cards": [
      {
        "card_id": "string",
        "last_four": "string",
        "brand": "string",
        "is_default": "boolean"
      }
    ],
    "cash_enabled": "boolean"
  },
  "preferences": {
    "preferred_vehicle_type": "string",
    "preferred_payment": "string",
    "smoking_policy": "no_preference|no_smoking",
    "music_preference": "no_preference|quiet|any",
    "air_conditioning": "no_preference|on|off",
    "special_assistance": ["string"]
  },
  "addresses": {
    "home": {
      "lat": "number",
      "lng": "number",
      "address": "string",
      "label": "string"
    },
    "work": {
      "lat": "number",
      "lng": "number",
      "address": "string",
      "label": "string"
    },
    "favorites": [
      {
        "lat": "number",
        "lng": "number",
        "address": "string",
        "label": "string"
      }
    ]
  },
  "loyalty": {
    "member_id": "string|null",
    "tier": "basic|silver|gold|platinum",
    "points_balance": "number",
    "lifetime_points": "number"
  },
  "activity": {
    "total_trips": "number",
    "total_spend": "number",
    "avg_trip_cost": "number",
    "last_trip": "ISO8601 datetime",
    "favorite_routes": [
      {
        "from": "string",
        "to": "string",
        "count": "number"
      }
    ]
  },
  "feedback": {
    "avg_rating": "number (1-5)",
    "given_count": "number",
    "reports_count": "number"
  }
}
```

**Relationships:**
- `REQUESTS` → OrderTwin (1:many)
- `TRAVELS` → JourneyTwin (1:many)
- `EARNS` → Loyalty Points

**Managing Agent:** `agent.rider_intelligence`

### FleetTwin

**TwinOS Entity ID:** `twin.transport.fleet.{fleet_id}`

**Attributes:**
```json
{
  "fleet_id": "string (UUID)",
  "profile": {
    "name": "string",
    "type": "independent|partner|corporate",
    "contact": {
      "name": "string",
      "email": "string",
      "phone": "string"
    }
  },
  "vehicles": {
    "total": "number",
    "active": "number",
    "maintenance": "number",
    "offline": "number"
  },
  "drivers": {
    "total": "number",
    "online": "number",
    "busy": "number",
    "offline": "number"
  },
  "performance": {
    "today_trips": "number",
    "today_revenue": "number",
    "week_trips": "number",
    "week_revenue": "number",
    "avg_rating": "number (1-5)",
    "avg_eta_minutes": "number"
  },
  "utilization": {
    "vehicle_utilization_rate": "number (percentage)",
    "driver_utilization_rate": "number (percentage)",
    "peak_hours": ["string (HH:MM)"]
  },
  "compliance": {
    "insurance_current": "boolean",
    "vehicles_inspected": "number",
    "drivers_verified": "number",
    "violations": "number"
  },
  "financials": {
    "pending_payout": "number",
    "commission_rate": "number (percentage)",
    "last_payout": {
      "amount": "number",
      "date": "ISO8601 date"
    }
  }
}
```

**Relationships:**
- `OWNS` → VehicleTwin (1:many)
- `EMPLOYS` → DriverTwin (1:many)
- `PARTICIPATES_IN` → AreaTwin (1:many)

**Managing Agent:** `agent.fleet_management`

### JourneyTwin

**TwinOS Entity ID:** `twin.transport.journey.{journey_id}`

**Attributes:**
```json
{
  "journey_id": "string (UUID)",
  "order_id": "string",
  "type": "ride|delivery|freight",
  "status": {
    "current": "requested|assigned|pickup|en_route|delivered|completed|cancelled",
    "started_at": "ISO8601 datetime",
    "updated_at": "ISO8601 datetime"
  },
  "route": {
    "origin": {
      "lat": "number",
      "lng": "number",
      "address": "string",
      "name": "string|null",
      "instructions": "string|null"
    },
    "destination": {
      "lat": "number",
      "lng": "number",
      "address": "string",
      "name": "string|null",
      "instructions": "string|null"
    },
    "waypoints": [
      {
        "lat": "number",
        "lng": "number",
        "address": "string",
        "stop_duration_minutes": "number"
      }
    ],
    "distance_km": "number",
    "estimated_duration_minutes": "number",
    "polyline": "string (encoded)"
  },
  "tracking": {
    "current_location": {
      "lat": "number",
      "lng": "number",
      "updated_at": "ISO8601 datetime"
    },
    "eta_to_pickup": "number (minutes)",
    "eta_to_destination": "number (minutes)",
    "trajectory": [
      {
        "lat": "number",
        "lng": "number",
        "timestamp": "ISO8601 datetime"
      }
    ]
  },
  "timeline": {
    "requested_at": "ISO8601 datetime",
    "assigned_at": "ISO8601 datetime|null",
    "pickup_arrived_at": "ISO8601 datetime|null",
    "picked_up_at": "ISO8601 datetime|null",
    "delivered_at": "ISO8601 datetime|null",
    "completed_at": "ISO8601 datetime|null"
  },
  "driver_id": "string|null",
  "vehicle_id": "string|null",
  "rider_id": "string"
}
```

**Relationships:**
- `PART_OF` → OrderTwin
- `TRAVELED_BY` → RiderTwin
- `DRIVEN_BY` → DriverTwin
- `VEHICLE_USED` → VehicleTwin

**Managing Agent:** `agent.journey_tracking`

### OrderTwin

**TwinOS Entity ID:** `twin.transport.order.{order_id}`

**Attributes:**
```json
{
  "order_id": "string (UUID)",
  "rider_id": "string",
  "type": "ride|delivery|scheduled",
  "status": {
    "current": "pending|searching|assigned|in_progress|completed|cancelled|no_show",
    "cancellation_reason": "string|null",
    "cancelled_by": "rider|driver|system|null"
  },
  "service_type": "economy|comfort|premium|van|truck|moto",
  "vehicle_type": "string",
  "pickup": {
    "lat": "number",
    "lng": "number",
    "address": "string",
    "name": "string|null",
    "instructions": "string|null"
  },
  "dropoff": {
    "lat": "number",
    "lng": "number",
    "address": "string",
    "name": "string|null",
    "instructions": "string|null"
  },
  "scheduled": {
    "is_scheduled": "boolean",
    "pickup_time": "ISO8601 datetime|null"
  },
  "passengers": {
    "count": "number",
    "luggage": "number"
  },
  "fare": {
    "estimated": "number",
    "actual": "number",
    "distance_km": "number",
    "duration_minutes": "number",
    "base_fare": "number",
    "distance_fare": "number",
    "time_fare": "number",
    "surge_multiplier": "number",
    "discount": "number",
    "tip": "number",
    "currency": "string"
  },
  "payment": {
    "method": "card|cash|wallet",
    "status": "pending|paid|refunded",
    "transaction_id": "string|null"
  },
  "driver_id": "string|null",
  "vehicle_id": "string|null",
  "fleet_id": "string|null",
  "journey_id": "string|null"
}
```

**Relationships:**
- `REQUESTED_BY` → RiderTwin
- `ASSIGNED_TO` → DriverTwin
- `FULFILLED_BY` → VehicleTwin
- `GENERATES` → JourneyTwin

**Managing Agent:** `agent.order_management`

### TravelerTwin

**TwinOS Entity ID:** `twin.transport.traveler.{traveler_id}`

**Attributes:**
```json
{
  "traveler_id": "string (UUID)",
  "profile": {
    "name": {
      "first": "string",
      "last": "string",
      "title": "string|null"
    },
    "email": "string",
    "phone": "string",
    "date_of_birth": "ISO8601 date",
    "passport": {
      "number": "string",
      "country": "string",
      "expiry": "ISO8601 date"
    }
  },
  "preferences": {
    "seat_preference": "window|aisle|middle|no_preference",
    "meal_preference": "regular|vegetarian|vegan|halal|kosher|gluten_free",
    "special_assistance": ["string"],
    "flight_class": "economy|business|first"
  },
  "loyalty": {
    "program_id": "string",
    "tier": "basic|silver|gold|platinum",
    "points_balance": "number",
    "elite_qualifying_miles": "number"
  },
  "bookings": [
    {
      "booking_id": "string",
      "type": "flight|hotel|car|insurance",
      "status": "confirmed|pending|cancelled",
      "confirmation_number": "string",
      "travel_date": "ISO8601 date",
      "details": "object"
    }
  ],
  "flight_history": {
    "total_flights": "number",
    "favorite_routes": ["string"],
    "preferred_airlines": ["string"],
    "avg_trip_length": "number (nights)"
  }
}
```

**Relationships:**
- `BOOKS` → BookingTwin (1:many)
- `MEMBER_OF` → Loyalty Program
- `FLIES` → FlightTwin

**Managing Agent:** `agent.traveler_intelligence`

---

## Integration Flows

### Flow 1: Ride Request to Completion

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ KHAIRMOVE   │────▶│   TwinOS    │────▶│  Dispatch   │────▶│ KHAIRMOVE   │
│   Ride      │     │(Order Twin) │     │  (Match)    │     │   Driver    │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                           │                    │                    │
                           ▼                    ▼                    ▼
                    ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
                    │ KHAIRMOVE   │     │   TwinOS    │     │   TwinOS    │
                    │   Fleet     │     │(Journey Twin)│    │(VehicleTwin)│
                    └─────────────┘     └─────────────┘     └─────────────┘
```

**API Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/orders` | Create order |
| GET | `/api/v1/orders/{order_id}` | Get order |
| PATCH | `/api/v1/orders/{order_id}/status` | Update order status |
| POST | `/api/v1/twins/order` | Create Order Twin |
| GET | `/api/v1/twins/order/{order_id}` | Get Order Twin |
| POST | `/api/v1/dispatch/match` | Find driver match |
| GET | `/api/v1/twins/journey/{journey_id}` | Get Journey Twin |
| WS | `/ws/order/{order_id}/tracking` | Real-time tracking |

**Request/Response Example:**

```json
// POST /api/v1/orders
{
  "rider_id": "RID-123",
  "type": "ride",
  "service_type": "comfort",
  "pickup": {
    "lat": 25.2048,
    "lng": 55.2708,
    "address": "Dubai Mall, Dubai"
  },
  "dropoff": {
    "lat": 25.2532,
    "lng": 55.3657,
    "address": "DXB Airport Terminal 3"
  },
  "scheduled": {
    "is_scheduled": false
  },
  "passengers": {
    "count": 2,
    "luggage": 2
  }
}

// Response
{
  "order_id": "ORD-2024-001234",
  "status": "searching",
  "estimated_fare": 85.00,
  "estimated_pickup_minutes": 4,
  "surge_multiplier": 1.0,
  "search_radius_km": 3
}
```

### Flow 2: Fleet Operations

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ KHAIRMOVE   │────▶│   TwinOS    │────▶│  Dispatch   │────▶│ KHAIRMOVE   │
│   Fleet     │     │(Fleet Twin) │     │  (Optimize) │     │   Driver    │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

**API Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/twins/fleet/{fleet_id}` | Get Fleet Twin |
| PATCH | `/api/v1/twins/fleet/{fleet_id}` | Update Fleet Twin |
| GET | `/api/v1/twins/vehicle/{vehicle_id}` | Get Vehicle Twin |
| PATCH | `/api/v1/twins/vehicle/{vehicle_id}/status` | Update vehicle status |
| POST | `/api/v1/telemetry` | Submit vehicle telemetry |
| GET | `/api/v1/fleet/{fleet_id}/utilization` | Get fleet utilization |
| WS | `/ws/fleet/{fleet_id}/updates` | Real-time fleet updates |

### Flow 3: Logistics & Distribution

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  KHAIRMOVE  │────▶│   TwinOS    │────▶│ Distribution│────▶│   TwinOS    │
│  Logistics  │     │(Order Twin) │     │    OS       │     │(JourneyTwin)│
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

**API Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/deliveries` | Create delivery |
| GET | `/api/v1/deliveries/{delivery_id}` | Get delivery |
| PATCH | `/api/v1/deliveries/{delivery_id}/status` | Update status |
| POST | `/api/v1/deliveries/{delivery_id}/pod` | Submit proof of delivery |
| GET | `/api/v1/twins/order/{order_id}/tracking` | Get tracking |

---

## Agent Architecture

### Agent Registry

| Agent ID | Type | Responsibilities |
|----------|------|------------------|
| `agent.vehicle_management` | Operations | Vehicle tracking, maintenance, diagnostics |
| `agent.driver_management` | Operations | Driver tracking, performance, compliance |
| `agent.rider_intelligence` | Analytics | Rider profiling, preferences, loyalty |
| `agent.fleet_management` | Operations | Fleet optimization, utilization, compliance |
| `agent.journey_tracking` | Operations | Real-time tracking, ETA, route optimization |
| `agent.order_management` | Operations | Order lifecycle, pricing, matching |
| `agent.dispatch` | Intelligence | Intelligent matching, surge pricing, routing |
| `agent.traveler_intelligence` | Analytics | Traveler profiling, booking optimization |
| `agent.crm` | CRM | Customer profiles, segmentation, campaign management |
| `agent.twin_orchestrator` | TwinOS Core | Twin CRUD, relationship management |

### Agent Communication Patterns

**Pub/Sub Topics:**
- `transport.order.created` - New order events
- `transport.order.assigned` - Order assignment
- `transport.order.completed` - Order completion
- `transport.driver.location` - Driver location updates
- `transport.vehicle.telemetry` - Vehicle telemetry
- `transport.journey.started` - Journey start
- `transport.journey.completed` - Journey completion
- `transport.fleet.alert` - Fleet alerts
- `transport.surge.pricing` - Surge pricing events

**MQTT Topics (Vehicle Telemetry):**
```
transport/vehicle/{vehicle_id}/telemetry
transport/vehicle/{vehicle_id}/location
transport/vehicle/{vehicle_id}/diagnostics
```

**Event Schema:**
```json
{
  "event_type": "string",
  "entity_type": "order|vehicle|driver|rider|journey|fleet",
  "entity_id": "string",
  "timestamp": "ISO8601 datetime",
  "location": {
    "lat": "number",
    "lng": "number"
  },
  "data": {}
}
```

---

## Business Copilot Queries Supported

### Operations Queries

| Query | Description | Example |
|-------|-------------|---------|
| `fleet_status` | Get fleet overview | "What's the status of Fleet 5?" |
| `vehicle_location` | Track vehicle | "Where is vehicle V-123?" |
| `driver_availability` | Check drivers | "How many drivers are online in Dubai?" |
| `order_status` | Track order | "Where's my ride?" |
| `eta_query` | Get ETA | "When will my driver arrive?" |

### Performance Queries

| Query | Description | Example |
|-------|-------------|---------|
| `driver_performance` | Driver metrics | "What's driver D-456's rating?" |
| `fleet_utilization` | Fleet metrics | "What's Fleet 5's utilization today?" |
| `trip_analytics` | Trip analysis | "How many trips did we complete this week?" |
| `revenue_metrics` | Revenue data | "What's our revenue for today?" |
| `wait_time_analysis` | Wait times | "What's the average wait time?" |

### Rider/Driver Queries

| Query | Description | Example |
|-------|-------------|---------|
| `rider_history` | Rider history | "What's this rider's trip history?" |
| `driver_earnings` | Earnings | "How much has driver D-456 earned today?" |
| `preference_lookup` | Preferences | "What are this rider's preferences?" |
| `loyalty_status` | Loyalty | "What's this rider's loyalty tier?" |

### Logistics Queries

| Query | Description | Example |
|-------|-------------|---------|
| `delivery_status` | Track delivery | "Where's my package?" |
| `route_optimization` | Optimize route | "What's the best route for this delivery?" |
| `pod_status` | Proof of delivery | "Did we get POD for delivery D-789?" |
| `capacity_planning` | Capacity | "Do we have capacity for 50 more deliveries?" |

### Example Copilot Interactions

```python
# Example: Fleet status
{
  "query": "What's the status of our fleet in Dubai?",
  "agent": "agent.fleet_management",
  "context": {
    "fleet_id": "FLEET-001",
    "location": "Dubai"
  },
  "response": {
    "fleet_id": "FLEET-001",
    "status": {
      "total_vehicles": 50,
      "active": 42,
      "available": 28,
      "busy": 14,
      "maintenance": 5,
      "offline": 3
    },
    "drivers": {
      "total": 50,
      "online": 45,
      "busy": 14,
      "offline": 5
    },
    "performance": {
      "today_trips": 387,
      "today_revenue": 42500,
      "avg_rating": 4.7,
      "avg_eta_minutes": 3.2
    },
    "alerts": [
      {
        "type": "maintenance",
        "vehicle_id": "V-023",
        "message": "Scheduled maintenance due in 3 days"
      }
    ]
  }
}

# Example: Driver matching
{
  "query": "Find the best driver for this ride request",
  "agent": "agent.dispatch",
  "context": {
    "order_id": "ORD-2024-001234",
    "pickup_location": { "lat": 25.2048, "lng": 55.2708 },
    "service_type": "comfort"
  },
  "response": {
    "recommended_driver": {
      "driver_id": "D-456",
      "name": "Ahmed Hassan",
      "rating": 4.9,
      "distance_km": 1.2,
      "eta_minutes": 3,
      "accept_probability": 0.95
    },
    "alternatives": [
      {
        "driver_id": "D-789",
        "name": "Omar Ali",
        "rating": 4.8,
        "distance_km": 1.5,
        "eta_minutes": 4
      }
    ]
  }
}
```

---

## Economic Integration

### Payment Flows

| Flow | Description | Integration |
|------|-------------|-------------|
| Ride Payment | Fare collection | KHAIRMOVE Ride → TwinOS → Payment Gateway |
| Driver Payout | Earnings distribution | TwinOS → KHAIRMOVE Driver → Driver |
| Fleet Commission | Fleet share | TwinOS → Fleet → Payout |
| Surge Pricing | Dynamic pricing | Dispatch → TwinOS → Rider |
| Delivery Payment | Logistics billing | KHAIRMOVE Logistics → TwinOS → Business |

**API Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/payments/ride` | Process ride payment |
| POST | `/api/v1/payments/payout` | Process driver payout |
| GET | `/api/v1/drivers/{driver_id}/earnings` | Get driver earnings |
| POST | `/api/v1/surge/calculate` | Calculate surge |

### Rewards Integration

| Program | Points Source | Redemption |
|---------|--------------|------------|
| Rider Loyalty | Rides, deliveries | Free rides, discounts |
| Driver Rewards | Completed trips | Bonus payments, benefits |
| Referral Program | Successful referrals | Account credit |

**Commission Structure:**
```json
{
  "driver_commission": {
    "base_rate": 80,
    "fleet_share": 20
  },
  "surge_sharing": {
    "driver_portion": 0.7,
    "platform_portion": 0.3
  },
  "loyalty_points": {
    "per_dollar_spent": 1.0,
    "redemption_rate": {
      "points_per_dollar": 100,
      "dollar_value": 1.00
    }
  }
}
```

---

## Implementation Roadmap

### Week 1: Foundation

**Objective:** Set up TwinOS infrastructure and core transport twins

| Task | Description | Owner | Deliverable |
|------|-------------|-------|-------------|
| 1.1 | Configure TwinOS tenant | DevOps | TwinOS tenant provisioned |
| 1.2 | Define twin schemas | Data Eng | JSON schemas for all 7 twins |
| 1.3 | Set up KHAIRMOVE Fleet API | Backend | Fleet API live |
| 1.4 | Configure OAuth + API Keys | Security | Auth configured |
| 1.5 | Create test environment | DevOps | Isolated test environment |
| 1.6 | Document API contracts | API Team | OpenAPI specs |
| 1.7 | Set up MQTT broker | DevOps | IoT telemetry |
| 1.8 | Create twin provisioning scripts | Data Eng | Automated provisioning |

**Acceptance Criteria:**
- TwinOS tenant accessible
- All twin schemas validated
- KHAIRMOVE Fleet API responding
- MQTT broker operational

### Week 2: Vehicle & Driver Twins

**Objective:** Implement VehicleTwin and DriverTwin

| Task | Description | Owner | Deliverable |
|------|-------------|-------|-------------|
| 2.1 | Implement VehicleTwin CRUD | Backend | VehicleTwin API |
| 2.2 | Implement DriverTwin CRUD | Backend | DriverTwin API |
| 2.3 | Build telemetry ingestion | Data Eng | Real-time telemetry |
| 2.4 | Create KHAIRMOVE Fleet integration | Backend | Fleet ↔ TwinOS |
| 2.5 | Build KHAIRMOVE Driver integration | Backend | Driver ↔ TwinOS |
| 2.6 | Implement location tracking | Backend | GPS tracking |
| 2.7 | Create WebSocket connections | Backend | Real-time streaming |
| 2.8 | Build test scenarios | QA | Integration tests |

**Acceptance Criteria:**
- VehicleTwin operational
- DriverTwin operational
- Telemetry flowing
- Location tracking working

### Week 3: Order & Journey Twins

**Objective:** Implement OrderTwin and JourneyTwin

| Task | Description | Owner | Deliverable |
|------|-------------|-------|-------------|
| 3.1 | Implement OrderTwin CRUD | Backend | OrderTwin API |
| 3.2 | Implement JourneyTwin CRUD | Backend | JourneyTwin API |
| 3.3 | Build order lifecycle | Backend | Order workflow |
| 3.4 | Create KHAIRMOVE Ride integration | Backend | Ride ↔ TwinOS |
| 3.5 | Implement real-time tracking | Backend | Tracking engine |
| 3.6 | Deploy journey_tracking agent | ML Team | Agent operational |
| 3.7 | Deploy order_management agent | ML Team | Agent operational |
| 3.8 | Build ETA calculation | Backend | ETA engine |

**Acceptance Criteria:**
- OrderTwin operational
- JourneyTwin operational
- Real-time tracking working
- ETA calculation accurate

### Week 4: Fleet & Dispatch Integration

**Objective:** Implement FleetTwin and Dispatch integration

| Task | Description | Owner | Deliverable |
|------|-------------|-------|-------------|
| 4.1 | Implement FleetTwin CRUD | Backend | FleetTwin API |
| 4.2 | Build fleet aggregation | Backend | Fleet rollup |
| 4.3 | Create Dispatch integration | Backend | Dispatch ↔ TwinOS |
| 4.4 | Implement matching algorithm | ML Team | Matching engine |
| 4.5 | Build surge pricing | Backend | Pricing engine |
| 4.6 | Deploy fleet_management agent | ML Team | Agent operational |
| 4.7 | Deploy dispatch agent | ML Team | Agent operational |
| 4.8 | Build utilization tracking | Backend | Utilization metrics |

**Acceptance Criteria:**
- FleetTwin operational
- Dispatch integration working
- Matching algorithm functional
- Surge pricing active

### Week 5: Logistics & Rider Integration

**Objective:** Connect KHAIRMOVE Logistics and RiderTwin

| Task | Description | Owner | Deliverable |
|------|-------------|-------|-------------|
| 5.1 | Implement RiderTwin CRUD | Backend | RiderTwin API |
| 5.2 | Create KHAIRMOVE Logistics integration | Backend | Logistics ↔ TwinOS |
| 5.3 | Build Distribution OS integration | Backend | Distribution ↔ TwinOS |
| 5.4 | Implement rider_intelligence agent | ML Team | Agent operational |
| 5.5 | Build Business Copilot queries | NLP Team | Query handlers |
| 5.6 | Create reporting dashboards | Frontend | Dashboards |
| 5.7 | Implement loyalty tracking | Backend | Loyalty engine |
| 5.8 | User acceptance testing | QA | UAT completed |

**Acceptance Criteria:**
- RiderTwin operational
- Logistics integration working
- All documented queries functional
- UAT passed

### Week 6: Airzy & Go-Live

**Objective:** Connect Airzy and deploy to production

| Task | Description | Owner | Deliverable |
|------|-------------|-------|-------------|
| 6.1 | Implement TravelerTwin CRUD | Backend | TravelerTwin API |
| 6.2 | Create Airzy integration | Backend | Airzy ↔ TwinOS |
| 6.3 | Build flight tracking | Backend | Flight data |
| 6.4 | Deploy traveler_intelligence agent | ML Team | Agent operational |
| 6.5 | End-to-end integration test | QA | Full flow testing |
| 6.6 | Performance testing | QA | Load testing |
| 6.7 | Security audit | Security | Penetration testing |
| 6.8 | Production deployment | DevOps | Go-live |

**Acceptance Criteria:**
- Airzy operational
- TravelerTwin working
- E2E tests passing
- Performance targets met
- Security audit clean
- Production deployed

---

## Appendix

### A. API Rate Limits

| Endpoint Category | Limit | Window |
|-------------------|-------|--------|
| Order Operations | 5000 | per minute |
| Vehicle Telemetry | 50000 | per minute |
| Driver Location | 10000 | per minute |
| Fleet Operations | 2000 | per minute |
| Business Copilot | 100 | per minute |
| WebSocket Connections | 5000 | per tenant |

### B. Data Retention

| Data Type | Retention Period |
|-----------|-----------------|
| Trip Records | 7 years |
| Driver Profiles | Duration of relationship + 5 years |
| Vehicle Data | 5 years |
| Telemetry Data | 1 year |
| Location History | 90 days |
| Financial Records | 7 years |

### C. Security Requirements

- All API calls over TLS 1.3
- OAuth 2.0 for user authentication
- API Keys for driver/rider apps
- GPS data encrypted at rest
- PII encrypted at rest
- Driver background check compliance
- Vehicle data handling compliance

### D. Error Codes

| Code | Description |
|------|-------------|
| `ORDER_NOT_FOUND` | Order does not exist |
| `VEHICLE_NOT_FOUND` | Vehicle does not exist |
| `DRIVER_NOT_FOUND` | Driver does not exist |
| `NO_DRIVERS_AVAILABLE` | No drivers in area |
| `VEHICLE_UNAVAILABLE` | Vehicle not available |
| `RIDER_SUSPENDED` | Rider account suspended |
| `DRIVER_SUSPENDED` | Driver account suspended |
| `AUTH_INVALID_TOKEN` | Invalid/expired token |

### E. Regulatory Compliance

| Regulation | Requirements |
|------------|--------------|
| Transport Authority | Vehicle licensing, driver verification |
| Data Protection | GDPR, local data residency |
| Financial | Payment processing, tax compliance |
| Insurance | Vehicle insurance requirements |
| Accessibility | ADA compliance for paratransit |

---

**Document Control:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-06-12 | RTMN Architecture Team | Initial specification |
