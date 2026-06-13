# Hospitality OS - Guest Services Platform

**Status:** ✅ BUILT - June 14, 2026  
**Port:** 5040  
**Location:** `industries/hospitality-os/`

## Overview

Hospitality OS provides a comprehensive guest services platform for hotels, resorts, and hospitality businesses, connecting guests, rooms, bookings, and services with AI-powered experiences.

## Digital Twins

| Twin | Description | Capabilities |
|------|-------------|--------------|
| **Guest Twin** | Guest profiles, preferences | Personalization, loyalty |
| **Room Twin** | Room inventory, status | Availability, pricing |
| **Booking Twin** | Reservations, history | Confirmation, modifications |
| **Revenue Twin** | Financial analytics | Forecasting, ADR, RevPAR |
| **Service Twin** | Amenities, requests | Room service, concierge |

## AI Agents

| Agent | Purpose |
|-------|---------|
| **Concierge Agent** | Guest assistance, recommendations |
| **Booking Agent** | Reservation management |
| **Upsell Agent** | Room upgrades, add-ons |
| **Housekeeping Agent** | Room readiness, scheduling |
| **Revenue Agent** | Dynamic pricing optimization |
| **Feedback Agent** | Review collection, sentiment |

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /health` | - | Health check |
| `GET /api/twins` | GET | List all twins |
| `GET /api/twins/guest/:id` | GET | Get guest twin |
| `GET /api/twins/room/:id` | GET | Get room twin |
| `GET /api/twins/booking/:id` | GET | Get booking twin |
| `GET /api/agents` | GET | List all agents |
| `POST /api/guests` | POST | Register guest |
| `GET /api/guests/:id` | GET | Get guest |
| `POST /api/rooms` | POST | Add room |
| `GET /api/rooms/:id` | GET | Get room |
| `POST /api/bookings` | POST | Create booking |

## Quick Start

```bash
cd industries/hospitality-os && npm install && node src/index.js

# Health check
curl http://localhost:5040/health

# Register guest
curl -X POST http://localhost:5040/api/guests \
  -H "Content-Type: application/json" \
  -d '{"name": "Jane Smith", "email": "jane@email.com", "preferences": {"roomType": "king"}}'

# Create booking
curl -X POST http://localhost:5040/api/bookings \
  -H "Content-Type: application/json" \
  -d '{"guestId": "guest_123", "roomId": "room_456", "checkIn": "2026-06-20", "checkOut": "2026-06-23"}'
```

## Integration

- Connected to RTMN Hub at `http://localhost:8000`
- Hospitality Agent available via AgentOS
- Shares data with Hotel OS for properties
- Revenue analytics integrate with BOA
