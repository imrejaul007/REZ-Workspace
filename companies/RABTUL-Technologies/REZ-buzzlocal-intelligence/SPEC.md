# REZ BuzzLocal Intelligence - SPEC.md

**Version:** 1.0.0
**Port:** (see config)
**Company:** RABTUL-Technologies
**Category:** Integration

---

## Overview

BuzzLocal to REZ Intelligence connector. Captures BuzzLocal social data and integrates with the intelligence platform.

---

## API Endpoints

### Events
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/events` | Submit BuzzLocal event |

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

- [x] BuzzLocal event capture
- [x] Intelligence emission
