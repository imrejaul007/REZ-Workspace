# REZ Atlas Twin
**Port:** 5153 | **Type:** Merchant Digital Twin Engine

---

## Overview

Merchant Digital Twin Engine. Creates comprehensive digital profiles of merchants with 5 twin components:

1. **Identity Twin** - Basic business info
2. **Presence Twin** - Digital presence
3. **Reputation Twin** - Reviews and ratings
4. **Operations Twin** - Business operations
5. **Growth Signals Twin** - Growth indicators

---

## Quick Start

```bash
npm install
npm run dev
```

---

## Key Features

- **Complete Profiles** - All merchant data unified
- **Twin Scoring** - Aggregate scores per component
- **Dashboard** - Pre-built analytics
- **Performance Tracking** - Grade and trend analysis

---

## API Endpoints

### Merchant Twins
- `GET /api/merchants/:id` - Get complete twin
- `POST /api/merchants/:id/twin` - Create/update twin
- `GET /api/merchants/search` - Search twins

### Twin Components
- `GET /api/merchants/:id/identity` - Identity
- `GET /api/merchants/:id/presence` - Presence
- `GET /api/merchants/:id/reputation` - Reputation
- `GET /api/merchants/:id/operations` - Operations
- `GET /api/merchants/:id/growth` - Growth signals

### Dashboard
- `GET /api/dashboard/acquisition` - Acquisition metrics
- `GET /api/dashboard/health` - Merchant health
- `GET /api/merchants/:id/dashboard` - Merchant dashboard
- `GET /api/merchants/:id/kpi-trends` - KPI trends
- `GET /api/merchants/:id/compare` - Compare merchants

### Performance
- `GET /api/merchants/:id/performance` - Get score
- `GET /api/merchants/stats` - Overall stats

---

## Twin Score Structure

```typescript
interface TwinScore {
  overall: number      // 0-100
  identity: number    // 0-100
  presence: number    // 0-100
  reputation: number  // 0-100
  operations: number // 0-100
  growth: number      // 0-100
}

// Grade calculation
if (overall >= 90) grade = 'A+'
else if (overall >= 80) grade = 'A'
else if (overall >= 70) grade = 'B+'
else if (overall >= 60) grade = 'B'
else if (overall >= 50) grade = 'C'
else if (overall >= 30) grade = 'D'
else grade = 'F'
```

---

## Environment Variables

```env
PORT=5153
MONGODB_URI=mongodb://localhost:27017/rez-atlas-twin
```