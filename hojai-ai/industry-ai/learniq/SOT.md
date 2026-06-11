# LEARNIQ - State of Technology

**Version:** 1.0.0
**Date:** June 3, 2026
**Industry:** Education
**Tagline:** "AI That Makes Learning Smarter"

---

## 1. PRODUCT OVERVIEW

LEARNIQ is an AI-powered operating system for educational institutions. It combines AI agents (workers), automated workers, voice agents, and a complete backend to manage educational operations.

### Target Customers
- Standalone educational institutions (HOJAI AI clients)
- REZ ecosystem clients

### Pricing
- ₹4,999/month (HOJAI AI)
- Included in REZ-Merchant OS (REZ ecosystem)

---

## 2. AI EMPLOYEES (AGENTS)

AI Agents are specialized workers that interact with students and staff.

### 2.1 Tutor AI
- **Purpose:** Teaching assistance, explanations
- **Interactions:** Student queries, concept explanations, study help
- **Skills:**
  - Subject expertise
  - Concept explanation
  - Study guidance
  - Doubt resolution

### 2.2 Admission Counselor AI
- **Purpose:** Admissions, guidance
- **Interactions:** Admission queries, course guidance, application support
- **Skills:**
  - Course recommendations
  - Eligibility checking
  - Application assistance
  - Career guidance

### 2.3 Placement Officer AI
- **Purpose:** Career services, placements
- **Interactions:** Job postings, resume building, interview prep
- **Skills:**
  - Resume building
  - Interview prep
  - Job matching
  - Company outreach

### 2.4 Grader AI
- **Purpose:** Assessment, evaluation
- **Interactions:** Assignment grading, feedback generation
- **Skills:**
  - Answer evaluation
  - Feedback generation
  - Plagiarism detection
  - Score calculation

---

## 3. AI WORKERS (AUTOMATED TASKS)

AI Workers run automated background processes.

### 3.1 Attendance Worker
- **Purpose:** Attendance tracking
- **Tasks:**
  - Class attendance
  - Report generation
  - Leave management
  - Analytics

### 3.2 Schedule Worker
- **Purpose:** Timetable management
- **Tasks:**
  - Timetable creation
  - Room allocation
  - Conflict resolution
  - Change management

### 3.3 Compliance Worker
- **Purpose:** Regulatory compliance
- **Tasks:**
  - Curriculum compliance
  - Exam regulations
  - Documentation
  - Audit preparation

### 3.4 Report Worker
- **Purpose:** Academic reporting
- **Tasks:**
  - Progress reports
  - Performance analytics
  - Attendance reports
  - Faculty reports

---

## 4. VOICE AGENTS

### 4.1 Phone Receptionist
- **Capabilities:**
  - Answer admission calls
  - Fee queries
  - Class schedules
  - Exam information
- **Languages:** Hindi, English, Tamil, Telugu, Bengali, Marathi

### 4.2 WhatsApp AI
- **Capabilities:**
  - Text/voice conversations
  - Assignment reminders
  - Fee reminders
  - Event notifications

---

## 5. BACKEND SERVICES

### 5.1 LMS Service (`/services/lms-service/`)
- Course management
- Content delivery
- Student progress
- Assessment management

### 5.2 Student Service (`/services/student-service/`)
- Student profiles
- Enrollment management
- Attendance tracking
- Grade management

### 5.3 Faculty Service (`/services/faculty-service/`)
- Faculty profiles
- Schedule management
- Course assignments
- Performance tracking

### 5.4 Placement Service (`/services/placement-service/`)
- Job postings
- Student profiles
- Company connections
- Placement tracking

---

## 6. INTEGRATION POINTS

### 6.1 HOJAI Core
- Intent Graph
- Memory System
- Trust Engine
- Agent Marketplace

### 6.2 Merchant OS
- Student database
- Fee management
- Reporting

### 6.3 REZ Merchant OS (for REZ clients)
- Full ecosystem sync
- Cross-product insights
- Unified reporting

### 6.4 External Systems
- Examination boards
- Government education portals
- Scholarship portals
- Recruitment platforms

---

## 7. API ENDPOINTS

### AI Agent APIs
```
POST /api/ai/tutor/explain
POST /api/ai/admission/counsel
POST /api/ai/placement/match
POST /api/ai/grader/grade
```

### Worker APIs
```
GET  /api/workers/attendance/:studentId
POST /api/workers/schedule/generate
GET  /api/workers/compliance/audit
GET  /api/workers/reports/progress
```

### Service APIs
```
GET  /api/services/courses/:id
POST /api/services/students
GET  /api/services/students/:id
POST /api/services/enrollment
GET  /api/services/faculty/:id
GET  /api/services/placements
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
PORT=4811
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
| Tutor AI | ⏳ Pending | Needs implementation |
| Admission Counselor AI | ⏳ Pending | Needs implementation |
| Placement Officer AI | ⏳ Pending | Needs implementation |
| Grader AI | ⏳ Pending | Needs implementation |
| Attendance Worker | ⏳ Pending | Needs implementation |
| Schedule Worker | ⏳ Pending | Needs implementation |
| Compliance Worker | ⏳ Pending | Needs implementation |
| Report Worker | ⏳ Pending | Needs implementation |
| Phone Receptionist | ⏳ Pending | Needs voice agent setup |
| WhatsApp AI | ⏳ Pending | Needs WhatsApp integration |
| LMS Service | ✅ Ready | Service folder exists |
| Student Service | ⏳ Pending | Needs service folder |
| Faculty Service | ⏳ Pending | Needs service folder |
| Placement Service | ⏳ Pending | Needs service folder |

---

## 11. MISSING ITEMS (TODO)

1. **src/index.ts** - Main entry point with all routes
2. **AI employee implementations** - Tutor, Admission, Placement, Grader
3. **Worker implementations** - Attendance, Schedule, Compliance, Report
4. **Voice agent implementations** - Phone, WhatsApp
5. **Service implementations** - Student, Faculty, Placement
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
