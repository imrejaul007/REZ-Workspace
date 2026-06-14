# Finance AI - Features

**Product:** HOJAI Finance AI  
**Company:** RidZa  
**Version:** 1.0.0  
**Port:** 3000

---

## Overview

Finance AI provides transaction analysis, predictions, and spending insights using AI-powered analytics.

### Tagline
\`Transaction Analysis & Predictions\`

---

## Core Features

### 1. Transaction Management

| Feature | Endpoint | Method | Description |
|---------|----------|--------|-------------|
| Create Transaction | \`/api/transaction\` | POST | Record new transaction |
| List Transactions | \`/api/transaction/:tenantId\` | GET | Get all transactions |
| Get Transaction | \`/api/transaction/:tenantId/:id\` | GET | Get single transaction |

#### Transaction Types
- \`income\` - Revenue received
- \`expense\` - Money spent
- \`transfer\` - Internal transfer

#### Categories
\`salary\`, \`rent\`, \`utilities\`, \`supplies\`, \`marketing\`, \`payroll\`, \`taxes\`, \`insurance\`, \`investment\`, \`loan\`, \`other\`

---

### 2. Transaction Analysis

| Feature | Endpoint | Method | Description |
|---------|----------|--------|-------------|
| Analyze Transaction | \`/api/analysis/transaction\` | POST | Analyze single transaction |
| Cashflow Prediction | \`/api/analysis/:tenantId/prediction\` | GET | Forecast cashflow |
| Spending Insights | \`/api/analysis/:tenantId/insights\` | GET | Get spending analysis |
| Dashboard | \`/api/analysis/:tenantId/dashboard\` | GET | Complete dashboard |

#### Analysis Features
- [x] Risk score calculation (0-100)
- [x] Anomaly detection (z-score based)
- [x] Pattern recognition
- [x] Cashflow forecasting
- [x] Trend analysis (up/down/stable)
- [x] Category breakdown
- [x] Spending recommendations

---

## Features Checklist

- [x] Transaction CRUD
- [x] Multi-category support
- [x] Real-time analysis
- [x] Risk scoring
- [x] Anomaly detection
- [x] Cashflow prediction
- [x] Spending insights
- [x] Dashboard endpoint
- [x] Health checks
- [x] JWT auth
- [x] Input validation
- [x] Docker support

**Last Updated:** 2026-06-12
