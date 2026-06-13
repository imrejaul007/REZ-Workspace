# Hotel & Hospitality OS - Integration Specification

**Document Version:** 1.0  
**Date:** June 12, 2026  
**Status:** Foundation Ready - Detailed Specification  
**Classification:** Internal - RTNM Digital

---

## Table of Contents

1. [Industry Overview](#1-industry-overview)
2. [Product Capability Matrix](#2-product-capability-matrix)
3. [Twin Architecture](#3-twin-architecture)
4. [Integration Flows](#4-integration-flows)
5. [Agent Architecture](#5-agent-architecture)
6. [Business Copilot Integration](#6-business-copilot-integration)
7. [Economic Integration](#7-economic-integration)
8. [Implementation Roadmap](#8-implementation-roadmap)

---

## 1. Industry Overview

### 1.1 Industry Challenges

| Challenge | Impact | Current Gap |
|-----------|--------|-------------|
| **Fragmented Guest Data** | Siloed systems prevent 360-degree guest view | PMS, POS, Loyalty, Minibar all in separate systems |
| **Reactive Service Model** | Hotels respond to requests instead of anticipating needs | No unified prediction engine across touchpoints |
| **Disconnected Payments** | Multiple payment touchpoints create friction and reconciliation overhead | No unified wallet across hotel services |
| **Manual Housekeeping** | Reactive scheduling based on checkout, not predictive factors | No AI-driven room readiness prediction |
| **Lost Guest Preferences** | Each stay starts fresh with no memory of past preferences | Guest Memory exists but not integrated with operations |
| **Missed Upsell Opportunities** | Static offers not personalized to guest behavior | Upsell Engine exists but lacks real-time guest context |
| **No Cross-Merchant Value** | Hotels miss revenue from nearby merchant partnerships | No ecosystem play connecting hotels to restaurants, spas, gyms |

### 1.2 Current Product Landscape

The RTNM ecosystem has **9 core products** serving the Hotel & Hospitality industry:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    HOTEL & HOSPITALITY OS                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐        │
│  │ THE INVISIBLE    │  │   AI CONCIERGE   │  │  GUEST MEMORY    │        │
│  │ HOTEL            │  │   (HOJAI)        │  │  (HOJAI)         │        │
│  │ 28 Services      │  │   Port 4840      │  │   Port 4520      │        │
│  │ Ports 3800-3899  │  │                  │  │                  │        │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘        │
│           │                      │                      │                   │
│  ┌────────▼─────────┐  ┌────────▼─────────┐  ┌────────▼─────────┐        │
│  │ SMART MINIBAR    │  │  PREDICTIVE       │  │  UPSELL ENGINE  │        │
│  │ Port 3810        │  │  HOUSEKEEPING    │  │  Port 3817      │        │
│  │                  │  │  Port 3826       │  │                  │        │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘        │
│           │                      │                      │                   │
│  ┌────────▼─────────┐  ┌────────▼─────────┐  ┌────────▼─────────┐        │
│  │    REZ POS       │  │   REZ LOYALTY   │  │   BRAND PULSE   │        │
│  │   Port 4081      │  │   Port 4037     │  │   Port 4770     │        │
│  │                  │  │                  │  │                  │        │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘        │
│                                                                             │
│  ════════════════════════════════════════════════════════════════════════  │
│                          TWINOS (Central Hub)                               │
│                      Ports 4550 (Agent) / 4860 (Twin)                        │
│  ════════════════════════════════════════════════════════════════════════  │
│                                                                             │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐        │
│  │   RABTUL PAY     │  │  RABTUL WALLET   │  │  BUSINESS       │        │
│  │   Port 4001     │  │   Port 4004      │  │  COPILOT        │        │
│  │                  │  │                  │  │                  │        │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.3 Integration Opportunity

**Current State:** Products work independently with point-to-point integrations.

**Target State:** Unified Hotel & Hospitality OS where:
- All products share a single source of truth via Guest Twin
- AI agents orchestrate cross-product workflows
- Business Copilot provides unified natural language interface
- Payments flow through unified wallet
- Loyalty points are earned/redeemed across all touchpoints

**Value Unlocked:**
- 40% reduction in guest service response time
- 25% increase in upsell conversion
- 30% improvement in housekeeping efficiency
- 50% reduction in payment reconciliation
- 60% improvement in guest satisfaction (NPS)

---

## 2. Product Capability Matrix

### 2.1 The Invisible Hotel (StayOwn)

| Attribute | Details |
|-----------|---------|
| **Company** | StayOwn (RTNM Group) |
| **Core Capabilities** | Frictionless AI-driven hotel OS with 28 microservices |
| **Key Services** | AI Front Desk (3800), Smart Lock (3825), Room Controls (3814), Zero-Checkout (3827) |
| **Data Produced** | Booking events, check-in/out events, room status, service requests, IoT telemetry |
| **Data Needed** | Guest preferences, loyalty tier, payment status, room availability |
| **Current Integration** | HOJAI Memory (preferences), RABTUL Pay (payments), REZ-Merchant PMS |
| **Target Integration** | TwinOS Guest Twin, Business Copilot, AdBazaar offers |

**Service Map:**
| Service | Port | Produces | Consumes |
|---------|------|----------|----------|
| ai-front-desk | 3800 | Guest interactions | Guest Twin, Memory |
| minibar-service | 3810 | Consumption events | Inventory Twin, Guest Twin |
| smart-lock-service | 3825 | Access logs | Guest Twin, PMS |
| room-controls | 3814 | IoT events | Guest Twin |
| zero-checkout-automation | 3827 | Settlement events | Wallet, Loyalty |
| pre-arrival-service | 3828 | Preferences collected | Guest Twin, Memory |

---

### 2.2 AI Concierge (HOJAI Staybot)

| Attribute | Details |
|-----------|---------|
| **Company** | HOJAI AI |
| **Core Capabilities** | 24/7 AI-powered virtual concierge with natural language understanding |
| **Key Services** | Intent detection, service routing, multi-language support (10+ Indian languages) |
| **Data Produced** | Conversation logs, intent classifications, service requests, sentiment scores |
| **Data Needed** | Guest profile, booking details, service catalog, knowledge base |
| **Current Integration** | HOJAI Memory (conversation history), Genie (briefings) |
| **Target Integration** | TwinOS Guest Twin, Business Copilot skills, StayOwn services |

**API Endpoints (Port 4840):**
```
POST /api/converse          - Natural language conversation
POST /api/intent/detect     - Intent classification
GET  /api/services          - Available services catalog
POST /api/service/request   - Route service request
GET  /api/guest/:guestId/history - Conversation history
```

---

### 2.3 Smart Minibar

| Attribute | Details |
|-----------|---------|
| **Company** | StayOwn |
| **Core Capabilities** | IoT-connected minibar with auto-detection, real-time billing, inventory management |
| **Key Services** | Item detection (3810), inventory management, reorder alerts, auto-billing |
| **Data Produced** | Consumption events (item, quantity, timestamp, price), inventory levels, billing records |
| **Data Needed** | Room occupancy, guest preferences (allergies/dietary), pricing catalog |
| **Current Integration** | RABTUL Pay (billing), Inventory tracking |
| **Target Integration** | TwinOS Guest Twin (preferences), Inventory Twin, Upsell Engine |

**Data Schema:**
```typescript
interface MinibarConsumption {
  bookingId: string;
  roomId: string;
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  timestamp: Date;
  detectedVia: 'weight_sensor' | 'rfid' | 'camera';
}
```

---

### 2.4 Predictive Housekeeping

| Attribute | Details |
|-----------|---------|
| **Company** | StayOwn |
| **Core Capabilities** | AI-powered housekeeping scheduling based on occupancy, guest patterns, and predictive needs |
| **Key Services** | Room readiness prediction (3826), staff scheduling, task management, supply planning |
| **Data Produced** | Predicted cleaning times, staff assignments, supply requirements, readiness scores |
| **Data Needed** | Room status, check-out times, guest preferences (tidiness), staff availability |
| **Current Integration** | REZ-Merchant housekeeping tasks |
| **Target Integration** | TwinOS Room Twin, Staff Twin, CorpPerks scheduling |

**Prediction Model Inputs:**
- Check-out time patterns (last 30 days)
- Room occupancy history
- Guest preference signals (stay duration, purpose)
- Seasonal patterns
- Special events calendar
- Staff shift patterns

---

### 2.5 Guest Memory (HOJAI Memory)

| Attribute | Details |
|-----------|---------|
| **Company** | HOJAI AI |
| **Core Capabilities** | Persistent guest context across stays, preference learning, behavioral pattern analysis |
| **Key Services** | Memory storage (4520), preference extraction, context retrieval, semantic search |
| **Data Produced** | Preference profiles, interaction history, behavioral patterns, sentiment from feedback |
| **Data Needed** | Booking data, service interactions, feedback, stay history |
| **Current Integration** | StayOwn (pre-stay surveys), AI Concierge (conversations), REZ Loyalty |
| **Target Integration** | TwinOS Guest Twin (bidirectional sync), BrandPulse (sentiment) |

**Memory Types Stored:**
| Type | Description | Example |
|------|-------------|---------|
| `preference` | Explicit guest preferences | "Pillow type: memory foam" |
| `behavior` | Inferred from actions | "Always orders late-night minibar" |
| `interaction` | Service requests | "Requested extra towels 3x" |
| `sentiment` | Feedback sentiment | "Positive about spa experience" |
| `context` | Situation awareness | "Business trip, needs early check-in" |

---

### 2.6 Upsell Engine

| Attribute | Details |
|-----------|---------|
| **Company** | StayOwn |
| **Core Capabilities** | AI-powered upselling during booking and stay with personalized offers |
| **Key Services** | Offer generation (3817), conversion tracking, A/B testing, revenue attribution |
| **Data Produced** | Offer presentations, acceptance rates, revenue lift metrics, personalization scores |
| **Data Needed** | Guest profile, booking context, available inventory, pricing rules |
| **Current Integration** | REZ-Merchant booking engine, REZ Loyalty |
| **Target Integration** | TwinOS Guest Twin, AdBazaar (cross-merchant offers), Business Copilot |

**Offer Types:**
| Category | Examples | Timing |
|----------|----------|--------|
| Room Upgrade | Suite upgrade, Pool view, Club floor | Pre-booking, Check-in |
| Dining | Restaurant credit, Breakfast package, In-room dining | Pre-booking, Stay |
| Wellness | Spa treatment, Gym pass, Yoga session | Pre-booking, Stay |
| Experience | City tour, Airport transfer, Late checkout | Pre-booking, Stay |
| Minibar | Premium snacks, Welcome package | Check-in, Stay |

---

### 2.7 REZ POS

| Attribute | Details |
|-----------|---------|
| **Company** | REZ Merchant |
| **Core Capabilities** | Multi-property POS for F&B operations, table management, kitchen display |
| **Key Services** | Order management (4081), payment processing, table tracking, kitchen routing |
| **Data Produced** | Orders, payments, table status, guest spend history, menu performance |
| **Data Needed** | Guest identity (for loyalty), room charges, dietary restrictions |
| **Current Integration** | RABTUL Pay, REZ Loyalty |
| **Target Integration** | TwinOS Guest Twin, StayOwn (room charges), Business Copilot |

**Hotel-Specific Features:**
- Room charge to Folio
- Guest loyalty auto-recognition
- Dietary flag sync from Guest Memory
- Cross-property ordering (multiple hotel restaurants)

---

### 2.8 REZ Loyalty

| Attribute | Details |
|-----------|---------|
| **Company** | REZ Merchant |
| **Core Capabilities** | Multi-tier loyalty program with points, tiers, and rewards |
| **Key Services** | Points earning/redemption (4037), tier management, reward catalog, referral program |
| **Data Produced** | Points transactions, tier changes, reward redemptions, engagement metrics |
| **Data Needed** | Guest identity, stay data, service usage, cross-merchant activity |
| **Current Integration** | StayOwn (stays), REZ POS (spend), RABTUL Wallet |
| **Target Integration** | TwinOS Guest Twin, AdBazaar (earn on ads), BrandPulse (reputation-based perks) |

**Tier Benefits:**
| Tier | Points | Multiplier | Benefits |
|------|--------|------------|----------|
| Bronze | 0 | 1x | Basic rewards, Birthday bonus |
| Silver | 5,000 | 1.25x | 10% bonus, Priority support, Early check-in |
| Gold | 20,000 | 1.5x | 50% bonus, Free upgrades, Late checkout |
| Platinum | 50,000 | 2x | 100% bonus, Suite upgrades, Personal concierge |

---

### 2.9 BrandPulse

| Attribute | Details |
|-----------|---------|
| **Company** | HOJAI AI |
| **Core Capabilities** | Multi-source brand reputation monitoring, sentiment analysis, crisis early warning |
| **Key Services** | Sentiment tracking (4770), aspect analysis, review aggregation, trend prediction |
| **Data Produced** | Sentiment scores, aspect ratings, crisis alerts, competitor benchmarks |
| **Data Needed** | Brand/company names, review sources, notification channels |
| **Current Integration** | Standalone monitoring |
| **Target Integration** | TwinOS Property Twin, Business Copilot (alerts), REZ Loyalty (reputation perks) |

**Data Sources:**
- Google Reviews
- TripAdvisor
- Booking.com
- Expedia
- Yelp
- Facebook
- Instagram
- Twitter/X

---

## 3. Twin Architecture

### 3.1 Core Twins for Hotel & Hospitality OS

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         TWIN ECOSYSTEM                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐     │
│  │                        GUEST TWIN (Primary)                        │     │
│  │  Port: 4860 | Type: Customer | ID: guest_{uuid}                   │     │
│  ├─────────────────────────────────────────────────────────────────────┤     │
│  │  Attributes:                                                        │     │
│  │  - identity: { name, email, phone, passport }                      │     │
│  │  - preferences: { room, dining, wellness, communication }          │     │
│  │  - behavior: { patterns, spend, frequency, purpose }               │     │
│  │  - loyalty: { tier, points, history, benefits }                    │     │
│  │  - sentiment: { overall, byAspect, trends }                        │     │
│  │  - predictions: { nextStay, upsellProbability, churnRisk }         │     │
│  └─────────────────────────────────────────────────────────────────────┘     │
│                              │                                              │
│         ┌────────────────────┼────────────────────┐                       │
│         │                    │                    │                        │
│  ┌──────▼──────┐    ┌───────▼──────┐    ┌──────▼──────┐                │
│  │  ROOM TWIN  │    │ PROPERTY     │    │  STAFF      │                │
│  │             │    │ TWIN         │    │  TWIN       │                │
│  │  Type: Asset│    │  Type: Org   │    │  Type: Emp  │                │
│  │  ID: room_  │    │  ID: hotel_  │    │  ID: emp_   │                │
│  └─────────────┘    └──────────────┘    └─────────────┘                │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                     RELATIONSHIP GRAPH                               │  │
│  ├─────────────────────────────────────────────────────────────────────┤  │
│  │  Guest ──stays_at──▶ Property                                        │  │
│  │  Guest ──assigned──▶ Room                                            │  │
│  │  Guest ──earns──▶ Loyalty                                            │  │
│  │  Guest ──consumes──▶ Services (Minibar, Spa, Restaurant)             │  │
│  │  Property ──employs──▶ Staff                                         │  │
│  │  Room ──contains──▶ IoT Devices                                      │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Guest Twin Data Model

```typescript
// Guest Twin Schema
interface GuestTwin {
  // Identity
  twinId: string;                    // "guest_{uuid}"
  createdAt: Date;
  updatedAt: Date;
  
  // Core Identity
  identity: {
    name: {
      first: string;
      last: string;
      display: string;
    };
    contact: {
      email: string;
      phone: string;
      countryCode: string;
    };
    documents: {
      passport?: string;
      nationalId?: string;
      driverLicense?: string;
    };
    verified: boolean;
    trustScore: number;              // 0-100
  };
  
  // Preferences (from Guest Memory)
  preferences: {
    room: {
      bedType: 'king' | 'twin' | 'queen';
      pillowType: 'memory_foam' | 'feather' | 'orthopedic';
      temperature: { min: number; max: number; preferred: number };
      lighting: 'bright' | 'dim' | 'natural';
      floorPreference: 'high' | 'low' | 'no_preference';
      viewPreference: 'city' | 'pool' | 'garden' | 'no_preference';
    };
    dining: {
      dietaryRestrictions: string[];
      cuisinePreferences: string[];
      mealTimes: { breakfast: string; lunch: string; dinner: string };
      minibarPreferences: string[];     // Items they always buy
      allergies: string[];
    };
    wellness: {
      spaInterest: boolean;
      gymInterest: boolean;
      preferredTreatments: string[];
      fitnessGoals: string[];
    };
    communication: {
      preferredChannel: 'whatsapp' | 'sms' | 'email' | 'app';
      language: string;
      privacyLevel: 'minimal' | 'standard' | 'high';
    };
  };
  
  // Behavior Patterns (learned over time)
  behavior: {
    stayPatterns: {
      avgStayDuration: number;         // nights
      mostFrequentPurpose: 'business' | 'leisure' | 'medical' | 'other';
      preferredCheckInTime: string;    // "14:00"
      preferredCheckOutTime: string;   // "11:00"
      seasonalPatterns: string[];      // ["summer", "christmas"]
    };
    spendingPatterns: {
      avgDailySpend: number;
      highSpendCategories: string[];
      discountSensitivity: number;    // 0-1
      upsellConversionRate: number;    // 0-1
    };
    servicePatterns: {
      minibarFrequency: 'daily' | 'occasional' | 'rare';
      restaurantDining: 'every_meal' | 'sometimes' | 'rare';
      spaUsage: 'always' | 'sometimes' | 'never';
      roomServiceUsage: 'frequent' | 'occasional' | 'never';
    };
  };
  
  // Loyalty Status
  loyalty: {
    memberId: string;
    tier: 'bronze' | 'silver' | 'gold' | 'platinum';
    pointsBalance: number;
    lifetimePoints: number;
    tierHistory: Array<{
      tier: string;
      achievedAt: Date;
    }>;
    benefits: string[];
    nextTierProgress: number;         // 0-100%
    pointsToNextTier: number;
  };
  
  // Sentiment (from BrandPulse + Feedback)
  sentiment: {
    overall: number;                   // -1 to 1
    byAspect: {
      room: number;
      service: number;
      dining: number;
      cleanliness: number;
      value: number;
    };
    trend: 'improving' | 'stable' | 'declining';
    lastFeedbackAt: Date;
    npsScore: number;                  // 0-10
  };
  
  // AI Predictions
  predictions: {
    nextStayDate: Date | null;
    nextStayPurpose: string;
    upsellProbability: {
      roomUpgrade: number;
      spaTreatment: number;
      diningPackage: number;
      minibarPremium: number;
    };
    churnRisk: number;                // 0-1
    lifetimeValue: number;
    preferredOffers: string[];        // Offer IDs most likely to convert
  };
  
  // Relationships
  relationships: {
    linkedGuests: string[];          // Family, colleagues
    companyId: string | null;         // Corporate account
    travelAgentId: string | null;
    pastProperties: string[];        // Properties stayed at
    pastRooms: string[];              // Rooms previously assigned
  };
  
  // Metadata
  metadata: {
    source: 'direct' | 'ota' | 'corporate' | 'travel_agent';
    crmId: string;
    firstStayAt: Date;
    totalStays: number;
    lastStayAt: Date;
    lastInteractionAt: Date;
    tags: string[];
  };
}
```

### 3.3 Room Twin Data Model

```typescript
// Room Twin Schema
interface RoomTwin {
  twinId: string;                    // "room_{propertyId}_{roomNumber}"
  
  // Physical Attributes
  physical: {
    roomNumber: string;
    floor: number;
    type: 'standard' | 'deluxe' | 'suite' | 'penthouse';
    bedConfiguration: 'king' | 'twin' | 'queen' | 'triple';
    maxOccupancy: number;
    size: { sqft: number; sqm: number };
    view: 'city' | 'pool' | 'garden' | 'sea' | 'courtyard';
    amenities: string[];
    accessibility: boolean;
  };
  
  // Current Status
  status: {
    currentState: 'vacant_clean' | 'vacant_dirty' | 'occupied' | 'out_of_order' | 'maintenance';
    guestId: string | null;
    bookingId: string | null;
    checkIn: Date | null;
    checkOut: Date | null;
    expectedVacancy: Date | null;
    housekeeperId: string | null;
    lastCleanedAt: Date;
    nextScheduledClean: Date;
  };
  
  // IoT Devices
  iot: {
    smartLockId: string;
    thermostatId: string;
    lights: string[];
    tvId: string;
    minibarId: string;
    sensors: Array<{
      type: 'motion' | 'door' | 'temperature' | 'humidity';
      deviceId: string;
      lastReading: Date;
    }>;
  };
  
  // Maintenance
  maintenance: {
    lastInspection: Date;
    nextInspection: Date;
    issues: Array<{
      category: string;
      description: string;
      reportedAt: Date;
      status: 'open' | 'in_progress' | 'resolved';
    }>;
    replacementSchedule: Array<{
      item: string;
      expectedLife: number;
      nextReplacement: Date;
    }>;
  };
  
  // Performance Metrics
  performance: {
    occupancyRate: number;           // Last 30 days
    avgDailyRate: number;
    revenuePerAvailableRoom: number;
    cleaningTimeAvg: number;         // minutes
    issuesPerStay: number;
  };
  
  // Property Reference
  propertyId: string;
}
```

### 3.4 Property Twin Data Model

```typescript
// Property Twin Schema
interface PropertyTwin {
  twinId: string;                    // "property_{id}"
  
  // Identity
  identity: {
    name: string;
    brand: string;
    starRating: number;
    propertyType: 'city_hotel' | 'resort' | 'boutique' | 'capsule' | 'villa';
    chain: string | null;
    yearOpened: number;
    lastRenovated: Date;
  };
  
  // Location
  location: {
    address: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    coordinates: { lat: number; lng: number };
    timezone: string;
    nearbyLandmarks: string[];
    nearbyTransport: string[];
  };
  
  // Inventory
  inventory: {
    totalRooms: number;
    roomTypes: Array<{
      type: string;
      count: number;
      baseRate: number;
    }>;
    facilities: string[];
    dining: Array<{
      outlet: string;
      type: 'restaurant' | 'bar' | 'cafe' | 'room_service';
      seats: number;
    }>;
    events: Array<{
      space: string;
      capacity: number;
    }>;
  };
  
  // Operations
  operations: {
    checkInTime: string;
    checkOutTime: string;
    frontDeskHours: string;
    conciergeAvailable: boolean;
    parking: { available: boolean; type: 'valet' | 'self' | 'both' };
    airportTransfer: boolean;
  };
  
  // Staff
  staff: {
    totalStaff: number;
    departments: Array<{
      name: string;
      headcount: number;
      managerId: string;
    }>;
    shifts: Array<{
      type: 'morning' | 'afternoon' | 'night';
      staffCount: number;
    }>;
  };
  
  // Financial
  financial: {
    revPAR: number;
    avgDailyRate: number;
    occupancyRate: number;
    totalRevenue: number;
    f&BRevenue: number;
    otherRevenue: number;
  };
  
  // Reputation (from BrandPulse)
  reputation: {
    overallRating: number;
    ratingsBySource: Record<string, number>;
    sentimentScore: number;
    reviewCount: number;
    trending: 'up' | 'down' | 'stable';
    crisisAlerts: Array<{
      severity: 'low' | 'medium' | 'high' | 'critical';
      message: string;
      detectedAt: Date;
    }>;
  };
  
  // Relationships
  relationships: {
    parentCompanyId: string | null;
    franchiseId: string | null;
    managementCompanyId: string | null;
    partnerMerchants: string[];      // Nearby restaurants, spas
  };
}
```

### 3.5 Twin Relationships

| Relationship | Source Twin | Target Twin | Cardinality |
|--------------|-------------|-------------|-------------|
| `stays_at` | Guest | Property | N:1 |
| `assigned_to` | Guest | Room | N:1 |
| `located_in` | Room | Property | N:1 |
| `employs` | Property | Staff | 1:N |
| `assigned_to` | Staff | Room | N:M |
| `member_of` | Guest | Loyalty | 1:1 |
| `books` | Guest | Booking | 1:N |
| `consumes` | Guest | Service | N:M |
| `contains` | Room | IoTDevice | 1:N |
| `partners_with` | Property | Merchant | N:M |
| `belongs_to` | Room | RoomType | N:1 |

### 3.6 Agents Interacting with Twins

| Agent | Manages | Access Level |
|-------|---------|--------------|
| **Concierge Agent** | Guest Twin | Read/Write preferences, predictions |
| **Booking Agent** | Guest Twin, Room Twin | Read/Write bookings |
| **Housekeeping Agent** | Room Twin, Staff Twin | Read/Write status, assignments |
| **Revenue Agent** | Property Twin, Room Twin | Read pricing, write rates |
| **Upsell Agent** | Guest Twin | Read preferences, predictions |
| **Loyalty Agent** | Guest Twin | Read/Write loyalty status |
| **Payment Agent** | Guest Twin | Read payment methods |
| **Sentiment Agent** | Property Twin, Guest Twin | Write sentiment data |

---

## 4. Integration Flows

### 4.1 Guest Memory ↔ TwinOS Integration

**Critical Integration Point:** Guest Memory serves as the operational memory layer while TwinOS provides the unified digital twin representation.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    GUEST MEMORY ↔ TWINOS FLOW                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────┐                    ┌──────────────────┐              │
│  │   GUEST MEMORY   │                    │     TWINOS       │              │
│  │   (Port 4520)    │                    │   (Port 4860)    │              │
│  └────────┬─────────┘                    └────────┬─────────┘              │
│           │                                      │                        │
│           │  ┌──────────────────────────────────┴───────────┐            │
│           │  │                                            │              │
│           ▼  │    Bidirectional Sync                      │            │
│  ┌──────────────────────────────────────────────────────────────┐        │
│  │                      SYNC LAYER                              │        │
│  │  - Memory → Twin: Preferences, behavior, interactions        │        │
│  │  - Twin → Memory: Predictions, relationships, context        │        │
│  │  - Conflict Resolution: Twin wins for identity              │        │
│  │  - Conflict Resolution: Memory wins for preferences          │        │
│  └──────────────────────────────────────────────────────────────┘        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Sync Events:**

| Event | Direction | Payload | Trigger |
|-------|-----------|---------|----------|
| `guest.preference.updated` | Memory → Twin | Preference object | After preference change |
| `guest.behavior.learned` | Memory → Twin | Behavior pattern | After pattern detection |
| `guest.prediction.generated` | Twin → Memory | Prediction object | On prediction request |
| `guest.interaction.recorded` | Both | Interaction data | After any interaction |
| `guest.relationship.linked` | Twin → Memory | Relationship data | On relationship change |

**API Contracts:**

```typescript
// Memory → Twin Sync
POST /api/twin/guest/sync
{
  source: 'memory',
  guestId: string,
  data: {
    preferences?: GuestPreferences,
    behaviors?: BehaviorPattern[],
    interactions?: Interaction[]
  },
  timestamp: Date
}

// Twin → Memory Sync
POST /api/memory/guest/sync
{
  source: 'twin',
  guestId: string,
  data: {
    predictions?: AIPredictions,
    relationships?: Relationship[],
    context?: ContextUpdate
  },
  timestamp: Date
}

// Conflict Resolution
GET /api/twin/guest/:guestId/conflicts
// Returns any conflicts for manual resolution
```

---

### 4.2 Booking → Guest Twin Enrichment Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    BOOKING → GUEST TWIN ENRICHMENT                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐                │
│  │   REZ PMS   │────▶│   TWINOS    │────▶│ GUEST MEMORY │                │
│  │  (Port 4031)│     │  (Port 4860)│     │  (Port 4520) │                │
│  └──────────────┘     └──────────────┘     └──────────────┘                │
│         │                   │                   │                          │
│         │                   │                   │                          │
│         ▼                   ▼                   ▼                          │
│  ┌──────────────────────────────────────────────────────────────┐        │
│  │                    ENRICHMENT PIPELINE                          │        │
│  │  1. Create/Update Guest Twin from booking data                 │        │
│  │  2. Enrich with historical preferences from Memory             │        │
│  │  3. Generate predictions (upsell probability, next stay)        │        │
│  │  4. Pre-load concierge context for AI Concierge                │        │
│  │  5. Prepare pre-arrival service tasks                          │        │
│  └──────────────────────────────────────────────────────────────┘        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Data Flow:**

```typescript
// Step 1: Booking Created
interface BookingEvent {
  eventType: 'booking.created';
  bookingId: string;
  guestId: string;
  propertyId: string;
  roomId: string;
  checkIn: Date;
  checkOut: Date;
  roomType: string;
  rate: number;
  source: 'direct' | 'ota' | 'corporate';
  guestData: {
    name: string;
    email: string;
    phone: string;
  };
}

// Step 2: Twin Enrichment
interface TwinEnrichment {
  guestId: string;
  bookingId: string;
  enrichmentData: {
    historicalStays: number;
    avgSpending: number;
    loyaltyTier: string;
    preferences: GuestPreferences;
    lastStayAt: Date;
    preferredRoomType: string;
    dietaryRestrictions: string[];
    specialRequests: string[];
  };
  predictions: {
    upsellProbability: number;
    preferredOffers: string[];
    expectedSpend: number;
  };
}

// Step 3: Pre-Arrival Task Generation
interface PreArrivalTask {
  taskType: 'room_prep' | 'preference_setup' | 'welcome_package';
  guestId: string;
  bookingId: string;
  tasks: Array<{
    action: string;
    details: object;
    priority: 'high' | 'medium' | 'low';
  }>;
}
```

---

### 4.3 Smart Minibar → Inventory Twin → Guest Twin Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SMART MINIBAR INTEGRATION FLOW                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐                │
│  │  SMART      │────▶│  INVENTORY   │────▶│  GUEST TWIN │                │
│  │  MINIBAR    │     │    TWIN      │     │              │                │
│  │  (Port 3810)│     │              │     │              │                │
│  └──────────────┘     └──────────────┘     └──────────────┘                │
│         │                   │                   │                          │
│         │                   │                   │                          │
│         ▼                   ▼                   ▼                          │
│  ┌──────────────────────────────────────────────────────────────┐        │
│  │                    DATA FLOWS                                 │        │
│  │                                                                  │        │
│  │  Minibar ──consumption──▶ Inventory Twin                      │        │
│  │     │                     │                                   │        │
│  │     │                     ▼                                   │        │
│  │     │              Update stock levels                        │        │
│  │     │              Trigger reorder alerts                     │        │
│  │     │                     │                                   │        │
│  │     ▼                     ▼                                   │        │
│  │  Guest Twin ◀──consumption patterns──                         │        │
│  │     │                                                           │        │
│  │     ▼                                                           │        │
│  │  Learn guest preferences (always orders premium snacks)        │        │
│  │     │                                                           │        │
│  │     ▼                                                           │        │
│  │  Upsell Engine ◀──personalized offers──                       │        │
│  │                                                                  │        │
│  └──────────────────────────────────────────────────────────────┘        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**API Contracts:**

```typescript
// Consumption Event
POST /api/minibar/consumption
{
  bookingId: string;
  roomId: string;
  items: Array<{
    itemId: string;
    itemName: string;
    quantity: number;
    unitPrice: number;
    timestamp: Date;
  }>;
  detectedVia: 'weight_sensor' | 'rfid' | 'camera';
}

// Inventory Update
POST /api/inventory/minibar/update
{
  propertyId: string;
  roomId: string;
  items: Array<{
    itemId: string;
    newQuantity: number;
    lastRestocked: Date;
  }>;
}

// Reorder Alert
interface ReorderAlert {
  propertyId: string;
  itemId: string;
  currentStock: number;
  reorderLevel: number;
  recommendedOrder: number;
  urgency: 'low' | 'medium' | 'high';
}

// Guest Preference Learning
POST /api/guest/:guestId/preferences/minibar
{
  preferences: {
    favoriteItems: string[];
    avoidItems: string[];
    preferredBrands: string[];
    budgetRange: { min: number; max: number };
  };
  behavior: {
    avgConsumptionPerStay: number;
    favoriteTimes: string[];
    orderFrequency: 'daily' | 'occasional' | 'rare';
  };
}
```

---

### 4.4 Predictive Housekeeping Integration

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PREDICTIVE HOUSEKEEPING FLOW                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐                │
│  │   PMS       │────▶│  HOUSEKEEPING│────▶│  ROOM TWIN  │                │
│  │             │     │    AGENT     │     │              │                │
│  └──────────────┘     └──────────────┘     └──────────────┘                │
│         │                   │                   │                          │
│         │                   │                   │                          │
│         ▼                   ▼                   ▼                          │
│  ┌──────────────────────────────────────────────────────────────┐        │
│  │                    PREDICTION ENGINE                          │        │
│  │                                                                  │        │
│  │  Inputs:                         Outputs:                      │        │
│  │  - Check-out schedules            - Cleaning task assignments   │        │
│  │  - Occupancy patterns             - Staff shift recommendations │        │
│  │  - Guest preferences              - Supply requirements         │        │
│  │  - Seasonal patterns              - Room readiness predictions  │        │
│  │  - Staff availability             - Priority scores            │        │
│  │                                                                  │        │
│  └──────────────────────────────────────────────────────────────┘        │
│                                                                             │
│  ┌──────────────┐     ┌──────────────┐                                   │
│  │   STAFF      │◀────│   CORPPERKS  │                                   │
│  │    TWIN      │     │   (Port 4700)│                                   │
│  └──────────────┘     └──────────────┘                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**API Contracts:**

```typescript
// Room Status Update
POST /api/housekeeping/room/status
{
  roomId: string;
  propertyId: string;
  status: 'vacant_clean' | 'vacant_dirty' | 'occupied' | 'out_of_order';
  lastCleanedAt: Date;
  housekeeperId: string | null;
  nextScheduledClean: Date;
}

// Prediction Request
POST /api/housekeeping/predict
{
  propertyId: string;
  targetDate: Date;
  includeStaffOptimization: boolean;
  includeSupplyPlanning: boolean;
}

// Prediction Response
interface HousekeepingPrediction {
  targetDate: Date;
  rooms: Array<{
    roomId: string;
    predictedCleanTime: Date;
    priority: number;
    assignedHousekeeperId: string;
    estimatedDuration: number; // minutes
    specialRequirements: string[];
  }>;
  staffSchedule: Array<{
    housekeeperId: string;
    shift: { start: Date; end: Date };
    assignedRooms: string[];
    breakSchedule: Date[];
  }>;
  supplyRequirements: Array<{
    item: string;
    quantity: number;
    urgency: 'low' | 'medium' | 'high';
  }>;
}

// Staff Twin Integration
GET /api/staff/:staffId/availability
{
  staffId: string;
  date: Date;
  availability: {
    available: boolean;
    shift: { start: Date; end: Date };
    skills: string[];
    currentAssignments: string[];
  };
}
```

---

### 4.5 AI Concierge → Guest Twin Context Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    AI CONCIERGE CONTEXT FLOW                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐              │
│  │   AI         │────▶│   GUEST      │────▶│   TWINOS    │              │
│  │ CONCIERGE    │     │   MEMORY     │     │              │              │
│  │  (Port 4840) │     │  (Port 4520) │     │  (Port 4860) │              │
│  └──────────────┘     └──────────────┘     └──────────────┘              │
│         │                   │                   │                        │
│         │                   │                   │                        │
│         ▼                   ▼                   ▼                          │
│  ┌──────────────────────────────────────────────────────────────┐        │
│  │                    CONTEXT ENRICHMENT                         │        │
│  │                                                                  │        │
│  │  On guest query:                                                │        │
│  │  1. Fetch Guest Twin (preferences, predictions, history)        │        │
│  │  2. Enrich with Memory (recent interactions, sentiment)         │        │
│  │  3. Generate contextual response                                │        │
│  │  4. Update Memory with conversation                             │        │
│  │                                                                  │        │
│  └──────────────────────────────────────────────────────────────┘        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**API Contracts:**

```typescript
// Concierge Context Request
POST /api/concierge/context
{
  guestId: string;
  propertyId: string;
  currentIntent: string;
  conversationHistory: Array<{
    role: 'guest' | 'concierge';
    message: string;
    timestamp: Date;
  }>;
}

// Concierge Context Response
interface ConciergeContext {
  guestId: string;
  guestTwin: {
    name: string;
    tier: string;
    preferences: GuestPreferences;
    predictions: AIPredictions;
  };
  memory: {
    recentInteractions: Interaction[];
    sentiment: SentimentData;
    contextFlags: string[];
  };
  propertyContext: {
    availableServices: Service[];
    recommendations: string[];
    upsellOpportunities: UpsellOffer[];
  };
  suggestedResponses: Array<{
    response: string;
    confidence: number;
    action?: string;
  }>;
}

// Service Request Routing
POST /api/concierge/service/request
{
  guestId: string;
  serviceType: 'room_service' | 'spa' | 'restaurant' | 'concierge' | 'housekeeping';
  request: string;
  priority: 'normal' | 'urgent';
}
```

---

### 4.6 Upsell Engine → Guest Twin Personalization

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    UPSELL PERSONALIZATION FLOW                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐              │
│  │   UPSELL    │────▶│   GUEST      │────▶│   TWINOS    │              │
│  │   ENGINE    │     │   MEMORY    │     │              │              │
│  │  (Port 3817)│     │  (Port 4520)│     │  (Port 4860) │              │
│  └──────────────┘     └──────────────┘     └──────────────┘              │
│         │                   │                   │                        │
│         │                   │                   │                        │
│         ▼                   ▼                   ▼                        │
│  ┌──────────────────────────────────────────────────────────────┐        │
│  │                    PERSONALIZATION ENGINE                     │        │
│  │                                                                  │        │
│  │  Inputs:                                                         │        │
│  │  - Guest preferences (from Twin)                                │        │
│  │  - Historical conversions (from Memory)                         │        │
│  │  - Current context (booking, stay phase)                         │        │
│  │  - Inventory availability                                        │        │
│  │                                                                  │        │
│  │  Outputs:                                                        │        │
│  │  - Personalized offer ranking                                    │        │
│  │  - Optimal timing recommendation                                 │        │
│  │  - Channel preference                                           │        │
│  │  - Expected conversion probability                              │        │
│  │                                                                  │        │
│  └──────────────────────────────────────────────────────────────┘        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**API Contracts:**

```typescript
// Personalization Request
POST /api/upsell/personalize
{
  guestId: string;
  propertyId: string;
  bookingId: string;
  stayPhase: 'pre_booking' | 'post_booking' | 'check_in' | 'stay' | 'check_out';
  context: {
    roomType: string;
    rate: number;
    nightsRemaining: number;
    currentSpend: number;
  };
}

// Personalization Response
interface UpsellPersonalization {
  guestId: string;
  offers: Array<{
    offerId: string;
    type: 'room_upgrade' | 'dining' | 'spa' | 'experience' | 'minibar';
    title: string;
    description: string;
    price: number;
    originalPrice?: number;
    discount?: number;
    probability: number;
    optimalTiming: Date;
    channel: 'app' | 'whatsapp' | 'email' | 'in_person';
    reason: string; // Why this offer for this guest
  }>;
  strategy: {
    maxOffers: number;
    recommendedOrder: string[];
    timing: Date;
  };
}

// Conversion Tracking
POST /api/upsell/track
{
  guestId: string;
  offerId: string;
  action: 'presented' | 'viewed' | 'accepted' | 'declined';
  timestamp: Date;
  metadata?: {
    channel: string;
    attemptNumber: number;
  };
}
```

---

### 4.7 REZ POS → Guest Twin Spend Tracking

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    REZ POS INTEGRATION FLOW                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐              │
│  │   REZ POS   │────▶│  GUEST TWIN │────▶│   TWINOS    │                │
│  │  (Port 4081)│     │              │     │              │                │
│  └──────────────┘     └──────────────┘     └──────────────┘                │
│         │                   │                   │                          │
│         │                   │                   │                          │
│         ▼                   ▼                   ▼                          │
│  ┌──────────────────────────────────────────────────────────────┐        │
│  │                    PAYMENT & LOYALTY FLOW                    │        │
│  │                                                                  │        │
│  │  POS Order ──room charge──▶ Folio                              │        │
│  │      │                                                           │        │
│  │      ├───payment──▶ RABTUL Pay                                  │        │
│  │      │                                                           │        │
│  │      ├───loyalty──▶ REZ Loyalty (earn points)                  │        │
│  │      │                                                           │        │
│  │      └───spend update──▶ Guest Twin (spending patterns)         │        │
│  │                                                                  │        │
│  └──────────────────────────────────────────────────────────────┘        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**API Contracts:**

```typescript
// Order with Room Charge
POST /api/pos/order
{
  guestId: string;
  bookingId: string;
  roomId: string;
  items: Array<{
    itemId: string;
    name: string;
    quantity: number;
    price: number;
    category: string;
  }>;
  paymentMethod: 'room_charge' | 'card' | 'wallet' | 'loyalty';
  chargeToFolio: boolean;
  dietaryFlags?: string[]; // From Guest Memory
}

// Folio Update
interface FolioUpdate {
  bookingId: string;
  guestId: string;
  charges: Array<{
    type: 'room' | 'minibar' | 'restaurant' | 'spa' | 'other';
    description: string;
    amount: number;
    timestamp: Date;
  }>;
  payments: Array<{
    method: string;
    amount: number;
    reference: string;
  }>;
  balance: number;
}

// Loyalty Points Earning
POST /api/loyalty/earn
{
  guestId: string;
  transactionType: 'stay' | 'dining' | 'spa' | 'minibar' | 'other';
  amount: number;
  propertyId: string;
  bookingId?: string;
  description: string;
}

// Spend Pattern Update
POST /api/guest/:guestId/spend
{
  guestId: string;
  category: string;
  amount: number;
  propertyId: string;
  timestamp: Date;
  paymentMethod: string;
}
```

---

### 4.8 BrandPulse → Property Twin Reputation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    BRAND PULSE INTEGRATION FLOW                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐              │
│  │  BRAND      │────▶│  PROPERTY   │────▶│   TWINOS    │                │
│  │  PULSE      │     │    TWIN     │     │              │                │
│  │  (Port 4770)│     │              │     │              │                │
│  └──────────────┘     └──────────────┘     └──────────────┘                │
│         │                   │                   │                          │
│         │                   │                   │                          │
│         ▼                   ▼                   ▼                          │
│  ┌──────────────────────────────────────────────────────────────┐        │
│  │                    REPUTATION SYNC                            │        │
│  │                                                                  │        │
│  │  BrandPulse:               Property Twin:                      │        │
│  │  - Sentiment scores         - Overall rating                    │        │
│  │  - Aspect analysis          - Ratings by source                 │        │
│  │  - Crisis alerts            - Sentiment trends                  │        │
│  │  - Review aggregation      - Crisis alerts                      │        │
│  │                                                                  │        │
│  └──────────────────────────────────────────────────────────────┘        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**API Contracts:**

```typescript
// Reputation Sync Event
POST /api/property/reputation/sync
{
  source: 'brandpulse',
  propertyId: string;
  data: {
    overallRating: number;
    ratingsBySource: Record<string, number>;
    sentimentScore: number;
    reviewCount: number;
    aspects: {
      room: number;
      service: number;
      cleanliness: number;
      value: number;
      dining: number;
    };
    trend: 'improving' | 'stable' | 'declining';
    lastUpdated: Date;
  };
}

// Crisis Alert
interface CrisisAlert {
  propertyId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'negative_spike' | 'review_cluster' | 'sentiment_drop' | 'viral_content';
  message: string;
  affectedAspects: string[];
  recommendedActions: string[];
  detectedAt: Date;
  sources: string[];
}

// Guest Sentiment from Feedback
POST /api/guest/:guestId/sentiment
{
  guestId: string;
  propertyId: string;
  rating: number; // 1-10 NPS
  feedback: string;
  aspects: {
    aspect: string;
    rating: number;
    comment?: string;
  }[];
  source: 'in_app' | 'email' | 'sms' | 'ota';
  timestamp: Date;
}
```

---

### 4.9 Error Handling Strategy

**Retry Policy:**
| Error Type | Retry Attempts | Backoff | Max Wait |
|------------|----------------|---------|----------|
| Network timeout | 3 | Exponential | 30s |
| Rate limit | 5 | Linear | 60s |
| Service unavailable | 3 | Exponential | 60s |
| Validation error | 0 | N/A | N/A |
| Auth failure | 1 | None | Immediate |

**Circuit Breaker Configuration:**
```typescript
const circuitBreakerConfig = {
  failureThreshold: 5,           // Open after 5 failures
  resetTimeout: 60000,           // Try again after 60s
  halfOpenRequests: 3,           // Allow 3 test requests
  monitoringPeriod: 120000       // Calculate failure rate over 2min
};
```

**Dead Letter Queue:**
- Failed events stored in DLQ with full payload
- DLQ processing runs every 15 minutes
- Manual intervention alerts for events > 24 hours in DLQ

---

## 5. Agent Architecture

### 5.1 Hotel & Hospitality AI Agents

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    AGENT ORCHESTRATION LAYER                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │                      AGENT ORCHESTRATOR                           │    │
│  │                     (Port 4550 - HOJAI)                          │    │
│  │                                                                  │    │
│  │  Responsibilities:                                              │    │
│  │  - Route requests to appropriate agents                         │    │
│  │  - Manage agent lifecycle                                       │    │
│  │  - Handle cross-agent workflows                                 │    │
│  │  - Monitor agent health                                         │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                    │                                     │
│         ┌──────────────────────────┼──────────────────────────┐       │
│         │                          │                          │       │
│         ▼                          ▼                          ▼       │
│  ┌──────────────┐         ┌──────────────┐         ┌──────────────┐  │
│  │  CONCIERGE  │         │  BOOKING     │         │  HOUSEKEEPING│  │
│  │   AGENT     │         │   AGENT      │         │   AGENT      │  │
│  │             │         │             │         │             │  │
│  │ L2 Specialist│         │ L3 Autonom. │         │ L2 Specialist│  │
│  └──────────────┘         └──────────────┘         └──────────────┘  │
│                                                                             │
│  ┌──────────────┐         ┌──────────────┐         ┌──────────────┐  │
│  │  REVENUE    │         │  UPSELL     │         │  LOYALTY    │  │
│  │   AGENT     │         │   AGENT     │         │   AGENT     │  │
│  │             │         │             │         │             │  │
│  │ L3 Autonom. │         │ L2 Specialist│         │ L2 Specialist│  │
│  └──────────────┘         └──────────────┘         └──────────────┘  │
│                                                                             │
│  ┌──────────────┐         ┌──────────────┐         ┌──────────────┐  │
│  │  PAYMENT    │         │  SENTIMENT  │         │  INVENTORY  │  │
│  │   AGENT     │         │   AGENT     │         │   AGENT     │  │
│  │             │         │             │         │             │  │
│  │ L2 Specialist│         │ L2 Specialist│         │ L2 Specialist│  │
│  └──────────────┘         └──────────────┘         └──────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Agent Specifications

#### 5.2.1 Concierge Agent

| Attribute | Value |
|-----------|-------|
| **Agent ID** | `concierge_agent` |
| **Classification** | L2 Specialist |
| **Port** | 4840 |
| **Manages** | Guest Twin, Memory |
| **Availability** | 24/7 |

**Capabilities:**
```typescript
interface ConciergeAgentSkills {
  // Core Skills
  naturalLanguageUnderstanding: true;
  intentDetection: true;
  multiLanguageSupport: ['en', 'hi', 'ta', 'te', 'bn', 'ml', 'kn', 'mr', 'gu', 'pa'];
  
  // Domain Skills
  serviceCatalog: [
    'room_service', 'restaurant', 'spa', 'concierge', 
    'housekeeping', 'transport', 'activities', 'information'
  ];
  knowledgeBase: 'hotel_policies' | 'local_attractions' | 'restaurant_menus';
  
  // Action Skills
  serviceRequestRouting: true;
  bookingModifications: true;
  complaintHandling: true;
  upsellRecommendations: true;
}
```

**Actions:**
| Action | Description | Target System |
|--------|-------------|----------------|
| `answer_query` | Answer guest questions | Knowledge Base |
| `route_service` | Route service requests | StayOwn Services |
| `create_booking` | Book restaurant/spa | REZ PMS |
| `modify_booking` | Modify reservations | REZ PMS |
| `escalate` | Escalate to human staff | Staff App |
| `personalize` | Generate personalized response | Guest Twin |

**Prompts:**
```
You are an AI Concierge at a luxury hotel. You have access to the guest's complete 
profile including their preferences, past stays, and current booking context.

When responding to guests:
1. Always reference relevant preferences (e.g., "I know you prefer a quiet room...")
2. Offer personalized recommendations based on their history
3. Suggest upsell opportunities at appropriate moments
4. Maintain warm, professional tone
5. Know when to escalate to human staff

Guest Context:
- Name: {guest.name}
- Tier: {guest.loyalty.tier}
- Preferences: {guest.preferences}
- Current Stay: {booking.details}
```

---

#### 5.2.2 Booking Agent

| Attribute | Value |
|-----------|-------|
| **Agent ID** | `booking_agent` |
| **Classification** | L3 Autonomous |
| **Port** | 4042 |
| **Manages** | Guest Twin, Room Twin, Property Twin |
| **Availability** | 24/7 |

**Capabilities:**
```typescript
interface BookingAgentSkills {
  // Core Skills
  reservationManagement: true;
  roomAvailabilityCheck: true;
  rateCalculation: true;
  
  // Autonomous Actions
  autoConfirm: true;                    // Confirm bookings without human review
  upgradeEligibility: true;             // Determine upgrade eligibility
  waitlistManagement: true;             // Manage waitlists
  
  // Integration Skills
  otaSync: ['booking.com', 'expedia', 'agoda', 'airbnb'];
  channelManagement: true;
  pricingOptimization: true;
}
```

**Actions:**
| Action | Description | Autonomy |
|--------|-------------|----------|
| `check_availability` | Check room availability | Full |
| `create_booking` | Create new booking | Full |
| `modify_booking` | Modify existing booking | Full |
| `cancel_booking` | Cancel booking | Conditional* |
| `process_upgrade` | Process room upgrade | Full |
| `manage_waitlist` | Add/remove from waitlist | Full |

*Requires human review for cancellations within 24 hours of check-in

---

#### 5.2.3 Housekeeping Agent

| Attribute | Value |
|-----------|-------|
| **Agent ID** | `housekeeping_agent` |
| **Classification** | L2 Specialist |
| **Port** | 3826 |
| **Manages** | Room Twin, Staff Twin |
| **Availability** | Business hours + on-call |

**Capabilities:**
```typescript
interface HousekeepingAgentSkills {
  // Core Skills
  predictiveScheduling: true;
  staffOptimization: true;
  supplyPlanning: true;
  
  // Prediction Models
  cleaningTimePrediction: true;
  roomReadinessPrediction: true;
  priorityScoring: true;
  
  // Integration Skills
  corpPerksSync: true;                 // Staff scheduling
  inventoryManagement: true;            // Supplies
  iotIntegration: true;                 // Room status
}
```

**Actions:**
| Action | Description | Target System |
|--------|-------------|----------------|
| `predict_schedule` | Generate cleaning schedule | Room Twin |
| `assign_housekeeper` | Assign room to housekeeper | CorpPerks |
| `update_room_status` | Update room status | Room Twin |
| `trigger_supply_order` | Order cleaning supplies | Inventory |
| `alert_urgent` | Alert for urgent cleaning | Staff App |

---

#### 5.2.4 Revenue Agent

| Attribute | Value |
|-----------|-------|
| **Agent ID** | `revenue_agent` |
| **Classification** | L3 Autonomous |
| **Port** | 3899 |
| **Manages** | Property Twin, Room Twin |
| **Availability** | 24/7 |

**Capabilities:**
```typescript
interface RevenueAgentSkills {
  // Core Skills
  dynamicPricing: true;
  demandForecasting: true;
  competitorAnalysis: true;
  
  // Optimization
  revPAROptimization: true;
  occupancyRateOptimization: true;
  channelRateManagement: true;
  
  // Analytics
  marketTrendAnalysis: true;
  seasonalPatternRecognition: true;
  eventBasedPricing: true;
}
```

**Actions:**
| Action | Description | Frequency |
|--------|-------------|-----------|
| `update_rates` | Adjust room rates | Every 4 hours |
| `set_promotions` | Create promotional offers | Daily |
| `analyze_competitors` | Analyze competitor pricing | Daily |
| `forecast_demand` | Predict future demand | Weekly |

---

#### 5.2.5 Upsell Agent

| Attribute | Value |
|-----------|-------|
| **Agent ID** | `upsell_agent` |
| **Classification** | L2 Specialist |
| **Port** | 3817 |
| **Manages** | Guest Twin |
| **Availability** | 24/7 |

**Capabilities:**
```typescript
interface UpsellAgentSkills {
  // Core Skills
  personalization: true;
  timingOptimization: true;
  offerGeneration: true;
  
  // Prediction
  conversionPrediction: true;
  priceSensitivityAnalysis: true;
  customerLifetimeValueProjection: true;
  
  // A/B Testing
  variantTesting: true;
  conversionOptimization: true;
}
```

**Actions:**
| Action | Description | Target |
|--------|-------------|--------|
| `generate_offers` | Create personalized offers | Guest Twin |
| `select_channel` | Choose optimal channel | Guest Twin |
| `track_conversion` | Track offer performance | Analytics |
| `optimize_timing` | Optimize offer timing | Guest Twin |

---

#### 5.2.6 Loyalty Agent

| Attribute | Value |
|-----------|-------|
| **Agent ID** | `loyalty_agent` |
| **Classification** | L2 Specialist |
| **Port** | 4037 |
| **Manages** | Guest Twin (loyalty data) |
| **Availability** | 24/7 |

**Capabilities:**
```typescript
interface LoyaltyAgentSkills {
  // Core Skills
  pointsManagement: true;
  tierCalculation: true;
  benefitApplication: true;
  
  // Engagement
  engagementCampaigns: true;
  milestoneCelebrations: true;
  tierUpgradePrompts: true;
  
  // Cross-Merchant
  merchantPartnerships: true;
  multiBrandRewards: true;
}
```

**Actions:**
| Action | Description | Target |
|--------|-------------|--------|
| `earn_points` | Credit points for activity | REZ Loyalty |
| `redeem_points` | Process point redemption | REZ Loyalty |
| `check_tier` | Verify tier benefits | Guest Twin |
| `prompt_upgrade` | Encourage tier upgrade | Guest Twin |
| `sync_merchants` | Sync cross-merchant activity | AdBazaar |

---

#### 5.2.7 Payment Agent

| Attribute | Value |
|-----------|-------|
| **Agent ID** | `payment_agent` |
| **Classification** | L2 Specialist |
| **Port** | 4001 |
| **Manages** | Guest Twin (payment methods) |
| **Availability** | 24/7 |

**Capabilities:**
```typescript
interface PaymentAgentSkills {
  // Core Skills
  paymentProcessing: true;
  folioManagement: true;
  refundProcessing: true;
  
  // Methods
  paymentMethods: ['card', 'upi', 'wallet', 'room_charge', 'corporate_billing'];
  
  // Compliance
  fraudDetection: true;
  pciCompliance: true;
  multiCurrency: true;
}
```

**Actions:**
| Action | Description | Target |
|--------|-------------|--------|
| `process_payment` | Process guest payment | RABTUL Pay |
| `update_folio` | Add charges to folio | PMS |
| `settle_checkout` | Process zero-checkout | RABTUL Pay |
| `handle_refund` | Process refunds | RABTUL Pay |

---

#### 5.2.8 Sentiment Agent

| Attribute | Value |
|-----------|-------|
| **Agent ID** | `sentiment_agent` |
| **Classification** | L2 Specialist |
| **Port** | 4770 |
| **Manages** | Property Twin, Guest Twin (sentiment) |
| **Availability** | 24/7 |

**Capabilities:**
```typescript
interface SentimentAgentSkills {
  // Core Skills
  reviewAggregation: true;
  sentimentAnalysis: true;
  aspectExtraction: true;
  
  // Crisis
  crisisDetection: true;
  earlyWarning: true;
  responseGeneration: true;
  
  // Integration
  otaMonitoring: true;
  socialListening: true;
  npsTracking: true;
}
```

**Actions:**
| Action | Description | Target |
|--------|-------------|--------|
| `sync_reputation` | Sync BrandPulse data | Property Twin |
| `analyze_feedback` | Analyze guest feedback | Guest Twin |
| `detect_crisis` | Detect reputation crisis | Property Twin |
| `generate_response` | Generate review response | BrandPulse |

---

### 5.3 Agent Communication Protocol

**Message Format:**
```typescript
interface AgentMessage {
  id: string;                          // Unique message ID
  source: string;                      // Agent ID
  target: string;                      // Agent ID or 'broadcast'
  type: 'request' | 'response' | 'event' | 'alert';
  action: string;                       // Action being requested
  payload: object;                     // Action-specific data
  context: {
    guestId?: string;
    bookingId?: string;
    propertyId?: string;
  };
  timestamp: Date;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  correlationId?: string;              // For tracking request-response pairs
}
```

**Example Communication:**

```typescript
// Concierge Agent requests guest preferences from Guest Twin
{
  id: "msg_001",
  source: "concierge_agent",
  target: "guest_twin",
  type: "request",
  action: "get_preferences",
  payload: {
    guestId: "guest_abc123",
    includePredictions: true
  },
  context: {
    bookingId: "book_xyz789"
  },
  timestamp: "2026-06-12T10:30:00Z",
  priority: "normal"
}

// Guest Twin responds with preferences
{
  id: "msg_002",
  source: "guest_twin",
  target: "concierge_agent",
  type: "response",
  action: "get_preferences",
  payload: {
    preferences: {
      room: { bedType: "king", temperature: 22 },
      dining: { dietaryRestrictions: ["vegetarian"] }
    },
    predictions: {
      upsellProbability: { roomUpgrade: 0.75 }
    }
  },
  correlationId: "msg_001",
  timestamp: "2026-06-12T10:30:01Z"
}
```

---

## 6. Business Copilot Integration

### 6.1 Hotel & Hospitality Business Copilot

The Business Copilot provides natural language access to hotel operations intelligence, built on the REZ Business Copilot platform.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    BUSINESS COPILOT - HOTEL OS                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │                    NATURAL LANGUAGE INTERFACE                    │    │
│  │                                                                  │    │
│  │  "Show me today's housekeeping status"                         │    │
│  │  "Which guests are likely to upgrade?"                          │    │
│  │  "What's our NPS trend this month?"                            │    │
│  │  "Predict room availability for next weekend"                   │    │
│  │                                                                  │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                    │                                     │
│                                    ▼                                     │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    INTENT UNDERSTANDING                           │  │
│  │                                                                  │  │
│  │  Query Classification:                                           │  │
│  │  - operations: housekeeping, staff, inventory                    │  │
│  ��  - revenue: occupancy, rates, forecasting                         │  │
│  │  - guest: preferences, satisfaction, loyalty                    │  │
│  │  - marketing: campaigns, upsells, reviews                        │  │
│  │                                                                  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                    │                                     │
│                                    ▼                                     │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    DATA AGGREGATION LAYER                         │  │
│  │                                                                  │  │
│  │  TwinOS ◀──Guest Twin, Room Twin, Property Twin                  │  │
│  │  BrandPulse ◀──Sentiment, Reviews, Trends                       │  │
│  │  REZ POS ◀──Transactions, Revenue                               │  │
│  │  REZ Loyalty ◀──Points, Tiers, Engagement                       │  │
│  │                                                                  │  │
│  └─────���────────────────────────────────────────────────────────────┘  │
│                                    │                                     │
│                                    ▼                                     │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    RESPONSE GENERATION                            │  │
│  │                                                                  │  │
│  │  - Natural language answer                                       │  │
│  │  - Supporting data/charts                                        │  │
│  │  - Recommended actions                                           │  │
│  │  - Follow-up suggestions                                         │  │
│  │                                                                  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Natural Language Queries Supported

#### 6.2.1 Operations Queries

| Query Pattern | Intent | Response |
|--------------|--------|----------|
| "Show today's housekeeping status" | `ops.housekeeping.status` | Dashboard with room status breakdown |
| "Which rooms need cleaning?" | `ops.housekeeping.dirty` | List of dirty rooms with priority |
| "Staff schedule for today" | `ops.staff.schedule` | Shift schedule with assignments |
| "Predict tomorrow's housekeeping load" | `ops.housekeeping.predict` | Predicted tasks and staffing needs |
| "Minibar inventory alerts" | `ops.minibar.alerts` | Low stock items requiring reorder |
| "Maintenance issues open" | `ops.maintenance.open` | List of open maintenance tickets |

#### 6.2.2 Revenue Queries

| Query Pattern | Intent | Response |
|--------------|--------|----------|
| "Current occupancy rate" | `rev.occupancy.current` | Today's occupancy with comparison |
| "ADR for this week" | `rev.adr.weekly` | Average daily rate breakdown |
| "RevPAR trend" | `rev.revpar.trend` | RevPAR over time with chart |
| "Predict weekend occupancy" | `rev.occupancy.forecast` | 7-day occupancy prediction |
| "Rate comparison with competitors" | `rev.pricing.competitors` | Competitor rate analysis |
| "Best performing room type" | `rev.performance.roomtype` | Revenue by room type |

#### 6.2.3 Guest Experience Queries

| Query Pattern | Intent | Response |
|--------------|--------|----------|
| "Guests checking in today" | `guest.checkin.today` | List with preferences summary |
| "VIP guests this week" | `guest.vip.list` | Platinum/Gold guests |
| "Guests likely to upgrade" | `guest.upsell.candidates` | Ranked upgrade candidates |
| "Dietary restrictions today" | `guest.dietary.active` | Guests with restrictions |
| "Repeat guests" | `guest.repeat.list` | Guests with 2+ stays |
| "Guests with special requests" | `guest.requests.active` | Pending special requests |

#### 6.2.4 Loyalty & Marketing Queries

| Query Pattern | Intent | Response |
|--------------|--------|----------|
| "New loyalty members this month" | `loyalty.new.members` | New enrollments list |
| "Points redemptions today" | `loyalty.redemption.daily` | Redemption summary |
| "Tier upgrade candidates" | `loyalty.upgrade.candidates` | Guests near tier threshold |
| "Campaign performance" | `marketing.campaign.perf` | Active campaign metrics |
| "Upsell conversion rate" | `marketing.upsell.rate` | Conversion by offer type |
| "Cross-merchant offers" | `marketing.crossmerchant.active` | Active partner offers |

#### 6.2.5 Reputation Queries

| Query Pattern | Intent | Response |
|--------------|--------|----------|
| "NPS score this month" | `rep.nps.monthly` | NPS trend and breakdown |
| "Sentiment trend" | `rep.sentiment.trend` | Sentiment over time |
| "Recent negative reviews" | `rep.reviews.negative` | Recent 1-2 star reviews |
| "Crisis alerts" | `rep.crisis.active` | Active crisis warnings |
| "Review response rate" | `rep.response.rate` | Response time metrics |
| "Comparison with competitors" | `rep.competitor.compare` | Competitor reputation comparison |

### 6.3 Dashboard Views

#### 6.3.1 Operations Dashboard

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ OPERATIONS DASHBOARD                                    Jun 12, 2026     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────┐  ┌─────────────────────────┐                  │
│  │    ROOM STATUS         │  │   HOUSEKEEPING QUEUE     │                  │
│  │                         │  │                          │                  │
│  │  Occupied:  142  71%   │  │  Pending:   23          │                  │
│  │  Vacant:     58  29%  │  │  In Progress: 8         │                  │
│  │  OOO:         0   0%  │  │  Completed: 89         │                  │
│  │  Maint:       0   0%   │  │  On Time:   94%         │                  │
│  │                         │  │                          │                  │
│  └─────────────────────────┘  └─────────────────────────┘                  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  ROOM STATUS GRID                                                  │  │
│  │  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐   │  │
│  │  │101 │ │102 │ │103 │ │104 │ │105 │ │106 │ │107 │ │108 │ │109 │   │  │
│  │  │🟢  │ │🟡  │ │🟢  │ │🔴  │ │🟢  │ │🟡  │ │🟢  │ │🟢  │ │🟡  │   │  │
│  │  │    │ │    │ │    │ │    │ │    │ │    │ │    │ │    │ │    │   │  │
│  │  └────┘ └────┘ └────┘ └────┘ └────┘ └────┘ └────┘ └────┘ └────┘   │  │
│  │  🟢 Clean  🟡 Dirty  🔴 Occupied  ⚫ OOO                        │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─────────────────────────┐  ┌─────────────────────────┐                  │
│  │   STAFF ON DUTY         │  │   MINIBAR ALERTS        │                  │
│  │                          │  │                          │                  │
│  │  Housekeepers: 12/15     │  │  Low Stock: 5 items     │                  │
│  │  Front Desk:    4/4     │  │  Reorder Needed: 3      │                  │
│  │  Concierge:     2/2     │  │  Out of Stock: 0       │                  │
│  │  Maintenance:   2/3     │  │                          │                  │
│  │                         │  │                          │                  │
│  └─────────────────────────┘  └─────────────────────────┘                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 6.3.2 Revenue Dashboard

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ REVENUE DASHBOARD                                    Jun 12, 2026        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐   │
│  │   OCCUPANCY  │ │      ADR      │ │    REVPAR    │ │   REVENUE     │   │
│  │              │ │              │ │              │ │               │   │
│  │    71.2%    │ │   ₹4,850     │ │   ₹3,453     │ │   ₹12,45,000  │   │
│  │   +3.2% ↑   │ │   +5.1% ↑    │ │   +8.4% ↑    │ │   +12.3% ↑    │   │
│  │   vs last   │ │   vs last    │ │   vs last    │ │   MTD         │   │
│  │   week      │ │   week       │ │   week       │ │               │   │
│  └───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  7-DAY OCCUPANCY TREND                                             │  │
│  │                                                                  │  │
│  │  100% ┤                              ████                         │  │
│  │   80% ┤                    ████      ████    ████                 │  │
│  │   60% ┤          ████      ████ ████  ████ ████ ████              │  │
│  │   40% ┤  ████    ████ ████  ████ ████ ████ ████ ████              │  │
│  │   20% ┤  ████ ████ ████ ████ ████ ████ ████ ████ ████              │  │
│  │    0% ┼─────────────────────────────────────────────────────────  │  │
│  │        Mon   Tue   Wed   Thu   Fri   Sat   Sun                    │  │
│  │                                                                  │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─────────────────────────┐  ┌─────────────────────────┐                  │
│  │   ROOM TYPE BREAKDOWN   │  │   REVENUE BY OUTLET      │                  │
│  │                          │  │                          │                  │
│  │  Standard:  45%  ₹5,200 │  │  Rooms:      68%        │                  │
│  │  Deluxe:    35%  ₹7,500 │  │  F&B:        22%         │                  │
│  │  Suite:     15% ₹15,000  │  │  Minibar:     5%        │                  │
│  │  Penthouse:  5% ₹25,000 │  │  Spa:         3%         │                  │
│  │                          │  │  Other:       2%         │                  │
│  └─────────────────────────┘  └─────────────────────────┘                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 6.3.3 Guest Experience Dashboard

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ GUEST EXPERIENCE DASHBOARD                           Jun 12, 2026         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐   │
│  │      NPS      │ │  SATISFACTION │ │   LOYALTY    │ │   UPSELL     │   │
│  │              │ │              │ │   MEMBERS    │ │   CONVERSION │   │
│  │     72       │ │    4.2/5     │ │     1,847    │ │    34.5%     │   │
│  │   +5 pts ↑   │ │   +0.2 ↑     │ │   +89 this  │ │   +8.2% ↑    │   │
│  │   MTD        │ │   MTD        │ │   month      │ │   MTD        │   │
│  └───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  GUEST CHECK-INS TODAY (12)                                         │  │
│  │                                                                  │  │
│  │  ┌────────────────────────────────────────────────────────────┐   │  │
│  │  │ 🏠 John Smith           │ Platinum │ 2 nights │ Business │   │  │
│  │  │    Preferences: King bed, 22°C, Early check-in           │   │  │
│  │  │    Upsell: Room Upgrade (75% likely)                     │   │  │
│  │  ├────────────────────────────────────────────────────────────┤   │  │
│  │  │ 🏠 Priya Sharma         │ Gold     │ 3 nights │ Leisure  │   │  │
│  │  │    Preferences: Twin beds, Gym access, Vegetarian         │   │  │
│  │  │    Upsell: Spa Package (60% likely)                      │   │  │
│  │  ├────────────────────────────────────────────────────────────┤   │  │
│  │  │ 🏠 Michael Chen         │ Silver   │ 1 night  │ Business │   │  │
│  │  │    Preferences: High floor, Quiet room                   │   │  │
│  │  │    Upsell: Late Checkout (45% likely)                   │   │  │
│  │  └────────────────────────────────────────────────────────────┘   │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─────────────────────────┐  ┌─────────────────────────┐                  │
│  │   TIER DISTRIBUTION     │  │   TOP PREFERENCES       │                  │
│  │                          │  │                          │                  │
│  │  Platinum:   12%        │  │  Room: King bed (65%)   │                  │
│  │  Gold:       28%        │  │  Temp: 22°C (72%)       │                  │
│  │  Silver:     35%        │  │  Pillow: Memory (55%)   │                  │
│  │  Bronze:     25%        │  │  Breakfast: Buffet(80%)|                  │
│  │                          │  │                          │                  │
│  └─────────────────────────┘  └─────────────────────────┘                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Economic Integration

### 7.1 Payment Flows

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PAYMENT FLOW ARCHITECTURE                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    GUEST PAYMENT TOUCHPOINTS                          │  │
│  │                                                                  │  │
│  │  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐          │  │
│  │  │  REZ   │    │  SMART  │    │   REZ   │    │   SPA   │          │  │
│  │  │   POS  │    │  MINIBAR│    │  REST.  │    │BOOKING  │          │  │
│  │  └────┬────┘    └────┬────┘    └────┬────┘    └────┬────┘          │  │
│  │       │             │             │             │                  │  │
│  │       └─────────────┼─────────────┼─────────────┘                  │  │
│  │                     │             │                                 │  │
│  │                     ▼             ▼                                 │  │
│  │              ┌─────────────────────────────────────────────┐     │  │
│  │              │              FOLIO MANAGEMENT                  │     │  │
│  │              │                                             │     │  │
│  │              │  - Centralized guest bill                   │     │  │
│  │              │  - Real-time charge aggregation             │     │  │
│  │              │  - Multi-outlet tracking                    │     │  │
│  │              │  - Tax calculation                          │     │  │
│  │              └─────────────────────┬───────────────────────┘     │  │
│  │                                    │                             │  │
│  │                                    ▼                             │  │
│  │              ┌─────────────────────────────────────────────┐     │  │
│  │              │           RABTUL PAY (Port 4001)             │     │  │
│  │              │                                             │     │  │
│  │              │  Payment Methods:                          │     │  │
│  │              │  - Credit/Debit Card                        │     │  │
│  │              │  - UPI (Google Pay, PhonePe, Paytm)          │     │  │
│  │              │  - REZ Wallet                               │     │  │
│  │              │  - Corporate Billing                       │     │  │
│  │              │  - Loyalty Points Redemption               │     │  │
│  │              └─────────────────────┬───────────────────────┘     │  │
│  │                                    │                             │  │
│  │                                    ▼                             │  │
│  │              ┌─────────────────────────────────────────────┐     │  │
│  │              │          RABTUL WALLET (Port 4004)           │     │  │
│  │              │                                             │     │  │
│  │              │  - REZ Coins balance                        │     │  │
│  │              │  - Cashback accumulation                   │     │  │
│  │              │  - Auto-topup rules                        │     │  │
│  │              │  - Cross-merchant balance                  │     │  │
│  │              └─────────────────────────────────────────────┘     │  │
│  │                                                                  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Payment API Contracts

```typescript
// Payment Initiation
interface PaymentRequest {
  guestId: string;
  bookingId: string;
  amount: number;
  currency: 'INR' | 'USD' | 'AED';
  method: 'card' | 'upi' | 'wallet' | 'points' | 'corporate';
  description: string;
  splitPayments?: Array<{
    method: string;
    amount: number;
  }>;
  metadata: {
    source: 'pos' | 'minibar' | 'restaurant' | 'spa' | 'room' | 'checkout';
    propertyId: string;
    outletId?: string;
  };
}

// Payment Response
interface PaymentResponse {
  transactionId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  amount: number;
  method: string;
  gatewayReference: string;
  timestamp: Date;
  receipt: {
    number: string;
    url: string;
  };
}

// Folio Settlement (Zero-Checkout)
interface FolioSettlement {
  bookingId: string;
  guestId: string;
  charges: {
    category: string;
    description: string;
    amount: number;
    tax: number;
  }[];
  payments: {
    method: string;
    amount: number;
    reference: string;
  }[];
  totalCharges: number;
  totalPayments: number;
  balance: number;
  settlementMethod: 'auto' | 'manual';
  autoPayMethod?: string;
}
```

### 7.3 Rewards & Loyalty Integration

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    LOYALTY & REWARDS FLOW                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    POINTS EARNING TOUCHPOINTS                         │  │
│  │                                                                  │  │
│  │  Stay Earn    │  F&B Earn    │  Minibar Earn  │  Spa Earn          │  │
│  │  10 pts/₹100  │  5 pts/₹100 │  5 pts/₹100   │  5 pts/₹100        │  │
│  │      │       │      │       │       │       │       │             │  │
│  │      └───────┼───────┼───────┼───────┼───────┼───────┘             │  │
│  │              │       │       │       │       │                     │  │
│  │              ▼       ▼       ▼       ▼       ▼                     │  │
│  │       ┌─────────────────────────────────────────────┐              │  │
│  │       │         REZ LOYALTY (Port 4037)              │              │  │
│  │       │                                             │              │  │
│  │       │  - Tier-based multipliers                  │              │  │
│  │       │  - Bonus point campaigns                   │              │  │
│  │       │  - Partner merchant earnings              │              │  │
│  │       └─────────────────────┬─────────────────────┘              │  │
│  │                             │                                     │  │
│  │                             ▼                                     │  │
│  │       ┌─────────────────────────────────────────────┐              │  │
│  │       │         RABTUL WALLET (Port 4004)             │              │  │
│  │       │                                             │              │  │
│  │       │  - REZ Coins balance                        │              │  │
│  │       │  - 1 REZ Coin = ₹1 value                   │              │  │
│  │       │  - Auto-conversion option                  │              │  │
│  │       └─────────────────────┬───────────────────────┘              │  │
│  │                             │                                     │  │
│  │                             ▼                                     │  │
│  │       ┌─────────────────────────────────────────────┐              │  │
│  │       │         GUEST TWIN (Loyalty Data)            │              │  │
│  │       │                                             │              │  │
│  │       │  - Points balance                          │              │  │
│  │       │  - Tier status                              │              │  │
│  │       │  - Benefit eligibility                     │              │  │
│  │       │  - Earning history                         │              │  │
│  │       └─────────────────────────────────────────────┘              │  │
│  │                                                                  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐│
│  │                    REDEMPTION TOUCHPOINTS                             ││
│  │                                                                  ││
│  │  Room Upgrade  │  Restaurant  │  Minibar    │  Gift Shop           ││
│  │  (Points)      │  (Points)   │  (Points)  │  (Points)            ││
│  │      │             │            │            │       │             ││
│  │      └─────────────┼────────────┼────────────┼───────┘             ││
│  │                    │            │            │                     ││
│  │                    ▼            ▼            ▼                     ││
│  │             ┌─────────────────────────────────────────────┐        ││
│  │             │         REDEMPTION PROCESSING                 │        ││
│  │             │                                             │        ││
│  │             │  1. Validate points balance                  │        ││
│  │             │  2. Apply tier discount (if applicable)      │        ││
│  │             │  3. Deduct points from wallet               │        ││
│  │             │  4. Credit merchant (if cross-merchant)      │        ││
│  │             │  5. Update Guest Twin                       │        ││
│  │             └─────────────────────────────────────────────┘        ││
│  │                                                                  ││
│  └──────────────────────────────────────────────────────────────────────┘│
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.4 Loyalty API Contracts

```typescript
// Points Earning
interface EarnPointsRequest {
  guestId: string;
  transactionType: 'stay' | 'dining' | 'minibar' | 'spa' | 'other';
  amount: number;
  propertyId: string;
  bookingId?: string;
  description: string;
  multipliers?: {
    tierBonus: number;      // e.g., 1.5 for Gold
    campaignBonus: number;   // e.g., 2 for promotional event
  };
}

// Points Earning Response
interface EarnPointsResponse {
  transactionId: string;
  pointsEarned: number;
  bonusPoints: number;
  totalPoints: number;
  newBalance: number;
  tierProgress: {
    currentTier: string;
    nextTier: string;
    pointsToNextTier: number;
    progressPercent: number;
  };
}

// Points Redemption
interface RedeemPointsRequest {
  guestId: string;
  points: number;
  redemptionType: 'room_upgrade' | 'dining' | 'minibar' | 'merchandise' | 'external';
  propertyId: string;
  bookingId?: string;
  merchantId?: string;          // For cross-merchant redemption
}

// Tier Benefits Check
interface TierBenefitsCheck {
  guestId: string;
  requestedBenefit: string;
  eligible: boolean;
  discount?: number;
  pointsRequired?: number;
  alternativeBenefits?: string[];
}
```

### 7.5 Wallet Usage

```typescript
// Wallet Top-up
interface WalletTopup {
  guestId: string;
  amount: number;
  paymentMethod: 'card' | 'upi' | 'bank_transfer';
  autoConvert: boolean;        // Convert REZ Coins to balance
  bonusEligible: boolean;      // Check for promotional bonus
}

// Cross-Merchant Payment
interface CrossMerchantPayment {
  guestId: string;
  merchantId: string;
  amount: number;
  propertyId: string;
  description: string;
  chargeToFolio: boolean;       // Charge to hotel folio
  walletBalance: number;        // Available wallet balance
  pointsBalance: number;       // Available points
}

// Balance Inquiry
interface WalletBalance {
  guestId: string;
  cashBalance: number;          // Spendable balance
  coinsBalance: number;         // REZ Coins
  totalValue: number;           // Combined value in INR
  pendingCredits: number;       // Pending cashback
  pendingPoints: number;        // Pending points
}
```

---

## 8. Implementation Roadmap

### 8.1 Phase 1: Core Integration (Weeks 1-2)

**Objective:** Establish the foundational integrations connecting all products to TwinOS.

#### Week 1: Foundation

| Day | Task | Deliverable | Dependencies |
|-----|------|-------------|--------------|
| 1-2 | TwinOS Guest Twin Schema Finalization | Finalized Guest Twin data model | None |
| 1-2 | Guest Memory ↔ TwinOS Sync API | Sync API contracts | TwinOS schema |
| 3-4 | Guest Memory → TwinOS Integration | Bi-directional sync implemented | Sync API |
| 3-4 | Booking → Guest Twin Enrichment | Booking events enrich Guest Twin | Guest Memory sync |
| 5 | PMS Integration to TwinOS | REZ PMS connected to TwinOS | Guest Twin |
| 5 | API Gateway Configuration | Unified API gateway for Hotel OS | All services |

**Week 1 Deliverables:**
- [ ] Guest Twin schema (v1.0)
- [ ] Guest Memory ↔ TwinOS sync working
- [ ] Booking → Guest Twin enrichment pipeline
- [ ] API gateway configured

#### Week 2: Core Services

| Day | Task | Deliverable | Dependencies |
|-----|------|-------------|--------------|
| 1-2 | AI Concierge → Guest Twin Context | Concierge gets guest context | Guest Twin |
| 1-2 | Room Twin Implementation | Room digital twin with IoT | TwinOS |
| 3-4 | Property Twin Implementation | Property digital twin | TwinOS |
| 3-4 | Predictive Housekeeping → Room Twin | Housekeeping updates room status | Room Twin |
| 5 | Smart Minibar → Inventory Twin | Minibar inventory tracked | Room Twin |
| 5 | Phase 1 Integration Testing | E2E tests for core flows | All above |

**Week 2 Deliverables:**
- [ ] AI Concierge has guest context
- [ ] Room Twin operational
- [ ] Property Twin operational
- [ ] Predictive Housekeeping connected
- [ ] Smart Minibar inventory tracked
- [ ] Phase 1 E2E tests passing

**Phase 1 Architecture:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PHASE 1: CORE INTEGRATION                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐              │
│  │   REZ PMS   │────▶│   TWINOS    │◀────│ GUEST MEMORY │                │
│  │             │     │             │     │              │                │
│  │  Booking    │     │ Guest Twin  │     │  Preferences │                │
│  │  Events     │     │ Room Twin   │     │  Behaviors   │                │
│  │             │     │ Property    │     │  History     │                │
│  └──────────────┘     │ Twin        │     └──────────────┘                │
│         │              └──────────────┘              │                   │
│         │                     │                       │                   │
│         │                     │                       │                   │
│         ▼                     ▼                       ▼                   │
│  ┌──────────────────────────────────────────────────────────────┐        │
│  │                    PHASE 1 SERVICES                           │        │
│  │  - AI Concierge gets context from Guest Twin                 │        │
│  │  - Housekeeping updates Room Twin                            │        │
│  │  - Minibar inventory tracked                                 │        │
│  │  - Business Copilot queries Guest/Room/Property Twin         │        │
│  └──────────────────────────────────────────────────────────────┘        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 8.2 Phase 2: Advanced Features (Weeks 3-4)

**Objective:** Implement AI-driven personalization, upsell automation, and loyalty integration.

#### Week 3: Personalization

| Day | Task | Deliverable | Dependencies |
|-----|------|-------------|--------------|
| 1-2 | Upsell Engine → Guest Twin | Upsell engine uses guest preferences | Phase 1 |
| 1-2 | AI Concierge Personalization | Concierge personalized responses | Guest Twin |
| 3-4 | Pre-Arrival Service Integration | Pre-arrival tasks from Twin | Guest Twin |
| 3-4 | Prediction Model Training | Train upsell prediction models | Guest Twin data |
| 5 | Sentiment Agent → Property Twin | BrandPulse → Property Twin | BrandPulse API |

**Week 3 Deliverables:**
- [ ] Upsell Engine uses Guest Twin preferences
- [ ] AI Concierge personalized responses
- [ ] Pre-arrival service operational
- [ ] Prediction models trained
- [ ] BrandPulse syncs to Property Twin

#### Week 4: Loyalty & Economic

| Day | Task | Deliverable | Dependencies |
|-----|------|-------------|--------------|
| 1-2 | REZ Loyalty → Guest Twin | Loyalty data in Guest Twin | REZ Loyalty |
| 1-2 | Payment → Folio Integration | Unified folio management | RABTUL Pay |
| 3-4 | REZ POS → Guest Twin | POS transactions update spend | REZ POS |
| 3-4 | Zero-Checkout Automation | Auto-settlement on checkout | Folio, RABTUL |
| 5 | Cross-Merchant Offers | AdBazaar offers in Guest Twin | AdBazaar |

**Week 4 Deliverables:**
- [ ] Loyalty data in Guest Twin
- [ ] Unified folio management
- [ ] REZ POS → Guest Twin spend tracking
- [ ] Zero-checkout automation working
- [ ] Cross-merchant offers integrated

**Phase 2 Architecture:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PHASE 2: ADVANCED FEATURES                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    PERSONALIZATION LAYER                            │  │
│  │                                                                  │  │
│  │  Guest Twin ◀──Preferences, Behaviors, Predictions                │  │
│  │      │                                                             │  │
│  │      ├───▶ Upsell Engine (Personalized offers)                    │  │
│  │      │                                                             │  │
│  │      ├───▶ AI Concierge (Contextual responses)                     │  │
│  │      │                                                             │  │
│  │      ├───▶ Pre-Arrival (Personalized setup)                        │  │
│  │      │                                                             │  │
│  │      └───▶ Business Copilot (Guest insights)                       │  │
│  │                                                                  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    ECONOMIC LAYER                                     │  │
│  │                                                                  │  │
│  │  REZ Loyalty ◀──Points, Tiers, Benefits                           │  │
│  │      │                                                             │  │
│  │      ├───▶ Guest Twin (Loyalty data)                               │  │
│  │      │                                                             │  │
│  │      ├───▶ REZ POS (Earn points)                                    │  │
│  │      │                                                             │  │
│  │      ├───▶ Smart Minibar (Earn points)                             │  │
│  │      │                                                             │  │
│  │      └───▶ RABTUL Wallet (REZ Coins)                               │  │
│  │                                                                  │  │
│  │  RABTUL Pay ◀──Payments, Settlements                             │  │
│  │      │                                                             │  │
│  │      ├───▶ Folio (Centralized billing)                             │  │
│  │      │                                                             │  │
│  │      └───▶ Zero-Checkout (Auto-settlement)                        │  │
│  │                                                                  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    REPUTATION LAYER                                  │  │
│  │                                                                  │  │
│  │  BrandPulse ◀──Reviews, Sentiment, Alerts                         │  │
│  │      │                                                             │  │
│  │      └───▶ Property Twin (Reputation data)                         │  │
│  │                  │                                                   │  │
│  │                  └───▶ Business Copilot (Reputation insights)       │  │
│  │                                                                  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 8.3 Phase 3: Optimization (Weeks 5-6)

**Objective:** Fine-tune AI models, implement advanced analytics, and optimize performance.

#### Week 5: AI Optimization

| Day | Task | Deliverable | Dependencies |
|-----|------|-------------|--------------|
| 1-2 | Prediction Model Refinement | Improve prediction accuracy | Phase 2 data |
| 1-2 | A/B Testing Framework | Test offer personalization | Upsell Engine |
| 3-4 | Sentiment Analysis Enhancement | Better aspect extraction | BrandPulse |
| 3-4 | Crisis Detection Tuning | Improve early warning | BrandPulse |
| 5 | Agent Performance Optimization | Optimize agent response times | All agents |

**Week 5 Deliverables:**
- [ ] Prediction models refined (>85% accuracy)
- [ ] A/B testing framework operational
- [ ] Sentiment analysis enhanced
- [ ] Crisis detection tuned
- [ ] Agent performance optimized

#### Week 6: Analytics & Launch

| Day | Task | Deliverable | Dependencies |
|-----|------|-------------|--------------|
| 1-2 | Business Copilot Dashboard | Full dashboard views | All twins |
| 1-2 | Analytics Pipeline | KPI tracking and reporting | All services |
| 3-4 | Performance Optimization | Latency < 200ms for 95% | All APIs |
| 3-4 | Load Testing | 10,000 concurrent guests | All services |
| 5 | Documentation & Training | API docs, training materials | All services |
| 5 | Production Deployment | Go-live checklist complete | All above |

**Week 6 Deliverables:**
- [ ] Business Copilot dashboard complete
- [ ] Analytics pipeline operational
- [ ] Performance targets met
- [ ] Load testing passed
- [ ] Documentation complete
- [ ] Production deployment ready

**Phase 3 Architecture:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PHASE 3: OPTIMIZATION & LAUNCH                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    ANALYTICS & OPTIMIZATION                          │  │
│  │                                                                  │  │
│  │  AI Models:                      Performance:                       │  │
│  │  - Upsell prediction >85%        - API latency < 200ms             │  │
│  │  - Sentiment analysis 90%       - 99.9% uptime                     │  │
│  │  - Crisis detection < 15min     - 10K concurrent guests           │  │
│  │  - Housekeeping accuracy 90%    - Auto-scaling enabled             │  │
│  │                                                                  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    BUSINESS COPILOT                                  │  │
│  │                                                                  │  │
│  │  Natural Language Queries:                                          │  │
│  │  "Show today's NPS score"                                           │  │
│  │  "Which guests are likely to upgrade?"                              │  │
│  │  "Predict weekend occupancy"                                        │  │
│  │  "What's our RevPAR trend?"                                         │  │
│  │                                                                  │  │
│  │  Dashboard Views:                                                    │  │
│  │  - Operations Dashboard                                             │  │
│  │  - Revenue Dashboard                                               │  │
│  │  - Guest Experience Dashboard                                       │  │
│  │  - Reputation Dashboard                                             │  │
│  │                                                                  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    PRODUCTION READY                                  │  │
│  │                                                                  │  │
│  │  Monitoring:                 Security:                              │  │
│  │  - Prometheus metrics        - PCI-DSS compliant                    │  │
│  │  - Grafana dashboards        - SOC 2 Type II                        │  │
│  │  - PagerDuty alerts          - GDPR compliant                       │  │
│  │  - ELK logging               - Penetration tested                    │  │
│  │                                                                  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 8.4 Success Metrics

| Metric | Phase 1 Target | Phase 2 Target | Phase 3 Target |
|--------|----------------|----------------|----------------|
| **Guest Twin Coverage** | 80% of guests | 95% of guests | 99% of guests |
| **API Latency (p95)** | < 500ms | < 300ms | < 200ms |
| **Upsell Conversion** | Baseline | +15% | +25% |
| **Housekeeping Efficiency** | +20% | +30% | +40% |
| **Guest Satisfaction (NPS)** | +5 pts | +10 pts | +15 pts |
| **Zero-Checkout Success** | 90% | 95% | 99% |
| **Prediction Accuracy** | 70% | 80% | 85% |
| **System Uptime** | 99.5% | 99.7% | 99.9% |

---

### 8.5 Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Data Quality Issues** | High | Implement data validation at ingestion; manual review for anomalies |
| **API Rate Limits** | Medium | Implement caching layer; request batching; rate limit awareness |
| **Model Accuracy** | High | A/B testing framework; human review for edge cases; continuous training |
| **Integration Complexity** | Medium | Phased rollout; comprehensive testing; rollback plan |
| **Security Concerns** | High | PCI-DSS compliance; data encryption; access controls |
| **Performance Bottlenecks** | Medium | Load testing; auto-scaling; monitoring alerts |

---

## Appendix A: API Endpoint Summary

### TwinOS Endpoints (Port 4860)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/twin/guest` | POST | Create guest twin |
| `/api/twin/guest/:id` | GET | Get guest twin |
| `/api/twin/guest/:id` | PUT | Update guest twin |
| `/api/twin/guest/:id/sync` | POST | Sync from Guest Memory |
| `/api/twin/room` | POST | Create room twin |
| `/api/twin/room/:id` | GET | Get room twin |
| `/api/twin/room/:id/status` | PUT | Update room status |
| `/api/twin/property` | POST | Create property twin |
| `/api/twin/property/:id` | GET | Get property twin |
| `/api/twin/property/:id/reputation` | PUT | Update reputation |

### Guest Memory Endpoints (Port 4520)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/memory/guest/:id` | GET | Get guest memory |
| `/api/memory/guest/:id` | POST | Store memory |
| `/api/memory/guest/:id/preferences` | GET/PUT | Preferences |
| `/api/memory/guest/:id/search` | POST | Semantic search |
| `/api/memory/guest/:id/sync` | POST | Sync to TwinOS |

### AI Concierge Endpoints (Port 4840)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/converse` | POST | Natural language conversation |
| `/api/intent/detect` | POST | Intent detection |
| `/api/concierge/context` | POST | Get guest context |
| `/api/service/request` | POST | Route service request |

### REZ Loyalty Endpoints (Port 4037)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/members` | POST | Enroll member |
| `/api/members/:id` | GET | Get member details |
| `/api/points/earn` | POST | Earn points |
| `/api/points/redeem` | POST | Redeem points |
| `/api/tiers` | GET | Get tier info |

### BrandPulse Endpoints (Port 4770)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/brand/:company` | GET | Brand overview |
| `/api/brand/:company/sentiment` | GET | Sentiment score |
| `/api/crisis/:company/status` | GET | Crisis status |
| `/api/reputation/:company/score` | GET | Reputation score |

---

## Appendix B: Event Schema

### Core Events

```typescript
// Guest Events
interface GuestEvent {
  type: 'guest.arrived' | 'guest.departed' | 'guest.preference.updated' | 'guest.feedback';
  guestId: string;
  propertyId: string;
  timestamp: Date;
  data: object;
}

// Booking Events
interface BookingEvent {
  type: 'booking.created' | 'booking.modified' | 'booking.cancelled';
  bookingId: string;
  guestId: string;
  propertyId: string;
  timestamp: Date;
  data: object;
}

// Service Events
interface ServiceEvent {
  type: 'service.requested' | 'service.completed' | 'service.feedback';
  guestId: string;
  bookingId: string;
  serviceType: string;
  timestamp: Date;
  data: object;
}

// Payment Events
interface PaymentEvent {
  type: 'payment.initiated' | 'payment.completed' | 'payment.failed' | 'payment.refunded';
  guestId: string;
  bookingId: string;
  amount: number;
  method: string;
  timestamp: Date;
  data: object;
}
```

---

## Appendix C: Environment Variables

```bash
# TwinOS
TWINOS_URL=http://localhost:4860
TWINOS_API_KEY=your-api-key

# Guest Memory
MEMORY_URL=http://localhost:4520
MEMORY_API_KEY=your-api-key

# StayOwn Services
INVISIBLE_HOTEL_URL=http://localhost:3898
AI_CONCIERGE_URL=http://localhost:4840
SMART_MINIBAR_URL=http://localhost:3810
PREDICTIVE_HOUSEKEEPING_URL=http://localhost:3826
UPSELL_ENGINE_URL=http://localhost:3817

# REZ Services
REZ_PMS_URL=http://localhost:4031
REZ_POS_URL=http://localhost:4081
REZ_LOYALTY_URL=http://localhost:4037
REZ_BUSINESS_COPILOT_URL=http://localhost:4005

# RABTUL Services
RABTUL_PAY_URL=http://localhost:4001
RABTUL_WALLET_URL=http://localhost:4004
RABTUL_AUTH_URL=http://localhost:4002

# BrandPulse
BRANDPULSE_URL=http://localhost:4770
BRANDPULSE_API_KEY=your-api-key

# HOJAI
HOJAI_BRIDGE_URL=http://localhost:5140
HOJAI_EVENT_BUS_URL=http://localhost:4510
```

---

**Document End**

*Integration Specification v1.0*  
*Hotel & Hospitality OS*  
*RTNM Digital*  
*June 12, 2026*
