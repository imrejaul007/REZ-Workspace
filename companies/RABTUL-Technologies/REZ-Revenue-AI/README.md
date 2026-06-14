# REZ Revenue AI - Dynamic Pricing & Revenue Intelligence Platform

**AI-powered revenue optimization for restaurants, hotels, clinics, salons, and more.**

## Overview

REZ Revenue AI is a unified platform that combines dynamic pricing, demand forecasting, offer optimization, and merchant intelligence to maximize revenue for SMBs across verticals.

### Core Features

| Feature | Description |
|---------|-------------|
| **Dynamic Pricing** | Real-time price adjustments based on demand, time, inventory, competition |
| **Demand Forecasting** | ML-powered predictions for staffing, inventory, and revenue |
| **Offer Optimization** | AI-generated offers that maximize conversion and revenue |
| **Cashback Optimization** | Segment-based cashback rates that balance acquisition and retention |
| **Revenue Copilot** | Goal-based AI planning ("How can I make ₹50K more?") |
| **Simulation Engine** | What-if testing before changes |
| **Benchmark Score** | Gamified revenue score (82/100) |
| **Segment Brain** | 10 behavioral micro-segments |
| **Campaign Generator** | Auto-generate WhatsApp/SMS/Push/Instagram |
| **MerchantGPT** | Conversational business advisor |

## Advanced Features

| Feature | Description |
|---------|-------------|
| **Revenue Copilot** | "How can I make ₹50K more this month?" → Action plan with specific steps |
| **Simulation Engine** | "What if I raise prices 10%?" → Impact prediction before changes |
| **Benchmark Score** | Revenue Score: 82/100 - Gamified benchmarking vs category |
| **Segment Brain** | Bargain Hunters, High Value, Weekend Warriors, etc. |
| **Campaign Generator** | Auto-generate multi-channel campaigns |
| **MerchantGPT** | Conversational Q&A for business insights |

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    REZ Revenue AI Platform (4300-4312)                     │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐          │
│  │  Pricing Engine │  │ Demand Forecast  │  │ Offer Optimizer │          │
│  │     (4301)      │  │     (4302)       │  │     (4303)       │          │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐          │
│  │ Cashback Opt.   │  │ Merchant Advisor │  │ Cross-Merchant   │          │
│  │     (4304)      │  │     (4305)       │  │     (4306)       │          │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐          │
│  │ Revenue Copilot │  │ Simulation Eng.  │  │ Benchmark Score │          │
│  │     (4307)      │  │     (4308)       │  │     (4309)       │          │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘          │
│  ┌─────────────────┐  ┌─────────────────┐                               │
│  │ Segment Brain   │  │ Campaign Gener.  │  ┌─────────────────┐       │
│  │     (4310)      │  │     (4311)       │  │ MerchantGPT     │       │
│  └─────────────────┘  └─────────────────┘  │     (4312)       │       │
│                                         └─────────────────┘               │
├─────────────────────────────────────────────────────────────────────────────┤
│                         HOJAI AI Integration                             │
│  Hojai Agents (4550) │ Hojai Workflow (4560) │ Hojai Memory (4520)           │
├─────────────────────────────────────────────────────────────────────────────┤
│                         Ecosystem Integration                             │
│  REZ-Merchant │ StayOwn │ RisaCare │ ReZ-Ride │ KHAIRMOVE │ CorpPerks        │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Supported Verticals

| Vertical | Surge Max | Key Use Cases |
|----------|-----------|---------------|
| **Restaurant** | 2.0x | Peak hours, off-peak discounts, near-expiry |
| **Hotel** | 3.0x | Seasonal rates, event pricing, lead time |
| **Salon** | 1.5x | Time-based pricing, slot availability |
| **Clinic** | 1.5x | After-hours, specialist premiums |
| **Gym** | 1.3x | Morning rush, off-peak memberships |
| **Events** | 4.0x | Early bird, last-minute pricing |
| **Retail** | 1.8x | Inventory clearance, flash sales |
| **Home Services** | 1.8x | Peak hours, weekend pricing |
| **Corp Perks** | 1.3x | Benefits enrollment periods |

## Quick Start

### Option 1: Start All Services

```bash
cd REZ-Revenue-AI

# Start the gateway (orchestrates all services)
cd revenue-ai-gateway && npm install && npm run dev

# In separate terminals, start microservices:
cd ../pricing-engine && npm install && npm run dev
cd ../demand-forecast && npm install && npm run dev
cd ../offer-optimizer && npm install && npm run dev
cd ../cashback-optimizer && npm install && npm run dev
cd ../merchant-advisor && npm install && npm run dev
```

### Option 2: Use Docker Compose (coming soon)

```bash
docker-compose up
```

## API Reference

### Gateway (Port 4300)

Single entry point for all services.

#### Pricing

```bash
# Calculate dynamic price
curl -X POST http://localhost:4300/api/v1/pricing/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "context": {
      "entity": {
        "id": "service_123",
        "type": "service",
        "category": "haircut",
        "vertical": "salon",
        "name": "Haircut",
        "basePrice": 500,
        "cost": 200
      },
      "time": {
        "dayOfWeek": 5,
        "hourOfDay": 19,
        "isPeakHour": true,
        "isWeekend": false,
        "season": "summer",
        "month": 5,
        "isHoliday": false,
        "eventNearby": false
      },
      "demand": {
        "current": 75,
        "predicted": 80,
        "historical": 60,
        "realTime": 70,
        "trend": "increasing",
        "confidence": 0.8
      },
      "inventory": {
        "level": 3,
        "max": 10,
        "percentage": 30,
        "slotsRemaining": 2,
        "totalSlots": 8,
        "velocity": "slow"
      },
      "competition": {
        "avgPrice": 450,
        "lowestPrice": 400,
        "highestPrice": 600,
        "competitorCount": 5
      },
      "location": {
        "city": "Bangalore",
        "tier": 1,
        "footfallIndex": 70,
        "weather": "clear",
        "nearbyEvents": 0
      },
      "constraints": {
        "minMargin": 0.15,
        "maxDiscount": 0.5,
        "maxSurge": 1.5,
        "strategy": "balanced"
      }
    }
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "entityId": "service_123",
    "finalPrice": 650,
    "originalPrice": 500,
    "adjustment": 30,
    "adjustmentType": "surge",
    "confidence": 0.87,
    "factors": [
      { "name": "peak_hour", "value": 0.2, "reason": "7PM is peak salon hours" },
      { "name": "current_demand", "value": 0.12, "reason": "Current demand above average" },
      { "name": "slot_availability", "value": 0.05, "reason": "Only 2 slots remaining" }
    ],
    "alternativePrices": [
      { "label": "Book tomorrow 2PM", "price": 399, "offer": "Off-peak special" }
    ]
  }
}
```

#### Demand Forecast

```bash
curl -X POST http://localhost:4300/api/v1/forecast \
  -H "Content-Type: application/json" \
  -d '{
    "merchantId": "merchant_123",
    "vertical": "restaurant",
    "category": "pizza",
    "location": {
      "city": "Bangalore",
      "tier": 1,
      "weather": "clear",
      "footfallIndex": 50
    },
    "horizon": "week"
  }'
```

#### Offer Optimization

```bash
curl -X POST http://localhost:4300/api/v1/offers/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "merchantId": "merchant_123",
    "entityId": "product_456",
    "basePrice": 500,
    "optimizationGoal": "conversion",
    "context": {
      "demand": 35,
      "isWeekend": true
    }
  }'
```

#### Cashback Optimization

```bash
curl -X POST http://localhost:4300/api/v1/cashback/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "merchantId": "merchant_123",
    "userId": "user_789",
    "orderValue": 1000,
    "category": "food",
    "vertical": "restaurant",
    "context": {
      "audience": {
        "segment": "at_risk",
        "ltv": 5000,
        "churnRisk": 0.75,
        "orderCount": 15
      }
    }
  }'
```

#### Merchant Advisor

```bash
# Get diagnosis
curl -X POST http://localhost:4300/api/v1/advisor/diagnosis \
  -H "Content-Type: application/json" \
  -d '{
    "merchantId": "merchant_123",
    "period": "week"
  }'

# Ask question
curl "http://localhost:4300/api/v1/advisor/ask?merchantId=merchant_123&question=Why%20are%20sales%20down"
```

#### Unified Revenue Optimization

```bash
curl -X POST http://localhost:4300/api/v1/revenue/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "merchantId": "merchant_123",
    "entityId": "service_789",
    "basePrice": 500,
    "cost": 200,
    "vertical": "salon",
    "audience": {
      "segment": "regular",
      "ltv": 5000,
      "churnRisk": 0.2
    }
  }'
```

## Services (13 Microservices)

| Port | Service | Description |
|------|---------|-------------|
| 4300 | Gateway | Unified API entry point |
| 4301 | Pricing Engine | 8-factor dynamic pricing |
| 4302 | Demand Forecast | ML-powered predictions |
| 4303 | Offer Optimizer | AI-generated offers |
| 4304 | Cashback Optimizer | Segment-based cashback |
| 4305 | Merchant Advisor | Q&A insights |
| 4306 | Cross-Merchant | Ecosystem trends |
| 4307 | Revenue Copilot | Goal-based planning |
| 4308 | Simulation Engine | What-if testing |
| 4309 | Benchmark Score | Revenue score 82/100 |
| 4310 | Segment Brain | 10 behavioral segments |
| 4311 | Campaign Generator | Multi-channel campaigns |
| 4312 | MerchantGPT | Conversational advisor |

### Core Services

**Pricing Engine (4301)** - 8-factor dynamic pricing:
- Time (day of week, hour, weekend, holiday)
- Demand (current, predicted, trend)
- Inventory (stock level, slots, expiry)
- Competition (avg price, market position)
- Audience (segment, LTV, churn risk)
- Location (city tier, footfall)
- Weather
- Events

**Demand Forecast (4302)** - ML-powered predictions:
- Hourly breakdown
- Peak/off-peak identification
- Staffing recommendations
- Inventory recommendations

**Offer Optimizer (4303)** - AI-generated offers:
- 8 templates (discounts, bundles, cashback)
- Goal-based optimization
- Conversion lift prediction

**Cashback Optimizer (4304)** - Segment-based rates:
- New user: 15-25%
- Regular: 5-12%
- VIP: 2-5%
- At-risk: 10-20%
- Dormant: 8-15%

### AI Services

**Revenue Copilot (4307)** - Goal-based planning:
- "How can I make ₹50K more this month?"
- Specific actions with expected impact
- Gap analysis with total uplift

**Simulation Engine (4308)** - What-if testing:
- "What if I raise prices 10%?"
- Impact prediction before changes
- Risk and sensitivity analysis

**Benchmark Score (4309)** - Gamified scoring:
- Revenue Score: 82/100
- 6-metric breakdown
- Category leaderboard

**Segment Brain (4310)** - Behavioral micro-segments:
- Bargain Hunters, High Value Users, Weekend Warriors
- Corporate Users, Loyal Advocates, Churn Risks
- Per-segment pricing strategy

**Campaign Generator (4311)** - Multi-channel:
- WhatsApp, SMS, Push, Instagram, QR
- AI-generated copy
- Budget and ROI estimates

**MerchantGPT (4312)** - Conversational advisor:
- "Why are my sales down?"
- "How many staff tomorrow?"
- Actionable recommendations

## Integration with Ecosystem Companies

### SDK Installation

```bash
npm install @rez/revenue-ai-sdk
```

### Integration by Company

| Company | Merchant Type | Integration | Port |
|----------|-------------|-------------|------|
| **REZ-Merchant** | Restaurant, Hotel, Salon | Full SDK | 4300 |
| **StayOwn (Habixo)** | Hotels, Property | Hotel Adapter | 4300 |
| **RisaCare** | Clinics, Healthcare | Healthcare Adapter | 4300 |
| **ReZ-Ride** | Ride-hailing | Ride Adapter | 4300 |
| **KHAIRMOVE** | Mobility, Logistics | Ride Adapter | 4300 |
| **CorpPerks** | Enterprise, HR | Restaurant Adapter | 4300 |
| **Airzy** | Travel, Flights | Hotel Adapter | 4300 |

### Quick Integration Example

```typescript
import { createRevenueAI } from '@rez/revenue-ai-sdk';

// Create client
const revenueAI = createRevenueAI('http://localhost:4300');

// Restaurant - Dynamic menu pricing
const pricing = await revenueAI.restaurant.priceMenuItem({
  id: 'pizza_001',
  name: 'Margherita Pizza',
  category: 'pizza',
  price: 450,
  cost: 180
}, {
  time: new Date('2026-05-31 19:00'),
  tablesRemaining: 3,
  totalTables: 15
});

// Hotel - Dynamic room pricing
const room = await revenueAI.hotel.priceRoom({
  id: 'deluxe_001',
  name: 'Deluxe Room',
  category: 'deluxe',
  baseRate: 3000,
  cost: 1200
}, {
  checkIn: new Date('2026-06-15'),
  availableRooms: 8,
  totalRooms: 50
});

// Salon - Dynamic service pricing
const service = await revenueAI.salon.priceService({
  id: 'haircut_001',
  name: 'Haircut',
  category: 'basic',
  price: 500,
  cost: 180
}, {
  slot: new Date('2026-05-31 19:00'),
  slotsRemaining: 2,
  totalSlots: 8
});

// Ask MerchantGPT
const response = await revenueAI.client.chat({
  merchantId: 'merchant_001',
  message: 'Why are my sales down this week?'
});
```

### Connect to REZ Intelligence

```typescript
import { rezIntelligence } from './shared/clients';

// Get user intelligence
const intelligence = await rezIntelligence.getUserIntelligence(userId);

// Get location insights
const location = await rezIntelligence.getLocationIntelligence(lat, lng);

// Get demand forecast
const forecast = await rezIntelligence.getMerchantDemand(merchantId);
```

### Connect to RABTUL Services

```typescript
import { rabtulWallet, rabtulAuth } from './shared/clients';

// Verify user
const { valid, userId } = await rabtulAuth.verifyToken(token);

// Credit cashback
await rabtulWallet.creditCashback(userId, amount, 'Dynamic pricing cashback');
```

## Configuration

### Environment Variables

```bash
# Service Ports
PORT=4300
PRICING_ENGINE_PORT=4301
DEMAND_FORECAST_PORT=4302
OFFER_OPTIMIZER_PORT=4303
CASHBACK_OPTIMIZER_PORT=4304
MERCHANT_ADVISOR_PORT=4305

# REZ Intelligence Services
SIGNAL_AGGREGATOR_URL=http://localhost:4142
PREDICTIVE_ENGINE_URL=http://localhost:4141
FEATURE_STORE_URL=http://localhost:4128
HYPERLOCAL_BRAIN_URL=http://localhost:4148
DEMAND_FORECAST_URL=http://localhost:4042

# RABTUL Services
AUTH_SERVICE_URL=http://localhost:4002
WALLET_SERVICE_URL=http://localhost:4004
INTERNAL_SERVICE_TOKEN=your-token
```

## Pricing Examples

### Restaurant - Friday Dinner

| Factor | Impact |
|--------|--------|
| Base price | ₹500 |
| Friday evening | +15% |
| Peak hour (7PM) | +20% |
| Low slots (3/10) | +10% |
| Weather clear | 0% |
| **Final price** | **₹725** |

### Salon - Monday Afternoon

| Factor | Impact |
|--------|--------|
| Base price | ₹500 |
| Monday | -15% |
| Afternoon | -25% |
| Plenty slots | -10% |
| New user | -5% |
| **Final price** | **₹289** |

### Hotel - Festival Season

| Factor | Impact |
|--------|--------|
| Base price | ₹3000 |
| Festival (Diwali) | +80% |
| Weekend | +15% |
| VIP customer | +2% |
| Last minute | +30% |
| **Final price** | **₹6,732** |

## Revenue Model

| Tier | Price | Features |
|------|-------|----------|
| SMB | ₹999/mo | Basic dynamic pricing, weekly insights |
| Growth | ₹4,999/mo | Full pricing, forecasting, offers, cashback |
| Enterprise | ₹25,000/mo | Everything + API access + custom integrations |

Revenue share option: 1-3% of revenue uplift

## Directory Structure

```
REZ-Revenue-AI/
├── revenue-ai-gateway/      # Unified gateway (4300)
├── pricing-engine/          # Core pricing (4301)
├── demand-forecast/         # Demand prediction (4302)
├── offer-optimizer/        # Offer generation (4303)
├── cashback-optimizer/      # Cashback optimization (4304)
├── merchant-advisor/        # AI insights (4305)
├── cross-merchant-intelligence/  # Ecosystem insights (4306) - coming soon
└── shared/
    ├── types/              # TypeScript types
    ├── schemas/            # Zod validation schemas
    ├── configs/            # Vertical configurations
    ├── utils/              # Utility functions
    └── clients/            # Integration clients
```

## License

Proprietary - REZ Ecosystem
