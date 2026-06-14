# REZ Retail Service

Core Retail Service for the REZ Merchant Platform - handles Products, Categories, and Inventory Management.

## Overview

This service provides the foundational retail operations including:
- Product management (SKU, variants, pricing, images)
- Category management (hierarchical tree structure)
- Inventory tracking with stock movements
- Low stock alerts and reordering

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose
- **Cache**: Redis
- **Validation**: Zod

## API Endpoints

### Products

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List products with filters |
| GET | `/api/products/featured` | Get featured products |
| GET | `/api/products/:id` | Get product by ID |
| GET | `/api/products/sku/:sku` | Get product by SKU |
| POST | `/api/products` | Create new product |
| PUT | `/api/products/:id` | Update product |
| DELETE | `/api/products/:id` | Soft delete product |
| POST | `/api/products/:id/variants` | Add product variant |
| PUT | `/api/products/:id/variants/:variantId` | Update variant |
| DELETE | `/api/products/:id/variants/:variantId` | Delete variant |
| PUT | `/api/products/:id/inventory` | Update product inventory |

### Categories

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | List categories (tree or flat) |
| GET | `/api/categories/:id` | Get category by ID |
| GET | `/api/categories/slug/:slug` | Get category by slug |
| GET | `/api/categories/:id/descendants` | Get category descendants |
| POST | `/api/categories` | Create category |
| PUT | `/api/categories/:id` | Update category |
| DELETE | `/api/categories/:id` | Soft delete category |
| PUT | `/api/categories/:id/reorder` | Reorder category |

### Inventory

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/inventory` | List inventory |
| GET | `/api/inventory/product/:productId` | Get by product ID |
| GET | `/api/inventory/sku/:sku` | Get by SKU |
| GET | `/api/inventory/reports/low-stock` | Get low stock items |
| GET | `/api/inventory/reports/out-of-stock` | Get out of stock items |
| GET | `/api/inventory/reports/value` | Get stock value report |
| POST | `/api/inventory/adjust` | Adjust stock |
| POST | `/api/inventory/reserve` | Reserve stock |
| POST | `/api/inventory/release` | Release reserved stock |
| GET | `/api/inventory/:productId/movements` | Get stock movements |

## Query Parameters

### Products
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)
- `search` - Full-text search
- `categoryId` - Filter by category
- `minPrice` - Minimum price
- `maxPrice` - Maximum price
- `tags` - Comma-separated tags
- `isActive` - Filter by active status
- `isFeatured` - Filter featured products
- `inStock` - Filter in-stock items

### Categories
- `tree` - Return as tree structure (true/false)
- `active` - Filter active only (default: true)

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file:

```env
PORT=4100
MONGODB_URI=mongodb://localhost:27017/rez-retail
REDIS_URL=redis://localhost:6379
LOG_LEVEL=info
NODE_ENV=development
```

## Running

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## Health Check

```
GET http://localhost:4100/health
```

## Integrations

- **RABTUL-Technologies**: Auth, Wallet, Payment
- **REZ-Intelligence**: Recommendations, Analytics
