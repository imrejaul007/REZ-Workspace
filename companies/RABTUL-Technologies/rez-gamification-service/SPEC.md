# REZ Gamification Service - SPEC.md

**Version:** 1.0.0
**Port:** 4041
**Company:** RABTUL-Technologies
**Category:** Engagement

---

## Overview

Gamification service for the REZ platform. Manages points, badges, achievements, leaderboards, and challenges to drive user engagement.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    REZ Gamification Service                                │
├─────────────────────────────────────────────────────────────────────────────┤
│  Components:                                                                │
│  ├── Points Engine      → Award and track points                         │
│  ├── Badge System      → Achievement badges                             │
│  ├── Achievement Tracker → Milestone tracking                             │
│  ├── Leaderboard Engine → Rankings and competition                        │
│  └── Challenge Manager  → Time-bound challenges                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Gamification Elements

| Element | Description |
|---------|-------------|
| Points | Virtual currency for actions |
| Badges | Achievement markers |
| Levels | Progression tiers |
| Leaderboards | Competitive rankings |
| Challenges | Time-bound goals |

---

## API Endpoints

### Points
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/points/award` | Award points |
| GET | `/api/points/:userId` | Get user points |
| GET | `/api/points/history/:userId` | Point history |

### Badges
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/badges` | List all badges |
| GET | `/api/badges/:userId` | User badges |
| POST | `/api/badges/award` | Award badge |

### Leaderboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/leaderboard/:type` | Get leaderboard |
| GET | `/api/leaderboard/:type/rank/:userId` | User rank |

### Challenges
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/challenges` | List challenges |
| POST | `/api/challenges/:id/join` | Join challenge |
| GET | `/api/challenges/:id/progress/:userId` | Progress |

---

## Dependencies

```json
{
  "express": "^4.18.2",
  "mongoose": "^8.0.0",
  "helmet": "^7.1.0",
  "winston": "^3.11.0",
  "express-rate-limit": "^7.1.5"
}
```

---

## Status

- [x] Points system
- [x] Badge awards
- [x] Leaderboards
- [x] Challenges
- [x] Progress tracking
