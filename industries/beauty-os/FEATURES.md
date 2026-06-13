# Beauty OS - Features

**Status:** ✅ BUILT | **Port:** 5090 | **Updated:** June 14, 2026

---

## Digital Twins

### Client Twin
- Client profiles
- Service history
- Product preferences
- Allergy alerts
- Loyalty tracking
- Photo gallery

### Service Twin
- Service catalog
- Duration tracking
- Pricing management
- Category organization
- Combo offerings

### Staff Twin
- Stylist profiles
- Skills matrix
- Schedule management
- Performance metrics
- Availability tracking

### Inventory Twin
- Product stock
- Usage tracking
- Expiry alerts
- Supplier info
- Reorder levels

---

## AI Agents

### Booking Agent
- Appointment scheduling
- Staff matching
- Time optimization
- Waitlist management

### Consultation Agent
- Client needs assessment
- Service recommendations
- Product suggestions
- Before/after tracking

### ProductRec Agent
- Skin/hair analysis
- Product matching
- Routine building
- Ingredient awareness

### Reminder Agent
- Appointment reminders
- Follow-up messages
- Re-booking prompts
- Birthday wishes

### Satisfaction Agent
- Feedback collection
- Review management
- Issue resolution
- NPS tracking

---

## API Endpoints

### Core
- `GET /health` - Health check
- `GET /api/twins` - List all twins
- `GET /api/agents` - List all agents

### Clients
- `POST /api/clients` - Add client
- `GET /api/clients/:id` - Get client
- `GET /api/clients/:id/history` - Service history

### Services
- `GET /api/services` - List services
- `POST /api/services` - Add service
- `PUT /api/services/:id` - Update service

### Staff
- `GET /api/staff` - List staff
- `POST /api/staff` - Add staff
- `PUT /api/staff/:id/schedule` - Update schedule

### Bookings
- `POST /api/bookings` - Book appointment
- `GET /api/bookings/:id` - Get booking
- `PUT /api/bookings/:id` - Update booking

---

## Integrations

| Service | Integration Type | Purpose |
|---------|-----------------|---------|
| RTMN Hub | HTTP | Central orchestration |
| AgentOS | HTTP | Agent invocation |
| Retail OS | Event | Product sales |
| RABTUL | Payment | Transactions |

---

## Quick Start

```bash
cd industries/beauty-os
npm install
node src/index.js
# Runs on http://localhost:5090
```