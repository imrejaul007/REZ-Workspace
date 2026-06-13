# Hotel OS - Hotel Property Management Platform

**Status:** ✅ BUILT - June 14, 2026  
**Port:** 5025  
**Location:** `industries/hotel-os/`

## Overview

Hotel OS is a TypeScript-based microservice platform for hotel property management, featuring specialized twin services for guests, rooms, and properties with real-time synchronization.

## Architecture - TypeScript Microservices

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      Hotel OS - Microservices Architecture                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Main Hotel OS (Port 5025) - Orchestration Layer                           │
│                                        │                                     │
│   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │
│   │  Guest Twin     │  │   Room Twin     │  │  Property Twin  │         │
│   │  Service       │  │   Service       │  │  Service        │         │
│   │  Port: 8447    │  │   Port: 8444    │  │  Port: 8448     │         │
│   └─────────────────┘  └─────────────────┘  └─────────────────┘         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Microservices

| Service | Port | Description |
|---------|------|-------------|
| **Guest Twin Service** | 8447 | Guest management, profiles, preferences |
| **Room Twin Service** | 8444 | Room inventory, status, pricing |
| **Property Twin Service** | 8448 | Property operations, facilities |
| **Main Hotel OS** | 5025 | Orchestration, API gateway |

## Digital Twins

| Twin | Description | Capabilities |
|------|-------------|--------------|
| **Guest Twin** | Guest profiles, history | Preferences, loyalty, stay patterns |
| **Room Twin** | Room inventory, status | Availability, housekeeping status |
| **Property Twin** | Property operations | Facilities, amenities, events |
| **Booking Twin** | Reservation management | Confirmation, modifications |

## AI Agents

| Agent | Purpose |
|-------|---------|
| **Concierge Agent** | Guest assistance, local recommendations |
| **Housekeeping Agent** | Room readiness, scheduling |
| **Upsell Agent** | Room upgrades, amenities |
| **Revenue Agent** | Dynamic pricing, forecasting |
| **GuestFeedback Agent** | Review collection, sentiment |
| **StaffScheduling Agent** | Staff rostering, shifts |

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /health` | - | Health check |
| `GET /api/twins` | GET | List all twins |
| `GET /api/twins/guest/:id` | GET | Get guest twin |
| `GET /api/twins/room/:id` | GET | Get room twin |
| `GET /api/twins/property/:id` | GET | Get property twin |
| `GET /api/agents` | GET | List all agents |
| `POST /api/guests` | POST | Register guest |
| `GET /api/guests/:id` | GET | Get guest details |
| `POST /api/rooms` | POST | Add room |
| `GET /api/rooms/:id` | GET | Get room details |
| `POST /api/bookings` | POST | Create booking |
| `GET /api/bookings/:id` | GET | Get booking |

## Microservice Endpoints

### Guest Twin Service (Port 8447)
| Endpoint | Description |
|----------|-------------|
| `GET /health` | Service health |
| `GET /guests` | List all guests |
| `GET /guests/:id` | Get guest by ID |
| `POST /guests` | Create guest profile |
| `PUT /guests/:id` | Update guest profile |
| `GET /guests/:id/preferences` | Get guest preferences |
| `PUT /guests/:id/preferences` | Update preferences |

### Room Twin Service (Port 8444)
| Endpoint | Description |
|----------|-------------|
| `GET /health` | Service health |
| `GET /rooms` | List all rooms |
| `GET /rooms/:id` | Get room by ID |
| `POST /rooms` | Add room |
| `PUT /rooms/:id` | Update room |
| `GET /rooms/:id/status` | Get room status |
| `PUT /rooms/:id/status` | Update status |

### Property Twin Service (Port 8448)
| Endpoint | Description |
|----------|-------------|
| `GET /health` | Service health |
| `GET /property` | Get property info |
| `GET /facilities` | List facilities |
| `GET /amenities` | List amenities |
| `GET /events` | Get property events |
| `POST /events` | Create event |

## Quick Start

```bash
# Install all services
cd industries/hotel-os && npm install

# Start main Hotel OS
node src/index.js  # Port 5025

# Start microservices (in separate terminals)
node src/services/guest-twin/index.js   # Port 8447
node src/services/room-twin/index.js   # Port 8444
node src/services/property-twin/index.js # Port 8448

# Health check
curl http://localhost:5025/health

# Get all twins
curl http://localhost:5025/api/twins

# Register guest
curl -X POST http://localhost:5025/api/guests \
  -H "Content-Type: application/json" \
  -d '{"name": "John Smith", "email": "john@email.com", "preferences": {"roomType": "deluxe"}}'
```

## File Structure

```
industries/hotel-os/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts                  # Main entry (Port 5025)
│   ├── services/
│   │   ├── guest-twin/         # Guest Twin Service (Port 8447)
│   │   │   ├── index.ts
│   │   │   └── types.ts
│   │   ├── room-twin/          # Room Twin Service (Port 8444)
│   │   │   ├── index.ts
│   │   │   └── types.ts
│   │   └── property-twin/      # Property Twin Service (Port 8448)
│   │       ├── index.ts
│   │       └── types.ts
│   └── routes/
│       ├── twins.ts
│       ├── agents.ts
│       └── api.ts
└── tests/
    └── *.test.ts               # Unit tests
```

## Integration

- Connected to RTMN Hub at `http://localhost:8000`
- Hotel Agent available via AgentOS
- Hospitality OS for guest services
- Revenue analytics integrate with BOA
- Payment via RABTUL
