# REZ DLQ Service - SPEC.md

**Version:** 1.0.0
**Port:** 4032
**Company:** RABTUL-Technologies
**Category:** Infrastructure

---

## Overview

Dead Letter Queue management service. Handles failed messages from BullMQ queues, provides visibility into failed jobs, retry management, and dead-letter analytics.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      REZ DLQ Service                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  Components:                                                                │
│  ├── DLQ Collector  → Capture failed jobs from queues                    │
│  ├── Retry Manager  → Retry or discard failed jobs                      │
│  └── Analytics      → DLQ metrics and trends                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Models

### DeadLetter
```typescript
{
  id: string
  queue: string
  jobId: string
  data: Record<string, any>
  error: string
  failedAt: Date
  retryCount: number
  status: 'pending' | 'retrying' | 'discarded'
  metadata: Record<string, any>
}
```

---

## API Endpoints

### Dead Letters
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dlq` | List dead letters |
| GET | `/api/dlq/:id` | Get dead letter details |
| POST | `/api/dlq/:id/retry` | Retry dead letter |
| POST | `/api/dlq/:id/discard` | Discard dead letter |
| POST | `/api/dlq/retry-all` | Retry all |
| DELETE | `/api/dlq/purge` | Purge all |

### Metrics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dlq/stats` | DLQ statistics |
| GET | `/api/dlq/by-queue` | Stats by queue |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |

---

## Dependencies

```json
{
  "express": "^4.18.2",
  "mongoose": "^8.23.1",
  "bullmq": "^5.1.0",
  "ioredis": "^5.3.2",
  "helmet": "^8.1.0",
  "cors": "^2.8.6",
  "winston": "^3.11.0",
  "uuid": "^9.0.0"
}
```

---

## Status

- [x] Dead letter capture
- [x] Retry management
- [x] Discard capability
- [x] DLQ analytics
- [x] Queue grouping
