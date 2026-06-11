# FLEETIQ API Documentation

**Version:** 1.0.0
**Base URL:** `http://localhost:4814`
**Port:** 4814

---

## Authentication

All API endpoints (except health checks) require JWT authentication.

### Headers

| Header | Value | Required |
|--------|-------|----------|
| `Authorization` | `Bearer <your-jwt-token>` | Yes (for user requests) |
| `X-Internal-Token` | `<your-internal-service-token>` | Yes (for service-to-service) |
| `Content-Type` | `application/json` | Yes (for POST/PUT/PATCH) |

---

## Health Endpoints

### GET /health/live
Liveness probe - checks if service is running.

**Response:**
```json
{
  "status": "alive",
  "service": "FLEETIQ",
  "timestamp": "2026-06-06T10:00:00.000Z",
  "uptime": 3600
}
```

### GET /health/ready
Readiness probe - checks if service is ready to accept requests.

**Response:**
```json
{
  "status": "ready",
  "checks": { "mongodb": "connected" },
  "timestamp": "2026-06-06T10:00:00.000Z"
}
```

### GET /health
Detailed health check with service statistics.

**Response:**
```json
{
  "status": "healthy",
  "service": "FLEETIQ",
  "version": "1.0.0",
  "port": 4814,
  "environment": "development",
  "timestamp": "2026-06-06T10:00:00.000Z",
  "uptime": 3600,
  "mongodb": {
    "status": "connected",
    "host": "localhost",
    "name": "fleetiq"
  },
  "resources": {
    "memory": { "heapUsed": 50, "heapTotal": 100, "rss": 120 },
    "cpu": { "user": 1000, "system": 500 }
  },
  "aiEmployees": [
    { "name": "Dispatch Agent", "status": "active" },
    { "name": "Route Agent", "status": "active" },
    { "name": "Fleet Manager", "status": "active" },
    { "name": "Driver Coach", "status": "active" }
  ],
  "stats": {
    "vehicles": 10,
    "drivers": 15,
    "trips": 100,
    "maintenance": 5
  }
}
```

---

## AI Agents

### GET /api/ai/status
Get AI employee status.

**Response:**
```json
{
  "success": true,
  "status": {
    "active": true,
    "version": "1.0.0",
    "uptime": 3600,
    "employees": [
      {
        "name": "Dispatch Agent",
        "status": "active",
        "capabilities": ["vehicle_allocation", "order_prioritization"],
        "lastTask": null
      }
    ]
  }
}
```

### POST /api/ai/dispatch/optimize
Optimize dispatch allocation for a delivery.

**Request:**
```json
{
  "origin": { "lat": 19.076, "lng": 72.877, "address": "Mumbai" },
  "destination": { "lat": 18.520, "lng": 73.856, "address": "Pune" },
  "cargoWeight": 5000,
  "urgency": "high",
  "preferences": {
    "prioritizeSpeed": true,
    "prioritizeCost": false,
    "avoidHighways": false
  }
}
```

**Response:**
```json
{
  "success": true,
  "recommendation": {
    "success": true,
    "allocation": {
      "vehicle": { "registrationNumber": "MH12AB1234", "type": "truck" },
      "driver": { "name": "Ramesh Kumar", "rating": 4.8 },
      "estimatedCost": { "total": 2500 },
      "estimatedTime": 180,
      "optimizationScore": 85
    }
  },
  "metadata": {
    "agent": "Dispatch Agent",
    "duration": "45ms",
    "timestamp": "2026-06-06T10:00:00.000Z"
  }
}
```

### POST /api/ai/route/calculate
Calculate optimal route for multiple stops.

**Request:**
```json
{
  "stops": [
    { "lat": 19.076, "lng": 72.877, "address": "Mumbai" },
    { "lat": 18.520, "lng": 73.856, "address": "Pune" },
    { "lat": 17.659, "lng": 75.906, "address": "Solapur" }
  ],
  "optimize": true,
  "preferences": {
    "avoidTolls": false,
    "avoidHighways": false,
    "fastestRoute": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "route": {
    "success": true,
    "route": {
      "stops": [...],
      "totalDistance": 450.5,
      "totalDuration": 540,
      "segments": [...],
      "waypoints": [...]
    },
    "metrics": {
      "originalDistance": 500,
      "optimizedDistance": 450.5,
      "optimizationGain": 10
    }
  }
}
```

### POST /api/ai/fleet/analyze
Analyze fleet performance and generate recommendations.

**Request:**
```json
{
  "metrics": ["utilization", "fuel", "maintenance", "performance"],
  "period": "week"
}
```

**Response:**
```json
{
  "success": true,
  "analysis": {
    "success": true,
    "metrics": {
      "totalVehicles": 10,
      "availableVehicles": 5,
      "averageFuelLevel": 65
    },
    "alerts": [
      {
        "vehicleId": "123",
        "registrationNumber": "MH12AB1234",
        "type": "warning",
        "message": "Low fuel level: 25%",
        "action": "Refuel before next trip",
        "priority": 2
      }
    ],
    "recommendations": ["Consider establishing a proactive refueling schedule"]
  }
}
```

### POST /api/ai/driver/coach
Provide coaching and assistance to a driver.

**Request:**
```json
{
  "driverId": "507f1f77bcf86cd799439011",
  "situation": "fuel_management",
  "context": {
    "fuelLevel": 30,
    "location": { "lat": 19.076, "lng": 72.877 }
  }
}
```

**Response:**
```json
{
  "success": true,
  "coaching": {
    "success": true,
    "response": {
      "situation": "fuel_management",
      "message": "Low fuel warning - plan to refuel soon",
      "guidance": ["Plan to refuel at next convenient station"],
      "resources": [...]
    }
  }
}
```

---

## Vehicles

### GET /api/vehicles
List all vehicles with pagination.

**Query Parameters:**
- `status` - Filter by status (available, on-trip, maintenance, idle)
- `type` - Filter by type (truck, van, car, bike)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "vehicles": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "pages": 3
  }
}
```

### GET /api/vehicles/:id
Get vehicle details.

### POST /api/vehicles
Create a new vehicle.

**Request:**
```json
{
  "registrationNumber": "MH12AB1234",
  "type": "truck",
  "capacity": 5000,
  "fuelLevel": 85,
  "location": { "lat": 19.076, "lng": 72.877, "address": "Mumbai" }
}
```

### PATCH /api/vehicles/:id/location
Update vehicle location.

**Request:**
```json
{
  "lat": 19.076,
  "lng": 72.877,
  "address": "Mumbai, Maharashtra"
}
```

### PATCH /api/vehicles/:id/status
Update vehicle status.

**Request:**
```json
{
  "status": "on-trip"
}
```

### DELETE /api/vehicles/:id
Delete a vehicle.

### GET /api/vehicles/stats/summary
Get vehicle statistics summary.

---

## Drivers

### GET /api/drivers
List all drivers.

**Query Parameters:**
- `status` - Filter by status (available, on-trip, off-duty)
- `minRating` - Minimum rating filter

### GET /api/drivers/:id
Get driver details.

### POST /api/drivers
Create a new driver.

**Request:**
```json
{
  "name": "Ramesh Kumar",
  "phone": "+919876543210",
  "licenseNumber": "DL-2024001234"
}
```

### PATCH /api/drivers/:id/rating
Update driver rating.

**Request:**
```json
{
  "rating": 4.8,
  "tripId": "507f1f77bcf86cd799439012"
}
```

### PATCH /api/drivers/:id/status
Update driver status.

**Request:**
```json
{
  "status": "available"
}
```

### GET /api/drivers/:id/performance
Get driver performance metrics.

### DELETE /api/drivers/:id
Delete a driver.

### GET /api/drivers/stats/summary
Get driver statistics summary.

---

## Trips

### GET /api/trips
List all trips with pagination.

**Query Parameters:**
- `status` - Filter by status (pending, in-progress, completed, cancelled)
- `driverId` - Filter by driver
- `vehicleId` - Filter by vehicle
- `page` - Page number
- `limit` - Items per page

### GET /api/trips/:id
Get trip details.

### POST /api/trips
Create a new trip.

**Request:**
```json
{
  "vehicleId": "507f1f77bcf86cd799439011",
  "driverId": "507f1f77bcf86cd799439012",
  "origin": { "address": "Mumbai", "lat": 19.076, "lng": 72.877 },
  "destination": { "address": "Pune", "lat": 18.520, "lng": 73.856 },
  "cargoWeight": 5000,
  "urgency": "high"
}
```

### PATCH /api/trips/:id/status
Update trip status.

**Request:**
```json
{
  "status": "in-progress"
}
```

**Status Values:**
- `pending` - Trip created, not started
- `in-progress` - Trip started
- `completed` - Trip finished
- `cancelled` - Trip cancelled

### DELETE /api/trips/:id
Delete a trip.

### GET /api/trips/stats/summary
Get trip statistics summary.

---

## Maintenance

### GET /api/maintenance
List all maintenance records.

**Query Parameters:**
- `status` - Filter by status
- `type` - Filter by type (scheduled, repair, emergency)
- `vehicleId` - Filter by vehicle

### GET /api/maintenance/:id
Get maintenance record details.

### POST /api/maintenance
Create a maintenance record.

**Request:**
```json
{
  "vehicleId": "507f1f77bcf86cd799439011",
  "type": "scheduled",
  "description": "Oil change and filter replacement",
  "cost": 2500,
  "date": "2026-06-15T10:00:00.000Z"
}
```

### PATCH /api/maintenance/:id/status
Update maintenance status.

**Request:**
```json
{
  "status": "completed",
  "notes": "Completed successfully",
  "cost": 2500
}
```

### DELETE /api/maintenance/:id
Delete a maintenance record.

### GET /api/maintenance/upcoming/schedule
Get upcoming maintenance schedule.

### GET /api/maintenance/stats/costs
Get maintenance cost statistics.

---

## Analytics

### GET /api/analytics/dashboard
Get dashboard data summary.

**Response:**
```json
{
  "success": true,
  "summary": {
    "vehicles": { "totalVehicles": 10, "availableVehicles": 5 },
    "trips": { "active": 3, "completed": 50, "total": 100 },
    "drivers": { "available": 8, "onTrip": 5, "total": 15, "averageRating": 4.5 },
    "maintenance": { "pending": 2, "inProgress": 1, "completed": 10 }
  }
}
```

### GET /api/analytics/vehicles
Get vehicle analytics.

**Query Parameters:**
- `period` - day, week, month, quarter

### GET /api/analytics/drivers
Get driver analytics.

### GET /api/analytics/trips
Get trip analytics.

### GET /api/analytics/maintenance
Get maintenance analytics.

### GET /api/analytics/performance
Get overall performance metrics.

---

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": [
    { "field": "fieldName", "message": "Error description" }
  ],
  "timestamp": "2026-06-06T10:00:00.000Z"
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request / Validation Error |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 429 | Rate Limit Exceeded |
| 500 | Internal Server Error |
| 503 | Service Unavailable |

---

## Rate Limiting

| Endpoint Type | Limit |
|--------------|-------|
| Standard API | 100 requests / 15 minutes |
| Auth Endpoints | 10 requests / minute |
| AI Endpoints | 60 requests / minute |

---

## Example Usage

### cURL

```bash
# Get health
curl http://localhost:4814/health

# Get AI status
curl -H "Authorization: Bearer <token>" http://localhost:4814/api/ai/status

# Create vehicle
curl -X POST http://localhost:4814/api/vehicles \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"registrationNumber":"MH12AB1234","type":"truck","capacity":5000}'

# Optimize dispatch
curl -X POST http://localhost:4814/api/ai/dispatch/optimize \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"origin":{"lat":19.076,"lng":72.877},"destination":{"lat":18.520,"lng":73.856}}'
```

### JavaScript

```javascript
const API_BASE = 'http://localhost:4814';

async function createVehicle(data) {
  const response = await fetch(`${API_BASE}/api/vehicles`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer <token>',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  return response.json();
}
```

---

**Last Updated:** June 6, 2026
