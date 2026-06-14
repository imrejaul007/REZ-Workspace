# REZ AI Integration Service - SPEC.md

**Version:** 1.0.0
**Port:** (see config)
**Company:** RABTUL-Technologies
**Category:** Integration

---

## Overview

AI integration service connecting REZ-Intelligence to RABTUL services. Provides unified access to AI capabilities across the platform.

---

## API Endpoints

### AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/predict` | Run prediction |
| POST | `/classify` | Classify content |
| POST | `/embed` | Generate embeddings |

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
  "helmet": "^7.1.0"
}
```

---

## Status

- [x] REZ Intelligence integration
- [x] Prediction endpoints
- [x] Classification
