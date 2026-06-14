# FEATURES.md - REZ Grocery OS

**Last Updated:** June 13, 2026  
**Industry:** Quick Commerce / Grocery Retail  
**Story:** FreshMart - The Grocery Store That Never Ran Out Of What Customers Needed

---

## FreshMart Story Features

### Story Timeline & Features

| Time | Feature | Status | Description |
|------|---------|--------|-------------|
| 5 AM | **Demand Prediction** | ⚠️ PARTIAL | Predicts milk +12%, vegetables +22%, delivery +31% |
| 6 AM | **Inventory Detection** | ✅ WORKING | Detects low stock: tomatoes, milk, bananas, eggs |
| 6 AM | **Procurement Automation** | ✅ WORKING | Creates procurement intents via Nexha |
| 7 AM | **Household Reorder** | ⚠️ PARTIAL | Genie notices "Milk finishing, Eggs running low" |
| 8 AM | **Owner Briefing** | ⚠️ PARTIAL | Good Morning Ramesh - Revenue, Satisfaction, Inventory |
| 11 AM | **Smart Cart** | ❌ MISSING | "Add milk, honey, fresh fruit to cereal" |
| 3 PM | **Spoilage Prevention** | ⚠️ PARTIAL | Expiry risk detection, needs auto-markdown |
| 4 PM | **Community Commerce** | ⚠️ PARTIAL | Bulk orders (200 milk packets for society) |

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
| Weather Integration | ❌ MISSING | Rain = +31% delivery demand |
| Festival Calendar | ❌ MISSING | Diwali/Eid demand spikes |

### 3. Procurement

| Feature | Status | Description |
|---------|--------|-------------|
| RFQ Creation | ✅ Built | Nexha ProcurementOS integration |
| Supplier Negotiation | ✅ Built | Agent-based negotiation |
| Delivery Scheduling | ✅ Built | Integration with DistributionOS |
| Payment Scheduling | ❌ MISSING | RABTUL Payment API |

### 4. Spoilage Prevention

| Feature | Status | Description |
|---------|--------|-------------|
| Expiry Alerts | ✅ Built | CRITICAL/URGENT/WARNING/NOTICE |
| Freshness Score | ✅ Built | Overall inventory health |
| Value-at-Risk | ✅ Built | Products × cost × stock |
| Auto-Markdown | ❌ MISSING | Generate quick sale discounts |
| AdBazaar Promotion | ❌ MISSING | Launch campaigns for expiring items |

---

## FreshMart-Specific Features

### 5AM - Demand Prediction

**Story:** Grocery Twin analyzes yesterday's sales, weather, festivals, family patterns

**Required Features:**
- Weather API integration
- Festival calendar with demand multipliers
- Family buying pattern analysis
- Time-of-day granularity (6AM vs 10AM rush)
- Category-specific models (milk expiry, vegetable freshness)

**Current Status:** Basic SMA/WMA/EMA exists, needs grocery-specific tuning

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
