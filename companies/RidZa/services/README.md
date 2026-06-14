# RidZa Services

**Product:** Shared Services  
**Company:** RidZa  
**Version:** 1.0.0  
**Port:** 5200

---

## Overview

Shared services including credit applications, insurance management, and service-to-service communication via hub client.

---

## Services

### 1. Credit Service

Credit application processing, eligibility calculation, EMI calculation, and loan disbursement.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/credit/apply` | POST | Submit credit application |
| `/api/credit/:customerId` | GET | Get credit profile |
| `/api/credit/:id/approve` | POST | Approve application |
| `/api/credit/:id/disburse` | POST | Disburse loan |
| `/api/credit/emi` | POST | Calculate EMI |
| `/api/credit/score/:customerId` | GET | Get credit score |

### 2. Insurance Service

Insurance quotes, policy management, and claims processing.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/insurance/quote` | POST | Get insurance quote |
| `/api/insurance/policy` | POST | Purchase policy |
| `/api/insurance/claim` | POST | File a claim |
| `/api/insurance/claim/:id` | GET | Check claim status |

### 3. Hub Client

Service-to-service communication integration.

---

## Quick Start

```bash
npm install
npm start
```

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| PORT | Service port (default: 5200) |
| SERVICE_API_KEY | API key for authentication |
| NODE_ENV | Environment |

---

**Last Updated:** 2026-06-12
