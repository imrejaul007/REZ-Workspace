# LEDGERAI - Claude Code Context

**Version:** 1.0.0  
**Date:** June 6, 2026  
**Status:** Production Ready  
**Port:** 4815

---

## Quick Reference

| Item | Value |
|------|-------|
| **Service** | LEDGERAI - Accounting AI Operating System |
| **Company** | HOJAI-AI |
| **Industry** | Accounting / Finance |
| **Port** | 4815 |
| **Tech Stack** | Express, MongoDB, TypeScript |
| **AI Agents** | AI Accountant, CFO Agent, Invoice Agent, Expense Analyst, Budget Advisor |

---

## Project Structure

```
ledgerai/
├── src/
│   ├── config/           # Configuration (port, mongodb, jwt)
│   ├── middleware/       # Auth, validation, security, logging, rate limiting
│   ├── models/           # MongoDB schemas (User, Account, Transaction, Invoice, Budget, Payment, AuditLog)
│   ├── routes/           # REST API endpoints
│   │   ├── ai/          # AI agent endpoints
│   │   ├── accounts.ts  # Chart of accounts
│   │   ├── transactions.ts # Double-entry bookkeeping
│   │   ├── invoices.ts  # Invoice management
│   │   ├── budgets.ts    # Budget tracking
│   │   ├── analytics.ts  # Dashboard & reporting
│   │   ├── auth.ts       # Authentication
│   │   └── health.ts     # Health checks
│   ├── services/         # AI agent implementations
│   │   ├── aiAccountant.ts  # Transaction categorization & reconciliation
│   │   ├── aiCFO.ts         # Financial analysis & forecasting
│   │   ├── aiInvoice.ts     # Invoice management & reminders
│   │   ├── expenseAnalyst.ts # Expense tracking & analysis
│   │   └── budgetAdvisor.ts  # Budget planning & optimization
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Helpers (webhook, health)
│   └── index.ts         # Main entry point
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

---

## Key Concepts

### Account Types
- **Asset** - Cash, Bank, Accounts Receivable, Inventory, Equipment
- **Liability** - Accounts Payable, Credit Card, Loans, Taxes
- **Equity** - Owner Equity, Retained Earnings
- **Revenue** - Sales, Service Revenue, Interest Income
- **Expense** - COGS, Operating Expenses, Utilities, Salaries

### Double-Entry Bookkeeping
Every transaction must have:
- Debits = Credits
- At least 2 accounts
- Automatic balance updates

### AI Agents

#### AI Accountant
- Categorizes transactions based on description
- Reconciles transactions
- Bulk categorization
- Pattern matching for expense categories

#### CFO Agent
- Financial analysis (balance sheet, P&L)
- Cash flow analysis
- Financial ratios calculation
- Revenue/expense forecasting
- Budget variance analysis

#### Invoice Agent
- Creates and manages invoices
- Generates payment reminders
- Collection action recommendations
- Performance analytics
- Overdue status tracking

#### Expense Analyst
- Expense analysis and categorization
- Anomaly detection in spending
- Savings opportunity identification
- Budget comparison
- Recurring expense tracking
- Period-over-period comparison

#### Budget Advisor
- Budget recommendation generation
- Budget forecasting
- Performance analysis
- Seasonal adjustment
- Trend analysis
- Reallocation suggestions

---

## Common Tasks

### Add a new account type
Edit `/src/models/index.ts` - add to `AccountType` union type and `AccountCategory` union type.

### Add a new AI endpoint
1. Add route in `/src/routes/ai/index.ts`
2. Add method in appropriate service file (`/src/services/`)

### Add a new model
1. Define interface in `/src/types/index.ts`
2. Add schema in `/src/models/index.ts`
3. Export from models index

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 4815 | Server port |
| NODE_ENV | development | Environment |
| MONGODB_URI | mongodb://localhost:27017/ledgerai | Database URI |
| JWT_SECRET | ledgerai-dev-secret-key | JWT signing secret |
| JWT_EXPIRES_IN | 7d | Token expiration |
| RATE_LIMIT_WINDOW_MS | 900000 | Rate limit window |
| RATE_LIMIT_MAX_REQUESTS | 100 | Max requests per window |

---

## Testing

```bash
# Health check
curl http://localhost:4815/health

# Register user
curl -X POST http://localhost:4815/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ledgerai.com","password":"securepass123","name":"Admin"}'

# Seed default accounts
curl -X POST http://localhost:4815/api/accounts/seed \
  -H "Authorization: Bearer <token>"

# Create transaction
curl -X POST http://localhost:4815/api/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"date":"2026-01-15","description":"Office supplies","accounts":[...],"amount":500,"category":"Supplies"}'
```

---

## Integration

LEDGERAI integrates with:
- **HOJAI Enterprise Brain** (port 4600) - Cross-service intelligence
- **RABTUL Technologies** - Auth, Wallet, Payment
- **REZ Intelligence** - Mind, Intent Graph
- **Webhook Service** - Event notifications

---

## Security

- JWT Authentication required for all API routes except /health, /ready, /api/auth/*
- Role-based authorization (admin, accountant, user)
- Rate limiting (100 req/15min default, 5 auth attempts/15min)
- Helmet security headers
- Zod input validation
- CORS protection

---

## Database Indexes

Key indexes for performance:
- Account: `code` (unique), `type`, `category`, `isActive`
- Transaction: `date`, `category`, `reconciled`, compound indexes
- Invoice: `invoiceNumber` (unique), `customerId`, `status`, `dueDate`
- Budget: `period`, `category`, `startDate/endDate`

---

**Last Updated:** June 6, 2026