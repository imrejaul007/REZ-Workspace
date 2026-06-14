# Shared Budget Pool Service

**Port:** 5013  
**Company:** AdBazaar  
**Version:** 1.0.0

Shared Budget Pool is AdBazaar's centralized budget management service for agency advertising operations. It provides a unified way to manage, allocate, track, and analyze advertising budgets across multiple campaigns.

## Features

### Core Features

- **Pool Management**
  - Create budget pools with customizable settings
  - Track total budget, current balance, and reserved amounts
  - Support for multiple currencies (INR, USD, EUR)
  - Pool status management (active, inactive, frozen)

- **Budget Allocation**
  - Allocate budget to specific campaigns
  - Priority-based allocation system
  - Configurable pacing strategies (even, frontload, backload)
  - Auto-pause thresholds for budget protection

- **Spend Tracking**
  - Real-time spend recording per campaign
  - Automatic allocation depletion tracking
  - Bulk spend processing
  - Refund handling

- **Transfers**
  - Transfer budget between pools
  - Currency validation
  - Transfer history and tracking
  - Transfer validation before execution

- **Analytics**
  - Pool utilization metrics
  - Spend analytics by campaign and day
  - Transaction summaries
  - Allocation health monitoring

## Architecture

```
shared-budget-pool (Port 5013)
├── src/
│   ├── index.ts              # Express server + routes
│   ├── models/               # Mongoose schemas
│   │   ├── BudgetPool.ts     # Pool model
│   │   ├── Allocation.ts     # Allocation model
│   │   ├── Transaction.ts    # Transaction model
│   │   └── Contribution.ts   # Contribution model
│   ├── services/             # Business logic
│   │   ├── poolService.ts    # Pool CRUD operations
│   │   ├── allocationService.ts  # Budget allocation
│   │   ├── transactionService.ts # Transaction management
│   │   ├── spendService.ts   # Spend tracking
│   │   └── transferService.ts    # Pool transfers
│   ├── middleware/           # Express middleware
│   │   └── auth.ts           # Internal service auth
│   └── utils/                # Utilities
│       ├── logger.ts         # Winston logger
│       ├── metrics.ts        # Prometheus metrics
│       └── validation.ts     # Zod schemas
├��─ package.json
└── tsconfig.json
```

## API Endpoints

### Pool Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/pools` | Create a new budget pool |
| GET | `/api/pools` | List all pools (with filters) |
| GET | `/api/pools/:id` | Get pool by ID |
| PUT | `/api/pools/:id` | Update pool settings |
| DELETE | `/api/pools/:id` | Delete a pool |

### Allocation

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/pools/:id/allocate` | Allocate budget to a campaign |
| GET | `/api/pools/:id/allocations` | Get allocations for a pool |
| PUT | `/api/allocations/:id` | Update an allocation |

### Balance & Contributions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/pools/:id/balance` | Get current pool balance |
| POST | `/api/pools/:id/contribute` | Contribute to a pool |

### Transactions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/pools/:id/transactions` | Get transaction history |
| GET | `/api/pools/:id/transactions/summary` | Get transaction summary |

### Spend

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/pools/:id/spend` | Record campaign spend |
| POST | `/api/pools/:id/refund` | Refund a spend transaction |
| GET | `/api/pools/:id/analytics` | Get pool and spend analytics |

### Transfers

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/pools/:id/transfer` | Transfer between pools |
| GET | `/api/pools/:id/transfers` | Get transfer history |
| POST | `/api/pools/:id/transfer/validate` | Validate a transfer |

### System

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/metrics` | Prometheus metrics |

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB 6+
- Redis 7+

### Installation

```bash
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/AdBazaar/shared-budget-pool
npm install
```

### Configuration

Create a `.env` file:

```env
PORT=5013
MONGO_URI=mongodb://localhost:27017/shared-budget-pool
REDIS_URL=redis://localhost:6379
INTERNAL_SERVICE_TOKEN=adbazaar-internal-token
LOG_LEVEL=info
NODE_ENV=development
```

### Start Development Server

```bash
npm run dev
```

### Start Production Server

```bash
npm run build
npm start
```

## API Usage Examples

### Create a Budget Pool

```bash
curl -X POST http://localhost:5013/api/pools \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: adbazaar-internal-token" \
  -d '{
    "name": "Q1 Marketing Budget",
    "organizationId": "org-123",
    "totalBudget": 1000000,
    "currency": "INR",
    "description": "Q1 2026 marketing campaigns",
    "settings": {
      "minBalance": 50000,
      "maxAllocationPercent": 80
    }
  }'
```

### Allocate Budget to Campaign

```bash
curl -X POST http://localhost:5013/api/pools/{poolId}/allocate \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: adbazaar-internal-token" \
  -d '{
    "campaignId": "camp-google-ads-001",
    "campaignName": "Google Ads Q1",
    "amount": 250000,
    "startDate": "2026-01-01T00:00:00Z",
    "endDate": "2026-03-31T23:59:59Z",
    "priority": 2,
    "settings": {
      "dailyLimit": 10000,
      "pacingStrategy": "even"
    }
  }'
```

### Record Spend

```bash
curl -X POST http://localhost:5013/api/pools/{poolId}/spend \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: adbazaar-internal-token" \
  -d '{
    "campaignId": "camp-google-ads-001",
    "amount": 5000,
    "reference": "gads-2026-01-15-001",
    "description": "Google Ads spend for Jan 15"
  }'
```

### Transfer Between Pools

```bash
curl -X POST http://localhost:5013/api/pools/{fromPoolId}/transfer \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: adbazaar-internal-token" \
  -d '{
    "toPoolId": "{toPoolId}",
    "amount": 100000,
    "description": "Reallocating budget from display to search"
  }'
```

### Get Pool Analytics

```bash
curl http://localhost:5013/api/pools/{poolId}/analytics?startDate=2026-01-01&endDate=2026-01-31 \
  -H "X-Internal-Token: adbazaar-internal-token"
```

## Data Models

### BudgetPool

```typescript
{
  _id: ObjectId,
  name: string,
  organizationId: string,
  totalBudget: number,
  currentBalance: number,
  reservedAmount: number,
  currency: string,
  description?: string,
  settings: {
    minBalance: number,
    autoReplenish: boolean,
    replenishThreshold: number,
    maxAllocationPercent: number
  },
  status: 'active' | 'inactive' | 'frozen',
  createdAt: Date,
  updatedAt: Date
}
```

### Allocation

```typescript
{
  _id: ObjectId,
  poolId: ObjectId,
  campaignId: string,
  campaignName?: string,
  amount: number,
  reservedAmount: number,
  spentAmount: number,
  status: 'pending' | 'active' | 'paused' | 'exhausted' | 'cancelled',
  startDate: Date,
  endDate?: Date,
  priority: number,
  settings: {
    dailyLimit?: number,
    pacingStrategy?: 'even' | 'frontload' | 'backload',
    autoPauseThreshold?: number
  }
}
```

### Transaction

```typescript
{
  _id: ObjectId,
  poolId: ObjectId,
  type: 'allocation' | 'contribution' | 'spend' | 'refund' | 'transfer_in' | 'transfer_out' | 'adjustment' | 'reversal',
  amount: number,
  balanceBefore: number,
  balanceAfter: number,
  reference: string,
  referenceType?: string,
  description?: string,
  timestamp: Date
}
```

## Prometheus Metrics

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `http_request_duration_seconds` | Histogram | method, route, status_code | Request latency |
| `http_requests_total` | Counter | method, route, status_code | Total requests |
| `budget_pool_balance` | Gauge | pool_id, pool_name, organization_id | Pool balance |
| `budget_pool_total` | Gauge | pool_id, pool_name, organization_id | Total budget |
| `allocation_count` | Gauge | pool_id, status | Active allocations |
| `transaction_count` | Counter | pool_id, type | Transaction count |
| `transaction_amount_total` | Counter | pool_id, type, currency | Transaction amounts |
| `allocation_spent` | Gauge | allocation_id, campaign_id, pool_id | Spent amount |
| `service_health` | Gauge | service | Service health status |

## Health Check Response

```json
{
  "success": true,
  "service": "shared-budget-pool",
  "version": "1.0.0",
  "port": 5013,
  "health": {
    "mongodb": "connected",
    "redis": "connected"
  },
  "timestamp": "2026-01-15T10:30:00.000Z"
}
```

## Error Codes

| Code | Description |
|------|-------------|
| `NOT_FOUND` | Resource not found |
| `MISSING_TOKEN` | Missing internal service token |
| `INVALID_TOKEN` | Invalid internal service token |
| `INSUFFICIENT_BALANCE` | Not enough balance for operation |
| `POOL_INACTIVE` | Pool is not active |
| `VALIDATION_ERROR` | Request validation failed |

## Ecosystem Integrations

This service connects to other AdBazaar and REZ ecosystem services:

| Service | Purpose |
|---------|---------|
| MongoDB | Data persistence |
| Redis | Caching and session management |
| AdBazaar Campaign Service | Campaign management |
| AdBazaar Analytics Service | Analytics aggregation |

## License

Internal AdBazaar Service - All rights reserved