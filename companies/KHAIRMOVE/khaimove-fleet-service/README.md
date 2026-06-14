# KHAIRMOVE Fleet Service

Fleet management and driver dispatch with ML-powered optimization.

## Quick Start

```bash
npm install
cp .env.example .env
npm run dev
```

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/drivers` | List all drivers |
| POST | `/api/drivers` | Register new driver |
| GET | `/api/drivers/:id` | Get driver details |
| PUT | `/api/drivers/:id/location` | Update location |
| GET | `/api/vehicles` | List all vehicles |
| POST | `/api/vehicles` | Register vehicle |
| POST | `/api/dispatch` | Dispatch driver |

## Driver Tiers

| Tier | Rating | Color |
|------|--------|-------|
| Platinum | 4.8+ | 🏆 |
| Gold | 4.5-4.7 | 🥇 |
| Silver | 4.0-4.4 | 🥈 |
| Bronze | <4.0 | 🥉 |

## Integrations

- REZ Intelligence (Location Intel, Predictive Engine)
