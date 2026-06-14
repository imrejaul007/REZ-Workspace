# Finance OS - RTMN Financial Operations

Financial operations across all industries with ledger, budgets, expenses, and reporting.

## Quick Start

```bash
cd core/finance-os
npm install
npm start
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/ledger` | Ledger overview |
| POST | `/api/ledger/account` | Create account |
| POST | `/api/ledger/entry` | Create entry |
| GET | `/api/budgets` | List budgets |
| POST | `/api/budgets` | Create budget |
| GET | `/api/expenses` | List expenses |
| GET | `/api/reports` | Generate reports |

## Reports Available

- Income Statement
- Balance Sheet
- Cash Flow

## Example

```bash
# Create account
curl -X POST http://localhost:3023/api/ledger/account \
  -H "Content-Type: application/json" \
  -d '{"name": "Revenue Account", "type": "revenue"}'

# Generate report
curl http://localhost:3023/api/reports?type=income
```

## Docker

```bash
docker build -t rtmn-finance-os core/finance-os
docker run -p 3023:3023 rtmn-finance-os
```
