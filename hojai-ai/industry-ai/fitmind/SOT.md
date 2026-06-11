# FITMIND - State of Technology

**Version:** 1.0.0
**Date:** June 3, 2026
**Industry:** Fitness & Gym
**Tagline:** "Your AI Fitness Partner"

---

## 1. PRODUCT OVERVIEW

FITMIND is an AI-powered operating system for fitness centers, gyms, and wellness studios. It combines AI agents (workers), automated workers, voice agents, and a complete backend to manage fitness operations.

### Target Customers
- Standalone gyms and fitness centers (HOJAI AI clients)
- REZ ecosystem fitness clients

### Pricing
- ₹4,999/month (HOJAI AI)
- Included in REZ-Merchant OS (REZ ecosystem)

---

## 2. AI EMPLOYEES (AGENTS)

AI Agents are specialized workers that interact with members and staff.

### 2.1 Fitness Coach AI
- **Purpose:** Workout plans, exercise guidance
- **Interactions:** Member consultations, workout recommendations
- **Skills:**
  - Workout plan generation
  - Exercise demonstrations
  - Progress tracking
  - Form correction guidance

### 2.2 Nutrition Advisor AI
- **Purpose:** Diet plans, meal suggestions
- **Interactions:** Nutrition consultations, meal planning
- **Skills:**
  - Calorie calculation
  - Macro planning
  - Meal suggestions
  - Supplement recommendations

### 2.3 Membership Advisor AI
- **Purpose:** Plan recommendations, renewals
- **Interactions:** Lead qualification, upselling, renewals
- **Skills:**
  - Plan matching
  - Pricing optimization
  - Renewal reminders
  - Cross-selling

### 2.4 Retention Manager AI
- **Purpose:** Churn prediction, re-engagement
- **Interactions:** At-risk member outreach, win-back campaigns
- **Skills:**
  - Attendance analysis
  - Churn prediction
  - Re-engagement campaigns
  - Feedback collection

---

## 3. AI WORKERS (AUTOMATED TASKS)

AI Workers run automated background processes.

### 3.1 Attendance Worker
- **Purpose:** Check-in tracking, analytics
- **Tasks:**
  - Member check-in logging
  - Peak hours analysis
  - Attendance reports
  - Pattern detection

### 3.2 Class Scheduler Worker
- **Purpose:** Class management, instructor coordination
- **Tasks:**
  - Class scheduling
  - Instructor assignment
  - Capacity management
  - Waitlist handling

### 3.3 Compliance Worker
- **Purpose:** Safety protocols, regulations
- **Tasks:**
  - Equipment safety checks
  - License tracking
  - Insurance compliance
  - Emergency protocols

### 3.4 Report Worker
- **Purpose:** Daily/weekly/monthly reports
- **Tasks:**
  - Revenue reports
  - Member growth metrics
  - Class utilization
  - Trainer performance

---

## 4. VOICE AGENTS

### 4.1 Phone Receptionist
- **Capabilities:**
  - Answer calls 24/7
  - Book trial sessions
  - Answer membership queries
  - Route to trainers
- **Languages:** Hindi, English, Tamil, Telugu, Bengali, Marathi

### 4.2 WhatsApp AI
- **Capabilities:**
  - Text/voice conversations
  - Workout reminders
  - Class bookings
  - Nutrition tips

### 4.3 IVR System
- **Capabilities:**
  - Auto-attendant
  - Class information
  - Membership status
  - Extension routing

---

## 5. BACKEND SERVICES

### 5.1 Member Service (`/services/member-service/`)
- Member profiles
- Membership tracking
- Attendance history
- Progress data

### 5.2 Membership Plan Service (`/services/membership-plan-service/`)
- Plan definitions
- Pricing tiers
- Benefits management
- Renewal tracking

### 5.3 Attendance Service (`/services/attendance-service/`)
- Check-in/out
- Class attendance
- Visitor logging
- Access control

### 5.4 Class Scheduler (`/services/class-scheduler/`)
- Class management
- Instructor scheduling
- Room allocation
- Capacity management

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

---

## 7. API ENDPOINTS

### AI Agent APIs
```
POST /api/ai/fitness-coach/plan
POST /api/ai/nutrition/advisor
POST /api/ai/membership/advise
POST /api/ai/retention/analyze
```

### Worker APIs
```
GET  /api/workers/attendance/daily
POST /api/workers/scheduler/class
GET  /api/workers/compliance/check
GET  /api/workers/reports/weekly
```

### Service APIs
```
GET  /api/services/members/:id
POST /api/services/members
GET  /api/services/plans
POST /api/services/attendance/checkin
GET  /api/services/classes
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
- **Main Service:** 4801
- **Voice Agents:** 4850-4860

### Environment Variables
```bash
PORT=4801
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
| Fitness Coach AI | ✅ Ready | Employee folder exists |
| Nutrition Advisor AI | ✅ Ready | Employee folder exists |
| Membership Advisor AI | ✅ Ready | Employee folder exists |
| Retention Manager AI | ✅ Ready | Employee folder exists |
| Attendance Worker | ✅ Ready | Service folder exists |
| Class Scheduler Worker | ✅ Ready | Service folder exists |
| Compliance Worker | ⏳ Pending | Needs implementation |
| Report Worker | ⏳ Pending | Needs implementation |
| Phone Receptionist | ⏳ Pending | Needs voice agent setup |
| WhatsApp AI | ⏳ Pending | Needs WhatsApp integration |
| IVR System | ⏳ Pending | Needs IVR flow builder |
| Member Service | ✅ Ready | Service folder exists |
| Membership Plan Service | ✅ Ready | Service folder exists |
| Attendance Service | ✅ Ready | Service folder exists |
| Class Scheduler | ✅ Ready | Service folder exists |

---

## 11. MISSING ITEMS (TODO)

1. **src/index.ts** - Main entry point with all routes
2. **Voice agent implementations** - Phone, WhatsApp, IVR
3. **AI employee agents** - Fitness Coach, Nutrition Advisor, etc.
4. **Worker implementations** - Compliance, Report
5. **CLAUDE.md** - Developer documentation
6. **Dockerfile** - Container configuration
7. **README.md** - Already exists

---

**Last Updated:** June 3, 2026
**Maintainer:** HOJAI AI Team
