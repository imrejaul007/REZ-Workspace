# REZ HR OS - Human Resources Operating System

**Company:** REZ-Merchant  
**Type:** Industry OS - HR Vertical  
**Status:** NEW - June 5, 2026  
**Port Range:** 4700-4799

---

## Overview

REZ HR OS is a comprehensive human resources management system covering the complete employee lifecycle:
- Recruitment & Onboarding
- Attendance & Leave Management
- Payroll Processing
- Performance Reviews
- Training & Development
- Employee Self-Service

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    REZ HR OS (Port 4700)                    │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌─────────┐│
│  │ Employee  │  │ Attendance│  │  Payroll  │  │Training ││
│  │ Service   │  │ Service   │  │ Service   │  │ Service ││
│  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └────┬────┘│
│        │              │              │              │      │
│        └──────────────┴──────────────┴──────────────┘      │
│                            │                                │
│                   ┌────────┴────────┐                      │
│                   │  HR API Gateway  │                      │
│                   │    (Port 4700)   │                      │
│                   └─────────────────┘                       │
└─────────────────────────────────────────────────────────────┘
                            │
         ┌──────────────────┼──────────────────┐
         ▼                  ▼                  ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   RABTUL    │    │  REZ Mind   │    │   HOJAI    │
│ Auth, Wallet│    │ Intent Pred │    │   AI Brain │
└─────────────┘    └─────────────┘    └─────────────┘
```

## Services

| Service | Port | Description |
|---------|------|-------------|
| `hr-employee-service` | 4701 | Employee CRUD, profiles, documents |
| `hr-attendance-service` | 4702 | Check-in/out, geo-fencing, shifts |
| `hr-leave-service` | 4703 | Leave requests, approvals, balance |
| `hr-payroll-service` | 4704 | Salary processing, deductions, PF |
| `hr-recruitment-service` | 4705 | Job postings, applications, interviews |
| `hr-onboarding-service` | 4706 | Document collection, training schedules |
| `hr-performance-service` | 4707 | Reviews, goals, feedback |
| `hr-training-service` | 4708 | Course catalog, enrollments, certifications |
| `hr-self-service-api` | 4709 | Employee portal, mobile app backend |
| `hr-analytics-service` | 4710 | Reports, dashboards, compliance |

## Key Features

### Employee Management
- Multi-company, multi-department support
- Role-based access control
- Document management (Aadhaar, PAN, certificates)
- Emergency contacts & dependents
- Asset allocation tracking

### Attendance & Shifts
- Geo-fenced check-in/check-out
- Shift scheduling & rostering
- Overtime calculation
- Holiday calendar management
- Integration with biometric devices

### Leave Management
- Configurable leave policies
- Approval workflows
- Leave encashment
- Carry-forward rules
- Comp-off management

### Payroll Processing
- Salary components configuration
- PF, ESI, TDS calculations
- Reimbursement handling
- Payslip generation
- Bank transfer integration (via RABTUL Payment)

### Recruitment & Onboarding
- Job posting management
- Application tracking
- Interview scheduling
- Offer letter generation
- Document checklist

### Performance Management
- Goal setting (OKR, KPI)
- 360-degree feedback
- Performance reviews
- Promotion recommendations
- Training needs assessment

## API Endpoints

### Employee
```
POST   /api/v1/employees           - Create employee
GET    /api/v1/employees          - List employees
GET    /api/v1/employees/:id     - Get employee
PATCH  /api/v1/employees/:id      - Update employee
DELETE /api/v1/employees/:id       - Delete employee
GET    /api/v1/employees/:id/documents - Get documents
```

### Attendance
```
POST   /api/v1/attendance/checkin     - Check in
POST   /api/v1/attendance/checkout    - Check out
GET    /api/v1/attendance/:date       - Get attendance
GET    /api/v1/attendance/report      - Attendance report
POST   /api/v1/shifts                - Create shift
```

### Leave
```
POST   /api/v1/leave/apply        - Apply for leave
GET    /api/v1/leave/balance      - Get leave balance
GET    /api/v1/leave/requests     - List leave requests
PATCH  /api/v1/leave/:id/approve  - Approve leave
PATCH  /api/v1/leave/:id/reject   - Reject leave
```

### Payroll
```
POST   /api/v1/payroll/run         - Run payroll
GET    /api/v1/payroll/salary/:emp - Get salary slip
GET    /api/v1/payroll/components  - Get salary components
POST   /api/v1/payroll/reimburse   - Submit reimbursement
```

## Event Triggers

| Event | Trigger | Integrations |
|-------|---------|--------------|
| `employee.created` | New employee added | RABTUL Auth, HOJAI |
| `attendance.checked_in` | Employee checks in | Notifications |
| `leave.applied` | Leave request | Notifications, Manager approval |
| `payroll.processed` | Salary credited | RABTUL Payment, Wallet |
| `training.completed` | Course finished | Analytics |

## Ecosystem Integration

### RABTUL
```typescript
import { createEcosystemClient } from '@rez/sdk';

const ecosystem = createEcosystemClient({ apiKey: process.env.REZ_API_KEY });

// Create employee account
await ecosystem.auth.createAccount({
  email: employee.email,
  companyId: 'hr-os'
});

// Credit salary via wallet
await ecosystem.wallet.credit({
  userId: employee.userId,
  amount: salary.netAmount,
  reason: 'Salary Credit'
});
```

### HOJAI AI
```typescript
// AI-powered resume screening
const screening = await ecosystem.hojai.query({
  prompt: `Screen this resume for ${jobRole} position:
    ${resumeText}
    
    Evaluate: Skills match, Experience relevance, Red flags`
});

// Predictive attrition analysis
const riskScore = await ecosystem.hojai.query({
  prompt: `Analyze attrition risk for employee:
    Tenure: ${employee.joiningDate}
    Attendance: ${attendanceTrend}
    Reviews: ${performanceHistory}`
});
```

## Quick Start

```bash
# Start all HR services
cd REZ-Merchant
docker-compose -f hr-os/docker-compose.yml up -d

# Or start individually
cd hr-employee-service && npm run dev
cd hr-attendance-service && npm run dev
cd hr-payroll-service && npm run dev

# Health check
curl http://localhost:4700/health
```

## Database Models

### Employee
```typescript
interface Employee {
  id: string;
  companyId: string;
  departmentId: string;
  userId: string;           // RABTUL Auth user
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  designation: string;
  managerId?: string;
  dateOfJoining: Date;
  status: 'active' | 'inactive' | 'terminated';
  documents: EmployeeDocument[];
  bankDetails: BankDetails;
  salary: SalaryComponents;
}
```

### Attendance
```typescript
interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: Date;
  checkIn?: Date;
  checkOut?: Date;
  shiftId: string;
  status: 'present' | 'absent' | 'late' | 'half-day';
  geoLocation?: GeoPoint;
}
```

## Port Assignments

| Service | Port | Environment Variable |
|---------|------|---------------------|
| hr-api-gateway | 4700 | HR_GATEWAY_PORT |
| hr-employee-service | 4701 | HR_EMPLOYEE_PORT |
| hr-attendance-service | 4702 | HR_ATTENDANCE_PORT |
| hr-leave-service | 4703 | HR_LEAVE_PORT |
| hr-payroll-service | 4704 | HR_PAYROLL_PORT |
| hr-recruitment-service | 4705 | HR_RECRUIT_PORT |
| hr-onboarding-service | 4706 | HR_ONBOARD_PORT |
| hr-performance-service | 4707 | HR_PERFORMANCE_PORT |
| hr-training-service | 4708 | HR_TRAINING_PORT |
| hr-self-service-api | 4709 | HR_SELF_SERVICE_PORT |
| hr-analytics-service | 4710 | HR_ANALYTICS_PORT |

---

**Version:** 1.0.0  
**Last Updated:** June 5, 2026  
**Ecosystem Connected:** ✅ RABTUL Auth, Wallet | ✅ HOJAI AI | ✅ Event Bus
