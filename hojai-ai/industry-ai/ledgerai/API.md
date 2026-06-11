# LEDGERAI - API Reference

**Version:** 1.0.0  
**Base URL:** `http://localhost:4815`  
**Authentication:** Bearer Token (JWT)

---

## Table of Contents

1. [Authentication](#authentication)
2. [Accounts](#accounts)
3. [Transactions](#transactions)
4. [Invoices](#invoices)
5. [Budgets](#budgets)
6. [Analytics](#analytics)
7. [AI Agents](#ai-agents)
8. [Health](#health)

---

## Authentication

### Register User
```
POST /api/auth/register
```

**Request Body:**
```json
{
  "email": "admin@ledgerai.com",
  "password": "securepass123",
  "name": "Admin User",
  "role": "admin"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "admin@ledgerai.com",
      "name": "Admin User",
      "role": "admin"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Registration successful"
}
```

---

### Login
```
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "admin@ledgerai.com",
  "password": "securepass123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "admin@ledgerai.com",
      "name": "Admin User",
      "role": "admin",
      "lastLogin": "2026-06-06T10:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Login successful"
}
```

---

### Get Current User
```
GET /api/auth/me
```

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "admin@ledgerai.com",
      "name": "Admin User",
      "role": "admin",
      "isActive": true,
      "createdAt": "2026-06-06T10:00:00.000Z"
    }
  }
}
```

---

## Accounts

### List Accounts
```
GET /api/accounts
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| type | string | - | Filter by account type |
| category | string | - | Filter by category |
| isActive | boolean | - | Filter by active status |
| search | string | - | Search by name/code |
| page | number | 1 | Page number |
| limit | number | 50 | Items per page |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accounts": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Cash",
        "code": "1000",
        "type": "asset",
        "category": "cash",
        "balance": 10000,
        "isActive": true
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 25,
      "pages": 1
    },
    "typeTotals": {
      "asset": { "balance": 50000, "count": 5 },
      "liability": { "balance": 20000, "count": 3 }
    }
  }
}
```

---

### Create Account
```
POST /api/accounts
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Office Equipment",
  "code": "1500",
  "type": "asset",
  "category": "equipment",
  "balance": 0,
  "description": "Office furniture and equipment"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "account": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Office Equipment",
      "code": "1500",
      "type": "asset",
      "category": "equipment",
      "balance": 0,
      "isActive": true
    }
  },
  "message": "Account created successfully"
}
```

---

### Seed Default Accounts
```
POST /api/accounts/seed
```

**Headers:** `Authorization: Bearer <token>` (Admin only)

**Response (201):**
```json
{
  "success": true,
  "data": { "count": 24 },
  "message": "Default accounts created successfully"
}
```

---

## Transactions

### List Transactions
```
GET /api/transactions
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| category | string | Filter by category |
| reconciled | boolean | Filter by reconciliation status |
| startDate | ISO date | Start of date range |
| endDate | ISO date | End of date range |
| minAmount | number | Minimum amount |
| maxAmount | number | Maximum amount |
| page | number | Page number |
| limit | number | Items per page |
| sortBy | string | Sort field (date, amount) |
| sortOrder | asc/desc | Sort order |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "date": "2026-06-01T00:00:00.000Z",
        "description": "Office supplies purchase",
        "accounts": [
          { "accountCode": "5600", "accountName": "Supplies", "debit": 500, "credit": 0 },
          { "accountCode": "1000", "accountName": "Cash", "debit": 0, "credit": 500 }
        ],
        "amount": 500,
        "category": "Supplies",
        "reconciled": false
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 100,
      "pages": 2
    },
    "summary": {
      "totalAmount": 50000,
      "count": 100
    }
  }
}
```

---

### Create Transaction
```
POST /api/transactions
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "date": "2026-06-06",
  "description": "Monthly rent payment",
  "accounts": [
    { "accountId": "507f1f77bcf86cd799439014", "debit": 5000, "credit": 0 },
    { "accountId": "507f1f77bcf86cd799439015", "debit": 0, "credit": 5000 }
  ],
  "amount": 5000,
  "category": "Rent",
  "reference": "RENT-2026-06"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "transaction": {
      "_id": "507f1f77bcf86cd799439016",
      "date": "2026-06-06T00:00:00.000Z",
      "description": "Monthly rent payment",
      "amount": 5000,
      "category": "Rent",
      "reconciled": false
    }
  },
  "message": "Transaction created successfully"
}
```

---

### Reconcile Transaction
```
POST /api/transactions/:id/reconcile
```

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "transaction": {
      "_id": "507f1f77bcf86cd799439016",
      "reconciled": true,
      "reconciledAt": "2026-06-06T10:00:00.000Z"
    }
  },
  "message": "Transaction reconciled successfully"
}
```

---

## Invoices

### List Invoices
```
GET /api/invoices
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | Filter by status |
| customerId | string | Filter by customer |
| startDate | ISO date | Start date range |
| endDate | ISO date | End date range |
| search | string | Search invoice number/customer |
| page | number | Page number |
| limit | number | Items per page |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "invoices": [
      {
        "_id": "507f1f77bcf86cd799439017",
        "invoiceNumber": "INV-2026-00001",
        "customerName": "Acme Corp",
        "total": 10000,
        "amountPaid": 5000,
        "status": "partial",
        "dueDate": "2026-06-30T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 25,
      "pages": 1
    },
    "summary": {
      "byStatus": {
        "draft": { "count": 5, "total": 25000 },
        "sent": { "count": 10, "total": 50000 }
      },
      "totals": {
        "totalInvoiced": 100000,
        "totalPaid": 60000,
        "totalOutstanding": 40000
      }
    }
  }
}
```

---

### Create Invoice
```
POST /api/invoices
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "customerId": "CUST-001",
  "customerName": "Acme Corp",
  "customerEmail": "billing@acme.com",
  "items": [
    {
      "description": "Consulting Services",
      "quantity": 10,
      "rate": 1000,
      "taxRate": 18
    }
  ],
  "taxRate": 18,
  "discount": 0,
  "dueDate": "2026-06-30",
  "notes": "Thank you for your business",
  "terms": "Payment due within 30 days"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "invoice": {
      "_id": "507f1f77bcf86cd799439018",
      "invoiceNumber": "INV-2026-00002",
      "customerName": "Acme Corp",
      "items": [...],
      "subtotal": 10000,
      "taxAmount": 1800,
      "total": 11800,
      "status": "draft",
      "dueDate": "2026-06-30T00:00:00.000Z"
    }
  },
  "message": "Invoice created successfully"
}
```

---

### Record Payment
```
PATCH /api/invoices/:id/pay
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "amount": 5900,
  "paymentMethod": "bank_transfer",
  "reference": "UTR-123456789",
  "notes": "Full payment received"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "invoice": {
      "_id": "507f1f77bcf86cd799439018",
      "amountPaid": 5900,
      "status": "paid",
      "paidDate": "2026-06-06T10:00:00.000Z"
    },
    "payment": {
      "_id": "507f1f77bcf86cd799439019",
      "amount": 5900,
      "paymentMethod": "bank_transfer"
    },
    "outstandingAmount": 0
  },
  "message": "Payment recorded successfully"
}
```

---

## Budgets

### List Budgets
```
GET /api/budgets
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| category | string | Filter by category |
| period | string | daily/weekly/monthly/quarterly/yearly |
| isActive | boolean | Filter by active status |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "budgets": [
      {
        "_id": "507f1f77bcf86cd799439020",
        "category": "Marketing",
        "period": "monthly",
        "startDate": "2026-06-01T00:00:00.000Z",
        "endDate": "2026-06-30T00:00:00.000Z",
        "budgeted": 10000,
        "actual": 7500,
        "variance": -2500,
        "variancePercentage": -25
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 5,
      "pages": 1
    }
  }
}
```

---

### Create Budget
```
POST /api/budgets
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "category": "Marketing",
  "period": "monthly",
  "startDate": "2026-07-01",
  "endDate": "2026-07-31",
  "budgeted": 15000
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "budget": {
      "_id": "507f1f77bcf86cd799439021",
      "category": "Marketing",
      "period": "monthly",
      "budgeted": 15000,
      "actual": 0,
      "variance": -15000,
      "variancePercentage": -100
    }
  },
  "message": "Budget created successfully"
}
```

---

## Analytics

### Dashboard
```
GET /api/analytics/dashboard
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| period | string | month | week/month/quarter/year |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalAssets": 100000,
      "totalLiabilities": 30000,
      "netAssets": 70000,
      "cashBalance": 25000,
      "netIncome": 15000
    },
    "transactions": {
      "currentPeriod": { "total": 50000, "count": 25, "reconciled": 20 },
      "previousPeriod": { "total": 45000, "count": 22 },
      "growth": 11.1,
      "topCategories": [...]
    },
    "invoices": {
      "totalInvoiced": 80000,
      "totalPaid": 60000,
      "totalOutstanding": 20000,
      "count": 15,
      "overdue": 3
    },
    "budgets": [...],
    "recentTransactions": [...],
    "upcomingInvoices": [...],
    "overdueInvoices": [...]
  }
}
```

---

### Cash Flow Analysis
```
GET /api/analytics/cash-flow
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| startDate | ISO date | Start of period |
| endDate | ISO date | End of period |
| groupBy | string | day/week/month/year |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "period": { "start": "2026-01-01", "end": "2026-06-30", "groupBy": "month" },
    "timeline": [
      { "period": "2026-01", "operating": 10000, "investing": -2000, "financing": 0, "total": 8000 }
    ],
    "summary": {
      "operating": 60000,
      "investing": -10000,
      "financing": 5000,
      "netCashFlow": 55000
    }
  }
}
```

---

## AI Agents

### Get AI Status
```
GET /ai/status
```

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "agents": {
      "accountant": {
        "name": "AI Accountant",
        "role": "Transaction categorization and reconciliation",
        "status": "idle",
        "capabilities": ["Transaction categorization", "Transaction reconciliation"]
      },
      "cfo": {
        "name": "CFO Agent",
        "role": "Financial analysis, forecasting, and strategic insights",
        "status": "idle",
        "capabilities": ["Financial analysis and reporting", "Cash flow analysis"]
      },
      "invoice": {
        "name": "Invoice Agent",
        "role": "Invoice management, reminders, and collections",
        "status": "idle",
        "capabilities": ["Invoice creation and management", "Payment reminder generation"]
      }
    },
    "system": {
      "health": 100,
      "allAgentsActive": true,
      "timestamp": "2026-06-06T10:00:00.000Z"
    }
  }
}
```

---

### AI Categorize Transaction
```
POST /api/ai/accountant/categorize
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "description": "Monthly rent payment for office space",
  "amount": 5000
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "originalDescription": "Monthly rent payment for office space",
    "suggestedCategory": "Operating Expenses",
    "confidence": 0.85,
    "reasoning": "Matched keyword 'rent' in description",
    "suggestedAccounts": ["5400 - Rent", "5500 - Rent Expense"]
  }
}
```

---

### AI Financial Analysis
```
GET /api/ai/cfo/analyze
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| startDate | ISO date | Start of analysis period |
| endDate | ISO date | End of analysis period |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalAssets": 100000,
      "totalLiabilities": 30000,
      "totalEquity": 70000,
      "totalRevenue": 80000,
      "totalExpenses": 65000,
      "netIncome": 15000
    },
    "cashFlow": {
      "operatingCashFlow": 20000,
      "investingCashFlow": -5000,
      "financingCashFlow": 0,
      "netCashFlow": 15000,
      "cashBalance": 25000
    },
    "ratios": {
      "currentRatio": 2.5,
      "quickRatio": 2.2,
      "debtToEquity": 0.43,
      "grossMargin": 18.75,
      "netMargin": 18.75,
      "roe": 21.43,
      "interpretation": "Strong liquidity position..."
    },
    "trends": [
      { "category": "Revenue", "growth": 15000 }
    ]
  }
}
```

---

### AI Financial Forecast
```
GET /api/ai/cfo/forecast
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| months | number | 3 | Number of months to forecast (1-12) |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "forecasts": [
      {
        "period": "2026-07",
        "predictedRevenue": 75000,
        "predictedExpenses": 60000,
        "predictedNetIncome": 15000,
        "confidence": 0.85,
        "trend": "stable",
        "factors": ["Moderate growth trajectory", "Off-season period expected"]
      }
    ],
    "summary": {
      "period": "next 3 month(s)",
      "predictedTotalRevenue": 225000,
      "predictedTotalExpenses": 180000,
      "predictedNetIncome": 45000,
      "avgConfidence": 0.85
    }
  }
}
```

---

### AI Payment Reminders
```
GET /api/ai/invoice/reminders
```

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "reminders": [
      {
        "invoiceId": "507f1f77bcf86cd799439022",
        "invoiceNumber": "INV-2026-00001",
        "customerName": "Acme Corp",
        "amount": 5000,
        "dueDate": "2026-06-01T00:00:00.000Z",
        "daysOverdue": 5,
        "urgency": "medium",
        "message": "Invoice is 5 days overdue. Payment reminder."
      }
    ],
    "byUrgency": {
      "critical": 1,
      "high": 2,
      "medium": 3,
      "low": 0
    },
    "summary": {
      "totalReminders": 6,
      "totalOutstandingAmount": 25000
    }
  }
}
```

---

### AI Collection Actions
```
GET /api/ai/invoice/collection-actions
```

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "actions": [
      {
        "invoiceId": "507f1f77bcf86cd799439022",
        "invoiceNumber": "INV-2026-00001",
        "customerName": "Acme Corp",
        "amount": 5000,
        "recommendedAction": "phone_call",
        "priority": 2,
        "notes": ["Make direct phone call to customer", "Document conversation outcome"]
      }
    ],
    "summary": {
      "totalActions": 3,
      "totalAtRiskAmount": 15000,
      "priorityBreakdown": {
        "email": 1,
        "phone": 1,
        "finalNotice": 1
      }
    }
  }
}
```

---

## Health

### Liveness Check
```
GET /health
```

**Response (200):**
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2026-06-06T10:00:00.000Z",
  "service": "LEDGERAI",
  "version": "1.0.0"
}
```

---

### Readiness Check
```
GET /ready
```

**Response (200):**
```json
{
  "success": true,
  "status": "ready",
  "timestamp": "2026-06-06T10:00:00.000Z",
  "message": "Server is ready to accept traffic"
}
```

---

### Detailed Health
```
GET /api/health/detailed
```

**Headers:** `Authorization: Bearer <token>` (Admin only)

**Response (200):**
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2026-06-06T10:00:00.000Z",
  "uptime": 3600,
  "version": "1.0.0",
  "environment": "production",
  "components": [
    { "name": "MongoDB", "status": "up", "latency": 5 }
  ],
  "system": {
    "memory": { "total": 8, "free": 4, "used": 4, "percentage": 50 },
    "cpu": { "cores": 4, "load": [1.5, 1.2, 0.8] },
    "process": { "pid": 1234, "uptime": 3600 }
  }
}
```

---

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "error": "Human-readable error message",
  "code": "ERROR_CODE"
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| NO_AUTH_HEADER | 401 | Missing authorization header |
| INVALID_TOKEN | 401 | JWT token invalid or expired |
| TOKEN_EXPIRED | 401 | JWT token has expired |
| INSUFFICIENT_PERMISSIONS | 403 | User role not authorized |
| NOT_FOUND | 404 | Resource not found |
| VALIDATION_ERROR | 400 | Request validation failed |
| IMBALANCED_ENTRY | 400 | Debits != Credits in transaction |
| CODE_EXISTS | 400 | Account code already exists |
| RATE_LIMIT_EXCEEDED | 429 | Too many requests |

---

## Rate Limits

| Endpoint Group | Limit | Window |
|---------------|-------|--------|
| General API | 100 requests | 15 minutes |
| Authentication | 5 requests | 15 minutes |
| AI Endpoints | 20 requests | 1 minute |
| Write Operations | 30 requests | 1 minute |

---

**Last Updated:** June 6, 2026