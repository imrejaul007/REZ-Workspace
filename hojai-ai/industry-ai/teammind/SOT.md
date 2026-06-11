# TEAMMIND - State of Technology

**Version:** 1.0.0
**Date:** June 3, 2026
**Industry:** Human Resources
**Tagline:** "AI-Powered HR That Works"

---

## 1. PRODUCT OVERVIEW

TEAMMIND is an AI-powered operating system for HR departments and recruitment. It combines AI agents (workers), automated workers, voice agents, and a complete backend to manage HR operations.

### Target Customers
- Standalone businesses (HOJAI AI clients)
- REZ ecosystem clients

### Pricing
- ₹4,999/month (HOJAI AI)
- Included in REZ-Merchant OS (REZ ecosystem)

---

## 2. AI EMPLOYEES (AGENTS)

AI Agents are specialized workers that interact with employees and candidates.

### 2.1 Recruiter AI
- **Purpose:** Sourcing, screening
- **Interactions:** Candidate sourcing, initial screening, interview scheduling
- **Skills:**
  - Resume parsing
  - Skill matching
  - Candidate ranking
  - JD generation

### 2.2 Interview AI
- **Purpose:** Interview assistance, evaluation
- **Interactions:** Interview scheduling, question generation, feedback
- **Skills:**
  - Interview prep
  - Question banks
  - Evaluation scoring
  - Feedback synthesis

### 2.3 Payroll Agent
- **Purpose:** Salary processing, compliance
- **Interactions:** Salary calculation, deductions, disbursement
- **Skills:**
  - Salary computation
  - Tax calculations
  - Deduction management
  - Compliance checks

### 2.4 HR Helpdesk
- **Purpose:** Employee queries, support
- **Interactions:** Policy questions, leave requests, complaints
- **Skills:**
  - Policy lookup
  - Leave management
  - Grievance handling
  - Escalation

---

## 3. AI WORKERS (AUTOMATED TASKS)

AI Workers run automated background processes.

### 3.1 Attendance Worker
- **Purpose:** Time tracking, reports
- **Tasks:**
  - Check-in/out logging
  - Overtime calculation
  - Late policy enforcement
  - Monthly reports

### 3.2 Onboarding Worker
- **Purpose:** New hire processing
- **Tasks:**
  - Document collection
  - System setup
  - Training schedules
  - Buddy assignment

### 3.3 Performance Worker
- **Purpose:** Review management
- **Tasks:**
  - Review scheduling
  - Goal tracking
  - Calibration
  - Report generation

### 3.4 Compliance Worker
- **Purpose:** Regulatory compliance
- **Tasks:**
  - Policy monitoring
  - Document retention
  - Audit preparation
  - Reporting

---

## 4. VOICE AGENTS

### 4.1 Phone Receptionist
- **Capabilities:**
  - Answer calls 24/7
  - HR queries
  - Emergency contacts
  - Appointment routing
- **Languages:** Hindi, English, Tamil, Telugu, Bengali, Marathi

### 4.2 WhatsApp AI
- **Capabilities:**
  - Text/voice conversations
  - Leave requests
  - Payslip queries
  - Policy updates

---

## 5. BACKEND SERVICES

### 5.1 Payroll Service (`/services/payroll-service/`)
- Salary processing
- Deductions
- Disbursement
- Tax filing

### 5.2 Employee Service (`/services/employee-service/`)
- Employee profiles
- Document management
- Organization chart
- Skills database

### 5.3 Recruitment Service (`/services/recruitment-service/`)
- Job postings
- Candidate tracking
- Interview management
- Offer letters

### 5.4 Attendance Service (`/services/attendance-service/`)
- Time tracking
- Leave management
- Holiday calendar
- Reports

---

## 6. INTEGRATION POINTS

### 6.1 HOJAI Core
- Intent Graph
- Memory System
- Trust Engine
- Agent Marketplace

### 6.2 Merchant OS
- Employee database
- Payment integration
- Reporting

### 6.3 REZ Merchant OS (for REZ clients)
- Full ecosystem sync
- Cross-product insights
- Unified reporting

### 6.4 External Systems
- Bank integrations
- Government portals
- Insurance providers
- Tax authorities

---

## 7. API ENDPOINTS

### AI Agent APIs
```
POST /api/ai/recruiter/screen
POST /api/ai/interview/schedule
POST /api/ai/payroll/process
POST /api/ai/helpdesk/query
```

### Worker APIs
```
POST /api/workers/attendance/sync
POST /api/workers/onboarding/start
GET  /api/workers/performance/reviews
GET  /api/workers/compliance/audit
```

### Service APIs
```
GET  /api/services/employees/:id
POST /api/services/employees
GET  /api/services/payroll/:month
POST /api/services/payroll/process
GET  /api/services/recruitment/jobs
POST /api/services/recruitment/candidates
```

### Voice Agent APIs
```
POST /api/voice/call/incoming
POST /api/voice/whatsapp/webhook
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
- **Main Service:** TBD
- **Voice Agents:** 4850-4860

### Environment Variables
```bash
PORT=4803
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
| Recruiter AI | ⏳ Pending | Needs implementation |
| Interview AI | ⏳ Pending | Needs implementation |
| Payroll Agent | ⏳ Pending | Needs implementation |
| HR Helpdesk | ⏳ Pending | Needs implementation |
| Attendance Worker | ⏳ Pending | Needs implementation |
| Onboarding Worker | ⏳ Pending | Needs implementation |
| Performance Worker | ⏳ Pending | Needs implementation |
| Compliance Worker | ⏳ Pending | Needs implementation |
| Phone Receptionist | ⏳ Pending | Needs voice agent setup |
| WhatsApp AI | ⏳ Pending | Needs WhatsApp integration |
| Payroll Service | ⏳ Pending | Service folder exists but empty |
| Employee Service | ⏳ Pending | Needs service folder |
| Recruitment Service | ⏳ Pending | Needs service folder |
| Attendance Service | ⏳ Pending | Needs service folder |

---

## 11. MISSING ITEMS (TODO)

1. **src/index.ts** - Main entry point with all routes
2. **AI employee implementations** - Recruiter, Interview, Payroll, Helpdesk
3. **Worker implementations** - Attendance, Onboarding, Performance, Compliance
4. **Voice agent implementations** - Phone, WhatsApp
5. **Service implementations** - Employee, Recruitment, Attendance
6. **CLAUDE.md** - Developer documentation
7. **README.md** - Needs creation
8. **Dockerfile** - Container configuration
9. **package.json** - Dependencies
10. **tsconfig.json** - TypeScript configuration
11. **employees/** folders - Need AI agent folders
12. **workers/** folders - Need worker folders

---

**Last Updated:** June 3, 2026
**Maintainer:** HOJAI AI Team
