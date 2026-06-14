# REZ POS Intelligence - SPEC.md

**Version:** 1.0.0
**Port:** (see config)
**Company:** RABTUL-Technologies
**Category:** Intelligence

---

## Overview

POS to offline intelligence connector. Captures point-of-sale transactions and integrates them with the REZ Intelligence platform for customer insights.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                   REZ POS Intelligence                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│  Components:                                                                │
│  ├── POS Connector    → POS system integration                          │
│  ├── Transaction Parser → Transaction normalization                      │
│  └── Intel Emitter   → Intelligence event emission                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### Transactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/transactions` | Submit POS transaction |
| GET | `/transactions` | Query transactions |

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

- [x] POS integration
- [x] Transaction capture
- [x] Intelligence emission
