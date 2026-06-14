# REZ Revenue AI - Integration Examples

This directory contains integration examples for connecting various services to REZ Revenue AI.

## Integration Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Merchant Services                          │
├─────────────────────────────────────────────────────────────────┤
│  Restaurant POS │ Hotel Booking │ Clinic Booking │ Salon POS     │
└────────┬────────────────┬─────────────────┬────────────────┘
         │                │                 │
         └────────────────┴────────┬────────┘
                                     │
                    ┌────────────────▼────────────────┐
                    │     REZ Revenue AI Gateway        │
                    │         (Port 4300)              │
                    └────────────────┬────────────────┘
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         │                           │                           │
┌────────▼────────┐   ┌────────────▼────────┐   ┌──────────▼──────────┐
│  Pricing Engine  │   │ Demand Forecast    │   │  Offer Optimizer   │
│    (4301)        │   │     (4302)        │   │     (4303)         │
└──────────────────┘   └───────────────────┘   └────────────────────┘
```

## Quick Start

```typescript
import { RevenueAIClient, createRevenueAIClient } from '../sdk';

// Initialize client
const revenueAI = createRevenueAIClient('http://localhost:4300');
```

---

## 1. Restaurant POS Integration

### Example: Dynamic Pricing for Menu Items

```typescript
// integrations/restaurant-pos.ts

import { RevenueAIClient, PricingContext } from '../sdk';

interface MenuItem {
  id: string;
  name: string;
  category: string;
  basePrice: number;
  cost: number;
  available: boolean;
}

interface BillingItem {
  itemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  dynamicPrice?: number;
  pricingFactors?: string[];
}

/**
 * Get dynamic price for a menu item
 */
export async function getDynamicPriceForItem(
  client: RevenueAIClient,
  item: MenuItem,
  context: {
    tableId: string;
    time: Date;
    slotsRemaining?: number;
    totalSlots?: number;
    audience?: { userId: string; segment: string };
  }
): Promise<{ price: number; factors: string[]; surge: boolean }> {
  const dayOfWeek = context.time.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
  const hourOfDay = context.time.getHours();

  const pricingContext: PricingContext = {
    entity: {
      id: item.id,
      type: 'product',
      category: item.category,
      vertical: 'restaurant',
      name: item.name,
      basePrice: item.basePrice,
      cost: item.cost,
    },
    time: {
      dayOfWeek,
      hourOfDay,
      isPeakHour: isPeakHour(hourOfDay),
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      season: getSeason(context.time.getMonth()),
      month: context.time.getMonth() + 1,
      isHoliday: false, // Check from holiday calendar
      eventNearby: false, // Check from events API
    },
    demand: {
      current: 60, // From demand API
      predicted: 65,
      trend: 'stable',
    },
    inventory: {
      percentage: 50,
      slotsRemaining: context.slotsRemaining,
      totalSlots: context.totalSlots,
      velocity: 'normal',
    },
    competition: {
      avgPrice: item.basePrice * 0.95,
      competitorCount: 5,
    },
    location: {
      city: 'Bangalore',
      tier: 1,
      footfallIndex: 70,
      weather: 'clear',
      nearbyEvents: 0,
    },
    constraints: {
      minMargin: 0.3,
      maxSurge: 2.0,
      maxDiscount: 0.5,
    },
  };

  const decision = await client.calculatePrice(pricingContext);

  return {
    price: decision.finalPrice,
    factors: decision.factors.map(f => f.reason),
    surge: decision.adjustmentType === 'surge',
  };
}

/**
 * Process billing with dynamic pricing
 */
export async function processDynamicBilling(
  client: RevenueAIClient,
  items: MenuItem[],
  context: BillingContext
): Promise<{
  items: BillingItem[];
  subtotal: number;
  totalSurge: number;
  totalDiscount: number;
}> {
  const billingItems: BillingItem[] = [];
  let totalSurge = 0;
  let totalDiscount = 0;

  for (const item of items) {
    const pricing = await getDynamicPriceForItem(client, item, context);

    const itemTotal = pricing.price * item.quantity;
    const originalTotal = item.basePrice * item.quantity;
    const adjustment = itemTotal - originalTotal;

    if (adjustment > 0) {
      totalSurge += adjustment;
    } else {
      totalDiscount += Math.abs(adjustment);
    }

    billingItems.push({
      itemId: item.id,
      name: item.name,
      quantity: item.quantity,
      unitPrice: pricing.price,
      dynamicPrice: pricing.price,
      pricingFactors: pricing.factors,
    });
  }

  return {
    items: billingItems,
    subtotal: billingItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    totalSurge,
    totalDiscount,
  };
}

/**
 * Optimize cashback for order
 */
export async function getOptimizedCashback(
  client: RevenueAIClient,
  orderValue: number,
  customer: { userId: string; segment: string; churnRisk: number }
): Promise<{ cashback: number; rate: number }> {
  const result = await client.optimizeCashback({
    merchantId: 'restaurant_001',
    userId: customer.userId,
    orderValue,
    category: 'food',
    vertical: 'restaurant',
    context: {
      audience: {
        segment: customer.segment as 'new' | 'regular' | 'vip' | 'at_risk' | 'dormant',
        ltv: 5000,
        churnRisk: customer.churnRisk,
        orderCount: 10,
      },
    },
  });

  return {
    cashback: result.recommendedCashback,
    rate: result.rate,
  };
}

// Helper functions
function isPeakHour(hour: number): boolean {
  return (hour >= 12 && hour <= 14) || (hour >= 19 && hour <= 21);
}

function getSeason(month: number): 'spring' | 'summer' | 'autumn' | 'winter' {
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'autumn';
  return 'winter';
}

interface BillingContext {
  tableId: string;
  time: Date;
  slotsRemaining?: number;
  totalSlots?: number;
  audience?: { userId: string; segment: string };
}
```

### Example: Demand Forecast for Staffing

```typescript
// integrations/restaurant-forecast.ts

import { RevenueAIClient } from '../sdk';

export async function getStaffingRecommendation(
  client: RevenueAIClient,
  merchantId: string
) {
  const forecast = await client.getDemandForecast({
    merchantId,
    vertical: 'restaurant',
    category: 'general',
    location: {
      city: 'Bangalore',
      tier: 1,
      weather: 'clear',
      footfallIndex: 50,
    },
    horizon: 'day',
  });

  const today = forecast.forecasts[0];
  const peakHours = today.hourlyBreakdown
    .filter(h => h.isPeakHour)
    .map(h => h.hour);

  const baseStaff = 5;
  const peakDemand = today.peakDemand;
  const staffMultiplier = peakDemand / 50;

  return {
    recommendedStaff: Math.ceil(baseStaff * staffMultiplier),
    peakHours,
    offPeakReduction: Math.floor(baseStaff * 0.3),
    hourlyBreakdown: today.hourlyBreakdown,
  };
}
```

---

## 2. Hotel Booking Integration

### Example: Dynamic Room Pricing

```typescript
// integrations/hotel-booking.ts

import { RevenueAIClient, PricingContext } from '../sdk';

interface RoomType {
  id: string;
  name: string;
  baseRate: number;
  cost: number;
  maxOccupancy: number;
}

interface BookingContext {
  checkIn: Date;
  checkOut: Date;
  roomType: RoomType;
  guestCount: number;
  userId?: string;
  segment?: string;
  leadTimeDays?: number;
}

/**
 * Calculate dynamic room rate
 */
export async function calculateDynamicRoomRate(
  client: RevenueAIClient,
  booking: BookingContext
) {
  const nights = Math.ceil((booking.checkOut.getTime() - booking.checkIn.getTime()) / (1000 * 60 * 60 * 24));
  const dayOfWeek = booking.checkIn.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
  const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;

  const pricingContext: PricingContext = {
    entity: {
      id: booking.roomType.id,
      type: 'room',
      category: booking.roomType.name,
      vertical: 'hotel',
      name: booking.roomType.name,
      basePrice: booking.roomType.baseRate,
      cost: booking.roomType.cost,
    },
    time: {
      dayOfWeek,
      hourOfDay: 12,
      isPeakHour: isWeekend,
      isWeekend,
      season: getSeason(booking.checkIn.getMonth()),
      month: booking.checkIn.getMonth() + 1,
      isHoliday: isHoliday(booking.checkIn),
      eventNearby: await checkNearbyEvents(booking.checkIn),
    },
    demand: {
      current: 75, // From demand API
      predicted: 80,
      trend: 'increasing',
    },
    inventory: {
      percentage: 40, // 60% booked
      slotsRemaining: 12,
      totalSlots: 30,
      velocity: 'normal',
    },
    competition: {
      avgPrice: booking.roomType.baseRate * 1.05,
      competitorCount: 8,
      marketPosition: 'mid_market',
    },
    audience: booking.userId ? {
      userId: booking.userId,
      segment: booking.segment as 'new' | 'regular' | 'vip' | 'at_risk' | 'dormant' || 'regular',
      ltv: 25000,
      churnRisk: 0.2,
      orderCount: 5,
    } : undefined,
    location: {
      city: 'Bangalore',
      tier: 1,
      footfallIndex: 60,
      weather: 'clear',
      nearbyEvents: 0,
    },
    constraints: {
      minMargin: 0.25,
      maxSurge: 3.0,
      maxDiscount: 0.4,
    },
  };

  const decision = await client.calculatePrice(pricingContext);

  // Calculate total for stay
  const perNightRate = decision.finalPrice;
  const totalRate = perNightRate * nights;

  // Lead time discount
  const leadTimeDiscount = calculateLeadTimeDiscount(booking.leadTimeDays);

  return {
    perNightRate,
    totalRate,
    baseRate: booking.roomType.baseRate,
    nights,
    adjustment: decision.adjustment,
    adjustmentType: decision.adjustmentType,
    factors: decision.factors,
    leadTimeDiscount,
    finalRate: totalRate * (1 - leadTimeDiscount),
    gst: {
      cgst: totalRate * 0.09,
      sgst: totalRate * 0.09,
      total: totalRate * 0.18,
    },
  };
}

/**
 * Calculate lead time discount
 */
function calculateLeadTimeDiscount(daysUntilCheckIn?: number): number {
  if (!daysUntilCheckIn) return 0;
  if (daysUntilCheckIn >= 30) return 0.15; // 15% for bookings 30+ days ahead
  if (daysUntilCheckIn >= 14) return 0.10; // 10% for 14+ days
  if (daysUntilCheckIn >= 7) return 0.05;   // 5% for 7+ days
  return 0;
}

function getSeason(month: number): 'spring' | 'summer' | 'autumn' | 'winter' {
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'autumn';
  return 'winter';
}

async function checkNearbyEvents(date: Date): Promise<boolean> {
  // Check against events API
  return false;
}

function isHoliday(date: Date): boolean {
  // Check against holiday calendar
  const holidays = [
    '2026-01-26', // Republic Day
    '2026-08-15', // Independence Day
    '2026-10-02', // Gandhi Jayanti
    '2026-10-31', // Diwali (approximate)
  ];
  const dateStr = date.toISOString().split('T')[0];
  return holidays.includes(dateStr);
}
```

---

## 3. Clinic Booking Integration

### Example: Dynamic Consultation Pricing

```typescript
// integrations/clinic-booking.ts

import { RevenueAIClient, PricingContext } from '../sdk';

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  consultationFee: number;
  experienceYears: number;
}

interface AppointmentContext {
  doctor: Doctor;
  mode: 'in_clinic' | 'teleconsult' | 'home_visit';
  date: Date;
  timeSlot: string;
  patient?: { userId: string; segment: string };
}

/**
 * Calculate dynamic consultation fee
 */
export async function calculateConsultationFee(
  client: RevenueAIClient,
  appointment: AppointmentContext
) {
  const dayOfWeek = appointment.date.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
  const hour = parseInt(appointment.timeSlot.split(':')[0]);

  const pricingContext: PricingContext = {
    entity: {
      id: appointment.doctor.id,
      type: 'appointment',
      category: appointment.doctor.specialization,
      vertical: 'clinic',
      name: `${appointment.doctor.name} Consultation`,
      basePrice: appointment.doctor.consultationFee,
      cost: appointment.doctor.consultationFee * 0.4,
    },
    time: {
      dayOfWeek,
      hourOfDay: hour,
      isPeakHour: isPeakClinicHour(hour),
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      season: getSeason(appointment.date.getMonth()),
      month: appointment.date.getMonth() + 1,
      isHoliday: false,
    },
    demand: {
      current: 65,
      predicted: 70,
      trend: 'stable',
    },
    inventory: {
      slotsRemaining: 3,
      totalSlots: 20,
      percentage: 85, // 85% booked
    },
    competition: {
      avgPrice: appointment.doctor.consultationFee * 0.95,
      competitorCount: 10,
    },
    audience: appointment.patient ? {
      userId: appointment.patient.userId,
      segment: appointment.patient.segment as 'new' | 'regular' | 'vip' | 'at_risk' | 'dormant' || 'regular',
      ltv: 10000,
      churnRisk: 0.3,
      orderCount: 3,
    } : undefined,
    location: {
      city: 'Bangalore',
      tier: 1,
      footfallIndex: 55,
      weather: 'clear',
      nearbyEvents: 0,
    },
    constraints: {
      minMargin: 0.3,
      maxSurge: 1.5,
      maxDiscount: 0.4,
    },
  };

  const decision = await client.calculatePrice(pricingContext);

  // Mode-based adjustments
  let finalFee = decision.finalPrice;
  let modeAdjustment = 0;

  if (appointment.mode === 'teleconsult') {
    modeAdjustment = -0.20; // 20% discount for teleconsult
    finalFee *= 0.8;
  } else if (appointment.mode === 'home_visit') {
    modeAdjustment = 0.50; // 50% premium for home visit
    finalFee *= 1.5;
  }

  return {
    baseFee: appointment.doctor.consultationFee,
    dynamicFee: Math.round(finalFee),
    modeAdjustment,
    modeAdjustmentLabel: appointment.mode === 'teleconsult' ? 'Teleconsult Discount' :
                        appointment.mode === 'home_visit' ? 'Home Visit Premium' : null,
    factors: decision.factors,
    surge: decision.adjustmentType === 'surge',
    recommendedCashback: decision.adjustmentType === 'discount' ? Math.round(finalFee * 0.05) : 0,
  };
}

/**
 * Get optimal slot recommendation
 */
export async function getOptimalSlotRecommendation(
  client: RevenueAIClient,
  doctorId: string,
  date: Date
) {
  const forecast = await client.getDemandForecast({
    merchantId: doctorId,
    vertical: 'clinic',
    category: 'consultation',
    location: {
      city: 'Bangalore',
      tier: 1,
      footfallIndex: 50,
    },
    horizon: 'day',
    startDate: date.toISOString(),
  });

  const today = forecast.forecasts[0];

  // Find best slots for patient
  const slots = [];
  for (const hour of [9, 10, 11, 14, 15, 16, 17, 18]) {
    const hourData = today.hourlyBreakdown.find(h => h.hour === hour);
    if (hourData) {
      slots.push({
        time: `${hour}:00`,
        demand: hourData.predictedDemand,
        pricing: hourData.recommendedPricing,
        discount: hourData.recommendedPricing === 'discount' ? '10-15% off' :
                 hourData.recommendedPricing === 'surge' ? 'Peak pricing' : 'Normal',
      });
    }
  }

  return {
    date: today.date,
    slots,
    recommendedSlot: slots.find(s => s.pricing === 'discount') || slots[0],
    peakHours: today.hourlyBreakdown.filter(h => h.isPeakHour).map(h => `${h.hour}:00`),
  };
}

function isPeakClinicHour(hour: number): boolean {
  return (hour >= 10 && hour <= 12) || (hour >= 17 && hour <= 19);
}

function getSeason(month: number): 'spring' | 'summer' | 'autumn' | 'winter' {
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'autumn';
  return 'winter';
}
```

---

## 4. Salon POS Integration

### Example: Dynamic Service Pricing with Slot-Based Surge

```typescript
// integrations/salon-pos.ts

import { RevenueAIClient, PricingContext } from '../sdk';

interface Service {
  id: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  duration: number;
}

interface BookingRequest {
  service: Service;
  stylistId?: string;
  date: Date;
  time: string;
  customer?: { userId: string; segment: string; isNew: boolean };
}

/**
 * Calculate dynamic service price with slot-based surge
 */
export async function calculateServicePrice(
  client: RevenueAIClient,
  booking: BookingRequest,
  slotsRemaining: number,
  totalSlots: number
) {
  const dayOfWeek = booking.date.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
  const hour = parseInt(booking.time.split(':')[0]);

  const pricingContext: PricingContext = {
    entity: {
      id: booking.service.id,
      type: 'service',
      category: booking.service.category,
      vertical: 'salon',
      name: booking.service.name,
      basePrice: booking.service.price,
      cost: booking.service.cost,
    },
    time: {
      dayOfWeek,
      hourOfDay: hour,
      isPeakHour: isPeakSalonHour(hour),
      isWeekend: dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6,
      season: getSeason(booking.date.getMonth()),
      month: booking.date.getMonth() + 1,
      isHoliday: false,
    },
    demand: {
      current: calculateCurrentDemand(slotsRemaining, totalSlots),
      predicted: 70,
      trend: slotsRemaining < 3 ? 'increasing' : 'stable',
    },
    inventory: {
      slotsRemaining,
      totalSlots,
      percentage: ((totalSlots - slotsRemaining) / totalSlots) * 100,
      velocity: 'normal',
    },
    competition: {
      avgPrice: booking.service.price * 0.98,
      competitorCount: 6,
    },
    audience: booking.customer ? {
      userId: booking.customer.userId,
      segment: booking.customer.isNew ? 'new' : 'regular',
      ltv: booking.customer.isNew ? 0 : 3000,
      churnRisk: 0.2,
      orderCount: booking.customer.isNew ? 0 : 8,
    } : undefined,
    location: {
      city: 'Bangalore',
      tier: 1,
      footfallIndex: 65,
      weather: 'clear',
      nearbyEvents: 0,
    },
    constraints: {
      minMargin: 0.35,
      maxSurge: 1.5,
      maxDiscount: 0.4,
    },
  };

  const decision = await client.calculatePrice(pricingContext);

  return {
    basePrice: booking.service.price,
    dynamicPrice: decision.finalPrice,
    adjustment: decision.adjustment,
    adjustmentType: decision.adjustmentType,
    factors: decision.factors,
    alternatives: decision.alternativePrices?.map(alt => ({
      label: alt.label,
      price: alt.price,
      savings: booking.service.price - alt.price,
    })),
    slotInfo: {
      remaining: slotsRemaining,
      total: totalSlots,
      scarcity: slotsRemaining <= 2 ? 'critical' :
               slotsRemaining <= 4 ? 'low' :
               slotsRemaining <= 7 ? 'medium' : 'high',
    },
  };
}

/**
 * Get bundle recommendation
 */
export async function getBundleRecommendation(
  client: RevenueAIClient,
  merchantId: string,
  customerId: string,
  currentService: string
) {
  const result = await client.optimizeOffer({
    merchantId,
    entityId: currentService,
    basePrice: 500,
    context: {
      demand: 50,
      isWeekend: new Date().getDay() === 5 || new Date().getDay() === 6,
    },
    optimizationGoal: 'conversion',
  });

  if (result.recommendedOffer?.type === 'bundle') {
    return {
      recommendedBundle: result.recommendedOffer,
      expectedRevenue: result.alternatives[0]?.expectedRevenue,
      savings: 50,
    };
  }

  return null;
}

/**
 * Optimize customer cashback
 */
export async function getSalonCashback(
  client: RevenueAIClient,
  merchantId: string,
  customer: { userId: string; segment: string; churnRisk: number },
  servicePrice: number
) {
  const result = await client.optimizeCashback({
    merchantId,
    userId: customer.userId,
    orderValue: servicePrice,
    category: 'salon_service',
    vertical: 'salon',
    context: {
      audience: {
        segment: customer.segment as 'new' | 'regular' | 'vip' | 'at_risk' | 'dormant',
        ltv: 3000,
        churnRisk: customer.churnRisk,
        orderCount: 5,
      },
    },
  });

  return {
    cashback: result.recommendedCashback,
    rate: result.rate,
    reason: result.reason,
  };
}

function calculateCurrentDemand(slotsRemaining: number, totalSlots: number): number {
  const occupancy = (totalSlots - slotsRemaining) / totalSlots;
  return Math.round(occupancy * 100);
}

function isPeakSalonHour(hour: number): boolean {
  return (hour >= 10 && hour <= 12) || (hour >= 18 && hour <= 20);
}

function getSeason(month: number): 'spring' | 'summer' | 'autumn' | 'winter' {
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'autumn';
  return 'winter';
}
```

---

## 5. Full Integration Example

```typescript
// integrations/complete-integration.ts

import { RevenueAIClient } from '../sdk';

/**
 * Complete booking flow with Revenue AI optimization
 */
export async function processBooking(
  client: RevenueAIClient,
  params: {
    merchantId: string;
    vertical: 'restaurant' | 'hotel' | 'clinic' | 'salon';
    items: Array<{ id: string; name: string; basePrice: number; cost: number }>;
    customer?: { userId: string; segment: string };
    date: Date;
    location: { city: string; tier: 1 | 2 | 3 };
  }
) {
  // 1. Get demand forecast
  const forecast = await client.getDemandForecast({
    merchantId: params.merchantId,
    vertical: params.vertical,
    category: 'general',
    location: {
      city: params.location.city,
      tier: params.location.tier,
      footfallIndex: 60,
    },
    horizon: 'day',
  });

  // 2. Calculate dynamic prices for all items
  const pricedItems = await Promise.all(
    params.items.map(async (item) => {
      const pricing = await client.calculatePrice({
        entity: {
          id: item.id,
          type: 'service',
          category: 'general',
          vertical: params.vertical,
          name: item.name,
          basePrice: item.basePrice,
          cost: item.cost,
        },
        time: {
          dayOfWeek: params.date.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6,
          hourOfDay: params.date.getHours(),
          isPeakHour: forecast.forecasts[0].hourlyBreakdown.some(
            h => h.hour === params.date.getHours() && h.isPeakHour
          ),
          isWeekend: params.date.getDay() === 0 || params.date.getDay() === 6,
          season: 'summer',
          month: params.date.getMonth() + 1,
        },
        demand: {
          current: forecast.forecasts[0].totalDemand,
          predicted: forecast.forecasts[0].peakDemand,
          trend: 'stable',
        },
        location: {
          city: params.location.city,
          tier: params.location.tier,
          footfallIndex: 60,
          weather: 'clear',
        },
        constraints: {
          minMargin: 0.3,
          maxSurge: params.vertical === 'hotel' ? 3.0 : 2.0,
          maxDiscount: 0.4,
        },
      });

      return {
        ...item,
        finalPrice: pricing.finalPrice,
        adjustment: pricing.adjustment,
        factors: pricing.factors.map(f => f.reason),
      };
    })
  );

  // 3. Optimize cashback for customer
  let cashback = 0;
  let cashbackRate = 0;
  if (params.customer) {
    const orderValue = pricedItems.reduce((sum, item) => sum + item.finalPrice, 0);
    const cashbackResult = await client.optimizeCashback({
      merchantId: params.merchantId,
      userId: params.customer.userId,
      orderValue,
      category: params.vertical,
      vertical: params.vertical,
      context: {
        audience: {
          segment: params.customer.segment as 'new' | 'regular' | 'vip' | 'at_risk' | 'dormant',
          ltv: 5000,
          churnRisk: 0.3,
          orderCount: 10,
        },
      },
    });
    cashback = cashbackResult.recommendedCashback;
    cashbackRate = cashbackResult.rate;
  }

  // 4. Calculate totals
  const subtotal = pricedItems.reduce((sum, item) => sum + item.finalPrice, 0);
  const totalSavings = pricedItems.reduce(
    (sum, item) => sum + Math.max(0, item.basePrice - item.finalPrice),
    0
  );
  const totalSurge = pricedItems.reduce(
    (sum, item) => sum + Math.max(0, item.finalPrice - item.basePrice),
    0
  );

  return {
    items: pricedItems,
    subtotal,
    cashback,
    cashbackRate,
    totalSavings,
    totalSurge,
    netAdjustment: totalSurge - totalSavings,
    grandTotal: subtotal - cashback,
    forecast: {
      peakHour: forecast.forecasts[0].peakHour,
      peakDemand: forecast.forecasts[0].peakDemand,
      confidence: forecast.summary.confidence,
    },
  };
}
```

---

## Error Handling

```typescript
import { RevenueAIClient } from '../sdk';

const client = createRevenueAIClient('http://localhost:4300');

try {
  const pricing = await client.calculatePrice(context);
  // Handle success
} catch (error) {
  if (error.response?.status === 400) {
    // Validation error
    console.error('Invalid request:', error.response.data.error.details);
  } else if (error.code === 'ECONNREFUSED') {
    // Service unavailable - fallback to base price
    console.warn('Revenue AI unavailable, using base price');
    return basePrice;
  } else {
    // Other error
    throw error;
  }
}
```

---

## Retry Logic

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (error.response?.status >= 500) {
        await new Promise(r => setTimeout(r, delay * Math.pow(2, i)));
      } else {
        throw error;
      }
    }
  }

  throw lastError!;
}

// Usage
const pricing = await withRetry(() => client.calculatePrice(context));
```
