# REZ Search Service - SPEC.md

**Version:** 1.0.0
**Port:** 4008
**Company:** RABTUL-Technologies
**Category:** Core

---

## Overview

Full-text search and discovery service for stores and products. Provides store search, product search, homepage discovery, recommendations, and autocomplete functionality.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       REZ Search Service                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  Components:                                                                │
│  ├── Store Search    → Location-based, category search                    │
│  ├── Product Search  → Full-text product search                          │
│  ├── Discovery       → Homepage feed and recommendations                  │
│  ├── Autocomplete    → Real-time search suggestions                      │
│  └── Relevance Engine → Ranking and scoring                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Models

### SearchResult
```typescript
{
  type: 'store' | 'product'
  id: string
  name: string
  score: number
  highlights: string[]
  metadata: Record<string, any>
}
```

### Store
```typescript
{
  storeId: string
  name: string
  description: string
  category: string
  location: { lat: number, lng: number }
  address: string
  rating: number
  image: string
  isOpen: boolean
}
```

### Product
```typescript
{
  productId: string
  name: string
  description: string
  price: number
  images: string[]
  category: string
  storeId: string
  inStock: boolean
  rating: number
}
```

---

## API Endpoints

### Search
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/search/stores` | Search stores |
| GET | `/api/search/products` | Search products |
| GET | `/api/search/all` | Combined search |
| GET | `/api/search/suggestions` | Autocomplete |

### Discovery
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/discover/homepage` | Homepage feed |
| GET | `/api/discover/trending` | Trending items |
| GET | `/api/discover/nearby` | Nearby stores |
| GET | `/api/discover/recommended` | Personalized recommendations |

### Filters
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | List categories |
| GET | `/api/filters/options` | Filter options |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |

---

## Dependencies

```json
{
  "express": "^4.21.2",
  "mongoose": "^8.23.1",
  "ioredis": "^5.3.0",
  "helmet": "^7.1.0",
  "cors": "^2.8.5",
  "winston": "^3.11.0",
  "zod": "^3.23.6",
  "jsonwebtoken": "^9.0.3",
  "@sentry/node": "^7.120.4"
}
```

---

## Integration Points

| Service | Direction | Purpose |
|---------|-----------|---------|
| REZ Catalog | Read | Product data |
| REZ Intent Graph | Read | Recommendations |
| REZ Location Intel | Read | Geo queries |

---

## Status

- [x] Store search
- [x] Product search
- [x] Autocomplete
- [x] Homepage discovery
- [x] Trending items
- [x] Nearby stores
- [x] Recommendations
- [x] Category filters
