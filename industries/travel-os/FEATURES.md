# Travel OS - Features

**Status:** ✅ BUILT | **Port:** 5190 | **Updated:** June 14, 2026

---

## Digital Twins

### Destination Twin
- Location details
- Attractions catalog
- Local guides
- Review aggregation
- Weather patterns

### Package Twin
- Package components
- Pricing tiers
- Availability calendar
- Supplier linkage
- Duration options

### Booking Twin
- Reservation tracking
- Itinerary management
- Amendment handling
- Cancellation tracking
- Travel documents

### Traveler Twin
- Preferences profile
- Travel history
- Document storage
- Loyalty tier
- Contact info

---

## AI Agents

### TripPlanner Agent
- Itinerary building
- Route optimization
- Time allocation
- Budget fitting
- Surprise insertion

### Booking Agent
- Multi-supplier search
- Price comparison
- Booking confirmation
- Change management
- Group coordination

### Concierge Agent
- In-trip assistance
- Restaurant reservations
- Activity booking
- Emergency support
- Local recommendations

### ExpenseTrack Agent
- Receipt capture
- Category allocation
- Policy compliance
- Report generation
- Reimbursement processing

### TravelPolicy Agent
- Policy enforcement
- Approval routing
- Exception handling
- Travel advisory
- Carbon tracking

---

## API Endpoints

### Core
- `GET /health` - Health check
- `GET /api/twins` - List all twins
- `GET /api/agents` - List all agents

### Destinations
- `GET /api/destinations` - List destinations
- `GET /api/destinations/:id` - Get destination

### Packages
- `GET /api/packages` - List packages
- `GET /api/packages/:id` - Get package
- `GET /api/packages/search` - Search packages

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings/:id` - Get booking
- `PUT /api/bookings/:id` - Modify booking

---

## Integrations

| Service | Integration Type | Purpose |
|---------|-----------------|---------|
| RTMN Hub | HTTP | Central orchestration |
| AgentOS | HTTP | Agent invocation |
| Hospitality OS | Event | Accommodation |
| Transport OS | Event | Transportation |

---

## Quick Start

```bash
cd industries/travel-os
npm install
node src/index.js
# Runs on http://localhost:5190
```