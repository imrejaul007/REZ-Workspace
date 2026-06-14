# REZ Revenue AI - Ecosystem Integration Plan

**Date:** May 31, 2026
**Status:** AUDIT COMPLETE - INTEGRATION PLANNING

---

## Executive Summary

### Ecosystem Coverage

| Company | Merchant Type | REZ Revenue AI Integration | Priority |
|---------|-------------|----------------------|----------|
| **REZ-Merchant** | Restaurant, Hotel, Salon, Fitness, Retail | FULL | P0 |
| **StayOwn (Habixo)** | Hotels, Property | FULL | P0 |
| **RisaCare** | Clinics, Healthcare | FULL | P1 |
| **ReZ-Ride** | Ride-hailing, Rental | FULL | P1 |
| **KHAIRMOVE** | Mobility, Logistics | FULL | P1 |
| **CorpPerks** | Enterprise, HR, Restaurants | PARTIAL | P2 |
| **NeXha** | B2B Procurement | PARTIAL | P2 |
| **Airzy** | Travel, Flights | PARTIAL | P2 |
| **REZ-Consumer** | B2C Consumers | MEDIUM | P2 |

### Revenue AI Opportunities by Company

| Company | Dynamic Pricing | Demand Forecast | Offers | Cashback | Segments | Campaigns |
|---------|----------------|----------------|--------|-----------|----------|----------|
| **Restaurant** | ✅ Peak/off-peak | ✅ Lunch/dinner | ✅ Bundle | ✅ Acquisition | ✅ Bargain hunters | ✅ WhatsApp |
| **Hotel** | ✅ Seasonal/weekend | ✅ Occupancy | ✅ Early bird | ✅ Loyalty | ✅ Business/travel | ✅ Email |
| **Salon** | ✅ Slot-based | ✅ Weekday/weekend | ✅ Service bundles | ✅ VIP | ✅ New/regular | ✅ SMS |
| **Fitness/Gym** | ✅ Class-based | ✅ Morning/evening | ✅ Membership | ✅ Retention | ✅ Active/inactive | ✅ Push |
| **Healthcare** | ✅ After-hours | ✅ Appointment slots | ✅ Health packages | ✅ Follow-up | ✅ Chronic/acute | ✅ WhatsApp |
| **Retail** | ✅ Inventory-based | ✅ Seasonal | ✅ Clearance | ✅ Loyalty | ✅ Premium/value | ✅ Instagram |
| **Ride** | ✅ Surge pricing | ✅ Rush hours | ✅ Rides | ✅ Rides | ✅ Commuter/travel | ✅ Push |
| **Travel** | ✅ Dynamic rates | ✅ Booking lead | ✅ Flash sales | ✅ Bookings | ✅ Business/leisure | ✅ Email |
| **B2B** | ✅ Volume-based | ✅ Quarterly | ✅ Bulk deals | ✅ Enterprise | ✅ SMB/Enterprise | ✅ LinkedIn |

---

## Architecture: How REZ Revenue AI Integrates

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                          REZ REVENUE AI PLATFORM                            │
│                         Ports 4300-4312 (13 Services)                       │
└──────────────────────────────────────────────────────────────────────────────┘
                    │                                    │
                    ▼                                    ▼
┌─────────────────────────────────────┐  ┌─────────────────────────────────────┐
│         HOJAI AI CORE                │  │         RABTUL PLATFORM               │
│     (AI Orchestration)                │  │     (Core Infrastructure)             │
│                                     │  │                                     │
│  • Hojai Agents (4550)             │  │  • Auth Service (4002)               │
│  • Hojai Workflow (4560)            │  │  • Payment Service (4001)             │
│  • Hojai Memory (4520)              │  │  • Wallet Service (4004)              │
│  • Hojai Hyperlocal (4580)          │  │  • Order Service (4003)              │
│  • Hojai Communications (4570)       │  │  • Notification Service (4011)         │
└─────────────────────────────────────┘  └─────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                    MERCHANT VERTICAL SERVICES                                  │
├──────────────┬──────────────┬──────────────┬──────────────┬─────────────────┤
│ Restaurant   │ Hotel       │ Salon       │ Fitness     │ Healthcare       │
│              │             │             │            │                 │
│ • POS        │ • Booking   │ • Appoint-  │ • Classes  │ • Consultations │
│ • KDS       │ • Room Mgmt │   ments    │ • Member-   │ • Diagnostics    │
│ • Menu      │ • Channel   │ • Services  │   ships    │ • Pharmacy      │
│ • Billing   │   Manager   │ • Inventory │ • Inventory │ • Insurance     │
│ • Inventory │ • Housekeep │ • Staff     │ • Payroll   │ • Records       │
└──────┬──────┴──────┬──────┴─────┬──────┴────────┬───┴────────┬──────────┘
       │             │            │               │            │
       │             │            │               │            │
       ▼             ▼            ▼               ▼            ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                        MERCHANT APPS / DASHBOARDS                            │
├──────────────────────────────────────────────────────────────────────────────┤
│  • Merchant App (Expo)    • POS Tablets    • Admin Dashboard    • QR Systems   │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Integration Point Matrix

### By Merchant Type

| Merchant Type | Services to Connect | REZ Revenue AI Features | Integration Port |
|--------------|-------------------|----------------------|-----------------|
| **Restaurant** | POS, KDS, Menu, Billing | Dynamic pricing, demand forecast | 4301, 4302 |
| **Hotel** | Booking, Room, Channel | Seasonal pricing, occupancy forecast | 4301, 4302 |
| **Salon** | Appointments, Services | Slot-based surge, time pricing | 4301, 4302 |
| **Fitness/Gym** | Classes, Memberships | Class pricing, peak/off-peak | 4301, 4302 |
| **Healthcare** | Appointments, Diagnostics | After-hours premium, urgency pricing | 4301, 4302 |
| **Retail** | POS, Inventory | Inventory clearance, flash sales | 4301, 4303 |
| **Ride** | Booking, Dispatch | Surge pricing, demand sync | 4301, 4302 |
| **Travel** | Flights, Hotels, Packages | Dynamic rates, early bird | 4301, 4302 |

---

## 1. REZ-Merchant Integration (P0 - HIGHEST PRIORITY)

### Restaurant Vertical

**Merchant Type:** Restaurant, QSR, Café, Cloud Kitchen

**Current Operations:**
```
• Menu Management (Products, Categories, Variants, Add-ons)
• Order Management (POS, KDS, Table Service)
• Billing (GST, Split Bill, Discounts)
• Inventory (Stock, Recipes, Suppliers)
• Reservations (Table Booking, Walk-ins)
• Aggregators (Swiggy, Zomato, Magicpin sync)
```

**REZ Revenue AI Integration Points:**

| Feature | Integration Point | Service |
|---------|------------------|---------|
| **Dynamic Pricing** | Menu item price at POS | Pricing Engine (4301) |
| **Time-Based Surge** | Peak hour multiplier | Pricing Engine (4301) |
| **Slot-Based Surge** | Table availability | Pricing Engine (4301) |
| **Demand Forecast** | Staffing prediction | Demand Forecast (4302) |
| **Offer Generation** | Combo meals, bundles | Offer Optimizer (4303) |
| **Cashback** | Post-order cashback | Cashback Optimizer (4304) |
| **Customer Segments** | New/regular/VIP pricing | Segment Brain (4310) |
| **Campaign Generator** | WhatsApp promotions | Campaign Generator (4311) |
| **Revenue Advisor** | "Why sales down?" | MerchantGPT (4312) |

**API Integration Example:**

```typescript
// In POS Service - Calculate dynamic menu price
import { RevenueAIClient } from '@rez/revenue-ai-sdk';

class POSService {
  private revenueAI = new RevenueAIClient({ baseUrl: 'http://localhost:4300' });

  async getItemPrice(itemId: string, context: { tableId: string; time: Date }) {
    const menuItem = await this.getMenuItem(itemId);

    // Get dynamic price from REZ Revenue AI
    const pricing = await this.revenueAI.calculatePrice({
      entity: {
        id: itemId,
        type: 'product',
        category: menuItem.category,
        vertical: 'restaurant',
        basePrice: menuItem.price,
        cost: menuItem.cost,
      },
      time: {
        dayOfWeek: context.time.getDay(),
        hourOfDay: context.time.getHours(),
        isPeakHour: this.isPeakHour(context.time),
        isWeekend: this.isWeekend(context.time),
      },
      demand: {
        current: await this.getCurrentDemand(itemId),
      },
      inventory: {
        slotsRemaining: await this.getAvailableTables(context.tableId),
        totalSlots: await this.getTotalTables(context.tableId),
      },
    });

    return {
      originalPrice: menuItem.price,
      dynamicPrice: pricing.finalPrice,
      factors: pricing.factors,
      adjustment: pricing.adjustmentType,
    };
  }
}
```

### Hotel Vertical

**Merchant Type:** Hotels, Resorts, Homestays, PGs

**Current Operations:**
```
• Room Booking (Direct, Channel, OTA)
• Front Desk (Check-in/out, Housekeeping)
• Channel Manager (Inventory sync across Booking.com, Mmt, Airbnb)
• Billing (Folio, Packages, Add-ons)
• Housekeeping (Tasks, Scheduling)
```

**REZ Revenue AI Integration Points:**

| Feature | Integration Point | Service |
|---------|------------------|---------|
| **Dynamic Room Pricing** | Room rate at booking | Pricing Engine (4301) |
| **Seasonal Surge** | Festival/event pricing | Pricing Engine (4301) |
| **Lead Time Discount** | Early bird pricing | Pricing Engine (4301) |
| **Occupancy Forecast** | Staffing, pricing | Demand Forecast (4302) |
| **Event Pricing** | Local event surge | Pricing Engine (4301) |
| **Loyalty Cashback** | Repeat guest rewards | Cashback Optimizer (4304) |
| **Package Offers** | Bundle deals | Offer Optimizer (4303) |
| **OTA Price parity** | Competitor pricing | Pricing Engine (4301) |

### Salon Vertical

**Merchant Type:** Salon, Spa, Beauty, Wellness

**Current Operations:**
```
• Appointments (Slot booking, Walk-ins)
• Services (Hair, Skin, Nail, Spa)
• Staff Management (Stylists, Schedules)
• Inventory (Products, Equipment)
• Packages (Prepaid, Memberships)
```

**REZ Revenue AI Integration Points:**

| Feature | Integration Point | Service |
|---------|------------------|---------|
| **Slot-Based Surge** | Peak time pricing | Pricing Engine (4301) |
| **Off-Peak Discount** | Weekday afternoon deals | Pricing Engine (4301) |
| **Bundle Offers** | Service combos | Offer Optimizer (4303) |
| **New Customer Acquisition** | First-visit offers | Cashback Optimizer (4304) |
| **Demand Forecast** | Staff scheduling | Demand Forecast (4302) |
| **Membership Pricing** | Tier-based pricing | Segment Brain (4310) |

### Fitness/Gym Vertical

**Merchant Type:** Gym, Fitness, Yoga, Sports

**Current Operations:**
```
• Memberships (Monthly, Quarterly, Annual)
• Class Schedules (Yoga, Zumba, CrossFit)
• Personal Training
• Retail (Supplements, Gear)
• Attendance Tracking
```

**REZ Revenue AI Integration Points:**

| Feature | Integration Point | Service |
|---------|------------------|---------|
| **Class Pricing** | Peak vs off-peak classes | Pricing Engine (4301) |
| **Membership Tiers** | Premium vs basic | Segment Brain (4310) |
| **Win-Back Offers** | Dormant member campaigns | Cashback Optimizer (4304) |
| **Demand Forecast** | Class popularity prediction | Demand Forecast (4302) |
| **Bundle Deals** | PT + Membership packages | Offer Optimizer (4303) |

---

## 2. StayOwn-Hospitality (Habixo) Integration (P0)

### Habixo Stay (Hotels)

**Merchant Type:** Hotels, Resorts, Homestays, PGs

**Current Operations:**
```
• Property Listings (Photos, Amenities, Policies)
• Booking Engine (Calendar, Availability, Pricing)
• Channel Manager (Sync to Booking.com, Airbnb, Mmt)
• Dynamic Pricing (AI-powered rates)
• Guest Management (Check-in, Communication)
```

**REZ Revenue AI Integration:**

```typescript
// In Habixo Booking Service
class HabixoBookingService {
  private revenueAI = new RevenueAIClient({ baseUrl: 'http://localhost:4300' });

  async calculateDynamicRate(propertyId: string, checkIn: Date, checkOut: Date) {
    const property = await this.getProperty(propertyId);

    // Get base rate from property
    const baseRate = property.baseRate;

    // Get dynamic rate from REZ Revenue AI
    const pricing = await this.revenueAI.calculatePrice({
      entity: {
        id: propertyId,
        type: 'room',
        category: property.category,
        vertical: 'hotel',
        basePrice: baseRate,
        cost: property.cost,
      },
      time: {
        dayOfWeek: checkIn.getDay(),
        hourOfDay: checkIn.getHours(),
        isWeekend: this.isWeekend(checkIn),
        season: this.getSeason(checkIn.getMonth()),
        isHoliday: await this.isHoliday(checkIn),
        eventNearby: await this.hasNearbyEvent(checkIn),
      },
      demand: {
        current: await this.getOccupancy(propertyId, checkIn),
        predicted: await this.getPredictedOccupancy(propertyId, checkIn),
        trend: this.getOccupancyTrend(propertyId),
      },
      inventory: {
        slotsRemaining: await this.getAvailableRooms(propertyId, checkIn),
        totalSlots: property.totalRooms,
      },
      competition: {
        avgPrice: await this.getCompetitorAvgPrice(property.location),
        competitorCount: await this.getCompetitorCount(property.location),
      },
    });

    return {
      baseRate,
      dynamicRate: pricing.finalPrice,
      surgeReason: pricing.factors.map(f => f.reason).join(', '),
      alternatives: pricing.alternativePrices,
    };
  }
}
```

---

## 3. RisaCare Integration (P1)

### Healthcare Vertical

**Merchant Type:** Clinics, Diagnostics, Pharmacy, Hospitals

**Current Operations:**
```
• Appointments (Doctor booking, Time slots)
• Health Records (OCR, Storage, Sharing)
• AI Copilot (Health guidance)
• Family Management (Profiles, Reminders)
• Marketplace (Lab tests, Medicines)
```

**REZ Revenue AI Integration:**

| Feature | Use Case |
|---------|---------|
| **After-Hours Premium** | Consultation fees higher after 8PM |
| **Appointment Urgency** | Same-day appointments premium |
| **Specialist Surge** | Premium specialist pricing |
| **Lab Test Packages** | Dynamic bundle pricing |
| **Follow-Up Offers** | Cashback on return visits |
| **Health Screening** | Seasonal health check packages |

```typescript
// In RisaCare Booking Service
class BookingService {
  async getConsultationFee(doctorId: string, slot: Date) {
    const doctor = await this.getDoctor(doctorId);

    const pricing = await this.revenueAI.calculatePrice({
      entity: {
        id: doctorId,
        type: 'appointment',
        category: doctor.specialization,
        vertical: 'healthcare',
        basePrice: doctor.fee,
        cost: doctor.cost,
      },
      time: {
        hourOfDay: slot.getHours(),
        dayOfWeek: slot.getDay(),
        isWeekend: slot.getDay() === 0 || slot.getDay() === 6,
      },
      demand: {
        current: await this.getSlotDemand(doctorId, slot),
      },
      inventory: {
        slotsRemaining: await this.getAvailableSlots(doctorId, slot),
        totalSlots: doctor.dailySlots,
      },
    });

    return {
      baseFee: doctor.fee,
      dynamicFee: pricing.finalPrice,
      isUrgent: pricing.adjustmentType === 'surge',
    };
  }
}
```

---

## 4. ReZ-Ride Integration (P1)

### Ride-Hailing Vertical

**Merchant Type:** Auto, Bike, Cab, SUV

**Current Operations:**
```
• Trip Booking (Pickup, Drop, OTP)
• Driver Assignment (Dispatch, Routing)
• Real-time Tracking (GPS, ETA)
• Fare Calculation (Base, KM, Time)
• Driver Earnings (Commission-free model)
```

**REZ Revenue AI Integration:**

| Feature | Use Case |
|---------|---------|
| **Dynamic Surge** | Rain, peak hours, events |
| **Multi-Vehicle Pricing** | Auto vs Cab vs SUV |
| **Rental Pricing** | Hourly/daily vehicle rental |
| **Route-Based** | Traffic-adjusted pricing |
| **Demand Forecast** | Driver supply prediction |
| **Promotions** | First-ride offers, cashback |

---

## 5. KHAIRMOVE Integration (P1)

### Mobility & Logistics Vertical

**Merchant Type:** Rides, Delivery, Logistics, Rental

**Current Operations:**
```
• Unified API Gateway (4600)
• Ride Service (4601) - Core booking
• Fleet Service (4602) - Driver management
• Delivery Service (4603) - Hyperlocal
• Rental Service (4605) - Vehicle rental
```

**REZ Revenue AI Integration:**

| Feature | Use Case |
|---------|---------|
| **Delivery Surge** | Peak meal times |
| **Rental Pricing** | Hourly vehicle rates |
| **Fleet Demand** | Driver supply forecasting |
| **Promotions** | User acquisition cashback |

---

## 6. CorpPerks Integration (P2)

### Enterprise SaaS Vertical

**Merchant Type:** Restaurants, HR, B2B Procurement

**Current Operations:**
```
• RestoPapa (Restaurant SaaS)
• PeopleOS (HR, Payroll, Attendance)
• nextaBizz (B2B Procurement)
```

**REZ Revenue AI Integration:**

| Product | Integration |
|---------|-------------|
| **RestoPapa** | Restaurant POS → Dynamic pricing |
| **PeopleOS** | Employee benefits → Cashback offers |
| **nextaBizz** | B2B quotes → Volume-based pricing |

---

## 7. Airzy Integration (P2)

### Travel Vertical

**Merchant Type:** Flights, Hotels, Lounge, Travel

**Current Operations:**
```
• Flight Search (Amadeus)
• Lounge Booking (DreamFolks, Priority Pass)
• AI Brain (Traveler intelligence)
• Membership Tiers
```

**REZ Revenue AI Integration:**

| Feature | Use Case |
|---------|---------|
| **Flight Pricing** | Dynamic fare based on demand |
| **Lounge Surge** | Peak hour pricing |
| **Early Bird** | Advance booking discounts |
| **Membership** | Tier-based pricing |

---

## Integration Architecture

### Universal SDK Pattern

```typescript
// @rez/revenue-ai-sdk - Universal client for all merchants
import { RevenueAIClient, PricingContext, Vertical } from '@rez/revenue-ai-sdk';

class MerchantIntegration {
  private client: RevenueAIClient;

  constructor(config: { baseUrl: string; apiKey: string }) {
    this.client = new RevenueAIClient(config);
  }

  // Universal pricing for ANY vertical
  async price(context: PricingContext): Promise<PricingResult> {
    return this.client.calculatePrice(context);
  }

  // Universal forecasting
  async forecast(merchantId: string, horizon: string): Promise<ForecastResult> {
    return this.client.getDemandForecast({ merchantId, horizon });
  }

  // Universal offer optimization
  async optimizeOffer(params: OfferParams): Promise<OfferResult> {
    return this.client.optimizeOffer(params);
  }

  // Universal cashback
  async optimizeCashback(params: CashbackParams): Promise<CashbackResult> {
    return this.client.optimizeCashback(params);
  }
}
```

### Vertical-Specific Adapters

```typescript
// Restaurant Adapter
class RestaurantAdapter extends MerchantIntegration {
  async priceMenuItem(item: MenuItem, context: TableContext) {
    return this.price({
      entity: { ...item, vertical: 'restaurant' },
      time: context.time,
      demand: { current: context.currentDemand },
      inventory: { slotsRemaining: context.tablesRemaining },
    });
  }
}

// Hotel Adapter
class HotelAdapter extends MerchantIntegration {
  async priceRoom(room: Room, context: BookingContext) {
    return this.price({
      entity: { ...room, vertical: 'hotel' },
      time: { dayOfWeek: context.checkIn.getDay(), isWeekend: this.isWeekend(context.checkIn) },
      demand: { current: context.occupancy },
      inventory: { slotsRemaining: context.availableRooms },
      constraints: { maxSurge: 3.0 }, // Hotels can surge higher
    });
  }
}

// Salon Adapter
class SalonAdapter extends MerchantIntegration {
  async priceService(service: Service, context: AppointmentContext) {
    return this.price({
      entity: { ...service, vertical: 'salon' },
      time: { hourOfDay: context.slot.getHours(), dayOfWeek: context.slot.getDay() },
      demand: { current: context.currentDemand },
      inventory: { slotsRemaining: context.slotsRemaining, totalSlots: context.totalSlots },
    });
  }
}
```

---

## Integration Checklist

### For Each Merchant Vertical

| Step | Task | Status |
|------|------|--------|
| 1 | Add REZ Revenue AI SDK to merchant service | ⬜ |
| 2 | Create vertical adapter (Restaurant/Hotel/Salon/etc.) | ⬜ |
| 3 | Integrate pricing at POS/Booking point | ⬜ |
| 4 | Add demand forecast for staffing | ⬜ |
| 5 | Connect offer optimizer for campaigns | ⬜ |
| 6 | Integrate cashback for loyalty | ⬜ |
| 7 | Add segment brain for customer targeting | ⬜ |
| 8 | Connect campaign generator for WhatsApp/SMS | ⬜ |
| 9 | Add MerchantGPT to admin dashboard | ⬜ |
| 10 | Enable benchmark score for merchant | ⬜ |
| 11 | Connect to Hojai for autonomous actions | ⬜ |
| 12 | Test and deploy | ⬜ |

---

## Implementation Roadmap

### Phase 1: REZ-Merchant (Week 1-2)
- [ ] Restaurant POS integration
- [ ] Hotel Booking integration
- [ ] Salon Appointments integration
- [ ] Fitness/Class integration

### Phase 2: Industry Verticals (Week 3-4)
- [ ] StayOwn-Habixo Hotel integration
- [ ] RisaCare Clinic integration
- [ ] ReZ-Ride integration
- [ ] KHAIRMOVE integration

### Phase 3: B2B & Enterprise (Week 5-6)
- [ ] CorpPerks RestoPapa integration
- [ ] nextaBizz integration
- [ ] Airzy Travel integration

### Phase 4: Autonomous (Week 7-8)
- [ ] Hojai Agent integration
- [ ] Auto Mode implementation
- [ ] Revenue Knowledge Graph

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Merchants using REZ Revenue AI | 1000+ |
| Revenue uplift per merchant | +15-25% |
| Offer conversion rate | +30% |
| Customer retention improvement | +20% |
| Platform revenue share | 1-3% of uplift |

---

## Next Steps

1. **Start with REZ-Merchant Restaurant** - Most mature vertical
2. **Create unified SDK** - Single client for all verticals
3. **Build vertical adapters** - Restaurant, Hotel, Salon adapters
4. **Pilot with 10 merchants** - Measure impact
5. **Scale to all verticals** - Based on pilot results
