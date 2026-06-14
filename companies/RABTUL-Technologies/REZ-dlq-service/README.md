# ReZ DLQ Service

A Dead Letter Queue (DLQ) service for storing, managing, and replaying failed events across the ReZ platform.

## Features

- **Store Failed Events**: Capture and persist events that failed processing
- **Replay Events**: Replay individual or batch events with configurable retry logic
- **Admin API**: RESTful endpoints for DLQ management
- **Statistics**: Track DLQ health and activity
- **Scheduled Retries**: Automatic retry scheduling with exponential backoff

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Source Service │────▶│   DLQ Service   │────▶│  Target Queue   │
│  (Producer)     │     │  (Store/Query)  │     │  (Consumer)     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │    MongoDB      │
                        │  (Persistence)  │
                        └─────────────────┘
```

## Prerequisites

- Node.js >= 18.0.0
- MongoDB >= 6.0.0
- npm or yarn

## Installation

```bash
# Clone the repository
git clone https://github.com/your-org/REZ-dlq-service.git
cd REZ-dlq-service

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Build the project
npm run build

# Start the service
npm start
```

## Configuration

Configure via environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | HTTP server port | `3000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/rez_dlq` |
| `LOG_LEVEL` | Logging level | `info` |
| `NODE_ENV` | Environment mode | `development` |

## API Endpoints

### Store Events

```
POST /api/dlq/events
```

Store a failed event.

```json
{
  "eventId": "optional-custom-id",
  "eventType": "order.process",
  "payload": { "orderId": "123", "amount": 99.99 },
  "error": {
    "message": "Payment failed",
    "code": "PAYMENT_ERROR"
  },
  "metadata": {
    "source": "payment-service",
    "timestamp": "2024-01-15T10:30:00Z",
    "originalQueue": "orders.processing",
    "headers": { "correlationId": "abc123" }
  },
  "tags": ["payment", "urgent"]
}
```

### Query Events

```
GET /api/dlq/events?status=pending&eventType=order.process&limit=50
```

Query DLQ events with filters.

### Replay Single Event

```
POST /api/dlq/replay/:eventId
```

Replay a single failed event.

### Replay Batch

```
POST /api/dlq/replay/batch
```

```json
{
  "eventIds": ["id1", "id2", "id3"],
  "targetQueue": "orders.retry"
}
```

### Replay All Pending

```
POST /api/dlq/replay/pending?limit=100
```

Replay all pending events (with optional limit).

### Get Statistics

```
GET /api/dlq/stats
```

Returns DLQ statistics including:
- Total event count
- Events by status
- Events by type
- Recent activity (last 7 days)
- Oldest pending event

### Update Event

```
PATCH /api/dlq/events/:eventId
```

```json
{
  "status": "pending",
  "tags": ["action-required"],
  "action": "add"
}
```

### Delete Event

```
DELETE /api/dlq/events/:eventId
```

Delete a single event from DLQ.

### Purge Events

```
DELETE /api/dlq/events?status=replayed&olderThan=2024-01-01
```

Purge events by status and/or age.

## Event Statuses

| Status | Description |
|--------|-------------|
| `pending` | Awaiting replay |
| `replaying` | Currently being replayed |
| `replayed` | Successfully replayed |
| `failed` | Replay failed (will retry) |
| `discarded` | Manually discarded |

## Retry Strategy

Default exponential backoff delays:

| Attempt | Delay |
|---------|-------|
| 1 | 1 minute |
| 2 | 5 minutes |
| 3 | 15 minutes |
| 4 | 1 hour |
| 5 | 24 hours |

## Deployment

### Render

The service includes `render.yaml` for Render deployment.

```bash
# Deploy via Render CLI
render deploy
```

Or connect your GitHub repository to Render for automatic deployments.

### Local Development

```bash
# Start with hot reload
npm run dev

# Run tests
npm test

# Lint
npm run lint
```

## Project Structure

```
REZ-dlq-service/
├── src/
│   ├── index.ts           # Entry point
│   ├── models/
│   │   └── dlq.model.ts   # Mongoose model
│   ├── services/
│   │   ├── dlq.service.ts     # DLQ operations
│   │   └── replay.service.ts  # Replay logic
│   └── routes/
│       └── dlq.routes.ts  # API routes
├── package.json
├── tsconfig.json
├── render.yaml
└── README.md
```

## License

MIT
