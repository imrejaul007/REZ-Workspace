# LEDGERAI - Accounting AI Operating System

> "Smart Finance, Smarter Decisions"

**LEDGERAI** is a production-ready AI-powered accounting operating system that combines intelligent automation, financial analysis, and comprehensive invoice management.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 📋 Features

### AI Employees

| Agent | Capabilities |
|-------|--------------|
| **AI Accountant** | Transaction categorization, reconciliation, bulk operations |
| **CFO Agent** | Financial analysis, forecasting, budget analysis |
| **Invoice Agent** | Invoice creation, payment tracking, collection management |

### Core Models

- **Account** - Chart of accounts with types, categories, and balances
- **Transaction** - Double-entry bookkeeping with reconciliation support
- **Invoice** - Complete invoicing lifecycle management
- **Budget** - Budget tracking with variance analysis

### Production Features

- ✅ MongoDB Database
- ✅ JWT Authentication
- ✅ Rate Limiting
- ✅ Helmet Security
- ✅ Winston Logging
- ✅ Zod Validation
- ✅ Health Checks
- ✅ Graceful Shutdown

## 🔌 API Endpoints

### AI Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/ai/status` | Get AI agents status |
| POST | `/api/ai/accountant/categorize` | Categorize transaction |
| POST | `/api/ai/accountant/reconcile` | Reconcile transactions |
| POST | `/api/ai/accountant/bulk-categorize` | Bulk categorize |
| GET | `/api/ai/cfo/analyze` | Financial analysis |
| GET | `/api/ai/cfo/forecast` | Financial forecast |
| GET | `/api/ai/cfo/budget-analysis` | Budget analysis |
| POST | `/api/ai/invoice/create` | Create invoice |
| GET | `/api/ai/invoice/reminders` | Get payment reminders |
| GET | `/api/ai/invoice/collection-actions` | Collection recommendations |

### Accounts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/accounts` | List all accounts |
| POST | `/api/accounts` | Create account |
| GET | `/api/accounts/:id` | Get account |
| PATCH | `/api/accounts/:id` | Update account |
| DELETE | `/api/accounts/:id` | Delete account |
| POST | `/api/accounts/seed` | Seed default accounts |

### Transactions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/transactions` | List transactions |
| POST | `/api/transactions` | Create transaction |
| GET | `/api/transactions/:id` | Get transaction |
| PATCH | `/api/transactions/:id` | Update transaction |
| POST | `/api/transactions/:id/reconcile` | Reconcile |
| POST | `/api/transactions/:id/unreconcile` | Unreconcile |
| POST | `/api/transactions/bulk` | Bulk create |

### Invoices

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/invoices` | List invoices |
| POST | `/api/invoices` | Create invoice |
| GET | `/api/invoices/:id` | Get invoice |
| PATCH | `/api/invoices/:id` | Update invoice |
| PATCH | `/api/invoices/:id/pay` | Record payment |
| POST | `/api/invoices/:id/send` | Mark as sent |
| POST | `/api/invoices/:id/cancel` | Cancel invoice |
| GET | `/api/invoices/overdue/list` | Overdue invoices |

### Budgets

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/budgets` | List budgets |
| POST | `/api/budgets` | Create budget |
| GET | `/api/budgets/:id` | Get budget |
| PATCH | `/api/budgets/:id` | Update budget |
| POST | `/api/budgets/:id/refresh` | Refresh actual |
| GET | `/api/budgets/summary/overview` | Budget overview |

### Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/dashboard` | Main dashboard |
| GET | `/api/analytics/cash-flow` | Cash flow analysis |
| GET | `/api/analytics/revenue-expenses` | Revenue vs Expenses |
| GET | `/api/analytics/invoice-summary` | Invoice analytics |
| GET | `/api/analytics/accounts-summary` | Account balances |
| GET | `/api/analytics/trends` | Trend analysis |

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/change-password` | Change password |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Basic health check |
| GET | `/ready` | Readiness check |
| GET | `/api/health/detailed` | Detailed health |

## 🔧 Configuration

Create a `.env` file from `.env.example`:

```bash
# Server Configuration
PORT=4815
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/ledgerai

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# AI Configuration
AI_MODEL=together/mistral-7b
AI_API_KEY=your-ai-api-key
```

## 🏗️ Project Structure

```
ledgerai/
├── src/
│   ├── config/           # Configuration
│   ├── middleware/       # Auth, validation, security, logging
│   ├── models/           # MongoDB models
│   ├── routes/           # API routes
│   │   ├── ai/          # AI endpoints
│   │   ├── accounts.ts
│   │   ├── transactions.ts
│   │   ├── invoices.ts
│   │   ├── budgets.ts
│   │   ├── analytics.ts
│   │   ├── auth.ts
│   │   └── health.ts
│   ├── services/         # AI agents
│   │   ├── aiAccountant.ts
│   │   ├── aiCFO.ts
│   │   └── aiInvoice.ts
│   ├── utils/           # Utilities
│   └── index.ts         # Main entry
├── package.json
├── tsconfig.json
├── start.sh
└── README.md
```

## 🔐 Authentication

Include JWT token in Authorization header:

```bash
Authorization: Bearer <your-jwt-token>
```

## 📊 Example Usage

### Register and Login

```bash
# Register
curl -X POST http://localhost:4815/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ledgerai.com","password":"securepass123","name":"Admin","role":"admin"}'

# Login
curl -X POST http://localhost:4815/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ledgerai.com","password":"securepass123"}'
```

### Create Account

```bash
curl -X POST http://localhost:4815/api/accounts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"name":"Cash","code":"1000","type":"asset","category":"cash"}'
```

### Create Transaction

```bash
curl -X POST http://localhost:4815/api/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "date":"2024-01-15",
    "description":"Office supplies purchase",
    "accounts":[
      {"accountId":"<account-id>","debit":500,"credit":0},
      {"accountId":"<account-id>","debit":0,"credit":500}
    ],
    "category":"Supplies"
  }'
```

### AI Categorize

```bash
curl -X POST http://localhost:4815/api/ai/accountant/categorize \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"description":"Monthly rent payment","amount":5000}'
```

## 🛡️ Security

- **Helmet** - Security headers (CSP, HSTS, etc.)
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - API request throttling
- **JWT** - Token-based authentication
- **Input Validation** - Zod schema validation

## 📝 License

Proprietary - HOJAI AI

## 🌐 Support

For technical support: support@hojai.ai