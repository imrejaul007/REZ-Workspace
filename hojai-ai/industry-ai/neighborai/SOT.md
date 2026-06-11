# NEIGHBORAI - State of Technology

**Version:** 1.0.0
**Date:** June 6, 2026
**Industry:** Residential Society
**Tagline:** "AI for Smarter Communities"
**Port:** 4806

---

## 1. PRODUCT OVERVIEW

NEIGHBORAI is an AI-powered operating system for residential societies and housing complexes. It combines AI agents (workers), automated workers, voice agents, and a complete backend to manage society operations.

### Target Customers
- Standalone residential societies (HOJAI AI clients)
- REZ ecosystem clients

### Pricing
- Included in HOJAI AI Industry Suite
- Included in REZ-Merchant OS (REZ ecosystem)

---

## 2. AI EMPLOYEES (AGENTS)

AI Agents are specialized workers that interact with residents and staff.

### 2.1 Society Manager AI
- **Status:** ✅ Implemented
- **Purpose:** General management, queries
- **Interactions:** Complaint handling, inquiry resolution, notices
- **Skills:**
  - Complaint management
  - Notice generation
  - Rule enforcement
  - Communication

### 2.2 Visitor Manager AI
- **Status:** ✅ Implemented
- **Purpose:** Visitor management, security
- **Interactions:** Visitor approvals, delivery management, access control
- **Skills:**
  - Visitor vetting
  - Approval workflow
  - Delivery coordination
  - Access logging

### 2.3 Complaint Resolver AI
- **Status:** ✅ Implemented
- **Purpose:** Issue resolution, escalation
- **Interactions:** Complaint tracking, status updates, resolution
- **Skills:**
  - Complaint categorization
  - Assignment routing
  - Escalation management
  - Satisfaction tracking

### 2.4 Event Coordinator AI
- **Status:** ✅ Implemented
- **Purpose:** Community events, bookings
- **Interactions:** Event planning, facility bookings, announcements
- **Skills:**
  - Event planning
  - Facility management
  - RSVP handling
  - Announcement delivery

---

## 3. AI WORKERS (AUTOMATED TASKS)

AI Workers run automated background processes.

### 3.1 Maintenance Worker
- **Status:** ✅ Implemented (in maintenance routes)
- **Purpose:** Maintenance tracking
- **Tasks:**
  - Complaint tracking
  - Vendor management
  - AMC tracking
  - Cost analysis

### 3.2 Event Worker
- **Status:** ✅ Implemented (in events routes)
- **Purpose:** Event management
- **Tasks:**
  - Booking management
  - Calendar coordination
  - Announcement delivery
  - Feedback collection

### 3.3 Billing Worker
- **Status:** ✅ Implemented (in maintenance routes)
- **Purpose:** Society billing, collections
- **Tasks:**
  - Maintenance billing
  - Payment tracking
  - Due reminders
  - Financial reports

---

## 4. VOICE AGENTS

### 4.1 Phone Receptionist
- **Status:** 🔄 Planned (connector framework exists)
- **Capabilities:**
  - Answer resident calls
  - Emergency routing
  - Complaint registration
  - Information queries
- **Languages:** Hindi, English, Tamil, Telugu, Bengali, Marathi, Gujarati

### 4.2 WhatsApp AI
- **Status:** 🔄 Planned (connector framework exists)
- **Capabilities:**
  - Text/voice conversations
  - Visitor approvals
  - Bill reminders
  - Community updates

### 4.3 IVR System
- **Status:** 🔄 Planned (connector framework exists)
- **Capabilities:**
  - Auto-attendant
  - Extension routing
  - Emergency routing
  - Facility info

---

## 5. BACKEND SERVICES

### 5.1 Society Service (Integrated)
- Society configuration ✅
- Block/unit management ✅
- Resident management ✅
- Staff management ✅

### 5.2 Visitor Service (Integrated)
- Visitor registration ✅
- Approval workflow ✅
- Delivery management ✅
- Access logging ✅

### 5.3 Maintenance Service (Integrated)
- Complaint management ✅
- Vendor directory (coming)
- Work order tracking ✅
- Cost tracking ✅

### 5.4 Billing Service (Integrated)
- Maintenance bills ✅
- Payment tracking ✅
- Receipt generation (coming)
- Financial reports ✅

---

## 6. INTEGRATION POINTS

### 6.1 HOJAI Core
- Intent Graph ✅
- Memory System ✅
- Trust Engine ✅
- Agent Marketplace ✅

### 6.2 Merchant OS
- Resident database ✅
- Payment processing (coming)
- Reporting ✅

### 6.3 REZ Merchant OS (for REZ clients)
- Full ecosystem sync ✅
- Cross-product insights ✅
- Unified reporting ✅

### 6.4 External Systems
- Gate systems (planned)
- Intercom systems (planned)
- Utility providers (planned)
- Payment gateways (planned)

---

## 7. API ENDPOINTS

### AI Agent APIs
```
POST /api/ai/society/query        - Society Manager query
POST /api/ai/society/billing      - Billing info
POST /api/ai/visitor/pre-approve  - Pre-approve visitor
POST /api/ai/visitor/checkin      - Check in visitor
POST /api/ai/visitor/checkout     - Check out visitor
POST /api/ai/complaint/track      - Track complaint
POST /api/ai/complaint/register   - Register complaint
POST /api/ai/complaint/stats      - Complaint statistics
POST /api/ai/event/plan          - Plan event
GET  /api/ai/event/upcoming      - Upcoming events
GET  /api/ai/event/analytics     - Event analytics
POST /api/ai/converse            - Natural language
GET  /ai/status                  - AI status
```

### CRUD APIs
```
GET    /api/residents              - List residents
GET    /api/residents/:id          - Get resident
POST   /api/residents              - Create resident
PATCH  /api/residents/:id          - Update resident
DELETE /api/residents/:id          - Delete resident

GET    /api/visitors               - List visitors
POST   /api/visitors/checkin      - Check in visitor
POST   /api/visitors/checkout     - Check out visitor
POST   /api/visitors/approve/:id  - Approve visitor

GET    /api/complaints             - List complaints
GET    /api/complaints/:id         - Get complaint
POST   /api/complaints            - Create complaint
PATCH  /api/complaints/:id        - Update complaint
POST   /api/complaints/:id/resolve - Resolve complaint

GET    /api/maintenance            - List maintenance
POST   /api/maintenance/request   - Create request
POST   /api/maintenance/generate  - Generate bills
POST   /api/maintenance/:id/pay   - Record payment

GET    /api/events                - List events
POST   /api/events               - Create event
POST   /api/events/:id/rsvp      - RSVP to event
```

### Analytics APIs
```
GET /api/analytics/dashboard     - Dashboard data
GET /api/analytics/residents     - Resident analytics
GET /api/analytics/visitors     - Visitor analytics
GET /api/analytics/complaints   - Complaint analytics
GET /api/analytics/maintenance  - Maintenance analytics
GET /api/analytics/events       - Event analytics
```

### Auth APIs
```
POST /api/auth/register          - Register user
POST /api/auth/login             - Login user
GET  /api/auth/me               - Current user
PATCH /api/auth/password         - Change password
POST /api/auth/seed             - Seed admin
```

---

## 8. TECHNOLOGY STACK

| Layer | Technology |
|-------|------------|
| Runtime | Node.js 18+ / TypeScript |
| Framework | Express.js |
| Database | MongoDB with Mongoose ODM |
| Cache | In-memory (Redis planned) |
| AI/ML | HOJAI Core / OpenAI |
| Validation | Zod |
| Logging | Winston |
| Security | Helmet, CORS, Rate Limiting |
| Auth | JWT with bcrypt |
| Container | Docker |
| Orchestration | Docker Compose |

---

## 9. DEPLOYMENT

### Ports
- **Main Service:** 4806

### Health Checks
```bash
GET /health      # Full health with stats
GET /health/live # Liveness probe
GET /health/ready # Readiness probe
GET /ai/status   # AI employee status
```

### Environment Variables
```bash
PORT=4806
MONGODB_URI=mongodb://localhost:27017/neighborai
JWT_SECRET=your-secret-key
NODE_ENV=development
```

---

## 10. CURRENT STATUS

| Component | Status | Notes |
|-----------|--------|-------|
| Society Manager AI | ✅ Ready | Full implementation |
| Visitor Manager AI | ✅ Ready | Full implementation |
| Complaint Resolver AI | ✅ Ready | Full implementation |
| Event Coordinator AI | ✅ Ready | Full implementation |
| Maintenance Worker | ✅ Ready | Integrated in routes |
| Event Worker | ✅ Ready | Integrated in routes |
| Billing Worker | ✅ Ready | Integrated in routes |
| Phone Receptionist | 🔄 Planned | Voice agent framework |
| WhatsApp AI | 🔄 Planned | Voice agent framework |
| IVR System | 🔄 Planned | Voice agent framework |
| Society Service | ✅ Ready | All endpoints |
| Visitor Service | ✅ Ready | All endpoints |
| Maintenance Service | ✅ Ready | All endpoints |
| Billing Service | ✅ Ready | All endpoints |

---

## 11. COMPLETED FEATURES

- [x] Complete Express server with TypeScript
- [x] MongoDB models (6 models)
- [x] JWT authentication
- [x] Rate limiting and security
- [x] AI employee services
- [x] All CRUD endpoints
- [x] Analytics dashboard
- [x] Validation with Zod
- [x] Winston logging
- [x] Health check endpoints
- [x] Webhook integration
- [x] HOJAI sync
- [x] Docker support
- [x] Documentation (README, SOT, API, CLAUDE)

---

## 12. ROADMAP

### Phase 2 (Planned)
- [ ] WhatsApp AI integration
- [ ] Voice agent (phone)
- [ ] Payment gateway integration
- [ ] SMS/Email notifications
- [ ] Advanced analytics
- [ ] Mobile app (React Native)

### Phase 3 (Future)
- [ ] Gate system integration
- [ ] Intercom integration
- [ ] Utility bill management
- [ ] Vehicle recognition
- [ ] Access control

---

**Last Updated:** June 6, 2026
**Maintainer:** HOJAI AI Team
