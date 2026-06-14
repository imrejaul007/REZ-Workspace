# CorpPerks - Source of Truth

**GitHub:** https://github.com/imrejaul007/CorpPerks
**Version:** 4.2.0
**Last Updated:** June 12, 2026

---

## Position Statement

**CorpPerks - Agentic Enterprise + Workforce OS + Talent Platform**

Complete enterprise HRMS with AI-powered operations, featuring:
- Core HRMS + Performance + 1:1 Meetings + OKRs + Workflows
- Project Management + Team Collaboration + Knowledge Hub
- AI Intelligence + Trust Infrastructure + Business CRM
- Real-time + GraphQL + Webhooks + Push Notifications
- Role AI Agents: 10 roles × 4 levels = 40 specialized AI agents
- BIZORA: Industry OS bridges to REZ Merchant solutions
- Indian Compliance: PF, ESI, TDS, Gratuity, Professional Tax, LWF, GST

**Positioning:** "One Platform for Work, Growth, Trust & Business"

---

## Product Portfolio

### Web Applications (8)

| App | URL | Framework | Purpose | Status |
|-----|-----|-----------|---------|--------|
| **peopleos** | peopleos.corpperks.com | Next.js 14 | Workforce OS - Core HRMS | ✅ |
| **talentai** | talentai.corpperks.com | Next.js 14 | Career Intelligence Platform | ✅ |
| **insight-campus** | insight.corpperks.com | Next.js 14 | Student Campus Management | ✅ |
| **client-portal** | clients.corpperks.com | Next.js 14 | Client Management Portal | ✅ |
| **admin-dashboard** | admin.corpperks.com | Next.js 14 | Admin Control Panel | ✅ |
| **super-admin** | platform.corpperks.com | Next.js 14 | Platform Super Admin | ✅ |
| **support-portal** | support.corpperks.com | Next.js 14 | Support Helpdesk | ✅ |
| **corpperks-landing** | corpperks.com | Next.js 14 | Marketing Landing Page | ✅ |

### Mobile Applications (5)

| App | Platform | Framework | Purpose | Status |
|-----|----------|-----------|---------|--------|
| **people** (MyTalent) | iOS/Android | Expo SDK 50 | Employee Self-Service App | ✅ |
| **manager-app** | iOS/Android | Expo SDK 50 | Manager Dashboard App | ✅ |
| **client-app** | iOS/Android | Expo SDK 50 | Client Portal App | ✅ |
| **talentai-app** | iOS/Android | Expo SDK 50 | Career Intelligence App | ✅ |
| **insight-app** | iOS/Android | Expo SDK 50 | Student Campus App | ✅ |

### Restaurant OS

| App | URL | Framework | Purpose | Status |
|-----|-----|-----------|---------|--------|
| **restopapa** | restopapa.corpperks.com | Next.js 14 | Restaurant Management System | ✅ |

---

## Microservices Architecture (31 Services)

### API & Gateway Layer

| Port | Service | Purpose | Language | Status |
|------|---------|---------|----------|--------|
| 4700 | **api-gateway** | Unified API Gateway, rate limiting, auth | Node.js | ✅ |
| 4747 | **graphql-api** | GraphQL API for flexible queries | Node.js | ✅ |
| 4748 | **realtime-service** | WebSocket for real-time updates | Node.js | ✅ |

### Core Services

| Port | Service | Purpose | Language | Status |
|------|---------|---------|----------|--------|
| 4006 | **backend** | HRMS Core - Employees, Departments, Org | Node.js | ✅ |
| 4135 | **corpperks-intelligence** | AI Decision Engine & Analytics | Node.js | ✅ |

### HR & People Services

| Port | Service | Purpose | Language | Status |
|------|---------|---------|----------|--------|
| 4738 | **payroll-service** | Indian Payroll (PF/ESI/TDS/Gratuity) | Node.js | ✅ |
| 4728 | **meeting-service** | 1:1 Meetings & Feedback | Node.js | ✅ |
| 4729 | **performance-service** | Performance Reviews & Appraisals | Node.js | ✅ |
| 4730 | **okr-service** | OKR Tracking & Alignment | Node.js | ✅ |
| 4731 | **workflow-service** | Business Process Automation | Node.js | ✅ |
| 4732 | **onboarding-service** | Employee Onboarding Workflow | Node.js | ✅ |
| 4733 | **exit-service** | Offboarding & Exit Interviews | Node.js | ✅ |
| 4739 | **shift-service** | Shift Scheduling & Management | Node.js | ✅ |
| 4740 | **compensation-service** | Salary & Benefits Management | Node.js | ✅ |
| 4734 | **lms-service** | Learning Management System | Node.js | ✅ |
| 4736 | **calendar-service** | Calendar & Scheduling | Node.js | ✅ |

### Business Services

| Port | Service | Purpose | Language | Status |
|------|---------|---------|----------|--------|
| 4725 | **corp-crm-service** | Customer Relationship Management | Node.js | ✅ |
| 4724 | **projectos-service** | Project Management | Node.js | ✅ |
| 4726 | **team-collab-service** | Team Collaboration | Node.js | ✅ |
| 4741 | **document-service** | Document Management | Node.js | ✅ |
| 4742 | **video-service** | Video Conferencing | Node.js | ✅ |
| 4737 | **sso-service** | Single Sign-On | Node.js | ✅ |

### Analytics & Intelligence

| Port | Service | Purpose | Language | Status |
|------|---------|---------|----------|--------|
| 4744 | **analytics-service** | Analytics & Reporting | Node.js | ✅ |
| 4735 | **reports-service** | Report Generation | Node.js | ✅ |
| 4752 | **workforce-intelligence** | Workforce Analytics | Node.js | ✅ |

### Integration Services

| Port | Service | Purpose | Language | Status |
|------|---------|---------|----------|--------|
| 4746 | **webhook-service** | Webhook Management | Node.js | ✅ |
| 4743 | **push-service** | Push Notifications | Node.js | ✅ |
| 4745 | **whatsapp-service** | WhatsApp Integration | Node.js | ✅ |

### AI Services

| Port | Service | Purpose | Language | Status |
|------|---------|---------|----------|--------|
| 4750 | **ai-agents-service** | AI Agent Orchestration | Node.js | ✅ |
| 4751 | **role-ai-agents** | Role-based AI Agents | Node.js | ✅ |

### Bridge Services

| Port | Service | Purpose | Language | Status |
|------|---------|---------|----------|--------|
| 4008 | **REZ-merchant-bridge** | REZ Merchant Integration | Node.js | ✅ |
| 4723 | **corpid-profile-bridge** | CorpID Integration | Node.js | ✅ |
| 4722 | **rez-care-corpperks-bridge** | REZ Care Integration | Node.js | ✅ |
| 4721 | **skillnet-twin-bridge** | Skillnet Integration | Node.js | ✅ |
| 4720 | **rez-corp-integration-service** | REZ Corp Integration | Node.js | ✅ |

---

## AI Agents System (46 Total)

### Role AI Agents (40) - 10 Roles × 4 Levels

| Role | Level 1 | Level 2 | Level 3 | Level 4 |
|------|---------|---------|---------|---------|
| **Software** | CodeBuddy | DevPro | TechLead | CTO Advisor |
| **Sales** | SalesBuddy | SalesPro | SalesLeader | Revenue Strategist |
| **Marketing** | MarketingBuddy | MarketingPro | MarketingManager | CMO Counselor |
| **Finance** | FinanceBuddy | FinanceAnalyst | FinanceManager | CFO Counselor |
| **HR** | HRBuddy | HRPro | HRManager | CHRO Counselor |
| **Operations** | OpsBuddy | OpsAnalyst | OpsManager | COO Counselor |
| **Product** | PMBuddy | PMPro | SeniorPM | Product Visionary |
| **Design** | DesignBuddy | DesignPro | SeniorDesigner | Design Director |
| **Support** | SupportBuddy | SeniorSupport | SupportLead | Support Strategist |
| **Admin** | AdminBuddy | AdminPro | SeniorAdmin | Security Advisor |

### General AI Agents (6)

| Agent | Purpose | Capabilities |
|-------|---------|--------------|
| **Career Coach** | Career path guidance | Skill mapping, role exploration, growth plans |
| **Productivity Advisor** | Time management | Schedule optimization, focus tips, efficiency |
| **Learning Coach** | Training recommendations | Course suggestions, learning paths, progress |
| **Financial Advisor** | Compensation guidance | Salary benchmarking, benefits optimization |
| **Benefits Assistant** | Employee benefits | Enrollment, claims, queries |
| **HR Assistant** | HR policy support | Policy queries, procedure guidance |

---

## BIZORA - Industry OS

BIZORA bridges CorpPerks to vertical-specific solutions via REZ Merchant ecosystem.

### Industry Bridges

| Industry | Bridge Service | REZ Merchant Target | Features |
|----------|---------------|---------------------|-----------|
| **Hotel** | hotel-os | hotel-ecosystem | Room discounts, F&B benefits, loyalty |
| **Restaurant** | restaurant-os | restauranthub | Meal plans, catering, delivery benefits |
| **Salon** | salon-os | REZ-salon-ecosystem | Service discounts, memberships, packages |
| **Retail** | retail-os | REZ-retail-app | Store discounts, corporate gifting |
| **Fitness** | fitness-os | REZ-fitness-app | Gym memberships, wellness programs |

### BIZORA Features
- Employee benefits across industries
- Cross-platform loyalty programs
- Unified HR for multi-location businesses
- Industry-specific compliance
- Partner commission tracking
- Benefits analytics

---

## RTNM Ecosystem Integration

### Company Integrations

| Company | Services | Integration Type | Status |
|---------|----------|------------------|--------|
| **RABTUL** | Auth, Wallet, Payment, Notifications | Core | ✅ Active |
| **HOJAI AI** | Memory, Agents, Workflows | AI | ✅ Active |
| **AdBazaar** | Employee targeting | Marketing | ✅ Active |
| **REZ Merchant** | Benefits, GST, HRIS | Commerce | ✅ Active |
| **CorpID** | Universal Identity | Identity | ✅ Active |
| **RidZa** | Salary advance | Financial | ✅ Configured |
| **RisnaEstate** | Properties | Real Estate | ✅ Configured |

### Integration Architecture

```
CorpPerks
├── CorpID (Identity)
├── RABTUL (Auth/Payment)
├── HOJAI AI (AI)
├── REZ Merchant (Commerce/Benefits)
│   ├── hotel-ecosystem
│   ├── restauranthub
│   ├── REZ-salon-ecosystem
│   ├── REZ-retail-app
│   └── REZ-fitness-app
├── AdBazaar (Marketing)
├── RidZa (Financial)
└── RisnaEstate (Real Estate)
```

---

## Indian Compliance

### Statutory Compliance

| Compliance | Description | Service | Status |
|------------|-------------|---------|--------|
| **PF** | Provident Fund (EPFO) | payroll-service | ✅ |
| **ESI** | Employee State Insurance | payroll-service | ✅ |
| **TDS** | Tax Deducted at Source | payroll-service | ✅ |
| **Professional Tax** | State professional tax | payroll-service | ✅ |
| **Gratuity** | Gratuity Act compliance | payroll-service | ✅ |
| **LWF** | Labor Welfare Fund | payroll-service | ✅ |
| **GST** | GST Invoicing | REZ-merchant-bridge | ✅ |

### Compliance Features
- Automatic calculation of statutory deductions
- Monthly/quarterly filing support
- Form 16 generation
- Challan generation
- Compliance reports

---

## Technology Stack

### Frontend

| Category | Technology | Version |
|----------|------------|---------|
| Framework | Next.js | 14 |
| UI Library | React | 18 |
| Styling | Tailwind CSS | Latest |
| State Management | Zustand | Latest |
| Server State | React Query (TanStack Query) | Latest |
| Forms | React Hook Form + Zod | Latest |
| Mobile | Expo SDK | 50 |
| Icons | Lucide React | Latest |
| Charts | Recharts | Latest |

### Backend

| Category | Technology | Version |
|----------|------------|---------|
| Runtime | Node.js | 20 |
| Language | TypeScript | 5.x |
| Framework | Express.js | 4.x |
| Database | MongoDB | 6+ |
| ODM | Mongoose | 8.x |
| Cache | Redis | 7+ |
| Queue | Bull (Redis) | Latest |
| Auth | JWT | Latest |
| Validation | Zod | Latest |
| Logging | Winston | 3.x |

### Infrastructure

| Category | Technology | Purpose |
|----------|------------|---------|
| Container | Docker | Containerization |
| Orchestration | Docker Compose | Local dev, production |
| Hosting | Vercel | Web apps |
| Mobile Build | EAS (Expo) | iOS/Android builds |
| CDN | Vercel Edge | Static assets |
| Monitoring | Custom analytics | Service monitoring |

---

## API Architecture

### REST API (via api-gateway:4700)

```
/api/v1/auth/*        - Authentication
/api/v1/employees/*    - Employee management
/api/v1/departments/*  - Department management
/api/v1/attendance/*  - Attendance
/api/v1/leave/*       - Leave management
/api/v1/payroll/*     - Payroll operations
/api/v1/meetings/*    - 1:1 meetings
/api/v1/performance/* - Performance reviews
/api/v1/okr/*         - OKR management
/api/v1/workflows/*   - Workflow automation
/api/v1/documents/*   - Document management
/api/v1/analytics/*   - Analytics
```

### GraphQL API (graphql-api:4747)

- Schema introspection enabled
- Real-time subscriptions
- Query optimization with dataloaders

### WebSocket (realtime-service:4748)

| Event | Description |
|-------|-------------|
| `employee:updated` | Employee data changed |
| `meeting:scheduled` | New meeting created |
| `notification:new` | Push notification |
| `presence:changed` | User online status |
| `attendance:marked` | Attendance recorded |

---

## Deployment

### Environment Configuration

```bash
# Required Variables
MONGODB_URI=mongodb://localhost:27017/corpperks
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-jwt-secret
API_GATEWAY_URL=http://localhost:4700
CORPID_SERVICE_URL=http://localhost:4702
RABTUL_SERVICE_URL=https://api.rabtul.com
HOJAI_SERVICE_URL=https://api.hojai.ai
```

### Deployment Methods

| Method | Use Case | Command |
|--------|----------|---------|
| Docker | Production | `docker-compose -f docker-compose.prod.yml up -d` |
| Vercel | Web Apps | `cd peopleos && vercel --prod` |
| EAS | Mobile | `cd people && eas build` |

---

## Directory Structure

```
CorpPerks/
├── 🌐 Web Apps (8)
│   ├── peopleos/              # Workforce OS
│   ├── talentai/              # Career Intelligence
│   ├── insight-campus/        # Student Campus
│   ├── client-portal/         # Client Management
│   ├── admin-dashboard/       # Admin Panel
│   ├── super-admin/           # Platform Admin
│   ├── support-portal/        # Support Hub
│   └── corpperks-landing/     # Marketing Landing
│
├── 📱 Mobile Apps (5)
│   ├── people/                # MyTalent Employee App
│   ├── manager-app/          # Manager App
│   ├── client-app/            # Client App
│   ├── talentai-app/          # TalentAI Mobile
│   └── insight-app/           # InsightCampus Mobile
│
├── 🍽️ Restaurant
│   └── restopapa/             # Restaurant OS
│
├── ⚙️ Microservices (31)
│   ├── api-gateway/           # Port 4700
│   ├── backend/              # Port 4006
│   ├── corpperks-intelligence/ # Port 4135
│   ├── payroll-service/       # Port 4738
│   ├── meeting-service/       # Port 4728
│   ├── performance-service/   # Port 4729
│   ├── okr-service/           # Port 4730
│   ├── workflow-service/      # Port 4731
│   ├── onboarding-service/    # Port 4732
│   ├── exit-service/          # Port 4733
│   ├── lms-service/           # Port 4734
│   ├── reports-service/       # Port 4735
│   ├── calendar-service/      # Port 4736
│   ├── sso-service/           # Port 4737
│   ├── shift-service/         # Port 4739
│   ├── compensation-service/  # Port 4740
│   ├── document-service/      # Port 4741
│   ├── video-service/         # Port 4742
│   ├── push-service/          # Port 4743
│   ├── analytics-service/     # Port 4744
│   ├── whatsapp-service/      # Port 4745
│   ├── webhook-service/       # Port 4746
│   ├── graphql-api/           # Port 4747
│   ├── realtime-service/      # Port 4748
│   ├── ai-agents-service/     # Port 4750
│   ├── role-ai-agents/        # Port 4751
│   ├── corp-crm-service/      # Port 4725
│   ├── projectos-service/     # Port 4724
│   ├── team-collab-service/   # Port 4726
│   └── workforce-intelligence/ # Port 4752
│
├── 🏢 BIZORA
│   └── services/
│       ├── hotel-os/
│       ├── restaurant-os/
│       ├── salon-os/
│       ├── retail-os/
│       └── fitness-os/
│
├── 🔗 Bridges
│   ├── REZ-merchant-corpperks-bridge/
│   ├── corpid-profile-bridge/
│   ├── rez-care-corpperks-bridge/
│   ├── skillnet-twin-bridge/
│   └── rez-corp-integration-service/
│
├── 🤖 AI Agents
│   ├── role-ai-agents/
│   └── ai-agents-service/
│
├── 📚 Shared
│   ├── shared/
│   ├── config/
│   └── docs/
│
└── Configuration
    ├── docker-compose.yml
    ├── docker-compose.prod.yml
    └── Dockerfile
```

---

## Security

### Implemented Security

| Measure | Implementation | Status |
|---------|----------------|--------|
| Hardcoded Secrets | None in codebase | ✅ |
| PII Redaction | Winston logger middleware | ✅ |
| Environment Variables | All configs via .env | ✅ |
| CORS | Per-service configuration | ✅ |
| Rate Limiting | api-gateway | ✅ |
| Security Headers | Helmet.js | ✅ |
| JWT Validation | All protected routes | ✅ |
| Input Validation | Zod schemas | ✅ |

### Best Practices
- All sensitive data encrypted at rest
- TLS for all communications
- Regular dependency updates
- Security audit logging
- Penetration testing (scheduled)

---

## Documentation

| Document | Description | Location |
|----------|-------------|----------|
| README.md | Overview and quick start | / |
| CLAUDE.md | Developer guide | / |
| SOT.md | This file - Complete specs | / |
| CORPPERKS-PRODUCTION-AUDIT.md | Production audit | / |
| CORPPERKS-INTEGRATION-AUDIT.md | Integration audit | / |
| CORPPERKS-DEPLOYMENT-STATUS.md | Deployment status | / |
| BIZORA/README.md | BIZORA documentation | /BIZORA/ |
| docs/API-REFERENCE.md | API documentation | /docs/ |
| docs/DEPLOYMENT-GUIDE.md | Deployment guide | /docs/ |
| docs/INTEGRATIONS.md | Integration setup | /docs/ |

### Feature Documentation

| Product | Features | Location |
|---------|----------|----------|
| PeopleOS | Workforce OS | /docs/peopleos/FEATURES.md |
| TalentAI | Career Intelligence | /docs/talentai/FEATURES.md |
| InsightCampus | Student Campus | /docs/insight-campus/FEATURES.md |
| People App | Employee Mobile | /docs/people/FEATURES.md |
| RestoPapa | Restaurant OS | /docs/restopapa/FEATURES.md |
| BIZORA | Industry Bridges | /docs/bizora/FEATURES.md |
| CorpID | Universal Identity | /docs/corpid/FEATURES.md |

---

## Change Log

| Version | Date | Changes |
|---------|------|---------|
| 4.2.0 | June 12, 2026 | Comprehensive documentation update |
| 4.1.0 | June 5, 2026 | Added 31 microservices |
| 4.0.0 | May 30, 2026 | Initial comprehensive release |

---

*Last Updated: June 12, 2026*
*CorpPerks - Source of Truth*