# CLAUDE.md - Finance AI

## Project Overview

**Name:** Finance AI  
**Company:** RidZa  
**Type:** AI Transaction Analysis & Predictions  
**Port:** 3000  
**Tagline:** Transaction Analysis & Predictions

## Product Description

HOJAI Finance AI provides real-time transaction analysis, anomaly detection, and cashflow predictions using AI-powered analytics. It helps businesses understand their spending patterns and forecast future cashflow.

## Tech Stack

- **Runtime:** Node.js 20+
- **Framework:** Express.js
- **Language:** TypeScript (strict mode)
- **Database:** MongoDB with Mongoose
- **Security:** Helmet, CORS, JWT
- **Validation:** Zod

## Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies |
| `npm run dev` | Development server with hot reload |
| `npm run build` | Build for production |
| `npm start` | Production server |

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| PORT | No | 3000 | Service port |
| NODE_ENV | No | development | Environment |
| MONGODB_URI | Yes | - | MongoDB connection string |
| JWT_SECRET | Yes | - | JWT signing secret |

## API Endpoints

### Transaction Management
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/transaction` | POST | Create new transaction |
| `/api/transaction/:tenantId` | GET | List transactions |
| `/api/transaction/:tenantId/:id` | GET | Get single transaction |

### Analytics & Insights
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/analysis/transaction` | POST | Analyze transaction |
| `/api/analysis/:tenantId/prediction` | GET | Cashflow prediction |
| `/api/analysis/:tenantId/insights` | GET | Spending insights |
| `/api/analysis/:tenantId/dashboard` | GET | Complete dashboard |

### Health Checks
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Full health check |
| `/health/live` | GET | Liveness probe |
| `/health/ready` | GET | Readiness probe |

## Transaction Types
- `income` - Revenue received
- `expense` - Money spent
- `transfer` - Internal transfer

## Transaction Categories
`salary`, `rent`, `utilities`, `supplies`, `marketing`, `payroll`, `taxes`, `insurance`, `investment`, `loan`, `other`

## Analytics Features

### Risk Scoring (0-100)
- 0-30: Low risk
- 31-60: Medium risk
- 61-100: High risk

### Trend Analysis
- `up` - Positive cashflow trend
- `down` - Negative cashflow trend
- `stable` - No significant change

## Integration

### RABTUL Services
| Service | Port | Purpose |
|---------|------|---------|
| RABTUL Auth | 4002 | JWT verification |
| RABTUL Analytics | 4016 | ML predictions |

## Features Checklist

- [x] Transaction CRUD
- [x] Multi-category support
- [x] Real-time analysis
- [x] Risk scoring (0-100)
- [x] Anomaly detection (z-score)
- [x] Cashflow prediction
- [x] Spending insights
- [x] Dashboard endpoint
- [x] Date filtering
- [x] Amount filtering
- [x] Type filtering
- [x] JWT authentication
- [x] Input validation (Zod)
- [x] Error handling middleware
- [x] Graceful shutdown
- [x] Docker support
- [x] Health check endpoints

## Project Structure

```
finance-ai/
├── src/
│   ├── index.ts           # Main entry point
│   ├── config/            # Configuration
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   ├── middleware/        # Express middleware
│   └── types/             # TypeScript types
├── package.json
├── tsconfig.json
├── Dockerfile
├── docker-compose.yml
└── .env.example
```

## Related Documentation

- [FEATURES.md](FEATURES.md) - Detailed features list
- [RTNM-COMPANIES-AUDIT.md](../RTNM-COMPANIES-AUDIT.md) - Company audit
- [RTNM-PRODUCTS-FEATURES-AUDIT.md](../RTNM-PRODUCTS-FEATURES-AUDIT.md) - Products features

---

**Last Updated:** 2026-06-12  
**Version:** 1.0.0