# REZ-Mart - Quick Commerce Features

**Status:** ✅ PRODUCTION READY
**Competitor:** Blinkit, BigBasket, Zepto
**Tagline:** "Everything delivered in minutes"

---

## SERVICES (12 Microservices)

### Core Services

| Service | Port | Features |
|---------|------|----------|
| **Gateway** | 4100 | API Gateway, Auth, Rate limiting |
| **Order Service** | 4105 | Order processing, status tracking |
| **Cart Service** | 4108 | Cart management, calculations |
| **Delivery Service** | 4106 | Driver assignment, route optimization |
| **Store Service** | 4103 | Store inventory, hours, status |
| **Product Service** | 4104 | Catalog, search, filtering |
| **Inventory Service** | 4107 | Stock management, sync |
| **Driver Service** | 4101 | Driver onboarding, earnings |
| **Tracking Service** | 4102 | Real-time GPS, ETA |
| **Offer Service** | 4109 | Coupons, deals, cashback |
| **Subscription Service** | 4110 | Auto-replenishment |
| **Analytics Service** | 4112 | Business insights |

---

## FEATURES

### Consumer App Features

| Category | Feature | Status |
|----------|---------|--------|
| **Browsing** | Product search | ✅ |
| | Category navigation | ✅ |
| | Filters (price, brand) | ✅ |
| | Recommendations | ✅ |
| **Cart** | Add/remove items | ✅ |
| | Quantity update | ✅ |
| | Price calculation | ✅ |
| | Promo codes | ✅ |
| **Ordering** | Address selection | ✅ |
| | Payment (UPI, wallet) | ✅ |
| | Order confirmation | ✅ |
| | Order tracking | ✅ |
| **Delivery** | Real-time ETA | ✅ |
| | Driver contact | ✅ |
| | Delivery updates | ✅ |
| **Account** | Order history | ✅ |
| | Reorder | ✅ |
| | Save for later | ✅ |

### Store Features

| Category | Feature | Status |
|----------|---------|--------|
| **Inventory** | Stock levels | ✅ |
| | Low stock alerts | ✅ |
| | Bulk updates | ✅ |
| **Orders** | New order alerts | ✅ |
| | Accept/reject | ✅ |
| | Status updates | ✅ |
| **Analytics** | Sales dashboard | ✅ |
| | Peak hours | ✅ |
| | Popular items | ✅ |

### Driver Features

| Category | Feature | Status |
|----------|---------|--------|
| **Orders** | Order requests | ✅ |
| | Accept/decline | ✅ |
| | Navigation | ✅ |
| **Earnings** | Daily tracking | ✅ |
| | Withdrawals | ✅ |
| | Incentives | ✅ |
| **Performance** | Ratings | ✅ |
| | Acceptance rate | ✅ |

---

## TECHNICAL STACK

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** MongoDB

### Mobile
- **Framework:** React Native (Expo)
- **Navigation:** Expo Router

---

## INTEGRATIONS

| Service | Integration |
|---------|-------------|
| RABTUL Auth | User authentication |
| RABTUL Wallet | Payments |
| HOJAI AI | Product recommendations |
| KHAIRMOVE | Driver network |

---

## PORT ASSIGNMENTS

| Port | Service |
|------|---------|
| 4100 | Gateway |
| 4101 | Driver Service |
| 4102 | Tracking Service |
| 4103 | Store Service |
| 4104 | Product Service |
| 4105 | Order Service |
| 4106 | Delivery Service |
| 4107 | Inventory Service |
| 4108 | Cart Service |
| 4109 | Offer Service |
| 4110 | Subscription Service |
| 4112 | Analytics Service |

---

## FreshMart Story - REZ-Mart Integration

**Story:** "The Grocery Store That Never Ran Out Of What Customers Needed"  
**Location:** HSR Layout, Bangalore  
**Characters:** Karim (Customer), Ramesh (FreshMart Owner)

### FreshMart Timeline

| Time | Feature | REZ-Mart Service | Status |
|------|---------|------------------|--------|
| 5 AM | Demand prediction | Demand Forecast + Weather + Festival | ✅ **BUILT** |
| 6 AM | Stock replenishment | Inventory Service | ✅ Working |
| 7 AM | Household reorder | Consumption Model | ✅ **BUILT** |
| 10 AM | Store entry | Store Service | ⚠️ Partial |
| 11 AM | Smart Cart | **rez-mart-suggestion-service** | ✅ **BUILT** |
| Noon | Delivery activation | Delivery Service | ✅ Working |
| 3 PM | Quick sale | **auto-markdown-service** | ✅ **BUILT** |
| 4 PM | Community bulk | **buzzlocal-bulkorder-service** | ✅ **BUILT** |

### Smart Cart (11 AM) - ✅ BUILT

**Story:** Customer adds cereal → suggests milk, honey, fresh fruit

**Built Service:** `rez-mart-suggestion-service/` (Port 4118)

**Features:**
- Product relationship table (cereal → milk → honey)
- Frequently bought together analysis
- Cart suggestion API
- Cross-sell engine
- Analytics on suggestion acceptance rate

### Household Reorder (7 AM) - ✅ BUILT

**Story:** Karim's household needs milk, eggs, vegetables

**Built:** `genie-household-service/src/models/consumption.model.ts`

**Features:**
- Subscription management
- Consumption tracking
- "Shall I reorder?" trigger
- Auto-replenishment

### Community Bulk Orders (4 PM) - MISSING

**Story:** Apartment needs 200 milk packets

**Required Features:**
- Bulk order aggregation
- Society/department store
- Minimum threshold triggers
- Delivery pooling

---

## FreshMart Services Summary - ALL BUILT ✅

| Service | Port | Location |
|---------|------|----------|
| Smart Cart Suggestions | 4118 | `REZ-Mart/rez-mart-suggestion-service/` |
| Consumption Tracking | (via 4706) | `hojai-ai/genie-household-service/` |
| Weather Integration | (via 3000) | `rez-demand-forecast/src/services/` |
| Festival Calendar | (via 3000) | `rez-demand-forecast/src/services/` |
| Auto-Markdown | 4653 | `REZ-Merchant/industry-os/auto-markdown-service/` |
| Bulk Orders | 4019 | `Axom/buzzlocal/buzzlocal-bulkorder-service/` |

---

**Last Updated:** June 13, 2026
