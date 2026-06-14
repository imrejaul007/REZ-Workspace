# REZ Unified Loyalty - SPEC.md

**Version:** 1.0.0
**Port:** (see config)
**Company:** RABTUL-Technologies
**Category:** Core

---

## Overview

Unified loyalty and coin system bridging RABTUL wallet with REZ-Media engagement. Provides tiered loyalty programs, coin rewards, and cross-platform engagement tracking.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                  REZ Unified Loyalty                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  Components:                                                                │
│  ├── Points Engine   → Points accrual and redemption                   │
│  ├── Tier Manager   → Loyalty tier calculation                         │
│  ├── Rewards Catalog → Rewards and redemption options                  │
│  └── Engagement Tracker → Cross-platform activity tracking             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Models

### LoyaltyAccount
```typescript
{
  userId: string
  points: number
  coins: number
  tier: 'bronze' | 'silver' | 'gold' | 'platinum'
  tierProgress: number
  lifetimePoints: number
  updatedAt: Date
}
```

### Reward
```typescript
{
  rewardId: string
  name: string
  description: string
  pointsCost: number
  type: 'discount' | 'cashback' | 'product' | 'voucher'
  status: 'active' | 'inactive'
}
```

---

## API Endpoints

### Loyalty
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/loyalty/:userId` | Get loyalty account |
| POST | `/loyalty/earn` | Earn points |
| POST | `/loyalty/redeem` | Redeem points |
| GET | `/loyalty/tiers` | Get tier info |

### Rewards
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/rewards` | List rewards |
| GET | `/rewards/:id` | Get reward |
| POST | `/rewards/:id/claim` | Claim reward |

### Engagement
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/engagement/track` | Track activity |
| GET | `/engagement/:userId` | Get engagement history |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |

---

## Dependencies

```json
{
  "express": "^4.18.2",
  "mongoose": "^8.1.1",
  "ioredis": "^5.3.2",
  "axios": "^1.6.7",
  "winston": "^3.11.0",
  "zod": "^3.22.4",
  "helmet": "^7.1.0"
}
```

---

## Status

- [x] Points engine
- [x] Tier management
- [x] Rewards catalog
- [x] Engagement tracking
- [x] Cross-platform sync
