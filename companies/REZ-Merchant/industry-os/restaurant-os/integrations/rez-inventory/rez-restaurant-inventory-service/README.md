# rez-restaurant-inventory-service

**Port:** 4056

Restaurant inventory management for tracking ingredients, stock levels, and suppliers.

## Features

- Ingredient management
- Stock tracking and alerts
- Supplier management
- Purchase orders
- Low stock warnings
- Expiry tracking

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/items` | List inventory items |
| POST | `/api/items` | Add item |
| GET | `/api/items/:id` | Get item |
| PUT | `/api/items/:id` | Update item |
| DELETE | `/api/items/:id` | Delete item |
| POST | `/api/stock` | Adjust stock |
| GET | `/api/alerts` | Get alerts |
| POST | `/api/suppliers` | Add supplier |
| GET | `/api/suppliers` | List suppliers |

## Inventory Categories

- Vegetables
- Fruits
- Dairy
- Meat
- Grains
- Spices
- Beverages
- Packaging

## Quick Start

```bash
npm install
npm run dev
npm test
```
