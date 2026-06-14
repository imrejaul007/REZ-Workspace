# REZ Intelligence Hub - SPEC.md

**Version:** 1.0.0
**Port:** 4131
**Company:** RABTUL-Technologies
**Category:** Intelligence

---

## Overview

Central integration layer connecting all REZ Intelligence services. Provides unified API to access intent, predictions, decisions, features, and graph data across the intelligence stack.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    REZ Intelligence Hub                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  Components:                                                                │
│  ├── Intent Client   → Central Intent API                             │
│  ├── Decision Client → Decision Engine API                             │
│  ├── Feature Client  → Feature Store API                               │
│  └── Graph Client   → Commerce Graph API                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### Unified Queries
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/query/intent` | Predict intent |
| POST | `/query/decision` | Get decision |
| POST | `/query/features` | Get features |
| POST | `/query/graph` | Query graph |

### Combined
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/user/:userId/profile` | Unified user profile |
| POST | `/recommend/:userId` | Combined recommendations |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |

---

## Dependencies

```json
{
  "express": "^4.18.2",
  "@rez/event-bus": "^1.0.0",
  "@rez/decision-engine": "^1.0.0",
  "@rez/commerce-graph": "^1.0.0",
  "@rez/feature-store": "^1.0.0",
  "axios": "^1.6.0"
}
```

---

## Integration Points

| Service | Purpose |
|---------|---------|
| Central Intent | Intent prediction |
| Decision Engine | Cashback/fraud/pricing |
| Feature Store | ML features |
| Commerce Graph | Relationships |

---

## Status

- [x] Intent prediction
- [x] Decision lookup
- [x] Feature fetch
- [x] Graph queries
- [x] Unified profile
