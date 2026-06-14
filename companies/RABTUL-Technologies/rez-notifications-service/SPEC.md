# REZ Notifications Service - SPEC.md

**Version:** 1.0.0
**Port:** 4011
**Company:** RABTUL-Technologies
**Category:** Core

---

## Overview

Unified notification service supporting push, SMS, email, WhatsApp, and in-app notifications. Provides template management, delivery tracking, and multi-channel orchestration.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                  REZ Notifications Service                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│  Channels:                                                                 │
│  ├── Push     → Firebase Cloud Messaging                                │
│  ├── SMS      → Twilio integration                                     │
│  ├── Email   → SMTP with templates                                     │
│  ├── WhatsApp → WhatsApp Business API                                 │
│  └── In-App  → Real-time socket delivery                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/send` | Send notification |
| POST | `/send/batch` | Send batch |
| GET | `/:id` | Get notification |
| GET | `/user/:userId` | User notifications |

### Templates
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/templates` | List templates |
| POST | `/templates` | Create template |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |

---

## Dependencies

```json
{
  "bullmq": "^5.1.0",
  "twilio": "^4.23.0",
  "nodemailer": "^6.9.8",
  "firebase-admin": "^12.0.0",
  "handlebars": "^4.7.8",
  "ioredis": "^5.3.0",
  "pino": "^8.17.0"
}
```

---

## Status

- [x] Push notifications
- [x] SMS delivery
- [x] Email with templates
- [x] WhatsApp integration
- [x] In-app notifications
- [x] Delivery tracking
