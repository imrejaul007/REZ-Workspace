# REZ Atlas Territory
**Port:** 5170 | **Type:** Sales Territory Management

---

## Overview

Sales territory management for organizing and balancing sales regions:
- Create territories by geography
- Assign merchants to territories
- Track territory performance
- Balance workload across teams

---

## Quick Start

```bash
npm install
npm run dev
```

---

## API Endpoints

### Territories
- `GET /api/territories` - List territories
- `POST /api/territories` - Create territory
- `GET /api/territories/:id` - Get territory
- `PUT /api/territories/:id` - Update territory
- `DELETE /api/territories/:id` - Delete territory

### Assignments
- `POST /api/territories/:id/assign` - Assign merchant
- `DELETE /api/territories/:id/merchants/:merchantId` - Remove merchant
- `GET /api/territories/:id/merchants` - List merchants

### Performance
- `GET /api/territories/:id/performance` - Territory performance
- `GET /api/territories/balance` - Balance report
- `GET /api/territories/stats` - Overall stats

---

## Data Model

```typescript
interface Territory {
  id: string
  name: string
  description?: string
  ownerId?: string
  bounds?: {
    north: number
    south: number
    east: number
    west: number
  }
  regions?: Array<{
    name: string
    cities: string[]
  }>
  stats: {
    merchants: number
    leads: number
    revenue: number
    conversion: number
  }
  status: 'active' | 'inactive'
}
```

---

## Performance Metrics

| Metric | Calculation |
|--------|-------------|
| Revenue per Merchant | revenue / merchants |
| Lead Conversion Rate | (merchants / leads) * 100 |
| Avg Revenue per Lead | revenue / leads |

---

## Balance Rules

Territory is balanced if deviation < 20%:
- Merchants deviation < 20%
- Revenue deviation < 20%

---

## Environment Variables

```env
PORT=5170
```