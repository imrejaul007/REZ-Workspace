# PeopleOS - Workforce Operating System

**Part of:** CorpPerks Ecosystem
**Persona:** `employee`, `employer`
**Positioning:** Workforce OS for ALL businesses (restaurants, retailers, offices)

---

## Overview

PeopleOS is NOT just for big corporates.

It's a **Workforce Operating System** for:
- Restaurants (REZ Merchant users)
- Retail stores
- Offices
- Any business with employees

---

## Who Uses PeopleOS?

| Business Type | Use Case |
|--------------|---------|
| **Restaurants** | Staff attendance, shifts, hiring |
| **Retail** | Workforce management, payroll sync |
| **Offices** | Full HR suite |

---

## Integration with REZ Merchant

Restaurants using REZ Merchant can use PeopleOS for their workforce:

```
REZ Merchant Dashboard
 │
 ├── POS / Orders / Inventory
 └── PeopleOS ←─── Staff management
     ├── Attendance (GPS, QR)
     ├── Shifts
     ├── Payroll sync
     └── Hiring via Talent Platform
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ PEOPLEOS - WORKFORCE OPERATING SYSTEM │
├─────────────────────────────────────────────────────────────┤
│ │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ CORE HR │ │
│ │ ├── Attendance (GPS, QR, Shift) │ │
│ │ ├── Leave Management │ │
│ │ ├── Shift Scheduling │ │
│ │ ├── Employee Directory │ │
│ └── Announcements │ │
│ │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ REZ MERCHANT INTEGRATION │ │
│ │ ├── Sync employees from Merchant │ │
│ │ ├── Attendance linked to shifts │ │
│ │ ├── Payroll sync │ │
│ └── Employee records linked │ │
│ │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ TALENT INTEGRATION │ │
│ │ ├── Hire via Talent Platform │ │
│ │ ├── AI Shortlisting │ │
│ │ └── Onboarding │ │
│ │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ WHATSAPP WORKFORCE │ │
│ │ ├── Attendance via WhatsApp │ │
│ └── Leave via WhatsApp │ │
└─────────────────────────────────────────────────────────────┘
```

---

## Features

### 1. Core HR

#### Attendance System
- [ ] Clock in/out (GPS-verified)
- [ ] QR code attendance
- [ ] Geo-fencing
- [ ] Shift management
- [ ] Break tracking
- [ ] Overtime tracking
- [ ] Face verification (future)
- [ ] WhatsApp attendance

#### Leave Management
- [ ] Leave requests
- [ ] Leave policy configuration
- [ ] Approval workflows
- [ ] Leave balance tracking
- [ ] Calendar integration

#### Employee Directory
- [ ] Searchable directory
- [ ] Org chart
- [ ] Department structure
- [ ] Contact info
- [ ] Profile cards

### 2. Workforce Intelligence (AI)

#### AI Insights
- [ ] "Who are top performers this month?"
- [ ] "Which employees are likely to resign?"
- [ ] "Show staff with overtime anomalies"
- [ ] "Suggest best interns for conversion"
- [ ] "Team productivity trends"

#### Predictive Analytics
- [ ] Retention risk scoring
- [ ] Performance predictions
- [ ] Attendance patterns
- [ ] Engagement levels

#### AI HR Assistant
- [ ] Natural language queries
- [ ] Instant insights
- [ ] Report generation
- [ ] Recommendation engine

### 3. CorpPerks Integration

#### Benefits Administration
- [ ] Benefit plan management
- [ ] Allowance configuration
- [ ] Budget allocation
- [ ] Usage tracking
- [ ] Reports & analytics

#### Rewards & Karma
- [ ] Team rewards
- [ ] Peer recognition
- [ ] Leaderboards
- [ ] Karma points

#### Expense Management
- [ ] Expense claims
- [ ] Approval workflows
- [ ] Reimbursements
- [ ] Budget controls

### 4. Talent Integration

#### Hiring (via Talent Platform)
- [ ] Job posting
- [ ] AI candidate matching
- [ ] Shortlisting
- [ ] Interview scheduling
- [ ] Offer management

#### Onboarding
- [ ] AI-generated onboarding flows
- [ ] Document collection
- [ ] Policy training
- [ ] Task assignments
- [ ] Completion tracking

#### Employee Lifecycle
- [ ] Employee creation
- [ ] Role changes
- [ ] Promotions
- [ ] Separations
- [ ] Alumni network

### 5. WhatsApp Workforce Layer

#### Employee Actions (via WhatsApp)
- [ ] Check attendance
- [ ] Apply leave
- [ ] View payslip
- [ ] Approve requests
- [ ] Receive announcements
- [ ] Get task notifications
- [ ] Shift reminders

#### Manager Actions (via WhatsApp)
- [ ] Approve leaves
- [ ] View team attendance
- [ ] Send announcements
- [ ] Assign tasks

### 6. Payroll Integration

#### Integrations (NOT built-in)
- [ ] Payroll service integration
- [ ] Payslip generation
- [ ] TDS calculation
- [ ] PF/ESI integration

---

## Integration Points

### REZ Profile Service
```typescript
// Activate employee persona
POST /api/personas/activate
  → { persona: 'employee', verificationData: { companyEmail: '...' } }

// Get employee extension
GET /api/personas/profile/:userId
  → { employeeExtension: { company, department, role } }
```

### CorpPerks Benefits
```typescript
// Get benefit plans
GET /api/corp/benefits

// Assign benefit
POST /api/corp/employees/:id/benefits

// Track usage
GET /api/corp/benefits/usage/:employeeId
```

### Talent Platform
```typescript
// Post job
POST /api/jobs
  → { employer: { id: companyId } }

// Get hiring dashboard
GET /api/employer/dashboard?employerId=xxx

// Get pipeline
GET /api/employer/pipeline/:jobId
```

### REZ Intelligence
```typescript
// Get workforce insights
GET /api/insights/workforce/:companyId

// Predict retention
POST /api/ml/predict/retention
  → { employees: [...], scores: [...] }
```

---

## WhatsApp Integration

```
┌─────────────────────────────────────┐
│ WHATSAPP WORKFORCE BOT │
├─────────────────────────────────────┤
│ │
│ Employee: "Attendance" │
│ Bot: "Clocked in at 9:00 AM ✓" │
│ │
│ Employee: "Apply leave" │
│ Bot: "Leave type?" │
│ Employee: "Sick leave" │
│ Bot: "From when?" │
│ ... │
│ Bot: "Leave applied ✓" │
│ │
│ Manager: "Team attendance" │
│ Bot: "Today: 45/50 present" │
│ │
└─────────────────────────────────────┘
```

---

## UI Structure

```
/hr-app
│
├── /dashboard
│   └── Overview, AI insights, quick actions
│
├── /attendance
│   ├── Today's attendance
│   ├── Calendar view
│   ├── Reports
│   └── Settings
│
├── /leaves
│   ├── My leaves
│   ├── Team leaves
│   ├── Approvals
│   └── Policy
│
├── /team
│   ├── Directory
│   ├── Org chart
│   ├── Profiles
│   └── Onboarding
│
├── /benefits
│   ├── My benefits
│   ├── Plans
│   ├── Allocations
│   └── Reports
│
├── /hiring
│   ├── Jobs
│   ├── Candidates
│   ├── Pipeline
│   └── Onboarding
│
├── /rewards
│   ├── Leaderboard
│   ├── Send karma
│   └── History
│
├── /expenses
│   ├── My claims
│   ├── Approvals
│   └── Reports
│
└── /settings
    ├── Company
    ├── Policies
    └── Integrations
```

---

## Employee App (Mobile)

```
/hr-employee-app
│
├── Dashboard
│   └── Attendance, leaves, tasks
│
├── Attendance
│   └── Clock in/out, QR scan
│
├── Leaves
│   └── Apply, history
│
├── Tasks
│   └── My tasks, assignments
│
├── Benefits
│   └── My allowances, rewards
│
├── WhatsApp Tab
│   └── Quick actions via WhatsApp
│
└── Profile
    └── My info, documents
```

---

## Technical Stack

| Component | Technology |
|-----------|-----------|
| Frontend | Next.js + React Native |
| Backend | Node.js + Express |
| Database | MongoDB |
| Cache | Redis |
| WhatsApp | WhatsApp Business API |
| AI | REZ Intelligence |
| Maps | Google Maps API |

---

## Environment Variables

```bash
PORT=4022
MONGODB_URI=mongodb://localhost:27017/rez-hr-app

# Services
PROFILE_SERVICE_URL=http://localhost:4001
TALENT_PLATFORM_URL=http://localhost:4020
CORPPERKS_URL=http://localhost:4014
INTELLIGENCE_URL=http://localhost:3001

# WhatsApp
WHATSAPP_API_KEY=xxx

# Auth
INTERNAL_SERVICE_TOKEN=xxx
```

---

## Build Order

### Phase 1: Core HR
1. Employee directory
2. Attendance system
3. Leave management
4. Basic approvals

### Phase 2: CorpPerks Integration
1. Benefits admin
2. Rewards
3. Expense management

### Phase 3: WhatsApp Layer
1. Attendance via WhatsApp
2. Leave via WhatsApp
3. Announcements via WhatsApp

### Phase 4: AI Intelligence
1. Basic insights
2. Retention predictions
3. AI assistant

### Phase 5: Talent
1. Hiring integration
2. AI shortlisting
3. Onboarding flows

---

## Positioning

Do NOT market as:
- "AI HR Platform"
- "HR Management System"

DO market as:
- **Workforce Operating System**
- **Smart Workforce Infrastructure**

---

**Document Version:** 1.0.0
**Last Updated:** May 16, 2026
