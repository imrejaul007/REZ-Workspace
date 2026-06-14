# REZ-Mart Driver Service

**Port:** 4101 | **Company:** REZ-Consumer | **Category:** Quick Commerce Delivery Fleet

## Purpose

Manages the REZ-Mart delivery driver fleet including driver profiles, availability, ratings, and delivery assignments.

## Key API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/drivers` | List all drivers |
| GET | `/api/drivers/:id` | Get driver by ID |
| POST | `/api/drivers` | Register new driver |
| PATCH | `/api/drivers/:id` | Update driver profile |
| GET | `/api/drivers/:id/earnings` | Get driver earnings |
| POST | `/api/drivers/:id/availability` | Set availability |

## Environment Variables

```env
PORT=4101
MONGODB_URI=mongodb://localhost:27017/rezmart_drivers
NODE_ENV=development
LOG_LEVEL=info
```

## Start the Service

```bash
cd REZ-Consumer/REZ-Mart/rez-mart-driver-service
npm run dev
```

## Health Checks

```bash
curl http://localhost:4101/health     # Service health
curl http://localhost:4101/ready     # Readiness check
```

## Ecosystem Connections

| Service | Connection | Purpose |
|---------|------------|---------|
| **rez-mart-gateway** | Port 4100 | API gateway routing |
| **rez-mart-delivery-service** | Port 4106 | Delivery assignment |
| **REZ-Consumer Auth** | RABTUL | Driver authentication |
| **RABTUL Wallet** | RABTUL | Earnings disbursement |

## Database

- MongoDB collection: `rezmart_drivers`
- Indexes on: `userId`, `status`, `location`