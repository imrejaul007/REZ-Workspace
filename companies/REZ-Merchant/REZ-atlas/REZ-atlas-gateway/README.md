# REZ Atlas Gateway
**Port:** 5150 | **Type:** Central API Gateway

---

## Overview

The REZ Atlas Gateway is the central API entry point that orchestrates all Atlas services. It provides a unified interface for:

- Unified search across all services
- Merchant data aggregation
- Dashboard analytics
- Service health monitoring

---

## Quick Start

```bash
npm install
npm run dev
```

---

## Endpoints

### Health
- `GET /health` - Service health
- `GET /ready` - All services readiness

### Search
- `GET /api/search` - Unified search

### Merchants
- `GET /api/merchants` - List merchants
- `GET /api/merchants/:id` - Get merchant

### Dashboard
- `GET /api/dashboard/summary` - Overall metrics
- `GET /api/dashboard/acquisition` - Acquisition funnels
- `GET /api/dashboard/territory` - Territory analytics
- `GET /api/dashboard/opportunities` - Opportunity metrics

### Proxied Services
All requests are proxied to:
- Discover (5151)
- Maps (5152)
- Twin (5153)
- Score (5154)
- Signals (5155)
- Territory (5170)
- Routes (5171)
- Copilot (5172)
- Graph (5173)

---

## Environment Variables

```env
PORT=5150
ATLAS_DISCOVER_URL=http://localhost:5151
ATLAS_MAPS_URL=http://localhost:5152
ATLAS_TWIN_URL=http://localhost:5153
ATLAS_SCORE_URL=http://localhost:5154
ATLAS_SIGNALS_URL=http://localhost:5155
ATLAS_TERRITORY_URL=http://localhost:5170
ATLAS_ROUTES_URL=http://localhost:5171
ATLAS_COPILOT_URL=http://localhost:5172
ATLAS_GRAPH_URL=http://localhost:5173
```