# Finance Collections - AI Collections Manager

**Port:** 3000

AI-powered receivables collections service with AR aging analysis, follow-up scheduling, and automated payment reminders.

## Features

- **AR Aging Analysis**: Real-time aging buckets (Current, 1-30, 31-60, 61-90, 91+ days)
- **Follow-up Management**: Schedule and track follow-ups via email, WhatsApp, SMS, call, or letter
- **Payment Reminders**: Auto-generate reminders based on aging bucket
- **Payment Recording**: Track partial and full payments
- **Multi-tenant**: Full tenant isolation

## Quick Start

```bash
# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env
# Edit .env with your MongoDB URI and secrets

# Development
npm run dev

# Production build
npm run build && npm start
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| PORT | Service port (default: 3000) |
| MONGODB_URI | MongoDB connection string |
| JWT_SECRET | JWT signing secret (min 32 chars) |
| REDIS_URL | Redis connection (optional) |

## API Endpoints

### Health Checks
```
GET /health      - Service health
GET /health/live - Liveness probe
GET /health/ready - Readiness probe
```

### Receivables
```
POST   /api/receivables        - Create receivable
GET    /api/receivables        - List all (with pagination)
GET    /api/receivables/:id    - Get single
PATCH  /api/receivables/:id    - Update
DELETE /api/receivables/:id    - Delete
```

### Collections
```
GET  /api/aging/:tenantId      - AR aging report
POST /api/follow-up            - Schedule follow-up
GET  /api/follow-up/:id        - Follow-up history
GET  /api/follow-up/due        - Due for follow-up
POST /api/payments             - Record payment
POST /api/reminders/batch      - Generate batch reminders
```

## Authentication

All `/api/*` endpoints require Bearer token authentication:
```
Authorization: Bearer <jwt_token>
```

## Docker

```bash
# Build
docker build -t finance-collections .

# Run
docker run -p 3000:3000 --env-file .env finance-collections
```

Or use docker-compose:
```bash
docker-compose up -d
```

## Tech Stack

- Node.js 20+
- Express.js
- TypeScript (strict mode)
- MongoDB
- Zod (validation)
- Helmet (security)