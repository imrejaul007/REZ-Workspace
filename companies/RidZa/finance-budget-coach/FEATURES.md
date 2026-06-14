# Finance Budget Coach - Features

**Product:** AI Budget Coach  
**Company:** RidZa  
**Version:** 1.0.0  
**Port:** 3000

---

## Overview

AI-powered budget planning, advice, and scenario simulation service.

### Tagline
\`Budget Planning & Simulation\`

---

## Core Features

### 1. Budget Management

| Feature | Endpoint | Method | Description |
|---------|----------|--------|-------------|
| List Budgets | \`/api/budgets/:tenantId\` | GET | Get all budgets |
| Create Budget | \`/api/budgets/:tenantId\` | POST | Create new budget |
| Update Budget | \`/api/budgets/:tenantId/:id\` | PUT | Update budget |
| Get Categories | \`/api/budgets/categories\` | GET | List budget categories |

---

### 2. AI Advice & Simulation

| Feature | Endpoint | Method | Description |
|---------|----------|--------|-------------|
| Get Advice | \`/api/budgets/:tenantId/advice\` | GET | AI budget recommendations |
| Simulate | \`/api/simulate/:tenantId\` | POST | Run scenario simulation |

#### Advice Features
- [x] Spending pattern analysis
- [x] Category-based recommendations
- [x] Priority-based suggestions
- [x] Action items

---

## Features Checklist

- [x] Budget CRUD operations
- [x] AI-powered advice
- [x] Scenario simulation
- [x] Spending analysis
- [x] Health checks
- [x] JWT authentication
- [x] Docker support

**Last Updated:** 2026-06-12
