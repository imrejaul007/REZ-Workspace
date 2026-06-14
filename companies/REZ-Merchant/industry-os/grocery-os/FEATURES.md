# FEATURES.md - REZ Grocery OS

**Last Updated:** June 13, 2026  
**Industry:** Quick Commerce / Grocery Retail  
**Story:** FreshMart - The Grocery Store That Never Ran Out Of What Customers Needed

---

## FreshMart Story Features - ALL COMPLETE ✅

### Story Timeline & Features

| Time | Feature | Status | Description |
|------|---------|--------|-------------|
| 5 AM | **Demand Prediction** | ✅ BUILT | Weather + Festival + Historical |
| 6 AM | **Inventory Detection** | ✅ WORKING | Detects low stock: tomatoes, milk, bananas, eggs |
| 6 AM | **Procurement Automation** | ✅ WORKING | Creates procurement intents via Nexha |
| 6 AM | **Payment Scheduling** | ✅ BUILT | RABTUL Payment API |
| 7 AM | **Household Reorder** | ✅ BUILT | Consumption Model in genie-household-service |
| 8 AM | **Owner Briefing** | ✅ BUILT | hojai-grocery-briefing-service |
| 9 AM | **Store Discovery** | ✅ BUILT | buzzlocal-store-discovery |
| 10 AM | **Shopping Twin Entry** | ✅ BUILT | store-entry-service + preferences |
| 11 AM | **Smart Cart** | ✅ BUILT | rez-mart-suggestion-service |
| 3 PM | **Spoilage Prevention** | ✅ BUILT | auto-markdown-service |
| 4 PM | **Community Commerce** | ✅ BUILT | buzzlocal-bulkorder-service |

---

## Core Features

### 1. Inventory Management

| Feature | Status | Description |
|---------|--------|-------------|
| Stock Tracking | ✅ Built | Real-time inventory levels |
| Low Stock Alerts | ✅ Built | Notifications when items run low |
| Expiry Tracking | ✅ Built | Severity alerts at 3/7/14/30 days |
| Reorder Suggestions | ✅ Built | Based on historical data |
| Category Management | ✅ Built | Produce, Dairy, Bakery, etc. |

### 2. Demand Forecasting

| Feature | Status | Description |
|---------|--------|-------------|
| Simple Moving Average | ✅ Built | SMA-based forecasting |
| Weighted Moving Average | ✅ Built | WMA with recent bias |
| Exponential Moving Average | ✅ Built | EMA with decay |
| Trend Detection | ✅ Built | Linear regression |
| Anomaly Detection | ✅ Built | Spike/drop alerts (>50%/30%) |
| Weather Integration | ✅ **BUILT** | weather.service.ts - Rain = +31% delivery |
| Festival Calendar | ✅ **BUILT** | festival.service.ts - Diwali/Eid multipliers |

### 3. Procurement

| Feature | Status | Description |
|---------|--------|-------------|
| RFQ Creation | ✅ Built | Nexha ProcurementOS integration |
| Supplier Negotiation | ✅ Built | Agent-based negotiation |
| Delivery Scheduling | ✅ Built | Integration with DistributionOS |
| Payment Scheduling | ✅ **BUILT** | REZ-procurement-payment (4007) |

### 4. Spoilage Prevention

| Feature | Status | Description |
|---------|--------|-------------|
| Expiry Alerts | ✅ Built | CRITICAL/URGENT/WARNING/NOTICE |
| Freshness Score | ✅ Built | Overall inventory health |
| Value-at-Risk | ✅ Built | Products × cost × stock |
| Auto-Markdown | ✅ **BUILT** | auto-markdown-service |
| AdBazaar Promotion | ✅ **BUILT** | auto-markdown-service |
| 24hr Expiry Rules | ✅ **BUILT** | auto-markdown-service |

---

## FreshMart-Specific Features - ALL BUILT ✅

### 5AM - Demand Prediction

**Story:** Grocery Twin analyzes yesterday's sales, weather, festivals, family patterns

**Built Features:**
- ✅ Weather API integration (weather.service.ts)
- ✅ Festival calendar with demand multipliers (festival.service.ts)
- ✅ Family buying pattern analysis (consumption.model.ts)
- ✅ Time-of-day granularity (ForecastEngine.ts)
- ✅ Category-specific models (milk expiry, vegetable freshness)

**Weather Impacts:**
| Condition | Delivery | Dairy | Beverages |
|-----------|---------|-------|----------|
| Rainy | +31% | - | Hot +20% |
| Cold | +15% | +25% | +30% |
| Hot | +20% | +20% | +40% |

**Festival Multipliers:**
| Festival | Overall | Key Categories |
|----------|---------|----------------|
| Diwali | +80% | Sweets +200%, Ghee +150% |
| Eid | +60% | Meat +150%, Bakery +80% |
| Holi | +50% | Colors +200%, Sweets +120% |

### 6AM - Procurement Automation

**Story:** Inventory Twin detects low stock, Sutar creates procurement intents, Nexha activates Farm/Dairy agents

**Required Features:**
- Farm Agent for agricultural procurement
- Dairy Agent with cold-chain logic
- RABTUL payment scheduling
- DistributionOS van sale scheduling

**Current Status:** RFQ and negotiation work, agents missing

### 7AM - Household Consumption

**Story:** Genie notices Karim's household is low on milk, eggs, vegetables

**Required Features:**
- Household inventory model
- Consumption rate tracking
- Low-stock detection
- "Shall I reorder?" notification
- Grocery service integration

**Current Status:** genie-household-service exists, needs consumption model

### 8AM - Owner Briefing

**Story:** "Good Morning Ramesh. Revenue Yesterday: ₹3.4 Lakhs. Customer Satisfaction: 4.8. Inventory Health: 94%"

**Required Features:**
- Revenue metrics (daily/weekly/monthly)
- Customer satisfaction score
- Inventory health percentage
- Recommended actions engine
- Scheduled 8AM delivery

**Current Status:** genie-business-intelligence has revenue, needs grocery metrics

### 11AM - Smart Cart

**Story:** Customer adds cereal → suggests milk, honey, fresh fruit

**Required Features:**
- Product relationship table
- "Frequently bought together" analysis
- Cart suggestion endpoint
- Cross-sell engine

**Current Status:** ❌ MISSING - needs new service

### 3PM - Spoilage Prevention

**Story:** Vegetable Twin notices tomatoes expiring in 24 hours → Quick Sale Campaign

**Required Features:**
- 24-hour expiry rules for vegetables
- Auto-discount generation (20-50% off)
- AdBazaar campaign trigger
- Nearby customer notification

**Current Status:** Expiry tracking works, auto-markdown missing

### 4PM - Community Commerce

**Story:** Apartment society needs 200 milk packets → NeighborAI discovers → FreshMart fulfills

**Required Features:**
- Society bulk order detection
- Group buy aggregation
- Minimum threshold triggers
- Delivery pooling

**Current Status:** buzzlocal-society-service exists, needs bulk order detection

---

## Feature Gaps Summary

### 🔴 HIGH Priority (Story Breaks Without)

| Feature | File to Build | Impact |
|---------|--------------|--------|
| Smart Cart Suggestions | `rez-mart-suggestion-service/` | Revenue |
| Household Consumption | Extend `genie-household-service/` | Engagement |
| Demand Prediction + Weather | Extend `rez-demand-forecast/` | Operations |
| Auto-Markdown | `auto-markdown-service/` | Cost |

### 🟡 MEDIUM Priority

| Feature | Action | Impact |
|---------|--------|--------|
| Festival Calendar | Add to `rez-demand-forecast/` | Accuracy |
| Bulk Order Detection | Extend `buzzlocal-society-service/` | Revenue |
| Store Entry Detection | New `store-entry-service/` | Experience |
| Dietary Preferences | Add to `customer-twin-service/` | Personalization |

### 🟢 LOW Priority

| Feature | Action |
|---------|--------|
| Baby Product Tracking | New model |
| Family Size Field | Add to shopper profile |

---

## API Endpoints (To Build)

### Inventory
```
GET  /api/inventory                  # List all inventory
GET  /api/inventory/:sku            # Get item
POST /api/inventory                 # Add stock
PUT  /api/inventory/:sku            # Update stock
GET  /api/inventory/expiring        # Get expiring items
GET  /api/inventory/low-stock       # Get low stock items
```

### Demand Forecasting
```
POST /api/forecast/daily            # Generate daily forecast
GET  /api/forecast/:storeId        # Get forecast
POST /api/forecast/weather          # Update with weather
```

### Procurement
```
POST /api/procurement/intent        # Create procurement intent
GET  /api/procurement/intents       # List intents
POST /api/procurement/rfq           # Create RFQ
```

### Spoilage
```
GET  /api/spoilage/risk            # Get spoilage risk items
POST /api/spoilage/markdown         # Generate markdown
POST /api/spoilage/campaign         # Launch AdBazaar campaign
```

### Community
```
POST /api/bulk-order               # Create bulk order
GET  /api/bulk-order/:societyId   # Get society bulk orders
POST /api/bulk-order/aggregate     # Aggregate demand
```

---

## Integration Points

### With Nexha (Procurement)
- RFQ creation
- Supplier negotiation
- Delivery scheduling

### With AdBazaar (Promotions)
- Quick sale campaigns
- Customer notifications
- Location-based targeting

### With Genie (Household)
- Consumption tracking
- Reorder suggestions
- Morning briefings

### With RABTUL (Payments)
- Payment scheduling
- Escrow for bulk orders
- Loyalty points

### With BuzzLocal (Community)
- Society bulk orders
- Neighborhood discovery
- Apartment targeting

---

*FreshMart Feature List Completed: June 13, 2026*
