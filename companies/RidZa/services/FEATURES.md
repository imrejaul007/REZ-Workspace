# RidZa Services - Features

**Product:** Shared Services  
**Company:** RidZa  
**Version:** 1.0.0  
**Port:** 5200

---

## Overview

Shared services including credit, insurance, and hub client for service-to-service communication.

### Tagline
\`Shared Credit, Insurance & Integration Services\`

---

## Core Features

### 1. Credit Service

| Feature | Endpoint | Method | Description |
|---------|----------|--------|-------------|
| Apply for Credit | \`/api/credit/apply\` | POST | Submit credit application |
| Get Credit Profile | \`/api/credit/:customerId\` | GET | Get credit profile |
| Approve Application | \`/api/credit/:id/approve\` | POST | Approve credit |
| Reject Application | \`/api/credit/:id/reject\` | POST | Reject credit |
| Disburse Loan | \`/api/credit/:id/disburse\` | POST | Disburse funds |
| Calculate EMI | \`/api/credit/emi\` | POST | Calculate EMI |
| Get Credit Score | \`/api/credit/score/:customerId\` | GET | Get credit score |
| Get Credit Report | \`/api/credit/report/:customerId\` | GET | Full credit report |

#### Credit Features
- [x] Eligibility calculation
- [x] Interest rate calculation
- [x] EMI calculation
- [x] Amortization schedule
- [x] Credit scoring
- [x] Loan disbursement

---

### 2. Insurance Service

| Feature | Endpoint | Method | Description |
|---------|----------|--------|-------------|
| Get Quote | \`/api/insurance/quote\` | POST | Get insurance quote |
| Buy Policy | \`/api/insurance/policy\` | POST | Purchase policy |
| File Claim | \`/api/insurance/claim\` | POST | File a claim |
| Claim Status | \`/api/insurance/claim/:id\` | GET | Check claim status |
| Get Policies | \`/api/insurance/policies/:customerId\` | GET | List policies |

#### Insurance Types
- Life
- Health
- Car
- Home
- Travel

---

### 3. Hub Client (Service Integration)

| Feature | Method | Description |
|---------|--------|-------------|
| callViaHub | POST | Call another service via hub |
| verifyToken | POST | Verify JWT token |
| processPayment | POST | Process payment |
| addCoins | POST | Add to wallet |
| sendNotification | POST | Send notification |

---

## Features Checklist

- [x] Credit application
- [x] Eligibility check
- [x] EMI calculation
- [x] Loan disbursement
- [x] Credit scoring
- [x] Insurance quotes
- [x] Policy management
- [x] Claims processing
- [x] Service integration
- [x] Health checks
- [x] API key auth

**Last Updated:** 2026-06-12
