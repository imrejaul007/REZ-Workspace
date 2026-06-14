# CLAUDE.md - REZ Grocery OS

## Project Overview

**Name:** REZ Grocery OS  
**Industry:** Quick Commerce / Grocery Retail  
**Purpose:** Intelligent grocery store management with demand prediction, procurement automation, and spoilage prevention  
**Location:** `companies/REZ-Merchant/industry-os/grocery-os/`

---

## FreshMart Story Context

This Grocery OS powers **FreshMart** - a grocery store in HSR Layout, Bangalore owned by **Ramesh**.

### Story Timeline
| Time | Event | Feature |
|------|-------|---------|
| 5 AM | Demand prediction | Milk +12%, Vegetables +22% |
| 6 AM | Procurement | Stock replenishment from suppliers |
| 7 AM | Household reorder | Genie suggests "Shall I reorder?" |
| 8 AM | Owner briefing | Revenue, satisfaction, inventory health |
| 11 AM | Smart cart | "Add milk to cereal" |
| 3 PM | Spoilage prevention | Quick sale on expiring vegetables |
| 4 PM | Community commerce | Bulk orders from apartments |

---

## Architecture

```
grocery-os/
├── core/
│   └── rez-grocery/              # Main service (4651)
│       └── src/
│           ├── services/
│           │   ├── inventoryService.ts
│           │   ├── expiryTracker.ts      # Spoilage detection
│           │   ├── supplierService.ts
│           │   └── demandService.ts
│           ├── routes/
│           └── models/
└── integrations/
    └── rez-grocery-inventory/    # Inventory service (4652)
```

---

## Related Services

### REZ-Mart (Consumer)
**Location:** `REZ-Consumer/REZ-Mart/`

| Service | Port | Purpose |
|---------|------|---------|
| rez-mart-gateway | 4100 | API Gateway |
| rez-mart-order-service | 4105 | Order processing |
| rez-mart-cart-service | 4108 | Cart management |
| rez-mart-delivery-service | 4106 | Delivery tracking |
| rez-mart-inventory-service | 4111 | Stock management |
| rez-mart-offer-service | 4109 | Coupons/deals |

### Demand Forecasting
**Location:** `REZ-Merchant/rez-demand-forecast/`

| Feature | Status |
|---------|--------|
| SMA/WMA/EMA forecasting | ✅ Working |
| Linear regression | ✅ Working |
| Weather integration | ❌ MISSING |
| Festival multipliers | ❌ MISSING |

### Genie (Household)
**Location:** `hojai-ai/`

| Service | Purpose |
|---------|---------|
| genie-household-service | Family management |
| genie-briefing-service | Morning briefings |
| genie-memory-service | Preferences |

---

## FreshMart Integration Points

### 5 AM - Demand Prediction
```typescript
// Connect weather API to demand forecast
POST /api/forecast/daily
Body: { storeId, weather: "rain", festival: "Diwali" }
// Returns: { milk: +12%, vegetables: +22%, delivery: +31% }
```

### 6 AM - Procurement
```typescript
// Trigger procurement from low stock
POST /api/procurement/intent
Body: { storeId, items: [{ sku: "milk", qty: 1000 }] }
// Triggers Nexha ProcurementOS RFQ
```

### 3 PM - Spoilage Prevention
```typescript
// Check expiring items
GET /api/inventory/expiring?hours=24
// Returns: { tomatoes: 50kg, bananas: 30kg }
// Triggers AdBazaar quick sale campaign
```

### 4 PM - Community Bulk Orders
```typescript
// Create bulk order from society
POST /api/bulk-order
Body: { societyId, items: [{ sku: "milk", qty: 200 }] }
```

---

## Missing Features (FreshMart Gaps)

### 🔴 HIGH Priority
1. **Smart Cart Suggestions** - `POST /cart/:id/suggestions`
2. **Weather API Integration** - Rain = +31% delivery
3. **Festival Calendar** - Diwali/Eid demand multipliers
4. **Auto-Markdown** - Quick sale discounts for expiring items

### 🟡 MEDIUM Priority
1. **Consumption Tracking** - Track household milk/egg consumption
2. **Dietary Preferences** - Customer food preferences
3. **Bulk Order Detection** - 200 milk packets for apartment

---

## Port Registry

| Service | Port | Status |
|---------|------|--------|
| rez-grocery | 4651 | TODO (needs build) |
| rez-grocery-inventory | 4652 | TODO (needs build) |

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Runtime | Node.js |
| Framework | Express.js |
| Language | TypeScript |
| Database | MongoDB |
| Cache | Redis |

---

## Development

```bash
# Start grocery-os (when built)
cd core/rez-grocery
npm install
npm run dev  # Port 4651
```

---

*Last Updated: June 13, 2026*
