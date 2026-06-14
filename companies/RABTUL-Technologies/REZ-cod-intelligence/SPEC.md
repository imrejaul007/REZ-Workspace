# REZ COD Intelligence - SPEC.md

**Version:** 1.0.0
**Port:** (see config)
**Company:** RABTUL-Technologies
**Category:** Intelligence

---

## Overview

Cash on Delivery intelligence service. Provides RTO prediction, fraud detection, and risk scoring for COD orders.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    REZ COD Intelligence                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  Components:                                                                │
│  ├── RTO Predictor   → Return-to-Origin prediction                    │
│  ├── Fraud Detector  → Fraud risk scoring                              │
│  └── Risk Engine    → Combined risk assessment                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### Predictions
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/predict/rto` | RTO prediction |
| POST | `/predict/fraud` | Fraud risk score |
| POST | `/assess/risk` | Combined risk assessment |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |

---

## Dependencies

```json
{
  "express": "^4.18.2",
  "mongoose": "^8.0.0"
}
```

---

## Risk Factors

| Factor | Description |
|--------|-------------|
| order_value | Order amount |
| pincode | Delivery location |
| user_history | Previous RTO/fraud |
| device_fingerprint | Device trust score |

---

## Status

- [x] RTO prediction
- [x] Fraud detection
- [x] Risk scoring
