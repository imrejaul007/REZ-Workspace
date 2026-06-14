# Atlas Workforce Scheduler

**Port:** 5220 | **Company:** REZ-Merchant | **Version:** 1.0.0

## Overview

AI-powered scheduling and route optimization for field sales teams. Automatically generates optimal schedules and routes based on territory, priority, and employee skills.

## Features

- **Intelligent Scheduling** - Auto-generate daily/weekly schedules
- **Route Optimization** - Optimize visits for minimum travel time
- **Territory Planning** - Assign territories based on coverage
- **Priority Management** - Prioritize high-value merchants

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/schedules` | List schedules (filter by date, employee) |
| POST | `/api/schedules/generate` | Generate new schedule |
| GET | `/api/routes` | Get optimized routes |
| POST | `/api/routes/optimize` | Optimize route |

## Quick Start

```bash
cd atlas-workforce-scheduler
npm install
npm run dev
```

## Health Check

```bash
curl http://localhost:5220/health
```

## Example Request

```bash
# Generate schedule
curl -X POST http://localhost:5220/api/schedules/generate \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2026-06-15",
    "territoryId": "territory-south",
    "employees": ["emp-1", "emp-2", "emp-3"]
  }'

# Optimize route
curl -X POST http://localhost:5220/api/routes/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "stops": [
      {"lat": 28.61, "lng": 77.20, "priority": 1},
      {"lat": 28.62, "lng": 77.21, "priority": 2}
    ],
    "mode": "driving"
  }'
```

## Schedule Response

```json
{
  "id": "schedule-123",
  "date": "2026-06-15",
  "territoryId": "territory-south",
  "routes": [
    {
      "employeeId": "emp-1",
      "stops": 8,
      "estimatedTime": "9:30",
      "priority": "balanced"
    }
  ]
}
```

## Optimization Algorithm

- **TSP-based** - Traveling Salesman Problem solver
- **Priority weighted** - High-value merchants first
- **Time windows** - Respect merchant availability
- **Skill matching** - Match employee skills to merchant type

## Ecosystem Integration

- **atlas-workforce-core** - Get employee skills and availability
- **atlas-workforce-analytics** - Track schedule adherence
- **REZ Atlas Maps** - Geospatial optimization

## Related Services

- [atlas-workforce-core](../atlas-workforce-core) - Employee management
- [atlas-workforce-analytics](../atlas-workforce-analytics) - Performance tracking
