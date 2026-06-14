# REZ Revenue AI - Complete Merchant Integration Plan

**Date:** May 31, 2026
**Status:** AUDIT COMPLETE - INTEGRATION READY

---

## REZ Merchant Ecosystem Overview

### Main Services

| Service | Purpose | REZ Revenue AI Integration |
|--------|---------|-------------------------|
| `rez-merchant-service` | Core merchant API | Pricing, Cashback, Offers |
| `rez-merchant-copilot` | AI Copilot for merchants | MerchantGPT, Recommendations |
| `rez-merchant-intelligence-service` | Merchant analytics | Benchmark, Segments |
| `rez-merchant-integrations` | External integrations | Webhooks, APIs |

### Industry OS Services

| Vertical | Services | REZ Revenue AI Integration |
|----------|----------|-------------------------|
| **Restaurant** | restauranthub, rez-ai-restaurant, rez-mind-restaurant | Full pricing + forecasting |
| **Hotel** | hotel-ecosystem, rez-hotel-service, rez-hotel-pos-service | Dynamic room rates |
| **Salon** | rez-salon-service, rez-mind-salon, rez-salon-admin-web | Slot-based surge |
| **Fitness** | rez-fitness-service, rez-fitness-access-service, rez-mind-fitness | Class pricing |
| **Healthcare** | rez-healthcare-service, rez-mind-healthcare | Consultation fees |
| **Retail** | rez-retail-pos, rez-pharmacy-service | Inventory pricing |
| **Drive-thru** | rez-drive-thru-kds | Rush hour surge |

### Dashboards & Apps

| App | Type | Integration |
|-----|------|------------|
| `REZ-dashboard` | Admin Dashboard | Real-time metrics |
| `rez-app-merchant` | Merchant Mobile App | Chat, Offers |
| `REZ-kds-mobile` | Kitchen Display | Demand alerts |
| `merchant-referral-portal` | Referral Portal | Campaign generator |

---

## RABTUL Integration Points

### Services to Connect

| RABTUL Service | Port | REZ Revenue AI Use |
|---------------|------|-------------------|
| `rez-auth-service` | 4002 | Merchant authentication |
| `rez-payment-service` | 4001 | Payment processing |
| `rez-wallet-service` | 4004 | Cashback credits |
| `rez-notifications-service` | 4011 | Campaign delivery |
| `rez-booking-service` | 4020 | Reservation pricing |

### Integration Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    REZ Revenue AI Platform (4300-4330)                    │
│  Pricing │ Forecast │ Offers │ Cashback │ Copilot │ Benchmark │ Segments │
└─────────────────────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         REZ Merchant Ecosystem                              │
├─────────────────┬─────────────────┬─────────────────┬─────────────────────┤
│  Restaurant OS   │    Hotel OS     │    Salon OS     │    Fitness OS       │
│  ────────────   │   ──────────    │   ──────────    │    ──────────       │
│  • POS          │  • Booking      │  • Appointments  │  • Classes           │
│  • KDS         │  • Room Mgmt    │  • Services      │  • Memberships       │
│  • Menu        │  • Channel      │  • Inventory     │  • Sessions          │
│  • Billing     │  • Housekeep    │  • Staff        │  • PT               │
└────────┬────────┴────────┬────────┴────────┬────────┴────────┬────────────┘
         │                │                │                │
         ▼                ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         RABTUL Platform Services                            │
│  Auth (4002) │ Payment (4001) │ Wallet (4004) │ Notifications (4011)         │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Integration Implementation

### 1. Restaurant Hub - Full Integration

**Service:** `industry-os/restauranthub/`
**Priority:** P0 (Highest)

**Integration Points:**

```typescript
// In restauranthub/src/services/pricing.service.ts

import { RevenueAIPricingService } from '@rez/revenue-ai-sdk';

class RestaurantPricingService {
  private revenueAI = new RevenueAIPricingService({
    baseUrl: 'http://localhost:4301'
  });

  // Dynamic menu pricing at POS
  async calculateItemPrice(itemId: string, context: {
    tableId: string;
    time: Date;
    customerId?: string;
  }) {
    const item = await this.getMenuItem(itemId);
    
    return this.revenueAI.calculatePrice({
      entity: {
        id: itemId,
        type: 'product',
        vertical: 'restaurant',
        category: item.category,
        basePrice: item.price,
        cost: item.cost,
      },
      time: {
        dayOfWeek: context.time.getDay(),
        hourOfDay: context.time.getHours(),
        isWeekend: this.isWeekend(context.time),
      },
      inventory: {
        slotsRemaining: await this.getAvailableTables(context.tableId),
        totalSlots: await this.getTotalTables(),
      },
      audience: context.customerId ? {
        userId: context.customerId,
        segment: await this.getCustomerSegment(context.customerId),
      } : undefined,
    });
  }

  // Demand forecasting for staffing
  async getStaffingRecommendation() {
    const forecast = await this.revenueAI.getDemandForecast({
      merchantId: this.merchantId,
      horizon: 'day',
      location: this.location,
    });
    return forecast.staffingRecommendation;
  }
}
```

### 2. Hotel POS - Dynamic Room Rates

**Service:** `industry-os/rez-hotel-pos-service/`
**Priority:** P0

**Integration Points:**

```typescript
// In rez-hotel-pos-service/src/services/pricing.service.ts

import { HotelAdapter } from '@rez/revenue-ai-sdk';

class HotelPricingService {
  private revenueAI = new HotelAdapter({
    baseUrl: 'http://localhost:4301'
  });

  // Dynamic room pricing based on demand
  async calculateRoomRate(roomType: string, checkIn: Date) {
    const room = await this.getRoomType(roomType);

    return this.revenueAI.priceRoom(room, {
      checkIn,
      checkOut: new Date(checkIn.getTime() + 86400000),
      availableRooms: await this.getAvailableRooms(roomType),
      totalRooms: room.totalRooms,
    });
  }

  // Seasonal pricing
  async getSeasonalPricing() {
    return this.revenueAI.getSeasonalRates({
      merchantId: this.merchantId,
      season: this.getCurrentSeason(),
    });
  }
}
```

### 3. Salon Service - Slot-Based Surge

**Service:** `industry-os/rez-salon-service/`
**Priority:** P1

**Integration Points:**

```typescript
// In rez-salon-service/src/services/pricing.service.ts

import { SalonAdapter } from '@rez/revenue-ai-sdk';

class SalonPricingService {
  private revenueAI = new SalonAdapter({
    baseUrl: 'http://localhost:4301'
  });

  // Dynamic service pricing based on slot availability
  async calculateServicePrice(serviceId: string, slot: Date) {
    const service = await this.getService(serviceId);

    return this.revenueAI.priceService(service, {
      slot,
      stylistId: await this.getAvailableStylist(slot),
      slotsRemaining: await this.getAvailableSlots(serviceId, slot),
      totalSlots: service.dailySlots,
    });
  }

  // Bundle pricing
  async calculateBundlePrice(serviceIds: string[]) {
    return this.revenueAI.calculateBundle({
      services: serviceIds,
      discount: 0.15, // 15% off bundles
    });
  }
}
```

### 4. Fitness Service - Class Pricing

**Service:** `industry-os/rez-fitness-service/`
**Priority:** P1

**Integration Points:**

```typescript
// In rez-fitness-service/src/services/pricing.service.ts

import { GymAdapter } from '@rez/revenue-ai-sdk';

class FitnessPricingService {
  private revenueAI = new GymAdapter({
    baseUrl: 'http://localhost:4301'
  });

  // Dynamic class pricing
  async calculateClassPrice(classId: string, classTime: Date) {
    const fitnessClass = await this.getClass(classId);

    return this.revenueAI.priceClass(fitnessClass, {
      classTime,
      capacityRemaining: await this.getRemainingCapacity(classId),
      totalCapacity: fitnessClass.capacity,
    });
  }

  // Membership tier pricing
  async getMembershipPricing(userId: string) {
    const segments = await this.revenueAI.getCustomerSegments(userId);
    return this.calculateTierPricing(segments);
  }
}
```

### 5. Merchant Copilot - AI Integration

**Service:** `rez-merchant-copilot/`
**Priority:** P1

**Integration Points:**

```typescript
// In rez-merchant-copilot/src/services/ai.service.ts

import { RevenueAgent } from '@rez/revenue-ai-sdk';

class MerchantAIService {
  private agent = new RevenueAgent({
    baseUrl: 'http://localhost:4330'
  });

  // Revenue questions
  async askRevenueQuestion(question: string, merchantId: string) {
    return this.agent.chat(merchantId, question);
  }

  // Get autonomous actions
  async getRevenueActions(merchantId: string) {
    return this.agent.getAutonomousActions(merchantId);
  }

  // Run revenue simulation
  async simulateScenario(scenario: {
    type: 'pricing' | 'offer' | 'cashback';
    changes: Record<string, number>;
  }) {
    return this.agent.simulate(scenario);
  }
}
```

### 6. Merchant Intelligence - Analytics Integration

**Service:** `rez-merchant-intelligence-service/`
**Priority:** P2

**Integration Points:**

```typescript
// In rez-merchant-intelligence-service/src/services/analytics.service.ts

import { BenchmarkService, SegmentService } from '@rez/revenue-ai-sdk';

class MerchantAnalyticsService {
  private benchmark = new BenchmarkService({
    baseUrl: 'http://localhost:4309'
  });
  private segments = new SegmentService({
    baseUrl: 'http://localhost:4310'
  });

  // Revenue benchmark score
  async getBenchmarkScore(merchantId: string) {
    return this.benchmark.getScore(merchantId);
  }

  // Customer segments
  async getCustomerSegments(merchantId: string) {
    return this.segments.getAnalysis(merchantId);
  }

  // Revenue trend analysis
  async getRevenueTrends(merchantId: string, period: string) {
    const benchmark = await this.getBenchmarkScore(merchantId);
    const segments = await this.getCustomerSegments(merchantId);
    return this.analyzeTrends(benchmark, segments);
  }
}
```

---

## Universal Integration SDK

### Install SDK

```bash
npm install @rez/revenue-ai-sdk
```

### Configure Services

```typescript
// config/revenueAI.ts
import { RevenueAIClient, createVerticalAdapter } from '@rez/revenue-ai-sdk';

export const revenueAI = createVerticalAdapter({
  baseUrl: process.env.REVENUE_AI_URL || 'http://localhost:4301',
  apiKey: process.env.REVENUE_AI_API_KEY,
  timeout: 10000,
  fallbackEnabled: true,
});

export const revenueAgent = new RevenueAIClient({
  baseUrl: process.env.REVENUE_AGENT_URL || 'http://localhost:4330',
});
```

### Use in Any Service

```typescript
// Dynamic pricing
const price = await revenueAI.client.price({
  entity: { id, type, vertical, basePrice, cost },
  time: { dayOfWeek, hourOfDay, isWeekend },
  demand: { current },
  inventory: { slotsRemaining, totalSlots },
});

// Demand forecast
const forecast = await revenueAI.client.forecast({
  merchantId, vertical, horizon: 'week'
});

// AI chat
const response = await revenueAgent.chat(merchantId, question);

// Benchmark
const score = await revenueAgent.getBenchmark(merchantId);

// Cashback
const cashback = await revenueAI.client.optimizeCashback({
  merchantId, userId, orderValue, vertical, audience
});
```

---

## Status Tracker

| Vertical | Service | Pricing | Forecast | Cashback | Offers | Chat | Benchmark |
|----------|---------|---------|----------|----------|--------|------|-----------|
| **Restaurant** | restauranthub | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Hotel** | rez-hotel-pos-service | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Salon** | rez-salon-service | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Fitness** | rez-fitness-service | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Healthcare** | rez-healthcare-service | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Retail** | rez-retail-pos | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## Next Steps

1. **Restaurant Hub (P0)** - Core POS pricing integration
2. **Hotel POS (P0)** - Room rate dynamic pricing
3. **Merchant Copilot (P1)** - AI chat integration
4. **All verticals (P2)** - Complete rollout

---

**Document:** COMPLETE
**Last Updated:** May 31, 2026
