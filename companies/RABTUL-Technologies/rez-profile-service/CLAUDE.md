# Claude Code Configuration - rez-profile-service

---

## Service Discovery

This service is registered in REZ-Master/services.json.

To discover related services:
```bash
# From REZ-Master directory
node rez-cli find <service-name>  # Find specific service
node rez-cli list --category <category>  # List by category
node rez-cli stats  # Platform statistics
```

Quick search:
- `node rez-cli list --search payment` - Find payment services
- `node rez-cli list --search auth` - Find auth services
- `node rez-cli list --search kds` - Find KDS services
- `node rez-cli list --search ai` - Find AI services

---



## Behavioral Rules (Always Enforced)

- Do what has been asked; nothing more, nothing less
- NEVER create files unless they're absolutely necessary for achieving your goal
- ALWAYS prefer editing an existing file to creating a new one
- NEVER proactively create documentation files (*.md) or README files unless explicitly requested
- NEVER save working files, text/mds, or tests to the root folder
- Never continuously check status after spawning a swarm — wait for results
- ALWAYS read a file before editing it
- NEVER commit secrets, credentials, or .env files

## Project Overview

**Service Purpose:** User profile management and preferences
**Tech Stack:** Node.js, Express, MongoDB
**Database:** MongoDB collections: profiles, preferences, user_settings

## Key Models

- **Profile**: User profile data
  - Fields: userId, displayName, email, phone, avatar, metadata
- **Preferences**: User preferences and settings
  - Fields: userId, notifications, privacy, language, theme
- **UserSettings**: Application settings
  - Fields: userId, featureFlags, experimentalFeatures

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/profile/:userId | Get user profile |
| PUT | /api/profile/:userId | Update profile |
| GET | /api/profile/:userId/preferences | Get preferences |
| PUT | /api/profile/:userId/preferences | Update preferences |
| GET | /api/profile/:userId/settings | Get settings |
| PUT | /api/profile/:userId/settings | Update settings |

## Build & Test

```bash
# Build
npm run build

# Test
npm test

# Lint
npm run lint
```

## Security Rules

- NEVER hardcode API keys, secrets, or credentials
- NEVER commit .env files
- Validate all user input at system boundaries
- Use `crypto.randomUUID()` for ID generation

## Redis Usage

- Rate limiting via Redis
- Session caching
- Profile data caching with TTL

## Rate Limiting

- Default: 100 requests per minute per IP
- Profile endpoints: 50 requests per minute per user
