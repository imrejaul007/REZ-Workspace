# REZ Circuit Breaker - SPEC.md

**Version:** 1.0.0
**Port:** 3002
**Company:** RABTUL-Technologies
**Category:** Infrastructure

---

## Overview

Fault tolerance service implementing the circuit breaker pattern. Prevents cascading failures by opening circuits when a downstream service fails repeatedly, allowing it time to recover.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     REZ Circuit Breaker                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  States:                                                                   │
│  CLOSED → Normal operation, requests pass through                        │
│  OPEN   → Circuit tripped, requests fail immediately                       │
│  HALF_OPEN → Testing recovery, limited requests allowed                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Circuit States

| State | Behavior | Transitions |
|-------|----------|-------------|
| CLOSED | Normal operation, all requests pass | → OPEN after N failures |
| OPEN | All requests rejected | → HALF_OPEN after timeout |
| HALF_OPEN | Limited test requests allowed | → CLOSED on success, → OPEN on failure |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Service health + all circuit states |
| GET | `/state/:name` | Get specific circuit state |
| POST | `/success/:name` | Record successful call |
| POST | `/failure/:name` | Record failed call |
| POST | `/reset/:name` | Reset circuit to CLOSED |

### Response Shapes

**GET /state/:name**
```json
{
  "name": "payment-service",
  "state": "CLOSED",
  "failures": 0,
  "lastFailure": null,
  "threshold": 5,
  "timeout": 60000,
  "canExecute": true
}
```

**POST /failure/:name**
```json
{
  "failure": true,
  "circuit": { ... },
  "canExecute": false
}
```

---

## Configuration

| Parameter | Default | Description |
|-----------|---------|-------------|
| threshold | 5 | Failures before opening circuit |
| timeout | 60000 | ms before HALF_OPEN |

---

## Dependencies

```json
{
  "express": "^4.18.2",
  "axios": "^1.6.5"
}
```

---

## Usage

Services call `/success/:name` after successful calls and `/failure/:name` after failures. Before making a call, check `/state/:name` to see if execution is allowed.

```typescript
const state = await fetch(`${CB_URL}/state/${serviceName}`);
if (!state.canExecute) {
  throw new Error('Circuit open');
}
```

---

## Status

- [x] Circuit state management
- [x] Success/failure tracking
- [x] Automatic state transitions
- [x] Health endpoint
- [x] Reset capability
