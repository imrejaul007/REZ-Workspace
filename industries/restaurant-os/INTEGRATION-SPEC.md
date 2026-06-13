# Restaurant OS Integration Specification

**Version:** 1.0.0  
**Last Updated:** 2026-06-12  
**Industry:** Food & Beverage / Restaurant

---

## Executive Summary

The Restaurant OS Integration Specification defines the technical architecture for connecting RTMN's restaurant products with TwinOS, enabling real-time digital twins of tables, kitchens, menus, customers, and staff. The integration creates a unified data layer where REZ POS serves as the central transaction hub, feeding data to TwinOS while consuming insights from REZ Business Copilot for intelligent decision-making.

**Key Integration Point:** REZ POS ↔ Business Copilot  
**Data Flow Direction:** Bidirectional - POS produces transactions, Copilot produces insights  
**Primary Protocol:** REST API with gRPC for high-throughput kitchen communication  
**Authentication:** OAuth 2.0 + API Keys for POS terminals

---

## Product Capability Matrix

### 1. REZ POS

| Attribute | Value |
|-----------|-------|
| **Port** | `8543` |
| **Capabilities** | Order capture, payment processing, table management, split checks, multi-location support, offline mode |
| **Data Produced** | Orders, payments, table status, staff actions, item sales, customer associations |
| **Data Needed** | Customer Twin (preferences), Menu Twin (items, pricing), Table Twin (status) |
| **TwinOS Role** | CENTRAL PRODUCER - all transactions flow through POS |

### 2. REZ KDS

| Attribute | Value |
|-----------|-------|
| **Port** | `8544` |
| **Capabilities** | Kitchen display, order routing, course management, timing alerts, production tracking |
| **Data Produced** | Order status, cook times, completion events, quality metrics |
| **Data Needed** | Order Twin (details), Kitchen Twin (station config), Table Twin (course timing) |

### 3. REZ QR Cloud

| Attribute | Value |
|-----------|-------|
| **Port** | `8545` |
| **Capabilities** | QR menu, mobile ordering, contactless payment, digital tipping, loyalty capture |
| **Data Produced** | Digital orders, customer sessions, tip data, loyalty enrollments |
| **Data Needed** | Menu Twin (items), Customer Twin (loyalty status), Table Twin (session) |

### 4. Kitchen AI

| Attribute | Value |
|-----------|-------|
| **Port** | `8546` |
| **Capabilities** | Demand forecasting, prep scheduling, waste reduction, recipe optimization, allergy detection |
| **Data Produced** | Forecasts, prep schedules, waste metrics, recipe variations |
| **Data Needed** | Menu Twin (popularity), Kitchen Twin (capacity), Customer Twin (preferences) |

### 5. REZ Inventory

| Attribute | Value |
|-----------|-------|
| **Port** | `8547` |
| **Capabilities** | Stock tracking, order management, supplier integration, cost calculation, par level alerts |
| **Data Produced** | Stock levels, usage records, order history, cost analytics |
| **Data Needed** | Menu Twin (ingredients), Kitchen Twin (usage), Supplier Twin |

### 6. REZ Dashboard

| Attribute | Value |
|-----------|-------|
| **Port** | `8548` |
| **Capabilities** | Real-time analytics, sales reporting, staff performance, customer insights, benchmark comparison |
| **Data Produced** | Aggregated metrics, KPI calculations, trend analysis |
| **Data Needed** | All twins for reporting data |

### 7. REZ Loyalty

| Attribute | Value |
|-----------|-------|
| **Port** | `8549` |
| **Capabilities** | Points accrual, tier management, birthday rewards, referral program, campaign engine |
| **Data Produced** | Points transactions, tier changes, campaign responses, member activity |
| **Data Needed** | Customer Twin (profile, preferences), Transaction Twin |

### 8. REZ Staff

| Attribute | Value |
|-----------|-------|
| **Port** | `8550` |
| **Capabilities** | Scheduling, time tracking, tip distribution, performance metrics, shift swapping |
| **Data Produced** | Schedules, time punches, tip allocations, performance scores |
| **Data Needed** | Staff Twin (availability), Table Twin (coverage) |

### 9. REZ Business Copilot

| Attribute | Value |
|-----------|-------|
| **Port** | `8551` |
| **Capabilities** | Natural language analytics, operational recommendations, anomaly detection, forecasting |

### 10. REZ Restaurant CRM

| Attribute | Value |
|-----------|-------|
| **Port** | `4007` |
| **Company** | REZ Merchant |
| **Capabilities** | Customer profiles, segmentation, campaign automation, visit tracking, loyalty sync, churn prediction |
| **Data Produced** | Customer segments, campaign results, visit history, churn risk scores, lifetime value |
| **Data Needed** | Customer Twin (profile), Transaction Twin (orders), REZ Loyalty (points) |
| **TwinOS Role** | CUSTOMER INTELLIGENCE - enriches Customer Twin with behavioral data |
| **Key Features** | - Customer segmentation (New, Regular, VIP, At-Risk, Churned) |
| | - Campaign automation (Push, Email, SMS, WhatsApp) |
| | - Visit tracking and frequency analysis |
| | - RFM analysis (Recency, Frequency, Monetary) |
| | - Churn prediction and recovery campaigns |
| | - Lifetime value calculation | |
| **Data Produced** | Insights, recommendations, alerts, forecasts |
| **Data Needed** | All twins - consumes data, produces intelligence |
| **TwinOS Role** | PRIMARY CONSUMER - transforms data into actions |

### 10. REZ CRM (Restaurant)

| Attribute | Value |
|-----------|-------|
| **Port** | `4007` |
| **Capabilities** | Customer profiles, segmentation, campaign automation, visit tracking, loyalty enrichment, marketing automation |
| **Data Produced** | Customer profiles, segments, campaign responses, engagement events, visit history, preference updates |
| **Data Needed** | Customer Twin (profile, preferences), Transaction Twin, Loyalty Twin |
| **TwinOS Role** | CRM PRODUCER - enriches Customer Twin with CRM intelligence |

---

## Digital Twin Definitions

### Table Twin

**TwinOS Entity ID:** `twin.restaurant.table.{table_id}`

**Attributes:**
```json
{
  "table_id": "string",
  "location_id": "string",
  "table_number": "string",
  "zone": "string",
  "capacity": {
    "min": "number",
    "max": "number",
    "optimal": "number"
  },
  "status": {
    "current": "available|seated|ordered|appetizers|delivered|check_requested|paid|cleaning",
    "since": "ISO8601 datetime",
    "party_size": "number",
    "server_id": "string|null"
  },
  "timing": {
    "seated_at": "ISO8601 datetime|null",
    "order_placed_at": "ISO8601 datetime|null",
    "appetizers_at": "ISO8601 datetime|null",
    "entrees_at": "ISO8601 datetime|null",
    "check_at": "ISO8601 datetime|null",
    "paid_at": "ISO8601 datetime|null",
    "avg_turn_time_minutes": "number"
  },
  "current_order": {
    "order_id": "string|null",
    "items_count": "number",
    "subtotal": "number",
    "total": "number"
  },
  "revenue": {
    "today_revenue": "number",
    "week_revenue": "number",
    "month_revenue": "number",
    "visits": "number"
  },
  "features": {
    "has_qr_code": "boolean",
    "has_kiosk": "boolean",
    "outdoor": "boolean",
    "accessible": "boolean"
  }
}
```

**Relationships:**
- `LOCATED_IN` → Location Twin
- `ASSIGNED_TO` → Staff Twin (server)
- `HOSTS` → Customer Twin (current party)
- `HAS_ORDER` → Order Twin

**Managing Agent:** `agent.table_management`

### Kitchen Twin

**TwinOS Entity ID:** `twin.restaurant.kitchen.{kitchen_id}`

**Attributes:**
```json
{
  "kitchen_id": "string",
  "location_id": "string",
  "stations": [
    {
      "station_id": "string",
      "name": "string",
      "type": "grill|sauté|saute|appetizer|fry|dessert|bar|expo",
      "equipment": ["string"],
      "staff_ids": ["string"]
    }
  ],
  "capacity": {
    "max_orders_concurrent": "number",
    "avg_items_per_order": "number",
    "peak_throughput_per_hour": "number"
  },
  "status": {
    "open": "boolean",
    "current_orders": "number",
    "avg_cook_time_minutes": "number",
    "longest_ticket_age_minutes": "number"
  },
  "performance": {
    "today_orders": "number",
    "today_revenue": "number",
    "avg_ticket_time_minutes": "number",
    "on_time_rate": "number (percentage)",
    "quality_score": "number (0-100)"
  },
  "alerts": [
    {
      "type": "overload|slow|equipment|staff_shortage",
      "message": "string",
      "severity": "warning|critical",
      "timestamp": "ISO8601 datetime"
    }
  ],
  "equipment": [
    {
      "equipment_id": "string",
      "type": "string",
      "status": "operational|maintenance|broken",
      "last_maintenance": "ISO8601 date"
    }
  ]
}
```

**Relationships:**
- `LOCATED_IN` → Location Twin
- `PREPARES` → Menu Item Twins
- `STAFFED_BY` → Staff Twin (1:many)

**Managing Agent:** `agent.kitchen_operations`

### Menu Twin

**TwinOS Entity ID:** `twin.restaurant.menu.{item_id}`

**Attributes:**
```json
{
  "item_id": "string",
  "location_id": "string",
  "name": "string",
  "description": "string",
  "category": "string",
  "subcategory": "string",
  "pricing": {
    "base_price": "number",
    "cost": "number",
    "margin": "number",
    "price_history": [
      {
        "price": "number",
        "effective_date": "ISO8601 date"
      }
    ]
  },
  "availability": {
    "status": "available|86ed|limited|seasonal",
    "until": "ISO8601 datetime|null",
    "reason": "string|null"
  },
  "prep_info": {
    "station_id": "string",
    "prep_time_minutes": "number",
    "cook_time_minutes": "number",
    "allergens": ["string"],
    "dietary_tags": ["vegetarian|vegan|gluten_free|keto"],
    "spice_level": "number (0-5)"
  },
  "ingredients": [
    {
      "ingredient_id": "string",
      "name": "string",
      "quantity": "number",
      "unit": "string",
      "optional": "boolean"
    }
  ],
  "modifiers": [
    {
      "modifier_id": "string",
      "name": "string",
      "price_adjustment": "number",
      "available": "boolean"
    }
  ],
  "popularity": {
    "items_sold_today": "number",
    "items_sold_week": "number",
    "items_sold_month": "number",
    "rank_in_category": "number",
    "velocity_trend": "increasing|stable|decreasing"
  },
  "image_url": "string",
  "active": "boolean"
}
```

**Relationships:**
- `OFFERED_AT` → Location Twin
- `PREPARED_BY` → Kitchen Twin
- `CATEGORIZED_AS` → Category Twin

**Managing Agent:** `agent.menu_management`

### Customer Twin

**TwinOS Entity ID:** `twin.restaurant.customer.{customer_id}`

**Attributes:**
```json
{
  "customer_id": "string",
  "profile": {
    "name": "string",
    "email": "string",
    "phone": "string",
    "birthday": "ISO8601 date|null",
    "anniversary": "ISO8601 date|null"
  },
  "loyalty": {
    "member_id": "string|null",
    "tier": "classic|silver|gold|platinum",
    "points_balance": "number",
    "member_since": "ISO8601 date",
    "total_visits": "number",
    "total_spend": "number"
  },
  "preferences": {
    "dietary": ["string"],
    "allergens": ["string"],
    "favorite_items": ["string (item_ids)"],
    "favorite_category": "string",
    "spice_preference": "number (0-5)",
    "typical_spend": {
      "breakfast": "number",
      "lunch": "number",
      "dinner": "number"
    },
    "seating_preference": "indoor|outdoor|bar|private",
    "payment_preference": "card|cash|digital"
  },
  "behavior": {
    "avg_visit_frequency_per_month": "number",
    "preferred_days": ["string"],
    "preferred_times": ["string"],
    "last_visit": "ISO8601 datetime",
    "visit_streak": "number",
    "abandoned_cart_rate": "number"
  },
  "feedback": {
    "avg_rating": "number (1-5)",
    "last_rating": "number (1-5)",
    "last_rating_date": "ISO8601 datetime",
    "reviews_count": "number",
    "sentiment_score": "number (0-100)"
  },
  "current_session": {
    "table_id": "string|null",
    "seated_at": "ISO8601 datetime|null",
    "order_in_progress": "boolean"
  }
}
```

**Relationships:**
- `MEMBER_OF` → Loyalty Program
- `SEATED_AT` → Table Twin
- `PLACED` → Order Twin (1:many)
- `ENRICHED_BY` → REZ CRM (Customer profiles, segments, campaigns)

**Managing Agent:** `agent.customer_insights`

### Staff Twin

**TwinOS Entity ID:** `twin.restaurant.staff.{staff_id}`

**Attributes:**
```json
{
  "staff_id": "string",
  "location_id": "string",
  "profile": {
    "name": "string",
    "email": "string",
    "phone": "string"
  },
  "role": {
    "type": "server|host|cook|manager|bar|busser|expo",
    "title": "string",
    "level": "1|2|3"
  },
  "schedule": {
    "today_shift": {
      "start": "string (HH:MM)",
      "end": "string (HH:MM)",
      "breaks": "number (minutes)"
    },
    "week_hours_scheduled": "number",
    "pto_balance": "number (hours)"
  },
  "performance": {
    "tables_served_today": "number",
    "avg_check": "number",
    "avg_rating": "number (1-5)",
    "upsell_rate": "number (percentage)",
    "tip_average": "number",
    "sales_today": "number",
    "sales_week": "number"
  },
  "tips": {
    "today_tips": "number",
    "week_tips": "number",
    "tip_out_percentage": "number",
    "auto_gratuity_threshold": "number"
  },
  "status": {
    "current": "clocked_in|on_break|clocked_out",
    "current_table_ids": ["string"],
    "break_started_at": "ISO8601 datetime|null"
  },
  "certifications": ["string"],
  "languages": ["string"]
}
```

**Relationships:**
- `WORKS_AT` → Location Twin
- `SERVES` → Table Twin (1:many)
- `PREPARES_AT` → Kitchen Station

**Managing Agent:** `agent.staff_management`

---

## Integration Flows

### Flow 1: Order to Payment

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  REZ QR     │────▶│   REZ POS   │────▶│    KDS      │────▶│    Expo     │
│  (Order)    │     │  (Record)   │     │  (Kitchen)  │     │  (Quality)  │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
       │                    │                    │                    │
       ▼                    ▼                    ▼                    ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   TwinOS    │     │  TwinOS     │     │   TwinOS    │     │   TwinOS    │
│(Table Twin) │     │(Order Twin) │     │(Kitchen Twin)│     │(Table Twin) │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

**API Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/orders` | Create new order |
| PATCH | `/api/v1/orders/{order_id}` | Update order |
| POST | `/api/v1/orders/{order_id}/items` | Add items to order |
| POST | `/api/v1/orders/{order_id}/pay` | Process payment |
| GET | `/api/v1/twins/table/{table_id}` | Get table status |
| PATCH | `/api/v1/twins/table/{table_id}/status` | Update table status |
| WS | `/ws/kitchen/{kitchen_id}/orders` | Real-time kitchen updates |

**Request/Response Example:**

```json
// POST /api/v1/orders
{
  "table_id": "TBL-005",
  "server_id": "STF-123",
  "customer_id": "CUST-456",
  "items": [
    {
      "item_id": "MNU-789",
      "quantity": 2,
      "modifiers": [
        { "modifier_id": "MOD-001", "add": true }
      ],
      "special_instructions": "No onions"
    }
  ],
  "service_type": "dine_in",
  "priority": "normal"
}

// Response
{
  "order_id": "ORD-2024-001234",
  "table_id": "TBL-005",
  "status": "submitted",
  "estimated_ready_time": "ISO8601 datetime",
  "kitchen_ticket_id": "KT-2024-001234",
  "items_count": 2,
  "subtotal": 45.00
}
```

### Flow 2: Business Copilot Decision

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   TwinOS    │────▶│  Business   │────▶│   TwinOS    │────▶│   REZ POS   │
│  (Query)    │     │  Copilot    │     │  (Update)   │     │  (Execute)  │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

**API Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/copilot/query` | Submit natural language query |
| GET | `/api/v1/copilot/recommendations` | Get active recommendations |
| POST | `/api/v1/copilot/actions` | Execute recommended action |
| GET | `/api/v1/twins/{twin_type}/{twin_id}/insights` | Get twin-specific insights |

**Query Examples:**

```json
// Inventory alert query
{
  "query": "Which menu items might run out tonight based on current orders?",
  "context": {
    "location_id": "LOC-001",
    "time_window": "next_4_hours"
  }
}

// Response
{
  "insights": [
    {
      "item_id": "MNU-123",
      "item_name": "Lobster Tail",
      "current_stock": 12,
      "projected_usage": 18,
      "shortage_risk": "high",
      "recommended_action": "86 item or promote alternative",
      "confidence": 0.89
    }
  ],
  "generated_at": "ISO8601 datetime"
}

// Table optimization query
{
  "query": "How can we reduce wait times during peak dinner service?",
  "context": {
    "location_id": "LOC-001",
    "current_time": "ISO8601 datetime"
  }
}

// Response
{
  "recommendations": [
    {
      "action": "premise_table_assignment",
      "description": "Assign table 12 to server John before 7pm rush",
      "expected_impact": "15% reduction in table turn time",
      "priority": "high"
    }
  ]
}
```

### Flow 3: Loyalty Integration

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   REZ POS   │────▶│ REZ Loyalty │────▶│   TwinOS    │────▶│  Customer   │
│  (Transaction)│    │  (Points)   │     │(Customer Twin)│   │   Twin      │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

**API Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/loyalty/earn` | Award points |
| POST | `/api/v1/loyalty/redeem` | Redeem points |
| GET | `/api/v1/loyalty/balance/{customer_id}` | Get points balance |
| POST | `/api/v1/loyalty/enroll` | Enroll new member |
| GET | `/api/v1/twins/customer/{customer_id}/loyalty` | Get loyalty twin data |

### Flow 4: CRM Integration

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   REZ CRM   │────▶│   TwinOS    │────▶│ REZ Business│────▶│   REZ POS   │
│  (Customer) │     │(Customer Twin)│   │  Copilot    │     │  (Execute)  │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

**CRM Capabilities:**
- Customer profiles with demographic and behavioral data
- Segmentation based on visit frequency, spend, preferences
- Campaign automation (birthday, win-back, re-engagement)
- Visit tracking and dining pattern analysis
- Marketing attribution and campaign ROI

**API Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/crm/customers/{customer_id}` | Get CRM customer profile |
| GET | `/api/v1/crm/customers/{customer_id}/segments` | Get customer segments |
| POST | `/api/v1/crm/campaigns/trigger` | Trigger campaign |
| GET | `/api/v1/crm/segments/{segment_id}` | Get segment details |
| POST | `/api/v1/crm/visits/track` | Track visit event |
| GET | `/api/v1/twins/customer/{customer_id}/crm` | Get CRM twin data |

---

## Agent Architecture

### Agent Registry

| Agent ID | Type | Responsibilities |
|----------|------|------------------|
| `agent.table_management` | Operational | Table status tracking, seating optimization, turn time management |
| `agent.kitchen_operations` | Operational | Order routing, cook time prediction, station balancing |
| `agent.menu_management` | Content | Menu item availability, pricing optimization, seasonal rotation |
| `agent.customer_insights` | Analytics | Customer profiling, preference learning, churn prediction |
| `agent.staff_management` | HR | Scheduling optimization, tip distribution, performance tracking |
| `agent.inventory_control` | Supply Chain | Stock monitoring, reorder triggers, waste reduction |
| `agent.revenue_optimization` | Revenue | Dynamic pricing, upsell optimization, demand forecasting |
| `agent.quality_assurance` | Quality | Food quality monitoring, customer feedback analysis |
| `agent.business_copilot` | Intelligence | Natural language queries, recommendations, anomaly detection |
| `agent.twin_orchestrator` | TwinOS Core | Twin CRUD, relationship management, event distribution |
| `agent.crm_intelligence` | CRM | Customer segmentation, campaign management, visit tracking, marketing automation |

### Agent Communication Patterns

**Pub/Sub Topics:**
- `restaurant.order.created` - New order events
- `restaurant.order.updated` - Order modifications
- `restaurant.order.completed` - Order fulfilled
- `restaurant.table.status` - Table status changes
- `restaurant.kitchen.alert` - Kitchen alerts
- `restaurant.customer.visited` - Customer visits
- `restaurant.loyalty.transaction` - Points transactions
- `restaurant.inventory.alert` - Stock alerts
- `restaurant.crm.segment.updated` - CRM segment changes
- `restaurant.crm.campaign.triggered` - Campaign triggers
- `restaurant.crm.visit.tracked` - Visit tracking events

**gRPC Services (Kitchen):**
```protobuf
service KitchenService {
  rpc SubmitOrder(Order) returns (KitchenTicket);
  rpc UpdateTicket(TicketUpdate) returns (TicketStatus);
  rpc GetKitchenStatus(KitchenStatusRequest) returns (KitchenStatus);
  rpc StreamTicketUpdates(TicketStreamRequest) returns (stream TicketUpdate);
}
```

---

## Business Copilot Queries Supported

### Operational Queries

| Query | Description | Example |
|-------|-------------|---------|
| `table_status` | Current table status | "Which tables are available for a party of 4?" |
| `wait_time` | Estimated wait times | "What's the current wait for a table?" |
| `kitchen_load` | Kitchen capacity | "Can we handle 10 more orders right now?" |
| `staffing_level` | Current coverage | "Are we adequately staffed for dinner rush?" |
| `order_status` | Track specific order | "Where's order #1234 in the kitchen?" |

### Customer Queries

| Query | Description | Example |
|-------|-------------|---------|
| `customer_history` | Visit history | "What's this customer's order history?" |
| `preference_lookup` | Known preferences | "Any allergies I should know about for table 5?" |
| `loyalty_status` | Points and tier | "How many points does the guest at table 8 have?" |
| `personalized_recommendation` | Item suggestions | "What should I recommend for table 3 based on their preferences?" |

### Revenue Queries

| Query | Description | Example |
|-------|-------------|---------|
| `sales_today` | Daily sales | "What are our sales so far today?" |
| `peak_hours` | Traffic patterns | "When are our busiest hours on Saturdays?" |
| `item_performance` | Menu item analytics | "Which appetizers are selling best this week?" |
| `labor_cost` | Labor analysis | "What's our current labor cost percentage?" |
| `profit_margin` | Item profitability | "What's the margin on our pasta dishes?" |

### Inventory Queries

| Query | Description | Example |
|-------|-------------|---------|
| `stock_level` | Current inventory | "Do we have enough salmon for tonight?" |
| `usage_forecast` | Usage prediction | "How much chicken will we use this week?" |
| `waste_analysis` | Waste tracking | "What's our waste rate on fries?" |
| `reorder_needed` | Reorder alerts | "What items should we reorder this week?" |

### Example Copilot Interactions

```python
# Example: Personalized recommendation
{
  "query": "Suggest a wine pairing for the table at table 12",
  "agent": "agent.business_copilot",
  "context": {
    "table_id": "TBL-012",
    "items_ordered": ["MNU-101", "MNU-205", "MNU-340"]
  },
  "response": {
    "recommendations": [
      {
        "item_id": "WINE-201",
        "name": "Château Margaux 2018",
        "reason": "Pairs well with the ribeye and has been ordered by this customer before",
        "price": 85.00,
        "confidence": 0.94
      }
    ]
  }
}

# Example: Anomaly detection
{
  "query": "Is there anything unusual happening in the kitchen?",
  "agent": "agent.business_copilot",
  "response": {
    "anomalies": [
      {
        "type": "cook_time_spike",
        "description": "Grill station cook times are 40% above normal",
        "affected_items": ["MNU-101", "MNU-102"],
        "possible_causes": ["equipment_issue", "staff_shortage"],
        "recommended_action": "Check grill temperature and station staffing"
      }
    ],
    "severity": "warning"
  }
}
```

---

## Economic Integration

### Payment Flows

| Flow | Description | Integration |
|------|-------------|-------------|
| Card Payment | Credit/debit processing | REZ POS → Payment Gateway → TwinOS |
| Digital Payment | Mobile wallets, NFC | REZ QR Cloud → REZ POS → TwinOS |
| Split Payment | Multiple payment methods | REZ POS handles splitting → TwinOS |
| Gratuity | Tip processing | REZ POS → REZ Staff → TwinOS |

**API Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/payments/process` | Process payment |
| POST | `/api/v1/payments/refund` | Process refund |
| GET | `/api/v1/payments/{payment_id}` | Get payment status |
| POST | `/api/v1/tips/distribute` | Distribute tips |

### Rewards Integration

| Program | Points Source | Redemption |
|---------|--------------|------------|
| REZ Loyalty | All transactions | Free items, discounts, experiences |
| Birthday Rewards | Customer birthday | Complimentary item |
| Referral Program | Successful referrals | Account credit |
| Punch Card | Visit-based | Free item after X visits |

**Points Calculation:**
```json
{
  "base_points_per_dollar": 1.0,
  "tier_multipliers": {
    "classic": 1.0,
    "silver": 1.25,
    "gold": 1.5,
    "platinum": 2.0
  },
  "bonus_categories": {
    "dine_in": 1.0,
    "takeout": 0.5,
    "delivery": 0.5,
    "banquet": 1.5
  },
  "redemption_rate": {
    "points_per_dollar": 100,
    "dollar_value": 1.00
  }
}
```

---

## Implementation Roadmap

### Week 1: Foundation

**Objective:** Set up TwinOS infrastructure and core POS integration

| Task | Description | Owner | Deliverable |
|------|-------------|-------|-------------|
| 1.1 | Configure TwinOS tenant | DevOps | TwinOS tenant provisioned |
| 1.2 | Define twin schemas | Data Eng | JSON schemas for all 5 twins |
| 1.3 | Set up REZ POS API | Backend | POS API endpoints live |
| 1.4 | Configure OAuth + API Keys | Security | Auth configured |
| 1.5 | Create test environment | DevOps | Isolated test environment |
| 1.6 | Document API contracts | API Team | OpenAPI specs |
| 1.7 | Set up message broker | DevOps | Kafka cluster |
| 1.8 | Create twin provisioning scripts | Data Eng | Automated twin creation |

**Acceptance Criteria:**
- TwinOS tenant accessible
- All twin schemas validated
- REZ POS API responding
- Auth tokens working

### Week 2: Core POS Integration

**Objective:** Implement REZ POS → TwinOS integration

| Task | Description | Owner | Deliverable |
|------|-------------|-------|-------------|
| 2.1 | Implement Table Twin CRUD | Backend | Table Twin API complete |
| 2.2 | Build order ingestion pipeline | Data Eng | Real-time order processing |
| 2.3 | Implement menu sync | Backend | Menu ↔ TwinOS sync |
| 2.4 | Create customer lookup | Backend | Customer search service |
| 2.5 | Build KDS integration | Backend | KDS ↔ TwinOS |
| 2.6 | Implement QR Cloud integration | Backend | QR Cloud ↔ TwinOS |
| 2.7 | Create WebSocket connections | Backend | Real-time streaming |
| 2.8 | Build test scenarios | QA | Integration test suite |

**Acceptance Criteria:**
- Table Twin updated on status change
- Orders flow to TwinOS in < 200ms
- Menu changes reflect in Twin
- KDS receives real-time updates

### Week 3: Kitchen & Inventory Integration

**Objective:** Connect Kitchen AI and REZ Inventory

| Task | Description | Owner | Deliverable |
|------|-------------|-------|-------------|
| 3.1 | Implement Kitchen Twin | Backend | Kitchen Twin API complete |
| 3.2 | Build station management | Backend | Station CRUD |
| 3.3 | Implement gRPC for KDS | Backend | High-throughput KDS connection |
| 3.4 | Deploy Kitchen AI agent | ML Team | AI agent operational |
| 3.5 | Implement Inventory Twin | Backend | Inventory Twin API |
| 3.6 | Build stock monitoring | Backend | Real-time stock tracking |
| 3.7 | Create reorder triggers | Backend | Automated reorder alerts |
| 3.8 | Build waste tracking | Backend | Waste analytics |

**Acceptance Criteria:**
- Kitchen Twin reflects real-time status
- gRPC latency < 50ms
- Kitchen AI making predictions
- Inventory alerts working

### Week 4: Customer & Loyalty Integration

**Objective:** Connect Customer Twin and REZ Loyalty

| Task | Description | Owner | Deliverable |
|------|-------------|-------|-------------|
| 4.1 | Implement Customer Twin | Backend | Customer Twin API |
| 4.2 | Build preference learning | ML Team | Preference engine |
| 4.3 | Implement REZ Loyalty integration | Backend | Loyalty ↔ TwinOS |
| 4.4 | Deploy customer_insights agent | ML Team | Agent operational |
| 4.5 | Build REZ Staff integration | Backend | Staff ↔ TwinOS |
| 4.6 | Implement tip distribution | Backend | Tip engine |
| 4.7 | Create agent registry | Agent | Agent catalog populated |
| 4.8 | Build pub/sub topics | Data Eng | Topic infrastructure |

**Acceptance Criteria:**
- Customer Twin updated on each visit
- Preferences learned over time
- Loyalty points calculating correctly
- Tip distribution automated

### Week 5: Business Copilot

**Objective:** Enable natural language queries

| Task | Description | Owner | Deliverable |
|------|-------------|-------|-------------|
| 5.1 | Implement query handlers | NLP Team | Query handlers deployed |
| 5.2 | Build recommendation engine | ML Team | Recommendations working |
| 5.3 | Implement anomaly detection | ML Team | Anomaly alerts |
| 5.4 | Build query routing | Backend | Intelligent routing |
| 5.5 | Create response templates | Product | Response formats |
| 5.6 | Implement query history | Backend | Audit trail |
| 5.7 | Build copilot UI | Frontend | Query interface |
| 5.8 | User acceptance testing | QA | UAT completed |

**Acceptance Criteria:**
- All documented queries working
- Responses accurate
- UI functional
- UAT passed

### Week 6: Dashboard & Go-Live

**Objective:** Deploy REZ Dashboard and production launch

| Task | Description | Owner | Deliverable |
|------|-------------|-------|-------------|
| 6.1 | Implement REZ Dashboard | Frontend | Dashboard complete |
| 6.2 | Build real-time widgets | Frontend | Live data widgets |
| 6.3 | Implement reporting engine | Analytics | Reports working |
| 6.4 | End-to-end integration test | QA | Full flow testing |
| 6.5 | Performance testing | QA | Load testing |
| 6.6 | Security audit | Security | Penetration testing |
| 6.7 | Documentation | Tech Writing | All docs complete |
| 6.8 | Production deployment | DevOps | Go-live |

**Acceptance Criteria:**
- Dashboard operational
- Real-time data flowing
- E2E tests passing
- Performance targets met
- Security audit clean
- Production deployed

---

## Appendix

### A. API Rate Limits

| Endpoint Category | Limit | Window |
|-------------------|-------|--------|
| POS Operations | 5000 | per minute |
| Order Submission | 2000 | per minute |
| Twin CRUD | 1000 | per minute |
| Business Copilot | 200 | per minute |
| WebSocket Connections | 1000 | per tenant |

### B. Data Retention

| Data Type | Retention Period |
|-----------|-----------------|
| Customer Profiles | Lifetime (with consent) |
| Transaction Records | 7 years |
| Order History | 3 years |
| Inventory Data | 2 years |
| Staff Records | 7 years |
| Audit Logs | 1 year |

### C. Security Requirements

- All API calls over TLS 1.3
- OAuth 2.0 for user authentication
- API Keys for POS terminals
- PCI-DSS compliant payment handling
- PII fields encrypted at rest
- Audit logging for all transactions

### D. Error Codes

| Code | Description |
|------|-------------|
| `ORDER_NOT_FOUND` | Order does not exist |
| `TABLE_OCCUPIED` | Table not available |
| `ITEM_UNAVAILABLE` | Menu item 86'd |
| `PAYMENT_FAILED` | Payment processing error |
| `KITCHEN_OVERLOAD` | Kitchen at capacity |
| `INVENTORY_SHORTAGE` | Insufficient stock |
| `AUTH_INVALID_TOKEN` | Invalid/expired token |
| `RATE_LIMIT_EXCEEDED` | API rate limit hit |

---

**Document Control:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-06-12 | RTMN Architecture Team | Initial specification |
