# REZ Data Aggregator - SPEC.md

**Version:** 1.0.0
**Port:** (see config)
**Company:** RABTUL-Technologies
**Category:** Integration

---

## Overview

Unified event collection service that aggregates data from all REZ services into a central data store for analytics and reporting.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    REZ Data Aggregator                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  Components:                                                                │
│  ├── Event Collector → Collect events from services                       │
│  ├── Data Normalizer → Standardize event formats                         │
│  └── Storage Manager → MongoDB persistence                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### Events
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/events` | Ingest event |
| POST | `/events/batch` | Batch ingest |
| GET | `/events` | Query events |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |

---

## Dependencies

```json
{
  "express": "^4.18.2",
  "mongoose": "^8.0.0"
}
```

---

## Status

- [x] Event ingestion
- [x] Batch processing
- [x] Data normalization
