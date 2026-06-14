# REZ POS Loyalty Integration - SPEC.md

**Version:** 1.0.0
**Port:** (see config)
**Company:** RABTUL-Technologies
**Category:** Integration

---

## Overview

POS loyalty integration connecting NexTaBizz, KDS, and REZ NOW to the unified loyalty system. Enables cross-platform loyalty rewards.

---

## API Endpoints

### Integration
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/sync` | Sync loyalty data |
| GET | `/status` | Get integration status |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |

---

## Dependencies

```json
{
  "express": "^4.18.2",
  "mongoose": "^8.0.0",
  "axios": "^1.6.0",
  "zod": "^3.22.4"
}
```

---

## Connected Systems

| System | Type |
|--------|------|
| NexTaBizz | POS |
| KDS | Kitchen Display |
| REZ NOW | Storefront |

---

## Status

- [x] POS integration
- [x] Loyalty sync
- [x] Cross-platform rewards
