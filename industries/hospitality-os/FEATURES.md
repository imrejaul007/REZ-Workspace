# Hospitality OS - Features

**Status:** ✅ BUILT | **Port:** 5040 | **Updated:** June 14, 2026

---

## Digital Twins

### Guest Twin
- Guest profiles and preferences
- Stay history and patterns
- Loyalty tier tracking
- Preference recall
- Contact history
- Feedback history

### Room Twin
- Room inventory management
- Real-time status (available, occupied, maintenance)
- Housekeeping status
- Feature catalog
- Pricing tiers

### Booking Twin
- Reservation lifecycle
- Confirmation management
- Modification handling
- Cancellation tracking
- Waitlist management

### Revenue Twin
- ADR (Average Daily Rate) tracking
- RevPAR analytics
- Forecasting
- Competitive analysis
- Rate shopping

### Service Twin
- Room service orders
- Concierge requests
- Amenity delivery
- Spa bookings
- Activity reservations

---

## AI Agents

### Concierge Agent
- Local recommendations
- Restaurant reservations
- Transportation booking
- Event information
- Personalized suggestions

### Booking Agent
- Reservation handling
- Availability search
- Rate quotes
- Confirmation emails

### Upsell Agent
- Room upgrades
- Late checkout offers
- Package deals
- Loyalty promotions

### Housekeeping Agent
- Room readiness tracking
- Staff scheduling
- Task assignment
- Quality checks

### Revenue Agent
- Dynamic pricing
- Demand forecasting
- Inventory control
- Competitive monitoring

### Feedback Agent
- Review solicitation
- Sentiment analysis
- Issue escalation
- Response management

---

## API Endpoints

### Core
- `GET /health` - Health check
- `GET /api/twins` - List all twins
- `GET /api/agents` - List all agents

### Guests
- `POST /api/guests` - Register guest
- `GET /api/guests/:id` - Get guest
- `PUT /api/guests/:id` - Update guest
- `GET /api/guests/:id/preferences` - Preferences
- `GET /api/guests/:id/history` - Stay history

### Rooms
- `GET /api/rooms` - List rooms
- `POST /api/rooms` - Add room
- `GET /api/rooms/:id` - Get room
- `PUT /api/rooms/:id` - Update room
- `GET /api/rooms/available` - Available rooms

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings/:id` - Get booking
- `PUT /api/bookings/:id` - Modify booking
- `POST /api/bookings/:id/cancel` - Cancel
- `GET /api/bookings/guest/:guestId` - Guest bookings

### Revenue
- `GET /api/revenue/daily` - Daily revenue
- `GET /api/revenue/forecast` - Revenue forecast
- `GET /api/revenue/occupancy` - Occupancy stats

---

## Integrations

| Service | Integration Type | Purpose |
|---------|-----------------|---------|
| RTMN Hub | HTTP | Central orchestration |
| AgentOS | HTTP | Agent invocation |
| Hotel OS | Event | Property management |
| Restaurant OS | Event | Dining |
| RABTUL | Payment | Transactions |

---

## Quick Start

```bash
cd industries/hospitality-os
npm install
node src/index.js
# Runs on http://localhost:5040
```
