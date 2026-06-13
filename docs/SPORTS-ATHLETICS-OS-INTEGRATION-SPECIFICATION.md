# Sports & Athletics OS - Integration Specification

**Document Version:** 1.0
**Date:** June 12, 2026
**Status:** Foundation Ready - Detailed Specification
**Classification:** Internal - RTNM Digital

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Capability Matrix](#2-product-capability-matrix)
3. [Twin Architecture](#3-twin-architecture)
4. [Integration Flows](#4-integration-flows)
5. [Agent Architecture](#5-agent-architecture)
6. [Business Copilot Queries](#6-business-copilot-queries)
7. [Economic Integration](#7-economic-integration)
8. [6-Week Implementation Roadmap](#8-6-week-implementation-roadmap)

---

## 1. Executive Summary

### 1.1 Industry Overview

The Sports & Athletics industry represents a massive ecosystem encompassing professional leagues, collegiate athletics, amateur sports, fitness centers, and event management. Key stakeholders include team owners, league administrators, athletes, fans, sponsors, venue operators, and media partners.

**Market Context:**
- Global sports market: $600B+ annually
- Event ticketing: $25B+ market
- Sports sponsorship: $50B+ globally
- Fan engagement technology: Growing 15% YoY

### 1.2 Industry Challenges

| Challenge | Impact | Current Gap |
|-----------|--------|-------------|
| **Fragmented Fan Data** | Siloed systems prevent 360-degree fan view | Ticketing, merchandise, loyalty all in separate systems |
| **Disconnected Experiences** | Fan journey broken across touchpoints | No unified identity across events |
| **Reactive Engagement** | Teams respond to fans instead of anticipating needs | No predictive engagement engine |
| **Lost Revenue Opportunities** | Sponsorship activation disconnected from fan data | No real-time sponsorship optimization |
| **Venue Operations Silos** | Ticketing, F&B, parking all separate | No unified venue operations twin |
| **Athlete Career Discontinuity** | Performance data not connected to fan engagement | No athlete-to-fan pipeline |

### 1.3 Current Product Landscape

The RTNM ecosystem has **5 core products** serving the Sports & Athletics industry:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SPORTS & ATHLETICS OS                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐        │
│  │    Z-EVENTS      │  │    REZ POS       │  │  REZ QR CLOUD    │        │
│  │   Port 5100      │  │   Port 4081      │  │   Port 4090      │        │
│  │                  │  │                  │  │                  │        │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘        │
│           │                      │                      │                   │
│  ┌────────▼─────────┐  ┌────────▼─────────┐  ┌────────▼─────────┐        │
│  │  REZ LOYALTY    │  │  BRAND PULSE    │  │   TWINOS        │        │
│  │   Port 4037     │  │   Port 4770     │  │   Port 4860     │        │
│  │                  │  │                  │  │                  │        │
│  └──────────────────┘  └──────────────────┘  └────────┬─────────┘        │
│                                                         │                   │
│  ════════════════════════════════════════════════════════════════════════  │
│                          DIGITAL TWINS                                       │
│              Fan Twin | Athlete Twin | Team Twin | Venue Twin | Event Twin │
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

### 1.4 Integration Opportunity

**Current State:** Products work independently with point-to-point integrations.

**Target State:** Unified Sports & Athletics OS where:
- All products share a single source of truth via Digital Twins
- AI agents orchestrate cross-product workflows
- Business Copilot provides unified natural language interface
- Payments flow through unified wallet
- Fan engagement is personalized across all touchpoints

**Value Unlocked:**
- 40% increase in fan engagement
- 25% improvement in ticket sales conversion
- 30% increase in sponsorship ROI
- 50% reduction in fan data fragmentation
- 60% improvement in fan satisfaction (NPS)

### 1.5 Key Integration: Z-Events ↔ Fan Twin

The primary integration focus is connecting Z-Events (event discovery and management) with the Fan Twin (unified fan identity) to create a seamless fan journey from event discovery to attendance to ongoing engagement.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Z-EVENTS ↔ FAN TWIN INTEGRATION                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────┐                    ┌──────────────────┐              │
│  │   Z-EVENTS       │                    │    FAN TWIN      │              │
│  │   (Port 5100)    │                    │   (Port 4860)    │              │
│  │                  │                    │                  │              │
│  │  - Event catalog │◀──────────────────▶│  - Fan identity  │              │
│  │  - Ticketing     │                    │  - Preferences   │              │
│  │  - Check-in      │                    │  - History       │              │
│  │  - RSVP          │                    │  - Predictions   │              │
│  │  - Venues        │                    │  - Relationships │              │
│  └────────┬─────────┘                    └────────┬─────────┘              │
│           │                                      │                        │
│           │    ┌─────────────────────────────────┴───────────┐            │
│           │    │                                             │              │
│           ▼    │              UNIFIED FAN JOURNEY            │            │
│  ┌──────────────────────────────────────────────────────────────┐        │
│  │                                                              │        │
│  │  Discover ──▶ Interest ──▶ Purchase ──▶ Attend ──▶ Engage   │        │
│  │      │                                                        │        │
│  │      │         Real-time personalization at each step         │        │
│  │      │         AI-powered recommendations                    │        │
│  │      │         Cross-event loyalty recognition              │        │
│  │      │                                                        │        │
│  └────────────────────────────────────���─────────────────────────┘        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Product Capability Matrix

### 2.1 Z-Events (Primary Event Platform)

| Attribute | Details |
|-----------|---------|
| **Company** | Axom (RTNM Group) |
| **Core Capabilities** | Event discovery, ticketing, check-in, RSVP management, venue partnerships |
| **Key Services** | Event catalog (5100), Meetup organization, Venue booking, Real-time activity feed |
| **Data Produced** | Event registrations, ticket purchases, check-in events, venue bookings, RSVP responses |
| **Data Needed** | Fan preferences, loyalty tier, payment status, venue availability |
| **Current Integration** | REZ QR Cloud (ticketing), RABTUL Pay (payments), KHAIRMOVE (transport) |
| **Target Integration** | TwinOS Fan Twin, Business Copilot, BrandPulse (sentiment) |

**Service Map:**
| Service | Port | Produces | Consumes |
|---------|------|----------|----------|
| Event Catalog | 5100 | Event listings, categories | Fan Twin, Venue Twin |
| Ticketing | 5100 | Ticket sales, seat assignments | Fan Twin, RABTUL Pay |
| Check-in | 5100 | Attendance records | Fan Twin, Venue Twin |
| RSVP | 5100 | Response data, waitlists | Fan Twin |
| Venue Booking | 5100 | Venue reservations | Venue Twin |

**API Endpoints (Port 5100):**
```
POST /api/events              - Create event
GET  /api/events              - List events
GET  /api/events/:eventId     - Event details
POST /api/events/:eventId/rsvp - RSVP to event
POST /api/events/:eventId/tickets - Purchase tickets
POST /api/events/:eventId/checkin - Check-in attendee
GET  /api/venues              - List venues
GET  /api/venues/:venueId     - Venue details
POST /api/venues/:venueId/book - Book venue
GET  /api/fans/:fanId/events  - Fan event history
```

---

### 2.2 REZ POS (Stadium/Event POS)

| Attribute | Details |
|-----------|---------|
| **Company** | REZ Merchant |
| **Core Capabilities** | Multi-property POS for F&B operations, stadium concessions, merchandise |
| **Key Services** | Order management (4081), payment processing, inventory tracking, kitchen routing |
| **Data Produced** | Orders, payments, inventory levels, fan spend history, peak hour patterns |
| **Data Needed** | Fan identity (for loyalty), seat location, dietary restrictions |
| **Current Integration** | RABTUL Pay, REZ Loyalty |
| **Target Integration** | TwinOS Fan Twin, Venue Twin, Business Copilot |

**Stadium-Specific Features:**
- Seat-based ordering
- Fan loyalty auto-recognition
- Dietary flag sync from Fan Memory
- Pre-ordering for pickup
- In-seat delivery

---

### 2.3 REZ QR Cloud (Fan Engagement)

| Attribute | Details |
|-----------|---------|
| **Company** | REZ Merchant |
| **Core Capabilities** | QR-based ordering, ticketing, and engagement for sports venues |
| **Key Services** | QR ticket validation, mobile ordering, fan check-in, loyalty scanning |
| **Data Produced** | QR scans, order events, engagement metrics, dwell time |
| **Data Needed** | Fan identity, seat location, event context |
| **Current Integration** | Z-Events (ticketing), RABTUL Pay (payments) |
| **Target Integration** | TwinOS Fan Twin, Venue Twin, Event Twin |

**QR Use Cases:**
| Use Case | Description | Data Produced |
|---------|-------------|---------------|
| Ticket QR | Event entry validation | Check-in time, entry gate |
| Order QR | Scan to order at seat | Items ordered, dwell time |
| Loyalty QR | Scan to earn points | Points earned, engagement |
| Feedback QR | Post-event surveys | Sentiment, ratings |
| Merch QR | Product information | Product views, interest |

---

### 2.4 REZ Loyalty (Fan Rewards)

| Attribute | Details |
|-----------|---------|
| **Company** | REZ Merchant |
| **Core Capabilities** | Multi-tier loyalty program with points, tiers, and rewards for sports fans |
| **Key Services** | Points earning/redemption (4037), tier management, reward catalog, referral program |
| **Data Produced** | Points transactions, tier changes, reward redemptions, engagement metrics |
| **Data Needed** | Fan identity, event attendance, merchandise purchases, sponsor interactions |
| **Current Integration** | Z-Events (attendance), REZ POS (purchases), RABTUL Wallet |
| **Target Integration** | TwinOS Fan Twin, BrandPulse (reputation-based perks) |

**Sports-Specific Tier Benefits:**
| Tier | Points | Multiplier | Benefits |
|------|--------|------------|----------|
| Rookie | 0 | 1x | Basic rewards, Birthday bonus |
| Supporter | 5,000 | 1.25x | Early access to tickets, 10% merch discount |
| Enthusiast | 20,000 | 1.5x | Meet-and-greet access, VIP events, Free parking |
| Champion | 50,000 | 2x | Suite access, Player interactions, Personal concierge |
| Legend | 100,000 | 3x | Lifetime seats, Ownership experiences, Board access |

---

### 2.5 BrandPulse (Sports Sentiment)

| Attribute | Details |
|-----------|---------|
| **Company** | HOJAI AI |
| **Core Capabilities** | Multi-source brand reputation monitoring, sentiment analysis, crisis early warning |
| **Key Services** | Sentiment tracking (4770), aspect analysis, review aggregation, trend prediction |
| **Data Produced** | Sentiment scores, aspect ratings, crisis alerts, competitor benchmarks |
| **Data Needed** | Team/league names, player names, venue names, sponsor brands |
| **Current Integration** | Standalone monitoring |
| **Target Integration** | TwinOS Team Twin, Venue Twin, Business Copilot (alerts) |

**Sports-Specific Data Sources:**
- Twitter/X (team accounts, player accounts, fan reactions)
- Instagram (player posts, team accounts, fan content)
- Reddit (team subreddits, game threads)
- Sports news sites
- Sports betting odds (sentiment proxy)
- Fantasy sports platforms (player interest)

---

### 2.6 Summary Capability Matrix

| Product | Port | Capabilities | Data Produced | Data Needed |
|---------|------|--------------|---------------|------------|
| Z-Events | 5100 | Event creation, ticketing, check-in, RSVP, venue booking | Registrations, tickets, attendance, RSVPs | Fan preferences, loyalty tier, payment status |
| REZ POS | 4081 | Order management, payment processing, inventory | Orders, payments, spend history | Fan identity, seat, dietary restrictions |
| REZ QR Cloud | 4090 | QR ticketing, mobile ordering, check-in | Scans, orders, engagement | Fan identity, event context |
| REZ Loyalty | 4037 | Points, tiers, rewards, referrals | Points, redemptions, engagement | Fan identity, purchases, attendance |
| BrandPulse | 4770 | Sentiment, crisis alerts, trends | Sentiment scores, alerts | Team/venue names |

---

## 3. Twin Architecture

### 3.1 Core Twins for Sports & Athletics OS

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         TWIN ECOSYSTEM - SPORTS                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐     │
│  │                        FAN TWIN (Primary)                          │     │
│  │  Port: 4860 | Type: Customer | ID: fan_{uuid}                    │     │
│  ├─────────────────────────────────────────────────────────────────────┤     │
│  │  Attributes:                                                        │     │
│  │  - identity: { name, email, phone, fanType }                        │     │
│  │  - preferences: { teams, sports, seating, dietary }                │     │
│  │  - behavior: { attendance, spend, engagement }                    │     │
│  │  - loyalty: { tier, points, history, benefits }                    │     │
│  │  - sentiment: { teams, players, venues }                          │     │
│  │  - predictions: { nextEvent, upsellProbability, churnRisk }       │     │
│  └─────────────────────────────────────────────────────────────────────┘     │
│                              │                                              │
│         ┌────────────────────┼────────────────────┐                       │
│         │                    │                    │                        │
│  ┌──────▼──────┐    ┌───────▼──────┐    ┌──────▼──────┐                │
│  │  ATHLETE    │    │    TEAM     │    │   VENUE    │                │
│  │   TWIN      │    │    TWIN     │    │   TWIN     │                │
│  │             │    │             │    │            │                │
│  │  Type: Person│   │  Type: Org  │    │  Type: Asset│               │
│  │  ID: athlete_│   │  ID: team_  │    │  ID: venue_ │               │
│  └─────────────┘    └─────────────┘    └─────────────┘                │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                      EVENT TWIN                                    │  │
│  │  Type: Activity | ID: event_{uuid}                                 │  │
│  │  Attributes: { name, date, venue, teams, tickets }                 │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                     RELATIONSHIP GRAPH                               │  │
│  ├─────────────────────────────────────────────────────────────────────┤  │
│  │  Fan ──attends──▶ Event                                             │  │
│  │  Fan ──supports──▶ Team                                             │  │
│  │  Fan ──follows──▶ Athlete                                           │  │
│  │  Fan ──prefers──▶ Venue                                             │  │
│  │  Event ──hosted_at──▶ Venue                                         │  │
│  │  Event ──features──▶ Team                                           │  │
│  │  Team ──composed_of──▶ Athlete                                      │  │
│  │  Athlete ──endorsed_by──▶ Sponsor                                   │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 3.2 Fan Twin Data Model

```typescript
// Fan Twin Schema
interface FanTwin {
  // Identity
  twinId: string;                    // "fan_{uuid}"
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
    social: {
      twitter?: string;
      instagram?: string;
      facebook?: string;
    };
    verified: boolean;
    trustScore: number;              // 0-100
  };
  
  // Fan Profile
  profile: {
    fanType: 'casual' | 'enthusiast' | 'diehard' | 'ultra';
    primarySport: string;
    favoriteTeams: string[];         // Team IDs
    favoritePlayers: string[];       // Athlete IDs
    hometown: string;
    allegiances: Array<{
      teamId: string;
      since: Date;
      type: 'fan' | 'member' | 'owner';
    }>;
  };
  
  // Preferences
  preferences: {
    seating: {
      sectionPreference: string;
      rowPreference: string;
      accessibilityNeeds: string[];
    };
    dining: {
      dietaryRestrictions: string[];
      favoriteConcessions: string[];
      preferredOrdering: 'preorder' | 'at-seat' | 'pickup';
    };
    engagement: {
      preferredChannel: 'app' | 'whatsapp' | 'sms' | 'email';
      notificationFrequency: 'all' | 'important' | 'minimal';
      socialSharing: boolean;
    };
    experience: {
      premiumInterest: boolean;
      vipExperienceInterest: boolean;
      meetAndGreetInterest: boolean;
      behindTheScenesInterest: boolean;
    };
  };
  
  // Behavior Patterns
  behavior: {
    attendancePatterns: {
      avgEventsPerYear: number;
      favoriteDayOfWeek: string;
      favoriteTimeSlot: string;
      seasonalPatterns: string[];    // ["playoffs", "summer"]
      groupSize: number;
    };
    spendingPatterns: {
      avgSpendPerEvent: number;
      highSpendCategories: string[];
      merchandiseFrequency: 'never' | 'sometimes' | 'always';
      foodSpend: number;
      beverageSpend: number;
    };
    engagementPatterns: {
      appUsage: 'daily' | 'weekly' | 'event-only';
      socialMediaEngagement: number;
      fantasySportsParticipation: boolean;
      communityInvolvement: string[];
    };
  };
  
  // Loyalty Status
  loyalty: {
    memberId: string;
    tier: 'rookie' | 'supporter' | 'enthusiast' | 'champion' | 'legend';
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
  
  // Sentiment (from BrandPulse)
  sentiment: {
    overall: number;                   // -1 to 1
    byTeam: Record<string, number>;
    byPlayer: Record<string, number>;
    byVenue: Record<string, number>;
    trend: 'improving' | 'stable' | 'declining';
    lastFeedbackAt: Date;
  };
  
  // AI Predictions
  predictions: {
    nextEventDate: Date | null;
    nextEventType: string;
    nextEventTeam: string;
    upsellProbability: {
      premiumSeat: number;
      merchandise: number;
      vipExperience: number;
      seasonTicket: number;
    };
    churnRisk: number;               // 0-1
    lifetimeValue: number;
    preferredOffers: string[];        // Offer IDs most likely to convert
    atRiskIndicators: string[];       // ["low_engagement", "ticket_lapse"]
  };
  
  // Relationships
  relationships: {
    linkedFans: string[];            // Family, friends
    groupId: string | null;          // Fan group/club
    corporateId: string | null;        // Corporate account
    sponsorId: string | null;         // Brand sponsor
  };
  
  // Event History
  eventHistory: {
    eventsAttended: string[];         // Event IDs
    totalEvents: number;
    favoriteVenue: string;
    lastAttendedAt: Date;
    nextScheduledEvent: string;
  };
  
  // Metadata
  metadata: {
    source: 'direct' | 'ota' | 'corporate' | 'fan_club';
    crmId: string;
    firstEventAt: Date;
    totalSpend: number;
    lastInteractionAt: Date;
    tags: string[];
  };
}
```

---

### 3.3 Athlete Twin Data Model

```typescript
// Athlete Twin Schema
interface AthleteTwin {
  twinId: string;                    // "athlete_{uuid}"
  createdAt: Date;
  updatedAt: Date;
  
  // Identity
  identity: {
    name: {
      first: string;
      last: string;
      display: string;
      nicknames: string[];
    };
    contact: {
      email: string;
      phone: string;
      agent: string;
    };
    documents: {
      playerId: string;
      contractId: string;
    };
    verified: boolean;
  };
  
  // Athletic Profile
  athletic: {
    sport: string;
    position: string;
    jerseyNumber: string;
    teamId: string;
    league: string;
    height: { value: number; unit: 'cm' | 'inches' };
    weight: { value: number; unit: 'kg' | 'lbs' };
    dateOfBirth: Date;
    yearsPro: number;
    draftYear: number;
    draftPick: number;
  };
  
  // Performance Metrics
  performance: {
    careerStats: Record<string, any>;
    seasonStats: Record<string, any>;
    recentPerformance: Array<{
      date: Date;
      gameId: string;
      stats: Record<string, any>;
    }>;
    performanceScore: number;        // 0-100
    consistencyScore: number;
    clutchScore: number;
  };
  
  // Media & Engagement
  media: {
    socialFollowers: Record<string, number>;
    socialEngagement: number;
    trendingScore: number;
    mediaValue: number;              // Estimated per-post value
    contentThemes: string[];
  };
  
  // Fan Connection
  fanConnection: {
    fanTwinIds: string[];            // Fans following this athlete
    followerCount: number;
    sentimentScore: number;
    fanDemographics: {
      ageGroups: Record<string, number>;
      genderSplit: Record<string, number>;
      geographicDistribution: Record<string, number>;
    };
  };
  
  // Commercial
  commercial: {
    sponsors: Array<{
      brandId: string;
      contractValue: number;
      startDate: Date;
      endDate: Date;
      exclusivity: boolean;
      categories: string[];
    }>;
    merchandiseSales: number;
    appearanceFees: number;
    totalEndorsementValue: number;
  };
  
  // Contract
  contract: {
    teamId: string;
    contractType: 'rookie' | 'standard' | 'max' | 'supermax';
    salary: number;
    yearsRemaining: number;
    freeAgencyDate: Date;
    noTradeClause: boolean;
  };
  
  // Injuries
  health: {
    currentStatus: 'active' | 'injured' | 'out_for_season';
    injuryHistory: Array<{
      type: string;
      severity: 'minor' | 'moderate' | 'severe';
      startDate: Date;
      endDate: Date | null;
      gamesMissed: number;
    }>;
    fitnessScore: number;           // 0-100
  };
  
  // Relationships
  relationships: {
    teammates: string[];              // Athlete IDs
    coaches: string[];               // Coach IDs
    rivals: string[];               // Athlete IDs
  };
}
```

---

### 3.4 Team Twin Data Model

```typescript
// Team Twin Schema
interface TeamTwin {
  twinId: string;                    // "team_{uuid}"
  createdAt: Date;
  updatedAt: Date;
  
  // Identity
  identity: {
    name: string;
    shortName: string;
    abbreviation: string;
    logo: string;
    colors: string[];
    mascot: string;
    founded: Date;
    arena: string;
    city: string;
    state: string;
    country: string;
  };
  
  // League Context
  league: {
    name: string;
    conference: string;
    division: string;
    standings: {
      rank: number;
      wins: number;
      losses: number;
      winPercentage: number;
      streak: string;
    };
  };
  
  // Roster
  roster: {
    athletes: string[];             // Athlete Twin IDs
    coaches: string[];               // Coach IDs
    staff: string[];                // Staff IDs
    depthChart: Record<string, string[]>; // Position -> Athlete IDs
  };
  
  // Performance
  performance: {
    seasonRecord: { wins: number; losses: number; ties: number };
    homeRecord: { wins: number; losses: number };
    awayRecord: { wins: number; losses: number };
    recentForm: string[];           // W/L sequence
    playoffStatus: string;
    championshipOdds: number;
  };
  
  // Fan Base
  fanBase: {
    totalFans: number;
    fanTwins: string[];             // Fan Twin IDs
    socialFollowers: Record<string, number>;
    sentimentScore: number;
    geographicHotspots: Record<string, number>;
    demographicProfile: {
      ageDistribution: Record<string, number>;
      genderSplit: Record<string, number>;
    };
  };
  
  // Financial
  financial: {
    valuation: number;
    revenue: {
      ticketSales: number;
      merchandise: number;
      media: number;
      sponsorship: number;
    };
    payroll: number;
    luxuryTax: number;
  };
  
  // Reputation (from BrandPulse)
  reputation: {
    overallRating: number;
    ratingsBySource: Record<string, number>;
    sentimentScore: number;
    trend: 'up' | 'down' | 'stable';
    crisisAlerts: Array<{
      severity: 'low' | 'medium' | 'high' | 'critical';
      message: string;
      detectedAt: Date;
    }>;
  };
  
  // Sponsors
  sponsors: Array<{
    brandId: string;
    tier: 'platinum' | 'gold' | 'silver' | 'bronze';
    value: number;
    categories: string[];
    activationRights: string[];
  }>;
  
  // Relationships
  relationships: {
    rivals: string[];                // Team IDs
    partners: string[];              // Venue, league
    parentCompany: string | null;
  };
}
```

---

### 3.5 Venue Twin Data Model

```typescript
// Venue Twin Schema
interface VenueTwin {
  twinId: string;                    // "venue_{uuid}"
  createdAt: Date;
  updatedAt: Date;
  
  // Identity
  identity: {
    name: string;
    shortName: string;
    type: 'stadium' | 'arena' | 'field' | 'court' | 'track' | 'course';
    capacity: number;
    opened: Date;
    renovated: Date;
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
    nearbyTransport: string[];
    parking: {
      spaces: number;
      cost: number;
      electricCharging: boolean;
    };
  };
  
  // Facilities
  facilities: {
    seating: Array<{
      section: string;
      rows: number;
      seats: number;
      priceRange: { min: number; max: number };
      amenities: string[];
    }>;
    premium: Array<{
      type: 'suite' | 'club' | 'box';
      name: string;
      capacity: number;
      price: number;
      amenities: string[];
    }>;
    concessions: Array<{
      name: string;
      location: string;
      type: string;
      capacity: number;
    }>;
    amenities: string[];
    accessibility: {
      adaCompliant: boolean;
      wheelchairSeating: number;
      assistiveListening: boolean;
    };
  };
  
  // Operations
  operations: {
    staff: {
      totalStaff: number;
      departments: Array<{
        name: string;
        headcount: number;
      }>;
    };
    technology: {
      wifi: boolean;
      mobileOrdering: boolean;
      digitalTicketing: boolean;
      appIntegration: boolean;
    };
    security: {
      bagPolicy: string;
      metalDetector: boolean;
      clearBag: boolean;
    };
  };
  
  // Performance Metrics
  performance: {
    occupancyRate: number;           // Last 30 days
    avgTicketPrice: number;
    revenuePerEvent: number;
    fanSatisfactionScore: number;
    concessionSalesPerCapita: number;
    incidentRate: number;
  };
  
  // Event History
  eventHistory: {
    eventsHosted: string[];          // Event IDs
    totalEvents: number;
    upcomingEvents: string[];
    lastEventAt: Date;
    mostAttendedEvent: {
      eventId: string;
      attendance: number;
      date: Date;
    };
  };
  
  // Reputation (from BrandPulse)
  reputation: {
    overallRating: number;
    ratingsBySource: Record<string, number>;
    sentimentScore: number;
    reviews: Array<{
      source: string;
      rating: number;
      count: number;
    }>;
  };
  
  // Relationships
  relationships: {
    homeTeams: string[];             // Team IDs
    operatingCompany: string | null;
    leagueId: string | null;
  };
}
```

---

### 3.6 Event Twin Data Model

```typescript
// Event Twin Schema
interface EventTwin {
  twinId: string;                    // "event_{uuid}"
  createdAt: Date;
  updatedAt: Date;
  
  // Identity
  identity: {
    name: string;
    type: 'regular_season' | 'playoff' | 'championship' | 'exhibition' | 'concert' | 'other';
    category: string;
    description: string;
  };
  
  // Timing
  timing: {
    startDate: Date;
    endDate: Date;
    doorsOpen: Date;
    duration: number;                // minutes
    timezone: string;
    recurring: boolean;
    recurringPattern: string | null;
  };
  
  // Location
  location: {
    venueId: string;
    venueName: string;
    section: string;
    row: string;
    seat: string;
    gate: string;
  };
  
  // Participants
  participants: {
    teams: string[];                 // Team IDs
    athletes: string[];             // Athlete IDs
    performers: string[];
  };
  
  // Ticketing
  ticketing: {
    totalTickets: number;
    ticketsSold: number;
    ticketsRemaining: number;
    soldPercentage: number;
    priceRange: { min: number; max: number };
    avgPrice: number;
    revenue: number;
    sections: Array<{
      name: string;
      total: number;
      sold: number;
      price: number;
    }>;
  };
  
  // Attendance
  attendance: {
    expected: number;
    actual: number | null;
    checkedIn: number;
    noShows: number;
    capacityUtilization: number;
  };
  
  // Fan Engagement
  engagement: {
    preEventBuzz: number;           // Social mentions
    ticketDemand: 'low' | 'medium' | 'high' | 'sold_out';
    waitlistCount: number;
    socialMentions: number;
    trendingScore: number;
  };
  
  // Financial
  financial: {
    grossRevenue: number;
    netRevenue: number;
    expenses: number;
    profit: number;
    sponsorshipRevenue: number;
    merchandiseRevenue: number;
    foodBeverageRevenue: number;
  };
  
  // Weather (for outdoor events)
  weather: {
    forecast: string;
    temperature: number;
    precipitation: number;
    windSpeed: number;
    impact: 'none' | 'low' | 'medium' | 'high';
  };
  
  // Relationships
  relationships: {
    fanTwins: string[];              // Fans who attended
    seasonId: string | null;
    seriesId: string | null;
  };
}
```

---

### 3.7 Twin Relationships

| Relationship | Source Twin | Target Twin | Cardinality |
|--------------|-------------|-------------|-------------|
| `attends` | Fan | Event | N:M |
| `supports` | Fan | Team | N:M |
| `follows` | Fan | Athlete | N:M |
| `prefers` | Fan | Venue | N:M |
| `hosted_at` | Event | Venue | N:1 |
| `features` | Event | Team | N:M |
| `features` | Event | Athlete | N:M |
| `composed_of` | Team | Athlete | 1:N |
| `endorsed_by` | Athlete | Sponsor | N:M |
| `plays_at` | Team | Venue | 1:N |
| `scheduled_in` | Event | Season | N:1 |
| `belongs_to` | Event | Series | N:1 |

---

### 3.8 Agents Interacting with Twins

| Agent | Manages | Access Level |
|-------|---------|--------------|
| **Fan Engagement Agent** | Fan Twin | Read/Write preferences, predictions |
| **Ticketing Agent** | Fan Twin, Event Twin | Read/Write ticket purchases |
| **Venue Operations Agent** | Venue Twin, Event Twin | Read/Write venue status |
| **Athlete Performance Agent** | Athlete Twin | Read/Write performance data |
| **Team Management Agent** | Team Twin, Athlete Twin | Read/Write roster |
| **Revenue Agent** | Event Twin, Venue Twin | Read pricing, write forecasts |
| **Sponsorship Agent** | Team Twin, Athlete Twin | Read/Write sponsorship data |
| **Sentiment Agent** | Team Twin, Venue Twin, Fan Twin | Write sentiment data |

---

## 4. Integration Flows

### 4.1 Z-Events ↔ Fan Twin Integration (Primary Flow)

**Critical Integration Point:** Z-Events serves as the event discovery and ticketing layer while Fan Twin provides the unified fan identity and preferences.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Z-EVENTS ↔ FAN TWIN FLOW                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────┐                    ┌──────────────────┐              │
│  │   Z-EVENTS       │                    │     TWINOS       │              │
│  │   (Port 5100)    │                    │   (Port 4860)    │              │
│  │                  │                    │                  │              │
│  │  - Event catalog │                    │  - Fan Twin      │              │
│  │  - Ticketing     │                    │  - Event Twin    │              │
│  │  - Check-in      │                    │  - Venue Twin    │              │
│  │  - RSVP          │                    │  - Team Twin     │              │
│  │  - Venues        │                    │  - Athlete Twin  │              │
│  └────────┬─────────┘                    └────────┬─────────┘              │
│           │                                      │                        │
│           │  ┌──────────────────────────────────┴───────────┐            │
│           │  │                                            │              │
│           ▼  │    Bidirectional Sync                      │            │
│  ┌──────────────────────────────────────────────────────────────┐        │
│  │                      SYNC LAYER                               │        │
│  │  - Events → Fan: Personalized recommendations                 │        │
│  │  - Fan → Events: Preferences, loyalty tier                    │        │
│  │  - Check-in → Fan: Attendance history, points                │        │
│  │  - RSVP → Fan: Interest signals                              │        │
│  │  - Purchase → Fan: Spend patterns, seat preferences           │        │
│  └──────────────────────────────────────────────────────────────┘        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Sync Events:**

| Event | Direction | Payload | Trigger |
|-------|-----------|---------|----------|
| `fan.search` | Fan Twin → Z-Events | Search criteria, preferences | Fan searches events |
| `event.recommend` | Z-Events → Fan Twin | Recommended events | AI recommendation |
| `fan.rsvp` | Z-Events → Fan Twin | RSVP data, interest signals | Fan RSVPs |
| `fan.purchase` | Z-Events → Fan Twin | Ticket data, spend | Ticket purchase |
| `fan.checkin` | Z-Events → Fan Twin | Attendance, points earned | Event check-in |
| `fan.preference.updated` | Fan Twin → Z-Events | Preference update | Preference change |
| `fan.prediction.generated` | TwinOS → Z-Events | Prediction object | On prediction request |

**API Contracts:**

```typescript
// Fan searches events with preferences
POST /api/events/search
{
  fanId: string;
  criteria: {
    sport?: string;
    team?: string;
    venue?: string;
    dateRange?: { start: Date; end: Date };
    priceRange?: { min: number; max: number };
  };
  preferences: {
    seatingPreference?: string;
    dietaryRestrictions?: string[];
    accessibilityNeeds?: string[];
  };
  includeRecommendations: boolean;
}

// Event recommendation response
interface EventRecommendation {
  events: Array<{
    eventId: string;
    name: string;
    date: Date;
    venue: string;
    teams: string[];
    matchScore: number;            // 0-100
    reasons: string[];             // Why recommended
    priceRange: { min: number; max: number };
    availability: 'available' | 'limited' | 'sold_out';
  }>;
  personalizedInsights: string[];
}

// Fan purchases ticket
POST /api/events/:eventId/tickets
{
  fanId: string;
  quantity: number;
  section: string;
  row: string;
  seats: string[];
  paymentMethod: 'card' | 'upi' | 'wallet' | 'loyalty_points';
  usePoints: boolean;
  sendConfirmation: boolean;
}

// Fan checks in
POST /api/events/:eventId/checkin
{
  fanId: string;
  ticketId: string;
  gate: string;
  timestamp: Date;
}

// Fan Twin sync after check-in
POST /api/twin/fan/sync
{
  source: 'zevents',
  fanId: string;
  data: {
    eventAttendance?: {
      eventId: string;
      attendedAt: Date;
      section: string;
      spend: number;
    };
    pointsEarned?: number;
    preferences?: FanPreferences;
    behavior?: BehaviorPattern[];
  };
  timestamp: Date;
}
```

---

### 4.2 Event Discovery → Fan Twin Enrichment Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    EVENT DISCOVERY → FAN TWIN ENRICHMENT                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐                │
│  │   Z-EVENTS  │────▶│   TWINOS    │────▶│ FAN MEMORY   │                │
│  │  (Port 5100)│     │  (Port 4860)│     │  (Port 4520) │                │
│  └──────────────┘     └──────────────┘     └──────────────┘                │
│         │                   │                   │                          │
│         │                   │                   │                          │
│         ▼                   ▼                   ▼                          │
│  ┌──────────────────────────────────────────────────────────────┐        │
│  │                    ENRICHMENT PIPELINE                        │        │
│  │  1. Create/Update Fan Twin from first interaction             │        │
│  │  2. Enrich with historical preferences from Memory           │        │
│  │  3. Generate predictions (next event, upsell probability)    │        │
│  │  4. Pre-load recommendation context                         │        │
│  │  5. Prepare personalized notifications                       │        │
│  └──────────────────────────────────────────────────────────────┘        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Data Flow:**

```typescript
// Step 1: Fan First Interaction
interface FanFirstInteraction {
  eventType: 'search' | 'rsvp' | 'purchase' | 'checkin';
  fanId: string;
  eventId: string;
  timestamp: Date;
  context: {
    source: 'app' | 'web' | 'whatsapp' | 'email';
    referral: string;
    searchTerms: string[];
  };
}

// Step 2: Fan Twin Enrichment
interface FanTwinEnrichment {
  fanId: string;
  eventId: string;
  enrichmentData: {
    teamAffinities: string[];
    venuePreferences: string[];
    seatingPreferences: string[];
    priceSensitivity: number;
    engagementLevel: 'low' | 'medium' | 'high';
    preferredEventTypes: string[];
  };
  predictions: {
    nextEventProbability: number;
    upgradeProbability: number;
    churnRisk: number;
    lifetimeValue: number;
  };
}

// Step 3: Personalized Notification
interface FanNotification {
  fanId: string;
  channel: 'app' | 'whatsapp' | 'sms' | 'email';
  type: 'recommendation' | 'reminder' | 'offer' | 'update';
  content: {
    title: string;
    body: string;
    cta: string;
    ctaUrl: string;
  };
  timing: Date;
  priority: 'low' | 'normal' | 'high';
}
```

---

### 4.3 REZ POS → Fan Twin Spend Tracking

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    REZ POS → FAN TWIN SPEND TRACKING                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐              │
│  │   REZ POS   │────▶│  FAN TWIN   │────▶│   TWINOS    │                │
│  │  (Port 4081)│     │              │     │              │                │
│  └──────────────┘     └──────────────┘     └──────────────┘              │
│         │                   │                   │                          │
│         │                   │                   │                          │
│         ▼                   ▼                   ▼                          │
│  ┌──────────────────────────────────────────────────────────────┐        │
│  │                    SPEND & LOYALTY FLOW                        │        │
│  │                                                                  │        │
│  │  POS Order ──fan scan──▶ Fan Twin                               │        │
│  │      │                                                           │        │
│  │      ├───payment──▶ RABTUL Pay                                  │        │
│  │      │                                                           │        │
│  │      ├───loyalty──▶ REZ Loyalty (earn points)                   │        │
│  │      │                                                           │        │
│  │      └───spend update──▶ Fan Twin (spending patterns)           │        │
│  │                                                                  │        │
│  │  Learn preferences:                                              │        │
│  │  - Favorite concessions                                          │        │
│  │  - Order frequency                                               │        │
│  │  - Price sensitivity                                             │        │
│  │                                                                  │        │
│  └──────────────────────────────────────────────────────────────┘        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**API Contracts:**

```typescript
// Order with Fan Scan
POST /api/pos/order
{
  fanId: string;
  eventId: string;
  venueId: string;
  section: string;
  row: string;
  seat: string;
  items: Array<{
    itemId: string;
    name: string;
    quantity: number;
    price: number;
    category: string;
  }>;
  paymentMethod: 'card' | 'upi' | 'wallet' | 'seat_charge';
  chargeToSeat: boolean;
  dietaryFlags?: string[];
}

// Spend Pattern Update
POST /api/fan/:fanId/spend
{
  fanId: string;
  category: 'concession' | 'merchandise' | 'parking' | 'experience';
  amount: number;
  eventId: string;
  venueId: string;
  timestamp: Date;
  items: string[];                  // Item IDs for preference learning
}

// Loyalty Points Earning
POST /api/loyalty/earn
{
  fanId: string;
  transactionType: 'ticket' | 'concession' | 'merchandise' | 'parking' | 'experience';
  amount: number;
  eventId: string;
  description: string;
  multiplier?: number;             // Tier multiplier
}
```

---

### 4.4 BrandPulse → Team/Venue Twin Reputation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    BRAND PULSE → TWIN REPUTATION SYNC                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐              │
│  │  BRAND      │────▶│  TEAM/VENUE │────▶│   TWINOS    │                │
│  │  PULSE      │     │    TWIN     │     │              │                │
│  │  (Port 4770)│     │              │     │              │                │
│  └──────────────┘     └──────────────┘     └──────────────┘              │
│         │                   │                   │                          │
│         │                   │                   │                          │
│         ▼                   ▼                   ▼                          │
│  ┌──────────────────────────────────────────────────────────────┐        │
│  │                    REPUTATION SYNC                            │        │
│  │                                                                  │        │
│  │  BrandPulse:               Team/Venue Twin:                     │        │
│  │  - Sentiment scores         - Overall rating                    │        │
│  │  - Aspect analysis          - Social followers                 │        │
│  │  - Crisis alerts            - Sentiment trends                 │        │
│  │  - Player ratings           - Crisis alerts                     │        │
│  │                                                                  │        │
│  └──────────────────────────────────────────────────────────────┘        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**API Contracts:**

```typescript
// Reputation Sync Event
POST /api/twin/:twinType/:twinId/reputation/sync
{
  source: 'brandpulse',
  twinType: 'team' | 'venue' | 'athlete';
  twinId: string;
  data: {
    overallRating: number;
    sentimentScore: number;
    socialMetrics: {
      followers: Record<string, number>;
      engagement: number;
      mentions: number;
    };
    aspects: {
      performance: number;
      community: number;
      management: number;
      facilities: number;
    };
    trend: 'improving' | 'stable' | 'declining';
    lastUpdated: Date;
  };
}

// Crisis Alert
interface CrisisAlert {
  twinType: 'team' | 'venue' | 'athlete';
  twinId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'negative_spike' | 'controversy' | 'scandal' | 'injury' | 'performance_drop';
  message: string;
  affectedAspects: string[];
  recommendedActions: string[];
  detectedAt: Date;
  sources: string[];
}

// Fan Sentiment from Feedback
POST /api/fan/:fanId/sentiment
{
  fanId: string;
  targetType: 'team' | 'venue' | 'athlete' | 'event';
  targetId: string;
  rating: number;                   // 1-10
  feedback: string;
  aspects: {
    aspect: string;
    rating: number;
    comment?: string;
  }[];
  source: 'in_app' | 'email' | 'sms' | 'social';
  timestamp: Date;
}
```

---

### 4.5 REZ QR Cloud → Fan Twin Engagement

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    REZ QR CLOUD → FAN TWIN ENGAGEMENT                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐              │
│  │  REZ QR     │────▶│  FAN TWIN   │────▶│   TWINOS    │                │
│  │  CLOUD      │     │              │     │              │                │
│  │  (Port 4090)│     │              │     │              │                │
│  └──────────────┘     └──────────────┘     └──────────────┘              │
│         │                   │                   │                          │
│         │                   │                   │                          │
│         ▼                   ▼                   ▼                          │
│  ┌──────────────────────────────────────────────────────────────┐        │
│  │                    QR ENGAGEMENT FLOW                          │        │
│  │                                                                  │        │
│  │  QR Scan Types:                                                  │        │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐          │        │
│  │  │ Ticket  │  │  Order  │  │ Loyalty │  │Feedback │          │        │
│  │  │   QR    │  │   QR    │  │   QR    │  │   QR    │          │        │
│  │  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘          │        │
│  │       │            │            │            │                 │        │
│  │       ▼            ▼            ▼            ▼                 │        │
│  │  Check-in     Order items   Earn points   Submit rating       │        │
│  │  timestamp    preferences   loyalty tier  sentiment          │        │
│  │       │            │            │            │                 │        │
│  │       └────────────┴────────────┴────────────┘                 │        │
│  │                         │                                       │        │
│  │                         ▼                                       │        │
│  │              Update Fan Twin engagement score                   │        │
│  │              Learn preferences and behavior                     │        │
│  │              Trigger personalized offers                       │        │
│  │                                                                  │        │
│  └──────────────────────────────────────────────────────────────┘        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**API Contracts:**

```typescript
// QR Scan Event
POST /api/qr/scan
{
  fanId: string;
  qrType: 'ticket' | 'order' | 'loyalty' | 'feedback' | 'merch';
  qrId: string;
  context: {
    eventId?: string;
    venueId?: string;
    section?: string;
    seat?: string;
  };
  timestamp: Date;
}

// Ticket QR Scan (Check-in)
POST /api/qr/scan/ticket
{
  fanId: string;
  ticketId: string;
  eventId: string;
  gate: string;
  scanTime: Date;
}

// Order QR Scan
POST /api/qr/scan/order
{
  fanId: string;
  eventId: string;
  venueId: string;
  section: string;
  seat: string;
  menuItems: string[];
}

// Loyalty QR Scan
POST /api/qr/scan/loyalty
{
  fanId: string;
  location: string;
  action: 'scan' | 'redeem' | 'earn';
  points?: number;
  offerId?: string;
}

// Feedback QR Scan
POST /api/qr/scan/feedback
{
  fanId: string;
  eventId: string;
  venueId: string;
  rating: number;
  feedback: string;
  categories: string[];
}
```

---

### 4.6 Error Handling Strategy

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
  failureThreshold: 5,             // Open after 5 failures
  resetTimeout: 60000,             // Try again after 60s
  halfOpenRequests: 3,              // Allow 3 test requests
  monitoringPeriod: 120000          // Calculate failure rate over 2min
};
```

**Dead Letter Queue:**
- Failed events stored in DLQ with full payload
- DLQ processing runs every 15 minutes
- Manual intervention alerts for events > 24 hours in DLQ

---

## 5. Agent Architecture

### 5.1 Sports & Athletics AI Agents

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    AGENT ORCHESTRATION LAYER - SPORTS                       │
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
│  │  FAN         │         │  TICKETING  │         │  VENUE      │  │
│  │  ENGAGEMENT  │         │   AGENT     │         │  OPERATIONS │  │
│  │   AGENT     │         │             │         │   AGENT     │  │
│  │             │         │             │         │             │  │
│  │ L2 Specialist│         │ L3 Autonom. │         │ L2 Specialist│  │
│  └──────────────┘         └──────────────┘         └──────────────┘  │
│                                                                             │
│  ┌──────────────┐         ┌──────────────┐         ┌──────────────┐  │
│  │  ATHLETE    │         │   TEAM      │         │  SPONSORSHIP│  │
│  │  PERFORMANCE│         │  MANAGEMENT │         │   AGENT     │  │
│  │   AGENT     │         │   AGENT     │         │             │  │
│  │             │         │             │         │             │  │
│  │ L2 Specialist│         │ L2 Specialist│         │ L2 Specialist│  │
│  └──────────────┘         └──────────────┘         └──────────────┘  │
│                                                                             │
│  ┌──────────────┐         ┌──────────────┐         ┌──────────────┐  │
│  │  REVENUE    │         │  LOYALTY   │         │  SENTIMENT │  │
│  │   AGENT     │         │   AGENT    │         │   AGENT    │  │
│  │             │         │             │         │             │  │
│  │ L3 Autonom. │         │ L2 Specialist│         │ L2 Specialist│  │
│  └──────────────┘         └──────────────┘         └──────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 5.2 Agent Specifications

#### 5.2.1 Fan Engagement Agent

| Attribute | Value |
|-----------|-------|
| **Agent ID** | `fan_engagement_agent` |
| **Classification** | L2 Specialist |
| **Port** | 5100 |
| **Manages** | Fan Twin, Event Twin |
| **Availability** | 24/7 |

**Capabilities:**
```typescript
interface FanEngagementAgentSkills {
  // Core Skills
  personalization: true;
  recommendation: true;
  lifecycleManagement: true;
  
  // Fan Journey
  acquisition: true;
  activation: true;
  retention: true;
  reactivation: true;
  
  // Channels
  channels: ['app', 'whatsapp', 'sms', 'email', 'push'];
  
  // Prediction
  churnPrediction: true;
  lifetimeValuePrediction: true;
  upgradeProbability: true;
}
```

**Actions:**
| Action | Description | Target System |
|--------|-------------|----------------|
| `recommend_events` | Generate personalized event recommendations | Fan Twin, Z-Events |
| `send_notification` | Send targeted notification | Push Service |
| `personalize_offer` | Generate personalized offer | Fan Twin, REZ Loyalty |
| `identify_churn_risk` | Flag at-risk fans | Fan Twin |
| `trigger_reengagement` | Re-engage lapsed fans | Fan Twin, Marketing |

**Prompts:**
```
You are a Fan Engagement Agent for a sports organization. You have access to 
the fan's complete profile including their team allegiances, attendance history, 
spending patterns, and engagement preferences.

When engaging fans:
1. Reference relevant team affiliations ("I know you're a {team} fan...")
2. Offer personalized recommendations based on their history
3. Suggest upsell opportunities at appropriate moments
4. Time communications based on engagement patterns
5. Know when to escalate to human staff

Fan Context:
- Name: {fan.name}
- Tier: {fan.loyalty.tier}
- Favorite Teams: {fan.profile.favoriteTeams}
- Attendance: {fan.behavior.attendancePatterns}
- Last Event: {fan.eventHistory.lastAttendedAt}
```

---

#### 5.2.2 Ticketing Agent

| Attribute | Value |
|-----------|-------|
| **Agent ID** | `ticketing_agent` |
| **Classification** | L3 Autonomous |
| **Port** | 5100 |
| **Manages** | Fan Twin, Event Twin, Venue Twin |
| **Availability** | 24/7 |

**Capabilities:**
```typescript
interface TicketingAgentSkills {
  // Core Skills
  inventoryManagement: true;
  dynamicPricing: true;
  waitlistManagement: true;
  
  // Autonomous Actions
  autoConfirm: true;               // Confirm purchases without review
  upgradeEligibility: true;        // Determine upgrade eligibility
  dynamicPricingOptimization: true; // Real-time price adjustment
  
  // Integration
  zeventsSync: true;
  resaleIntegration: true;
  seasonTicketManagement: true;
}
```

**Actions:**
| Action | Description | Autonomy |
|--------|-------------|----------|
| `check_availability` | Check ticket availability | Full |
| `process_purchase` | Process ticket purchase | Full |
| `apply_dynamic_pricing` | Adjust prices based on demand | Full |
| `manage_waitlist` | Add/remove from waitlist | Full |
| `offer_upgrades` | Offer seat upgrades | Full |
| `process_refunds` | Handle ticket refunds | Conditional* |

*Requires human review for refunds within 24 hours of event

---

#### 5.2.3 Venue Operations Agent

| Attribute | Value |
|-----------|-------|
| **Agent ID** | `venue_operations_agent` |
| **Classification** | L2 Specialist |
| **Port** | 4860 |
| **Manages** | Venue Twin, Event Twin |
| **Availability** | Event hours + prep |

**Capabilities:**
```typescript
interface VenueOperationsAgentSkills {
  // Core Skills
  capacityOptimization: true;
  staffScheduling: true;
  securityCoordination: true;
  
  // Operations
  gateManagement: true;
  emergencyResponse: true;
  crowdFlowOptimization: true;
  
  // Integration
  corpperksSync: true;             // Staff scheduling
  iotIntegration: true;            // Sensors, cameras
  posIntegration: true;            // Concessions
}
```

**Actions:**
| Action | Description | Target System |
|--------|-------------|----------------|
| `optimize_gate_assignment` | Assign fans to gates | Venue Twin |
| `predict_crowd_flow` | Forecast crowd movement | Venue Twin |
| `schedule_staff` | Generate staff schedule | CorpPerks |
| `trigger_emergency` | Initiate emergency protocol | Security |
| `update_capacity` | Adjust capacity in real-time | Venue Twin |

---

#### 5.2.4 Athlete Performance Agent

| Attribute | Value |
|-----------|-------|
| **Agent ID** | `athlete_performance_agent` |
| **Classification** | L2 Specialist |
| **Port** | 4860 |
| **Manages** | Athlete Twin, Team Twin |
| **Availability** | 24/7 |

**Capabilities:**
```typescript
interface AthletePerformanceAgentSkills {
  // Core Skills
  performanceTracking: true;
  injuryMonitoring: true;
  statsAnalysis: true;
  
  // Prediction
  performanceForecasting: true;
  injuryRiskPrediction: true;
  careerTrajectory: true;
  
  // Fan Connection
  fanSentimentTracking: true;
  engagementOptimization: true;
  contentOptimization: true;
}
```

**Actions:**
| Action | Description | Target |
|--------|-------------|--------|
| `update_stats` | Record performance data | Athlete Twin |
| `track_injury` | Log injury status | Athlete Twin |
| `analyze_performance` | Generate performance analysis | Athlete Twin |
| `predict_performance` | Forecast future performance | Athlete Twin |
| `update_fan_metrics` | Sync fan engagement data | Athlete Twin |

---

#### 5.2.5 Team Management Agent

| Attribute | Value |
|-----------|-------|
| **Agent ID** | `team_management_agent` |
| **Classification** | L2 Specialist |
| **Port** | 4860 |
| **Manages** | Team Twin, Athlete Twin |
| **Availability** | 24/7 |

**Capabilities:**
```typescript
interface TeamManagementAgentSkills {
  // Core Skills
  rosterManagement: true;
  contractTracking: true;
  salaryCapManagement: true;
  
  // Analytics
  performanceAnalytics: true;
  tradeAnalysis: true;
  draftAnalysis: true;
  
  // Fan Connection
  fanBaseAnalysis: true;
  sentimentTracking: true;
  engagementOptimization: true;
}
```

**Actions:**
| Action | Description | Target |
|--------|-------------|--------|
| `update_roster` | Manage roster changes | Team Twin |
| `track_contracts` | Monitor contract status | Team Twin |
| `analyze_performance` | Generate team analytics | Team Twin |
| `sync_fan_base` | Update fan metrics | Team Twin |
| `detect_crisis` | Monitor reputation | BrandPulse |

---

#### 5.2.6 Sponsorship Agent

| Attribute | Value |
|-----------|-------|
| **Agent ID** | `sponsorship_agent` |
| **Classification** | L2 Specialist |
| **Port** | 4770 |
| **Manages** | Team Twin, Athlete Twin |
| **Availability** | Business hours |

**Capabilities:**
```typescript
interface SponsorshipAgentSkills {
  // Core Skills
  sponsorMatching: true;
  activationTracking: true;
  roiMeasurement: true;
  
  // Optimization
  placementOptimization: true;
  audienceTargeting: true;
  valueCalculation: true;
  
  // Compliance
  exclusivityEnforcement: true;
  contractTracking: true;
}
```

**Actions:**
| Action | Description | Target |
|--------|-------------|--------|
| `match_sponsors` | Match sponsors to opportunities | Team Twin |
| `track_activation` | Monitor sponsor activations | Team Twin |
| `measure_roi` | Calculate sponsorship ROI | Analytics |
| `optimize_placement` | Optimize ad placement | Venue Twin |
| `enforce_exclusivity` | Ensure exclusivity compliance | Team Twin |

---

#### 5.2.7 Revenue Agent

| Attribute | Value |
|-----------|-------|
| **Agent ID** | `revenue_agent` |
| **Classification** | L3 Autonomous |
| **Port** | 4037 |
| **Manages** | Event Twin, Venue Twin, Fan Twin |
| **Availability** | 24/7 |

**Capabilities:**
```typescript
interface RevenueAgentSkills {
  // Core Skills
  dynamicPricing: true;
  demandForecasting: true;
  yieldOptimization: true;
  
  // Streams
  ticketRevenue: true;
  sponsorshipRevenue: true;
  merchandiseRevenue: true;
  concessionRevenue: true;
  
  // Analytics
  revenueAttribution: true;
  forecastAccuracy: true;
  trendAnalysis: true;
}
```

**Actions:**
| Action | Description | Frequency |
|--------|-------------|-----------|
| `update_pricing` | Adjust ticket prices | Real-time |
| `forecast_revenue` | Predict revenue | Daily |
| `optimize_yield` | Maximize yield | Hourly |
| `attribute_revenue` | Track revenue sources | Real-time |
| `report_metrics` | Generate revenue reports | Daily |

---

#### 5.2.8 Loyalty Agent

| Attribute | Value |
|-----------|-------|
| **Agent ID** | `loyalty_agent` |
| **Classification** | L2 Specialist |
| **Port** | 4037 |
| **Manages** | Fan Twin |
| **Availability** | 24/7 |

**Capabilities:**
```typescript
interface LoyaltyAgentSkills {
  // Core Skills
  pointsManagement: true;
  tierCalculation: true;
  benefitApplication: true;
  
  // Engagement
  milestoneCelebrations: true;
  tierUpgradePrompts: true;
  rewardOptimization: true;
  
  // Sports-Specific
  teamRewards: true;
  eventRewards: true;
  experienceRewards: true;
}
```

**Actions:**
| Action | Description | Target |
|--------|-------------|--------|
| `earn_points` | Credit points for activity | REZ Loyalty |
| `redeem_points` | Process point redemption | REZ Loyalty |
| `upgrade_tier` | Process tier upgrade | Fan Twin |
| `send_milestone` | Celebrate milestones | Fan Twin |
| `optimize_rewards` | Optimize reward catalog | REZ Loyalty |

---

#### 5.2.9 Sentiment Agent

| Attribute | Value |
|-----------|-------|
| **Agent ID** | `sentiment_agent` |
| **Classification** | L2 Specialist |
| **Port** | 4770 |
| **Manages** | Team Twin, Venue Twin, Fan Twin |
| **Availability** | 24/7 |

**Capabilities:**
```typescript
interface SentimentAgentSkills {
  // Core Skills
  multiSourceAnalysis: true;
  aspectExtraction: true;
  trendDetection: true;
  
  // Crisis
  crisisDetection: true;
  earlyWarning: true;
  responseGeneration: true;
  
  // Sports-Specific
  playerSentiment: true;
  teamSentiment: true;
  venueSentiment: true;
  gameDaySentiment: true;
}
```

**Actions:**
| Action | Description | Target |
|--------|-------------|--------|
| `analyze_sentiment` | Analyze multi-source sentiment | BrandPulse |
| `detect_trends` | Detect sentiment trends | BrandPulse |
| `trigger_crisis_alert` | Alert on crisis detection | Team Twin |
| `generate_response` | Generate response draft | BrandPulse |
| `sync_reputation` | Sync to Twin | Team Twin |

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
    fanId?: string;
    eventId?: string;
    teamId?: string;
    venueId?: string;
    athleteId?: string;
  };
  timestamp: Date;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  correlationId?: string;             // For tracking request-response pairs
}
```

**Example Communication:**

```typescript
// Fan Engagement Agent requests fan preferences from Fan Twin
{
  id: "msg_001",
  source: "fan_engagement_agent",
  target: "fan_twin",
  type: "request",
  action: "get_preferences",
  payload: {
    fanId: "fan_abc123",
    includePredictions: true,
    includeEventHistory: true
  },
  context: {
    eventId: "event_xyz789"
  },
  timestamp: "2026-06-12T10:30:00Z",
  priority: "normal"
}

// Fan Twin responds with preferences
{
  id: "msg_002",
  source: "fan_twin",
  target: "fan_engagement_agent",
  type: "response",
  action: "get_preferences",
  payload: {
    preferences: {
      seating: { sectionPreference: "lower bowl" },
      teams: ["team_123", "team_456"],
      dietary: []
    },
    predictions: {
      upsellProbability: { premiumSeat: 0.65 },
      nextEventDate: "2026-06-20"
    },
    eventHistory: {
      totalEvents: 15,
      favoriteVenue: "venue_abc"
    }
  },
  correlationId: "msg_001",
  timestamp: "2026-06-12T10:30:01Z"
}
```

---

## 6. Business Copilot Queries

### 6.1 Sports & Athletics Business Copilot

The Business Copilot provides natural language access to sports operations intelligence, built on the REZ Business Copilot platform.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    BUSINESS COPILOT - SPORTS OS                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │                    NATURAL LANGUAGE INTERFACE                     │    │
│  │                                                                  │    │
│  │  "Show me this season's top fans by engagement"                │    │
│  │  "Which events are likely to sell out this weekend?"            │    │
│  │  "What's our fan sentiment trend for the home team?"           │    │
│  │  "Predict concession sales for the championship game"          │    │
│  │                                                                  │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                    │                                     │
│                                    ▼                                     │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    INTENT UNDERSTANDING                           │  │
│  │                                                                  │  │
│  │  Query Classification:                                           │  │
│  │  - fan: engagement, retention, acquisition                       │  │
│  ��  - event: tickets, pricing, forecasting                          │  │
│  │  - venue: operations, capacity, logistics                        │  │
│  │  - team: performance, sentiment, roster                          │  │
│  │  - revenue: ticket, sponsorship, concession                     │  │
│  │                                                                  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                    │                                     │
│                                    ▼                                     │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    DATA AGGREGATION LAYER                         │  │
│  │                                                                  │  │
│  │  TwinOS ◀──Fan Twin, Event Twin, Venue Twin, Team Twin           │  │
│  │  BrandPulse ◀──Sentiment, Trends, Crisis                        │  │
│  │  REZ POS ◀──Transactions, Revenue                               │  │
│  │  REZ Loyalty ◀──Points, Tiers, Engagement                       │  │
│  │  Z-Events ◀──Events, Tickets, RSVPs                              │  │
│  │                                                                  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                    │                                     │
│                                    ▼                                     │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    RESPONSE GENERATION                           │  │
│  │                                                                  │  │
│  │  - Natural language answer                                       │  │
│  │  - Supporting data/charts                                         │  │
│  │  - Recommended actions                                           │  │
���  │  - Follow-up suggestions                                         │  │
│  │                                                                  │  │
│  └─────────────────────────────��────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 6.2 Natural Language Queries Supported

#### 6.2.1 Fan Engagement Queries

| Query Pattern | Intent | Response |
|--------------|--------|----------|
| "Show me this season's top fans by engagement" | `fan.top.engagement` | Ranked list of top fans with scores |
| "Which fans are at risk of churning?" | `fan.churn.risk` | List of at-risk fans with reasons |
| "What's our fan NPS score this month?" | `fan.nps.monthly` | NPS trend and breakdown |
| "Show me fans who attended the last 5 events" | `fan.attendees.recent` | List of frequent attendees |
| "Which fans haven't attended in 30+ days?" | `fan.lapsed.list` | Lapsed fan list with outreach |
| "What's the average fan lifetime value?" | `fan.ltv.average` | LTV metrics and distribution |
| "Show me fans eligible for tier upgrade" | `fan.tier.upgrade` | Fans near tier threshold |
| "Which fans prefer premium seating?" | `fan.premium.interested` | Premium-interested fans |

#### 6.2.2 Event & Ticketing Queries

| Query Pattern | Intent | Response |
|--------------|--------|----------|
| "Which events are likely to sell out?" | `event.sellout.risk` | Events with high demand |
| "Show me ticket sales for this weekend" | `event.tickets.weekend` | Sales breakdown by event |
| "What's our average ticket price trend?" | `event.pricing.trend` | Price trend analysis |
| "Predict attendance for the championship" | `event.attendance.forecast` | Attendance prediction |
| "Show me events with low conversion" | `event.conversion.low` | Events needing attention |
| "What's the waitlist size for sold-out events?" | `event.waitlist.size` | Waitlist metrics |
| "Compare this season vs last season tickets" | `event.comparison.season` | YoY comparison |
| "Which sections have lowest sales?" | `event.sections.slow` | Underperforming sections |

#### 6.2.3 Venue Operations Queries

| Query Pattern | Intent | Response |
|--------------|--------|----------|
| "Show me today's venue operations status" | `venue.ops.status` | Operations dashboard |
| "What's the current capacity utilization?" | `venue.capacity.current` | Real-time capacity |
| "Predict crowd flow for gate opening" | `venue.crowd.forecast` | Crowd prediction |
| "Show me staff coverage for next event" | `venue.staff.schedule` | Staff scheduling |
| "What's our concession performance?" | `venue.concession.perf` | F&B metrics |
| "Compare venue satisfaction scores" | `venue.satisfaction.compare` | Venue comparison |
| "Show me security incidents this month" | `venue.security.incidents` | Security report |
| "What's the optimal gate assignment?" | `venue.gate.optimize` | Gate recommendations |

#### 6.2.4 Team & Athlete Queries

| Query Pattern | Intent | Response |
|--------------|--------|----------|
| "Show me the team's current standings" | `team.standings.current` | League standings |
| "What's our fan sentiment for the team?" | `team.sentiment.fans` | Fan sentiment analysis |
| "Compare our top 3 players by performance" | `athlete.performance.compare` | Performance comparison |
| "Show me player social engagement" | `athlete.social.engagement` | Social metrics |
| "What's the injury report?" | `athlete.injury.report` | Current injuries |
| "Predict player performance for next game" | `athlete.performance.predict` | Performance forecast |
| "Show me player sponsorship value" | `athlete.sponsorship.value` | Commercial metrics |
| "What's the roster depth by position?" | `team.roster.depth` | Position analysis |

#### 6.2.5 Revenue & Sponsorship Queries

| Query Pattern | Intent | Response |
|--------------|--------|----------|
| "Show me this month's revenue breakdown" | `revenue.monthly.breakdown` | Revenue by category |
| "What's our sponsorship ROI?" | `sponsor.roi.calculate` | ROI analysis |
| "Predict merchandise sales for next event" | `revenue.merch.forecast` | Merch prediction |
| "Show me premium seat conversion rate" | `revenue.premium.conversion` | Upgrade metrics |
| "What's our average revenue per fan?" | `revenue.per.fan` | Fan monetization |
| "Compare sponsorship activation performance" | `sponsor.activation.compare` | Activation metrics |
| "Show me concession sales by section" | `revenue.concession.bySection` | Section performance |
| "What's our dynamic pricing impact?" | `revenue.pricing.impact` | Pricing effectiveness |

#### 6.2.6 Loyalty & Rewards Queries

| Query Pattern | Intent | Response |
|--------------|--------|----------|
| "Show me loyalty tier distribution" | `loyalty.tier.distribution` | Tier breakdown |
| "What's our points redemption rate?" | `loyalty.redemption.rate` | Redemption metrics |
| "Show me most redeemed rewards" | `loyalty.rewards.popular` | Popular rewards |
| "What's the cost of loyalty program?" | `loyalty.cost.analysis` | Program cost analysis |
| "Show me new loyalty members this month" | `loyalty.members.new` | New enrollments |
| "What's our loyalty engagement rate?" | `loyalty.engagement.rate` | Engagement metrics |
| "Compare tier upgrade conversion" | `loyalty.upgrade.conversion` | Upgrade performance |
| "Show me reward inventory status" | `loyalty.inventory.status` | Available rewards |

---

### 6.3 Dashboard Views

#### 6.3.1 Fan Engagement Dashboard

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ FAN ENGAGEMENT DASHBOARD                                    Jun 12, 2026     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────┐  ┌─────────────────────────┐                  │
│  │    FAN BASE             │  │   ENGAGEMENT SCORE      │                  │
│  │                         │  │                          │                  │
│  │  Total Fans:  45,230   │  │  Avg Score:   72/100   │                  │
│  │  Active:       32,150  │  │  Trend:       +5.2% ↑   │                  │
│  │  Lapsed:       8,420   │  │  vs last month          │                  │
│  │  At Risk:      4,660   │  │                          │                  │
│  │                         │  │                          │                  │
│  └─────────────────────────┘  └─────────────────────────┘                  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  FAN ENGAGEMENT TREND - 30 DAYS                                     │  │
│  │                                                                  │  │
│  │  100 ┤                                                ████        │  │
│  │   80 ┤                                   ████       ████ ████     │  │
│  │   60 ┤                        ████      ████ ████  ████ ████ ████  │  │
│  │   40 ┤  ████    ████  ████  ████ ████  ████ ████ ████ ████ ████  │  │
│  │   20 ┤  ████ ████ ████ ████ ████ ████ ████ ████ ████ ████ ████  │  │
│  │    0 ┼─────────────────────────────────────────────────────────  │  │
│  │        Mon   Tue   Wed   Thu   Fri   Sat   Sun                    │  │
│  │                                                                  │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─────────────────────────┐  ┌─────────────────────────┐                  │
│  │   TIER DISTRIBUTION    │  │   TOP FANS THIS WEEK    │                  │
│  │                          │  │                          │                  │
│  │  Legend:       120  0.3%│  │  1. John D.     9,450 pts│                  │
│  │  Champion:   1,210  2.7%│  │  2. Sarah M.    8,230 pts│                  │
│  │  Enthusiast: 4,520 10.0%│  │  3. Mike T.      7,890 pts│                  │
│  │  Supporter: 13,570 30.0%│  │  4. Lisa K.      7,120 pts│                  │
│  │  Rookie:    25,810 57.0%│  │  5. David R.     6,540 pts│                  │
│  │                         │  │                          │                  │
│  └─────────────────────────┘  └─────────────────────────┘                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 6.3.2 Event & Revenue Dashboard

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ EVENT & REVENUE DASHBOARD                                 Jun 12, 2026     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐   │
│  │   TICKETS    │ │      ADR      │ │    REVENUE    │ │   ATTENDANCE  │   │
│  │   SOLD       │ │              │ │               │ │               │   │
│  │   78,450     │ │   ₹2,850     │ │   ₹2.35 Cr   │ │    85.2%      │   │
│  │   +12.3% ↑   │ │   +8.1% ↑    │ │   +15.4% ↑   │ │   +3.2% ↑     │   │
│  │   vs last    │ │   vs last    │ │   MTD        │ │   vs last     │   │
│  │   month      │ │   month      │ │               │ │   month       │   │
│  └───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  UPCOMING EVENTS                                                     │  │
│  │  ┌───────────────────────────────────────────────────────────────┐  │  │
│  │  │ Event              Date        Tickets    Revenue    Status   │  │  │
│  │  ├───────────────────────────────────────────────────────────────┤  │  │
│  │  │ Championship Game  Jun 20      45,230     ₹1.25 Cr   🔴 Sold │  │  │
│  │  │ Home vs Rival      Jun 25      38,450     ₹78.5 L   🟡 12%   │  │  │
│  │  │ Family Day        Jun 30      12,500     ₹18.5 L   🟢 65%   │  │  │
│  │  │ Playoff Game 1    Jul 05      42,000     ₹1.05 Cr   🟡 8%    │  │  │
│  │  └───────────────────────────────────────────────────────────────┘  │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─────────────────────────┐  ┌─────────────────────────┐                  │
│  │   REVENUE BY CATEGORY   │  │   SECTION PERFORMANCE    │                  │
│  │                          │  │                          │                  │
│  │  Tickets:      58%      │  │  Lower Bowl:   92% sold  │                  │
│  │  Sponsorship:  22%      │  │  Club Level:   88% sold  │                  │
│  │  Concession:   12%      │  │  Upper Bowl:   78% sold  │                  │
│  │  Merchandise:   8%       │  │  Suites:       95% sold │                  │
│  │                          │  │                          │                  │
│  └─────────────────────────┘  └─────────────────────────┘                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Economic Integration

### 7.1 Payment & Wallet Integration

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PAYMENT & WALLET INTEGRATION - SPORTS                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                      RABTUL ECOSYSTEM                                 │   │
│  │                                                                  │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │   │
│  │  │   RABTUL     │  │   RABTUL     │  │   RABTUL     │            │   │
│  │  │   PAY       │  │   WALLET     │  │   LENDING   │            │   │
│  │  │   Port 4001 │  │   Port 4004  │  │   Port 4006  │            │   │
│  │  │             │  │             │  │             │            │   │
│  │  │  - Payments │  │  - Balance  │  │  - BNPL     │            │   │
│  │  │  - UPI      │  │  - REZ Coins│  │  - EMI      │            │   │
│  │  │  - Cards    │  │  - Loyalty  │  │  - Credit   │            │   │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘            │   │
│  │         │                 │                 │                      │   │
│  │         └─────────────────┼─────────────────┘                      │   │
│  │                           │                                        │   │
│  │                           ▼                                        │   │
│  │  ┌──────────────────────────────────────────────────────────────┐ │   │
│  │  │                    UNIFIED FAN PAYMENTS                       │ │   │
│  │  │                                                              │ │   │
│  │  │  Ticket Purchase ────▶ RABTUL Pay                            │ │   │
│  │  │  Concession Order ───▶ RABTUL Pay                            │ │   │
│  │  │  Merchandise ────────▶ RABTUL Pay                             │ │   │
│  │  │  VIP Experience ─────▶ RABTUL Pay                            │ │   │
│  │  │                                                              │ │   │
│  │  │  Loyalty Points ◀───▶ RABTUL Wallet                          │ │   │
│  │  │  REZ Coins ◀────────▶ RABTUL Wallet                         │ │   │
│  │  │  Seat Charges ◀──────▶ RABTUL Wallet                         │ │   │
│  │  │                                                              │ │   │
│  │  │  Season Tickets ────▶ RABTUL Lending (EMI)                   │ │   │
│  │  │  Premium Packages ──▶ RABTUL Lending (BNPL)                  │ │   │
│  │  │                                                              │ │   │
│  │  └──────────────────────────────────────────────────────────────┘ │   │
│  │                                                                  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Revenue Streams

| Stream | Products | Integration | Revenue Model |
|--------|----------|-------------|---------------|
| **Ticket Sales** | Z-Events | RABTUL Pay | Transaction fee (2-5%) |
| **Dynamic Pricing** | Z-Events | Revenue Agent | Yield optimization |
| **Concession Sales** | REZ POS | RABTUL Pay | Transaction fee + margin |
| **Merchandise** | REZ POS | RABTUL Pay | Transaction fee + margin |
| **Premium Experiences** | Z-Events | RABTUL Pay | Higher margin |
| **Season Tickets** | Z-Events | RABTUL Lending | EMI processing |
| **Sponsorship** | BrandPulse | Direct | Commission on deals |
| **Loyalty Points** | REZ Loyalty | RABTUL Wallet | Points economics |

### 7.3 Loyalty Economics

```typescript
// Points Economics
interface LoyaltyEconomics {
  earning: {
    baseRate: 1,                    // 1 point per ₹1 spent
    multipliers: {
      rookie: 1,
      supporter: 1.25,
      enthusiast: 1.5,
      champion: 2,
      legend: 3
    };
    bonusEvents: {
      championship: 3,              // 3x points
      rivalry: 2,                    // 2x points
      firstEvent: 5                  // 5x points for first event
    };
  };
  
  redemption: {
    conversionRate: 100,            // 100 points = ₹1
    popularRewards: [
      { id: 'merch_voucher_500', points: 50000, value: 500 },
      { id: 'ticket_discount_100', points: 10000, value: 100 },
      { id: 'vip_experience', points: 200000, value: 5000 }
    ];
  };
  
  economics: {
    avgPointsPerFan: 15000,
    redemptionRate: 0.35,          // 35% of points redeemed
    pointsLiability: 0.15,           // 15% of points value as liability
    breakEvenMargin: 0.20            // 20% margin on redemptions
  };
}
```

### 7.4 Sponsorship Economics

```typescript
// Sponsorship Economics
interface SponsorshipEconomics {
  tiers: {
    platinum: {
      value: 50000000,               // ₹5 Cr per year
      rights: ['title_sponsor', 'jersey', 'courtside', 'digital', 'hospitality'],
      exclusivity: ['primary_category'],
      impressions: 50000000
    };
    gold: {
      value: 20000000,               // ₹2 Cr per year
      rights: ['jersey', 'courtside', 'digital', 'hospitality'],
      exclusivity: ['secondary_category'],
      impressions: 25000000
    };
    silver: {
      value: 10000000,               // ₹1 Cr per year
      rights: ['courtside', 'digital'],
      exclusivity: ['tertiary_category'],
      impressions: 10000000
    };
    bronze: {
      value: 5000000,                // ₹50 L per year
      rights: ['digital', 'hospitality'],
      impressions: 5000000
    };
  };
  
  activationTracking: {
    impressions: true,
    engagement: true,
    conversion: true,
    roi: true
  };
  
  commission: {
    dealFee: 0.10,                   // 10% of deal value
    activationFee: 0.15              // 15% of activation spend
  };
}
```

---

## 8. 6-Week Implementation Roadmap

### 8.1 Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    6-WEEK IMPLEMENTATION ROADMAP - SPORTS OS              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  WEEK 1-2          WEEK 3-4          WEEK 5-6                              │
│  ══════════        ══════════        ══════════                           │
│                                                                             │
│  FOUNDATION         CORE TWINS        ADVANCED                              │
│  ─────────         ─────────         ────────                              │
│                                                                             │
│  ┌─────────┐       ┌─────────┐       ┌─────────┐                           │
│  │ Z-Events│       │ Fan Twin│       │ Revenue │                           │
│  │ Setup   │       │ & Sync  │       │ Agent   │                           │
│  └─────────┘       └─────────┘       └─────────┘                           │
│                                                                             │
│  ┌─────────┐       ┌─────────┐       ┌─────────┐                           │
│  │ Fan Twin│       │ Event   │       │ Sponsorship│                        │
│  │ Schema  │       │ Twin    │       │ Agent    │                           │
│  └─────────┘       └─────────┘       └─────────┘                           │
│                                                                             │
│  ┌─────────┐       ┌─────────┐       ┌─────────┐                           │
│  │REZ POS  │       │ Venue   │       │ Business │                           │
│  │ Connect │       │ Twin    │       │ Copilot  │                           │
│  └─────────┘       └─────────┘       └─────────┘                           │
│                                                                             │
│  ┌─────────┐       ┌─────────┐       ┌─────────┐                           │
│  │ REZ QR  │       │ Team &  │       │ Full    │                           │
│  │ Cloud   │       │Athlete  │       │ Testing │                           │
│  └─────────┘       │ Twins   │       └─────────┘                           │
│                    └─────────┘                                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 8.2 Week-by-Week Breakdown

#### Week 1: Foundation Setup

| Day | Task | Deliverable | Owner |
|-----|------|-------------|-------|
| 1-2 | Z-Events API audit | API endpoints documented | Dev Team |
| 1-2 | TwinOS environment setup | Dev/Stage environments | Infra Team |
| 3-4 | Fan Twin schema design | JSON schema final | Data Team |
| 3-4 | REZ POS integration prep | API contracts ready | Dev Team |
| 5 | REZ QR Cloud integration prep | API contracts ready | Dev Team |
| 5-7 | Integration test environment | Test environment ready | Infra Team |

**Key Milestones:**
- [ ] Z-Events API fully documented
- [ ] Fan Twin schema approved
- [ ] Test environment operational

**Dependencies:** None

---

#### Week 2: Core Integration

| Day | Task | Deliverable | Owner |
|-----|------|-------------|-------|
| 1-2 | Fan Twin implementation | Fan Twin service running | Dev Team |
| 1-2 | Z-Events → Fan Twin sync | Bidirectional sync working | Dev Team |
| 3-4 | REZ POS → Fan Twin integration | Spend tracking active | Dev Team |
| 3-4 | REZ QR Cloud → Fan Twin | QR engagement tracking | Dev Team |
| 5 | REZ Loyalty integration | Points earning active | Dev Team |
| 5-7 | Initial data migration | Fan data synced | Data Team |

**Key Milestones:**
- [ ] Fan Twin operational
- [ ] Z-Events ↔ Fan Twin sync working
- [ ] POS integration active

**Dependencies:** Week 1 complete

---

#### Week 3: Twin Expansion

| Day | Task | Deliverable | Owner |
|-----|------|-------------|-------|
| 1-2 | Event Twin implementation | Event Twin service running | Dev Team |
| 1-2 | Venue Twin implementation | Venue Twin service running | Dev Team |
| 3-4 | Event → Venue relationship | Relationships mapped | Dev Team |
| 3-4 | Z-Events → Event Twin sync | Event data flowing | Dev Team |
| 5 | BrandPulse → Venue Twin | Reputation sync | Dev Team |
| 5-7 | Query optimization | Performance tuning | Data Team |

**Key Milestones:**
- [ ] Event Twin operational
- [ ] Venue Twin operational
- [ ] Cross-twin relationships established

**Dependencies:** Week 2 complete

---

#### Week 4: Team & Athlete Twins

| Day | Task | Deliverable | Owner |
|-----|------|-------------|-------|
| 1-2 | Team Twin implementation | Team Twin service running | Dev Team |
| 1-2 | Athlete Twin implementation | Athlete Twin service running | Dev Team |
| 3-4 | Team → Athlete relationship | Roster relationships | Dev Team |
| 3-4 | BrandPulse → Team Twin | Sentiment sync | Dev Team |
| 5 | Agent framework setup | Agent orchestrator ready | Dev Team |
| 5-7 | Agent integration testing | Agents connected to twins | Dev Team |

**Key Milestones:**
- [ ] Team Twin operational
- [ ] Athlete Twin operational
- [ ] Agent framework ready

**Dependencies:** Week 3 complete

---

#### Week 5: Advanced Agents

| Day | Task | Deliverable | Owner |
|-----|------|-------------|-------|
| 1-2 | Fan Engagement Agent | Agent deployed | Dev Team |
| 1-2 | Ticketing Agent | Agent deployed | Dev Team |
| 3-4 | Revenue Agent | Agent deployed | Dev Team |
| 3-4 | Loyalty Agent | Agent deployed | Dev Team |
| 5 | Sponsorship Agent | Agent deployed | Dev Team |
| 5-7 | Agent stress testing | Performance validated | QA Team |

**Key Milestones:**
- [ ] All core agents deployed
- [ ] Agents communicating via protocol
- [ ] Stress testing passed

**Dependencies:** Week 4 complete

---

#### Week 6: Business Copilot & Launch Prep

| Day | Task | Deliverable | Owner |
|-----|------|-------------|-------|
| 1-2 | Business Copilot integration | Copilot connected to twins | Dev Team |
| 1-2 | Query library setup | 50+ queries configured | Data Team |
| 3-4 | Dashboard views | Operations dashboards live | Dev Team |
| 3-4 | RABTUL integration final | Payments fully integrated | Dev Team |
| 5 | Security audit | Security review complete | Security Team |
| 5-7 | Full E2E testing | End-to-end validated | QA Team |
| 7 | Documentation | Docs complete | Dev Team |

**Key Milestones:**
- [ ] Business Copilot operational
- [ ] All dashboards live
- [ ] Security audit passed
- [ ] Documentation complete

**Dependencies:** Week 5 complete

---

### 8.3 Success Metrics

| Metric | Week 2 | Week 4 | Week 6 | Target |
|--------|--------|--------|--------|--------|
| Fan Twins Created | 1,000 | 10,000 | 50,000 | 100,000 |
| Events Synced | 100 | 500 | 2,000 | 5,000 |
| API Latency (p99) | <500ms | <200ms | <100ms | <100ms |
| Agent Uptime | 99% | 99.5% | 99.9% | 99.9% |
| Integration Tests | 50 | 200 | 500 | 1,000 |
| Query Coverage | 10 | 30 | 50 | 100 |
| Dashboard Views | 2 | 5 | 10 | 15 |

---

### 8.4 Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Data migration delays | Medium | High | Start Week 2, parallel track |
| API rate limits | High | Medium | Implement caching, batch sync |
| Agent performance issues | Medium | High | Incremental deployment, monitoring |
| Security vulnerabilities | Low | Critical | Early security audit (Week 5) |
| Integration failures | High | High | Comprehensive E2E testing |
| Scope creep | Medium | Medium | Strict scope management |

---

### 8.5 Team Structure

| Role | Count | Responsibilities |
|------|-------|------------------|
| Tech Lead | 1 | Architecture, decisions |
| Backend Dev | 3 | Twin services, integrations |
| Frontend Dev | 1 | Dashboards, Copilot UI |
| Data Engineer | 1 | Data models, migration |
| QA Engineer | 1 | Testing, validation |
| DevOps | 1 | Infrastructure, deployment |

**Total:** 8 team members for 6 weeks

---

### 8.6 Technical Requirements

**Infrastructure:**
- TwinOS cluster (3 nodes)
- MongoDB for twins (replica set)
- Redis for caching
- Kafka for event streaming
- Monitoring (Prometheus + Grafana)

**APIs to Integrate:**
- Z-Events (Port 5100)
- REZ POS (Port 4081)
- REZ QR Cloud (Port 4090)
- REZ Loyalty (Port 4037)
- BrandPulse (Port 4770)
- RABTUL Pay (Port 4001)
- RABTUL Wallet (Port 4004)

---

## Appendix A: API Contract Summary

### A.1 Inbound APIs (External → Sports OS)

| API | Method | Endpoint | Purpose |
|-----|--------|----------|---------|
| Z-Events | POST | `/api/events` | Create event |
| Z-Events | GET | `/api/events/:id` | Get event |
| Z-Events | POST | `/api/events/:id/rsvp` | RSVP |
| Z-Events | POST | `/api/events/:id/tickets` | Purchase ticket |
| Z-Events | POST | `/api/events/:id/checkin` | Check-in |
| REZ POS | POST | `/api/pos/order` | Create order |
| REZ QR | POST | `/api/qr/scan` | QR scan |
| REZ Loyalty | POST | `/api/loyalty/earn` | Earn points |
| REZ Loyalty | POST | `/api/loyalty/redeem` | Redeem points |

### A.2 Outbound APIs (Sports OS → Internal)

| API | Method | Endpoint | Purpose |
|-----|--------|----------|---------|
| TwinOS | POST | `/api/twin/fan/sync` | Sync fan data |
| TwinOS | POST | `/api/twin/event/sync` | Sync event data |
| TwinOS | POST | `/api/twin/venue/sync` | Sync venue data |
| TwinOS | GET | `/api/twin/fan/:id` | Get fan twin |
| TwinOS | GET | `/api/twin/event/:id` | Get event twin |
| RABTUL | POST | `/api/payments/initiate` | Process payment |
| RABTUL | POST | `/api/wallet/topup` | Top up wallet |
| BrandPulse | GET | `/api/brand/:name/sentiment` | Get sentiment |

---

## Appendix B: Event Schema

### B.1 Core Events

```typescript
// Fan Events
const FAN_EVENTS = {
  'fan.created': 'Fan account created',
  'fan.preference.updated': 'Fan preferences changed',
  'fan.tier.upgraded': 'Fan tier changed',
  'fan.churn.detected': 'Churn risk detected',
  'fan.ltv.calculated': 'LTV recalculated'
};

// Event Events
const EVENT_EVENTS = {
  'event.created': 'Event created',
  'event.published': 'Event made public',
  'event.ticket_sale': 'Ticket purchased',
  'event.checkin': 'Fan checked in',
  'event.completed': 'Event ended'
};

// Revenue Events
const REVENUE_EVENTS = {
  'revenue.ticket': 'Ticket revenue',
  'revenue.concession': 'Concession revenue',
  'revenue.merchandise': 'Merchandise revenue',
  'revenue.sponsorship': 'Sponsorship revenue'
};
```

---

## Appendix C: Glossary

| Term | Definition |
|------|------------|
| **Fan Twin** | Digital representation of a sports fan including preferences, behavior, and predictions |
| **Athlete Twin** | Digital representation of an athlete including performance, commercial, and fan data |
| **Team Twin** | Digital representation of a sports team including roster, performance, and fan base |
| **Venue Twin** | Digital representation of a sports venue including facilities, operations, and metrics |
| **Event Twin** | Digital representation of a sports event including ticketing, attendance, and engagement |
| **LTV** | Lifetime Value - predicted total revenue from a fan over their relationship |
| **ADR** | Average Daily Rate - average ticket price |
| **RevPAR** | Revenue Per Available Room (adapted: Revenue Per Available Seat) |
| **NPS** | Net Promoter Score - fan satisfaction metric |
| **BOA** | Business Operating Agent - AI agent for business function |

---

**Document Status:** Ready for Implementation
**Last Updated:** 2026-06-12
**Maintained by:** RTNM Digital Architecture Team
**Version:** 1.0
