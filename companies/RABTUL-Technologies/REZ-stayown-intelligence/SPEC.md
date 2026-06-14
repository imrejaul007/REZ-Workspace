# REZ StayOwn Intelligence - SPEC.md

**Version:** 1.0.0
**Port:** (see config)
**Company:** RABTUL-Technologies
**Category:** Integration

---

## Overview

StayOwn to REZ Intelligence connector. Captures hotel booking and hospitality data for customer insights.

---

## API Endpoints

### Events
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/events` | Submit StayOwn event |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |

---

## Dependencies

```json
{
  "axios": "^1.6.0"
}
```

---

## Status

- [x] StayOwn event capture
- [x] Intelligence emission
