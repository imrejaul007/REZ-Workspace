# REZ Privacy Layer - SPEC.md

**Version:** 1.0.0
**Port:** (see config)
**Company:** RABTUL-Technologies
**Category:** Security

---

## Overview

Privacy and compliance service handling GDPR requests, consent management, and data subject rights. Provides consent tracking, data export, and right-to-be-forgotten capabilities.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    REZ Privacy Layer                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│  Components:                                                                │
│  ├── Consent Manager → Consent tracking and management                  │
│  ├── Data Erasure     → Right to be forgotten                          │
│  ├── Data Export     → GDPR data portability                          │
│  └── Audit Logger   → Compliance audit trail                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Models

### Consent
```typescript
{
  consentId: string
  userId: string
  type: 'marketing' | 'analytics' | 'personalization'
  granted: boolean
  timestamp: Date
}
```

### DataRequest
```typescript
{
  requestId: string
  userId: string
  type: 'export' | 'deletion' | 'correction'
  status: 'pending' | 'processing' | 'completed'
  requestedAt: Date
  completedAt?: Date
}
```

---

## API Endpoints

### Consent
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/consent` | Record consent |
| GET | `/consent/:userId` | Get user consents |
| PUT | `/consent/:id` | Update consent |

### Data Requests
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/requests` | Submit data request |
| GET | `/requests/:id` | Get request status |
| POST | `/requests/:id/process` | Process request |

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

- [x] Consent management
- [x] Data export
- [x] Data erasure
- [x] Audit logging
