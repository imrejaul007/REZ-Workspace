# REZ DOOH Targeting Feed - SPEC.md

**Version:** 1.0.0
**Port:** 4064
**Company:** RABTUL-Technologies
**Category:** Media

---

## Overview

Real-time targeting feed connecting intelligence services to DOOH (Digital Out-of-Home) screens. Provides audience targeting, content recommendations, and real-time ad decisioning.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                REZ DOOH Targeting Feed                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  Components:                                                                │
│  ├── Audience Selector → Real-time audience matching                     │
│  ├── Content Matcher  → Ad-content matching                              │
│  ├── Feed Publisher  → Real-time feed to screens                        │
│  └── Analytics      → Impression and engagement tracking                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### Targeting
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/target` | Get targeting data |
| POST | `/target/evaluate` | Evaluate audience |
| GET | `/screens/:screenId/targets` | Get screen targets |

### Content
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/content/match` | Match content to audience |
| POST | `/content/rank` | Rank content options |

### Feeds
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/feeds/:screenId` | Get screen feed |
| GET | `/feeds/location/:lat/:lng` | Location-based feeds |

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

## Status

- [x] Real-time targeting
- [x] Audience matching
- [x] Content ranking
- [x] Feed publishing
- [x] Location-based targeting
