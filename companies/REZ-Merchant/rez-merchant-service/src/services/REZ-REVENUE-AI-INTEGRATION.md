# REZ-Merchant + REZ Revenue AI Integration

## Overview

REZ Merchant (Restaurant, Hotel, Salon, etc.) now integrates with REZ Revenue AI for intelligent pricing.

## Quick Start

### 1. Import the Service

```typescript
import { getRevenueAIPricingService } from './services/revenueAIPricing';

// Or use singleton
const revenuePricing = getRevenueAIPricingService();
```

### 2. Calculate Dynamic Price

```typescript
const result = await revenuePricing.calculateDynamicPrice(
  'item_001',        // itemId
  500,               // basePrice
  200,               // cost
  {
    category: 'main_course',
    time: new Date(),
    tablesRemaining: 3,
    totalTables: 15,
    customerId: 'cust_123',
    customerSegment: 'regular',
    city: 'Bangalore',
    tier: 1
  }
);

console.log(`Dynamic Price: ₹${result.dynamicPrice}`);
// Output: Dynamic Price: ₹650 (+30% surge)
console.log('Factors:', result.factors);
```

### 3. Get Demand Forecast

```typescript
const forecast = await revenuePricing.getDemandForecast(
  'merchant_001',
  'week'  // horizon: day | week | month
);

console.log(`Peak Hour: ${forecast.peakHour}:00`);
console.log(`Avg Demand: ${forecast.avgDemand}%`);
console.log(`Peak Day: ${forecast.peakDay}`);
```

### 4. Optimize Cashback

```typescript
const cashback = await revenuePricing.getOptimalCashback(
  'merchant_001',
  'cust_123',
  1000,  // orderValue
  {
    segment: 'at_risk',
    ltv: 5000,
    churnRisk: 0.75
  }
);

console.log(`Cashback: ₹${cashback.cashbackAmount}`);
console.log(`Rate: ${cashback.cashbackRate * 100}%`);
```

### 5. Revenue Action Plan

```typescript
const plan = await revenuePricing.getRevenuePlan(
  'merchant_001',
  {
    type: 'revenue',
    target: 50000,  // ₹50K more
    timeframe: 'month'
  }
);

console.log(`Gap: ₹${plan.gap}`);
console.log(`Expected Uplift: ₹${plan.totalUplift}`);
plan.recommendations.forEach(rec => {
  console.log(`- ${rec.title}: +₹${rec.impact}`);
});
```

## Environment Variables

```bash
# REZ Revenue AI
REVENUE_AI_URL=http://localhost:4301

# Internal Auth
INTERNAL_SERVICE_TOKEN=your-token
```

## Service Ports

| Service | Port | Purpose |
|---------|------|---------|
| Pricing Engine | 4301 | Dynamic pricing |
| Demand Forecast | 4302 | Demand predictions |
| Offer Optimizer | 4303 | Offer generation |
| Cashback Optimizer | 4304 | Segment cashback |
| Revenue Copilot | 4307 | Goal planning |
| Simulation Engine | 4308 | What-if testing |
| Benchmark Score | 4309 | Revenue score |
| Segment Brain | 4310 | Behavioral segments |
| Campaign Generator | 4311 | Multi-channel campaigns |
| MerchantGPT | 4312 | Conversational advisor |

## Verticals Supported

| Vertical | Adapter | Use Case |
|----------|---------|---------|
| Restaurant | `restaurant` | Menu pricing, table surge |
| Hotel | `hotel` | Room rates, seasonal pricing |
| Salon | `salon` | Slot-based surge, service bundles |
| Gym | `gym` | Class pricing, membership tiers |
| Clinic | `clinic` | Consultation fees, urgency pricing |
| Retail | `retail` | Inventory pricing, clearance |

## API Response Example

```json
{
  "itemId": "pizza_001",
  "basePrice": 500,
  "dynamicPrice": 650,
  "adjustment": 30,
  "adjustmentType": "surge",
  "factors": [
    {
      "name": "Time Factor",
      "reason": "Peak dinner hours (7-9 PM)",
      "contribution": 15
    },
    {
      "name": "Inventory Factor",
      "reason": "High demand (80% full)",
      "contribution": 15
    }
  ],
  "alternativePrices": [
    {
      "label": "Book for 3 PM",
      "price": 450,
      "offer": "15% off for off-peak"
    }
  ]
}
```

## Error Handling

The service automatically falls back to local calculation if REZ Revenue AI is unavailable:

```typescript
try {
  const result = await revenuePricing.calculateDynamicPrice(...);
} catch (error) {
  // Falls back to local calculation automatically
  // Logs warning but doesn't throw
}
```

## Testing

```typescript
// Mock REZ Revenue AI responses
jest.mock('./services/revenueAIPricing', () => ({
  getRevenueAIPricingService: () => ({
    calculateDynamicPrice: jest.fn().mockResolvedValue({
      itemId: 'test',
      basePrice: 500,
      dynamicPrice: 650,
      adjustment: 30,
      adjustmentType: 'surge',
      factors: [
        { name: 'Peak hour', reason: 'Dinner rush', contribution: 15 },
        { name: 'Demand', reason: 'High occupancy', contribution: 15 }
      ]
    }),
    getDemandForecast: jest.fn().mockResolvedValue({
      peakHour: 19,
      avgDemand: 75,
      peakDay: 'Saturday'
    })
  })
}));
```

## Status

- [x] Pricing integration (4301)
- [x] Demand forecast (4302)
- [x] Cashback optimizer (4304)
- [x] Revenue copilot (4307)
- [ ] Offer optimizer integration
- [ ] Campaign generator integration
- [ ] MerchantGPT integration
