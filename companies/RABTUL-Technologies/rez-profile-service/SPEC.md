# REZ Profile Service - SPEC.md

**Version:** 1.0.0
**Port:** 4013
**Company:** RABTUL-Technologies
**Category:** Core

---

## Overview

User profile management service handling preferences, addresses, and static profile data. Provides centralized user profile storage with caching and rate limiting.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      REZ Profile Service                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  Components:                                                                │
│  ├── Profile Manager   → User profile CRUD                             │
│  ├── Preferences Store → User settings & preferences                    │
│  ├── Address Manager   → Delivery addresses                             │
│  └── Settings Manager → App settings & feature flags                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Models

### Profile
```typescript
{
  userId: string
  displayName: string
  email: string
  phone: string
  avatar?: string
  metadata: Record<string, any>
  createdAt: Date
  updatedAt: Date
}
```

### Preferences
```typescript
{
  userId: string
  notifications: { email, push, sms }
  privacy: { profileVisibility, dataSharing }
  language: string
  theme: 'light' | 'dark'
}
```

### Address
```typescript
{
  addressId: string
  userId: string
  label: string
  type: 'home' | 'work' | 'other'
  street: string
  city: string
  state: string
  pincode: string
  coordinates?: { lat, lng }
  isDefault: boolean
}
```

---

## API Endpoints

### Profile
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/profile/:userId` | Get user profile |
| PUT | `/api/profile/:userId` | Update profile |
| DELETE | `/api/profile/:userId` | Delete profile |

### Preferences
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/profile/:userId/preferences` | Get preferences |
| PUT | `/api/profile/:userId/preferences` | Update preferences |

### Addresses
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/profile/:userId/addresses` | List addresses |
| POST | `/api/profile/:userId/addresses` | Add address |
| PUT | `/api/profile/:userId/addresses/:id` | Update address |
| DELETE | `/api/profile/:userId/addresses/:id` | Delete address |

### Settings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/profile/:userId/settings` | Get settings |
| PUT | `/api/profile/:userId/settings` | Update settings |

---

## Dependencies

```json
{
  "express": "^4.21.0",
  "mongoose": "^8.23.1",
  "redis": "^5.12.1",
  "axios": "^1.7.7",
  "helmet": "^7.1.0",
  "cors": "^2.8.5",
  "winston": "^3.19.0",
  "express-rate-limit": "^8.4.1"
}
```

---

## Integration Points

| Service | Direction | Purpose |
|---------|-----------|---------|
| REZ Intelligence | Read | Profile enrichment |
| REZ Auth | Read | User verification |
| REZ Delivery | Read | Address lookup |

---

## Status

- [x] Profile CRUD
- [x] Preferences management
- [x] Address management
- [x] Settings management
- [x] Redis caching
- [x] Rate limiting
