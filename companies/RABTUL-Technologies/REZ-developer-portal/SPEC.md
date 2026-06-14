# REZ Developer Portal - SPEC.md

**Version:** 1.0.0
**Port:** (see config)
**Company:** RABTUL-Technologies
**Category:** Developer Platform

---

## Overview

Developer portal for RABTUL API ecosystem. Provides API documentation via Swagger UI, API key management, rate limit monitoring, and developer onboarding.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     REZ Developer Portal                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  Components:                                                                │
│  ├── API Docs         → Swagger/OpenAPI documentation                     │
│  ├── Key Manager     → API key generation and management                 │
│  ├── Rate Monitor    → Usage tracking and limits                        │
│  └── Developer Hub   → Onboarding and guides                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Models

### APIKey
```typescript
{
  keyId: string
  keyPrefix: string
  developerId: string
  permissions: string[]
  rateLimit: {
    requests: number
    windowMs: number
  }
  usage: {
    requests: number
    errors: number
    lastUsed: Date
  }
  status: 'active' | 'revoked'
  createdAt: Date
}
```

### Developer
```typescript
{
  developerId: string
  email: string
  name: string
  company?: string
  apiKeys: string[]
  createdAt: Date
}
```

---

## API Endpoints

### Documentation
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/docs` | Swagger UI |
| GET | `/api-docs.json` | OpenAPI spec |

### Keys
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/keys` | Create API key |
| GET | `/keys` | List developer keys |
| GET | `/keys/:id` | Key details |
| DELETE | `/keys/:id` | Revoke key |

### Usage
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/usage/:keyId` | Key usage stats |
| GET | `/usage/:keyId/history` | Usage history |

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
  "redis": "^5.3.0",
  "winston": "^3.11.0",
  "swagger-ui-express": "^5.0.0",
  "json-schema-to-typescript": "^13.0.0"
}
```

---

## Status

- [x] API documentation
- [x] Key management
- [x] Rate limit monitoring
- [x] Developer onboarding

