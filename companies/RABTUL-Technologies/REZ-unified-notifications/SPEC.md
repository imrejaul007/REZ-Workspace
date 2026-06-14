# REZ Unified Notifications - SPEC.md

**Version:** 1.0.0
**Port:** 4063
**Company:** RABTUL-Technologies
**Category:** Communication

---

## Overview

Consolidates all notification services in the REZ platform. Provides unified notification dispatch via push, SMS, email, and WhatsApp channels.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                  REZ Unified Notifications                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  Channels:                                                                 │
│  ├── Push Notifications → Mobile app                                      │
│  ├── SMS              → Text messages                                     │
│  ├── Email           → Email delivery                                    │
│  └── WhatsApp        → WhatsApp Business API                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/notifications/send` | Send notification |
| POST | `/api/notifications/batch` | Batch send |
| GET | `/api/notifications/:id` | Get notification status |

### Templates
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/templates` | List templates |
| POST | `/api/templates` | Create template |
| PUT | `/api/templates/:id` | Update template |

### Preferences
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/preferences/:userId` | Get user preferences |
| PUT | `/api/preferences/:userId` | Update preferences |

---

## Dependencies

```json
{
  "express": "^4.18.2",
  "axios": "^1.6.0"
}
```

---

## Integration Points

| Service | Direction | Purpose |
|---------|-----------|---------|
| REZ WhatsApp | Write | WhatsApp messages |
| REZ SMS Bridge | Write | SMS messages |
| REZ Push Service | Write | Push notifications |
| REZ Email Service | Write | Email delivery |

---

## Status

- [x] Unified dispatch
- [x] Multi-channel support
- [x] Template management
- [x] User preferences
- [ ] Analytics dashboard
