# REZ-Mart Store Service

**Port:** 4103 | **Company:** REZ-Consumer | **Category:** Quick Commerce Store Management

## Purpose

Manages REZ-Mart store operations including store profiles, inventory levels, operating hours, and store-specific configurations.

## Key API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stores` | List all stores |
| GET | `/api/stores/:id` | Get store details |
| POST | `/api/stores` | Create new store |
| PATCH | `/api/stores/:id` | Update store info |
| GET | `/api/stores/:id/inventory` | Store inventory summary |
| PATCH | `/api/stores/:id/status` | Toggle store open/closed |

## Environment Variables

```env
PORT=4103
MONGODB_URI=mongodb://localhost:27017/rezmart_stores
NODE_ENV=development
LOG_LEVEL=info
CORS_ORIGIN=*
```

## Start the Service

```bash
cd REZ-Consumer/REZ-Mart/rez-mart-store-service
npm run dev
```

## Health Checks

```bash
curl http://localhost:4103/health     # Detailed health check
curl http://localhost:4103/ready     # Readiness check
```

## Ecosystem Connections

| Service | Connection | Purpose |
|---------|------------|---------|
| **rez-mart-gateway** | Port 4100 | API gateway routing |
| **rez-mart-inventory-service** | Port 4107 | Stock management |
| **rez-mart-order-service** | Port 4104 | Order processing |
| **REZ-Merchant** | REZ-Merchant | Store configuration sync |

## Database

- MongoDB collection: `rezmart_stores`
- Indexes on: `location`, `status`, `pincode`