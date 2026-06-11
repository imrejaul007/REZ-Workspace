# WAITRON - State of Technology

**Version:** 1.0.0
**Date:** June 3, 2026
**Industry:** Restaurant
**Tagline:** "AI That Serves Better"

---

## 1. PRODUCT OVERVIEW

WAITRON is an AI-powered operating system for restaurants, cafes, and food service establishments. It combines AI agents (workers), automated workers, voice agents, and a complete backend to manage restaurant operations.

### Target Customers
- Standalone restaurants (HOJAI AI clients)
- REZ ecosystem restaurant clients

### Pricing
- ₹4,999/month (HOJAI AI)
- Included in REZ-Merchant OS (REZ ecosystem)

---

## 2. AI EMPLOYEES (AGENTS)

AI Agents are specialized workers that interact with customers and staff.

### 2.1 AI Waiter
- **Purpose:** Take orders, answer questions
- **Interactions:** Customer orders, menu queries, special requests
- **Skills:**
  - Order taking
  - Menu recommendations
  - Dietary accommodations
  - Upselling suggestions

### 2.2 Catering Manager AI
- **Purpose:** Event orders, bulk bookings
- **Interactions:** Event planning, catering inquiries, quote generation
- **Skills:**
  - Event size estimation
  - Menu planning
  - Pricing calculation
  - Coordination

### 2.3 Kitchen Manager AI
- **Purpose:** Order coordination, quality control
- **Interactions:** Kitchen workflow, quality standards
- **Skills:**
  - Order prioritization
  - Station assignment
  - Quality tracking
  - Allergy alerts

### 2.4 Reservation Manager AI
- **Purpose:** Table bookings, seating
- **Interactions:** Reservations, walk-ins, seating arrangements
- **Skills:**
  - Table management
  - Time slot allocation
  - Special occasion tracking
  - Waitlist management

---

## 3. AI WORKERS (AUTOMATED TASKS)

AI Workers run automated background processes.

### 3.1 Order Worker
- **Purpose:** Order tracking, fulfillment
- **Tasks:**
  - Order status tracking
  - KDS integration
  - Fulfillment monitoring
  - Completion alerts

### 3.2 KDS Worker
- **Purpose:** Kitchen display system
- **Tasks:**
  - Order display
  - Timer management
  - Bump management
  - Rush hour handling

### 3.3 Inventory Worker
- **Purpose:** Stock tracking, alerts
- **Tasks:**
  - Ingredient tracking
  - Low stock alerts
  - Supplier orders
  - Waste monitoring

### 3.4 Report Worker
- **Purpose:** Daily/weekly/monthly reports
- **Tasks:**
  - Sales reports
  - Popular items analysis
  - Staff performance
  - Cost analysis

---

## 4. VOICE AGENTS

### 4.1 Phone Receptionist
- **Capabilities:**
  - Answer calls 24/7
  - Take reservations
  - Answer menu questions
  - Handle complaints
- **Languages:** Hindi, English, Tamil, Telugu, Bengali, Marathi

### 4.2 WhatsApp AI
- **Capabilities:**
  - Text/voice conversations
  - Order placement
  - Reservation booking
  - Delivery tracking

### 4.3 IVR System
- **Capabilities:**
  - Auto-attendant
  - Reservation IVR
  - Order status
  - Extension routing

---

## 5. BACKEND SERVICES

### 5.1 POS Service (`/services/pos-service/`)
- Order management
- Bill generation
- Payment processing
- Split checks

### 5.2 Menu Service (`/services/menu-service/`)
- Menu items
- Pricing
- Availability
- Modifiers

### 5.3 KDS Service (`/services/kds-service/`)
- Kitchen display
- Order routing
- Timing alerts
- Bump management

### 5.4 Inventory Service (`/services/inventory-service/`)
- Ingredient tracking
- Supplier management
- Reorder alerts
- Cost tracking

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

### 6.4 Delivery Platforms
- Swiggy integration
- Zomato integration
- Direct delivery

---

## 7. API ENDPOINTS

### AI Agent APIs
```
POST /api/ai/waiter/order
POST /api/ai/catering/book
POST /api/ai/kitchen/coordinate
POST /api/ai/reservation/book
```

### Worker APIs
```
GET  /api/workers/order/status
POST /api/workers/kds/bump
GET  /api/workers/inventory/alerts
GET  /api/workers/reports/daily
```

### Service APIs
```
GET  /api/services/orders/:id
POST /api/services/orders
GET  /api/services/menu
POST /api/services/payments
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
- **Main Service:** 4820
- **Voice Agents:** 4850-4860

### Environment Variables
```bash
PORT=4820
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
| AI Waiter | ⏳ Pending | Needs implementation |
| Catering Manager AI | ⏳ Pending | Needs implementation |
| Kitchen Manager AI | ⏳ Pending | Needs implementation |
| Reservation Manager AI | ⏳ Pending | Needs implementation |
| Order Worker | ⏳ Pending | Needs implementation |
| KDS Worker | ⏳ Pending | Needs implementation |
| Inventory Worker | ⏳ Pending | Needs implementation |
| Report Worker | ⏳ Pending | Needs implementation |
| Phone Receptionist | ⏳ Pending | Needs voice agent setup |
| WhatsApp AI | ⏳ Pending | Needs WhatsApp integration |
| IVR System | ⏳ Pending | Needs IVR flow builder |
| POS Service | ⏳ Pending | Needs service folder |
| Menu Service | ⏳ Pending | Needs service folder |
| KDS Service | ⏳ Pending | Needs service folder |
| Inventory Service | ⏳ Pending | Needs service folder |

---

## 11. MISSING ITEMS (TODO)

1. **src/index.ts** - Main entry point with all routes
2. **AI employee implementations** - Waiter, Catering, Kitchen, Reservation
3. **Worker implementations** - Order, KDS, Inventory, Report
4. **Voice agent implementations** - Phone, WhatsApp, IVR
5. **Service implementations** - POS, Menu, KDS, Inventory
6. **CLAUDE.md** - Developer documentation
7. **README.md** - Needs creation
8. **Dockerfile** - Container configuration
9. **package.json** - Dependencies
10. **tsconfig.json** - TypeScript configuration
11. **employees/** - Employee folders
12. **services/** - Service folders

---

**Last Updated:** June 3, 2026
**Maintainer:** HOJAI AI Team
