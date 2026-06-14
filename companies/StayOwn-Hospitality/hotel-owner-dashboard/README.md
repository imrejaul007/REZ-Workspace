# Hotel Owner Dashboard

**Company:** StayOwn-Hospitality
**Type:** Intelligence Dashboard
**Port:** 4900
**Status:** ✅ Built (June 14, 2026)

---

## Overview

Hotel Owner Dashboard provides Ahmed's intelligence view of Pentouz Hotel operations. It aggregates data from multiple services to provide actionable insights.

### Tagline
> "What business am I really running?"

---

## Data Sources Connected

| Service | Port | Data Provided |
|---------|------|---------------|
| **Property Twin** | 8448 | Occupancy, ADR, RevPAR |
| **Revenue Intelligence** | 4757 | Revenue metrics, forecasts |
| **Room Twin** | 8447 | Room status, availability |
| **Guest Twin** | 8446 | Guest analytics, loyalty |
| **StayBot** | 4840 | AI Concierge insights |
| **RIDZA** | 4100 | Financial analytics |
| **Upsell Engine** | 3813 | Upsell performance |

---

## Dashboard Features

### Owner View (Ahmed's Intelligence)
- [x] **Occupancy Dashboard** - 92% current rate
- [x] **Revenue Analytics** - Above target (+6.7%)
- [x] **Pricing Recommendations** - AI-powered suggestions
- [x] **Conference Demand** - Meeting hall analytics
- [x] **Food Revenue** - F&B breakdown (+14%)
- [x] **Operational Metrics** - Housekeeping, maintenance
- [x] **Revenue Forecast** - 30-day projection
- [x] **Recommendations** - Actionable insights

### Key Metrics Displayed

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Occupancy Rate | 92% | 85% | ✅ Above |
| ADR | ₹4,500 | ₹4,200 | ✅ Above |
| RevPAR | ₹4,140 | ₹3,570 | ✅ Above |
| Revenue (Month) | ₹128L | ₹120L | ✅ +6.7% |
| Food Revenue Growth | +14% | +10% | ✅ Above |

### AI Recommendations

| Recommendation | Expected Gain | Status |
|---------------|---------------|--------|
| Increase premium pricing 8% | ₹18 Lakhs/month | Ready |
| Weekend packages | ₹5 Lakhs/month | Ready |
| 5th meeting hall | ₹12 Lakhs/quarter | Planning |
| Rooftop expansion 20% | ₹8 Lakhs/quarter | Planning |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/dashboard/overview` | Main dashboard (Ahmed's view) |
| GET | `/api/dashboard/occupancy` | Occupancy analytics |
| GET | `/api/dashboard/revenue` | Revenue analytics |
| GET | `/api/dashboard/pricing-recommendation` | AI pricing suggestions |
| GET | `/api/dashboard/forecast` | Revenue forecast |
| GET | `/api/dashboard/operational` | Operations metrics |
| GET | `/api/dashboard/conference-demand` | Meeting hall analytics |
| GET | `/api/dashboard/food-revenue` | F&B revenue |

---

## Quick Start

```bash
cd companies/StayOwn-Hospitality/hotel-owner-dashboard
npm install
npm run dev
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 4900 | Service port |
| PROPERTY_TWIN_URL | http://localhost:8448 | Property Twin Service |
| REVENUE_INTELLIGENCE_URL | http://localhost:4757 | Revenue Intelligence |
| ROOM_TWIN_URL | http://localhost:8447 | Room Twin Service |
| GUEST_TWIN_URL | http://localhost:8446 | Guest Twin Service |
| STAYBOT_URL | http://localhost:4840 | StayBot |
| RIDZA_URL | http://localhost:4100 | RIDZA Finance |
| UPSELL_URL | http://localhost:3813 | Upsell Engine |

---

## Story Coverage

| Chapter | Description | Status |
|---------|------------|--------|
| Ch 10 | Ahmed sees 92% occupancy | ✅ Working |
| Ch 10 | Revenue above target | ✅ Working |
| Ch 10 | 8% pricing recommendation = ₹18L | ✅ Working |
| Ch 18 | Owner's view | ✅ Working |

---

**Last Updated:** June 14, 2026
