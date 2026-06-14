# REZ Retail POS Service

Point of Sale Service for REZ Retail.

## Features

- Transaction processing (sales, returns, voids)
- Multiple payment methods (cash, card, UPI, wallet)
- Receipt generation
- Daily sales summaries
- Integration with RABTUL payment gateway

## API Endpoints

### Transactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/transactions` | Create transaction |
| GET | `/api/transactions` | List transactions |
| GET | `/api/transactions/summary` | Daily summary |
| GET | `/api/transactions/:id` | Get by ID |
| GET | `/api/transactions/:id/receipt` | Generate receipt |
| POST | `/api/transactions/:id/refund` | Process refund |
| POST | `/api/transactions/:id/void` | Void transaction |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payments/validate` | Validate payment |
| POST | `/api/payments/process` | Process payment |
| POST | `/api/payments/refund` | Process refund |
| GET | `/api/payments/:ref/status` | Check status |

## Configuration

```env
PORT=4104
MONGODB_URI=mongodb://localhost:27017/rez-retail-pos
REDIS_URL=redis://localhost:6379
```
