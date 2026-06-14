# REZ Idempotency Service

Distributed idempotency key management service for preventing duplicate API operations in the ReZ ecosystem.

## Features

- **Idempotency Keys**: Store and validate unique operation keys
- **Automatic Expiration**: TTL-based key cleanup
- **Distributed Locking**: Redis-based distributed locks
- **Multiple Backends**: Support for Redis and in-memory storage
- **TTL Management**: Configurable key expiration times
- **Batch Operations**: Process multiple idempotency keys efficiently
- **TypeScript**: Fully typed codebase for better developer experience

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   Idempotency Service                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Express API │  │  Idempotency │  │    Lock Manager      │  │
│  │   (REST)     │  │   Store      │  │    (Redis)          │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────▼────────────────────────────────────┐
│                    Storage Backend                               │
│  ┌──────────────────┐  ┌────────────────────────────────────┐  │
│  │  Redis           │  │  In-Memory (fallback)              │  │
│  │  - Keys          │  │  - Keys                           │  │
│  │  - Locks         │  │  - TTL tracking                   │  │
│  └──────────────────┘  └────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file:

```env
PORT=3000
NODE_ENV=development

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Idempotency Settings
DEFAULT_TTL_SECONDS=86400
MAX_KEY_LENGTH=128
CLEANUP_INTERVAL_MS=60000
```

## Running the Service

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm run build
npm start
```

## API Endpoints

### Idempotency Keys

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/keys` | Create new idempotency key |
| GET | `/api/keys/:key` | Check if key exists |
| DELETE | `/api/keys/:key` | Delete idempotency key |
| GET | `/api/keys/:key/value` | Get stored value |
| POST | `/api/keys/:key/value` | Store value for key |

### Distributed Locks

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/locks` | Acquire a lock |
| DELETE | `/api/locks/:lockId` | Release a lock |
| GET | `/api/locks/:lockId` | Check lock status |
| POST | `/api/locks/:lockId/extend` | Extend lock TTL |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/health/ready` | Readiness probe |

## Usage Examples

### Check Idempotency

```bash
# Create a new idempotency key
curl -X POST http://localhost:3000/api/keys \
  -H "Content-Type: application/json" \
  -d '{
    "key": "order-12345-payment",
    "ttlSeconds": 3600
  }'

# Check if key exists (returns 200 if exists, 404 if not)
curl http://localhost:3000/api/keys/order-12345-payment

# Store a value with the key
curl -X POST http://localhost:3000/api/keys/order-12345-payment/value \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "txn_abc123",
    "amount": 99.99
  }'

# Retrieve stored value
curl http://localhost:3000/api/keys/order-12345-payment/value
```

### Distributed Lock

```bash
# Acquire a lock
curl -X POST http://localhost:3000/api/locks \
  -H "Content-Type: application/json" \
  -d '{
    "lockId": "payment-processing-12345",
    "ttlSeconds": 30,
    "owner": "payment-service"
  }'

# Release the lock
curl -X DELETE http://localhost:3000/api/locks/payment-processing-12345
```

## Data Models

### IdempotencyKey

```typescript
interface IdempotencyKey {
  key: string;
  value?: unknown;
  createdAt: Date;
  expiresAt: Date;
  hitCount: number;
  lastAccessedAt?: Date;
}
```

### DistributedLock

```typescript
interface DistributedLock {
  lockId: string;
  owner: string;
  acquiredAt: Date;
  expiresAt: Date;
  ttlSeconds: number;
}
```

## Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| `DEFAULT_TTL_SECONDS` | 86400 | Default TTL for keys (24 hours) |
| `MAX_KEY_LENGTH` | 128 | Maximum key length |
| `CLEANUP_INTERVAL_MS` | 60000 | Interval for expired key cleanup |
| `LOCK_DEFAULT_TTL` | 30 | Default lock TTL in seconds |

## Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm run test:watch
```

## Deployment

### Docker

```bash
docker build -t rez-idempotency-service .
docker run -p 3000:3000 \
  -e REDIS_HOST=redis-host \
  -e REDIS_PORT=6379 \
  rez-idempotency-service
```

### Render

The service includes `render.yaml` for Render deployment.

## License

MIT
