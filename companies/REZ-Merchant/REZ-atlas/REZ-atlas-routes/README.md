# REZ Atlas Routes
**Port:** 5171 | **Type:** Field Sales Route Optimization

---

## Overview

Route optimization for field sales teams:
- Plan daily visits
- Optimize route order
- Track visit status
- Traffic-aware routing

---

## Quick Start

```bash
npm install
npm run dev
```

---

## API Endpoints

### Routes
- `GET /api/routes` - List routes
- `POST /api/routes` - Create route
- `GET /api/routes/:id` - Get route
- `PUT /api/routes/:id/stops/:stopId` - Update stop

### Optimization
- `POST /api/routes/optimize` - Optimize route

---

## Data Model

```typescript
interface Route {
  id: string
  name: string
  userId: string
  territoryId: string
  date: string
  stops: Stop[]
  totalDistance: number
  totalDuration: number
}

interface Stop {
  id: string
  merchantId: string
  name: string
  address: string
  lat: number
  lng: number
  priority: 1 | 2 | 3  // 1=High, 2=Medium, 3=Normal
  estimatedTime: number  // minutes
  status: 'pending' | 'visited' | 'skipped'
}
```

---

## Optimization

Uses nearest-neighbor algorithm:
1. Sort by priority
2. Calculate distances
3. Reorder for minimum travel

---

## Environment Variables

```env
PORT=5171
```