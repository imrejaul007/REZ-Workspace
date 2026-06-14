# Hotel Owner Dashboard - Features

**Company:** StayOwn-Hospitality
**Type:** Intelligence Dashboard
**Port:** 4900
**Status:** ✅ Built (June 14, 2026)

---

## Core Features

### 1. Owner Intelligence View
- [x] Single dashboard for hotel operations
- [x] Aggregated data from multiple services
- [x] Real-time metrics
- [x] Trend analysis
- [x] AI-powered recommendations

### 2. Occupancy Analytics
- [x] Current occupancy rate
- [x] Total/occupied/available rooms
- [x] Average Daily Rate (ADR)
- [x] Revenue Per Available Room (RevPAR)
- [x] Trend indicators
- [x] Historical comparison

### 3. Revenue Analytics
- [x] Today's revenue vs target
- [x] Weekly/Monthly revenue
- [x] Revenue breakdown by category
  - Rooms: 65%
  - Food: 22%
  - Spa: 8%
  - Other: 5%
- [x] Variance analysis
- [x] Trend tracking

### 4. Pricing Recommendations
- [x] AI-powered price optimization
- [x] Occupancy-based suggestions
- [x] Expected gain calculation
- [x] Confidence scoring
- [x] Actionable insights

### 5. Conference Demand
- [x] Meeting hall utilization
- [x] Booking rate
- [x] Upcoming bookings
- [x] Revenue tracking
- [x] Capacity planning

### 6. Food & Beverage Analytics
- [x] Total F&B revenue
- [x] Breakdown by outlet
  - Rooftop: +18% growth
  - Main Restaurant: +12% growth
  - Business Center: +8% growth
  - Minibar: +5% growth
- [x] Top selling items
- [x] Average order value

### 7. Operational Metrics
- [x] Housekeeping status
- [x] Maintenance tickets
- [x] Upsell performance
- [x] Conference hall availability
- [x] Restaurant occupancy

### 8. Revenue Forecasting
- [x] 7-day revenue projection
- [x] 30-day revenue forecast
- [x] Confidence intervals
- [x] Factor analysis
- [x] Weekend booking trends

---

## Data Sources

| Service | Port | Data Provided |
|---------|------|---------------|
| Property Twin | 8448 | Occupancy, ADR, RevPAR, room counts |
| Revenue Intelligence | 4757 | Revenue metrics, forecasts |
| Room Twin | 8447 | Room status, availability |
| Guest Twin | 8446 | Guest analytics, loyalty |
| StayBot | 4840 | AI Concierge insights |
| RIDZA | 4100 | Financial analytics |
| Upsell Engine | 3813 | Upsell performance |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/dashboard/overview` | Main dashboard |
| GET | `/api/dashboard/occupancy` | Occupancy analytics |
| GET | `/api/dashboard/revenue` | Revenue analytics |
| GET | `/api/dashboard/pricing-recommendation` | AI pricing |
| GET | `/api/dashboard/forecast` | Revenue forecast |
| GET | `/api/dashboard/operational` | Operations |
| GET | `/api/dashboard/conference-demand` | Meeting halls |
| GET | `/api/dashboard/food-revenue` | F&B revenue |

---

## Key Metrics (Pentouz Hotel)

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Occupancy Rate | 92% | 85% | ✅ +7% |
| ADR | ₹4,500 | ₹4,200 | ✅ +7% |
| RevPAR | ₹4,140 | ₹3,570 | ✅ +16% |
| Monthly Revenue | ₹128L | ₹120L | ✅ +6.7% |
| Food Revenue | +14% | +10% | ✅ +4% |

---

## AI Recommendations

| Priority | Recommendation | Action | Expected Gain |
|----------|---------------|--------|---------------|
| HIGH | Premium Room Pricing | Increase 8% | ₹18L/month |
| MEDIUM | Weekend Packages | Launch packages | ₹5L/month |
| MEDIUM | Meeting Hall Expansion | Add 5th hall | ₹12L/quarter |
| LOW | Rooftop Expansion | +20% seating | ₹8L/quarter |

---

## Story Coverage

| Chapter | Description | Status |
|---------|------------|--------|
| Ch 10 | Ahmed sees intelligence | ✅ Working |
| Ch 10 | 92% occupancy display | ✅ Working |
| Ch 10 | Revenue above target | ✅ Working |
| Ch 10 | 8% pricing = ₹18L | ✅ Working |
| Ch 18 | Owner's view | ✅ Working |

---

**Last Updated:** June 14, 2026
