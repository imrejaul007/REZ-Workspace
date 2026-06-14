# Revenue Network - RTMN Revenue Orchestration

Revenue stream orchestration across all 24 industries.

## Quick Start

```bash
cd core/revenue-network
npm install
npm start
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/streams` | List streams |
| POST | `/api/streams` | Create stream |
| GET | `/api/streams/:id` | Stream details |
| GET | `/api/allocation` | Allocation overview |
| GET | `/api/analytics` | Revenue analytics |

## Revenue Types

- `subscription` - Recurring revenue
- `transaction` - Per-transaction
- `license` - Software licenses
- `advertising` - Ad revenue
- `referral` - Referral commissions
- `data` - Data services

## Example

```bash
# Create revenue stream
curl -X POST http://localhost:3032/api/streams \
  -H "Content-Type: application/json" \
  -d '{"name": "SaaS Subscription", "type": "subscription", "industry": "technology", "amount": 999}'
```

## Docker

```bash
docker build -t rtmn-revenue-network core/revenue-network
docker run -p 3032:3032 rtmn-revenue-network
```
