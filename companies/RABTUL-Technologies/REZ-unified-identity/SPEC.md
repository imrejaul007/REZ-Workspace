# REZ Unified Identity - SPEC.md

**Version:** 1.0.0
**Port:** 4060
**Company:** RABTUL-Technologies
**Category:** Intelligence

---

## Overview

Unified identity service consolidating all identity services into one. Provides identity resolution across platforms, cross-device tracking, and unified user profiles.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                  REZ Unified Identity                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  Components:                                                                │
│  ├── Identity Resolver → Link identities across platforms               │
│  ├── Cross-Device Tracker → Device graph management                     │
│  └── Unified Profile   → Combined user profiles                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### Identity
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/identity/resolve` | Resolve identity |
| POST | `/identity/link` | Link identities |
| GET | `/identity/:id` | Get unified identity |

### Devices
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/devices` | Add device |
| GET | `/devices/:userId` | Get user devices |
| DELETE | `/devices/:id` | Remove device |

### Profiles
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/profiles/:id` | Get unified profile |
| PUT | `/profiles/:id` | Update profile |

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

## Identity Resolution

- Email linking
- Phone linking
- Device fingerprinting
- Social login linking
- Behavioral similarity

---

## Status

- [x] Identity resolution
- [x] Cross-device tracking
- [x] Unified profiles
- [x] Identity linking
