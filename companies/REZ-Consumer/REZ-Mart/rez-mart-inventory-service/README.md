# REZ-Mart Inventory Service

**Port:** 4107 | **Company:** REZ-Consumer | **Category:** Quick Commerce Stock Management

## Purpose

Manages real-time inventory for REZ-Mart quick commerce including stock levels, product availability, low-stock alerts, and replenishment triggers.

## Key API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/inventory` | List all inventory items |
| GET | `/api/inventory/:id` | Get item details |
| POST | `/api/inventory` | Add inventory item |
| PATCH | `/api/inventory/:id` | Update stock level |
| GET | `/api/inventory/store/:storeId` | Store inventory |
| POST | `/api/inventory/:id/adjust` | Stock adjustment |
| GET | `/api/inventory/low-stock` | Low stock alerts |

## Environment Variables

```env
PORT=4107
MONGODB_URI=mongodb://localhost:27017/rezmart_inventory
NODE_ENV=development
LOG_LEVEL=info
```

## Start the Service

```bash
cd REZ-Consumer/REZ-Mart/rez-mart-inventory-service
npm run dev
```

## Health Checks

```bash
curl http://localhost:4107/health     # Service health
curl http://localhost:4107/ready       # DB ping check
```

## Ecosystem Connections

| Service | Connection | Purpose |
|---------|------------|---------|
| **rez-mart-gateway** | Port 4100 | API gateway routing |
| **rez-mart-store-service** | Port 4103 | Store stock sync |
| **rez-mart-order-service** | Port 4104 | Order fulfillment |
| **rez-mart-analytics-service** | Port 4112 | Stock analytics |
| **HOJAI AI** | HOJAI | Inventory predictions |

## Features

- Real-time stock updates
- Low-stock threshold alerts
- Batch inventory operations
- Multi-store inventory sync
- Automatic reorder triggers

## Database

- MongoDB collection: `inventory_items`
- Indexes on: `productId`, `storeId`, `sku`, `stockLevel`