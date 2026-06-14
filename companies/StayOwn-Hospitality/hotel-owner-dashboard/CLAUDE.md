# CLAUDE.md - Hotel Owner Dashboard

## Project Overview

**Name:** Hotel Owner Dashboard
**Company:** StayOwn-Hospitality
**Type:** Intelligence Dashboard
**Port:** 4900
**Status:** ✅ Built (June 14, 2026)

## Description

Provides Ahmed's intelligence view of Pentouz Hotel operations. Aggregates data from multiple services to provide actionable insights.

## Tech Stack

- Node.js 18+
- Express.js
- TypeScript
- Axios (HTTP client)

## Connected Services

| Service | Port | Data Provided |
|---------|------|---------------|
| Property Twin | 8448 | Occupancy, ADR, RevPAR |
| Revenue Intelligence | 4757 | Revenue metrics, forecasts |
| Room Twin | 8447 | Room status, availability |
| Guest Twin | 8446 | Guest analytics, loyalty |
| StayBot | 4840 | AI Concierge insights |
| RIDZA | 4100 | Financial analytics |
| Upsell Engine | 3813 | Upsell performance |

## Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies |
| `npm run dev` | Development server (port 4900) |
| `npm run build` | Build for production |
| `npm start` | Production server |

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| PORT | No | 4900 | Service port |
| PROPERTY_TWIN_URL | No | http://localhost:8448 | Property Twin Service |
| REVENUE_INTELLIGENCE_URL | No | http://localhost:4757 | Revenue Intelligence |
| ROOM_TWIN_URL | No | http://localhost:8447 | Room Twin Service |
| GUEST_TWIN_URL | No | http://localhost:8446 | Guest Twin Service |
| STAYBOT_URL | No | http://localhost:4840 | StayBot |
| RIDZA_URL | No | http://localhost:4100 | RIDZA Finance |

## API Endpoints

### Main Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/dashboard/overview` | Main dashboard (Ahmed's view) |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/occupancy` | Occupancy analytics |
| GET | `/api/dashboard/revenue` | Revenue analytics |
| GET | `/api/dashboard/forecast` | Revenue forecast |
| GET | `/api/dashboard/operational` | Operations metrics |

### Recommendations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/pricing-recommendation` | AI pricing suggestions |
| GET | `/api/dashboard/conference-demand` | Meeting hall analytics |
| GET | `/api/dashboard/food-revenue` | F&B revenue |

## Key Metrics

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Occupancy Rate | 92% | 85% | ✅ Above |
| ADR | ₹4,500 | ₹4,200 | ✅ Above |
| RevPAR | ₹4,140 | ₹3,570 | ✅ Above |
| Revenue (Month) | ₹128L | ₹120L | ✅ +6.7% |
| Food Revenue Growth | +14% | +10% | ✅ Above |

## AI Recommendations

| Recommendation | Expected Gain | Confidence |
|---------------|---------------|------------|
| Increase premium pricing 8% | ₹18 Lakhs/month | 87% |
| Weekend packages | ₹5 Lakhs/month | 82% |
| 5th meeting hall | ₹12 Lakhs/quarter | 78% |
| Rooftop expansion 20% | ₹8 Lakhs/quarter | 75% |

## File Structure

```
hotel-owner-dashboard/
├── src/
│   └── index.ts           # Main server with dashboard endpoints
├── package.json
├── tsconfig.json
├── README.md
└── CLAUDE.md
```

## Story Coverage

| Chapter | Description | Status |
|---------|------------|--------|
| Ch 10 | Ahmed sees 92% occupancy | ✅ Working |
| Ch 10 | Revenue above target | ✅ Working |
| Ch 10 | 8% pricing recommendation = ₹18L | ✅ Working |
| Ch 18 | Owner's view | ✅ Working |

---

**Last Updated:** June 14, 2026
