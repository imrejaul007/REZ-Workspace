# REZ Idempotency Service - SPEC.md

**Version:** 1.0.0
**Port:** 4033
**Company:** RABTUL-Technologies
**Category:** Infrastructure

---

## Overview

Centralized idempotency service for preventing duplicate operations. Stores idempotency keys with their results, allowing safe retries of API requests without duplicate side effects.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    REZ Idempotency Service                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│  Components:                                                                │
│  ├── Key Store      → Redis-backed idempotency keys                        │
│  ├── Result Cache  → Cached operation results                             │
│  └── TTL Manager   → Automatic key expiration                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Models

### IdempotencyRecord
```typescript
{
  key: string
  operation: string
  status: 'processing' | 'completed' | 'failed'
  result?: any
  error?: string
  createdAt: Date
  expiresAt: Date
}
```

---

## API Endpoints

### Idempotency
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/:key` | Get idempotency record |
| POST | `/check` | Check if key exists |
| POST | `/store` | Store result |
| DELETE | `/:key` | Delete key |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |

---

## Dependencies

```json
{
  "express": "^4.18.2"
}
```

---

## Usage

```typescript
// Check if operation was already performed
const result = await fetch(`${IDEMPOTENCY_URL}/${idempotencyKey}`);
if (result.status === 'completed') {
  return result.body;
}

// Store result after operation
await fetch(`${IDEMPOTENCY_URL}/store`, {
  method: 'POST',
  body: { key: idempotencyKey, result }
});
```

---

## Status

- [x] Key storage
- [x] Result caching
- [x] TTL expiration
- [x] Conflict detection
