# REZ CorpPerks Intelligence - SPEC.md

**Version:** 1.0.0
**Port:** (see config)
**Company:** RABTUL-Technologies
**Category:** Integration

---

## Overview

CorpPerks to REZ Intelligence connector. Captures corporate benefits data and integrates it with the intelligence platform for employee insights.

---

## API Endpoints

### Events
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/events` | SubmitCorpPerks event |

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

- [x] CorpPerks event capture
- [x] Intelligence emission
