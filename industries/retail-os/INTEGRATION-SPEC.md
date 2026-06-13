# Retail OS Integration Specification

**Version:** 1.0.0  
**Last Updated:** 2026-06-12  
**Industry:** Retail

---

## Executive Summary

The Retail OS Integration Specification defines the technical architecture for connecting RTMN's retail products with TwinOS, enabling real-time digital twins of shoppers, stores, products, and baskets. The integration creates a unified data layer where REZ Loyalty serves as the primary data producer, feeding shopper data to TwinOS while Commerce Ads consumes insights for personalized advertising and retail media campaigns.

**Key Integration Point:** REZ Loyalty ↔ Commerce Ads  
**Data Flow Direction:** Bidirectional - Loyalty produces shopper data, Commerce Ads produces engagement data  
**Primary Protocol:** REST API with Kafka for high-throughput event streaming  
**Authentication:** OAuth 2.0 + API Keys for store systems

---

## Product Capability Matrix

### 1. REZ App

| Attribute | Value |
|-----------|-------|
| **Port** | `8743` |
| **Capabilities** | Mobile shopping, in-store mode, loyalty wallet, digital receipts, scan & go, store map |
| **Data Produced** | App sessions, in-store beacons, purchases, engagement events |
| **Data Needed** | Shopper Twin (profile), Store Twin (inventory), Product Twin (details) |

### 2. REZ-Mart

| Attribute | Value |
|-----------|-------|
| **Port** | `8744` |
| **Capabilities** | Grocery fulfillment, dark store operations, rapid delivery, pickup scheduling |
| **Data Produced** | Orders, fulfillment status, delivery metrics, inventory movements |
| **Data Needed** | Store Twin (inventory), Product Twin (availability), Shopper Twin (address) |

### 3. REZ POS

| Attribute | Value |
|-----------|-------|
| **Port** | `8745` |
| **Capabilities** | Point of sale, self-checkout, contactless payment, returns processing, layaway |
| **Data Produced** | Transactions, tenders, returns, employee performance |
| **Data Needed** | Product Twin (pricing), Store Twin (register config), Shopper Twin (loyalty) |

### 4. REZ Inventory

| Attribute | Value |
|-----------|-------|
| **Port** | `8746` |
| **Capabilities** | Stock tracking, reorder management, supplier integration, RFID support, cycle counts |
| **Data Produced** | Stock levels, movements, shrinkage data, reorder triggers |
| **Data Needed** | Product Twin (reorder points), Store Twin (capacity), Supplier Twin |

### 5. REZ Loyalty

| Attribute | Value |
|-----------|-------|
| **Port** | `8747` |
| **Capabilities** | Points accrual, tier management, birthday rewards, referral program, punch cards |
| **Data Produced** | Points transactions, tier changes, member activity, campaign responses |
| **Data Needed** | Shopper Twin (profile), Transaction Twin |
| **TwinOS Role** | PRIMARY PRODUCER - shopper data engine |

### 6. REZ Try

| Attribute | Value |
|-----------|-------|
| **Port** | `8748` |
| **Capabilities** | Virtual try-on, AR fitting, size recommendation, returns optimization |
| **Data Produced** | Try-on sessions, size data, return predictions, preference signals |
| **Data Needed** | Product Twin (size data), Shopper Twin (measurements) |

### 7. REZ Prive

| Attribute | Value |
|-----------|-------|
| **Port** | `8749` |
| **Capabilities** | Private shopping events, VIP access, exclusive products, concierge services |
| **Data Produced** | Event RSVPs, exclusive purchases, VIP engagement |
| **Data Needed** | Shopper Twin (VIP status), Product Twin (exclusive items) |

### 8. Commerce Ads

| Attribute | Value |
|-----------|-------|
| **Port** | `8750` |
| **Capabilities** | Sponsored products, display ads, search ads, retargeting, audience targeting |
| **Data Produced** | Ad impressions, clicks, conversions, bid data, audience segments |
| **Data Needed** | Shopper Twin (segments), Product Twin (catalog), Store Twin (location) |
| **TwinOS Role** | PRIMARY CONSUMER - advertising intelligence |

### 9. Retail Media

| Attribute | Value |
|-----------|-------|
| **Port** | `8751` |
| **Capabilities** | In-store digital signage, beacon marketing, loyalty-integrated displays, programmatic content |
| **Data Produced** | Impressions, dwell time, engagement metrics, content performance |
| **Data Needed** | Store Twin (layout), Shopper Twin (proximity), Product Twin (content) |

### 10. REZ Retail CRM

| Attribute | Value |
|-----------|-------|
| **Port** | `TBD` |
| **Company** | REZ Merchant |
| **Capabilities** | Customer profiles, RFM segmentation, campaign automation, purchase history, lifetime value |
| **Data Produced** | Customer segments, campaign results, purchase patterns, churn risk, LTV scores |
| **Data Needed** | Shopper Twin (profile), Transaction Twin (orders), REZ Loyalty (points) |
| **TwinOS Role** | CUSTOMER INTELLIGENCE - enriches Shopper Twin with behavioral data |
| **Key Features** | - RFM Analysis (Recency, Frequency, Monetary) |
| | - Customer lifecycle stages (New, Active, At-Risk, Churned) |
| | - Purchase pattern analysis |
| | - Campaign attribution tracking |
| | - Cross-channel customer view |
| **Capabilities** | In-store digital signage, shelf sensors, customer wait displays, beacon marketing |
| **Data Produced** | Dwell time, foot traffic, ad engagement, heat maps |
| **Data Needed** | Store Twin (layout), Shopper Twin (proximity), Product Twin (promotions) |

### 10. Distribution OS

| Attribute | Value |
|-----------|-------|
| **Port** | `8752` |
| **Capabilities** | Warehouse management, route optimization, returns processing, cross-docking |
| **Data Produced** | Shipments, delivery status, returns, inventory at DC |
| **Data Needed** | Product Twin, Store Twin, Shopper Twin (address) |

---

## Digital Twin Definitions

### Shopper Twin

**TwinOS Entity ID:** `twin.retail.shopper.{shopper_id}`

**Attributes:**
```json
{
  "shopper_id": "string (UUID)",
  "profile": {
    "name": "string",
    "email": "string",
    "phone": "string",
    "birthday": "ISO8601 date|null",
    "gender": "string|null",
    "join_date": "ISO8601 date"
  },
  "loyalty": {
    "member_id": "string",
    "tier": "basic|silver|gold|platinum|vip",
    "points_balance": "number",
    "lifetime_points": "number",
    "member_since": "ISO8601 date",
    "benefits": ["string"]
  },
  "preferences": {
    "categories": ["string (category_ids)"],
    "brands": ["string (brand_ids)"],
    "dietary": ["string"],
    "size_profile": {
      "clothing": "string",
      "shoes": "string",
      "ring": "string|null"
    },
    "price_range": {
      "min": "number",
      "max": "number"
    },
    "communication": {
      "preferred_channel": "email|sms|push|whatsapp",
      "opt_ins": ["string"]
    }
  },
  "behavior": {
    "avg_basket_size": "number",
    "avg_visit_frequency": "number (per month)",
    "preferred_store_id": "string|null",
    "preferred_shopping_times": ["string (HH:MM)"],
    "preferred_days": ["string"],
    "channel_preference": "in_store|online|omni",
    "last_visit": "ISO8601 datetime",
    "purchase_velocity": "number"
  },
  "engagement": {
    "app_installed": "boolean",
    "app_last_active": "ISO8601 datetime",
    "email_opens": "number (30 days)",
    "push_opt_in": "boolean",
    "avg_session_duration": "number (seconds)",
    "wishlist_items": ["string (product_ids)"]
  },
  "purchase_history": {
    "total_orders": "number",
    "total_spend": "number",
    "avg_order_value": "number",
    "categories": {
      "category_id": {
        "orders": "number",
        "spend": "number"
      }
    },
    "top_products": ["string (product_ids)"],
    "seasonal_patterns": ["string"]
  },
  "segments": {
    "lifecycle": "new|regular|at_risk|churned|休眠",
    "value_tier": "economical|middle|mass|premium",
    "interests": ["string"],
    "inferred": {
      "family_status": "string",
      "income_bracket": "string",
      "lifestyle": "string"
    }
  },
  "current_session": {
    "store_id": "string|null",
    "in_store": "boolean",
    "cart_items": ["string (product_ids)"],
    "session_started": "ISO8601 datetime|null"
  }
}
```

**Relationships:**
- `MEMBER_OF` → Loyalty Program
- `VISITS` → Store Twin (1:many)
- `ADDED_TO_CART` → Basket Twin
- `PURCHASED` → Product Twin (1:many)

**Managing Agent:** `agent.shopper_intelligence`

### Store Twin

**TwinOS Entity ID:** `twin.retail.store.{store_id}`

**Attributes:**
```json
{
  "store_id": "string (UUID)",
  "profile": {
    "name": "string",
    "format": "hypermarket|supermarket|convenience|boutique|outlet|dark_store",
    "address": {
      "line1": "string",
      "city": "string",
      "state": "string",
      "postal_code": "string",
      "country": "string",
      "coordinates": { "lat": "number", "lng": "number" }
    },
    "contact": {
      "phone": "string",
      "email": "string"
    }
  },
  "hours": {
    "regular": {
      "monday": { "open": "string (HH:MM)", "close": "string (HH:MM)" },
      "tuesday": { "open": "string (HH:MM)", "close": "string (HH:MM)" },
      "wednesday": { "open": "string (HH:MM)", "close": "string (HH:MM)" },
      "thursday": { "open": "string (HH:MM)", "close": "string (HH:MM)" },
      "friday": { "open": "string (HH:MM)", "close": "string (HH:MM)" },
      "saturday": { "open": "string (HH:MM)", "close": "string (HH:MM)" },
      "sunday": { "open": "string (HH:MM)", "close": "string (HH:MM)" }
    },
    "holidays": ["ISO8601 date"]
  },
  "inventory": {
    "total_skus": "number",
    "in_stock_rate": "number (percentage)",
    "low_stock_alerts": "number",
    "out_of_stock_rate": "number (percentage)"
  },
  "capacity": {
    "total_area_sqft": "number",
    "checkout_count": "number",
    "checkout_in_use": "number",
    "avg_wait_time_minutes": "number",
    "max_customers": "number",
    "current_customers": "number"
  },
  "staffing": {
    "total_staff": "number",
    "on_duty": "number",
    "scheduled_vs_needed": "number"
  },
  "performance": {
    "today_sales": "number",
    "week_sales": "number",
    "month_sales": "number",
    "transactions_today": "number",
    "avg_transaction": "number",
    "conversion_rate": "number (percentage)",
    "basket_abandonment_rate": "number (percentage)"
  },
  "features": {
    "self_checkout": "number",
    "curbside_pickup": "boolean",
    "delivery": "boolean",
    "click_and_collect": "boolean",
    "in_store_only": "boolean"
  },
  "marketing": {
    "active_promotions": ["string (promo_ids)"],
    "digital_signage_zones": "number",
    "beacon_count": "number"
  }
}
```

**Relationships:**
- `LOCATED_IN` → Area Twin
- `STOCKS` → Product Twin (1:many)
- `VISITED_BY` → Shopper Twin (1:many)
- `EMPLOYS` → Staff Twin

**Managing Agent:** `agent.store_operations`

### Product Twin

**TwinOS Entity ID:** `twin.retail.product.{product_id}`

**Attributes:**
```json
{
  "product_id": "string (UUID)",
  "catalog": {
    "name": "string",
    "description": "string",
    "brand": "string",
    "manufacturer": "string",
    "upc": "string",
    "sku": "string",
    "category": {
      "primary": "string",
      "secondary": "string",
      "breadcrumb": ["string"]
    },
    "tags": ["string"],
    "image_urls": ["string"],
    "video_url": "string|null"
  },
  "attributes": {
    "size": "string|null",
    "color": "string|null",
    "weight": "number|null",
    "dimensions": "object|null",
    "material": "string|null",
    "flavor": "string|null",
    "scent": "string|null"
  },
  "pricing": {
    "regular_price": "number",
    "sale_price": "number|null",
    "cost": "number",
    "margin": "number",
    "price_history": [
      {
        "price": "number",
        "effective_date": "ISO8601 date"
      }
    ]
  },
  "inventory": {
    "total_quantity": "number",
    "available_quantity": "number",
    "reserved_quantity": "number",
    "in_transit": "number",
    "safety_stock": "number",
    "reorder_point": "number",
    "lead_time_days": "number"
  },
  "availability": {
    "status": "in_stock|low_stock|out_of_stock|discontinued|coming_soon",
    "stores_available": ["string (store_ids)"],
    "online_available": "boolean",
    "ships_to": ["string (region_codes)"]
  },
  "performance": {
    "units_sold_today": "number",
    "units_sold_week": "number",
    "units_sold_month": "number",
    "revenue_today": "number",
    "revenue_week": "number",
    "revenue_month": "number",
    "return_rate": "number (percentage)",
    "search_rank": "number",
    "conversion_rate": "number (percentage)"
  },
  "marketing": {
    "sponsored": "boolean",
    "ad_bid": "number",
    "promotion_ids": ["string"],
    "featured": "boolean",
    "organic_rank": "number"
  },
  "attributes_for_ads": {
    "target_audience": ["string (segment_ids)"],
    "seasonal_tags": ["string"],
    "occasion_tags": ["string"]
  }
}
```

**Relationships:**
- `CATEGORIZED_AS` → Category Twin
- `STOCKED_AT` → Store Twin (1:many)
- `ADDED_TO` → Basket Twin (1:many)
- `PURCHASED_BY` → Shopper Twin (1:many)

**Managing Agent:** `agent.product_intelligence`

### Basket Twin

**TwinOS Entity ID:** `twin.retail.basket.{basket_id}`

**Attributes:**
```json
{
  "basket_id": "string (UUID)",
  "shopper_id": "string|null",
  "session_id": "string",
  "channel": "online|in_store|mobile_app",
  "store_id": "string|null",
  "created_at": "ISO8601 datetime",
  "updated_at": "ISO8601 datetime",
  "items": [
    {
      "product_id": "string",
      "quantity": "number",
      "unit_price": "number",
      "subtotal": "number",
      "added_at": "ISO8601 datetime"
    }
  ],
  "pricing": {
    "subtotal": "number",
    "tax": "number",
    "discounts": "number",
    "loyalty_discount": "number",
    "total": "number"
  },
  "status": {
    "current": "active|converted|abandoned|expired",
    "converted_at": "ISO8601 datetime|null",
    "abandoned_at": "ISO8601 datetime|null"
  },
  "context": {
    "promo_codes_applied": ["string"],
    "loyalty_points_used": "number",
    "delivery_requested": "boolean",
    "pickup_store_id": "string|null"
  },
  "recommendations": {
    "cross_sell": ["string (product_ids)"],
    "up_sell": ["string (product_ids)"],
    "frequently_bought_together": ["string (product_ids)"]
  }
}
```

**Relationships:**
- `BELONGS_TO` → Shopper Twin
- `CONTAINS` → Product Twin (1:many)
- `FULFILLED_AT` → Store Twin

**Managing Agent:** `agent.basket_intelligence`

---

## Integration Flows

### Flow 1: Shopper Journey

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   REZ App   │────▶│   TwinOS    │────▶│ REZ Loyalty │────▶│  Commerce   │
│  (Session)  │     │(Shopper Twin)│    │  (Points)   │     │    Ads      │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                           │                    │                    │
                           ▼                    ▼                    ▼
                    ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
                    │  REZ POS    │     │ REZ Try     │     │  Retail     │
                    │ (Purchase) │     │ (Try-on)    │     │   Media     │
                    └─────────────┘     └─────────────┘     └─────────────┘
```

**API Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/shoppers` | Create shopper |
| GET | `/api/v1/shoppers/{shopper_id}` | Get shopper |
| PATCH | `/api/v1/shoppers/{shopper_id}` | Update shopper |
| POST | `/api/v1/twins/shopper` | Create Shopper Twin |
| GET | `/api/v1/twins/shopper/{shopper_id}` | Get Shopper Twin |
| PATCH | `/api/v1/twins/shopper/{shopper_id}` | Update Shopper Twin |
| POST | `/api/v1/events/session` | Track session event |
| WS | `/ws/shopper/{shopper_id}/events` | Real-time shopper events |

### Flow 2: Loyalty to Ads Integration

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ REZ Loyalty │────▶│   TwinOS    │────▶│ Commerce Ads│────▶│  Retail     │
│  (Segment)  │     │(Shopper Twin)│     │  (Target)   │     │   Media     │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

**API Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/twins/shopper/{shopper_id}/segments` | Get shopper segments |
| POST | `/api/v1/ads/audiences` | Create audience segment |
| GET | `/api/v1/ads/audiences/{audience_id}` | Get audience |
| POST | `/api/v1/ads/campaigns` | Create campaign |
| GET | `/api/v1/ads/campaigns/{campaign_id}/performance` | Get campaign metrics |
| POST | `/api/v1/ads/targeting` | Get targeting recommendations |

**Request/Response Example:**

```json
// POST /api/v1/ads/audiences
{
  "name": "High-Value App Users",
  "description": "Platinum members who use the app daily",
  "criteria": {
    "loyalty_tier": ["platinum"],
    "app_usage": { "min_sessions_per_week": 5 },
    "spend": { "min_monthly": 500 }
  },
  "size_estimate": "number",
  "targeting": {
    "channels": ["mobile_push", "in_app", "email"],
    "bid_strategy": "cpm"
  }
}

// Response
{
  "audience_id": "AUD-2024-001234",
  "name": "High-Value App Users",
  "estimated_size": 15420,
  "estimated_reach": "number",
  "status": "active",
  "created_at": "ISO8601 datetime"
}
```

### Flow 3: Commerce Ads Targeting

```
┌─────────────┐     ┌─────────────┐     ���─────────────┐     ┌─────────────┐
│ Commerce Ads│────▶│   TwinOS    │────▶│ REZ Loyalty │────▶│   REZ App   │
│  (Impression)│    │(Shopper Twin)│    │  (Enrich)   │     │  (Deliver)  │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

**API Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/ads/impressions` | Log ad impression |
| POST | `/api/v1/ads/clicks` | Log ad click |
| POST | `/api/v1/ads/conversions` | Log conversion |
| GET | `/api/v1/ads/attribution/{campaign_id}` | Get attribution report |
| GET | `/api/v1/twins/shopper/{shopper_id}/ad_history` | Get shopper ad history |

---

## Agent Architecture

### Agent Registry

| Agent ID | Type | Responsibilities |
|----------|------|------------------|
| `agent.shopper_intelligence` | Analytics | Shopper profiling, segmentation, lifetime value |
| `agent.store_operations` | Operations | Store capacity, staffing, inventory allocation |
| `agent.product_intelligence` | Merchandising | Product recommendations, pricing, placement |
| `agent.basket_intelligence` | Commerce | Cart optimization, cross-sell, checkout flow |
| `agent.loyalty_engine` | CRM | Points, tiers, promotions, engagement |
| `agent.ad_targeting` | Advertising | Audience segmentation, bid optimization |
| `agent.inventory_replenishment` | Supply Chain | Reorder triggers, safety stock, forecasting |
| `agent.retail_media` | Marketing | In-store media, beacon marketing, signage |
| `agent.fulfillment` | Operations | Order fulfillment, delivery, pickup |
| `agent.twin_orchestrator` | TwinOS Core | Twin CRUD, relationship management |

### Agent Communication Patterns

**Pub/Sub Topics:**
- `retail.shopper.session` - Shopper session events
- `retail.shopper.purchase` - Purchase events
- `retail.basket.created` - New basket events
- `retail.basket.converted` - Purchase completion
- `retail.basket.abandoned` - Cart abandonment
- `retail.inventory.low` - Low stock alerts
- `retail.inventory.out` - Out of stock alerts
- `retail.ad.impression` - Ad impression events
- `retail.ad.click` - Ad click events
- `retail.ad.conversion` - Conversion events

**Event Schema:**
```json
{
  "event_type": "string",
  "shopper_id": "string",
  "timestamp": "ISO8601 datetime",
  "channel": "online|in_store|mobile_app",
  "store_id": "string|null",
  "data": {
    "product_ids": ["string"],
    "value": "number",
    "metadata": {}
  }
}
```

---

## Business Copilot Queries Supported

### Shopper Queries

| Query | Description | Example |
|-------|-------------|---------|
| `shopper_profile` | Get shopper summary | "Summarize this shopper's profile" |
| `purchase_history` | View purchase history | "What has this shopper bought recently?" |
| `preferences` | Get preferences | "What are this shopper's category preferences?" |
| `lifetime_value` | Calculate CLV | "What's this shopper's lifetime value?" |
| `churn_risk` | Assess churn | "Is this shopper at risk of churning?" |

### Inventory Queries

| Query | Description | Example |
|-------|-------------|---------|
| `stock_level` | Check inventory | "How many of SKU-1234 do we have?" |
| `low_stock_alerts` | Get alerts | "Which products are low on stock?" |
| `reorder_recommendations` | Suggest reorders | "What should we reorder this week?" |
| `product_availability` | Check availability | "Is this product available in Store 5?" |
| `inventory_forecast` | Predict needs | "How much inventory will we need next week?" |

### Marketing Queries

| Query | Description | Example |
|-------|-------------|---------|
| `audience_size` | Estimate audience | "How big is our platinum member segment?" |
| `campaign_performance` | Get metrics | "How is our summer sale campaign performing?" |
| `ad_recommendations` | Get ad suggestions | "What products should we advertise to this shopper?" |
| `promotion_effectiveness` | Measure promo | "How effective was last week's promotion?" |
| `attribution` | Track attribution | "Which ads led to this purchase?" |

### Store Operations Queries

| Query | Description | Example |
|-------|-------------|---------|
| `store_performance` | Get metrics | "What's Store 12's performance today?" |
| `staffing_needs` | Assess staffing | "Does Store 12 need more staff?" |
| `wait_times` | Check wait | "What's the checkout wait at Store 12?" |
| `conversion_rate` | Get rate | "What's the conversion rate at Store 12?" |
| `peak_hours` | Traffic patterns | "When are Store 12's busiest hours?" |

### Example Copilot Interactions

```python
# Example: Personalized ad recommendation
{
  "query": "What products should we advertise to this shopper?",
  "agent": "agent.ad_targeting",
  "context": {
    "shopper_id": "SHP-123",
    "channel": "mobile_push",
    "context": "returning_shopper"
  },
  "response": {
    "recommendations": [
      {
        "product_id": "PRD-456",
        "product_name": "Premium Running Shoes",
        "reason": "Matches their active lifestyle interest and past running shoe purchases",
        "bid_amount": 2.50,
        "expected_ctr": 0.045,
        "expected_roi": 3.2
      }
    ],
    "audience_match_score": 0.89
  }
}

# Example: Churn risk assessment
{
  "query": "Is shopper SHP-123 at risk of churning?",
  "agent": "agent.shopper_intelligence",
  "response": {
    "churn_risk": "medium",
    "risk_score": 0.45,
    "factors": [
      {
        "factor": "declining_visit_frequency",
        "impact": "high",
        "description": "Visits dropped from 4/month to 1/month over last 3 months"
      },
      {
        "factor": "abandoned_carts",
        "impact": "medium",
        "description": "3 abandoned carts in last 30 days"
      }
    ],
    "recommended_actions": [
      {
        "action": "win_back_offer",
        "description": "Send 20% off coupon via push notification",
        "expected_impact": "35% chance of reactivation"
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
| POS Transaction | In-store purchase | REZ POS → TwinOS → RCM |
| Online Checkout | E-commerce purchase | REZ App → TwinOS → Payment Gateway |
| Buy Online Pickup In Store | BOPIS | REZ App → TwinOS → Store |
| Contactless Payment | NFC payments | REZ POS → Payment Gateway → TwinOS |

**API Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/transactions` | Process transaction |
| POST | `/api/v1/transactions/{transaction_id}/refund` | Process refund |
| GET | `/api/v1/transactions/{transaction_id}` | Get transaction |
| POST | `/api/v1/payments/charge` | Process payment |

### Rewards Integration

| Program | Points Source | Redemption |
|---------|--------------|------------|
| REZ Loyalty | All purchases | Discounts, free products, experiences |
| Birthday Rewards | Birthday month | Free item, percentage off |
| Referral Program | Successful referrals | Account credit, bonus points |
| Tier Benefits | Tier status | Free shipping, early access, exclusive sales |

**Points Calculation:**
```json
{
  "base_points_per_dollar": 1.0,
  "tier_multipliers": {
    "basic": 1.0,
    "silver": 1.25,
    "gold": 1.5,
    "platinum": 2.0,
    "vip": 3.0
  },
  "bonus_categories": {
    "in_store": 1.0,
    "app_purchase": 1.5,
    "own_brand": 2.0,
    "promotional": 3.0
  },
  "redemption_rate": {
    "points_per_dollar": 100,
    "dollar_value": 1.00
  }
}
```

### Retail Media Economics

| Revenue Stream | Description |
|---------------|-------------|
| Sponsored Products | Brands pay for product visibility |
| Display Ads | Banner ads on digital properties |
| In-Store Media | Digital signage, shelf advertising |
| Data Monetization | Anonymized audience insights |

---

## Implementation Roadmap

### Week 1: Foundation

**Objective:** Set up TwinOS infrastructure and core retail twins

| Task | Description | Owner | Deliverable |
|------|-------------|-------|-------------|
| 1.1 | Configure TwinOS tenant | DevOps | TwinOS tenant provisioned |
| 1.2 | Define twin schemas | Data Eng | JSON schemas for all 4 twins |
| 1.3 | Set up REZ POS API | Backend | POS API endpoints live |
| 1.4 | Configure OAuth + API Keys | Security | Auth configured |
| 1.5 | Create test environment | DevOps | Isolated test environment |
| 1.6 | Document API contracts | API Team | OpenAPI specs |
| 1.7 | Set up Kafka cluster | DevOps | Event streaming |
| 1.8 | Create twin provisioning scripts | Data Eng | Automated provisioning |

**Acceptance Criteria:**
- TwinOS tenant accessible
- All twin schemas validated
- REZ POS API responding
- Kafka events flowing

### Week 2: Shopper & Product Twins

**Objective:** Implement Shopper Twin and Product Twin

| Task | Description | Owner | Deliverable |
|------|-------------|-------|-------------|
| 2.1 | Implement Shopper Twin CRUD | Backend | Shopper Twin API |
| 2.2 | Implement Product Twin CRUD | Backend | Product Twin API |
| 2.3 | Build preference learning | ML Team | Preference engine |
| 2.4 | Create REZ App integration | Backend | App ↔ TwinOS |
| 2.5 | Build inventory sync | Backend | Inventory ↔ TwinOS |
| 2.6 | Implement REZ Try integration | Backend | Try-on ↔ TwinOS |
| 2.7 | Create WebSocket connections | Backend | Real-time streaming |
| 2.8 | Build test scenarios | QA | Integration tests |

**Acceptance Criteria:**
- Shopper Twin updated on each interaction
- Product Twin reflects inventory
- Preferences learning over time
- Real-time updates working

### Week 3: Store & Basket Twins

**Objective:** Implement Store Twin and Basket Twin

| Task | Description | Owner | Deliverable |
|------|-------------|-------|-------------|
| 3.1 | Implement Store Twin CRUD | Backend | Store Twin API |
| 3.2 | Implement Basket Twin CRUD | Backend | Basket Twin API |
| 3.3 | Build basket abandonment tracking | Backend | Abandonment detection |
| 3.4 | Implement retail media integration | Backend | Media ↔ TwinOS |
| 3.5 | Deploy store_operations agent | ML Team | Agent operational |
| 3.6 | Deploy basket_intelligence agent | ML Team | Agent operational |
| 3.7 | Build capacity management | Backend | Real-time capacity |
| 3.8 | Create pub/sub topics | Data Eng | Topic infrastructure |

**Acceptance Criteria:**
- Store Twin operational
- Basket Twin tracking
- Abandonment detection working
- Agents responding

### Week 4: Loyalty & Ads Integration

**Objective:** Connect REZ Loyalty and Commerce Ads

| Task | Description | Owner | Deliverable |
|------|-------------|-------|-------------|
| 4.1 | Implement REZ Loyalty integration | Backend | Loyalty ↔ TwinOS |
| 4.2 | Build segmentation engine | ML Team | Segmentation working |
| 4.3 | Implement Commerce Ads integration | Backend | Ads ↔ TwinOS |
| 4.4 | Build audience creation | Backend | Audience API |
| 4.5 | Implement ad targeting | ML Team | Targeting engine |
| 4.6 | Deploy ad_targeting agent | ML Team | Agent operational |
| 4.7 | Build attribution tracking | Backend | Attribution model |
| 4.8 | Create ad event pipeline | Data Eng | Impression/click/convert |

**Acceptance Criteria:**
- Loyalty segments flowing to Ads
- Audience creation working
- Ad targeting operational
- Attribution tracking active

### Week 5: Business Copilot

**Objective:** Enable natural language queries

| Task | Description | Owner | Deliverable |
|------|-------------|-------|-------------|
| 5.1 | Implement shopper query handlers | NLP Team | Shopper queries |
| 5.2 | Implement inventory query handlers | NLP Team | Inventory queries |
| 5.3 | Implement marketing query handlers | NLP Team | Marketing queries |
| 5.4 | Implement operations query handlers | NLP Team | Operations queries |
| 5.5 | Build query routing | Backend | Intelligent routing |
| 5.6 | Create response templates | Product | Response formats |
| 5.7 | Build copilot UI | Frontend | Query interface |
| 5.8 | User acceptance testing | QA | UAT completed |

**Acceptance Criteria:**
- All documented queries working
- Responses accurate
- UI functional
- UAT passed

### Week 6: REZ-Mart & Go-Live

**Objective:** Connect REZ-Mart and deploy to production

| Task | Description | Owner | Deliverable |
|------|-------------|-------|-------------|
| 6.1 | Implement REZ-Mart integration | Backend | Fulfillment ↔ TwinOS |
| 6.2 | Build Distribution OS integration | Backend | Distribution ↔ TwinOS |
| 6.3 | Implement REZ Prive integration | Backend | VIP ↔ TwinOS |
| 6.4 | End-to-end integration test | QA | Full flow testing |
| 6.5 | Performance testing | QA | Load testing |
| 6.6 | Security audit | Security | Penetration testing |
| 6.7 | Documentation | Tech Writing | All docs complete |
| 6.8 | Production deployment | DevOps | Go-live |

**Acceptance Criteria:**
- REZ-Mart operational
- Distribution OS integrated
- E2E tests passing
- Performance targets met
- Security audit clean
- Production deployed

---

## Appendix

### A. API Rate Limits

| Endpoint Category | Limit | Window |
|-------------------|-------|--------|
| Shopper Operations | 5000 | per minute |
| Product Operations | 10000 | per minute |
| Transaction Processing | 10000 | per minute |
| Ad Operations | 5000 | per minute |
| Business Copilot | 200 | per minute |
| WebSocket Connections | 2000 | per tenant |

### B. Data Retention

| Data Type | Retention Period |
|-----------|-----------------|
| Shopper Profiles | Lifetime (with consent) |
| Purchase History | 7 years |
| Transaction Records | 7 years |
| Ad Event Data | 2 years |
| Session Data | 90 days |
| Inventory Data | 3 years |

### C. Security Requirements

- All API calls over TLS 1.3
- OAuth 2.0 for user authentication
- API Keys for store systems
- PII encrypted at rest (AES-256)
- PCI-DSS compliant payment handling
- Audit logging for all data access

### D. Error Codes

| Code | Description |
|------|-------------|
| `SHOPPER_NOT_FOUND` | Shopper does not exist |
| `PRODUCT_NOT_FOUND` | Product does not exist |
| `INSUFFICIENT_INVENTORY` | Not enough stock |
| `LOYALTY_ENROLLMENT_FAILED` | Cannot enroll |
| `AD_TARGETING_FAILED` | Cannot target |
| `BASKET_EXPIRED` | Cart expired |
| `AUTH_INVALID_TOKEN` | Invalid/expired token |
| `RATE_LIMIT_EXCEEDED` | API rate limit hit |

---

**Document Control:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-06-12 | RTMN Architecture Team | Initial specification |
