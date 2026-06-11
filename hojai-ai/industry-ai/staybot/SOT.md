# STAYBOT - State of Technology

**Version:** 1.0.0
**Date:** June 3, 2026
**Industry:** Hotel
**Tagline:** "AI That Makes Guests Stay Longer"

---

## 1. PRODUCT OVERVIEW

STAYBOT is an AI-powered operating system for hotels, resorts, and hospitality establishments. It combines AI agents (workers), automated workers, voice agents, and a complete backend to manage hotel operations.

### Target Customers
- Standalone hotels and resorts (HOJAI AI clients)
- REZ ecosystem hotel clients

### Pricing
- ₹4,999/month (HOJAI AI)
- Included in REZ-Merchant OS (REZ ecosystem)

---

## 2. AI EMPLOYEES (AGENTS)

AI Agents are specialized workers that interact with guests and staff.

### 2.1 Front Desk AI
- **Purpose:** Check-in/out, guest services
- **Interactions:** Check-in, check-out, guest queries, complaints
- **Skills:**
  - Digital check-in
  - Room allocation
  - Complaint resolution
  - Service coordination

### 2.2 Concierge AI
- **Purpose:** Recommendations, bookings
- **Interactions:** Restaurant bookings, activity suggestions, transport
- **Skills:**
  - Local recommendations
  - Restaurant bookings
  - Transport arrangements
  - Event information

### 2.3 Revenue Manager AI
- **Purpose:** Pricing, occupancy optimization
- **Interactions:** Rate management, forecasting, competitor analysis
- **Skills:**
  - Dynamic pricing
  - Occupancy forecasting
  - Market analysis
  - Rate optimization

### 2.4 Bellhop AI
- **Purpose:** Room service, requests
- **Interactions:** Room service orders, amenity requests, housekeeping
- **Skills:**
  - Order management
  - Delivery tracking
  - Request routing
  - Guest preferences

---

## 3. AI WORKERS (AUTOMATED TASKS)

AI Workers run automated background processes.

### 3.1 Housekeeping Worker
- **Purpose:** Room cleaning, maintenance
- **Tasks:**
  - Room status tracking
  - Cleaning schedules
  - Maintenance requests
  - Inspections

### 3.2 Valet Worker
- **Purpose:** Parking management
- **Tasks:**
  - Parking allocation
  - Vehicle tracking
  - Service scheduling
  - Security logging

### 3.3 Billing Worker
- **Purpose:** Invoice generation, payments
- **Tasks:**
  - Folio management
  - Invoice generation
  - Payment processing
  - Dispute resolution

### 3.4 Report Worker
- **Purpose:** Daily/weekly/monthly reports
- **Tasks:**
  - Revenue reports
  - Occupancy reports
  - Guest satisfaction
  - Staff performance

---

## 4. VOICE AGENTS

### 4.1 Phone Receptionist
- **Capabilities:**
  - Answer calls 24/7
  - Room service orders
  - Guest assistance
  - Extension routing
- **Languages:** Hindi, English, Tamil, Telugu, Bengali, Marathi, Gujarati

### 4.2 WhatsApp AI
- **Capabilities:**
  - Text/voice conversations
  - Pre-arrival messages
  - Room service orders
  - Concierge requests

### 4.3 IVR System
- **Capabilities:**
  - Auto-attendant
  - Room service IVR
  - Wake-up calls
  - Extension routing

---

## 5. BACKEND SERVICES

### 5.1 PMS Service (`/services/pms-service/`)
- Property management
- Reservations
- Room management
- Guest profiles

### 5.2 Channel Manager (`/services/channel-manager/`)
- OTA connections
- Rate distribution
- Inventory sync
- Booking management

### 5.3 Housekeeping Service (`/services/housekeeping-service/`)
- Room status
- Task management
- Staff scheduling
- Quality checks

### 5.4 Billing Service (`/services/billing-service/`)
- Folio management
- Invoice generation
- Payment processing
- Checkout

---

## 6. INTEGRATION POINTS

### 6.1 HOJAI Core
- Intent Graph
- Memory System
- Trust Engine
- Agent Marketplace

### 6.2 Merchant OS
- POS integration
- Payment processing
- Customer database
- Reporting

### 6.3 REZ Merchant OS (for REZ clients)
- Full ecosystem sync
- Cross-product insights
- Unified reporting

### 6.4 OTA Integrations
- Booking.com
- MakeMyTrip
- Goibibo
- Yatra

---

## 7. API ENDPOINTS

### AI Agent APIs
```
POST /api/ai/frontdesk/checkin
POST /api/ai/frontdesk/checkout
POST /api/ai/concierge/recommendations
POST /api/ai/revenue/optimize
POST /api/ai/roomservice/order
```

### Worker APIs
```
POST /api/workers/housekeeping/request
POST /api/workers/valet/park
GET  /api/workers/billing/folio/:guestId
GET  /api/workers/reports/daily
```

### Service APIs
```
GET  /api/services/reservations/:id
POST /api/services/reservations
GET  /api/services/rooms/availability
POST /api/services/housekeeping/task
GET  /api/services/billing/folio
```

### Voice Agent APIs
```
POST /api/voice/call/incoming
POST /api/voice/whatsapp/webhook
GET  /api/voice/ivr/:flowId
```

---

## 8. TECHNOLOGY STACK

| Layer | Technology |
|-------|------------|
| Runtime | Node.js / TypeScript |
| Framework | Express.js |
| Database | PostgreSQL (Merchant OS) |
| Cache | Redis |
| AI/ML | HOJAI Core / OpenAI |
| Voice | Twilio / Exotel |
| Storage | S3 / Local |
| Monitoring | Prometheus / Grafana |
| Container | Docker |
| Orchestration | Kubernetes |

---

## 9. DEPLOYMENT

### Ports
- **Main Service:** 4101
- **Voice Agents:** 4850-4860

### Environment Variables
```bash
PORT=4101
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
HOJAI_CORE_URL=http://localhost:4100
MERCHANT_OS_URL=http://localhost:4000
VOICE_PROVIDER=twilio
```

### Health Checks
```bash
GET /health      # Service health
GET /ai/status   # AI employee status
```

---

## 10. CURRENT STATUS

| Component | Status | Notes |
|-----------|--------|-------|
| Front Desk AI | ✅ Implemented | Full implementation in src/index.ts |
| Concierge AI | ✅ Implemented | In src/index.ts |
| Revenue Manager AI | ✅ Implemented | In src/index.ts |
| Bellhop AI | ✅ Implemented | Room service in src/index.ts |
| Housekeeping Worker | ✅ Implemented | In src/index.ts |
| Valet Worker | ⏳ Pending | Needs implementation |
| Billing Worker | ⏳ Pending | Needs implementation |
| Report Worker | ⏳ Pending | Needs implementation |
| Phone Receptionist | ⏳ Pending | Needs voice agent setup |
| WhatsApp AI | ⏳ Pending | Needs WhatsApp integration |
| IVR System | ⏳ Pending | Needs IVR flow builder |
| PMS Service | ⏳ Pending | Needs service folder |
| Channel Manager | ⏳ Pending | Needs service folder |
| Housekeeping Service | ⏳ Pending | Needs service folder |
| Billing Service | ⏳ Pending | Needs service folder |

---

## 11. MISSING ITEMS (TODO)

1. **Voice agent implementations** - Phone, WhatsApp, IVR
2. **Worker implementations** - Valet, Billing, Report
3. **Service implementations** - PMS, Channel Manager, Housekeeping, Billing
4. **CLAUDE.md** - Developer documentation
5. **README.md** - Needs creation
6. **Dockerfile** - Container configuration
7. **Dockerfile** - Container configuration
8. **services/** folders - Need proper structure

---

**Last Updated:** June 3, 2026
**Maintainer:** HOJAI AI Team
