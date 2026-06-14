# REZ Atlas Graph
**Port:** 5173 | **Type:** Merchant Network Graph

---

## Overview

Merchant relationship network graph:
- Merchant ↔ Merchant (competitors)
- Merchant ↔ Supplier
- Merchant ↔ Customer
- Merchant ↔ Brand

---

## Quick Start

```bash
npm install
npm run dev
```

---

## API Endpoints

### Graph
- `GET /api/merchant/:id` - Get merchant graph
- `GET /api/relationships` - List relationships
- `POST /api/connect` - Create relationship

---

## Data Model

```typescript
interface Node {
  id: string
  type: 'merchant' | 'customer' | 'supplier' | 'competitor' | 'brand'
  name: string
  properties: Record<string, any>
}

interface Edge {
  id: string
  source: string
  target: string
  type: 'competitor' | 'supplier' | 'customer' | 'partner'
  weight: number
  properties: Record<string, any>
}
```

---

## Environment Variables

```env
PORT=5173
```