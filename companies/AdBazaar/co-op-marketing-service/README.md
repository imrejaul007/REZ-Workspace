# Co-op Marketing Service

AdBazaar service for managing co-op advertising funds.

## Features

- Co-op fund creation and management
- Partner eligibility rules
- Claim submission and approval workflow
- Budget tracking and allocation
- Utilization analytics

## API Endpoints

### Co-op Funds

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/coop-funds` | Create co-op fund |
| GET | `/api/coop-funds` | List funds by advertiser |
| GET | `/api/coop-funds/:id` | Get fund by ID |
| POST | `/api/coop-funds/:id/claim` | Create claim against fund |
| GET | `/api/coop-funds/:id/analytics` | Get fund analytics |
| GET | `/api/coop-funds/:id/eligibility` | Check partner eligibility |

### Claims

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/claims` | Create claim |
| GET | `/api/claims/:id` | Get claim |
| GET | `/api/claims/fund/:fundId` | Get claims by fund |
| GET | `/api/claims/partner/:partnerId` | Get claims by partner |
| POST | `/api/claims/:id/approve` | Approve claim |
| POST | `/api/claims/:id/reject` | Reject claim |
| GET | `/api/claims/summary/all` | Get claim summary |

### Budgets

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/budgets` | Create budget |
| GET | `/api/budgets/:id` | Get budget |
| GET | `/api/budgets/fund/:fundId` | Get budget by fund |
| GET | `/api/budgets/:id/utilization` | Get utilization |
| GET | `/api/budgets/:id/allocation/:partnerId` | Get partner allocation |

## Quick Start

```bash
npm install
npm run dev
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Service port | 5063 |
| MONGODB_URI | MongoDB connection | mongodb://localhost:27017/coop-marketing |