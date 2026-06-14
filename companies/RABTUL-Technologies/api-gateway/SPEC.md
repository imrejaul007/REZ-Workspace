# REZ API Gateway - SPEC.md

**Version:** 1.0.0
**Port:** 4000
**Company:** RABTUL-Technologies
**Category:** Infrastructure

---

## Overview

Unified API gateway with routing, rate limiting, authentication, and feature flags. Single entry point for all platform services.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      REZ API Gateway                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  Features:                                                                 │
│  ├── Request Routing   → Route to backend services                       │
│  ├── Rate Limiting    → Prevent abuse                                    │
│  ├── Authentication    → JWT/OAuth validation                             │
│  ├── Feature Flags    → Gradual rollouts                                │
│  └── Request/Response → Transformation                                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### Gateway Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/*` | Proxy to backend |
| GET | `/api/*` | Proxy to backend |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/routes` | List routes |
| GET | `/admin/stats` | Gateway statistics |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Gateway health |
| GET | `/health/ready` | Readiness check |

---

## Rate Limits

| Tier | Requests/Minute |
|------|------------------|
| Free | 60 |
| Standard | 300 |
| Premium | 1000 |
| Enterprise | Unlimited |

---

## Dependencies

```json
{
  "express": "^4.18.2",
  "helmet": "^7.1.0",
  "cors": "^2.8.5",
  "compression": "^1.7.4",
  "express-rate-limit": "^7.1.5"
}
```

---

## Status

- [x] Request routing
- [x] Rate limiting
- [x] Authentication
- [x] Feature flags
- [x] Health checks
