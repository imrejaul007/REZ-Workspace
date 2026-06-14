# Payroll Service

Salary processing and payslip generation. Port 4750.

## Features
- Employee management
- Salary calculation (basic, HRA, allowances, deductions)
- Tax calculation (TDS)
- Payslip generation
- Payment status tracking

## API
- POST /api/employees - Add employee
- POST /api/payroll/process - Process payroll
- GET /api/payslips - List payslips
- POST /api/payslips/:id/mark-paid - Mark as paid

## Run
```bash
npm install && npm start
```