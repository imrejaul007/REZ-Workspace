# LEDGERAI - Source of Truth

**Version:** 1.0.0  
**Date:** June 6, 2026  
**Status:** Production Ready  
**Port:** 4815

---

## Service Overview

| Property | Value |
|----------|-------|
| **Service Name** | LEDGERAI |
| **Full Name** | Accounting AI Operating System |
| **Company** | HOJAI-AI |
| **Industry** | Accounting / Finance |
| **Port** | 4815 |
| **Type** | REST API Backend |
| **Tech Stack** | Node.js, Express, MongoDB, TypeScript |
| **AI Framework** | Custom pattern matching + LLM-ready |

---

## Core Functionality

### Primary Purpose
AI-powered accounting operating system that provides:
- Double-entry bookkeeping
- Automated transaction categorization
- Financial analysis and forecasting
- Invoice management with reminders
- Budget tracking and variance analysis
- Dashboard analytics

### Target Users
- Small to medium businesses
- Accountants and bookkeepers
- CFO and finance teams
- Business owners

---

## AI Agents

### 1. AI Accountant Agent
**File:** `src/services/aiAccountant.ts`

| Capability | Description |
|------------|-------------|
| Transaction Categorization | Analyzes description + amount to suggest category |
| Reconciliation | Matches and reconciles transactions |
| Bulk Categorization | Processes multiple transactions at once |
| Pattern Matching | 11 expense categories with keyword patterns |

**Categories Supported:**
- Revenue
- Cost of Sales
- Operating Expenses
- Travel & Entertainment
- Marketing
- Professional Services
- Equipment
- Taxes
- Insurance
- Utilities
- Bank Fees

### 2. CFO Agent
**File:** `src/services/aiCFO.ts`

| Capability | Description |
|------------|-------------|
| Financial Analysis | Balance sheet, P&L, equity calculation |
| Cash Flow Analysis | Operating, investing, financing flows |
| Ratio Analysis | Current ratio, quick ratio, debt-to-equity, margins |
| Forecasting | 1-12 month revenue/expense predictions |
| Budget Analysis | Variance tracking and recommendations |

**Financial Ratios Calculated:**
- Current Ratio (current assets / current liabilities)
- Quick Ratio (exclude inventory)
- Debt to Equity Ratio
- Gross Margin %
- Net Margin %
- Return on Equity (ROE)

### 3. Invoice Agent
**File:** `src/services/aiInvoice.ts`

| Capability | Description |
|------------|-------------|
| Invoice Creation | Full invoice lifecycle management |
| Payment Reminders | Urgency-based reminder generation |
| Collection Actions | Email, phone, notice, escalate, write-off |
| Performance Analytics | Collection rate, days to pay, at-risk amounts |
| Overdue Tracking | Automatic status updates |

**Reminder Thresholds:**
- Low: 3 days before due
- Medium: 1-7 days overdue
- High: 8-14 days overdue
- Critical: 15+ days overdue

---

## Data Models

### User
```typescript
{
  email: string (unique)
  password: string (hashed)
  name: string
  role: 'admin' | 'accountant' | 'user'
  isActive: boolean
  lastLogin?: Date
}
```

### Account
```typescript
{
  name: string
  code: string (unique, uppercase)
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
  category: AccountCategory
  balance: number
  description?: string
  parentId?: ObjectId
  isActive: boolean
}
```

### Transaction
```typescript
{
  date: Date
  description: string
  accounts: [{
    accountId: ObjectId
    accountCode: string
    accountName: string
    debit: number
    credit: number
  }]
  amount: number
  category: string
  subcategory?: string
  reference?: string
  reconciled: boolean
  reconciledAt?: Date
  reconciledBy?: ObjectId
  notes?: string
}
```

### Invoice
```typescript
{
  invoiceNumber: string (unique)
  customerId: string
  customerName: string
  customerEmail?: string
  customerAddress?: string
  customerPhone?: string
  items: [{
    id: string
    description: string
    quantity: number
    rate: number
    amount: number
    taxRate?: number
    taxAmount?: number
  }]
  subtotal: number
  taxRate: number
  taxAmount: number
  discount: number
  total: number
  amountPaid: number
  status: InvoiceStatus
  dueDate: Date
  issueDate: Date
  paidDate?: Date
  notes?: string
  terms?: string
}
```

### Budget
```typescript
{
  category: string
  subcategory?: string
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  startDate: Date
  endDate: Date
  budgeted: number
  actual: number
  variance: number
  variancePercentage: number
  isActive: boolean
}
```

### Payment
```typescript
{
  invoiceId: ObjectId
  amount: number
  paymentMethod: 'cash' | 'check' | 'bank_transfer' | 'credit_card' | 'other'
  reference?: string
  notes?: string
  processedBy: ObjectId
}
```

### AuditLog
```typescript
{
  userId?: ObjectId
  action: string
  entityType: string
  entityId?: ObjectId
  details?: Record
  ipAddress?: string
  userAgent?: string
}
```

---

## API Endpoints

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/register | No | Register new user |
| POST | /api/auth/login | No | User login |
| GET | /api/auth/me | Yes | Get current user |
| POST | /api/auth/change-password | Yes | Change password |
| GET | /api/auth/users | Admin | List users |
| PATCH | /api/auth/users/:id | Admin | Update user |
| DELETE | /api/auth/users/:id | Admin | Delete user |
| GET | /api/auth/audit-log | Admin | Get audit logs |

### Accounts
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/accounts | Yes | List accounts |
| POST | /api/accounts | Accountant+ | Create account |
| GET | /api/accounts/:id | Yes | Get account |
| PATCH | /api/accounts/:id | Accountant+ | Update account |
| DELETE | /api/accounts/:id | Admin | Delete account |
| GET | /api/accounts/type/:type | Yes | Get by type |
| POST | /api/accounts/seed | Admin | Seed defaults |

### Transactions
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/transactions | Yes | List transactions |
| POST | /api/transactions | Accountant+ | Create transaction |
| GET | /api/transactions/:id | Yes | Get transaction |
| PATCH | /api/transactions/:id | Accountant+ | Update transaction |
| POST | /api/transactions/:id/reconcile | Accountant+ | Reconcile |
| POST | /api/transactions/:id/unreconcile | Accountant+ | Unreconcile |
| DELETE | /api/transactions/:id | Admin | Delete transaction |
| GET | /api/transactions/categories/list | Yes | List categories |
| POST | /api/transactions/bulk | Accountant+ | Bulk create |

### Invoices
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/invoices | Yes | List invoices |
| POST | /api/invoices | Accountant+ | Create invoice |
| GET | /api/invoices/:id | Yes | Get invoice |
| PATCH | /api/invoices/:id | Accountant+ | Update invoice |
| PATCH | /api/invoices/:id/pay | Accountant+ | Record payment |
| POST | /api/invoices/:id/send | Accountant+ | Mark sent |
| POST | /api/invoices/:id/cancel | Admin | Cancel invoice |
| GET | /api/invoices/customer/:customerId | Yes | By customer |
| GET | /api/invoices/overdue/list | Yes | Overdue list |
| DELETE | /api/invoices/:id | Admin | Delete draft |

### Budgets
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/budgets | Yes | List budgets |
| POST | /api/budgets | Accountant+ | Create budget |
| GET | /api/budgets/:id | Yes | Get budget |
| PATCH | /api/budgets/:id | Accountant+ | Update budget |
| POST | /api/budgets/:id/refresh | Accountant+ | Refresh actual |
| DELETE | /api/budgets/:id | Admin | Delete budget |
| GET | /api/budgets/summary/overview | Yes | Budget overview |

### Analytics
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/analytics/dashboard | Yes | Main dashboard |
| GET | /api/analytics/cash-flow | Yes | Cash flow analysis |
| GET | /api/analytics/revenue-expenses | Yes | Revenue vs expenses |
| GET | /api/analytics/invoice-summary | Yes | Invoice analytics |
| GET | /api/analytics/accounts-summary | Yes | Account balances |
| GET | /api/analytics/trends | Yes | Trend analysis |

### AI
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /ai/status | Yes | AI agents status |
| POST | /api/ai/accountant/categorize | Yes | Categorize transaction |
| POST | /api/ai/accountant/reconcile | Accountant+ | Reconcile transactions |
| POST | /api/ai/accountant/bulk-categorize | Accountant+ | Bulk categorize |
| GET | /api/ai/cfo/analyze | Yes | Financial analysis |
| GET | /api/ai/cfo/forecast | Yes | Financial forecast |
| GET | /api/ai/cfo/budget-analysis | Yes | Budget analysis |
| POST | /api/ai/invoice/create | Accountant+ | Create invoice |
| GET | /api/ai/invoice/reminders | Yes | Payment reminders |
| GET | /api/ai/invoice/collection-actions | Yes | Collection recommendations |
| GET | /api/ai/invoice/performance | Yes | Invoice performance |
| POST | /api/ai/invoice/update-overdue | Accountant+ | Update overdue |

### Health
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /health | No | Liveness check |
| GET | /ready | No | Readiness check |
| GET | /api/health | Yes | Basic health |
| GET | /api/health/detailed | Admin | Detailed health |
| GET | /api/health/ping | No | Ping |

---

## Configuration

### Environment Variables
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| PORT | No | 4815 | Server port |
| NODE_ENV | No | development | Environment |
| MONGODB_URI | Yes | - | MongoDB connection string |
| JWT_SECRET | No | dev-secret | JWT signing secret |
| JWT_EXPIRES_IN | No | 7d | Token expiration |
| RATE_LIMIT_WINDOW_MS | No | 900000 | Rate limit window (15min) |
| RATE_LIMIT_MAX_REQUESTS | No | 100 | Max requests per window |
| AI_MODEL | No | together/mistral-7b | AI model |
| AI_API_KEY | No | - | AI API key |
| LOG_LEVEL | No | info | Logging level |
| WEBHOOK_SERVICE_URL | No | http://localhost:4090 | Webhook service |
| HOJAI_URL | No | http://localhost:4800 | HOJAI service |
| NOTIFICATION_SERVICE_URL | No | http://localhost:4095 | Notification service |
| INTERNAL_SERVICE_TOKEN | No | hoojai-dev-token | Internal auth token |

---

## Security Configuration

### CORS
Allowed origins (development):
- http://localhost:3000
- http://localhost:4815

### Rate Limits
| Endpoint | Window | Max Requests |
|----------|--------|--------------|
| General API | 15 min | 100 |
| Auth endpoints | 15 min | 5 |
| AI endpoints | 1 min | 20 |
| Write operations | 1 min | 30 |

### Helmet Security
- Content Security Policy
- XSS Protection
- Hide X-Powered-By
- Frameguard (deny)
- HSTS (1 year)
- NoSniff
- Referrer Policy

---

## Integration Points

### Outbound Webhooks
| Event | Payload |
|-------|---------|
| ledgerai.transaction.recorded | transactionId, amount, category, description |
| ledgerai.invoice.created | invoiceId, invoiceNumber, customerName, total |

### HOJAI Sync
| Entity | Actions |
|--------|---------|
| transaction | recorded |
| invoice | created |

### RABTUL Integration
- Auth (JWT validation)
- Wallet (for payment processing)
- Payment (transaction recording)

---

## Performance Considerations

### Database Indexes
Critical indexes for query performance:
- Account: `code` (unique), `type`, `category`
- Transaction: `date`, `category`, `reconciled`, compound `(date, category)`
- Invoice: `invoiceNumber` (unique), `customerId`, `status`, `dueDate`
- Budget: `period`, `category`, `(startDate, endDate)`

### Aggregation Pipelines
Used for:
- Dashboard analytics
- Cash flow analysis
- Revenue/expense trends
- Invoice status breakdown

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| NO_AUTH_HEADER | 401 | Missing authorization header |
| INVALID_TOKEN | 401 | JWT token invalid or expired |
| INSUFFICIENT_PERMISSIONS | 403 | User role not authorized |
| ACCOUNT_NOT_FOUND | 404 | Account ID not found |
| TRANSACTION_NOT_FOUND | 404 | Transaction ID not found |
| INVOICE_NOT_FOUND | 404 | Invoice ID not found |
| IMBALANCED_ENTRY | 400 | Debits != Credits |
| CODE_EXISTS | 400 | Account code already exists |
| INVOICE_PAID | 400 | Cannot modify paid invoice |
| RATE_LIMIT_EXCEEDED | 429 | Too many requests |

---

## Default Account Codes

### Assets (1000-1999)
| Code | Name |
|------|------|
| 1000 | Cash |
| 1010 | Checking Account |
| 1020 | Savings Account |
| 1100 | Accounts Receivable |
| 1200 | Inventory |
| 1500 | Equipment |
| 1600 | Accumulated Depreciation |

### Liabilities (2000-2999)
| Code | Name |
|------|------|
| 2000 | Accounts Payable |
| 2100 | Credit Card |
| 2200 | Sales Tax Payable |
| 2500 | Notes Payable |

### Equity (3000-3999)
| Code | Name |
|------|------|
| 3000 | Owner Equity |
| 3100 | Retained Earnings |

### Revenue (4000-4999)
| Code | Name |
|------|------|
| 4000 | Sales Revenue |
| 4100 | Service Revenue |
| 4200 | Interest Income |

### Expenses (5000-5999)
| Code | Name |
|------|------|
| 5000 | Cost of Goods Sold |
| 5100 | Advertising |
| 5200 | Bank Fees |
| 5300 | Insurance |
| 5400 | Rent |
| 5500 | Salaries & Wages |
| 5600 | Supplies |
| 5700 | Utilities |
| 5800 | Travel & Entertainment |
| 5900 | Professional Fees |

---

## Project Structure

```
ledgerai/
├── src/
│   ├── config/
│   │   └── index.ts          # Configuration
│   ├── middleware/
│   │   ├── auth.ts           # JWT authentication
│   │   ├── logger.ts         # Winston logging
│   │   ├── security.ts       # Helmet, CORS
│   │   ├── rateLimiter.ts    # Rate limiting
│   │   └── validation.ts      # Zod validation
│   ├── models/
│   │   └── index.ts          # MongoDB schemas
│   ├── routes/
│   │   ├── ai/
│   │   │   └── index.ts      # AI endpoints
│   │   ├── accounts.ts       # Chart of accounts
│   │   ├── transactions.ts   # Journal entries
│   │   ├── invoices.ts       # Invoice management
│   │   ├── budgets.ts        # Budget tracking
│   │   ├── analytics.ts      # Dashboard
│   │   ├── auth.ts           # Authentication
│   │   └── health.ts         # Health checks
│   ├── services/
│   │   ├── aiAccountant.ts   # AI Accountant
│   │   ├── aiCFO.ts          # CFO Agent
│   │   └── aiInvoice.ts      # Invoice Agent
│   ├── types/
│   │   └── index.ts          # TypeScript types
│   ├── utils/
│   │   ├── webhook.ts        # Webhook helpers
│   │   └── health.ts         # Health utilities
│   └── index.ts              # Main entry point
├── package.json
├── tsconfig.json
├── .env.example
├── README.md
├── CLAUDE.md
└── SOT.md
```

---

**Last Updated:** June 6, 2026
**Maintainer:** HOJAI AI Team