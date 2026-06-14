# CorpPerks Payroll Service

A comprehensive payroll management service for the CorpPerks Workforce OS platform.

## Features

- **Payroll Run Management** - Process monthly payroll with automatic salary calculation
- **Payslip Generation** - Generate detailed payslips with earnings, deductions, and net pay
- **Tax Declaration Management** - Submit and verify employee tax declarations (80C, 80D, HRA, etc.)
- **Reimbursement Processing** - Handle travel, medical, meal, and other expense reimbursements
- **Salary Advance** - Manage salary advance requests with approval workflows
- **India Tax Regime** - New tax regime calculations (FY 2024-25)

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

## Configuration

Copy `.env.example` to `.env` and configure:

```bash
PORT=4738
MONGODB_URI=mongodb://localhost:27017/corpperks_payroll
INTERNAL_SERVICE_TOKEN=your-secure-token
```

## API Endpoints

### Payroll

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payroll/run` | Run payroll for a month |
| GET | `/api/payroll/runs` | List payroll runs |
| GET | `/api/payroll/summary/:month/:year` | Get payroll summary |
| DELETE | `/api/payroll/cancel/:runId` | Cancel payroll run |
| GET | `/api/payroll/payslips/:employeeId` | Get employee payslips |
| GET | `/api/payroll/payslip/:id` | Get payslip details |
| PATCH | `/api/payroll/payslip/:id/status` | Update payslip status |

### Tax

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tax/declarations/:employeeId` | Get tax declarations |
| POST | `/api/tax/declarations` | Submit declarations |
| PATCH | `/api/tax/declarations/:id/verify` | Verify declarations |
| GET | `/api/tax/sections` | Get tax sections |
| GET | `/api/tax/estimate/:employeeId` | Estimate tax |

### Reimbursements

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reimbursements/:employeeId` | Get reimbursements |
| POST | `/api/reimbursements` | Submit reimbursement |
| PATCH | `/api/reimbursements/:id/status` | Approve/reject |
| GET | `/api/reimbursements/:employeeId/summary` | Get summary |

### Salary Advance

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payroll/advance` | Request advance |
| GET | `/api/payroll/advance/:employeeId` | Get advances |
| PATCH | `/api/payroll/advance/:id/approve` | Approve/reject |

## Models

### PayrollRun
- `month` - Month (1-12)
- `year` - Year
- `status` - draft | processing | completed | failed | cancelled
- `totalEmployees` - Number of employees
- `totalAmount` - Total payroll amount
- `processedEmployees` - Successfully processed
- `failedEmployees` - Failed processing

### Payslip
- `employeeId` - Employee identifier
- `month/year` - Pay period
- `earnings` - Basic, HRA, allowances
- `deductions` - PF, ESIC, PT, TDS
- `netSalary` - Take-home pay

### TaxDeclaration
- `fiscalYear` - e.g., "2024-25"
- `declarations` - Array of section declarations
- `totalDeclared` - Total claimed amount
- `totalVerified` - HR verified amount

### Reimbursement
- `type` - travel, medical, meal, phone, internet, equipment, training, other
- `amount` - Reimbursement amount
- `status` - pending | approved | rejected | paid

## Tax Sections

| Section | Description | Max Amount |
|---------|-------------|------------|
| 80C | Life Insurance, PPF, ELSS | 150,000 |
| 80D | Health Insurance | 25,000 |
| 80CCD1 | NPS Contribution | 50,000 |
| HRA | House Rent Allowance | Based on actual |
| 80TTA | Savings Interest | 10,000 |

## Tax Calculation (New Regime FY 2024-25)

| Income Slab | Tax Rate |
|-------------|----------|
| 0 - 3L | 0% |
| 3L - 7L | 5% |
| 7L - 10L | 10% |
| 10L - 12L | 15% |
| 12L - 15L | 20% |
| 15L+ | 30% |

## Default Deductions

- Standard Deduction: 75,000
- Professional Tax: 200 (if gross > 15,000)
- PF: 12% of basic (max 1,800)
- ESIC: 0.75% (if gross <= 21,000)

## Authentication

The service supports:
- **Tenant Isolation** via `X-Tenant-ID` header
- **Internal Service Auth** via `X-Internal-Token` header

## Project Structure

```
payroll-service/
├── src/
│   ├── config/         # Configuration
│   ├── middleware/     # Express middleware
│   ├── models/         # MongoDB models
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   ├── types/          # TypeScript types
│   ├── utils/          # Utilities
│   ├── validators/      # Zod schemas
│   └── index.ts        # Entry point
├── tests/              # Jest tests
├── package.json
└── tsconfig.json
```

## License

Internal - CorpPerks/RTNM Group
