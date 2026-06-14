# REZ Catalog Service - SPEC.md

**Version:** 1.0.0
**Port:** 4007
**Company:** RABTUL-Technologies
**Category:** Core

---

## Overview

Product catalog management service handling products, inventory, categories, and pricing. Provides centralized catalog data with full-text search and real-time inventory sync.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      REZ Catalog Service                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  Components:                                                                │
│  ├── Product Manager   → Product CRUD and variants                       │
│  ├── Inventory Tracker → Real-time stock levels                          │
│  ├── Category Engine  → Category hierarchy and taxonomy                   │
│  ├── Pricing Engine   → Dynamic pricing and rules                        │
│  └── Search Index     → Full-text search capabilities                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Models

### Product
```typescript
{
  productId: string
  name: string
  description: string
  category: string
  variants: ProductVariant[]
  pricing: { basePrice, salePrice, currency }
  inventory: { quantity, lowStockThreshold }
  images: string[]
  attributes: Record<string, any>
  status: 'active' | 'inactive' | 'draft'
  merchantId: string
}
```

### Category
```typescript
{
  categoryId: string
  name: string
  slug: string
  parentId?: string
  level: number
  path: string[]
  attributes: CategoryAttribute[]
}
```

---

## API Endpoints

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List products |
| POST | `/api/products` | Create product |
| GET | `/api/products/:id` | Get product |
| PUT | `/api/products/:id` | Update product |
| DELETE | `/api/products/:id` | Delete product |

### Inventory
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products/:id/inventory` | Get inventory |
| PUT | `/api/products/:id/inventory` | Update inventory |
| POST | `/api/inventory/sync` | Sync inventory |

### Categories
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | List categories |
| POST | `/api/categories` | Create category |
| GET | `/api/categories/:id` | Get category |
| PUT | `/api/categories/:id` | Update category |

### Search
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/search` | Search products |
| GET | `/api/search/suggestions` | Get suggestions |

---

## Dependencies

```json
{
  "express": "^4.21.2",
  "mongoose": "^8.23.1",
  "ioredis": "^5.3.0",
  "bullmq": "^5.0.0",
  "helmet": "^8.1.0",
  "winston": "^3.11.0",
  "zod": "^3.23.6"
}
```

---

## Integration Points

| Service | Direction | Purpose |
|---------|-----------|---------|
| REZ Search | Write | Search index sync |
| REZ Inventory | Read | Stock levels |
| REZ Intelligence | Read | Product recommendations |

---

## Status

- [x] Product CRUD
- [x] Inventory management
- [x] Category hierarchy
- [x] Pricing engine
- [x] Full-text search
- [x] Variant support
