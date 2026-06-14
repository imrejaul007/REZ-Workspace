# REZ Atlas Discover
**Port:** 5151 | **Type:** Merchant Discovery

---

## Overview

Map-first merchant discovery service. Searches and indexes businesses from:
- Google Places API
- Local database
- Custom integrations

---

## Quick Start

```bash
npm install
npm run dev
```

---

## Key Features

- **Text Search** - Search by business name, category
- **Geo Search** - Find merchants near coordinates
- **Category Filters** - Restaurant, Retail, Hotel, etc.
- **Sync** - Sync from Google Places

---

## API Endpoints

### Search
- `GET /api/search` - Search merchants
- `GET /api/nearby` - Find nearby merchants

### Categories
- `GET /api/categories` - List categories
- `GET /api/areas` - Area analysis

### Sync
- `POST /api/sync/google-places` - Sync from Google

### CRUD
- `GET /api/merchants` - List all
- `GET /api/merchants/:id` - Get one
- `POST /api/merchants` - Create
- `PUT /api/merchants/:id` - Update

### Stats
- `GET /api/stats` - Discovery stats

---

## Environment Variables

```env
PORT=5151
MONGODB_URI=mongodb://localhost:27017/rez-atlas-discover
GOOGLE_MAPS_API_KEY=your_key
GOOGLE_PLACES_API_KEY=your_key
```

---

## Data Model

```typescript
interface DiscoveredMerchant {
  businessId: string
  name: string
  category: string
  location: {
    address: string
    lat: number
    lng: number
  }
  contact: {
    phone?: string
    email?: string
    website?: string
  }
  rating?: {
    overall: number
    count: number
  }
  sources: string[]
  discoveredAt: Date
  enriched: boolean
}
```