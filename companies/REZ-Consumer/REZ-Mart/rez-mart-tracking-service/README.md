# REZ-Mart Tracking Service

**Port:** 4102 | **Company:** REZ-Consumer | **Category:** Quick Commerce Real-time Tracking

## Purpose

Provides real-time order tracking for REZ-Mart deliveries including driver location, ETA updates, and delivery status.

## Key API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tracking/:orderId` | Get order tracking info |
| GET | `/api/tracking/:orderId/driver` | Get driver location |
| POST | `/api/tracking` | Create tracking session |
| PATCH | `/api/tracking/:orderId/status` | Update delivery status |
| GET | `/api/tracking/:orderId/eta` | Get estimated arrival |

## Environment Variables

```env
PORT=4102
MONGODB_URI=mongodb://localhost:27017/rezmart_tracking
NODE_ENV=development
```

## Start the Service

```bash
cd REZ-Consumer/REZ-Mart/rez-mart-tracking-service
npm run dev
```

## Health Checks

```bash
curl http://localhost:4102/health     # Service health
curl http://localhost:4102/ready     # Readiness check
```

## Ecosystem Connections

| Service | Connection | Purpose |
|---------|------------|---------|
| **rez-mart-gateway** | Port 4100 | API gateway routing |
| **rez-mart-delivery-service** | Port 4106 | Delivery status updates |
| **rez-mart-driver-service** | Port 4101 | Driver location |
| **REZ-Consumer App** | REZ-Consumer | Customer tracking UI |

## Features

- Real-time GPS tracking
- ETA calculations
- Delivery milestone notifications
- Historical tracking data