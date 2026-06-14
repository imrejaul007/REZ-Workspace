# REZ-Mart Delivery Service

**Port:** 4106 | **Company:** REZ-Consumer | **Category:** Quick Commerce Logistics

## Purpose

Orchestrates the delivery pipeline for REZ-Mart including order assignment, driver matching, route optimization, and delivery confirmation.

## Key API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/deliveries` | Create new delivery |
| GET | `/api/deliveries/:id` | Get delivery details |
| PATCH | `/api/deliveries/:id/status` | Update delivery status |
| POST | `/api/deliveries/:id/assign` | Assign driver to delivery |
| GET | `/api/deliveries/active` | List active deliveries |
| POST | `/api/deliveries/:id/complete` | Mark delivery complete |

## Environment Variables

```env
PORT=4106
MONGODB_URI=mongodb://localhost:27017/rezmart_deliveries
NODE_ENV=development
CORS_ORIGIN=*
LOG_LEVEL=info
```

## Start the Service

```bash
cd REZ-Consumer/REZ-Mart/rez-mart-delivery-service
npm run dev
```

## Health Checks

```bash
curl http://localhost:4106/health     # Service health
curl http://localhost:4106/ready     # Readiness check
```

## Ecosystem Connections

| Service | Connection | Purpose |
|---------|------------|---------|
| **rez-mart-gateway** | Port 4100 | API gateway routing |
| **rez-mart-driver-service** | Port 4101 | Driver availability |
| **rez-mart-tracking-service** | Port 4102 | Real-time tracking |
| **rez-mart-store-service** | Port 4103 | Store pickup coordination |
| **KHAIRMOVE** | KHAIRMOVE | Delivery logistics |

## Delivery Status Flow

```
Pending → Assigned → Picked Up → In Transit → Delivered
                ↓           ↓
            Cancelled    Failed (Retry)
```

## Database

- MongoDB collection: `rezmart_deliveries`
- Indexes on: `orderId`, `driverId`, `status`, `createdAt`