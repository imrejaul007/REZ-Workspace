# Hotel OS Integration Specification

**Version:** 1.0.0  
**Last Updated:** 2026-06-12  
**Industry:** Hospitality

---

## Executive Summary

The Hotel OS Integration Specification defines the technical architecture for connecting RTMN's hospitality products with TwinOS, enabling real-time digital twins of guests, rooms, properties, staff, and experiences. The integration creates a unified data layer where Guest Memory serves as the primary data producer, feeding the Guest Twin in TwinOS to enable personalized AI-driven services across The Invisible Hotel, AI Concierge, Smart Minibar, Predictive Housekeeping, Upsell Engine, and reservation/loyalty systems.

**Key Integration Point:** Guest Memory → TwinOS (Guest Twin)  
**Data Flow Direction:** Bidirectional - Guest Memory produces, TwinOS orchestrates, all products consume  
**Primary Protocol:** REST API with WebSocket for real-time events  
**Authentication:** OAuth 2.0 + JWT with service-to-service tokens

---

## Product Capability Matrix

### 1. The Invisible Hotel

| Attribute | Value |
|-----------|-------|
| **Port** | `8443` |
| **Capabilities** | Contactless check-in/out, BLE beacon navigation, mobile key, voice control, IoT orchestration |
| **Data Produced** | Guest location traces, device interactions, IoT events, room access logs |
| **Data Needed** | Guest Twin (preferences, loyalty tier), Room Twin (availability, IoT state), Property Twin (venue hours) |

### 2. AI Concierge

| Attribute | Value |
|-----------|-------|
| **Port** | `8444` |
| **Capabilities** | Natural language guest support, service request routing, local recommendations, multilingual support |
| **Data Produced** | Conversation logs, service requests, satisfaction signals, FAQ effectiveness metrics |
| **Data Needed** | Guest Twin (preferences, history, dietary restrictions), Property Twin (amenities, hours), Staff Twin (availability) |

### 3. Smart Minibar

| Attribute | Value |
|-----------|-------|
| **Port** | `8445` |
| **Capabilities** | RFID inventory tracking, auto-billing, consumption analytics, predictive restocking |
| **Data Produced** | Consumption events, inventory levels, billing records, spoilage alerts |
| **Data Needed** | Guest Twin (consumption preferences, billing preferences), Room Twin (minibar config) |

### 4. Predictive Housekeeping

| Attribute | Value |
|-----------|-------|
| **Port** | `8446` |
| **Capabilities** | Occupancy prediction, cleaning crew scheduling, linen management, maintenance prediction |
| **Data Produced** | Room status updates, cleaning completion logs, maintenance tickets, staff assignments |
| **Data Needed** | Guest Twin (checkout date, stay patterns), Room Twin (current state, equipment status), Staff Twin (shift schedules) |

### 5. Guest Memory

| Attribute | Value |
|-----------|-------|
| **Port** | `8447` |
| **Capabilities** | Cross-stay preference capture, sentiment analysis, lifetime value tracking, personalization engine |
| **Data Produced** | Guest profiles, preference bundles, sentiment scores, lifetime value metrics, stay history |
| **Data Needed** | All products produce data consumed by Guest Memory |
| **TwinOS Role** | PRIMARY PRODUCER - feeds Guest Twin with enriched guest data |

### 6. Upsell Engine

| Attribute | Value |
|-----------|-------|
| **Port** | `8448` |
| **Capabilities** | Dynamic pricing, room upgrade optimization, package bundling, ancillary revenue maximization |
| **Data Produced** | Upsell offers shown/accepted, revenue uplift metrics, conversion funnels |
| **Data Needed** | Guest Twin (price sensitivity, upgrade history), Room Twin (inventory, pricing tiers), Property Twin (packages) |

### 7. REZ POS

| Attribute | Value |
|-----------|-------|
| **Port** | `8449` |
| **Capabilities** | Point of sale, order management, split billing, tip distribution, multi-property support |
| **Data Produced** | Transaction records, item sales, payment confirmations, staff performance |
| **Data Needed** | Guest Twin (billing preferences, dietary), Staff Twin (permissions), Property Twin (revenue centers) |

### 8. REZ Loyalty

| Attribute | Value |
|-----------|-------|
| **Port** | `8450` |
| **Capabilities** | Points accrual/redemption, tier management, promotions engine, member portal |
| **Data Produced** | Points transactions, tier changes, engagement events, campaign responses |
| **Data Needed** | Guest Twin (membership status, points balance), Property Twin (participating venues) |

### 9. BrandPulse

| Attribute | Value |
|-----------|-------|
| **Port** | `8451` |
| **Capabilities** | Guest sentiment tracking, competitor benchmarking, review aggregation, NPS calculation |
| **Data Produced** | Sentiment scores, review data, NPS metrics, competitive insights |
| **Data Needed** | Guest Twin (feedback history), Property Twin (benchmark properties) |

---

## Digital Twin Definitions

### Guest Twin

**TwinOS Entity ID:** `twin.hotel.guest.{guest_id}`

**Attributes:**
```json
{
  "guest_id": "string (UUID)",
  "profile": {
    "name": "string",
    "email": "string",
    "phone": "string",
    "nationality": "string",
    "language_preference": "string",
    "accessibility_needs": ["string"]
  },
  "loyalty": {
    "tier": "bronze|silver|gold|platinum",
    "points_balance": "number",
    "member_since": "ISO8601 date",
    "total_stays": "number",
    "total_spend": "number (currency)"
  },
  "preferences": {
    "room": {
      "floor_preference": "string",
      "view_preference": "string",
      "bed_configuration": "string",
      "temperature_setting": { "default": "number", "range": "object" },
      "lighting_preference": "string",
      "noise_tolerance": "number (1-10)"
    },
    "dining": {
      "dietary_restrictions": ["string"],
      "allergies": ["string"],
      "favorite_items": ["string"],
      "beverage_preferences": ["string"],
      "typical_spend_range": "object"
    },
    "amenities": {
      "spa_interests": ["string"],
      "fitness_habits": "boolean",
      "pool_usage": "boolean",
      "business_amenities": ["string"]
    },
    "communication": {
      "preferred_channel": "email|sms|app_push|whatsapp",
      "opt_ins": ["string"],
      "quiet_hours": "object"
    }
  },
  "stay_patterns": {
    "typical_check_in_time": "string (HH:MM)",
    "typical_check_out_time": "string (HH:MM)",
    "weekend_vs_weekday": "string",
    "seasonal_patterns": ["string"],
    "booking_lead_time": "number (days)"
  },
  "sentiment": {
    "current_score": "number (0-100)",
    "trend": "improving|stable|declining",
    "last_feedback_date": "ISO8601 date",
    "key_topics": ["string"]
  },
  "lifetime_value": {
    "clv": "number",
    "potential_clv": "number",
    "churn_risk": "low|medium|high",
    "recommendation_eligibility": "boolean"
  },
  "current_stay": {
    "room_id": "string",
    "check_in": "ISO8601 datetime",
    "check_out": "ISO8601 datetime",
    "adults": "number",
    "children": "number",
    "rate_code": "string",
    "special_requests": ["string"],
    "occasion": "string|null"
  }
}
```

**Relationships:**
- `BELONGS_TO` → Property Twin (via `preferred_property_id`)
- `STAYS_IN` → Room Twin (via `current_stay.room_id`)
- `MEMBER_OF` → Loyalty Program (via `loyalty.tier`)
- `ASSOCIATED_WITH` → Booking Twin (via `current_booking_id`)
- `INTERACTS_WITH` → Staff Twin (via staff_id list)

**Managing Agent:** `agent.guest_memory`

### Room Twin

**TwinOS Entity ID:** `twin.hotel.room.{room_id}`

**Attributes:**
```json
{
  "room_id": "string",
  "property_id": "string",
  "room_number": "string",
  "room_type": "standard|deluxe|suite|penthouse|accessible",
  "floor": "number",
  "view": "city|pool|garden|ocean|mountain",
  "capacity": {
    "max_adults": "number",
    "max_children": "number",
    "max_occupancy": "number"
  },
  "bed_configuration": {
    "bed_count": "number",
    "bed_type": "king|queen|twin|bunk",
    "rollaway_available": "boolean"
  },
  "amenities": {
    "smart_tv": "boolean",
    "smart_speaker": "boolean",
    "minibar": "boolean",
    "coffee_machine": "boolean",
    "safe": "boolean",
    "balcony": "boolean",
    "jacuzzi": "boolean"
  },
  "status": {
    "current": "available|occupied|blocked|out_of_order|cleaning|inspected",
    "next_available": "ISO8601 datetime",
    "maintenance_alerts": ["string"]
  },
  "iot_state": {
    "thermostat": { "current": "number", "target": "number", "mode": "string" },
    "lighting": { "scene": "string", "brightness": "number" },
    "blinds": "open|closed|partial",
    "door_lock": "locked|unlocked",
    "minibar_door": "closed|open",
    "occupancy_sensor": "boolean"
  },
  "housekeeping": {
    "last_cleaned": "ISO8601 datetime",
    "next_scheduled": "ISO8601 datetime",
    "frequency": "daily|weekly|on_departure",
    "supply_status": "adequate|low|critical"
  },
  "revenue": {
    "base_rate": "number",
    "rack_rate": "number",
    "minibar_balance": "number",
    "last_rate_update": "ISO8601 datetime"
  }
}
```

**Relationships:**
- `LOCATED_AT` → Property Twin
- `OCCUPIED_BY` → Guest Twin (when occupied)
- `ASSIGNED_TO` → Staff Twin (housekeeping assignment)

**Managing Agent:** `agent.predictive_housekeeping`

### Property Twin

**TwinOS Entity ID:** `twin.hotel.property.{property_id}`

**Attributes:**
```json
{
  "property_id": "string",
  "brand": "string",
  "name": "string",
  "location": {
    "address": "string",
    "city": "string",
    "country": "string",
    "coordinates": { "lat": "number", "lng": "number" },
    "timezone": "string"
  },
  "inventory": {
    "total_rooms": "number",
    "by_type": "object",
    "available_today": "number",
    "available_tomorrow": "number"
  },
  "venues": [
    {
      "venue_id": "string",
      "name": "string",
      "type": "restaurant|bar|spa|gym|pool|meeting_room",
      "capacity": "number",
      "hours": "object",
      "pos_revenue_center_id": "string"
    }
  ],
  "staff": {
    "total_count": "number",
    "by_department": "object",
    "on_duty_now": "number"
  },
  "services": {
    "check_in_24h": "boolean",
    "concierge_available": "boolean",
    "room_service_hours": "object",
    "housekeeping_schedule": "object"
  },
  "revenue": {
    "today_revenue": "number",
    "mtd_revenue": "number",
    "ytd_revenue": "number",
    "revpar": "number",
    "adr": "number",
    "occupancy_rate": "number"
  },
  "settings": {
    "brand_standards_version": "string",
    "upsell_config": "object",
    "pricing_rules": "object"
  }
}
```

**Relationships:**
- `HAS_ROOMS` → Room Twin (1:many)
- `HAS_VENUES` → Venue Twins
- `EMPLOYS` → Staff Twin (1:many)
- `HOSTS` → Guest Twin (current guests)

**Managing Agent:** `agent.property_operations`

### Staff Twin

**TwinOS Entity ID:** `twin.hotel.staff.{staff_id}`

**Attributes:**
```json
{
  "staff_id": "string",
  "property_id": "string",
  "profile": {
    "name": "string",
    "email": "string",
    "phone": "string",
    "emergency_contact": "object"
  },
  "role": {
    "department": "front_desk|housekeeping|f_and_b|maintenance|management|spa|concierge",
    "title": "string",
    "level": "junior|senior|lead|manager|director"
  },
  "schedule": {
    "contracted_hours": "number",
    "shifts": [
      {
        "date": "ISO8601 date",
        "start": "string (HH:MM)",
        "end": "string (HH:MM)",
        "type": "regular|overtime|on_call"
      }
    ],
    "time_off": ["ISO8601 date range"]
  },
  "performance": {
    "tasks_completed_today": "number",
    "avg_task_duration": "number (minutes)",
    "guest_satisfaction_score": "number (0-100)",
    "upsell_conversion_rate": "number"
  },
  "location": {
    "current_zone": "string",
    "last_updated": "ISO8601 datetime"
  },
  "certifications": ["string"],
  "languages": ["string"]
}
```

**Relationships:**
- `WORKS_AT` → Property Twin
- `ASSIGNS_TO` → Room Twin (for tasks)
- `SERVICES` → Guest Twin (concierge interactions)

**Managing Agent:** `agent.staff_scheduling`

### Experience Twin

**TwinOS Entity ID:** `twin.hotel.experience.{experience_id}`

**Attributes:**
```json
{
  "experience_id": "string",
  "guest_id": "string",
  "property_id": "string",
  "type": "dining|spa|activity|tour|event|room_service",
  "timestamp": "ISO8601 datetime",
  "venue_id": "string|null",
  "details": {
    "name": "string",
    "description": "string",
    "duration_minutes": "number",
    "party_size": "number",
    "total_spend": "number"
  },
  "satisfaction": {
    "pre_experience_expectation": "number (1-5)",
    "post_experience_rating": "number (1-5)",
    "nps_score": "number (-100 to 100)",
    "feedback_text": "string"
  },
  "context": {
    "occasion": "string|null",
    "accompanied_by": ["string (guest_ids)"],
    "previous_similar_experiences": "number"
  }
}
```

**Relationships:**
- `ENJOYED_BY` → Guest Twin
- `OCCURRED_AT` → Property Twin / Venue
- `LINKED_TO` → Staff Twin (served by)

**Managing Agent:** `agent.experience_analytics`

---

## Integration Flows

### Flow 1: Guest Check-In

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  REZ POS    │────▶│ Guest Memory│────▶│   TwinOS    │────▶│  Invisible  │
│  (Booking) │     │  (Create)   │     │ (Guest Twin)│     │   Hotel     │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                           │                    │
                           ▼                    ▼
                    ┌─────────────┐     ┌─────────────┐
                    │ REZ Loyalty │     │  AI         │
                    │ (Enroll)   │     │ Concierge   │
                    └─────────────┘     └─────────────┘
```

**API Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/guests` | Create guest profile |
| POST | `/api/v1/guests/{guest_id}/checkin` | Process check-in |
| POST | `/api/v1/twins/guest` | Create Guest Twin |
| PATCH | `/api/v1/twins/guest/{guest_id}` | Update Guest Twin |
| GET | `/api/v1/twins/guest/{guest_id}` | Retrieve Guest Twin |
| POST | `/api/v1/events/checkin` | Publish check-in event |

**Request/Response Example:**

```json
// POST /api/v1/guests/{guest_id}/checkin
{
  "booking_id": "BK-2024-001234",
  "room_id": "501",
  "check_in_time": "2024-01-15T14:00:00Z",
  "check_out_time": "2024-01-18T11:00:00Z",
  "adults": 2,
  "children": 0,
  "rate_code": "FLEX-RE",
  "special_requests": ["High floor", "Quiet room"],
  "occasion": "anniversary"
}

// Response
{
  "guest_id": "G-987654321",
  "room_id": "501",
  "room_twin_id": "twin.hotel.room.501",
  "guest_twin_id": "twin.hotel.guest.G-987654321",
  "invisible_hotel_enabled": true,
  "ai_concierge_active": true,
  "personalized_settings_applied": true
}
```

### Flow 2: Real-Time Preference Capture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Smart    │────▶│ Guest Memory│────▶│   TwinOS    │────▶│ AI Concierge│
│   Minibar  │     │  (Process)  │     │ (Guest Twin)│     │  (Consume)  │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

**API Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/events/consumption` | Publish minibar consumption |
| GET | `/api/v1/twins/guest/{guest_id}/preferences` | Get current preferences |
| PATCH | `/api/v1/twins/guest/{guest_id}/preferences` | Update preferences |
| WS | `/ws/twins/guest/{guest_id}/events` | Real-time preference updates |

### Flow 3: Upsell Decision

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ REZ Loyalty │────▶│   TwinOS    │◀────│ Upsell      │◀────│   REZ POS   │
│ (Check)    │     │ (Guest Twin)│     │  Engine     │     │  (Execute)  │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

**API Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/twins/guest/{guest_id}/upsell-eligibility` | Check upgrade eligibility |
| POST | `/api/v1/upsell/offers` | Generate upsell offer |
| POST | `/api/v1/upsell/accept` | Accept upsell offer |
| GET | `/api/v1/twins/room/{room_id}/availability` | Check room availability |

---

## Agent Architecture

### Agent Registry

| Agent ID | Type | Responsibilities |
|----------|------|------------------|
| `agent.guest_memory` | Orchestrator | Guest profile management, preference learning, lifetime value calculation |
| `agent.guest_memory.ingest` | Ingestion | Real-time event processing from all products |
| `agent.guest_memory.personalize` | ML | Preference prediction, sentiment analysis |
| `agent.predictive_housekeeping` | Operational | Room status prediction, staff scheduling, maintenance forecasting |
| `agent.ai_concierge` | Service | Natural language understanding, service routing, recommendations |
| `agent.upsell_engine` | Revenue | Pricing optimization, offer generation, conversion tracking |
| `agent.invisible_hotel` | IoT | BLE beacon management, IoT orchestration, location tracking |
| `agent.smart_minibar` | Inventory | RFID tracking, auto-billing, restocking prediction |
| `agent.brand_pulse` | Analytics | Sentiment aggregation, competitive analysis, NPS calculation |
| `agent.twin_orchestrator` | TwinOS Core | Twin CRUD, relationship management, event distribution |

### Agent Communication Patterns

**Pub/Sub Topics:**
- `hotel.guest.checkin` - New guest check-in events
- `hotel.guest.checkout` - Guest check-out events
- `hotel.guest.preference.update` - Preference changes
- `hotel.guest.sentiment.change` - Sentiment score changes
- `hotel.room.status.change` - Room status updates
- `hotel.iot.event` - IoT device events
- `hotel.transaction` - POS transactions

**Agent-to-Agent Protocols:**
```json
{
  "protocol": "agent.protocol.v1",
  "patterns": {
    "request_response": {
      "request": {
        "agent_id": "string",
        "action": "string",
        "payload": "object",
        "correlation_id": "string"
      },
      "response": {
        "status": "success|error",
        "data": "object",
        "correlation_id": "string"
      }
    },
    "publish_subscribe": {
      "topic": "string",
      "message": "object",
      "ttl": "number (seconds)"
    }
  }
}
```

---

## Business Copilot Queries Supported

### Guest Experience Queries

| Query | Description | Example |
|-------|-------------|---------|
| `guest_preference_summary` | Summarize guest preferences | "What are John Doe's preferences for his stay?" |
| `loyalty_recommendation` | Recommend loyalty actions | "Should we upgrade this guest to gold tier?" |
| `sentiment_analysis` | Analyze guest sentiment | "How has this guest's satisfaction trended?" |
| `personalized_offer` | Generate personalized offer | "Create a personalized spa package for this guest" |

### Operational Queries

| Query | Description | Example |
|-------|-------------|---------|
| `room_availability_check` | Check room availability | "What rooms are available for upgrade tonight?" |
| `housekeeping_schedule` | Query housekeeping status | "Which rooms need housekeeping this morning?" |
| `staff_allocation` | Check staff allocation | "How many housekeepers are on duty today?" |
| `maintenance_prediction` | Predict maintenance needs | "Which rooms might need maintenance soon?" |

### Revenue Queries

| Query | Description | Example |
|-------|-------------|---------|
| `upsell_opportunity` | Identify upsell opportunities | "Which guests should we offer room upgrades to?" |
| `revenue_forecast` | Forecast revenue | "What's our projected ADR for next week?" |
| `minibar_performance` | Analyze minibar performance | "Which room types have highest minibar spend?" |
| `loyalty_impact` | Measure loyalty program impact | "What's the ROI of our loyalty program?" |

### Example Copilot Interactions

```python
# Example: Guest preference summary
{
  "query": "Summarize preferences for guest G-987654321",
  "agent": "agent.guest_memory.personalize",
  "response": {
    "guest_id": "G-987654321",
    "summary": {
      "room": "High floor, king bed, city view, 72°F default temp",
      "dining": "No dietary restrictions, prefers Italian cuisine, drinks sparkling water",
      "amenities": "Regular gym user, interested in spa treatments",
      "communication": "Prefers app notifications, opted into promotions"
    },
    "confidence": 0.92,
    "last_updated": "2024-01-15T14:30:00Z"
  }
}

# Example: Upsell opportunity
{
  "query": "Identify upsell opportunities for today",
  "agent": "agent.upsell_engine",
  "response": {
    "opportunities": [
      {
        "guest_id": "G-987654321",
        "current_room": "Deluxe",
        "upgrade_to": "Suite",
        "probability": 0.78,
        "price_sensitivity": "medium",
        "recommended_price": "$85/night",
        "reason": "Anniversary stay, previously accepted upgrade"
      }
    ],
    "total_expected_revenue": "$2,340"
  }
}
```

---

## Economic Integration

### Payment Flows

| Flow | Description | Integration |
|------|-------------|-------------|
| Direct Bill | Room charges to guest folio | REZ POS → Guest Twin → Folio |
| Minibar Auto-Charge | Real-time minibar billing | Smart Minibar → REZ POS → Guest Twin |
| Upsell Payment | Room upgrade payment | Upsell Engine → REZ POS → Guest Twin |
| Loyalty Redemption | Points redemption at POS | REZ Loyalty → REZ POS → Guest Twin |

**API Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/payments/charge` | Create charge |
| POST | `/api/v1/payments/refund` | Process refund |
| GET | `/api/v1/guests/{guest_id}/folio` | Get guest folio |
| POST | `/api/v1/loyalty/redeem` | Redeem points |

### Rewards Integration

| Program | Points Source | Redemption |
|---------|--------------|------------|
| REZ Loyalty | All product interactions | Room upgrades, dining, spa, partner offers |
| Property Rewards | Direct property spending | Property-specific perks |
| Brand Rewards | Cross-property spending | Brand-wide benefits |

**Points Calculation:**
```json
{
  "base_points_multiplier": 1.0,
  "tier_bonuses": {
    "bronze": 1.0,
    "silver": 1.25,
    "gold": 1.5,
    "platinum": 2.0
  },
  "category_multipliers": {
    "room": 2.0,
    "dining": 1.0,
    "minibar": 1.5,
    "spa": 1.5,
    "upsell": 3.0
  }
}
```

---

## Implementation Roadmap

### Week 1: Foundation

**Objective:** Set up TwinOS infrastructure and core integrations

| Task | Description | Owner | Deliverable |
|------|-------------|-------|-------------|
| 1.1 | Configure TwinOS tenant | DevOps | TwinOS tenant provisioned |
| 1.2 | Define twin schemas | Data Eng | JSON schemas for all 5 twins |
| 1.3 | Set up Guest Memory API | Backend | Guest Memory endpoints live |
| 1.4 | Configure OAuth 2.0 | Security | Auth service configured |
| 1.5 | Create test environment | DevOps | Isolated test environment |
| 1.6 | Document API contracts | API Team | OpenAPI specs for all endpoints |
| 1.7 | Set up message broker | DevOps | RabbitMQ/ Kafka cluster |
| 1.8 | Create twin provisioning scripts | Data Eng | Automated twin creation |

**Acceptance Criteria:**
- TwinOS tenant accessible
- All twin schemas validated
- Guest Memory API responding
- Auth tokens working
- Test environment functional

### Week 2: Core Integration

**Objective:** Implement Guest Memory → TwinOS integration

| Task | Description | Owner | Deliverable |
|------|-------------|-------|-------------|
| 2.1 | Implement Guest Twin CRUD | Backend | Guest Twin API complete |
| 2.2 | Build event ingestion pipeline | Data Eng | Real-time event processing |
| 2.3 | Implement preference sync | Backend | Preference bidirectional sync |
| 2.4 | Create WebSocket connections | Backend | Real-time event streaming |
| 2.5 | Build loyalty integration | Backend | REZ Loyalty ↔ TwinOS |
| 2.6 | Implement stay lifecycle | Backend | Check-in to check-out flow |
| 2.7 | Create guest lookup service | Backend | Guest search and match |
| 2.8 | Build test scenarios | QA | Integration test suite |

**Acceptance Criteria:**
- Guest Twin created on check-in
- Preferences sync in < 500ms
- WebSocket events flowing
- Loyalty tier visible in Twin
- Full stay lifecycle tested

### Week 3: Product Integration

**Objective:** Connect all hotel products to TwinOS

| Task | Description | Owner | Deliverable |
|------|-------------|-------|-------------|
| 3.1 | Integrate AI Concierge | Backend | Concierge ↔ TwinOS |
| 3.2 | Integrate Smart Minibar | Backend | Minibar → TwinOS |
| 3.3 | Integrate Invisible Hotel | IoT | IoT → TwinOS |
| 3.4 | Integrate Upsell Engine | Backend | Upsell ↔ TwinOS |
| 3.5 | Integrate Predictive Housekeeping | Backend | Housekeeping ↔ TwinOS |
| 3.6 | Integrate REZ POS | Backend | POS ↔ TwinOS |
| 3.7 | Build agent registry | Agent | Agent catalog populated |
| 3.8 | Create pub/sub topics | Data Eng | Topic infrastructure |

**Acceptance Criteria:**
- All 9 products connected
- Real-time data flowing
- Agent registry populated
- Events publishing correctly

### Week 4: Agent Development

**Objective:** Deploy managing agents for each twin

| Task | Description | Owner | Deliverable |
|------|-------------|-------|-------------|
| 4.1 | Deploy guest_memory agent | ML Team | Agent operational |
| 4.2 | Deploy predictive_housekeeping agent | ML Team | Agent operational |
| 4.3 | Deploy ai_concierge agent | NLP Team | Agent operational |
| 4.4 | Deploy upsell_engine agent | ML Team | Agent operational |
| 4.5 | Deploy brand_pulse agent | Analytics | Agent operational |
| 4.6 | Implement agent communication | Backend | A2A protocols working |
| 4.7 | Build agent monitoring | DevOps | Agent health dashboard |
| 4.8 | Create agent fallback logic | Backend | Graceful degradation |

**Acceptance Criteria:**
- All agents responding
- A2A communication working
- Agent health visible
- Fallback handling tested

### Week 5: Business Copilot

**Objective:** Enable natural language queries via Business Copilot

| Task | Description | Owner | Deliverable |
|------|-------------|-------|-------------|
| 5.1 | Implement guest query handlers | NLP Team | Query handlers deployed |
| 5.2 | Implement operational queries | Backend | Operational handlers deployed |
| 5.3 | Implement revenue queries | Analytics | Revenue handlers deployed |
| 5.4 | Build query routing | Backend | Intelligent routing |
| 5.5 | Create response templates | Product | Response formats defined |
| 5.6 | Implement query history | Backend | Audit trail |
| 5.7 | Build copilot UI | Frontend | Query interface |
| 5.8 | User acceptance testing | QA | UAT completed |

**Acceptance Criteria:**
- All documented queries working
- Responses accurate
- UI functional
- UAT passed

### Week 6: Economic Integration & Testing

**Objective:** Implement payment/rewards flows and final testing

| Task | Description | Owner | Deliverable |
|------|-------------|-------|-------------|
| 6.1 | Implement payment flows | Backend | Payment API complete |
| 6.2 | Build rewards calculation | Backend | Points engine operational |
| 6.3 | Implement folio management | Backend | Folio API complete |
| 6.4 | End-to-end integration test | QA | Full flow testing |
| 6.5 | Performance testing | QA | Load testing complete |
| 6.6 | Security audit | Security | Penetration testing |
| 6.7 | Documentation | Tech Writing | All docs complete |
| 6.8 | Production deployment | DevOps | Go-live |

**Acceptance Criteria:**
- All payment flows working
- Rewards calculating correctly
- E2E tests passing
- Performance targets met
- Security audit clean
- Production deployed

---

## Appendix

### A. API Rate Limits

| Endpoint Category | Limit | Window |
|-------------------|-------|--------|
| Twin CRUD | 1000 | per minute |
| Event Ingestion | 10000 | per minute |
| WebSocket Connections | 500 | per tenant |
| Business Copilot | 100 | per minute |

### B. Data Retention

| Data Type | Retention Period |
|-----------|-----------------|
| Guest Profiles | Lifetime (with consent) |
| Stay History | 7 years |
| Transaction Records | 7 years |
| IoT Events | 90 days |
| Preference Data | Lifetime |
| Sentiment Scores | 3 years |

### C. Security Requirements

- All API calls over TLS 1.3
- OAuth 2.0 with PKCE for user auth
- Service-to-service JWT tokens
- Guest data encrypted at rest (AES-256)
- PII fields tokenized
- Audit logging for all data access

### D. Error Codes

| Code | Description |
|------|-------------|
| `TWIN_NOT_FOUND` | Twin does not exist |
| `TWIN_ALREADY_EXISTS` | Twin already created |
| `TWIN_UPDATE_CONFLICT` | Concurrent update conflict |
| `AGENT_UNAVAILABLE` | Managing agent down |
| `SYNC_TIMEOUT` | Twin sync timeout |
| `AUTH_INVALID_TOKEN` | Invalid/expired token |
| `RATE_LIMIT_EXCEEDED` | API rate limit hit |

---

**Document Control:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-06-12 | RTMN Architecture Team | Initial specification |
