# REZ Unified Attribution - SPEC.md

**Version:** 1.0.0
**Port:** 4061
**Company:** RABTUL-Technologies
**Category:** Intelligence

---

## Overview

Unified attribution service consolidating all attribution services. Provides cross-channel attribution tracking and LTV calculation by marketing channel.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 REZ Unified Attribution                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  Components:                                                                │
│  ├── Attribution Tracker → Multi-channel tracking                       │
│  ├── Channel Mixer     → Attribution model calculation                 │
│  ├── LTV Calculator   → Lifetime value by channel                     │
│  └── Report Generator → Attribution reports                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### Attribution
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/track` | Track conversion |
| GET | `/attribution/:userId` | Get user attribution |
| GET | `/attribution/campaign/:id` | Campaign attribution |

### LTV
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/ltv/:userId` | Get user LTV |
| GET | `/ltv/channel/:channel` | LTV by channel |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/reports/summary` | Attribution summary |
| GET | `/reports/channel` | Channel performance |

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

## Attribution Models

| Model | Description |
|-------|-------------|
| last-click | Last channel wins |
| first-click | First channel wins |
| linear | Equal weight |
| time-decay | Recent weighted |
| position-based | First/last weighted |

---

## Status

- [x] Multi-channel tracking
- [x] Attribution models
- [x] LTV calculation
- [x] Report generation
