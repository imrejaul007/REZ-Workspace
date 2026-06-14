# REZ Developer Platform - SPEC.md

**Version:** 1.0.0
**Port:** (see config)
**Company:** RABTUL-Technologies
**Category:** Infrastructure

---

## Overview

Developer platform providing partner SDK generation, API documentation, sandbox environment, webhook management, and API key management for external developers.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                  REZ Developer Platform                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  Components:                                                                │
│  ├── SDK Generator   → Multi-language SDK generation                    │
│  ├── API Docs       → Interactive API documentation                    │
│  ├── Sandbox        → Isolated test environment                       │
│  ├── Webhook Manager → Webhook configuration                           │
│  └── API Key Manager → Partner API key management                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### Partners
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/partners` | Register partner |
| GET | `/partners/:id` | Get partner |
| PUT | `/partners/:id` | Update partner |

### API Keys
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/partners/:id/keys` | Create API key |
| GET | `/partners/:id/keys` | List keys |
| DELETE | `/keys/:id` | Revoke key |

### Webhooks
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/partners/:id/webhooks` | Configure webhook |
| GET | `/webhooks/:id/events` | Webhook events |

### Sandbox
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/sandbox/test` | Run sandbox test |
| GET | `/sandbox/:id/results` | Get test results |

### SDK
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/sdks/:language` | Download SDK |
| POST | `/sdks/generate` | Generate custom SDK |

### Documentation
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/docs` | API documentation |
| GET | `/docs/openapi.json` | OpenAPI spec |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |

---

## Dependencies

```json
{
  "express": "^4.18.2",
  "cors": "^2.8.5",
  "helmet": "^7.1.0",
  "swagger-ui-express": "^5.0.0",
  "yaml": "^2.3.4",
  "zod": "^3.22.4",
  "winston": "^3.11.0",
  "ioredis": "^5.3.2"
}
```

---

## Status

- [x] Partner management
- [x] API key management
- [x] Webhook management
- [x] Sandbox environment
- [x] SDK generation
- [x] API documentation
