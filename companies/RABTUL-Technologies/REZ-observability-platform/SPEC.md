# REZ Observability Platform - SPEC.md

**Version:** 1.0.0
**Port:** (see config)
**Company:** RABTUL-Technologies
**Category:** Infrastructure

---

## Overview

Comprehensive observability platform providing centralized logging, distributed tracing, metrics collection, alerting, and SLO monitoring for the entire REZ ecosystem.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 REZ Observability Platform                                │
├─────────────────────────────────────────────────────────────────────────────┤
│  Components:                                                                │
│  ├── Log Aggregator  → Centralized log collection                       │
│  ├── Trace Collector → Distributed tracing (Jaeger-style)                │
│  ├── Metrics Server  → Prometheus-compatible metrics                     │
│  ├── Alert Manager   → Alert rules and notifications                   │
│  └── SLO Monitor    → Service Level Objective tracking                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Models

### Log
```typescript
{
  id: string
  level: 'debug' | 'info' | 'warn' | 'error'
  message: string
  service: string
  timestamp: Date
  metadata: Record<string, any>
}
```

### Trace
```typescript
{
  traceId: string
  spanId: string
  parentSpanId?: string
  service: string
  operation: string
  duration: number
  status: 'ok' | 'error'
  tags: Record<string, string>
}
```

### Alert
```typescript
{
  alertId: string
  name: string
  condition: string
  severity: 'critical' | 'warning' | 'info'
  status: 'firing' | 'resolved'
  firedAt?: Date
}
```

---

## API Endpoints

### Logs
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/logs` | Ingest logs |
| GET | `/logs` | Query logs |
| GET | `/logs/services/:service` | Service logs |

### Traces
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/traces` | Ingest traces |
| GET | `/traces/:traceId` | Get trace |
| GET | `/traces/services/:service` | Service traces |

### Metrics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/metrics` | Prometheus metrics endpoint |
| POST | `/metrics/push` | Push metrics |

### Alerts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/alerts` | List alerts |
| POST | `/alerts` | Create alert |
| PUT | `/alerts/:id` | Update alert |
| DELETE | `/alerts/:id` | Delete alert |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |

---

## Dependencies

```json
{
  "express": "^4.18.2",
  "cors": "^2.8.5",
  "helmet": "^7.1.0",
  "prom-client": "^15.1.0",
  "winston": "^3.11.0",
  "ioredis": "^5.3.2",
  "ws": "^8.16.0",
  "pg": "^8.11.3"
}
```

---

## Status

- [x] Log aggregation
- [x] Distributed tracing
- [x] Metrics collection
- [x] Alert management
- [x] SLO monitoring
- [x] WebSocket updates
