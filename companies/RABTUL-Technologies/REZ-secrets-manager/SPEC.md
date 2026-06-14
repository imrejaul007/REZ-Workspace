# REZ Secrets Manager - SPEC.md

**Version:** 1.0.0
**Port:** 4035
**Company:** RABTUL-Technologies
**Category:** Infrastructure

---

## Overview

Enterprise-grade secrets management service. Provides secure storage, retrieval, and rotation of API keys, database credentials, and service tokens using AWS KMS and Google Cloud KMS encryption.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    REZ Secrets Manager                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│  Components:                                                                │
│  ├── Secret Storage  → Encrypted secret storage                           │
│  ├── Key Rotation   → Automatic secret rotation                           │
│  ├── Access Control → IAM-based permissions                               │
│  └── Audit Logger  → Secret access logging                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Models

### Secret
```typescript
{
  id: string
  name: string
  value: string
  encrypted: boolean
  provider: 'local' | 'aws-kms' | 'gcp-kms'
  version: number
  expiresAt?: Date
  createdAt: Date
  updatedAt: Date
}
```

### SecretAccess
```typescript
{
  id: string
  secretId: string
  serviceId: string
  accessedAt: Date
  action: 'read' | 'create' | 'update' | 'delete'
}
```

---

## API Endpoints

### Secrets
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/secrets` | Create secret |
| GET | `/secrets/:id` | Get secret |
| PUT | `/secrets/:id` | Update secret |
| DELETE | `/secrets/:id` | Delete secret |
| GET | `/secrets` | List secrets |

### Access
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/secrets/:id/grant` | Grant access |
| DELETE | `/secrets/:id/revoke` | Revoke access |

### Rotation
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/secrets/:id/rotate` | Rotate secret |
| GET | `/secrets/:id/versions` | List versions |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |

---

## Dependencies

```json
{
  "express": "^4.18.2",
  "ioredis": "^5.3.2",
  "jsonwebtoken": "^9.0.2",
  "helmet": "^7.1.0",
  "winston": "^3.11.0",
  "zod": "^3.22.4",
  "uuid": "^9.0.1",
  "@aws-sdk/client-kms": "^3.525.0",
  "@google-cloud/kms": "^4.5.0"
}
```

---

## Security

- KMS encryption (AWS/GCP)
- Access logging
- Version control
- Expiration management
- Service-scoped access

---

## Status

- [x] Secret CRUD
- [x] KMS encryption
- [x] Access control
- [x] Secret rotation
- [x] Version history
- [x] Audit logging
