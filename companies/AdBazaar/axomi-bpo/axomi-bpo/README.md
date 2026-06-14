# @axom/axomi-bpo

Axomi BPO (Business Process Outsourcing) microservice — part of the Axom platform.

## Overview

The BPO service manages outsourced work tasks across multiple categories (data entry, customer support, content moderation, transcription, image annotation, research). It provides APIs to:

- Create and track BPO jobs posted by clients.
- Register and manage workers with specific skill sets.
- Assign jobs to available workers and track their lifecycle.
- Rate completed work and maintain worker performance metrics.

## Quick start

```bash
# Install dependencies
npm install

# Start in development mode
npm run dev

# Run tests
npm test
```

## Configuration

Copy `.env.example` to `.env` and adjust values:

| Variable               | Default                               | Description                    |
|------------------------|---------------------------------------|--------------------------------|
| `PORT`                 | `4080`                                | HTTP port the service listens on |
| `NODE_ENV`             | `development`                         | `development` \| `production` \| `test` |
| `MONGODB_URI`          | `mongodb://localhost:27017/axomi-bpo` | MongoDB connection string (currently unused — in-memory store) |
| `REDIS_HOST`           | `localhost`                           | Redis host (currently unused)  |
| `REDIS_PORT`           | `6379`                                | Redis port                     |
| `INTERNAL_SERVICE_TOKEN` | _(optional)_                        | Bearer token for inter-service calls |

## API

Base URL: `http://localhost:4080/api/bpo`

### Jobs

| Method | Endpoint                     | Description                        |
|--------|------------------------------|------------------------------------|
| POST   | `/jobs`                      | Create a new job                   |
| GET    | `/jobs/:id`                  | Get job by ID                      |
| GET    | `/jobs/client/:clientId`     | List all jobs for a client         |
| GET    | `/jobs/status/:status`       | List jobs by status (PENDING, ASSIGNED, etc.) |
| POST   | `/jobs/:id/assign`           | Assign a job to a worker           |
| POST   | `/jobs/:id/complete`         | Mark a job as completed            |
| POST   | `/jobs/:id/cancel`           | Cancel a pending/assigned job      |
| POST   | `/jobs/:id/rate`             | Rate a completed job               |

### Workers

| Method | Endpoint                     | Description                        |
|--------|------------------------------|------------------------------------|
| POST   | `/workers`                   | Register a new worker              |
| GET    | `/workers/:id`               | Get worker by ID                   |
| GET    | `/workers/available`        | List available workers (optional `?skill=TRANSCRIPTION`) |

### Health

| Method | Endpoint | Description          |
|--------|----------|----------------------|
| GET    | `/health`| Service health check |

## Architecture

- **BpoService** — business logic layer; pure in-memory store for easy testing.
- **Middleware** — error handler, request logger, Zod request validation.
- **Routes** — Express router with typed, validated endpoints.

## Production

Build and run with Docker:

```bash
docker build -t axom/axomi-bpo .
docker run -p 4080:4080 axom/axomi-bpo
```
