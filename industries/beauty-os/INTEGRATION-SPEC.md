# Beauty OS Integration Specification

## Version 1.0 | June 2026

---

## 1. Executive Summary

This document defines the integration architecture for the Beauty OS vertical, connecting salon operations, client management, and retail through a unified TwinOS framework. The system enables beauty businesses to deliver personalized client experiences by correlating Client Beauty Twins, Stylist Twins, Salon Twins, Product Twins, and Appointment Twins.

**Core Value Proposition**: Transform fragmented beauty operations into an intelligent, interconnected ecosystem where client preferences automatically inform stylist matching, product recommendations are based on hair/skin analysis, and appointment scheduling optimizes salon resources.

**Key Integration Point**: REZ POS serves as the primary transaction hub, feeding client purchase and service history into TwinOS where Client Beauty Twin data drives personalized recommendations and service optimization.

---

## 2. Product Capability Matrix

| Product | Port | Core Function | Data Inputs | Data Outputs |
|---------|------|---------------|-------------|--------------|
| REZ POS | 3100 | Point of sale, transactions, billing | Sales, services, payments | Transaction records, revenue analytics |
| REZ Inventory | 3400 | Inventory management, product tracking | Stock levels, orders | Reorder alerts, product availability |
| REZ Loyalty | 3200 | Points management, rewards, membership | Transaction data, engagement | Points balance, rewards, tier status |
| REZ QR Cloud | 3500 | QR code generation, mobile payments | Payment requests, promotions | Payment confirmations, analytics |
| MyRisa | 4300 | Beauty and wellness tracking | Client beauty data | Beauty insights, recommendations |
| REZ Salon CRM | 4004 | Client management, campaigns, segmentation | Client profiles, visits, campaigns | Segments, churn risk, LTV scores |
| TwinOS | 4142 | Digital twin orchestration, relationship mapping | All product outputs | Twin states, relationship graphs |

---

## 3. Twin JSON Schemas

### 3.1 Client Beauty Twin (4142-CB1)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "title": "Client Beauty Twin",
  "description": "Represents a beauty client with preferences and history",
  "twinId": "4142-CB1",
  "version": "1.0",
  "attributes": {
    "clientId": { "type": "string", "format": "uuid" },
    "fullName": { "type": "string" },
    "email": { "type": "string", "format": "email" },
    "phone": { "type": "string" },
    "dateOfBirth": { "type": "string", "format": "date" },
    "clientSince": { "type": "string", "format": "date" },
    "clientStatus": { "type": "enum", "enum": ["Active", "Inactive", "VIP", "New"] },
    "preferences": {
      "type": "object",
      "properties": {
        "preferredStylist": { "type": "string" },
        "preferredServices": { "type": "array", "items": { "type": "string" } },
        "preferredProducts": { "type": "array", "items": { "type": "string" } },
        "appointmentReminder": { "type": "boolean" },
        "communicationPreference": { "type": "enum", "enum": ["SMS", "Email", "App", "None"] },
        "scentPreferences": { "type": "array", "items": { "type": "string" } },
        "musicPreference": { "type": "string" }
      }
    },
    "beautyProfile": {
      "type": "object",
      "properties": {
        "hairType": { "type": "string" },
        "hairCondition": { "type": "string" },
        "scalpCondition": { "type": "string" },
        "skinType": { "type": "string" },
        "allergies": { "type": "array", "items": { "type": "string" } },
        "sensitivityNotes": { "type": "string" }
      }
    },
    "serviceHistory": {
      "type": "object",
      "properties": {
        "totalVisits": { "type": "integer" },
        "lastVisit": { "type": "string", "format": "date" },
        "favoriteServices": { "type": "array" },
        "avgSpendPerVisit": { "type": "number" },
        "totalSpend": { "type": "number" }
      }
    },
    "purchaseHistory": {
      "type": "object",
      "properties": {
        "productsPurchased": { "type": "array" },
        "favoriteProducts": { "type": "array" },
        "avgProductSpend": { "type": "number" }
      }
    },
    "loyaltyInfo": {
      "type": "object",
      "properties": {
        "pointsBalance": { "type": "integer" },
        "tier": { "type": "enum", "enum": ["Bronze", "Silver", "Gold", "Platinum"] },
        "pointsEarnedLifetime": { "type": "integer" },
        "pointsRedeemedLifetime": { "type": "integer" }
      }
    },
    "feedback": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "date": { "type": "string", "format": "date" },
          "rating": { "type": "number" },
          "service": { "type": "string" },
          "stylist": { "type": "string" },
          "comment": { "type": "string" }
        }
      }
    }
  },
  "relationships": {
    "BOOKS": {
      "type": "array",
      "items": { "$ref": "#/definitions/AppointmentTwin" }
    },
    "RECEIVES_SERVICE_FROM": {
      "type": "array",
      "items": { "$ref": "#/definitions/StylistTwin" }
    },
    "VISITS": {
      "type": "array",
      "items": { "$ref": "#/definitions/SalonTwin" }
    },
    "PURCHASES": {
      "type": "array",
      "items": { "$ref": "#/definitions/ProductTwin" }
    }
  },
  "managingAgent": "Beauty Advisor Agent",
  "dataSources": ["REZ POS", "REZ Loyalty", "REZ QR Cloud", "Booking System"],
  "updateTriggers": ["Service completed", "Product purchased", "Feedback submitted", "Preferences updated"]
}
```

### 3.2 Stylist Twin (4142-ST1)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "title": "Stylist Twin",
  "description": "Represents a beauty stylist with expertise and availability",
  "twinId": "4142-ST1",
  "version": "1.0",
  "attributes": {
    "stylistId": { "type": "string", "format": "uuid" },
    "fullName": { "type": "string" },
    "email": { "type": "string", "format": "email" },
    "phone": { "type": "string" },
    "employeeId": { "type": "string" },
    "title": { "type": "string" },
    "specializations": {
      "type": "array",
      "items": { "type": "string" }
    },
    "certifications": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "issuingBody": { "type": "string" },
          "expirationDate": { "type": "string", "format": "date" }
        }
      }
    },
    "experience": {
      "type": "object",
      "properties": {
        "yearsActive": { "type": "integer" },
        "clientsServed": { "type": "integer" },
        "servicesPerformed": { "type": "integer" }
      }
    },
    "availability": {
      "type": "object",
      "properties": {
        "schedule": { "type": "object" },
        "currentWeekHours": { "type": "number" },
        "maxWeekHours": { "type": "integer" },
        "timeOff": { "type": "array" }
      }
    },
    "performanceMetrics": {
      "type": "object",
      "properties": {
        "avgRating": { "type": "number" },
        "totalReviews": { "type": "integer" },
        "rebookingRate": { "type": "number" },
        "serviceRevenue": { "type": "number" },
        "productRevenue": { "type": "number" },
        "clientRetention": { "type": "number" }
      }
    },
    "preferredProducts": {
      "type": "array",
      "items": { "type": "string" }
    },
    "pricing": {
      "type": "object",
      "properties": {
        "hourlyRate": { "type": "number" },
        "serviceRates": { "type": "object" },
        "currency": { "type": "string", "default": "USD" }
      }
    }
  },
  "relationships": {
    "SERVICES": {
      "type": "array",
      "items": { "$ref": "#/definitions/ClientBeautyTwin" }
    },
    "WORKS_AT": { "$ref": "#/definitions/SalonTwin" },
    "PERFORMS": {
      "type": "array",
      "items": { "$ref": "#/definitions/AppointmentTwin" }
    },
    "RECOMMENDS": {
      "type": "array",
      "items": { "$ref": "#/definitions/ProductTwin" }
    }
  },
  "managingAgent": "Stylist Match Agent",
  "dataSources": ["HR System", "REZ POS", "Booking System"],
  "updateTriggers": ["Service completed", "New client assigned", "Schedule changed", "Certification updated"]
}
```

### 3.3 Salon Twin (4142-SA1)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "title": "Salon Twin",
  "description": "Represents a beauty salon with resources and capacity",
  "twinId": "4142-SA1",
  "version": "1.0",
  "attributes": {
    "salonId": { "type": "string", "format": "uuid" },
    "salonName": { "type": "string" },
    "brand": { "type": "string" },
    "address": {
      "type": "object",
      "properties": {
        "street": { "type": "string" },
        "city": { "type": "string" },
        "state": { "type": "string" },
        "zipCode": { "type": "string" },
        "country": { "type": "string" }
      }
    },
    "location": {
      "type": "object",
      "properties": {
        "latitude": { "type": "number" },
        "longitude": { "type": "number" }
      }
    },
    "salonType": { "type": "enum", "enum": ["Hair", "Nails", "Spa", "MedSpa", "Full Service", "Barbershop"] },
    "operatingHours": {
      "type": "object",
      "properties": {
        "monday": { "type": "object" },
        "tuesday": { "type": "object" },
        "wednesday": { "type": "object" },
        "thursday": { "type": "object" },
        "friday": { "type": "object" },
        "saturday": { "type": "object" },
        "sunday": { "type": "object" }
      }
    },
    "stations": {
      "type": "object",
      "properties": {
        "total": { "type": "integer" },
        "available": { "type": "integer" },
        "inUse": { "type": "integer" }
      }
    },
    "services": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "serviceId": { "type": "string" },
          "name": { "type": "string" },
          "duration": { "type": "integer" },
          "price": { "type": "number" },
          "category": { "type": "string" }
        }
      }
    },
    "staff": {
      "type": "object",
      "properties": {
        "stylists": { "type": "integer" },
        "receptionists": { "type": "integer" },
        "managers": { "type": "integer" }
      }
    },
    "amenities": {
      "type": "array",
      "items": { "type": "string" }
    },
    "capacity": {
      "type": "object",
      "properties": {
        "maxDailyAppointments": { "type": "integer" },
        "currentDailyAppointments": { "type": "integer" },
        "peakHourOccupancy": { "type": "integer" }
      }
    },
    "performanceMetrics": {
      "type": "object",
      "properties": {
        "dailyRevenue": { "type": "number" },
        "monthlyRevenue": { "type": "number" },
        "avgDailyClients": { "type": "number" },
        "clientRetention": { "type": "number" },
        "avgServiceRating": { "type": "number" }
      }
    }
  },
  "relationships": {
    "EMPLOYS": {
      "type": "array",
      "items": { "$ref": "#/definitions/StylistTwin" }
    },
    "WELCOMES": {
      "type": "array",
      "items": { "$ref": "#/definitions/ClientBeautyTwin" }
    },
    "HOSTS": {
      "type": "array",
      "items": { "$ref": "#/definitions/AppointmentTwin" }
    },
    "STOCKS": {
      "type": "array",
      "items": { "$ref": "#/definitions/ProductTwin" }
    }
  },
  "managingAgent": "Booking Agent",
  "dataSources": ["REZ POS", "REZ Inventory", "Booking System"],
  "updateTriggers": ["Appointment booked", "Client check-in", "Station status change", "Revenue recorded"]
}
```

### 3.4 Product Twin (4142-P1)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "title": "Product Twin",
  "description": "Represents a beauty product with inventory and recommendation data",
  "twinId": "4142-P1",
  "version": "1.0",
  "attributes": {
    "productId": { "type": "string", "format": "uuid" },
    "sku": { "type": "string" },
    "name": { "type": "string" },
    "brand": { "type": "string" },
    "category": {
      "type": "enum",
      "enum": ["Hair Care", "Skincare", "Makeup", "Nail Care", "Fragrance", "Tools", "Accessories", "Wellness"],
      "description": "Product category"
    },
    "subcategory": { "type": "string" },
    "description": { "type": "string" },
    "price": { "type": "number" },
    "cost": { "type": "number" },
    "margin": { "type": "number" },
    "inventory": {
      "type": "object",
      "properties": {
        "quantity": { "type": "integer" },
        "reorderLevel": { "type": "integer" },
        "reorderQuantity": { "type": "integer" },
        "warehouseLocation": { "type": "string" }
      }
    },
    "attributes": {
      "type": "object",
      "properties": {
        "hairTypes": { "type": "array", "items": { "type": "string" } },
        "skinTypes": { "type": "array", "items": { "type": "string" } },
        "concerns": { "type": "array", "items": { "type": "string" } },
        "ingredients": { "type": "array", "items": { "type": "string" } },
        "scent": { "type": "string" },
        "organic": { "type": "boolean" },
        "vegan": { "type": "boolean" },
        "crueltyFree": { "type": "boolean" }
      }
    },
    "compatibility": {
      "type": "array",
      "items": { "type": "string" }
    },
    "salesMetrics": {
      "type": "object",
      "properties": {
        "unitsSold": { "type": "integer" },
        "revenue": { "type": "number" },
        "avgRating": { "type": "number" },
        "returnRate": { "type": "number" }
      }
    },
    "recommendationScore": { "type": "number", "minimum": 0, "maximum": 100 }
  },
  "relationships": {
    "SOLD_AT": {
      "type": "array",
      "items": { "$ref": "#/definitions/SalonTwin" }
    },
    "PURCHASED_BY": {
      "type": "array",
      "items": { "$ref": "#/definitions/ClientBeautyTwin" }
    },
    "RECOMMENDED_BY": {
      "type": "array",
      "items": { "$ref": "#/definitions/StylistTwin" }
    }
  },
  "managingAgent": "Product Recommender Agent",
  "dataSources": ["REZ Inventory", "REZ POS", "Product Database"],
  "updateTriggers": ["Sale recorded", "Inventory updated", "New product added", "Review submitted"]
}
```

### 3.5 Appointment Twin (4142-AP1)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "title": "Appointment Twin",
  "description": "Represents a beauty service appointment with scheduling data",
  "twinId": "4142-AP1",
  "version": "1.0",
  "attributes": {
    "appointmentId": { "type": "string", "format": "uuid" },
    "bookingReference": { "type": "string" },
    "scheduledDate": { "type": "string", "format": "date" },
    "scheduledTime": { "type": "string", "format": "time" },
    "duration": { "type": "integer", "unit": "minutes" },
    "status": { "type": "enum", "enum": ["Scheduled", "Confirmed", "Checked In", "In Progress", "Completed", "Cancelled", "No Show"] },
    "serviceType": { "type": "string" },
    "services": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "serviceId": { "type": "string" },
          "name": { "type": "string" },
          "price": { "type": "number" },
          "duration": { "type": "integer" }
        }
      }
    },
    "totalPrice": { "type": "number" },
    "depositPaid": { "type": "boolean" },
    "notes": { "type": "string" },
    "checkInTime": { "type": "string", "format": "date-time" },
    "startTime": { "type": "string", "format": "date-time" },
    "endTime": { "type": "string", "format": "date-time" },
    "actualDuration": { "type": "integer" },
    "feedback": {
      "type": "object",
      "properties": {
        "rating": { "type": "number" },
        "comment": { "type": "string" },
        "wouldReturn": { "type": "boolean" }
      }
    },
    "addOnServices": {
      "type": "array",
      "items": { "type": "string" }
    },
    "reminderSent": { "type": "boolean" },
    "cancellationReason": { "type": "string" }
  },
  "relationships": {
    "BOOKED_BY": { "$ref": "#/definitions/ClientBeautyTwin" },
    "WITH_STYLIST": { "$ref": "#/definitions/StylistTwin" },
    "AT_SALON": { "$ref": "#/definitions/SalonTwin" }
  },
  "managingAgent": "Booking Agent",
  "dataSources": ["REZ POS", "Booking System", "Client Input"],
  "updateTriggers": ["Appointment booked", "Status changed", "Service modified", "Feedback submitted"]
}
```

---

## 4. Integration Flows

### 4.1 Client Beauty Twin Integration Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     CLIENT BEAUTY TWIN INTEGRATION FLOW                     │
└─────────────────────────────────────────────────────────────────────────────┘

[REZ POS:3100] ───► [TwinOS:4142] ───► [REZ Loyalty:3200]
       │                 │                    │
       │                 ▼                    │
       │          ┌──────────────┐             │
       │          │  Transaction │             │
       │          │  Ingestion   │             │
       │          └──────────────┘             │
       │                 │                    │
       │                 ▼                    │
       │          ┌──────────────────────────────────┐
       │          │     CLIENT BEAUTY TWIN UPDATE    │
       │          │  • Parse service history          │
       │          │  • Update purchase patterns      │
       │          │  • Track loyalty points         │
       │          │  • Update preferences           │
       │          │  • Calculate lifetime value    │
       │          └──────────────────────────────────┘
       │                 │
       │                 ▼
       │          ┌──────────────────────────────────┐
       │          │     STYLIST MATCHING              │
       │          │  • Match based on preferences   │
       │          │  • Match based on service needs │
       │          │  • Check stylist availability   │
       │          │  • Generate stylist suggestions  │
       │          └──────────────────────────────────┘
       │                 │
       │                 ▼
       │          ┌──────────────────────────────────┐
       │          │     PRODUCT RECOMMENDATION        │
       │          │  • Analyze purchase history     │
       │          │  • Match to beauty profile      │
       │          │  • Consider service context     │
       │          │  • Generate product suggestions  │
       │          └──────────────────────────────────┘
       │                 │
       ▼                 ▼
  [Sales            [Personalized
   Analytics]        Experience]
```

### 4.2 API Endpoints

#### TwinOS API (Port 4142)

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|--------------|----------|
| `/twin/create` | POST | Create new twin instance | Twin schema | Twin ID + state |
| `/twin/{twinId}` | GET | Retrieve twin state | - | Twin JSON |
| `/twin/{twinId}` | PUT | Update twin attributes | Partial twin | Updated twin |
| `/twin/{twinId}/relate` | POST | Create relationship | Source, target, type | Relationship ID |
| `/twin/{twinId}/query` | POST | Query twin graph | Cypher query | Query results |
| `/twin/bulk` | POST | Bulk twin operations | Array of operations | Results array |
| `/twin/subscribe` | WS | Real-time updates | Twin ID | Stream of changes |

#### REZ POS API (Port 3100)

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|--------------|----------|
| `/transactions` | POST | Create transaction | Transaction | Transaction ID |
| `/transactions/{id}` | GET | Get transaction | - | Transaction details |
| `/transactions/client/{id}` | GET | Get client transactions | - | Transaction list |
| `/revenue` | GET | Get revenue report | Date range | Revenue data |
| `/services` | GET | Get service catalog | - | Service list |
| `/payments` | POST | Process payment | Payment | Payment confirmation |

#### REZ Inventory API (Port 3400)

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|--------------|----------|
| `/products` | GET | List products | Filters | Product list |
| `/products/{id}` | GET | Get product details | - | Product data |
| `/inventory` | GET | Get inventory levels | - | Inventory data |
| `/inventory/alerts` | GET | Get reorder alerts | - | Alert list |
| `/orders` | POST | Create order | Order | Order confirmation |
| `/orders/{id}` | GET | Get order status | - | Order details |

#### REZ Loyalty API (Port 3200)

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|--------------|----------|
| `/points/balance` | GET | Get points balance | User ID | Balance info |
| `/points/earn` | POST | Earn points | Transaction | Points awarded |
| `/points/redeem` | POST | Redeem points | Redemption | Redemption status |
| `/rewards` | GET | List available rewards | - | Reward list |
| `/tiers` | GET | Get tier status | User ID | Tier info |
| `/members` | GET | List loyalty members | - | Member list |

#### REZ QR Cloud API (Port 3500)

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|--------------|----------|
| `/qr/generate` | POST | Generate QR code | QR spec | QR code data |
| `/payments` | POST | Process QR payment | Payment | Payment confirmation |
| `/transactions` | GET | Get QR transactions | Date range | Transaction list |

---

## 5. Agent Definitions

### 5.1 Beauty Advisor Agent

**Purpose**: Provide personalized beauty advice, product recommendations, and service guidance.

**Capabilities**:
- Hair and skin analysis
- Product matching based on profile
- Service recommendation
- Allergen checking
- Stylist recommendation
- Routine building
- Seasonal recommendations

**Trigger Events**:
- Client requests advice
- Product browsing
- Service selection
- Profile update
- New product launch
- Seasonal change

**Actions**:
```
ON beauty_advisor_request:
  1. Load Client Beauty Twin profile
  2. Analyze beauty profile (hair type, skin type, allergies)
  3. Check for relevant allergies against product database
  4. Generate product recommendations based on profile
  5. Match to services that address concerns
  6. If stylist preference → Recommend specific stylist
  7. Build or update beauty routine
  8. Return personalized recommendations with explanations
```

### 5.2 Stylist Match Agent

**Purpose**: Match clients with appropriate stylists based on needs, preferences, and availability.

**Capabilities**:
- Stylist expertise matching
- Availability optimization
- Client preference alignment
- Schedule conflict resolution
- Skill gap identification
- Stylist recommendation
- Waitlist management

**Trigger Events**:
- New client booking
- Stylist preference requested
- Service requires specific expertise
- Schedule change
- Stylist unavailable
- Special request received

**Actions**:
```
ON stylist_match_request:
  1. Load Client Beauty Twin preferences
  2. Analyze service requirements
  3. Match stylists by specialization
  4. Check availability windows
  5. Consider client-stylist history
  6. Score and rank available stylists
  7. If preferred stylist unavailable → Suggest alternatives
  8. Return ranked stylist recommendations
  9. If no match → Add to waitlist
```

### 5.3 Product Recommender Agent

**Purpose**: Generate personalized product recommendations based on client profile and purchase history.

**Capabilities**:
- Purchase pattern analysis
- Profile-based matching
- Complementary product suggestions
- New product introduction
- Replenishment reminders
- Bundle recommendations
- Cross-selling opportunities

**Trigger Events**:
- Client browsing products
- Service completion
- Product purchase
- Inventory update
- New product added
- Replenishment due

**Actions**:
```
ON product_recommendation_request:
  1. Load Client Beauty Twin purchase history
  2. Load beauty profile for matching
  3. Analyze purchase patterns
  4. Identify complementary products
  5. Check for replenishment needs
  6. If new product relevant → Include in recommendations
  7. Generate personalized product list with reasons
  8. Update recommendation scores in Product Twins
```

### 5.4 Booking Agent

**Purpose**: Manage appointments, optimize scheduling, and handle cancellations.

**Capabilities**:
- Appointment scheduling
- Availability management
- Conflict resolution
- Waitlist handling
- Cancellation management
- Reminder coordination
- Buffer time optimization

**Trigger Events**:
- Booking request received
- Cancellation received
- No-show recorded
- Schedule change
- Time slot opened
- Waitlist position reached
- Reminder due

**Actions**:
```
ON booking_event:
  1. Validate booking request
  2. Check stylist availability
  3. Check salon capacity
  4. If available → Create Appointment Twin
  5. If waitlist needed → Add to waitlist
  6. Send confirmation via preferred channel
  7. Schedule reminder
  8. If cancellation → Process and release slot
  9. If no-show → Update records and apply policy
  10. Sync with REZ POS for service tracking
```

---

## 6. Business Copilot Queries

The REZ Business Copilot provides natural language access to Beauty OS data through TwinOS.

### 6.1 Client Analytics Queries

```
User: "Show me top 20 clients by lifetime value"
Copilot → TwinOS Query:
  MATCH (c:ClientBeautyTwin)
  WHERE c.clientStatus = "Active"
  RETURN c.fullName, c.serviceHistory.totalSpend, c.loyaltyInfo.tier,
         c.serviceHistory.totalVisits, c.clientSince
  ORDER BY c.serviceHistory.totalSpend DESC
  LIMIT 20

User: "Which clients are due for a haircut appointment?"
Copilot → TwinOS Query:
  MATCH (c:ClientBeautyTwin)
  WHERE c.clientStatus = "Active"
  AND c.serviceHistory.lastVisit < date() - duration('P60D')
  RETURN c.fullName, c.phone, c.serviceHistory.lastVisit,
         c.preferences.preferredStylist
  ORDER BY c.serviceHistory.lastVisit

User: "Show me clients with expiring loyalty points"
Copilot → TwinOS Query:
  MATCH (c:ClientBeautyTwin)
  WHERE c.loyaltyInfo.pointsBalance > 0
  AND c.loyaltyInfo.pointsExpiration < date() + duration('P30D')
  RETURN c.fullName, c.loyaltyInfo.pointsBalance, c.loyaltyInfo.pointsExpiration
```

### 6.2 Stylist Performance Queries

```
User: "Rank stylists by rebooking rate this month"
Copilot → TwinOS Query:
  MATCH (s:StylistTwin)
  WHERE s.performanceMetrics.rebookingRate IS NOT NULL
  RETURN s.fullName, s.specializations, s.performanceMetrics.rebookingRate,
         s.performanceMetrics.avgRating
  ORDER BY s.performanceMetrics.rebookingRate DESC

User: "Which stylists have availability for new clients?"
Copilot → TwinOS Query:
  MATCH (s:StylistTwin)
  WHERE s.availability.currentWeekHours < s.availability.maxWeekHours
  RETURN s.fullName, s.specializations, 
         s.availability.maxWeekHours - s.availability.currentWeekHours as availableHours

User: "Show me stylist revenue breakdown by service category"
Copilot → TwinOS Aggregation:
  MATCH (s:StylistTwin)-[:PERFORMS]->(a:AppointmentTwin {status: "Completed"})
  WHERE a.scheduledDate >= date() - duration('P30D')
  RETURN s.fullName, a.serviceType, sum(a.totalPrice) as revenue
  ORDER BY s.fullName, revenue DESC
```

### 6.3 Salon Operations Queries

```
User: "Which salons are at peak capacity today?"
Copilot → TwinOS Query:
  MATCH (sa:SalonTwin)
  WHERE sa.capacity.currentDailyAppointments >= sa.capacity.maxDailyAppointments * 0.9
  RETURN sa.salonName, sa.address.city, sa.capacity.currentDailyAppointments,
         sa.capacity.maxDailyAppointments

User: "Show me product inventory alerts across all salons"
Copilot → TwinOS Query:
  MATCH (p:ProductTwin)
  WHERE p.inventory.quantity <= p.inventory.reorderLevel
  MATCH (sa:SalonTwin)-[:STOCKS]->(p)
  RETURN sa.salonName, p.name, p.brand, p.inventory.quantity, p.inventory.reorderLevel
  ORDER BY p.inventory.quantity

User: "What's the average service rating by salon?"
Copilot → TwinOS Aggregation:
  MATCH (sa:SalonTwin)
  RETURN sa.salonName, sa.performanceMetrics.avgServiceRating,
         sa.performanceMetrics.dailyRevenue
  ORDER BY sa.performanceMetrics.avgServiceRating DESC
```

### 6.4 Product Analytics Queries

```
User: "Show me top 10 best-selling products this month"
Copilot → TwinOS Query:
  MATCH (p:ProductTwin)
  WHERE p.salesMetrics.revenue IS NOT NULL
  RETURN p.name, p.brand, p.category, p.salesMetrics.unitsSold, p.salesMetrics.revenue
  ORDER BY p.salesMetrics.revenue DESC
  LIMIT 10

User: "Which products need reordering?"
Copilot → TwinOS Query:
  MATCH (p:ProductTwin)
  WHERE p.inventory.quantity <= p.inventory.reorderLevel
  RETURN p.name, p.sku, p.inventory.quantity, p.inventory.reorderQuantity,
         p.inventory.warehouseLocation
  ORDER BY p.inventory.quantity

User: "Show me product recommendation performance"
Copilot → TwinOS Query:
  MATCH (p:ProductTwin)
  RETURN p.name, p.recommendationScore, p.salesMetrics.avgRating,
         p.salesMetrics.returnRate
  ORDER BY p.recommendationScore DESC
```

### 6.5 Appointment and Scheduling Queries

```
User: "Show me all appointments scheduled for tomorrow"
Copilot → TwinOS Query:
  MATCH (a:AppointmentTwin)
  WHERE a.scheduledDate = date() + duration('P1D')
  AND a.status IN ["Scheduled", "Confirmed"]
  RETURN a.bookingReference, a.scheduledTime, a.services, a.totalPrice,
         a.status
  ORDER BY a.scheduledTime

User: "Which time slots have the highest cancellation rate?"
Copilot → TwinOS Aggregation:
  MATCH (a:AppointmentTwin {status: "Cancelled"})
  RETURN a.scheduledTime, count(a) as cancellations
  ORDER BY cancellations DESC

User: "Show me no-show rate by client segment"
Copilot → TwinOS Aggregation:
  MATCH (c:ClientBeautyTwin)-[:BOOKS]->(a:AppointmentTwin)
  WHERE a.status = "No Show"
  RETURN c.loyaltyInfo.tier, count(a) as noShows,
         count(a) * 100.0 / count(*) as noShowRate
  ORDER BY noShowRate DESC
```

---

## 7. Economic Integration

### 7.1 Revenue Model

| Revenue Stream | Calculation | Twin Attribution |
|---------------|-------------|------------------|
| Service Revenue | Per-service fee × volume | Appointment Twin transactions |
| Product Sales | Product margin × sales | Product Twin sales |
| Membership Dues | Monthly subscription | Client Beauty Twin memberships |
| Package Sales | Bundle discount | Appointment Twin packages |
| Loyalty Redemption | Points redeemed value | REZ Loyalty redemptions |
| Booking Fees | Per-booking fee | Booking Agent transactions |

### 7.2 Cost Attribution

| Cost Center | Attribution Method | Twin Correlation |
|-------------|-------------------|------------------|
| AI/ML Processing | API call count per twin type | Twin operation volume |
| Stylist Commissions | Service revenue share | Stylist Twin performance |
| Inventory Carrying | Storage cost per product | Product Twin inventory |
| Loyalty Rewards | Points value redeemed | REZ Loyalty transactions |
| Marketing | Campaign cost per segment | Client Beauty Twin segments |

### 7.3 Pricing Tiers

| Tier | Capabilities | Monthly Price |
|------|--------------|---------------|
| Basic | Client Beauty Twin, basic tracking | $9.99/mo |
| Premium | Full twin suite, stylist matching, loyalty | $29.99/mo |
| VIP | All features, priority booking, exclusive rewards | $79.99/mo |

---

## 8. Implementation Roadmap

### Week 1-2: Foundation

| Day | Task | Deliverable |
|-----|------|-------------|
| 1-2 | Environment setup | Dev environment configured |
| 3-4 | TwinOS core deployment | TwinOS running on port 4142 |
| 5-7 | Schema implementation | All 4 twin schemas validated |
| 8-10 | REZ POS integration | REZ POS connected to TwinOS |
| 11-14 | Basic API endpoints | CRUD operations functional |

**Milestone**: Basic twin creation and relationship management operational.

### Week 3-4: Agent Development

| Day | Task | Deliverable |
|-----|------|-------------|
| 15-17 | Beauty Advisor Agent | Agent deployed, recommendations functional |
| 18-20 | Stylist Match Agent | Agent deployed, matching operational |
| 21-23 | Product Recommender Agent | Agent deployed, product matching |
| 24-26 | Booking Agent | Agent deployed, scheduling operational |
| 27-28 | REZ Inventory integration | Inventory management connected |

**Milestone**: All 4 agents operational and connected to twins.

### Week 5: Integration & Testing

| Day | Task | Deliverable |
|-----|------|-------------|
| 29-31 | End-to-end flow testing | Client journey fully automated |
| 32-33 | API security audit | All endpoints secured |
| 34-35 | Performance testing | Load testing complete |
| 36-37 | Data migration prep | Migration scripts validated |
| 38 | Staging deployment | Staging environment operational |

**Milestone**: Full integration tested and staged for production.

### Week 6: Go-Live Preparation

| Day | Task | Deliverable |
|-----|------|-------------|
| 39-40 | Production deployment | Production environment live |
| 41-42 | REZ Loyalty integration | Loyalty system connected |
| 43 | User acceptance testing | Stakeholder sign-off |
| 44 | Training documentation | User guides completed |
| 45 | Go-live | System operational |
| 46-47 | Hypercare support | 24/7 support for 48 hours |
| 48 | Project closure | Documentation, lessons learned |

**Milestone**: Beauty OS fully operational with all integrations live.

---

## Appendix A: Port Reference

| Service | Port | Protocol |
|---------|------|----------|
| REZ POS | 3100 | HTTP/REST |
| REZ Loyalty | 3200 | HTTP/REST |
| REZ Inventory | 3400 | HTTP/REST |
| REZ QR Cloud | 3500 | HTTP/REST |
| MyRisa | 4300 | HTTP/REST |
| TwinOS | 4142 | HTTP/REST + WebSocket |

## Appendix B: Error Codes

| Code | Description | Resolution |
|------|-------------|------------|
| BTY-001 | Twin creation failed | Check schema validity |
| BTY-002 | Stylist unavailable | Match alternative stylist |
| BTY-003 | Booking conflict | Find alternative slot |
| BTY-004 | Inventory insufficient | Check other locations |
| BTY-005 | Loyalty points error | Verify point calculation |

---

*Document Version: 1.0*
*Last Updated: June 2026*
*Owner: Beauty OS Integration Team*
