# REZ-inbox - Smart Inbox Features

**Status:** ✅ PRODUCTION READY
**Port:** 3003

---

## FEATURES

### Email Parsing

| Feature | Description | Status |
|---------|-------------|--------|
| **Receipt Extraction** | Parse receipts from emails | ✅ |
| **Confirmation Detection** | Booking confirmations | ✅ |
| **Categorization** | Auto-categorize | ✅ |

### Notifications

| Feature | Description | Status |
|---------|-------------|--------|
| **Push Notifications** | Mobile alerts | ✅ |
| **SMS Notifications** | SMS alerts | ✅ |
| **In-app Notifications** | App notifications | ✅ |

### Subscriptions

| Feature | Description | Status |
|---------|-------------|--------|
| **Manage Alerts** | Filter notifications | ✅ |
| **Categories** | By type | ✅ |
| **Mute Options** | Snooze | ✅ |

---

## API ENDPOINTS

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/inbox` | GET | List messages |
| `/inbox/:id` | GET | Get message |
| `/receipts` | GET | List receipts |

---

## TECHNICAL STACK

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** MongoDB

---

**Last Updated:** June 12, 2026
