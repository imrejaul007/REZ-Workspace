# REZ Revenue AI - Complete Integration Guide

**Date:** May 31, 2026
**Status:** INTEGRATION GUIDE COMPLETE

---

## Quick Start

### Install SDK

```bash
npm install @rez/revenue-ai-sdk
```

### Basic Usage

```typescript
import { createRevenueAI } from '@rez/revenue-ai-sdk';

// Create client
const revenueAI = createRevenueAI('http://localhost:4300');

// Restaurant example
const pricing = await revenueAI.restaurant.priceMenuItem({
  id: 'pizza_001',
  name: 'Margherita Pizza',
  category: 'pizza',
  price: 450,
  cost: 180
}, {
  time: new Date('2026-05-31 19:00'), // Friday 7PM
  tablesRemaining: 3,
  totalTables: 15
});

console.log(`Dynamic Price: ₹${pricing.finalPrice}`);
// Output: Dynamic Price: ₹585 (+30% surge)
```

---

## Integration by Company

### 1. REZ-Merchant (P0 - HIGHEST PRIORITY)

#### Restaurant Vertical

**Integration Points:**

| Service | Integration | REZ Revenue AI Feature |
|---------|-------------|----------------------|
| POS | Menu item pricing | Dynamic Pricing (4301) |
| KDS | Order flow | Demand Forecast (4302) |
| Billing | Final price calculation | Dynamic Pricing (4301) |
| Offers | Combo/bundle pricing | Offer Optimizer (4303) |
| Loyalty | Post-order cashback | Cashback Optimizer (4304) |

**Code Example:**

```typescript
// In POS Service
import { getDynamicMenuPrice, getRestaurantForecast, getRestaurantCashback } from './utils/rezRevenueAI';

// At order time - calculate dynamic price
const pricing = await getDynamicMenuPrice(
  item.productId,
  item.name,
  item.category,
  item.price,
  item.cost,
  {
    time: order.time,
    tablesRemaining: availableTables,
    totalTables: totalTables,
    customerId: order.customerId,
    customerSegment: customer.segment,
    city: store.city,
    tier: store.tier
  }
);

// Apply dynamic price
order.items[i].unitPrice = pricing.dynamicPrice;
order.items[i].pricingFactors = pricing.factors;

// After order - optimize cashback
const cashback = await getRestaurantCashback(
  merchantId,
  customerId,
  order.total,
  {
    segment: customer.segment,
    ltv: customer.lifetimeValue,
    churnRisk: customer.churnRisk
  }
);
order.cashback = cashback.cashbackAmount;

// For staffing - get forecast
const forecast = await getRestaurantForecast(merchantId, {
  city: store.city,
  tier: store.tier
});
// Use forecast.staffingRecommendation for scheduling
```

#### Hotel Vertical

**Integration Points:**

| Service | Integration | REZ Revenue AI Feature |
|---------|-------------|----------------------|
| Booking | Room rate calculation | Dynamic Pricing (4301) |
| Channel Manager | Rate parity | Pricing (4301) |
| Front Desk | Walk-in pricing | Dynamic Pricing (4301) |
| Packages | Bundle pricing | Offer Optimizer (4303) |

**Code Example:**

```typescript
import { HotelAdapter } from '@rez/revenue-ai-sdk';

const hotelAI = new HotelAdapter(revenueAI.client);

// Calculate dynamic room rate
const roomPricing = await hotelAI.priceRoom({
  id: 'deluxe_001',
  name: 'Deluxe Room',
  category: 'deluxe',
  baseRate: 3000,
  cost: 1200
}, {
  checkIn: new Date('2026-06-15'),
  checkOut: new Date('2026-06-17'),
  availableRooms: 8,
  totalRooms: 50,
  guestId: guest.id
});

console.log(`Dynamic Rate: ₹${roomPricing.finalPrice}`);
// Output: Dynamic Rate: ₹4200 (+40% weekend + festival)
```

#### Salon Vertical

**Integration Points:**

| Service | Integration | REZ Revenue AI Feature |
|---------|-------------|----------------------|
| Appointments | Slot pricing | Dynamic Pricing (4301) |
| Services | Service pricing | Dynamic Pricing (4301) |
| Packages | Bundle pricing | Offer Optimizer (4303) |
| Membership | Tier pricing | Segment Brain (4310) |

**Code Example:**

```typescript
import { SalonAdapter } from '@rez/revenue-ai-sdk';

const salonAI = new SalonAdapter(revenueAI.client);

// Price a service
const servicePricing = await salonAI.priceService({
  id: 'haircut_001',
  name: 'Haircut',
  category: 'basic',
  price: 500,
  cost: 180
}, {
  slot: appointmentTime, // e.g., Friday 7PM
  stylistId: 'stylist_001',
  slotsRemaining: 2,
  totalSlots: 8,
  customerId: customer.id
});

console.log(`Service Price: ₹${servicePricing.finalPrice}`);
// Output: Service Price: ₹650 (+30% peak hour surge)
```

---

### 2. StayOwn-Hospitality (Habixo) (P0)

**Merchant Type:** Hotels, Resorts, Homestays, PGs

**Integration Points:**

```typescript
// In Habixo Booking Service
import { HotelAdapter } from '@rez/revenue-ai-sdk';

const habixoAI = new HotelAdapter(revenueAI.client);

// Calculate dynamic room rate for Habixo booking
const rate = await habixoAI.priceRoom({
  id: property.roomId,
  name: property.roomName,
  category: property.category,
  baseRate: property.baseRate,
  cost: property.cost
}, {
  checkIn: booking.checkIn,
  checkOut: booking.checkOut,
  availableRooms: property.availableRooms,
  totalRooms: property.totalRooms
});

// Apply rate
booking.dynamicRate = rate.finalPrice;
booking.rateFactors = rate.factors;
```

---

### 3. RisaCare (P1)

**Merchant Type:** Clinics, Diagnostics, Healthcare

**Integration Points:**

```typescript
import { HealthcareAdapter } from '@rez/revenue-ai-sdk';

const risaAI = new HealthcareAdapter(revenueAI.client);

// Price consultation with time-based pricing
const consultationPrice = await risaAI.priceConsultation({
  id: doctor.doctorId,
  name: `${doctor.name} Consultation`,
  specialization: doctor.specialization,
  fee: doctor.consultationFee,
  cost: doctor.consultationFee * 0.4
}, {
  slot: appointmentSlot,
  mode: appointment.mode, // 'in_clinic' | 'teleconsult' | 'home_visit'
  slotsRemaining: availableSlots,
  totalSlots: doctor.dailySlots,
  patientId: patient.id
});

// Apply pricing
appointment.dynamicFee = consultationPrice.finalPrice;
```

---

### 4. ReZ-Ride (P1)

**Merchant Type:** Ride-hailing, Auto, Bike, Cab

**Integration Points:**

```typescript
import { RideAdapter } from '@rez/revenue-ai-sdk';

const rideAI = new RideAdapter(revenueAI.client);

// Calculate surge pricing
const ridePricing = await rideAI.priceRide({
  id: 'cab_premium',
  name: 'Premium Cab',
  category: 'cab',
  baseFare: 40
}, {
  pickup: { lat: 12.9716, lng: 77.5946 },
  drop: { lat: 12.9352, lng: 77.6245 },
  distance: 8.5,
  weather: 'rainy', // From weather API
  nearbyEvents: 1 // IPL match nearby
});

// Apply surge
trip.fare = ridePricing.finalPrice;
trip.surgeReason = ridePricing.factors.map(f => f.reason).join(', ');
```

---

### 5. KHAIRMOVE (P1)

**Merchant Type:** Rides, Delivery, Logistics, Rental

**Integration Points:**

```typescript
// Delivery surge pricing
const deliveryPricing = await rideAI.priceRide({
  id: 'delivery_instant',
  name: 'Instant Delivery',
  category: 'delivery',
  baseFare: 30
}, {
  pickup: merchantLocation,
  drop: customerLocation,
  distance: deliveryDistance,
  weather: weatherCondition
});

// Rental pricing
const rentalPricing = await rideAI.priceRide({
  id: 'car_sedan_rental',
  name: 'Sedan Rental',
  category: 'car',
  baseFare: 500 // per hour
}, {
  pickup: { lat, lng },
  drop: { lat, lng },
  distance: 0
});
```

---

### 6. CorpPerks - RestoPapa (P2)

**Merchant Type:** Restaurant SaaS, Enterprise Dining

**Integration Points:**

```typescript
// RestoPapa - Restaurant POS
import { RestaurantAdapter } from '@rez/revenue-ai-sdk';

const restopapaAI = new RestaurantAdapter(revenueAI.client);

// Price menu items for RestoPapa POS
const menuPricing = await restopapaAI.priceMenuItem({
  id: item.id,
  name: item.name,
  category: item.category,
  price: item.price,
  cost: item.cost
}, {
  time: new Date(),
  tablesRemaining: availableTables,
  totalTables: totalTables
});
```

---

### 7. Airzy (P2)

**Merchant Type:** Travel, Flights, Hotels, Lounge

**Integration Points:**

```typescript
import { HotelAdapter } from '@rez/revenue-ai-sdk';

const airzyAI = new HotelAdapter(revenueAI.client);

// Dynamic hotel pricing for Airzy
const hotelRate = await airzyAI.priceRoom({
  id: room.id,
  name: room.name,
  category: room.category,
  baseRate: room.baseRate,
  cost: room.cost
}, {
  checkIn: checkInDate,
  checkOut: checkOutDate,
  availableRooms: room.available
});

// Dynamic flight pricing
const flightPricing = await revenueAI.client.price({
  entity: {
    id: flight.id,
    type: 'service',
    category: 'flight',
    vertical: 'travel',
    name: `${flight.from} to ${flight.to}`,
    basePrice: flight.basePrice,
    cost: flight.cost
  },
  time: {
    dayOfWeek: departureDate.getDay(),
    isWeekend: isWeekend(departureDate),
    season: getSeason(departureDate.getMonth())
  },
  demand: {
    current: await getFlightDemand(flight.id)
  }
});
```

---

## Universal Integration Pattern

### For Any Merchant Service

```typescript
import { RevenueAIClient } from '@rez/revenue-ai-sdk';

// Create unified client
const client = new RevenueAIClient({
  baseUrl: process.env.REVENUE_AI_URL || 'http://localhost:4300',
  apiKey: process.env.REVENUE_AI_API_KEY
});

// 1. Dynamic Pricing
const pricing = await client.price({
  entity: {
    id: item.id,
    type: 'product', // or 'service', 'room', 'appointment'
    category: item.category,
    vertical: 'restaurant', // or hotel, salon, gym, clinic, etc.
    name: item.name,
    basePrice: item.price,
    cost: item.cost
  },
  time: {
    dayOfWeek: now.getDay(),
    hourOfDay: now.getHours(),
    isPeakHour: isPeakHour(now),
    isWeekend: isWeekend(now)
  },
  demand: {
    current: currentDemand,
    trend: demandTrend
  },
  inventory: {
    slotsRemaining: available,
    totalSlots: total
  },
  location: {
    city: store.city,
    tier: store.tier
  }
});

// 2. Demand Forecast
const forecast = await client.forecast({
  merchantId: store.id,
  vertical: 'restaurant',
  category: 'general',
  location: { city: store.city },
  horizon: 'week'
});

// 3. Offer Optimization
const offer = await client.optimizeOffer({
  merchantId: store.id,
  entityId: item.id,
  basePrice: item.price,
  optimizationGoal: 'conversion'
});

// 4. Cashback
const cashback = await client.optimizeCashback({
  merchantId: store.id,
  userId: customer.id,
  orderValue: order.total,
  vertical: 'restaurant',
  audience: {
    segment: customer.segment,
    ltv: customer.lifetimeValue,
    churnRisk: customer.churnRisk
  }
});

// 5. Revenue Copilot
const plan = await client.getRevenuePlan({
  merchantId: store.id,
  goal: {
    type: 'revenue',
    target: 50000,
    timeframe: 'month'
  }
});

// 6. Chat with MerchantGPT
const response = await client.chat({
  merchantId: store.id,
  message: 'Why are my sales down this week?'
});
```

---

## Vertical Adapter Quick Reference

| Vertical | Adapter | Key Method |
|----------|---------|------------|
| Restaurant | `RestaurantAdapter` | `priceMenuItem()` |
| Hotel | `HotelAdapter` | `priceRoom()` |
| Salon | `SalonAdapter` | `priceService()` |
| Gym | `GymAdapter` | `priceClass()` |
| Healthcare | `HealthcareAdapter` | `priceConsultation()` |
| Ride | `RideAdapter` | `priceRide()` |

---

## Environment Variables

```bash
# REZ Revenue AI
REVENUE_AI_URL=http://localhost:4300
REVENUE_AI_API_KEY=your-api-key

# Fallback (old pricing engine)
PRICING_ENGINE_URL=http://localhost:4105

# For internal calls
INTERNAL_SERVICE_TOKEN=your-internal-token
```

---

## Error Handling

```typescript
try {
  const pricing = await client.price(context);
  return pricing.finalPrice;
} catch (error) {
  // Fallback to base price on any error
  logger.warn('REZ Revenue AI unavailable, using base price');
  return context.entity.basePrice;
}
```

---

## Mock Mode (Development)

```typescript
// For development without REZ Revenue AI running
const mockClient = new RevenueAIClient({
  baseUrl: 'http://localhost:4300'
});

// Or use the mock fallback in integration
import { getDynamicMenuPrice } from './utils/rezRevenueAI';

// This automatically falls back to base price if REZ Revenue AI is unavailable
const pricing = await getDynamicMenuPrice(/* ... */);
```

---

## Testing

```typescript
// Mock REZ Revenue AI responses
jest.mock('./utils/rezRevenueAI', () => ({
  getDynamicMenuPrice: jest.fn().mockResolvedValue({
    originalPrice: 500,
    dynamicPrice: 650,
    adjustment: 30,
    adjustmentType: 'surge',
    factors: ['Peak hour surge', 'Friday evening'],
    canOfferAlternative: true,
    alternativePrice: 450,
    alternativeLabel: 'Book tomorrow 2PM'
  }),
  getRestaurantForecast: jest.fn().mockResolvedValue({
    peakHour: 19,
    avgDailyDemand: 75,
    staffingRecommendation: { morning: 4, evening: 7 }
  })
}));
```

---

## Support

- **SDK Documentation:** `sdk/README.md`
- **API Reference:** `http://localhost:4300/api/docs`
- **Integration Guide:** `docs/ECOSYSTEM-INTEGRATION-PLAN.md`
