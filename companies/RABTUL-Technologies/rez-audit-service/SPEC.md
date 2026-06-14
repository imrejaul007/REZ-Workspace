# REZ Audit Service - SPEC.md

**Version:** 1.0.0
**Port:** (see config)
**Company:** RABTUL-Technologies
**Category:** Security

---

## Overview

Audit trail service for tracking system events, user actions, and compliance logging. Provides tamper-proof audit logs with cryptographic verification.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      REZ Audit Service                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  Components:                                                                │
│  ├── Audit Logger    → Immutable audit log writing                    │
│  ├── Query Engine   → Audit log search and filtering                   │
│  └── Compliance Reporter → Compliance reports                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Models

### AuditEntry
```typescript
{
  id: string
  timestamp: Date
  actor: string
  action: string
  resource: string
  resourceId: string
  details: Record<string, any>
  ipAddress: string
  userAgent: string
  checksum: string
}
```

---

## API Endpoints

### Audit Logs
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/logs` | Create audit log |
| GET | `/logs` | Query audit logs |
| GET | `/logs/:id` | Get specific log |
| GET | `/logs/verify/:id` | Verify log integrity |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/reports/user/:userId` | User activity report |
| GET | `/reports/resource/:resource` | Resource access report |
| GET | `/reports/compliance` | Compliance report |

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
  "uuid": "^9.0.0",
  "winston": "^3.11.0",
  "crypto-js": "^4.2.0"
}
```

---

## Status

- [x] Immutable audit logging
- [x] Cryptographic verification
- [x] Query and filtering
- [x] Compliance reports
- [x] User activity tracking
