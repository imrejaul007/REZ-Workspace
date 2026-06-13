# HomeServices OS - Features

**Status:** ✅ BUILT | **Port:** 5140 | **Updated:** June 14, 2026

---

## Digital Twins

### Provider Twin
- Service skills
- Certification tracking
- Availability windows
- Service area mapping
- Rating history

### Customer Twin
- Address book
- Property details
- Service history
- Preference notes
- Payment info

### Booking Twin
- Job scheduling
- Time windows
- Technician assignment
- Route optimization
- Status tracking

### Service Twin
- Service catalog
- Pricing structure
- Duration estimates
- Material lists
- Warranty info

---

## AI Agents

### Dispatcher Agent
- Job assignment
- Route optimization
- Technician matching
- Slot allocation

### QuoteGen Agent
- Price estimation
- Site survey integration
- Competitive pricing
- Quote comparison

### Scheduling Agent
- Appointment booking
- Technician routing
- Buffer time management
- Rescheduling handling

### CustomerRet Agent
- Service reminders
- Maintenance tips
- Re-booking prompts
- Feedback collection

### InventoryMgmt Agent
- Parts tracking
- Van stock management
- Supplier coordination
- Usage analytics

---

## API Endpoints

### Core
- `GET /health` - Health check
- `GET /api/twins` - List all twins
- `GET /api/agents` - List all agents

### Providers
- `GET /api/providers` - List providers
- `GET /api/providers/:id` - Get provider
- `PUT /api/providers/:id/availability` - Update availability

### Customers
- `POST /api/customers` - Add customer
- `GET /api/customers/:id` - Get customer
- `GET /api/customers/:id/jobs` - Job history

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings/:id` - Get booking
- `PUT /api/bookings/:id` - Update booking

### Quotes
- `POST /api/quotes` - Generate quote
- `GET /api/quotes/:id` - Get quote
- `POST /api/quotes/:id/accept` - Accept quote

---

## Integrations

| Service | Integration Type | Purpose |
|---------|-----------------|---------|
| RTMN Hub | HTTP | Central orchestration |
| AgentOS | HTTP | Agent invocation |
| Transport OS | Event | Route/maps |
| RABTUL | Payment | Transactions |

---

## Quick Start

```bash
cd industries/homeservices-os
npm install
node src/index.js
# Runs on http://localhost:5140
```