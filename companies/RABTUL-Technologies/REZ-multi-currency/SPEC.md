# REZ Multi-Currency - SPEC.md

**Version:** 1.0.0
**Port:** (see config)
**Company:** RABTUL-Technologies
**Category:** Finance

---

## Overview

Multi-currency support service handling exchange rates, currency conversion, and multi-currency transactions. Provides real-time exchange rates and precise decimal calculations.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    REZ Multi-Currency Service                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  Components:                                                                │
│  ├── Rate Fetcher   → External exchange rate API                         │
│  ├── Rate Cache    → Redis-backed rate caching                           │
│  ├── Converter     → Precise currency conversion                        │
│  └── Scheduler     → Scheduled rate updates                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Models

### ExchangeRate
```typescript
{
  baseCurrency: string
  targetCurrency: string
  rate: number
  timestamp: Date
  source: string
}
```

### Transaction
```typescript
{
  id: string
  amount: number
  currency: string
  convertedAmount?: number
  targetCurrency?: string
  rate: number
  createdAt: Date
}
```

---

## API Endpoints

### Rates
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/rates` | Get current rates |
| GET | `/api/rates/:pair` | Get specific pair rate |
| POST | `/api/rates/refresh` | Force refresh rates |

### Conversion
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/convert` | Convert amount |
| GET | `/api/convert/:from/:to` | Quick conversion |

### Supported Currencies
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/currencies` | List supported currencies |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |

---

## Dependencies

```json
{
  "express": "^4.18.2",
  "mongoose": "^8.0.3",
  "ioredis": "^5.3.2",
  "axios": "^1.6.2",
  "winston": "^3.11.0",
  "zod": "^3.22.4",
  "decimal.js": "^10.4.3",
  "node-cron": "^3.0.3"
}
```

---

## Supported Currencies

- INR (Indian Rupee) - Base
- USD (US Dollar)
- EUR (Euro)
- GBP (British Pound)
- SGD (Singapore Dollar)

---

## Status

- [x] Exchange rate fetching
- [x] Rate caching
- [x] Currency conversion
- [x] Scheduled updates
- [x] Decimal precision
