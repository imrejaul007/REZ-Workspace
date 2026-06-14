# AI Budget Coach - Port 3000

AI-powered budget planning, advice, and scenario simulation for business finance management.

## Features

- **Budget Management**: Create, update, and track budgets by fiscal year and quarter
- **Spending Analysis**: Real-time budget vs actual comparison with variance tracking
- **Smart Recommendations**: AI-generated suggestions based on spending patterns
- **Scenario Simulation**: Test "what-if" budget scenarios before committing
- **Multi-category Tracking**: Marketing, Operations, HR, Technology, Sales, Admin, R&D

## Tech Stack

- Node.js 20+
- Express.js
- TypeScript (strict mode)
- MongoDB
- Redis

## Quick Start

### Prerequisites

- Node.js 20+
- MongoDB
- Redis (optional)

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
npm start
```

### Docker

```bash
docker-compose up -d
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| PORT | No | 3000 | Service port |
| NODE_ENV | No | development | Environment |
| MONGODB_URI | Yes | - | MongoDB connection string |
| JWT_SECRET | Yes | - | JWT signing secret |
| REDIS_URL | No | redis://localhost:6379 | Redis connection |

## API Endpoints

### Health Checks

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Full health check with dependencies |
| `/health/live` | GET | Liveness probe |
| `/health/ready` | GET | Readiness probe |

### Budget Management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/budgets/:tenantId` | GET | List all budgets for tenant |
| `/api/budgets/:tenantId` | POST | Create new budget |
| `/api/budgets/:tenantId/:budgetId` | GET | Get specific budget |
| `/api/budgets/:tenantId/:budgetId` | PUT | Update budget |
| `/api/budgets/:tenantId/:budgetId` | DELETE | Delete budget |
| `/api/budgets/:tenantId/:budgetId/spending` | POST | Add spending record |

### Analysis & Simulation

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/advice/:tenantId` | GET | Get budget advice and recommendations |
| `/api/budgets/:tenantId/advice` | GET | Get detailed budget analysis |
| `/api/simulate/:tenantId` | POST | Simulate budget scenarios |
| `/api/budgets/categories` | GET | List available budget categories |

## API Examples

### Create Budget

```bash
curl -X POST http://localhost:3000/api/budgets/tenant123 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "Q1 2026 Budget",
    "fiscalYear": 2026,
    "fiscalQuarter": 1,
    "items": [
      {
        "category": "marketing",
        "name": "Digital Ads",
        "amount": 5000,
        "frequency": "monthly",
        "type": "expense"
      }
    ]
  }'
```

### Get Budget Advice

```bash
curl http://localhost:3000/api/advice/tenant123?fiscalYear=2026 \
  -H "Authorization: Bearer <token>"
```

### Simulate Scenario

```bash
curl -X POST http://localhost:3000/api/simulate/tenant123 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "scenarios": [
      {
        "category": "marketing",
        "changeType": "increase",
        "changeAmount": 1000
      }
    ]
  }'
```

## Budget Categories

- `marketing` - Marketing & Advertising
- `operations` - Operations
- `hr` - Human Resources
- `technology` - Technology & IT
- `sales` - Sales
- `admin` - Administration
- `rnd` - Research & Development
- `other` - Other expenses

## Integration

- RABTUL Auth (4002)
- RABTUL Payment (4001)
- RABTUL Wallet (4004)
- RABTUL Notification (4005)

## License

ISC
