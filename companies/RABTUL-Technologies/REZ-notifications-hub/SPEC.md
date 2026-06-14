# REZ Notifications Hub - SPEC.md

**Version:** 1.0.0
**Port:** (see config)
**Company:** RABTUL-Technologies
**Category:** Integration

---

## Overview

Unified notifications hub providing WhatsApp, SMS, Push, and Email channels. Template management, delivery tracking, and rate limiting across all notification channels.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                   REZ Notifications Hub                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  Channels:                                                                 │
│  ├── WhatsApp    → WhatsApp Business API                               │
│  ├── SMS         → Twilio integration                                  │
│  ├── Push        → Firebase Cloud Messaging                            │
│  └── Email       → SMTP with templates                                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Models

### Notification
```typescript
{
  notificationId: string
  userId: string
  channel: 'whatsapp' | 'sms' | 'push' | 'email'
  templateId: string
  payload: Record<string, any>
  status: 'queued' | 'sent' | 'delivered' | 'failed'
  sentAt?: Date
  deliveredAt?: Date
}
```

### Template
```typescript
{
  templateId: string
  name: string
  channel: string
  content: string
  variables: string[]
  status: 'active' | 'inactive'
}
```

---

## API Endpoints

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/send` | Send notification |
| POST | `/send/batch` | Send batch |
| GET | `/notifications/:id` | Get status |
| GET | `/notifications` | List notifications |

### Templates
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/templates` | List templates |
| POST | `/templates` | Create template |
| PUT | `/templates/:id` | Update template |

### Channels
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/channels` | List channels |
| POST | `/channels/:channel/test` | Test channel |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |

---

## Dependencies

```json
{
  "express": "^4.18.2",
  "firebase-admin": "^12.0.0",
  "twilio": "^4.19.0",
  "nodemailer": "^6.9.7",
  "whatsapp-web.js": "^1.23.0",
  "ioredis": "^5.3.2",
  "pg": "^8.11.3",
  "handlebars": "^4.7.8",
  "winston": "^3.11.0"
}
```

---

## Status

- [x] WhatsApp integration
- [x] SMS integration
- [x] Push notifications
- [x] Email templates
- [x] Delivery tracking
- [x] Rate limiting
