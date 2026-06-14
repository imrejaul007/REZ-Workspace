# REZ Graph Service - SPEC.md

**Version:** 1.0.0
**Port:** 4129
**Company:** RABTUL-Technologies
**Category:** Intelligence

---

## Overview

Commerce graph service managing relationship data between users, products, stores, and entities. Provides graph traversal, community detection, and influence scoring.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      REZ Graph Service                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  Components:                                                                │
│  ├── Node Manager   → Entities (users, products, stores)                 │
│  ├── Edge Manager  → Relationships between entities                     │
│  ├── Graph Engine  → Traversal and path finding                        │
│  └── Community Detection → Graph clustering                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Models

### Node
```typescript
{
  id: string
  type: 'user' | 'product' | 'store' | 'category'
  properties: Record<string, any>
  createdAt: Date
}
```

### Edge
```typescript
{
  id: string
  source: string
  target: string
  type: string
  weight: number
  properties: Record<string, any>
  createdAt: Date
}
```

---

## API Endpoints

### Nodes
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/nodes` | Create node |
| GET | `/nodes/:id` | Get node |
| DELETE | `/nodes/:id` | Delete node |

### Edges
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/edges` | Create edge |
| GET | `/edges` | Query edges |
| DELETE | `/edges/:id` | Delete edge |

### Graph Operations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/graph/path/:source/:target` | Find path |
| POST | `/graph/traverse` | Traverse graph |
| GET | `/graph/communities` | Detect communities |
| GET | `/graph/influence/:id` | Calculate influence |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |

---

## Dependencies

```json
{
  "express": "^4.18.2",
  "axios": "^1.6.0"
}
```

---

## Relationship Types

| Type | Description |
|------|-------------|
| purchased | User bought product |
| viewed | User viewed product |
| searched | User searched term |
| similar | Products are similar |
| related | Products related |
| follows | User follows store |

---

## Status

- [x] Node CRUD
- [x] Edge CRUD
- [x] Path finding
- [x] Graph traversal
- [x] Community detection
- [x] Influence scoring
