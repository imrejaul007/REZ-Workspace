# REZ Retry Service - SPEC.md

**Version:** 1.0.0
**Port:** 4031
**Company:** RABTUL-Technologies
**Category:** Infrastructure

---

## Overview

Exponential backoff retry service. Provides configurable retry logic for failed operations across services with automatic backoff calculation and circuit breaker integration.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      REZ Retry Service                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│  Components:                                                                │
│  ├── Retry Engine    → Exponential backoff logic                          │
│  ├── Circuit Breaker → Failure threshold detection                        │
│  └── Metrics        → Retry statistics                                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### Retry
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/retry` | Execute with retry |
| GET | `/retry/status/:id` | Check retry status |

### Config
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/config/:service` | Get retry config |
| PUT | `/config/:service` | Update retry config |

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

## Configuration

| Parameter | Default | Description |
|-----------|---------|-------------|
| maxRetries | 3 | Maximum retry attempts |
| baseDelay | 1000 | Base delay in ms |
| maxDelay | 30000 | Maximum delay in ms |
| factor | 2 | Exponential factor |

---

## Status

- [x] Exponential backoff
- [x] Configurable retries
- [x] Circuit breaker
- [x] Retry metrics
