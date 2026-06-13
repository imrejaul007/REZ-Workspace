# Transportation & Logistics Industry OS - Integration Specification

**Document Version:** 1.0.0  
**Date:** June 12, 2026  
**Author:** RTNM Architecture Team  
**Status:** Ready for Implementation

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

The Transportation & Logistics industry faces several critical challenges that this OS aims to address:

| Challenge | Current Impact | OS Solution |
|-----------|----------------|-------------|
| **Fragmented Operations** | Multiple disconnected systems for rides, delivery, fleet management | Unified OS with shared data layer |
| **Driver Retention** | High churn due to low earnings visibility | AI-powered incentives and career progression |
| **Fleet Utilization** | Average 45-60% vehicle utilization rate | Real-time matching and dynamic pricing |
| **Supply-Demand Imbalance** | Surge pricing volatility, empty miles | Predictive demand forecasting |
| **Compliance Management** | Manual license, insurance, certification tracking | Automated compliance workflows |
| **Customer Experience** | Inconsistent service quality | Standardized service protocols via Digital Twins |

### 1.2 Current Product Landscape

The RTNM ecosystem already has strong products covering the transportation value chain:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    TRANSPORTATION & LOGISTICS ECOSYSTEM                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    │
│   │ KHAIRMOVE   │    │ KHAIRMOVE   │    │ KHAIRMOVE   │    │   AIRZY     │    │
│   │   Ride      │    │   Fleet     │    │  Logistics  │    │  (Airport)  │    │
│   │  Port 4601  │    │  Port 4602  │    │ Port 4603   │    │ Port 4500+  │    │
│   └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘    │
│          │                  │                  │                  │            │
│          └──────────────────┼──────────────────┘                  │            │
│                             │                                     │            │
│                             ▼                                     ▼            │
│   ┌─────────────────────────────────────────────────────────────────────────┐  │
│   │                        KHAIRMOVE API GATEWAY (Port 4600)                 │  │
│   │                     Unified Entry Point for All Services                 │  │
│   └─────────────────────────────────────────────────────────────────────────┘  │
│                                    │                                           │
│          ┌─────────────────────────┼─────────────────────────┐                │
│          │                         │                         │                │
│          ▼                         ▼                         ▼                │
│   ┌─────────────┐          ┌─────────────┐          ┌─────────────┐          │
│   │  DISPATCH   │          │   TWINOS    │          │   REZ       │          │
│   │   Engine    │          │   (4055)    │          │ INTELLIGENCE│          │
│   └─────────────┘          └─────────────┘          └─────────────┘          │
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐  │
│   │                        RABTUL FINANCIAL LAYER                            │  │
│   │                    (Auth | Wallet | Payment | Notify)                    │  │
│   └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 1.3 Integration Opportunity

By integrating these products into a unified Transportation & Logistics OS, we can achieve:

| Metric | Current State | Target State | Improvement |
|--------|---------------|--------------|-------------|
| Fleet Utilization | 45-60% | 75-85% | +35% |
| Driver Retention | 6 months avg | 18+ months | 3x improvement |
| Dispatch Time | 3-5 minutes | < 2 minutes | 50%+ faster |
| Customer Satisfaction | 4.2/5.0 | 4.7/5.0 | +12% |
| Empty Miles | 25-30% | 10-15% | 50% reduction |
| Compliance Cost | Manual process | Automated 90% | 80% cost reduction |

---

## 2. Product Capability Matrix

### 2.1 KHAIRMOVE Ride

| Attribute | Details |
|-----------|---------|
| **Company** | KHAIRMOVE |
| **Port** | 4601 |
| **Core Capabilities** | Multi-modal ride booking (Taxi, Auto, Bike), Real-time tracking, Dynamic pricing |
| **Data Produced** | Ride history, User preferences, Pickup/drop locations, Payment transactions, Driver ratings |
| **Data Needed** | Driver availability, Vehicle location, Surge pricing, User identity |
| **Current Integration** | RABTUL Pay (in-app payments), RABTUL Notify (notifications) |
| **API Endpoints** | `POST /api/rides`, `GET /api/rides/:id`, `PUT /api/rides/:id/status` |

### 2.2 KHAIRMOVE Fleet

| Attribute | Details |
|-----------|---------|
| **Company** | KHAIRMOVE |
| **Port** | 4602 |
| **Core Capabilities** | Fleet operations management, Driver onboarding, Vehicle tracking, Incentive management |
| **Data Produced** | Fleet statistics, Driver scores, Vehicle health, Utilization metrics, Earnings data |
| **Data Needed** | Driver location updates, Ride assignments, Compliance documents, Insurance expiry |
| **Current Integration** | REZ Intelligence (ML scoring), Socket.io (real-time updates) |
| **API Endpoints** | `POST /api/fleets`, `GET /api/drivers`, `POST /api/dispatch`, `GET /api/surge/:lat/:lng` |

### 2.3 KHAIRMOVE Logistics

| Attribute | Details |
|-----------|---------|
| **Company** | KHAIRMOVE |
| **Port** | 4603/4604 |
| **Core Capabilities** | Package delivery, Food delivery, Multi-carrier aggregation, Route optimization |
| **Data Produced** | Delivery orders, Tracking events, POD (Proof of Delivery), Delivery times |
| **Data Needed** | Driver availability, Vehicle capacity, Route preferences, Customer locations |
| **Current Integration** | KHAIRMOVE Fleet (driver assignment), External carrier APIs |
| **API Endpoints** | `POST /api/deliveries`, `GET /api/deliveries/:id`, `PUT /api/deliveries/:id/status` |

### 2.4 Dispatch

| Attribute | Details |
|-----------|---------|
| **Company** | KHAIRMOVE |
| **Core Capabilities** | AI-powered dispatch optimization, Supply-demand matching, Surge prediction |
| **Data Produced** | Dispatch decisions, Driver assignments, ETA calculations, Matching scores |
| **Data Needed** | Available drivers, Customer requests, Demand signals, Driver scores |
| **Current Integration** | KHAIRMOVE Fleet (driver data), REZ Intelligence (ML models) |
| **Key Algorithm** | Priority score = (Driver Score × 10) - (Distance × 0.5) + Demand Boost |

### 2.5 KHAIRMOVE Driver

| Attribute | Details |
|-----------|---------|
| **Company** | KHAIRMOVE |
| **Core Capabilities** | Driver partner app, Ride acceptance, Navigation, Earnings tracking |
| **Data Produced** | Location updates, Ride acceptance/cancellation, Customer ratings, Documents |
| **Data Needed** | Ride requests, Navigation routes, Earnings updates, Incentive offers |
| **Current Integration** | KHAIRMOVE Fleet (status sync), Socket.io (real-time) |
| **Key Metrics** | Acceptance rate, Cancellation rate, Rating, Total rides, Utilization |

### 2.6 Airzy

| Attribute | Details |
|-----------|---------|
| **Company** | KHAIRMOVE |
| **Ports** | 4500-4509 (10 services) |
| **Core Capabilities** | Flight booking, Lounge access, Airport transfers, Travel wallet |
| **Data Produced** | Travel itineraries, Lounge bookings, Flight status, Coin transactions |
| **Data Needed** | User identity, Payment methods, Loyalty tier, Airport locations |
| **Current Integration** | Amadeus (flights), DreamFolks/Priority Pass (lounges), REZ Intelligence |
| **Membership Tiers** | Basic (Free), Plus (₹2,999), Elite (₹9,999), Royale (₹29,999) |

### 2.7 Distribution OS

| Attribute | Details |
|-----------|---------|
| **Company** | Nexha |
| **Port** | 4300 |
| **Core Capabilities** | Distribution network management, Van sales, Route optimization, Collection management |
| **Data Produced** | Sales orders, Inventory levels, Collection records, Route performance |
| **Data Needed** | Retailer locations, Product catalog, Driver routes, Payment collections |
| **Current Integration** | HOJAI SkillNet (AI), TradeFinance (credit), Intelligence Layer |
| **Key Features** | Distributor management, Commission calculation, Geo-tracking |

---

## 3. Twin Architecture

### 3.1 Twin Overview

The Transportation & Logistics OS requires the following Digital Twins:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          TRANSPORTATION TWIN ECOSYSTEM                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                           TWINOS LAYER (Port 4055)                     │   │
│   │                    Universal Digital Twin Infrastructure                │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                    │                                           │
│          ┌─────────────────────────┼─────────────────────────┐                │
│          │                         │                         │                │
│          ▼                         ▼                         ▼                │
│   ┌─────────────┐          ┌─────────────┐          ┌─────────────┐          │
│   │  VEHICLE    │          │   DRIVER    │          │    RIDER    │          │
│   │    TWIN     │◄────────►│    TWIN     │◄────────►│    TWIN     │          │
│   └─────────────┘          └─────────────┘          └─────────────┘          │
│          │                         │                         │                │
│          │                         │                         │                │
│          ▼                         ▼                         ▼                │
│   ┌─────────────┐          ┌─────────────┐          ┌─────────────┐          │
│   │  FLEET      │          │  JOURNEY    │          │   ORDER     │          │
│   │    TWIN     │          │    TWIN     │          │    TWIN     │          │
│   └─────────────┘          └─────────────┘          └─────────────┘          │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Vehicle Twin

| Attribute | Details |
|-----------|---------|
| **Twin Name** | VehicleTwin |
| **Twin ID Pattern** | `VEH-{registrationNumber}-{uuid}` |
| **Managed By** | Vehicle Lifecycle Agent |

**Data Model:**
```typescript
interface VehicleTwin {
  twinId: string;                    // Unique identifier
  vehicleId: string;                 // Fleet system ID
  registrationNumber: string;         // License plate
  type: 'sedan' | 'suv' | 'auto' | 'bike' | 'van' | 'truck';
  make: string;                      // e.g., "Maruti", "Honda"
  model: string;                      // e.g., "Swift", "Activa"
  year: number;
  color: string;
  
  // Lifecycle State
  status: 'active' | 'maintenance' | 'retired' | 'stolen';
  currentOdometer: number;
  fuelLevel?: number;                // Percentage
  batteryLevel?: number;             // For EVs
  
  // Health Metrics
  health: {
    overall: number;                 // 0-100 score
    engineHealth: number;
    tireHealth: number;
    brakeHealth: number;
    lastServiceDate: Date;
    nextServiceDate: Date;
    serviceHistory: ServiceRecord[];
  };
  
  // Compliance
  compliance: {
    insuranceExpiry: Date;
    pollutionCertExpiry: Date;
    roadTaxExpiry: Date;
    fitnessCertExpiry: Date;
    isVerified: boolean;
  };
  
  // Assignment
  currentDriverId?: string;
  assignedFleetId: string;
  
  // Real-time Location
  location: {
    lat: number;
    lng: number;
    heading: number;
    speed: number;
    updatedAt: Date;
  };
  
  // Relationships
  relationships: {
    driver: string[];                // DriverTwin IDs
    fleet: string;                   // FleetTwin ID
    journeys: string[];              // JourneyTwin IDs
    orders: string[];                // OrderTwin IDs
  };
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  version: number;
}
```

**Agents Interacting with VehicleTwin:**
- Vehicle Lifecycle Agent (primary owner)
- Fleet Optimization Agent
- Dispatch Agent
- Maintenance Prediction Agent
- Compliance Agent

### 3.3 Driver Twin

| Attribute | Details |
|-----------|---------|
| **Twin Name** | DriverTwin |
| **Twin ID Pattern** | `DRV-{phoneHash}-{uuid}` |
| **Managed By** | Driver Management Agent |

**Data Model:**
```typescript
interface DriverTwin {
  twinId: string;                    // Unique identifier
  driverId: string;                  // Fleet system ID
  
  // Identity
  name: string;
  phone: string;                     // Hashed for privacy
  email?: string;
  profileImage?: string;
  dateOfBirth?: Date;
  bloodGroup?: string;
  
  // License & Documents
  documents: {
    license: {
      number: string;
      type: 'two-wheeler' | 'four-wheeler' | 'commercial';
      expiry: Date;
      isVerified: boolean;
    };
    aadhar?: string;                 // Hashed
    pan?: string;                    // Hashed
    policeVerification?: Date;
  };
  
  // Performance Metrics
  performance: {
    overallScore: number;            // 0-5.0
    rating: number;                  // User rating 0-5.0
    totalRides: number;
    acceptanceRate: number;          // 0-1.0
    cancellationRate: number;        // 0-1.0
    averageEarnings: number;         // Per day
    utilizationRate: number;         // Online time / Available time
    safetyScore: number;             // 0-100
  };
  
  // Tier System
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  tierProgress: {
    currentPoints: number;
    requiredPoints: number;
    milestones: TierMilestone[];
  };
  
  // Earnings
  earnings: {
    totalEarned: number;
    pendingPayout: number;
    thisWeek: number;
    thisMonth: number;
    incentiveEarnings: number;
    commissionDeducted: number;
  };
  
  // Status
  status: 'offline' | 'online' | 'busy' | 'break' | 'suspended';
  
  // Location (real-time)
  currentLocation?: {
    lat: number;
    lng: number;
    heading: number;
    updatedAt: Date;
  };
  
  // Vehicle Assignment
  assignedVehicleId?: string;
  preferredVehicleTypes: string[];
  
  // Working Hours
  workSchedule: {
    preferredShift: 'morning' | 'evening' | 'night' | 'flexible';
    maxHoursPerDay: number;
    daysActivePerWeek: number;
  };
  
  // Relationships
  relationships: {
    fleet: string;                   // FleetTwin ID
    vehicles: string[];              // VehicleTwin IDs
    journeys: string[];              // JourneyTwin IDs
    riderTwins: string[];            // Frequent rider IDs
  };
  
  // Incentives & Rewards
  incentives: {
    activeOffers: Incentive[];
    earnedRewards: Reward[];
    referralCode: string;
    referredDrivers: number;
  };
  
  // Compliance
  compliance: {
    kycVerified: boolean;
    backgroundVerified: boolean;
    trainingCompleted: boolean;
    lastComplianceCheck: Date;
  };
  
  createdAt: Date;
  updatedAt: Date;
}
```

**Agents Interacting with DriverTwin:**
- Driver Management Agent (primary owner)
- Dispatch Agent
- Incentive Agent
- Compliance Agent
- Earnings Agent
- Training Agent

### 3.4 Rider Twin

| Attribute | Details |
|-----------|---------|
| **Twin Name** | RiderTwin |
| **Twin ID Pattern** | `RDR-{phoneHash}-{uuid}` |
| **Managed By** | Rider Experience Agent |

**Data Model:**
```typescript
interface RiderTwin {
  twinId: string;
  riderId: string;
  
  // Identity
  name: string;
  phone: string;
  email?: string;
  
  // Preferences
  preferences: {
    vehicleType: 'economy' | 'premium' | 'auto' | 'bike';
    paymentMethod: 'wallet' | 'card' | 'upi' | 'cash';
    smokingPreferred: boolean;
    acPreferred: boolean;
    musicAllowed: boolean;
    petFriendly: boolean;
    language?: string;
  };
  
  // Travel Patterns
  patterns: {
    frequentRoutes: FrequentRoute[];
    homeLocation?: GeoLocation;
    workLocation?: GeoLocation;
    averageTripDistance: number;
    averageTripFare: number;
    peakHours: string[];            // "08:00-09:00", "18:00-19:00"
    frequentDays: string[];          // ["monday", "tuesday"]
  };
  
  // Loyalty
  loyalty: {
    tier: 'basic' | 'silver' | 'gold' | 'platinum';
    points: number;
    lifetimeRides: number;
    lifetimeSpend: number;
    referralCode: string;
    referredCount: number;
  };
  
  // Safety Preferences
  safety: {
    shareTripEnabled: boolean;
    emergencyContact?: string;
    trackMyRideEnabled: boolean;
    sosFeatureEnabled: boolean;
  };
  
  // Relationships
  relationships: {
    familyMembers: string[];        // Other RiderTwin IDs
    favoriteDrivers: string[];      // DriverTwin IDs
  };
  
  // Financial
  walletBalance?: number;
  savedPaymentMethods: PaymentMethod[];
  
  createdAt: Date;
  updatedAt: Date;
}
```

### 3.5 Fleet Twin

| Attribute | Details |
|-----------|---------|
| **Twin Name** | FleetTwin |
| **Twin ID Pattern** | `FLT-{ownerId}-{uuid}` |
| **Managed By** | Fleet Operations Agent |

**Data Model:**
```typescript
interface FleetTwin {
  twinId: string;
  fleetId: string;
  ownerId: string;
  
  // Identity
  name: string;
  companyName?: string;
  contactPhone: string;
  address?: Address;
  
  // Fleet Composition
  composition: {
    totalVehicles: number;
    byType: Record<VehicleType, number>;
    activeVehicles: number;
    maintenanceVehicles: number;
  };
  
  // Driver Pool
  drivers: {
    total: number;
    online: number;
    byTier: Record<Tier, number>;
  };
  
  // Performance Metrics
  performance: {
    averageRating: number;
    totalRides: number;
    totalEarnings: number;
    averageUtilization: number;     // Percentage
    onTimeDeliveryRate: number;
    customerSatisfaction: number;
  };
  
  // Financial
  financials: {
    monthlyRevenue: number;
    monthlyPayouts: number;
    pendingCommissions: number;
    incentiveBudget: number;
    maintenanceBudget: number;
  };
  
  // Operations
  operations: {
    operatingAreas: GeoZone[];
    serviceTypes: ServiceType[];     // ['ride', 'delivery', 'both']
    operatingHours: OperatingHours;
  };
  
  // Compliance
  compliance: {
    companyVerified: boolean;
    allVehiclesInsured: boolean;
    allDriversVerified: boolean;
    taxCompliance: boolean;
  };
  
  // Relationships
  relationships: {
    vehicles: string[];              // VehicleTwin IDs
    drivers: string[];               // DriverTwin IDs
    orders: string[];                // OrderTwin IDs
    parentCompany?: string;           // For franchise fleets
  };
  
  status: 'active' | 'suspended' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}
```

### 3.6 Journey Twin

| Attribute | Details |
|-----------|---------|
| **Twin Name** | JourneyTwin |
| **Twin ID Pattern** | `JRN-{timestamp}-{uuid}` |
| **Managed By** | Journey Orchestration Agent |

**Data Model:**
```typescript
interface JourneyTwin {
  twinId: string;
  journeyId: string;
  
  // Journey Type
  type: 'ride' | 'delivery' | 'transfer' | 'multi-stop';
  
  // Participants
  rider?: string;                    // RiderTwin ID
  driver: string;                    // DriverTwin ID
  vehicle: string;                   // VehicleTwin ID
  fleet: string;                     // FleetTwin ID
  
  // Route
  route: {
    pickup: GeoLocation & { address: string; timestamp: Date };
    dropoff: GeoLocation & { address: string; timestamp?: Date };
    waypoints?: GeoLocation[];
    plannedDistance: number;         // In kilometers
    plannedDuration: number;         // In minutes
    actualDistance?: number;
    actualDuration?: number;
  };
  
  // Pricing
  pricing: {
    baseFare: number;
    distanceFare: number;
    timeFare: number;
    surgeMultiplier: number;
    discount: number;
    totalFare: number;
    fareBreakdown: FareComponent[];
  };
  
  // Status
  status: 'requested' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  statusHistory: StatusChange[];
  
  // Real-time Tracking
  tracking: {
    currentLocation: GeoLocation;
    routeProgress: number;           // 0-100 percentage
    eta: Date;
    trafficDelay: number;            // Minutes
  };
  
  // Ratings & Feedback
  feedback: {
    riderRating?: number;
    riderFeedback?: string;
    driverRating?: number;
    tags: string[];
  };
  
  // Safety Events
  safetyEvents: {
    sosTriggered: boolean;
    deviationDetected: boolean;
    overspeedEvents: number;
    harshBraking: number;
  };
  
  createdAt: Date;
  completedAt?: Date;
  updatedAt: Date;
}
```

### 3.7 Order Twin (for Logistics/Delivery)

| Attribute | Details |
|-----------|---------|
| **Twin Name** | OrderTwin |
| **Twin ID Pattern** | `ORD-{orderId}` |
| **Managed By** | Logistics Orchestration Agent |

**Data Model:**
```typescript
interface OrderTwin {
  twinId: string;
  orderId: string;
  
  // Order Type
  type: 'package' | 'food' | 'grocery' | 'pharmacy';
  
  // Sender & Receiver
  parties: {
    sender: {
      name: string;
      phone: string;
      address: Address;
      location: GeoLocation;
    };
    receiver: {
      name: string;
      phone: string;
      address: Address;
      location: GeoLocation;
    };
  };
  
  // Package Details
  package: {
    weight?: number;                 // In kg
    dimensions?: { l: number; b: number; h: number };
    description: string;
    fragile: boolean;
    value?: number;                  // Declared value
  };
  
  // Fulfillment
  fulfillment: {
    assignedDriver?: string;          // DriverTwin ID
    assignedVehicle?: string;         // VehicleTwin ID
    fleet?: string;                   // FleetTwin ID
    pickupOTP?: string;
    deliveryOTP?: string;
  };
  
  // Timeline
  timeline: {
    orderPlaced: Date;
    pickupScheduled?: Date;
    pickedUp?: Date;
    inTransit?: Date;
    outForDelivery?: Date;
    delivered?: Date;
    deliveryAttempts: DeliveryAttempt[];
  };
  
  // Proof of Delivery
  pod: {
    signature?: string;               // Base64
    photo?: string;                   // URL
    otpVerified: boolean;
    recipientName?: string;
    deliveredTo?: string;             // "Front desk", "Neighbor"
  };
  
  // Pricing
  pricing: {
    deliveryFee: number;
    codCharges?: number;             // Cash on Delivery
    packagingFee?: number;
    distanceCharge: number;
    surgeCharge: number;
    discount: number;
    totalCharge: number;
  };
  
  // Status
  status: 'pending' | 'assigned' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'rto';
  
  // Tracking
  tracking: {
    currentLocation?: GeoLocation;
    lastUpdate: Date;
    routeProgress: number;
  };
  
  // Relationships
  relationships: {
    rider?: string;                  // For food orders, RiderTwin ID
    driver: string;
    vehicle: string;
    fleet: string;
    merchant?: string;                // For business orders
  };
  
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 4. Integration Flows

### 4.1 Core Integration: KHAIRMOVE Fleet ↔ TwinOS

**Flow: Real-time Vehicle and Driver State Synchronization**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                  FLEET ↔ TWINOS REAL-TIME SYNC FLOW                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌──────────────┐        ┌──────────────┐        ┌──────────────┐              │
│  │ KHAIRMOVE    │        │   EVENT BUS  │        │   TWINOS     │              │
│  │   Fleet      │        │   (Kafka)    │        │   (4055)     │              │
│  │  (Port 4602) │        │              │        │              │              │
│  └──────────────┘        └──────────────┘        └──────────────┘              │
│         │                        │                        │                     │
│         │ POST /api/vehicles     │                        │                     │
│         │ /:id/location          │                        │                     │
│         │ ──────────────────────►│                        │                     │
│         │                        │                        │                     │
│         │ POST /api/drivers      │                        │                     │
│         │ /:id/location          │                        │                     │
│         │ ──────────────────────►│                        │                     │
│         │                        │                        │                     │
│         │                        │  vehicle.location.update│                    │
│         │                        │  driver.location.update │                   │
│         │                        │  ───────────────────────►│                   │
│         │                        │                        │                     │
│         │                        │                        │ ▼                   │
│         │                        │                        │ Update VehicleTwin  │
│         │                        │                        │ Update DriverTwin   │
│         │                        │                        │ ────────────────────►│
│         │                        │                        │     Sync Complete    │
│         │                        │                        │ ◄────────────────────│
│         │                        │                        │                     │
│         │                        │ ◄──────────────────────│                     │
│         │   Acknowledged         │   State Updated        │                     │
│         │ ◄──────────────────────│                        │                     │
│         │                        │                        │                     │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**API Endpoints Required:**

| Source | Target | Endpoint | Method | Purpose |
|--------|--------|----------|--------|---------|
| Fleet Service | TwinOS | `/api/twins/vehicle` | POST | Create VehicleTwin |
| Fleet Service | TwinOS | `/api/twins/vehicle/:id` | PUT | Update VehicleTwin |
| Fleet Service | TwinOS | `/api/twins/vehicle/:id/location` | PUT | Update location |
| Fleet Service | TwinOS | `/api/twins/driver` | POST | Create DriverTwin |
| Fleet Service | TwinOS | `/api/twins/driver/:id` | PUT | Update DriverTwin |
| Fleet Service | TwinOS | `/api/twins/driver/:id/location` | PUT | Update location |
| TwinOS | Fleet Service | `/api/twins/driver/:id/recommend-incentive` | GET | Get incentive rec |

**Events Exchanged:**

```typescript
// Fleet → TwinOS Events
interface VehicleLocationEvent {
  eventType: 'VEHICLE_LOCATION_UPDATE';
  twinId: string;
  payload: {
    lat: number;
    lng: number;
    heading: number;
    speed: number;
    odometer?: number;
    fuelLevel?: number;
  };
  timestamp: Date;
  source: 'khaimove-fleet';
}

interface DriverLocationEvent {
  eventType: 'DRIVER_LOCATION_UPDATE';
  twinId: string;
  payload: {
    lat: number;
    lng: number;
    heading: number;
    speed: number;
    status: 'online' | 'offline' | 'busy';
  };
  timestamp: Date;
  source: 'khaimove-fleet';
}

interface VehicleHealthEvent {
  eventType: 'VEHICLE_HEALTH_UPDATE';
  twinId: string;
  payload: {
    overallScore: number;
    alerts: VehicleAlert[];
    nextServiceDue: Date;
  };
  timestamp: Date;
  source: 'khaimove-fleet';
}

// TwinOS → Fleet Events
interface IncentiveRecommendationEvent {
  eventType: 'INCENTIVE_RECOMMENDATION';
  targetDriverId: string;
  payload: {
    recommendedAmount: number;
    reason: string;
    expectedImpact: {
      utilizationIncrease: number;
      retentionProbability: number;
    };
  };
  timestamp: Date;
  source: 'twinos';
}
```

### 4.2 Dispatch Integration Flow

**Flow: AI-Optimized Driver Dispatch**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                     AI-OPTIMIZED DISPATCH FLOW                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  1. RIDE REQUEST                                                               │
│  ┌──────────────┐                                                               │
│  │ KHAIRMOVE    │                                                               │
│  │   Ride       │  POST /api/rides { pickup, dropoff, type }                    │
│  │  (Port 4601) │──────────────────────────────────────────────────┐            │
│  └──────────────┘                                                    │            │
│                                                                      ▼            │
│  2. DEMAND ANALYSIS                                                     │            │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐         │            │
│  │   TWINOS     │◄────│ REZ Intel    │◄────│ REZ Intel    │         │            │
│  │  VehicleTwin │     │   Signal     │     │ Predictive   │         │            │
│  │  DriverTwin  │     │  Aggregator  │     │   Engine     │         │            │
│  └──────────────┘     └──────────────┘     └──────────────┘         │            │
│         │                                                                │            │
│         │ 3. NEARBY DRIVERS                                            │            │
│         │  Query: drivers within 5km radius                             │            │
│         │  Sort: priority score descending                              │            │
│         │ ◄─────────────────────────────────────────────────────────── │            │
│         │                                                                │            │
│         │ 4. ML SCORING                                                 │            │
│         │  ┌─────────────────────────────────────────────────────┐     │            │
│         │  │  Priority Score = (DriverScore × 10)                │     │            │
│         │  │                        - (Distance × 0.5)          │     │            │
│         │  │                        + (DemandBoost)               │     │            │
│         │  │  DemandBoost = surge_multiplier × demand_level       │     │            │
│         │  └─────────────────────────────────────────────────────┘     │            │
│         │                                                                │            │
│         ▼                                                                │            │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐              │            │
│  │  DISPATCH    │────►│ KHAIRMOVE    │────►│ KHAIRMOVE    │              │            │
│  │   Engine     │     │   Fleet      │     │   Driver     │              │            │
│  └──────────────┘     └──────────────┘     └──────────────┘              │            │
│         │                    │                    │                       │            │
│         │ 5. BEST MATCH      │                    │                       │            │
│         │  Return driver     │                    │                       │            │
│         │  with highest      │                    │                       │            │
│         │  priority score    │                    │                       │            │
│         │ ◄─────────────────│◄───────────────────│                       │            │
│         │                                                                │            │
│         │ 6. JOURNEY CREATED                                              │            │
│         │  ┌─────────────────────────────────────────────────────────┐   │            │
│         │  │  Create JourneyTwin:                                    │   │            │
│         │  │  - Link RiderTwin, DriverTwin, VehicleTwin             │   │            │
│         │  │  - Calculate route, ETA, fare                           │   │            │
│         │  │  - Track in real-time                                   │   │            │
│         │  └─────────────────────────────────────────────────────────┘   │            │
│         │                                                                │            │
│         └────────────────────────────────────────────────────────────────┘            │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Logistics Integration Flow

**Flow: Multi-Carrier Logistics Aggregation**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    LOGISTICS AGGREGATION FLOW                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌──────────────┐                                                               │
│  │  MERCHANT/   │  CREATE ORDER                                                 │
│  │   CUSTOMER   │────────────────────────────────────────────────────┐          │
│  └──────────────┘                                                     │          │
│                                                                      ▼          │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │                    KHAIRMOVE Logistics (Port 4603/4604)                  │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │  │
│  │  │   Order     │  │   Route     │  │    Rate     │  │   Carrier   │      │  │
│  │  │  Service    │──►│ Optimizer   │──►│  Calculator │──►│   Matcher  │      │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘      │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                       │                                          │
│                                       │ Find best carrier                        │
│                                       ▼                                          │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │                              CARRIER SELECTION                            │  │
│  │                                                                          │  │
│  │   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │  │
│  │   │ Internal │  │  Blue    │  │   Delhivery │  │ XpressBees│  │  Ekart  │  │  │
│  │   │  Fleet   │  │  Dart    │  │           │  │           │  │         │  │  │
│  │   └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │  │
│  │                                                                          │  │
│  │   Selection Criteria:                                                    │  │
│  │   - Price (30%)                                                          │  │
│  │   - Delivery time (30%)                                                  │  │
│  │   - Success rate (25%)                                                   │  │
│  │   - Customer preference (15%)                                            │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                       │                                          │
│                                       │ Create OrderTwin                         │
│                                       ▼                                          │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │                              TWINOS LAYER                                │  │
│  │                                                                          │  │
│  │   OrderTwin ◄── DriverTwin ◄── VehicleTwin ◄── FleetTwin                │  │
│  │      │              │              │                                    │  │
│  │      │              │              │                                    │  │
│  │      └──────────────┴──────────────┴────────────────────────────────►   │  │
│  │                        Real-time tracking & updates                       │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                       │                                          │
│                                       │ Status updates                           │
│                                       ▼                                          │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │                         DELIVERY TRACKING                                 │  │
│  │                                                                          │  │
│  │   Order Created ──► Picked Up ──► In Transit ──► Out for Delivery ──► POD │  │
│  │       │               │             │                │                  │  │
│  │       └───────────────┴─────────────┴────────────────┴────────────────►│  │
│  │                          Real-time location sync                          │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                       │                                          │
│                                       │ Delivery complete                        │
│                                       ▼                                          │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │                         PAYMENT SETTLEMENT                               │  │
│  │                                                                          │  │
│  │   RABTUL Pay ◄── OrderTwin.payment ◄── Carrier API ◄── Merchant         │  │
│  │       │                                                                          │  │
│  │       └────────────────────────────────────────────────────────────────►│  │
│  │                            Auto-settlement                                 │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 4.4 Airzy Integration Flow

**Flow: Airport Ecosystem Integration**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        AIRZY INTEGRATION FLOW                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │                        AIRZY ECOSYSTEM (Ports 4500-4509)                  │  │
│  │                                                                          │  │
│  │   ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐       │  │
│  │   │  Flight    │  │  Lounge    │  │ Itinerary  │  │   AI       │       │  │
│  │   │  Service   │  │  Service   │  │  Service   │  │   Brain    │       │  │
│  │   │  (4501)    │  │  (4502)    │  │  (4503)    │  │  (4505)    │       │  │
│  │   └────────────┘  └────────────┘  └────────────┘  └────────────┘       │  │
│  │          │                │                │                │            │  │
│  │          │                │                │                │            │  │
│  │          └────────────────┴────────────────┴────────────────┘            │  │
│  │                                    │                                      │  │
│  │                                    │ Travel Twin Creation                  │  │
│  │                                    ▼                                      │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                       │                                          │
│                                       │ Create TravelerTwin                      │
│                                       ▼                                          │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │                              TWINOS LAYER                                 │  │
│  │                                                                           │  │
│  │   TravelerTwin ◄──► LoyaltyTwin ◄──► PaymentTwin ◄──► PreferenceTwin    │  │
│  │          │                                                                     │  │
│  │          └────────────────────────────────────────────────────────────►  │  │
│  │                        Cross-service data sync                            │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                       │                                          │
│                                       │ Integration points                       │
│         ┌─────────────────────────────┼─────────────────────────────┐        │
│         │                             │                             │        │
│         ▼                             ▼                             ▼        │
│  ┌──────────────┐              ┌──────────────┐              ┌──────────────┐ │
│  │  KHAIRMOVE   │              │   REZ        │              │   RABTUL     │ │
│  │   Ride       │              │ INTELLIGENCE │              │   Wallet     │ │
│  │              │              │              │              │              │ │
│  │ Airport Pick │              │  Traveler    │              │  Travel      │ │
│  │ Drop Transfers│             │  Insights    │              │  Coins       │ │
│  └──────────────┘              └──────────────┘              └──────────────┘ │
│                                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │                        EXTERNAL INTEGRATIONS                              │  │
│  │                                                                          │  │
│  │   Amadeus ◄──── Flight Search     DreamFolks ◄── Lounge Access         │  │
│  │                                                                          │  │
│  │   Priority Pass ◄── Lounge Access     AdBazaar ◄── Airport DOOH        │  │
│  │                                                                          │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 4.5 Error Handling Strategy

| Error Type | Handling Strategy | Retry Policy | Fallback |
|------------|-------------------|--------------|----------|
| **Network Timeout** | Retry with exponential backoff | 3 retries (1s, 2s, 4s) | Return cached twin state |
| **Twin Not Found** | Create twin on-demand | N/A | Auto-create twin |
| **Version Conflict** | Use last-write-wins | N/A | Log conflict, use latest |
| **Rate Limited** | Queue request, retry after | Max 5 retries | Return stale data |
| **Service Unavailable** | Circuit breaker open | 30s half-open | Return cached data |

---

## 5. Agent Architecture

### 5.1 Agent Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        TRANSPORTATION AI AGENT LAYER                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                    BUSINESS COPILOT (Port TBD)                           │   │
│   │              Natural Language Interface for Operations                    │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                    │                                           │
│   ┌───────────────────────────────┼───────────────────────────────────────┐   │
│   │                               │                                       │   │
│   ▼                               ▼                                       ▼   │
│ ┌─────────────┐           ┌─────────────┐                        ┌─────────────┐ │
│ │  FLEET      │           │   DISPATCH  │                        │  LOGISTICS  │ │
│ │  AGENT      │           │   AGENT     │                        │   AGENT     │ │
│ └─────────────┘           └─────────────┘                        └─────────────┘ │
│       │                         │                                       │         │
│       └─────────────────────────┼───────────────────────────────────────┘         │
│                                 │                                                  │
│   ┌─────────────────────────────┼───────────────────────────────────────┐       │
│   │                             ▼                                       │       │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │       │
│   │  │  VEHICLE    │  │   DRIVER    │  │  JOURNEY    │  │   ORDER     │ │       │
│   │  │  AGENT      │  │   AGENT     │  │   AGENT     │  │   AGENT     │ │       │
│   │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │       │
│   │                                                                   │       │
│   └───────────────────────────────────────────────────────────────────┘       │
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                    TWIN MANAGEMENT LAYER                                │   │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │   │
│   │  │ VehicleTwin│  │ DriverTwin  │  │ RiderTwin   │  │ JourneyTwin │   │   │
│   │  │  Manager    │  │   Manager   │  │   Manager   │  │   Manager   │   │   │
│   │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Fleet Operations Agent

| Attribute | Details |
|-----------|---------|
| **Agent Name** | FleetOperationsAgent |
| **Agent ID** | `agent:fleet-operations` |
| **Primary Role** | End-to-end fleet management and optimization |
| **Managed Twins** | FleetTwin, VehicleTwin, DriverTwin |

**Actions:**
```typescript
interface FleetOperationsAgentActions {
  // Fleet Management
  createFleet(fleetData: FleetInput): Promise<FleetTwin>;
  getFleetPerformance(fleetId: string): Promise<FleetPerformance>;
  optimizeFleetComposition(fleetId: string): Promise<OptimizationRecommendation>;
  
  // Vehicle Management
  addVehicle(fleetId: string, vehicleData: VehicleInput): Promise<VehicleTwin>;
  scheduleMaintenance(vehicleId: string, type: 'scheduled' | 'emergency'): Promise<MaintenanceJob>;
  updateVehicleStatus(vehicleId: string, status: VehicleStatus): Promise<void>;
  
  // Driver Management
  onboardDriver(fleetId: string, driverData: DriverInput): Promise<DriverTwin>;
  processDriverIncentive(driverId: string, incentive: IncentiveInput): Promise<IncentiveResult>;
  manageDriverTier(driverId: string, action: 'upgrade' | 'downgrade' | 'verify'): Promise<TierChange>;
  
  // Analytics
  generateFleetReport(fleetId: string, period: ReportPeriod): Promise<FleetReport>;
  predictChurnRisk(fleetId: string): Promise<ChurnPrediction[]>;
}
```

**Skills Required:**
- Fleet management protocols
- Vehicle maintenance scheduling
- Driver incentive calculation
- Performance analytics
- Compliance verification

### 5.3 Dispatch Agent

| Attribute | Details |
|-----------|---------|
| **Agent Name** | DispatchAgent |
| **Agent ID** | `agent:dispatch` |
| **Primary Role** | Real-time driver-rider matching and optimization |
| **Managed Twins** | DriverTwin, VehicleTwin, JourneyTwin |

**Actions:**
```typescript
interface DispatchAgentActions {
  // Matching
  findBestDriver(request: RideRequest): Promise<DriverMatch>;
  calculatePriorityScore(driverId: string, request: RideRequest): Promise<PriorityScore>;
  executeDispatch(journeyId: string, driverId: string): Promise<DispatchResult>;
  
  // Demand Management
  predictDemand(lat: number, lng: number, timeWindow: TimeWindow): Promise<DemandPrediction>;
  applySurgePricing(lat: number, lng: number): Promise<SurgeData>;
  balanceSupplyDemand(): Promise<SupplyBalanceActions>;
  
  // Journey Management
  startJourney(journeyId: string): Promise<JourneyStart>;
  trackJourney(journeyId: string): Promise<JourneyStatus>;
  completeJourney(journeyId: string, feedback: JourneyFeedback): Promise<JourneyCompletion>;
  cancelJourney(journeyId: string, reason: CancellationReason): Promise<CancellationResult>;
  
  // Re-optimization
  handleNoDriversAvailable(request: RideRequest): Promise<AlternativeActions>;
  rerouteDriver(driverId: string, newDestination: GeoLocation): Promise<RerouteResult>;
}
```

**Skills Required:**
- ML-based driver scoring
- Route optimization algorithms
- Surge pricing models
- ETA calculation
- Demand forecasting

### 5.4 Logistics Agent

| Attribute | Details |
|-----------|---------|
| **Agent Name** | LogisticsAgent |
| **Agent ID** | `agent:logistics` |
| **Primary Role** | Multi-carrier logistics orchestration |
| **Managed Twins** | OrderTwin, VehicleTwin, DriverTwin |

**Actions:**
```typescript
interface LogisticsAgentActions {
  // Order Management
  createOrder(orderData: OrderInput): Promise<OrderTwin>;
  assignCarrier(orderId: string, carrierPreference?: string): Promise<CarrierAssignment>;
  cancelOrder(orderId: string, reason: string): Promise<CancellationResult>;
  
  // Fulfillment
  schedulePickup(orderId: string, pickupTime: Date): Promise<PickupSchedule>;
  updateDeliveryStatus(orderId: string, status: DeliveryStatus): Promise<void>;
  verifyDelivery(orderId: string, pod: ProofOfDelivery): Promise<DeliveryVerification>;
  
  // Multi-Stop Optimization
  planMultiStopRoute(orderIds: string[]): Promise<OptimizedRoute>;
  consolidateDeliveries(driverId: string, orderIds: string[]): Promise<ConsolidationPlan>;
  
  // Returns
  initiateReturn(orderId: string): Promise<ReturnOrder>;
  processRTO(orderId: string): Promise<RTOProcessing>;
  
  // Analytics
  getDeliveryMetrics(period: ReportPeriod): Promise<DeliveryMetrics>;
  predictDeliveryTime(orderId: string): Promise<ETAPrediction>;
}
```

**Skills Required:**
- Multi-carrier rate comparison
- Route optimization
- COD management
- Proof of delivery verification
- Returns processing

### 5.5 Vehicle Lifecycle Agent

| Attribute | Details |
|-----------|---------|
| **Agent Name** | VehicleLifecycleAgent |
| **Agent ID** | `agent:vehicle-lifecycle` |
| **Primary Role** | Vehicle health monitoring and maintenance prediction |
| **Managed Twins** | VehicleTwin |

**Actions:**
```typescript
interface VehicleLifecycleAgentActions {
  // Health Monitoring
  assessVehicleHealth(vehicleId: string): Promise<HealthAssessment>;
  predictMaintenanceNeeds(vehicleId: string): Promise<MaintenancePrediction>;
  triggerMaintenanceAlert(vehicleId: string, alertType: AlertType): Promise<void>;
  
  // Compliance
  trackDocumentExpiry(vehicleId: string): Promise<DocumentStatus[]>;
  sendExpiryReminders(): Promise<void>;
  autoVerifyCompliance(vehicleId: string): Promise<ComplianceStatus>;
  
  // Usage Analytics
  trackVehicleUtilization(vehicleId: string, period: Period): Promise<UtilizationReport>;
  calculateDepreciation(vehicleId: string): Promise<DepreciationValue>;
  recommendReplacement(vehicleId: string): Promise<ReplacementRecommendation>;
  
  // Telematics Integration
  processTelematicsData(vehicleId: string, data: TelematicsData[]): Promise<void>;
  detectAnomalies(vehicleId: string): Promise<Anomaly[]>;
}
```

### 5.6 Driver Management Agent

| Attribute | Details |
|-----------|---------|
| **Agent Name** | DriverManagementAgent |
| **Agent ID** | `agent:driver-management` |
| **Primary Role** | Driver lifecycle management, incentives, and retention |
| **Managed Twins** | DriverTwin |

**Actions:**
```typescript
interface DriverManagementAgentActions {
  // Onboarding
  initiateOnboarding(driverData: DriverInput): Promise<OnboardingProgress>;
  verifyDocuments(driverId: string): Promise<DocumentVerification>;
  completeTraining(driverId: string): Promise<TrainingCompletion>;
  activateDriver(driverId: string): Promise<ActivationResult>;
  
  // Performance
  calculateDriverScore(driverId: string): Promise<DriverScore>;
  updateDriverTier(driverId: string): Promise<TierUpdate>;
  generatePerformanceReport(driverId: string, period: Period): Promise<PerformanceReport>;
  
  // Incentives
  evaluateIncentiveEligibility(driverId: string): Promise<IncentiveEligibility>;
  recommendIncentive(driverId: string): Promise<IncentiveRecommendation>;
  processIncentivePayout(driverId: string, incentive: Incentive): Promise<PayoutResult>;
  
  // Retention
  predictChurnRisk(driverId: string): Promise<ChurnRiskScore>;
  triggerRetentionAction(driverId: string, riskLevel: RiskLevel): Promise<void>;
  manageDriverBenefits(driverId: string): Promise<BenefitsStatus>;
  
  // Earnings
  calculateEarnings(driverId: string, period: Period): Promise<EarningsBreakdown>;
  processPayout(driverId: string, amount: number): Promise<PayoutResult>;
}
```

### 5.7 Agent Communication Protocol

**Inter-Agent Messaging via AXP Protocol (Port 4201):**

```typescript
// AXP Message Format
interface AXPMesssage {
  id: string;                    // Unique message ID
  type: 'request' | 'response' | 'event' | 'error';
  source: string;               // Agent ID
  target: string[];              // Target Agent IDs
  action: string;                // Action to perform
  payload: unknown;              // Action payload
  timestamp: Date;
  ttl: number;                   // Time to live in ms
  correlationId?: string;        // For request-response matching
  context?: Record<string, unknown>; // Shared context
}

// Example: Dispatch Agent requesting Driver data
{
  id: "msg_001",
  type: "request",
  source: "agent:dispatch",
  target: ["agent:driver-management"],
  action: "findBestDriver",
  payload: {
    location: { lat: 12.9716, lng: 77.5946 },
    vehicleType: "sedan",
    maxDistance: 5,
    excludeDrivers: []
  },
  timestamp: "2026-06-12T10:30:00Z",
  ttl: 5000,
  context: {
    requestId: "req_123",
    priority: "high"
  }
}
```

---

## 6. Business Copilot Integration

### 6.1 Copilot Capabilities

The Business Copilot for Transportation & Logistics provides natural language access to fleet operations data:

**Query Categories:**

| Category | Example Queries |
|----------|-----------------|
| **Fleet Performance** | "Show me today's fleet utilization", "Which vehicles need maintenance?", "Compare this week's performance to last week" |
| **Driver Analytics** | "Top 10 drivers by rating this month", "Which drivers have declining scores?", "Show driver incentive costs" |
| **Operations** | "How many rides completed today?", "Average dispatch time this hour", "What percentage of orders delivered on time?" |
| **Financial** | "Revenue breakdown by vehicle type", "Driver payout summary for this week", "Fuel cost analysis" |
| **Demand & Supply** | "Current demand hotspots in Bangalore", "Surge pricing history", "Driver availability by zone" |
| **Compliance** | "Which licenses expire within 30 days?", "Insurance compliance status", "Pending KYC verifications" |

### 6.2 Natural Language Query Support

**Query Engine Implementation:**

```typescript
interface NaturalLanguageQuery {
  query: string;
  parsedIntent: {
    action: 'get' | 'compare' | 'predict' | 'alert' | 'recommend';
    subject: 'fleet' | 'driver' | 'vehicle' | 'ride' | 'order' | 'revenue' | 'compliance';
    filters: {
      timeRange?: { start: Date; end: Date };
      location?: GeoLocation | GeoZone;
      vehicleType?: VehicleType;
      driverTier?: Tier;
      status?: string;
    };
    aggregations?: 'sum' | 'average' | 'count' | 'top' | 'bottom';
    limit?: number;
  };
  confidence: number;
  dataSources: string[];
}
```

**Sample Queries & Responses:**

| Query | Intent Parsed | Response Type |
|-------|--------------|---------------|
| "Show idle vehicles in South Bangalore" | { subject: 'vehicle', filters: { status: 'idle', location: 'South Bangalore' } } | Vehicle list with locations |
| "Why did driver Ramesh's score drop?" | { subject: 'driver', action: 'analyze', filters: { driverId: 'Ramesh' } } | Score breakdown with factors |
| "Predict tomorrow's morning rush demand" | { subject: 'demand', action: 'predict', filters: { timeRange: 'tomorrow morning' } } | Heatmap + time series chart |
| "Recommend actions to reduce cancellations" | { subject: 'cancellation', action: 'recommend' } | Actionable recommendations |
| "Compare my fleet's performance to market average" | { subject: 'fleet', action: 'compare' } | Benchmark comparison |

### 6.3 Dashboard Views

**Fleet Operations Dashboard:**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    TRANSPORTATION & LOGISTICS DASHBOARD                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                        KEY METRICS BAR                                    │  │
│  │  Active: 847  │  Rides Today: 12,453  │  Revenue: ₹8.2L  │  Rating: 4.6  │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│  ┌────────────────────────────┐  ┌────────────────────────────────────────┐     │
│  │     SUPPLY vs DEMAND       │  │         REAL-TIME MAP                   │     │
│  │                            │  │                                         │     │
│  │   Drivers Online: 523      │  │    ● Available  ● In-Ride  ● Offline   │     │
│  │   Pending Requests: 34     │  │                                         │     │
│  │   Avg Wait Time: 2.3 min   │  │         [Interactive Map]               │     │
│  │                            │  │                                         │     │
│  │   Demand Level: HIGH       │  │                                         │     │
│  │   Surge: 1.3x              │  │                                         │     │
│  └────────────────────────────┘  └────────────────────────────────────────┘     │
│                                                                                 │
│  ┌────────────────────────────┐  ┌────────────────────────────────────────┐     │
│  │      TOP PERFORMERS        │  │         ALERTS & ACTIONS               │     │
│  │                            │  │                                         │     │
│  │  1. Rajesh K. - 4.98 ★    │  │  ⚠ 12 licenses expiring in 30 days    │     │
│  │  2. Priya S. - 4.97 ★      │  │  ⚠ 8 vehicles need service             │     │
│  │  3. Amit M. - 4.96 ★      │  │  📈 Surge detected in Indiranagar       │     │
│  │  4. Sneha R. - 4.95 ★     │  │  🔴 High cancellation in MG Road        │     │
│  │  5. Vikram J. - 4.94 ★    │  │  ✅ 3 drivers upgraded to Gold tier     │     │
│  │                            │  │                                         │     │
│  └────────────────────────────┘  └────────────────────────────────────────┘     │
│                                                                                 │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                          24-HOUR ACTIVITY TREND                           │  │
│  │                                                                           │  │
│  │    500 ┤                    ╭─╮        ╭─╮                              │  │
│  │        │              ╭─╮╭─╮ │ │╭─╮╭─╮  │ │╭─╮                          │  │
│  │    300 ┤     ╭─╮╭─╮╭─╮ │ │╭─╮│ │╭─╮│ │  │ │╭─╮                          │  │
│  │        │╭─╮╭─╮│ ││ │╭─╮│ │╭─╮│ │╭─╮│ │  │ │╭─╮                          │  │
│  │    100 ┼─────────────────────────────────────────────────────────────   │  │
│  │        6am    9am   12pm   3pm   6pm   9pm  12am                         │  │
│  │                                                                           │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 6.4 Predictive Insights

The Copilot provides proactive insights based on Twin data:

| Insight Type | Trigger | Action |
|--------------|---------|--------|
| **Churn Risk Alert** | Driver score drops >15% in 7 days | Offer incentive, schedule check-in |
| **Maintenance Due** | Vehicle approaching service km | Auto-schedule service slot |
| **Demand Surge** | Pending requests >50 in zone | Alert nearby drivers, enable surge |
| **Low Utilization** | Driver online >2hrs without ride | Offer incentive, check status |
| **Compliance Risk** | Document expiry <14 days | Send reminder, flag for action |
| **Route Deviation** | Driver off-route >500m | Send alert, log for review |

---

## 7. Economic Integration

### 7.1 Payment Flows

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           PAYMENT FLOW ARCHITECTURE                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌──────────────┐           ┌──────────────┐           ┌──────────────┐       │
│  │   RIDER      │           │   KHAIRMOVE  │           │   RABTUL     │       │
│  │   APP        │           │   Platform   │           │    Pay       │       │
│  └──────────────┘           └──────────────┘           └──────────────┘       │
│         │                         │                         │                  │
│         │ 1. Ride Completed       │                         │                  │
│         │    Fare: ₹245           │                         │                  │
│         │ ◄──────────────────────│                         │                  │
│         │                         │                         │                  │
│         │ 2. Pay ₹245             │                         │                  │
│         │ ───────────────────────►│ 3. Initiate Payment     │                  │
│         │                         │ ───────────────────────►│                  │
│         │                         │                         │                  │
│         │                         │ 4. Payment Processing   │                  │
│         │                         │    (UPI/Card/Wallet)    │                  │
│         │                         │ ◄─────────────────────── │                  │
│         │                         │                         │                  │
│         │ 5. Payment Success      │                         │                  │
│         │ ◄───────────────────────│                         │                  │
│         │                         │                         │                  │
│         └─────────────────────────┴─────────────────────────┘                  │
│                                                                                 │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                          REVENUE SPLIT                                     │  │
│  │                                                                           │  │
│  │   Gross Fare: ₹245                                                        │  │
│  │        │                                                                  │  │
│  │        ├─ Platform Fee (20%): ₹49                                         │  │
│  │        │      │                                                            │  │
│  │        │      ├─ RABTUL (1%): ₹0.49                                       │  │
│  │        │      └─ KHAIRMOVE (19%): ₹48.51                                  │  │
│  │        │                                                                   │  │
│  │        └─ Driver Share (80%): ₹196                                        │  │
│  │               │                                                           │  │
│  │               ├─ Driver Earnings: ₹180                                    │  │
│  │               └─ Incentives: ₹16                                         │  │
│  │                                                                           │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                        PAYOUT SCHEDULE                                    │  │
│  │                                                                           │  │
│  │   Daily Payout:  Daily earnings auto-credited at 10 PM                   │  │
│  │   Weekly Payout: Every Monday for previous week                           │  │
│  │   Instant Pay:   Within 30 minutes (₹3 fee)                               │  │
│  │                                                                           │  │
│  │   Driver Wallet (RABTUL):                                                 │  │
│  │   - Balance: ₹4,532                                                       │  │
│  │   - Pending: ₹1,200 (clears tonight)                                     │  │
│  │   - Payout History: [View]                                                │  │
│  │                                                                           │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Rewards & Loyalty Integration

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        LOYALTY & REWARDS ECOSYSTEM                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         RIDER LOYALTY PROGRAM                            │   │
│  │                                                                          │   │
│  │   Points earned per ₹100 spent:                                          │   │
│  │   ┌─────────────────────────────────────────────────────────────────┐   │   │
│  │   │  Basic: 1 point  │  Silver: 1.5 points  │  Gold: 2 points        │   │   │
│  │   │  Platinum: 3 points │  Elite: 4 points                         │   │   │
│  │   └─────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                          │   │
│  │   Rewards Catalog:                                                       │   │
│  │   - 500 points = ₹25 ride voucher                                       │   │
│  │   - 1000 points = Free airport lounge access                             │   │
│  │   - 2500 points = Free upgrade to premium tier                           │   │
│  │   - 5000 points = Free annual subscription                               │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                        DRIVER REWARDS PROGRAM                           │   │
│  │                                                                          │   │
│  │   ┌─────────────────────────────────────────────────────────────────┐   │   │
│  │   │                      TIER BENEFITS                               │   │   │
│  │   ├──────────┬──────────┬──────────┬──────────┬─────────────────────┤   │   │
│  │   │ Bronze   │ Silver   │ Gold     │ Platinum │                     │   │   │
│  │   ├──────────┼──────────┼──────────┼──────────┼─────────────────────┤   │   │
│  │   │ Base     │ +5%      │ +10%     │ +15%     │ Commission Boost    │   │   │
│  │   │ 10% cash │ ride     │ ride     │ ride     │                     │   │   │
│  │   │ back     │ vouchers │ vouchers │ priority │                     │   │   │
│  │   ├──────────┼──────────┼──────────┼──────────┼─────────────────────┤   │   │
│  │   │ 8%       │ 10%      │ 12%      │ 15%      │ Surge Priority      │   │   │
│  │   │ target   │ target   │ target   │ target   │                     │   │   │
│  │   ├──────────┼──────────┼──────────┼──────────┼─────────────────────┤   │   │
│  │   │ Standard │ Priority │ Priority │ 24/7     │ Support             │   │   │
│  │   │ support  │ support  │ support  │ support  │                     │   │   │
│  │   └──────────┴──────────┴──────────┴──────────┴─────────────────────┘   │   │
│  │                                                                          │   │
│  │   Milestone Rewards:                                                     │   │
│  │   - 100 rides: ₹500 bonus                                               │   │
│  │   - 500 rides: ₹3,000 bonus + Gold tier                                  │   │
│  │   - 1000 rides: ₹8,000 bonus + Platinum tier                             │   │
│  │   - 5000 rides: ₹50,000 bonus + Exclusive benefits                       │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                           KHAIRCOINS (Airzy)                            │   │
│  │                                                                          │   │
│  │   Travel currency earned across KHAIRMOVE services:                      │   │
│  │                                                                          │   │
│  │   ┌─────────────────────────────────────────────────────────────────┐   │   │
│  │   │  Activity                    │  Coins Earned                    │   │   │
│  │   ├─────────────────────────────┼───────────────────────────────────┤   │   │
│  │   │  Ride completed (₹100)     │  10 coins (Basic) / 30 (Royale)  │   │   │
│  │   │  Delivery order (₹200)      │  20 coins                       │   │   │
│  │   │  Airport lounge visit       │  100 coins                      │   │   │
│  │   │  Flight booked              │  500 coins                      │   │   │
│  │   │  Refer a friend             │  200 coins                      │   │   │
│  │   └─────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                          │   │
│  │   Coin Redemption:                                                       │   │
│  │   - 1000 coins = ₹50 ride credit                                        │   │
│  │   - 5000 coins = Free lounge visit                                      │   │
│  │   - 20000 coins = Upgrade to Elite tier                                 │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 7.3 Wallet Usage

```typescript
interface TransportationWalletFeatures {
  // Rider Wallet
  rider: {
    autoReload: boolean;           // Auto-add funds when balance < ₹100
    paymentMethods: {
      primary: 'upi' | 'card' | 'wallet';
      backup: string[];
    };
    spendingLimits: {
      daily: number;
      perRide: number;
    };
    splitPayment: {
      enabled: boolean;
      participants: string[];
    };
  };
  
  // Driver Wallet
  driver: {
    instantPay: boolean;          // Enable/disable instant payouts
    payoutSchedule: 'daily' | 'weekly' | 'custom';
    payoutBank: string;
    earningsGoal: {
      daily: number;
      weekly: number;
    };
    incentiveNotifications: boolean;
  };
  
  // Fleet Wallet
  fleet: {
    escrow: {
      balance: number;
      minimumBalance: number;
    };
    commissionRate: number;
    bulkPayout: {
      enabled: boolean;
      batchSize: number;
    };
    incentiveBudget: {
      monthly: number;
      usedThisMonth: number;
    };
  };
}
```

---

## 8. Implementation Roadmap

### Phase 1: Core Integration (Weeks 1-2)

**Objective:** Establish foundational integrations between KHAIRMOVE Fleet and TwinOS

#### Week 1: Twin Foundation

| Task | Owner | Deliverable | Status |
|------|-------|-------------|--------|
| Define VehicleTwin schema | Architecture | Complete schema with all fields | Pending |
| Define DriverTwin schema | Architecture | Complete schema with all fields | Pending |
| Create TwinOS endpoints | Backend | CRUD endpoints for Vehicle & Driver | Pending |
| Implement Twin sync service | Backend | Real-time sync between Fleet and TwinOS | Pending |
| Set up Kafka event topics | DevOps | Event topics for location updates | Pending |
| Create driver onboarding flow | Full Stack | Twin creation on driver signup | Pending |

**Technical Specifications:**

```yaml
# Week 1 Deliverables
twin_creation_api:
  endpoint: POST /api/twins/{type}
  auth: JWT with service scope
  rate_limit: 1000 req/min
  
  payload_vehicle:
    required:
      - twinId
      - vehicleId
      - registrationNumber
      - type
      - fleetId
    optional:
      - make, model, year
      - documents
      - compliance
      
  payload_driver:
    required:
      - twinId
      - driverId
      - name
      - phone
      - fleetId
    optional:
      - email, documents
      - preferences
      
location_sync:
  protocol: Kafka
  topic: khaimove.fleet.location.updates
  format: Avro
  latency_target: <500ms
```

#### Week 2: Dispatch Integration

| Task | Owner | Deliverable | Status |
|------|-------|-------------|--------|
| Implement priority scoring API | ML Team | Driver ranking algorithm | Pending |
| Create dispatch endpoint | Backend | ML-optimized matching endpoint | Pending |
| Integrate demand signals | Data | Real-time demand data feed | Pending |
| Build surge pricing model | ML Team | Dynamic pricing calculation | Pending |
| Create Business Copilot prototype | Frontend | Basic query interface | Pending |
| Set up monitoring dashboard | DevOps | Fleet operations metrics | Pending |

**API Specifications:**

```yaml
# Week 2 APIs
dispatch_endpoint:
  POST /api/v1/dispatch/optimize
  description: ML-optimized driver dispatch
  
  request:
    pickup:
      lat: float
      lng: float
      address: string
    dropoff:
      lat: float
      lng: float
      address: string
    vehicleType: enum[sedan, suv, auto, bike]
    priority: enum[normal, high]
    
  response:
    success: boolean
    match:
      driverId: string
      driverName: string
      vehicleId: string
      priorityScore: float
      eta: int (minutes)
      distance: float (km)
    alternatives:
      - driverId
        priorityScore
        
priority_scoring:
  algorithm: LinearWeightedSum
  
  weights:
    driverScore: 0.35
    distance: 0.25
    demandBoost: 0.20
    utilizationRate: 0.10
    tier: 0.10
    
surge_pricing:
  factors:
    - demandRatio (pending_requests / available_drivers)
    - timeOfDay multiplier
    - weather factor
    - event factor
    - location factor
    
  formula:
    surge = baseMultiplier * demandFactor * timeFactor * weatherFactor
    maxSurge: 3.0x
```

### Phase 2: Advanced Features (Weeks 3-4)

**Objective:** Expand integrations to Logistics, Airzy, and Distribution OS

#### Week 3: Logistics Integration

| Task | Owner | Deliverable | Status |
|------|-------|-------------|--------|
| Define OrderTwin schema | Architecture | Delivery order model | Pending |
| Implement multi-carrier API | Backend | Carrier aggregation service | Pending |
| Create delivery tracking | Full Stack | Real-time order tracking | Pending |
| Build rate comparison engine | Backend | Multi-carrier rate calculation | Pending |
| Implement COD handling | Backend | Cash collection and settlement | Pending |
| Create logistics dashboard | Frontend | Delivery operations view | Pending |

**OrderTwin Schema:**

```typescript
interface OrderTwin {
  twinId: string;
  orderId: string;
  
  // Order Classification
  category: 'package' | 'food' | 'grocery' | 'pharmacy';
  priority: 'standard' | 'express' | 'same_day';
  
  // Parties
  sender: {
    name: string;
    phone: string;
    address: Address;
    coordinates: GeoLocation;
    instructions?: string;
  };
  receiver: {
    name: string;
    phone: string;
    address: Address;
    coordinates: GeoLocation;
    instructions?: string;
    otp?: string;  // For OTP verification
  };
  
  // Package
  package: {
    weight: number;          // kg
    dimensions?: Dimensions;
    description: string;
    declaredValue?: number;
    isFragile: boolean;
    packagingRequired: boolean;
  };
  
  // Fulfillment
  fulfillment: {
    carrierId?: string;
    assignedDriver?: string;
    assignedVehicle?: string;
    pickupSlot?: DateRange;
    estimatedDelivery?: Date;
    actualDelivery?: Date;
    attempts: DeliveryAttempt[];
  };
  
  // Financials
  charges: {
    deliveryFee: number;
    codAmount?: number;
    packagingFee?: number;
    distanceCharge: number;
    surgeCharge: number;
    discount: number;
    total: number;
  };
  
  // Proof of Delivery
  pod?: {
    signature?: string;
    photo?: string;
    otpVerified: boolean;
    timestamp: Date;
    deliveredTo: string;
  };
  
  // Tracking Events
  events: TrackingEvent[];
  
  // Relationships
  relationships: {
    merchantId?: string;
    riderId?: string;  // For food orders
    driverId: string;
    vehicleId: string;
  };
  
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Week 4: Airzy & Distribution OS Integration

| Task | Owner | Deliverable | Status |
|------|-------|-------------|--------|
| Create TravelerTwin | Architecture | Frequent traveler model | Pending |
| Integrate Airzy data | Backend | Travel history sync | Pending |
| Link with KHAIRMOVE Ride | Backend | Airport transfer booking | Pending |
| Create DistributionOS bridge | Backend | Distribution fleet sync | Pending |
| Build traveler dashboard | Frontend | Premium traveler view | Pending |
| Implement KHAIRCoins | Backend | Cross-service loyalty | Pending |

### Phase 3: Optimization (Weeks 5-6)

**Objective:** Refine AI models, complete Business Copilot, and production hardening

#### Week 5: AI Model Refinement

| Task | Owner | Deliverable | Status |
|------|-------|-------------|--------|
| Train demand prediction model | ML | More accurate forecasting | Pending |
| Refine driver scoring algorithm | ML | Include more signals | Pending |
| Build churn prediction model | ML | Driver retention scoring | Pending |
| Implement route optimization | Backend | Multi-stop routing | Pending |
| Create anomaly detection | ML | Fraud/abuse detection | Pending |
| Optimize ML inference latency | Backend | <100ms scoring | Pending |

#### Week 6: Production Hardening

| Task | Owner | Deliverable | Status |
|------|-------|-------------|--------|
| Load testing | QA | 10x current load | Pending |
| Security audit | Security | Penetration testing | Pending |
| DR/BCP setup | DevOps | Disaster recovery | Pending |
| Documentation | Tech Writing | API docs, runbooks | Pending |
| Training & handoff | All | Team training | Pending |
| Go-live | All | Production deployment | Pending |

---

## Appendix A: API Reference

### A.1 TwinOS Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/twins/vehicle` | Create VehicleTwin |
| GET | `/api/twins/vehicle/:id` | Get VehicleTwin |
| PUT | `/api/twins/vehicle/:id` | Update VehicleTwin |
| PUT | `/api/twins/vehicle/:id/location` | Update vehicle location |
| DELETE | `/api/twins/vehicle/:id` | Delete VehicleTwin |
| POST | `/api/twins/driver` | Create DriverTwin |
| GET | `/api/twins/driver/:id` | Get DriverTwin |
| PUT | `/api/twins/driver/:id` | Update DriverTwin |
| PUT | `/api/twins/driver/:id/location` | Update driver location |
| DELETE | `/api/twins/driver/:id` | Delete DriverTwin |
| POST | `/api/twins/journey` | Create JourneyTwin |
| GET | `/api/twins/journey/:id` | Get JourneyTwin |
| PUT | `/api/twins/journey/:id/status` | Update journey status |
| POST | `/api/twins/order` | Create OrderTwin |
| GET | `/api/twins/order/:id` | Get OrderTwin |
| PUT | `/api/twins/order/:id/status` | Update order status |
| POST | `/api/twins/search` | Search twins with filters |
| GET | `/api/twins/stats` | Get twin statistics |

### A.2 Fleet Service Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/fleets` | Create fleet |
| GET | `/api/fleets/:id` | Get fleet with vehicles/drivers |
| GET | `/api/fleets/:id/analytics` | Fleet analytics with ML |
| POST | `/api/vehicles` | Add vehicle to fleet |
| PUT | `/api/vehicles/:id/location` | Update vehicle location |
| POST | `/api/drivers` | Register driver |
| GET | `/api/drivers/:id` | Get driver with ML score |
| PUT | `/api/drivers/:id/status` | Update driver status |
| PUT | `/api/drivers/:id/location` | Update driver location |
| GET | `/api/drivers/:id/incentives` | Get incentive recommendations |
| POST | `/api/dispatch` | ML-optimized dispatch |
| GET | `/api/surge/:lat/:lng` | Get surge pricing |

---

## Appendix B: Event Schemas

### B.1 Kafka Topics

| Topic | Producer | Consumers | Description |
|-------|----------|-----------|-------------|
| `khaimove.vehicle.location` | Fleet Service | TwinOS, Analytics | Real-time vehicle locations |
| `khaimove.driver.location` | Fleet Service | TwinOS, Dispatch | Real-time driver locations |
| `khaimove.driver.status` | Fleet Service | TwinOS, Dispatch | Driver online/offline status |
| `khaimove.ride.created` | Ride Service | TwinOS, Dispatch | New ride request |
| `khaimove.ride.completed` | Ride Service | TwinOS, Payments | Ride completion event |
| `khaimove.order.created` | Logistics | TwinOS | New delivery order |
| `khaimove.order.delivered` | Logistics | TwinOS, Payments | Delivery completion |
| `khaimove.payment.success` | RABTUL | TwinOS, Fleet | Payment confirmation |
| `khaimove.incentive.triggered` | Fleet Service | TwinOS | Incentive applied |

### B.2 Event Schema Example

```json
{
  "eventId": "evt_abc123",
  "eventType": "DRIVER_LOCATION_UPDATE",
  "source": "khaimove-fleet",
  "timestamp": "2026-06-12T10:30:00.000Z",
  "version": "1.0",
  "payload": {
    "twinId": "DRV-91xxxxxxxx-abc123",
    "driverId": "DRV-001",
    "location": {
      "lat": 12.9716,
      "lng": 77.5946,
      "heading": 45,
      "speed": 25
    },
    "status": "online",
    "vehicleId": "VEH-KA01AB1234",
    "batteryLevel": 78,
    "metadata": {
      "accuracy": 5.2,
      "source": "gps"
    }
  }
}
```

---

## Appendix C: Data Retention & Privacy

### C.1 Retention Policy

| Data Type | Retention Period | Legal Basis |
|-----------|-----------------|-------------|
| Location History | 90 days rolling | Service delivery |
| Ride/Order History | 5 years | Tax compliance |
| Driver Documents | Duration + 2 years | Regulatory |
| Payment Records | 7 years | Financial compliance |
| Twin Data | Until account deletion | Service necessity |
| Analytics Data | 2 years aggregated | Business intelligence |

### C.2 Privacy Controls

- Driver/Rider phone numbers stored as hashed values
- Location data only accessible to authorized agents
- Consent management for data sharing
- Right to deletion (RTBF) implementation
- Data export capability for users

---

**Document Version:** 1.0.0  
**Last Updated:** June 12, 2026  
**Next Review:** Monthly  
**Approvers:** RTNM Architecture Team
