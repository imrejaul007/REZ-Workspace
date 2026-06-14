# Affiliate Payout Service

AdBazaar service for handling affiliate commission calculations and payments.

## Features

- Payout creation and processing
- Multiple payment methods (bank transfer, UPI, PayPal, Razorpay)
- Invoice generation
- Transaction tracking
- Balance management
- Fee calculation

## API Endpoints

### Payouts

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payouts` | Create new payout |
| GET | `/api/payouts/:id` | Get payout by ID |
| POST | `/api/payouts/:id/process` | Process payout |
| GET | `/api/payouts/pending` | Get pending payouts |
| POST | `/api/payouts/:id/retry` | Retry failed payout |
| POST | `/api/payouts/:id/cancel` | Cancel payout |
| GET | `/api/payouts/analytics/summary` | Get payout analytics |

### Invoices

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/invoices` | Create invoice |
| GET | `/api/invoices/:id` | Get invoice |
| GET | `/api/invoices` | List invoices |
| POST | `/api/invoices/:id/send` | Send invoice |
| POST | `/api/invoices/:id/paid` | Mark as paid |

### Transactions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/transactions` | Create transaction |
| GET | `/api/transactions/:id` | Get transaction |
| GET | `/api/transactions` | List transactions |
| POST | `/api/transactions/:id/reverse` | Reverse transaction |
| GET | `/api/transactions/balance/:affiliateId` | Get balance |

## Quick Start

```bash
npm install
npm run dev
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Service port | 5062 |
| MONGODB_URI | MongoDB connection | mongodb://localhost:27017/affiliate-payout |