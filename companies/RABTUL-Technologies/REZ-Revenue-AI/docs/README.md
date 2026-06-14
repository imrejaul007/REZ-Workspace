# REZ Revenue AI - Complete Integration Documentation

**Version:** 2.0
**Date:** May 31, 2026
**Status:** ✅ PRODUCTION READY

---

## Quick Start

### All Services Running (14 Microservices)

| Port | Service | Purpose |
|------|---------|---------|
| 4300 | Gateway | Unified API entry point |
| 4301 | Pricing Engine | 8-factor dynamic pricing |
| 4302 | Demand Forecast | ML predictions |
| 4303 | Offer Optimizer | AI offers |
| 4304 | Cashback Optimizer | Segment cashback |
| 4305 | Merchant Advisor | Q&A insights |
| 4306 | Cross-Merchant | Ecosystem trends |
| 4307 | Revenue Copilot | Goal planning |
| 4308 | Simulation Engine | What-if testing |
| 4309 | Benchmark Score | Revenue score |
| 4310 | Segment Brain | Behavioral segments |
| 4311 | Campaign Generator | Multi-channel campaigns |
| 4312 | MerchantGPT | Conversational advisor |
| 4330 | Revenue Agent | Autonomous AI |

### Dashboard

- **URL:** http://localhost:5173
- **Status:** ✅ Running

---

## API Testing

```bash
# Dynamic Pricing
curl -X POST http://localhost:4301/api/v1/pricing/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "context": {
      "entity": {
        "id": "pizza_001",
        "type": "product",
        "category": "pizza",
        "vertical": "restaurant",
        "name": "Margherita Pizza",
        "basePrice": 450,
        "cost": 180
      },
      "time": {
        "dayOfWeek": 5,
        "hourOfDay": 19,
        "isPeakHour": true,
        "isWeekend": true
      },
      "demand": { "current": 75 },
      "inventory": { "slotsRemaining": 3, "totalSlots": 15 }
    }
  }'

# MerchantGPT
curl -X POST http://localhost:4312/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"merchantId": "test", "message": "How to increase revenue?"}'

# Revenue Copilot
curl -X POST http://localhost:4307/api/v1/copilot/revenue-plan \
  -H "Content-Type: application/json" \
  -d '{"merchantId": "test", "goal": {"type": "revenue", "target": 50000, "timeframe": "month"}}'

# Benchmark Score
curl http://localhost:4309/api/v1/benchmarks/test_merchant

# Revenue Agent Chat
curl -X POST http://localhost:4330/api/v1/agent/chat \
  -H "Content-Type: application/json" \
  -d '{"merchantId": "test", "message": "Why are my sales down?"}'
```

---

## SDK Integration

### Install SDK

```bash
npm install @rez/revenue-ai-sdk
```

### Quick Usage

```typescript
import { createMerchantIntegration } from '@rez/revenue-ai-sdk';

const revenue = createMerchantIntegration('restaurant');

// Dynamic pricing
const price = await revenue.calculatePrice({
  entityId: 'item_001',
  entityName: 'Margherita Pizza',
  category: 'pizza',
  basePrice: 450,
  cost: 180,
  time: new Date(),
  slotsRemaining: 3,
  totalSlots: 15,
  customerSegment: 'regular',
});

console.log(`Dynamic Price: ₹${price.dynamicPrice}`);
console.log(`Factors: ${price.factors.map(f => f.reason).join(', ')}`);

// Demand forecast
const forecast = await revenue.getForecast('merchant_001', 'week');
console.log(`Peak Hour: ${forecast.peakHour}:00`);

// Cashback
const cashback = await revenue.getCashback('merchant_001', 'cust_123', 1000, 'vip');
console.log(`Cashback: ₹${cashback.cashbackAmount}`);

// Chat
const response = await revenue.chat('merchant_001', 'How can I make more money?');
console.log(response.response);

// Benchmark
const benchmark = await revenue.getBenchmark('merchant_001');
console.log(`Score: ${benchmark.overallScore}/100 (${benchmark.letterGrade})`);
```

---

## Merchant Integration Guide

### Restaurant Hub

```typescript
// In your order/pricing service
import { revenueAI } from './utils/revenueAI';

async function calculateOrderPricing(order: Order) {
  const items = await Promise.all(
    order.items.map(async (item) => {
      const price = await revenueAI.calculatePrice({
        entityId: item.productId,
        entityName: item.name,
        category: item.category,
        basePrice: item.price,
        cost: item.cost,
        vertical: 'restaurant',
        time: new Date(),
        slotsRemaining: order.tablesRemaining,
        totalSlots: order.totalTables,
        customerSegment: order.customerSegment,
      });

      return {
        ...item,
        unitPrice: price.dynamicPrice,
        pricingFactors: price.factors,
      };
    })
  );

  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

  // Calculate cashback
  const cashback = await revenueAI.getCashback(subtotal, order.customerSegment);

  return { items, subtotal, cashback };
}
```

### Hotel POS

```typescript
async function calculateRoomRate(roomType: RoomType, checkIn: Date) {
  const room = await getRoomType(roomType);

  return revenueAI.calculatePrice({
    entityId: room.id,
    entityName: room.name,
    category: room.category,
    basePrice: room.baseRate,
    cost: room.cost,
    vertical: 'hotel',
    time: checkIn,
    slotsRemaining: room.available,
    totalSlots: room.total,
    customerSegment: guest.segment,
  });
}
```

### Salon

```typescript
async function calculateServicePrice(service: Service, slot: Date) {
  return revenueAI.calculatePrice({
    entityId: service.id,
    entityName: service.name,
    category: service.category,
    basePrice: service.price,
    cost: service.cost,
    vertical: 'salon',
    time: slot,
    slotsRemaining: await getAvailableSlots(service.id, slot),
    totalSlots: service.dailySlots,
    customerSegment: customer.segment,
  });
}
```

---

## File Structure

```
REZ-Revenue-AI/
├── integrations/
│   ├── index.ts              # Unified SDK
│   ├── restaurantHub.ts      # Restaurant integration
│   ├── hotelService.ts      # Hotel integration
│   ├── salonService.ts      # Salon integration
│   ├── fitnessService.ts     # Fitness integration
│   ├── nestjs-module.ts      # NestJS module template
│   └── QUICK-INTEGRATION.md  # Quick start guide
│
├── agents/
│   └── revenue-agent/        # Autonomous Revenue Agent
│       └── index.ts          # Port 4330
│
├── docs/
│   ├── ECOSYSTEM-INTEGRATION-PLAN.md
│   ├── COMPLETE-INTEGRATION-GUIDE.md
│   ├── MERCHANT-INTEGRATION-PLAN.md
│   └── README.md             # This file
│
├── sdk/
│   └── vertical-adapters.ts # 6 vertical adapters
│
├── dashboard/               # React Dashboard (Port 5173)
│
├── shared/                  # Shared types & configs
│
├── revenue-ai-gateway/      # Port 4300
├── pricing-engine/          # Port 4301
├── demand-forecast/          # Port 4302
├── offer-optimizer/         # Port 4303
├── cashback-optimizer/      # Port 4304
├── merchant-advisor/         # Port 4305
├── cross-merchant-intelligence/ # Port 4306
├── revenue-copilot/          # Port 4307
├── simulation-engine/        # Port 4308
├── benchmark-score/          # Port 4309
├── segment-brain/            # Port 4310
├── campaign-generator/        # Port 4311
└── merchant-gpt/             # Port 4312
```

---

## Environment Variables

```bash
# REZ Revenue AI
REVENUE_AI_URL=http://localhost:4301
REVENUE_AGENT_URL=http://localhost:4330

# Optional
LOG_LEVEL=info
PORT=4301
```

---

## Verticals Supported

| Vertical | Pricing | Forecast | Cashback | Offers | Chat |
|----------|---------|----------|----------|--------|------|
| Restaurant | ✅ | ✅ | ✅ | ✅ | ✅ |
| Hotel | ✅ | ✅ | ✅ | ✅ | ✅ |
| Salon | ✅ | ✅ | ✅ | ✅ | ✅ |
| Fitness | ✅ | ✅ | ✅ | ✅ | ✅ |
| Healthcare | ✅ | ✅ | ✅ | ✅ | ✅ |
| Retail | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## Features

### Dynamic Pricing (4301)
- 8-factor pricing model
- Time-based surge/discount
- Inventory-based pricing
- Customer segment pricing
- Weather/event adjustments
- Competition-based pricing

### Demand Forecast (4302)
- Hourly/dayly predictions
- Peak/off-peak identification
- Staffing recommendations
- Inventory planning

### Offer Optimizer (4303)
- 8 offer templates
- Goal-based optimization
- Conversion lift prediction

### Cashback Optimizer (4304)
- 5 customer segments
- 17 verticals
- Automatic rate calculation

### Revenue Copilot (4307)
- Goal-based planning
- Action recommendations
- Gap analysis

### Simulation Engine (4308)
- What-if scenarios
- Impact prediction
- Risk analysis

### Benchmark Score (4309)
- 6-metric scoring
- Letter grades (A+ to D)
- Category rankings

### Segment Brain (4310)
- 10 behavioral segments
- Per-segment strategies
- Conversion insights

### Campaign Generator (4311)
- Multi-channel (WhatsApp, SMS, Push, Instagram)
- AI-generated content
- Budget optimization

### MerchantGPT (4312)
- Natural language Q&A
- Revenue diagnosis
- Action recommendations

### Revenue Agent (4330)
- Autonomous task execution
- Memory-enabled chat
- Action plans

---

## Status

| Component | Status |
|----------|--------|
| Core Services (13) | ✅ Running |
| Revenue Agent | ✅ Running |
| Dashboard | ✅ Running |
| SDK | ✅ Ready |
| Integrations | ✅ Templates Ready |
| Documentation | ✅ Complete |

---

**Last Updated:** May 31, 2026
