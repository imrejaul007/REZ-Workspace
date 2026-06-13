# Hotel OS - Features

**Status:** ✅ BUILT | **Port:** 5025 | **TypeScript Microservices** | **Updated:** June 14, 2026

---

## Architecture - TypeScript Microservices

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      Hotel OS Microservices                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Main Hotel OS (Port 5025) - Orchestration                                  │
│                                        │                                     │
│   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │
│   │  Guest Twin     │  │   Room Twin     │  │  Property Twin  │         │
│   │  Service 8447  │  │   Service 8444  │  │  Service 8448  │         │
│   └─────────────────┘  └─────────────────┘  └─────────────────┘         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Microservices

### Guest Twin Service (Port 8447)
- Guest profile management
- Preference storage
- Stay history
- Loyalty tracking
- Communication preferences

### Room Twin Service (Port 8444)
- Room inventory
- Real-time status
- Housekeeping state
- Feature catalog
- Pricing management

### Property Twin Service (Port 8448)
- Property information
- Facilities catalog
- Amenities list
- Event management
- Operational data

---

## Digital Twins

### Guest Twin
- Comprehensive profiles
- Preference recall (room type, amenities, dietary)
- Stay patterns
- Loyalty tier tracking
- Spending analytics
- Feedback history

### Room Twin
- Real-time availability
- Housekeeping status (clean, dirty, inspection, out-of-order)
- Features and amenities
- Pricing tiers
- Maintenance history

### Property Twin
- Multi-property support
- Facilities management
- Event spaces
- Common areas
- Staff management

### Booking Twin
- Reservation lifecycle
- Channel management (direct, OTA)
- Confirmation handling
- Modification tracking
- Cancellation processing

---

## AI Agents

### Concierge Agent
- Guest assistance
- Local recommendations
- Restaurant reservations
- Transportation booking
- Activity planning

### Housekeeping Agent
- Room readiness tracking
- Staff scheduling
- Task assignment
- Quality inspection
- Inventory management

### Upsell Agent
- Room upgrades
- Early check-in
- Late check-out
- Package offers
- Loyalty promotions

### Revenue Agent
- Dynamic pricing
- Demand forecasting
- Channel optimization
- Promotion strategy
- Competitive analysis

### GuestFeedback Agent
- Review collection
- Sentiment analysis
- Issue escalation
- Response management
- NPS tracking

### StaffScheduling Agent
- Shift planning
- Labor optimization
- Skill matching
- Overtime management
- Compliance tracking

---

## API Endpoints

### Main Service (Port 5025)
- `GET /health` - Health check
- `GET /api/twins` - List all twins
- `GET /api/agents` - List all agents
- `POST /api/guests` - Register guest
- `GET /api/guests/:id` - Get guest
- `POST /api/rooms` - Add room
- `GET /api/rooms/:id` - Get room
- `POST /api/bookings` - Create booking
- `GET /api/bookings/:id` - Get booking

### Guest Twin Service (Port 8447)
- `GET /guests` - List guests
- `GET /guests/:id` - Get guest
- `POST /guests` - Create guest
- `PUT /guests/:id` - Update guest
- `GET /guests/:id/preferences` - Get preferences
- `PUT /guests/:id/preferences` - Update preferences

### Room Twin Service (Port 8444)
- `GET /rooms` - List rooms
- `GET /rooms/:id` - Get room
- `POST /rooms` - Add room
- `PUT /rooms/:id` - Update room
- `GET /rooms/:id/status` - Get status
- `PUT /rooms/:id/status` - Update status

### Property Twin Service (Port 8448)
- `GET /property` - Get property info
- `GET /facilities` - List facilities
- `GET /amenities` - List amenities
- `GET /events` - Get events
- `POST /events` - Create event

---

## Integrations

| Service | Integration Type | Purpose |
|---------|-----------------|---------|
| RTMN Hub | HTTP | Central orchestration |
| AgentOS | HTTP | Agent invocation |
| Hospitality OS | Event | Guest services |
| RABTUL | Payment | Transactions |
| BOA | Event | Revenue analytics |

---

## Quick Start

```bash
cd industries/hotel-os
npm install

# Start main service
node src/index.js  # Port 5025

# Start microservices (separate terminals)
node src/services/guest-twin/index.js   # Port 8447
node src/services/room-twin/index.js   # Port 8444
node src/services/property-twin/index.js # Port 8448
```

---

## File Structure

```
industries/hotel-os/
├── src/
│   ├── index.ts                    # Main (Port 5025)
│   ├── services/
│   │   ├── guest-twin/
│   │   │   ├── index.ts          # Port 8447
│   │   │   └── types.ts
│   │   ├── room-twin/
│   │   │   ├── index.ts          # Port 8444
│   │   │   └── types.ts
│   │   └── property-twin/
│   │       ├── index.ts          # Port 8448
│   │       └── types.ts
│   └── routes/
│       ├── twins.ts
│       ├── agents.ts
│       └── api.ts
└── tests/
```
