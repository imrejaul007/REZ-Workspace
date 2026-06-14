# CorpPerks - HR & Benefits Management

**Location:** `companies/CorpPerks/`  
**Purpose:** HR automation, payroll, employee benefits, and workforce management  
**Status:** ✅ **100+ SERVICES BUILT** | **June 14, 2026**

---

## CorpPerks Overview

CorpPerks provides a comprehensive HR operating system for businesses in the RTMN ecosystem, covering everything from hiring to retirement with AI-powered automation.

### CorpPerks vs Traditional HR

| Feature | Traditional HR | CorpPerks |
|---------|---------------|-----------|
| AI-Powered Hiring | ❌ | ✅ |
| Automated Payroll | Partial | ✅ Full |
| Benefits Administration | Manual | ✅ Automated |
| Employee Self-Service | Limited | ✅ Full |
| Compliance Management | Manual | ✅ Automated |
| Performance Management | Annual | ✅ Continuous |
| Attendance Tracking | Manual | ✅ AI-Enhanced |
| Employee Wellness | ❌ | ✅ |

---

## Core Services (100+)

| Category | Services | Description |
|----------|----------|-------------|
| **Hiring** | ATS, Job Board, Screening, Interview | Recruitment automation |
| **Onboarding** | Documents, Training, Equipment | New hire onboarding |
| **Payroll** | Processing, Disbursement, Statutory | Salary management |
| **Benefits** | Insurance, Reimbursements, Perks | Benefits administration |
| **Attendance** | Time Tracking, Geo-fencing, PTO | Leave management |
| **Performance** | OKRs, Reviews, Feedback | Performance system |
| **Compliance** | Labor Law, Documents, Reports | Regulatory compliance |
| **Analytics** | Workforce, Cost, Engagement | HR analytics |

---

## Key Features

### Recruitment & Hiring
| Feature | Description |
|---------|-------------|
| Job Posting | Multi-platform job distribution |
| Resume Screening | AI-powered candidate matching |
| Interview Scheduling | Automated calendar coordination |
| Background Verification | KYC, employment history |
| Offer Management | Digital offer letters |
| Onboarding Workflow | Automated onboarding tasks |

### Payroll & Compensation
| Feature | Description |
|---------|-------------|
| Salary Processing | Monthly/weekly/bi-weekly |
| Variable Pay | Incentives, commissions, bonuses |
| Statutory Compliance | PF, ESI, TDS, PT |
| Reimbursement | Travel, meals, equipment |
| Salary Advances | On-demand salary |
| Pay Slips | Digital pay slips |

### Benefits Administration
| Feature | Description |
|---------|-------------|
| Health Insurance | Group health plans |
| Life Insurance | Term life coverage |
| Retirement Plans | NPS, PF, Gratuity |
| Meal Benefits | Meal cards, coupons |
| Transport | Cab services, fuel allowance |
| Learning & Development | Course subscriptions |
| Employee Perks | Discounts, wellness |

### Attendance & Leave
| Feature | Description |
|---------|-------------|
| Time Tracking | Clock in/out |
| Geo-fencing | Location-based attendance |
| Leave Management | Sick, casual, earned |
| Holiday Calendar | Company + public holidays |
| Overtime | Auto-calculation |
| Work from Home | Remote attendance |

### Performance Management
| Feature | Description |
|---------|-------------|
| Goal Setting | OKR framework |
| Continuous Feedback | Real-time feedback |
| Performance Reviews | Quarterly/annual |
| 360-degree Feedback | Peer reviews |
| Skill Assessment | Competency mapping |
| Career Planning | Growth paths |

---

## API Endpoints

```
# Employees
POST   /api/employees                 # Create employee
GET    /api/employees                 # List employees
GET    /api/employees/:id             # Get employee
PATCH  /api/employees/:id             # Update employee

# Payroll
POST   /api/payroll/process          # Process payroll
GET    /api/payroll/:employeeId      # Get payroll history
POST   /api/payroll/reimbursements   # Submit reimbursement

# Leave
POST   /api/leave/apply              # Apply leave
GET    /api/leave/balance/:empId     # Leave balance
GET    /api/leave/calendar           # Leave calendar

# Attendance
POST   /api/attendance/clock-in      # Clock in
POST   /api/attendance/clock-out     # Clock out
GET    /api/attendance/:empId        # Attendance report

# Benefits
GET    /api/benefits/:empId          # Get benefits
POST   /api/benefits/enroll          # Enroll in plan
```

---

## File Structure

```
companies/CorpPerks/
├── src/
│   ├── hiring/                      # Recruitment
│   ├── onboarding/                  # Onboarding
│   ├── payroll/                     # Payroll
│   ├── benefits/                    # Benefits
│   ├── attendance/                  # Attendance
│   ├── performance/                 # Performance
│   ├── compliance/                 # Compliance
│   └── analytics/                  # Analytics
├── dashboard/                       # Admin dashboard
├── employee-app/                   # Employee self-service
└── integrations/                   # Third-party integrations
```

---

## Integration with RTMN

| Service | Integration | Purpose |
|---------|-------------|---------|
| Restaurant Expansion | CorpPerks | Staff planning |
| Nexha | HR for commerce | Employee management |
| SUTAR | Goal alignment | OKR integration |
| CorpID | Identity | Universal employee ID |
| RABTUL | Payroll disbursement | Salary payments |

---

## Quick Start

```bash
# Install
cd companies/CorpPerks && npm install

# Start services
npm start

# Health check
curl http://localhost:4006/health
```
