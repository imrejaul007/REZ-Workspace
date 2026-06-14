# REZ Merchant Auth Service - SPEC.md

**Version:** 1.0.0
**Port:** (see config)
**Company:** RABTUL-Technologies
**Category:** Security

---

## Overview

Merchant SSO service providing unified authentication for all merchant applications. Handles merchant login, JWT tokens, and session management.

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Merchant login |
| POST | `/auth/register` | Merchant registration |
| POST | `/auth/refresh` | Refresh token |
| POST | `/auth/logout` | Logout |

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
  "bcrypt": "^5.1.1",
  "jsonwebtoken": "^9.0.0",
  "ioredis": "^5.3.0",
  "helmet": "^7.1.0"
}
```

---

## Status

- [x] Merchant login
- [x] JWT tokens
- [x] Session management
- [x] SSO integration
