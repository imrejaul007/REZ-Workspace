# Real Estate OS Integration Specification

**Version:** 1.0.0  
**Last Updated:** 2026-06-12  
**Industry:** Real Estate

---

## Executive Summary

The Real Estate OS Integration Specification defines the technical architecture for connecting RTMN's real estate products with TwinOS, enabling real-time digital twins of properties, agents, buyers, deals, areas, and referrals. The integration creates a unified data layer where PropFlow AI serves as the primary intelligence engine, feeding market insights to TwinOS while consuming property and agent data for predictive analytics.

**Key Integration Point:** PropFlow AI ↔ TwinOS  
**Data Flow Direction:** Bidirectional - PropFlow produces insights, TwinOS orchestrates real estate data  
**Primary Protocol:** REST API with WebSocket for real-time property updates  
**Authentication:** OAuth 2.0 + JWT for agent authentication

---

## Product Capability Matrix

### 1. PropFlow AI

| Attribute | Value |
|-----------|-------|
| **Port** | `8843` |
| **Capabilities** | Price prediction, market analysis, investment scoring, lead scoring, trend forecasting, anomaly detection |
| **Data Produced** | Price predictions, market scores, investment recommendations, risk assessments |
| **Data Needed** | Property Twin (features), Area Twin (market data), Buyer Twin (preferences) |
| **TwinOS Role** | PRIMARY PRODUCER - real estate intelligence engine |

### 2. Property Marketplace

| Attribute | Value |
|-----------|-------|
| **Port** | `8844` |
| **Capabilities** | Property listings, search, virtual tours, comparison, favorites, mortgage calculator |
| **Data Produced** | Listings, views, searches, saved properties, inquiries |
| **Data Needed** | Property Twin, Area Twin, Agent Twin |

### 3. Lead Management

| Attribute | Value |
|-----------|-------|
| **Port** | `8845` |
| **Capabilities** | Lead capture, scoring, routing, nurturing, CRM, follow-up automation |
| **Data Produced** | Leads, interactions, scores, conversions, pipeline status |
| **Data Needed** | Buyer Twin, Agent Twin, Property Twin |

### 4. Investment Analysis

| Attribute | Value |
|-----------|-------|
| **Port** | `8846` |
| **Capabilities** | ROI calculation, cash flow analysis, depreciation, cap rate, comparison, portfolio analysis |
| **Data Produced** | Investment reports, returns projections, portfolio metrics |
| **Data Needed** | Property Twin, Area Twin, Market Twin |

### 5. Virtual Tours

| Attribute | Value |
|-----------|-------|
| **Port** | `8847` |
| **Capabilities** | 3D tours, video tours, AR staging, measurement, screen sharing |
| **Data Produced** | Tour sessions, engagement metrics, completion rates |
| **Data Needed** | Property Twin, Buyer Twin |

### 6. Broker Network

| Attribute | Value |
|-----------|-------|
| **Port** | `8848` |
| **Capabilities** | Agent directory, commission sharing, referral network, MLS integration, cooperation tools |
| **Data Produced** | Agent profiles, referrals, commissions, network activity |
| **Data Needed** | Agent Twin, Property Twin |

### 7. Golden Visa

| Attribute | Value |
|-----------|-------|
| **Port** | `8849` |
| **Capabilities** | Visa eligibility checking, document guidance, attorney matching, progress tracking |
| **Data Produced** | Eligibility assessments, applications, milestones, document status |
| **Data Needed** | Buyer Twin, Property Twin, Agent Twin |

### 8. Referrals & Rewards

| Attribute | Value |
|-----------|-------|
| **Port** | `8850` |
| **Capabilities** | Referral tracking, reward points, commission sharing, affiliate program |
| **Data Produced** | Referrals, rewards, conversions, commission records |
| **Data Needed** | Buyer Twin, Agent Twin, Referral Twin |

---

## Digital Twin Definitions

### Property Twin

**TwinOS Entity ID:** `twin.realestate.property.{property_id}`

**Attributes:**
```json
{
  "property_id": "string (UUID)",
  "listing": {
    "listing_id": "string",
    "status": "active|pending|under_contract|sold|off_market",
    "listing_date": "ISO8601 date",
    "listing_price": "number",
    "asking_price": "number",
    "price_history": [
      {
        "price": "number",
        "date": "ISO8601 date",
        "event": "price_change|relisted"
      }
    ],
    "days_on_market": "number"
  },
  "location": {
    "address": {
      "street": "string",
      "unit": "string|null",
      "city": "string",
      "state": "string",
      "postal_code": "string",
      "country": "string"
    },
    "coordinates": { "lat": "number", "lng": "number" },
    "area_id": "string",
    "neighborhood": "string",
    "submarket": "string"
  },
  "physical": {
    "property_type": "single_family|condo|townhouse|multi_family|land|commercial",
    "year_built": "number",
    "lot_size_sqft": "number",
    "interior_sqft": "number",
    "bedrooms": "number",
    "bathrooms": "number",
    "garage": "number",
    "stories": "number",
    "parking_spaces": "number",
    "hoa_fee": "number|null",
    "lot_acreage": "number|null"
  },
  "features": {
    "interior": ["string"],
    "exterior": ["string"],
    "energy": ["string"],
    "smart_home": ["string"],
    "accessibility": ["string"]
  },
  "condition": {
    "overall": "excellent|good|fair|poor",
    "roof_age": "number (years)",
    "hvac_age": "number (years)",
    "plumbing_age": "number (years)",
    "electrical_age": "number (years)",
    "last_inspection": "ISO8601 date|null"
  },
  "financial": {
    "current_value": "number",
    "propflow_estimate": "number",
    "rent_zestimate": "number|null",
    "property_tax": "number",
    "insurance_estimate": "number",
    "hoa_fee": "number|null",
    "mortgage_balance": "number|null"
  },
  "market": {
    "comp_price_per_sqft": "number",
    "avg_days_on_market": "number",
    "price_trend": "increasing|stable|decreasing",
    "market_temperature": "hot|warm|cool|cold",
    "competition_index": "number (0-100)"
  },
  "media": {
    "photos": ["string (URLs)"],
    "videos": ["string (URLs)"],
    "3d_tour_url": "string|null",
    "floor_plan_url": "string|null",
    "documents": ["string (URLs)"]
  },
  "ownership": {
    "owner_type": "individual|llc|corporation|trust",
    "owner_name": "string",
    "last_sale_date": "ISO8601 date|null",
    "last_sale_price": "number|null"
  },
  "agent": {
    "listing_agent_id": "string",
    "co_agent_id": "string|null",
    "brokerage_id": "string"
  }
}
```

**Relationships:**
- `LOCATED_IN` → Area Twin
- `LISTED_BY` → Agent Twin
- `INTERESTED_IN` → Buyer Twin (1:many)
- `REFERENCED_IN` → Deal Twin

**Managing Agent:** `agent.property_intelligence`

### Agent Twin

**TwinOS Entity ID:** `twin.realestate.agent.{agent_id}`

**Attributes:**
```json
{
  "agent_id": "string (UUID)",
  "profile": {
    "name": {
      "first": "string",
      "last": "string",
      "prefix": "string|null"
    },
    "photo_url": "string",
    "bio": "string",
    "languages": ["string"],
    "specialties": ["string"],
    "license_number": "string",
    "license_state": "string",
    "license_expiration": "ISO8601 date"
  },
  "contact": {
    "phone": "string",
    "email": "string",
    "website": "string|null",
    "social": {
      "linkedin": "string|null",
      "facebook": "string|null",
      "instagram": "string|null"
    }
  },
  "brokerage": {
    "brokerage_id": "string",
    "brokerage_name": "string",
    "brokerage_address": "string",
    "team_name": "string|null"
  },
  "performance": {
    "transactions_ytd": "number",
    "volume_ytd": "number",
    "avg_days_to_close": "number",
    "list_to_sale_ratio": "number",
    "client_rating": "number (1-5)",
    "review_count": "number",
    "recommendation_rate": "number (percentage)"
  },
  "expertise": {
    "areas": ["string (area_ids)"],
    "property_types": ["string"],
    "price_ranges": {
      "min": "number",
      "max": "number"
    },
    "years_experience": "number"
  },
  "availability": {
    "status": "available|busy|unavailable",
    "response_time_avg_minutes": "number",
    "working_hours": {
      "monday": { "start": "string", "end": "string" },
      "tuesday": { "start": "string", "end": "string" },
      "wednesday": { "start": "string", "end": "string" },
      "thursday": { "start": "string", "end": "string" },
      "friday": { "start": "string", "end": "string" },
      "saturday": { "start": "string", "end": "string" },
      "sunday": { "start": "string", "end": "string" }
    }
  },
  "lead_preferences": {
    "min_budget": "number",
    "max_budget": "number",
    "property_types": ["string"],
    "areas": ["string"],
    "lead_routing_enabled": "boolean"
  },
  "compensation": {
    "commission_split": "number (percentage)",
    "referral_fee_rate": "number (percentage)"
  }
}
```

**Relationships:**
- `WORKS_AT` → Brokerage Twin
- `SERVICES` → Area Twin (1:many)
- `LISTINGS` → Property Twin (1:many)
- `WORKING_WITH` → Buyer Twin (1:many)
- `PARTICIPATES_IN` → Deal Twin (1:many)

**Managing Agent:** `agent.agent_intelligence`

### Buyer Twin

**TwinOS Entity ID:** `twin.realestate.buyer.{buyer_id}`

**Attributes:**
```json
{
  "buyer_id": "string (UUID)",
  "profile": {
    "name": {
      "first": "string",
      "last": "string"
    },
    "email": "string",
    "phone": "string",
    "preferred_contact": "email|phone|text",
    "preferred_language": "string"
  },
  "search_criteria": {
    "property_type": ["string"],
    "min_bedrooms": "number",
    "max_bedrooms": "number",
    "min_bathrooms": "number",
    "max_bathrooms": "number",
    "min_price": "number",
    "max_price": "number",
    "min_sqft": "number",
    "max_sqft": "number",
    "areas": ["string (area_ids)"],
    "features": ["string"],
    "amenities": ["string"]
  },
  "financing": {
    "pre_approved": "boolean",
    "pre_approval_amount": "number|null",
    "pre_approval_expiration": "ISO8601 date|null",
    "down_payment_amount": "number",
    "down_payment_percentage": "number",
    "financing_type": "conventional|fha|va|cash|other",
    "lender_name": "string|null"
  },
  "timeline": {
    "urgency": "immediate|1_3_months|3_6_months|6_12_months|exploring",
    "target_move_date": "ISO8601 date|null",
    "lease_end_date": "ISO8601 date|null",
    "must_sell_first": "boolean"
  },
  "preferences": {
    "school_districts": ["string"],
    "commute_radius_miles": "number",
    "lifestyle": ["string"],
    "neighborhood_preferences": ["string"]
  },
  "golden_visa": {
    "interested": "boolean",
    "country": "string|null",
    "investment_range": {
      "min": "number",
      "max": "number"
    },
    "status": "not_started|documenting|applying|approved|rejected"
  },
  "status": {
    "current": "active|paused|inactive|closed",
    "stage": "searching|viewing|negotiating|under_contract|closed",
    "last_activity": "ISO8601 datetime",
    "viewing_count": "number"
  },
  "history": {
    "properties_viewed": ["string (property_ids)"],
    "properties_saved": ["string (property_ids)"],
    "offers_made": "number",
    "offers_accepted": "number",
    "transactions_completed": "number"
  },
  "assigned_agent_id": "string|null",
  "source": "organic|referral|advertising|partner"
}
```

**Relationships:**
- `WORKING_WITH` → Agent Twin
- `INTERESTED_IN` → Property Twin (1:many)
- `PARTICIPATES_IN` → Deal Twin
- `REFERRED_BY` → Referral Twin

**Managing Agent:** `agent.buyer_intelligence`

### Deal Twin

**TwinOS Entity ID:** `twin.realestate.deal.{deal_id}`

**Attributes:**
```json
{
  "deal_id": "string (UUID)",
  "property_id": "string",
  "buyer_id": "string",
  "listing_agent_id": "string",
  "selling_agent_id": "string|null",
  "stage": {
    "current": "inquiry|showing|offer|negotiation|under_contract|inspection|appraisal|closing|closed|dead",
    "started_at": "ISO8601 datetime",
    "updated_at": "ISO8601 datetime"
  },
  "offer": {
    "offer_price": "number",
    "offer_date": "ISO8601 date",
    "earnest_money": "number",
    "contingencies": ["string"],
    "closing_date_proposed": "ISO8601 date",
    "possession_date": "ISO8601 date",
    "financing_type": "string"
  },
  "negotiation": {
    "counter_offers": "number",
    "price_adjustments": [
      {
        "price": "number",
        "date": "ISO8601 date",
        "direction": "up|down"
      }
    ]
  },
  "inspection": {
    "scheduled_date": "ISO8601 date|null",
    "completed_date": "ISO8601 date|null",
    "issues_found": "number",
    "repair_credits": "number"
  },
  "appraisal": {
    "ordered_date": "ISO8601 date|null",
    "completed_date": "ISO8601 date|null",
    "appraised_value": "number|null",
    "match": "boolean|null"
  },
  "financing": {
    "lender_name": "string",
    "loan_type": "string",
    "pre_approval_number": "string",
    "appraisal_ordered": "boolean",
    "underwriting_status": "string"
  },
  "title": {
    "company": "string",
    "est_closing_date": "ISO8601 date",
    "title_search_status": "string"
  },
  "financials": {
    "sale_price": "number",
    "agent_commission": "number",
    "brokerage_fee": "number",
    "title_fee": "number",
    "transfer_tax": "number",
    "other_closing_costs": "number",
    "net_proceeds": "number"
  },
  "documents": [
    {
      "type": "string",
      "url": "string",
      "uploaded_at": "ISO8601 datetime"
    }
  ],
  "timeline": {
    "milestones": [
      {
        "name": "string",
        "status": "pending|completed|skipped",
        "completed_at": "ISO8601 datetime|null"
      }
    ]
  }
}
```

**Relationships:**
- `INVOLVES` → Property Twin
- `INITIATED_BY` → Buyer Twin
- `REPRESENTED_BY` → Agent Twin (1:many)
- `REFERENCED_IN` → Referral Twin

**Managing Agent:** `agent.deal_management`

### Area Twin

**TwinOS Entity ID:** `twin.realestate.area.{area_id}`

**Attributes:**
```json
{
  "area_id": "string (UUID)",
  "profile": {
    "name": "string",
    "type": "neighborhood|city|zip_code|county|region",
    "parent_area_id": "string|null",
    "boundaries": {
      "type": "polygon",
      "coordinates": ["array"]
    }
  },
  "demographics": {
    "population": "number",
    "households": "number",
    "median_age": "number",
    "median_income": "number",
    "employment_rate": "number (percentage)",
    "top_industries": ["string"]
  },
  "housing": {
    "total_units": "number",
    "owner_occupied": "number (percentage)",
    "renter_occupied": "number (percentage)",
    "vacancy_rate": "number (percentage)",
    "median_home_value": "number",
    "median_rent": "number",
    "avg_rent_to_income": "number (percentage)"
  },
  "market_analytics": {
    "avg_list_price": "number",
    "avg_sale_price": "number",
    "avg_price_per_sqft": "number",
    "avg_days_on_market": "number",
    "months_of_inventory": "number",
    "list_to_sale_ratio": "number",
    "price_trend_1yr": "number (percentage)",
    "price_trend_5yr": "number (percentage)",
    "forecast_1yr": "number (percentage)"
  },
  "schools": [
    {
      "name": "string",
      "type": "elementary|middle|high|private",
      "rating": "number (1-10)",
      "distance_miles": "number"
    }
  ],
  "transportation": {
    "avg_commute_minutes": "number",
    "public_transit_available": "boolean",
    "highway_access": ["string"],
    "walk_score": "number",
    "bike_score": "number"
  },
  "amenities": {
    "restaurants": "number",
    "shopping": "number",
    "parks": "number",
    "gyms": "number",
    "hospitals": "number",
    "transit_stops": "number"
  },
  "crime": {
    "safety_index": "number (0-100)",
    "trend": "improving|stable|declining"
  },
  "propflow_score": {
    "overall": "number (0-100)",
    "appreciation_potential": "number (0-100)",
    "rental_yield": "number (0-100)",
    "liquidity": "number (0-100)",
    "risk_score": "number (0-100)"
  }
}
```

**Relationships:**
- `CONTAINS` → Property Twin (1:many)
- `SERVICED_BY` �� Agent Twin (1:many)
- `PARENT_OF` → Area Twin (1:many)

**Managing Agent:** `agent.area_intelligence`

### Referral Twin

**TwinOS Entity ID:** `twin.realestate.referral.{referral_id}`

**Attributes:**
```json
{
  "referral_id": "string (UUID)",
  "referrer": {
    "type": "agent|client|partner|advertising",
    "agent_id": "string|null",
    "buyer_id": "string|null"
  },
  "referred": {
    "type": "buyer|agent|property",
    "buyer_id": "string|null",
    "agent_id": "string|null",
    "property_id": "string|null"
  },
  "deal_id": "string|null",
  "status": {
    "current": "sent|contacted|active|converted|closed|expired|cancelled",
    "converted_at": "ISO8601 datetime|null"
  },
  "incentive": {
    "referrer_reward": {
      "type": "flat|percentage",
      "amount": "number",
      "paid": "boolean",
      "paid_at": "ISO8601 datetime|null"
    },
    "referred_reward": {
      "type": "flat|percentage",
      "amount": "number",
      "paid": "boolean",
      "paid_at": "ISO8601 datetime|null"
    }
  },
  "timeline": {
    "created_at": "ISO8601 datetime",
    "sent_at": "ISO8601 datetime",
    "first_contact_at": "ISO8601 datetime|null",
    "converted_at": "ISO8601 datetime|null",
    "closed_at": "ISO8601 datetime|null"
  },
  "tracking": {
    "source_channel": "string",
    "utm_source": "string|null",
    "utm_medium": "string|null",
    "utm_campaign": "string|null"
  }
}
```

**Relationships:**
- `SENT_BY` → Agent Twin / Buyer Twin
- `RECEIVED_BY` → Agent Twin / Buyer Twin
- `LINKED_TO` → Deal Twin

**Managing Agent:** `agent.referral_tracking`

---

## Integration Flows

### Flow 1: Property Listing to Sale

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Marketplace │────▶│   TwinOS    │────▶│  PropFlow  │────▶│   Virtual   │
│  (Listing)  │     │(Property Twin)│   │    AI      │     │   Tours     │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                           │                    │                    │
                           ▼                    ▼                    ▼
                    ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
                    │    Lead     │     │  Investment│     │   Broker    │
                    │ Management  │     │  Analysis  │     │   Network   │
                    └─────────────┘     └─────────────┘     └─────────────┘
```

**API Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/properties` | Create property listing |
| GET | `/api/v1/properties/{property_id}` | Get property |
| PATCH | `/api/v1/properties/{property_id}` | Update property |
| POST | `/api/v1/twins/property` | Create Property Twin |
| GET | `/api/v1/twins/property/{property_id}` | Get Property Twin |
| PATCH | `/api/v1/twins/property/{property_id}` | Update Property Twin |
| POST | `/api/v1/events/listing` | Publish listing event |
| WS | `/ws/property/{property_id}/updates` | Real-time property updates |

### Flow 2: PropFlow AI Analysis

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  PropFlow   │────▶│   TwinOS    │────▶│ Marketplace │────▶│   Lead     │
│    AI       │     │(Property Twin)│   │  (Display) │     │ Management │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

**API Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/ai/price-estimate` | Get price estimate |
| POST | `/api/v1/ai/market-analysis` | Get market analysis |
| POST | `/api/v1/ai/investment-score` | Get investment score |
| POST | `/api/v1/ai/lead-score` | Score a lead |
| GET | `/api/v1/twins/property/{property_id}/propflow` | Get PropFlow insights |
| GET | `/api/v1/twins/area/{area_id}/propflow` | Get area PropFlow score |

**Request/Response Example:**

```json
// POST /api/v1/ai/price-estimate
{
  "property_id": "PROP-123",
  "include_comps": true,
  "forecast_horizon_months": 12
}

// Response
{
  "property_id": "PROP-123",
  "estimate": {
    "current_value": 485000,
    "confidence_interval": {
      "low": 460750,
      "high": 509250
    },
    "confidence_score": 0.87
  },
  "forecast": {
    "1_month": 488000,
    "3_month": 492000,
    "6_month": 498000,
    "12_month": 505000
  },
  "comps": [
    {
      "property_id": "PROP-456",
      "address": "123 Main St",
      "sale_price": 490000,
      "sold_date": "2024-01-15",
      "sqft": 1850,
      "price_per_sqft": 265
    }
  ],
  "factors": [
    {
      "factor": "market_trend",
      "impact": "positive",
      "description": "Area prices up 8% YoY"
    }
  ]
}
```

### Flow 3: Deal Lifecycle

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    Lead     │────▶│   TwinOS    │────▶│    Deal     │────▶│  Referrals │
│ Management  │     │(Buyer Twin) │     │ Management  │     │  & Rewards │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

**API Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/deals` | Create deal |
| GET | `/api/v1/deals/{deal_id}` | Get deal |
| PATCH | `/api/v1/deals/{deal_id}/stage` | Update deal stage |
| POST | `/api/v1/deals/{deal_id}/offer` | Submit offer |
| POST | `/api/v1/deals/{deal_id}/close` | Close deal |
| GET | `/api/v1/twins/deal/{deal_id}` | Get Deal Twin |
| POST | `/api/v1/referrals` | Create referral |
| GET | `/api/v1/referrals/{referral_id}` | Get referral status |

---

## Agent Architecture

### Agent Registry

| Agent ID | Type | Responsibilities |
|----------|------|------------------|
| `agent.property_intelligence` | Analytics | Property valuation, comparison analysis, listing optimization |
| `agent.agent_intelligence` | CRM | Agent performance, lead routing, productivity tracking |
| `agent.buyer_intelligence` | CRM | Buyer profiling, search matching, timeline prediction |
| `agent.deal_management` | Operations | Deal tracking, milestone management, closing coordination |
| `agent.area_intelligence` | Analytics | Market analysis, area scoring, demographic insights |
| `agent.propflow_ai` | Intelligence | Price prediction, investment analysis, market forecasting |
| `agent.referral_tracking` | Marketing | Referral tracking, reward calculation, commission splitting |
| `agent.golden_visa` | Compliance | Visa eligibility, document tracking, rewards |
| `agent.twin_orchestrator` | TwinOS Core | Twin CRUD, relationship management, event distribution |

### Agent Communication Patterns

**Pub/Sub Topics:**
- `realestate.property.listed` - New listing events
- `realestate.property.updated` - Property updates
- `realestate.property.sold` - Sale events
- `realestate.buyer.created` - New buyer events
- `realestate.buyer.stage_change` - Buyer stage changes
- `realestate.deal.created` - New deal events
- `realestate.deal.stage_change` - Deal stage changes
- `realestate.deal.closed` - Deal closed
- `realestate.referral.created` - Referral events
- `realestate.propflow.update` - PropFlow insights

**Event Schema:**
```json
{
  "event_type": "string",
  "entity_type": "property|buyer|agent|deal|area|referral",
  "entity_id": "string",
  "timestamp": "ISO8601 datetime",
  "data": {
    "changes": {},
    "metadata": {}
  }
}
```

---

## Business Copilot Queries Supported

### Property Queries

| Query | Description | Example |
|-------|-------------|---------|
| `property_summary` | Get property overview | "Summarize this property's key features" |
| `price_analysis` | Analyze pricing | "How does this property's price compare to the market?" |
| `investment_analysis` | Investment assessment | "Is this a good investment property?" |
| `market_comparison` | Compare to market | "How does this property compare to recent sales?" |
| `propflow_score` | Get PropFlow score | "What's the PropFlow investment score for this property?" |

### Buyer Queries

| Query | Description | Example |
|-------|-------------|---------|
| `buyer_profile` | Get buyer summary | "What's this buyer's search criteria?" |
| `matching_properties` | Find matches | "What properties match this buyer's criteria?" |
| `buyer_timeline` | Predict timeline | "When is this buyer likely to close?" |
| `pre_approval_status` | Check financing | "Is this buyer pre-approved?" |
| `golden_visa_eligibility` | Check eligibility | "Is this buyer eligible for Golden Visa?" |

### Deal Queries

| Query | Description | Example |
|-------|-------------|---------|
| `deal_status` | Get deal summary | "What's the status of deal DEAL-123?" |
| `closing_timeline` | Predict closing | "When will this deal likely close?" |
| `negotiation_status` | Check negotiation | "How many counter-offers on this deal?" |
| `deal_financials` | Get financials | "What are the financials for this deal?" |
| `contingency_tracking` | Track contingencies | "What contingencies are still open?" |

### Market Queries

| Query | Description | Example |
|-------|-------------|---------|
| `market_overview` | Get market summary | "What's the current market in Austin?" |
| `area_comparison` | Compare areas | "How does neighborhood A compare to B?" |
| `price_trends` | Analyze trends | "What are home prices doing in this area?" |
| `inventory_levels` | Check supply | "How much inventory in this zip code?" |
| `investment_outlook` | Investment assessment | "Is this a good time to invest in this area?" |

### Example Copilot Interactions

```python
# Example: Investment analysis
{
  "query": "Is this property a good investment?",
  "agent": "agent.propflow_ai",
  "context": {
    "property_id": "PROP-123",
    "investment_horizon": "5_years",
    "financing_type": "cash"
  },
  "response": {
    "investment_score": 78,
    "grade": "B+",
    "metrics": {
      "cap_rate": 6.2,
      "cash_on_cash_return": 8.5,
      "co_c_return_5yr": 45.2,
      "appreciation_forecast_5yr": 28.0
    },
    "pros": [
      "Strong rental demand in area",
      "Below-market purchase price",
      "Positive area appreciation trend"
    ],
    "cons": [
      "Higher than average property taxes",
      "HOA fees reduce cash flow"
    ],
    "recommendation": "Buy - Good investment opportunity with solid returns"
  }
}

# Example: Buyer matching
{
  "query": "Find properties matching this buyer's criteria",
  "agent": "agent.buyer_intelligence",
  "context": {
    "buyer_id": "BUY-123",
    "limit": 5
  },
  "response": {
    "matches": [
      {
        "property_id": "PROP-456",
        "match_score": 94,
        "match_reasons": [
          "Matches budget (within 5%)",
          "In preferred neighborhood",
          "Has all required bedrooms",
          "Within commute radius"
        ],
        "differences": [
          "Slightly over on sqft requirement"
        ]
      }
    ],
    "total_matches": 12,
    "new_listings_flagged": 3
  }
}
```

---

## Economic Integration

### Payment Flows

| Flow | Description | Integration |
|------|-------------|-------------|
| Commission Processing | Agent commission | Broker Network → TwinOS → Agent |
| Referral Rewards | Referral payouts | Referrals & Rewards → TwinOS → Payout |
| Earnest Money | Deposit handling | Lead Management → TwinOS → Escrow |
| Closing Costs | Cost distribution | Deal Management → TwinOS → Title |

**API Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/commissions/calculate` | Calculate commission |
| POST | `/api/v1/commissions/distribute` | Distribute commission |
| POST | `/api/v1/rewards/payout` | Process reward payout |
| GET | `/api/v1/deals/{deal_id}/financials` | Get deal financials |

### Rewards Integration

| Program | Points Source | Redemption |
|---------|--------------|------------|
| Referral Rewards | Successful referrals | Cash rewards, commission boost |
| Agent Rewards | Transaction volume | Bonus commissions, recognition |
| Buyer Rewards | Property purchase | Closing cost credits, moving services |

**Commission Structure:**
```json
{
  "default_split": {
    "broker": 30,
    "agent": 70
  },
  "referral_fees": {
    "incoming_referral": "percentage_of_commission",
    "outgoing_referral": "percentage_of_commission"
  },
  "volume_bonuses": {
    "tier_1": { "volume_threshold": 500000, "bonus_percentage": 2 },
    "tier_2": { "volume_threshold": 1000000, "bonus_percentage": 5 },
    "tier_3": { "volume_threshold": 2000000, "bonus_percentage": 10 }
  }
}
```

---

## Implementation Roadmap

### Week 1: Foundation

**Objective:** Set up TwinOS infrastructure and core real estate twins

| Task | Description | Owner | Deliverable |
|------|-------------|-------|-------------|
| 1.1 | Configure TwinOS tenant | DevOps | TwinOS tenant provisioned |
| 1.2 | Define twin schemas | Data Eng | JSON schemas for all 6 twins |
| 1.3 | Set up Property Marketplace API | Backend | Marketplace API live |
| 1.4 | Configure OAuth + JWT | Security | Auth configured |
| 1.5 | Create test environment | DevOps | Isolated test environment |
| 1.6 | Document API contracts | API Team | OpenAPI specs |
| 1.7 | Set up WebSocket server | DevOps | Real-time updates |
| 1.8 | Create twin provisioning scripts | Data Eng | Automated provisioning |

**Acceptance Criteria:**
- TwinOS tenant accessible
- All twin schemas validated
- Property Marketplace API responding
- Auth tokens working

### Week 2: Property & Area Twins

**Objective:** Implement Property Twin and Area Twin

| Task | Description | Owner | Deliverable |
|------|-------------|-------|-------------|
| 2.1 | Implement Property Twin CRUD | Backend | Property Twin API |
| 2.2 | Implement Area Twin CRUD | Backend | Area Twin API |
| 2.3 | Build market analytics pipeline | Data Eng | Market data sync |
| 2.4 | Create Property Marketplace integration | Backend | Marketplace ↔ TwinOS |
| 2.5 | Build virtual tours integration | Backend | Tours ↔ TwinOS |
| 2.6 | Implement propflow_score calculation | ML Team | Scoring engine |
| 2.7 | Create WebSocket connections | Backend | Real-time streaming |
| 2.8 | Build test scenarios | QA | Integration tests |

**Acceptance Criteria:**
- Property Twin complete
- Area Twin complete
- Market analytics flowing
- Real-time updates working

### Week 3: Agent & Buyer Twins

**Objective:** Implement Agent Twin and Buyer Twin

| Task | Description | Owner | Deliverable |
|------|-------------|-------|-------------|
| 3.1 | Implement Agent Twin CRUD | Backend | Agent Twin API |
| 3.2 | Implement Buyer Twin CRUD | Backend | Buyer Twin API |
| 3.3 | Build lead management integration | Backend | Lead Mgmt ↔ TwinOS |
| 3.4 | Create Broker Network integration | Backend | Broker Network ↔ TwinOS |
| 3.5 | Deploy agent_intelligence agent | ML Team | Agent operational |
| 3.6 | Deploy buyer_intelligence agent | ML Team | Agent operational |
| 3.7 | Build search matching engine | ML Team | Matching working |
| 3.8 | Create agent lead routing | Backend | Intelligent routing |

**Acceptance Criteria:**
- Agent Twin operational
- Buyer Twin operational
- Lead routing working
- Search matching accurate

### Week 4: Deal & Referral Twins

**Objective:** Implement Deal Twin and Referral Twin

| Task | Description | Owner | Deliverable |
|------|-------------|-------|-------------|
| 4.1 | Implement Deal Twin CRUD | Backend | Deal Twin API |
| 4.2 | Implement Referral Twin CRUD | Backend | Referral Twin API |
| 4.3 | Build deal stage workflow | Backend | Stage transitions |
| 4.4 | Create investment analysis integration | Backend | Investment ↔ TwinOS |
| 4.5 | Implement Referrals & Rewards integration | Backend | Rewards ↔ TwinOS |
| 4.6 | Deploy deal_management agent | ML Team | Agent operational |
| 4.7 | Deploy referral_tracking agent | ML Team | Agent operational |
| 4.8 | Build commission calculation | Backend | Commission engine |

**Acceptance Criteria:**
- Deal Twin operational
- Referral Twin operational
- Stage workflow working
- Commission calculation accurate

### Week 5: PropFlow AI & Business Copilot

**Objective:** Connect PropFlow AI and enable queries

| Task | Description | Owner | Deliverable |
|------|-------------|-------|-------------|
| 5.1 | Implement PropFlow AI integration | ML Team | AI ↔ TwinOS |
| 5.2 | Build price prediction model | ML Team | Price estimates |
| 5.3 | Implement market analysis | ML Team | Market analytics |
| 5.4 | Deploy propflow_ai agent | ML Team | Agent operational |
| 5.5 | Implement property query handlers | NLP Team | Property queries |
| 5.6 | Implement buyer query handlers | NLP Team | Buyer queries |
| 5.7 | Implement market query handlers | NLP Team | Market queries |
| 5.8 | User acceptance testing | QA | UAT completed |

**Acceptance Criteria:**
- PropFlow AI operational
- All documented queries working
- Responses accurate
- UAT passed

### Week 6: Golden Visa & Go-Live

**Objective:** Connect Golden Visa and deploy to production

| Task | Description | Owner | Deliverable |
|------|-------------|-------|-------------|
| 6.1 | Implement Golden Visa integration | Backend | Golden Visa ↔ TwinOS |
| 6.2 | Build eligibility checking | Backend | Eligibility engine |
| 6.3 | Implement document tracking | Backend | Document workflow |
| 6.4 | End-to-end integration test | QA | Full flow testing |
| 6.5 | Performance testing | QA | Load testing |
| 6.6 | Security audit | Security | Penetration testing |
| 6.7 | Documentation | Tech Writing | All docs complete |
| 6.8 | Production deployment | DevOps | Go-live |

**Acceptance Criteria:**
- Golden Visa operational
- E2E tests passing
- Performance targets met
- Security audit clean
- Production deployed

---

## Appendix

### A. API Rate Limits

| Endpoint Category | Limit | Window |
|-------------------|-------|--------|
| Property Operations | 2000 | per minute |
| Agent Operations | 1000 | per minute |
| Buyer Operations | 1000 | per minute |
| Deal Operations | 500 | per minute |
| PropFlow AI | 200 | per minute |
| Business Copilot | 100 | per minute |
| WebSocket Connections | 500 | per tenant |

### B. Data Retention

| Data Type | Retention Period |
|-----------|-----------------|
| Property Listings | Until sold + 7 years |
| Agent Profiles | 7 years after last activity |
| Buyer Profiles | 7 years after last activity |
| Deal Records | 7 years after closing |
| Transaction Records | 7 years |
| Referral Records | 7 years |

### C. Security Requirements

- All API calls over TLS 1.3
- OAuth 2.0 with JWT
- Role-based access control
- PII encrypted at rest
- Audit logging for all data access
- MLS data handling compliance

### D. Error Codes

| Code | Description |
|------|-------------|
| `PROPERTY_NOT_FOUND` | Property does not exist |
| `AGENT_NOT_FOUND` | Agent does not exist |
| `BUYER_NOT_FOUND` | Buyer does not exist |
| `DEAL_NOT_FOUND` | Deal does not exist |
| `INVALID_STAGE_TRANSITION` | Invalid deal stage change |
| `PRE_APPROVAL_EXPIRED` | Pre-approval no longer valid |
| `PROPFLOW_UNAVAILABLE` | AI service unavailable |
| `AUTH_INVALID_TOKEN` | Invalid/expired token |

---

**Document Control:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-06-12 | RTMN Architecture Team | Initial specification |
