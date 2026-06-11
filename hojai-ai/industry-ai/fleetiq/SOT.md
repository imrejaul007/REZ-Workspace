# FLEETIQ - State of Technology

**Version:** 1.0.0
**Date:** June 6, 2026
**Industry:** Logistics & Fleet Management
**Tagline:** "AI-Driven Fleet Intelligence"
**Status:** COMPLETE

---

## 1. PRODUCT OVERVIEW

FLEETIQ is an AI-powered operating system for logistics companies and fleet managers. It combines AI agents (workers), automated workers, voice agents, and a complete backend to manage fleet operations.

### Target Customers
- Standalone logistics companies (HOJAI AI clients)
- REZ ecosystem clients

### Pricing
- ₹4,999/month (HOJAI AI)
- Included in REZ-Merchant OS (REZ ecosystem)

---

## 2. AI EMPLOYEES (AGENTS)

AI Agents are specialized workers that interact with drivers and operations staff.

### 2.1 Dispatch Agent
- **Port:** 4814
- **Endpoint:** POST /api/ai/dispatch/optimize
- **Purpose:** Order allocation, routing
- **Interactions:** Order assignment, route allocation, capacity planning
- **Skills:**
  - Order prioritization
  - Vehicle assignment
  - Capacity optimization
  - Time slot matching

### 2.2 Route Optimizer Agent
- **Endpoint:** POST /api/ai/route/calculate
- **Purpose:** Route planning, optimization
- **Interactions:** Route planning, ETA updates, live tracking
- **Skills:**
  - Multi-stop optimization (Nearest Neighbor + 2-Opt)
  - Traffic avoidance
  - Fuel efficiency
  - Delivery scheduling

### 2.3 Fleet Manager Agent
- **Endpoint:** POST /api/ai/fleet/analyze
- **Purpose:** Fleet operations, maintenance
- **Interactions:** Vehicle status, maintenance scheduling, performance
- **Skills:**
  - Vehicle monitoring
  - Maintenance scheduling
  - Performance tracking
  - Cost analysis

### 2.4 Driver Coach Agent
- **Endpoint:** POST /api/ai/driver/coach
- **Purpose:** Driver support, navigation
- **Interactions:** Turn-by-turn guidance, delivery updates, alerts
- **Skills:**
  - Navigation assistance
  - Delivery confirmation
  - Issue reporting
  - Performance coaching

---

## 3. BACKEND MODELS

### 3.1 Vehicle Model
- registrationNumber (unique)
- type (truck, van, car, bike)
- capacity
- status (available, on-trip, maintenance, idle)
- fuelLevel
- location (geo coordinates)
- driverId (reference)
- mileage
- insuranceExpiry

### 3.2 Driver Model
- name
- phone
- licenseNumber (unique)
- status (available, on-trip, off-duty)
- rating (0-5)
- tripsCompleted
- totalDistance
- currentVehicleId

### 3.3 Trip Model
- vehicleId (reference)
- driverId (reference)
- origin (address + coordinates)
- destination (address + coordinates)
- status (pending, in-progress, completed, cancelled)
- distance
- estimatedTime
- estimatedCost
- urgency (low, medium, high, critical)

### 3.4 Maintenance Model
- vehicleId (reference)
- type (scheduled, repair, emergency)
- description
- cost
- date
- status (pending, in-progress, completed)
- parts (array)
- notes

---

## 4. API ENDPOINTS

### Health Endpoints
```
GET /health/live      # Liveness probe
GET /health/ready     # Readiness probe
GET /health           # Detailed health check
```

### AI Agent APIs
```
GET  /api/ai/status              # AI employee status
POST /api/ai/dispatch/optimize   # Optimize dispatch allocation
POST /api/ai/route/calculate     # Calculate optimal route
POST /api/ai/fleet/analyze       # Analyze fleet performance
POST /api/ai/driver/coach        # Coach driver based on situation
GET  /api/ai/driver/:id/insights # Get driver performance insights
GET  /api/ai/fleet/maintenance/predict # Predict maintenance needs
POST /api/ai/dispatch/suggest    # Suggest vehicle assignment
POST /api/ai/route/fuel-optimize # Optimize fuel consumption
```

### Vehicle APIs
```
GET    /api/vehicles              # List all vehicles
POST   /api/vehicles              # Create vehicle
GET    /api/vehicles/:id          # Get vehicle details
PUT    /api/vehicles/:id          # Update vehicle
PATCH  /api/vehicles/:id/location # Update location
PATCH  /api/vehicles/:id/status   # Update status
DELETE /api/vehicles/:id          # Delete vehicle
GET    /api/vehicles/stats/summary # Vehicle statistics
```

### Driver APIs
```
GET    /api/drivers               # List all drivers
POST   /api/drivers               # Create driver
GET    /api/drivers/:id           # Get driver details
PUT    /api/drivers/:id           # Update driver
PATCH  /api/drivers/:id/rating   # Update rating
PATCH  /api/drivers/:id/status   # Update status
DELETE /api/drivers/:id           # Delete driver
GET    /api/drivers/:id/performance # Driver performance
GET    /api/drivers/stats/summary  # Driver statistics
```

### Trip APIs
```
GET    /api/trips                 # List all trips
POST   /api/trips                 # Create trip
GET    /api/trips/:id             # Get trip details
PUT    /api/trips/:id             # Update trip
PATCH  /api/trips/:id/status      # Update status
DELETE /api/trips/:id             # Delete trip
GET    /api/trips/stats/summary   # Trip statistics
```

### Maintenance APIs
```
GET    /api/maintenance                # List maintenance records
POST   /api/maintenance               # Create maintenance record
GET    /api/maintenance/:id           # Get record details
PUT    /api/maintenance/:id           # Update record
PATCH  /api/maintenance/:id/status    # Update status
DELETE /api/maintenance/:id           # Delete record
GET    /api/maintenance/upcoming/schedule # Upcoming maintenance
GET    /api/maintenance/stats/costs   # Maintenance costs
```

### Analytics APIs
```
GET /api/analytics/dashboard     # Dashboard data
GET /api/analytics/vehicles      # Vehicle analytics
GET /api/analytics/drivers      # Driver analytics
GET /api/analytics/trips        # Trip analytics
GET /api/analytics/maintenance  # Maintenance analytics
GET /api/analytics/performance  # Overall performance
```

---

## 5. TECHNOLOGY STACK

| Layer | Technology |
|-------|------------|
| Runtime | Node.js / TypeScript |
| Framework | Express.js |
| Database | MongoDB with Mongoose |
| Authentication | JWT |
| Validation | Zod |
| Logging | Winston |
| Security | Helmet, CORS, Rate Limiting |
| Container | Docker |
| Orchestration | Kubernetes |

---

## 6. DEPLOYMENT

### Port
- **Main Service:** 4814

### Environment Variables
```bash
PORT=4814
MONGODB_URI=mongodb://localhost:27017/fleetiq
JWT_SECRET=fleetiq-dev-secret-change-in-production
INTERNAL_SERVICE_TOKEN=fleetiq-internal-dev-token
```

### Quick Start
```bash
npm install
npm run dev     # Development mode
npm run build   # Build for production
npm start       # Start production server
```

---

## 7. CURRENT STATUS (COMPLETE - June 6, 2026)

| Component | Status | Notes |
|-----------|--------|-------|
| Main Entry Point | ✅ Complete | src/index.ts |
| Configuration | ✅ Complete | src/config.ts |
| Express App | ✅ Complete | src/app.ts |
| Models | ✅ Complete | Vehicle, Driver, Trip, Maintenance |
| Routes | ✅ Complete | All API routes implemented |
| Services | ✅ Complete | Dispatch, Route, Fleet, Driver |
| Middleware | ✅ Complete | Auth, validation, error handling |
| Utils | ✅ Complete | Logger, database, config |
| Documentation | ✅ Complete | README, API.md, CLAUDE.md, SOT.md |
| Docker | ✅ Complete | Dockerfile, docker-compose.yml |

---

## 8. PRODUCTION FEATURES

- ✅ MongoDB with Mongoose ODM
- ✅ JWT Authentication with role-based access
- ✅ Rate limiting (express-rate-limit)
- ✅ Helmet security headers
- ✅ Winston structured logging
- ✅ Health checks (liveness, readiness, detailed)
- ✅ Zod validation for all inputs
- ✅ Graceful shutdown handling
- ✅ Comprehensive error handling
- ✅ Seed data for development
- ✅ Webhook triggers for events
- ✅ HOJAI sync integration

---

**Last Updated:** June 6, 2026
**Maintainer:** HOJAI AI Team
