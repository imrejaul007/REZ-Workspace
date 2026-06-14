# CLAUDE.md - RidZa Services

## Project Overview

**Name:** RidZa Services  
**Company:** RidZa  
**Type:** Shared Services  
**Port:** 5200  
**Tagline:** Shared Credit, Insurance & Integration Services

## Product Description

Shared services including credit applications, insurance management, and service-to-service communication via hub client.

## Tech Stack

- **Runtime:** Node.js 20+
- **Framework:** Express.js
- **Language:** TypeScript
- **Storage:** In-Memory (Maps)
- **Security:** API Key Authentication

## Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies |
| `npm start` | Start server |
| `npm run dev` | Development mode |

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| PORT | No | 5200 | Service port |
| NODE_ENV | No | development | Environment |
| SERVICE_API_KEY | Yes | - | API key for authentication |

## API Endpoints

### Credit Service
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/credit/apply` | POST | Submit credit application |
| `/api/credit/:customerId` | GET | Get credit profile |
| `/api/credit/:id/approve` | POST | Approve application |
| `/api/credit/:id/reject` | POST | Reject application |
| `/api/credit/:id/disburse` | POST | Disburse loan |
| `/api/credit/emi` | POST | Calculate EMI |
| `/api/credit/score/:customerId` | GET | Get credit score |
| `/api/credit/report/:customerId` | GET | Full credit report |

### Insurance Service
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/insurance/quote` | POST | Get insurance quote |
| `/api/insurance/policy` | POST | Purchase policy |
| `/api/insurance/claim` | POST | File a claim |
| `/api/insurance/claim/:id` | GET | Check claim status |
| `/api/insurance/policies/:customerId` | GET | List policies |

### Status
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/status` | GET | Service status |

## Credit Features

- Eligibility calculation
- Interest rate calculation
- EMI calculation
- Amortization schedule
- Credit scoring (300-900)
- Loan disbursement
- Credit rating (Excellent/Good/Fair/Poor/Very Poor)

## Insurance Types
- Life
- Health
- Car
- Home
- Travel

## Integration Points

### RABTUL Services
| Service | Port | Purpose |
|---------|------|---------|
| RABTUL Auth | 4002 | JWT verification |
| RABTUL Payment | 4001 | Payment processing |
| RABTUL Wallet | 4004 | Balance management |
| RABTUL Notification | 4005 | Notifications |

## Features Checklist

- [x] Credit application processing
- [x] Eligibility calculation
- [x] EMI calculation
- [x] Loan disbursement
- [x] Credit scoring
- [x] Insurance quotes
- [x] Policy management
- [x] Claims processing
- [x] Service integration (Hub Client)
- [x] API key authentication
- [x] Health check endpoints

## Project Structure

```
services/
├── index.ts           # Main entry point
├── creditService.ts   # Credit operations
├── insuranceService.ts # Insurance operations
├── hub-client.ts     # Service integration
├── types.ts          # TypeScript types
├── package.json
└── .env.example
```

## Related Documentation

- [FEATURES.md](FEATURES.md) - Detailed features list
- [RTNM-COMPANIES-AUDIT.md](../RTNM-COMPANIES-AUDIT.md) - Company audit
- [RTNM-PRODUCTS-FEATURES-AUDIT.md](../RTNM-PRODUCTS-FEATURES-AUDIT.md) - Products features

---

**Last Updated:** 2026-06-12  
**Version:** 1.0.0
