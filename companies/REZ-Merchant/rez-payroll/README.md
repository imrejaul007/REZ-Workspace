# REZ Payroll Service

**Version:** 1.0.0  
**Service Name:** rez-payroll  
**Port:** 4610

---

## Overview

Comprehensive payroll management system for Indian compliance. Handles employee management, attendance tracking, salary calculations, statutory compliance (PF, ESI, TDS), and salary disbursement.

## Features

- **Employee Management** - CRUD operations for employees with bank details and salary components
- **Attendance Tracking** - Clock in/out, leave management, monthly summaries
- **Salary Processing** - Gross salary calculation, overtime, deductions
- **Statutory Compliance** - PF, ESI, TDS validation per Indian regulations
- **Payroll Runs** - Monthly payroll processing with approval workflow
- **Disbursements** - Salary disbursement with bank transfer simulation

## Quick Start

```bash
cd rez-payroll
npm install
npm start
```

## API Endpoints

### Health Check
```
GET /health
```

### Employee Management
```
POST   /api/employees           - Create employee
GET    /api/employees           - List employees
GET    /api/employees/:id      - Get employee
PUT    /api/employees/:id      - Update employee
DELETE /api/employees/:id      - Delete employee
```

### Attendance
```
POST /api/attendance/clock-in     - Clock in
POST /api/attendance/clock-out    - Clock out
POST /api/attendance/absent       - Mark absent
POST /api/attendance/leave        - Apply leave
GET  /api/attendance/:employeeId  - Get attendance
```

### Payroll
```
POST /api/payroll/run              - Run payroll
POST /api/payroll/:id/approve     - Approve run
POST /api/payroll/:id/disburse    - Disburse salaries
GET  /api/payroll/runs            - List runs
```

### Salary Slips
```
GET /api/salary-slips/:slipId                - Get slip
GET /api/salary-slips/employee/:employeeId  - Employee slips
```

### Compliance
```
POST /api/compliance/pf         - Validate PF
POST /api/compliance/esi        - Validate ESI
POST /api/compliance/tds        - Validate TDS
POST /api/compliance/liability  - Employer liability
```

### Calculator
```
POST /api/calculator/gross      - Calculate gross
POST /api/calculator/overtime   - Calculate OT pay
```

## Environment Variables

```bash
PORT=4610                      # Service port (default: 4610)
```

## Statutory Rates (India)

| Component | Rate |
|-----------|------|
| PF Employee | 12% of basic |
| PF Employer | 12% of basic |
| ESI Employee | 0.75% |
| ESI Employer | 3.25% |
| TDS | As per slabs |
| Professional Tax | 200/month |

## Testing

```bash
npm test              # Run tests once
npm run test:watch    # Watch mode
```