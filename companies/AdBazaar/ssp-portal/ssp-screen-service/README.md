# SSP Screen Service

**Port:** 4521 | **Company:** AdBazaar | **Category:** DOOH Supply Side Platform

## Purpose

Manages DOOH (Digital Out of Home) screen inventory including screen registration, location metadata, display specifications, and screen health monitoring.

## Key API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/screens` | List all screens |
| GET | `/api/screens/:id` | Get screen details |
| POST | `/api/screens` | Register new screen |
| PATCH | `/api/screens/:id` | Update screen info |
| GET | `/api/screens/:id/status` | Get screen health |
| PATCH | `/api/screens/:id/availability` | Update availability |
| GET | `/api/screens/location/:locationId` | Screens by location |

## Environment Variables

```env
PORT=4521
MONGODB_URI=mongodb://localhost:27017/ssp_screens
NODE_ENV=development
LOG_LEVEL=info
CORS_ORIGIN=*
```

## Start the Service

```bash
cd AdBazaar/ssp-portal/ssp-screen-service
npm run dev
```

## Health Checks

```bash
curl http://localhost:4521/health     # Service health
curl http://localhost:4521/ready # Readiness check
```

## Ecosystem Connections

| Service | Connection | Purpose |
|---------|------------|---------|
| **ssp-gateway** | Port 4520 | API gateway routing |
| **ssp-inventory-service** | Port 4522 | Ad slot availability |
| **ssp-bidding-service** | Port 4523 | Real-time bidding |
| **AdBazaar DOOH** | AdBazaar | Screen network |

## Screen Types

| Type | Description |
|------|-------------|
| `digital_billboard` | Large format LED billboards |
| `poster` | Static/digital posters |
| `kiosk` | Interactive kiosks |
| `transit` | Transport displays |
| `elevator` | Elevator screens |

## Database

- MongoDB collection: `screens`
- Indexes on: `locationId`, `status`, `screenType`, `availability`