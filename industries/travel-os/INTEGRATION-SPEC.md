# Travel OS Integration Specification

## Executive Summary

Travel OS delivers AI-powered travel planning, booking optimization, and personalized experiences through the integration of Airzy, The Invisible Hotel, Virtual Tours, REZ Loyalty, and Rider Circle. The platform creates a seamless travel ecosystem that connects travelers with destinations, packages, and experiences while maximizing loyalty rewards and engagement.

**Key Value Drivers:**
- 45% increase in booking conversion rates
- 60% improvement in personalization accuracy
- 35% growth in loyalty program engagement
- Real-time inventory synchronization across travel partners

## Product Capability Matrix

| Product | Core Function | Integration Points |
|---------|---------------|-------------------|
| Airzy | Travel search, booking engine | Traveler Twin, Destination Twin, Booking Twin |
| The Invisible Hotel | Hotel distribution, deals | Booking Twin, Traveler Twin, Package Twin |
| Virtual Tours | Destination experiences | Experience Twin, Destination Twin, Traveler Twin |
| REZ Loyalty | Rewards management | Traveler Twin, Booking Twin, all Twins |
| Rider Circle | Transportation, transfers | Booking Twin, Destination Twin, Traveler Twin |
| REZ CRM | Customer profiles, segmentation, campaigns, visit tracking | Traveler Twin, Booking Twin |

### Travel CRM Service
| Attribute | Value |
|-----------|-------|
| **Port** | `TBD` |
| **Company** | REZ Merchant |
| **Capabilities** | Customer profiles, segmentation, campaigns, visit tracking |
| **Data Produced** | Customer segments, campaign results, churn risk |
| **Data Needed** | Customer Twin, Transaction Twin |
| **TwinOS Role** | CUSTOMER INTELLIGENCE |

## Twin JSON Schemas

### Traveler Twin (4142-TR1)
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "TravelerTwin",
  "type": "object",
  "properties": {
    "travelerId": { "type": "string", "format": "uuid" },
    "profile": {
      "firstName": { "type": "string" },
      "lastName": { "type": "string" },
      "email": { "type": "string", "format": "email" },
      "phone": { "type": "string" },
      "dateOfBirth": { "type": "string", "format": "date" },
      "nationality": { "type": "string" },
      "photo": { "type": "string" }
    },
    "preferences": {
      "seatPreference": { "enum": ["window", "aisle", "no_preference"] },
      "mealPreference": { "type": "string" },
      "roomType": { "enum": ["standard", "deluxe", "suite", "no_preference"] },
      "interestedDestinations": { "type": "array", "items": { "type": "string" } },
      "interestedActivities": { "type": "array", "items": { "type": "string" } },
      "travelStyle": { "enum": ["budget", "mid_range", "luxury", "adventure", "relaxation"] },
      "accessibilityNeeds": { "type": "array", "items": { "type": "string" } }
    },
    "loyalty": {
      "programId": { "type": "string" },
      "tier": { "enum": ["bronze", "silver", "gold", "platinum", "diamond"] },
      "points": { "type": "number" },
      "pointsValue": { "type": "number" },
      "lifetimePoints": { "type": "number" },
      "memberSince": { "type": "string", "format": "date" },
      "benefits": { "type": "array", "items": { "type": "string" } }
    },
    "bookingIds": { "type": "array", "items": { "type": "string" } },
    "experienceIds": { "type": "array", "items": { "type": "string" } },
    "travelHistory": {
      "destinationsVisited": { "type": "array", "items": { "type": "string" } },
      "totalTrips": { "type": "integer" },
      "totalSpent": { "type": "number" },
      "favoriteDestinations": { "type": "array", "items": { "type": "string" } }
    },
    "documents": {
      "passportNumber": { "type": "string" },
      "passportExpiry": { "type": "string", "format": "date" },
      "visaInfo": { "type": "array" },
      "frequentFlyerNumbers": { "type": "array" }
    },
    "paymentMethods": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "type": { "type": "string" },
          "lastFour": { "type": "string" },
          "expiry": { "type": "string" },
          "isDefault": { "type": "boolean" }
        }
      }
    },
    "createdAt": { "type": "string", "format": "date-time" }
  }
}
```

### Destination Twin (4142-DS1)
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "DestinationTwin",
  "type": "object",
  "properties": {
    "destinationId": { "type": "string", "format": "uuid" },
    "profile": {
      "name": { "type": "string" },
      "type": { "enum": ["city", "country", "region", "island", "resort_area"] },
      "description": { "type": "string" },
      "highlights": { "type": "array", "items": { "type": "string" } },
      "bestTimeToVisit": { "type": "array", "items": { "type": "string" } }
    },
    "location": {
      "country": { "type": "string" },
      "region": { "type": "string" },
      "city": { "type": "string" },
      "coordinates": {
        "latitude": { "type": "number" },
        "longitude": { "type": "number" }
      },
      "timezone": { "type": "string" }
    },
    "categories": {
      "beach": { "type": "boolean" },
      "mountain": { "type": "boolean" },
      "cultural": { "type": "boolean" },
      "urban": { "type": "boolean" },
      "adventure": { "type": "boolean" },
      "wellness": { "type": "boolean" },
      "business": { "type": "boolean" }
    },
    "packageIds": { "type": "array", "items": { "type": "string" } },
    "experienceIds": { "type": "array", "items": { "type": "string" } },
    "accommodationIds": { "type": "array", "items": { "type": "string" } },
    "weather": {
      "jan": { "type": "object" },
      "apr": { "type": "object" },
      "jul": { "type": "object" },
      "oct": { "type": "object" }
    },
    "practicalInfo": {
      "visaRequirements": { "type": "string" },
      "currency": { "type": "string" },
      "language": { "type": "string" },
      "safetyIndex": { "type": "number" },
      "costIndex": { "type": "number" }
    },
    "statistics": {
      "avgHotelRate": { "type": "number" },
      "avgFlightRate": { "type": "number" },
      "popularityScore": { "type": "number" },
      "reviewCount": { "type": "integer" },
      "avgRating": { "type": "number" }
    },
    "createdAt": { "type": "string", "format": "date-time" }
  }
}
```

### Package Twin (4142-PK1)
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "PackageTwin",
  "type": "object",
  "properties": {
    "packageId": { "type": "string", "format": "uuid" },
    "profile": {
      "name": { "type": "string" },
      "tagline": { "type": "string" },
      "description": { "type": "string" },
      "type": { "enum": ["flight_hotel", "flight_only", "hotel_only", "package_plus", "custom"] },
      "duration": { "type": "integer" },
      "validFrom": { "type": "string", "format": "date" },
      "validTo": { "type": "string", "format": "date" }
    },
    "destinationId": { "type": "string" },
    "bookingIds": { "type": "array", "items": { "type": "string" } },
    "components": {
      "flights": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "flightId": { "type": "string" },
            "airline": { "type": "string" },
            "origin": { "type": "string" },
            "destination": { "type": "string" },
            "departureTime": { "type": "string" },
            "arrivalTime": { "type": "string" },
            "class": { "type": "string" }
          }
        }
      },
      "hotels": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "hotelId": { "type": "string" },
            "name": { "type": "string" },
            "checkIn": { "type": "string", "format": "date" },
            "checkOut": { "type": "string", "format": "date" },
            "roomType": { "type": "string" },
            "nights": { "type": "integer" }
          }
        }
      },
      "transfers": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "transferId": { "type": "string" },
            "type": { "type": "string" },
            "from": { "type": "string" },
            "to": { "type": "string" },
            "dateTime": { "type": "string", "format": "date-time" }
          }
        }
      },
      "experiences": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "experienceId": { "type": "string" },
            "name": { "type": "string" },
            "date": { "type": "string", "format": "date" },
            "participants": { "type": "integer" }
          }
        }
      }
    },
    "pricing": {
      "basePrice": { "type": "number" },
      "markup": { "type": "number" },
      "sellingPrice": { "type": "number" },
      "currency": { "type": "string" },
      "perPersonPrice": { "type": "number" },
      "groupDiscount": { "type": "number" },
      "loyaltyDiscount": { "type": "number" }
    },
    "availability": {
      "totalSlots": { "type": "integer" },
      "bookedSlots": { "type": "integer" },
      "availableSlots": { "type": "integer" },
      "bookingDeadline": { "type": "string", "format": "date" }
    },
    "reviews": {
      "avgRating": { "type": "number" },
      "totalReviews": { "type": "integer" },
      "recentReviews": { "type": "array" }
    },
    "createdAt": { "type": "string", "format": "date-time" }
  }
}
```

### Booking Twin (4142-BK1)
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "BookingTwin",
  "type": "object",
  "properties": {
    "bookingId": { "type": "string", "format": "uuid" },
    "travelerId": { "type": "string" },
    "packageId": { "type": "string" },
    "profile": {
      "bookingReference": { "type": "string" },
      "status": { "enum": ["pending", "confirmed", "in_progress", "completed", "cancelled", "refunded"] },
      "bookingDate": { "type": "string", "format": "date-time" },
      "travelDate": { "type": "string", "format": "date" },
      "returnDate": { "type": "string", "format": "date" },
      "adults": { "type": "integer" },
      "children": { "type": "integer" },
      "infants": { "type": "integer" }
    },
    "components": {
      "flights": { "type": "array" },
      "hotels": { "type": "array" },
      "transfers": { "type": "array" },
      "experiences": { "type": "array" }
    },
    "pricing": {
      "subtotal": { "type": "number" },
      "taxes": { "type": "number" },
      "fees": { "type": "number" },
      "discounts": { "type": "number" },
      "loyaltyPointsUsed": { "type": "number" },
      "total": { "type": "number" },
      "currency": { "type": "string" }
    },
    "payment": {
      "status": { "enum": ["pending", "partial", "paid", "refunded"] },
      "method": { "type": "string" },
      "paidAmount": { "type": "number" },
      "paidDate": { "type": "string", "format": "date-time" },
      "transactions": { "type": "array" }
    },
    "itinerary": {
      "dayByDay": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "day": { "type": "integer" },
            "date": { "type": "string", "format": "date" },
            "activities": { "type": "array" }
          }
        }
      }
    },
    "specialRequests": { "type": "array", "items": { "type": "string" } },
    "loyalty": {
      "pointsEarned": { "type": "number" },
      "pointsValue": { "type": "number" },
      "tierProgress": { "type": "number" }
    },
    "documents": {
      "eTickets": { "type": "array" },
      "vouchers": { "type": "array" },
      "insurance": { "type": "string" }
    },
    "createdAt": { "type": "string", "format": "date-time" }
  }
}
```

### Experience Twin (4142-EX1)
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "ExperienceTwin",
  "type": "object",
  "properties": {
    "experienceId": { "type": "string", "format": "uuid" },
    "profile": {
      "name": { "type": "string" },
      "tagline": { "type": "string" },
      "description": { "type": "string" },
      "type": { "enum": ["tour", "activity", "dining", "spa", "entertainment", "adventure", "cultural", "wellness"] },
      "duration": { "type": "number" },
      "difficulty": { "enum": ["easy", "moderate", "challenging", "extreme"] }
    },
    "destinationId": { "type": "string" },
    "provider": {
      "name": { "type": "string" },
      "rating": { "type": "number" },
      "contactInfo": { "type": "object" }
    },
    "logistics": {
      "meetingPoint": { "type": "string" },
      "coordinates": {
        "latitude": { "type": "number" },
        "longitude": { "type": "number" }
      },
      "pickupAvailable": { "type": "boolean" },
      "pickupLocations": { "type": "array" },
      "languages": { "type": "array", "items": { "type": "string" } }
    },
    "requirements": {
      "minAge": { "type": "integer" },
      "maxAge": { "type": "integer" },
      "physicalRequirements": { "type": "array" },
      "equipmentNeeded": { "type": "array" },
      "dressCode": { "type": "string" }
    },
    "capacity": {
      "maxParticipants": { "type": "integer" },
      "minParticipants": { "type": "integer" },
      "currentBookings": { "type": "integer" },
      "availableSlots": { "type": "integer" }
    },
    "pricing": {
      "adultPrice": { "type": "number" },
      "childPrice": { "type": "number" },
      "groupPrice": { "type": "number" },
      "currency": { "type": "string" },
      "includes": { "type": "array", "items": { "type": "string" } },
      "excludes": { "type": "array", "items": { "type": "string" } }
    },
    "media": {
      "images": { "type": "array", "items": { "type": "string" } },
      "videos": { "type": "array", "items": { "type": "string" } },
      "virtualTourUrl": { "type": "string" }
    },
    "reviews": {
      "avgRating": { "type": "number" },
      "totalReviews": { "type": "integer" },
      "ratingBreakdown": { "type": "object" },
      "recentReviews": { "type": "array" }
    },
    "availability": {
      "schedule": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "dayOfWeek": { "type": "integer" },
            "times": { "type": "array" }
          }
        }
      },
      "blackoutDates": { "type": "array" }
    },
    "createdAt": { "type": "string", "format": "date-time" }
  }
}
```

## Integration Flows with API Endpoints

### Flow 1: Trip Planning
```
Traveler Twin → Trip Planner Agent → Destination Twin (search)
                                  → Package Twin (match)
                                  → Experience Twin (suggest)
                                  → Airzy (flights)
```

**API Endpoints:**
- `POST /api/v1/trips/search` - Search destinations and packages
- `GET /api/v1/destinations/{id}` - Get destination details
- `GET /api/v1/packages/search` - Search available packages
- `GET /api/v1/experiences/recommend` - Get experience recommendations
- `GET /api/v1/flights/search` - Search flights

### Flow 2: Booking Pipeline
```
Traveler Twin → Booking Agent → Package Twin (availability)
                                 → Booking Twin (create)
                                 → The Invisible Hotel (confirm)
                                 → Rider Circle (transfers)
                                 → REZ Loyalty (points)
```

**API Endpoints:**
- `POST /api/v1/bookings` - Create new booking
- `PUT /api/v1/bookings/{id}/confirm` - Confirm booking
- `GET /api/v1/bookings/{id}/status` - Get booking status
- `POST /api/v1/bookings/{id}/payments` - Process payment
- `PUT /api/v1/bookings/{id}/cancel` - Cancel booking

### Flow 3: Concierge Services
```
Booking Twin → Concierge Agent → Experience Twin (activities)
                                  → Rider Circle (transport)
                                  → Virtual Tours (book)
                                  → Traveler Twin (notify)
```

**API Endpoints:**
- `GET /api/v1/concierge/recommendations` - Get personalized recommendations
- `POST /api/v1/experiences/book` - Book experience
- `PUT /api/v1/transfers/request` - Request transfer
- `GET /api/v1/virtual-tours` - Browse virtual tours

### Flow 4: Loyalty Program
```
Traveler Twin → Loyalty Agent → Booking Twin (earn points)
                                 → REZ Loyalty (update)
                                 → Package Twin (redeem)
                                 → Destination Twin (targeted offers)
```

**API Endpoints:**
- `GET /api/v1/loyalty/balance` - Get loyalty balance
- `POST /api/v1/loyalty/earn` - Earn points
- `POST /api/v1/loyalty/redeem` - Redeem points
- `GET /api/v1/loyalty/offers` - Get available offers
- `PUT /api/v1/loyalty/tier` - Update tier status

### Flow 5: Real-time Updates
```
Airzy → Traveler Twin (sync preferences)
      → Booking Twin (update status)
      → The Invisible Hotel (inventory)
      → Rider Circle (availability)
```

**API Endpoints:**
- `PUT /api/v1/travelers/{id}/preferences` - Update preferences
- `GET /api/v1/inventory/real-time` - Real-time availability
- `POST /api/v1/webhooks/update` - Webhook for updates
- `GET /api/v1/notifications` - Get traveler notifications

## Agent Definitions

### Trip Planner Agent
- **Purpose:** Create personalized travel itineraries based on traveler preferences
- **Inputs:** Traveler Twin, Destination Twin, historical booking data
- **Outputs:** Recommended packages, experience suggestions, itinerary drafts
- **Capabilities:**
  - Natural language trip planning
  - Budget optimization
  - Multi-destination routing
  - Weather-aware planning
  - Activity matching based on interests

### Booking Agent
- **Purpose:** Coordinate and optimize travel bookings across all providers
- **Inputs:** Package Twin, Booking Twin, availability data, pricing
- **Outputs:** Confirmed bookings, payment processing, confirmation documents
- **Capabilities:**
  - Real-time inventory synchronization
  - Price comparison across providers
  - Booking conflict resolution
  - Dynamic packaging
  - Multi-currency handling

### Concierge Agent
- **Purpose:** Provide on-trip assistance and enhance traveler experiences
- **Inputs:** Booking Twin, Experience Twin, Traveler Twin, location data
- **Outputs:** Activity recommendations, transfer arrangements, local tips
- **Capabilities:**
  - In-trip personalization
  - Real-time location awareness
  - Restaurant/entertainment recommendations
  - Emergency assistance coordination
  - Last-minute booking

### Recommendation Agent
- **Purpose:** Drive engagement through personalized offers and suggestions
- **Inputs:** Traveler Twin, Destination Twin, Package Twin, behavior data
- **Outputs:** Targeted offers, upsell suggestions, loyalty rewards
- **Capabilities:**
  - Collaborative filtering
  - Price sensitivity analysis
  - Next-trip prediction
  - Segment-based targeting
  - A/B testing optimization

### Loyalty Agent
- **Purpose:** Manage loyalty program, tier progression, and reward redemption
- **Inputs:** Traveler Twin, Booking Twin, REZ Loyalty data
- **Outputs:** Points updates, tier upgrades, reward notifications
- **Capabilities:**
  - Points calculation and tracking
  - Tier progression management
  - Reward catalog management
  - Expiration alerts
  - VIP identification

### CRM Agent
- **Purpose:** Manage customer profiles, segmentation, and campaign orchestration
- **Inputs:** Traveler Twin, Booking Twin, REZ CRM data
- **Outputs:** Customer segments, campaign results, churn risk scores
- **Capabilities:**
  - Customer profile management
  - Behavioral segmentation
  - Campaign orchestration
  - Visit tracking and analysis
  - Churn prediction and prevention

## Business Copilot Queries

### Trip Planning Queries
```
"Show me trending destinations for summer 2026"
"What packages match a family of 4 with a budget of $5,000?"
"Find romantic getaways within 3 hours flight time"
"Which destinations have the best weather next week?"
"Generate a multi-city itinerary for my Europe trip"
```

### Booking Analytics Queries
```
"What is our booking conversion rate by destination?"
"Show me revenue by booking type this month"
"Which packages have the highest cancellation rate?"
"What is our average booking lead time?"
"Generate a booking forecast for Q3 2026"
```

### Traveler Insights Queries
```
"Who are our most valuable travelers by tier?"
"Show me traveler demographics by destination"
"What is our repeat booking rate?"
"Which loyalty tier has the highest engagement?"
"Generate a traveler lifetime value report"
```

### Experience Performance Queries
```
"What are our top-rated experiences?"
"Show me experience booking trends by type"
"Which experiences have the highest no-show rate?"
"What is the average experience revenue per traveler?"
"Generate an experience performance dashboard"
```

### Loyalty Program Queries
```
"What is our loyalty program enrollment rate?"
"Show me points redemption by tier"
"How many travelers will reach next tier this month?"
"What is our average points balance by segment?"
"Generate a loyalty program health report"
```

## Economic Integration

### Revenue Model
- **Package margins:** 8-15% markup on base package costs
- **Commission revenue:** 10-20% commission from hotels and experiences
- **Loyalty fees:** Annual program fees from partner merchants
- **Dynamic pricing:** Surge pricing during peak seasons
- **Bundle revenue:** Premium pricing for bundled packages

### Cost Optimization
- AI-powered recommendation reduces marketing spend
- Automated booking reduces manual processing costs
- Real-time inventory reduces overbooking losses
- Loyalty automation reduces program management overhead
- Virtual tours reduce physical tour costs

### Key Metrics
- Booking conversion: 12% (industry: 8%)
- Average booking value: $3,200
- Loyalty program participation: 68%
- Repeat booking rate: 45%
- Net promoter score: 72
- Average package margin: 12%

## 6-Week Implementation Roadmap

### Week 1: Foundation
- **Day 1-2:** TwinOS deployment, Airzy integration setup
- **Day 3-4:** The Invisible Hotel API connection
- **Day 5:** Virtual Tours platform integration
- **Day 6-7:** REZ Loyalty configuration

### Week 2: Twin Development
- **Day 8-10:** Traveler Twin and Destination Twin implementation
- **Day 11-12:** Package Twin and Booking Twin development
- **Day 13-14:** Experience Twin and Rider Circle integration

### Week 3: Agent Development
- **Day 15-17:** Trip Planner Agent implementation
- **Day 18-20:** Booking Agent development
- **Day 21:** Concierge Agent initial build

### Week 4: Advanced Agents
- **Day 22-24:** Recommendation Agent implementation
- **Day 25-26:** Loyalty Agent development
- **Day 27-28:** Cross-product integration testing

### Week 5: Business Intelligence
- **Day 29-31:** Business Copilot query engine setup
- **Day 32-33:** REZ Dashboard configuration
- **Day 34-35:** Analytics pipeline deployment
- **Day 35:** User acceptance testing begins

### Week 6: Launch
- **Day 36-38:** UAT completion and bug fixes
- **Day 39-40:** Production deployment
- **Day 41-42:** Partner training and go-live
- **Go-Live Target:** End of Week 6

### Success Criteria
- All 5 Twin types operational
- All 5 Agents deployed and functioning
- Business Copilot responding to queries
- Dashboard displaying live booking data
- Partner integration verified
- Staff training complete
