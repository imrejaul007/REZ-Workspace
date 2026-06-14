# Trigger Condition Engine

Event-based triggers and conditions engine for workflow automation.

## Features

- Multiple trigger types (scheduled, event, webhook, manual, data change, threshold)
- Flexible condition evaluation with various operators
- Action execution with retry logic
- Throttling to prevent excessive executions
- Execution history and analytics
- Template support

## Quick Start

```bash
cd trigger-condition-engine
npm install
npm run dev
```

## Environment Variables

```env
PORT=5054
MONGODB_URI=mongodb://localhost:27017/trigger-condition-engine
REDIS_URL=redis://localhost:6379
```

## API Endpoints

### Triggers

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/triggers | Create trigger |
| GET | /api/triggers | List all triggers |
| GET | /api/triggers/:id | Get trigger by ID |
| PUT | /api/triggers/:id | Update trigger |
| POST | /api/triggers/:id/enable | Enable trigger |
| POST | /api/triggers/:id/pause | Pause trigger |
| POST | /api/triggers/:id/test | Test trigger conditions |
| GET | /api/triggers/:id/history | Get trigger execution history |
| GET | /api/triggers/:id/stats | Get trigger statistics |
| DELETE | /api/triggers/:id | Delete trigger |
| POST | /api/triggers/:id/duplicate | Duplicate trigger |

## Condition Operators

| Operator | Description |
|----------|-------------|
| eq | Equal to |
| neq | Not equal to |
| gt | Greater than |
| gte | Greater than or equal |
| lt | Less than |
| lte | Less than or equal |
| contains | Contains substring |
| not_contains | Does not contain |
| starts_with | Starts with |
| ends_with | Ends with |
| regex | Matches regex pattern |
| in | In array |
| not_in | Not in array |
| between | Between range |
| exists | Field exists |
| not_exists | Field does not exist |

## Health Check

```bash
curl http://localhost:5054/health
```

## Metrics

```bash
curl http://localhost:5054/metrics
```