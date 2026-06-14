# REZ Decision Engine - SPEC.md

**Version:** 1.0.0
**Port:** 4128
**Company:** RABTUL-Technologies
**Category:** Intelligence

---

## Overview

Real-time decision making engine for cashback, fraud detection, dynamic pricing, and promotional rules. Combines rule-based logic with ML predictions for instant decisions.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    REZ Decision Engine                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  Components:                                                                │
│  ├── Rule Engine   → Configurable business rules                        │
│  ├── Cashback Decider → Cashback eligibility and amounts                │
│  ├── Fraud Scorer  → Transaction risk scoring                           │
│  └── Pricing Engine → Dynamic pricing decisions                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### Decisions
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/decide/cashback` | Cashback decision |
| POST | `/decide/fraud` | Fraud score |
| POST | `/decide/pricing` | Dynamic price |
| POST | `/decide/promo` | Promo eligibility |

### Rules
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/rules` | List rules |
| POST | `/rules` | Create rule |
| PUT | `/rules/:id` | Update rule |
| DELETE | `/rules/:id` | Delete rule |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |

---

## Dependencies

```json
{
  "express": "^4.18.2",
  "@rez/feature-store": "^1.0.0",
  "axios": "^1.6.0"
}
```

---

## Decision Types

| Type | Description |
|------|-------------|
| cashback | Cashback amount calculation |
| fraud | Transaction risk score |
| pricing | Dynamic price calculation |
| promo | Promotional eligibility |

---

## Status

- [x] Rule engine
- [x] Cashback decisions
- [x] Fraud scoring
- [x] Dynamic pricing
- [x] Feature store integration
