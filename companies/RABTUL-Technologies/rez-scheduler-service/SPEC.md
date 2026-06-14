# REZ Scheduler Service - SPEC.md

**Version:** 1.0.0
**Port:** 4038
**Company:** RABTUL-Technologies
**Category:** Infrastructure

---

## Overview

Cron job scheduler service for REZ platform. Manages scheduled tasks, recurring jobs, and background job orchestration with BullMQ integration.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    REZ Scheduler Service                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  Components:                                                                │
│  ├── Job Scheduler    → Cron-based job scheduling                       │
│  ├── Job Queue       → BullMQ job queue management                     │
│  ├── Error KB        → Error knowledge base                             │
│  └── Burn Down       → Sprint burn-down metrics                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Models

### Job
```typescript
{
  jobId: string
  name: string
  schedule: string
  handler: string
  enabled: boolean
  lastRun?: Date
  nextRun: Date
  status: 'active' | 'paused' | 'failed'
}
```

---

## API Endpoints

### Jobs
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/jobs` | Create job |
| GET | `/jobs` | List jobs |
| GET | `/jobs/:id` | Get job |
| PUT | `/jobs/:id` | Update job |
| DELETE | `/jobs/:id` | Delete job |
| POST | `/jobs/:id/run` | Run job immediately |

### Queue
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/queue/stats` | Queue statistics |
| GET | `/queue/failed` | Failed jobs |

### Error KB
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/error-kb` | List errors |
| POST | `/error-kb/add` | Add error |
| GET | `/error-kb/stats` | Error statistics |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |

---

## Dependencies

```json
{
  "express": "^4.21.2",
  "mongoose": "^8.17.2",
  "bullmq": "^5.30.0",
  "ioredis": "^5.6.0",
  "axios": "^1.7.0",
  "winston": "^3.17.0",
  "zod": "^3.24.0",
  "@sentry/node": "^7.120.0"
}
```

---

## Status

- [x] Cron scheduling
- [x] Job management
- [x] Queue statistics
- [x] Failed job tracking
- [x] Error knowledge base
- [x] Burn-down metrics
