# Rez Salon POS Service

Point of Sale, Billing, and Inventory Management

**Port:** 4010

## Features

- **Billing Management**: Create invoices, process payments, handle refunds
- **Inventory Tracking**: Monitor product stock levels and supplies
- **Invoice Generation**: Generate detailed invoices with GST compliance
- **Payment Processing**: Support for cash, card, UPI, and wallet payments
- **Staff Commission**: Track staff performance and calculate commissions
- **Expense Management**: Record and categorize business expenses
- **Transaction History**: Complete audit trail of all financial transactions

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| POST | /api/billing/invoice | Create new invoice |
| GET | /api/billing/invoice/:id | Get invoice by ID |
| PUT | /api/billing/invoice/:id | Update invoice |
| POST | /api/billing/payment | Process payment |
| GET | /api/billing/transactions | List transactions |
| GET | /api/inventory/products | List products |
| POST | /api/inventory/products | Add product |
| PUT | /api/inventory/products/:id | Update product |
| GET | /api/inventory/stock/:id | Get stock level |
| POST | /api/inventory/stock/adjust | Adjust stock |
| GET | /api/invoices | List all invoices |
| GET | /api/invoices/:id | Get invoice details |

## Quick Start

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run in production mode
npm run build && npm start

# Run tests
npm test
```

## Configuration

Configure via environment variables or `.env` file:
- `PORT`: Server port (default: 4010)
- `MONGODB_URI`: MongoDB connection string
- `REDIS_URL`: Redis connection string for caching
- `NODE_ENV`: Environment (development/production)
- `JWT_SECRET`: Secret for JWT authentication
- `INTERNAL_SERVICE_TOKENS_JSON`: Service tokens for inter-service calls
