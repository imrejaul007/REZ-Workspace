# CLAUDE.md - Finance Accountant

## Project Overview

**Name:** Finance Accountant  
**Company:** RidZa  
**Type:** AI-Powered Accounting Service  
**Port:** 3000  
**Tagline:** Invoice → Ledger → Tally

## Product Description

HOJAI Finance Accountant AI is an intelligent accounting service that handles invoice management, ledger operations, and Tally integration. It provides multi-tenant support with comprehensive audit trails.

## Tech Stack

- **Runtime:** Node.js 20+
- **Framework:** Express.js
- **Language:** TypeScript (strict mode)
- **Database:** MongoDB with Mongoose
- **Cache:** Redis
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
| REDIS_URL | No | redis://localhost:6379 | Redis connection |

## API Endpoints

### Invoice Management
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/invoice` | POST | Create new invoice |
| `/api/invoice/:tenantId` | GET | List invoices by tenant |
| `/api/invoice/:tenantId/:invoiceId` | GET | Get single invoice |
| `/api/invoice/:tenantId/:invoiceId/status` | PATCH | Update invoice status |

### Ledger Operations
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ledger` | POST | Create ledger entry |
| `/api/ledger/:tenantId/:ledger` | GET | Get ledger entries |
| `/api/ledger/:tenantId/:ledger/summary` | GET | Get balance summary |

### Tally Integration
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/tally/export/:tenantId` | GET | Export to Tally XML |
| `/api/tally/sync/:tenantId` | POST | Sync invoices to ledger |
| `/api/tally/sync/:tenantId/status` | GET | Check sync progress |

### Health Checks
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Full health check |
| `/health/live` | GET | Liveness probe |
| `/health/ready` | GET | Readiness probe |

## Invoice Types
- `sales` - Sales invoice
- `purchase` - Purchase invoice
- `credit` - Credit note
- `debit` - Debit note

## Invoice Statuses
- `draft` - Invoice created but not sent
- `pending` - Invoice sent, awaiting payment
- `paid` - Payment received
- `cancelled` - Invoice cancelled

## Integration

### RABTUL Services
| Service | Port | Purpose |
|---------|------|---------|
| RABTUL Auth | 4002 | JWT verification |
| RABTUL Payment | 4001 | Payment processing |
| RABTUL Wallet | 4004 | Balance management |
| RABTUL Notification | 4005 | Notifications |

### Environment Variables for Integration
```
RABTUL_AUTH_URL=http://localhost:4002
RABTUL_PAYMENT_URL=http://localhost:4001
RABTUL_WALLET_URL=http://localhost:4004
RABTUL_NOTIFICATION_URL=http://localhost:4005
INTERNAL_SERVICE_TOKEN=your_token_here
```

## Features Checklist

- [x] Multi-tenant isolation
- [x] Invoice CRUD operations
- [x] Invoice items with tax
- [x] Multiple invoice types
- [x] Ledger double-entry
- [x] Tally XML export
- [x] Invoice-to-ledger sync
- [x] Date range filtering
- [x] Pagination support
- [x] JWT authentication
- [x] Input validation (Zod)
- [x] Error handling middleware
- [x] Request logging (Morgan)
- [x] Graceful shutdown
- [x] Docker support
- [x] Health check endpoints
- [x] Rate limiting

## Project Structure

```
finance-accountant/
├── src/
│   ├── index.ts           # Main entry point
│   ├── config/            # Configuration
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── middleware/        # Express middleware
│   ├── services/          # Business logic
│   ├── integrations/      # External service clients
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