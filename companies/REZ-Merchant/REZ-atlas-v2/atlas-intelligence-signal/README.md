# Atlas Intelligence Signal

**Port:** 5370 | **Company:** REZ-Merchant | **Version:** 1.0.0

## Overview

Real-time opportunity and risk signal detection. Identify buying intent, competitor moves, and market opportunities.

## Features

- **Opportunity Signals** - Detect buying intent
- **Risk Signals** - Identify churn risk
- **Market Signals** - Track market changes
- **Trend Signals** - Spot emerging trends

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/signals` | Get active signals |
| GET | `/api/signals/:id` | Get signal details |
| POST | `/api/signals/subscribe` | Subscribe to signals |

## Quick Start

```bash
cd atlas-intelligence-signal
npm install
npm run dev
```

## Health Check

```bash
curl http://localhost:5370/health
```

## Response Example

```json
{
  "signals": [
    {"type": "expansion", "merchant": "Restaurant ABC", "score": 92},
    {"type": "churn_risk", "merchant": "Cafe XYZ", "score": 78}
  ]
}
```
