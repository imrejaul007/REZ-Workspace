# REZ DOOH Attribution - SPEC.md

**Version:** 1.0.0
**Port:** (see config)
**Company:** RABTUL-Technologies
**Category:** Media

---

## Overview

DOOH to offline attribution connector. Tracks digital billboard impressions and attributes offline conversions (store visits, purchases) to DOOH ad exposure.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                   REZ DOOH Attribution                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  Components:                                                                │
│  ├── Impression Tracker → DOOH impression capture                      │
│  ├── Geo Matcher     → Location matching                              │
│  ├── Attribution     → Conversion attribution                         │
│  └── Analytics      → ROI calculations                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### Impressions
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/impressions` | Track impression |
| GET | `/impressions` | Query impressions |

### Attribution
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/attribution` | Attribute conversion |
| GET | `/attribution/:campaignId` | Get attribution |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/analytics/campaign/:id` | Campaign analytics |
| GET | `/analytics/roi/:id` | ROI metrics |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |

---

## Dependencies

```json
{
  "axios": "^1.6.0"
}
```

---

## Attribution Models

| Model | Description |
|-------|-------------|
| last-touch | Last impression wins |
| linear | Equal weight to all impressions |
| time-decay | Recent impressions weighted more |
| position-based | First/last weighted |

---

## Status

- [x] Impression tracking
- [x] Geo matching
- [x] Attribution models
- [x] ROI analytics
