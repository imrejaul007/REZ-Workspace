# REZ Prive Service - SPEC.md

**Version:** 1.0.0
**Port:** 4070
**Company:** RABTUL-Technologies
**Category:** Loyalty

---

## Overview

Premium loyalty service with 6-Pillar eligibility scoring. Manages Prive coins, tier progression (Entry → Signature → Elite), and ecosystem integration.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       REZ Prive Service                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  6 Pillars:                                                              │
│  ├── Engagement    → User activity score                                 │
│  ├── Trust        → Account verification score                          │
│  ├── Influence   → Social impact score                               │
│  ├── Economic    → Transaction value score                              │
│  ├── Brand Affinity → Brand preference score                           │
│  └── Network     → Connection quality score                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Models

### PriveAccess
```typescript
{
  userId: string
  tier: 'entry' | 'signature' | 'elite'
  score: number
  pillars: PillarScores
  createdAt: Date
}
```

### PillarScores
```typescript
{
  engagement: number
  trust: number
  influence: number
  economic: number
  brandAffinity: number
  network: number
}
```

---

## API Endpoints

### Eligibility
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/eligibility` | Get user eligibility |
| GET | `/api/eligibility/pillars` | Get pillar breakdown |

### Coins
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/coins/balance` | Get Prive coin balance |
| POST | `/api/coins/credit` | Credit Prive coins |
| POST | `/api/coins/debit` | Debit Prive coins |

### Engagement
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/engagement/signal` | Record engagement signal |

### Ecosystem
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/ecosystem/unified-score` | Get unified ecosystem score |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |

---

## Dependencies

```json
{
  "express": "^4.18.2",
  "mongoose": "^8.2.0",
  "helmet": "^7.1.0",
  "winston": "^3.12.0",
  "zod": "^3.22.4"
}
```

---

## Tier Progression

| Tier | Requirements | Benefits |
|------|--------------|----------|
| Entry | Default | Basic access |
| Signature | Score ≥ 60 | Premium features |
| Elite | Score ≥ 85 | Exclusive rewards |

---

## Status

- [x] 6-Pillar eligibility engine
- [x] Prive coin management
- [x] Tier system
- [x] Ecosystem integration
